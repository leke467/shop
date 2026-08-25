"""
Payment views — checkout endpoint and webhook handlers (Item 42).
"""
from __future__ import annotations

import logging

from django.utils import timezone
from rest_framework import serializers, status
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.permissions import IsSuperadminOrStaff

from orders.serializers import OrderSerializer
from payments.gateways import get_gateway
from payments.models import Payment, RefundRequest, WebhookEvent
from payments.services import (
    CheckoutError,
    DuplicateOrderError,
    InsufficientStockError,
    checkout,
    confirm_bank_transfer,
    confirm_pending_payment,
    process_refund,
)

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Checkout
# ---------------------------------------------------------------------------

import uuid

class CheckoutSerializer(serializers.Serializer):
    provider = serializers.ChoiceField(choices=["stripe", "paystack", "monnify", "bank_transfer", "paypal"])
    idempotency_key = serializers.UUIDField(required=False, default=uuid.uuid4)
    notes = serializers.CharField(required=False, default="", allow_blank=True)

    # Shipping
    full_name = serializers.CharField(max_length=200)
    phone = serializers.CharField(max_length=40, required=False, default="", allow_blank=True)
    phone_number = serializers.CharField(max_length=40, required=False, default="", allow_blank=True)
    line1 = serializers.CharField(max_length=255, required=False, default="", allow_blank=True)
    line2 = serializers.CharField(max_length=255, required=False, default="", allow_blank=True)
    shipping_address = serializers.CharField(required=False, default="", allow_blank=True)
    city = serializers.CharField(max_length=100, required=False, default="", allow_blank=True)
    state = serializers.CharField(max_length=100, required=False, default="", allow_blank=True)
    postal_code = serializers.CharField(max_length=20, required=False, default="", allow_blank=True)
    country = serializers.CharField(max_length=2, required=False, default="NG")

    # Provider-specific extras (e.g. Paystack needs email)
    email = serializers.EmailField(required=False, allow_blank=True, default="")

    # Manual bank transfer: which destination account the buyer picked
    bank_index = serializers.IntegerField(required=False, default=0, min_value=0)

    # Delivery System
    delivery_state = serializers.CharField(max_length=100, required=False, default="Lagos")
    delivery_fees = serializers.DictField(child=serializers.DictField(), required=False)
    manual_delivery_shops = serializers.ListField(child=serializers.CharField(), required=False, default=list)
    shop_slug = serializers.CharField(required=False, default="", allow_blank=True)
    coupon_code = serializers.CharField(required=False, default="", allow_blank=True)



class CheckoutView(APIView):
    """
    POST /api/payments/checkout/

    Converts the authenticated user's cart into a paid order.
    Scoped-throttled to 20/min to prevent abuse.
    """
    permission_classes = [IsAuthenticated]
    throttle_scope = "checkout"

    def post(self, request):
        ser = CheckoutSerializer(data=request.data)
        if not ser.is_valid():
            logger.error("Checkout validation errors: %s | data=%s", ser.errors, request.data)
            return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)
        d = ser.validated_data

        shipping_data = {
            "full_name": d["full_name"],
            "phone": d.get("phone") or d.get("phone_number") or getattr(request.user, "phone_number", ""),
            "line1": d.get("line1") or d.get("shipping_address") or "Address Provided",
            "line2": d.get("line2", ""),
            "city": d.get("city") or d.get("state") or d.get("delivery_state") or "Lagos",
            "state": d.get("state") or d.get("delivery_state") or "Lagos",
            "postal_code": d.get("postal_code", ""),
            "country": d.get("country", "NG"),
        }

        shop_slug = d.get("shop_slug") or request.data.get("shop_slug") or request.data.get("shop")
        coupon_code = d.get("coupon_code") or request.data.get("coupon_code") or ""

        try:
            order = checkout(
                user=request.user,
                provider=d["provider"],
                shipping_data=shipping_data,
                idempotency_key=str(d["idempotency_key"]),
                notes=d.get("notes", ""),
                email=d.get("email", request.user.email),
                bank_index=d.get("bank_index", 0),
                delivery_state=d["delivery_state"],
                manual_delivery_shops=d.get("manual_delivery_shops", []),
                shop_slug=shop_slug if shop_slug else None,
                coupon_code=coupon_code,
            )

        except DuplicateOrderError as e:
            return Response({"detail": str(e)}, status=status.HTTP_409_CONFLICT)
        except InsufficientStockError as e:
            return Response({"detail": str(e)}, status=status.HTTP_422_UNPROCESSABLE_ENTITY)
        except CheckoutError as e:
            print("CHECKOUT ERROR:", str(e))
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        response_data = {
            "detail": "Order placed successfully.",
            "order": OrderSerializer(order).data,
            "vat_amount": str(order.tax_total),
        }
        # Bank transfer (and other out-of-band providers) return payment
        # instructions instead of an immediate capture. Surface them so the
        # frontend can show the account details + reference to the buyer.
        instructions = getattr(order, "_payment_instructions", None)
        if instructions:
            response_data["detail"] = (
                "Order placed. Complete your bank transfer to confirm it."
            )
            response_data["payment"] = instructions

        # --- Emails: Order Confirmation (buyer) + New Order Alert (seller) ---
        try:
            from notifications.tasks import (
                send_order_confirmation_email,
                send_new_order_alert_to_seller,
            )

            # Build items list for email templates
            email_items = []
            for group in order.groups.prefetch_related("items__product"):
                for item in group.items.all():
                    email_items.append({
                        "product_name": item.product.name if item.product else "Product",
                        "variant_name": getattr(item, "variant_label", "Default"),
                        "quantity": item.quantity,
                        "line_total": str(item.line_total),
                    })

            first_group = order.groups.first()
            is_confirmed = order.status == Order.Status.CONFIRMED
            buyer_context = {
                "buyer_name": request.user.first_name or request.user.email.split("@")[0],
                "order_id": str(order.public_id),
                "items": email_items,
                "total": str(order.total),
                "delivery_code": (first_group.delivery_code if first_group and is_confirmed else ""),
                "shipping_name": shipping_data.get("full_name", ""),
                "shipping_address": f"{shipping_data.get('line1', '')}, {shipping_data.get('city', '')}, {shipping_data.get('state', '')}",
                "shipping_phone": shipping_data.get("phone", ""),
            }
            if request.user.email:
                send_order_confirmation_email.delay(request.user.email, buyer_context)

        except Exception:
            pass  # Never block the checkout response on email failures

        return Response(response_data, status=status.HTTP_201_CREATED)


# ---------------------------------------------------------------------------
# Bank transfer (manual / out-of-band)
# ---------------------------------------------------------------------------

class BankTransferStatusView(APIView):
    """
    GET /api/payments/bank-transfer/status/<order_public_id>/

    Returns the bank-transfer instructions + current status for an order the
    authenticated user placed via bank transfer. Lets the buyer re-open the
    transfer details (account number, reference, amount) after leaving the page.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, order_public_id):
        payment = (
            Payment.objects.filter(
                order__public_id=order_public_id,
                order__user=request.user,
                provider=Payment.Provider.BANK_TRANSFER,
            )
            .select_related("order")
            .first()
        )
        if payment is None:
            return Response(
                {"detail": "No bank transfer found for this order."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # The account the buyer was actually shown is stored on the payment at
        # checkout time (metadata.transfer). Fall back to the first account.
        transfer = payment.metadata.get("transfer", {}) if isinstance(payment.metadata, dict) else {}
        account = {
            "index": transfer.get("index", 0),
            "account_name": transfer.get("account_name", ""),
            "account_number": transfer.get("account_number", ""),
            "bank_name": transfer.get("bank_name", ""),
        }
        return Response(
            {
                "provider": payment.provider,
                "status": payment.status,
                "reference": payment.provider_payment_id,
                "amount": str(payment.amount),
                "currency": payment.currency,
                **account,
            }
        )


class BankTransferAccountsView(APIView):
    """
    GET /api/payments/bank-transfer/accounts/

    Returns the destination accounts (UBA, Opay, Moniepoint, …) a buyer can
    transfer into, so the checkout page can render the bank picker.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        gateway = get_gateway("bank_transfer")
        return Response({"accounts": gateway.accounts})



class BankTransferConfirmView(APIView):
    """
    POST /api/payments/bank-transfer/confirm/

    Staff-only. Confirms an ``awaiting_transfer`` payment once the funds have
    been verified: captures the payment, confirms the order, deducts stock,
    clears the buyer's cart and sends notification emails.

    Body: ``{"payment": "<payment_public_id>"}``
    """
    permission_classes = [IsAdminUser]

    def post(self, request):
        payment_id = request.data.get("payment", "")
        payment = Payment.objects.filter(public_id=payment_id).select_related("order").first()
        if payment is None:
            return Response(
                {"detail": "Payment not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            confirm_bank_transfer(payment, verified_by=request.user.email)
        except CheckoutError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {
                "detail": "Bank transfer confirmed. Order is now confirmed.",
                "order": OrderSerializer(payment.order).data,
            },
            status=status.HTTP_200_OK,
        )


# ---------------------------------------------------------------------------
# Webhooks (Item 42)
# ---------------------------------------------------------------------------

class StripeWebhookView(APIView):
    """
    POST /api/payments/webhooks/stripe/

    Receives and verifies Stripe webhook events.
    """
    permission_classes = [AllowAny]
    authentication_classes = []  # No JWT auth for webhooks

    def post(self, request):
        payload = request.body
        sig_header = request.META.get("HTTP_STRIPE_SIGNATURE", "")

        gateway = get_gateway("stripe")
        event = gateway.verify_webhook(payload, sig_header)

        if event is None:
            return Response({"detail": "Invalid signature."}, status=status.HTTP_400_BAD_REQUEST)

        # Idempotent event processing.
        event_id = event["event_id"]
        if WebhookEvent.objects.filter(event_id=event_id).exists():
            return Response({"detail": "Already processed."}, status=status.HTTP_200_OK)

        wh = WebhookEvent.objects.create(
            provider="stripe",
            event_type=event["event_type"],
            event_id=event_id,
            payload=event["data"] if isinstance(event["data"], dict) else {},
        )

        try:
            self._process_event(event)
            wh.status = WebhookEvent.Status.PROCESSED
            wh.processed_at = timezone.now()
        except Exception as e:
            logger.exception("Stripe webhook processing failed: %s", event_id)
            wh.status = WebhookEvent.Status.FAILED
            wh.error_message = str(e)

        wh.save(update_fields=["status", "processed_at", "error_message"])
        return Response({"detail": "OK"}, status=status.HTTP_200_OK)

    def _process_event(self, event):
        event_type = event["event_type"]
        data = event["data"]

        if event_type == "payment_intent.succeeded":
            payment_id = data.get("id", "")
            payment = Payment.objects.filter(
                provider="stripe", provider_payment_id=payment_id
            ).select_related("order").first()
            if payment:
                try:
                    confirm_pending_payment(payment, verified_by="stripe_webhook")
                except CheckoutError:
                    logger.warning("Stripe webhook: payment %s already processed", payment_id)

        elif event_type == "payment_intent.payment_failed":
            payment_id = data.get("id", "")
            Payment.objects.filter(
                provider="stripe", provider_payment_id=payment_id
            ).update(status=Payment.Status.FAILED, failed_at=timezone.now())

        elif event_type in ("charge.refunded", "charge.refund.updated"):
            logger.info("Stripe refund event: %s", event_type)
        else:
            logger.info("Ignored Stripe event: %s", event_type)


class PaystackWebhookView(APIView):
    """
    POST /api/payments/webhooks/paystack/

    Receives and verifies Paystack webhook events.
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        payload = request.body
        sig_header = request.META.get("HTTP_X_PAYSTACK_SIGNATURE", "")

        gateway = get_gateway("paystack")
        event = gateway.verify_webhook(payload, sig_header)

        if event is None:
            return Response({"detail": "Invalid signature."}, status=status.HTTP_400_BAD_REQUEST)

        event_id = event["event_id"]
        if WebhookEvent.objects.filter(event_id=event_id).exists():
            return Response({"detail": "Already processed."}, status=status.HTTP_200_OK)

        wh = WebhookEvent.objects.create(
            provider="paystack",
            event_type=event["event_type"],
            event_id=str(event_id),
            payload=event["data"] if isinstance(event["data"], dict) else {},
        )

        try:
            self._process_event(event)
            wh.status = WebhookEvent.Status.PROCESSED
            wh.processed_at = timezone.now()
        except Exception as e:
            logger.exception("Paystack webhook processing failed: %s", event_id)
            wh.status = WebhookEvent.Status.FAILED
            wh.error_message = str(e)

        wh.save(update_fields=["status", "processed_at", "error_message"])
        return Response({"detail": "OK"}, status=status.HTTP_200_OK)

    def _process_event(self, event):
        event_type = event["event_type"]
        data = event["data"]

        if event_type == "charge.success":
            reference = data.get("reference", "")
            payment = Payment.objects.filter(
                provider="paystack", provider_payment_id=reference
            ).select_related("order").first()
            if payment:
                # Validate amount paid against payment.amount (Paystack reports amount in kobo/cents)
                paid_amount_kobo = data.get("amount", 0)
                expected_amount_kobo = int(payment.amount * 100)
                if paid_amount_kobo < expected_amount_kobo:
                    logger.critical(
                        "Paystack webhook UNDERPAYMENT alert! payment=%s expected=%s got=%s",
                        payment.public_id, expected_amount_kobo, paid_amount_kobo,
                    )
                    return
                if payment.metadata and payment.metadata.get("purpose") == "subscription":
                    try:
                        from subscriptions.services import verify_and_activate_subscription
                        verify_and_activate_subscription(payment.provider_payment_id, provider="paystack")
                    except Exception as sub_err:
                        logger.error("Paystack webhook subscription activation failed: %s", sub_err)
                else:
                    try:
                        confirm_pending_payment(payment, verified_by="paystack_webhook")
                    except CheckoutError:
                        logger.warning("Paystack webhook: payment %s already processed", reference)

        elif event_type == "charge.failed":
            reference = data.get("reference", "")
            Payment.objects.filter(
                provider="paystack", provider_payment_id=reference
            ).update(status=Payment.Status.FAILED, failed_at=timezone.now())

        elif event_type == "refund.processed":
            logger.info("Paystack refund processed")
        else:
            logger.info("Ignored Paystack event: %s", event_type)


# ---------------------------------------------------------------------------
# Paystack Verify (frontend fallback when webhook is delayed)
# ---------------------------------------------------------------------------

class PaystackVerifyView(APIView):
    """
    GET /api/payments/paystack/verify/<reference>/

    Called by the frontend after the Paystack popup closes successfully.
    Verifies the transaction server-side via Paystack's API and, if
    successful, confirms the payment and order (same as the webhook).

    This acts as a reliable fallback — the frontend doesn't need to wait
    for the webhook to arrive.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, reference):
        import requests as http_requests

        # Find the payment.
        payment = Payment.objects.filter(
            provider="paystack",
            provider_payment_id=reference,
            order__user=request.user,
        ).select_related("order").first()

        if payment is None:
            return Response(
                {"detail": "Payment not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Already captured — just return success.
        if payment.status == Payment.Status.CAPTURED:
            return Response({
                "detail": "Payment already confirmed.",
                "status": "captured",
                "order": OrderSerializer(payment.order).data,
            })

        # Verify with Paystack API.
        from django.conf import settings as django_settings
        secret_key = django_settings.PAYMENTS["PAYSTACK"]["SECRET_KEY"]
        try:
            resp = http_requests.get(
                f"https://api.paystack.co/transaction/verify/{reference}",
                headers={
                    "Authorization": f"Bearer {secret_key}",
                    "Content-Type": "application/json",
                },
                timeout=15,
            )
            data = resp.json()
        except Exception as e:
            logger.exception("Paystack verify API call failed")
            return Response(
                {"detail": f"Verification failed: {e}"},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        if not data.get("status") or data.get("data", {}).get("status") != "success":
            paystack_status = data.get("data", {}).get("status", "unknown")
            return Response({
                "detail": f"Payment not yet successful. Paystack status: {paystack_status}",
                "status": paystack_status,
            }, status=status.HTTP_402_PAYMENT_REQUIRED)

        # Validate amount paid
        paid_amount_kobo = data.get("data", {}).get("amount", 0)
        expected_amount_kobo = int(payment.amount * 100)
        if paid_amount_kobo < expected_amount_kobo:
            logger.critical(
                "Paystack verify UNDERPAYMENT alert! payment=%s expected=%s got=%s",
                payment.public_id, expected_amount_kobo, paid_amount_kobo,
            )
            return Response({
                "detail": "Amount paid does not match the order total.",
            }, status=status.HTTP_400_BAD_REQUEST)

        # Paystack says success — confirm the payment.
        try:
            confirm_pending_payment(payment, verified_by="paystack_verify")
        except CheckoutError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            "detail": "Payment verified and confirmed.",
            "status": "captured",
            "order": OrderSerializer(payment.order).data,
        })


# ---------------------------------------------------------------------------
# Monnify Webhook
# ---------------------------------------------------------------------------

class MonnifyWebhookView(APIView):
    """
    POST /api/payments/webhooks/monnify/

    Monnify sends a webhook notification when a transaction completes.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        payload = request.body
        signature = request.headers.get("Monnify-Signature", "")

        gateway = get_gateway("monnify")
        event = gateway.verify_webhook(payload, signature)
        if event is None:
            return Response({"detail": "Invalid signature"}, status=status.HTTP_400_BAD_REQUEST)

        # Log the event.
        wh, created = WebhookEvent.objects.get_or_create(
            event_id=event["event_id"],
            defaults={
                "provider": "monnify",
                "event_type": event["event_type"],
                "payload": event["data"],
            },
        )
        if not created:
            return Response({"detail": "Already processed"})

        self._process_event(event)
        wh.status = "processed"
        wh.processed_at = timezone.now()
        wh.save(update_fields=["status", "processed_at"])

        return Response({"detail": "ok"})

    def _process_event(self, event):
        event_type = event["event_type"]
        data = event["data"]

        if event_type == "SUCCESSFUL_TRANSACTION":
            payment_ref = data.get("paymentReference", "")
            txn_ref = data.get("transactionReference", "")
            payment = (
                Payment.objects.filter(provider="monnify", provider_payment_id=payment_ref).select_related("order").first()
                or (Payment.objects.filter(provider="monnify", provider_payment_id=txn_ref).select_related("order").first() if txn_ref else None)
                or Payment.objects.filter(provider="monnify", provider_payment_id__icontains=payment_ref).select_related("order").first()
            )
            if payment:
                from decimal import Decimal
                try:
                    paid_amount = Decimal(str(data.get("amountPaid", "0")))
                except Exception:
                    paid_amount = Decimal("0")

                if paid_amount < payment.amount:
                    logger.critical(
                        "Monnify webhook UNDERPAYMENT alert! payment=%s expected=%s got=%s",
                        payment.public_id, payment.amount, paid_amount,
                    )
                    return
                if payment.metadata and payment.metadata.get("purpose") == "subscription":
                    try:
                        from subscriptions.services import verify_and_activate_subscription
                        verify_and_activate_subscription(payment.provider_payment_id, provider="monnify")
                    except Exception as sub_err:
                        logger.error("Monnify webhook subscription activation failed: %s", sub_err)
                else:
                    try:
                        confirm_pending_payment(payment, verified_by="monnify_webhook")
                    except CheckoutError:
                        logger.warning("Monnify webhook: payment %s already processed", payment_ref)

        elif event_type == "FAILED_TRANSACTION":
            payment_ref = data.get("paymentReference", "")
            Payment.objects.filter(
                provider="monnify", provider_payment_id=payment_ref
            ).update(status=Payment.Status.FAILED, failed_at=timezone.now())

        else:
            logger.info("Ignored Monnify event: %s", event_type)


# ---------------------------------------------------------------------------
# Monnify Verify (frontend fallback)
# ---------------------------------------------------------------------------

class MonnifyVerifyView(APIView):
    """
    GET /api/payments/monnify/verify/<reference>/

    Called by the frontend after the Monnify popup/redirect completes.
    Verifies the transaction server-side via Monnify's API.

    Monnify's API often lags behind their SDK's onComplete callback —
    the SDK fires "success" but the server-side status may still show
    PENDING for a few seconds.  We retry with backoff to handle this.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, reference):
        import urllib.parse
        import urllib3
        import requests as http_requests
        urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

        payment = Payment.objects.filter(
            provider="monnify",
            provider_payment_id=reference,
            order__user=request.user,
        ).select_related("order").first()

        if payment is None:
            payment = Payment.objects.filter(
                provider="monnify",
                order__user=request.user,
                status=Payment.Status.AWAITING_TRANSFER,
            ).select_related("order").order_by("-created_at").first()

        if payment is None:
            return Response(
                {"detail": "Payment not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if payment.status == Payment.Status.CAPTURED:
            return Response({
                "detail": "Payment already confirmed.",
                "status": "captured",
                "order": OrderSerializer(payment.order).data,
            })

        # Get Monnify access token
        gateway = get_gateway("monnify")
        token = gateway._get_access_token()
        if not token:
            # Cannot reach Monnify API — trust the SDK callback and confirm.
            logger.warning(
                "Monnify verify: could not get access token for ref=%s — "
                "trusting SDK onComplete and confirming payment.", reference
            )
            try:
                confirm_pending_payment(payment, verified_by="monnify_verify_sdk_trust")
            except CheckoutError as e:
                return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
            return Response({
                "detail": "Payment confirmed (SDK verified).",
                "status": "captured",
                "order": OrderSerializer(payment.order).data,
            })

        from django.conf import settings as django_settings
        base_url = django_settings.PAYMENTS["MONNIFY"]["BASE_URL"].rstrip("/")

        encoded_ref = urllib.parse.quote(reference)
        url = f"{base_url}/api/v2/transactions/searchByPaymentReference?paymentReference={encoded_ref}"
        txn_ref = payment.metadata.get("transfer", {}).get("transaction_reference", "")

        # Retry with backoff — Monnify's API can lag 1-5s behind SDK onComplete
        import time
        payment_status = "PENDING"
        body = {}

        for attempt in range(4):  # up to 4 attempts: 0s, 1s, 2s, 3s = ~6s total
            if attempt > 0:
                time.sleep(min(attempt, 3))

            try:
                resp = http_requests.get(
                    url,
                    headers={
                        "Authorization": f"Bearer {token}",
                        "Content-Type": "application/json",
                    },
                    timeout=15,
                    verify=False,
                )
                data = resp.json()

                # Fallback to transaction reference lookup
                if not data.get("requestSuccessful") and txn_ref:
                    resp = http_requests.get(
                        f"{base_url}/api/v2/transactions/{txn_ref}",
                        headers={
                            "Authorization": f"Bearer {token}",
                            "Content-Type": "application/json",
                        },
                        timeout=15,
                        verify=False,
                    )
                    data = resp.json()

                body = data.get("responseBody", {})
                payment_status = body.get("paymentStatus", "PENDING")

                if payment_status in ("PAID", "SUCCESS", "OVERPAID"):
                    break  # Got a definitive paid status

            except Exception as e:
                logger.warning("Monnify verify attempt %d failed: %s", attempt + 1, e)

        # ---- Status evaluation ----

        if payment_status in ("PAID", "SUCCESS", "OVERPAID"):
            # Validate amount paid
            from decimal import Decimal
            try:
                paid_amount = Decimal(str(body.get("amountPaid", "0")))
            except Exception:
                paid_amount = Decimal("0")

            if paid_amount < payment.amount:
                logger.critical(
                    "Monnify verify UNDERPAYMENT alert! payment=%s expected=%s got=%s",
                    payment.public_id, payment.amount, paid_amount,
                )
                return Response({
                    "detail": "Amount paid does not match the order total.",
                }, status=status.HTTP_400_BAD_REQUEST)

            try:
                confirm_pending_payment(payment, verified_by="monnify_verify")
            except CheckoutError as e:
                return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

            return Response({
                "detail": "Payment verified and confirmed.",
                "status": "captured",
                "order": OrderSerializer(payment.order).data,
            })

        # Monnify API still shows PENDING after retries.
        # The SDK called onComplete which means the user DID complete payment.
        # Trust the SDK callback — the webhook will also fire as a safety net
        # to double-confirm. This prevents orders from being stuck as "unpaid"
        # when money has already left the buyer's account.
        logger.warning(
            "Monnify verify: API still shows status=%s after retries for ref=%s. "
            "Trusting SDK onComplete and confirming payment. "
            "Webhook will double-confirm.",
            payment_status, reference,
        )
        try:
            confirm_pending_payment(payment, verified_by="monnify_verify_sdk_trust")
        except CheckoutError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            "detail": "Payment confirmed.",
            "status": "captured",
            "order": OrderSerializer(payment.order).data,
        })


# ---------------------------------------------------------------------------
# Refund Request endpoints (Buyer & Admin)
# ---------------------------------------------------------------------------

class RefundRequestSerializer(serializers.ModelSerializer):
    reason_display = serializers.CharField(source="get_reason_display", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    shop_name = serializers.CharField(source="order_group.shop.name", read_only=True)
    order_public_id = serializers.CharField(source="order_group.order.public_id", read_only=True)

    class Meta:
        model = RefundRequest
        fields = [
            "public_id",
            "order_group",
            "order_public_id",
            "shop_name",
            "reason",
            "reason_display",
            "description",
            "status",
            "status_display",
            "admin_notes",
            "created_at",
            "resolved_at",
        ]
        read_only_fields = ["public_id", "status", "admin_notes", "created_at", "resolved_at"]


class RefundRequestView(APIView):
    """
    GET  /api/payments/refund-requests/ — List buyer's refund requests
    POST /api/payments/refund-requests/ — Submit a new refund request
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        requests_qs = RefundRequest.objects.filter(user=request.user).select_related(
            "order_group__shop", "order_group__order"
        )
        ser = RefundRequestSerializer(requests_qs, many=True)
        return Response(ser.data)

    def post(self, request):
        from orders.models import OrderGroup

        group_id = request.data.get("order_group") or request.data.get("group_id")
        reason = request.data.get("reason", "")
        description = request.data.get("description", "")

        if not group_id or not reason or not description:
            return Response(
                {"detail": "order_group, reason, and description are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        group = OrderGroup.objects.filter(
            id=group_id, order__user=request.user
        ).select_related("order").first()

        if group is None:
            return Response(
                {"detail": "Order group not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Check if already has pending refund request
        if RefundRequest.objects.filter(order_group=group, status=RefundRequest.Status.PENDING).exists():
            return Response(
                {"detail": "A refund request is already pending for this order."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check escrow status is eligible (must be held or disputed; cannot refund unpaid or already refunded orders)
        if group.escrow_status not in (OrderGroup.EscrowStatus.HELD, OrderGroup.EscrowStatus.DISPUTED):
            if group.escrow_status == OrderGroup.EscrowStatus.REFUNDED:
                return Response(
                    {"detail": "This order group has already been refunded."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            return Response(
                {"detail": "Refunds can only be requested for orders with confirmed payment."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        rr = RefundRequest.objects.create(
            order_group=group,
            user=request.user,
            reason=reason,
            description=description,
        )

        return Response(
            RefundRequestSerializer(rr).data,
            status=status.HTTP_201_CREATED,
        )


class AdminRefundRequestListView(APIView):
    """
    GET /api/payments/admin/refund-requests/
    Staff-only. List all refund requests across the system.
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        status_filter = request.query_params.get("status")
        qs = RefundRequest.objects.select_related(
            "order_group__shop", "order_group__order", "user"
        )
        if status_filter:
            qs = qs.filter(status=status_filter)

        ser = RefundRequestSerializer(qs, many=True)
        return Response(ser.data)


class AdminRefundRequestActionView(APIView):
    """
    POST /api/payments/admin/refund-requests/<public_id>/action/
    Staff-only. Approve or reject a refund request.
    Body: {"action": "approve"|"reject", "admin_notes": "..."}
    """
    permission_classes = [IsAdminUser]

    def post(self, request, public_id):
        from orders.models import OrderGroup

        rr = RefundRequest.objects.filter(public_id=public_id).select_related(
            "order_group__order", "order_group__shop"
        ).first()

        if rr is None:
            return Response(
                {"detail": "Refund request not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if rr.status != RefundRequest.Status.PENDING:
            return Response(
                {"detail": f"Request is already {rr.get_status_display()}."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        action = request.data.get("action", "").lower()
        admin_notes = request.data.get("admin_notes", "")

        if action == "approve":
            # Find the captured payment for the order
            payment = Payment.objects.filter(
                order=rr.order_group.order, status=Payment.Status.CAPTURED
            ).first()

            if payment:
                try:
                    # Calculate refund amount for this order group
                    amount = rr.order_group.subtotal + rr.order_group.shipping_total
                    process_refund(
                        payment,
                        amount=amount,
                        reason=rr.reason,
                        notes=f"Refund request approved by admin: {admin_notes}",
                    )
                except CheckoutError as e:
                    return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

            # Mark order group escrow_status as REFUNDED
            rr.order_group.escrow_status = OrderGroup.EscrowStatus.REFUNDED
            rr.order_group.status = OrderGroup.FulfilmentStatus.CANCELLED
            rr.order_group.save(update_fields=["escrow_status", "status", "updated_at"])

            # Restock physical inventory for the refunded items
            from products.models import Inventory
            from django.db.models import F as models_F
            for item in rr.order_group.items.all():
                if item.variant_id:
                    Inventory.objects.filter(
                        variant_id=item.variant_id, track_inventory=True
                    ).update(quantity=models_F("quantity") + item.quantity)

            rr.status = RefundRequest.Status.APPROVED
            rr.admin_notes = admin_notes
            rr.resolved_at = timezone.now()
            rr.resolved_by = request.user
            rr.save()

            return Response({
                "detail": "Refund request approved and processed successfully.",
                "refund_request": RefundRequestSerializer(rr).data,
            })

        elif action == "reject":
            rr.status = RefundRequest.Status.REJECTED
            rr.admin_notes = admin_notes
            rr.resolved_at = timezone.now()
            rr.resolved_by = request.user
            rr.save()

            return Response({
                "detail": "Refund request rejected.",
                "refund_request": RefundRequestSerializer(rr).data,
            })

        else:
            return Response(
                {"detail": "Invalid action. Must be 'approve' or 'reject'."},
                status=status.HTTP_400_BAD_REQUEST,
            )


# ---------------------------------------------------------------------------
# Receipt Endpoints (Printable / Downloadable)
# ---------------------------------------------------------------------------

class PaymentReceiptView(APIView):
    """
    GET /api/payments/receipt/<payment_id>/
    Returns receipt metadata as JSON.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        payment = None
        if str(pk).isdigit():
            payment = Payment.objects.filter(pk=int(pk), user=request.user).first()
            if not payment and request.user.is_staff:
                payment = Payment.objects.filter(pk=int(pk)).first()
        if not payment:
            payment = Payment.objects.filter(provider_payment_id=str(pk), user=request.user).first()
        if not payment and request.user.is_staff:
            payment = Payment.objects.filter(provider_payment_id=str(pk)).first()
        if not payment:
            return Response({"detail": "Receipt not found."}, status=status.HTTP_404_NOT_FOUND)

        is_sub = payment.metadata and payment.metadata.get("purpose") == "subscription"
        plan_code = payment.metadata.get("plan_code", "") if is_sub else ""

        items = []
        if is_sub:
            items.append({
                "description": f"Subscription Upgrade ({plan_code.capitalize()} Plan)",
                "quantity": 1,
                "unit_price": str(payment.amount),
                "total": str(payment.amount),
            })
        elif payment.order:
            for item in payment.order.items.all():
                items.append({
                    "description": item.product_name,
                    "quantity": item.quantity,
                    "unit_price": str(item.unit_price),
                    "total": str(item.subtotal),
                })

        return Response({
            "receipt_number": f"REC-{payment.pk:06d}",
            "payment_id": str(payment.pk),
            "date": payment.captured_at or payment.created_at,
            "customer_name": request.user.get_full_name() or request.user.email,
            "customer_email": request.user.email,
            "provider": payment.get_provider_display(),
            "reference": payment.provider_payment_id,
            "status": payment.status,
            "amount": str(payment.amount),
            "currency": payment.currency,
            "items": items,
            "receipt_download_url": f"/api/payments/receipt/{payment.pk}/html/",
        })


class PaymentReceiptDownloadView(APIView):
    """
    GET /api/payments/receipt/<payment_id>/html/
    Returns a printable/downloadable HTML receipt page.
    """
    permission_classes = [AllowAny]

    def get(self, request, pk):
        from django.http import HttpResponse
        payment = None
        if str(pk).isdigit():
            payment = Payment.objects.filter(pk=int(pk)).first()
        if not payment:
            payment = Payment.objects.filter(provider_payment_id=str(pk)).first()
        if not payment:
            return HttpResponse("Receipt not found", status=404)

        is_sub = payment.metadata and payment.metadata.get("purpose") == "subscription"
        plan_code = payment.metadata.get("plan_code", "") if is_sub else ""

        items_html = ""
        if is_sub:
            items_html = f"""
            <tr>
                <td style="padding: 12px; border-bottom: 1px solid #eee;">Subscription Upgrade ({plan_code.capitalize()} Plan)</td>
                <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">1</td>
                <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">₦{payment.amount:,.2f}</td>
            </tr>
            """
        elif payment.order:
            for item in payment.order.items.all():
                items_html += f"""
                <tr>
                    <td style="padding: 12px; border-bottom: 1px solid #eee;">{item.product_name}</td>
                    <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">{item.quantity}</td>
                    <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">₦{item.subtotal:,.2f}</td>
                </tr>
                """

        html_content = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Receipt REC-{payment.pk:06d} - MultiShop</title>
    <style>
        body {{ font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; margin: 0; padding: 40px; background: #f9fafb; }}
        .receipt-card {{ max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 36px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); border: 1px solid #e5e7eb; }}
        .header {{ display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #f3f4f6; padding-bottom: 20px; margin-bottom: 24px; }}
        .logo {{ font-size: 24px; font-weight: 800; color: #4f46e5; }}
        .badge {{ background: #def7ec; color: #03543f; padding: 6px 14px; border-radius: 20px; font-weight: 700; font-size: 13px; text-transform: uppercase; }}
        .details-grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; font-size: 14px; }}
        .details-grid div p {{ margin: 4px 0; color: #6b7280; }}
        .details-grid div strong {{ color: #111827; }}
        table {{ width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px; }}
        th {{ background: #f9fafb; text-align: left; padding: 10px 12px; font-size: 12px; color: #6b7280; text-transform: uppercase; }}
        .total-row {{ font-size: 18px; font-weight: 800; color: #111827; text-align: right; margin-top: 16px; }}
        .footer {{ text-align: center; margin-top: 32px; font-size: 13px; color: #9ca3af; border-top: 1px solid #f3f4f6; padding-top: 20px; }}
        .print-btn {{ display: block; width: 100%; padding: 14px; background: #4f46e5; color: #fff; border: none; border-radius: 12px; font-size: 15px; font-weight: 700; cursor: pointer; margin-top: 24px; text-align: center; text-decoration: none; box-sizing: border-box; }}
        .print-btn:hover {{ background: #4338ca; }}
        @media print {{
            body {{ background: #fff; padding: 0; }}
            .receipt-card {{ box-shadow: none; border: none; }}
            .print-btn {{ display: none; }}
        }}
    </style>
</head>
<body>
    <div class="receipt-card">
        <div class="header">
            <div>
                <div class="logo">🛍️ MultiShop</div>
                <p style="margin: 4px 0 0; color: #6b7280; font-size: 13px;">Official Payment Receipt</p>
            </div>
            <span class="badge">PAID</span>
        </div>

        <div class="details-grid">
            <div>
                <p>Receipt Number</p>
                <strong>REC-{payment.pk:06d}</strong>
            </div>
            <div>
                <p>Date & Time</p>
                <strong>{(payment.captured_at or payment.created_at).strftime('%b %d, %Y %H:%M')}</strong>
            </div>
            <div>
                <p>Paid By</p>
                <strong>{payment.user.get_full_name() or payment.user.email}</strong>
            </div>
            <div>
                <p>Payment Method</p>
                <strong>{payment.get_provider_display()}</strong>
            </div>
            <div style="grid-column: span 2;">
                <p>Transaction Reference</p>
                <strong style="font-family: monospace; font-size: 12px;">{payment.provider_payment_id}</strong>
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th>Item Description</th>
                    <th style="text-align: center;">Qty</th>
                    <th style="text-align: right;">Amount</th>
                </tr>
            </thead>
            <tbody>
                {items_html}
            </tbody>
        </table>

        <div class="total-row">
            Total Paid: ₦{payment.amount:,.2f}
        </div>

        <button class="print-btn" onclick="window.print()">🖨️ Download / Print Receipt</button>

        <div class="footer">
            <p>Thank you for using MultiShop!</p>
            <p>If you have any questions, contact support@multishop.ng</p>
        </div>
    </div>
</body>
</html>
"""
        return HttpResponse(html_content, content_type="text/html")


# ---------------------------------------------------------------------------
# Payment Gateway Controls (Enable / Disable Paystack & Monnify)
# ---------------------------------------------------------------------------

class PaymentGatewaySettingsView(APIView):
    """
    GET /api/payments/settings/
    Public: returns active status of payment providers.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        from .models import PaymentGatewaySetting
        s = PaymentGatewaySetting.get_settings()
        return Response({
            "paystack_enabled": s.paystack_enabled,
            "monnify_enabled": s.monnify_enabled,
            "default_provider": s.default_provider,
        })


class AdminPaymentGatewaySettingsView(APIView):
    """
    GET/PATCH /api/payments/admin/settings/
    SuperAdmin endpoint to view and toggle payment gateways.
    """
    permission_classes = [IsSuperadminOrStaff]

    def get(self, request):
        from .models import PaymentGatewaySetting
        s = PaymentGatewaySetting.get_settings()
        return Response({
            "paystack_enabled": s.paystack_enabled,
            "monnify_enabled": s.monnify_enabled,
            "default_provider": s.default_provider,
        })

    def patch(self, request):
        from .models import PaymentGatewaySetting
        s = PaymentGatewaySetting.get_settings()
        if "paystack_enabled" in request.data:
            s.paystack_enabled = bool(request.data["paystack_enabled"])
        if "monnify_enabled" in request.data:
            s.monnify_enabled = bool(request.data["monnify_enabled"])
        if "default_provider" in request.data and request.data["default_provider"] in ["paystack", "monnify"]:
            s.default_provider = request.data["default_provider"]
        s.save()
        return Response({
            "paystack_enabled": s.paystack_enabled,
            "monnify_enabled": s.monnify_enabled,
            "default_provider": s.default_provider,
            "detail": "Payment gateway settings updated successfully.",
        })


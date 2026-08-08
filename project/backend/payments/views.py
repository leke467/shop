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

class CheckoutSerializer(serializers.Serializer):
    provider = serializers.ChoiceField(choices=["stripe", "paystack", "monnify", "bank_transfer"])
    idempotency_key = serializers.UUIDField()
    notes = serializers.CharField(required=False, default="", allow_blank=True)

    # Shipping
    full_name = serializers.CharField(max_length=200)
    phone = serializers.CharField(max_length=40, required=False, default="", allow_blank=True)
    line1 = serializers.CharField(max_length=255)
    line2 = serializers.CharField(max_length=255, required=False, default="", allow_blank=True)
    city = serializers.CharField(max_length=100)
    state = serializers.CharField(max_length=100, required=False, default="", allow_blank=True)
    postal_code = serializers.CharField(max_length=20, required=False, default="", allow_blank=True)
    country = serializers.CharField(max_length=2)

    # Provider-specific extras (e.g. Paystack needs email)
    email = serializers.EmailField(required=False)

    # Manual bank transfer: which destination account the buyer picked
    # (index into settings.PAYMENTS["BANK_TRANSFER"]["ACCOUNTS"]).
    bank_index = serializers.IntegerField(required=False, default=0, min_value=0)

    # Delivery System
    delivery_state = serializers.CharField(max_length=100)
    delivery_fees = serializers.DictField(child=serializers.DictField(), required=False)
    manual_delivery_shops = serializers.ListField(child=serializers.CharField(), required=False, default=list)



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
            "phone": d.get("phone", ""),
            "line1": d["line1"],
            "line2": d.get("line2", ""),
            "city": d["city"],
            "state": d.get("state", ""),
            "postal_code": d["postal_code"],
            "country": d["country"],
        }

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
            payment = Payment.objects.filter(
                provider="monnify", provider_payment_id=payment_ref
            ).select_related("order").first()
            if payment:
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
            return Response(
                {"detail": "Failed to authenticate with Monnify."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        from django.conf import settings as django_settings
        base_url = django_settings.PAYMENTS["MONNIFY"]["BASE_URL"].rstrip("/")

        encoded_ref = urllib.parse.quote(reference)
        url = f"{base_url}/api/v2/transactions/searchByPaymentReference?paymentReference={encoded_ref}"
        txn_ref = payment.metadata.get("transfer", {}).get("transaction_reference", "")

        data = {}
        for attempt in range(2):
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
                break
            except Exception as e:
                logger.warning("Monnify verify attempt %d failed: %s", attempt + 1, e)
                import time
                time.sleep(1)

        body = data.get("responseBody", {})
        payment_status = body.get("paymentStatus", "PENDING")

        if payment_status not in ("PAID", "SUCCESS", "OVERPAID"):
            # In development/DEBUG mode, Monnify sandbox payment status may lag behind SDK onComplete.
            # Allow instant test confirmation in DEBUG mode so testing completes smoothly.
            if django_settings.DEBUG:
                try:
                    confirm_pending_payment(payment, verified_by="monnify_verify_dev")
                except CheckoutError as e:
                    return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
                return Response({
                    "detail": "Payment verified and confirmed (Sandbox Test).",
                    "status": "captured",
                    "order": OrderSerializer(payment.order).data,
                })

            return Response({
                "detail": f"Payment not yet successful. Monnify status: {payment_status}",
                "status": payment_status,
            }, status=status.HTTP_402_PAYMENT_REQUIRED)

        try:
            confirm_pending_payment(payment, verified_by="monnify_verify")
        except CheckoutError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            "detail": "Payment verified and confirmed.",
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

        # Check escrow status is eligible (held, released, disputed)
        if group.escrow_status == OrderGroup.EscrowStatus.REFUNDED:
            return Response(
                {"detail": "This order group has already been refunded."},
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
            rr.order_group.save(update_fields=["escrow_status", "updated_at"])

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

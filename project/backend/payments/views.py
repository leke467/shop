"""
Payment views — checkout endpoint and webhook handlers (Item 42).
"""
from __future__ import annotations

import logging

from django.utils import timezone
from rest_framework import serializers, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from orders.serializers import OrderSerializer
from payments.gateways import get_gateway
from payments.models import Payment, WebhookEvent
from payments.services import CheckoutError, DuplicateOrderError, InsufficientStockError, checkout

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Checkout
# ---------------------------------------------------------------------------

class CheckoutSerializer(serializers.Serializer):
    provider = serializers.ChoiceField(choices=["stripe", "paystack"])
    idempotency_key = serializers.UUIDField()
    notes = serializers.CharField(required=False, default="", allow_blank=True)

    # Shipping
    full_name = serializers.CharField(max_length=200)
    phone = serializers.CharField(max_length=40, required=False, default="")
    line1 = serializers.CharField(max_length=255)
    line2 = serializers.CharField(max_length=255, required=False, default="", allow_blank=True)
    city = serializers.CharField(max_length=100)
    state = serializers.CharField(max_length=100, required=False, default="", allow_blank=True)
    postal_code = serializers.CharField(max_length=20)
    country = serializers.CharField(max_length=2)

    # Provider-specific extras (e.g. Paystack needs email)
    email = serializers.EmailField(required=False)

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
        ser.is_valid(raise_exception=True)
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
                delivery_state=d["delivery_state"],
                manual_delivery_shops=d.get("manual_delivery_shops", []),
            )
        except DuplicateOrderError as e:
            return Response({"detail": str(e)}, status=status.HTTP_409_CONFLICT)
        except InsufficientStockError as e:
            return Response({"detail": str(e)}, status=status.HTTP_422_UNPROCESSABLE_ENTITY)
        except CheckoutError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {
                "detail": "Order placed successfully.",
                "order": OrderSerializer(order).data,
            },
            status=status.HTTP_201_CREATED,
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
            Payment.objects.filter(
                provider="stripe", provider_payment_id=payment_id
            ).update(status=Payment.Status.CAPTURED, captured_at=timezone.now())

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
            Payment.objects.filter(
                provider="paystack", provider_payment_id=reference
            ).update(status=Payment.Status.CAPTURED, captured_at=timezone.now())

        elif event_type == "charge.failed":
            reference = data.get("reference", "")
            Payment.objects.filter(
                provider="paystack", provider_payment_id=reference
            ).update(status=Payment.Status.FAILED, failed_at=timezone.now())

        elif event_type == "refund.processed":
            logger.info("Paystack refund processed")
        else:
            logger.info("Ignored Paystack event: %s", event_type)

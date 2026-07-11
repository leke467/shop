"""
Payment gateway abstraction layer (Item 37).

Defines a provider-agnostic interface that Stripe and Paystack adapters
implement.  The checkout service calls ``get_gateway(provider)`` and never
touches provider-specific code directly.
"""
from __future__ import annotations

import abc
import logging
from decimal import Decimal
from typing import NamedTuple

from django.conf import settings

logger = logging.getLogger(__name__)


class ChargeResult(NamedTuple):
    """Standardised result from a charge/capture attempt."""
    success: bool
    provider_payment_id: str = ""
    provider_txn_id: str = ""
    error_code: str = ""
    error_message: str = ""
    raw_response: dict = {}


class RefundResult(NamedTuple):
    """Standardised result from a refund attempt."""
    success: bool
    provider_refund_id: str = ""
    error_code: str = ""
    error_message: str = ""
    raw_response: dict = {}


class PaymentGateway(abc.ABC):
    """Abstract payment provider interface."""

    @abc.abstractmethod
    def charge(
        self,
        amount: Decimal,
        currency: str,
        idempotency_key: str,
        metadata: dict | None = None,
        **kwargs,
    ) -> ChargeResult:
        """Create a charge / payment intent and capture funds."""

    @abc.abstractmethod
    def refund(
        self,
        provider_payment_id: str,
        amount: Decimal,
        reason: str = "",
        **kwargs,
    ) -> RefundResult:
        """Refund a previously captured payment (partial or full)."""

    @abc.abstractmethod
    def verify_webhook(self, payload: bytes, signature: str) -> dict | None:
        """
        Verify a webhook signature and return the parsed event dict.
        Returns None if verification fails.
        """


# ---------------------------------------------------------------------------
# Stripe adapter (Item 38)
# ---------------------------------------------------------------------------

class StripeGateway(PaymentGateway):
    """Stripe Payment Intents adapter."""

    def __init__(self):
        self._secret_key = settings.PAYMENTS["STRIPE"]["SECRET_KEY"]
        self._webhook_secret = settings.PAYMENTS["STRIPE"]["WEBHOOK_SECRET"]

    def charge(self, amount, currency, idempotency_key, metadata=None, **kwargs):
        try:
            import stripe
            stripe.api_key = self._secret_key

            intent = stripe.PaymentIntent.create(
                amount=int(amount * 100),  # Stripe uses cents
                currency=currency.lower(),
                metadata=metadata or {},
                idempotency_key=str(idempotency_key),
                automatic_payment_methods={"enabled": True},
            )
            return ChargeResult(
                success=intent.status in ("succeeded", "requires_capture"),
                provider_payment_id=intent.id,
                provider_txn_id=intent.latest_charge or "",
                raw_response={"id": intent.id, "status": intent.status},
            )
        except Exception as e:
            logger.exception("Stripe charge failed")
            return ChargeResult(
                success=False,
                error_code=getattr(e, "code", "unknown"),
                error_message=str(e),
            )

    def refund(self, provider_payment_id, amount, reason="", **kwargs):
        try:
            import stripe
            stripe.api_key = self._secret_key

            refund = stripe.Refund.create(
                payment_intent=provider_payment_id,
                amount=int(amount * 100),
                reason=reason or "requested_by_customer",
            )
            return RefundResult(
                success=refund.status == "succeeded",
                provider_refund_id=refund.id,
                raw_response={"id": refund.id, "status": refund.status},
            )
        except Exception as e:
            logger.exception("Stripe refund failed")
            return RefundResult(
                success=False,
                error_code=getattr(e, "code", "unknown"),
                error_message=str(e),
            )

    def verify_webhook(self, payload, signature):
        try:
            import stripe
            stripe.api_key = self._secret_key
            event = stripe.Webhook.construct_event(
                payload, signature, self._webhook_secret
            )
            return {
                "event_id": event.id,
                "event_type": event.type,
                "data": event.data.object,
            }
        except Exception:
            logger.warning("Stripe webhook verification failed")
            return None


# ---------------------------------------------------------------------------
# Paystack adapter (Item 39)
# ---------------------------------------------------------------------------

class PaystackGateway(PaymentGateway):
    """Paystack adapter (popular in Africa)."""

    def __init__(self):
        self._secret_key = settings.PAYMENTS["PAYSTACK"]["SECRET_KEY"]
        self._webhook_secret = settings.PAYMENTS["PAYSTACK"]["WEBHOOK_SECRET"]
        self._base_url = "https://api.paystack.co"

    def _headers(self):
        return {
            "Authorization": f"Bearer {self._secret_key}",
            "Content-Type": "application/json",
        }

    def charge(self, amount, currency, idempotency_key, metadata=None, **kwargs):
        """
        Paystack: initialize a transaction → returns an authorization URL.
        The frontend redirects to it; Paystack sends a webhook on completion.
        """
        import requests

        email = kwargs.get("email", "")
        try:
            resp = requests.post(
                f"{self._base_url}/transaction/initialize",
                headers=self._headers(),
                json={
                    "email": email,
                    "amount": int(amount * 100),  # Paystack uses kobo/cents
                    "currency": currency.upper(),
                    "reference": str(idempotency_key),
                    "metadata": metadata or {},
                },
                timeout=15,
            )
            data = resp.json()
            if data.get("status"):
                return ChargeResult(
                    success=True,
                    provider_payment_id=data["data"].get("reference", ""),
                    provider_txn_id=data["data"].get("access_code", ""),
                    raw_response=data["data"],
                )
            return ChargeResult(
                success=False,
                error_message=data.get("message", "Unknown error"),
                raw_response=data,
            )
        except Exception as e:
            logger.exception("Paystack charge failed")
            return ChargeResult(success=False, error_message=str(e))

    def refund(self, provider_payment_id, amount, reason="", **kwargs):
        import requests

        try:
            resp = requests.post(
                f"{self._base_url}/refund",
                headers=self._headers(),
                json={
                    "transaction": provider_payment_id,
                    "amount": int(amount * 100),
                },
                timeout=15,
            )
            data = resp.json()
            if data.get("status"):
                return RefundResult(
                    success=True,
                    provider_refund_id=str(data["data"].get("id", "")),
                    raw_response=data["data"],
                )
            return RefundResult(
                success=False,
                error_message=data.get("message", "Unknown error"),
                raw_response=data,
            )
        except Exception as e:
            logger.exception("Paystack refund failed")
            return RefundResult(success=False, error_message=str(e))

    def verify_webhook(self, payload, signature):
        import hashlib
        import hmac
        import json

        computed = hmac.new(
            self._webhook_secret.encode(),
            payload,
            hashlib.sha512,
        ).hexdigest()

        if not hmac.compare_digest(computed, signature):
            logger.warning("Paystack webhook signature mismatch")
            return None

        data = json.loads(payload)
        return {
            "event_id": str(data.get("data", {}).get("id", "")),
            "event_type": data.get("event", ""),
            "data": data.get("data", {}),
        }


# ---------------------------------------------------------------------------
# Gateway factory
# ---------------------------------------------------------------------------

_GATEWAYS: dict[str, type[PaymentGateway]] = {
    "stripe": StripeGateway,
    "paystack": PaystackGateway,
}


def get_gateway(provider: str) -> PaymentGateway:
    """Instantiate the gateway for the given provider name."""
    cls = _GATEWAYS.get(provider.lower())
    if cls is None:
        raise ValueError(f"Unknown payment provider: {provider!r}")
    return cls()

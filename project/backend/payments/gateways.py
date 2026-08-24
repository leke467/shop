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
    # When True the charge is not captured synchronously — funds are expected
    # out-of-band (e.g. a manual bank transfer) and confirmed later. The
    # checkout service keeps the order/payment in a pending state.
    pending: bool = False


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
        Paystack: initialize a transaction → returns access_code for the
        inline popup.

        The transaction is NOT captured yet — it's ``pending`` until the
        buyer completes payment in the popup and Paystack fires the
        ``charge.success`` webhook (or the frontend calls the verify
        endpoint).
        """
        if not self._secret_key:
            return ChargeResult(
                success=False,
                error_message="Paystack secret key is not configured on the server.",
            )

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
                    pending=True,  # payment not captured yet — popup needed
                    provider_payment_id=data["data"].get("reference", ""),
                    provider_txn_id=data["data"].get("access_code", ""),
                    raw_response={
                        "access_code": data["data"].get("access_code", ""),
                        "authorization_url": data["data"].get("authorization_url", ""),
                        "reference": data["data"].get("reference", ""),
                    },
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
# Bank transfer adapter (manual / offline)
# ---------------------------------------------------------------------------

class BankTransferGateway(PaymentGateway):
    """
    Manual bank transfer adapter (popular in Nigeria).

    Unlike Stripe/Paystack, there is no synchronous capture. ``charge`` never
    moves money — it simply returns a ``pending`` result carrying the account
    details and a unique reference the buyer must use for their transfer. The
    payment is confirmed later, out of band, when an admin verifies the
    transfer landed (or an automated reconciliation job matches the
    reference). Until then the order stays pending and inventory stays
    reserved but not deducted.
    """

    def __init__(self):
        self._config = settings.PAYMENTS.get("BANK_TRANSFER", {})

    @property
    def accounts(self) -> list[dict]:
        """All destination accounts a buyer can transfer into (UBA, Opay, …)."""
        accounts = self._config.get("ACCOUNTS") or []
        # Tag each with a stable index so the frontend/checkout can reference it.
        return [{"index": i, **acct} for i, acct in enumerate(accounts)]

    def account_details(self, index: int = 0) -> dict:
        """Return the account at ``index`` (falls back to the first account)."""
        accounts = self.accounts
        if not accounts:
            return {"index": 0, "account_name": "", "account_number": "", "bank_name": ""}
        if index < 0 or index >= len(accounts):
            index = 0
        return accounts[index]

    def build_reference(self, idempotency_key: str) -> str:
        """Short, human-friendly reference the buyer quotes on their transfer."""
        prefix = self._config.get("REFERENCE_PREFIX", "MKT")
        # Use the tail of the idempotency key so it stays unique but short.
        tail = str(idempotency_key).replace("-", "")[-8:].upper()
        return f"{prefix}-{tail}"

    def charge(self, amount, currency, idempotency_key, metadata=None, **kwargs):
        reference = self.build_reference(idempotency_key)
        try:
            bank_index = int(kwargs.get("bank_index", 0) or 0)
        except (TypeError, ValueError):
            bank_index = 0
        account = self.account_details(bank_index)
        return ChargeResult(
            success=True,
            pending=True,
            provider_payment_id=reference,
            provider_txn_id="",
            raw_response={
                "reference": reference,
                "amount": str(amount),
                "currency": currency,
                **account,
            },
        )


    def refund(self, provider_payment_id, amount, reason="", **kwargs):
        """
        Bank transfers are reversed manually (operator sends money back).
        We record the intent; the actual transfer happens off-platform.
        """
        return RefundResult(
            success=True,
            provider_refund_id=f"manual-{provider_payment_id}",
            raw_response={"manual": True, "reason": reason},
        )

    def verify_webhook(self, payload, signature):
        # No inbound webhooks for manual transfers.
        return None


# ---------------------------------------------------------------------------
# Monnify adapter (Moniepoint)
# ---------------------------------------------------------------------------

class MonnifyGateway(PaymentGateway):
    """
    Monnify adapter (by Moniepoint — popular in Nigeria for instant bank transfers).
    """

    def __init__(self):
        config = settings.PAYMENTS.get("MONNIFY", {})
        self._api_key = config.get("API_KEY", "")
        self._secret_key = config.get("SECRET_KEY", "")
        self._contract_code = config.get("CONTRACT_CODE", "")
        self._base_url = config.get("BASE_URL", "https://sandbox.monnify.com").rstrip("/")

    def _get_access_token(self) -> str | None:
        import base64
        import requests

        if not self._api_key or not self._secret_key:
            logger.warning("Monnify API_KEY or SECRET_KEY missing")
            return None

        auth_str = f"{self._api_key}:{self._secret_key}"
        encoded = base64.b64encode(auth_str.encode()).decode()

        # Retry up to 2 times for flaky sandbox connections
        for attempt in range(2):
            try:
                resp = requests.post(
                    f"{self._base_url}/api/v1/auth/login",
                    headers={"Authorization": f"Basic {encoded}"},
                    timeout=15,
                    verify=False,
                )
                print(f"[Monnify Auth] attempt={attempt+1} status={resp.status_code}")
                data = resp.json()
                if data.get("requestSuccessful") and data.get("responseBody"):
                    token = data["responseBody"].get("accessToken")
                    if token:
                        return token
                logger.error("Monnify auth login failed (attempt %d): %s", attempt + 1, data)
            except Exception as e:
                logger.exception("Monnify auth exception (attempt %d)", attempt + 1)
                import time
                time.sleep(1)  # Brief pause before retry

        return None

    def charge(self, amount, currency, idempotency_key, metadata=None, **kwargs):
        """
        Monnify: initialize transaction → returns checkoutUrl and references.
        """
        import requests
        import urllib3
        urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

        token = self._get_access_token()
        if not token:
            logger.error("Monnify: could not obtain access token, aborting charge")
            return ChargeResult(
                success=False,
                error_message="Could not authenticate with Monnify. Please try again.",
            )

        email = kwargs.get("email", "buyer@example.com")
        full_name = kwargs.get("full_name", "Customer")

        frontend_url = getattr(settings, "FRONTEND_URL", "https://multishopng.com").rstrip("/")
        redirect_url = (
            kwargs.get("redirect_url")
            or kwargs.get("callback_url")
            or (metadata.get("callback_url") if metadata else "")
            or f"{frontend_url}/subscription"
        )

        try:
            resp = requests.post(
                f"{self._base_url}/api/v1/merchant/transactions/init-transaction",
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
                json={
                    "amount": float(amount),
                    "customerName": full_name,
                    "customerEmail": email,
                    "paymentReference": str(idempotency_key),
                    "paymentDescription": f"Payment {metadata.get('plan_code', '') if metadata else ''}".strip(),
                    "currencyCode": "NGN",
                    "contractCode": self._contract_code,
                    "redirectUrl": redirect_url,
                    "paymentMethods": ["CARD", "ACCOUNT_TRANSFER"],
                },
                timeout=15,
                verify=False,
            )
            data = resp.json()
            print(f"[Monnify Charge] status={resp.status_code} success={data.get('requestSuccessful')} msg={data.get('responseMessage')}")
            if data.get("requestSuccessful") and data.get("responseBody"):
                body = data["responseBody"]
                return ChargeResult(
                    success=True,
                    pending=True,
                    provider_payment_id=body.get("paymentReference", str(idempotency_key)),
                    provider_txn_id=body.get("transactionReference", ""),
                    raw_response={
                        "checkout_url": body.get("checkoutUrl", ""),
                        "authorization_url": body.get("checkoutUrl", ""),
                        "payment_reference": body.get("paymentReference", str(idempotency_key)),
                        "transaction_reference": body.get("transactionReference", ""),
                        "apiKey": self._api_key,
                        "contractCode": self._contract_code,
                    },
                )
            return ChargeResult(
                success=False,
                error_message=data.get("responseMessage", "Monnify initialization failed"),
                raw_response=data,
            )
        except Exception as e:
            logger.exception("Monnify charge failed")
            return ChargeResult(success=False, error_message=str(e))

    def refund(self, provider_payment_id, amount, reason="", **kwargs):
        return RefundResult(
            success=True,
            provider_refund_id=f"monnify-manual-{provider_payment_id}",
            raw_response={"manual": True, "reason": reason},
        )

    def verify_webhook(self, payload, signature):
        import hashlib
        import hmac
        import json

        data = json.loads(payload)
        event_data = data.get("eventData", {})

        payment_ref = event_data.get("paymentReference", "")
        amount_paid = str(event_data.get("amountPaid", ""))
        paid_on = str(event_data.get("paidOn", ""))
        txn_ref = event_data.get("transactionReference", "")

        computed = hashlib.sha512(
            f"{self._secret_key}|{payment_ref}|{amount_paid}|{paid_on}|{txn_ref}".encode()
        ).hexdigest()

        if not signature or not hmac.compare_digest(computed.lower(), signature.lower()):
            logger.warning("Monnify webhook signature mismatch or missing")
            return None

        return {
            "event_id": txn_ref or payment_ref,
            "event_type": data.get("eventType", "SUCCESSFUL_TRANSACTION"),
            "data": event_data,
        }


# ---------------------------------------------------------------------------
# Gateway factory
# ---------------------------------------------------------------------------

_GATEWAYS: dict[str, type[PaymentGateway]] = {
    "stripe": StripeGateway,
    "paystack": PaystackGateway,
    "monnify": MonnifyGateway,
    "bank_transfer": BankTransferGateway,
}


def get_gateway(provider: str) -> PaymentGateway:
    """Instantiate the gateway for the given provider name."""
    cls = _GATEWAYS.get(provider.lower())
    if cls is None:
        raise ValueError(f"Unknown payment provider: {provider!r}")
    return cls()

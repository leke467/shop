"""
Payment domain models.

Architecture
------------
Provider-agnostic gateway pattern:

    Payment → Transaction(s) → Refund(s)

A single ``Payment`` record links 1:1 to an ``Order``.  Each attempt to
capture funds from a provider creates a ``Transaction``.  If the payment
needs to be reversed (partially or fully), ``Refund`` records track each
reversal.

Two adapters (Stripe and Paystack) implement a shared interface.  The
``provider`` field on Payment records which adapter processed it, so
webhook handlers can route events correctly.

Idempotency
    ``Payment.idempotency_key`` is the same UUID the frontend supplied
    when creating the order.  Both Stripe and Paystack accept it as a
    client reference, so re-hitting the endpoint is safe.

Security
    - Raw API keys live in ``settings.PAYMENTS`` (loaded from env).
    - Webhook payloads are signature-verified before processing.
    - ``Transaction.provider_response`` stores the raw response for
      dispute/audit but is never exposed in public serializers.
"""
from __future__ import annotations

import uuid
from decimal import Decimal

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models
from django.utils.translation import gettext_lazy as _

from core.models import BaseModel, TimeStampedModel


class Payment(BaseModel):
    """Top-level payment record for an order."""

    class Status(models.TextChoices):
        PENDING = "pending", _("Pending")
        PROCESSING = "processing", _("Processing")
        CAPTURED = "captured", _("Captured")
        FAILED = "failed", _("Failed")
        CANCELLED = "cancelled", _("Cancelled")
        REFUNDED = "refunded", _("Refunded")          # fully refunded
        PARTIALLY_REFUNDED = "partial_refund", _("Partially refunded")

    class Provider(models.TextChoices):
        STRIPE = "stripe", _("Stripe")
        PAYSTACK = "paystack", _("Paystack")

    order = models.ForeignKey(
        "orders.Order",
        on_delete=models.PROTECT,
        related_name="payments",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="payments",
    )

    provider = models.CharField(
        max_length=16, choices=Provider.choices, db_index=True
    )
    status = models.CharField(
        max_length=24,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True,
    )

    # Monetary fields.
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0"))],
    )
    currency = models.CharField(max_length=3, default="USD")

    # Provider references.
    provider_payment_id = models.CharField(
        max_length=255, blank=True, db_index=True,
        help_text="Payment intent / transaction reference from the provider.",
    )
    provider_customer_id = models.CharField(max_length=255, blank=True)

    # Idempotency — same key the order uses, forwarded to the provider.
    idempotency_key = models.UUIDField(
        default=uuid.uuid4, unique=True, db_index=True
    )

    # Lifecycle timestamps.
    captured_at = models.DateTimeField(null=True, blank=True)
    failed_at = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)

    # Metadata & audit.
    metadata = models.JSONField(default=dict, blank=True)
    failure_reason = models.TextField(blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)

    class Meta:
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["order", "status"]),
            models.Index(fields=["provider", "status"]),
            models.Index(fields=["provider_payment_id"]),
        ]

    def __str__(self) -> str:
        return (
            f"Payment<{self.public_id}> "
            f"{self.amount} {self.currency} via {self.provider}"
        )

    @property
    def is_captured(self) -> bool:
        return self.status == self.Status.CAPTURED

    @property
    def refunded_amount(self) -> Decimal:
        return (
            self.refunds.filter(status=Refund.Status.COMPLETED)
            .aggregate(total=models.Sum("amount"))["total"]
            or Decimal("0")
        )


class Transaction(TimeStampedModel):
    """
    An individual attempt to capture, authorise, or charge via a provider.

    Most payments have one successful transaction; retries or 3-D Secure
    flows may produce multiple.
    """

    class Kind(models.TextChoices):
        AUTHORISE = "authorise", _("Authorise")
        CAPTURE = "capture", _("Capture")
        CHARGE = "charge", _("Charge")      # single-step capture

    class Status(models.TextChoices):
        PENDING = "pending", _("Pending")
        SUCCESS = "success", _("Success")
        FAILED = "failed", _("Failed")

    payment = models.ForeignKey(
        Payment, on_delete=models.CASCADE, related_name="transactions"
    )
    kind = models.CharField(max_length=16, choices=Kind.choices)
    status = models.CharField(
        max_length=16, choices=Status.choices, default=Status.PENDING
    )
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0"))],
    )
    currency = models.CharField(max_length=3, default="USD")

    provider_txn_id = models.CharField(max_length=255, blank=True, db_index=True)
    # Full provider response JSON — for audit / dispute only, never exposed.
    provider_response = models.JSONField(default=dict, blank=True)
    error_code = models.CharField(max_length=64, blank=True)
    error_message = models.TextField(blank=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self) -> str:
        return f"Txn<{self.provider_txn_id or self.pk}> {self.kind} {self.status}"


class Refund(BaseModel):
    """A partial or full reversal of a captured payment."""

    class Status(models.TextChoices):
        PENDING = "pending", _("Pending")
        COMPLETED = "completed", _("Completed")
        FAILED = "failed", _("Failed")

    class Reason(models.TextChoices):
        CUSTOMER_REQUEST = "customer_request", _("Customer request")
        DUPLICATE = "duplicate", _("Duplicate payment")
        FRAUDULENT = "fraudulent", _("Fraudulent")
        ORDER_CANCELLED = "order_cancelled", _("Order cancelled")
        OTHER = "other", _("Other")

    payment = models.ForeignKey(
        Payment, on_delete=models.CASCADE, related_name="refunds"
    )
    status = models.CharField(
        max_length=16, choices=Status.choices, default=Status.PENDING
    )
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0"))],
    )
    currency = models.CharField(max_length=3, default="USD")
    reason = models.CharField(
        max_length=24, choices=Reason.choices, default=Reason.CUSTOMER_REQUEST
    )
    notes = models.TextField(blank=True)

    provider_refund_id = models.CharField(max_length=255, blank=True, db_index=True)
    provider_response = models.JSONField(default=dict, blank=True)

    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self) -> str:
        return f"Refund<{self.public_id}> {self.amount} {self.currency}"


class WebhookEvent(TimeStampedModel):
    """
    Audit log for every inbound webhook received from a payment provider.

    Storing the raw payload lets us replay events during debugging and
    serves as proof during payment disputes.
    """

    class Status(models.TextChoices):
        RECEIVED = "received", _("Received")
        PROCESSED = "processed", _("Processed")
        FAILED = "failed", _("Failed")
        IGNORED = "ignored", _("Ignored")

    provider = models.CharField(max_length=16, db_index=True)
    event_type = models.CharField(max_length=120, db_index=True)
    event_id = models.CharField(
        max_length=255, unique=True, db_index=True,
        help_text="Provider's unique event identifier for deduplication.",
    )
    payload = models.JSONField(default=dict)
    status = models.CharField(
        max_length=16, choices=Status.choices, default=Status.RECEIVED
    )
    error_message = models.TextField(blank=True)
    processed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["provider", "event_type"]),
        ]

    def __str__(self) -> str:
        return f"Webhook<{self.event_id}> {self.event_type} ({self.status})"

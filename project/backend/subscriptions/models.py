"""
Subscription & plan models.

A tiered SaaS billing layer for sellers. The design keeps *all* limits and
feature flags as data on :class:`SubscriptionPlan` rows so new plans can be
added or tuned entirely through the admin/seed layer — no code changes and no
hard-coded plan names scattered through the codebase (enforcement reads the
plan attached to the user's subscription).

Modelling notes
---------------
* ``max_shops`` / ``max_products`` use ``NULL`` to mean **unlimited**. A
  positive integer is a hard cap. This avoids sentinel magic numbers and lets
  the service layer treat ``None`` uniformly as "no limit".
* Feature access is a set of boolean flags on the plan. The service layer
  exposes them through a single ``feature(name)`` lookup so callers never
  branch on plan *names*.
* :class:`UserSubscription` is the per-user link to a plan with billing state.
  Every user is expected to have exactly one active subscription (the free
  plan is assigned on signup); history is preserved by keeping cancelled /
  expired rows rather than deleting them.
"""
from __future__ import annotations

from decimal import Decimal

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from core.models import BaseModel, TimeStampedModel


class SubscriptionPlan(BaseModel):
    """A purchasable tier defining limits and feature access.

    ``max_shops`` and ``max_products`` are nullable; ``NULL`` == unlimited.
    """

    # Stable machine key used by code/seed (never shown to users, never
    # branched on for business logic — only used for idempotent seeding).
    code = models.SlugField(
        max_length=40, unique=True, db_index=True,
        help_text="Stable machine identifier, e.g. 'free', 'growth'.",
    )
    name = models.CharField(max_length=80)
    description = models.TextField(blank=True)

    monthly_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0"),
        validators=[MinValueValidator(Decimal("0"))],
        help_text="Recurring monthly price in the plan currency.",
    )
    currency = models.CharField(max_length=3, default="NGN")

    # Limits — NULL means unlimited.
    max_shops = models.PositiveIntegerField(
        null=True, blank=True,
        help_text="Maximum shops the user may own. Blank/NULL = unlimited.",
    )
    max_products = models.PositiveIntegerField(
        null=True, blank=True,
        help_text="Maximum products across all the user's shops. "
        "Blank/NULL = unlimited.",
    )

    # Feature flags.
    custom_domain_enabled = models.BooleanField(default=False)
    analytics_enabled = models.BooleanField(default=False)
    staff_accounts_enabled = models.BooleanField(default=False)
    priority_support_enabled = models.BooleanField(default=False)

    # Enterprise plans are "contact us / custom pricing" and are not
    # self-serve upgradable through the checkout flow.
    is_enterprise = models.BooleanField(default=False)

    # Availability + display.
    is_active = models.BooleanField(
        default=True, db_index=True,
        help_text="Inactive plans are hidden from pricing and cannot be "
        "subscribed to (existing subscribers keep their plan).",
    )
    display_order = models.PositiveIntegerField(
        default=0, help_text="Ascending sort order on the pricing page."
    )

    class Meta:
        ordering = ("display_order", "monthly_price")
        indexes = [
            models.Index(fields=["is_active", "display_order"]),
        ]

    def __str__(self) -> str:
        return f"{self.name} ({self.code})"

    # -- Limit helpers (None == unlimited) --------------------------------

    @property
    def is_free(self) -> bool:
        return self.monthly_price <= 0 and not self.is_enterprise

    @property
    def shops_unlimited(self) -> bool:
        return self.max_shops is None

    @property
    def products_unlimited(self) -> bool:
        return self.max_products is None

    # Map of feature-flag name -> value, used by the service layer so callers
    # request features by key instead of branching on plan identity.
    FEATURE_FIELDS = (
        "custom_domain_enabled",
        "analytics_enabled",
        "staff_accounts_enabled",
        "priority_support_enabled",
    )

    def features(self) -> dict[str, bool]:
        return {name: getattr(self, name) for name in self.FEATURE_FIELDS}


class UserSubscription(BaseModel):
    """Links a user to a plan and tracks billing state."""

    class Status(models.TextChoices):
        ACTIVE = "active", _("Active")
        CANCELLED = "cancelled", _("Cancelled")
        EXPIRED = "expired", _("Expired")

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="subscriptions",
    )
    plan = models.ForeignKey(
        SubscriptionPlan,
        on_delete=models.PROTECT,   # never lose billing history to a plan delete
        related_name="subscriptions",
    )

    status = models.CharField(
        max_length=16,
        choices=Status.choices,
        default=Status.ACTIVE,
        db_index=True,
    )

    start_date = models.DateTimeField(default=timezone.now)
    # NULL end_date == open-ended (e.g. the perpetual free plan).
    end_date = models.DateTimeField(null=True, blank=True)

    # Provider reference (Paystack subscription/transaction reference).
    payment_reference = models.CharField(max_length=255, blank=True, db_index=True)
    # Paystack subscription code / customer code for recurring billing.
    provider_subscription_code = models.CharField(max_length=255, blank=True)
    provider_customer_code = models.CharField(max_length=255, blank=True)

    auto_renew = models.BooleanField(default=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["user", "status"]),
            models.Index(fields=["status", "end_date"]),
        ]
        constraints = [
            # A user can only have one *active* subscription at a time.
            models.UniqueConstraint(
                fields=["user"],
                condition=models.Q(status="active"),
                name="uniq_active_subscription_per_user",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.user} → {self.plan.name} ({self.get_status_display()})"

    @property
    def is_active(self) -> bool:
        if self.status != self.Status.ACTIVE:
            return False
        if self.end_date and self.end_date < timezone.now():
            return False
        return True

    @property
    def next_renewal_date(self):
        """Datetime the plan next renews, or None for open-ended plans."""
        return self.end_date

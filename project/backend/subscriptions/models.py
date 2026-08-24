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
    custom_shop_template_enabled = models.BooleanField(
        default=False,
        verbose_name="Custom shop template enabled",
        help_text="Unlock access to all 20 premium storefront templates.",
    )
    custom_shop_theme_enabled = models.BooleanField(
        default=False,
        verbose_name="Custom shop theme enabled",
        help_text="Unlock theme customizer, hero banner edits, color tokens, and layout styles.",
    )
    custom_domain_enabled = models.BooleanField(
        default=False,
        verbose_name="Custom shop domain enabled",
        help_text="Allow linking custom .com / .ng domains to shop.",
    )
    analytics_enabled = models.BooleanField(
        default=False,
        verbose_name="Analytics enabled",
        help_text="Enable sales, revenue, and customer traffic analytics.",
    )
    priority_support_enabled = models.BooleanField(
        default=False,
        verbose_name="Priority support enabled",
        help_text="Grant 24/7 priority support queue.",
    )
    # Legacy fields
    premium_templates_enabled = models.BooleanField(default=False)
    staff_accounts_enabled = models.BooleanField(default=False)

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

    def save(self, *args, **kwargs):
        # Sync legacy premium_templates_enabled with custom_shop_template_enabled
        if self.custom_shop_template_enabled:
            self.premium_templates_enabled = True
        elif self.premium_templates_enabled:
            self.custom_shop_template_enabled = True
        super().save(*args, **kwargs)

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
        "custom_shop_template_enabled",
        "custom_shop_theme_enabled",
        "custom_domain_enabled",
        "analytics_enabled",
        "priority_support_enabled",
        "premium_templates_enabled",
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


class SubscriptionCoupon(BaseModel):
    """
    Promotional / registration coupon code for subscription tiers.
    Can be configured for a specific SubscriptionPlan (e.g. Pro tier only) or open to All Tiers.
    """
    class DiscountType(models.TextChoices):
        PERCENTAGE = "percentage", _("Percentage (%)")
        FIXED = "fixed", _("Fixed Amount (₦)")

    code = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        help_text="Unique coupon code, e.g. 'LAUNCH100', 'PROMO50', 'GROWTHFREE'."
    )
    plan = models.ForeignKey(
        SubscriptionPlan,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="coupons",
        help_text="Specific subscription tier this coupon applies to. Leave empty for All Tiers."
    )
    discount_type = models.CharField(
        max_length=16,
        choices=DiscountType.choices,
        default=DiscountType.PERCENTAGE,
    )
    discount_value = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal("100.00"),
        help_text="Discount value (e.g. 100 for 100% free trial, 50 for 50% off, or 5000 for ₦5,000 off)."
    )
    duration_months = models.PositiveIntegerField(
        default=1,
        help_text="Number of free/discounted subscription months granted (e.g. 1, 3, 12). 0 = perpetual/lifetime."
    )
    max_uses = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Maximum total redemptions allowed. Leave blank for unlimited."
    )
    times_used = models.PositiveIntegerField(
        default=0,
        help_text="Total number of times this coupon has been successfully redeemed."
    )
    expires_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Optional expiration date. Leave blank for no expiration."
    )
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        help_text="Whether this coupon is currently active."
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_subscription_coupons",
    )

    class Meta:
        ordering = ("-created_at",)

    def __str__(self) -> str:
        tier_name = self.plan.name if self.plan else "All Tiers"
        val = f"{self.discount_value}%" if self.discount_type == self.DiscountType.PERCENTAGE else f"₦{self.discount_value}"
        return f"{self.code} ({val} off for {tier_name})"

    def clean(self):
        if self.code:
            self.code = self.code.strip().upper()

    def save(self, *args, **kwargs):
        if self.code:
            self.code = self.code.strip().upper()
        super().save(*args, **kwargs)

    def is_valid_for_plan(self, plan: SubscriptionPlan) -> tuple[bool, str]:
        if not self.is_active:
            return False, "This coupon is no longer active."
        if self.expires_at and self.expires_at < timezone.now():
            return False, "This coupon has expired."
        if self.max_uses is not None and self.times_used >= self.max_uses:
            return False, "This coupon has reached its maximum usage limit."
        if self.plan and plan and (self.plan.code.lower() != plan.code.lower()):
            return False, f"This coupon is only valid for the '{self.plan.name}' subscription tier."
        return True, ""

    def calculate_discount(self, plan_price: Decimal) -> Decimal:
        if self.discount_type == self.DiscountType.PERCENTAGE:
            discount = (plan_price * (self.discount_value / Decimal("100"))).quantize(Decimal("0.01"))
            return min(plan_price, max(Decimal("0"), discount))
        else:
            return min(plan_price, max(Decimal("0"), self.discount_value))


class SubscriptionCouponRedemption(BaseModel):
    """Audit log of coupon redemptions by users."""
    coupon = models.ForeignKey(
        SubscriptionCoupon,
        on_delete=models.CASCADE,
        related_name="redemptions",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="subscription_coupon_redemptions",
    )
    plan = models.ForeignKey(
        SubscriptionPlan,
        on_delete=models.PROTECT,
        related_name="coupon_redemptions",
    )
    discount_applied = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )
    duration_months_granted = models.PositiveIntegerField(default=1)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self) -> str:
        return f"{self.user.email} redeemed {self.coupon.code} on {self.plan.name}"

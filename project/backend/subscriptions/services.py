"""
Subscription service layer.

This module is the **single source of truth** for subscription business logic:
resolving a user's current plan, counting usage, enforcing limits, checking
feature access, and driving upgrades through Paystack.

Design goals
------------
* No plan checks are hard-coded anywhere else in the codebase. Callers ask
  this layer questions like ``assert_can_create_shop(user)`` or
  ``has_feature(user, "analytics_enabled")`` and never look at plan names.
* Limits are read from the plan row, so new plans work with zero code changes.
* A user without a subscription is transparently placed on the free plan, so
  enforcement is always well-defined.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass
from datetime import timedelta

from django.db import transaction
from django.utils import timezone

from .models import SubscriptionPlan, UserSubscription

logger = logging.getLogger(__name__)

# Stable code of the always-available fallback plan.
FREE_PLAN_CODE = "free"


class SubscriptionError(Exception):
    """Base class for subscription business-logic failures."""


class LimitReached(SubscriptionError):
    """Raised when an action would exceed the current plan's limit.

    Carries structured context so the API/UI can render a helpful upgrade
    prompt (current limit, what was exceeded, and a recommended next plan).
    """

    def __init__(self, message: str, *, limit_type: str, limit: int | None,
                 current: int, recommended_plan: "SubscriptionPlan | None" = None):
        super().__init__(message)
        self.limit_type = limit_type          # "shops" | "products"
        self.limit = limit
        self.current = current
        self.recommended_plan = recommended_plan


class FeatureNotAvailable(SubscriptionError):
    """Raised when the current plan does not include a requested feature."""

    def __init__(self, message: str, *, feature: str,
                 recommended_plan: "SubscriptionPlan | None" = None):
        super().__init__(message)
        self.feature = feature
        self.recommended_plan = recommended_plan


class DowngradeBlocked(SubscriptionError):
    """Raised when a plan switch would leave the user over the new limits.

    Carries structured context so the frontend can render a helpful message
    telling the user exactly what they need to reduce before switching.
    """

    def __init__(self, message: str, *, blockers: list[dict]):
        super().__init__(message)
        self.blockers = blockers  # [{"type": "shops", "used": 5, "limit": 2}, ...]


@dataclass
class UsageSnapshot:
    """A point-in-time view of a user's plan usage vs. limits."""

    plan: SubscriptionPlan
    subscription: UserSubscription | None
    shops_used: int
    shops_limit: int | None       # None == unlimited
    products_used: int
    products_limit: int | None    # None == unlimited

    @staticmethod
    def _remaining(used: int, limit: int | None) -> int | None:
        if limit is None:
            return None
        return max(limit - used, 0)

    @property
    def shops_remaining(self) -> int | None:
        return self._remaining(self.shops_used, self.shops_limit)

    @property
    def products_remaining(self) -> int | None:
        return self._remaining(self.products_used, self.products_limit)


# ---------------------------------------------------------------------------
# Plan resolution
# ---------------------------------------------------------------------------

def get_free_plan() -> SubscriptionPlan | None:
    return SubscriptionPlan.objects.filter(code=FREE_PLAN_CODE).first()


def get_active_subscription(user) -> UserSubscription | None:
    """Return the user's current active, non-expired subscription (if any)."""
    sub = (
        UserSubscription.objects
        .filter(user=user, status=UserSubscription.Status.ACTIVE)
        .select_related("plan")
        .first()
    )
    if sub and sub.end_date and sub.end_date < timezone.now():
        # Lazily expire a lapsed subscription.
        sub.status = UserSubscription.Status.EXPIRED
        sub.save(update_fields=["status", "updated_at"])
        return None
    return sub


def get_current_plan(user) -> SubscriptionPlan:
    """Resolve the plan governing this user, defaulting to the free plan.

    Never returns None: a user without an active subscription is treated as
    being on the free plan so enforcement is always defined.
    """
    sub = get_active_subscription(user)
    if sub:
        return sub.plan
    free = get_free_plan()
    if free is None:
        # Defensive: the free plan should always be seeded. Fall back to a
        # transient, un-saved zero-limit plan so enforcement still works.
        logger.error("No free plan seeded; using a transient restrictive plan.")
        return SubscriptionPlan(
            code=FREE_PLAN_CODE, name="Free", monthly_price=0,
            max_shops=1, max_products=5,
        )
    return free


@transaction.atomic
def ensure_subscription(user) -> UserSubscription:
    """Guarantee the user has an active subscription, creating a free one.

    Called on registration (via signal) and defensively wherever we need a
    concrete subscription row.
    """
    sub = get_active_subscription(user)
    if sub:
        return sub
    free = get_free_plan()
    if free is None:
        raise SubscriptionError(
            "No free plan configured. Run `manage.py seed_subscription_plans`."
        )
    return UserSubscription.objects.create(
        user=user,
        plan=free,
        status=UserSubscription.Status.ACTIVE,
        start_date=timezone.now(),
        end_date=None,          # free plan is open-ended
        auto_renew=False,
    )


# ---------------------------------------------------------------------------
# Usage counting
# ---------------------------------------------------------------------------

def count_shops(user) -> int:
    # Local import avoids an app-loading cycle.
    from shops.models import Shop
    return Shop.objects.filter(owner=user).count()


def count_products(user) -> int:
    from products.models import Product
    return Product.objects.filter(shop__owner=user).count()


def get_usage(user) -> UsageSnapshot:
    plan = get_current_plan(user)
    sub = get_active_subscription(user)
    return UsageSnapshot(
        plan=plan,
        subscription=sub,
        shops_used=count_shops(user),
        shops_limit=plan.max_shops,
        products_used=count_products(user),
        products_limit=plan.max_products,
    )


# ---------------------------------------------------------------------------
# Upgrade recommendation
# ---------------------------------------------------------------------------

def recommend_upgrade(current_plan: SubscriptionPlan, *, limit_type: str
                      ) -> SubscriptionPlan | None:
    """Suggest the cheapest active plan that raises the exceeded limit.

    Data-driven: picks the next plan (by price/order) whose relevant limit is
    higher than the current one (or unlimited). Works for any future plan.
    """
    field = "max_shops" if limit_type == "shops" else "max_products"
    current_limit = getattr(current_plan, field)

    candidates = (
        SubscriptionPlan.objects
        .filter(is_active=True)
        .exclude(pk=current_plan.pk)
        .order_by("display_order", "monthly_price")
    )
    for plan in candidates:
        plan_limit = getattr(plan, field)
        # Unlimited (None) always beats a finite limit.
        if plan_limit is None and current_limit is not None:
            return plan
        if plan_limit is not None and current_limit is not None and plan_limit > current_limit:
            return plan
    return None


def recommend_upgrade_for_feature(feature: str) -> SubscriptionPlan | None:
    """Cheapest active plan that enables the requested feature."""
    return (
        SubscriptionPlan.objects
        .filter(is_active=True, **{feature: True})
        .order_by("display_order", "monthly_price")
        .first()
    )


# ---------------------------------------------------------------------------
# Enforcement — the only place limits are checked
# ---------------------------------------------------------------------------

def assert_can_create_shop(user) -> None:
    """Raise :class:`LimitReached` if the user is at their shop cap."""
    plan = get_current_plan(user)
    if plan.max_shops is None:      # unlimited
        return
    used = count_shops(user)
    if used >= plan.max_shops:
        rec = recommend_upgrade(plan, limit_type="shops")
        raise LimitReached(
            f"You have reached your {plan.name} plan limit of "
            f"{plan.max_shops} shop(s)."
            + (f" Upgrade to {rec.name} to create more."
               if rec else ""),
            limit_type="shops",
            limit=plan.max_shops,
            current=used,
            recommended_plan=rec,
        )


def assert_can_create_product(user) -> None:
    """Raise :class:`LimitReached` if the user is at their product cap."""
    plan = get_current_plan(user)
    if plan.max_products is None:   # unlimited
        return
    used = count_products(user)
    if used >= plan.max_products:
        rec = recommend_upgrade(plan, limit_type="products")
        raise LimitReached(
            f"You have reached your {plan.name} plan limit of "
            f"{plan.max_products} products."
            + (f" Upgrade to {rec.name} to list more."
               if rec else ""),
            limit_type="products",
            limit=plan.max_products,
            current=used,
            recommended_plan=rec,
        )


def assert_can_switch_to_plan(user, target_plan: SubscriptionPlan) -> None:
    """Raise :class:`DowngradeBlocked` if the user's current usage exceeds
    the target plan's limits.

    Called before any plan switch so that users must reduce their resource
    usage before moving to a smaller plan.
    """
    shops_used = count_shops(user)
    products_used = count_products(user)
    blockers = []

    if target_plan.max_shops is not None and shops_used > target_plan.max_shops:
        blockers.append({
            "type": "shops",
            "used": shops_used,
            "limit": target_plan.max_shops,
            "excess": shops_used - target_plan.max_shops,
        })

    if target_plan.max_products is not None and products_used > target_plan.max_products:
        blockers.append({
            "type": "products",
            "used": products_used,
            "limit": target_plan.max_products,
            "excess": products_used - target_plan.max_products,
        })

    if blockers:
        parts = []
        for b in blockers:
            parts.append(
                f"You currently have {b['used']} {b['type']} but the "
                f"{target_plan.name} plan only allows {b['limit']}. "
                f"Please remove or deactivate {b['excess']} {b['type']} first."
            )
        raise DowngradeBlocked(" ".join(parts), blockers=blockers)


def has_feature(user, feature: str) -> bool:
    """Return whether the user's current plan includes ``feature``."""
    plan = get_current_plan(user)
    if feature not in SubscriptionPlan.FEATURE_FIELDS:
        raise ValueError(f"Unknown feature flag: {feature!r}")
    return bool(getattr(plan, feature))


def assert_has_feature(user, feature: str) -> None:
    """Raise :class:`FeatureNotAvailable` if the plan lacks ``feature``."""
    if not has_feature(user, feature):
        rec = recommend_upgrade_for_feature(feature)
        pretty = feature.replace("_enabled", "").replace("_", " ")
        raise FeatureNotAvailable(
            f"Your current plan does not include {pretty}."
            + (f" Upgrade to {rec.name} to unlock it." if rec else ""),
            feature=feature,
            recommended_plan=rec,
        )


# ---------------------------------------------------------------------------
# Upgrade / billing (Paystack)
# ---------------------------------------------------------------------------

@transaction.atomic
def activate_plan(user, plan: SubscriptionPlan, *, payment_reference: str = "",
                  provider_subscription_code: str = "",
                  provider_customer_code: str = "",
                  months: int = 1, auto_renew: bool = True
                  ) -> UserSubscription:
    """Switch the user onto ``plan``, superseding any active subscription.

    The previous active subscription (if any) is marked cancelled so the
    unique-active constraint holds and history is preserved.
    """
    now = timezone.now()

    UserSubscription.objects.filter(
        user=user, status=UserSubscription.Status.ACTIVE
    ).update(status=UserSubscription.Status.CANCELLED, cancelled_at=now,
             updated_at=now)

    end_date = None if plan.is_free else now + timedelta(days=30 * months)

    return UserSubscription.objects.create(
        user=user,
        plan=plan,
        status=UserSubscription.Status.ACTIVE,
        start_date=now,
        end_date=end_date,
        payment_reference=payment_reference,
        provider_subscription_code=provider_subscription_code,
        provider_customer_code=provider_customer_code,
        auto_renew=auto_renew and not plan.is_free,
    )


def initiate_paystack_upgrade(user, plan: SubscriptionPlan, *,
                              callback_url: str = "") -> dict:
    """Start a Paystack transaction for a paid plan upgrade.

    Returns the provider payload containing the ``authorization_url`` the
    frontend redirects to. On the free plan we activate immediately with no
    payment. Enterprise plans are not self-serve.

    The subscription is only *activated* once payment is confirmed (via the
    Paystack webhook), so this just kicks off the checkout.
    """
    if plan.is_enterprise:
        raise SubscriptionError(
            "Enterprise plans use custom pricing. Please contact sales."
        )

    if plan.is_free:
        assert_can_switch_to_plan(user, plan)
        activate_plan(user, plan, months=1, auto_renew=False)
        return {"free": True, "detail": "Switched to the free plan."}

    # Block any paid downgrade that would exceed the target plan's limits.
    assert_can_switch_to_plan(user, plan)

    # Reuse the existing Paystack gateway abstraction from the payments app.
    from payments.gateways import get_gateway

    gateway = get_gateway("paystack")
    idempotency_key = f"sub-{user.pk}-{plan.code}-{int(timezone.now().timestamp())}"
    result = gateway.charge(
        amount=plan.monthly_price,
        currency=plan.currency,
        idempotency_key=idempotency_key,
        metadata={
            "purpose": "subscription",
            "plan_code": plan.code,
            "user_id": str(user.pk),
        },
        email=user.email,
    )
    if not result.success:
        raise SubscriptionError(f"Could not start payment: {result.error_message}")

    return {
        "free": False,
        "authorization_url": result.raw_response.get("authorization_url", ""),
        "access_code": result.provider_txn_id,
        "reference": result.provider_payment_id,
        "plan": plan.code,
    }

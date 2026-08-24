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
from decimal import Decimal

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


def is_user_locked(user) -> bool:
    """
    Return True if the user is on the Free plan AND exceeds any limits.
    (This enforces the 'lockout' when a subscription expires and they drop
    back to Free but have more shops/products than Free allows).
    """
    usage = get_usage(user)
    if usage.plan.code != FREE_PLAN_CODE:
        return False
        
    shops_exceeded = usage.shops_limit is not None and usage.shops_used > usage.shops_limit
    products_exceeded = usage.products_limit is not None and usage.products_used > usage.products_limit
    
    return shops_exceeded or products_exceeded


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
                  months: int = 1, auto_renew: bool = True,
                  actual_amount_paid = None
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

    sub = UserSubscription.objects.create(
        user=user,
        plan=plan,
        status=UserSubscription.Status.ACTIVE,
        start_date=now,
        end_date=end_date,
        payment_reference=payment_reference,
        provider_subscription_code=provider_subscription_code,
        provider_customer_code=provider_customer_code,
        auto_renew=auto_renew if not plan.is_free else False,
    )

    if not plan.is_free:
        try:
            from referrals.services import process_subscription_referral_reward
            process_subscription_referral_reward(sub, actual_amount_paid=actual_amount_paid)
        except Exception as ref_err:
            logger.warning("Subscription referral reward failed for user %s: %s", user.email, ref_err)

    try:
        from core.emails import send_subscription_success_email
        send_subscription_success_email(user, plan, sub)
    except Exception as mail_err:
        logger.warning("Failed to send subscription confirmation email: %s", mail_err)

    return sub


def validate_subscription_coupon(code: str, plan: SubscriptionPlan, user=None) -> dict:
    """Validate a promo coupon for a specific subscription tier and calculate discount."""
    from .models import SubscriptionCoupon, SubscriptionCouponRedemption
    clean_code = (code or "").strip().upper()
    coupon = SubscriptionCoupon.objects.filter(code__iexact=clean_code).first()
    if not coupon:
        raise SubscriptionError(f"Coupon code '{clean_code}' is invalid.")

    is_valid, err_msg = coupon.is_valid_for_plan(plan, user=user)
    if not is_valid:
        raise SubscriptionError(err_msg)

    discount = coupon.calculate_discount(plan.monthly_price)
    final_price = max(Decimal("0.00"), plan.monthly_price - discount)
    is_100_percent_free = (final_price <= Decimal("0.00")) or (
        coupon.discount_type == SubscriptionCoupon.DiscountType.PERCENTAGE and coupon.discount_value >= Decimal("100.00")
    )

    return {
        "valid": True,
        "code": coupon.code,
        "plan_code": plan.code,
        "plan_name": plan.name,
        "target_plan_name": coupon.plan.name if coupon.plan else "All Tiers",
        "original_price": plan.monthly_price,
        "discount_applied": discount,
        "discount_type": coupon.discount_type,
        "discount_value": coupon.discount_value,
        "final_price": final_price,
        "is_100_percent_free": is_100_percent_free,
        "duration_months": coupon.duration_months,
        "expires_at": coupon.expires_at,
    }


def initiate_subscription_upgrade(user, plan: SubscriptionPlan, *,
                                  callback_url: str = "", provider: str = "",
                                  coupon_code: str = "") -> dict:
    """Start a transaction for a plan upgrade (with optional coupon discount).

    If the coupon provides 100% off or the plan is free, activates immediately.
    """
    if plan.is_enterprise:
        raise SubscriptionError(
            "Enterprise plans use custom pricing. Please contact sales."
        )

    # Block any downgrade that would exceed the target plan's limits.
    assert_can_switch_to_plan(user, plan)

    from .models import SubscriptionCoupon, SubscriptionCouponRedemption

    coupon = None
    discount = Decimal("0.00")
    final_price = plan.monthly_price
    duration_months = 1

    clean_coupon = (coupon_code or "").strip().upper()
    if clean_coupon:
        coupon_info = validate_subscription_coupon(clean_coupon, plan, user=user)
        coupon = SubscriptionCoupon.objects.filter(code=clean_coupon).first()
        discount = coupon_info["discount_applied"]
        final_price = coupon_info["final_price"]
        duration_months = coupon_info["duration_months"] or 1

        if coupon_info["is_100_percent_free"] or final_price <= Decimal("0.00"):
            # 100% Free Coupon! Activate immediately without gateway
            sub = activate_plan(user, plan, months=duration_months, auto_renew=False, actual_amount_paid=Decimal("0.00"))
            SubscriptionCouponRedemption.objects.create(
                coupon=coupon,
                user=user,
                plan=plan,
                discount_applied=discount,
                duration_months_granted=duration_months,
            )
            coupon.times_used += 1
            coupon.save(update_fields=["times_used"])

            return {
                "free": True,
                "coupon_applied": True,
                "coupon_code": coupon.code,
                "duration_months": duration_months,
                "detail": f"Coupon {coupon.code} applied! {plan.name} tier activated for {duration_months} month(s) free of charge.",
            }

    if plan.is_free and final_price <= Decimal("0.00"):
        activate_plan(user, plan, months=1, auto_renew=False)
        return {"free": True, "detail": "Switched to the free plan."}

    from django.conf import settings
    from payments.gateways import get_gateway

    chosen_provider = (provider or "").strip().lower()

    if not chosen_provider:
        paystack_key = settings.PAYMENTS.get("PAYSTACK", {}).get("SECRET_KEY", "")
        monnify_key = settings.PAYMENTS.get("MONNIFY", {}).get("API_KEY", "")

        if paystack_key:
            chosen_provider = "paystack"
        elif monnify_key:
            chosen_provider = "monnify"
        else:
            chosen_provider = "paystack"

    gateway = get_gateway(chosen_provider)
    idempotency_key = f"sub-{user.pk}-{plan.code}-{int(timezone.now().timestamp())}"
    result = gateway.charge(
        amount=final_price,
        currency=plan.currency,
        idempotency_key=idempotency_key,
        redirect_url=callback_url,
        callback_url=callback_url,
        metadata={
            "purpose": "subscription",
            "plan_code": plan.code,
            "user_id": str(user.pk),
            "callback_url": callback_url,
            "coupon_code": coupon.code if coupon else "",
            "duration_months": duration_months,
            "discount_applied": str(discount),
        },
        email=user.email,
        full_name=user.get_full_name() or user.username or "Customer",
    )
    # Create a Payment record so webhook & return verification can confirm it
    from payments.models import Payment

    payment = Payment.objects.create(
        user=user,
        provider=chosen_provider,
        provider_payment_id=result.provider_payment_id or idempotency_key,
        amount=final_price,
        currency=plan.currency,
        status=Payment.Status.PENDING,
        metadata={
            "purpose": "subscription",
            "plan_code": plan.code,
            "user_id": str(user.pk),
            "callback_url": callback_url,
            "coupon_code": coupon.code if coupon else "",
            "duration_months": duration_months,
            "discount_applied": str(discount),
        },
    )

    auth_url = (
        result.raw_response.get("authorization_url")
        or result.raw_response.get("checkout_url")
        or ""
    )

    return {
        "free": False,
        "provider": chosen_provider,
        "authorization_url": auth_url,
        "checkout_url": auth_url,
        "access_code": result.provider_txn_id,
        "reference": result.provider_payment_id or idempotency_key,
        "payment_id": str(payment.pk),
        "plan": plan.code,
        "discount_applied": str(discount),
        "final_price": str(final_price),
    }


def verify_and_activate_subscription(payment_ref: str, provider: str = "") -> dict:
    """Verify subscription payment with provider gateway API and activate plan."""
    from payments.models import Payment
    from payments.gateways import get_gateway
    from django.conf import settings as django_settings
    from django.db.models import Q
    import requests as http_requests

    payment = (
        Payment.objects.filter(provider_payment_id=payment_ref).first()
        or Payment.objects.filter(provider_payment_id__iexact=payment_ref).first()
        or Payment.objects.filter(provider_payment_id__icontains=payment_ref).first()
    )

    if not payment and payment_ref.isdigit():
        payment = Payment.objects.filter(pk=int(payment_ref)).first()

    if not payment:
        # Check if user has an active pending subscription payment
        payment = Payment.objects.filter(
            status=Payment.Status.PENDING,
            metadata__purpose="subscription"
        ).order_by("-created_at").first()

    if not payment:
        raise SubscriptionError("Payment record not found for this reference.")

    user = payment.user
    plan_code = payment.metadata.get("plan_code", "") if isinstance(payment.metadata, dict) else ""
    plan = SubscriptionPlan.objects.filter(code=plan_code).first()
    if not plan:
        raise SubscriptionError("Target plan not found.")

    duration_months = int(payment.metadata.get("duration_months") or 1) if isinstance(payment.metadata, dict) else 1

    if payment.status == Payment.Status.CAPTURED:
        activate_plan(user, plan, months=duration_months, actual_amount_paid=payment.amount)
        return {
            "status": "already_active",
            "detail": f"Plan {plan.name} is active.",
            "plan": plan.code,
            "payment_id": str(payment.pk),
            "receipt_url": f"/api/payments/receipt/{payment.pk}/html/",
        }

    # Server-side verification with Payment Provider (Paystack or Monnify)
    chosen_provider = payment.provider or provider or "monnify"
    verified_paid = False

    if chosen_provider == "paystack":
        secret_key = django_settings.PAYMENTS.get("PAYSTACK", {}).get("SECRET_KEY", "")
        if secret_key:
            try:
                resp = http_requests.get(
                    f"https://api.paystack.co/transaction/verify/{payment_ref}",
                    headers={
                        "Authorization": f"Bearer {secret_key}",
                        "Content-Type": "application/json",
                    },
                    timeout=15,
                )
                data = resp.json()
                if data.get("status") and data.get("data", {}).get("status") == "success":
                    paid_kobo = data.get("data", {}).get("amount", 0)
                    expected_kobo = int(payment.amount * 100)
                    if paid_kobo >= expected_kobo:
                        verified_paid = True
                    else:
                        raise SubscriptionError("Underpayment detected. Subscription could not be activated.")
            except SubscriptionError:
                raise
            except Exception as e:
                logger.warning("Paystack subscription verify failed: %s", e)

    elif chosen_provider == "monnify":
        gateway = get_gateway("monnify")
        token = gateway._get_access_token()
        if token:
            base_url = django_settings.PAYMENTS.get("MONNIFY", {}).get("BASE_URL", "").rstrip("/")
            import urllib.parse
            encoded_ref = urllib.parse.quote(payment_ref)
            try:
                resp = http_requests.get(
                    f"{base_url}/api/v2/transactions/searchByPaymentReference?paymentReference={encoded_ref}",
                    headers={
                        "Authorization": f"Bearer {token}",
                        "Content-Type": "application/json",
                    },
                    timeout=15,
                    verify=False,
                )
                data = resp.json()
                body = data.get("responseBody", {})
                if body.get("paymentStatus") in ("PAID", "SUCCESS", "OVERPAID"):
                    paid_amount = Decimal(str(body.get("amountPaid", "0")))
                    if paid_amount >= payment.amount:
                        verified_paid = True
                    else:
                        raise SubscriptionError("Underpayment detected. Subscription could not be activated.")
                else:
                    # Fallback query by transactionReference if different
                    txn_ref = body.get("transactionReference") or payment_ref
                    resp_v1 = http_requests.get(
                        f"{base_url}/api/v1/merchant/transactions/query?paymentReference={encoded_ref}",
                        headers={
                            "Authorization": f"Bearer {token}",
                            "Content-Type": "application/json",
                        },
                        timeout=15,
                        verify=False,
                    )
                    v1_body = resp_v1.json().get("responseBody", {})
                    if v1_body.get("paymentStatus") in ("PAID", "SUCCESS", "OVERPAID"):
                        paid_amount = Decimal(str(v1_body.get("amountPaid", "0")))
                        if paid_amount >= payment.amount:
                            verified_paid = True
            except SubscriptionError:
                raise
            except Exception as e:
                logger.warning("Monnify subscription verify failed: %s", e)

    # In local development DEBUG mode only, allow sandbox bypass if running local tests
    if not verified_paid and django_settings.DEBUG:
        logger.info("DEBUG mode: activating sandbox subscription test.")
        verified_paid = True

    if not verified_paid:
        raise SubscriptionError("Payment has not been confirmed by the payment gateway.")

    # Mark as captured and activate plan
    payment.status = Payment.Status.CAPTURED
    payment.captured_at = timezone.now()
    payment.save(update_fields=["status", "captured_at"])

    # Record coupon redemption and increment usage if coupon was applied
    coupon_code = payment.metadata.get("coupon_code", "") if isinstance(payment.metadata, dict) else ""
    if coupon_code:
        try:
            from .models import SubscriptionCoupon, SubscriptionCouponRedemption
            from django.db.models import F
            coupon = SubscriptionCoupon.objects.filter(code__iexact=str(coupon_code).strip()).first()
            if coupon:
                discount_val = Decimal(str(payment.metadata.get("discount_applied") or "0.00"))
                redemption_created = SubscriptionCouponRedemption.objects.get_or_create(
                    coupon=coupon,
                    user=user,
                    defaults={
                        "plan": plan,
                        "discount_applied": discount_val,
                        "duration_months_granted": duration_months,
                    }
                )[1]
                if redemption_created:
                    SubscriptionCoupon.objects.filter(pk=coupon.pk).update(times_used=F("times_used") + 1)
        except Exception as c_err:
            logger.warning("Failed to record coupon redemption audit for %s: %s", coupon_code, c_err)

    activate_plan(user, plan, months=duration_months, actual_amount_paid=payment.amount)

    return {
        "status": "activated",
        "detail": f"Payment verified! Upgraded to {plan.name}.",
        "plan": plan.code,
        "payment_id": str(payment.pk),
        "receipt_url": f"/api/payments/receipt/{payment.pk}/html/",
    }


# Maintain backwards compatibility
initiate_paystack_upgrade = initiate_subscription_upgrade



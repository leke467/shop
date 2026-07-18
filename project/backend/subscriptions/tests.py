"""
Subscription tests — limits, feature gating, API, and upgrade flow.
"""
from decimal import Decimal

import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from shops.models import Shop
from subscriptions.models import SubscriptionPlan, UserSubscription
from subscriptions import services

User = get_user_model()


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def plans(db):
    """Seed the standard plan set via the management command."""
    from django.core.management import call_command
    call_command("seed_subscription_plans")
    return {p.code: p for p in SubscriptionPlan.objects.all()}


@pytest.fixture
def user(db):
    return User.objects.create_user(
        email="seller@example.com", username="seller", password="securepass123"
    )


def make_shop(owner, name):
    return Shop.objects.create(owner=owner, name=name, status=Shop.Status.ACTIVE)


# ---------------------------------------------------------------------------
# Plan resolution & defaults
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_new_user_gets_free_plan(plans, user):
    plan = services.get_current_plan(user)
    assert plan.code == "free"
    assert plan.max_shops == 1
    assert plan.max_products == 5


@pytest.mark.django_db
def test_signal_creates_active_subscription(plans):
    u = User.objects.create_user(email="new@example.com", username="new",
                                 password="securepass123")
    sub = UserSubscription.objects.filter(user=u, status="active").first()
    assert sub is not None
    assert sub.plan.code == "free"


@pytest.mark.django_db
def test_free_plan_fallback_without_subscription(user):
    # No plans seeded and no subscription — enforcement must still be defined.
    plan = services.get_current_plan(user)
    assert plan.max_shops == 1


# ---------------------------------------------------------------------------
# Shop limits
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_free_plan_blocks_second_shop(plans, user):
    make_shop(user, "First Shop")
    with pytest.raises(services.LimitReached) as exc:
        services.assert_can_create_shop(user)
    assert exc.value.limit_type == "shops"
    assert exc.value.limit == 1
    # Recommends a higher plan.
    assert exc.value.recommended_plan is not None


@pytest.mark.django_db
def test_starter_plan_allows_two_shops(plans, user):
    services.activate_plan(user, plans["starter"])
    make_shop(user, "Shop 1")
    # Second shop is still within the limit of 2.
    services.assert_can_create_shop(user)  # should not raise
    make_shop(user, "Shop 2")
    with pytest.raises(services.LimitReached):
        services.assert_can_create_shop(user)


@pytest.mark.django_db
def test_business_plan_unlimited_shops(plans, user):
    services.activate_plan(user, plans["business"])
    for i in range(6):
        make_shop(user, f"Shop {i}")
    # Unlimited — never raises.
    services.assert_can_create_shop(user)


# ---------------------------------------------------------------------------
# Product limits
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_free_plan_blocks_sixth_product(plans, user):
    shop = make_shop(user, "Shop")
    from products.models import Product
    for i in range(5):
        Product.objects.create(shop=shop, name=f"P{i}", base_price=Decimal("10"))
    with pytest.raises(services.LimitReached) as exc:
        services.assert_can_create_product(user)
    assert exc.value.limit_type == "products"
    assert exc.value.limit == 5


@pytest.mark.django_db
def test_products_counted_across_all_shops(plans, user):
    services.activate_plan(user, plans["starter"])   # 50 products
    from products.models import Product
    shop_a = make_shop(user, "A")
    shop_b = make_shop(user, "B")
    Product.objects.create(shop=shop_a, name="a1", base_price=Decimal("5"))
    Product.objects.create(shop=shop_b, name="b1", base_price=Decimal("5"))
    usage = services.get_usage(user)
    assert usage.products_used == 2
    assert usage.products_remaining == 48


# ---------------------------------------------------------------------------
# Feature gating
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_feature_access_by_plan(plans, user):
    # Free: no analytics.
    assert services.has_feature(user, "analytics_enabled") is False
    services.activate_plan(user, plans["growth"])
    assert services.has_feature(user, "analytics_enabled") is True


@pytest.mark.django_db
def test_assert_feature_recommends_upgrade(plans, user):
    with pytest.raises(services.FeatureNotAvailable) as exc:
        services.assert_has_feature(user, "staff_accounts_enabled")
    assert exc.value.recommended_plan.code == "business"


@pytest.mark.django_db
def test_unknown_feature_raises(plans, user):
    with pytest.raises(ValueError):
        services.has_feature(user, "does_not_exist")


# ---------------------------------------------------------------------------
# Upgrade / activate
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_activate_plan_supersedes_previous(plans, user):
    services.activate_plan(user, plans["starter"])
    services.activate_plan(user, plans["growth"])
    active = UserSubscription.objects.filter(user=user, status="active")
    assert active.count() == 1
    assert active.first().plan.code == "growth"
    # Previous one is cancelled, not deleted (history preserved).
    assert UserSubscription.objects.filter(user=user, status="cancelled").count() == 1


@pytest.mark.django_db
def test_recommend_upgrade_is_data_driven(plans, user):
    free = plans["free"]
    rec = services.recommend_upgrade(free, limit_type="products")
    # Cheapest plan with a higher product cap than 5 is Starter (50).
    assert rec.code == "starter"


# ---------------------------------------------------------------------------
# API endpoints
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_plans_endpoint_is_public(api_client, plans):
    url = reverse("subscription-plans")
    resp = api_client.get(url)
    assert resp.status_code == status.HTTP_200_OK
    assert len(resp.data) == 5


@pytest.mark.django_db
def test_current_endpoint_requires_auth(api_client, plans):
    url = reverse("subscription-current")
    assert api_client.get(url).status_code in (
        status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN
    )


@pytest.mark.django_db
def test_current_endpoint_returns_usage(api_client, plans, user):
    make_shop(user, "Shop")
    api_client.force_authenticate(user=user)
    resp = api_client.get(reverse("subscription-current"))
    assert resp.status_code == status.HTTP_200_OK
    assert resp.data["plan"]["code"] == "free"
    assert resp.data["shops_used"] == 1
    assert resp.data["shops_remaining"] == 0
    assert resp.data["products_used"] == 0
    assert resp.data["products_remaining"] == 5


@pytest.mark.django_db
def test_upgrade_to_free_is_immediate(api_client, plans, user):
    services.activate_plan(user, plans["starter"])
    api_client.force_authenticate(user=user)
    resp = api_client.post(reverse("subscription-upgrade"), {"plan_code": "free"})
    assert resp.status_code == status.HTTP_200_OK
    assert resp.data.get("free") is True
    assert services.get_current_plan(user).code == "free"


@pytest.mark.django_db
def test_upgrade_enterprise_blocked(api_client, plans, user):
    api_client.force_authenticate(user=user)
    resp = api_client.post(reverse("subscription-upgrade"), {"plan_code": "enterprise"})
    assert resp.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
def test_admin_stats_requires_staff(api_client, plans, user):
    api_client.force_authenticate(user=user)
    assert api_client.get(reverse("subscription-admin-stats")).status_code == (
        status.HTTP_403_FORBIDDEN
    )


@pytest.mark.django_db
def test_admin_stats_mrr(api_client, plans):
    admin = User.objects.create_superuser(
        email="admin@example.com", password="securepass123"
    )
    buyer = User.objects.create_user(
        email="b@example.com", username="b", password="securepass123"
    )
    services.activate_plan(buyer, plans["growth"])   # 7500
    api_client.force_authenticate(user=admin)
    resp = api_client.get(reverse("subscription-admin-stats"))
    assert resp.status_code == status.HTTP_200_OK
    assert Decimal(resp.data["monthly_recurring_revenue"]) >= Decimal("7500")
    assert resp.data["total_paying_users"] >= 1

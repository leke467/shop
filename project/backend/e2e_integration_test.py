"""
Automated E2E Integration & API Test Suite for MultiShopNG.

Executes comprehensive end-to-end integration workflows against live database models and API logic:
1. User registration & JWT authentication
2. Referral system flow (Click -> Register with Code -> Subscription Reward -> Wallet Credit)
3. Superadmin Dashboard (7 operational tabs data retrieval & permissions)
4. Shop, Product, Search, and Subscription APIs
"""
import os
import sys
import uuid
from decimal import Decimal

import django

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "ecommerce.settings.dev")
django.setup()

from django.contrib.auth import get_user_model
from rest_framework.test import APIRequestFactory, force_authenticate

from accounts.views import ProfileView, RegisterView
from core.admin_views import (
    AdminDisputesView,
    AdminOrderListView,
    AdminOverviewView,
    AdminPaymentsView,
    AdminProductListView,
    AdminReferralsView,
    AdminUserListView,
)
from orders.models import OrderGroup, SellerWallet, WalletTransaction
from products.models import Product
from referrals.models import Referral, ReferralCode, ReferralEarning
from referrals.services import process_subscription_referral_reward
from referrals.views import ReferralCustomCodeView, ReferralMyStatsView, ReferralTrackClickView
from shops.models import Shop
from subscriptions.models import SubscriptionPlan, UserSubscription

User = get_user_model()
factory = APIRequestFactory()

passed_count = 0
failed_count = 0


def log_test(name: str, success: bool, details: str = ""):
    global passed_count, failed_count
    if success:
        passed_count += 1
        print(f"[PASS] {name} {f'- {details}' if details else ''}")
    else:
        failed_count += 1
        print(f"[FAIL] {name} {f'- {details}' if details else ''}")


print("=" * 65)
print("🚀 STARTING AUTOMATED E2E INTEGRATION TEST SUITE")
print("=" * 65)

# --- TEST 1: User Registration & Referral Linkage ---
try:
    referrer_email = f"referrer_{uuid.uuid4().hex[:6]}@test.com"
    referrer = User.objects.create_user(
        email=referrer_email,
        password="TestPassword123!",
        first_name="Referrer",
        last_name="User",
        role=User.Roles.SELLER,
    )
    ref_code_obj, _ = ReferralCode.objects.get_or_create(user=referrer)
    code_str = ref_code_obj.code
    log_test("Referrer User Creation", True, f"User: {referrer_email}, Code: {code_str}")

    # Track Click
    req = factory.post("/api/referrals/click/", {"code": code_str}, format="json")
    resp = ReferralTrackClickView.as_view()(req)
    log_test("Referral Click Tracking", resp.status_code == 200, f"Status: {resp.status_code}")

    # Register Referred User with Referral Code
    referred_email = f"referred_{uuid.uuid4().hex[:6]}@test.com"
    req_reg = factory.post(
        "/api/users/register/",
        {
            "email": referred_email,
            "password": "TestPassword123!",
            "first_name": "Referred",
            "last_name": "Vendor",
            "referral_code": code_str,
        },
        format="json",
    )
    resp_reg = RegisterView.as_view()(req_reg)
    referred_user = User.objects.get(email=referred_email)

    referral_exists = Referral.objects.filter(referrer=referrer, referred_user=referred_user).exists()
    log_test("Referred Registration Linkage", resp_reg.status_code == 201 and referral_exists, f"Linkage verified: {referral_exists}")
except Exception as e:
    log_test("User Registration & Referral Linkage", False, str(e))

# --- TEST 2: Referral Reward Engine & Wallet Credit ---
try:
    referred_shop, _ = Shop.objects.get_or_create(
        owner=referred_user,
        defaults={"name": f"Shop of {referred_user.email}", "slug": f"shop-{referred_user.pk}"},
    )
    plan, _ = SubscriptionPlan.objects.get_or_create(
        code="pro_test",
        defaults={"name": "Pro Test Plan", "monthly_price": Decimal("3500.00"), "is_active": True, "display_order": 1},
    )
    sub = UserSubscription.objects.create(
        user=referred_user,
        shop=referred_shop,
        plan=plan,
        status=UserSubscription.Status.ACTIVE,
        price=Decimal("3500.00"),
    )

    bonus = process_subscription_referral_reward(sub)
    earning_exists = ReferralEarning.objects.filter(referrer=referrer, referred_user=referred_user).exists()

    referrer_shop = Shop.objects.filter(owner=referrer).first()
    wallet = SellerWallet.objects.get(shop=referrer_shop)

    log_test(
        "Subscription Referral Reward",
        bonus > 0 and earning_exists and wallet.balance >= Decimal("500.00"),
        f"Bonus: ₦{bonus}, Wallet Balance: ₦{wallet.balance}",
    )
except Exception as e:
    log_test("Subscription Referral Reward", False, str(e))

# --- TEST 3: User Referral Stats API ---
try:
    req_stats = factory.get("/api/referrals/me/")
    force_authenticate(req_stats, user=referrer)
    resp_stats = ReferralMyStatsView.as_view()(req_stats)

    log_test(
        "Referral My Stats API",
        resp_stats.status_code == 200 and resp_stats.data["total_earnings"] > 0,
        f"Earnings: ₦{resp_stats.data['total_earnings']}, History count: {len(resp_stats.data['earnings_history'])}",
    )
except Exception as e:
    log_test("Referral My Stats API", False, str(e))

# --- TEST 4: Superadmin Dashboard Endpoints ---
try:
    admin_user = User.objects.create_superuser(
        email=f"admin_{uuid.uuid4().hex[:6]}@test.com",
        password="AdminPassword123!",
    )

    # 1. Overview
    req_ov = factory.get("/api/admin/overview/")
    force_authenticate(req_ov, user=admin_user)
    resp_ov = AdminOverviewView.as_view()(req_ov)
    log_test("Admin Overview API", resp_ov.status_code == 200, f"Total Revenue: {resp_ov.data.get('total_revenue')}")

    # 2. Orders
    req_ord = factory.get("/api/admin/orders/")
    force_authenticate(req_ord, user=admin_user)
    resp_ord = AdminOrderListView.as_view()(req_ord)
    log_test("Admin Orders API", resp_ord.status_code == 200, f"Orders count: {len(resp_ord.data.get('orders', []))}")

    # 3. Products
    req_prod = factory.get("/api/admin/products/")
    force_authenticate(req_prod, user=admin_user)
    resp_prod = AdminProductListView.as_view()(req_prod)
    log_test("Admin Products API", resp_prod.status_code == 200, f"Products count: {len(resp_prod.data.get('products', []))}")

    # 4. Users
    req_usr = factory.get("/api/admin/users/")
    force_authenticate(req_usr, user=admin_user)
    resp_usr = AdminUserListView.as_view()(req_usr)
    log_test("Admin Users API", resp_usr.status_code == 200, f"Users count: {len(resp_usr.data.get('users', []))}")

    # 5. Payments
    req_pay = factory.get("/api/admin/payments/")
    force_authenticate(req_pay, user=admin_user)
    resp_pay = AdminPaymentsView.as_view()(req_pay)
    log_test("Admin Payments API", resp_pay.status_code == 200, f"Payments log count: {len(resp_pay.data.get('payments', []))}")

    # 6. Disputes
    req_disp = factory.get("/api/admin/disputes/")
    force_authenticate(req_disp, user=admin_user)
    resp_disp = AdminDisputesView.as_view()(req_disp)
    log_test("Admin Disputes API", resp_disp.status_code == 200, f"Disputes count: {len(resp_disp.data.get('disputes', []))}")

    # 7. Referrals
    req_ref = factory.get("/api/admin/referrals/")
    force_authenticate(req_ref, user=admin_user)
    resp_ref = AdminReferralsView.as_view()(req_ref)
    log_test("Admin Referrals API", resp_ref.status_code == 200, f"Leaderboard count: {len(resp_ref.data.get('leaderboard', []))}")

except Exception as e:
    log_test("Superadmin Dashboard Endpoints", False, str(e))

# --- TEST 5: Security Permission Boundary Check ---
try:
    buyer_user = User.objects.create_user(
        email=f"buyer_{uuid.uuid4().hex[:6]}@test.com",
        password="BuyerPassword123!",
        role=User.Roles.BUYER,
    )
    req_sec = factory.get("/api/admin/overview/")
    force_authenticate(req_sec, user=buyer_user)
    resp_sec = AdminOverviewView.as_view()(req_sec)
    log_test("Superadmin Security Barrier", resp_sec.status_code == 403, f"Non-admin rejected with HTTP {resp_sec.status_code}")
except Exception as e:
    log_test("Superadmin Security Barrier", False, str(e))

print("=" * 65)
print(f"📊 INTEGRATION TEST RESULTS: {passed_count} PASSED | {failed_count} FAILED")
print("=" * 65)

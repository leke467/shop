from django.urls import path

from .views import (
    AdminChangePlanView,
    AdminPlanDetailView,
    AdminPlanListCreateView,
    AdminStatsView,
    AdminSubscriptionListView,
    AdminSubscriptionCouponListCreateView,
    AdminSubscriptionCouponDetailView,
    AdminSubscriptionCouponRedemptionListView,
    CurrentSubscriptionView,
    MySubscriptionsView,
    PlanListView,
    UpgradeView,
    ValidateSubscriptionCouponView,
    VerifySubscriptionPaymentView,
)

urlpatterns = [
    # Public / seller
    path("plans/", PlanListView.as_view(), name="subscription-plans"),
    path("current/", CurrentSubscriptionView.as_view(), name="subscription-current"),
    path("mine/", MySubscriptionsView.as_view(), name="subscription-mine"),
    path("upgrade/", UpgradeView.as_view(), name="subscription-upgrade"),
    path("validate-coupon/", ValidateSubscriptionCouponView.as_view(), name="subscription-validate-coupon"),
    path("verify-payment/", VerifySubscriptionPaymentView.as_view(), name="subscription-verify-payment"),

    # Admin
    path("admin/plans/", AdminPlanListCreateView.as_view(), name="subscription-admin-plans"),
    path("admin/plans/<slug:code>/", AdminPlanDetailView.as_view(), name="subscription-admin-plan-detail"),
    path("admin/subscriptions/", AdminSubscriptionListView.as_view(), name="subscription-admin-list"),
    path("admin/change-plan/", AdminChangePlanView.as_view(), name="subscription-admin-change-plan"),
    path("admin/stats/", AdminStatsView.as_view(), name="subscription-admin-stats"),
    path("admin/coupons/", AdminSubscriptionCouponListCreateView.as_view(), name="subscription-admin-coupons"),
    path("admin/coupons/<int:pk>/", AdminSubscriptionCouponDetailView.as_view(), name="subscription-admin-coupon-detail"),
    path("admin/coupon-redemptions/", AdminSubscriptionCouponRedemptionListView.as_view(), name="subscription-admin-coupon-redemptions"),
]

from django.urls import path

from .views import (
    AdminChangePlanView,
    AdminPlanDetailView,
    AdminPlanListCreateView,
    AdminStatsView,
    AdminSubscriptionListView,
    CurrentSubscriptionView,
    MySubscriptionsView,
    PlanListView,
    UpgradeView,
)

urlpatterns = [
    # Public / seller
    path("plans/", PlanListView.as_view(), name="subscription-plans"),
    path("current/", CurrentSubscriptionView.as_view(), name="subscription-current"),
    path("mine/", MySubscriptionsView.as_view(), name="subscription-mine"),
    path("upgrade/", UpgradeView.as_view(), name="subscription-upgrade"),

    # Admin
    path("admin/plans/", AdminPlanListCreateView.as_view(), name="subscription-admin-plans"),
    path("admin/plans/<slug:code>/", AdminPlanDetailView.as_view(), name="subscription-admin-plan-detail"),
    path("admin/subscriptions/", AdminSubscriptionListView.as_view(), name="subscription-admin-list"),
    path("admin/change-plan/", AdminChangePlanView.as_view(), name="subscription-admin-change-plan"),
    path("admin/stats/", AdminStatsView.as_view(), name="subscription-admin-stats"),
]

"""
Superadmin Dashboard API URLs.
"""
from django.urls import path

from core.admin_views import (
    AdminDisputesView,
    AdminOrderListView,
    AdminOverviewView,
    AdminPaymentsView,
    AdminProductListView,
    AdminReferralsView,
    AdminTestEmailsView,
    AdminUserListView,
)

urlpatterns = [
    path("overview/", AdminOverviewView.as_view(), name="admin-overview"),
    path("test-emails/", AdminTestEmailsView.as_view(), name="admin-test-emails"),
    path("orders/", AdminOrderListView.as_view(), name="admin-orders"),
    path("orders/<int:pk>/", AdminOrderListView.as_view(), name="admin-order-detail"),
    path("products/", AdminProductListView.as_view(), name="admin-products"),
    path("products/<int:pk>/", AdminProductListView.as_view(), name="admin-product-detail"),
    path("users/", AdminUserListView.as_view(), name="admin-users"),
    path("users/<int:pk>/", AdminUserListView.as_view(), name="admin-user-detail"),
    path("payments/", AdminPaymentsView.as_view(), name="admin-payments"),
    path("disputes/", AdminDisputesView.as_view(), name="admin-disputes"),
    path("disputes/<int:pk>/", AdminDisputesView.as_view(), name="admin-dispute-detail"),
    path("referrals/", AdminReferralsView.as_view(), name="admin-referrals"),
]

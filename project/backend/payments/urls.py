from django.urls import path

from .views import (
    AdminRefundRequestActionView,
    AdminRefundRequestListView,
    BankTransferAccountsView,
    BankTransferConfirmView,
    BankTransferStatusView,
    CheckoutView,
    MonnifyVerifyView,
    MonnifyWebhookView,
    PaymentReceiptDownloadView,
    PaymentReceiptView,
    PaystackVerifyView,
    PaystackWebhookView,
    RefundRequestView,
    StripeWebhookView,
)

urlpatterns = [
    path("checkout/", CheckoutView.as_view(), name="checkout"),
    path(
        "receipt/<str:pk>/",
        PaymentReceiptView.as_view(),
        name="payment-receipt",
    ),
    path(
        "receipt/<str:pk>/html/",
        PaymentReceiptDownloadView.as_view(),
        name="payment-receipt-download",
    ),
    path(
        "bank-transfer/accounts/",
        BankTransferAccountsView.as_view(),
        name="bank-transfer-accounts",
    ),
    path(
        "bank-transfer/status/<str:order_public_id>/",
        BankTransferStatusView.as_view(),
        name="bank-transfer-status",
    ),
    path(
        "bank-transfer/confirm/",
        BankTransferConfirmView.as_view(),
        name="bank-transfer-confirm",
    ),
    path(
        "paystack/verify/<str:reference>/",
        PaystackVerifyView.as_view(),
        name="paystack-verify",
    ),
    path(
        "monnify/verify/<str:reference>/",
        MonnifyVerifyView.as_view(),
        name="monnify-verify",
    ),
    path("webhooks/stripe/", StripeWebhookView.as_view(), name="stripe-webhook"),
    path("webhooks/paystack/", PaystackWebhookView.as_view(), name="paystack-webhook"),
    path("webhooks/monnify/", MonnifyWebhookView.as_view(), name="monnify-webhook"),

    # Refund Requests (Buyer & Admin)
    path("refund-requests/", RefundRequestView.as_view(), name="refund-requests"),
    path("admin/refund-requests/", AdminRefundRequestListView.as_view(), name="admin-refund-requests"),
    path(
        "admin/refund-requests/<uuid:public_id>/action/",
        AdminRefundRequestActionView.as_view(),
        name="admin-refund-request-action",
    ),
]

from django.urls import path

from .views import (
    CartItemDeleteView,
    CartView,
    CancelOrderView,
    ConfirmDeliveryView,
    DeliveryCodeView,
    DisputeOrderView,
    OrderDetailView,
    OrderListView,
    SellerWalletView,
    ShopOrdersView,
    UpdateFulfillmentStatusView,
    SellerBankAccountListCreateView,
    SellerBankAccountDetailView,
    PayoutRequestCreateView,
    PayoutRequestListView,
    CouponApplyView,
    CouponListCreateView,
    CouponDetailView,
)

urlpatterns = [
    # Cart
    path("cart/", CartView.as_view(), name="cart"),
    path("cart/items/<int:item_id>/", CartItemDeleteView.as_view(), name="cart-item-delete"),
    # Orders
    path("", OrderListView.as_view(), name="order-list"),
    path("<uuid:public_id>/", OrderDetailView.as_view(), name="order-detail"),
    path("<uuid:public_id>/cancel/", CancelOrderView.as_view(), name="order-cancel"),
    # Escrow & Delivery Code
    path("<uuid:public_id>/delivery-codes/", DeliveryCodeView.as_view(), name="delivery-codes"),
    path("groups/<int:group_id>/confirm-delivery/", ConfirmDeliveryView.as_view(), name="confirm-delivery"),
    path("groups/<int:group_id>/status/", UpdateFulfillmentStatusView.as_view(), name="update-fulfillment-status"),
    path("groups/<int:group_id>/dispute/", DisputeOrderView.as_view(), name="dispute-order"),
    # Seller Wallet
    path("wallet/<slug:shop_slug>/", SellerWalletView.as_view(), name="seller-wallet"),
    # Bank Accounts & Payouts
    path("bank-accounts/", SellerBankAccountListCreateView.as_view(), name="bank-account-list"),
    path("bank-accounts/<int:pk>/", SellerBankAccountDetailView.as_view(), name="bank-account-detail"),
    path("payouts/", PayoutRequestListView.as_view(), name="payout-list"),
    path("payouts/request/", PayoutRequestCreateView.as_view(), name="payout-request"),
    # Coupons
    path("coupon/apply/", CouponApplyView.as_view(), name="coupon-apply"),
    path("coupons/<slug:shop_slug>/", CouponListCreateView.as_view(), name="coupon-list"),
    path("coupons/<slug:shop_slug>/<int:pk>/", CouponDetailView.as_view(), name="coupon-detail"),
    # Shop Orders (for seller dashboard)
    path("shop-orders/<slug:shop_slug>/", ShopOrdersView.as_view(), name="shop-orders"),
]

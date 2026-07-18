from django.urls import path

from .views import (
    CartItemDeleteView,
    CartView,
    ConfirmDeliveryView,
    DeliveryCodeView,
    DisputeOrderView,
    OrderDetailView,
    OrderListView,
    SellerWalletView,
    ShopOrdersView,
)

urlpatterns = [
    # Cart
    path("cart/", CartView.as_view(), name="cart"),
    path("cart/items/<int:item_id>/", CartItemDeleteView.as_view(), name="cart-item-delete"),
    # Orders
    path("", OrderListView.as_view(), name="order-list"),
    path("<uuid:public_id>/", OrderDetailView.as_view(), name="order-detail"),
    # Escrow & Delivery Code
    path("<uuid:public_id>/delivery-codes/", DeliveryCodeView.as_view(), name="delivery-codes"),
    path("groups/<int:group_id>/confirm-delivery/", ConfirmDeliveryView.as_view(), name="confirm-delivery"),
    path("groups/<int:group_id>/dispute/", DisputeOrderView.as_view(), name="dispute-order"),
    # Seller Wallet
    path("wallet/<slug:shop_slug>/", SellerWalletView.as_view(), name="seller-wallet"),
    # Shop Orders (for seller dashboard)
    path("shop-orders/<slug:shop_slug>/", ShopOrdersView.as_view(), name="shop-orders"),
]

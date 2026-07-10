from django.urls import path

from .views import CartItemDeleteView, CartView, OrderDetailView, OrderListView

urlpatterns = [
    # Cart
    path("cart/", CartView.as_view(), name="cart"),
    path("cart/items/<int:item_id>/", CartItemDeleteView.as_view(), name="cart-item-delete"),
    # Orders
    path("", OrderListView.as_view(), name="order-list"),
    path("<uuid:public_id>/", OrderDetailView.as_view(), name="order-detail"),
]

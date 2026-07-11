from django.urls import path

from .views import (
    CategoryListView,
    ProductDetailView,
    ProductListView,
    ProductReviewListCreateView,
    ShopProductListView,
)

urlpatterns = [
    path("", ProductListView.as_view(), name="product-list"),
    path("categories/", CategoryListView.as_view(), name="category-list"),
    path("<str:lookup>/", ProductDetailView.as_view(), name="product-detail"),
    path("<str:lookup>/reviews/", ProductReviewListCreateView.as_view(), name="product-reviews"),
    # Shop-scoped: /api/shops/<slug>/products/  (included from shops urls or root)
    path("shop/<slug:slug>/", ShopProductListView.as_view(), name="shop-product-list"),
]

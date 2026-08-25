from django.urls import path

from .views import (
    CategoryListView,
    ProductDetailView,
    ProductListView,
    ProductRestockView,
    ProductReviewListCreateView,
    ShopProductListView,
    ProductImageUploadView,
    FlashSaleListView,
    ShopFlashSaleListCreateView,
    ShopFlashSaleDetailView,
    BulkProductImportView,
    BulkProductExportView,
)

urlpatterns = [
    path("", ProductListView.as_view(), name="product-list"),
    path("categories/", CategoryListView.as_view(), name="category-list"),
    path("flash-sales/", FlashSaleListView.as_view(), name="flash-sale-list"),
    path("<str:lookup>/restock/", ProductRestockView.as_view(), name="product-restock"),
    path("<str:lookup>/", ProductDetailView.as_view(), name="product-detail"),
    path("<str:lookup>/reviews/", ProductReviewListCreateView.as_view(), name="product-reviews"),
    path("<str:lookup>/images/", ProductImageUploadView.as_view(), name="product-images"),
    # Shop-scoped: /api/shops/<slug>/products/  (included from shops urls or root)
    path("shop/<slug:slug>/", ShopProductListView.as_view(), name="shop-product-list"),
    path("shop/<slug:slug>/import/", BulkProductImportView.as_view(), name="shop-product-import"),
    path("shop/<slug:slug>/export/", BulkProductExportView.as_view(), name="shop-product-export"),
    path("shop/<slug:slug>/flash-sales/", ShopFlashSaleListCreateView.as_view(), name="shop-flash-sale-list"),
    path("shop/<slug:slug>/flash-sales/<uuid:public_id>/", ShopFlashSaleDetailView.as_view(), name="shop-flash-sale-detail"),
]

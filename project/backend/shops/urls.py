from django.urls import path

from .views import (
    LayoutBulkReorderView,
    LayoutSectionDetailView,
    LayoutSectionListCreateView,
    MyShopView,
    SectionBlockDetailView,
    SectionBlockListCreateView,
    ShopBrandingUploadView,
    ShopCreateView,
    ShopDeleteView,
    ShopDetailView,
    ShopLayoutDetailView,
    ShopLayoutListCreateView,
    ShopListView,
    ShopReviewListCreateView,
    ShopThemeResetView,
    ShopThemeView,
    ShopUpdateView,
)

urlpatterns = [
    # Shop CRUD
    path("", ShopListView.as_view(), name="shop-list"),
    path("mine/", MyShopView.as_view(), name="my-shops"),
    path("create/", ShopCreateView.as_view(), name="shop-create"),
    path("<slug:slug>/", ShopDetailView.as_view(), name="shop-detail"),
    path("<slug:slug>/update/", ShopUpdateView.as_view(), name="shop-update"),
    path("<slug:slug>/delete/", ShopDeleteView.as_view(), name="shop-delete"),

    # Theme customization (Item 27)
    path("<slug:slug>/theme/", ShopThemeView.as_view(), name="shop-theme"),
    path("<slug:slug>/theme/reset/", ShopThemeResetView.as_view(), name="shop-theme-reset"),

    # Branding asset upload (Item 29)
    path("<slug:slug>/branding/", ShopBrandingUploadView.as_view(), name="shop-branding"),

    # Layout builder (Item 28)
    path("<slug:slug>/layouts/", ShopLayoutListCreateView.as_view(), name="shop-layout-list"),
    path("<slug:slug>/layouts/<int:pk>/", ShopLayoutDetailView.as_view(), name="shop-layout-detail"),
    path("<slug:slug>/layouts/<int:layout_pk>/reorder/", LayoutBulkReorderView.as_view(), name="layout-reorder"),
    path("<slug:slug>/layouts/<int:layout_pk>/sections/", LayoutSectionListCreateView.as_view(), name="layout-section-list"),
    path("<slug:slug>/layouts/<int:layout_pk>/sections/<int:pk>/", LayoutSectionDetailView.as_view(), name="layout-section-detail"),
    path("<slug:slug>/layouts/<int:layout_pk>/sections/<int:section_pk>/blocks/", SectionBlockListCreateView.as_view(), name="section-block-list"),
    path("<slug:slug>/layouts/<int:layout_pk>/sections/<int:section_pk>/blocks/<int:pk>/", SectionBlockDetailView.as_view(), name="section-block-detail"),

    # Reviews
    path("<slug:slug>/reviews/", ShopReviewListCreateView.as_view(), name="shop-reviews"),
]

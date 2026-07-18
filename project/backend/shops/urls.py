from django.urls import path

from .views import (
    DeliveryNoteCreateView,
    DeliveryNoteListView,
    DeliveryNoteMarkReadView,
    DeliveryZoneBulkView,
    DeliveryZoneDetailView,
    DeliveryZoneListCreateView,
    LayoutBulkReorderView,
    LayoutSectionDetailView,
    LayoutSectionListCreateView,
    MyShopView,
    NigerianStatesView,
    ReportShopView,
    SectionBlockDetailView,
    SectionBlockListCreateView,
    ShopBrandingUploadView,
    ShopCreateView,
    ShopCustomDomainVerifyView,
    ShopCustomDomainView,
    ShopDeleteView,
    ShopDetailView,
    ShopLayoutDetailView,
    ShopLayoutListCreateView,
    ShopListView,
    ShopReviewListCreateView,
    ShopThemeResetView,
    ShopThemeView,
    ShopUpdateView,
    VerificationSubmitView,
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

    # Custom domain (feature-gated)
    path("<slug:slug>/domain/", ShopCustomDomainView.as_view(), name="shop-domain"),
    path("<slug:slug>/domain/verify/", ShopCustomDomainVerifyView.as_view(), name="shop-domain-verify"),


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

    # Delivery zones
    path("<slug:slug>/delivery-zones/", DeliveryZoneListCreateView.as_view(), name="delivery-zone-list"),
    path("<slug:slug>/delivery-zones/bulk/", DeliveryZoneBulkView.as_view(), name="delivery-zone-bulk"),
    path("<slug:slug>/delivery-zones/<int:pk>/", DeliveryZoneDetailView.as_view(), name="delivery-zone-detail"),

    # Delivery notes (buyer → shop owner)
    path("<slug:slug>/delivery-notes/", DeliveryNoteListView.as_view(), name="delivery-note-list"),
    path("<slug:slug>/delivery-notes/send/", DeliveryNoteCreateView.as_view(), name="delivery-note-send"),
    path("<slug:slug>/delivery-notes/<int:pk>/read/", DeliveryNoteMarkReadView.as_view(), name="delivery-note-read"),

    # Nigerian states list
    path("nigerian-states/", NigerianStatesView.as_view(), name="nigerian-states"),

    # Report shop (anti-scam)
    path("<slug:slug>/report/", ReportShopView.as_view(), name="shop-report"),

    # Seller verification (KYC)
    path("<slug:slug>/verification/", VerificationSubmitView.as_view(), name="shop-verification"),
]

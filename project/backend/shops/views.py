"""
Shops views.

All shop management views (CRUD, theme, layout, branding).  Auth views have
moved to the ``accounts`` app where they belong.
"""
from rest_framework import generics, status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.permissions import IsOwnerOrReadOnly

from .models import LayoutSection, SectionBlock, Shop, ShopLayout, ShopReview, ShopTheme
from .serializers import (
    LayoutSectionSerializer,
    SectionBlockSerializer,
    ShopCreateUpdateSerializer,
    ShopDetailSerializer,
    ShopLayoutSerializer,
    ShopListSerializer,
    ShopReviewSerializer,
    ShopThemeSerializer,
)


# ---------------------------------------------------------------------------
# Shop CRUD
# ---------------------------------------------------------------------------

class ShopListView(generics.ListAPIView):
    """Public list of active shops (used on the home page "shops" toggle)."""

    queryset = Shop.objects.filter(status=Shop.Status.ACTIVE)
    serializer_class = ShopListSerializer
    permission_classes = [AllowAny]
    search_fields = ["name", "tagline", "description"]
    ordering_fields = ["rating_average", "product_count", "created_at", "name"]
    ordering = ["-rating_average"]


class ShopDetailView(generics.RetrieveAPIView):
    """Public detail view by slug (includes theme + layout)."""

    queryset = Shop.objects.filter(status=Shop.Status.ACTIVE)
    serializer_class = ShopDetailSerializer
    permission_classes = [AllowAny]
    lookup_field = "slug"


class ShopCreateView(generics.CreateAPIView):
    serializer_class = ShopCreateUpdateSerializer
    permission_classes = [IsAuthenticated]


class ShopUpdateView(generics.UpdateAPIView):
    serializer_class = ShopCreateUpdateSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]
    lookup_field = "slug"

    def get_queryset(self):
        return Shop.objects.filter(owner=self.request.user)


class ShopDeleteView(generics.DestroyAPIView):
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]
    lookup_field = "slug"

    def get_queryset(self):
        return Shop.objects.filter(owner=self.request.user)


class MyShopView(generics.ListAPIView):
    """Returns the requesting user's own shops."""

    serializer_class = ShopDetailSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Shop.all_objects.filter(owner=self.request.user)


# ---------------------------------------------------------------------------
# Theme CRUD — Item 27
# ---------------------------------------------------------------------------

class ShopThemeView(generics.RetrieveUpdateAPIView):
    """
    GET  /api/shops/<slug>/theme/   → current theme tokens
    PUT  /api/shops/<slug>/theme/   → full update
    PATCH /api/shops/<slug>/theme/  → partial update

    Only the shop owner can modify the theme.
    """
    serializer_class = ShopThemeSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        shop = generics.get_object_or_404(
            Shop, slug=self.kwargs["slug"], owner=self.request.user
        )
        theme, _created = ShopTheme.objects.get_or_create(shop=shop)
        return theme


class ShopThemeResetView(APIView):
    """POST /api/shops/<slug>/theme/reset/ → reset to defaults."""
    permission_classes = [IsAuthenticated]

    def post(self, request, slug):
        shop = generics.get_object_or_404(Shop, slug=slug, owner=request.user)
        theme, _ = ShopTheme.objects.get_or_create(shop=shop)
        # Reset all design tokens to model defaults.
        for field in theme._meta.fields:
            if field.name in ("id", "shop", "created_at", "updated_at"):
                continue
            if field.has_default():
                setattr(theme, field.name, field.default)
        theme.save()
        return Response(ShopThemeSerializer(theme).data)


# ---------------------------------------------------------------------------
# Layout builder — Item 28
# ---------------------------------------------------------------------------

class ShopLayoutListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/shops/<slug>/layouts/         → list all page layouts
    POST /api/shops/<slug>/layouts/         → create a new page layout
    """
    serializer_class = ShopLayoutSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ShopLayout.objects.filter(
            shop__slug=self.kwargs["slug"],
            shop__owner=self.request.user,
        ).prefetch_related("sections__blocks")

    def perform_create(self, serializer):
        shop = generics.get_object_or_404(
            Shop, slug=self.kwargs["slug"], owner=self.request.user
        )
        serializer.save(shop=shop)


class ShopLayoutDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET/PUT/DELETE /api/shops/<slug>/layouts/<pk>/
    """
    serializer_class = ShopLayoutSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ShopLayout.objects.filter(
            shop__slug=self.kwargs["slug"],
            shop__owner=self.request.user,
        ).prefetch_related("sections__blocks")


class LayoutSectionListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/shops/<slug>/layouts/<layout_pk>/sections/
    POST /api/shops/<slug>/layouts/<layout_pk>/sections/
    """
    serializer_class = LayoutSectionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return LayoutSection.objects.filter(
            layout_id=self.kwargs["layout_pk"],
            layout__shop__slug=self.kwargs["slug"],
            layout__shop__owner=self.request.user,
        ).prefetch_related("blocks")

    def perform_create(self, serializer):
        layout = generics.get_object_or_404(
            ShopLayout,
            pk=self.kwargs["layout_pk"],
            shop__slug=self.kwargs["slug"],
            shop__owner=self.request.user,
        )
        serializer.save(layout=layout)


class LayoutSectionDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET/PUT/PATCH/DELETE /api/shops/<slug>/layouts/<layout_pk>/sections/<pk>/
    """
    serializer_class = LayoutSectionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return LayoutSection.objects.filter(
            layout_id=self.kwargs["layout_pk"],
            layout__shop__slug=self.kwargs["slug"],
            layout__shop__owner=self.request.user,
        ).prefetch_related("blocks")


class SectionBlockListCreateView(generics.ListCreateAPIView):
    """
    GET/POST /api/shops/<slug>/layouts/<layout_pk>/sections/<section_pk>/blocks/
    """
    serializer_class = SectionBlockSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return SectionBlock.objects.filter(
            section_id=self.kwargs["section_pk"],
            section__layout_id=self.kwargs["layout_pk"],
            section__layout__shop__slug=self.kwargs["slug"],
            section__layout__shop__owner=self.request.user,
        )

    def perform_create(self, serializer):
        section = generics.get_object_or_404(
            LayoutSection,
            pk=self.kwargs["section_pk"],
            layout_id=self.kwargs["layout_pk"],
            layout__shop__slug=self.kwargs["slug"],
            layout__shop__owner=self.request.user,
        )
        serializer.save(section=section)


class SectionBlockDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET/PUT/PATCH/DELETE .../blocks/<pk>/
    """
    serializer_class = SectionBlockSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return SectionBlock.objects.filter(
            section_id=self.kwargs["section_pk"],
            section__layout_id=self.kwargs["layout_pk"],
            section__layout__shop__slug=self.kwargs["slug"],
            section__layout__shop__owner=self.request.user,
        )


class LayoutBulkReorderView(APIView):
    """
    POST /api/shops/<slug>/layouts/<layout_pk>/reorder/

    Body: {"section_ids": [3, 1, 7, 2]}
    Updates position of each section to match the array order.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, slug, layout_pk):
        layout = generics.get_object_or_404(
            ShopLayout,
            pk=layout_pk,
            shop__slug=slug,
            shop__owner=request.user,
        )
        section_ids = request.data.get("section_ids", [])
        if not isinstance(section_ids, list):
            return Response(
                {"detail": "section_ids must be a list."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        sections = list(layout.sections.filter(id__in=section_ids))
        id_map = {s.id: s for s in sections}

        for idx, sid in enumerate(section_ids):
            section = id_map.get(sid)
            if section:
                section.position = idx

        LayoutSection.objects.bulk_update(sections, ["position"])
        return Response({"detail": f"Reordered {len(sections)} sections."})


# ---------------------------------------------------------------------------
# Branding asset upload — Item 29
# ---------------------------------------------------------------------------

class ShopBrandingUploadView(APIView):
    """
    POST /api/shops/<slug>/branding/

    Multipart form with optional fields: logo, banner.
    Only the shop owner can upload branding assets.
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, slug):
        shop = generics.get_object_or_404(Shop, slug=slug, owner=request.user)
        updated = []
        if "logo" in request.FILES:
            shop.logo = request.FILES["logo"]
            updated.append("logo")
        if "banner" in request.FILES:
            shop.banner = request.FILES["banner"]
            updated.append("banner")

        if not updated:
            return Response(
                {"detail": "No files provided. Send 'logo' and/or 'banner'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        shop.save(update_fields=updated + ["updated_at"])
        return Response(
            {
                "detail": f"Updated: {', '.join(updated)}",
                "logo": request.build_absolute_uri(shop.logo.url) if shop.logo else None,
                "banner": request.build_absolute_uri(shop.banner.url) if shop.banner else None,
            }
        )


# ---------------------------------------------------------------------------
# Reviews
# ---------------------------------------------------------------------------

class ShopReviewListCreateView(generics.ListCreateAPIView):
    serializer_class = ShopReviewSerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        return ShopReview.objects.filter(shop__slug=self.kwargs["slug"])

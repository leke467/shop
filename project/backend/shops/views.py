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

from .domains import (
    DomainError,
    attach_domain,
    dns_instructions,
    remove_domain,
    verify_domain,
)
from .models import (
    DeliveryNote,
    DeliveryZone,
    LayoutSection,
    NIGERIAN_STATES,
    SectionBlock,
    Shop,
    ShopLayout,
    ShopReport,
    ShopReview,
    ShopTheme,
)

from .serializers import (
    DeliveryNoteSerializer,
    DeliveryZoneSerializer,
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

    serializer_class = ShopDetailSerializer
    permission_classes = [AllowAny]
    lookup_field = "slug"

    def get_queryset(self):
        from django.db.models import Q
        if self.request.user.is_authenticated:
            return Shop.objects.filter(
                Q(status=Shop.Status.ACTIVE) | Q(owner=self.request.user)
            )
        return Shop.objects.filter(status=Shop.Status.ACTIVE)


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
        return Shop.objects.filter(owner=self.request.user)


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
# Custom domain (feature-gated by subscription plan)
# ---------------------------------------------------------------------------

class ShopCustomDomainView(APIView):
    """
    GET    /api/shops/<slug>/domain/   → current domain + DNS instructions
    POST   /api/shops/<slug>/domain/   → attach/replace a domain (body: {"domain"})
    DELETE /api/shops/<slug>/domain/   → detach the domain

    Attaching is gated on the ``custom_domain_enabled`` plan feature; the
    service layer raises FeatureNotAvailable (403) with an upgrade prompt when
    the plan does not include it.
    """
    permission_classes = [IsAuthenticated]

    def _get_shop(self, request, slug):
        return generics.get_object_or_404(
            Shop.all_objects, slug=slug, owner=request.user
        )

    def get(self, request, slug):
        shop = self._get_shop(request, slug)
        return Response(dns_instructions(shop))

    def post(self, request, slug):
        shop = self._get_shop(request, slug)
        domain = request.data.get("domain", "")
        try:
            attach_domain(shop, domain)
        except DomainError as exc:
            return Response(
                {"error": {"type": "DomainError", "detail": str(exc)}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(dns_instructions(shop), status=status.HTTP_201_CREATED)

    def delete(self, request, slug):
        shop = self._get_shop(request, slug)
        remove_domain(shop)
        return Response(status=status.HTTP_204_NO_CONTENT)


class ShopCustomDomainVerifyView(APIView):
    """POST /api/shops/<slug>/domain/verify/ → check DNS + mark verified."""
    permission_classes = [IsAuthenticated]

    def post(self, request, slug):
        shop = generics.get_object_or_404(
            Shop.all_objects, slug=slug, owner=request.user
        )
        try:
            verify_domain(shop)
        except DomainError as exc:
            return Response(
                {"error": {"type": "DomainError", "detail": str(exc)}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(dns_instructions(shop))


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


# ---------------------------------------------------------------------------
# Delivery Zones
# ---------------------------------------------------------------------------

class DeliveryZoneListCreateView(generics.ListCreateAPIView):
    """GET: public list of delivery zones for a shop. POST: owner adds a zone."""
    serializer_class = DeliveryZoneSerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        qs = DeliveryZone.objects.filter(shop__slug=self.kwargs["slug"])
        state = self.request.query_params.get("state")
        if state:
            qs = qs.filter(state=state, is_active=True)
        return qs

    def perform_create(self, serializer):
        shop = Shop.objects.get(slug=self.kwargs["slug"])
        if shop.owner != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only the shop owner can manage delivery zones.")
        serializer.save(shop=shop)


class DeliveryZoneDetailView(generics.RetrieveUpdateDestroyAPIView):
    """PUT/PATCH/DELETE a single delivery zone — owner only."""
    serializer_class = DeliveryZoneSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return DeliveryZone.objects.filter(
            shop__slug=self.kwargs["slug"],
            shop__owner=self.request.user,
        )


class DeliveryZoneBulkView(APIView):
    """Bulk create/update delivery zones for a shop."""
    permission_classes = [IsAuthenticated]

    def post(self, request, slug):
        shop = Shop.objects.filter(slug=slug, owner=request.user).first()
        if not shop:
            return Response({"detail": "Shop not found or not yours."}, status=status.HTTP_404_NOT_FOUND)

        zones = request.data.get("zones", [])
        created, updated = 0, 0

        for zone_data in zones:
            state = zone_data.get("state")
            fee = zone_data.get("fee")
            is_active = zone_data.get("is_active", True)

            if not state or fee is None:
                continue

            obj, was_created = DeliveryZone.objects.update_or_create(
                shop=shop,
                state=state,
                defaults={"fee": fee, "is_active": is_active},
            )
            if was_created:
                created += 1
            else:
                updated += 1

        return Response({"created": created, "updated": updated})


class NigerianStatesView(APIView):
    """Return the full list of Nigerian states for frontend dropdowns."""
    permission_classes = [AllowAny]

    def get(self, request):
        return Response(
            [{"value": val, "label": label} for val, label in NIGERIAN_STATES]
        )


# ---------------------------------------------------------------------------
# Delivery Notes
# ---------------------------------------------------------------------------

class DeliveryNoteCreateView(generics.CreateAPIView):
    """Public: buyers can send a note when their state isn't available."""
    serializer_class = DeliveryNoteSerializer
    permission_classes = [AllowAny]

    def perform_create(self, serializer):
        shop = Shop.objects.get(slug=self.kwargs["slug"])
        serializer.save(shop=shop)


class DeliveryNoteListView(generics.ListAPIView):
    """Owner-only: see incoming delivery notes for their shop."""
    serializer_class = DeliveryNoteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return DeliveryNote.objects.filter(
            shop__slug=self.kwargs["slug"],
            shop__owner=self.request.user,
        )


class DeliveryNoteMarkReadView(APIView):
    """Owner marks a delivery note as read."""
    permission_classes = [IsAuthenticated]

    def post(self, request, slug, pk):
        note = DeliveryNote.objects.filter(
            pk=pk, shop__slug=slug, shop__owner=request.user
        ).first()
        if not note:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        note.is_read = True
        note.save(update_fields=["is_read"])
        return Response({"status": "ok"})


# ---------------------------------------------------------------------------
# Shop Reports (anti-scam)
# ---------------------------------------------------------------------------

class ReportShopView(APIView):
    """Authenticated users can report a shop (one report per user per shop)."""
    permission_classes = [IsAuthenticated]

    def post(self, request, slug):
        shop = generics.get_object_or_404(Shop, slug=slug)

        # Don't let owners report their own shop.
        if shop.owner == request.user:
            return Response(
                {"detail": "You cannot report your own shop."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        reason = request.data.get("reason", "")
        description = request.data.get("description", "")

        if not reason:
            return Response(
                {"detail": "A reason is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        report, created = ShopReport.objects.get_or_create(
            shop=shop,
            reporter=request.user,
            defaults={"reason": reason, "description": description},
        )

        if not created:
            return Response(
                {"detail": "You have already reported this shop."},
                status=status.HTTP_409_CONFLICT,
            )

        # Auto-suspend if 3+ unique reports in the last 7 days.
        from django.utils import timezone
        from datetime import timedelta

        recent_count = ShopReport.objects.filter(
            shop=shop,
            created_at__gte=timezone.now() - timedelta(days=7),
        ).count()

        if recent_count >= 3 and shop.status != Shop.Status.SUSPENDED:
            shop.status = Shop.Status.SUSPENDED
            shop.save(update_fields=["status", "updated_at"])

        return Response(
            {"detail": "Report submitted. Thank you for helping keep our community safe."},
            status=status.HTTP_201_CREATED,
        )


# ---------------------------------------------------------------------------
# Seller Verification (KYC)
# ---------------------------------------------------------------------------

class VerificationSubmitView(APIView):
    """Shop owner submits verification document and legal name."""
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, slug):
        shop = generics.get_object_or_404(Shop, slug=slug, owner=request.user)

        if shop.verification_status == Shop.VerificationStatus.VERIFIED:
            return Response(
                {"detail": "Shop is already verified."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        legal_name = request.data.get("legal_name", "").strip()
        document = request.FILES.get("document")

        if not legal_name or not document:
            return Response(
                {"detail": "Both legal name and a verification document are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        shop.verification_legal_name = legal_name
        shop.verification_document = document
        shop.verification_status = Shop.VerificationStatus.PENDING
        shop.save(update_fields=[
            "verification_legal_name", "verification_document",
            "verification_status", "updated_at",
        ])

        return Response({
            "detail": "Verification submitted. We will review your documents shortly.",
            "verification_status": shop.verification_status,
        })

    def get(self, request, slug):
        """Get current verification status."""
        shop = generics.get_object_or_404(Shop, slug=slug, owner=request.user)
        return Response({
            "verification_status": shop.verification_status,
            "verification_legal_name": shop.verification_legal_name,
            "verified_at": shop.verified_at.isoformat() if shop.verified_at else None,
            "has_document": bool(shop.verification_document),
        })

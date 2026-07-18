"""Products views."""
from rest_framework import generics
from rest_framework.permissions import AllowAny, IsAuthenticated

from core.permissions import IsOwnerOrReadOnly

from .models import Category, Product, ProductReview
from .serializers import (
    CategorySerializer,
    ProductCreateUpdateSerializer,
    ProductDetailSerializer,
    ProductListSerializer,
    ProductReviewSerializer,
    ProductImageSerializer,
)


# ---------------------------------------------------------------------------
# Categories
# ---------------------------------------------------------------------------

class CategoryListView(generics.ListAPIView):
    """Public: root-level categories (children nested via serializer)."""
    queryset = Category.objects.filter(parent__isnull=True, is_active=True)
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]


# ---------------------------------------------------------------------------
# Products
# ---------------------------------------------------------------------------

class ProductListView(generics.ListAPIView):
    """Public: browse products across all shops, filterable."""
    serializer_class = ProductListSerializer
    permission_classes = [AllowAny]
    search_fields = ["name", "description", "tags"]
    ordering_fields = ["base_price", "rating_average", "purchase_count", "created_at", "?"]
    ordering = ["-created_at"]
    filterset_fields = ["status", "is_featured", "category", "shop__slug"]

    def get_queryset(self):
        qs = Product.objects.filter(status=Product.Status.ACTIVE).select_related(
            "shop", "category"
        ).prefetch_related("images")
        
        shop_slug = self.request.query_params.get("shop")
        if shop_slug:
            qs = qs.filter(shop__slug=shop_slug)
            
        return qs


class ShopProductListView(generics.ListCreateAPIView):
    """List products for a specific shop, or create one (shop owner only)."""
    search_fields = ["name", "description"]
    ordering = ["-created_at"]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return ProductCreateUpdateSerializer
        return ProductListSerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        return Product.objects.filter(
            shop__slug=self.kwargs["slug"],
            status=Product.Status.ACTIVE,
        ).select_related("shop", "category").prefetch_related("images")

    def perform_create(self, serializer):
        from shops.models import Shop
        from subscriptions.services import assert_can_create_product
        # Enforce the subscription product limit before creating.
        assert_can_create_product(self.request.user)  # raises LimitReached if at cap
        shop = generics.get_object_or_404(Shop, slug=self.kwargs["slug"], owner=self.request.user)
        serializer.save(shop=shop)



class ProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Public detail (GET) / owner-only edit (PUT/PATCH/DELETE)."""

    owner_field = "shop.owner"

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return ProductCreateUpdateSerializer
        return ProductDetailSerializer

    def get_permissions(self):
        if self.request.method in ("GET", "HEAD", "OPTIONS"):
            return [AllowAny()]
        return [IsAuthenticated(), IsOwnerOrReadOnly()]

    def get_queryset(self):
        return Product.objects.select_related("shop", "category").prefetch_related(
            "variants__inventory", "images"
        )

    def get_object(self):
        queryset = self.filter_queryset(self.get_queryset())
        lookup = self.kwargs.get("lookup")
        
        import uuid
        try:
            val = uuid.UUID(lookup)
            obj = queryset.filter(public_id=val).first()
            if obj:
                self.check_object_permissions(self.request, obj)
                return obj
        except ValueError:
            pass

        obj = queryset.filter(slug=lookup).first()
        if not obj:
            from django.http import Http404
            raise Http404("No product matches the given query.")

        self.check_object_permissions(self.request, obj)
        return obj


# ---------------------------------------------------------------------------
# Reviews
# ---------------------------------------------------------------------------

class ProductReviewListCreateView(generics.ListCreateAPIView):
    serializer_class = ProductReviewSerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        lookup = self.kwargs.get("lookup")
        import uuid
        try:
            val = uuid.UUID(lookup)
            return ProductReview.objects.filter(product__public_id=val)
        except ValueError:
            return ProductReview.objects.filter(product__slug=lookup)


# ---------------------------------------------------------------------------
# Images
# ---------------------------------------------------------------------------

class ProductImageUploadView(generics.CreateAPIView):
    """Upload an image to a product."""
    serializer_class = ProductImageSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]

    def perform_create(self, serializer):
        lookup = self.kwargs.get("lookup")
        import uuid
        try:
            val = uuid.UUID(lookup)
            product = generics.get_object_or_404(Product, public_id=val, shop__owner=self.request.user)
        except ValueError:
            product = generics.get_object_or_404(Product, slug=lookup, shop__owner=self.request.user)

        serializer.save(product=product)

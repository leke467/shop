"""Products views."""
from rest_framework import generics
from rest_framework.permissions import AllowAny, IsAuthenticated

from core.permissions import IsOwnerOrReadOnly

from .models import Category, Product, ProductReview, FlashSale, FlashSaleItem
from .serializers import (
    CategorySerializer,
    ProductCreateUpdateSerializer,
    ProductDetailSerializer,
    ProductListSerializer,
    ProductReviewSerializer,
    ProductImageSerializer,
    FlashSaleSerializer,
    FlashSaleItemSerializer,
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
    """Public: browse products across all active shops, filterable."""
    serializer_class = ProductListSerializer
    permission_classes = [AllowAny]
    search_fields = ["name", "description", "tags"]
    ordering_fields = ["base_price", "rating_average", "purchase_count", "created_at", "?"]
    ordering = ["-created_at"]
    filterset_fields = ["status", "is_featured", "category", "shop__slug"]

    def get_queryset(self):
        from shops.models import Shop
        shop_slug = self.request.query_params.get("shop")

        # If the authenticated owner is loading their own shop's products (e.g. dashboard), allow draft shop
        if shop_slug and self.request.user.is_authenticated:
            if Shop.objects.filter(slug=shop_slug, owner=self.request.user).exists() or self.request.user.is_staff:
                return Product.objects.filter(
                    shop__slug=shop_slug,
                    status=Product.Status.ACTIVE,
                ).select_related("shop", "category").prefetch_related("images")

        # Public listing across marketplace: ONLY active products from ACTIVE, non-deleted shops
        qs = Product.objects.filter(
            status=Product.Status.ACTIVE,
            shop__status=Shop.Status.ACTIVE,
            shop__deleted_at__isnull=True,
        ).select_related(
            "shop", "category"
        ).prefetch_related("images")
        
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
        from shops.models import Shop
        slug = self.kwargs["slug"]
        user = self.request.user

        # If user is owner or staff, allow them to manage/view products even if shop is in draft
        if user.is_authenticated and (Shop.objects.filter(slug=slug, owner=user).exists() or user.is_staff):
            return Product.objects.filter(
                shop__slug=slug,
                status=Product.Status.ACTIVE,
            ).select_related("shop", "category").prefetch_related("images")

        # Public visitors only see products if the shop itself is active
        return Product.objects.filter(
            shop__slug=slug,
            shop__status=Shop.Status.ACTIVE,
            shop__deleted_at__isnull=True,
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
        from shops.models import Shop
        from django.db.models import Q
        user = self.request.user

        if user.is_authenticated and not user.is_staff:
            return Product.objects.filter(
                Q(shop__status=Shop.Status.ACTIVE, shop__deleted_at__isnull=True, status=Product.Status.ACTIVE)
                | Q(shop__owner=user)
            ).select_related("shop", "category").prefetch_related("variants__inventory", "images")
        elif user.is_authenticated and user.is_staff:
            return Product.objects.all().select_related("shop", "category").prefetch_related("variants__inventory", "images")

        # Public visitors only see product if the shop is active
        return Product.objects.filter(
            shop__status=Shop.Status.ACTIVE,
            shop__deleted_at__isnull=True,
            status=Product.Status.ACTIVE,
        ).select_related("shop", "category").prefetch_related("variants__inventory", "images")

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


# ---------------------------------------------------------------------------
# Flash Sales
# ---------------------------------------------------------------------------

class FlashSaleListView(generics.ListAPIView):
    """Public list of active flash sales."""
    serializer_class = FlashSaleSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        from django.utils import timezone
        now = timezone.now()
        qs = FlashSale.objects.filter(is_active=True, start_time__lte=now, end_time__gte=now)
        shop_slug = self.request.query_params.get("shop")
        if shop_slug:
            qs = qs.filter(shop__slug=shop_slug)
        return qs.prefetch_related("items__product")


class ShopFlashSaleListCreateView(generics.ListCreateAPIView):
    """List and create flash sales for a shop (owner only)."""
    serializer_class = FlashSaleSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return FlashSale.objects.filter(shop__slug=self.kwargs["slug"], shop__owner=self.request.user)
    
    def perform_create(self, serializer):
        from shops.models import Shop
        shop = generics.get_object_or_404(Shop, slug=self.kwargs["slug"], owner=self.request.user)
        serializer.save(shop=shop)


class ShopFlashSaleDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Manage a specific flash sale."""
    serializer_class = FlashSaleSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]
    lookup_field = "public_id"
    
    def get_queryset(self):
        return FlashSale.objects.filter(shop__owner=self.request.user)


# ---------------------------------------------------------------------------
# Bulk Import / Export
# ---------------------------------------------------------------------------

import csv
import io
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser
from django.db import transaction

class BulkProductImportView(APIView):
    """POST /api/products/shop/<slug>/import/ (accepts CSV file)"""
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser]
    
    def post(self, request, slug, *args, **kwargs):
        from shops.models import Shop
        from .models import ProductVariant, Inventory
        shop = generics.get_object_or_404(Shop, slug=slug, owner=request.user)
        
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({"error": "No file provided"}, status=400)
            
        decoded_file = file_obj.read().decode('utf-8')
        io_string = io.StringIO(decoded_file)
        reader = csv.DictReader(io_string)
        
        created_count = 0
        errors = []
        
        try:
            with transaction.atomic():
                for row_num, row in enumerate(reader, start=1):
                    try:
                        # Normalize headers to lowercase for resilient parsing
                        norm_row = {k.strip().lower(): v.strip() for k, v in row.items() if k}
                        name = norm_row.get("name") or norm_row.get("product_name") or norm_row.get("title")
                        base_price = norm_row.get("base_price") or norm_row.get("price") or norm_row.get("amount")
                        
                        if not name or not base_price:
                            errors.append(f"Row {row_num}: missing name or base_price")
                            continue
                            
                        category_slug = norm_row.get("category_slug") or norm_row.get("category")
                        category = None
                        if category_slug:
                            category = Category.objects.filter(slug=category_slug).first()
                            
                        compare_price = norm_row.get("compare_at_price") or norm_row.get("compare_price")
                        compare_price = compare_price if compare_price else None
                        
                        raw_status = (norm_row.get("status") or "active").lower()
                        status_val = Product.Status.ACTIVE if raw_status in ("active", "published") else Product.Status.DRAFT
                        
                        product = Product.objects.create(
                            shop=shop,
                            name=name,
                            description=norm_row.get("description", ""),
                            category=category,
                            base_price=base_price,
                            compare_at_price=compare_price,
                            status=status_val
                        )
                        
                        variant_name = norm_row.get("variant_name") or "Default"
                        variant_price = norm_row.get("variant_price") or base_price
                        sku = norm_row.get("sku", "")
                        
                        variant = ProductVariant.objects.create(
                            product=product,
                            name=variant_name,
                            price=variant_price,
                            sku=sku,
                            is_default=True
                        )
                        
                        qty = norm_row.get("quantity") or norm_row.get("stock")
                        if qty:
                            Inventory.objects.create(
                                variant=variant,
                                quantity=int(qty)
                            )
                            
                        created_count += 1
                    except Exception as e:
                        errors.append(f"Row {row_num}: {str(e)}")
        except Exception as e:
            return Response({"error": str(e)}, status=400)
            
        return Response({"created_count": created_count, "imported_count": created_count, "errors": errors})

class BulkProductExportView(APIView):
    """GET /api/products/shop/<slug>/export/ (returns CSV)"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, slug, *args, **kwargs):
        from django.http import HttpResponse
        from shops.models import Shop
        shop = generics.get_object_or_404(Shop, slug=slug, owner=request.user)
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="products_{slug}.csv"'
        
        writer = csv.writer(response)
        writer.writerow(["name", "description", "category_slug", "base_price", "compare_at_price", "variant_name", "variant_price", "sku", "quantity"])
        
        products = Product.objects.filter(shop=shop).prefetch_related("variants__inventory")
        for product in products:
            cat_slug = product.category.slug if product.category else ""
            variant = product.variants.first()
            if variant:
                v_name = variant.name
                v_price = variant.price
                sku = variant.sku
                try:
                    qty = variant.inventory.quantity
                except:
                    qty = 0
            else:
                v_name = ""
                v_price = product.base_price
                sku = ""
                qty = 0
                
            writer.writerow([
                product.name,
                product.description,
                cat_slug,
                product.base_price,
                product.compare_at_price or "",
                v_name,
                v_price,
                sku,
                qty
            ])
            
        return response

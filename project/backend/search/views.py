"""
Unified search API — shops + products with facets.

Uses Django ORM full-text search (suitable for MSSQL + PostgreSQL).
For production-scale search, swap this with Elasticsearch/Meilisearch
behind the same serializer interface.
"""
from django.db.models import Count, Max, Min, Q
from rest_framework import serializers, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from products.models import Category, Product
from products.serializers import CategorySerializer, ProductListSerializer
from shops.models import Shop
from shops.serializers import ShopListSerializer


class UnifiedSearchView(APIView):
    """
    GET /api/search/?q=shoes&type=all&category=<id>&min_price=&max_price=&sort=

    ``type``: ``all`` | ``products`` | ``shops``

    Returns both shops and products in a single response, or filtered by type.
    This powers the dual-browse toggle on the home page.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        q = request.query_params.get("q", "").strip()
        search_type = request.query_params.get("type", "all").lower()
        category_id = request.query_params.get("category")
        min_price = request.query_params.get("min_price")
        max_price = request.query_params.get("max_price")
        sort = request.query_params.get("sort", "-created_at")
        page = int(request.query_params.get("page", 1))
        page_size = min(int(request.query_params.get("page_size", 24)), 100)

        result = {}

        # --- Shops ---
        if search_type in ("all", "shops"):
            shops_qs = Shop.objects.filter(status=Shop.Status.ACTIVE)
            if q:
                shops_qs = shops_qs.filter(
                    Q(name__icontains=q)
                    | Q(tagline__icontains=q)
                    | Q(description__icontains=q)
                )
            shops_qs = shops_qs.order_by("-rating_average")
            total_shops = shops_qs.count()
            offset = (page - 1) * page_size
            result["shops"] = {
                "count": total_shops,
                "results": ShopListSerializer(
                    shops_qs[offset:offset + page_size], many=True, context={"request": request}
                ).data,
            }

        # --- Products ---
        if search_type in ("all", "products"):
            products_qs = Product.objects.filter(
                status=Product.Status.ACTIVE
            ).select_related("shop", "category").prefetch_related("images")

            if q:
                products_qs = products_qs.filter(
                    Q(name__icontains=q)
                    | Q(description__icontains=q)
                    | Q(tags__icontains=q)
                )

            if category_id:
                # Include child categories via MPTT.
                try:
                    cat = Category.objects.get(pk=category_id)
                    descendants = cat.get_descendants(include_self=True)
                    products_qs = products_qs.filter(category__in=descendants)
                except Category.DoesNotExist:
                    products_qs = products_qs.none()

            if min_price:
                products_qs = products_qs.filter(base_price__gte=min_price)
            if max_price:
                products_qs = products_qs.filter(base_price__lte=max_price)

            # Sort
            allowed_sorts = {
                "price_asc": "base_price",
                "price_desc": "-base_price",
                "rating": "-rating_average",
                "popular": "-purchase_count",
                "newest": "-created_at",
            }
            order = allowed_sorts.get(sort, "-created_at")
            products_qs = products_qs.order_by(order)

            total_products = products_qs.count()
            offset = (page - 1) * page_size
            result["products"] = {
                "count": total_products,
                "results": ProductListSerializer(
                    products_qs[offset:offset + page_size], many=True, context={"request": request}
                ).data,
            }

        # --- Facets ---
        if search_type in ("all", "products"):
            result["facets"] = self._build_facets(products_qs if "products_qs" in dir() else Product.objects.none())

        result["query"] = q
        result["type"] = search_type
        result["page"] = page
        result["page_size"] = page_size

        return Response(result)

    def _build_facets(self, qs):
        """Build category and price-range facets from the current queryset."""
        # Category facets (top-level only with counts).
        cat_counts = (
            qs.values("category__id", "category__name")
            .annotate(count=Count("id"))
            .filter(category__isnull=False)
            .order_by("-count")[:20]
        )
        categories = [
            {"id": c["category__id"], "name": c["category__name"], "count": c["count"]}
            for c in cat_counts
        ]

        # Price range.
        price_stats = qs.aggregate(min_price=Min("base_price"), max_price=Max("base_price"))

        return {
            "categories": categories,
            "price_range": {
                "min": float(price_stats["min_price"] or 0),
                "max": float(price_stats["max_price"] or 0),
            },
        }


class CategoryTreeView(APIView):
    """
    GET /api/search/categories/

    Returns the full category tree for faceted navigation.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        roots = Category.objects.filter(parent__isnull=True, is_active=True)
        return Response(CategorySerializer(roots, many=True).data)

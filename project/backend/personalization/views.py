"""
Personalization views — event tracking, favourites, and personalized feed.
"""
from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from products.models import Product
from products.serializers import ProductListSerializer

from .models import Favourite, PersonalizationEvent, RecommendationCache, SearchQuery
from .serializers import EventCreateSerializer, FavouriteSerializer


# ---------------------------------------------------------------------------
# Item 34 — Event tracking ingestion
# ---------------------------------------------------------------------------

class TrackEventView(generics.CreateAPIView):
    """
    POST /api/personalization/events/

    Ingests a user behaviour event (view, click, add_to_cart, purchase, search).
    These events feed the recommendation engine.
    """
    serializer_class = EventCreateSerializer
    permission_classes = [IsAuthenticated]


class TrackSearchView(APIView):
    """
    POST /api/personalization/search/

    Logs a search query for intent tracking.  Body: {"query": "...", "results_count": 42}
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        query = request.data.get("query", "").strip()
        if not query:
            return Response({"detail": "query is required."}, status=status.HTTP_400_BAD_REQUEST)
        SearchQuery.objects.create(
            user=request.user,
            query=query,
            results_count=request.data.get("results_count", 0),
        )
        return Response({"detail": "Logged."}, status=status.HTTP_201_CREATED)


# ---------------------------------------------------------------------------
# Favourites
# ---------------------------------------------------------------------------

class FavouriteListCreateView(generics.ListCreateAPIView):
    serializer_class = FavouriteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Favourite.objects.filter(user=self.request.user)


class FavouriteDeleteView(generics.DestroyAPIView):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Favourite.objects.filter(user=self.request.user)


# ---------------------------------------------------------------------------
# Item 35 — Recommendation engine (lightweight, DB-driven)
# ---------------------------------------------------------------------------

def build_recommendations(user, limit=24):
    """
    Build personalized product recommendations based on user behaviour.

    Strategy (priority order):
    1. Products in categories the user has viewed/clicked most.
    2. Products from shops the user has interacted with.
    3. Popular products (fallback for cold-start).

    In production, this runs as a Celery task and caches results in
    RecommendationCache (6-hour staleness). Here it runs inline for simplicity.
    """
    # Category affinities — top 5 categories by event count.
    category_affinities = (
        PersonalizationEvent.objects
        .filter(user=user, category__isnull=False)
        .values("category")
        .annotate(score=Count("id"))
        .order_by("-score")[:5]
    )
    affinity_cat_ids = [c["category"] for c in category_affinities]

    # Shop affinities — top 5 shops.
    shop_affinities = (
        PersonalizationEvent.objects
        .filter(user=user, shop__isnull=False)
        .values("shop")
        .annotate(score=Count("id"))
        .order_by("-score")[:5]
    )
    affinity_shop_ids = [s["shop"] for s in shop_affinities]

    # Build combined query.
    qs = Product.objects.filter(status=Product.Status.ACTIVE)

    if affinity_cat_ids or affinity_shop_ids:
        q = Q()
        if affinity_cat_ids:
            q |= Q(category_id__in=affinity_cat_ids)
        if affinity_shop_ids:
            q |= Q(shop_id__in=affinity_shop_ids)
        recommended = list(
            qs.filter(q)
            .select_related("shop", "category")
            .prefetch_related("images")
            .order_by("-rating_average", "-purchase_count")[:limit]
        )
    else:
        recommended = []

    # Cold-start fallback — fill with popular products.
    if len(recommended) < limit:
        existing_ids = {p.pk for p in recommended}
        popular = (
            qs.exclude(pk__in=existing_ids)
            .select_related("shop", "category")
            .prefetch_related("images")
            .order_by("-purchase_count", "-rating_average")[: limit - len(recommended)]
        )
        recommended.extend(popular)

    return recommended


# ---------------------------------------------------------------------------
# Item 36 — Personalized feed endpoint
# ---------------------------------------------------------------------------

class PersonalizedFeedView(APIView):
    """
    GET /api/personalization/feed/

    Returns a personalized product feed for the authenticated user.
    Uses cached recommendations (6h staleness) for performance.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        staleness_hours = 6

        # Check cache.
        cache = RecommendationCache.objects.filter(user=user).first()
        if cache and cache.is_stale(staleness_hours):
            cache = None

        if cache and cache.product_ids:
            # Serve from cache — preserving order.
            products = Product.objects.filter(
                pk__in=cache.product_ids, status=Product.Status.ACTIVE
            ).select_related("shop", "category").prefetch_related("images")
            # Re-order by the cached order.
            id_order = {pid: idx for idx, pid in enumerate(cache.product_ids)}
            products = sorted(products, key=lambda p: id_order.get(p.pk, 999))
        else:
            # Build fresh recommendations.
            products = build_recommendations(user)
            # Update cache.
            product_ids = [p.pk for p in products]
            RecommendationCache.objects.update_or_create(
                user=user,
                defaults={
                    "product_ids": product_ids,
                    "generated_at": timezone.now(),
                    "strategy": "category_shop_affinity_v1",
                },
            )

        serializer = ProductListSerializer(products, many=True, context={"request": request})
        return Response({
            "count": len(products),
            "results": serializer.data,
            "strategy": "personalized" if cache else "fresh",
        })

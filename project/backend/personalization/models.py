"""
Personalization domain models.

Architecture
------------
The personalization engine tracks user behaviour → builds affinity signals →
powers a recommendation feed.

Event tracking
    ``PersonalizationEvent`` records atomic user actions: product views, search
    queries, cart additions, purchases, favourites.  Events are lightweight and
    append-only — a Celery task periodically rolls them up into the user's
    ``BuyerProfile.category_affinities`` (in the accounts app) so the feed
    endpoint can read a cheap per-user vector instead of scanning raw events.

Favourites / Wishlists
    ``Favourite`` lets users explicitly bookmark products or shops. These feed
    into the affinity model with high weight.

Search history
    ``SearchQuery`` stores recent search terms per user.  Combined with
    category_affinities, this helps the recommendation engine surface products
    the user is likely interested in but hasn't seen yet.

Feed cache
    ``RecommendationCache`` stores the last-computed feed per user, set by a
    Celery task.  The feed endpoint reads from cache for instant response and
    falls back to a real-time query if the cache is cold.
"""
from __future__ import annotations

from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _

from core.models import TimeStampedModel


class PersonalizationEvent(models.Model):
    """
    Append-only event log of user interactions.

    Kept intentionally lightweight (no UUID, no updated_at) for high-volume
    inserts.  A periodic Celery task aggregates these into the
    BuyerProfile.category_affinities JSON field and prunes old rows.
    """

    class EventType(models.TextChoices):
        PRODUCT_VIEW = "product_view", _("Product view")
        PRODUCT_CLICK = "product_click", _("Product click")
        SHOP_VIEW = "shop_view", _("Shop view")
        SEARCH = "search", _("Search")
        ADD_TO_CART = "add_to_cart", _("Add to cart")
        REMOVE_FROM_CART = "remove_from_cart", _("Remove from cart")
        PURCHASE = "purchase", _("Purchase")
        FAVOURITE = "favourite", _("Favourite")
        UNFAVOURITE = "unfavourite", _("Unfavourite")
        REVIEW = "review", _("Review")

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="personalization_events",
    )
    event_type = models.CharField(
        max_length=24, choices=EventType.choices, db_index=True
    )
    # Generic reference to the target entity.
    target_type = models.CharField(
        max_length=16,
        help_text="'product', 'shop', or 'category'.",
        db_index=True,
    )
    target_id = models.PositiveBigIntegerField(
        help_text="PK of the target product, shop, or category."
    )
    # Optional context.
    search_query = models.CharField(max_length=255, blank=True)
    category_slug = models.CharField(max_length=140, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    # Session / device context for analytics.
    session_id = models.CharField(max_length=64, blank=True)
    device_type = models.CharField(max_length=16, blank=True)
    # Timestamp only — no updated_at for append-only.
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["user", "event_type", "-created_at"]),
            models.Index(fields=["target_type", "target_id"]),
            models.Index(fields=["user", "-created_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.event_type} by user {self.user_id} on {self.target_type}:{self.target_id}"


class Favourite(TimeStampedModel):
    """
    User-explicit bookmarks for products or shops.

    These carry high affinity weight in the recommendation model.
    """

    class TargetType(models.TextChoices):
        PRODUCT = "product", _("Product")
        SHOP = "shop", _("Shop")

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="favourites",
    )
    target_type = models.CharField(
        max_length=16, choices=TargetType.choices, db_index=True
    )
    target_id = models.PositiveBigIntegerField()

    class Meta:
        unique_together = ("user", "target_type", "target_id")
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["user", "target_type"]),
        ]

    def __str__(self) -> str:
        return f"Favourite<{self.target_type}:{self.target_id}> by {self.user}"


class SearchQuery(TimeStampedModel):
    """
    Per-user search history.

    The recommendation engine reads recent queries to understand intent
    signals.  Old entries are pruned by a periodic task (keep last N per user).
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="search_queries",
    )
    query = models.CharField(max_length=255)
    results_count = models.PositiveIntegerField(default=0)
    clicked_result_id = models.PositiveBigIntegerField(
        null=True, blank=True,
        help_text="PK of the product/shop the user clicked from results.",
    )

    class Meta:
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["user", "-created_at"]),
        ]

    def __str__(self) -> str:
        return f"Search<{self.query}> by {self.user}"


class RecommendationCache(TimeStampedModel):
    """
    Pre-computed recommendation feed per user, refreshed by a Celery task.

    The feed endpoint reads from here for instant response. If the cache
    is stale or missing, it falls back to a real-time computation.
    """

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="recommendation_cache",
    )
    # Ordered list of product public_ids recommended for this user.
    product_ids = models.JSONField(default=list)
    # Ordered list of shop public_ids.
    shop_ids = models.JSONField(default=list)
    # The category affinities snapshot used to generate this cache.
    affinities_snapshot = models.JSONField(default=dict, blank=True)
    # When this cache was last recomputed.
    computed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name_plural = "recommendation caches"

    def __str__(self) -> str:
        return f"RecommendationCache<{self.user}>"

    @property
    def is_stale(self) -> bool:
        """Cache is stale if it's older than 6 hours or never computed."""
        from django.utils import timezone
        from datetime import timedelta

        if not self.computed_at:
            return True
        return timezone.now() - self.computed_at > timedelta(hours=6)

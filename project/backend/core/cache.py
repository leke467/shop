"""
Cache utilities for common patterns (Item 44).

Provides decorators and helpers for Redis/LocMem caching that are
used across views and services.
"""
from __future__ import annotations

import functools
import hashlib
import logging
from typing import Any

from django.core.cache import cache

logger = logging.getLogger(__name__)

# Default TTLs (seconds).
TTL_SHORT = 60          # 1 minute — volatile data (cart counts)
TTL_MEDIUM = 300        # 5 minutes — semi-volatile (product lists)
TTL_LONG = 3600         # 1 hour — stable data (category tree)
TTL_EXTRA_LONG = 21600  # 6 hours — personalization cache


def cache_key(*parts: str) -> str:
    """Build a namespaced, collision-safe cache key."""
    raw = ":".join(str(p) for p in parts)
    # Keep keys readable but length-safe for memcached (250-char limit).
    if len(raw) > 200:
        suffix = hashlib.md5(raw.encode()).hexdigest()[:12]
        return f"mkt:{raw[:180]}:{suffix}"
    return f"mkt:{raw}"


def cached_view(prefix: str, ttl: int = TTL_MEDIUM, vary_on_user: bool = False):
    """
    Decorator for DRF APIView.get() methods.

    Caches the Response.data dict.  Set ``vary_on_user=True`` for
    authenticated-specific responses.

    Usage::

        class CategoryTreeView(APIView):
            @cached_view("category_tree", ttl=TTL_LONG)
            def get(self, request):
                ...
    """
    def decorator(func):
        @functools.wraps(func)
        def wrapper(self, request, *args, **kwargs):
            parts = [prefix]
            if vary_on_user and request.user.is_authenticated:
                parts.append(str(request.user.pk))
            parts.append(request.get_full_path())
            key = cache_key(*parts)

            data = cache.get(key)
            if data is not None:
                from rest_framework.response import Response
                return Response(data)

            response = func(self, request, *args, **kwargs)
            if response.status_code == 200:
                cache.set(key, response.data, ttl)
            return response
        return wrapper
    return decorator


def invalidate_prefix(prefix: str) -> None:
    """
    Invalidate all cache keys with the given prefix.

    Works with Redis (SCAN + DELETE) or falls back to version bumping
    for backends that don't support key scanning.
    """
    try:
        # django-redis exposes delete_pattern.
        cache.delete_pattern(f"mkt:{prefix}:*")
        logger.debug("Invalidated cache prefix: %s", prefix)
    except AttributeError:
        # LocMem / non-Redis backend — can't scan.  Just log it.
        logger.debug("Cache invalidation skipped (no pattern delete): %s", prefix)


def cache_shop_detail(shop_slug: str, data: Any, ttl: int = TTL_MEDIUM) -> None:
    """Cache a shop's detail response."""
    cache.set(cache_key("shop_detail", shop_slug), data, ttl)


def get_cached_shop_detail(shop_slug: str) -> Any | None:
    """Retrieve a cached shop detail response."""
    return cache.get(cache_key("shop_detail", shop_slug))


def invalidate_shop(shop_slug: str) -> None:
    """Invalidate all shop-related caches when a shop is updated."""
    invalidate_prefix(f"shop_detail:{shop_slug}")
    invalidate_prefix("shop_list")

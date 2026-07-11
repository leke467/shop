"""
Celery tasks for the personalization app (Item 45).

- Refresh recommendation caches for all active users.
- Clean up stale events.
"""
from __future__ import annotations

import logging

from celery import shared_task
from django.utils import timezone

logger = logging.getLogger(__name__)


@shared_task
def refresh_all_recommendations():
    """
    Periodic task (beat): rebuild recommendation caches for users who have
    recent activity.  Intended to run every 6 hours via Celery Beat.
    """
    from django.contrib.auth import get_user_model
    from personalization.views import build_recommendations
    from personalization.models import RecommendationCache

    User = get_user_model()
    # Only refresh users who have logged in within the last 30 days.
    cutoff = timezone.now() - timezone.timedelta(days=30)
    active_users = User.objects.filter(
        last_login__gte=cutoff, is_active=True
    ).values_list("id", flat=True)

    count = 0
    for user_id in active_users:
        try:
            user = User.objects.get(pk=user_id)
            products = build_recommendations(user)
            product_ids = [p.pk for p in products]
            RecommendationCache.objects.update_or_create(
                user=user,
                defaults={
                    "product_ids": product_ids,
                    "generated_at": timezone.now(),
                    "strategy": "category_shop_affinity_v1",
                },
            )
            count += 1
        except Exception:
            logger.exception("Failed to refresh recommendations for user %s", user_id)

    logger.info("Refreshed recommendations for %d users", count)
    return count


@shared_task
def cleanup_old_events(days: int = 90):
    """
    Periodic task: delete personalization events older than N days to
    keep the table lean and queries fast.
    """
    from personalization.models import PersonalizationEvent

    cutoff = timezone.now() - timezone.timedelta(days=days)
    deleted, _ = PersonalizationEvent.objects.filter(created_at__lt=cutoff).delete()
    logger.info("Cleaned up %d old personalization events (>%d days)", deleted, days)
    return deleted

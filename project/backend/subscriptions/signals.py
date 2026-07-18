"""
Assign the free plan to every new user on creation.

Wired up in ``SubscriptionsConfig.ready``. Kept defensive: if plans aren't
seeded yet (e.g. during initial migrations), we log and skip rather than
breaking user creation.
"""
from __future__ import annotations

import logging

from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver

from .services import SubscriptionError, ensure_subscription

logger = logging.getLogger(__name__)


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def assign_free_plan_on_signup(sender, instance, created, **kwargs):
    if not created:
        return
    try:
        ensure_subscription(instance)
    except SubscriptionError:
        # Plans not seeded yet — the free plan will be assigned lazily by
        # get_current_plan() on first access. Safe to skip here.
        logger.warning(
            "Could not assign free plan to user %s (plans not seeded yet).",
            instance.pk,
        )

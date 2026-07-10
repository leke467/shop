"""Signal handlers for the accounts app."""
from __future__ import annotations

from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import BuyerProfile


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_buyer_profile(sender, instance, created, **kwargs):
    """Every user gets a personalisation profile on creation."""
    if created:
        BuyerProfile.objects.get_or_create(user=instance)

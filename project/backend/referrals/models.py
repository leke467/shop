"""
Referral system models — ReferralCode, Referral, ReferralEarning.
"""
from __future__ import annotations

import secrets
import string
from decimal import Decimal

from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _

from core.models import TimeStampedModel


def generate_unique_code() -> str:
    """Generate a random uppercase 8-character referral code."""
    chars = string.ascii_uppercase + string.digits
    # Exclude ambiguous characters
    chars = chars.replace("0", "").replace("O", "").replace("1", "").replace("I", "")
    return "".join(secrets.choice(chars) for _ in range(8))


class ReferralCode(TimeStampedModel):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="referral_code_obj",
    )
    code = models.CharField(max_length=32, unique=True, db_index=True)
    total_clicks = models.PositiveIntegerField(default=0)
    total_referred_sellers = models.PositiveIntegerField(default=0)
    total_referred_buyers = models.PositiveIntegerField(default=0)
    total_earnings = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal("0.00")
    )

    def save(self, *args, **kwargs):
        if not self.code:
            code = generate_unique_code()
            while ReferralCode.objects.filter(code=code).exists():
                code = generate_unique_code()
            self.code = code
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return f"{self.user.email} ({self.code})"


class Referral(TimeStampedModel):
    referrer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="referrals_made",
    )
    referred_user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="referred_by_relation",
    )
    referral_code = models.ForeignKey(
        ReferralCode,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="referrals",
    )

    def __str__(self) -> str:
        return f"{self.referrer.email} referred {self.referred_user.email}"


class ReferralEarning(TimeStampedModel):
    class Type(models.TextChoices):
        SUBSCRIPTION = "subscription", _("Vendor Subscription Reward")
        COMMISSION = "commission", _("Order Sales Commission Share")

    referrer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="referral_earnings",
    )
    referred_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="triggered_referral_earnings",
    )
    earning_type = models.CharField(max_length=32, choices=Type.choices)
    gross_amount = models.DecimalField(max_digits=12, decimal_places=2)
    reward_amount = models.DecimalField(max_digits=12, decimal_places=2)
    notes = models.CharField(max_length=255, blank=True)

    def __str__(self) -> str:
        return f"₦{self.reward_amount} to {self.referrer.email} ({self.earning_type})"

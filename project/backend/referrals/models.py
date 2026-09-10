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


class ReferralWallet(TimeStampedModel):
    """
    Dedicated wallet for tracking referral commissions and earnings.
    Completely decoupled from seller/shop wallets so any user (buyer or seller)
    can refer and withdraw without needing a shop or seller KYC.
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="referral_wallet",
    )
    balance = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal("0.00")
    )
    total_earned = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal("0.00")
    )
    total_withdrawn = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal("0.00")
    )
    currency = models.CharField(max_length=3, default="NGN")

    def __str__(self) -> str:
        return f"ReferralWallet<{self.user.email}> ₦{self.balance}"

    def credit(self, amount: Decimal, notes: str = "", reference: str = "") -> ReferralTransaction:
        """Add referral reward to available balance."""
        if amount <= Decimal("0.00"):
            return None
        self.balance += amount
        self.total_earned += amount
        self.save(update_fields=["balance", "total_earned", "updated_at"])
        return ReferralTransaction.objects.create(
            wallet=self,
            user=self.user,
            kind=ReferralTransaction.Kind.EARNING,
            amount=amount,
            balance_after=self.balance,
            reference=reference,
            notes=notes,
        )

    def debit(self, amount: Decimal, notes: str = "", reference: str = "") -> ReferralTransaction:
        """Deduct funds when a payout/withdrawal is requested."""
        if amount <= Decimal("0.00"):
            return None
        self.balance -= amount
        self.total_withdrawn += amount
        self.save(update_fields=["balance", "total_withdrawn", "updated_at"])
        return ReferralTransaction.objects.create(
            wallet=self,
            user=self.user,
            kind=ReferralTransaction.Kind.WITHDRAWAL,
            amount=amount,
            balance_after=self.balance,
            reference=reference,
            notes=notes,
        )


class ReferralBankAccount(TimeStampedModel):
    """A bank account linked to a user for receiving referral payouts."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="referral_bank_accounts",
    )
    bank_name = models.CharField(max_length=255)
    account_number = models.CharField(max_length=50)
    account_name = models.CharField(max_length=255)
    bank_code = models.CharField(max_length=50, blank=True)
    is_default = models.BooleanField(default=False)

    def __str__(self) -> str:
        return f"{self.user.email} - {self.bank_name} ({self.account_number})"


class ReferralPayoutRequest(TimeStampedModel):
    """A request to withdraw earnings from the referral wallet to a bank account."""

    class Status(models.TextChoices):
        PENDING = "pending", _("Pending")
        PROCESSING = "processing", _("Processing")
        COMPLETED = "completed", _("Completed")
        FAILED = "failed", _("Failed")

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="referral_payout_requests",
    )
    wallet = models.ForeignKey(
        ReferralWallet,
        on_delete=models.CASCADE,
        related_name="payout_requests",
    )
    bank_account = models.ForeignKey(
        ReferralBankAccount,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="payouts",
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.PENDING
    )
    bank_name = models.CharField(max_length=255)
    account_number = models.CharField(max_length=50)
    account_name = models.CharField(max_length=255)
    bank_code = models.CharField(max_length=50, blank=True)
    provider_reference = models.CharField(max_length=255, blank=True)
    failure_reason = models.TextField(blank=True)
    processed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self) -> str:
        return f"Referral Payout ₦{self.amount} for {self.user.email} ({self.get_status_display()})"


class ReferralTransaction(TimeStampedModel):
    """Ledger entry for credits and debits to a referral wallet."""

    class Kind(models.TextChoices):
        EARNING = "earning", _("Referral Earning")
        WITHDRAWAL = "withdrawal", _("Withdrawal")
        ADJUSTMENT = "adjustment", _("Manual Adjustment")

    wallet = models.ForeignKey(
        ReferralWallet,
        on_delete=models.CASCADE,
        related_name="transactions",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="referral_transactions",
    )
    kind = models.CharField(max_length=20, choices=Kind.choices)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    balance_after = models.DecimalField(
        max_digits=12, decimal_places=2,
        help_text="Wallet balance after this transaction.",
    )
    reference = models.CharField(max_length=255, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self) -> str:
        return f"{self.get_kind_display()} ₦{self.amount} → {self.user.email}"

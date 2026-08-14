"""
Referral reward processing service.
"""
from __future__ import annotations

import logging
from decimal import Decimal

from django.conf import settings
from django.db import transaction

from orders.models import SellerWallet, WalletTransaction
from referrals.models import Referral, ReferralCode, ReferralEarning

logger = logging.getLogger(__name__)


def process_subscription_referral_reward(subscription) -> Decimal:
    """
    Called when a shop subscription is activated or renewed.
    If the shop owner was referred by someone, rewards the referrer with ₦500
    (or SUBSCRIPTION_REFERRAL_BONUS setting).
    """
    shop = getattr(subscription, "shop", None)
    if not shop or not shop.owner:
        return Decimal("0.00")

    owner = shop.owner
    try:
        referral = Referral.objects.select_related("referrer", "referral_code").get(referred_user=owner)
    except Referral.DoesNotExist:
        return Decimal("0.00")

    referrer = referral.referrer
    bonus = getattr(settings, "SUBSCRIPTION_REFERRAL_BONUS", Decimal("500.00"))
    gross = Decimal(str(getattr(subscription, "price", 3500)))

    with transaction.atomic():
        # Get or create seller wallet for referrer
        from shops.models import Shop
        referrer_shop = Shop.objects.filter(owner=referrer).first()
        if not referrer_shop:
            # Create a placeholder shop or associate wallet directly
            referrer_shop, _ = Shop.objects.get_or_create(
                owner=referrer,
                defaults={"name": f"{referrer.email.split('@')[0]}'s Store", "slug": f"user-{referrer.pk}-wallet"},
            )

        wallet, _ = SellerWallet.objects.select_for_update().get_or_create(
            shop=referrer_shop,
            defaults={"currency": "NGN"},
        )
        wallet.credit(bonus)

        WalletTransaction.objects.create(
            wallet=wallet,
            kind=WalletTransaction.Kind.ESCROW_RELEASE,
            amount=bonus,
            balance_after=wallet.balance,
            reference=f"ref-sub-{subscription.pk}",
            notes=f"Referral reward: {owner.email} subscribed to {getattr(subscription, 'plan_name', 'Plan')}",
        )

        ReferralEarning.objects.create(
            referrer=referrer,
            referred_user=owner,
            earning_type=ReferralEarning.Type.SUBSCRIPTION,
            gross_amount=gross,
            reward_amount=bonus,
            notes=f"Subscription bonus for {owner.email}",
        )

        if referral.referral_code:
            referral.referral_code.total_earnings += bonus
            referral.referral_code.save(update_fields=["total_earnings", "updated_at"])

    logger.info("Subscription referral reward ₦%s credited to %s for %s", bonus, referrer.email, owner.email)
    return bonus


def process_order_referral_reward(order_group) -> Decimal:
    """
    Called when order escrow is released.
    If the order group's shop owner was referred, rewards the referrer with 20%
    (or COMMISSION_REFERRAL_SHARE setting) of MultiShopNG's platform commission.
    """
    shop = getattr(order_group, "shop", None)
    if not shop or not shop.owner:
        return Decimal("0.00")

    owner = shop.owner
    try:
        referral = Referral.objects.select_related("referrer", "referral_code").get(referred_user=owner)
    except Referral.DoesNotExist:
        return Decimal("0.00")

    referrer = referral.referrer
    commission = getattr(order_group, "commission_fee", Decimal("0.00"))
    if commission <= Decimal("0.00"):
        return Decimal("0.00")

    share_pct = getattr(settings, "COMMISSION_REFERRAL_SHARE", Decimal("20.0"))
    reward_amount = (commission * (share_pct / Decimal("100.0"))).quantize(Decimal("0.01"))

    if reward_amount <= Decimal("0.00"):
        return Decimal("0.00")

    with transaction.atomic():
        from shops.models import Shop
        referrer_shop = Shop.objects.filter(owner=referrer).first()
        if not referrer_shop:
            referrer_shop, _ = Shop.objects.get_or_create(
                owner=referrer,
                defaults={"name": f"{referrer.email.split('@')[0]}'s Store", "slug": f"user-{referrer.pk}-wallet"},
            )

        wallet, _ = SellerWallet.objects.select_for_update().get_or_create(
            shop=referrer_shop,
            defaults={"currency": "NGN"},
        )
        wallet.credit(reward_amount)

        WalletTransaction.objects.create(
            wallet=wallet,
            kind=WalletTransaction.Kind.ESCROW_RELEASE,
            amount=reward_amount,
            balance_after=wallet.balance,
            reference=f"ref-ord-{order_group.pk}",
            notes=f"Referral share ({share_pct}%) of commission on order #{order_group.order.public_id}",
        )

        ReferralEarning.objects.create(
            referrer=referrer,
            referred_user=owner,
            earning_type=ReferralEarning.Type.COMMISSION,
            gross_amount=order_group.subtotal,
            reward_amount=reward_amount,
            notes=f"Commission share for order #{order_group.order.public_id}",
        )

        if referral.referral_code:
            referral.referral_code.total_earnings += reward_amount
            referral.referral_code.save(update_fields=["total_earnings", "updated_at"])

    logger.info("Order referral reward ₦%s credited to %s for shop %s", reward_amount, referrer.email, shop.name)
    return reward_amount

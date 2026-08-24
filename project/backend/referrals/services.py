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


def process_subscription_referral_reward(subscription, actual_amount_paid=None) -> Decimal:
    """
    Called when a shop subscription is activated or renewed.
    If the shop owner was referred by someone, rewards the referrer with ₦500
    (or SUBSCRIPTION_REFERRAL_BONUS setting), but strictly capped by actual amount paid
    so free or heavily discounted coupon subscriptions do not generate losses.
    """
    shop = getattr(subscription, "shop", None)
    owner = getattr(subscription, "user", None) or (shop.owner if shop else None)
    if not owner:
        return Decimal("0.00")

    try:
        referral = Referral.objects.select_related("referrer", "referral_code").get(referred_user=owner)
    except Referral.DoesNotExist:
        return Decimal("0.00")

    referrer = referral.referrer

    # Determine net amount paid (accounting for coupons/discounts)
    if actual_amount_paid is not None:
        net_paid = Decimal(str(actual_amount_paid))
    else:
        net_paid = Decimal(str(getattr(subscription, "amount_paid", getattr(getattr(subscription, "plan", None), "monthly_price", 0))))

    if net_paid <= Decimal("0.00"):
        logger.info("Subscription for %s was ₦0 / free coupon; no referral reward awarded.", owner.email)
        return Decimal("0.00")

    configured_bonus = getattr(settings, "SUBSCRIPTION_REFERRAL_BONUS", Decimal("500.00"))
    # Reward is capped to 20% of actual paid amount or configured bonus
    bonus = min(configured_bonus, (net_paid * Decimal("0.20")).quantize(Decimal("0.01")))
    if bonus <= Decimal("0.00"):
        return Decimal("0.00")

    gross = net_paid

    ref_key = f"ref-sub-{subscription.pk}"
    if WalletTransaction.objects.filter(reference=ref_key).exists():
        logger.info("Subscription referral reward already processed for %s", ref_key)
        return Decimal("0.00")

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
            reference=ref_key,
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

    ref_ord_key = f"ref-ord-{order_group.pk}"
    if WalletTransaction.objects.filter(reference=ref_ord_key).exists():
        logger.info("Order referral reward already processed for %s", ref_ord_key)
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
            reference=ref_ord_key,
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

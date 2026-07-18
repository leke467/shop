"""
Escrow & delivery-code services.

confirm_delivery_code()  — seller enters the 6-digit code → escrow released.
dispute_order()          — buyer opens a dispute → escrow frozen.
"""
from __future__ import annotations

import logging
from decimal import Decimal

from django.db import transaction
from django.utils import timezone

from orders.models import OrderGroup, SellerWallet, WalletTransaction

logger = logging.getLogger(__name__)


class EscrowError(Exception):
    pass


def confirm_delivery_code(
    order_group: OrderGroup,
    code_attempt: str,
    *,
    requesting_user=None,
) -> bool:
    """
    Seller enters the delivery code.  If it matches:
      1. Mark escrow as RELEASED.
      2. Credit the seller's wallet.
      3. Mark the order group as DELIVERED.

    Returns True on success, raises EscrowError on failure.
    """
    if order_group.escrow_status != OrderGroup.EscrowStatus.HELD:
        raise EscrowError(
            f"Cannot confirm delivery: escrow is already "
            f"{order_group.get_escrow_status_display()}."
        )

    # Verify the seller owns this shop.
    if requesting_user and order_group.shop.owner != requesting_user:
        raise EscrowError("You are not the owner of this shop.")

    # Check the code.
    if code_attempt.strip() != order_group.delivery_code:
        raise EscrowError("Invalid delivery code.")

    now = timezone.now()

    with transaction.atomic():
        # Release escrow.
        order_group.escrow_status = OrderGroup.EscrowStatus.RELEASED
        order_group.delivery_code_confirmed_at = now
        order_group.escrow_released_at = now
        order_group.status = OrderGroup.FulfilmentStatus.DELIVERED
        order_group.save(update_fields=[
            "escrow_status", "delivery_code_confirmed_at",
            "escrow_released_at", "status", "updated_at",
        ])

        # Credit the seller's wallet.
        release_amount = order_group.subtotal + order_group.shipping_total
        wallet, _created = SellerWallet.objects.get_or_create(
            shop=order_group.shop,
            defaults={"currency": order_group.order.currency},
        )
        wallet.credit(release_amount)

        # Record the ledger entry.
        WalletTransaction.objects.create(
            wallet=wallet,
            kind=WalletTransaction.Kind.ESCROW_RELEASE,
            amount=release_amount,
            balance_after=wallet.balance,
            reference=str(order_group.order.public_id),
            notes=f"Delivery confirmed for order #{order_group.order.public_id}",
        )

    logger.info(
        "Escrow released: group=%s amount=%s wallet_balance=%s",
        order_group.pk, release_amount, wallet.balance,
    )
    return True


def dispute_order(
    order_group: OrderGroup,
    buyer,
    reason: str = "",
) -> None:
    """
    Buyer opens a dispute on an order group.
    Freezes escrow — funds are not released until admin resolves.
    """
    if order_group.order.user != buyer:
        raise EscrowError("Only the buyer can open a dispute.")

    if order_group.escrow_status not in (
        OrderGroup.EscrowStatus.HELD,
    ):
        raise EscrowError(
            f"Cannot dispute: escrow is already "
            f"{order_group.get_escrow_status_display()}."
        )

    order_group.escrow_status = OrderGroup.EscrowStatus.DISPUTED
    order_group.dispute_reason = reason
    order_group.save(update_fields=["escrow_status", "dispute_reason", "updated_at"])

    logger.info(
        "Dispute opened: group=%s buyer=%s reason=%s",
        order_group.pk, buyer.email, reason[:80],
    )

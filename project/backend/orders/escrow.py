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

    Security: Uses select_for_update() on both the OrderGroup and
    SellerWallet rows to prevent double-release race conditions (C1).
    """
    with transaction.atomic():
        # Lock the OrderGroup row to prevent concurrent confirmation (C1).
        locked_group = (
            OrderGroup.objects
            .select_for_update()
            .select_related("shop", "order")
            .get(pk=order_group.pk)
        )

        if locked_group.escrow_status != OrderGroup.EscrowStatus.HELD:
            raise EscrowError(
                f"Cannot confirm delivery: escrow is already "
                f"{locked_group.get_escrow_status_display()}."
            )

        # Verify the seller owns this shop.
        if requesting_user and locked_group.shop.owner != requesting_user:
            raise EscrowError("You are not the owner of this shop.")

        # Check the code.
        if code_attempt.strip() != locked_group.delivery_code:
            raise EscrowError("Invalid delivery code.")

        now = timezone.now()

        # Calculate commission (on subtotal only)
        commission = locked_group.subtotal * (locked_group.shop.commission_rate / Decimal("100.0"))
        
        # Release escrow.
        locked_group.escrow_status = OrderGroup.EscrowStatus.RELEASED
        locked_group.delivery_code_confirmed_at = now
        locked_group.escrow_released_at = now
        locked_group.status = OrderGroup.FulfilmentStatus.DELIVERED
        locked_group.commission_fee = commission
        locked_group.save(update_fields=[
            "escrow_status", "delivery_code_confirmed_at",
            "escrow_released_at", "status", "commission_fee", "updated_at",
        ])

        # Credit the seller's wallet: (Subtotal - Commission) + (Shipping Total - Logistics Markup).
        # The seller receives the base delivery fee; the platform retains commission + logistics markup.
        # Lock the wallet row to prevent concurrent credit (C1).
        net_shipping = max(Decimal("0.00"), locked_group.shipping_total - getattr(locked_group, "logistics_markup", Decimal("0.00")))
        release_amount = (locked_group.subtotal - commission) + net_shipping
        wallet, _created = SellerWallet.objects.select_for_update().get_or_create(
            shop=locked_group.shop,
            defaults={"currency": locked_group.order.currency},
        )
        wallet.credit(release_amount)

        # Record the ledger entry.
        WalletTransaction.objects.create(
            wallet=wallet,
            kind=WalletTransaction.Kind.ESCROW_RELEASE,
            amount=release_amount,
            balance_after=wallet.balance,
            reference=str(locked_group.order.public_id),
            notes=f"Delivery confirmed for order #{locked_group.order.public_id}",
        )

    logger.info(
        "Escrow released: group=%s amount=%s wallet_balance=%s",
        locked_group.pk, release_amount, wallet.balance,
    )
    
    # --- Send Notification Email ---
    from core.emails import send_escrow_released_email
    send_escrow_released_email(locked_group, release_amount)
    
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

    # --- Send Notification Email ---
    from core.emails import send_dispute_opened_email
    send_dispute_opened_email(order_group, reason)

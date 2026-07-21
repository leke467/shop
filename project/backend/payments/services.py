"""
Checkout service — race-safe order creation with payment (Items 40-41, 43).

This is the single entry point for converting a cart into a paid order.
It uses ``select_for_update()`` on inventory to prevent overselling and
idempotency keys to prevent duplicate charges.
"""
from __future__ import annotations

import logging
from decimal import Decimal

from django.db import transaction
from django.utils import timezone

from orders.models import Cart, CartItem, Order, OrderGroup, OrderItem
from payments.gateways import get_gateway
from payments.models import Payment, Transaction
from products.models import Inventory
from shops.models import DeliveryZone

logger = logging.getLogger(__name__)


class CheckoutError(Exception):
    """Raised when checkout fails for a business-logic reason."""
    pass


class InsufficientStockError(CheckoutError):
    pass


class DuplicateOrderError(CheckoutError):
    pass


def checkout(
    user,
    provider: str,
    shipping_data: dict,
    idempotency_key: str,
    notes: str = "",
    delivery_state: str = "",
    manual_delivery_shops: list[str] = None,
    **provider_kwargs,
) -> Order:
    """
    Convert the user's cart into a paid order.

    1. Validate cart is not empty.
    2. Lock inventory rows (select_for_update) — Item 40.
    3. Check idempotency key — Item 41.
    4. Create Order + OrderGroups + OrderItems.
    5. Reserve inventory.
    6. Charge via payment gateway.
    7. Confirm order on success, or release inventory on failure.

    Returns the created Order on success; raises CheckoutError on failure.
    """
    cart = Cart.objects.filter(user=user).prefetch_related(
        "items__variant__product__shop",
        "items__variant__inventory",
    ).first()

    if not cart or not cart.items.exists():
        raise CheckoutError("Cart is empty.")

    # --- Item 41: Idempotency check ---
    if Order.objects.filter(idempotency_key=idempotency_key).exists():
        existing = Order.objects.get(idempotency_key=idempotency_key)
        if existing.user == user:
            raise DuplicateOrderError(
                f"Order already exists for this idempotency key: {existing.public_id}"
            )

    with transaction.atomic():
        cart_items = list(cart.items.select_related(
            "variant__product__shop", "variant__inventory"
        ))

        # --- Item 40: Lock inventory rows ---
        variant_ids = [item.variant_id for item in cart_items]
        inventories = {
            inv.variant_id: inv
            for inv in Inventory.objects.filter(
                variant_id__in=variant_ids
            ).select_for_update()
        }

        # Validate stock.
        for item in cart_items:
            inv = inventories.get(item.variant_id)
            if inv and inv.track_inventory:
                available = inv.quantity - inv.reserved
                if available < item.quantity and not inv.allow_backorder:
                    raise InsufficientStockError(
                        f"Insufficient stock for {item.variant.name or item.variant.sku}: "
                        f"requested {item.quantity}, available {available}"
                    )

        # --- Create Order ---
        order = Order.objects.create(
            user=user,
            idempotency_key=idempotency_key,
            status=Order.Status.PENDING,
            currency=cart_items[0].variant.product.shop.currency if cart_items else "USD",
            notes=notes,
            **{f"shipping_{k}": v for k, v in shipping_data.items()},
        )

        # --- Create OrderGroups (one per shop) + OrderItems ---
        shops_seen = {}
        subtotal = Decimal("0")

        for item in cart_items:
            shop = item.variant.product.shop
            if shop.pk not in shops_seen:
                manual_delivery = manual_delivery_shops and shop.slug in manual_delivery_shops
                
                if manual_delivery:
                    if not shop.allow_manual_delivery:
                        raise CheckoutError(f"Manual delivery is not supported by shop: {shop.name}")
                    shipping_fee = Decimal("0")
                else:
                    zone = DeliveryZone.objects.filter(shop=shop, state=delivery_state, is_active=True).first()
                    if not zone:
                        raise CheckoutError(f"Delivery is not available to {delivery_state} for shop: {shop.name}")
                    shipping_fee = zone.fee

                group = OrderGroup.objects.create(
                    order=order,
                    shop=shop,
                    status=OrderGroup.Status.PENDING,
                    subtotal=Decimal("0"),
                    shipping_total=shipping_fee,
                    delivery_code=OrderGroup.generate_delivery_code(),
                    escrow_status=OrderGroup.EscrowStatus.HELD,
                )
                shops_seen[shop.pk] = group
            else:
                group = shops_seen[shop.pk]

            line_total = item.unit_price * item.quantity
            OrderItem.objects.create(
                group=group,
                product_name=item.variant.product.name,
                variant_name=item.variant.name,
                sku=item.variant.sku,
                quantity=item.quantity,
                unit_price=item.unit_price,
                currency=order.currency,
            )
            group.subtotal += line_total
            subtotal += line_total

        # Update group subtotals.
        for group in shops_seen.values():
            group.save(update_fields=["subtotal"])

        # Update order totals.
        order.subtotal = subtotal
        order.shipping_total = sum(g.shipping_total for g in shops_seen.values())
        order.grand_total = subtotal + order.shipping_total + order.tax_total - order.discount_total
        order.save(update_fields=["subtotal", "shipping_total", "grand_total"])

        # --- Reserve inventory ---
        for item in cart_items:
            inv = inventories.get(item.variant_id)
            if inv and inv.track_inventory:
                inv.reserved += item.quantity
                inv.save(update_fields=["reserved"])

    # --- Charge payment (outside the inventory lock) ---
    gateway = get_gateway(provider)
    result = gateway.charge(
        amount=order.grand_total,
        currency=order.currency,
        idempotency_key=str(idempotency_key),
        metadata={"order_id": str(order.public_id)},
        **provider_kwargs,
    )

    # Create Payment + Transaction records.
    payment = Payment.objects.create(
        order=order,
        user=user,
        provider=provider,
        amount=order.grand_total,
        currency=order.currency,
        idempotency_key=idempotency_key,
        provider_payment_id=result.provider_payment_id,
        status=Payment.Status.CAPTURED if result.success else Payment.Status.FAILED,
        captured_at=timezone.now() if result.success else None,
        failed_at=None if result.success else timezone.now(),
        failure_reason="" if result.success else result.error_message,
    )
    Transaction.objects.create(
        payment=payment,
        kind=Transaction.Kind.CHARGE,
        status=Transaction.Status.SUCCESS if result.success else Transaction.Status.FAILED,
        amount=order.grand_total,
        currency=order.currency,
        provider_txn_id=result.provider_txn_id,
        provider_response=result.raw_response,
        error_code=result.error_code,
        error_message=result.error_message,
    )

    if result.success:
        # --- Confirm order ---
        order.status = Order.Status.CONFIRMED
        order.confirmed_at = timezone.now()
        order.save(update_fields=["status", "confirmed_at"])

        # Deduct reserved → actual stock.
        with transaction.atomic():
            for item in cart_items:
                inv = inventories.get(item.variant_id)
                if inv and inv.track_inventory:
                    Inventory.objects.filter(pk=inv.pk).update(
                        quantity=models_F("quantity") - item.quantity,
                        reserved=models_F("reserved") - item.quantity,
                    )

        # Clear the cart.
        cart.items.all().delete()

        logger.info("Checkout success: order=%s payment=%s", order.public_id, payment.public_id)
        
        # --- Send Notification Emails ---
        from core.emails import send_order_placed_buyer_email, send_order_placed_seller_email
        order_groups = list(order.groups.all())
        send_order_placed_buyer_email(order, order_groups)
        for group in order_groups:
            send_order_placed_seller_email(group)
            
    else:
        # --- Release inventory reservations ---
        with transaction.atomic():
            for item in cart_items:
                inv = inventories.get(item.variant_id)
                if inv and inv.track_inventory:
                    Inventory.objects.filter(pk=inv.pk).update(
                        reserved=models_F("reserved") - item.quantity,
                    )

        order.status = Order.Status.CANCELLED
        order.cancelled_at = timezone.now()
        order.save(update_fields=["status", "cancelled_at"])

        raise CheckoutError(f"Payment failed: {result.error_message}")

    return order


# Alias for F() — avoids confusion with other 'F' names.
from django.db.models import F as models_F  # noqa: E402


# ---------------------------------------------------------------------------
# Item 43 — Refund flow
# ---------------------------------------------------------------------------

def process_refund(
    payment: Payment,
    amount: Decimal,
    reason: str = "customer_request",
    notes: str = "",
) -> "Refund":
    """
    Process a partial or full refund for a captured payment.
    """
    from payments.models import Refund

    if not payment.is_captured and payment.status != Payment.Status.PARTIALLY_REFUNDED:
        raise CheckoutError("Cannot refund a payment that is not captured.")

    already_refunded = payment.refunded_amount
    if amount > (payment.amount - already_refunded):
        raise CheckoutError(
            f"Refund amount {amount} exceeds refundable balance "
            f"{payment.amount - already_refunded}"
        )

    gateway = get_gateway(payment.provider)
    result = gateway.refund(
        provider_payment_id=payment.provider_payment_id,
        amount=amount,
        reason=reason,
    )

    refund = Refund.objects.create(
        payment=payment,
        amount=amount,
        currency=payment.currency,
        reason=reason,
        notes=notes,
        provider_refund_id=result.provider_refund_id,
        provider_response=result.raw_response,
        status=Refund.Status.COMPLETED if result.success else Refund.Status.FAILED,
        completed_at=timezone.now() if result.success else None,
    )

    if result.success:
        total_refunded = already_refunded + amount
        if total_refunded >= payment.amount:
            payment.status = Payment.Status.REFUNDED
        else:
            payment.status = Payment.Status.PARTIALLY_REFUNDED
        payment.save(update_fields=["status"])

        logger.info(
            "Refund processed: payment=%s amount=%s refund=%s",
            payment.public_id, amount, refund.public_id,
        )
    else:
        raise CheckoutError(f"Refund failed: {result.error_message}")

    return refund

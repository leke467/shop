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
    shop_slug: str = None,
    coupon_code: str = "",
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

        if shop_slug:
            shop_items = [i for i in cart_items if i.variant.product.shop.slug == shop_slug]
            if shop_items:
                cart_items = shop_items

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
                    markup_amount = Decimal("0")
                else:
                    norm_state = str(delivery_state or "lagos").strip().lower().replace(" ", "_").replace("-", "_")
                    alias_map = {
                        "abuja": "fct",
                        "abuja_(fct)": "fct",
                        "fct_(abuja)": "fct",
                        "federal_capital_territory": "fct",
                        "akwa_ibom": "akwa_ibom",
                        "cross_river": "cross_river",
                    }
                    lookup_state = alias_map.get(norm_state, norm_state)

                    zone = (
                        DeliveryZone.objects.filter(shop=shop, state=lookup_state, is_active=True).first()
                        or DeliveryZone.objects.filter(shop=shop, state__iexact=lookup_state, is_active=True).first()
                        or DeliveryZone.objects.filter(shop=shop, state__iexact=delivery_state, is_active=True).first()
                    )

                    if zone:
                        shipping_fee = Decimal(str(zone.fee))
                        markup_amount = Decimal("0")
                    else:
                        shipping_fee = Decimal("0")
                        markup_amount = Decimal("0")

                group = OrderGroup.objects.create(
                    order=order,
                    shop=shop,
                    status=OrderGroup.FulfilmentStatus.PENDING,
                    subtotal=Decimal("0"),
                    shipping_total=shipping_fee,
                    logistics_markup=markup_amount,
                    delivery_code=OrderGroup.generate_delivery_code(),
                    escrow_status=OrderGroup.EscrowStatus.PENDING,
                )
                shops_seen[shop.pk] = group
            else:
                group = shops_seen[shop.pk]

            # Enforce live current variant price to prevent price tampering or stale cart exploit
            live_price = item.variant.price if item.variant and item.variant.price is not None else item.unit_price
            line_total = live_price * item.quantity
            OrderItem.objects.create(
                group=group,
                variant=item.variant,
                product_name=item.variant.product.name,
                variant_name=item.variant.name,
                sku=item.variant.sku,
                quantity=item.quantity,
                unit_price=live_price,
                currency=order.currency,
            )
            group.subtotal += line_total
            subtotal += line_total

        # Update group subtotals.
        for group in shops_seen.values():
            group.save(update_fields=["subtotal"])

        # --- Process Coupon / Discount ---
        discount_amount = Decimal("0.00")
        applied_coupon_id = None
        if coupon_code and str(coupon_code).strip():
            from orders.models import Coupon
            coupon = Coupon.objects.filter(code__iexact=str(coupon_code).strip()).first()
            if not coupon:
                raise CheckoutError("Invalid coupon code.")
            if not coupon.is_valid:
                raise CheckoutError("This coupon is expired or inactive.")
            
            min_val = coupon.minimum_order_value or Decimal("0.00")
            if min_val > Decimal("0.00") and subtotal < min_val:
                raise CheckoutError(f"Minimum order value of ₦{min_val:,.2f} required for this coupon.")

            applicable_subtotal = subtotal
            if coupon.shop:
                shop_group = shops_seen.get(coupon.shop.pk)
                if not shop_group:
                    raise CheckoutError("Coupon is only valid for items from a specific shop.")
                applicable_subtotal = shop_group.subtotal

            coupon_val = coupon.value or Decimal("0.00")
            if coupon.discount_type == Coupon.DiscountType.PERCENTAGE:
                discount_amount = (applicable_subtotal * coupon_val) / Decimal("100.0") if applicable_subtotal > Decimal("0.00") else Decimal("0.00")
            else:
                discount_amount = coupon_val
            discount_amount = min(discount_amount, subtotal).quantize(Decimal("0.01"))
            applied_coupon_id = coupon.pk

        # Update order totals.
        order.subtotal = subtotal
        order.discount_total = discount_amount
        order.tax_total = (max(Decimal("0.00"), subtotal - discount_amount) * Decimal("0.075")).quantize(Decimal("0.01"))
        order.shipping_total = sum(g.shipping_total for g in shops_seen.values())
        order.grand_total = max(Decimal("0.00"), subtotal - discount_amount) + order.shipping_total + order.tax_total
        order.save(update_fields=["subtotal", "discount_total", "tax_total", "shipping_total", "grand_total"])

        # --- Reserve inventory ---
        for item in cart_items:
            inv = inventories.get(item.variant_id)
            if inv and inv.track_inventory:
                inv.reserved += item.quantity
                inv.save(update_fields=["reserved"])

    # Attach coupon metadata to payment kwargs if used
    if applied_coupon_id:
        provider_kwargs.setdefault("metadata", {})
        provider_kwargs["metadata"]["coupon_id"] = applied_coupon_id

    # --- Charge payment (outside the inventory lock) ---
    gateway = get_gateway(provider)
    result = gateway.charge(
        amount=order.grand_total,
        currency=order.currency,
        idempotency_key=str(idempotency_key),
        metadata={"order_id": str(order.public_id)},
        **provider_kwargs,
    )

    # --- Pending (out-of-band) payments ---
    # Covers: manual bank transfer, Paystack (popup completes later), etc.
    # The charge "succeeded" in the sense that we captured the buyer's intent,
    # but no funds have moved yet.  Keep the order and inventory reserved and
    # hand back the provider-specific data (transfer details or access_code).
    # Confirmation happens later via webhook or the verify endpoint.
    if result.success and result.pending:
        payment = Payment.objects.create(
            order=order,
            user=user,
            provider=provider,
            amount=order.grand_total,
            currency=order.currency,
            idempotency_key=idempotency_key,
            provider_payment_id=result.provider_payment_id,
            status=Payment.Status.AWAITING_TRANSFER,
            metadata={"transfer": result.raw_response},
        )
        Transaction.objects.create(
            payment=payment,
            kind=Transaction.Kind.CHARGE,
            status=Transaction.Status.PENDING,
            amount=order.grand_total,
            currency=order.currency,
            provider_txn_id=result.provider_txn_id,
            provider_response=result.raw_response,
        )
        logger.info(
            "Pending payment initiated: provider=%s order=%s payment=%s ref=%s",
            provider, order.public_id, payment.public_id, result.provider_payment_id,
        )
        # Attach the payment data so the view can surface it to the frontend
        # (bank transfer details, Paystack access_code, etc.).
        order._payment_instructions = {
            "provider": provider,
            "status": payment.status,
            "reference": result.provider_payment_id,
            "amount": str(order.grand_total),
            "currency": order.currency,
            **result.raw_response,
        }
        return order

    # --- Synchronous capture (e.g. Stripe immediate capture) ---
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
        # Confirm immediately (synchronous providers like Stripe).
        confirm_pending_payment(payment)
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


# ---------------------------------------------------------------------------
# Shared: confirm a pending payment and its order
# ---------------------------------------------------------------------------

def confirm_pending_payment(payment: Payment, *, verified_by=None) -> None:
    """
    Mark a pending/awaiting payment as captured and confirm its order.

    This is the **single entry point** for transitioning a payment from a
    pending state (``AWAITING_TRANSFER`` or ``PENDING``) to ``CAPTURED``.
    It is called by:
      - The Paystack/Stripe webhook handler (auto-confirmation)
      - The ``confirm_bank_transfer`` admin action
      - The ``PaystackVerifyView`` (frontend verify-after-popup)
      - Synchronous capture in ``checkout()`` (Stripe instant)

    Steps:
      1. Mark payment as CAPTURED.
      2. Mark pending transactions as SUCCESS.
      3. Confirm the order (status → CONFIRMED).
      4. Confirm each escrow group (HELD but funded).
      5. Deduct reserved → actual stock.
      6. Clear the buyer's cart.
      7. Send notification emails.

    Raises CheckoutError if the payment is already captured/cancelled.
    """
    # Already captured — idempotent, just return.
    if payment.status == Payment.Status.CAPTURED:
        return

    allowed = (Payment.Status.AWAITING_TRANSFER, Payment.Status.PENDING, Payment.Status.PROCESSING)
    if payment.status not in allowed:
        raise CheckoutError(
            f"Cannot confirm a payment in status {payment.status!r}."
        )

    from orders.models import Order, OrderGroup, OrderItem
    from products.models import Inventory

    order = payment.order
    with transaction.atomic():
        payment.status = Payment.Status.CAPTURED
        payment.captured_at = timezone.now()
        if verified_by:
            if isinstance(payment.metadata, dict):
                payment.metadata.setdefault("verified_by", str(verified_by))
            else:
                payment.metadata = {"verified_by": str(verified_by)}
        payment.save(update_fields=["status", "captured_at", "metadata"])

        Transaction.objects.filter(
            payment=payment, status=Transaction.Status.PENDING,
        ).update(
            status=Transaction.Status.SUCCESS,
            error_code="",
            error_message="",
        )

        # Confirm the order (only if still pending).
        if order.status in (Order.Status.PENDING, Order.Status.CONFIRMED):
            order.status = Order.Status.CONFIRMED
            order.confirmed_at = order.confirmed_at or timezone.now()
            order.save(update_fields=["status", "confirmed_at"])

        # Confirm each escrow group and set escrow_status to HELD once payment is received.
        OrderGroup.objects.filter(
            order=order,
        ).update(
            status=OrderGroup.FulfilmentStatus.ACCEPTED,
            escrow_status=OrderGroup.EscrowStatus.HELD,
        )

        # Deduct reserved → actual stock & check for low stock alerts.
        for item in OrderItem.objects.filter(group__order=order).select_related("variant__product__shop__owner", "variant__inventory"):
            if item.variant_id:
                Inventory.objects.filter(
                    variant_id=item.variant_id, track_inventory=True,
                ).update(
                    quantity=models_F("quantity") - item.quantity,
                    reserved=models_F("reserved") - item.quantity,
                )
                # Check low stock threshold
                try:
                    inv = Inventory.objects.select_related("variant__product__shop__owner").filter(variant_id=item.variant_id, track_inventory=True).first()
                    if inv and inv.is_low:
                        product = inv.variant.product
                        shop = product.shop
                        if shop and shop.owner and shop.owner.email:
                            from notifications.tasks import send_low_stock_alert
                            send_low_stock_alert.delay(shop.owner.email, {
                                "user_name": shop.owner.first_name or shop.owner.email.split("@")[0],
                                "shop_name": shop.name,
                                "product_name": product.name,
                                "current_stock": inv.available,
                                "threshold": inv.low_stock_threshold,
                            })
                except Exception:
                    pass  # Non-blocking

        # Atomically increment coupon used_count if a coupon was redeemed on this order
        if order.discount_total > Decimal("0.00") and isinstance(payment.metadata, dict) and payment.metadata.get("coupon_id"):
            from orders.models import Coupon
            Coupon.objects.filter(pk=payment.metadata["coupon_id"]).update(used_count=models_F("used_count") + 1)

    # Clear the buyer's cart.
    cart = Cart.objects.filter(user=order.user).first()
    if cart:
        variant_ids = list(
            OrderItem.objects.filter(group__order=order).values_list(
                "variant_id", flat=True,
            )
        )
        cart.items.filter(variant_id__in=variant_ids).delete()

    # Emails
    try:
        from core.emails import send_order_placed_buyer_email, send_order_placed_seller_email
        order_groups = list(order.groups.all())
        send_order_placed_buyer_email(order, order_groups)
        for group in order_groups:
            send_order_placed_seller_email(group)
    except Exception:
        logger.exception("Failed to send order emails after payment confirmation")

    logger.info(
        "Payment confirmed: provider=%s payment=%s order=%s ref=%s",
        payment.provider, payment.public_id, order.public_id,
        payment.provider_payment_id,
    )


def confirm_bank_transfer(payment: Payment, *, verified_by=None) -> None:
    """
    Legacy convenience wrapper — confirms a bank transfer payment.

    Delegates entirely to ``confirm_pending_payment``.
    """
    if payment.status != Payment.Status.AWAITING_TRANSFER:
        raise CheckoutError(
            f"Cannot confirm a payment in status {payment.status!r}."
        )
    confirm_pending_payment(payment, verified_by=verified_by)

"""
Order domain models.

Architecture notes
------------------
Cart
    Server-side cart keyed on the authenticated user. A guest checkout flow
    can later be added via session-key carts without changing this schema.
    CartItem ties a quantity to a *ProductVariant* so variant selection is
    captured before the order is placed.

Order / OrderItem
    A single ``Order`` groups all items across one or more shops in one
    customer transaction. ``OrderGroup`` splits an order into per-shop
    fulfilment units so each shop owner sees and manages only their items.
    This lets us support "buy from multiple shops, pay once" without the
    shop layer knowing about other shops' orders.

State machine  (Order.Status)
    pending  →  confirmed  →  processing  →  shipped  →  delivered
                    ↓
                cancelled / refunded

    Transitions are validated in ``transition_status()`` so no illegal
    jumps can happen.  Payment status is tracked separately on the
    Payment model (P6) and linked back via ``order.payments``.

Race safety
    Item 40 (checkout): ``Inventory.reserved`` is incremented under a
    ``select_for_update()`` row lock inside an atomic transaction in the
    checkout service (orders/services.py, written in P6).  We keep that
    logic *out* of the model layer so the models stay thin and testable.

Idempotency
    ``idempotency_key`` on Order (a UUID the frontend generates before
    calling checkout) lets us detect duplicate submissions and return the
    existing order safely.
"""
from __future__ import annotations

import random
import uuid
from decimal import Decimal

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models
from django.utils.translation import gettext_lazy as _

from core.models import BaseModel, TimeStampedModel
from products.models import ProductVariant
from shops.models import Shop


# ---------------------------------------------------------------------------
# Cart (server-side, one per user)
# ---------------------------------------------------------------------------

class Cart(TimeStampedModel):
    """A persistent server-side cart owned by one user."""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="cart",
    )

    class Meta:
        ordering = ("-created_at",)

    def __str__(self) -> str:
        return f"Cart<{self.user}>"

    @property
    def total(self) -> Decimal:
        return sum(item.line_total for item in self.items.select_related("variant"))

    @property
    def item_count(self) -> int:
        return self.items.aggregate(n=models.Sum("quantity"))["n"] or 0


class CartItem(TimeStampedModel):
    """One line in a cart — a variant + quantity."""

    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name="items")
    variant = models.ForeignKey(
        ProductVariant, on_delete=models.CASCADE, related_name="cart_items"
    )
    quantity = models.PositiveIntegerField(
        default=1, validators=[MinValueValidator(1)]
    )
    # Snapshot the price at time of adding so it doesn't change under the buyer.
    unit_price = models.DecimalField(
        max_digits=12, decimal_places=2, validators=[MinValueValidator(Decimal("0"))]
    )

    class Meta:
        unique_together = ("cart", "variant")
        ordering = ("id",)

    def __str__(self) -> str:
        return f"{self.quantity}× {self.variant}"

    @property
    def line_total(self) -> Decimal:
        return self.unit_price * self.quantity


# ---------------------------------------------------------------------------
# Order (top-level, one per checkout session)
# ---------------------------------------------------------------------------

class Order(BaseModel):
    """
    A customer's purchase record.

    One order can span multiple shops; per-shop fulfilment lives in
    ``OrderGroup``.  Payment is handled in the payments app and linked via
    a FK back to this model.
    """

    class Status(models.TextChoices):
        PENDING = "pending", _("Pending")          # created, not yet paid
        CONFIRMED = "confirmed", _("Confirmed")    # payment captured
        PROCESSING = "processing", _("Processing") # being fulfilled
        SHIPPED = "shipped", _("Shipped")
        DELIVERED = "delivered", _("Delivered")
        CANCELLED = "cancelled", _("Cancelled")
        REFUNDED = "refunded", _("Refunded")

    # Valid transitions: from → {allowed tos}
    _TRANSITIONS: dict[str, set[str]] = {
        Status.PENDING:     {Status.CONFIRMED, Status.CANCELLED},
        Status.CONFIRMED:   {Status.PROCESSING, Status.CANCELLED, Status.REFUNDED},
        Status.PROCESSING:  {Status.SHIPPED, Status.CANCELLED},
        Status.SHIPPED:     {Status.DELIVERED},
        Status.DELIVERED:   {Status.REFUNDED},
        Status.CANCELLED:   set(),
        Status.REFUNDED:    set(),
    }

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,   # never lose order history on account delete
        related_name="orders",
    )

    status = models.CharField(
        max_length=16,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True,
    )

    # Snapshot the shipping address so it's immutable after placement.
    shipping_full_name = models.CharField(max_length=255, blank=True)
    shipping_phone = models.CharField(max_length=32, blank=True)
    shipping_line1 = models.CharField(max_length=255, blank=True)
    shipping_line2 = models.CharField(max_length=255, blank=True)
    shipping_city = models.CharField(max_length=120, blank=True)
    shipping_state = models.CharField(max_length=120, blank=True)
    shipping_postal_code = models.CharField(max_length=32, blank=True)
    shipping_country = models.CharField(
        max_length=2, blank=True, help_text="ISO 3166-1 alpha-2"
    )

    # Monetary totals (denormalised for fast display; authoritative = sum of items).
    subtotal = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal("0")
    )
    shipping_total = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal("0")
    )
    tax_total = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal("0")
    )
    discount_total = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal("0")
    )
    grand_total = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal("0")
    )
    currency = models.CharField(max_length=3, default="USD")

    # Idempotency key supplied by the client before hitting checkout so that
    # duplicate requests don't create duplicate orders.
    idempotency_key = models.UUIDField(
        default=uuid.uuid4, unique=True, db_index=True
    )

    # Timestamps for audit trail.
    confirmed_at = models.DateTimeField(null=True, blank=True)
    shipped_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)

    notes = models.TextField(blank=True, help_text="Buyer's order notes.")
    internal_notes = models.TextField(blank=True, help_text="Internal staff notes.")

    class Meta:
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["user", "status"]),
            models.Index(fields=["status", "-created_at"]),
            models.Index(fields=["idempotency_key"]),
        ]

    def __str__(self) -> str:
        return f"Order #{self.public_id} ({self.get_status_display()})"

    def can_transition(self, new_status: str) -> bool:
        """Check if a status transition is allowed."""
        return new_status in self._TRANSITIONS.get(self.status, set())

    def transition_status(self, new_status: str, *, save: bool = True) -> None:
        """Apply a status transition, raising ValueError on illegal moves."""
        from django.utils import timezone

        if not self.can_transition(new_status):
            raise ValueError(
                f"Cannot transition order from {self.status!r} to {new_status!r}."
            )
        self.status = new_status
        ts_map = {
            self.Status.CONFIRMED: "confirmed_at",
            self.Status.SHIPPED: "shipped_at",
            self.Status.DELIVERED: "delivered_at",
            self.Status.CANCELLED: "cancelled_at",
        }
        if ts_field := ts_map.get(new_status):
            setattr(self, ts_field, timezone.now())
            if save:
                self.save(update_fields=["status", ts_field, "updated_at"])
        elif save:
            self.save(update_fields=["status", "updated_at"])


# ---------------------------------------------------------------------------
# OrderGroup (per-shop slice of an order — what the shop owner sees)
# ---------------------------------------------------------------------------

class OrderGroup(TimeStampedModel):
    """
    A subset of an Order belonging to a single shop.

    Shop owners query ``OrderGroup`` to see their incoming orders. This
    decouples fulfilment per shop from the top-level payment flow.

    Escrow & Delivery Code
    ----------------------
    After checkout, funds are held in escrow (``escrow_status = HELD``).
    The buyer receives a 6-digit ``delivery_code``.  When the seller
    delivers the goods, the buyer shares the code.  The seller enters it
    in the dashboard, which transitions ``escrow_status`` to ``RELEASED``
    and credits the seller's wallet.
    """

    class FulfilmentStatus(models.TextChoices):
        PENDING = "pending", _("Pending")
        ACCEPTED = "accepted", _("Accepted")
        PROCESSING = "processing", _("Processing")
        SHIPPED = "shipped", _("Shipped")
        DELIVERED = "delivered", _("Delivered")
        CANCELLED = "cancelled", _("Cancelled")

    class EscrowStatus(models.TextChoices):
        HELD = "held", _("Held in escrow")
        RELEASED = "released", _("Released to seller")
        DISPUTED = "disputed", _("Under dispute")
        REFUNDED = "refunded", _("Refunded to buyer")

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="groups")
    shop = models.ForeignKey(
        Shop, on_delete=models.PROTECT, related_name="order_groups"
    )
    status = models.CharField(
        max_length=16,
        choices=FulfilmentStatus.choices,
        default=FulfilmentStatus.PENDING,
        db_index=True,
    )
    subtotal = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal("0")
    )
    shipping_total = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal("0")
    )
    tracking_number = models.CharField(max_length=120, blank=True)
    tracking_url = models.URLField(blank=True)
    shop_notes = models.TextField(blank=True)

    # --- Escrow & Delivery Code ---
    delivery_code = models.CharField(
        max_length=6, blank=True,
        help_text="6-digit code the buyer shares with the seller to confirm delivery.",
    )
    escrow_status = models.CharField(
        max_length=16,
        choices=EscrowStatus.choices,
        default=EscrowStatus.HELD,
        db_index=True,
    )
    delivery_code_confirmed_at = models.DateTimeField(
        null=True, blank=True,
        help_text="When the seller entered the correct delivery code.",
    )
    escrow_released_at = models.DateTimeField(
        null=True, blank=True,
        help_text="When the funds were released to the seller's wallet.",
    )
    dispute_reason = models.TextField(
        blank=True,
        help_text="Reason provided by the buyer if they open a dispute.",
    )

    class Meta:
        unique_together = ("order", "shop")
        ordering = ("id",)

    def __str__(self) -> str:
        return f"Group<{self.shop.name}> in Order #{self.order.public_id}"

    @staticmethod
    def generate_delivery_code() -> str:
        """Return a random 6-digit numeric code."""
        return f"{random.randint(100000, 999999)}"


# ---------------------------------------------------------------------------
# OrderItem (one line in a group)
# ---------------------------------------------------------------------------

class OrderItem(TimeStampedModel):
    """
    A single line item inside an OrderGroup.

    Prices are **snapshotted at placement time** — they never change even if
    the shop later edits the product price. This is critical for financial
    accuracy and dispute resolution.
    """

    group = models.ForeignKey(
        OrderGroup, on_delete=models.CASCADE, related_name="items"
    )
    variant = models.ForeignKey(
        ProductVariant,
        on_delete=models.PROTECT,  # preserve order history even if product deleted
        related_name="order_items",
    )
    quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)])

    # Price snapshot.
    product_name = models.CharField(max_length=200)   # denormalised
    variant_name = models.CharField(max_length=160, blank=True)
    sku = models.CharField(max_length=64, blank=True)
    unit_price = models.DecimalField(
        max_digits=12, decimal_places=2, validators=[MinValueValidator(Decimal("0"))]
    )
    currency = models.CharField(max_length=3, default="USD")

    class Meta:
        ordering = ("id",)

    def __str__(self) -> str:
        return f"{self.quantity}× {self.product_name} ({self.variant_name})"

    @property
    def line_total(self) -> Decimal:
        return self.unit_price * self.quantity


# ---------------------------------------------------------------------------
# Coupon / Discount (optional, for future use — schema-safe placeholder)
# ---------------------------------------------------------------------------

class Coupon(TimeStampedModel):
    """Discount codes redeemable at checkout."""

    class DiscountType(models.TextChoices):
        PERCENTAGE = "percentage", _("Percentage")
        FIXED = "fixed", _("Fixed amount")

    code = models.CharField(max_length=64, unique=True, db_index=True)
    discount_type = models.CharField(
        max_length=16, choices=DiscountType.choices, default=DiscountType.PERCENTAGE
    )
    value = models.DecimalField(
        max_digits=8, decimal_places=2, validators=[MinValueValidator(Decimal("0"))]
    )
    max_uses = models.PositiveIntegerField(null=True, blank=True)
    used_count = models.PositiveIntegerField(default=0)
    valid_from = models.DateTimeField()
    valid_until = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    # Optionally restrict to a single shop.
    shop = models.ForeignKey(
        Shop,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="coupons",
    )
    minimum_order_value = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal("0")
    )

    class Meta:
        ordering = ("-created_at",)

    def __str__(self) -> str:
        return f"Coupon<{self.code}>"

    @property
    def is_valid(self) -> bool:
        from django.utils import timezone

        now = timezone.now()
        if not self.is_active:
            return False
        if self.max_uses is not None and self.used_count >= self.max_uses:
            return False
        if now < self.valid_from:
            return False
        if self.valid_until and now > self.valid_until:
            return False
        return True


# ---------------------------------------------------------------------------
# Seller Wallet (tracks released escrow funds)
# ---------------------------------------------------------------------------

class SellerWallet(TimeStampedModel):
    """Per-shop wallet that accumulates released escrow funds.

    Each time a delivery code is confirmed and escrow is released, the
    amount is credited here.  The shop owner can view their balance and
    request payouts (handled manually for now).
    """

    shop = models.OneToOneField(
        Shop, on_delete=models.CASCADE, related_name="wallet",
    )
    balance = models.DecimalField(
        max_digits=14, decimal_places=2, default=Decimal("0"),
        help_text="Available balance from released escrow funds.",
    )
    total_earned = models.DecimalField(
        max_digits=14, decimal_places=2, default=Decimal("0"),
        help_text="Lifetime earnings from all released orders.",
    )
    total_withdrawn = models.DecimalField(
        max_digits=14, decimal_places=2, default=Decimal("0"),
        help_text="Total amount withdrawn/paid out.",
    )
    currency = models.CharField(max_length=3, default="NGN")

    class Meta:
        ordering = ("-created_at",)

    def __str__(self) -> str:
        return f"Wallet<{self.shop.name}> ₦{self.balance}"

    def credit(self, amount: Decimal, *, save: bool = True) -> None:
        """Add released escrow funds to the balance."""
        self.balance += amount
        self.total_earned += amount
        if save:
            self.save(update_fields=["balance", "total_earned", "updated_at"])


class WalletTransaction(TimeStampedModel):
    """Ledger entry for every credit/debit to a seller's wallet."""

    class Kind(models.TextChoices):
        ESCROW_RELEASE = "escrow_release", _("Escrow release")
        WITHDRAWAL = "withdrawal", _("Withdrawal")
        REFUND_DEBIT = "refund_debit", _("Refund debit")
        ADJUSTMENT = "adjustment", _("Manual adjustment")

    wallet = models.ForeignKey(
        SellerWallet, on_delete=models.CASCADE, related_name="transactions",
    )
    kind = models.CharField(max_length=20, choices=Kind.choices)
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    balance_after = models.DecimalField(
        max_digits=14, decimal_places=2,
        help_text="Wallet balance after this transaction.",
    )
    reference = models.CharField(
        max_length=255, blank=True,
        help_text="E.g. OrderGroup public_id for escrow releases.",
    )
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self) -> str:
        return f"{self.get_kind_display()} {self.amount} → {self.wallet.shop.name}"
"""
Product catalog models.

Highlights for correctness & scale:

* :class:`Category` is a global MPTT tree so buyers can browse by type of good
  across all shops, and shops can tag products into shared taxonomy.
* :class:`Product` carries denormalised rating/price-range aggregates and rich
  indexes for fast catalog queries and search.
* :class:`ProductVariant` models real purchasable SKUs (size/colour/etc.); a
  simple product still gets one default variant so checkout is uniform.
* :class:`Inventory` separates *on hand* from *reserved* quantity. Reservations
  are what make checkout race-safe (see orders app: ``select_for_update``).
* :class:`ProductImage` stores the original plus pipeline-generated responsive
  renditions (thumb/medium/large) for efficient image delivery.
"""
from __future__ import annotations

from decimal import Decimal

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models
from django.utils.text import slugify
from django.utils.translation import gettext_lazy as _
from mptt.models import MPTTModel, TreeForeignKey

from core.models import BaseModel, SoftDeleteModel, TimeStampedModel
from core.validators import slug_validator
from shops.models import Shop


class Category(MPTTModel):
    """Global, hierarchical product taxonomy (shared across all shops)."""

    name = models.CharField(max_length=120)
    slug = models.SlugField(
        max_length=140, unique=True, validators=[slug_validator], db_index=True
    )
    parent = TreeForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="children",
    )
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=64, blank=True, help_text="Icon name/key.")
    image = models.ImageField(upload_to="categories/", blank=True, null=True)
    is_active = models.BooleanField(default=True)
    # Denormalised counter for cheap "N products" labels.
    product_count = models.PositiveIntegerField(default=0)

    class MPTTMeta:
        order_insertion_by = ["name"]

    class Meta:
        verbose_name_plural = "categories"
        indexes = [models.Index(fields=["is_active"])]

    def __str__(self) -> str:
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.name) or "category"
            slug = base
            n = 1
            while Category.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                n += 1
                slug = f"{base}-{n}"
            self.slug = slug
        super().save(*args, **kwargs)


class Product(BaseModel, SoftDeleteModel):
    class Status(models.TextChoices):
        DRAFT = "draft", _("Draft")
        ACTIVE = "active", _("Active")
        ARCHIVED = "archived", _("Archived")

    shop = models.ForeignKey(
        Shop, on_delete=models.CASCADE, related_name="products"
    )
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, db_index=True)
    description = models.TextField(blank=True)

    # Primary category from the global taxonomy + free-form tags for discovery.
    category = TreeForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="products",
    )
    tags = models.JSONField(default=list, blank=True)

    # Base price is a display/fallback; variants hold authoritative pricing.
    base_price = models.DecimalField(
        max_digits=12, decimal_places=2, validators=[MinValueValidator(Decimal("0"))]
    )
    compare_at_price = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True,
        help_text="Original price for showing a discount.",
    )
    currency = models.CharField(max_length=3, default="USD")

    status = models.CharField(
        max_length=16, choices=Status.choices, default=Status.DRAFT, db_index=True
    )
    is_featured = models.BooleanField(default=False)

    # Denormalised aggregates for catalog/search/sorting.
    rating_average = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    rating_count = models.PositiveIntegerField(default=0)
    view_count = models.PositiveIntegerField(default=0)
    purchase_count = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ("-created_at",)
        constraints = [
            models.UniqueConstraint(
                fields=["shop", "slug"], name="uniq_product_slug_per_shop"
            ),
        ]
        indexes = [
            models.Index(fields=["shop", "status"]),
            models.Index(fields=["status", "is_featured"]),
            models.Index(fields=["category", "status"]),
            models.Index(fields=["-rating_average"]),
            models.Index(fields=["-purchase_count"]),
            models.Index(fields=["base_price"]),
        ]

    def __str__(self) -> str:
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name) or "product"
        super().save(*args, **kwargs)

    @property
    def is_available(self) -> bool:
        return self.status == self.Status.ACTIVE


class ProductVariant(BaseModel):
    """A concrete purchasable SKU. Simple products get one default variant."""

    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name="variants"
    )
    sku = models.CharField(max_length=64, blank=True, db_index=True)
    name = models.CharField(max_length=160, blank=True, help_text="e.g. 'Large / Red'")
    # Attribute map, e.g. {"size": "L", "color": "Red"}.
    attributes = models.JSONField(default=dict, blank=True)
    price = models.DecimalField(
        max_digits=12, decimal_places=2, validators=[MinValueValidator(Decimal("0"))]
    )
    is_default = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    weight_grams = models.PositiveIntegerField(null=True, blank=True)

    class Meta:
        ordering = ("-is_default", "id")
        indexes = [models.Index(fields=["product", "is_active"])]

    def __str__(self) -> str:
        return self.name or self.sku or f"Variant #{self.pk}"


class Inventory(TimeStampedModel):
    """Stock ledger for a variant.

    ``quantity`` is physical stock; ``reserved`` is held for in-flight orders.
    Available = quantity - reserved. Checkout increments ``reserved`` under a
    row lock, and fulfilment converts reservation into a real decrement. This
    prevents overselling when many buyers hit the last unit simultaneously.
    """

    variant = models.OneToOneField(
        ProductVariant, on_delete=models.CASCADE, related_name="inventory"
    )
    quantity = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    reserved = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    track_inventory = models.BooleanField(default=True)
    low_stock_threshold = models.PositiveIntegerField(default=5)
    allow_backorder = models.BooleanField(default=False)

    class Meta:
        verbose_name_plural = "inventories"


    def __str__(self) -> str:
        return f"Inventory<{self.variant}> {self.available} avail"

    @property
    def available(self) -> int:
        if not self.track_inventory:
            return 10**9  # effectively unlimited
        return max(self.quantity - self.reserved, 0)

    @property
    def is_low(self) -> bool:
        return self.track_inventory and self.available <= self.low_stock_threshold


class ProductImage(TimeStampedModel):
    """Original upload plus pipeline-generated responsive renditions."""

    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name="images"
    )
    variant = models.ForeignKey(
        ProductVariant,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="images",
    )
    image = models.ImageField(upload_to="products/originals/")
    # Populated asynchronously by the image pipeline (Celery).
    thumbnail = models.ImageField(upload_to="products/thumbs/", blank=True, null=True)
    medium = models.ImageField(upload_to="products/medium/", blank=True, null=True)
    large = models.ImageField(upload_to="products/large/", blank=True, null=True)
    # Tiny blurred placeholder (base64) for instant, layout-stable loading.
    placeholder = models.TextField(blank=True)
    alt_text = models.CharField(max_length=200, blank=True)
    position = models.PositiveIntegerField(default=0, db_index=True)
    width = models.PositiveIntegerField(null=True, blank=True)
    height = models.PositiveIntegerField(null=True, blank=True)
    is_processed = models.BooleanField(default=False)

    class Meta:
        ordering = ("position", "id")

    def __str__(self) -> str:
        return f"Image #{self.pk} for {self.product.name}"


class ProductReview(TimeStampedModel):
    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name="reviews"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="product_reviews"
    )
    rating = models.PositiveSmallIntegerField()
    title = models.CharField(max_length=160, blank=True)
    comment = models.TextField(blank=True)
    is_verified_purchase = models.BooleanField(default=False)

    class Meta:
        unique_together = ("product", "user")
        ordering = ("-created_at",)


    def __str__(self) -> str:
        return f"{self.user}'s review of {self.product.name}"

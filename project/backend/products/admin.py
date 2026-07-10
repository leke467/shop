from django.contrib import admin

from .models import (
    Category,
    Inventory,
    Product,
    ProductImage,
    ProductReview,
    ProductVariant,
)


# ---------------------------------------------------------------------------
# Category (MPTT tree)
# ---------------------------------------------------------------------------

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "parent", "is_active", "product_count")
    list_filter = ("is_active",)
    search_fields = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}


# ---------------------------------------------------------------------------
# Product + Variant + Inventory + Images
# ---------------------------------------------------------------------------

class ProductVariantInline(admin.TabularInline):
    model = ProductVariant
    extra = 0
    show_change_link = True


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 0
    readonly_fields = ("is_processed", "width", "height")


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = (
        "name", "slug", "shop", "category", "base_price",
        "status", "is_featured", "rating_average", "created_at",
    )
    list_filter = ("status", "is_featured", "category", "created_at")
    search_fields = ("name", "slug", "shop__name")
    readonly_fields = (
        "public_id", "rating_average", "rating_count",
        "view_count", "purchase_count",
    )
    raw_id_fields = ("shop", "category")
    prepopulated_fields = {"slug": ("name",)}
    inlines = [ProductVariantInline, ProductImageInline]
    date_hierarchy = "created_at"


class InventoryInline(admin.StackedInline):
    model = Inventory
    extra = 0


@admin.register(ProductVariant)
class ProductVariantAdmin(admin.ModelAdmin):
    list_display = ("product", "name", "sku", "price", "is_active", "is_default")
    list_filter = ("is_active", "is_default")
    search_fields = ("sku", "name", "product__name")
    raw_id_fields = ("product",)
    inlines = [InventoryInline]


# ---------------------------------------------------------------------------
# Reviews
# ---------------------------------------------------------------------------

@admin.register(ProductReview)
class ProductReviewAdmin(admin.ModelAdmin):
    list_display = ("product", "user", "rating", "is_verified_purchase", "created_at")
    list_filter = ("rating", "is_verified_purchase", "created_at")
    search_fields = ("product__name", "user__email")
    raw_id_fields = ("product", "user")
    date_hierarchy = "created_at"
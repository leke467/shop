from django.contrib import admin

from .models import (
    Cart,
    CartItem,
    Coupon,
    Order,
    OrderGroup,
    OrderItem,
)


# ---------------------------------------------------------------------------
# Cart
# ---------------------------------------------------------------------------

class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 0
    readonly_fields = ("line_total",)
    raw_id_fields = ("variant",)


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "item_count", "created_at")
    search_fields = ("user__email",)
    raw_id_fields = ("user",)
    inlines = [CartItemInline]


# ---------------------------------------------------------------------------
# Order
# ---------------------------------------------------------------------------

class OrderGroupInline(admin.TabularInline):
    model = OrderGroup
    extra = 0
    show_change_link = True
    readonly_fields = ("subtotal",)


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ("line_total",)
    raw_id_fields = ("variant",)


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        "public_id",
        "user",
        "status",
        "grand_total",
        "currency",
        "created_at",
    )
    list_filter = ("status", "currency", "created_at")
    search_fields = ("public_id", "user__email", "idempotency_key")
    readonly_fields = (
        "public_id",
        "idempotency_key",
        "confirmed_at",
        "shipped_at",
        "delivered_at",
        "cancelled_at",
    )
    raw_id_fields = ("user",)
    inlines = [OrderGroupInline]
    date_hierarchy = "created_at"


@admin.register(OrderGroup)
class OrderGroupAdmin(admin.ModelAdmin):
    list_display = ("id", "order", "shop", "status", "subtotal")
    list_filter = ("status",)
    search_fields = ("order__public_id", "shop__name")
    raw_id_fields = ("order", "shop")
    inlines = [OrderItemInline]


# ---------------------------------------------------------------------------
# Coupon
# ---------------------------------------------------------------------------

@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    list_display = (
        "code",
        "discount_type",
        "value",
        "is_active",
        "used_count",
        "max_uses",
        "valid_from",
        "valid_until",
    )
    list_filter = ("discount_type", "is_active")
    search_fields = ("code",)
    raw_id_fields = ("shop",)
"""Orders serializers."""
from rest_framework import serializers

from .models import Cart, CartItem, Coupon, Order, OrderGroup, OrderItem


class CartItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="variant.product.name", read_only=True)
    variant_name = serializers.CharField(source="variant.name", read_only=True)
    shop_slug = serializers.CharField(source="variant.product.shop.slug", read_only=True)
    allow_manual_delivery = serializers.BooleanField(source="variant.product.shop.allow_manual_delivery", read_only=True)
    line_total = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = CartItem
        fields = (
            "id", "variant", "product_name", "variant_name", "shop_slug", "allow_manual_delivery",
            "quantity", "unit_price", "line_total",
        )
        read_only_fields = ("id", "unit_price", "line_total")


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    item_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Cart
        fields = ("id", "items", "total", "item_count", "created_at", "updated_at")
        read_only_fields = fields


class CartItemCreateSerializer(serializers.Serializer):
    """Input for adding/updating a cart item."""
    variant_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1, default=1)


class OrderItemSerializer(serializers.ModelSerializer):
    line_total = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = OrderItem
        fields = (
            "id", "product_name", "variant_name", "sku",
            "quantity", "unit_price", "currency", "line_total",
        )


class OrderGroupSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    shop_name = serializers.CharField(source="shop.name", read_only=True)

    class Meta:
        model = OrderGroup
        fields = (
            "id", "shop", "shop_name", "status", "escrow_status", "subtotal",
            "commission_fee", "tracking_number", "tracking_url", "items",
        )


class OrderSerializer(serializers.ModelSerializer):
    groups = OrderGroupSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = (
            "public_id", "status",
            "shipping_full_name", "shipping_phone",
            "shipping_line1", "shipping_line2", "shipping_city",
            "shipping_state", "shipping_postal_code", "shipping_country",
            "subtotal", "shipping_total", "tax_total",
            "discount_total", "grand_total", "currency",
            "idempotency_key", "notes",
            "confirmed_at", "shipped_at", "delivered_at", "cancelled_at",
            "groups", "created_at",
        )
        read_only_fields = (
            "public_id", "status", "subtotal", "shipping_total",
            "tax_total", "discount_total", "grand_total",
            "idempotency_key",
            "confirmed_at", "shipped_at", "delivered_at", "cancelled_at",
            "created_at",
        )


class CouponSerializer(serializers.ModelSerializer):
    is_valid = serializers.BooleanField(read_only=True)

    class Meta:
        model = Coupon
        fields = (
            "code", "discount_type", "value", "is_active",
            "valid_from", "valid_until", "minimum_order_value", "is_valid",
        )
        read_only_fields = ("is_valid",)

"""Products serializers."""
from rest_framework import serializers

from .models import (
    Category,
    Inventory,
    Product,
    ProductImage,
    ProductReview,
    ProductVariant,
)
from subscriptions.services import is_user_locked


class CategorySerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ("id", "name", "slug", "parent", "description", "icon", "image", "is_active", "product_count", "children")
        read_only_fields = ("id", "product_count")

    def get_children(self, obj):
        children = obj.get_children().filter(is_active=True)
        return CategorySerializer(children, many=True).data


class InventorySerializer(serializers.ModelSerializer):
    available = serializers.IntegerField(read_only=True)
    is_low = serializers.BooleanField(read_only=True)

    class Meta:
        model = Inventory
        fields = ("quantity", "reserved", "available", "is_low", "track_inventory", "low_stock_threshold", "allow_backorder")
        read_only_fields = ("reserved", "available", "is_low")


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = (
            "id", "image", "thumbnail", "medium", "large",
            "placeholder", "alt_text", "position", "width", "height", "is_processed",
        )
        read_only_fields = ("id", "thumbnail", "medium", "large", "placeholder", "width", "height", "is_processed")


class ProductVariantSerializer(serializers.ModelSerializer):
    inventory = InventorySerializer(read_only=True)

    class Meta:
        model = ProductVariant
        fields = (
            "id", "public_id", "sku", "name", "attributes", "price",
            "is_default", "is_active", "weight_grams", "inventory",
        )
        read_only_fields = ("id", "public_id",)


class ProductListSerializer(serializers.ModelSerializer):
    """Lightweight for catalog listing."""
    shop_name = serializers.CharField(source="shop.name", read_only=True)
    shop_slug = serializers.CharField(source="shop.slug", read_only=True)
    category_name = serializers.CharField(source="category.name", read_only=True, default=None)
    primary_image = serializers.SerializerMethodField()
    is_locked = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = (
            "public_id", "name", "slug", "base_price", "compare_at_price",
            "currency", "status", "is_featured",
            "rating_average", "rating_count", "view_count",
            "shop_name", "shop_slug", "category_name", "primary_image",
            "is_locked", "created_at",
        )
        read_only_fields = fields

    def get_primary_image(self, obj):
        img = obj.images.first()
        if img:
            request = self.context.get("request")
            if request and img.thumbnail:
                return request.build_absolute_uri(img.thumbnail.url)
            elif request and img.image:
                return request.build_absolute_uri(img.image.url)
        return None

    def get_is_locked(self, obj):
        return is_user_locked(obj.shop.owner)


class ProductDetailSerializer(serializers.ModelSerializer):
    """Full detail with variants, images, reviews."""
    shop_name = serializers.CharField(source="shop.name", read_only=True)
    shop_slug = serializers.CharField(source="shop.slug", read_only=True)
    category = CategorySerializer(read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    is_locked = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = (
            "public_id", "name", "slug", "description",
            "base_price", "compare_at_price", "currency",
            "status", "is_featured", "tags",
            "rating_average", "rating_count", "view_count", "purchase_count",
            "shop_name", "shop_slug", "category",
            "variants", "images", "is_locked",
            "created_at", "updated_at",
        )
        read_only_fields = (
            "public_id", "rating_average", "rating_count",
            "view_count", "purchase_count", "created_at", "updated_at",
        )

    def get_is_locked(self, obj):
        return is_user_locked(obj.shop.owner)


class ProductCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = (
            "public_id", "name", "slug", "description", "category",
            "base_price", "compare_at_price", "currency",
            "status", "is_featured", "tags",
        )
        read_only_fields = ("public_id", "slug",)


class ProductReviewSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = ProductReview
        fields = (
            "id", "product", "user", "user_email",
            "rating", "title", "comment", "is_verified_purchase",
            "created_at",
        )
        read_only_fields = ("id", "user", "is_verified_purchase", "created_at")

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)

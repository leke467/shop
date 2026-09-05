"""Products serializers."""
from rest_framework import serializers

from .models import (
    Category,
    Inventory,
    Product,
    ProductImage,
    ProductReview,
    ProductVariant,
    FlashSale,
    FlashSaleItem,
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
    shop_name = serializers.SerializerMethodField()
    shop_slug = serializers.SerializerMethodField()
    shop_logo = serializers.SerializerMethodField()
    shop_status = serializers.SerializerMethodField()
    category_name = serializers.SerializerMethodField()
    primary_image = serializers.SerializerMethodField()
    is_locked = serializers.SerializerMethodField()
    inventory_quantity = serializers.SerializerMethodField()
    is_out_of_stock = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = (
            "public_id", "name", "slug", "base_price", "compare_at_price",
            "currency", "status", "is_featured", "is_marketplace_visible",
            "has_variants", "variant_attributes",
            "allow_custom_measurements", "custom_measurement_type", "custom_measurement_prompt",
            "rating_average", "rating_count", "view_count",
            "shop_name", "shop_slug", "shop_logo", "shop_status", "category_name", "primary_image",
            "is_locked", "inventory_quantity", "is_out_of_stock", "created_at",
        )
        read_only_fields = fields

    def get_shop_name(self, obj):
        try:
            return obj.shop.name if obj.shop else ""
        except Exception:
            return ""

    def get_shop_slug(self, obj):
        try:
            return obj.shop.slug if obj.shop else ""
        except Exception:
            return ""

    def get_shop_logo(self, obj):
        try:
            if obj.shop:
                if obj.shop.logo:
                    request = self.context.get("request")
                    if request:
                        return request.build_absolute_uri(obj.shop.logo.url)
                    return obj.shop.logo.url
                if hasattr(obj.shop, "theme") and obj.shop.theme:
                    extra = getattr(obj.shop.theme, "extra_tokens", {}) or {}
                    theme_data = getattr(obj.shop.theme, "theme_data", {}) or {}
                    logo = extra.get("logo_url") or theme_data.get("logo_url") or extra.get("logo")
                    if logo:
                        return logo
        except Exception:
            pass
        return None

    def get_shop_status(self, obj):
        try:
            return obj.shop.status if obj.shop else "active"
        except Exception:
            return "active"

    def get_category_name(self, obj):
        try:
            return obj.category.name if obj.category else None
        except Exception:
            return None

    def get_primary_image(self, obj):
        try:
            img = obj.images.first()
            if img:
                request = self.context.get("request")
                if request and img.thumbnail:
                    return request.build_absolute_uri(img.thumbnail.url)
                elif request and img.image:
                    return request.build_absolute_uri(img.image.url)
                elif img.thumbnail:
                    return img.thumbnail.url
                elif img.image:
                    return img.image.url
        except Exception:
            pass
        return None

    def get_is_locked(self, obj):
        try:
            if obj.shop and obj.shop.owner:
                return is_user_locked(obj.shop.owner)
        except Exception:
            pass
        return False

    def get_inventory_quantity(self, obj):
        try:
            var = obj.variants.filter(is_default=True).first() or obj.variants.first()
            if var and hasattr(var, 'inventory') and var.inventory:
                return max(0, var.inventory.quantity - var.inventory.reserved)
            if var:
                inv = Inventory.objects.filter(variant=var).first()
                if inv:
                    return max(0, inv.quantity - inv.reserved)
        except Exception:
            pass
        return 0

    def get_is_out_of_stock(self, obj):
        return self.get_inventory_quantity(obj) <= 0


class ProductDetailSerializer(serializers.ModelSerializer):
    """Full detail with variants, images, reviews."""
    shop_name = serializers.CharField(source="shop.name", read_only=True)
    shop_slug = serializers.CharField(source="shop.slug", read_only=True)
    shop_logo = serializers.SerializerMethodField()
    category = CategorySerializer(read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    is_locked = serializers.SerializerMethodField()
    inventory_quantity = serializers.SerializerMethodField()
    is_out_of_stock = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = (
            "public_id", "name", "slug", "description",
            "base_price", "compare_at_price", "currency",
            "status", "is_featured", "is_marketplace_visible", "tags",
            "has_variants", "variant_attributes",
            "allow_custom_measurements", "custom_measurement_type",
            "custom_measurement_prompt", "custom_measurement_required",
            "rating_average", "rating_count", "view_count", "purchase_count",
            "shop_name", "shop_slug", "shop_logo", "category",
            "variants", "images", "is_locked",
            "inventory_quantity", "is_out_of_stock",
            "created_at", "updated_at",
        )
        read_only_fields = (
            "public_id", "rating_average", "rating_count",
            "view_count", "purchase_count", "created_at", "updated_at",
        )

    def get_shop_logo(self, obj):
        try:
            if obj.shop:
                if obj.shop.logo:
                    request = self.context.get("request")
                    if request:
                        return request.build_absolute_uri(obj.shop.logo.url)
                    return obj.shop.logo.url
                if hasattr(obj.shop, "theme") and obj.shop.theme:
                    extra = getattr(obj.shop.theme, "extra_tokens", {}) or {}
                    theme_data = getattr(obj.shop.theme, "theme_data", {}) or {}
                    logo = extra.get("logo_url") or theme_data.get("logo_url") or extra.get("logo")
                    if logo:
                        return logo
        except Exception:
            pass
        return None

    def get_is_locked(self, obj):
        try:
            if obj.shop and obj.shop.owner:
                return is_user_locked(obj.shop.owner)
        except Exception:
            pass
        return False

    def get_inventory_quantity(self, obj):
        try:
            var = obj.variants.filter(is_default=True).first() or obj.variants.first()
            if var and hasattr(var, 'inventory') and var.inventory:
                return max(0, var.inventory.quantity - var.inventory.reserved)
            if var:
                inv = Inventory.objects.filter(variant=var).first()
                if inv:
                    return max(0, inv.quantity - inv.reserved)
        except Exception:
            pass
        return 0

    def get_is_out_of_stock(self, obj):
        return self.get_inventory_quantity(obj) <= 0


class ProductCreateUpdateSerializer(serializers.ModelSerializer):
    stock = serializers.IntegerField(required=False, default=100)
    variants_data = serializers.ListField(child=serializers.DictField(), required=False, write_only=True)

    class Meta:
        model = Product
        fields = (
            "public_id", "name", "slug", "description", "category",
            "base_price", "compare_at_price", "currency",
            "status", "is_featured", "is_marketplace_visible", "tags", "stock",
            "has_variants", "variant_attributes", "variants_data",
            "allow_custom_measurements", "custom_measurement_type",
            "custom_measurement_prompt", "custom_measurement_required",
        )
        read_only_fields = ("public_id", "slug",)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        try:
            variant = instance.variants.filter(is_default=True).first() or instance.variants.first()
            qty = 100
            if variant:
                inv = getattr(variant, 'inventory', None) or Inventory.objects.filter(variant=variant).first()
                if inv:
                    qty = max(0, inv.quantity - inv.reserved)
            data['stock'] = qty
            data['inventory_quantity'] = qty
            data['is_out_of_stock'] = qty <= 0
            data['variants'] = ProductVariantSerializer(instance.variants.filter(is_active=True), many=True).data
        except Exception:
            data['stock'] = 0
            data['inventory_quantity'] = 0
            data['is_out_of_stock'] = True
        return data

    def create(self, validated_data):
        stock = validated_data.pop("stock", 100)
        variants_data = validated_data.pop("variants_data", None)
        product = super().create(validated_data)
        self._sync_variants_and_inventory(product, stock, variants_data)
        return product

    def update(self, instance, validated_data):
        stock = validated_data.pop("stock", None)
        variants_data = validated_data.pop("variants_data", None)
        new_name = validated_data.get("name")
        if new_name and new_name != instance.name:
            from django.utils.text import slugify
            base = slugify(new_name) or "product"
            slug = base
            n = 1
            while Product.objects.filter(slug=slug).exclude(pk=instance.pk).exists():
                n += 1
                slug = f"{base}-{n}"
            instance.slug = slug

        product = super().update(instance, validated_data)
        self._sync_variants_and_inventory(product, stock, variants_data)
        return product

    def _sync_variants_and_inventory(self, product, fallback_stock, variants_data=None):
        import uuid
        from decimal import Decimal

        if variants_data and len(variants_data) > 0 and product.has_variants:
            # Process custom variants created by the vendor
            existing_variants = {v.id: v for v in product.variants.all()}
            keep_variant_ids = set()

            for idx, v_data in enumerate(variants_data):
                v_id = v_data.get("id")
                v_name = v_data.get("name") or "Variant"
                v_attrs = v_data.get("attributes") or {}
                v_sku = v_data.get("sku") or f"SKU-{str(uuid.uuid4())[:8].upper()}"
                
                try:
                    v_price = Decimal(str(v_data.get("price") or product.base_price))
                except Exception:
                    v_price = product.base_price

                try:
                    v_stock = max(0, int(v_data.get("stock", fallback_stock or 100)))
                except Exception:
                    v_stock = 100

                is_default = (idx == 0)

                if v_id and v_id in existing_variants:
                    variant = existing_variants[v_id]
                    variant.name = v_name
                    variant.attributes = v_attrs
                    variant.price = v_price
                    variant.is_default = is_default
                    variant.is_active = True
                    variant.save()
                else:
                    variant = ProductVariant.objects.create(
                        product=product,
                        name=v_name,
                        attributes=v_attrs,
                        sku=v_sku,
                        price=v_price,
                        is_default=is_default,
                        is_active=True,
                    )

                keep_variant_ids.add(variant.id)

                inv, _ = Inventory.objects.get_or_create(
                    variant=variant,
                    defaults={"quantity": v_stock, "reserved": 0}
                )
                inv.quantity = v_stock
                inv.save()

            # Archive variants no longer in the list
            for old_id, old_var in existing_variants.items():
                if old_id not in keep_variant_ids:
                    old_var.is_active = False
                    old_var.save()
        else:
            # Simple Product without custom variants
            try:
                stock_int = max(0, int(fallback_stock)) if fallback_stock is not None else 100
            except (ValueError, TypeError):
                stock_int = 100

            variant = product.variants.filter(is_default=True).first() or product.variants.first()
            if not variant:
                variant = ProductVariant.objects.create(
                    product=product,
                    name="Default",
                    sku=f"SKU-{str(uuid.uuid4())[:8].upper()}",
                    price=product.base_price,
                    is_default=True,
                    is_active=True,
                )
            else:
                variant.price = product.base_price
                variant.save(update_fields=["price", "updated_at"])

            inv, _ = Inventory.objects.get_or_create(
                variant=variant,
                defaults={"quantity": stock_int, "reserved": 0}
            )
            inv.quantity = stock_int
            inv.reserved = 0
            inv.save()


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


class FlashSaleItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    
    class Meta:
        model = FlashSaleItem
        fields = (
            "id", "flash_sale", "product", "product_name", 
            "sale_price", "original_price", "quantity_limit", "quantity_sold"
        )
        read_only_fields = ("id", "quantity_sold")


class FlashSaleSerializer(serializers.ModelSerializer):
    items = FlashSaleItemSerializer(many=True, read_only=True)

    class Meta:
        model = FlashSale
        fields = (
            "id", "public_id", "shop", "name", "description", 
            "discount_percentage", "start_time", "end_time", "is_active", "items"
        )
        read_only_fields = ("id", "public_id", "shop")

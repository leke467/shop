"""
Shops serializers.

Serializers are intentionally thin — they validate input and shape output.
Business logic stays in views or services.
"""
from rest_framework import serializers

from .models import (
    LayoutSection,
    SectionBlock,
    Shop,
    ShopLayout,
    ShopReview,
    ShopStaff,
    ShopTheme,
)


# ---------------------------------------------------------------------------
# Theme
# ---------------------------------------------------------------------------

class ShopThemeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShopTheme
        exclude = ("id", "shop")
        read_only_fields = ("created_at", "updated_at")


# ---------------------------------------------------------------------------
# Layout builder
# ---------------------------------------------------------------------------

class SectionBlockSerializer(serializers.ModelSerializer):
    class Meta:
        model = SectionBlock
        exclude = ("section",)
        read_only_fields = ("id", "created_at", "updated_at")


class LayoutSectionSerializer(serializers.ModelSerializer):
    blocks = SectionBlockSerializer(many=True, read_only=True)

    class Meta:
        model = LayoutSection
        exclude = ("layout",)
        read_only_fields = ("id", "created_at", "updated_at")


class ShopLayoutSerializer(serializers.ModelSerializer):
    sections = LayoutSectionSerializer(many=True, read_only=True)

    class Meta:
        model = ShopLayout
        exclude = ("shop",)
        read_only_fields = ("id", "created_at", "updated_at")


# ---------------------------------------------------------------------------
# Staff
# ---------------------------------------------------------------------------

class ShopStaffSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = ShopStaff
        fields = ("id", "user", "email", "role", "created_at")
        read_only_fields = ("id", "created_at")


# ---------------------------------------------------------------------------
# Shop (list / detail)
# ---------------------------------------------------------------------------

class ShopListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views (no nested layout/theme)."""

    owner_email = serializers.EmailField(source="owner.email", read_only=True)

    class Meta:
        model = Shop
        fields = (
            "public_id", "name", "slug", "tagline", "logo", "banner",
            "status", "is_verified", "currency",
            "rating_average", "rating_count", "product_count",
            "owner_email", "created_at",
        )
        read_only_fields = fields


class ShopDetailSerializer(serializers.ModelSerializer):
    """Full serializer for detail view — includes theme, layouts, staff."""

    theme = ShopThemeSerializer(read_only=True)
    layouts = ShopLayoutSerializer(many=True, read_only=True)
    owner_email = serializers.EmailField(source="owner.email", read_only=True)
    social_links = serializers.SerializerMethodField()

    class Meta:
        model = Shop
        fields = (
            "public_id", "name", "slug", "tagline", "description",
            "logo", "banner", "email", "phone", "address", "country",
            "social_links",
            "enable_product_listings", "enable_custom_orders",
            "enable_reviews", "enable_contact",
            "enable_shipping", "enable_social_links",
            "status", "is_verified", "currency",
            "rating_average", "rating_count", "product_count", "total_sales",
            "theme", "layouts", "owner_email",
            "created_at", "updated_at",
        )
        read_only_fields = (
            "public_id", "rating_average", "rating_count",
            "product_count", "total_sales", "created_at", "updated_at",
        )

    def get_social_links(self, obj):
        return {
            "facebook": obj.facebook_url,
            "instagram": obj.instagram_url,
            "twitter": obj.twitter_url,
            "website": obj.website_url,
        }


class ShopCreateUpdateSerializer(serializers.ModelSerializer):
    """Write serializer — owner is set from the request."""

    class Meta:
        model = Shop
        fields = (
            "name", "slug", "tagline", "description",
            "logo", "banner", "email", "phone", "address", "country",
            "facebook_url", "instagram_url", "twitter_url", "website_url",
            "enable_product_listings", "enable_custom_orders",
            "enable_reviews", "enable_contact",
            "enable_shipping", "enable_social_links",
            "currency",
        )

    def create(self, validated_data):
        user = self.context["request"].user
        # Enforce the subscription shop limit before creating.
        from subscriptions.services import assert_can_create_shop
        assert_can_create_shop(user)  # raises LimitReached if at cap
        validated_data["owner"] = user
        shop = super().create(validated_data)

        # Auto-create default theme and home layout.
        ShopTheme.objects.create(shop=shop)
        layout = ShopLayout.objects.create(shop=shop, page=ShopLayout.Pages.HOME)
        # Default hero section.
        LayoutSection.objects.create(
            layout=layout,
            kind=LayoutSection.Kinds.HERO,
            position=0,
            config={"title": shop.name, "subtitle": shop.tagline},
        )
        return shop


# ---------------------------------------------------------------------------
# Reviews
# ---------------------------------------------------------------------------

class ShopReviewSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = ShopReview
        fields = (
            "id", "shop", "user", "user_email",
            "rating", "comment", "created_at",
        )
        read_only_fields = ("id", "user", "created_at")

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)

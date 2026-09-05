"""
Shops serializers.

Serializers are intentionally thin — they validate input and shape output.
Business logic stays in views or services.
"""
from rest_framework import serializers

from .domains import (
    DomainError,
    attach_domain,
    dns_instructions,
    remove_domain,
    verify_domain,
)
from subscriptions.services import is_user_locked
from .models import (
    DeliveryNote,
    DeliveryZone,
    LayoutSection,
    NIGERIAN_STATES,
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
    is_locked = serializers.SerializerMethodField()

    class Meta:
        model = Shop
        fields = (
            "public_id", "name", "slug", "tagline", "logo", "banner",
            "status", "is_verified", "currency", "allow_manual_delivery",
            "rating_average", "rating_count", "product_count",
            "owner_email", "is_locked", "created_at", "verification_status",
            "template_id",
        )
        read_only_fields = fields
        
    def get_is_locked(self, obj):
        return is_user_locked(obj.owner)


class ShopDetailSerializer(serializers.ModelSerializer):
    """Full serializer for detail view — includes theme, layouts, staff."""

    theme = ShopThemeSerializer(read_only=True)
    layouts = ShopLayoutSerializer(many=True, read_only=True)
    owner_email = serializers.EmailField(source="owner.email", read_only=True)
    social_links = serializers.SerializerMethodField()
    is_locked = serializers.SerializerMethodField()

    class Meta:
        model = Shop
        fields = (
            "public_id", "name", "slug", "tagline", "description",
            "logo", "banner", "email", "phone", "address", "country",
            "social_links",
            "enable_product_listings", "enable_custom_orders",
            "enable_reviews", "enable_contact",
            "enable_shipping", "enable_social_links",
            "allow_manual_delivery",
            "custom_domain", "custom_domain_status", "custom_domain_verified_at",
            "status", "is_verified", "currency",
            "rating_average", "rating_count", "product_count", "total_sales",
            "theme", "layouts", "owner_email", "is_locked",
            "verification_status", "verified_at", "verification_document", "id_number", "verification_legal_name", "verification_notes",
            "template_id",
            "created_at", "updated_at",
        )
        read_only_fields = (
            "public_id", "rating_average", "rating_count",
            "product_count", "total_sales", "created_at", "updated_at",
            "custom_domain", "custom_domain_status", "custom_domain_verified_at",
            "verification_status", "verified_at", "verification_document", "id_number", "verification_legal_name", "verification_notes",
        )


    def get_social_links(self, obj):
        return {
            "facebook": obj.facebook_url,
            "instagram": obj.instagram_url,
            "twitter": obj.twitter_url,
            "website": obj.website_url,
        }
        
    def get_is_locked(self, obj):
        return is_user_locked(obj.owner)


class ShopCreateUpdateSerializer(serializers.ModelSerializer):
    """Write serializer — owner is set from the request."""
    logo = serializers.FileField(required=False, allow_null=True)
    banner = serializers.FileField(required=False, allow_null=True)

    class Meta:
        model = Shop
        fields = (
            "name", "slug", "tagline", "description",
            "logo", "banner", "email", "phone", "address", "country",
            "facebook_url", "instagram_url", "twitter_url", "website_url",
            "enable_product_listings", "enable_custom_orders",
            "enable_reviews", "enable_contact",
            "enable_shipping", "enable_social_links",
            "allow_manual_delivery", "currency", "status",
            "template_id",
        )
        # ``slug`` is auto-generated in ``Shop.save()`` when omitted, so it must
        # be optional here. The model field has no ``blank=True`` (a slug is
        # always required at the DB level), which otherwise makes DRF treat it
        # as a required input and reject creates that don't send one -> HTTP 400.
        extra_kwargs = {
            "slug": {"required": False, "allow_blank": True},
            "tagline": {"required": False, "allow_blank": True},
            "description": {"required": False, "allow_blank": True},
            "logo": {"required": False, "allow_null": True},
            "banner": {"required": False, "allow_null": True},
            "email": {"required": False, "allow_blank": True},
            "phone": {"required": False, "allow_blank": True},
            "address": {"required": False, "allow_blank": True},
            "country": {"required": False, "allow_blank": True},
            "facebook_url": {"required": False, "allow_blank": True},
            "instagram_url": {"required": False, "allow_blank": True},
            "twitter_url": {"required": False, "allow_blank": True},
            "website_url": {"required": False, "allow_blank": True},
            "template_id": {"required": False, "allow_blank": True},
        }

    def validate_name(self, value):
        name = value.strip()
        if len(name) < 2:
            raise serializers.ValidationError("Store name must be at least 2 characters.")

        # Check case-insensitive store name uniqueness across all shops
        qs = Shop.all_objects.filter(name__iexact=name)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError(
                f"The store name '{name}' is already taken. Please choose a unique name for your shop."
            )
        return name

    def create(self, validated_data):
        user = self.context["request"].user
        if not validated_data.get("email"):
            validated_data["email"] = user.email
        if not validated_data.get("status"):
            validated_data["status"] = Shop.Status.ACTIVE
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

    def update(self, instance, validated_data):
        request = self.context.get("request")
        if request:
            if "banner" in request.data and (request.data.get("banner") in (None, "", "null") or request.data.get("remove_banner")):
                if instance.banner:
                    instance.banner.delete(save=False)
                instance.banner = None
                validated_data.pop("banner", None)
            if "logo" in request.data and (request.data.get("logo") in (None, "", "null") or request.data.get("remove_logo")):
                if instance.logo:
                    instance.logo.delete(save=False)
                instance.logo = None
                validated_data.pop("logo", None)
        return super().update(instance, validated_data)


class ShopKYCSerializer(serializers.ModelSerializer):
    """Write serializer for submitting KYC details."""
    
    class Meta:
        model = Shop
        fields = ("id_number", "verification_document", "verification_legal_name")
        extra_kwargs = {
            "verification_document": {"required": True},
            "id_number": {"required": True},
            "verification_legal_name": {"required": True}
        }



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


# ---------------------------------------------------------------------------
# Delivery Zones & Notes
# ---------------------------------------------------------------------------

class DeliveryZoneSerializer(serializers.ModelSerializer):
    state_display = serializers.CharField(source="get_state_display", read_only=True)

    class Meta:
        model = DeliveryZone
        fields = ("id", "state", "state_display", "fee", "is_active", "created_at", "updated_at")
        read_only_fields = ("id", "created_at", "updated_at")


class DeliveryNoteSerializer(serializers.ModelSerializer):
    state_display = serializers.CharField(source="get_state_requested_display", read_only=True)

    class Meta:
        model = DeliveryNote
        fields = (
            "id", "sender_name", "sender_email",
            "state_requested", "state_display",
            "message", "is_read", "created_at",
        )
        read_only_fields = ("id", "is_read", "created_at")


class NigerianStatesSerializer(serializers.Serializer):
    """Returns the full list of Nigerian states for dropdown population."""
    states = serializers.SerializerMethodField()

    def get_states(self, obj):
        return [{"value": val, "label": label} for val, label in NIGERIAN_STATES]

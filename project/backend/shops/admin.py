from django.contrib import admin

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
# Theme / Layout inlines
# ---------------------------------------------------------------------------

class ShopThemeInline(admin.StackedInline):
    model = ShopTheme
    extra = 0
    fieldsets = (
        ("Colours", {
            "fields": (
                "primary_color", "secondary_color", "accent_color",
                "background_color", "surface_color", "text_color", "muted_text_color",
            ),
        }),
        ("Typography", {
            "fields": ("heading_font", "body_font", "base_font_size"),
        }),
        ("Shape & density", {
            "fields": (
                "border_radius", "button_style", "layout_style",
                "product_card_style", "dark_mode_enabled",
            ),
        }),
        ("Advanced", {
            "classes": ("collapse",),
            "fields": ("extra_tokens", "custom_css"),
        }),
    )


class SectionBlockInline(admin.TabularInline):
    model = SectionBlock
    extra = 0


class LayoutSectionInline(admin.TabularInline):
    model = LayoutSection
    extra = 0
    show_change_link = True


class ShopStaffInline(admin.TabularInline):
    model = ShopStaff
    extra = 0
    raw_id_fields = ("user",)


# ---------------------------------------------------------------------------
# Shop
# ---------------------------------------------------------------------------

@admin.register(Shop)
class ShopAdmin(admin.ModelAdmin):
    list_display = (
        "name", "slug", "owner", "status", "is_verified",
        "rating_average", "product_count", "created_at",
    )
    list_filter = ("status", "is_verified", "currency", "created_at")
    search_fields = ("name", "slug", "owner__email")
    readonly_fields = (
        "public_id", "rating_average", "rating_count",
        "product_count", "total_sales",
    )
    raw_id_fields = ("owner",)
    prepopulated_fields = {"slug": ("name",)}
    date_hierarchy = "created_at"
    inlines = [ShopThemeInline, ShopStaffInline]

    fieldsets = (
        (None, {
            "fields": (
                "public_id", "owner", "name", "slug", "tagline", "description",
                "status", "is_verified", "currency",
            ),
        }),
        ("Branding", {
            "fields": ("logo", "banner"),
        }),
        ("Contact", {
            "fields": ("email", "phone", "address", "country"),
        }),
        ("Social", {
            "classes": ("collapse",),
            "fields": (
                "facebook_url", "instagram_url", "twitter_url", "website_url",
            ),
        }),
        ("Feature toggles", {
            "fields": (
                "enable_product_listings", "enable_custom_orders",
                "enable_reviews", "enable_contact",
                "enable_shipping", "enable_social_links",
            ),
        }),
        ("Aggregates (read-only)", {
            "classes": ("collapse",),
            "fields": (
                "rating_average", "rating_count",
                "product_count", "total_sales",
            ),
        }),
    )


# ---------------------------------------------------------------------------
# Layout builder
# ---------------------------------------------------------------------------

@admin.register(ShopLayout)
class ShopLayoutAdmin(admin.ModelAdmin):
    list_display = ("shop", "page", "is_published", "created_at")
    list_filter = ("page", "is_published")
    search_fields = ("shop__name",)
    raw_id_fields = ("shop",)
    inlines = [LayoutSectionInline]


@admin.register(LayoutSection)
class LayoutSectionAdmin(admin.ModelAdmin):
    list_display = ("layout", "kind", "position", "is_visible")
    list_filter = ("kind", "is_visible")
    inlines = [SectionBlockInline]


# ---------------------------------------------------------------------------
# Reviews
# ---------------------------------------------------------------------------

@admin.register(ShopReview)
class ShopReviewAdmin(admin.ModelAdmin):
    list_display = ("shop", "user", "rating", "created_at")
    list_filter = ("rating", "created_at")
    search_fields = ("shop__name", "user__email")
    raw_id_fields = ("shop", "user")
    date_hierarchy = "created_at"

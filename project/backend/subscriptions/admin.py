from django.contrib import admin

from .models import SubscriptionPlan, UserSubscription, SubscriptionCoupon, SubscriptionCouponRedemption


@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(admin.ModelAdmin):
    list_display = (
        "name", "code", "monthly_price", "currency",
        "max_shops", "max_products",
        "is_active", "is_enterprise", "display_order",
    )
    list_filter = (
        "is_active", "is_enterprise",
        "custom_domain_enabled", "analytics_enabled",
        "staff_accounts_enabled", "priority_support_enabled",
    )
    search_fields = ("name", "code")
    prepopulated_fields = {"code": ("name",)}
    list_editable = ("is_active", "display_order")
    fieldsets = (
        (None, {"fields": ("code", "name", "description", "display_order", "is_active")}),
        ("Pricing", {"fields": ("monthly_price", "currency", "is_enterprise")}),
        ("Limits (blank = unlimited)", {"fields": ("max_shops", "max_products")}),
        ("Features", {
            "fields": (
                "custom_domain_enabled", "analytics_enabled",
                "staff_accounts_enabled", "priority_support_enabled",
            )
        }),
    )


@admin.register(UserSubscription)
class UserSubscriptionAdmin(admin.ModelAdmin):
    list_display = (
        "user", "plan", "status", "start_date", "end_date",
        "auto_renew", "payment_reference",
    )
    list_filter = ("status", "plan__code", "auto_renew")
    search_fields = ("user__email", "payment_reference", "provider_subscription_code")
    raw_id_fields = ("user",)
    date_hierarchy = "created_at"


@admin.register(SubscriptionCoupon)
class SubscriptionCouponAdmin(admin.ModelAdmin):
    list_display = (
        "code", "plan", "discount_type", "discount_value",
        "duration_months", "times_used", "max_uses", "expires_at", "is_active", "created_at",
    )
    list_filter = ("is_active", "discount_type", "plan")
    search_fields = ("code", "plan__name")
    list_editable = ("is_active",)
    readonly_fields = ("times_used", "created_at", "updated_at")
    fieldsets = (
        ("Coupon Info", {"fields": ("code", "plan", "is_active")}),
        ("Discount Details", {"fields": ("discount_type", "discount_value", "duration_months")}),
        ("Usage & Expiry", {"fields": ("max_uses", "times_used", "expires_at", "created_by")}),
        ("Timestamps", {"fields": ("created_at", "updated_at")}),
    )


@admin.register(SubscriptionCouponRedemption)
class SubscriptionCouponRedemptionAdmin(admin.ModelAdmin):
    list_display = ("user", "coupon", "plan", "discount_applied", "duration_months_granted", "created_at")
    list_filter = ("coupon", "plan")
    search_fields = ("user__email", "coupon__code")
    readonly_fields = ("user", "coupon", "plan", "discount_applied", "duration_months_granted", "created_at")


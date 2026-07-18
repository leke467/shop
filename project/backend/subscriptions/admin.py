from django.contrib import admin

from .models import SubscriptionPlan, UserSubscription


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
    autocomplete_fields = ()

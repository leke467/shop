from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _

from .models import Address, BuyerProfile, User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    ordering = ("email",)
    list_display = ("email", "role", "is_active", "is_staff", "is_email_verified", "created_at")
    list_filter = ("role", "is_active", "is_staff", "is_email_verified")
    search_fields = ("email", "username", "phone")
    readonly_fields = ("public_id", "created_at", "updated_at", "last_login", "date_joined")

    fieldsets = (
        (None, {"fields": ("email", "password")}),
        (_("Personal info"), {"fields": ("username", "first_name", "last_name", "phone", "avatar")}),
        (_("Role & status"), {"fields": ("role", "is_email_verified", "accepts_marketing")}),
        (_("Permissions"), {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        (_("Identifiers"), {"fields": ("public_id",)}),
        (_("Important dates"), {"fields": ("last_login", "date_joined", "created_at", "updated_at")}),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("email", "password1", "password2", "role", "is_staff", "is_superuser"),
            },
        ),
    )


@admin.register(BuyerProfile)
class BuyerProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "display_name", "preferred_currency", "updated_at")
    search_fields = ("user__email", "display_name")
    readonly_fields = ("created_at", "updated_at")


@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    list_display = ("full_name", "user", "kind", "city", "country", "is_default")
    list_filter = ("kind", "country", "is_default")
    search_fields = ("full_name", "user__email", "city", "postal_code")

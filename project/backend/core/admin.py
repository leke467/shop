from django import forms
from django.contrib import admin
from .models import PlatformFeeSettings, SiteTheme


class SiteThemeForm(forms.ModelForm):
    class Meta:
        model = SiteTheme
        fields = '__all__'
        widgets = {
            'custom_primary': forms.TextInput(attrs={'type': 'color', 'style': 'height: 40px; padding: 0;'}),
            'custom_secondary': forms.TextInput(attrs={'type': 'color', 'style': 'height: 40px; padding: 0;'}),
            'custom_accent': forms.TextInput(attrs={'type': 'color', 'style': 'height: 40px; padding: 0;'}),
        }


@admin.register(SiteTheme)
class SiteThemeAdmin(admin.ModelAdmin):
    form = SiteThemeForm
    list_display = ("preset", "is_active", "updated_at")
    list_filter = ("is_active", "preset")
    readonly_fields = ("created_at", "updated_at")

    fieldsets = (
        ("Preset Selection", {
            "fields": ("preset", "is_active"),
            "description": "Choose a preset color palette. Only one theme can be active at a time.",
        }),
        ("Custom Colors (only used with 'Custom' preset)", {
            "fields": ("custom_primary", "custom_secondary", "custom_accent"),
            "classes": ("collapse",),
        }),
    )


@admin.register(PlatformFeeSettings)
class PlatformFeeSettingsAdmin(admin.ModelAdmin):
    list_display = (
        "fee_model",
        "buyer_escrow_fee_percent",
        "seller_commission_percent",
        "pass_gateway_fee_to_buyer",
        "is_active",
        "updated_at",
    )
    list_filter = ("is_active", "fee_model")
    readonly_fields = ("created_at", "updated_at")

    fieldsets = (
        ("Fee Model Selection (Option A vs Option B)", {
            "fields": ("fee_model", "is_active"),
            "description": (
                "Choose between:<br/>"
                "• <strong>Option A (Zero-Deduction Seller)</strong>: Buyer covers 5% Escrow & Protection Fee + Gateway Fee. Seller keeps 100% of sales.<br/>"
                "• <strong>Option B (50/50 Escrow Split)</strong>: Buyer pays 2.5% Escrow Fee + Gateway Fee. Seller pays 2.5% platform commission.<br/>"
                "Percentages auto-sync upon saving."
            ),
        }),
        ("Detailed Rates & Gateway Charges", {
            "fields": (
                "buyer_escrow_fee_percent",
                "seller_commission_percent",
                "pass_gateway_fee_to_buyer",
                "estimated_gateway_fee_percent",
            ),
            "description": "Customizable overrides for buyer fee, seller commission, and payment gateway pass-through.",
        }),
        ("Audit Metadata", {
            "fields": ("created_at", "updated_at"),
            "classes": ("collapse",),
        }),
    )


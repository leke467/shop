from django import forms
from django.contrib import admin
from .models import SiteTheme


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

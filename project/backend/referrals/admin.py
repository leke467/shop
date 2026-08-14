"""
Django Admin registration for referrals.
"""
from django.contrib import admin

from referrals.models import Referral, ReferralCode, ReferralEarning


@admin.register(ReferralCode)
class ReferralCodeAdmin(admin.ModelAdmin):
    list_display = ["code", "user", "total_clicks", "total_referred_sellers", "total_referred_buyers", "total_earnings", "created_at"]
    search_fields = ["code", "user__email"]
    ordering = ["-created_at"]


@admin.register(Referral)
class ReferralAdmin(admin.ModelAdmin):
    list_display = ["referrer", "referred_user", "referral_code", "created_at"]
    search_fields = ["referrer__email", "referred_user__email", "referral_code__code"]


@admin.register(ReferralEarning)
class ReferralEarningAdmin(admin.ModelAdmin):
    list_display = ["referrer", "referred_user", "earning_type", "gross_amount", "reward_amount", "created_at"]
    list_filter = ["earning_type"]
    search_fields = ["referrer__email", "referred_user__email", "notes"]

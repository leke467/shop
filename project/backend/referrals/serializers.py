"""
Referral API Serializers.
"""
from __future__ import annotations

from rest_framework import serializers

from referrals.models import Referral, ReferralCode, ReferralEarning


class ReferralCodeSerializer(serializers.ModelSerializer):
    referral_url = serializers.SerializerMethodField()

    class Meta:
        model = ReferralCode
        fields = [
            "id",
            "code",
            "total_clicks",
            "total_referred_sellers",
            "total_referred_buyers",
            "total_earnings",
            "referral_url",
            "created_at",
        ]
        read_only_fields = fields

    def get_referral_url(self, obj) -> str:
        from django.conf import settings
        from urllib.parse import urlparse

        frontend_base = getattr(settings, "FRONTEND_URL", "http://localhost:5173").rstrip("/")
        request = self.context.get("request")
        if request:
            origin = request.META.get("HTTP_ORIGIN") or request.META.get("HTTP_REFERER")
            if origin:
                parsed = urlparse(origin)
                if parsed.scheme and parsed.netloc:
                    frontend_base = f"{parsed.scheme}://{parsed.netloc}".rstrip("/")

        return f"{frontend_base}/signup?ref={obj.code}"


class ReferralEarningSerializer(serializers.ModelSerializer):
    referred_user_email = serializers.SerializerMethodField()

    class Meta:
        model = ReferralEarning
        fields = [
            "id",
            "earning_type",
            "gross_amount",
            "reward_amount",
            "notes",
            "created_at",
            "referred_user_email",
        ]

    def get_referred_user_email(self, obj) -> str:
        return obj.referred_user.email if obj.referred_user else "Anonymous"


class ReferralStatsSerializer(serializers.Serializer):
    code = serializers.CharField()
    referral_url = serializers.CharField()
    total_clicks = serializers.IntegerField()
    total_referred_sellers = serializers.IntegerField()
    total_referred_buyers = serializers.IntegerField()
    total_earnings = serializers.DecimalField(max_digits=12, decimal_places=2)
    wallet_balance = serializers.DecimalField(max_digits=12, decimal_places=2)
    earnings_history = ReferralEarningSerializer(many=True)

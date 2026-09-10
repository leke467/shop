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


class ReferredUserSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()
    email = serializers.CharField()
    masked_email = serializers.CharField()
    role = serializers.CharField()
    role_display = serializers.CharField()
    shop_name = serializers.CharField(allow_null=True, required=False)
    active_plan = serializers.CharField(allow_null=True, required=False)
    registered_at = serializers.DateTimeField()
    has_paid = serializers.BooleanField()
    status = serializers.CharField()
    status_label = serializers.CharField()
    status_detail = serializers.CharField()
    total_earned = serializers.DecimalField(max_digits=12, decimal_places=2)
    earnings_count = serializers.IntegerField()


class ReferralStatsSerializer(serializers.Serializer):
    code = serializers.CharField()
    referral_url = serializers.CharField()
    total_clicks = serializers.IntegerField()
    total_referred_sellers = serializers.IntegerField()
    total_referred_buyers = serializers.IntegerField()
    total_referred = serializers.IntegerField()
    total_paid_count = serializers.IntegerField()
    total_pending_count = serializers.IntegerField()
    total_earnings = serializers.DecimalField(max_digits=12, decimal_places=2)
    wallet_balance = serializers.DecimalField(max_digits=12, decimal_places=2)
    referred_users = ReferredUserSerializer(many=True)
    earnings_history = ReferralEarningSerializer(many=True)


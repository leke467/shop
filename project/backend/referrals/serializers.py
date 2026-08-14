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
        request = self.context.get("request")
        base = "https://multishopng.com"
        if request:
            base = f"{request.scheme}://{request.get_host()}"
        return f"{base}/register?ref={obj.code}"


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

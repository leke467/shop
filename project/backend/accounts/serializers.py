"""
Account serializers.

Registration, login profile, password reset.
"""
from rest_framework import serializers

from .models import Address, BuyerProfile, User


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=10)
    referral_code = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ("email", "password", "first_name", "last_name", "username", "referral_code")
        extra_kwargs = {
            "first_name": {"required": True},
            "last_name": {"required": True},
        }

    def create(self, validated_data):
        ref_code_str = validated_data.pop("referral_code", "").strip()
        user = User.objects.create_user(**validated_data)

        if ref_code_str:
            try:
                from referrals.models import Referral, ReferralCode
                ref_obj = ReferralCode.objects.select_related("user").get(code__iexact=ref_code_str)
                if ref_obj.user != user:
                    Referral.objects.create(
                        referrer=ref_obj.user,
                        referred_user=user,
                        referral_code=ref_obj,
                    )
                    if user.role == User.Roles.SELLER:
                        ref_obj.total_referred_sellers += 1
                    else:
                        ref_obj.total_referred_buyers += 1
                    ref_obj.save(update_fields=["total_referred_sellers", "total_referred_buyers", "updated_at"])
            except Exception:
                pass

        return user


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            "public_id", "email", "username", "first_name", "last_name",
            "role", "phone", "avatar", "is_email_verified",
            "accepts_marketing", "created_at",
        )
        read_only_fields = ("public_id", "email", "role", "is_email_verified", "created_at")


class BuyerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = BuyerProfile
        fields = ("display_name", "preferred_currency", "category_affinities", "recently_viewed")
        read_only_fields = ("category_affinities", "recently_viewed")


class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = (
            "id", "kind", "full_name", "phone",
            "line1", "line2", "city", "state",
            "postal_code", "country", "is_default",
        )
        read_only_fields = ("id",)

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)

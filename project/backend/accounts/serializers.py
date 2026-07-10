"""
Account serializers.

Registration, login profile, password reset.
"""
from rest_framework import serializers

from .models import Address, BuyerProfile, User


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=10)

    class Meta:
        model = User
        fields = ("email", "password", "first_name", "last_name", "username")
        extra_kwargs = {
            "first_name": {"required": True},
            "last_name": {"required": True},
        }

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


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

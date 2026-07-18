"""
Subscription serializers.

Thin by design — they validate input and shape output; all business logic
lives in :mod:`subscriptions.services`.
"""
from rest_framework import serializers

from .models import SubscriptionPlan, UserSubscription


class SubscriptionPlanSerializer(serializers.ModelSerializer):
    """Public plan representation for the pricing page.

    ``None`` limits are surfaced as-is (JSON ``null``) and the frontend renders
    them as "Unlimited".
    """

    features = serializers.SerializerMethodField()

    class Meta:
        model = SubscriptionPlan
        fields = (
            "public_id", "code", "name", "description",
            "monthly_price", "currency",
            "max_shops", "max_products",
            "custom_domain_enabled", "analytics_enabled",
            "staff_accounts_enabled", "priority_support_enabled",
            "is_enterprise", "is_active", "display_order",
            "features",
        )
        read_only_fields = fields

    def get_features(self, obj) -> dict:
        return obj.features()


class SubscriptionPlanAdminSerializer(serializers.ModelSerializer):
    """Writable serializer for admin plan management."""

    class Meta:
        model = SubscriptionPlan
        fields = (
            "public_id", "code", "name", "description",
            "monthly_price", "currency",
            "max_shops", "max_products",
            "custom_domain_enabled", "analytics_enabled",
            "staff_accounts_enabled", "priority_support_enabled",
            "is_enterprise", "is_active", "display_order",
            "created_at", "updated_at",
        )
        read_only_fields = ("public_id", "created_at", "updated_at")


class UserSubscriptionSerializer(serializers.ModelSerializer):
    """Read serializer for a user's subscription record."""

    plan = SubscriptionPlanSerializer(read_only=True)
    user_email = serializers.EmailField(source="user.email", read_only=True)
    next_renewal_date = serializers.DateTimeField(read_only=True)

    class Meta:
        model = UserSubscription
        fields = (
            "public_id", "user_email", "plan", "status",
            "start_date", "end_date", "next_renewal_date",
            "payment_reference", "auto_renew", "cancelled_at",
            "created_at",
        )
        read_only_fields = fields


class CurrentSubscriptionSerializer(serializers.Serializer):
    """Composed payload for ``GET /api/subscription/current``.

    Combines the resolved plan, usage counts, and remaining allowances.
    Built from a :class:`subscriptions.services.UsageSnapshot`.
    """

    plan = SubscriptionPlanSerializer()
    status = serializers.CharField()
    start_date = serializers.DateTimeField(allow_null=True)
    end_date = serializers.DateTimeField(allow_null=True)
    next_renewal_date = serializers.DateTimeField(allow_null=True)
    auto_renew = serializers.BooleanField()

    shops_used = serializers.IntegerField()
    shops_limit = serializers.IntegerField(allow_null=True)       # null == unlimited
    shops_remaining = serializers.IntegerField(allow_null=True)
    products_used = serializers.IntegerField()
    products_limit = serializers.IntegerField(allow_null=True)    # null == unlimited
    products_remaining = serializers.IntegerField(allow_null=True)

    features = serializers.DictField(child=serializers.BooleanField())


class UpgradeRequestSerializer(serializers.Serializer):
    """Input for ``POST /api/subscription/upgrade``."""

    plan_code = serializers.SlugField()
    callback_url = serializers.URLField(required=False, allow_blank=True, default="")

    def validate_plan_code(self, value):
        plan = SubscriptionPlan.objects.filter(code=value, is_active=True).first()
        if plan is None:
            raise serializers.ValidationError("No active plan with that code.")
        self.context["plan"] = plan
        return value


class AdminChangePlanSerializer(serializers.Serializer):
    """Input for an admin manually upgrading/downgrading a user."""

    user_id = serializers.IntegerField()
    plan_code = serializers.SlugField()
    months = serializers.IntegerField(required=False, min_value=1, default=1)


class SubscriptionStatsSerializer(serializers.Serializer):
    """Aggregate statistics for the admin dashboard."""

    total_paying_users = serializers.IntegerField()
    total_active_subscriptions = serializers.IntegerField()
    users_per_plan = serializers.ListField(child=serializers.DictField())
    monthly_recurring_revenue = serializers.DecimalField(
        max_digits=14, decimal_places=2
    )
    currency = serializers.CharField()

"""
Subscription API views.

Endpoints
---------
GET  /api/subscription/plans/          Public list of active plans.
GET  /api/subscription/current/        Current user's plan + usage.
POST /api/subscription/upgrade/        Start an upgrade (Paystack or free).
GET  /api/subscription/mine/           The user's subscription history.

Admin (staff only)
GET/POST      /api/subscription/admin/plans/          List / create plans.
GET/PUT/PATCH/DELETE /api/subscription/admin/plans/<code>/   Manage a plan.
GET  /api/subscription/admin/subscriptions/            All subscriptions.
POST /api/subscription/admin/change-plan/              Manual up/downgrade.
GET  /api/subscription/admin/stats/                    MRR + per-plan counts.

Views are thin controllers; enforcement and billing live in
:mod:`subscriptions.services`.
"""
from __future__ import annotations

from decimal import Decimal

from django.contrib.auth import get_user_model
from django.db.models import Count
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import SubscriptionPlan, UserSubscription
from .serializers import (
    AdminChangePlanSerializer,
    CurrentSubscriptionSerializer,
    SubscriptionPlanAdminSerializer,
    SubscriptionPlanSerializer,
    SubscriptionStatsSerializer,
    UpgradeRequestSerializer,
    UserSubscriptionSerializer,
)
from .services import (
    DowngradeBlocked,
    SubscriptionError,
    activate_plan,
    ensure_subscription,
    get_usage,
    initiate_paystack_upgrade,
)

User = get_user_model()


# ---------------------------------------------------------------------------
# Public / seller endpoints
# ---------------------------------------------------------------------------

class PlanListView(generics.ListAPIView):
    """Public list of active, purchasable plans, ordered for display."""

    serializer_class = SubscriptionPlanSerializer
    permission_classes = [AllowAny]
    pagination_class = None

    def get_queryset(self):
        return SubscriptionPlan.objects.filter(is_active=True).order_by(
            "display_order", "monthly_price"
        )


class CurrentSubscriptionView(APIView):
    """Return the requesting user's plan, usage counts, and remaining quota."""

    permission_classes = [IsAuthenticated]

    @extend_schema(responses=CurrentSubscriptionSerializer)
    def get(self, request):
        usage = get_usage(request.user)
        sub = usage.subscription
        payload = {
            "plan": usage.plan,
            "status": sub.status if sub else UserSubscription.Status.ACTIVE,
            "start_date": sub.start_date if sub else None,
            "end_date": sub.end_date if sub else None,
            "next_renewal_date": sub.next_renewal_date if sub else None,
            "auto_renew": sub.auto_renew if sub else False,
            "shops_used": usage.shops_used,
            "shops_limit": usage.shops_limit,
            "shops_remaining": usage.shops_remaining,
            "products_used": usage.products_used,
            "products_limit": usage.products_limit,
            "products_remaining": usage.products_remaining,
            "features": usage.plan.features(),
        }
        return Response(CurrentSubscriptionSerializer(payload).data)


class MySubscriptionsView(generics.ListAPIView):
    """The requesting user's subscription history (most recent first)."""

    serializer_class = UserSubscriptionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return UserSubscription.objects.filter(
            user=self.request.user
        ).select_related("plan")


class UpgradeView(APIView):
    """Start an upgrade to a paid plan (via Paystack) or switch to free."""

    permission_classes = [IsAuthenticated]

    @extend_schema(
        request=UpgradeRequestSerializer,
        responses={200: OpenApiResponse(description="Upgrade initiated.")},
    )
    def post(self, request):
        ser = UpgradeRequestSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        plan = ser.context["plan"]

        try:
            result = initiate_paystack_upgrade(
                request.user, plan,
                callback_url=ser.validated_data.get("callback_url", ""),
            )
        except DowngradeBlocked:
            raise
        except SubscriptionError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(result, status=status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# Admin endpoints
# ---------------------------------------------------------------------------

class AdminPlanListCreateView(generics.ListCreateAPIView):
    """Admin: list every plan (including inactive) and create new ones."""

    queryset = SubscriptionPlan.objects.all().order_by("display_order")
    serializer_class = SubscriptionPlanAdminSerializer
    permission_classes = [IsAdminUser]
    pagination_class = None


class AdminPlanDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Admin: retrieve, edit, disable, or delete a plan by its code."""

    queryset = SubscriptionPlan.objects.all()
    serializer_class = SubscriptionPlanAdminSerializer
    permission_classes = [IsAdminUser]
    lookup_field = "code"


class AdminSubscriptionListView(generics.ListAPIView):
    """Admin: view all user subscriptions, optionally filtered by status/plan."""

    serializer_class = UserSubscriptionSerializer
    permission_classes = [IsAdminUser]
    filterset_fields = ["status", "plan__code"]
    search_fields = ["user__email", "payment_reference"]

    def get_queryset(self):
        return UserSubscription.objects.select_related("plan", "user").order_by(
            "-created_at"
        )


class AdminChangePlanView(APIView):
    """Admin: manually move a user onto a plan (upgrade or downgrade)."""

    permission_classes = [IsAdminUser]

    @extend_schema(request=AdminChangePlanSerializer,
                   responses=UserSubscriptionSerializer)
    def post(self, request):
        ser = AdminChangePlanSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        d = ser.validated_data

        target_user = User.objects.filter(pk=d["user_id"]).first()
        if target_user is None:
            return Response({"detail": "User not found."},
                            status=status.HTTP_404_NOT_FOUND)

        plan = SubscriptionPlan.objects.filter(code=d["plan_code"]).first()
        if plan is None:
            return Response({"detail": "Plan not found."},
                            status=status.HTTP_404_NOT_FOUND)

        sub = activate_plan(
            target_user, plan,
            months=d.get("months", 1),
            payment_reference="admin-manual",
            auto_renew=False,
        )
        return Response(UserSubscriptionSerializer(sub).data,
                        status=status.HTTP_200_OK)


class AdminStatsView(APIView):
    """Admin: subscription statistics — paying users, per-plan, MRR estimate."""

    permission_classes = [IsAdminUser]

    @extend_schema(responses=SubscriptionStatsSerializer)
    def get(self, request):
        active = UserSubscription.objects.filter(
            status=UserSubscription.Status.ACTIVE
        ).select_related("plan")

        per_plan_qs = (
            active.values("plan__code", "plan__name", "plan__monthly_price")
            .annotate(count=Count("id"))
            .order_by("plan__display_order")
        )

        users_per_plan = []
        mrr = Decimal("0")
        paying_users = 0
        for row in per_plan_qs:
            price = row["plan__monthly_price"] or Decimal("0")
            count = row["count"]
            users_per_plan.append({
                "plan_code": row["plan__code"],
                "plan_name": row["plan__name"],
                "monthly_price": str(price),
                "count": count,
            })
            mrr += price * count
            if price > 0:
                paying_users += count

        currency = (
            SubscriptionPlan.objects.filter(is_active=True)
            .values_list("currency", flat=True)
            .first()
            or "NGN"
        )

        payload = {
            "total_paying_users": paying_users,
            "total_active_subscriptions": active.count(),
            "users_per_plan": users_per_plan,
            "monthly_recurring_revenue": mrr,
            "currency": currency,
        }
        return Response(SubscriptionStatsSerializer(payload).data)

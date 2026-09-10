"""
Referral API Views — My Stats, Click Tracking, Custom Code, Payouts.
"""
from __future__ import annotations

from decimal import Decimal

from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from orders.models import SellerWallet
from referrals.models import Referral, ReferralCode, ReferralEarning
from referrals.serializers import ReferralCodeSerializer, ReferralEarningSerializer


def mask_email(email: str) -> str:
    if not email or "@" not in email:
        return "***"
    local, domain = email.split("@", 1)
    if len(local) <= 2:
        masked_local = local[0] + "*"
    else:
        masked_local = local[0] + "*" * min(len(local) - 2, 6) + local[-1]
    return f"{masked_local}@{domain}"


class ReferralMyStatsView(APIView):
    """GET current user's referral code, link, stats, referred users, and earnings history."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        ref_obj, _ = ReferralCode.objects.get_or_create(user=request.user)

        from shops.models import Shop
        referrer_shop = Shop.objects.filter(owner=request.user).first()
        wallet_balance = Decimal("0.00")
        if referrer_shop:
            try:
                wallet = SellerWallet.objects.get(shop=referrer_shop)
                wallet_balance = wallet.balance
            except SellerWallet.DoesNotExist:
                pass

        # Fetch all users referred by current user
        from django.db.models import Count, Sum
        referrals = (
            Referral.objects.filter(referrer=request.user)
            .select_related("referred_user", "referral_code")
            .order_by("-created_at")
        )

        referred_user_ids = [r.referred_user_id for r in referrals]

        # Aggregate earnings per referred user
        earnings_summary = (
            ReferralEarning.objects.filter(referrer=request.user, referred_user_id__in=referred_user_ids)
            .values("referred_user_id")
            .annotate(
                total_earned=Sum("reward_amount"),
                count=Count("id"),
            )
        )
        earnings_map = {item["referred_user_id"]: item for item in earnings_summary}

        # Check shops
        shops_map = {}
        if referred_user_ids:
            for s in Shop.objects.filter(owner_id__in=referred_user_ids).only("owner_id", "name"):
                shops_map[s.owner_id] = s.name

        # Check active subscriptions
        subs_map = {}
        if referred_user_ids:
            try:
                from subscriptions.models import UserSubscription
                for sub in UserSubscription.objects.filter(
                    user_id__in=referred_user_ids,
                    status=UserSubscription.Status.ACTIVE,
                ).select_related("plan"):
                    if not sub.plan.is_free:
                        subs_map[sub.user_id] = sub.plan.name
            except Exception:
                pass

        referred_users_list = []
        paid_count = 0
        for ref in referrals:
            u = ref.referred_user
            u_earnings = earnings_map.get(u.id, {})
            total_earned = u_earnings.get("total_earned") or Decimal("0.00")
            earnings_count = u_earnings.get("count") or 0
            has_paid = total_earned > Decimal("0.00") or (u.id in subs_map)

            if has_paid:
                paid_count += 1
                status_key = "paid"
                status_label = "Paid & Active"
                if total_earned > Decimal("0.00"):
                    status_detail = f"Earned ₦{total_earned:,.2f} ({earnings_count} reward{'s' if earnings_count != 1 else ''})"
                else:
                    status_detail = f"Active paid plan ({subs_map.get(u.id, 'Subscribed')})"
            else:
                status_key = "pending"
                status_label = "Pending Payment"
                status_detail = "Registered — Awaiting first subscription or sale"

            full_name = f"{u.first_name} {u.last_name}".strip()
            display_name = full_name or u.username or "Partner User"

            referred_users_list.append({
                "id": u.id,
                "name": display_name,
                "email": u.email if request.user.is_staff else mask_email(u.email),
                "masked_email": mask_email(u.email),
                "role": u.role,
                "role_display": "Shop Owner" if u.role == "seller" else "Shopper",
                "shop_name": shops_map.get(u.id),
                "active_plan": subs_map.get(u.id),
                "registered_at": ref.created_at,
                "has_paid": has_paid,
                "status": status_key,
                "status_label": status_label,
                "status_detail": status_detail,
                "total_earned": total_earned,
                "earnings_count": earnings_count,
            })

        total_referred = len(referred_users_list)
        pending_count = total_referred - paid_count

        earnings = ReferralEarning.objects.filter(referrer=request.user).order_by("-created_at")[:50]
        earnings_serializer = ReferralEarningSerializer(earnings, many=True)
        code_serializer = ReferralCodeSerializer(ref_obj, context={"request": request})

        return Response({
            "code": ref_obj.code,
            "referral_url": code_serializer.data.get("referral_url"),
            "total_clicks": ref_obj.total_clicks,
            "total_referred_sellers": ref_obj.total_referred_sellers,
            "total_referred_buyers": ref_obj.total_referred_buyers,
            "total_referred": total_referred,
            "total_paid_count": paid_count,
            "total_pending_count": pending_count,
            "total_earnings": ref_obj.total_earnings,
            "wallet_balance": wallet_balance,
            "referred_users": referred_users_list,
            "earnings_history": earnings_serializer.data,
        })


class ReferralValidateCodeView(APIView):
    """GET /api/referrals/validate/?code=XYZ — Validate if referral code exists."""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        code_str = (request.query_params.get("code") or request.data.get("code") or "").strip()
        if not code_str:
            return Response({"valid": False, "detail": "Code is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            ref_obj = ReferralCode.objects.select_related("user").get(code__iexact=code_str)
            user = ref_obj.user
            name = f"{user.first_name} {user.last_name}".strip() or user.username or "MultiShop Partner"
            return Response({
                "valid": True,
                "code": ref_obj.code,
                "referrer_name": name,
            })
        except ReferralCode.DoesNotExist:
            return Response({"valid": False, "detail": "Referral code not found."}, status=status.HTTP_404_NOT_FOUND)


class ReferralTrackClickView(APIView):
    """POST /api/referrals/click/ {code} — Track referral link click."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        code_str = request.data.get("code") or request.query_params.get("code")
        if not code_str:
            return Response({"detail": "Code required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            ref_obj = ReferralCode.objects.get(code__iexact=code_str.strip())
            ref_obj.total_clicks += 1
            ref_obj.save(update_fields=["total_clicks", "updated_at"])
            return Response({"status": "tracked", "code": ref_obj.code})
        except ReferralCode.DoesNotExist:
            return Response({"detail": "Invalid referral code."}, status=status.HTTP_404_NOT_FOUND)


class ReferralCustomCodeView(APIView):
    """POST /api/referrals/custom-code/ {custom_code} — Set custom referral handle."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        custom = request.data.get("custom_code", "").strip().upper()
        if not custom or len(custom) < 4 or len(custom) > 20:
            return Response({"detail": "Custom code must be between 4 and 20 alphanumeric characters."}, status=status.HTTP_400_BAD_REQUEST)

        if not custom.isalnum():
            return Response({"detail": "Code can only contain letters and numbers."}, status=status.HTTP_400_BAD_REQUEST)

        if ReferralCode.objects.filter(code=custom).exclude(user=request.user).exists():
            return Response({"detail": "That referral handle is already taken."}, status=status.HTTP_400_BAD_REQUEST)

        ref_obj, _ = ReferralCode.objects.get_or_create(user=request.user)
        ref_obj.code = custom
        ref_obj.save(update_fields=["code", "updated_at"])

        serializer = ReferralCodeSerializer(ref_obj, context={"request": request})
        return Response(serializer.data)


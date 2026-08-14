"""
Referral API Views — My Stats, Click Tracking, Custom Code, Payouts.
"""
from __future__ import annotations

from decimal import Decimal

from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from orders.models import SellerWallet
from referrals.models import ReferralCode, ReferralEarning
from referrals.serializers import ReferralCodeSerializer, ReferralEarningSerializer


class ReferralMyStatsView(APIView):
    """GET current user's referral code, link, stats, and earnings history."""
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

        earnings = ReferralEarning.objects.filter(referrer=request.user).order_by("-created_at")[:50]
        earnings_serializer = ReferralEarningSerializer(earnings, many=True)
        code_serializer = ReferralCodeSerializer(ref_obj, context={"request": request})

        return Response({
            "code": ref_obj.code,
            "referral_url": code_serializer.data.get("referral_url"),
            "total_clicks": ref_obj.total_clicks,
            "total_referred_sellers": ref_obj.total_referred_sellers,
            "total_referred_buyers": ref_obj.total_referred_buyers,
            "total_earnings": ref_obj.total_earnings,
            "wallet_balance": wallet_balance,
            "earnings_history": earnings_serializer.data,
        })


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

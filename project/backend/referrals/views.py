"""
Referral API Views — My Stats, Click Tracking, Custom Code, Payouts.
"""
from __future__ import annotations

from decimal import Decimal
import logging

from django.db import transaction
from django.utils import timezone
from rest_framework import permissions, status, generics
from rest_framework.response import Response
from rest_framework.views import APIView

from referrals.models import (
    Referral,
    ReferralCode,
    ReferralEarning,
    ReferralWallet,
    ReferralBankAccount,
    ReferralPayoutRequest,
    ReferralTransaction,
)
from referrals.serializers import (
    ReferralCodeSerializer,
    ReferralEarningSerializer,
    ReferralWalletSerializer,
    ReferralBankAccountSerializer,
    ReferralPayoutRequestSerializer,
    ReferralTransactionSerializer,
    ReferralWithdrawInputSerializer,
)

from shops.models import Shop

logger = logging.getLogger(__name__)


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

        ref_wallet, _ = ReferralWallet.objects.get_or_create(
            user=request.user,
            defaults={"currency": "NGN"},
        )
        wallet_balance = ref_wallet.balance
        total_earned = ref_wallet.total_earned
        total_withdrawn = ref_wallet.total_withdrawn

        bank_accounts = ReferralBankAccount.objects.filter(user=request.user).order_by("-is_default", "-created_at")
        payout_history = ReferralPayoutRequest.objects.filter(user=request.user).order_by("-created_at")[:20]
        transactions = ReferralTransaction.objects.filter(user=request.user).order_by("-created_at")[:30]

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
            "total_earnings": total_earned,
            "total_withdrawn": total_withdrawn,
            "wallet_balance": wallet_balance,
            "referral_wallet": ReferralWalletSerializer(ref_wallet).data,
            "bank_accounts": ReferralBankAccountSerializer(bank_accounts, many=True).data,
            "payout_history": ReferralPayoutRequestSerializer(payout_history, many=True).data,
            "transactions": ReferralTransactionSerializer(transactions, many=True).data,
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


SUPPORTED_NIGERIAN_BANKS = [
    {"name": "Access Bank", "code": "044"},
    {"name": "Citibank Nigeria", "code": "023"},
    {"name": "Ecobank Nigeria", "code": "050"},
    {"name": "Fidelity Bank", "code": "070"},
    {"name": "First Bank of Nigeria", "code": "011"},
    {"name": "First City Monument Bank (FCMB)", "code": "214"},
    {"name": "Guaranty Trust Bank (GTBank)", "code": "058"},
    {"name": "Heritage Bank", "code": "030"},
    {"name": "Jaiz Bank", "code": "301"},
    {"name": "Keystone Bank", "code": "082"},
    {"name": "Kuda Bank", "code": "50211"},
    {"name": "Moniepoint Microfinance Bank", "code": "50515"},
    {"name": "OPay", "code": "999992"},
    {"name": "PalmPay", "code": "999991"},
    {"name": "Polaris Bank", "code": "076"},
    {"name": "Providus Bank", "code": "101"},
    {"name": "Stanbic IBTC Bank", "code": "221"},
    {"name": "Standard Chartered Bank", "code": "068"},
    {"name": "Sterling Bank", "code": "232"},
    {"name": "Taj Bank", "code": "302"},
    {"name": "Union Bank of Nigeria", "code": "032"},
    {"name": "United Bank for Africa (UBA)", "code": "033"},
    {"name": "Unity Bank", "code": "215"},
    {"name": "Wema Bank (ALAT)", "code": "035"},
    {"name": "Zenith Bank", "code": "057"},
]


class ReferralBanksListView(APIView):
    """GET /api/referrals/banks/ — Supported Nigerian banks for referral withdrawals."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response({"banks": SUPPORTED_NIGERIAN_BANKS})


class ReferralBankAccountListCreateView(APIView):
    """
    GET /api/referrals/bank-accounts/ — List saved bank accounts
    POST /api/referrals/bank-accounts/ — Add a new bank account
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        accounts = ReferralBankAccount.objects.filter(user=request.user).order_by("-is_default", "-created_at")
        serializer = ReferralBankAccountSerializer(accounts, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = ReferralBankAccountSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        is_default = serializer.validated_data.get("is_default", False)
        if is_default or not ReferralBankAccount.objects.filter(user=request.user).exists():
            ReferralBankAccount.objects.filter(user=request.user).update(is_default=False)
            is_default = True

        account = serializer.save(user=request.user, is_default=is_default)
        return Response(ReferralBankAccountSerializer(account).data, status=status.HTTP_201_CREATED)


class ReferralBankAccountDetailView(APIView):
    """DELETE /api/referrals/bank-accounts/<int:pk>/ — Remove a saved bank account."""
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk):
        account = ReferralBankAccount.objects.filter(pk=pk, user=request.user).first()
        if not account:
            return Response({"detail": "Account not found."}, status=status.HTTP_404_NOT_FOUND)
        account.delete()
        return Response({"status": "deleted"}, status=status.HTTP_204_NO_CONTENT)


class ReferralWithdrawView(APIView):
    """
    POST /api/referrals/withdraw/ — Request withdrawal of referral earnings directly to a bank account.
    Zero KYC or shop requirements.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        ser = ReferralWithdrawInputSerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        amount = ser.validated_data["amount"]
        min_payout = Decimal("100.00")
        if amount < min_payout:
            return Response({"detail": f"Minimum payout is ₦{min_payout:,.2f}."}, status=status.HTTP_400_BAD_REQUEST)

        bank_account_id = ser.validated_data.get("bank_account_id")
        bank_name = ser.validated_data.get("bank_name", "").strip()
        account_number = ser.validated_data.get("account_number", "").strip()
        account_name = ser.validated_data.get("account_name", "").strip()
        bank_code = ser.validated_data.get("bank_code", "").strip()
        save_account = ser.validated_data.get("save_account", True)

        saved_account = None
        if bank_account_id:
            saved_account = ReferralBankAccount.objects.filter(id=bank_account_id, user=request.user).first()
            if not saved_account:
                return Response({"detail": "Selected bank account not found."}, status=status.HTTP_404_NOT_FOUND)
            bank_name = saved_account.bank_name
            account_number = saved_account.account_number
            account_name = saved_account.account_name
            bank_code = saved_account.bank_code
        elif not (bank_name and account_number and account_name):
            return Response({"detail": "Bank name, account number, and account name are required."}, status=status.HTTP_400_BAD_REQUEST)
        else:
            if save_account:
                saved_account, _ = ReferralBankAccount.objects.get_or_create(
                    user=request.user,
                    account_number=account_number,
                    defaults={
                        "bank_name": bank_name,
                        "account_name": account_name,
                        "bank_code": bank_code,
                        "is_default": not ReferralBankAccount.objects.filter(user=request.user).exists(),
                    },
                )

        with transaction.atomic():
            wallet, _ = ReferralWallet.objects.select_for_update().get_or_create(
                user=request.user,
                defaults={"currency": "NGN"},
            )

            if amount > wallet.balance:
                return Response(
                    {"detail": f"Insufficient referral wallet balance. Available: ₦{wallet.balance:,.2f}"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            ref_code = f"ref-payout-{request.user.pk}-{int(timezone.now().timestamp())}"
            wallet.debit(
                amount,
                notes=f"Payout to {bank_name} ({account_number})",
                reference=ref_code,
            )

            payout = ReferralPayoutRequest.objects.create(
                user=request.user,
                wallet=wallet,
                bank_account=saved_account,
                amount=amount,
                status=ReferralPayoutRequest.Status.PROCESSING,
                bank_name=bank_name,
                account_number=account_number,
                account_name=account_name,
                bank_code=bank_code,
                provider_reference=ref_code,
            )

            # Auto-transfer via payout service (Monnify / Paystack) if configured
            try:
                from orders.payouts import get_payout_service, MonnifyTransferService
                service = get_payout_service()
                if isinstance(service, MonnifyTransferService):
                    transfer_data = service.initiate_transfer(
                        amount=float(amount),
                        account_number=account_number,
                        bank_code=bank_code,
                        narration=f"Referral payout for {request.user.email}",
                    )
                else:
                    recipient_code = service.create_transfer_recipient(
                        name=account_name,
                        account_number=account_number,
                        bank_code=bank_code,
                    )
                    transfer_data = service.initiate_transfer(
                        amount=float(amount),
                        recipient_code=recipient_code,
                        reason=f"Referral payout for {request.user.email}",
                    )
                payout.provider_reference = transfer_data.get("reference", ref_code)
                payout.status = ReferralPayoutRequest.Status.COMPLETED
                payout.processed_at = timezone.now()
                payout.save(update_fields=["provider_reference", "status", "processed_at"])
            except Exception as e:
                logger.warning("Referral transfer initiation note: %s", e)
                payout.status = ReferralPayoutRequest.Status.PENDING
                payout.failure_reason = str(e)
                payout.save(update_fields=["status", "failure_reason"])

        return Response({
            "status": "success",
            "detail": f"Withdrawal of ₦{amount:,.2f} requested successfully to {bank_name} ({account_number})!",
            "payout": ReferralPayoutRequestSerializer(payout).data,
            "wallet": ReferralWalletSerializer(wallet).data,
        }, status=status.HTTP_201_CREATED)


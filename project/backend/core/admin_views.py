"""
Superadmin Dashboard Backend API Views.
"""
from __future__ import annotations

from datetime import timedelta
from decimal import Decimal

from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Count, Q, Sum
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from core.permissions import IsSuperadminOnly, IsSuperadminOrStaff
from orders.models import OrderGroup, PayoutRequest, SellerWallet, WalletTransaction
from payments.models import Payment
from products.models import Product
from referrals.models import Referral, ReferralCode, ReferralEarning
from shops.models import Shop

User = get_user_model()


class AdminOverviewView(APIView):
    """GET /api/admin/overview/ — Superadmin overview metrics & 30-day revenue chart."""
    permission_classes = [IsSuperadminOrStaff]

    def get(self, request):
        now = timezone.now()
        thirty_days_ago = now - timedelta(days=30)

        total_orders = OrderGroup.objects.count()
        total_revenue_agg = OrderGroup.objects.filter(
            status=OrderGroup.FulfilmentStatus.DELIVERED
        ).aggregate(total=Sum("total_price"))
        total_revenue = total_revenue_agg["total"] or Decimal("0.00")

        total_users = User.objects.count()
        total_shops = Shop.objects.count()
        total_products = Product.objects.count()

        top_products_qs = (
            Product.objects.annotate(sales_count=Count("variants__order_items"))
            .order_by("-sales_count")[:5]
        )
        top_products = [
            {
                "id": p.id,
                "name": p.name,
                "price": str(p.base_price),
                "sales_count": p.sales_count,
                "shop_name": p.shop.name if p.shop else "Platform",
            }
            for p in top_products_qs
        ]

        # 30-day daily revenue time-series
        daily_revenue = []
        for i in range(29, -1, -1):
            day_start = (now - timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
            day_end = day_start + timedelta(days=1)

            day_orders = OrderGroup.objects.filter(
                created_at__gte=day_start, created_at__lt=day_end
            )
            day_rev_agg = day_orders.filter(
                status=OrderGroup.FulfilmentStatus.DELIVERED
            ).aggregate(sum=Sum("total_price"))

            daily_revenue.append({
                "date": day_start.strftime("%b %d"),
                "revenue": float(day_rev_agg["sum"] or 0),
                "orders_count": day_orders.count(),
            })

        return Response({
            "total_revenue": str(total_revenue),
            "total_orders": total_orders,
            "total_users": total_users,
            "total_shops": total_shops,
            "total_products": total_products,
            "top_products": top_products,
            "daily_revenue": daily_revenue,
        })


class AdminOrderListView(APIView):
    """GET /api/admin/orders/ — Filterable list of all platform orders.
       PATCH /api/admin/orders/<id>/ — Update order status / escrow status.
    """
    permission_classes = [IsSuperadminOrStaff]

    def get(self, request):
        qs = OrderGroup.objects.select_related("order", "shop", "order__user").order_by("-created_at")

        status_param = request.query_params.get("status")
        escrow_param = request.query_params.get("escrow_status")
        search = request.query_params.get("search")

        if status_param and status_param.strip():
            qs = qs.filter(status=status_param.strip())
        if escrow_param and escrow_param.strip():
            qs = qs.filter(escrow_status=escrow_param.strip())
        if search and search.strip():
            s = search.strip()
            qs = qs.filter(
                Q(order__public_id__icontains=s) |
                Q(order__user__email__icontains=s) |
                Q(shop__name__icontains=s)
            )

        orders_data = [
            {
                "id": og.id,
                "public_id": str(og.order.public_id),
                "buyer_email": og.order.user.email if og.order.user else "Guest",
                "shop_name": og.shop.name,
                "subtotal": str(og.subtotal),
                "shipping_total": str(og.shipping_total),
                "total_price": str(og.total_price),
                "status": og.status,
                "escrow_status": og.escrow_status,
                "delivery_code": og.delivery_code,
                "created_at": og.created_at,
            }
            for og in qs[:100]
        ]
        return Response({"orders": orders_data})

    def patch(self, request, pk=None):
        try:
            og = OrderGroup.objects.get(pk=pk)
        except OrderGroup.DoesNotExist:
            return Response({"detail": "Order not found."}, status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get("status")
        new_escrow = request.data.get("escrow_status")

        if new_status:
            og.status = new_status
        if new_escrow:
            og.escrow_status = new_escrow

        og.save(update_fields=["status", "escrow_status", "updated_at"])
        return Response({"status": "updated", "id": og.id, "order_status": og.status, "escrow_status": og.escrow_status})


class AdminProductListView(APIView):
    """GET /api/admin/products/ — List all products.
       PATCH /api/admin/products/<id>/ — Approve/reject product or edit stock.
    """
    permission_classes = [IsSuperadminOrStaff]

    def get(self, request):
        qs = Product.objects.select_related("shop").order_by("-created_at")

        search = request.query_params.get("search")
        approved_filter = request.query_params.get("is_approved")

        if search and search.strip():
            s = search.strip()
            qs = qs.filter(Q(name__icontains=s) | Q(shop__name__icontains=s))
        if approved_filter is not None and approved_filter.strip() != "":
            qs = qs.filter(is_approved=approved_filter.lower().strip() in ["true", "1"])

        products_data = [
            {
                "id": p.id,
                "name": p.name,
                "slug": p.slug,
                "shop_name": p.shop.name if p.shop else "Platform",
                "base_price": str(p.base_price),
                "is_approved": p.is_approved,
                "is_active": p.is_active,
                "stock": p.variants.aggregate(s=Sum("quantity"))["s"] or 0,
                "created_at": p.created_at,
            }
            for p in qs[:100]
        ]
        return Response({"products": products_data})

    def patch(self, request, pk=None):
        try:
            p = Product.objects.get(pk=pk)
        except Product.DoesNotExist:
            return Response({"detail": "Product not found."}, status=status.HTTP_404_NOT_FOUND)

        if "is_approved" in request.data:
            p.is_approved = bool(request.data["is_approved"])
        if "is_active" in request.data:
            p.is_active = bool(request.data["is_active"])
        if "base_price" in request.data:
            p.base_price = Decimal(str(request.data["base_price"]))

        p.save()
        return Response({"status": "updated", "id": p.id, "is_approved": p.is_approved, "is_active": p.is_active})


class AdminUserListView(APIView):
    """GET /api/admin/users/ — User directory.
       PATCH /api/admin/users/<id>/ — Activate/deactivate or update user role.
    """
    permission_classes = [IsSuperadminOrStaff]

    def get(self, request):
        qs = User.objects.order_by("-created_at")

        role_filter = request.query_params.get("role")
        search = request.query_params.get("search")

        if role_filter and role_filter.strip():
            qs = qs.filter(role=role_filter.strip())
        if search and search.strip():
            s = search.strip()
            qs = qs.filter(Q(email__icontains=s) | Q(first_name__icontains=s) | Q(last_name__icontains=s))

        users_data = [
            {
                "id": u.id,
                "public_id": str(u.public_id),
                "email": u.email,
                "name": u.get_full_name() or u.email,
                "role": u.role,
                "is_active": u.is_active,
                "is_staff": u.is_staff,
                "date_joined": u.date_joined if hasattr(u, "date_joined") else u.created_at,
            }
            for u in qs[:100]
        ]
        return Response({"users": users_data})

    def patch(self, request, pk=None):
        try:
            u = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        if "is_active" in request.data:
            u.is_active = bool(request.data["is_active"])
        if "role" in request.data:
            # Only superadmins can promote to staff/admin
            if request.data["role"] in ["admin", "staff"] and not request.user.is_superuser:
                return Response({"detail": "Only Superadmin can assign staff or admin roles."}, status=status.HTTP_403_FORBIDDEN)
            u.role = request.data["role"]
            if u.role == "staff":
                u.is_staff = True

        u.save()
        return Response({"status": "updated", "id": u.id, "email": u.email, "role": u.role, "is_active": u.is_active})


class AdminPaymentsView(APIView):
    """GET /api/admin/payments/ — Transaction logs and payout requests."""
    permission_classes = [IsSuperadminOrStaff]

    def get(self, request):
        payments_qs = Payment.objects.order_by("-created_at")[:50]
        payouts_qs = PayoutRequest.objects.select_related("wallet__shop", "bank_account").order_by("-created_at")[:50]

        payments = [
            {
                "id": p.id,
                "provider": p.provider,
                "amount": str(p.amount),
                "currency": p.currency,
                "status": p.status,
                "provider_payment_id": p.provider_payment_id,
                "created_at": p.created_at,
            }
            for p in payments_qs
        ]

        payouts = [
            {
                "id": po.id,
                "shop_name": po.wallet.shop.name if po.wallet and po.wallet.shop else "Vendor",
                "amount": str(po.amount),
                "status": po.status,
                "bank_name": po.bank_account.bank_name if po.bank_account else "Bank",
                "account_number": po.bank_account.account_number if po.bank_account else "",
                "provider_reference": po.provider_reference,
                "created_at": po.created_at,
            }
            for po in payouts_qs
        ]

        return Response({"payments": payments, "payouts": payouts})


class AdminDisputesView(APIView):
    """GET /api/admin/disputes/ — List disputed orders.
       PATCH /api/admin/disputes/<id>/ — Resolve dispute.
    """
    permission_classes = [IsSuperadminOrStaff]

    def get(self, request):
        disputed = OrderGroup.objects.filter(
            escrow_status=OrderGroup.EscrowStatus.DISPUTED
        ).select_related("order", "shop", "order__user").order_by("-updated_at")

        disputes_data = [
            {
                "id": og.id,
                "public_id": str(og.order.public_id),
                "buyer_email": og.order.user.email if og.order.user else "Guest",
                "shop_name": og.shop.name,
                "subtotal": str(og.subtotal),
                "total_price": str(og.total_price),
                "dispute_reason": getattr(og, "dispute_reason", ""),
                "escrow_status": og.escrow_status,
                "created_at": og.created_at,
            }
            for og in disputed
        ]
        return Response({"disputes": disputes_data})

    def patch(self, request, pk=None):
        try:
            og = OrderGroup.objects.get(pk=pk)
        except OrderGroup.DoesNotExist:
            return Response({"detail": "Disputed order not found."}, status=status.HTTP_404_NOT_FOUND)

        action = request.data.get("action")  # "release_seller" or "refund_buyer"
        admin_notes = request.data.get("admin_notes", "")

        with transaction.atomic():
            if action == "release_seller":
                og.escrow_status = OrderGroup.EscrowStatus.RELEASED
                og.status = OrderGroup.FulfilmentStatus.DELIVERED

                # Credit seller
                commission = og.subtotal * (og.shop.commission_rate / Decimal("100.0"))
                net_shipping = max(Decimal("0.00"), og.shipping_total - getattr(og, "logistics_markup", Decimal("0.00")))
                release_amount = (og.subtotal - commission) + net_shipping

                wallet, _ = SellerWallet.objects.select_for_update().get_or_create(shop=og.shop)
                wallet.credit(release_amount)

                WalletTransaction.objects.create(
                    wallet=wallet,
                    kind=WalletTransaction.Kind.ESCROW_RELEASE,
                    amount=release_amount,
                    balance_after=wallet.balance,
                    reference=str(og.order.public_id),
                    notes=f"Admin dispute resolution (Released to seller): {admin_notes}",
                )
            elif action == "refund_buyer":
                og.escrow_status = OrderGroup.EscrowStatus.REFUNDED
                og.status = OrderGroup.FulfilmentStatus.CANCELLED
            else:
                return Response({"detail": "Invalid resolution action."}, status=status.HTTP_400_BAD_REQUEST)

            og.save(update_fields=["escrow_status", "status", "updated_at"])

        return Response({"status": "resolved", "action": action, "escrow_status": og.escrow_status})


class AdminReferralsView(APIView):
    """GET /api/admin/referrals/ — Referral leaderboard & earnings log.
       PATCH /api/admin/referrals/settings/ — Update reward settings.
    """
    permission_classes = [IsSuperadminOrStaff]

    def get(self, request):
        top_codes = ReferralCode.objects.select_related("user").order_by("-total_earnings")[:30]
        recent_earnings = ReferralEarning.objects.select_related("referrer", "referred_user").order_by("-created_at")[:50]

        leaderboard = [
            {
                "code": rc.code,
                "referrer_email": rc.user.email,
                "total_clicks": rc.total_clicks,
                "total_referred_sellers": rc.total_referred_sellers,
                "total_referred_buyers": rc.total_referred_buyers,
                "total_earnings": str(rc.total_earnings),
            }
            for rc in top_codes
        ]

        earnings = [
            {
                "id": re.id,
                "referrer_email": re.referrer.email,
                "referred_user_email": re.referred_user.email if re.referred_user else "Anonymous",
                "earning_type": re.earning_type,
                "gross_amount": str(re.gross_amount),
                "reward_amount": str(re.reward_amount),
                "notes": re.notes,
                "created_at": re.created_at,
            }
            for re in recent_earnings
        ]

        sub_bonus = getattr(settings, "SUBSCRIPTION_REFERRAL_BONUS", Decimal("500.00"))
        comm_share = getattr(settings, "COMMISSION_REFERRAL_SHARE", Decimal("20.0"))

        return Response({
            "leaderboard": leaderboard,
            "earnings": earnings,
            "settings": {
                "subscription_referral_bonus": str(sub_bonus),
                "commission_referral_share": str(comm_share),
            }
        })

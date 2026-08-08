"""Orders views."""
import logging

from django.core.cache import cache
from rest_framework import generics, serializers, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Cart, CartItem, Order, OrderGroup, SellerWallet, SellerBankAccount, PayoutRequest, Coupon
from .serializers import (
    CartItemCreateSerializer, CartSerializer, OrderSerializer,
    SellerBankAccountSerializer, PayoutRequestSerializer, CouponSerializer
)
from products.models import ProductVariant

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Cart
# ---------------------------------------------------------------------------

class CartView(APIView):
    """GET the current user's cart, or POST to add/update an item."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        serializer = CartSerializer(cart)
        return Response(serializer.data)

    def post(self, request):
        """Add or update a cart item."""
        ser = CartItemCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        cart, _ = Cart.objects.get_or_create(user=request.user)
        variant = generics.get_object_or_404(
            ProductVariant.objects.select_related("product"),
            pk=ser.validated_data["variant_id"],
            is_active=True,
        )

        item, created = CartItem.objects.update_or_create(
            cart=cart,
            variant=variant,
            defaults={
                "quantity": ser.validated_data["quantity"],
                "unit_price": variant.price,
            },
        )
        return Response(
            CartSerializer(cart).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class CartItemDeleteView(APIView):
    """Remove a single item from the cart."""
    permission_classes = [IsAuthenticated]

    def delete(self, request, item_id):
        deleted, _ = CartItem.objects.filter(
            cart__user=request.user, id=item_id
        ).delete()
        if not deleted:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# Orders
# ---------------------------------------------------------------------------

class OrderListView(generics.ListAPIView):
    """List the current user's orders."""
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            Order.objects
            .filter(user=self.request.user)
            .prefetch_related("groups__items")
            .order_by("-created_at")
        )


class OrderDetailView(generics.RetrieveAPIView):
    """Retrieve a single order by public_id."""
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = "public_id"

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).prefetch_related(
            "groups__items"
        )


# ---------------------------------------------------------------------------
# Escrow & Delivery Code
# ---------------------------------------------------------------------------

class DeliveryCodeView(APIView):
    """Buyer views their delivery code(s) for an order."""
    permission_classes = [IsAuthenticated]

    def get(self, request, public_id):
        order = generics.get_object_or_404(
            Order, public_id=public_id, user=request.user
        )
        groups = order.groups.select_related("shop").all()
        codes = []
        for g in groups:
            codes.append({
                "group_id": g.id,
                "shop_name": g.shop.name,
                "shop_slug": g.shop.slug,
                "delivery_code": g.delivery_code,
                "escrow_status": g.escrow_status,
                "subtotal": str(g.subtotal),
                "shipping_total": str(g.shipping_total),
            })
        return Response({"order_id": str(order.public_id), "codes": codes})


class ConfirmDeliveryView(APIView):
    """
    Seller enters the delivery code to release escrow.

    Security (C3): Strict rate limiting + failed attempt lockout to prevent
    brute-force attacks on 6-digit delivery codes.
    """
    permission_classes = [IsAuthenticated]
    throttle_scope = "delivery_code"  # 5/min — see settings

    # Max failed attempts before temporary lockout
    MAX_FAILED_ATTEMPTS = 5
    LOCKOUT_SECONDS = 900  # 15 minutes

    def post(self, request, group_id):
        from .escrow import confirm_delivery_code, EscrowError

        # --- C3: Check for lockout ---
        lockout_key = f"delivery_lockout:{request.user.pk}:{group_id}"
        if cache.get(lockout_key):
            return Response(
                {"detail": "Too many failed attempts. Please try again in 15 minutes."},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        group = generics.get_object_or_404(
            OrderGroup.objects.select_related("shop", "order"),
            id=group_id,
        )

        code_attempt = request.data.get("code", "").strip()
        if not code_attempt:
            return Response(
                {"detail": "Delivery code is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            confirm_delivery_code(
                group, code_attempt, requesting_user=request.user,
            )
        except EscrowError as e:
            error_msg = str(e)
            # Track failed attempts for brute-force protection
            if "Invalid delivery code" in error_msg:
                attempts_key = f"delivery_attempts:{request.user.pk}:{group_id}"
                attempts = cache.get(attempts_key, 0) + 1
                cache.set(attempts_key, attempts, self.LOCKOUT_SECONDS)
                if attempts >= self.MAX_FAILED_ATTEMPTS:
                    cache.set(lockout_key, True, self.LOCKOUT_SECONDS)
                    logger.warning(
                        "Delivery code lockout: user=%s group=%s attempts=%d",
                        request.user.pk, group_id, attempts,
                    )
                    return Response(
                        {"detail": "Too many failed attempts. Account locked for 15 minutes."},
                        status=status.HTTP_429_TOO_MANY_REQUESTS,
                    )
            return Response(
                {"detail": error_msg},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Clear failed attempts on success
        cache.delete(f"delivery_attempts:{request.user.pk}:{group_id}")

        return Response({
            "detail": "Delivery confirmed! Funds have been released to your wallet.",
            "escrow_status": group.escrow_status,
        })


class DisputeOrderView(APIView):
    """Buyer opens a dispute on an order group."""
    permission_classes = [IsAuthenticated]

    def post(self, request, group_id):
        from .escrow import dispute_order, EscrowError

        group = generics.get_object_or_404(
            OrderGroup.objects.select_related("order"),
            id=group_id,
        )

        reason = request.data.get("reason", "")
        try:
            dispute_order(group, request.user, reason=reason)
        except EscrowError as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response({
            "detail": "Dispute opened. Our team will review this.",
            "escrow_status": group.escrow_status,
        })


# ---------------------------------------------------------------------------
# Seller Wallet
# ---------------------------------------------------------------------------

class SellerWalletView(APIView):
    """Seller views their wallet balance and recent transactions."""
    permission_classes = [IsAuthenticated]

    def get(self, request, shop_slug):
        from shops.models import Shop

        shop = generics.get_object_or_404(Shop, slug=shop_slug, owner=request.user)
        wallet, _created = SellerWallet.objects.get_or_create(
            shop=shop, defaults={"currency": shop.currency or "NGN"},
        )
        txns = wallet.transactions.all()[:20]
        return Response({
            "balance": str(wallet.balance),
            "total_earned": str(wallet.total_earned),
            "total_withdrawn": str(wallet.total_withdrawn),
            "currency": wallet.currency,
            "transactions": [
                {
                    "kind": t.kind,
                    "kind_display": t.get_kind_display(),
                    "amount": str(t.amount),
                    "balance_after": str(t.balance_after),
                    "reference": t.reference,
                    "notes": t.notes,
                    "created_at": t.created_at.isoformat(),
                }
                for t in txns
            ],
        })


# ---------------------------------------------------------------------------
# Shop Orders (for seller dashboard)
# ---------------------------------------------------------------------------

class ShopOrdersView(APIView):
    """Seller views orders for their shop."""
    permission_classes = [IsAuthenticated]

    def get(self, request, shop_slug):
        from shops.models import Shop

        shop = generics.get_object_or_404(Shop, slug=shop_slug, owner=request.user)
        groups = (
            OrderGroup.objects
            .filter(shop=shop)
            .select_related("order__user")
            .prefetch_related("items")
            .order_by("-created_at")[:50]
        )
        data = []
        for g in groups:
            data.append({
                "group_id": g.id,
                "order_id": str(g.order.public_id),
                "buyer_email": g.order.user.email,
                "buyer_name": g.order.shipping_full_name,
                "status": g.status,
                "escrow_status": g.escrow_status,
                "subtotal": str(g.subtotal),
                "shipping_total": str(g.shipping_total),
                "delivery_code_confirmed": g.delivery_code_confirmed_at is not None,
                "created_at": g.created_at.isoformat(),
                "items": [
                    {
                        "product_name": item.product_name,
                        "variant_name": item.variant_name,
                        "quantity": item.quantity,
                        "unit_price": str(item.unit_price),
                        "line_total": str(item.line_total),
                    }
                    for item in g.items.all()
                ],
            })
        return Response(data)


class UpdateFulfillmentStatusView(APIView):
    """Seller updates fulfillment status (e.g. processing, shipped, delivered)."""
    permission_classes = [IsAuthenticated]

    def patch(self, request, group_id):
        group = generics.get_object_or_404(
            OrderGroup.objects.select_related("shop"),
            id=group_id,
            shop__owner=request.user,
        )
        new_status = request.data.get("status")
        valid_statuses = [choice[0] for choice in OrderGroup.FulfilmentStatus.choices]
        if new_status not in valid_statuses:
            return Response(
                {"detail": f"Invalid status. Must be one of {valid_statuses}"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        group.status = new_status
        group.save(update_fields=["status", "updated_at"])
        return Response({
            "detail": f"Order status updated to {new_status}.",
            "status": group.status,
        })


# ---------------------------------------------------------------------------
# Bank Accounts & Payouts
# ---------------------------------------------------------------------------

class SellerBankAccountListCreateView(generics.ListCreateAPIView):
    """List and create bank accounts for a seller's shop."""
    serializer_class = SellerBankAccountSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return SellerBankAccount.objects.filter(shop__owner=self.request.user)

    def perform_create(self, serializer):
        from shops.models import Shop
        shop = generics.get_object_or_404(Shop, owner=self.request.user)
        is_default = not SellerBankAccount.objects.filter(shop=shop).exists()
        serializer.save(shop=shop, is_default=is_default)


class SellerBankAccountDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = SellerBankAccountSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return SellerBankAccount.objects.filter(shop__owner=self.request.user)


from .payouts import PaystackTransferService
from django.db import transaction

class PayoutRequestListView(generics.ListAPIView):
    serializer_class = PayoutRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return PayoutRequest.objects.filter(wallet__shop__owner=self.request.user).order_by("-created_at")


class PayoutRequestCreateView(generics.CreateAPIView):
    """
    Request a payout (withdrawal) from the seller's wallet.

    Security (C2): Uses select_for_update() on the wallet row inside an
    atomic transaction to prevent concurrent requests from draining the
    wallet below zero.
    """
    serializer_class = PayoutRequestSerializer
    permission_classes = [IsAuthenticated]
    throttle_scope = "payout"  # M3: rate limit payout requests

    def perform_create(self, serializer):
        from shops.models import Shop
        shop = generics.get_object_or_404(Shop, owner=self.request.user)

        amount = serializer.validated_data["amount"]
        bank_account = serializer.validated_data["bank_account"]

        if bank_account.shop != shop:
            raise serializers.ValidationError({"bank_account": "Invalid bank account."})

        with transaction.atomic():
            # C2 FIX: Lock the wallet row to prevent concurrent overdraft.
            wallet, _ = SellerWallet.objects.select_for_update().get_or_create(
                shop=shop, defaults={"currency": shop.currency or "NGN"}
            )

            if amount > wallet.balance:
                raise serializers.ValidationError({"amount": "Insufficient wallet balance."})

            wallet.balance -= amount
            wallet.total_withdrawn += amount
            wallet.save(update_fields=["balance", "total_withdrawn", "updated_at"])
            
            payout = serializer.save(wallet=wallet, status=PayoutRequest.Status.PROCESSING)
            
            service = PaystackTransferService()
            try:
                recipient_code = service.create_transfer_recipient(
                    name=bank_account.account_name,
                    account_number=bank_account.account_number,
                    bank_code=bank_account.bank_code
                )
                transfer_data = service.initiate_transfer(
                    amount=float(amount),
                    recipient_code=recipient_code,
                    reason=f"Payout for {shop.name}"
                )
                payout.provider_reference = transfer_data.get("reference", "")
                payout.save(update_fields=["provider_reference"])
            except Exception as e:
                payout.status = PayoutRequest.Status.FAILED
                payout.failure_reason = str(e)
                payout.save(update_fields=["status", "failure_reason"])
                
                # Refund within same atomic block so both are rolled back on crash
                wallet.balance += amount
                wallet.total_withdrawn -= amount
                wallet.save(update_fields=["balance", "total_withdrawn", "updated_at"])
                raise serializers.ValidationError({"detail": "Transfer failed to initiate."})


# ---------------------------------------------------------------------------
# Coupons
# ---------------------------------------------------------------------------

class CouponApplyView(APIView):
    """Apply a coupon to the cart/order. (H4: throttled to prevent enumeration)"""
    permission_classes = [IsAuthenticated]
    throttle_scope = "coupon"

    def post(self, request):
        code = request.data.get("code")
        shop_slug = request.data.get("shop_slug")

        if not code:
            return Response({"detail": "Coupon code required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            coupon = Coupon.objects.get(code=code)
        except Coupon.DoesNotExist:
            return Response({"detail": "Invalid coupon code."}, status=status.HTTP_404_NOT_FOUND)

        if not coupon.is_valid:
            return Response({"detail": "Coupon is expired or inactive."}, status=status.HTTP_400_BAD_REQUEST)

        if shop_slug and coupon.shop and coupon.shop.slug != shop_slug:
            return Response({"detail": "Coupon is not valid for this shop."}, status=status.HTTP_400_BAD_REQUEST)

        cart, _ = Cart.objects.get_or_create(user=request.user)
        total = cart.total

        if coupon.minimum_order_value > 0 and total < coupon.minimum_order_value:
            return Response({"detail": f"Minimum order value of {coupon.minimum_order_value} required."}, status=status.HTTP_400_BAD_REQUEST)

        if coupon.discount_type == Coupon.DiscountType.PERCENTAGE:
            discount_amount = (total * coupon.value) / 100
        else:
            discount_amount = coupon.value
            
        discount_amount = min(discount_amount, total)

        return Response({
            "discount_amount": str(discount_amount),
            "discount_type": coupon.discount_type,
            "coupon_details": CouponSerializer(coupon).data
        })


class CouponListCreateView(generics.ListCreateAPIView):
    serializer_class = CouponSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        shop_slug = self.kwargs["shop_slug"]
        return Coupon.objects.filter(shop__slug=shop_slug, shop__owner=self.request.user)

    def perform_create(self, serializer):
        from shops.models import Shop
        shop = generics.get_object_or_404(Shop, slug=self.kwargs["shop_slug"], owner=self.request.user)
        serializer.save(shop=shop)


class CouponDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CouponSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        shop_slug = self.kwargs["shop_slug"]
        return Coupon.objects.filter(shop__slug=shop_slug, shop__owner=self.request.user)


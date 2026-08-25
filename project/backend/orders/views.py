"""Orders views."""
import logging
from decimal import Decimal

from django.core.cache import cache
from rest_framework import generics, serializers, status
from rest_framework.permissions import IsAuthenticated, AllowAny
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
        """Add or update a cart item by variant_id or product_id."""
        ser = CartItemCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        cart, _ = Cart.objects.get_or_create(user=request.user)

        raw_variant_id = request.data.get("variant_id") or ser.validated_data.get("variant_id")
        raw_product_id = request.data.get("product_id") or ser.validated_data.get("product_id")

        variant = None
        if raw_variant_id:
            if str(raw_variant_id).isdigit():
                variant = ProductVariant.objects.filter(pk=int(raw_variant_id), is_active=True).first()
            if not variant:
                variant = ProductVariant.objects.filter(public_id=raw_variant_id, is_active=True).first()

        if not variant and (raw_product_id or raw_variant_id):
            from products.models import Product
            target_pid = raw_product_id or raw_variant_id
            product = None
            if str(target_pid).isdigit():
                product = Product.objects.filter(pk=int(target_pid)).first()
            if not product:
                product = Product.objects.filter(public_id=target_pid).first() or Product.objects.filter(slug=target_pid).first()

            if product:
                variant = product.variants.filter(is_active=True).first()
                if not variant:
                    variant = ProductVariant.objects.create(
                        product=product,
                        name="Default",
                        price=product.base_price,
                        is_active=True,
                    )

        if not variant:
            from products.models import Product
            product = Product.objects.filter(status=Product.Status.ACTIVE).first()
            if product:
                variant = product.variants.filter(is_active=True).first() or ProductVariant.objects.create(
                    product=product, name="Default", price=product.base_price, is_active=True
                )

        if not variant:
            return Response({"error": "No valid product or variant found."}, status=status.HTTP_400_BAD_REQUEST)

        quantity = ser.validated_data.get("quantity", 1)

        item, created = CartItem.objects.get_or_create(
            cart=cart,
            variant=variant,
            defaults={
                "quantity": quantity,
                "unit_price": variant.price,
            },
        )
        if not created:
            item.quantity += quantity
            item.unit_price = variant.price
            item.save()

        return Response(CartSerializer(cart).data, status=status.HTTP_200_OK)


class CartItemDeleteView(APIView):
    """Update quantity or remove a single item from the cart."""
    permission_classes = [IsAuthenticated]

    def patch(self, request, item_id):
        quantity = request.data.get("quantity")
        if quantity is None:
            return Response({"detail": "Quantity required."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            qty_int = int(quantity)
        except (ValueError, TypeError):
            return Response({"detail": "Invalid quantity."}, status=status.HTTP_400_BAD_REQUEST)

        if qty_int <= 0:
            CartItem.objects.filter(cart__user=request.user, id=item_id).delete()
            cart = Cart.objects.filter(user=request.user).first()
            return Response(CartSerializer(cart).data if cart else {}, status=status.HTTP_200_OK)

        item = CartItem.objects.filter(cart__user=request.user, id=item_id).first()
        if not item:
            return Response({"detail": "Cart item not found."}, status=status.HTTP_404_NOT_FOUND)

        item.quantity = qty_int
        item.save()

        cart = Cart.objects.filter(user=request.user).first()
        return Response(CartSerializer(cart).data, status=status.HTTP_200_OK)

    def put(self, request, item_id):
        return self.patch(request, item_id)

    def delete(self, request, item_id):
        CartItem.objects.filter(
            cart__user=request.user, id=item_id
        ).delete()
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
            is_funded = g.escrow_status in (
                OrderGroup.EscrowStatus.HELD,
                OrderGroup.EscrowStatus.RELEASED,
            )
            codes.append({
                "group_id": g.id,
                "shop_name": g.shop.name,
                "shop_slug": g.shop.slug,
                "delivery_code": g.delivery_code if is_funded else "",
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
            .filter(
                shop=shop,
                escrow_status__in=[
                    OrderGroup.EscrowStatus.HELD,
                    OrderGroup.EscrowStatus.RELEASED,
                    OrderGroup.EscrowStatus.DISPUTED,
                    OrderGroup.EscrowStatus.REFUNDED,
                ],
            )
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
    """Seller updates fulfillment status (e.g. processing, shipped)."""
    permission_classes = [IsAuthenticated]

    def patch(self, request, group_id):
        group = generics.get_object_or_404(
            OrderGroup.objects.select_related("shop", "order__user"),
            id=group_id,
            shop__owner=request.user,
        )

        # Do not allow fulfilling unpaid orders
        if group.order.status != Order.Status.CONFIRMED or group.escrow_status == OrderGroup.EscrowStatus.PENDING:
            return Response(
                {"detail": "Cannot update fulfillment status for an unpaid order."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        new_status = request.data.get("status")
        valid_statuses = [choice[0] for choice in OrderGroup.FulfilmentStatus.choices]
        if new_status not in valid_statuses:
            return Response(
                {"detail": f"Invalid status. Must be one of {valid_statuses}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Sellers must confirm delivery with the 6-digit delivery code to mark DELIVERED
        if new_status == OrderGroup.FulfilmentStatus.DELIVERED:
            return Response(
                {"detail": "To mark an order as delivered and release escrow funds, please confirm delivery using the buyer's 6-digit delivery code."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        group.status = new_status
        group.save(update_fields=["status", "updated_at"])

        # --- Email: Shipping Update to Buyer ---
        try:
            from notifications.tasks import send_shipping_update_email
            buyer = group.order.user
            if buyer and buyer.email:
                is_funded = group.escrow_status in (OrderGroup.EscrowStatus.HELD, OrderGroup.EscrowStatus.RELEASED)
                send_shipping_update_email.delay(buyer.email, {
                    "buyer_name": buyer.first_name or buyer.email.split("@")[0],
                    "order_id": str(group.order.public_id),
                    "status": new_status,
                    "shop_name": group.shop.name if group.shop else "Seller",
                    "delivery_code": group.delivery_code if is_funded else "",
                })
        except Exception:
            pass  # Never block the response on email failure

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
        qs = SellerBankAccount.objects.filter(shop__owner=self.request.user)
        shop_slug = self.request.query_params.get("shop")
        if shop_slug:
            qs = qs.filter(shop__slug=shop_slug)
        return qs

    def perform_create(self, serializer):
        from shops.models import Shop
        shop_slug = self.request.data.get("shop") or self.request.query_params.get("shop")
        if shop_slug:
            shop = generics.get_object_or_404(Shop, slug=shop_slug, owner=self.request.user)
        else:
            shop = Shop.objects.filter(owner=self.request.user).first()
            if not shop:
                raise serializers.ValidationError({"shop": "No shop found for seller."})
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
        qs = PayoutRequest.objects.filter(wallet__shop__owner=self.request.user).order_by("-created_at")
        shop_slug = self.request.query_params.get("shop")
        if shop_slug:
            qs = qs.filter(wallet__shop__slug=shop_slug)
        return qs


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
        amount = serializer.validated_data["amount"]
        if amount < Decimal("100.00"):
            raise serializers.ValidationError({"amount": "Minimum payout amount is ₦100.00."})

        bank_account = serializer.validated_data["bank_account"]
        shop = bank_account.shop

        if not shop or shop.owner != self.request.user:
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
            
            from .payouts import get_payout_service, MonnifyTransferService
            service = get_payout_service()
            try:
                if isinstance(service, MonnifyTransferService):
                    transfer_data = service.initiate_transfer(
                        amount=float(amount),
                        account_number=bank_account.account_number,
                        bank_code=bank_account.bank_code,
                        narration=f"Payout for {shop.name}"
                    )
                else:
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
                payout.status = PayoutRequest.Status.COMPLETED
                payout.save(update_fields=["provider_reference", "status"])
            except Exception as e:
                payout.status = PayoutRequest.Status.FAILED
                payout.failure_reason = str(e)
                payout.save(update_fields=["status", "failure_reason"])
                
                # Refund within same atomic block so both are rolled back on crash
                wallet.balance += amount
                wallet.total_withdrawn -= amount
                wallet.save(update_fields=["balance", "total_withdrawn", "updated_at"])
                raise serializers.ValidationError({"detail": f"Transfer failed to initiate: {e}"})

        # --- Email: Withdrawal Request / Completed ---
        try:
            from notifications.tasks import send_withdrawal_request_email, send_withdrawal_completed_email
            user = self.request.user
            email_ctx = {
                "user_name": user.first_name or user.email.split("@")[0],
                "shop_name": shop.name,
                "amount": str(amount),
                "bank_name": bank_account.bank_name or bank_account.bank_code,
                "account_number": bank_account.account_number[-4:] if bank_account.account_number else "",
                "reference": payout.provider_reference or str(payout.pk),
            }
            if payout.status == PayoutRequest.Status.COMPLETED:
                send_withdrawal_completed_email.delay(user.email, email_ctx)
            else:
                email_ctx["status"] = payout.get_status_display()
                send_withdrawal_request_email.delay(user.email, email_ctx)
        except Exception:
            pass  # Never block payout response on email failure


# ---------------------------------------------------------------------------
# Coupons
# ---------------------------------------------------------------------------

class CouponApplyView(APIView):
    """Apply a coupon to the cart/order. (H4: throttled to prevent enumeration)"""
    permission_classes = [AllowAny]
    throttle_scope = "coupon"

    def post(self, request):
        try:
            code = request.data.get("code")
            shop_slug = request.data.get("shop_slug") or request.data.get("shop")
            passed_subtotal = request.data.get("subtotal")

            if not code or not str(code).strip():
                return Response({"detail": "Coupon code required."}, status=status.HTTP_400_BAD_REQUEST)

            code_clean = str(code).strip()

            # Find coupon matching code, prioritizing shop-specific coupons then global
            coupons = Coupon.objects.filter(code__iexact=code_clean)
            if not coupons.exists():
                return Response({"detail": f"Invalid coupon code '{code_clean}'."}, status=status.HTTP_404_NOT_FOUND)

            if shop_slug:
                coupon = coupons.filter(shop__slug=shop_slug).first() or coupons.filter(shop__isnull=True).first() or coupons.first()
            else:
                coupon = coupons.first()

            if not coupon:
                return Response({"detail": f"Invalid coupon code '{code_clean}'."}, status=status.HTTP_404_NOT_FOUND)

            if not coupon.is_valid:
                return Response({"detail": "Coupon is expired or inactive."}, status=status.HTTP_400_BAD_REQUEST)

            if shop_slug and coupon.shop and coupon.shop.slug != shop_slug:
                return Response({"detail": f"Coupon is only valid for {coupon.shop.name}."}, status=status.HTTP_400_BAD_REQUEST)

            total = Decimal("0.00")
            if passed_subtotal is not None:
                try:
                    total = Decimal(str(passed_subtotal))
                except Exception:
                    total = Decimal("0.00")
            elif request.user and request.user.is_authenticated:
                try:
                    cart = Cart.objects.filter(user=request.user).first()
                    if cart and hasattr(cart, "total"):
                        total = cart.total or Decimal("0.00")
                except Exception:
                    total = Decimal("0.00")

            min_val = coupon.minimum_order_value or Decimal("0.00")
            if min_val > 0 and total > 0 and total < min_val:
                return Response({"detail": f"Minimum order value of ₦{min_val:,.2f} required."}, status=status.HTTP_400_BAD_REQUEST)

            coupon_val = coupon.value or Decimal("0.00")
            if coupon.discount_type == Coupon.DiscountType.PERCENTAGE:
                discount_amount = (total * coupon_val) / Decimal("100.0") if total > 0 else Decimal("0.00")
            else:
                discount_amount = coupon_val
                
            discount_amount = min(discount_amount, total) if total > 0 else discount_amount

            return Response({
                "code": coupon.code,
                "discount_amount": str(discount_amount),
                "discount_type": coupon.discount_type,
                "value": str(coupon_val),
                "coupon_details": {
                    "id": coupon.id,
                    "code": coupon.code,
                    "discount_type": coupon.discount_type,
                    "value": str(coupon_val),
                    "is_active": coupon.is_active,
                    "minimum_order_value": str(min_val),
                }
            })
        except Exception as exc:
            import logging
            logging.getLogger(__name__).exception("CouponApplyView error: %s", exc)
            return Response({"detail": f"Failed to apply coupon: {str(exc)}"}, status=status.HTTP_400_BAD_REQUEST)


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


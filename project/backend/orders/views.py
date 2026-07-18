"""Orders views."""
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Cart, CartItem, Order, OrderGroup, SellerWallet
from .serializers import CartItemCreateSerializer, CartSerializer, OrderSerializer
from products.models import ProductVariant


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
    """Seller enters the delivery code to release escrow."""
    permission_classes = [IsAuthenticated]

    def post(self, request, group_id):
        from .escrow import confirm_delivery_code, EscrowError

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
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

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

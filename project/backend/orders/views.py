"""Orders views."""
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Cart, CartItem, Order
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

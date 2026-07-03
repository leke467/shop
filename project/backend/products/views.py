from rest_framework import generics
from rest_framework.permissions import AllowAny
from .models import Product
from .serializers import ProductSerializer

class ProductListView(generics.ListCreateAPIView):
    serializer_class = ProductSerializer
    permission_classes = [AllowAny] # In production this would check if user is shop owner to create

    def get_queryset(self):
        queryset = Product.objects.all()
        shop_id = self.request.query_params.get('shop', None)
        if shop_id is not None:
            queryset = queryset.filter(shop_id=shop_id)
        return queryset

class ProductDetailView(generics.RetrieveAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]

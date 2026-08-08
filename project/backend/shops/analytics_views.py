from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from django.shortcuts import get_object_or_404

from shops.models import Shop
from .analytics import (
    revenue_timeseries,
    top_products,
    customer_stats,
    order_stats,
)


class BaseShopAnalyticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get_shop(self, slug):
        shop = get_object_or_404(Shop, slug=slug)
        if shop.owner != self.request.user:
            raise PermissionDenied("You do not have permission to view analytics for this shop.")
        return shop


class ShopAnalyticsRevenueView(BaseShopAnalyticsView):
    def get(self, request, slug):
        shop = self.get_shop(slug)
        period = request.query_params.get('period', 'daily')
        days = int(request.query_params.get('days', 30))
        
        data = revenue_timeseries(shop, period=period, days=days)
        return Response(data)


class ShopAnalyticsProductsView(BaseShopAnalyticsView):
    def get(self, request, slug):
        shop = self.get_shop(slug)
        limit = int(request.query_params.get('limit', 10))
        
        data = top_products(shop, limit=limit)
        return Response(data)


class ShopAnalyticsCustomersView(BaseShopAnalyticsView):
    def get(self, request, slug):
        shop = self.get_shop(slug)
        data = customer_stats(shop)
        return Response(data)


class ShopAnalyticsOverviewView(BaseShopAnalyticsView):
    def get(self, request, slug):
        shop = self.get_shop(slug)
        data = order_stats(shop)
        return Response(data)

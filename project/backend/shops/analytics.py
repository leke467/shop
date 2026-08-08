from datetime import timedelta
from decimal import Decimal

from django.db import models
from django.db.models import Sum, Count, F
from django.db.models.functions import TruncDay, TruncMonth
from django.utils import timezone

from orders.models import OrderGroup, OrderItem


def revenue_timeseries(shop, period='daily', days=30):
    now = timezone.now()
    start_date = now - timedelta(days=int(days))
    
    trunc_func = TruncDay if period == 'daily' else TruncMonth
    
    qs = OrderGroup.objects.filter(
        shop=shop,
        created_at__gte=start_date
    ).annotate(
        date=trunc_func('created_at')
    ).values('date').annotate(
        revenue=Sum('subtotal'),
        orders=Count('id')
    ).order_by('date')
    
    return list(qs)


def top_products(shop, limit=10):
    qs = OrderItem.objects.filter(
        group__shop=shop
    ).values('product_name').annotate(
        purchase_count=Sum('quantity'),
        revenue=Sum(
            F('quantity') * F('unit_price'),
            output_field=models.DecimalField()
        )
    ).order_by('-purchase_count')[:int(limit)]
    
    return list(qs)


def customer_stats(shop):
    customers = OrderGroup.objects.filter(shop=shop).values('order__user').annotate(
        order_count=Count('id')
    )
    
    total_customers = len(customers)
    returning_customers = sum(1 for c in customers if c['order_count'] > 1)
    new_customers = total_customers - returning_customers
    
    states = OrderGroup.objects.filter(shop=shop).values(
        state=F('order__shipping_state')
    ).annotate(
        count=Count('order__user', distinct=True)
    ).order_by('-count')
    
    return {
        'total_customers': total_customers,
        'new_customers': new_customers,
        'returning_customers': returning_customers,
        'by_state': list(states)
    }


def order_stats(shop):
    stats = OrderGroup.objects.filter(shop=shop).aggregate(
        total_orders=Count('id'),
        total_revenue=Sum('subtotal')
    )
    
    total_orders = stats['total_orders'] or 0
    total_revenue = stats['total_revenue'] or Decimal('0.00')
    
    average_value = total_revenue / total_orders if total_orders > 0 else Decimal('0.00')
    
    by_status = OrderGroup.objects.filter(shop=shop).values('status').annotate(
        count=Count('id')
    ).order_by('-count')
    
    return {
        'total_orders': total_orders,
        'average_value': average_value,
        'by_status': list(by_status)
    }

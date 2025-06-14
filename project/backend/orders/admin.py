from django.contrib import admin
from .models import Order, OrderItem, CustomOrder

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'status', 'total_amount', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('user__username', 'shipping_address')
    inlines = [OrderItemInline]
    date_hierarchy = 'created_at'

@admin.register(CustomOrder)
class CustomOrderAdmin(admin.ModelAdmin):
    list_display = ('shop', 'user', 'status', 'budget', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('shop__name', 'user__username', 'description')
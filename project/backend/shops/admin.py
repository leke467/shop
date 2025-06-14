from django.contrib import admin
from .models import Shop, ShopCategory, ShopReview

@admin.register(Shop)
class ShopAdmin(admin.ModelAdmin):
    list_display = ('name', 'owner', 'email', 'created_at')
    list_filter = ('enable_product_listings', 'enable_custom_orders', 'enable_reviews')
    search_fields = ('name', 'owner__username', 'email')
    date_hierarchy = 'created_at'

@admin.register(ShopCategory)
class ShopCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'shop')
    list_filter = ('shop',)
    search_fields = ('name', 'shop__name')

@admin.register(ShopReview)
class ShopReviewAdmin(admin.ModelAdmin):
    list_display = ('shop', 'user', 'rating', 'created_at')
    list_filter = ('rating', 'created_at')
    search_fields = ('shop__name', 'user__username')
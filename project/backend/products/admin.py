from django.contrib import admin
from .models import Product, ProductImage, ProductReview

class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'shop', 'price', 'inventory', 'created_at')
    list_filter = ('shop', 'created_at')
    search_fields = ('name', 'shop__name', 'description')
    inlines = [ProductImageInline]
    date_hierarchy = 'created_at'

@admin.register(ProductReview)
class ProductReviewAdmin(admin.ModelAdmin):
    list_display = ('product', 'user', 'rating', 'created_at')
    list_filter = ('rating', 'created_at')
    search_fields = ('product__name', 'user__username')
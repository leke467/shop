from django.db import models
from django.contrib.auth.models import User
 
class Shop(models.Model):
    owner = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    description = models.TextField(null=True, blank=True)
    logo = models.ImageField(upload_to='shops/logos/', null=True, blank=True)
    banner = models.ImageField(upload_to='shops/banners/', null=True, blank=True)
    email = models.EmailField(null=True, blank=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)

    # Shop features
    enable_product_listings = models.BooleanField(default=True)
    enable_custom_orders = models.BooleanField(default=False)
    enable_reviews = models.BooleanField(default=True)
    enable_contact = models.BooleanField(default=True)
    enable_shipping = models.BooleanField(default=False)
    enable_social_links = models.BooleanField(default=False)
    
    # Shop branding
    primary_color = models.CharField(max_length=7, default='#3B82F6')
    secondary_color = models.CharField(max_length=7, default='#10B981')
    
    # Social links
    facebook_url = models.URLField(blank=True, null=True)
    instagram_url = models.URLField(blank=True, null=True)
    twitter_url = models.URLField(blank=True, null=True)

    def __str__(self):
        return self.name

class ShopCategory(models.Model):
    shop = models.ForeignKey(Shop, on_delete=models.CASCADE, related_name='categories')
    name = models.CharField(max_length=50)
    
    def __str__(self):
        return f"{self.shop.name} - {self.name}"

class ShopReview(models.Model):
    shop = models.ForeignKey(Shop, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    rating = models.IntegerField()
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('shop', 'user')
    
    def __str__(self):
        return f"{self.user.username}'s review of {self.shop.name}"
    


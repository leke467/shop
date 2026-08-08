from django.db import models
from django.conf import settings
from core.models import BaseModel, TimeStampedModel

class BlogPost(BaseModel):
    STATUS_CHOICES = (
        ('draft', 'Draft'),
        ('published', 'Published'),
    )
    # shop = models.ForeignKey('shops.Shop', on_delete=models.CASCADE, null=True, blank=True, related_name='blog_posts')
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='blog_posts')
    title = models.CharField(max_length=255)
    slug = models.SlugField(unique=True, max_length=255)
    content = models.TextField()
    excerpt = models.TextField(blank=True)
    featured_image = models.ImageField(upload_to='blog_images/', null=True, blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='draft')
    tags = models.JSONField(default=list, blank=True)
    view_count = models.PositiveIntegerField(default=0)
    published_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.title

class BlogComment(TimeStampedModel):
    post = models.ForeignKey(BlogPost, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='blog_comments')
    content = models.TextField()
    is_approved = models.BooleanField(default=True)

    def __str__(self):
        return f"Comment by {self.user} on {self.post}"

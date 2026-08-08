from django.contrib import admin
from .models import BlogPost, BlogComment

@admin.register(BlogPost)
class BlogPostAdmin(admin.ModelAdmin):
    list_display = ('title', 'status', 'published_at')
    prepopulated_fields = {'slug': ('title',)}

@admin.register(BlogComment)
class BlogCommentAdmin(admin.ModelAdmin):
    list_display = ('post', 'user', 'is_approved', 'created_at')

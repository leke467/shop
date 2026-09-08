from rest_framework import serializers
from .models import BlogPost, BlogComment

class BlogCommentSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()

    class Meta:
        model = BlogComment
        fields = ['id', 'post', 'user', 'user_name', 'content', 'is_approved', 'created_at']
        read_only_fields = ['user', 'is_approved', 'created_at']

    def get_user_name(self, obj):
        if not obj.user:
            return "Anonymous"
        return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.username or "Customer"

class BlogPostListSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()

    class Meta:
        model = BlogPost
        fields = ['id', 'title', 'slug', 'excerpt', 'featured_image', 'status', 'tags', 'published_at', 'author', 'author_name', 'view_count', 'created_at']

    def get_author_name(self, obj):
        if not obj.author:
            return "Multishop Editorial"
        return f"{obj.author.first_name} {obj.author.last_name}".strip() or obj.author.username or "Author"

class BlogPostDetailSerializer(serializers.ModelSerializer):
    comments = BlogCommentSerializer(many=True, read_only=True)
    author_name = serializers.SerializerMethodField()
    
    class Meta:
        model = BlogPost
        fields = '__all__'
        read_only_fields = ['author', 'published_at', 'view_count']

    def get_author_name(self, obj):
        if not obj.author:
            return "Multishop Editorial"
        return f"{obj.author.first_name} {obj.author.last_name}".strip() or obj.author.username or "Author"

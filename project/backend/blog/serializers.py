from rest_framework import serializers
from .models import BlogPost, BlogComment

class BlogCommentSerializer(serializers.ModelSerializer):
    class Meta:
        model = BlogComment
        fields = '__all__'

class BlogPostListSerializer(serializers.ModelSerializer):
    class Meta:
        model = BlogPost
        fields = ['id', 'title', 'slug', 'excerpt', 'featured_image', 'status', 'published_at', 'author', 'view_count']

class BlogPostDetailSerializer(serializers.ModelSerializer):
    comments = BlogCommentSerializer(many=True, read_only=True)
    
    class Meta:
        model = BlogPost
        fields = '__all__'

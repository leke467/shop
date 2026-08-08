from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied
from .models import BlogPost, BlogComment
from .serializers import BlogPostListSerializer, BlogPostDetailSerializer, BlogCommentSerializer

class BlogPostListView(generics.ListAPIView):
    queryset = BlogPost.objects.filter(status='published')
    serializer_class = BlogPostListSerializer

class BlogPostDetailView(generics.RetrieveAPIView):
    queryset = BlogPost.objects.filter(status='published')
    serializer_class = BlogPostDetailSerializer
    lookup_field = 'slug'

class BlogPostCreateUpdateView(generics.CreateAPIView, generics.UpdateAPIView):
    """
    Create/update blog posts.

    Security (H3): Verifies the authenticated user owns the shop
    the blog post is being published under.
    """
    serializer_class = BlogPostDetailSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'slug'

    def get_queryset(self):
        # Sellers can only manage their own blog posts
        return BlogPost.objects.filter(author=self.request.user)

    def perform_create(self, serializer):
        # Verify shop ownership if a shop is specified
        shop = serializer.validated_data.get('shop')
        if shop and shop.owner != self.request.user:
            raise PermissionDenied("You can only create blog posts for your own shop.")
        serializer.save(author=self.request.user)

    def perform_update(self, serializer):
        if serializer.instance.author != self.request.user:
            raise PermissionDenied("You can only edit your own blog posts.")
        shop = serializer.validated_data.get('shop')
        if shop and shop.owner != self.request.user:
            raise PermissionDenied("You can only create blog posts for your own shop.")
        serializer.save()

class BlogCommentListCreateView(generics.ListCreateAPIView):
    serializer_class = BlogCommentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        return BlogComment.objects.filter(post_id=self.kwargs['post_id'], is_approved=True)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user, post_id=self.kwargs['post_id'])

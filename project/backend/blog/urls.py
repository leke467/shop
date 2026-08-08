from django.urls import path
from . import views

urlpatterns = [
    path('', views.BlogPostListView.as_view(), name='blog-list'),
    path('manage/', views.BlogPostCreateUpdateView.as_view(), name='blog-create'),
    path('<slug:slug>/', views.BlogPostDetailView.as_view(), name='blog-detail'),
    path('manage/<slug:slug>/', views.BlogPostCreateUpdateView.as_view(), name='blog-update'),
    path('<int:post_id>/comments/', views.BlogCommentListCreateView.as_view(), name='blog-comments'),
]

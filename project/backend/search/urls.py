from django.urls import path

from .views import CategoryTreeView, UnifiedSearchView

urlpatterns = [
    path("", UnifiedSearchView.as_view(), name="unified-search"),
    path("categories/", CategoryTreeView.as_view(), name="category-tree"),
]

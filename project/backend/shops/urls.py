from django.urls import path
from .views import  CreateShopView, UpdateShopView, DeleteShopView

urlpatterns = [
    path('create/', CreateShopView.as_view(), name='create_shop'),
    path('update/<int:pk>/', UpdateShopView.as_view(), name='update_shop'),
    path('delete/<int:pk>/', DeleteShopView.as_view(), name='delete_shop'),
]

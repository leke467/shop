from django.urls import path
from .views import  CreateShopView, UpdateShopView, DeleteShopView, ShopListView, ShopDetailView, MyShopView

urlpatterns = [
    path('', ShopListView.as_view(), name='shop_list'),
    path('mine/', MyShopView.as_view(), name='my_shop'),
    path('<int:pk>/', ShopDetailView.as_view(), name='shop_detail'),
    path('create/', CreateShopView.as_view(), name='create_shop'),
    path('update/<int:pk>/', UpdateShopView.as_view(), name='update_shop'),
    path('delete/<int:pk>/', DeleteShopView.as_view(), name='delete_shop'),
]

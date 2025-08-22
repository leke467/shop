from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from shops.views import CreateUserView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/users/register', CreateUserView.as_view(), name='register'),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/', include('rest_framework.urls')),  # For login/logout  
    path('api/shops/', include('shops.urls')),
    path('api/products/', include('products.urls')),
    path('api/orders/', include('orders.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
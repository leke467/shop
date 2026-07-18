"""
Root URL configuration.

API endpoints are versioned under ``/api/`` and grouped by domain.
The OpenAPI schema is available at ``/api/schema/`` and the Swagger UI
at ``/api/docs/`` (dev only).
"""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    # Admin
    path("admin/", admin.site.urls),

    # Auth / JWT
    path("api/token/", TokenObtainPairView.as_view(), name="token-obtain-pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),

    # Domain APIs
    path("api/users/", include("accounts.urls")),
    path("api/shops/", include("shops.urls")),
    path("api/products/", include("products.urls")),
    path("api/orders/", include("orders.urls")),
    path("api/payments/", include("payments.urls")),
    path("api/subscription/", include("subscriptions.urls")),
    path("api/search/", include("search.urls")),

    path("api/personalization/", include("personalization.urls")),
]

# Serve media files in development.
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

    # Optional: browsable API schema / docs.
    try:
        from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

        urlpatterns += [
            path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
            path(
                "api/docs/",
                SpectacularSwaggerView.as_view(url_name="schema"),
                name="swagger-ui",
            ),
        ]
    except ImportError:
        pass
from django.urls import path
from .views import active_theme, platform_fee_settings

urlpatterns = [
    path("theme/", active_theme, name="active-theme"),
    path("platform/fee-settings/", platform_fee_settings, name="platform-fee-settings"),
]

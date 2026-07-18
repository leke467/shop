from django.urls import path
from .views import active_theme

urlpatterns = [
    path("theme/", active_theme, name="active-theme"),
]

from django.urls import path
from . import views

urlpatterns = [
    path('preferences/', views.NotificationPreferenceView.as_view(), name='notification-preferences'),
]

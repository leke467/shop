from django.urls import path

from .cookie_views import CookieLoginView, CookieLogoutView, CookieTokenRefreshView
from .views import (
    AddressDetailView,
    AddressListCreateView,
    AdminChangePasswordView,
    ForgotPasswordView,
    ProfileView,
    RegisterView,
    ResetPasswordView,
)

urlpatterns = [
    # Cookie-based JWT auth (HttpOnly, XSS-safe)
    path("login/", CookieLoginView.as_view(), name="login"),
    path("token/refresh/", CookieTokenRefreshView.as_view(), name="token-refresh"),
    path("logout/", CookieLogoutView.as_view(), name="logout"),
    # Registration & profile
    path("register/", RegisterView.as_view(), name="register"),
    path("profile/", ProfileView.as_view(), name="profile"),
    path("forgot-password/", ForgotPasswordView.as_view(), name="forgot-password"),
    path("reset-password/", ResetPasswordView.as_view(), name="reset-password"),
    path("<int:pk>/change-password/", AdminChangePasswordView.as_view(), name="admin-change-password"),
    path("addresses/", AddressListCreateView.as_view(), name="address-list"),
    path("addresses/<int:pk>/", AddressDetailView.as_view(), name="address-detail"),
]

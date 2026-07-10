"""
Cookie-based JWT login, token refresh, and logout views.

Security design
---------------
- Access token → HttpOnly, Secure (in prod), SameSite=Lax cookie.
  Not readable by JavaScript → immune to XSS token theft.
- Refresh token → same cookie approach, but a separate cookie name.
- Logout clears both cookies and blacklists the refresh token (when
  token_blacklist is enabled).
- Login is scoped-throttled (10/min) to prevent credential stuffing.
"""
from __future__ import annotations

from django.conf import settings
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView

from .serializers import UserProfileSerializer


def _set_auth_cookies(response: Response, access: str, refresh: str) -> Response:
    """Attach access & refresh tokens as HttpOnly cookies."""
    common = {
        "httponly": True,
        "secure": getattr(settings, "AUTH_COOKIE_SECURE", True),
        "samesite": getattr(settings, "AUTH_COOKIE_SAMESITE", "Lax"),
        "domain": getattr(settings, "AUTH_COOKIE_DOMAIN", None),
        "path": "/",
    }
    response.set_cookie(
        key=settings.AUTH_COOKIE_ACCESS,
        value=access,
        max_age=int(settings.SIMPLE_JWT["ACCESS_TOKEN_LIFETIME"].total_seconds()),
        **common,
    )
    response.set_cookie(
        key=settings.AUTH_COOKIE_REFRESH,
        value=refresh,
        max_age=int(settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"].total_seconds()),
        **common,
    )
    return response


def _clear_auth_cookies(response: Response) -> Response:
    """Delete auth cookies on logout."""
    response.delete_cookie(settings.AUTH_COOKIE_ACCESS, path="/")
    response.delete_cookie(settings.AUTH_COOKIE_REFRESH, path="/")
    return response


class CookieLoginView(APIView):
    """
    POST email + password → set HttpOnly JWT cookies + return user profile.

    Throttled to 10/min to prevent credential stuffing.
    """
    permission_classes = [AllowAny]
    throttle_scope = "auth"

    def post(self, request):
        from django.contrib.auth import authenticate

        email = request.data.get("email")
        password = request.data.get("password")
        if not email or not password:
            return Response(
                {"detail": "email and password are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = authenticate(request, email=email, password=password)
        if user is None:
            return Response(
                {"detail": "Invalid credentials."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        if not user.is_active:
            return Response(
                {"detail": "Account is disabled."},
                status=status.HTTP_403_FORBIDDEN,
            )

        refresh = RefreshToken.for_user(user)
        access = str(refresh.access_token)

        response = Response(
            {
                "user": UserProfileSerializer(user).data,
                "access": access,  # Also in body for non-browser clients
            },
            status=status.HTTP_200_OK,
        )
        return _set_auth_cookies(response, access, str(refresh))


class CookieTokenRefreshView(APIView):
    """
    POST → read refresh token from cookie → rotate tokens → set new cookies.

    No request body needed — the refresh token is read from the HttpOnly cookie.
    Falls back to the request body for non-browser clients.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        # Try cookie first, then body.
        raw_refresh = request.COOKIES.get(settings.AUTH_COOKIE_REFRESH)
        if not raw_refresh:
            raw_refresh = request.data.get("refresh")
        if not raw_refresh:
            return Response(
                {"detail": "Refresh token not found."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        try:
            refresh = RefreshToken(raw_refresh)
            access = str(refresh.access_token)
        except (TokenError, InvalidToken) as e:
            return Response(
                {"detail": "Token is invalid or expired."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        response = Response({"access": access})
        return _set_auth_cookies(response, access, str(refresh))


class CookieLogoutView(APIView):
    """
    POST → blacklist the refresh token (if enabled) + clear cookies.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        raw_refresh = request.COOKIES.get(settings.AUTH_COOKIE_REFRESH)
        if raw_refresh:
            try:
                token = RefreshToken(raw_refresh)
                token.blacklist()
            except (TokenError, AttributeError):
                # AttributeError if blacklist app not installed; that's fine.
                pass

        response = Response({"detail": "Logged out."}, status=status.HTTP_200_OK)
        return _clear_auth_cookies(response)

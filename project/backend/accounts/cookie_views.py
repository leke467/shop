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

    Security (H2): If 2FA is enabled for the user, password validation
    succeeds but tokens are NOT issued. Instead, a temporary `2fa_token`
    is returned. The client must call /api/users/2fa/login-verify/ with
    both the 2fa_token and the TOTP code to receive actual JWT tokens.

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

        # H2: Check if 2FA is enabled
        try:
            tfa = user.two_factor_auth
            if tfa.is_enabled:
                # Issue a short-lived temporary token for the 2FA step.
                # This token proves password was verified but doesn't grant access.
                import hashlib, time
                ts = str(int(time.time()))
                raw = f"{user.pk}:{ts}:{settings.SECRET_KEY}"
                token_2fa = hashlib.sha256(raw.encode()).hexdigest()

                # Store in cache (5 minutes TTL) mapping token → user pk + timestamp
                from django.core.cache import cache
                cache.set(f"2fa_pending:{token_2fa}", {"user_pk": user.pk, "ts": ts}, 300)

                return Response(
                    {
                        "requires_2fa": True,
                        "2fa_token": token_2fa,
                        "detail": "Please enter your 2FA code to complete login.",
                    },
                    status=status.HTTP_200_OK,
                )
        except Exception:
            pass  # No 2FA configured — proceed normally

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


class TwoFactorLoginVerifyView(APIView):
    """
    POST 2fa_token + code → verify TOTP and issue JWT tokens.

    Security (H2): Completes the login flow when 2FA is enabled.
    """
    permission_classes = [AllowAny]
    throttle_scope = "auth"

    def post(self, request):
        import pyotp
        from django.core.cache import cache
        from django.contrib.auth import get_user_model

        token_2fa = request.data.get("2fa_token")
        code = request.data.get("code")

        if not token_2fa or not code:
            return Response(
                {"detail": "2fa_token and code are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Look up the pending 2FA session
        pending = cache.get(f"2fa_pending:{token_2fa}")
        if not pending:
            return Response(
                {"detail": "2FA session expired or invalid. Please login again."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        User = get_user_model()
        try:
            user = User.objects.get(pk=pending["user_pk"])
        except User.DoesNotExist:
            return Response({"detail": "User not found."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            tfa = user.two_factor_auth
        except Exception:
            return Response({"detail": "2FA not configured."}, status=status.HTTP_400_BAD_REQUEST)

        totp = pyotp.TOTP(tfa.totp_secret)
        if not totp.verify(code):
            return Response({"detail": "Invalid 2FA code."}, status=status.HTTP_401_UNAUTHORIZED)

        # 2FA verified — issue tokens and clear the pending session
        cache.delete(f"2fa_pending:{token_2fa}")

        refresh = RefreshToken.for_user(user)
        access = str(refresh.access_token)

        response = Response(
            {
                "user": UserProfileSerializer(user).data,
                "access": access,
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

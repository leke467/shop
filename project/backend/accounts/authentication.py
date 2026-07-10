"""
Cookie-aware JWT authentication.

The access token is delivered to the browser in an HttpOnly cookie so it is not
reachable from JavaScript (mitigating XSS token theft). This class reads the
token from that cookie, while still honouring a standard ``Authorization:
Bearer`` header for non-browser clients (mobile apps, server-to-server, tests).
"""
from __future__ import annotations

from django.conf import settings
from rest_framework_simplejwt.authentication import JWTAuthentication


class CookieJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        # 1) Standard Authorization header takes precedence (API clients).
        header = self.get_header(request)
        if header is not None:
            raw_token = self.get_raw_token(header)
            if raw_token is not None:
                validated = self.get_validated_token(raw_token)
                return self.get_user(validated), validated

        # 2) Fall back to the HttpOnly access cookie (browser clients).
        raw_token = request.COOKIES.get(settings.AUTH_COOKIE_ACCESS)
        if not raw_token:
            return None
        validated = self.get_validated_token(raw_token)
        return self.get_user(validated), validated

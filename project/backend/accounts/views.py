"""
Account views — registration, profile, password reset, addresses.

Auth (login/refresh/logout) uses httpOnly cookies (P2 items 22-23).
For now we expose SimpleJWT's standard token endpoints.
"""
from django.contrib.auth import get_user_model
from django.conf import settings
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

import pyotp

from .models import Address, TwoFactorAuth
from .serializers import (
    AddressSerializer,
    RegisterSerializer,
    UserProfileSerializer,
)

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """Public registration endpoint."""
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]
    throttle_scope = "auth"

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # --- Email: Welcome ---
        try:
            from notifications.tasks import send_welcome_email
            send_welcome_email.delay(user.email, {
                "user_name": user.first_name or user.email.split("@")[0],
            })
        except Exception:
            pass  # Never block registration on email failure

        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(user)
        from .cookie_views import _set_auth_cookies
        response = Response(
            {
                "user": UserProfileSerializer(user).data,
            },
            status=status.HTTP_201_CREATED,
        )
        return _set_auth_cookies(response, str(refresh.access_token), str(refresh))


class ProfileView(generics.RetrieveUpdateAPIView):
    """Get/update the authenticated user's profile."""
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = "auth"

    def post(self, request):
        email = request.data.get("email")
        if not email:
            return Response(
                {"email": "This field is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Avoid email enumeration — always return success.
            return Response({"detail": "If that email is registered, a reset link will be sent."})

        token = PasswordResetTokenGenerator().make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))

        # --- Email: Password Reset ---
        try:
            from notifications.tasks import send_password_reset_email
            site_url = getattr(settings, "SITE_URL", "https://multishopng.com")
            reset_url = f"{site_url}/reset-password?uid={uid}&token={token}"
            send_password_reset_email.delay(user.email, {
                "user_name": user.first_name or user.email.split("@")[0],
                "reset_url": reset_url,
                "reset_token": token,
            })
        except Exception:
            pass  # Never block the response on email failure

        return Response({"detail": "If that email is registered, a reset link will be sent."})


class ResetPasswordView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = "auth"

    def post(self, request):
        uid = request.data.get("uid")
        token = request.data.get("token")
        new_password = request.data.get("new_password")
        if not all([uid, token, new_password]):
            return Response(
                {"detail": "uid, token and new_password are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            user = User.objects.get(pk=force_str(urlsafe_base64_decode(uid)))
        except Exception:
            return Response({"detail": "Invalid uid."}, status=status.HTTP_400_BAD_REQUEST)

        if not PasswordResetTokenGenerator().check_token(user, token):
            return Response({"detail": "Invalid or expired token."}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()
        return Response({"detail": "Password has been reset."})


class AdminChangePasswordView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        new_password = request.data.get("new_password")
        if not new_password:
            return Response(
                {"new_password": "This field is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user.set_password(new_password)
        user.save()
        return Response({"detail": "Password updated."})


# ---------------------------------------------------------------------------
# Addresses
# ---------------------------------------------------------------------------

class AddressListCreateView(generics.ListCreateAPIView):
    serializer_class = AddressSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Address.objects.filter(user=self.request.user)


class AddressDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = AddressSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Address.objects.filter(user=self.request.user)


# ---------------------------------------------------------------------------
# 2FA
# ---------------------------------------------------------------------------

class TwoFactorSetupView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        tfa, _ = TwoFactorAuth.objects.get_or_create(user=user)
        
        if not tfa.totp_secret:
            tfa.totp_secret = pyotp.random_base32()
            tfa.save()

        totp = pyotp.TOTP(tfa.totp_secret)
        uri = totp.provisioning_uri(name=user.email, issuer_name="Shop")
        
        return Response({"secret": tfa.totp_secret, "qr_code_uri": uri})


class TwoFactorVerifyView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        code = request.data.get("code")
        
        if not code:
            return Response({"detail": "Code is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            tfa = user.two_factor_auth
        except TwoFactorAuth.DoesNotExist:
            return Response({"detail": "2FA setup not initiated."}, status=status.HTTP_400_BAD_REQUEST)

        if tfa.is_enabled:
            return Response({"detail": "2FA is already enabled."}, status=status.HTTP_400_BAD_REQUEST)

        totp = pyotp.TOTP(tfa.totp_secret)
        if totp.verify(code):
            tfa.is_enabled = True
            tfa.save()
            return Response({"detail": "2FA enabled successfully."})
        
        return Response({"detail": "Invalid code."}, status=status.HTTP_400_BAD_REQUEST)


class TwoFactorDisableView(APIView):
    """
    Disable 2FA for the authenticated user.

    Security (C4): Requires either the current TOTP code OR the user's
    password to prevent a hijacked session from silently disabling 2FA.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        code = request.data.get("code")
        password = request.data.get("password")

        if not code and not password:
            return Response(
                {"detail": "You must provide your current 2FA code or password to disable 2FA."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            tfa = user.two_factor_auth
        except TwoFactorAuth.DoesNotExist:
            return Response({"detail": "2FA is not enabled."}, status=status.HTTP_400_BAD_REQUEST)

        if not tfa.is_enabled:
            return Response({"detail": "2FA is not enabled."}, status=status.HTTP_400_BAD_REQUEST)

        # Verify identity: TOTP code OR password
        verified = False
        if code:
            totp = pyotp.TOTP(tfa.totp_secret)
            verified = totp.verify(code)
        if not verified and password:
            verified = user.check_password(password)
        
        if not verified:
            return Response(
                {"detail": "Invalid code or password."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        tfa.is_enabled = False
        tfa.totp_secret = ""
        tfa.save()
        return Response({"detail": "2FA disabled successfully."})

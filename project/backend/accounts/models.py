"""
User & profile models.

We use a custom user with **email as the login identifier** (usernames are
optional display handles). Every account can browse and buy; becoming a seller
is a role flag that unlocks shop management. This keeps a single identity per
person while supporting the "customer today, shop owner tomorrow" journey.
"""
from __future__ import annotations

import uuid

from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.utils.translation import gettext_lazy as _

from core.models import TimeStampedModel


class UserManager(BaseUserManager):
    """Manager for the email-based custom user."""

    use_in_migrations = True

    def _create_user(self, email, password, **extra_fields):
        if not email:
            raise ValueError("An email address is required.")
        email = self.normalize_email(email).lower()
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)
        extra_fields.setdefault("role", User.Roles.ADMIN)
        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")
        return self._create_user(email, password, **extra_fields)


class User(AbstractUser):
    class Roles(models.TextChoices):
        BUYER = "buyer", _("Buyer")
        SELLER = "seller", _("Seller")
        ADMIN = "admin", _("Admin")

    # Public, non-enumerable identifier used in APIs.
    public_id = models.UUIDField(
        default=uuid.uuid4, editable=False, unique=True, db_index=True
    )

    # Email is the credential; username becomes an optional display handle.
    username = models.CharField(max_length=150, blank=True, null=True)
    email = models.EmailField(_("email address"), unique=True, db_index=True)

    role = models.CharField(
        max_length=16, choices=Roles.choices, default=Roles.BUYER, db_index=True
    )
    phone = models.CharField(max_length=32, blank=True)
    avatar = models.ImageField(upload_to="avatars/", blank=True, null=True)

    # Consent / marketing preferences.
    accepts_marketing = models.BooleanField(default=False)

    is_email_verified = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS: list[str] = []  # email + password only for createsuperuser

    objects = UserManager()

    class Meta:
        indexes = [
            models.Index(fields=["role", "is_active"]),
        ]

    def __str__(self) -> str:
        return self.email

    @property
    def is_seller(self) -> bool:
        return self.role in (self.Roles.SELLER, self.Roles.ADMIN)

    @property
    def is_buyer(self) -> bool:
        return self.role == self.Roles.BUYER

    def promote_to_seller(self):
        if self.role == self.Roles.BUYER:
            self.role = self.Roles.SELLER
            self.save(update_fields=["role", "updated_at"])


class BuyerProfile(TimeStampedModel):
    """Personalisation-facing profile attached to every user.

    Aggregated affinity signals live here so the recommendation layer can read
    a compact per-user vector without scanning the raw event log every time.
    """

    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="buyer_profile"
    )
    display_name = models.CharField(max_length=120, blank=True)
    # Denormalised affinity scores: {"category_slug": weight, ...}
    category_affinities = models.JSONField(default=dict, blank=True)
    # Recently viewed product public_ids (bounded list, most-recent-first).
    recently_viewed = models.JSONField(default=list, blank=True)
    preferred_currency = models.CharField(max_length=3, default="USD")

    def __str__(self) -> str:
        return f"Profile<{self.user.email}>"


class Address(TimeStampedModel):
    class Kinds(models.TextChoices):
        SHIPPING = "shipping", _("Shipping")
        BILLING = "billing", _("Billing")

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="addresses"
    )
    kind = models.CharField(
        max_length=16, choices=Kinds.choices, default=Kinds.SHIPPING
    )
    full_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=32, blank=True)
    line1 = models.CharField(max_length=255)
    line2 = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=120)
    state = models.CharField(max_length=120, blank=True)
    postal_code = models.CharField(max_length=32, blank=True)
    country = models.CharField(max_length=2, help_text="ISO 3166-1 alpha-2")
    is_default = models.BooleanField(default=False)

    class Meta:
        verbose_name_plural = "addresses"
        ordering = ("-is_default", "-created_at")

    def __str__(self) -> str:
        return f"{self.full_name}, {self.city} ({self.get_kind_display()})"

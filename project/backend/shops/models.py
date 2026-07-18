"""
Shop domain models.

A shop is a fully brandable storefront. Customisation is split into three
concerns so owners get *extreme* control without us hard-coding every option:

* :class:`Shop`        - identity, contact, status, aggregates.
* :class:`ShopTheme`   - design tokens (colours, typography, spacing, radius,
                         custom CSS) applied across the storefront.
* :class:`ShopLayout` / :class:`LayoutSection` / :class:`SectionBlock`
                       - a page-builder tree letting owners arrange sections
                         (hero, product grid, banner, rich text, gallery ...)
                         and configure each via JSON, like a mini CMS.

Design tokens and block configs use JSON so new options can ship without
migrations, while a strict serializer layer validates them at the boundary.
"""
from __future__ import annotations

import secrets

from django.conf import settings
from django.db import models
from django.utils.text import slugify
from django.utils.translation import gettext_lazy as _


from core.models import BaseModel, SoftDeleteModel, TimeStampedModel
from core.validators import hex_color_validator, slug_validator


class Shop(BaseModel, SoftDeleteModel):
    class Status(models.TextChoices):
        DRAFT = "draft", _("Draft")
        ACTIVE = "active", _("Active")
        SUSPENDED = "suspended", _("Suspended")
        CLOSED = "closed", _("Closed")

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="shops",
    )
    name = models.CharField(max_length=120)
    slug = models.SlugField(
        max_length=140, unique=True, validators=[slug_validator], db_index=True
    )
    tagline = models.CharField(max_length=200, blank=True)
    description = models.TextField(blank=True)
    allow_manual_delivery = models.BooleanField(
        default=False,
        help_text="If true, buyers can choose to arrange delivery manually with the seller (0 fee upfront)."
    )

    # --- Seller Verification (KYC) ---
    class VerificationStatus(models.TextChoices):
        UNVERIFIED = "unverified", _("Unverified")
        PENDING = "pending", _("Pending review")
        VERIFIED = "verified", _("Verified")
        REJECTED = "rejected", _("Rejected")

    verification_status = models.CharField(
        max_length=16,
        choices=VerificationStatus.choices,
        default=VerificationStatus.UNVERIFIED,
        db_index=True,
    )
    verified_at = models.DateTimeField(null=True, blank=True)
    verification_document = models.FileField(
        upload_to="shops/verification_docs/", blank=True, null=True,
        help_text="Government-issued ID or CAC document for manual review.",
    )
    verification_legal_name = models.CharField(
        max_length=255, blank=True,
        help_text="Legal name as it appears on the submitted document.",
    )
    verification_notes = models.TextField(
        blank=True,
        help_text="Admin notes about the verification review.",
    )

    # Branding assets (processed into responsive variants by the image pipeline).
    logo = models.ImageField(upload_to="shops/logos/", blank=True, null=True)
    banner = models.ImageField(upload_to="shops/banners/", blank=True, null=True)

    # Contact.
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=32, blank=True)
    address = models.TextField(blank=True)
    country = models.CharField(max_length=2, blank=True, help_text="ISO 3166-1 alpha-2")

    # Social.
    facebook_url = models.URLField(blank=True)
    instagram_url = models.URLField(blank=True)
    twitter_url = models.URLField(blank=True)
    website_url = models.URLField(blank=True)

    # Custom domain (feature-gated by the subscription plan).
    #
    # A shop on a plan with ``custom_domain_enabled`` can point their own
    # domain (e.g. ``shop.example.com``) at the platform. The flow is:
    #   1. Owner submits the domain -> we store it + a verification token,
    #      status becomes PENDING and we surface the DNS records to add.
    #   2. Owner adds a CNAME (domain -> platform host) and a TXT record
    #      (``_shopverify.<domain>`` -> the token) at their DNS provider.
    #   3. A verification check resolves the TXT record; on success the
    #      status becomes VERIFIED and edge routing serves the storefront by
    #      Host header.
    class DomainStatus(models.TextChoices):
        NONE = "none", _("None")
        PENDING = "pending", _("Pending verification")
        VERIFIED = "verified", _("Verified")
        FAILED = "failed", _("Verification failed")

    custom_domain = models.CharField(
        max_length=253,
        blank=True,
        default="",
        db_index=True,
        help_text="Owner's custom domain, e.g. 'shop.example.com'. "
        "Unique across shops when set.",
    )
    custom_domain_status = models.CharField(
        max_length=16,
        choices=DomainStatus.choices,
        default=DomainStatus.NONE,
        db_index=True,
    )
    custom_domain_verification_token = models.CharField(
        max_length=64, blank=True, default=""
    )
    custom_domain_verified_at = models.DateTimeField(null=True, blank=True)

    # Feature toggles.

    enable_product_listings = models.BooleanField(default=True)
    enable_custom_orders = models.BooleanField(default=False)
    enable_reviews = models.BooleanField(default=True)
    enable_contact = models.BooleanField(default=True)
    enable_shipping = models.BooleanField(default=False)
    enable_social_links = models.BooleanField(default=False)

    # Lifecycle & trust.
    status = models.CharField(
        max_length=16, choices=Status.choices, default=Status.DRAFT, db_index=True
    )
    is_verified = models.BooleanField(default=False)

    # Denormalised aggregates (kept fresh via signals/tasks) for cheap sorting
    # and display without expensive joins on every request.
    rating_average = models.DecimalField(
        max_digits=3, decimal_places=2, default=0
    )
    rating_count = models.PositiveIntegerField(default=0)
    product_count = models.PositiveIntegerField(default=0)
    total_sales = models.PositiveIntegerField(default=0)

    # Default currency for this shop's pricing.
    currency = models.CharField(max_length=3, default="USD")

    class Meta:
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["status", "is_verified"]),
            models.Index(fields=["-rating_average"]),
            models.Index(fields=["owner", "status"]),
        ]


    def __str__(self) -> str:
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = self._generate_unique_slug()
        super().save(*args, **kwargs)

    def _generate_unique_slug(self) -> str:
        base = slugify(self.name) or "shop"
        slug = base
        n = 1
        # Include soft-deleted rows to avoid slug collisions on restore.
        while Shop.all_objects.filter(slug=slug).exclude(pk=self.pk).exists():
            n += 1
            slug = f"{base}-{n}"
        return slug

    @property
    def is_open(self) -> bool:
        return self.status == self.Status.ACTIVE

    # -- Custom domain helpers -------------------------------------------

    @staticmethod
    def generate_domain_token() -> str:
        """Return a fresh, URL-safe verification token for a custom domain."""
        return secrets.token_hex(16)

    @property
    def has_verified_domain(self) -> bool:
        return (
            bool(self.custom_domain)
            and self.custom_domain_status == self.DomainStatus.VERIFIED
        )


class ShopTheme(TimeStampedModel):

    """Design tokens applied across a shop's storefront.

    Common tokens are first-class columns (validated, queryable); everything
    else lives in ``extra_tokens`` / ``custom_css`` so owners can go further
    without waiting on schema changes.
    """

    class Layouts(models.TextChoices):
        CLASSIC = "classic", _("Classic")
        MODERN = "modern", _("Modern")
        MINIMAL = "minimal", _("Minimal")
        BOLD = "bold", _("Bold")
        MAGAZINE = "magazine", _("Magazine")

    class ProductCardStyles(models.TextChoices):
        STANDARD = "standard", _("Standard")
        COMPACT = "compact", _("Compact")
        OVERLAY = "overlay", _("Overlay")
        DETAILED = "detailed", _("Detailed")

    shop = models.OneToOneField(
        Shop, on_delete=models.CASCADE, related_name="theme"
    )

    # Colour palette.
    primary_color = models.CharField(
        max_length=7, default="#2563EB", validators=[hex_color_validator]
    )
    secondary_color = models.CharField(
        max_length=7, default="#10B981", validators=[hex_color_validator]
    )
    accent_color = models.CharField(
        max_length=7, default="#F59E0B", validators=[hex_color_validator]
    )
    background_color = models.CharField(
        max_length=7, default="#FFFFFF", validators=[hex_color_validator]
    )
    surface_color = models.CharField(
        max_length=7, default="#F9FAFB", validators=[hex_color_validator]
    )
    text_color = models.CharField(
        max_length=7, default="#111827", validators=[hex_color_validator]
    )
    muted_text_color = models.CharField(
        max_length=7, default="#6B7280", validators=[hex_color_validator]
    )

    # Typography.
    heading_font = models.CharField(max_length=120, default="Inter")
    body_font = models.CharField(max_length=120, default="Inter")
    base_font_size = models.PositiveSmallIntegerField(default=16)

    # Shape / density.
    border_radius = models.PositiveSmallIntegerField(
        default=8, help_text="Corner radius in px."
    )
    button_style = models.CharField(max_length=20, default="solid")
    layout_style = models.CharField(
        max_length=20, choices=Layouts.choices, default=Layouts.MODERN
    )
    product_card_style = models.CharField(
        max_length=20,
        choices=ProductCardStyles.choices,
        default=ProductCardStyles.STANDARD,
    )
    dark_mode_enabled = models.BooleanField(default=False)

    # Escape hatches for power users.
    extra_tokens = models.JSONField(default=dict, blank=True)
    custom_css = models.TextField(
        blank=True,
        help_text="Advanced: sanitised custom CSS scoped to the storefront.",
    )

    def __str__(self) -> str:
        return f"Theme<{self.shop.name}>"


class ShopLayout(TimeStampedModel):
    """A named, orderable page composed of sections (the storefront home)."""

    class Pages(models.TextChoices):
        HOME = "home", _("Home")
        ABOUT = "about", _("About")
        CONTACT = "contact", _("Contact")

    shop = models.ForeignKey(
        Shop, on_delete=models.CASCADE, related_name="layouts"
    )
    page = models.CharField(
        max_length=20, choices=Pages.choices, default=Pages.HOME
    )
    is_published = models.BooleanField(default=True)

    class Meta:
        unique_together = ("shop", "page")

    def __str__(self) -> str:
        return f"{self.shop.name} / {self.get_page_display()}"


class LayoutSection(TimeStampedModel):
    """An orderable section within a layout (hero, grid, banner, ...)."""

    class Kinds(models.TextChoices):
        HERO = "hero", _("Hero")
        FEATURED_PRODUCTS = "featured_products", _("Featured products")
        PRODUCT_GRID = "product_grid", _("Product grid")
        CATEGORY_SHOWCASE = "category_showcase", _("Category showcase")
        BANNER = "banner", _("Banner")
        RICH_TEXT = "rich_text", _("Rich text")
        GALLERY = "gallery", _("Gallery")
        TESTIMONIALS = "testimonials", _("Testimonials")
        NEWSLETTER = "newsletter", _("Newsletter")
        SPACER = "spacer", _("Spacer")

    layout = models.ForeignKey(
        ShopLayout, on_delete=models.CASCADE, related_name="sections"
    )
    kind = models.CharField(max_length=32, choices=Kinds.choices)
    position = models.PositiveIntegerField(default=0, db_index=True)
    is_visible = models.BooleanField(default=True)
    # Section-level configuration (title, columns, background, etc.).
    config = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ("position", "id")

    def __str__(self) -> str:
        return f"{self.get_kind_display()} @ {self.position}"


class SectionBlock(TimeStampedModel):
    """An orderable content block inside a section (image, text, CTA ...)."""

    class Kinds(models.TextChoices):
        IMAGE = "image", _("Image")
        TEXT = "text", _("Text")
        BUTTON = "button", _("Button")
        PRODUCT = "product", _("Product reference")
        VIDEO = "video", _("Video")

    section = models.ForeignKey(
        LayoutSection, on_delete=models.CASCADE, related_name="blocks"
    )
    kind = models.CharField(max_length=32, choices=Kinds.choices)
    position = models.PositiveIntegerField(default=0, db_index=True)
    is_visible = models.BooleanField(default=True)
    config = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ("position", "id")

    def __str__(self) -> str:
        return f"{self.get_kind_display()} @ {self.position}"


class ShopStaff(TimeStampedModel):
    """Additional team members who can help manage a shop (RBAC-lite)."""

    class Roles(models.TextChoices):
        MANAGER = "manager", _("Manager")
        STAFF = "staff", _("Staff")

    shop = models.ForeignKey(
        Shop, on_delete=models.CASCADE, related_name="staff"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="shop_roles"
    )
    role = models.CharField(
        max_length=16, choices=Roles.choices, default=Roles.STAFF
    )

    class Meta:
        unique_together = ("shop", "user")

    def __str__(self) -> str:
        return f"{self.user} @ {self.shop} ({self.get_role_display()})"


class ShopReview(TimeStampedModel):
    shop = models.ForeignKey(
        Shop, on_delete=models.CASCADE, related_name="reviews"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="shop_reviews"
    )
    rating = models.PositiveSmallIntegerField()
    comment = models.TextField(blank=True)

    class Meta:
        unique_together = ("shop", "user")
        ordering = ("-created_at",)


    def __str__(self) -> str:
        return f"{self.user}'s review of {self.shop.name}"


# ---------------------------------------------------------------------------
# Delivery Zones (per-shop, Nigerian states)
# ---------------------------------------------------------------------------

NIGERIAN_STATES = [
    ("abia", "Abia"),
    ("adamawa", "Adamawa"),
    ("akwa_ibom", "Akwa Ibom"),
    ("anambra", "Anambra"),
    ("bauchi", "Bauchi"),
    ("bayelsa", "Bayelsa"),
    ("benue", "Benue"),
    ("borno", "Borno"),
    ("cross_river", "Cross River"),
    ("delta", "Delta"),
    ("ebonyi", "Ebonyi"),
    ("edo", "Edo"),
    ("ekiti", "Ekiti"),
    ("enugu", "Enugu"),
    ("fct", "FCT (Abuja)"),
    ("gombe", "Gombe"),
    ("imo", "Imo"),
    ("jigawa", "Jigawa"),
    ("kaduna", "Kaduna"),
    ("kano", "Kano"),
    ("katsina", "Katsina"),
    ("kebbi", "Kebbi"),
    ("kogi", "Kogi"),
    ("kwara", "Kwara"),
    ("lagos", "Lagos"),
    ("nasarawa", "Nasarawa"),
    ("niger", "Niger"),
    ("ogun", "Ogun"),
    ("ondo", "Ondo"),
    ("osun", "Osun"),
    ("oyo", "Oyo"),
    ("plateau", "Plateau"),
    ("rivers", "Rivers"),
    ("sokoto", "Sokoto"),
    ("taraba", "Taraba"),
    ("yobe", "Yobe"),
    ("zamfara", "Zamfara"),
]


class DeliveryZone(TimeStampedModel):
    """
    Per-state delivery fee for a shop.

    Shop owners configure which Nigerian states they deliver to and
    set a delivery fee for each. States not configured are treated as
    unavailable during checkout.
    """

    shop = models.ForeignKey(
        Shop, on_delete=models.CASCADE, related_name="delivery_zones"
    )
    state = models.CharField(
        max_length=20,
        choices=NIGERIAN_STATES,
        db_index=True,
    )
    fee = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        help_text="Delivery fee in the shop's currency for this state.",
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ("shop", "state")
        ordering = ("state",)

    def __str__(self) -> str:
        return f"{self.shop.name} → {self.get_state_display()}: ₦{self.fee}"


class DeliveryNote(TimeStampedModel):
    """
    A note from a buyer requesting delivery to a state that isn't
    configured by the shop owner.

    Shop owners see these in their dashboard so they know there's
    demand for a particular state.
    """

    shop = models.ForeignKey(
        Shop, on_delete=models.CASCADE, related_name="delivery_notes"
    )
    sender_name = models.CharField(max_length=120)
    sender_email = models.EmailField()
    state_requested = models.CharField(
        max_length=20,
        choices=NIGERIAN_STATES,
        help_text="The state the buyer wanted delivery to.",
    )
    message = models.TextField(blank=True)
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self) -> str:
        return f"Note from {self.sender_name} → {self.shop.name} ({self.get_state_requested_display()})"


# ---------------------------------------------------------------------------
# Shop Report (anti-scam)
# ---------------------------------------------------------------------------

REPORT_REASONS = [
    ("scam", "Scam / fraud"),
    ("fake_products", "Fake or misleading products"),
    ("non_delivery", "Never received my order"),
    ("harassment", "Harassment or abuse"),
    ("other", "Other"),
]


class ShopReport(TimeStampedModel):
    """User report against a shop for scam or policy violations.

    If a shop accumulates 3+ unique reports within 7 days, the platform
    can auto-suspend it pending admin review.
    """

    class Status(models.TextChoices):
        PENDING = "pending", _("Pending")
        REVIEWED = "reviewed", _("Reviewed")
        DISMISSED = "dismissed", _("Dismissed")

    shop = models.ForeignKey(
        Shop, on_delete=models.CASCADE, related_name="reports",
    )
    reporter = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name="shop_reports_filed",
    )
    reason = models.CharField(max_length=20, choices=REPORT_REASONS)
    description = models.TextField(blank=True)
    status = models.CharField(
        max_length=16, choices=Status.choices, default=Status.PENDING,
        db_index=True,
    )
    admin_notes = models.TextField(blank=True)

    class Meta:
        unique_together = ("shop", "reporter")  # one report per user per shop
        ordering = ("-created_at",)

    def __str__(self) -> str:
        return f"Report by {self.reporter} against {self.shop.name} ({self.reason})"

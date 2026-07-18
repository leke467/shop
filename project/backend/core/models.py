"""
Reusable abstract base models.

Design choices for scale & security:
- ``BigAutoField`` primary keys stay internal (fast joins, small indexes).
- A separate indexed ``public_id`` UUID is what we expose in URLs/APIs so that
  external identifiers cannot be enumerated (prevents IDOR-style scraping).
- ``created_at`` / ``updated_at`` are always present for auditing and sorting.
- ``SoftDeleteModel`` lets us hide records without losing referential history
  (important for orders/payments where hard deletes are dangerous).
"""
from __future__ import annotations

import uuid

from django.db import models
from django.utils import timezone


class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
        ordering = ("-created_at",)


class UUIDModel(models.Model):
    """Adds an externally safe, non-sequential public identifier."""

    public_id = models.UUIDField(
        default=uuid.uuid4, editable=False, unique=True, db_index=True
    )

    class Meta:
        abstract = True


class BaseModel(UUIDModel, TimeStampedModel):
    """The default base for domain models: timestamps + public UUID."""

    class Meta:
        abstract = True
        ordering = ("-created_at",)


class SoftDeleteQuerySet(models.QuerySet):
    def alive(self) -> "SoftDeleteQuerySet":
        return self.filter(deleted_at__isnull=True)

    def dead(self) -> "SoftDeleteQuerySet":
        return self.filter(deleted_at__isnull=False)

    def delete(self):  # type: ignore[override]
        return super().update(deleted_at=timezone.now())

    def hard_delete(self):
        return super().delete()


class SoftDeleteManager(models.Manager):
    def get_queryset(self) -> SoftDeleteQuerySet:
        return SoftDeleteQuerySet(self.model, using=self._db).alive()


class SoftDeleteModel(models.Model):
    """Marks rows deleted instead of removing them."""

    deleted_at = models.DateTimeField(null=True, blank=True, db_index=True)

    # ``objects`` hides soft-deleted rows; ``all_objects`` sees everything.
    objects = SoftDeleteManager()
    all_objects = SoftDeleteQuerySet.as_manager()

    class Meta:
        abstract = True

    def delete(self, using=None, keep_parents=False):  # type: ignore[override]
        self.deleted_at = timezone.now()
        self.save(update_fields=["deleted_at"])

    def hard_delete(self, using=None, keep_parents=False):
        super().delete(using=using, keep_parents=keep_parents)

    def restore(self):
        self.deleted_at = None
        self.save(update_fields=["deleted_at"])


# ---------------------------------------------------------------------------
# Site-wide theme (singleton – only one active row)
# ---------------------------------------------------------------------------
THEME_PRESETS = {
    "teal_slate": {
        "label": "Teal & Slate (Default)",
        "primary": "#0d9488",
        "secondary": "#475569",
        "accent": "#d97706",
    },
    "warm_coral": {
        "label": "Warm Coral & Amber",
        "primary": "#e74c3c",
        "secondary": "#d35400",
        "accent": "#f39c12",
    },
    "emerald_gold": {
        "label": "Emerald & Gold",
        "primary": "#059669",
        "secondary": "#065f46",
        "accent": "#d97706",
    },
    "ocean_blue": {
        "label": "Ocean Blue & Sand",
        "primary": "#0284c7",
        "secondary": "#0c4a6e",
        "accent": "#ea580c",
    },
    "rose_charcoal": {
        "label": "Rose & Charcoal",
        "primary": "#e11d48",
        "secondary": "#374151",
        "accent": "#7c3aed",
    },
    "indigo_amber": {
        "label": "Indigo & Amber",
        "primary": "#4f46e5",
        "secondary": "#1e1b4b",
        "accent": "#f59e0b",
    },
    "custom": {
        "label": "Custom (use fields below)",
        "primary": None,
        "secondary": None,
        "accent": None,
    },
}

PRESET_CHOICES = [(k, v["label"]) for k, v in THEME_PRESETS.items()]


class SiteTheme(TimeStampedModel):
    """
    Singleton model controlling the marketplace color palette.

    Choose a preset or set ``preset`` to "custom" and fill in the
    hex fields directly. The active theme is served at ``/api/theme/``.
    """

    preset = models.CharField(
        max_length=30,
        choices=PRESET_CHOICES,
        default="teal_slate",
        help_text="Pick a preset palette, or choose 'Custom' to set your own hex values.",
    )
    # Custom overrides – only used when preset == "custom"
    custom_primary = models.CharField(
        max_length=7, blank=True, default="",
        help_text="Primary color hex (e.g. #0d9488). Only used with Custom preset.",
    )
    custom_secondary = models.CharField(
        max_length=7, blank=True, default="",
        help_text="Secondary color hex (e.g. #475569). Only used with Custom preset.",
    )
    custom_accent = models.CharField(
        max_length=7, blank=True, default="",
        help_text="Accent color hex (e.g. #d97706). Only used with Custom preset.",
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Site Theme"
        verbose_name_plural = "Site Themes"

    def __str__(self):
        return f"Theme: {self.get_preset_display()}"

    def get_colors(self):
        """Return the resolved {primary, secondary, accent} hex dict."""
        if self.preset == "custom":
            return {
                "primary": self.custom_primary or "#0d9488",
                "secondary": self.custom_secondary or "#475569",
                "accent": self.custom_accent or "#d97706",
            }
        preset = THEME_PRESETS.get(self.preset, THEME_PRESETS["teal_slate"])
        return {
            "primary": preset["primary"],
            "secondary": preset["secondary"],
            "accent": preset["accent"],
        }

    def save(self, *args, **kwargs):
        # Ensure only one active theme at a time
        if self.is_active:
            SiteTheme.objects.filter(is_active=True).exclude(pk=self.pk).update(is_active=False)
        super().save(*args, **kwargs)

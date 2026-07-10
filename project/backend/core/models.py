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

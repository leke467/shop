"""Shared field validators (branding, uploads)."""
from __future__ import annotations

from django.core.exceptions import ValidationError
from django.core.validators import RegexValidator

# #RGB or #RRGGBB hex colour.
hex_color_validator = RegexValidator(
    regex=r"^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$",
    message="Enter a valid hex colour, e.g. #1A2B3C.",
)

# Conservative slug: lowercase letters, digits and single hyphens.
slug_validator = RegexValidator(
    regex=r"^[a-z0-9]+(?:-[a-z0-9]+)*$",
    message="Slugs may only contain lowercase letters, numbers and hyphens.",
)

ALLOWED_IMAGE_CONTENT_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/avif",
}

MAX_IMAGE_SIZE_BYTES = 8 * 1024 * 1024  # 8 MB


def validate_image_file(file_obj):
    """Validate an uploaded image by size and content type.

    Content-type sniffing here is a first gate; the image pipeline re-encodes
    uploads with Pillow, which is the authoritative validation step.
    """
    if file_obj.size > MAX_IMAGE_SIZE_BYTES:
        raise ValidationError(
            f"Image too large (max {MAX_IMAGE_SIZE_BYTES // (1024 * 1024)} MB)."
        )
    content_type = getattr(file_obj, "content_type", None)
    if content_type and content_type not in ALLOWED_IMAGE_CONTENT_TYPES:
        raise ValidationError(f"Unsupported image type: {content_type}.")

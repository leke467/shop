"""
Celery tasks for the products app (Items 45-46).

- Image processing: generate thumbnails, medium, and large variants.
- Recommendation cache refresh (delegated to personalization).
"""
from __future__ import annotations

import logging
from io import BytesIO
from pathlib import Path

from celery import shared_task
from django.core.files.base import ContentFile

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=30)
def process_product_image(self, image_id: int):
    """
    Generate thumbnail, medium, and large variants for a ProductImage.

    Sizes:
        - thumbnail: 150×150 (square crop, for product cards)
        - medium:    600×600 (fit, for product grids)
        - large:     1200×1200 (fit, for product detail zoom)

    Uses Pillow. Falls back gracefully if the image can't be processed.
    """
    from products.models import ProductImage

    try:
        img_obj = ProductImage.objects.get(pk=image_id)
    except ProductImage.DoesNotExist:
        logger.warning("ProductImage %s not found, skipping", image_id)
        return

    if not img_obj.image:
        logger.warning("ProductImage %s has no source image", image_id)
        return

    try:
        from PIL import Image
    except ImportError:
        logger.error("Pillow not installed — cannot process images")
        return

    try:
        source = Image.open(img_obj.image)
        source = source.convert("RGB")  # Ensure RGB for JPEG output

        # Record source dimensions.
        img_obj.width, img_obj.height = source.size

        sizes = {
            "thumbnail": (150, 150, True),   # (w, h, crop)
            "medium": (600, 600, False),
            "large": (1200, 1200, False),
        }

        for label, (w, h, crop) in sizes.items():
            resized = _resize(source.copy(), w, h, crop)
            buffer = BytesIO()
            resized.save(buffer, format="JPEG", quality=85, optimize=True)
            buffer.seek(0)

            filename = f"{Path(img_obj.image.name).stem}_{label}.jpg"
            field = getattr(img_obj, label)
            field.save(filename, ContentFile(buffer.read()), save=False)

        # Generate placeholder (tiny blurred version for progressive loading).
        placeholder = _resize(source.copy(), 20, 20, False)
        buf = BytesIO()
        placeholder.save(buf, format="JPEG", quality=30)
        buf.seek(0)
        ph_name = f"{Path(img_obj.image.name).stem}_placeholder.jpg"
        img_obj.placeholder.save(ph_name, ContentFile(buf.read()), save=False)

        img_obj.is_processed = True
        img_obj.save(update_fields=[
            "thumbnail", "medium", "large", "placeholder",
            "width", "height", "is_processed",
        ])
        logger.info("Processed ProductImage %s (%dx%d)", image_id, img_obj.width, img_obj.height)

    except Exception as exc:
        logger.exception("Image processing failed for %s", image_id)
        raise self.retry(exc=exc)


def _resize(image, max_w, max_h, crop=False):
    """Resize a PIL Image. If crop=True, center-crop to exact dimensions."""
    from PIL import Image as PILImage

    if crop:
        # Center crop to square first.
        w, h = image.size
        side = min(w, h)
        left = (w - side) // 2
        top = (h - side) // 2
        image = image.crop((left, top, left + side, top + side))
        image = image.resize((max_w, max_h), PILImage.LANCZOS)
    else:
        image.thumbnail((max_w, max_h), PILImage.LANCZOS)
    return image


@shared_task
def process_all_unprocessed_images():
    """Batch task: process all images that haven't been processed yet."""
    from products.models import ProductImage

    unprocessed = ProductImage.objects.filter(is_processed=False).values_list("id", flat=True)
    count = 0
    for img_id in unprocessed:
        process_product_image.delay(img_id)
        count += 1
    logger.info("Queued %d images for processing", count)
    return count

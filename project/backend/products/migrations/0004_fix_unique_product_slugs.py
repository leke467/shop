from django.db import migrations
from django.utils.text import slugify


def fix_product_slugs(apps, schema_editor):
    Product = apps.get_model("products", "Product")
    used_slugs = set()

    for product in Product.objects.order_by("created_at"):
        base_slug = slugify(product.name or "product") or "product"
        slug = base_slug
        n = 1

        while slug in used_slugs or Product.objects.filter(slug=slug).exclude(pk=product.pk).exists():
            n += 1
            slug = f"{base_slug}-{n}"

        product.slug = slug
        product.save(update_fields=["slug"])
        used_slugs.add(slug)


def reverse_noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("products", "0003_product_variants_and_custom_measurements"),
    ]

    operations = [
        migrations.RunPython(fix_product_slugs, reverse_noop),
    ]

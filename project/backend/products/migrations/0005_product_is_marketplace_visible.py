from django.db import migrations, models


def set_starter_items_storefront_only(apps, schema_editor):
    Product = apps.get_model("products", "Product")
    Product.objects.filter(
        models.Q(name__in=["Item 1", "Item 2", "Item 3", "Item 4", "Item 5"])
        | models.Q(description__icontains="Default starter item")
    ).update(is_marketplace_visible=False)


def reverse_noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("products", "0004_fix_unique_product_slugs"),
    ]

    operations = [
        migrations.AddField(
            model_name="product",
            name="is_marketplace_visible",
            field=models.BooleanField(
                default=True,
                db_index=True,
                help_text="If True, product appears on MultiShop marketplace home page & explore feed. If False, it is exclusive to the seller's storefront.",
            ),
        ),
        migrations.RunPython(set_starter_items_storefront_only, reverse_noop),
    ]

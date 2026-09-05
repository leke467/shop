# Generated for Product Marketplace Visibility Control

from django.db import migrations, models


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
    ]

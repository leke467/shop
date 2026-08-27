# Generated for Product Variants and Bespoke Measurements

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("products", "0002_flashsale_flashsaleitem"),
    ]

    operations = [
        migrations.AddField(
            model_name="product",
            name="has_variants",
            field=models.BooleanField(
                default=False,
                help_text="If true, product has multiple selectable variants (e.g. Size, Color, Flavor, Model).",
            ),
        ),
        migrations.AddField(
            model_name="product",
            name="variant_attributes",
            field=models.JSONField(
                blank=True,
                default=list,
                help_text="List of attribute definitions e.g. [{'name': 'Size', 'options': ['S', 'M', 'L']}]",
            ),
        ),
        migrations.AddField(
            model_name="product",
            name="allow_custom_measurements",
            field=models.BooleanField(
                default=False,
                help_text="If true, product is made-to-order and prompts buyer for bespoke measurements or custom inscription.",
            ),
        ),
        migrations.AddField(
            model_name="product",
            name="custom_measurement_type",
            field=models.CharField(
                blank=True,
                default="fashion",
                help_text="Type: 'fashion' (Bust/Waist/Hip/Length), 'dimensions' (L×W×H), 'cake_inscription', or 'text'",
                max_length=50,
            ),
        ),
        migrations.AddField(
            model_name="product",
            name="custom_measurement_prompt",
            field=models.CharField(
                blank=True,
                help_text="Custom prompt label e.g. 'Enter name & age for cake inscription' or 'Provide measurements in inches'",
                max_length=255,
            ),
        ),
        migrations.AddField(
            model_name="product",
            name="custom_measurement_required",
            field=models.BooleanField(
                default=False,
                help_text="Whether custom measurement/text is mandatory before adding to cart.",
            ),
        ),
    ]

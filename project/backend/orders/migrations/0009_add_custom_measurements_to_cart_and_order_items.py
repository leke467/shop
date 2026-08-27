# Generated for CartItem and OrderItem Custom Measurements

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("orders", "0008_alter_order_user"),
    ]

    operations = [
        migrations.AddField(
            model_name="cartitem",
            name="custom_measurements",
            field=models.JSONField(
                blank=True,
                default=dict,
                help_text="Custom buyer measurements or bespoke inscription notes for this item.",
            ),
        ),
        migrations.AddField(
            model_name="orderitem",
            name="custom_measurements",
            field=models.JSONField(
                blank=True,
                default=dict,
                help_text="Custom buyer measurements or bespoke inscription notes for this item.",
            ),
        ),
    ]

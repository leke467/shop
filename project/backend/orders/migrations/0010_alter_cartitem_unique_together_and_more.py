# Generated for CartItem and Coupon models

from django.db import migrations, models
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ("orders", "0009_add_custom_measurements_to_cart_and_order_items"),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name="cartitem",
            unique_together=set(),
        ),
    ]

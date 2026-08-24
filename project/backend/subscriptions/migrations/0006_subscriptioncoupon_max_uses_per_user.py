# Generated for SubscriptionCoupon max_uses_per_user

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('subscriptions', '0005_subscriptionplan_custom_shop_template_enabled_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='subscriptioncoupon',
            name='max_uses_per_user',
            field=models.PositiveIntegerField(
                default=1,
                help_text='Maximum times a single user can redeem this coupon. 1 = one-time per user, 0 = unlimited.',
            ),
        ),
    ]

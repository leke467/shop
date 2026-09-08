from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0006_seed_global_categories'),
    ]

    operations = [
        migrations.AddField(
            model_name='product',
            name='store_catalogue',
            field=models.CharField(blank=True, default='', help_text='Storefront specific catalogue tab e.g. Cakes, Parfaits, Sweets', max_length=120),
        ),
    ]

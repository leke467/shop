from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0007_product_store_catalogue'),
    ]

    operations = [
        migrations.AddField(
            model_name='productvariant',
            name='image',
            field=models.ImageField(blank=True, null=True, upload_to='products/variants/'),
        ),
    ]

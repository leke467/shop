# Generated for Social Media URLs (TikTok, YouTube, WhatsApp, LinkedIn, Pinterest)

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("shops", "0010_alter_shop_banner_alter_shop_logo"),
    ]

    operations = [
        migrations.AddField(
            model_name="shop",
            name="tiktok_url",
            field=models.URLField(blank=True),
        ),
        migrations.AddField(
            model_name="shop",
            name="youtube_url",
            field=models.URLField(blank=True),
        ),
        migrations.AddField(
            model_name="shop",
            name="whatsapp_number",
            field=models.CharField(blank=True, max_length=32),
        ),
        migrations.AddField(
            model_name="shop",
            name="linkedin_url",
            field=models.URLField(blank=True),
        ),
        migrations.AddField(
            model_name="shop",
            name="pinterest_url",
            field=models.URLField(blank=True),
        ),
    ]

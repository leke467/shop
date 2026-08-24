# Generated migration for expanded SiteTheme presets and max_length

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='sitetheme',
            name='preset',
            field=models.CharField(
                choices=[
                    ('teal_slate', 'Teal Lagoon & Slate'),
                    ('midnight_gold', 'Midnight Onyx & Gold (Black Theme)'),
                    ('cyber_black', 'Cyber Black & Neon Cyan (Dark Theme)'),
                    ('obsidian_rose', 'Obsidian Noir & Rose Neon (Dark Theme)'),
                    ('emerald_gold', 'Deep Forest Emerald & Gold'),
                    ('ocean_sapphire', 'Ocean Sapphire & Coral'),
                    ('royal_amethyst', 'Royal Amethyst & Champagne Gold'),
                    ('crimson_sunset', 'Sunset Crimson & Golden Amber'),
                    ('warm_coral', 'Warm Coral & Terracotta'),
                    ('coffee_caramel', 'Espresso Coffee & Warm Caramel'),
                    ('nordic_frost', 'Nordic Ice Blue & Slate'),
                    ('blossom_lavender', 'Sakura Blossom & Lavender'),
                    ('rose_charcoal', 'Rose Velvet & Charcoal'),
                    ('indigo_amber', 'Indigo Dusk & Amber'),
                    ('custom', 'Custom (use fields below)'),
                ],
                default='teal_slate',
                help_text="Pick a preset palette, or choose 'Custom' to set your own hex values.",
                max_length=50,
            ),
        ),
    ]

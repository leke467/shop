from django.db import migrations


def seed_categories(apps, schema_editor):
    Category = apps.get_model("products", "Category")

    categories = [
        ("Arts & Crafts", "arts-crafts"),
        ("Automotive", "automotive"),
        ("Baby", "baby"),
        ("Beauty & Personal Care", "beauty"),
        ("Books", "books"),
        ("Boys' Fashion", "boys-fashion"),
        ("Computers & Tech", "computers"),
        ("Electronics", "electronics"),
        ("Girls' Fashion", "girls-fashion"),
        ("Health & Household", "health"),
        ("Home & Kitchen", "home-kitchen"),
        ("Industrial & Scientific", "industrial"),
        ("Luggage & Travel", "luggage"),
        ("Men's Fashion", "mens-fashion"),
        ("Movies & TV", "movies-tv"),
        ("Music & Audio", "music"),
        ("Pet Supplies", "pet-supplies"),
        ("Sports & Outdoors", "sports"),
        ("Tools & Home Improvement", "tools"),
        ("Toys & Games", "toys-games"),
        ("Video Games", "video-games"),
        ("Women's Fashion", "womens-fashion"),
        ("Food & Beverages", "food-beverages"),
        ("Jewelry & Watches", "jewelry-watches"),
        ("Office Products", "office-products"),
        ("Laptops", "laptops"),
        ("Desktops", "desktops"),
        ("Monitors", "monitors"),
        ("Peripherals", "peripherals"),
        ("Accessories", "accessories"),
    ]

    for name, slug in categories:
        Category.objects.get_or_create(
            slug=slug,
            defaults={"name": name, "is_active": True}
        )


def remove_categories(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0005_product_is_marketplace_visible'),
    ]

    operations = [
        migrations.RunPython(seed_categories, remove_categories),
    ]

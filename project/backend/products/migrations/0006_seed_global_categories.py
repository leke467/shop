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

    max_tree_id = 0
    try:
        from django.db.models import Max
        res = Category.objects.aggregate(Max("tree_id"))["tree_id__max"]
        if res is not None:
            max_tree_id = int(res)
    except Exception:
        pass

    for name, slug in categories:
        if not Category.objects.filter(slug=slug).exists():
            max_tree_id += 1
            try:
                Category.objects.create(
                    name=name,
                    slug=slug,
                    is_active=True,
                    lft=1,
                    rght=2,
                    tree_id=max_tree_id,
                    level=0,
                    product_count=0,
                )
            except Exception as e:
                print(f"Notice: skipped category {slug}: {e}")

    try:
        from products.models import Category as RealCategory
        RealCategory.objects.rebuild()
    except Exception:
        pass


def remove_categories(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0005_product_is_marketplace_visible'),
    ]

    operations = [
        migrations.RunPython(seed_categories, remove_categories),
    ]

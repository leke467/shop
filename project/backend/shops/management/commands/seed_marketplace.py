import os
import random
from django.core.management.base import BaseCommand
from django.db import transaction
from django.contrib.auth import get_user_model
from django.core.files import File
from django.utils.text import slugify

from accounts.models import Address
from shops.models import Shop, ShopTheme
from products.models import Category, Product, ProductVariant, Inventory, ProductImage

User = get_user_model()

WALLPAPER_DIR = r"C:\Users\Leke\Downloads\alienware-wallpapers_pkb_en_US_1\alienware-wallpapers"

SHOP_ADJECTIVES = ["Quantum", "Apex", "Nova", "Starlight", "Elite", "Hyper", "Vortex", "Nebula", "Alpha", "Omega", "Cyber", "Titan", "Cosmic", "Eclipse", "Horizon", "Infinity", "Obsidian", "Sentinel", "Solar", "Zephyr"]
SHOP_NOUNS = ["Gear", "Tech", "Hardware", "Systems", "Hub", "Lab", "Space", "Depot", "Vault", "Outpost", "Zone", "Station", "Store", "Emporium", "Modding", "Labs", "Gaming", "Dynamics", "Forge", "Grid"]

PRODUCT_DATA = {
    "Laptops": [
        ("Alienware m18 R2 Gaming Laptop", "Unleash raw power with Intel Core i9 and RTX 4090 graphics.", 2499.99),
        ("Alienware x16 R2 Thin Laptop", "Premium design, ultimate portability, high-refresh rate screen.", 1999.99),
        ("Alienware m16 R2 Gaming Rig", "The sweet spot of performance and thermal efficiency.", 1499.99),
        ("Nebula Voyager 15", "Compact form factor with custom vapor chamber cooling.", 1299.99),
    ],
    "Desktops": [
        ("Alienware Aurora R16 Desktop", "Redesigned chassis, quiet operation, liquid cooled performance.", 1899.99),
        ("Area-51 Threadripper Extreme", "Multi-threaded behemoth built for rendering and gaming.", 3499.99),
        ("Apex Battle Station X", "Custom hardline liquid loop, vertical GPU mount, full RGB.", 2999.99),
        ("Sentinel Mini-ITX Desktop", "Huge gaming capabilities packed into a ultra-compact chassis.", 1199.99),
    ],
    "Monitors": [
        ("Alienware 34 Curved QD-OLED Monitor", "Quantum Dot meets OLED. Infinite contrast, 175Hz refresh.", 899.99),
        ("Alienware 27 360Hz Gaming Monitor", "Fast IPS panel built for esports and zero motion blur.", 499.99),
        ("Horizon Ultra-Wide 38", "Panoramic view with HDR 600 and ambient backlighting.", 799.99),
    ],
    "Peripherals": [
        ("Alienware Pro Wireless Keyboard", "Linear mechanical switches, hot-swappable, 75% form factor.", 149.99),
        ("Alienware Pro Wireless Mouse", "Ultra-lightweight 58g body, optical switches, 8K polling.", 99.99),
        ("Tri-Mode Wireless Gaming Headset", "Active noise cancellation, spatial audio, up to 50hr battery.", 179.99),
        ("Horizon Mechanical Keypad", "Macro-pad designed for streamlined workflow and keybinds.", 79.99),
    ],
    "Accessories": [
        ("TactX Gaming Backpack", "Weather-resistant, dedicated compartments for 18-inch laptops.", 89.99),
        ("Horizon Travel Sleeve", "High-density foam padding with magnetic closure.", 39.99),
        ("Elite Mech Keycap Set", "Double-shot PBT keycaps with custom legend engraving.", 29.99),
        ("RGB Large Desk Mat", "Micro-woven fiber surface with 12 zone border RGB.", 34.99),
    ]
}

THEME_COLORS = [
    ("#2563EB", "#10B981", "#F59E0B"), # Blue, Green, Amber
    ("#E11D48", "#F59E0B", "#8B5CF6"), # Rose, Amber, Purple
    ("#059669", "#D97706", "#2563EB"), # Green, Orange, Blue
    ("#6366F1", "#10B981", "#F59E0B"), # Indigo, Emerald, Yellow
    ("#8B5CF6", "#EC4899", "#3B82F6"), # Purple, Pink, Blue
]

class Command(BaseCommand):
    help = "Seeds the e-commerce marketplace database with 50 shops, users, products, and random wallpapers"

    def handle(self, *args, **options):
        self.stdout.write("Scanning for wallpapers...")
        if not os.path.exists(WALLPAPER_DIR):
            self.stdout.write(self.style.ERROR(f"Directory not found: {WALLPAPER_DIR}"))
            return

        wallpapers = [
            os.path.join(WALLPAPER_DIR, f)
            for f in os.listdir(WALLPAPER_DIR)
            if f.lower().endswith((".png", ".jpg", ".jpeg", ".webp"))
        ]

        if not wallpapers:
            self.stdout.write(self.style.ERROR("No wallpaper images found in target directory."))
            return

        self.stdout.write(f"Found {len(wallpapers)} wallpapers to use.")

        with transaction.atomic():
            # 1. Create global categories
            categories = {}
            for name in PRODUCT_DATA.keys():
                cat, created = Category.objects.get_or_create(
                    name=name,
                    defaults={
                        "slug": slugify(name),
                        "description": f"Premium {name.lower()} catalog items."
                    }
                )
                categories[name] = cat

            self.stdout.write("Categories created/loaded.")

            # 2. Create 50 Users & 50 Shops
            for i in range(1, 51):
                email = f"seller{i}@example.com"
                username = f"seller_{i}"
                user, created = User.objects.get_or_create(
                    email=email,
                    defaults={
                        "username": username,
                        "first_name": random.choice(SHOP_ADJECTIVES),
                        "last_name": random.choice(SHOP_NOUNS),
                        "is_active": True,
                    }
                )
                if created:
                    user.set_password("password123")
                    user.save()

                # Generate shop name
                shop_name = f"{random.choice(SHOP_ADJECTIVES)} {random.choice(SHOP_NOUNS)} {i}"
                shop_slug = slugify(shop_name)

                # Skip if shop already exists
                if Shop.objects.filter(slug=shop_slug).exists():
                    continue

                shop = Shop.objects.create(
                    owner=user,
                    name=shop_name,
                    slug=shop_slug,
                    tagline=f"Your premium destination for custom gaming {random.choice(['gear', 'rigs', 'setups'])}.",
                    description=f"Welcome to {shop_name}. We specialize in high-end, custom-engineered gaming peripherals, monitors, and laptops powered by premium components.",
                    status=Shop.Status.ACTIVE
                )

                # Apply random banner & logo from wallpapers
                random_logo_path = random.choice(wallpapers)
                random_banner_path = random.choice(wallpapers)

                with open(random_logo_path, "rb") as f_logo:
                    shop.logo.save(f"logo_{shop_slug}.jpeg", File(f_logo), save=False)
                with open(random_banner_path, "rb") as f_banner:
                    shop.banner.save(f"banner_{shop_slug}.jpeg", File(f_banner), save=False)
                shop.save()

                # Customize theme randomly
                theme, _ = ShopTheme.objects.get_or_create(shop=shop)
                colors = random.choice(THEME_COLORS)
                theme.primary_color = colors[0]
                theme.secondary_color = colors[1]
                theme.accent_color = colors[2]
                theme.border_radius = random.choice([4, 8, 12, 16])
                theme.button_style = random.choice(["solid", "outline"])
                theme.layout_style = random.choice(["modern", "minimal", "bold", "magazine"])
                theme.product_card_style = random.choice(["standard", "compact", "overlay", "detailed"])
                theme.save()

                # 3. Create products inside the shop
                # We add one product from each category to ensure a diverse catalog
                for cat_name, cat_obj in categories.items():
                    # Pick a product definition from that category
                    prod_info = random.choice(PRODUCT_DATA[cat_name])
                    prod_name = prod_info[0]
                    # Make product name unique per store
                    prod_name_unique = f"{prod_name} - {shop.name}"
                    prod_slug = slugify(prod_name_unique)

                    product = Product.objects.create(
                        shop=shop,
                        category=cat_obj,
                        name=prod_name_unique,
                        slug=prod_slug,
                        description=prod_info[1],
                        base_price=prod_info[2],
                        compare_at_price=round(prod_info[2] * random.choice([1.10, 1.15, 1.20]), 2),
                        status=Product.Status.ACTIVE,
                        is_featured=random.choice([True, False])
                    )

                    # Create variant and inventory
                    variant = ProductVariant.objects.create(
                        product=product,
                        price=product.base_price,
                        is_default=True,
                        name="Standard Edition",
                        is_active=True
                    )

                    Inventory.objects.create(
                        variant=variant,
                        quantity=random.randint(10, 150),
                        track_inventory=True
                    )

                    # Add 1 to 2 product images
                    for img_idx in range(1, random.randint(2, 3)):
                        prod_img_path = random.choice(wallpapers)
                        prod_image_obj = ProductImage(
                            product=product,
                            variant=variant,
                            position=img_idx,
                            is_processed=True
                        )
                        with open(prod_img_path, "rb") as f_prod:
                            prod_image_obj.image.save(f"prod_{product.slug}_{img_idx}.jpeg", File(f_prod), save=False)
                        prod_image_obj.save()

                self.stdout.write(self.style.SUCCESS(f"Shop '{shop.name}' and its products seeded successfully."))

        self.stdout.write(self.style.SUCCESS("Marketplace database fully seeded with 50 shops and products!"))

"""
Data migration: seed the default subscription plans.

Runs automatically on ``migrate`` so a fresh install already has the standard
plan set (Free, Starter, Growth, Business, Enterprise) — no manual seeding
step required. You can freely edit prices/limits or add new plans afterwards
in the Django admin; this migration only ever *creates* missing plans (keyed on
the stable ``code``) and never overwrites or deletes what's already there.

Plan          Price    Shops       Products
Free          0        1           5
Starter       3,000    2           50
Growth        7,500    5           200
Business      15,000   Unlimited   1,000
Enterprise    30,000   Unlimited   Unlimited
"""
from decimal import Decimal

from django.db import migrations

# ``None`` limits mean unlimited. Kept self-contained (no app imports) so the
# migration remains stable even if the model/command evolve later.
DEFAULT_PLANS = [
    {
        "code": "free",
        "name": "Free",
        "description": "Get started and list a handful of products at no cost.",
        "monthly_price": Decimal("0"),
        "max_shops": 1,
        "max_products": 5,
        "custom_domain_enabled": False,
        "analytics_enabled": False,
        "staff_accounts_enabled": False,
        "priority_support_enabled": False,
        "is_enterprise": False,
        "display_order": 1,
    },
    {
        "code": "starter",
        "name": "Starter",
        "description": "For growing sellers who need more room to list.",
        "monthly_price": Decimal("3000"),
        "max_shops": 2,
        "max_products": 50,
        "custom_domain_enabled": False,
        "analytics_enabled": False,
        "staff_accounts_enabled": False,
        "priority_support_enabled": False,
        "is_enterprise": False,
        "display_order": 2,
    },
    {
        "code": "growth",
        "name": "Growth",
        "description": "Scale up with a custom domain and basic analytics.",
        "monthly_price": Decimal("7500"),
        "max_shops": 5,
        "max_products": 200,
        "custom_domain_enabled": True,
        "analytics_enabled": True,
        "staff_accounts_enabled": False,
        "priority_support_enabled": False,
        "is_enterprise": False,
        "display_order": 3,
    },
    {
        "code": "business",
        "name": "Business",
        "description": "Unlimited shops, staff accounts, advanced analytics, "
                       "and priority support.",
        "monthly_price": Decimal("15000"),
        "max_shops": None,          # unlimited
        "max_products": 1000,
        "custom_domain_enabled": True,
        "analytics_enabled": True,
        "staff_accounts_enabled": True,
        "priority_support_enabled": True,
        "is_enterprise": False,
        "display_order": 4,
    },
    {
        "code": "enterprise",
        "name": "Enterprise",
        "description": "Custom pricing with everything unlocked. Contact sales.",
        "monthly_price": Decimal("30000"),   # from / starting price; quoted per deal
        "max_shops": None,               # unlimited
        "max_products": None,            # unlimited
        "custom_domain_enabled": True,
        "analytics_enabled": True,
        "staff_accounts_enabled": True,
        "priority_support_enabled": True,
        "is_enterprise": True,
        "display_order": 5,
    },
]


def seed_plans(apps, schema_editor):
    SubscriptionPlan = apps.get_model("subscriptions", "SubscriptionPlan")
    for spec in DEFAULT_PLANS:
        # get_or_create (not update_or_create) so we never overwrite edits an
        # admin has made to an existing plan on a re-run/rollback-forward.
        SubscriptionPlan.objects.get_or_create(
            code=spec["code"],
            defaults={**spec, "currency": "NGN", "is_active": True},
        )


def unseed_plans(apps, schema_editor):
    """Reverse: remove only the plans we seeded, and only if unused.

    We avoid deleting plans that have subscriptions attached so history is
    never destroyed by a rollback.
    """
    SubscriptionPlan = apps.get_model("subscriptions", "SubscriptionPlan")
    codes = [p["code"] for p in DEFAULT_PLANS]
    (
        SubscriptionPlan.objects
        .filter(code__in=codes, subscriptions__isnull=True)
        .delete()
    )


class Migration(migrations.Migration):

    dependencies = [
        ("subscriptions", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(seed_plans, unseed_plans),
    ]

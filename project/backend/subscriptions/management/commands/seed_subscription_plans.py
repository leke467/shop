"""
Seed / update the marketplace subscription plans.

Idempotent: keyed on the stable ``code`` field, so running it repeatedly
updates existing plans in place rather than creating duplicates. Adding a new
plan is a matter of adding a dict here (or creating one in the admin) — no
other code changes are needed anywhere in the system.

Usage::

    python manage.py seed_subscription_plans
"""
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction

from subscriptions.models import SubscriptionPlan

# ``None`` limits mean unlimited.
PLANS = [
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
        "monthly_price": Decimal("0"),   # custom / quoted
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


class Command(BaseCommand):
    help = "Seed or update the 5 default subscription plans (idempotent)."

    @transaction.atomic
    def handle(self, *args, **options):
        created, updated = 0, 0
        for spec in PLANS:
            code = spec["code"]
            obj, was_created = SubscriptionPlan.objects.update_or_create(
                code=code,
                defaults={**spec, "currency": "NGN", "is_active": True},
            )
            if was_created:
                created += 1
                self.stdout.write(self.style.SUCCESS(f"Created plan: {obj.name}"))
            else:
                updated += 1
                self.stdout.write(f"Updated plan: {obj.name}")

        self.stdout.write(self.style.SUCCESS(
            f"Done. {created} created, {updated} updated."
        ))

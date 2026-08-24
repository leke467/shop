import logging
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from subscriptions.models import UserSubscription
from core.emails import send_subscription_expiring_email

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Dispatches subscription expiry reminder emails for plans ending in 3 days or 1 day."

    def handle(self, *args, **options):
        now = timezone.now()
        sent_count = 0

        # Check 3 days threshold (between 2.5 and 3.5 days from now)
        target_3d_start = now + timedelta(days=2, hours=12)
        target_3d_end = now + timedelta(days=3, hours=12)

        # Check 1 day threshold (between 0.5 and 1.5 days from now)
        target_1d_start = now + timedelta(hours=12)
        target_1d_end = now + timedelta(days=1, hours=12)

        subs_3d = UserSubscription.objects.filter(
            status=UserSubscription.Status.ACTIVE,
            end_date__gte=target_3d_start,
            end_date__lte=target_3d_end,
        ).select_related("user", "plan")

        for sub in subs_3d:
            if not sub.plan.is_free and sub.user and sub.user.email:
                send_subscription_expiring_email(sub.user, sub.plan, sub, days_left=3)
                sent_count += 1
                self.stdout.write(self.style.SUCCESS(f"Sent 3-day reminder to {sub.user.email}"))

        subs_1d = UserSubscription.objects.filter(
            status=UserSubscription.Status.ACTIVE,
            end_date__gte=target_1d_start,
            end_date__lte=target_1d_end,
        ).select_related("user", "plan")

        for sub in subs_1d:
            if not sub.plan.is_free and sub.user and sub.user.email:
                send_subscription_expiring_email(sub.user, sub.plan, sub, days_left=1)
                sent_count += 1
                self.stdout.write(self.style.SUCCESS(f"Sent 1-day reminder to {sub.user.email}"))

        self.stdout.write(self.style.SUCCESS(f"Finished. Total reminders dispatched: {sent_count}"))

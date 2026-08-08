import logging
from datetime import timedelta
from django.utils import timezone
from celery import shared_task
from orders.models import Cart

logger = logging.getLogger(__name__)

@shared_task
def send_abandoned_cart_reminder(cart_id):
    """
    Sends a reminder for an abandoned cart.
    Implementation for sending the actual reminder (e.g., email or SMS) should go here.
    """
    logger.info(f"Sending abandoned cart reminder for cart_id={cart_id}")
    pass

@shared_task
def detect_abandoned_carts():
    """
    Finds carts with items older than 24 hours where the user hasn't completed checkout.
    Triggers send_abandoned_cart_reminder for each abandoned cart.
    """
    cutoff_time = timezone.now() - timedelta(hours=24)
    
    # Find carts updated before cutoff that have items
    abandoned_carts = Cart.objects.filter(
        updated_at__lte=cutoff_time,
        items__isnull=False
    ).distinct()
    
    count = 0
    for cart in abandoned_carts:
        send_abandoned_cart_reminder.delay(cart.id)
        count += 1
        
    logger.info(f"Triggered reminders for {count} abandoned carts")
    return f"Triggered reminders for {count} abandoned carts"

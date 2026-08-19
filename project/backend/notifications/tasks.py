"""
Celery tasks for all transactional email notifications.

When Celery is running these execute asynchronously; when
CELERY_TASK_ALWAYS_EAGER=True (local dev) they run inline.

Each task wraps EmailService.send_email() which itself is fail-safe,
so task failures are logged but never crash the caller.
"""
import logging

from celery import shared_task

from .services import EmailService, SMSService

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# 1. Welcome / Registration
# ---------------------------------------------------------------------------

@shared_task(bind=True, max_retries=2, default_retry_delay=30)
def send_welcome_email(self, user_email, context):
    """Sent on successful user registration."""
    try:
        EmailService.send_email(
            "Welcome to MultiShop! 🎉",
            "notifications/email/welcome.html",
            context,
            [user_email],
        )
    except Exception as exc:
        logger.error("send_welcome_email failed: %s", exc)
        self.retry(exc=exc)


# ---------------------------------------------------------------------------
# 2. Order Confirmation (Buyer)
# ---------------------------------------------------------------------------

@shared_task(bind=True, max_retries=2, default_retry_delay=30)
def send_order_confirmation_email(self, user_email, context):
    """Sent to buyer after successful order placement / payment."""
    try:
        order_id = context.get("order_id", "")
        EmailService.send_email(
            f"Order Confirmed — #{order_id} 🧾",
            "notifications/email/order_confirmation.html",
            context,
            [user_email],
        )
    except Exception as exc:
        logger.error("send_order_confirmation_email failed: %s", exc)
        self.retry(exc=exc)


# ---------------------------------------------------------------------------
# 3. New Order Alert (Seller)
# ---------------------------------------------------------------------------

@shared_task(bind=True, max_retries=2, default_retry_delay=30)
def send_new_order_alert_to_seller(self, seller_email, context):
    """Sent to shop owner when a new order is placed in their store."""
    try:
        EmailService.send_email(
            f"💰 New Order in {context.get('shop_name', 'your store')}!",
            "notifications/email/new_order_alert.html",
            context,
            [seller_email],
        )
    except Exception as exc:
        logger.error("send_new_order_alert_to_seller failed: %s", exc)
        self.retry(exc=exc)


# ---------------------------------------------------------------------------
# 4. Shipping / Fulfilment Update
# ---------------------------------------------------------------------------

@shared_task(bind=True, max_retries=2, default_retry_delay=30)
def send_shipping_update_email(self, user_email, context):
    """Sent when a seller updates the fulfilment status of an order."""
    try:
        status_label = context.get("status", "updated").replace("_", " ").title()
        EmailService.send_email(
            f"📦 Order #{context.get('order_id', '')} — {status_label}",
            "notifications/email/shipping_update.html",
            context,
            [user_email],
        )
    except Exception as exc:
        logger.error("send_shipping_update_email failed: %s", exc)
        self.retry(exc=exc)


# ---------------------------------------------------------------------------
# 5. Subscription Activation / Upgrade
# ---------------------------------------------------------------------------

@shared_task(bind=True, max_retries=2, default_retry_delay=30)
def send_subscription_success_email(self, user_email, context):
    """Sent when a seller's subscription plan is activated or upgraded."""
    try:
        plan_name = context.get("plan_name", "Plan")
        EmailService.send_email(
            f"✨ Your {plan_name} Plan is Active!",
            "notifications/email/subscription_success.html",
            context,
            [user_email],
        )
    except Exception as exc:
        logger.error("send_subscription_success_email failed: %s", exc)
        self.retry(exc=exc)


# ---------------------------------------------------------------------------
# 6. Withdrawal / Payout Requested
# ---------------------------------------------------------------------------

@shared_task(bind=True, max_retries=2, default_retry_delay=30)
def send_withdrawal_request_email(self, user_email, context):
    """Sent when a seller requests a payout from their wallet."""
    try:
        EmailService.send_email(
            f"💸 Payout Request — ₦{context.get('amount', '0')}",
            "notifications/email/withdrawal_request.html",
            context,
            [user_email],
        )
    except Exception as exc:
        logger.error("send_withdrawal_request_email failed: %s", exc)
        self.retry(exc=exc)


# ---------------------------------------------------------------------------
# 7. Withdrawal / Payout Completed
# ---------------------------------------------------------------------------

@shared_task(bind=True, max_retries=2, default_retry_delay=30)
def send_withdrawal_completed_email(self, user_email, context):
    """Sent when a seller's payout has been disbursed to their bank."""
    try:
        EmailService.send_email(
            f"✅ Payout Complete — ₦{context.get('amount', '0')}",
            "notifications/email/withdrawal_completed.html",
            context,
            [user_email],
        )
    except Exception as exc:
        logger.error("send_withdrawal_completed_email failed: %s", exc)
        self.retry(exc=exc)


# ---------------------------------------------------------------------------
# 8. New Message Notification
# ---------------------------------------------------------------------------

@shared_task(bind=True, max_retries=2, default_retry_delay=30)
def send_new_message_email(self, user_email, context):
    """Sent when a user receives a new message in a conversation."""
    try:
        sender = context.get("sender_name", "Someone")
        EmailService.send_email(
            f"💬 New message from {sender}",
            "notifications/email/new_message.html",
            context,
            [user_email],
        )
    except Exception as exc:
        logger.error("send_new_message_email failed: %s", exc)
        self.retry(exc=exc)


# ---------------------------------------------------------------------------
# 9. Low Stock Alert
# ---------------------------------------------------------------------------

@shared_task(bind=True, max_retries=2, default_retry_delay=30)
def send_low_stock_alert(self, seller_email, context):
    """Sent when a product's inventory drops below the alert threshold."""
    try:
        product = context.get("product_name", "a product")
        EmailService.send_email(
            f"⚠️ Low Stock Alert — {product}",
            "notifications/email/low_stock_alert.html",
            context,
            [seller_email],
        )
    except Exception as exc:
        logger.error("send_low_stock_alert failed: %s", exc)
        self.retry(exc=exc)


# ---------------------------------------------------------------------------
# 10. Password Reset
# ---------------------------------------------------------------------------

@shared_task(bind=True, max_retries=2, default_retry_delay=30)
def send_password_reset_email(self, user_email, context):
    """Sent when a user requests a password reset."""
    try:
        EmailService.send_email(
            "🔐 Reset Your Password — MultiShop",
            "notifications/email/password_reset.html",
            context,
            [user_email],
        )
    except Exception as exc:
        logger.error("send_password_reset_email failed: %s", exc)
        self.retry(exc=exc)


# ---------------------------------------------------------------------------
# 11. Payment Receipt (legacy compatibility)
# ---------------------------------------------------------------------------

@shared_task(bind=True, max_retries=2, default_retry_delay=30)
def send_payment_receipt_email(self, user_email, context):
    """Sent as a standalone payment receipt (when not part of order flow)."""
    try:
        EmailService.send_email(
            "Payment Receipt — MultiShop",
            "notifications/email/payment_receipt.html",
            context,
            [user_email],
        )
    except Exception as exc:
        logger.error("send_payment_receipt_email failed: %s", exc)
        self.retry(exc=exc)


# ---------------------------------------------------------------------------
# 12. Abandoned Cart Reminder (legacy compatibility)
# ---------------------------------------------------------------------------

@shared_task(bind=True, max_retries=2, default_retry_delay=30)
def send_abandoned_cart_reminder(self, user_email, context):
    """Sent when a cart has been abandoned for a configurable period."""
    try:
        EmailService.send_email(
            "You left something behind! 🛒",
            "notifications/email/abandoned_cart.html",
            context,
            [user_email],
        )
    except Exception as exc:
        logger.error("send_abandoned_cart_reminder failed: %s", exc)
        self.retry(exc=exc)


# ---------------------------------------------------------------------------
# SMS
# ---------------------------------------------------------------------------

@shared_task
def send_sms_notification(phone_number, message):
    """Send an SMS via Termii."""
    SMSService.send_sms(phone_number, message)

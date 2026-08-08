from celery import shared_task
from .services import EmailService, SMSService

@shared_task
def send_order_confirmation_email(user_email, context):
    EmailService.send_email(
        "Order Confirmation",
        "notifications/email/order_confirmation.html",
        context,
        [user_email]
    )

@shared_task
def send_shipping_update_email(user_email, context):
    EmailService.send_email(
        "Shipping Update",
        "notifications/email/shipping_update.html",
        context,
        [user_email]
    )

@shared_task
def send_payment_receipt_email(user_email, context):
    EmailService.send_email(
        "Payment Receipt",
        "notifications/email/payment_receipt.html",
        context,
        [user_email]
    )

@shared_task
def send_welcome_email(user_email, context):
    EmailService.send_email(
        "Welcome to Our Marketplace!",
        "notifications/email/welcome.html",
        context,
        [user_email]
    )

@shared_task
def send_low_stock_alert(seller_email, context):
    EmailService.send_email(
        "Low Stock Alert",
        "notifications/email/low_stock_alert.html",
        context,
        [seller_email]
    )

@shared_task
def send_new_order_alert_to_seller(seller_email, context):
    EmailService.send_email(
        "New Order Alert",
        "notifications/email/new_order_alert.html",
        context,
        [seller_email]
    )

@shared_task
def send_abandoned_cart_reminder(user_email, context):
    EmailService.send_email(
        "You left something behind!",
        "notifications/email/abandoned_cart.html",
        context,
        [user_email]
    )

@shared_task
def send_sms_notification(phone_number, message):
    SMSService.send_sms(phone_number, message)

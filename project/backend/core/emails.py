import logging
from django.core.mail import send_mail
from django.conf import settings

logger = logging.getLogger(__name__)

DEFAULT_FROM_EMAIL = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@multishop.local')

def send_order_placed_buyer_email(order, order_groups):
    """
    Send receipt and delivery codes to the buyer.
    """
    subject = f"Your Order #{order.public_id} is Confirmed"
    
    body_lines = [
        f"Hi {order.customer_name or 'there'},",
        "",
        f"Thank you for your order #{order.public_id}!",
        "",
        "Here are your delivery codes. Only share these with the seller AFTER you receive the item:",
    ]
    
    for og in order_groups:
        body_lines.append(f"- Shop: {og.shop.name} | Code: {og.delivery_code}")
    
    body_lines.extend([
        "",
        "If you have any issues, you can open a dispute from your dashboard.",
        "Thanks,",
        "The Multishop Team"
    ])
    
    body = "\n".join(body_lines)
    
    try:
        send_mail(
            subject,
            body,
            DEFAULT_FROM_EMAIL,
            [order.customer_email],
            fail_silently=False,
        )
    except Exception as e:
        logger.error(f"Failed to send buyer order email: {e}")

def send_order_placed_seller_email(order_group):
    """
    Notify seller of a new order.
    """
    shop = order_group.shop
    if not shop.owner:
        return
        
    subject = f"New Order Received: #{order_group.order.public_id}"
    body = (
        f"Hello {shop.owner.first_name},\n\n"
        f"You have received a new order for {shop.name}!\n"
        f"Order ID: {order_group.order.public_id}\n"
        f"Total: {order_group.total}\n\n"
        f"Please check your seller dashboard for details and arrange delivery.\n\n"
        f"Thanks,\nThe Multishop Team"
    )
    
    try:
        send_mail(
            subject,
            body,
            DEFAULT_FROM_EMAIL,
            [shop.owner.email],
            fail_silently=False,
        )
    except Exception as e:
        logger.error(f"Failed to send seller order email: {e}")

def send_escrow_released_email(order_group, amount_released):
    """
    Notify seller that escrow funds have been released to their wallet.
    
    """
    shop = order_group.shop
    if not shop.owner:
        return
        
    subject = f"Funds Released for Order #{order_group.order.public_id}"
    body = (
        f"Hello {shop.owner.first_name},\n\n"
        f"The delivery code was successfully confirmed for order #{order_group.order.public_id}.\n"
        f"An amount of {amount_released} has been credited to your wallet.\n\n"
        f"Thanks,\nThe Multishop Team"
    )
    
    try:
        send_mail(
            subject,
            body,
            DEFAULT_FROM_EMAIL,
            [shop.owner.email],
            fail_silently=False,
        )
    except Exception as e:
        logger.error(f"Failed to send escrow release email: {e}")

def send_dispute_opened_email(order_group, reason):
    """
    Notify seller and admin that a dispute was opened.
    """
    shop = order_group.shop
    if not shop.owner:
        return
        
    subject = f"URGENT: Dispute Opened for Order #{order_group.order.public_id}"
    body = (
        f"Hello {shop.owner.first_name},\n\n"
        f"The buyer has opened a dispute for order #{order_group.order.public_id}.\n"
        f"Reason provided: {reason}\n\n"
        f"The funds for this order have been frozen. Please contact the buyer or admin to resolve this.\n\n"
        f"Thanks,\nThe Multishop Team"
    )
    
    try:
        send_mail(
            subject,
            body,
            DEFAULT_FROM_EMAIL,
            [shop.owner.email],
            fail_silently=False,
        )
    except Exception as e:
        logger.error(f"Failed to send dispute email: {e}")

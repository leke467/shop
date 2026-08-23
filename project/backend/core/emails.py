import logging
from django.conf import settings
from notifications.services import EmailService

logger = logging.getLogger(__name__)

DEFAULT_FROM_EMAIL = getattr(settings, 'DEFAULT_FROM_EMAIL', 'support@multishopng.com')

def send_order_placed_buyer_email(order, order_groups):
    """
    Send receipt and delivery codes to the buyer via Brevo / EmailService.
    """
    subject = f"Your Order #{order.public_id} is Confirmed"
    buyer_name = order.shipping_full_name or (order.user.first_name if order.user else "") or "Customer"
    buyer_email = (order.user.email if order.user else "")
    if not buyer_email:
        return
    
    body_lines = [
        f"Hi {buyer_name},",
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
        "The MultiShopNG Team (multishopng.com)"
    ])
    
    body = "\n".join(body_lines)
    
    try:
        EmailService.send_raw_email(
            subject=subject,
            text_content=body,
            recipient_list=[buyer_email],
            from_email=DEFAULT_FROM_EMAIL,
        )
    except Exception as e:
        logger.error(f"Failed to send buyer order email: {e}")

def send_order_placed_seller_email(order_group):
    """
    Notify seller of a new order via Brevo / EmailService.
    """
    shop = order_group.shop
    if not shop.owner or not shop.owner.email:
        return
        
    subject = f"New Order Received: #{order_group.order.public_id}"
    seller_name = shop.owner.first_name or shop.owner.email.split("@")[0]
    body = (
        f"Hello {seller_name},\n\n"
        f"You have received a new order for {shop.name}!\n"
        f"Order ID: {order_group.order.public_id}\n"
        f"Total: NGN {order_group.total_price:,.2f}\n\n"
        f"Please check your seller dashboard for details and arrange delivery.\n\n"
        f"Thanks,\nThe Multishop Team"
    )
    
    try:
        EmailService.send_raw_email(
            subject=subject,
            text_content=body,
            recipient_list=[shop.owner.email],
            from_email=DEFAULT_FROM_EMAIL,
        )
    except Exception as e:
        logger.error(f"Failed to send seller order email: {e}")

def send_escrow_released_email(order_group, amount_released):
    """
    Notify seller that escrow funds have been released to their wallet via Brevo.
    """
    shop = order_group.shop
    if not shop.owner or not shop.owner.email:
        return
        
    subject = f"Funds Released for Order #{order_group.order.public_id}"
    seller_name = shop.owner.first_name or shop.owner.email.split("@")[0]
    body = (
        f"Hello {seller_name},\n\n"
        f"The delivery code was successfully confirmed for order #{order_group.order.public_id}.\n"
        f"An amount of NGN {amount_released} has been credited to your wallet.\n\n"
        f"Thanks,\nThe Multishop Team"
    )
    
    try:
        EmailService.send_raw_email(
            subject=subject,
            text_content=body,
            recipient_list=[shop.owner.email],
            from_email=DEFAULT_FROM_EMAIL,
        )
    except Exception as e:
        logger.error(f"Failed to send escrow release email: {e}")

def send_dispute_opened_email(order_group, reason):
    """
    Notify seller and admin that a dispute was opened via Brevo.
    """
    shop = order_group.shop
    if not shop.owner or not shop.owner.email:
        return
        
    subject = f"URGENT: Dispute Opened for Order #{order_group.order.public_id}"
    seller_name = shop.owner.first_name or shop.owner.email.split("@")[0]
    body = (
        f"Hello {seller_name},\n\n"
        f"The buyer has opened a dispute for order #{order_group.order.public_id}.\n"
        f"Reason provided: {reason}\n\n"
        f"The funds for this order have been frozen. Please contact the buyer or admin to resolve this.\n\n"
        f"Thanks,\nThe Multishop Team"
    )
    
    try:
        EmailService.send_raw_email(
            subject=subject,
            text_content=body,
            recipient_list=[shop.owner.email],
            from_email=DEFAULT_FROM_EMAIL,
        )
    except Exception as e:
        logger.error(f"Failed to send dispute email: {e}")

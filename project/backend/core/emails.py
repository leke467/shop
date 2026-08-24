import logging
from decimal import Decimal
from django.conf import settings
from notifications.services import EmailService

logger = logging.getLogger(__name__)

DEFAULT_FROM_EMAIL = getattr(settings, 'DEFAULT_FROM_EMAIL', 'multishopng@apexlabs.it.com')


def send_order_placed_buyer_email(order, order_groups):
    """
    Send receipt and escrow delivery codes to the buyer via Brevo / EmailService.
    Supports both registered users and guest checkout (shipping_email).
    """
    buyer_name = (
        getattr(order, "shipping_full_name", None)
        or (order.user.first_name if order.user else "")
        or "Valued Customer"
    )
    buyer_email = (
        getattr(order, "shipping_email", None)
        or (order.user.email if order.user else "")
    )
    if not buyer_email:
        logger.warning("No recipient email found for order #%s", order.public_id)
        return

    subject = f"Order Confirmed: #{order.public_id} — MultiShop Marketplace"

    # Build plain text lines
    body_lines = [
        f"Hi {buyer_name},",
        "",
        f"Thank you for shopping on MultiShop! Your order #{order.public_id} has been confirmed.",
        f"Total Paid: ₦{order.grand_total:,.2f}",
        f"Delivery Address: {order.shipping_line1 or order.shipping_city}, {order.shipping_state}",
        "",
        "🔒 ESCROW DELIVERY CODES:",
        "Your payment is safely held in MultiShop escrow. Only provide the 6-digit delivery code to the seller once you have physically received and inspected your items:",
        "",
    ]

    for og in order_groups:
        body_lines.append(f"• Shop: {og.shop.name} | Delivery Code: {og.delivery_code}")

    body_lines.extend([
        "",
        "You can track your order status anytime from your account or the store's order tracking page.",
        "",
        "Need help? Contact support@multishopng.com.",
        "The MultiShopNG Team",
    ])
    text_content = "\n".join(body_lines)

    # Build HTML content
    codes_html = "".join([
        f"""<div style="background:#F0FDF4;border:1.5px dashed #16A34A;padding:12px 16px;border-radius:10px;margin-bottom:10px;">
            <div style="font-size:13px;color:#166534;font-weight:bold;">Vendor: {og.shop.name}</div>
            <div style="font-size:22px;color:#15803D;font-weight:800;letter-spacing:4px;margin-top:4px;">{og.delivery_code}</div>
        </div>"""
        for og in order_groups
    ])

    html_content = f"""
    <div style="font-family:'Segoe UI',Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;background:#FFFFFF;border:1px solid #E2E8F0;border-radius:16px;overflow:hidden;color:#1E293B;">
        <div style="background:linear-gradient(135deg,#1E293B,#0F172A);padding:28px 24px;text-align:center;color:#FFFFFF;">
            <h1 style="margin:0;font-size:22px;font-weight:800;">MultiShop Marketplace</h1>
            <p style="margin:6px 0 0;font-size:14px;color:#94A3B8;">Order Confirmation & Receipt</p>
        </div>
        <div style="padding:28px 24px;">
            <h2 style="font-size:18px;margin-top:0;color:#0F172A;">Hello {buyer_name},</h2>
            <p style="font-size:14px;line-height:1.6;color:#475569;">
                Your order <strong>#{order.public_id}</strong> has been placed and payment successfully received.
            </p>
            <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:16px;margin:20px 0;">
                <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:14px;">
                    <span style="color:#64748B;">Total Amount:</span>
                    <strong style="color:#0F172A;font-size:16px;">₦{order.grand_total:,.2f}</strong>
                </div>
                <div style="display:flex;justify-content:space-between;font-size:13px;color:#64748B;">
                    <span>Delivery Location:</span>
                    <span style="color:#0F172A;font-weight:600;">{order.shipping_line1 or order.shipping_city}, {order.shipping_state}</span>
                </div>
            </div>

            <h3 style="font-size:15px;color:#0F172A;margin-bottom:8px;">🔒 Your Escrow Delivery Verification Codes</h3>
            <p style="font-size:13px;color:#64748B;line-height:1.5;margin-bottom:14px;">
                Funds are protected in escrow. Share this code with the dispatch rider or vendor <strong>ONLY after</strong> you have received your package:
            </p>
            {codes_html}

            <p style="font-size:13px;color:#94A3B8;margin-top:24px;border-top:1px solid #E2E8F0;padding-top:16px;text-align:center;">
                Thank you for shopping on MultiShop! If you have any inquiries, reply directly to this email.
            </p>
        </div>
    </div>
    """

    try:
        EmailService.send_raw_email(
            subject=subject,
            text_content=text_content,
            recipient_list=[buyer_email],
            html_content=html_content,
            from_email=DEFAULT_FROM_EMAIL,
        )
    except Exception as e:
        logger.error("Failed to send buyer order confirmation email: %s", e)


def send_order_placed_seller_email(order_group):
    """
    Notify seller of a new paid order in their shop.
    """
    shop = order_group.shop
    if not shop.owner or not shop.owner.email:
        return

    order = order_group.order
    seller_name = shop.owner.first_name or shop.owner.email.split("@")[0]
    subject = f"🛒 New Order Received: #{order.public_id} ({shop.name})"

    items = order_group.items.all()
    items_text = "\n".join([f"- {it.quantity}x {it.product_name} (₦{it.unit_price:,.2f})" for it in items])
    items_html = "".join([
        f"""<tr>
            <td style="padding:8px 12px;border-bottom:1px solid #E2E8F0;font-size:13px;">{it.product_name}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #E2E8F0;font-size:13px;text-align:center;">{it.quantity}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #E2E8F0;font-size:13px;text-align:right;">₦{(it.unit_price * it.quantity):,.2f}</td>
        </tr>"""
        for it in items
    ])

    text_content = (
        f"Hello {seller_name},\n\n"
        f"Congratulations! You have received a new paid order for {shop.name}.\n\n"
        f"Order ID: #{order.public_id}\n"
        f"Customer: {order.shipping_full_name} ({order.shipping_phone or order.shipping_phone_number})\n"
        f"Delivery Address: {order.shipping_line1}, {order.shipping_state}\n"
        f"Subtotal: ₦{order_group.subtotal:,.2f}\n"
        f"Shipping Fee: ₦{order_group.shipping_total:,.2f}\n\n"
        f"Items:\n{items_text}\n\n"
        f"Next Steps:\n"
        f"1. Package the items for delivery.\n"
        f"2. Ship to the customer's address.\n"
        f"3. Ask the customer for their 6-digit delivery code upon handoff and enter it in your Seller Dashboard to release funds instantly to your wallet.\n\n"
        f"MultiShop Marketplace"
    )

    html_content = f"""
    <div style="font-family:'Segoe UI',Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;background:#FFFFFF;border:1px solid #E2E8F0;border-radius:16px;overflow:hidden;color:#1E293B;">
        <div style="background:linear-gradient(135deg,#059669,#047857);padding:24px;text-align:center;color:#FFFFFF;">
            <h1 style="margin:0;font-size:22px;font-weight:800;">New Order Alert! 🎉</h1>
            <p style="margin:6px 0 0;font-size:14px;color:#D1FAE5;">{shop.name}</p>
        </div>
        <div style="padding:24px;">
            <p style="font-size:14px;color:#475569;margin-top:0;">Hello <strong>{seller_name}</strong>,</p>
            <p style="font-size:14px;color:#475569;">You have received a new order <strong>#{order.public_id}</strong>. Funds are secured in escrow.</p>

            <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:16px;margin:16px 0;font-size:13px;">
                <div style="margin-bottom:6px;"><strong>Customer:</strong> {order.shipping_full_name}</div>
                <div style="margin-bottom:6px;"><strong>Phone:</strong> {order.shipping_phone or order.shipping_phone_number}</div>
                <div><strong>Address:</strong> {order.shipping_line1}, {order.shipping_state}</div>
            </div>

            <table style="width:100%;border-collapse:collapse;margin:16px 0;">
                <thead>
                    <tr style="background:#F1F5F9;color:#475569;font-size:12px;text-transform:uppercase;">
                        <th style="padding:8px 12px;text-align:left;">Item</th>
                        <th style="padding:8px 12px;text-align:center;">Qty</th>
                        <th style="padding:8px 12px;text-align:right;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {items_html}
                </tbody>
            </table>

            <div style="background:#EFF6FF;border:1px solid #BFDBFE;padding:14px;border-radius:10px;font-size:13px;color:#1E40AF;line-height:1.5;">
                ⚡ <strong>Escrow Release:</strong> When delivering the order, ask the customer for their 6-digit delivery code and enter it in your Seller Dashboard to release funds directly to your wallet.
            </div>
        </div>
    </div>
    """

    try:
        EmailService.send_raw_email(
            subject=subject,
            text_content=text_content,
            recipient_list=[shop.owner.email],
            html_content=html_content,
            from_email=DEFAULT_FROM_EMAIL,
        )
    except Exception as e:
        logger.error("Failed to send seller order notification email: %s", e)


def send_subscription_success_email(user, plan, subscription):
    """
    Send confirmation email when a user subscribes or renews their MultiShop plan.
    """
    if not user or not user.email:
        return

    name = user.first_name or user.email.split("@")[0]
    subject = f"Plan Activated: {plan.name} Tier on MultiShop"
    expiry_str = subscription.end_date.strftime("%B %d, %Y") if subscription.end_date else "Lifetime / Active"

    text_content = (
        f"Hello {name},\n\n"
        f"Your subscription to the {plan.name} plan on MultiShop is now active!\n"
        f"Validity: Until {expiry_str}\n"
        f"Monthly Rate: ₦{plan.monthly_price:,.2f}\n\n"
        f"You now have access to premium store templates, custom branding, analytics, and elevated product limits.\n\n"
        f"Manage your store anytime at https://multishopng.com/dashboard\n\n"
        f"The MultiShopNG Team"
    )

    html_content = f"""
    <div style="font-family:'Segoe UI',Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;background:#FFFFFF;border:1px solid #E2E8F0;border-radius:16px;overflow:hidden;color:#1E293B;">
        <div style="background:linear-gradient(135deg,#6366F1,#4F46E5);padding:28px 24px;text-align:center;color:#FFFFFF;">
            <h1 style="margin:0;font-size:22px;font-weight:800;">Subscription Confirmed 🚀</h1>
            <p style="margin:6px 0 0;font-size:14px;color:#E0E7FF;">{plan.name} Tier Active</p>
        </div>
        <div style="padding:28px 24px;">
            <p style="font-size:15px;color:#334155;margin-top:0;">Hello <strong>{name}</strong>,</p>
            <p style="font-size:14px;line-height:1.6;color:#475569;">
                Your subscription to the <strong>{plan.name}</strong> plan is now active. All tier features and custom storefront templates have been unlocked for your stores.
            </p>
            <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:16px;margin:20px 0;font-size:14px;">
                <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
                    <span style="color:#64748B;">Plan Tier:</span>
                    <strong style="color:#0F172A;">{plan.name}</strong>
                </div>
                <div style="display:flex;justify-content:space-between;">
                    <span style="color:#64748B;">Valid Until:</span>
                    <strong style="color:#059669;">{expiry_str}</strong>
                </div>
            </div>
            <p style="text-align:center;margin-top:24px;">
                <a href="https://multishopng.com/dashboard" style="background:#4F46E5;color:#FFFFFF;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:bold;font-size:14px;display:inline-block;">Open Seller Dashboard →</a>
            </p>
        </div>
    </div>
    """

    try:
        EmailService.send_raw_email(
            subject=subject,
            text_content=text_content,
            recipient_list=[user.email],
            html_content=html_content,
            from_email=DEFAULT_FROM_EMAIL,
        )
    except Exception as e:
        logger.error("Failed to send subscription success email: %s", e)


def send_subscription_expiring_email(user, plan, subscription, days_left):
    """
    Send reminder email when a user's subscription is expiring soon.
    """
    if not user or not user.email:
        return

    name = user.first_name or user.email.split("@")[0]
    subject = f"Reminder: Your MultiShop {plan.name} Subscription Expires in {days_left} Days"
    expiry_str = subscription.end_date.strftime("%B %d, %Y") if subscription.end_date else "Soon"

    text_content = (
        f"Hello {name},\n\n"
        f"This is a quick reminder that your {plan.name} subscription on MultiShop will expire on {expiry_str} (in {days_left} days).\n\n"
        f"To avoid any interruption to your custom store templates or storefront listings, please renew your subscription before the expiry date.\n\n"
        f"Renew now: https://multishopng.com/pricing\n\n"
        f"The MultiShopNG Team"
    )

    html_content = f"""
    <div style="font-family:'Segoe UI',Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;background:#FFFFFF;border:1px solid #E2E8F0;border-radius:16px;overflow:hidden;color:#1E293B;">
        <div style="background:linear-gradient(135deg,#D97706,#B45309);padding:24px;text-align:center;color:#FFFFFF;">
            <h1 style="margin:0;font-size:22px;font-weight:800;">Subscription Expiry Notice ⏳</h1>
            <p style="margin:6px 0 0;font-size:14px;color:#FEF3C7;">Expires in {days_left} day(s)</p>
        </div>
        <div style="padding:24px;">
            <p style="font-size:14px;color:#475569;margin-top:0;">Hello <strong>{name}</strong>,</p>
            <p style="font-size:14px;line-height:1.6;color:#475569;">
                Your <strong>{plan.name}</strong> subscription on MultiShop will expire on <strong>{expiry_str}</strong>.
            </p>
            <p style="font-size:14px;line-height:1.6;color:#475569;">
                Renew your plan today to ensure uninterrupted service, keep your custom templates active, and retain all seller privileges.
            </p>
            <p style="text-align:center;margin-top:24px;">
                <a href="https://multishopng.com/pricing" style="background:#D97706;color:#FFFFFF;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:bold;font-size:14px;display:inline-block;">Renew Subscription →</a>
            </p>
        </div>
    </div>
    """

    try:
        EmailService.send_raw_email(
            subject=subject,
            text_content=text_content,
            recipient_list=[user.email],
            html_content=html_content,
            from_email=DEFAULT_FROM_EMAIL,
        )
    except Exception as e:
        logger.error("Failed to send subscription expiry reminder: %s", e)


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
        f"An amount of NGN {amount_released:,.2f} has been credited to your wallet.\n\n"
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
        logger.error("Failed to send escrow release email: %s", e)


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
        logger.error("Failed to send dispute email: %s", e)


"""
Script to verify rendering of all 11 email templates with sample context data.
"""
import os
import sys
import django

# Setup Django environment
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "ecommerce.settings.dev")
django.setup()

from django.template.loader import render_to_string
from django.utils.html import strip_tags

templates_to_test = [
    ("welcome.html", {
        "user_name": "Test Buyer",
        "site_url": "https://multishopng.com",
    }),
    ("order_confirmation.html", {
        "buyer_name": "John Doe",
        "order_id": "ORD-123456",
        "items": [
            {"product_name": "Premium Honey 500g", "variant_name": "Default", "quantity": 2, "line_total": "12,000.00"},
            {"product_name": "Spicy Chili Oil 250ml", "variant_name": "Extra Hot", "quantity": 1, "line_total": "4,500.00"},
        ],
        "total": "16,500.00",
        "delivery_code": "849201",
        "shipping_name": "John Doe",
        "shipping_address": "12 Allen Avenue, Ikeja, Lagos",
        "shipping_phone": "+234 801 234 5678",
        "site_url": "https://multishopng.com",
    }),
    ("new_order_alert.html", {
        "shop_name": "Bee & Spice Ltd",
        "order_id": "ORD-123456",
        "items": [
            {"product_name": "Premium Honey 500g", "quantity": 2, "line_total": "12,000.00"},
        ],
        "total": "12,000.00",
        "buyer_name": "John Doe",
        "buyer_email": "john@example.com",
        "shipping_address": "12 Allen Avenue, Ikeja, Lagos",
        "site_url": "https://multishopng.com",
    }),
    ("shipping_update.html", {
        "buyer_name": "John Doe",
        "order_id": "ORD-123456",
        "status": "shipped",
        "shop_name": "Bee & Spice Ltd",
        "tracking_number": "TRK-99887766",
        "delivery_code": "849201",
        "site_url": "https://multishopng.com",
    }),
    ("subscription_success.html", {
        "user_name": "Jane Smith",
        "plan_name": "Pro Merchant",
        "plan_price": "15,000",
        "billing_period": "month",
        "features": ["Unlimited Products", "Custom Domain", "0% Transaction Fee", "24/7 Priority Support"],
        "start_date": "August 19, 2026",
        "next_renewal_date": "September 19, 2026",
        "site_url": "https://multishopng.com",
    }),
    ("withdrawal_request.html", {
        "user_name": "Jane Smith",
        "shop_name": "Bee & Spice Ltd",
        "amount": "250,000.00",
        "bank_name": "Access Bank",
        "account_number": "1234",
        "reference": "WD-88776655",
        "status": "Processing",
        "site_url": "https://multishopng.com",
    }),
    ("withdrawal_completed.html", {
        "user_name": "Jane Smith",
        "shop_name": "Bee & Spice Ltd",
        "amount": "250,000.00",
        "bank_name": "Access Bank",
        "account_number": "1234",
        "reference": "WD-88776655",
        "site_url": "https://multishopng.com",
    }),
    ("new_message.html", {
        "recipient_name": "Jane Smith",
        "sender_name": "John Doe",
        "message_preview": "Hi, do you have bulk discounts for 20 jars of honey?",
        "conversation_subject": "Bulk Purchase Inquiry",
        "site_url": "https://multishopng.com",
    }),
    ("low_stock_alert.html", {
        "user_name": "Jane Smith",
        "shop_name": "Bee & Spice Ltd",
        "product_name": "Organic Honey Jam 250g",
        "current_stock": 2,
        "threshold": 5,
        "site_url": "https://multishopng.com",
    }),
    ("password_reset.html", {
        "user_name": "Test User",
        "reset_url": "https://multishopng.com/reset-password?uid=MQ&token=abc-123-xyz",
        "reset_token": "abc-123-xyz",
        "site_url": "https://multishopng.com",
    }),
]

print("Starting Email Template Verification...")
success_count = 0

for t_name, ctx in templates_to_test:
    path = f"notifications/email/{t_name}"
    try:
        html = render_to_string(path, ctx)
        plain = strip_tags(html)
        assert len(html) > 100, f"Rendered HTML too short for {t_name}"
        assert "MultiShop" in html, f"Missing brand in {t_name}"
        assert "ApexLabs" in html, f"Missing footer in {t_name}"
        print(f"  [OK] {t_name} rendered successfully ({len(html)} bytes html, {len(plain)} bytes text)")
        success_count += 1
    except Exception as e:
        print(f"  [FAIL] {t_name}: {e}")

print(f"\nResult: {success_count}/{len(templates_to_test)} email templates rendered cleanly!")

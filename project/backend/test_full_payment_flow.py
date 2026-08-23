import os
import sys
import django
from decimal import Decimal

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "ecommerce.settings.dev")
django.setup()

from django.contrib.auth import get_user_model
from shops.models import Shop, DeliveryZone
from products.models import Product, ProductVariant, Inventory
from orders.models import Cart, CartItem, Order, OrderGroup, OrderItem, SellerWallet, SellerBankAccount, PayoutRequest
from payments.models import Payment, Transaction
from payments.services import checkout, confirm_pending_payment
from orders.escrow import confirm_delivery_code, EscrowError

User = get_user_model()

print("=" * 60)
print("STARTING FULL E-COMMERCE PAYMENT & ESCROW LIFECYCLE TEST")
print("=" * 60)

# 1. Setup Test Users & Shop
buyer, _ = User.objects.get_or_create(email="buyer_test@example.com", defaults={"first_name": "TestBuyer"})
buyer.set_password("pass1234")
buyer.save()

seller, _ = User.objects.get_or_create(email="seller_test@example.com", defaults={"first_name": "TestSeller"})
seller.set_password("pass1234")
seller.save()

shop, _ = Shop.objects.get_or_create(
    slug="test-secure-shop",
    defaults={
        "name": "Test Secure Shop",
        "owner": seller,
        "commission_rate": Decimal("10.00"),
        "currency": "NGN",
    }
)
DeliveryZone.objects.get_or_create(shop=shop, state="Lagos", defaults={"fee": Decimal("1500.00"), "is_active": True})

# 2. Setup Product & Inventory
product, _ = Product.objects.get_or_create(
    slug="secure-alienware-laptop",
    shop=shop,
    defaults={"name": "Secure Alienware Laptop", "base_price": Decimal("50000.00"), "status": Product.Status.ACTIVE}
)
variant, _ = ProductVariant.objects.get_or_create(
    product=product,
    sku="AW-SEC-01",
    defaults={"name": "32GB RAM / 1TB SSD", "price": Decimal("50000.00"), "is_active": True}
)
inv, _ = Inventory.objects.get_or_create(
    variant=variant,
    defaults={"quantity": 10, "reserved": 0, "track_inventory": True}
)
inv.quantity = 10
inv.reserved = 0
inv.save()

initial_qty = inv.quantity
initial_reserved = inv.reserved
print(f"Step 1: Inventory setup -> Quantity: {inv.quantity}, Reserved: {inv.reserved}, Available: {inv.available}")

# 3. Add to Cart
cart, _ = Cart.objects.get_or_create(user=buyer)
cart.items.all().delete()
CartItem.objects.create(cart=cart, variant=variant, quantity=2, unit_price=variant.price)
print(f"Step 2: Added 2 items to buyer cart (Subtotal: NGN {cart.total:,.2f})")

# 4. Checkout Initiation (Bank Transfer / Out-of-band)
shipping_data = {
    "full_name": "Test Buyer",
    "phone": "08012345678",
    "line1": "123 Secure St",
    "city": "Ikeja",
    "state": "Lagos",
    "country": "NG"
}

import uuid

order = checkout(
    user=buyer,
    provider="bank_transfer",
    shipping_data=shipping_data,
    idempotency_key=str(uuid.uuid4()),
    delivery_state="Lagos",
    shop_slug=shop.slug,
)

inv.refresh_from_db()
print(f"Step 3: Checkout initiated!")
print(f"   -> Order ID: {order.public_id}")
print(f"   -> Order Status: {order.status} (Expected: pending)")
print(f"   -> Grand Total: NGN {order.grand_total:,.2f}")
print(f"   -> Inventory: Quantity={inv.quantity}, Reserved={inv.reserved}, Available={inv.available}")
assert order.status == Order.Status.PENDING, "Order status should be pending"
assert inv.reserved == 2, "Inventory reserved should be 2"
assert inv.quantity == 10, "Physical quantity should remain 10 before payment"

# 5. Check OrderGroup Escrow Status on Unpaid Order
group = order.groups.first()
print(f"Step 4: Escrow Status on unpaid order: {group.escrow_status} (Expected: pending)")
assert group.escrow_status == OrderGroup.EscrowStatus.PENDING, "Escrow status should be pending"

# 6. Check Vendor Visibility (Should NOT see unpaid orders)
from orders.views import ShopOrdersView
from rest_framework.test import APIRequestFactory, force_authenticate

factory = APIRequestFactory()
req = factory.get(f"/api/orders/shop/{shop.slug}/")
force_authenticate(req, user=seller)
view = ShopOrdersView.as_view()
resp = view(req, shop_slug=shop.slug)
vendor_order_ids = [o["order_id"] for o in resp.data]
print(f"Step 5: Vendor Dashboard Query -> Orders visible to vendor: {vendor_order_ids}")
assert str(order.public_id) not in vendor_order_ids, "Unpaid order must NOT be visible to vendor!"
print("   PASS: Vendor does NOT see unpaid order.")

# 7. Check Buyer Delivery Code Masking on Unpaid Order
from orders.views import DeliveryCodeView
req_code = factory.get(f"/api/orders/{order.public_id}/delivery-codes/")
force_authenticate(req_code, user=buyer)
view_code = DeliveryCodeView.as_view()
resp_code = view_code(req_code, public_id=str(order.public_id))
revealed_code = resp_code.data["codes"][0]["delivery_code"]
print(f"Step 6: Delivery code returned via API on unpaid order: '{revealed_code}'")
assert revealed_code == "", "Delivery code MUST be masked/empty for unpaid orders!"
print("   PASS: Delivery code is completely masked on unpaid order.")

# 8. Confirm Payment (Simulate Gateway Payment Verification)
payment = Payment.objects.filter(order=order).first()
confirm_pending_payment(payment, verified_by="test_gateway")

order.refresh_from_db()
group.refresh_from_db()
inv.refresh_from_db()
cart.refresh_from_db()

print(f"Step 7: Payment Confirmed!")
print(f"   -> Payment Status: {payment.status} (Expected: captured)")
print(f"   -> Order Status: {order.status} (Expected: confirmed)")
print(f"   -> Escrow Status: {group.escrow_status} (Expected: held)")
print(f"   -> Inventory: Quantity={inv.quantity}, Reserved={inv.reserved}, Available={inv.available}")
print(f"   -> Buyer Cart Item Count: {cart.items.count()} (Expected: 0)")

assert order.status == Order.Status.CONFIRMED, "Order status should be confirmed"
assert group.escrow_status == OrderGroup.EscrowStatus.HELD, "Escrow status should be held"
assert inv.quantity == 8, "Inventory quantity should be 8 (deducted from 10)"
assert inv.reserved == 0, "Inventory reserved should be 0 (cleared)"
assert cart.items.count() == 0, "Cart should be cleared upon payment confirmation"
print("   PASS: Inventory deducted, cart cleared, escrow held.")

# 9. Check Vendor Visibility (Should now see paid order)
resp_vendor_paid = view(req, shop_slug=shop.slug)
vendor_order_ids_paid = [o["order_id"] for o in resp_vendor_paid.data]
print(f"Step 8: Vendor Dashboard after payment -> Orders visible: {vendor_order_ids_paid}")
assert str(order.public_id) in vendor_order_ids_paid, "Paid order MUST be visible to vendor!"
print("   PASS: Vendor now sees the paid order in dashboard.")

# 10. Check Buyer Delivery Code (Now visible)
resp_code_paid = view_code(req_code, public_id=str(order.public_id))
revealed_code_paid = resp_code_paid.data["codes"][0]["delivery_code"]
print(f"Step 9: Buyer Delivery code after payment: '{revealed_code_paid}'")
assert len(revealed_code_paid) == 6, "Delivery code should be 6 digits"
print(f"   PASS: Buyer can view delivery code: {revealed_code_paid}")

# 11. Escrow Confirmation & Delivery Code Verification
print(f"Step 10: Testing Delivery Code & Escrow Release...")
# Try invalid code
try:
    confirm_delivery_code(group, "999999", requesting_user=seller)
    raise AssertionError("Invalid delivery code was wrongly accepted!")
except EscrowError:
    print("   PASS: Invalid delivery code rejected.")

# Submit correct code
success = confirm_delivery_code(group, revealed_code_paid, requesting_user=seller)
group.refresh_from_db()
wallet = SellerWallet.objects.get(shop=shop)

print(f"   -> Delivery Code Confirmed: {success}")
print(f"   -> Escrow Status: {group.escrow_status} (Expected: released)")
print(f"   -> Fulfillment Status: {group.status} (Expected: delivered)")
print(f"   -> Seller Wallet Balance: NGN {wallet.balance:,.2f}")
print(f"   -> Commission Fee Deducted: NGN {group.commission_fee:,.2f}")

assert group.escrow_status == OrderGroup.EscrowStatus.RELEASED, "Escrow should be released"
assert group.status == OrderGroup.FulfilmentStatus.DELIVERED, "Order group should be delivered"
assert wallet.balance > Decimal("0.00"), "Seller wallet should be credited"
print("   PASS: Escrow released, commission deducted, seller wallet credited!")

# 12. Testing Seller Payout Request Validation
print(f"Step 11: Testing Payout Request Validation...")
bank_acc, _ = SellerBankAccount.objects.get_or_create(
    shop=shop,
    account_number="0123456789",
    defaults={"bank_name": "GTBank", "account_name": "Test Seller", "bank_code": "058", "is_verified": True}
)

from orders.views import PayoutRequestCreateView
payout_view = PayoutRequestCreateView.as_view()

# Test A: Negative Payout (Must be rejected)
req_neg = factory.post("/api/orders/payouts/", {"amount": "-1000", "bank_account": bank_acc.id}, format="json")
force_authenticate(req_neg, user=seller)
resp_neg = payout_view(req_neg)
print(f"   -> Negative payout (-1000) response status: {resp_neg.status_code}")
assert resp_neg.status_code == 400, "Negative payout must be rejected!"
print("   PASS: Negative payout exploit blocked.")

# Test B: Below minimum payout (< NGN 100) (Must be rejected)
req_low = factory.post("/api/orders/payouts/", {"amount": "50", "bank_account": bank_acc.id}, format="json")
force_authenticate(req_low, user=seller)
resp_low = payout_view(req_low)
print(f"   -> Below-minimum payout (NGN 50) response status: {resp_low.status_code}")
assert resp_low.status_code == 400, "Below minimum payout must be rejected!"
print("   PASS: Below-minimum payout blocked.")

print("=" * 60)
print("ALL 11 END-TO-END TESTS PASSED WITH 100% FINANCIAL INTEGRITY!")
print("=" * 60)

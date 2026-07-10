import json
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken
from django.test import Client

client = Client()
client.defaults['HTTP_HOST'] = '127.0.0.1'
out = {}

# Shops list
r = client.get('/api/shops/')
try:
    shops = json.loads(r.content)
    out['shops_list'] = (r.status_code, len(shops))
except Exception:
    out['shops_list'] = (r.status_code, None)

# Shop detail for ID 3
r = client.get('/api/shops/3/')
out['shop3_status'] = r.status_code

# Products list
r = client.get('/api/products/')
try:
    products = json.loads(r.content)
    out['products_list'] = (r.status_code, len(products))
except Exception:
    out['products_list'] = (r.status_code, None)

pid = products[0]['id'] if products else None
if pid:
    r = client.get(f'/api/products/{pid}/')
    out['product_detail'] = (r.status_code, json.loads(r.content).get('id') if r.status_code == 200 else None)

# Anonymous create product (should be 401/403)
payload = {'shop': 3, 'name': 'anon product', 'description': 'x', 'price': '1.00'}
r = client.post('/api/products/', data=json.dumps(payload), content_type='application/json')
out['anon_create_product'] = r.status_code

# Ensure buyer user exists
buyer, created = User.objects.get_or_create(username='buyer1', defaults={'email': 'buyer1@example.com'})
if created:
    buyer.set_password('Password123!')
    buyer.save()
bt = str(RefreshToken.for_user(buyer).access_token)

# Buyer (non-owner) attempt to create product (should be 403)
r = client.post('/api/products/', data=json.dumps(payload), content_type='application/json', HTTP_AUTHORIZATION='Bearer ' + bt)
out['buyer_create_product'] = r.status_code

# Owner creates product (should be 201)
owner = User.objects.filter(username='shopowner1').first()
ot = str(RefreshToken.for_user(owner).access_token)
r = client.post('/api/products/', data=json.dumps({'shop': 3, 'name': 'owner product', 'description': 'x', 'price': '2.00'}), content_type='application/json', HTTP_AUTHORIZATION='Bearer ' + ot)
out['owner_create_product'] = r.status_code
try:
    j = json.loads(r.content)
    new_pid = j.get('id')
except Exception:
    new_pid = None

prod_id = pid or new_pid
if prod_id:
    # Create order as buyer
    order_payload = {'items': [{'product': prod_id, 'quantity': 1}], 'shipping_address': 'Test'}
    r = client.post('/api/orders/', data=json.dumps(order_payload), content_type='application/json', HTTP_AUTHORIZATION='Bearer ' + bt)
    out['create_order_status'] = r.status_code
    try:
        o = json.loads(r.content)
        out['create_order_id'] = o.get('id')
    except Exception:
        out['create_order_id'] = None

    # Fetch my orders
    r = client.get('/api/orders/my/', HTTP_AUTHORIZATION='Bearer ' + bt)
    try:
        mo = json.loads(r.content)
        out['my_orders'] = (r.status_code, len(mo))
    except Exception:
        out['my_orders'] = (r.status_code, None)

print(json.dumps(out))

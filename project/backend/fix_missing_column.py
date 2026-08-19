import os
import sys
import django

backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "ecommerce.settings.dev")
django.setup()

from django.db import connection

with connection.cursor() as cursor:
    try:
        cursor.execute("ALTER TABLE subscriptions_subscriptionplan ADD premium_templates_enabled BIT NOT NULL DEFAULT 0;")
        print("Successfully added column premium_templates_enabled!")
    except Exception as e:
        print("Column addition error or already exists:", e)

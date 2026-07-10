"""
Celery application.

Async work (transactional emails, image processing, recommendation refresh,
webhook post-processing) runs here so request/response latency stays low and
the platform can scale workers independently of web servers.
"""
from __future__ import annotations

import os

from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "ecommerce.settings.dev")

app = Celery("ecommerce")

# All Celery config lives in Django settings under the ``CELERY_`` namespace.
app.config_from_object("django.conf:settings", namespace="CELERY")

# Auto-discover tasks.py in every installed app.
app.autodiscover_tasks()


@app.task(bind=True, ignore_result=True)
def debug_task(self):  # pragma: no cover
    print(f"Request: {self.request!r}")

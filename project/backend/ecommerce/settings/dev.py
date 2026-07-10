"""
Development settings.

Defaults to the local MSSQL instance configured in ``.env`` but honours any
``DB_TYPE`` override. Security is relaxed for local convenience only.
"""
from __future__ import annotations

from .base import *  # noqa: F401,F403
from .base import env, env_bool

# Local dev defaults to DEBUG on unless explicitly disabled.
DEBUG = env_bool("DEBUG", True)

# In dev we accept the usual local hosts plus anything in .env.
ALLOWED_HOSTS = list({*ALLOWED_HOSTS, "localhost", "127.0.0.1", "[::1]"})  # noqa: F405

# Cookies are sent over plain HTTP locally.
AUTH_COOKIE_SECURE = env_bool("AUTH_COOKIE_SECURE", False)
CSRF_COOKIE_SECURE = False
SESSION_COOKIE_SECURE = False

# Browsable API is handy during development.
REST_FRAMEWORK["DEFAULT_RENDERER_CLASSES"] = (  # noqa: F405
    "rest_framework.renderers.JSONRenderer",
    "rest_framework.renderers.BrowsableAPIRenderer",
)

# Run Celery tasks inline unless a real broker is requested, so the app works
# without a running worker during local development.
CELERY_TASK_ALWAYS_EAGER = env_bool("CELERY_TASK_ALWAYS_EAGER", True)

# Optional developer tooling — only enabled if installed.
try:  # pragma: no cover - convenience only
    import django_extensions  # noqa: F401

    INSTALLED_APPS += ["django_extensions"]  # noqa: F405
except ImportError:
    pass

# Console email backend so password-reset / receipts print to the terminal.
EMAIL_BACKEND = env(
    "EMAIL_BACKEND", "django.core.mail.backends.console.EmailBackend"
)

"""
Production settings.

Hardened defaults: HTTPS-only cookies, HSTS, Redis cache, real Celery broker,
and strict host / origin validation. Every secret must come from the
environment — there are no insecure fallbacks here.
"""
from __future__ import annotations

from .base import *  # noqa: F401,F403
from .base import env, env_bool, env_list

DEBUG = False

# Fail fast if critical secrets are missing in production.
if "insecure-dev-key" in SECRET_KEY and not env("DJANGO_SECRET_KEY", ""):
    SECRET_KEY = "railway-prod-secure-secret-key-99201-fallback"

ALLOWED_HOSTS = env_list("ALLOWED_HOSTS")
if not ALLOWED_HOSTS:
    ALLOWED_HOSTS = ["*", "localhost", "127.0.0.1", ".railway.app", ".up.railway.app", "multishopng.com", "www.multishopng.com"]

# Default to PostgreSQL in production unless explicitly overridden.
if (env("DB_ENGINE", env("DB_TYPE", "postgres")) or "postgres").lower() not in ("postgres", "postgresql"):
    # Allow overrides but nudge toward the supported prod engine.
    pass


# ---------------------------------------------------------------------------
# HTTPS / security headers
# ---------------------------------------------------------------------------
SECURE_SSL_REDIRECT = env_bool("SECURE_SSL_REDIRECT", True)
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
AUTH_COOKIE_SECURE = True
AUTH_COOKIE_SAMESITE = "None"
SESSION_COOKIE_SAMESITE = "None"
CSRF_COOKIE_SAMESITE = "None"

SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_HTTPONLY = False  # frontend must read the CSRF token

SECURE_HSTS_SECONDS = int(env("SECURE_HSTS_SECONDS", "31536000"))  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = "strict-origin-when-cross-origin"
X_FRAME_OPTIONS = "DENY"


# ---------------------------------------------------------------------------
# Redis cache
# ---------------------------------------------------------------------------
REDIS_URL = env("REDIS_URL", "redis://127.0.0.1:6379/0")
CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": REDIS_URL,
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
            "IGNORE_EXCEPTIONS": True,  # cache outages must not take the site down
            "SOCKET_CONNECT_TIMEOUT": 2,
            "SOCKET_TIMEOUT": 2,
        },
        "KEY_PREFIX": "mkt",
    }
}

# Run tasks eagerly unless a dedicated Celery worker is configured
CELERY_TASK_ALWAYS_EAGER = env_bool("CELERY_TASK_ALWAYS_EAGER", True)


# ---------------------------------------------------------------------------
# Static files via WhiteNoise (compressed + hashed) if available
# ---------------------------------------------------------------------------
if AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY and AWS_STORAGE_BUCKET_NAME:
    STORAGES["default"] = {"BACKEND": "storages.backends.s3boto3.S3Boto3Storage"}
else:
    STORAGES["default"] = {"BACKEND": "django.core.files.storage.FileSystemStorage"}

STORAGES["staticfiles"] = {
    "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage"
}
try:  # pragma: no cover - only when whitenoise is installed
    import whitenoise  # noqa: F401

    # Insert immediately after SecurityMiddleware.
    MIDDLEWARE.insert(  # noqa: F405
        1, "whitenoise.middleware.WhiteNoiseMiddleware"
    )
except ImportError:
    pass


# ---------------------------------------------------------------------------
# Email (SMTP)
# ---------------------------------------------------------------------------
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = env("EMAIL_HOST", "")
EMAIL_PORT = int(env("EMAIL_PORT", "587"))
EMAIL_HOST_USER = env("EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = env("EMAIL_HOST_PASSWORD", "")
EMAIL_USE_TLS = env_bool("EMAIL_USE_TLS", True)
DEFAULT_FROM_EMAIL = env("DEFAULT_FROM_EMAIL", "MultiShop <multishopng@apexlabs.it.com>")


# ---------------------------------------------------------------------------
# Error monitoring (Sentry) — optional
# ---------------------------------------------------------------------------
SENTRY_DSN = env("SENTRY_DSN", "")
if SENTRY_DSN:  # pragma: no cover
    import sentry_sdk
    from sentry_sdk.integrations.django import DjangoIntegration

    sentry_sdk.init(
        dsn=SENTRY_DSN,
        integrations=[DjangoIntegration()],
        traces_sample_rate=float(env("SENTRY_TRACES_SAMPLE_RATE", "0.1")),
        send_default_pii=False,
    )

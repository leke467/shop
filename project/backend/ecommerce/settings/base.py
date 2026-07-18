"""
Base Django settings shared across every environment.

Environment-specific modules (``dev``, ``prod``) import ``*`` from here and
override what they need. Select the active module with the
``DJANGO_SETTINGS_MODULE`` environment variable, e.g.::

    DJANGO_SETTINGS_MODULE=ecommerce.settings.dev

Secrets and environment-specific values are read from the process environment
(optionally seeded from a local ``.env`` file that is never committed).
"""
from __future__ import annotations

import os
from datetime import timedelta
from pathlib import Path

from dotenv import load_dotenv

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
# settings/base.py -> settings/ -> ecommerce/ -> backend/
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Load .env from the backend root if present (local dev convenience only).
load_dotenv(BASE_DIR / ".env")


# ---------------------------------------------------------------------------
# Small env helpers
# ---------------------------------------------------------------------------
def env(key: str, default: str | None = None) -> str | None:
    return os.getenv(key, default)


def env_bool(key: str, default: bool = False) -> bool:
    return os.getenv(key, str(default)).strip().lower() in ("1", "true", "yes", "y", "on")


def env_list(key: str, default: str = "") -> list[str]:
    raw = os.getenv(key, default)
    return [item.strip() for item in raw.split(",") if item.strip()]


# ---------------------------------------------------------------------------
# Core security
# ---------------------------------------------------------------------------
SECRET_KEY = env("DJANGO_SECRET_KEY", "insecure-dev-key-change-me")
DEBUG = env_bool("DEBUG", False)
ALLOWED_HOSTS = env_list("ALLOWED_HOSTS", "localhost,127.0.0.1")


# ---------------------------------------------------------------------------
# Applications
# ---------------------------------------------------------------------------
DJANGO_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
]

THIRD_PARTY_APPS = [
    "rest_framework",
    # "rest_framework_simplejwt.token_blacklist",  # Enable on PostgreSQL (MSSQL migration bug)
    "corsheaders",
    "django_filters",
    "drf_spectacular",
    "mptt",
    "django_celery_beat",
    "django_celery_results",
]

LOCAL_APPS = [
    "core.apps.CoreConfig",
    "accounts.apps.AccountsConfig",
    "shops.apps.ShopsConfig",
    "products.apps.ProductsConfig",
    "orders.apps.OrdersConfig",
    "payments.apps.PaymentsConfig",
    "subscriptions.apps.SubscriptionsConfig",
    "search.apps.SearchConfig",

    "personalization.apps.PersonalizationConfig",
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS


# ---------------------------------------------------------------------------
# Middleware
# ---------------------------------------------------------------------------
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "ecommerce.urls"
WSGI_APPLICATION = "ecommerce.wsgi.application"
ASGI_APPLICATION = "ecommerce.asgi.application"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]


# ---------------------------------------------------------------------------
# Database
# ---------------------------------------------------------------------------
# Selected via DB_TYPE (sqlite | postgres | mssql). Environment modules may
# override DATABASES entirely if they need a fixed engine.
DB_TYPE = (env("DB_TYPE", "sqlite") or "sqlite").lower()

if DB_TYPE in ("sqlite", "sqlite3"):
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": env("DB_NAME", str(BASE_DIR / "db.sqlite3")),
        }
    }
elif DB_TYPE in ("postgres", "postgresql"):
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": env("DB_NAME", ""),
            "USER": env("DB_USER", ""),
            "PASSWORD": env("DB_PASSWORD", ""),
            "HOST": env("DB_HOST", "localhost"),
            "PORT": env("DB_PORT", "5432"),
            # Persistent connections reduce per-request connection overhead at scale.
            "CONN_MAX_AGE": int(env("DB_CONN_MAX_AGE", "60")),
            "CONN_HEALTH_CHECKS": True,
        }
    }
elif DB_TYPE == "mssql":
    _mssql_options = {"driver": env("DB_DRIVER", "ODBC Driver 17 for SQL Server")}
    if env_bool("DB_TRUST_SERVER_CERTIFICATE", False):
        _mssql_options["TrustServerCertificate"] = "yes"
    _mssql = {
        "ENGINE": "mssql",
        "NAME": env("DB_NAME", ""),
        "USER": env("DB_USER", ""),
        "PASSWORD": env("DB_PASSWORD", ""),
        "HOST": env("DB_HOST", "localhost"),
        "OPTIONS": _mssql_options,
    }
    if env("DB_PORT", ""):
        _mssql["PORT"] = env("DB_PORT")
    DATABASES = {"default": _mssql}
else:
    raise ValueError(f"Unsupported DB_TYPE: {DB_TYPE!r}")


# ---------------------------------------------------------------------------
# Authentication
# ---------------------------------------------------------------------------
AUTH_USER_MODEL = "accounts.User"

# Argon2 first (memory-hard, resistant to GPU cracking), PBKDF2 as fallback so
# existing hashes still verify and can be upgraded transparently on login.
PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.Argon2PasswordHasher",
    "django.contrib.auth.hashers.PBKDF2PasswordHasher",
    "django.contrib.auth.hashers.PBKDF2SHA1PasswordHasher",
    "django.contrib.auth.hashers.BCryptSHA256PasswordHasher",
]

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
        "OPTIONS": {"min_length": 10},
    },
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]


# ---------------------------------------------------------------------------
# Django REST Framework
# ---------------------------------------------------------------------------
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        # Reads the access token from an HttpOnly cookie (falls back to header).
        "accounts.authentication.CookieJWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticatedOrReadOnly",
    ),
    "DEFAULT_FILTER_BACKENDS": (
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ),
    "DEFAULT_PAGINATION_CLASS": "core.pagination.DefaultPagination",
    "PAGE_SIZE": 24,
    "DEFAULT_THROTTLE_CLASSES": (
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
        "core.throttles.ScopedThrottle",
    ),
    "DEFAULT_THROTTLE_RATES": {
        "anon": env("THROTTLE_ANON", "60/min"),
        "user": env("THROTTLE_USER", "240/min"),
        # Scoped throttles for sensitive endpoints (login, checkout, etc.).
        "auth": env("THROTTLE_AUTH", "10/min"),
        "checkout": env("THROTTLE_CHECKOUT", "20/min"),
    },
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "EXCEPTION_HANDLER": "core.exceptions.api_exception_handler",
}

SPECTACULAR_SETTINGS = {
    "TITLE": "Marketplace API",
    "DESCRIPTION": "Multi-vendor marketplace with per-shop customization, "
    "personalized discovery, and secure payments.",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
    "COMPONENT_SPLIT_REQUEST": True,
}


# ---------------------------------------------------------------------------
# JWT (Simple JWT) + cookie transport
# ---------------------------------------------------------------------------
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=int(env("ACCESS_TOKEN_MINUTES", "15"))),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=int(env("REFRESH_TOKEN_DAYS", "7"))),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "UPDATE_LAST_LOGIN": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
}

# Cookie names / attributes for the auth transport (see accounts.authentication).
AUTH_COOKIE_ACCESS = "access_token"
AUTH_COOKIE_REFRESH = "refresh_token"
AUTH_COOKIE_SECURE = env_bool("AUTH_COOKIE_SECURE", not DEBUG)
AUTH_COOKIE_SAMESITE = env("AUTH_COOKIE_SAMESITE", "Lax")
AUTH_COOKIE_DOMAIN = env("AUTH_COOKIE_DOMAIN", None)


# ---------------------------------------------------------------------------
# Caching (overridden per-environment: locmem in dev, Redis in prod)
# ---------------------------------------------------------------------------
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "marketplace-default",
    }
}


# ---------------------------------------------------------------------------
# Celery (async tasks: emails, image processing, recommendations)
# ---------------------------------------------------------------------------
CELERY_BROKER_URL = env("CELERY_BROKER_URL", "redis://127.0.0.1:6379/1")
CELERY_RESULT_BACKEND = env("CELERY_RESULT_BACKEND", "django-db")
CELERY_CACHE_BACKEND = "django-cache"
CELERY_TASK_ALWAYS_EAGER = env_bool("CELERY_TASK_ALWAYS_EAGER", False)
CELERY_TASK_EAGER_PROPAGATES = True
CELERY_TASK_ACKS_LATE = True
CELERY_TASK_REJECT_ON_WORKER_LOST = True
CELERY_WORKER_PREFETCH_MULTIPLIER = 1
CELERY_TASK_TIME_LIMIT = 300
CELERY_TASK_SOFT_TIME_LIMIT = 240
CELERY_BEAT_SCHEDULER = "django_celery_beat.schedulers:DatabaseScheduler"
CELERY_TIMEZONE = "UTC"

# Periodic tasks — can also be managed via Django admin (DatabaseScheduler).
CELERY_BEAT_SCHEDULE = {
    "refresh-recommendations-every-6h": {
        "task": "personalization.tasks.refresh_all_recommendations",
        "schedule": 6 * 3600,  # every 6 hours
    },
    "cleanup-old-events-daily": {
        "task": "personalization.tasks.cleanup_old_events",
        "schedule": 86400,  # once per day
        "kwargs": {"days": 90},
    },
    "process-unprocessed-images-30m": {
        "task": "products.tasks.process_all_unprocessed_images",
        "schedule": 1800,  # every 30 minutes
    },
}


# ---------------------------------------------------------------------------
# CORS / CSRF
# ---------------------------------------------------------------------------
CORS_ALLOWED_ORIGINS = env_list(
    "CORS_ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
)
CORS_ALLOW_CREDENTIALS = True
CSRF_TRUSTED_ORIGINS = env_list(
    "CSRF_TRUSTED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
)


# ---------------------------------------------------------------------------
# Internationalisation
# ---------------------------------------------------------------------------
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True


# ---------------------------------------------------------------------------
# Static & media
# ---------------------------------------------------------------------------
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# Maximum in-memory upload size before streaming to a temp file (2.5 MB default).
DATA_UPLOAD_MAX_MEMORY_SIZE = int(env("DATA_UPLOAD_MAX_MEMORY_SIZE", str(2621440)))
FILE_UPLOAD_MAX_MEMORY_SIZE = DATA_UPLOAD_MAX_MEMORY_SIZE

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


# ---------------------------------------------------------------------------
# Payments (provider-agnostic; keys resolved per environment)
# ---------------------------------------------------------------------------
PAYMENTS = {
    "DEFAULT_CURRENCY": env("PAYMENTS_DEFAULT_CURRENCY", "USD"),
    "STRIPE": {
        "SECRET_KEY": env("STRIPE_SECRET_KEY", ""),
        "PUBLISHABLE_KEY": env("STRIPE_PUBLISHABLE_KEY", ""),
        "WEBHOOK_SECRET": env("STRIPE_WEBHOOK_SECRET", ""),
    },
    "PAYSTACK": {
        "SECRET_KEY": env("PAYSTACK_SECRET_KEY", ""),
        "PUBLIC_KEY": env("PAYSTACK_PUBLIC_KEY", ""),
        "WEBHOOK_SECRET": env("PAYSTACK_WEBHOOK_SECRET", ""),
    },
}


# ---------------------------------------------------------------------------
# Logging (JSON-friendly, level configurable)
# ---------------------------------------------------------------------------
LOG_LEVEL = env("LOG_LEVEL", "INFO")
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "{levelname} {asctime} {name} {module}:{lineno} {message}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {"class": "logging.StreamHandler", "formatter": "verbose"},
    },
    "root": {"handlers": ["console"], "level": LOG_LEVEL},
    "loggers": {
        "django.request": {"handlers": ["console"], "level": "ERROR", "propagate": False},
        "payments": {"handlers": ["console"], "level": "INFO", "propagate": False},
    },
}

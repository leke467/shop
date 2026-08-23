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

from decimal import Decimal
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


def _bank_transfer_accounts() -> list[dict]:
    """
    Build the list of manual bank-transfer destination accounts from env.

    Reads indexed variables ``BANK_ACCOUNT_NUMBER_1``, ``BANK_NAME_1``,
    ``BANK_ACCOUNT_NAME_1`` (and _2, _3, …). An account is only included if it
    has an account number, so empty placeholders are skipped automatically.
    Falls back to legacy single-account vars (``BANK_ACCOUNT_NUMBER`` etc.).
    """
    accounts: list[dict] = []
    for i in range(1, 11):  # support up to 10 accounts
        number = env(f"BANK_ACCOUNT_NUMBER_{i}", "")
        if not number:
            continue
        accounts.append({
            "account_name": env(f"BANK_ACCOUNT_NAME_{i}", "Marketplace Escrow"),
            "account_number": number,
            "bank_name": env(f"BANK_NAME_{i}", ""),
        })

    # Legacy single-account fallback (pre multi-bank support).
    if not accounts:
        legacy_number = env("BANK_ACCOUNT_NUMBER", "")
        accounts.append({
            "account_name": env("BANK_ACCOUNT_NAME", "Marketplace Escrow"),
            "account_number": legacy_number,
            "bank_name": env("BANK_NAME", ""),
        })

    return accounts



# ---------------------------------------------------------------------------
# Core security
# ---------------------------------------------------------------------------
SECRET_KEY = env("DJANGO_SECRET_KEY", "multishopng-stable-production-secret-key-signing-2026-v1")
DEBUG = env_bool("DEBUG", False)
ALLOWED_HOSTS = env_list("ALLOWED_HOSTS", "localhost,127.0.0.1")
SECURE_CROSS_ORIGIN_OPENER_POLICY = "same-origin-allow-popups"


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

# ---------------------------------------------------------------------------
# Database Engine Resolution
# ---------------------------------------------------------------------------
# Prefer DB_ENGINE for parity with the example settings file, but keep DB_TYPE
# as a fallback so existing local env files continue to work.
DB_ENGINE = (env("DB_ENGINE", env("DB_TYPE", "sqlite")) or "sqlite").lower()

THIRD_PARTY_APPS = [
    "rest_framework",
    "corsheaders",
    "django_filters",
    "drf_spectacular",
    "mptt",
    "django_celery_beat",
    "django_celery_results",
    "storages",
]

# SimpleJWT token_blacklist has a known migration bug on MSSQL (mssql-django 0008_migrate_to_bigautofield).
# Enable it on PostgreSQL / SQLite (production & testing).
if DB_ENGINE != "mssql":
    THIRD_PARTY_APPS.append("rest_framework_simplejwt.token_blacklist")

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
    "notifications.apps.NotificationsConfig",
    "blog.apps.BlogConfig",
    "messaging.apps.MessagingConfig",
    "referrals.apps.ReferralsConfig",
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

FRONTEND_URL = env("FRONTEND_URL", "http://localhost:5173")


# ---------------------------------------------------------------------------
# Middleware
# ---------------------------------------------------------------------------
MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
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
# Database
# ---------------------------------------------------------------------------
try:
    import dj_database_url
except ImportError:
    dj_database_url = None

db_url = env("DATABASE_URL", env("POSTGRES_URL", env("DATABASE_PRIVATE_URL", "")))
if db_url and dj_database_url:
    DATABASES = {
        "default": dj_database_url.config(
            default=db_url,
            conn_max_age=int(env("DB_CONN_MAX_AGE", "60")),
            conn_health_checks=True,
        )
    }
elif db_url:
    from urllib.parse import urlparse
    url = urlparse(db_url)
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql" if "postgres" in url.scheme else "django.db.backends.sqlite3",
            "NAME": url.path.lstrip("/") or env("DB_NAME", "db.sqlite3"),
            "USER": url.username or "",
            "PASSWORD": url.password or "",
            "HOST": url.hostname or "localhost",
            "PORT": str(url.port or 5432),
            "CONN_MAX_AGE": int(env("DB_CONN_MAX_AGE", "60")),
            "CONN_HEALTH_CHECKS": True,
        }
    }
elif env("PGDATABASE", ""):
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": env("PGDATABASE"),
            "USER": env("PGUSER", "postgres"),
            "PASSWORD": env("PGPASSWORD", ""),
            "HOST": env("PGHOST", "localhost"),
            "PORT": env("PGPORT", "5432"),
            "CONN_MAX_AGE": int(env("DB_CONN_MAX_AGE", "60")),
            "CONN_HEALTH_CHECKS": True,
        }
    }
elif DB_ENGINE in ("postgres", "postgresql"):
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": env("DB_NAME", ""),
            "USER": env("DB_USER", ""),
            "PASSWORD": env("DB_PASSWORD", ""),
            "HOST": env("DB_HOST", "localhost"),
            "PORT": env("DB_PORT", "5432"),
            "CONN_MAX_AGE": int(env("DB_CONN_MAX_AGE", "60")),
            "CONN_HEALTH_CHECKS": True,
        }
    }
elif DB_ENGINE in ("sqlite", "sqlite3"):
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": env("DB_NAME", str(BASE_DIR / "db.sqlite3")),
        }
    }
elif DB_ENGINE == "mssql":
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
    raise ValueError(f"Unsupported DB_ENGINE: {DB_ENGINE!r}")


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
        "OPTIONS": {"min_length": 8},
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
        # Security-hardened rates (C3, H4, M3)
        "delivery_code": "5/min",   # C3: Anti-brute-force on 6-digit codes
        "payout": "3/min",          # M3: Payout withdrawal rate limit
        "coupon": "15/min",         # H4: Anti-enumeration on coupon codes
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
    "ACCESS_TOKEN_LIFETIME": timedelta(hours=int(env("ACCESS_TOKEN_HOURS", "24"))),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=int(env("REFRESH_TOKEN_DAYS", "30"))),
    "ROTATE_REFRESH_TOKENS": False,
    "BLACKLIST_AFTER_ROTATION": False,
    "UPDATE_LAST_LOGIN": True,
    "SIGNING_KEY": env("JWT_SIGNING_KEY", SECRET_KEY),
    "AUTH_HEADER_TYPES": ("Bearer",),
}

# Cookie names / attributes for the auth transport (see accounts.authentication).
AUTH_COOKIE_ACCESS = "access_token"
AUTH_COOKIE_REFRESH = "refresh_token"
AUTH_COOKIE_SECURE = env_bool("AUTH_COOKIE_SECURE", True)
AUTH_COOKIE_SAMESITE = env("AUTH_COOKIE_SAMESITE", "None")
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
    "detect-abandoned-carts-hourly": {
        "task": "orders.tasks.detect_abandoned_carts",
        "schedule": 3600,  # every hour
    },
}


# ---------------------------------------------------------------------------
# CORS / CSRF
# ---------------------------------------------------------------------------
CORS_ALLOWED_ORIGINS = env_list(
    "CORS_ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,https://multishopng.com,https://www.multishopng.com,https://shop-production-8258.up.railway.app"
)
CORS_ALLOW_ALL_ORIGINS = env_bool("CORS_ALLOW_ALL_ORIGINS", True)
CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https://.*\.workers\.dev$",
    r"^https://.*\.pages\.dev$",
    r"^https://.*\.netlify\.app$",
    r"^https://.*\.railway\.app$",
    r"^https://.*\.multishopng\.com$",
]
CORS_ALLOW_CREDENTIALS = True
CSRF_TRUSTED_ORIGINS = env_list(
    "CSRF_TRUSTED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,https://multishopng.com,https://www.multishopng.com,https://shop-production-8258.up.railway.app"
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
# ---------------------------------------------------------------------------
# Backblaze B2 / S3 Cloud Storage Configuration
# ---------------------------------------------------------------------------
AWS_ACCESS_KEY_ID = env("AWS_ACCESS_KEY_ID", env("B2_APPLICATION_KEY_ID", "00562ca274a2c5f0000000002"))
AWS_SECRET_ACCESS_KEY = env("AWS_SECRET_ACCESS_KEY", env("B2_APPLICATION_KEY", "K0059J28rY1pFen8oXkVC1W4ySs1CX4"))
AWS_STORAGE_BUCKET_NAME = env("AWS_STORAGE_BUCKET_NAME", env("B2_BUCKET_NAME", "multishopng"))
AWS_S3_ENDPOINT_URL = env("AWS_S3_ENDPOINT_URL", env("B2_ENDPOINT", "https://s3.us-east-005.backblazeb2.com"))
AWS_S3_REGION_NAME = env("AWS_S3_REGION_NAME", "us-east-005")
AWS_S3_FILE_OVERWRITE = False
AWS_DEFAULT_ACL = None
AWS_QUERYSTRING_AUTH = False

if AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY and AWS_STORAGE_BUCKET_NAME:
    STORAGES = {
        "default": {
            "BACKEND": "storages.backends.s3boto3.S3Boto3Storage",
        },
        "staticfiles": {
            "BACKEND": "whitenoise.storage.CompressedStaticFilesStorage",
        },
    }
    MEDIA_URL = f"https://{AWS_STORAGE_BUCKET_NAME}.s3.{AWS_S3_REGION_NAME}.backblazeb2.com/"
else:
    MEDIA_URL = "/media/"
    MEDIA_ROOT = BASE_DIR / "media"
    STORAGES = {
        "default": {
            "BACKEND": "django.core.files.storage.FileSystemStorage",
        },
        "staticfiles": {
            "BACKEND": "whitenoise.storage.CompressedStaticFilesStorage",
        },
    }

# Maximum in-memory upload size before streaming to a temp file (2.5 MB default).
DATA_UPLOAD_MAX_MEMORY_SIZE = int(env("DATA_UPLOAD_MAX_MEMORY_SIZE", str(2621440)))
FILE_UPLOAD_MAX_MEMORY_SIZE = DATA_UPLOAD_MAX_MEMORY_SIZE

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


# ---------------------------------------------------------------------------
# Payments (provider-agnostic; keys resolved per environment)
# ---------------------------------------------------------------------------
PAYMENT_PROVIDER = env("PAYMENT_PROVIDER", "monnify")

PAYMENTS = {
    "DEFAULT_CURRENCY": env("PAYMENTS_DEFAULT_CURRENCY", "NGN"),
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
    "MONNIFY": {
        "API_KEY": env("MONNIFY_API_KEY", ""),
        "SECRET_KEY": env("MONNIFY_SECRET_KEY", ""),
        "CONTRACT_CODE": env("MONNIFY_CONTRACT_CODE", ""),
        "BASE_URL": env("MONNIFY_BASE_URL", "https://sandbox.monnify.com"),
    },
    # Manual bank transfer (popular in Nigeria). Buyer transfers to one of
    # the configured accounts (e.g. UBA, Opay, Moniepoint) with a unique
    # reference, then the payment is confirmed by an admin (or via automated
    # reconciliation) before the order is released from escrow.
    "BANK_TRANSFER": {
        "ACCOUNTS": _bank_transfer_accounts(),
        "REFERENCE_PREFIX": env("BANK_REFERENCE_PREFIX", "MKT"),
    },
}

# ---------------------------------------------------------------------------
# Logistics & Delivery (Sendbox, Kwik, Zone Rates)
# ---------------------------------------------------------------------------
# Platform handling markup added on top of base shipping quotes (default 3.0 = 3%).
LOGISTICS_MARKUP_PERCENTAGE = Decimal(env("LOGISTICS_MARKUP_PERCENTAGE", "3.0"))
ENABLE_THIRD_PARTY_COURIERS = env_bool("ENABLE_THIRD_PARTY_COURIERS", False)

SENDBOX_API_KEY = env("SENDBOX_API_KEY", "")
SENDBOX_BASE_URL = env("SENDBOX_BASE_URL", "https://api.sendbox.ng/v1")
KWIK_API_KEY = env("KWIK_API_KEY", "")
KWIK_BASE_URL = env("KWIK_BASE_URL", "https://api.kwik.delivery/v1")

# ---------------------------------------------------------------------------
# Email & SMTP Settings
# ---------------------------------------------------------------------------
EMAIL_BACKEND = env("EMAIL_BACKEND", "django.core.mail.backends.console.EmailBackend")
EMAIL_HOST = env("EMAIL_HOST", "smtp.gmail.com")
EMAIL_PORT = int(env("EMAIL_PORT", "587"))
EMAIL_HOST_USER = env("EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = env("EMAIL_HOST_PASSWORD", "")
EMAIL_USE_TLS = env_bool("EMAIL_USE_TLS", True)
EMAIL_USE_SSL = env_bool("EMAIL_USE_SSL", False)
DEFAULT_FROM_EMAIL = env("DEFAULT_FROM_EMAIL", "MultiShop <no-reply@multishopng.com>")
SITE_URL = env("SITE_URL", "https://multishopng.com")

# ---------------------------------------------------------------------------
# Referral & Affiliate Program Settings
# ---------------------------------------------------------------------------
SUBSCRIPTION_REFERRAL_BONUS = Decimal(env("SUBSCRIPTION_REFERRAL_BONUS", "500.00"))
COMMISSION_REFERRAL_SHARE = Decimal(env("COMMISSION_REFERRAL_SHARE", "20.0"))


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

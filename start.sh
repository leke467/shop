#!/usr/bin/env bash
set -e

echo "==> Starting Railway Production Startup Script for MultiShopNG..."

# Robust manage.py location discovery
if [ -f "/app/project/backend/manage.py" ]; then
    cd /app/project/backend
elif [ -f "./project/backend/manage.py" ]; then
    cd ./project/backend
elif [ -f "./manage.py" ]; then
    echo "==> Already in backend directory: $(pwd)"
else
    MANAGE_PATH=$(find /app / -name "manage.py" 2>/dev/null | head -n 1)
    if [ -n "$MANAGE_PATH" ]; then
        cd "$(dirname "$MANAGE_PATH")"
    fi
fi

echo "==> Working Directory: $(pwd)"

# Ensure DJANGO_SECRET_KEY is present
if [ -z "$DJANGO_SECRET_KEY" ] && [ -z "$SECRET_KEY" ]; then
    export DJANGO_SECRET_KEY="railway-prod-key-$(head -c 32 /dev/urandom | base64 | tr -dc 'a-zA-Z0-9')"
    echo "==> Auto-generated runtime DJANGO_SECRET_KEY for security."
elif [ -n "$SECRET_KEY" ] && [ -z "$DJANGO_SECRET_KEY" ]; then
    export DJANGO_SECRET_KEY="$SECRET_KEY"
fi

# Ensure ALLOWED_HOSTS includes Railway domains if not specified
if [ -z "$ALLOWED_HOSTS" ]; then
    export ALLOWED_HOSTS="*,localhost,127.0.0.1,.railway.app,.up.railway.app,multishopng.com"
fi

if [ -z "$DJANGO_SETTINGS_MODULE" ]; then
    export DJANGO_SETTINGS_MODULE="ecommerce.settings.prod"
fi

echo "==> Running Database Migrations..."
python manage.py migrate accounts --noinput || true
python manage.py migrate --fake-initial --noinput || echo "Warning: Migration check had warnings"

echo "==> Populating Initial Database Seed Fixtures..."
python manage.py loaddata seed_data.json || echo "Notice: Seed data already loaded or skipped."

echo "==> Collecting Static Files..."
python manage.py collectstatic --noinput || echo "Warning: Collectstatic had warnings"

PORT_TO_USE="${PORT:-8000}"
echo "==> Launching Gunicorn WSGI Server on port ${PORT_TO_USE}..."
exec gunicorn ecommerce.wsgi:application --bind "0.0.0.0:${PORT_TO_USE}" --workers 3 --timeout 120

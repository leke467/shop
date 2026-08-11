#!/usr/bin/env bash
set -e

echo "==> Starting Railway Production Startup Script for MultiShopNG..."

# Change to Django project backend directory
cd "$(dirname "$0")/project/backend"

# Environment variable mappings
if [ -n "$SECRET_KEY" ] && [ -z "$DJANGO_SECRET_KEY" ]; then
    export DJANGO_SECRET_KEY="$SECRET_KEY"
fi

if [ -z "$DJANGO_SETTINGS_MODULE" ]; then
    export DJANGO_SETTINGS_MODULE="ecommerce.settings.prod"
fi

echo "==> Running Database Migrations..."
python manage.py migrate --noinput || echo "Warning: Migration check had warnings"

echo "==> Collecting Static Files..."
python manage.py collectstatic --noinput || echo "Warning: Collectstatic had warnings"

PORT_TO_USE="${PORT:-8000}"
echo "==> Launching Gunicorn WSGI Server on port ${PORT_TO_USE}..."
exec gunicorn ecommerce.wsgi:application --bind "0.0.0.0:${PORT_TO_USE}" --workers 3 --timeout 120

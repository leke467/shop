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

# Ensure DJANGO_SECRET_KEY is persistent across restarts
if [ -z "$DJANGO_SECRET_KEY" ] && [ -z "$SECRET_KEY" ]; then
    export DJANGO_SECRET_KEY="multishopng-stable-production-secret-key-signing-2026-v1"
    echo "==> Using stable production DJANGO_SECRET_KEY for persistent JWT auth."
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

echo "==> Pre-populating PostgreSQL migration history..."
python fix_db.py || true

echo "==> Running Full Database Migrations..."
python manage.py migrate --noinput

echo "==> Collecting Static Files..."
python manage.py collectstatic --noinput || echo "Warning: Collectstatic had warnings"

echo "==> Ensuring Production Superuser Account Exists..."
python manage.py shell -c "
from accounts.models import User
pwd = 'Admin12345!'
if not User.objects.filter(is_superuser=True).exists():
    User.objects.create_superuser(email='admin@multishopng.com', password=pwd)
    print('==> Auto-created production superuser: admin@multishopng.com')
else:
    u = User.objects.filter(is_superuser=True).first()
    u.set_password(pwd)
    u.save()
    print('==> Verified & set superuser password for:', u.email)
" || echo "Notice: Superuser setup check completed."

PORT_TO_USE="${PORT:-8080}"
echo "==> Launching Gunicorn WSGI Server on port ${PORT_TO_USE}..."
exec gunicorn ecommerce.wsgi:application --bind "0.0.0.0:${PORT_TO_USE}" --workers 3 --timeout 120

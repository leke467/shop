FROM python:3.12-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=8000

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt requirements-prod.txt /app/
RUN pip install --no-cache-dir -r requirements-prod.txt

# Copy backend project files
COPY . /app/

# Expose port
EXPOSE 8000

# Default command: collect static, migrate, run Gunicorn
CMD python manage.py collectstatic --noinput && \
    python manage.py migrate --noinput && \
    gunicorn ecommerce.wsgi:application --bind 0.0.0.0:8000 --workers 3

FROM python:3.12-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install system dependencies (PostgreSQL client libraries, gcc, bash, curl)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    bash \
    && rm -rf /var/lib/apt/lists/*

# Copy and install python requirements
COPY requirements.txt /app/
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application source code
COPY . /app/

# Ensure start.sh script is executable
RUN chmod +x /app/start.sh

# Set working directory directly to Django backend where manage.py lives
WORKDIR /app/project/backend

EXPOSE 8000

CMD ["/app/start.sh"]

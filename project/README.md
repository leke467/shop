# 🛍️ MultiShopNG (multishopng.com) — Nigerian Multi-Vendor E-Commerce Marketplace

A full-stack, enterprise-grade multi-vendor e-commerce platform built for the Nigerian market at **multishopng.com**. Features seller storefront dashboards, 6-digit delivery code escrow, Paystack & manual bank transfer payment gateways, automated 7.5% VAT calculation, 3% logistics handling markup, 2FA security, Celery background tasks, and custom store page builders.

---

## 📋 System Prerequisites

| Component | Required Version | Recommended Version |
|---|---|---|
| **Python** | `3.10.x` – `3.12.x` | `Python 3.12.8` |
| **Node.js** | `v18.x` or higher | `v24.18.0` / `v20.x` |
| **NPM** | `v9.x` or higher | `11.16.0` / `v10.x` |
| **Database** | PostgreSQL 14+ / MS SQL Server / SQLite | PostgreSQL 15 |
| **Cache & Task Broker** | Redis 6.0+ | Redis 7.0 |

---

## 🚀 Quick Start Installation Guide

### 1. Clone Repository
```bash
git clone https://github.com/leke467/shop.git
cd shop
```

---

### 2. Backend Setup (Django 5 + Django REST Framework)

```bash
# Navigate to backend directory
cd project/backend

# Create and activate virtual environment
python -m venv .venv

# On Windows PowerShell:
..\..\.venv\Scripts\Activate.ps1

# On Linux / macOS:
source .venv/bin/activate

# Install backend dependencies
pip install -r requirements.txt
```

#### Environment Configuration (`project/backend/.env`)
Create a `.env` file in `project/backend/`:
```env
DJANGO_SECRET_KEY=your-secure-django-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database Engine (sqlite | postgres | mssql)
DB_TYPE=sqlite
DB_NAME=db.sqlite3

# Payment Gateways (Paystack, Stripe, Monnify, Bank Transfer)
PAYSTACK_SECRET_KEY=sk_test_xxxxxxx
PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxx

# Platform Rates & Margins
LOGISTICS_MARKUP_PERCENTAGE=3.0
VAT_RATE=0.075

# Optional SMS (Termii)
TERMII_API_KEY=your_termii_api_key
TERMII_SENDER_ID=MultiShop
```

#### Database Migrations & Admin Account
```bash
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver 0.0.0.0:8000
```

---

### 3. Frontend Setup (React 18 + Vite + Tailwind CSS)

Open a new terminal window:
```bash
cd project

# Install frontend packages
npm install

# Start Vite Development Server
npm run dev
```

* **Frontend App:** `http://localhost:5173`
* **Backend REST API:** `http://localhost:8000/api/`
* **Django Admin Panel:** `http://localhost:8000/admin/`

---

### 4. Async Task Queue (Celery & Redis)

For automated emails, order status notifications, and abandoned cart reminders:
```bash
# Terminal 1: Worker
celery -A ecommerce worker --loglevel=info

# Terminal 2: Beat Scheduler
celery -A ecommerce beat --loglevel=info
```

---

## 💾 Database Fixtures & Seeding

The repository includes a complete serialized database dump containing **1,517 pre-populated objects** to quickly set up a fully working marketplace environment.

* **File Location:** [`project/backend/seed_data.json`](file:///c:/Users/Leke/Documents/GitHub/shop/project/backend/seed_data.json)
* **File Size:** `~847 KB` (Formatted UTF-8 JSON)
* **What the Dump Contains:**
  - **Shops & Merchants:** Sample registered storefronts, seller profiles, logos, themes, and layouts.
  - **Products & Inventory:** Product variants, categories, SKUs, pricing, and stock inventory counts.
  - **Subscriptions & Tiers:** SaaS plan tiers (Free, Growth, Pro) with feature limits.
  - **Delivery & Logistics:** Nigerian state delivery zones (`DeliveryZone`) and state rates.
  - **Users & Security:** Superuser accounts, buyer/seller profiles, saved addresses, and 2FA models.
  - **Orders & Transactions:** Historical orders, order groups, delivery codes, and escrow records.

### How to Seed / Restore Data:
```bash
cd project/backend

# 1. Run migrations first to create table schemas
python manage.py migrate

# 2. Load the JSON fixture into the database
python manage.py loaddata seed_data.json
```

---

## 🔒 Security Architecture
- **Escrow Row-Locking (`select_for_update`)**: Prevents race conditions on delivery code releases & seller wallet payouts.
- **HttpOnly JWT Cookies**: Protection against XSS token theft.
- **Argon2 Password Hashing**: Memory-hard password encryption.
- **Two-Factor Authentication (2FA)**: TOTP verification (`pyotp`) with step-2 login validation.
- **Anti-Brute-Force Lockout**: Rate limiting on delivery code attempts (5 failures = 15-min lockout).

---

## 🐳 Docker Deployment (Optional)

To run the entire stack with PostgreSQL, Redis, Celery, and Nginx via Docker:
```bash
cd project
docker-compose up --build -d
```

---

## 📄 License
Private Repository — Built for MultiShop Platform. All rights reserved.

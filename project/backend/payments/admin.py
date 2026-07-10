from django.contrib import admin

from .models import Payment, Refund, Transaction, WebhookEvent


# ---------------------------------------------------------------------------
# Payment
# ---------------------------------------------------------------------------

class TransactionInline(admin.TabularInline):
    model = Transaction
    extra = 0
    readonly_fields = ("provider_txn_id", "provider_response", "created_at")


class RefundInline(admin.TabularInline):
    model = Refund
    extra = 0
    readonly_fields = ("public_id", "provider_refund_id", "completed_at")


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = (
        "public_id",
        "order",
        "provider",
        "status",
        "amount",
        "currency",
        "created_at",
    )
    list_filter = ("provider", "status", "currency", "created_at")
    search_fields = (
        "public_id",
        "provider_payment_id",
        "idempotency_key",
        "user__email",
    )
    readonly_fields = (
        "public_id",
        "idempotency_key",
        "captured_at",
        "failed_at",
        "cancelled_at",
        "ip_address",
    )
    raw_id_fields = ("order", "user")
    inlines = [TransactionInline, RefundInline]
    date_hierarchy = "created_at"


# ---------------------------------------------------------------------------
# Refund (standalone view as well)
# ---------------------------------------------------------------------------

@admin.register(Refund)
class RefundAdmin(admin.ModelAdmin):
    list_display = ("public_id", "payment", "status", "amount", "reason", "created_at")
    list_filter = ("status", "reason")
    search_fields = ("public_id", "provider_refund_id")
    raw_id_fields = ("payment",)


# ---------------------------------------------------------------------------
# Webhook audit log
# ---------------------------------------------------------------------------

@admin.register(WebhookEvent)
class WebhookEventAdmin(admin.ModelAdmin):
    list_display = ("event_id", "provider", "event_type", "status", "created_at")
    list_filter = ("provider", "status", "event_type")
    search_fields = ("event_id", "event_type")
    readonly_fields = ("payload", "processed_at")
    date_hierarchy = "created_at"

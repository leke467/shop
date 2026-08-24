from django.contrib import admin

from .models import Payment, Refund, RefundRequest, Transaction, WebhookEvent, PaymentGatewaySetting


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
    actions = ["confirm_bank_transfer"]

    @admin.action(
        description="Confirm selected bank transfers",
        permissions=("change",),
    )
    def confirm_bank_transfer(self, request, queryset):
        from payments.services import CheckoutError, confirm_bank_transfer

        confirmed = 0
        errors = 0
        for payment in queryset.select_related("order"):
            try:
                confirm_bank_transfer(payment, verified_by=request.user.email)
                confirmed += 1
            except CheckoutError:
                errors += 1

        msg = f"Confirmed {confirmed} bank transfer(s)."
        if errors:
            msg += f" {errors} skipped (not awaiting transfer)."
        self.message_user(request, msg)


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


# ---------------------------------------------------------------------------
# Refund Request Admin
# ---------------------------------------------------------------------------

@admin.register(RefundRequest)
class RefundRequestAdmin(admin.ModelAdmin):
    list_display = (
        "public_id",
        "user",
        "order_group",
        "reason",
        "status",
        "created_at",
        "resolved_at",
    )
    list_filter = ("status", "reason", "created_at")
    search_fields = ("public_id", "user__email", "description", "admin_notes")
    readonly_fields = ("public_id", "created_at", "resolved_at", "resolved_by")
    raw_id_fields = ("order_group", "user")
    actions = ["approve_refund_requests", "reject_refund_requests"]

    @admin.action(description="Approve selected refund requests")
    def approve_refund_requests(self, request, queryset):
        from orders.models import OrderGroup
        from payments.models import Payment
        from payments.services import CheckoutError, process_refund

        approved = 0
        errors = 0
        for rr in queryset.filter(status=RefundRequest.Status.PENDING):
            payment = Payment.objects.filter(
                order=rr.order_group.order, status=Payment.Status.CAPTURED
            ).first()

            try:
                if payment:
                    amount = rr.order_group.subtotal + rr.order_group.shipping_total
                    process_refund(
                        payment,
                        amount=amount,
                        reason=rr.reason,
                        notes=f"Approved via Django admin by {request.user.email}",
                    )
                rr.order_group.escrow_status = OrderGroup.EscrowStatus.REFUNDED
                rr.order_group.save(update_fields=["escrow_status", "updated_at"])

                rr.status = RefundRequest.Status.APPROVED
                rr.admin_notes = f"Approved by admin {request.user.email}"
                rr.resolved_at = admin.utils.timezone.now()
                rr.resolved_by = request.user
                rr.save()
                approved += 1
            except CheckoutError:
                errors += 1

        msg = f"Approved {approved} refund request(s)."
        if errors:
            msg += f" {errors} failed."
        self.message_user(request, msg)

    @admin.action(description="Reject selected refund requests")
    def reject_refund_requests(self, request, queryset):
        rejected = 0
        for rr in queryset.filter(status=RefundRequest.Status.PENDING):
            rr.status = RefundRequest.Status.REJECTED
            rr.admin_notes = f"Rejected by admin {request.user.email}"
            rr.resolved_at = admin.utils.timezone.now()
            rr.resolved_by = request.user
            rr.save()
            rejected += 1

        self.message_user(request, f"Rejected {rejected} refund request(s).")


# ---------------------------------------------------------------------------
# Payment Gateway Settings (Enable / Disable Paystack & Monnify)
# ---------------------------------------------------------------------------

@admin.register(PaymentGatewaySetting)
class PaymentGatewaySettingAdmin(admin.ModelAdmin):
    list_display = ("__str__", "paystack_enabled", "monnify_enabled", "default_provider", "updated_at")
    list_editable = ("paystack_enabled", "monnify_enabled", "default_provider")

    def has_add_permission(self, request):
        return not PaymentGatewaySetting.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False


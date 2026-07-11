from django.urls import path

from .views import CheckoutView, PaystackWebhookView, StripeWebhookView

urlpatterns = [
    path("checkout/", CheckoutView.as_view(), name="checkout"),
    path("webhooks/stripe/", StripeWebhookView.as_view(), name="stripe-webhook"),
    path("webhooks/paystack/", PaystackWebhookView.as_view(), name="paystack-webhook"),
]

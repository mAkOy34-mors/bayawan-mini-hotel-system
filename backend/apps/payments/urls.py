"""apps/payments/urls.py"""
from django.urls import path
from . import views
from .webhook_views import PayMongoWebhookView, PaymentSuccessView

urlpatterns = [
    # Guest-facing
    path("my-payments/",    views.MyPaymentsView.as_view()),
    path("create-link/",    views.CreatePaymentLinkView.as_view()),

    # ── NEW: payment status polling endpoint ──────────────────────────────
    # Frontend polls GET /api/v1/payments/status/<pk>/ every 3s to detect
    # when an online payment has been confirmed by the PayMongo webhook.
    path("status/<int:pk>/", views.PaymentStatusView.as_view(), name="payment_status"),

    # Webhook (PayMongo → backend)
    path("webhook/",        PayMongoWebhookView.as_view()),

    # Redirect landing pages
    path("success/",        PaymentSuccessView.as_view()),
]
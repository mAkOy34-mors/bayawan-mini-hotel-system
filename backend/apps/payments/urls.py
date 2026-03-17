"""apps/payments/urls.py"""
from django.urls import path
from . import views
from .webhook_views import PayMongoWebhookView, PaymentSuccessView

urlpatterns = [
    path("my-payments/",  views.MyPaymentsView.as_view()),
    path("create-link/",  views.CreatePaymentLinkView.as_view()),
    path("webhook/",      PayMongoWebhookView.as_view()),
    path("webhook",       PayMongoWebhookView.as_view()),
    path("success/",      PaymentSuccessView.as_view()),
]
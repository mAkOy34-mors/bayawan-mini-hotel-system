"""apps/users/urls.py"""

from django.urls import path

from .googel_views import GoogleLoginRedirectView, GoogleCallbackView
from .views import LoginView, RegisterView, ResendOtpView, VerifyOtpView

urlpatterns = [
    path("register",   RegisterView.as_view(),  name="user-register"),
    path("login",      LoginView.as_view(),      name="user-login"),
    path("verify-otp", VerifyOtpView.as_view(),  name="user-verify-otp"),
    path("resend-otp", ResendOtpView.as_view(),  name="user-resend-otp"),
]

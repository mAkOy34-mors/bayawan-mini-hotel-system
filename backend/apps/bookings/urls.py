"""apps/bookings/urls.py"""
from django.urls import path

from . import otp_views
from .views import CreateBookingView, MyBookingsView, BookingStatusView
from .otp_views import RequestBookingOtpView, ConfirmBookingWithOtpView
from .management_views import (
    BookingDetailView,
    CancelBookingView,
    SubmitChangeRequestView,
    ChangeRequestListView,
    AdminChangeRequestsView,
    AdminApproveChangeRequestView,
    AdminRejectChangeRequestView,
)

urlpatterns = [
    # ── Fixed named paths first ──────────────────────────────────────
    path("my-bookings/",              MyBookingsView.as_view()),
    path("request-otp/",              RequestBookingOtpView.as_view()),
    path("confirm/",                  ConfirmBookingWithOtpView.as_view()),

    # ── Admin change requests ─────────────────────────────────────────
    path("change-requests/",                          AdminChangeRequestsView.as_view()),
    path("change-requests/<int:pk>/approve/", AdminApproveChangeRequestView.as_view()),
    path("change-requests/<int:pk>/reject/", AdminRejectChangeRequestView.as_view()),

    # ── Per-booking actions (pk paths) ────────────────────────────────
    path("<int:pk>/change-requests/",  ChangeRequestListView.as_view()),
    path("<int:pk>/change-request/",   SubmitChangeRequestView.as_view()),
    path("<int:pk>/cancel/",           CancelBookingView.as_view()),
    path("<int:pk>/",                  BookingDetailView.as_view()),

    # ── Create booking (empty path always last) ───────────────────────
    path("",                           CreateBookingView.as_view()),
    path('request-otp/', otp_views.RequestBookingOtpView.as_view(), name='request_otp'),
    path('confirm/', otp_views.ConfirmBookingWithOtpView.as_view(), name='confirm_booking'),
    path('<str:booking_reference>/status/', BookingStatusView.as_view(), name='booking-status'),
]
# apps/bookings/urls.py
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
from .change_request_views import (
    SubmitChangeRequestView as NewSubmitChangeRequestView,
    GetChangeRequestsView,
    AdminApproveChangeRequestView as NewAdminApproveChangeRequestView,
    AdminRejectChangeRequestView as NewAdminRejectChangeRequestView,
)

urlpatterns = [
    # ============================================================
    # BOOKING ENDPOINTS
    # ============================================================

    # Create a new booking
    path("", CreateBookingView.as_view(), name="create-booking"),

    # Get authenticated user's bookings
    path("my-bookings/", MyBookingsView.as_view(), name="my-bookings"),

    # Get booking status by reference
    path("<str:booking_reference>/status/", BookingStatusView.as_view(), name="booking-status"),

    # Get single booking details
    path("<int:pk>/", BookingDetailView.as_view(), name="booking-detail"),

    # Cancel a booking
    path("<int:pk>/cancel/", CancelBookingView.as_view(), name="cancel-booking"),


    # ============================================================
    # OTP ENDPOINTS (for booking verification)
    # ============================================================

    # Request OTP for booking confirmation
    path("request-otp/", RequestBookingOtpView.as_view(), name="request-otp"),

    # Confirm booking with OTP
    path("confirm/", ConfirmBookingWithOtpView.as_view(), name="confirm-booking"),


    # ============================================================
    # CHANGE REQUEST ENDPOINTS (Guest)
    # ============================================================

    # Submit a change request for a specific booking
    path("<int:booking_id>/change-request/", NewSubmitChangeRequestView.as_view(), name="submit-change-request"),

    # Get all change requests for a specific booking
    path("<int:booking_id>/change-requests/", GetChangeRequestsView.as_view(), name="get-change-requests"),


    # ============================================================
    # ADMIN CHANGE REQUEST MANAGEMENT
    # ============================================================

    # Get all change requests (admin view)
    path("change-requests/", AdminChangeRequestsView.as_view(), name="admin-change-requests"),

    # Approve a change request
    path("change-requests/<int:pk>/approve/", NewAdminApproveChangeRequestView.as_view(), name="approve-change-request"),

    # Reject a change request
    path("change-requests/<int:pk>/reject/", NewAdminRejectChangeRequestView.as_view(), name="reject-change-request"),
]
# apps/bookings/urls.py
from django.urls import path

from . import otp_views
from .views import CreateBookingView, MyBookingsView, BookingStatusView
from .otp_views import RequestBookingOtpView, ConfirmBookingWithOtpView
from .management_views import (
    BookingDetailView,
    CancelBookingView,
    AdminChangeRequestsView,
)
from .change_request_views import (
    SubmitChangeRequestView,
    GetChangeRequestsView,
    AdminApproveChangeRequestView,
    AdminRejectChangeRequestView,
    RoomTypesWithPricingView,
    RoomsByTypeView,
    ChangeRequestPreviewView,
    ChangeRequestPaymentStatusView,
)
from .cancellation_views import (
    SubmitCancelRequestView,
    GetCancelRequestsView,
    AdminCancelRequestsView,
    AdminApproveCancelRequestView,
    AdminRejectCancelRequestView,
)

urlpatterns = [
    # ============================================================
    # BOOKING ENDPOINTS
    # ============================================================
    path("", CreateBookingView.as_view(), name="create-booking"),
    path("my-bookings/", MyBookingsView.as_view(), name="my-bookings"),
    path("<str:booking_reference>/status/", BookingStatusView.as_view(), name="booking-status"),
    path("<int:pk>/", BookingDetailView.as_view(), name="booking-detail"),
    path("<int:pk>/cancel/", CancelBookingView.as_view(), name="cancel-booking"),

    # ============================================================
    # CANCELLATION REQUEST ENDPOINTS (Guest)
    # ============================================================
    path("<int:booking_id>/cancel-request/", SubmitCancelRequestView.as_view(), name="submit-cancel-request"),
    path("<int:booking_id>/cancel-requests/", GetCancelRequestsView.as_view(), name="get-cancel-requests"),

    # ============================================================
    # ADMIN CANCELLATION REQUEST MANAGEMENT
    # ============================================================
    path("cancel-requests/", AdminCancelRequestsView.as_view(), name="admin-cancel-requests"),
    path("cancel-requests/<int:pk>/approve/", AdminApproveCancelRequestView.as_view(), name="approve-cancel-request"),
    path("cancel-requests/<int:pk>/reject/", AdminRejectCancelRequestView.as_view(), name="reject-cancel-request"),

    # ============================================================
    # OTP ENDPOINTS
    # ============================================================
    path("request-otp/", RequestBookingOtpView.as_view(), name="request-otp"),
    path("confirm/", ConfirmBookingWithOtpView.as_view(), name="confirm-booking"),

    # ============================================================
    # CHANGE REQUEST ENDPOINTS (Guest)
    # ============================================================
    path("room-types-pricing/", RoomTypesWithPricingView.as_view(), name="room-types-pricing"),
    path("rooms-by-type/<str:room_type>/", RoomsByTypeView.as_view(), name="rooms-by-type"),
    path("<int:booking_id>/change-request/", SubmitChangeRequestView.as_view(), name="submit-change-request"),
    path("<int:booking_id>/change-request/preview/", ChangeRequestPreviewView.as_view(), name="change-request-preview"),
    path("<int:booking_id>/change-requests/", GetChangeRequestsView.as_view(), name="get-change-requests"),

    # ============================================================
    # ADMIN CHANGE REQUEST MANAGEMENT
    # ============================================================
    path("change-requests/", AdminChangeRequestsView.as_view(), name="admin-change-requests"),
    path("change-requests/<int:pk>/approve/", AdminApproveChangeRequestView.as_view(), name="approve-change-request"),
    path("change-requests/<int:pk>/reject/", AdminRejectChangeRequestView.as_view(), name="reject-change-request"),
    path("change-requests/<int:pk>/payment-status/", ChangeRequestPaymentStatusView.as_view(), name="change-request-payment-status"),
]
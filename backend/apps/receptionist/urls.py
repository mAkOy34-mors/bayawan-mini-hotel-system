"""apps/receptionist/urls.py"""
from django.urls import path
from . import views

urlpatterns = [
    # Dashboard
    path("dashboard/",              views.ReceptionistDashboardView.as_view()),

    # Arrivals & Departures
    path("arrivals/",               views.ArrivalsView.as_view()),
    path("departures/",             views.DeparturesView.as_view()),

    # Bookings
    path("bookings/",               views.ReceptionistBookingsView.as_view()),
    path("bookings/walkin/",        views.WalkInBookingView.as_view()),
    path("bookings/<int:pk>/",      views.ReceptionistBookingDetailView.as_view()),
    path("bookings/<int:pk>/checkin/",  views.CheckInView.as_view()),
    path("bookings/<int:pk>/checkout/", views.CheckOutView.as_view()),

    # Guests
    path("guests/",                 views.ReceptionistGuestsView.as_view()),
    path("guests/<int:pk>/",        views.ReceptionistGuestDetailView.as_view()),

    # Rooms
    path("rooms/",                  views.ReceptionistRoomsView.as_view()),
    path("rooms/<int:pk>/status/",  views.ReceptionistRoomStatusView.as_view()),

    # Payments
    path("payments/",               views.ReceptionistPaymentsView.as_view()),
    path("payments/cash/",          views.RecordCashPaymentView.as_view()),
    path('verify-qr-checkin/',      views.VerifyQRCheckInView.as_view(), name='verify_qr_checkin'),
]
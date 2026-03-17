"""apps/admin_panel/urls.py"""
from django.urls import path
from . import views

urlpatterns = [
    # Rooms
    path("rooms/",                        views.AdminRoomsView.as_view()),
    path("rooms/<int:pk>/",               views.AdminRoomDetailView.as_view()),
    # Bookings
    path("bookings/",                     views.AdminBookingsView.as_view()),
    path("bookings/<int:pk>/",            views.AdminBookingDetailView.as_view()),
    path("bookings/<int:pk>/status/",     views.AdminBookingStatusView.as_view()),
    # Guests
    path("guests/",                       views.AdminGuestsView.as_view()),
    path("guests/<int:pk>/",              views.AdminGuestDetailView.as_view()),
    path("guests/<int:pk>/toggle-active/", views.AdminGuestToggleActiveView.as_view()),
    # Payments
    path("payments/",                     views.AdminPaymentsView.as_view()),
    path("payments/<int:pk>/",            views.AdminPaymentDetailView.as_view()),
    path("payments/<int:pk>/verify/",     views.AdminPaymentVerifyView.as_view()),
]

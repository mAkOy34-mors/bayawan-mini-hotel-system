"""apps/admin_panel/urls.py"""
from django.urls import path
from . import views
from .views import AdminUsersListView, AdminUserCreateView, AdminUserUpdateView, AdminUserDeleteView, \
    AdminUserToggleStatusView, AdminRoomUploadImageView, AdminCancelBookingView, AdminGetCancellationDetailsView

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
    path('users/', AdminUsersListView.as_view(), name='admin-users-list'),
    path('users/create/', AdminUserCreateView.as_view(), name='admin-users-create'),
    path('users/<int:user_id>/', AdminUserUpdateView.as_view(), name='admin-users-update'),
    path('users/<int:user_id>/delete/', AdminUserDeleteView.as_view(), name='admin-users-delete'),
    path('users/<int:user_id>/toggle-status/', AdminUserToggleStatusView.as_view(), name='admin-users-toggle-status'),
    # apps/admin_panel/urls.py
    path('rooms/<int:room_id>/upload-image/', AdminRoomUploadImageView.as_view(), name='admin-room-upload-image'),

    path('bookings/<int:booking_id>/cancel/', AdminCancelBookingView.as_view(), name='admin-cancel-booking'),
    path('bookings/<int:booking_id>/cancellation/', AdminGetCancellationDetailsView.as_view(),
         name='admin-cancellation-details'),
]

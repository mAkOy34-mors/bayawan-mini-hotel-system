"""
apps/admin_panel/views.py

Admin-only REST API endpoints.
All routes require role=ADMIN or is_staff=True.

Rooms:    GET/POST /api/v1/admin/rooms/
          GET/PUT/DELETE /api/v1/admin/rooms/<pk>/

Bookings: GET /api/v1/admin/bookings/
          GET /api/v1/admin/bookings/<pk>/
          POST /api/v1/admin/bookings/<pk>/status/

Guests:   GET /api/v1/admin/guests/
          GET /api/v1/admin/guests/<pk>/
          POST /api/v1/admin/guests/<pk>/toggle-active/

Payments: GET /api/v1/admin/payments/
          GET /api/v1/admin/payments/<pk>/
          POST /api/v1/admin/payments/<pk>/verify/
"""
from decimal import Decimal

from django.db.models import Q
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.bookings.models import Booking
from apps.guests.models import GuestInformation
from apps.payments.models import Payment
from apps.rooms.models import Room
from apps.users.models import User
from .serializers import (
    AdminBookingSerializer, AdminGuestSerializer,
    AdminPaymentSerializer, AdminRoomSerializer,
)


def is_admin(user):
    return user.is_authenticated and (
        getattr(user, "role", None) == "ADMIN" or user.is_staff
    )


def admin_only(view_func):
    """Simple decorator to check admin access."""
    def wrapper(self, request, *args, **kwargs):
        if not is_admin(request.user):
            return Response({"message": "Forbidden. Admin access required."}, status=403)
        return view_func(self, request, *args, **kwargs)
    return wrapper


# ── Rooms ─────────────────────────────────────────────────────────────────────

class AdminRoomsView(APIView):
    """GET /api/v1/admin/rooms/  — list all rooms
       POST /api/v1/admin/rooms/ — create room"""

    @admin_only
    def get(self, request):
        rooms = Room.objects.all().order_by("room_number")
        return Response(AdminRoomSerializer(rooms, many=True).data)

    @admin_only
    def post(self, request):
        ser = AdminRoomSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        room = ser.save()
        return Response(AdminRoomSerializer(room).data, status=status.HTTP_201_CREATED)


class AdminRoomDetailView(APIView):
    """GET/PUT/DELETE /api/v1/admin/rooms/<pk>/"""

    @admin_only
    def get(self, request, pk):
        try:
            room = Room.objects.get(pk=pk)
        except Room.DoesNotExist:
            return Response({"message": "Room not found."}, status=404)
        return Response(AdminRoomSerializer(room).data)

    @admin_only
    def put(self, request, pk):
        try:
            room = Room.objects.get(pk=pk)
        except Room.DoesNotExist:
            return Response({"message": "Room not found."}, status=404)
        ser = AdminRoomSerializer(room, data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(AdminRoomSerializer(room).data)

    @admin_only
    def delete(self, request, pk):
        try:
            room = Room.objects.get(pk=pk)
        except Room.DoesNotExist:
            return Response({"message": "Room not found."}, status=404)
        room.delete()
        return Response({"message": "Room deleted."}, status=status.HTTP_204_NO_CONTENT)


# ── Bookings ──────────────────────────────────────────────────────────────────

class AdminBookingsView(APIView):
    """GET /api/v1/admin/bookings/?status=CONFIRMED&search=ref"""

    @admin_only
    def get(self, request):
        qs = Booking.objects.select_related("room", "user", "guest_information").order_by("-created_at")

        status_filter = request.query_params.get("status")
        search        = request.query_params.get("search")

        if status_filter:
            qs = qs.filter(status=status_filter)
        if search:
            qs = qs.filter(
                Q(booking_reference__icontains=search) |
                Q(user__email__icontains=search)
            )

        return Response(AdminBookingSerializer(qs, many=True).data)


class AdminBookingDetailView(APIView):
    """GET /api/v1/admin/bookings/<pk>/"""

    @admin_only
    def get(self, request, pk):
        try:
            booking = Booking.objects.select_related(
                "room", "user", "guest_information"
            ).get(pk=pk)
        except Booking.DoesNotExist:
            return Response({"message": "Booking not found."}, status=404)
        return Response(AdminBookingSerializer(booking).data)


class AdminBookingStatusView(APIView):
    """POST /api/v1/admin/bookings/<pk>/status/
       Body: { "status": "CONFIRMED" }
    """

    @admin_only
    def post(self, request, pk):
        try:
            booking = Booking.objects.get(pk=pk)
        except Booking.DoesNotExist:
            return Response({"message": "Booking not found."}, status=404)

        new_status = request.data.get("status")
        valid = [c[0] for c in Booking.BookingStatus.choices]
        if new_status not in valid:
            return Response({"message": f"Invalid status. Valid: {valid}"}, status=400)

        booking.status = new_status
        booking.save(update_fields=["status"])
        return Response({"message": f"Booking status updated to {new_status}.", "status": new_status})


# ── Guests ────────────────────────────────────────────────────────────────────

class AdminGuestsView(APIView):
    """GET /api/v1/admin/guests/?search=email"""

    @admin_only
    def get(self, request):
        search = request.query_params.get("search", "")
        qs = User.objects.filter(role="USER").order_by("-created_at")
        if search:
            qs = qs.filter(Q(email__icontains=search) | Q(username__icontains=search))
        return Response(AdminGuestSerializer(qs, many=True).data)


class AdminGuestDetailView(APIView):
    """GET /api/v1/admin/guests/<pk>/"""

    @admin_only
    def get(self, request, pk):
        try:
            guest = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"message": "Guest not found."}, status=404)

        bookings = Booking.objects.filter(user=guest).select_related("room").order_by("-created_at")
        profile  = GuestInformation.objects.filter(user=guest).first()

        data = AdminGuestSerializer(guest).data
        data["bookingCount"] = bookings.count()
        data["profile"] = {
            "firstName":     profile.first_name if profile else None,
            "lastName":      profile.last_name if profile else None,
            "contactNumber": profile.contact_number if profile else None,
            "nationality":   profile.nationality if profile else None,
        } if profile else None

        return Response(data)


class AdminGuestToggleActiveView(APIView):
    """POST /api/v1/admin/guests/<pk>/toggle-active/"""

    @admin_only
    def post(self, request, pk):
        try:
            guest = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"message": "Guest not found."}, status=404)

        guest.is_active = not guest.is_active
        guest.save(update_fields=["is_active"])
        action = "activated" if guest.is_active else "deactivated"
        return Response({"message": f"Guest account {action}.", "isActive": guest.is_active})


# ── Payments ──────────────────────────────────────────────────────────────────

class AdminPaymentsView(APIView):
    """GET /api/v1/admin/payments/?status=PAID"""

    @admin_only
    def get(self, request):
        qs = Payment.objects.all().order_by("-created_at")
        status_filter = request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter)
        return Response(AdminPaymentSerializer(qs, many=True).data)


class AdminPaymentDetailView(APIView):
    """GET /api/v1/admin/payments/<pk>/"""

    @admin_only
    def get(self, request, pk):
        try:
            payment = Payment.objects.get(pk=pk)
        except Payment.DoesNotExist:
            return Response({"message": "Payment not found."}, status=404)
        return Response(AdminPaymentSerializer(payment).data)


class AdminPaymentVerifyView(APIView):
    """POST /api/v1/admin/payments/<pk>/verify/
       Manually marks a payment as PAID.
    """

    @admin_only
    def post(self, request, pk):
        try:
            payment = Payment.objects.get(pk=pk)
        except Payment.DoesNotExist:
            return Response({"message": "Payment not found."}, status=404)

        if payment.status == "PAID":
            return Response({"message": "Payment is already marked as PAID."})

        from django.utils import timezone
        payment.status  = "PAID"
        payment.paid_at = timezone.now()
        payment.save(update_fields=["status", "paid_at"])

        return Response({"message": "Payment marked as PAID.", "paymentId": payment.pk})

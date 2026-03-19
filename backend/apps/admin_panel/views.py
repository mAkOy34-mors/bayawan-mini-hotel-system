"""
apps/admin_panel/views.py

Admin & Receptionist REST API endpoints.

Permission levels:
  @admin_only   — ADMIN / is_staff only
  @staff_only   — ADMIN + RECEPTIONIST / is_staff

Rooms:    GET/POST /api/v1/admin/rooms/
          GET/PUT/DELETE /api/v1/admin/rooms/<pk>/

Bookings: GET /api/v1/admin/bookings/
          GET /api/v1/admin/bookings/<pk>/
          POST /api/v1/admin/bookings/<pk>/status/

Guests:   GET /api/v1/admin/guests/
          GET /api/v1/admin/guests/<pk>/
          POST /api/v1/admin/guests/<pk>/toggle-active/

Payments: GET /api/v1/admin/payments/
          POST /api/v1/admin/payments/         (cash — receptionist)
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


# ── Permission helpers ────────────────────────────────────────────────────────

def is_admin(user):
    """Admin or is_staff only."""
    return user.is_authenticated and (
        getattr(user, "role", None) == "ADMIN" or
        user.is_staff or
        user.is_superuser
    )


def is_admin_or_receptionist(user):
    """Admin or Receptionist (or is_staff)."""
    return user.is_authenticated and (
        getattr(user, "role", None) in ("ADMIN", "RECEPTIONIST") or
        user.is_staff or
        user.is_superuser
    )


def admin_only(view_func):
    """Decorator — Admin access only. Receptionist is blocked."""
    def wrapper(self, request, *args, **kwargs):
        if not is_admin(request.user):
            return Response(
                {"message": "Forbidden. Admin access required."},
                status=403,
            )
        return view_func(self, request, *args, **kwargs)
    return wrapper


def staff_only(view_func):
    """Decorator — Admin or Receptionist access."""
    def wrapper(self, request, *args, **kwargs):
        if not is_admin_or_receptionist(request.user):
            return Response(
                {"message": "Forbidden. Staff access required."},
                status=403,
            )
        return view_func(self, request, *args, **kwargs)
    return wrapper


# ── Rooms ─────────────────────────────────────────────────────────────────────

class AdminRoomsView(APIView):
    """GET  /api/v1/admin/rooms/  — list all rooms (admin + receptionist)
       POST /api/v1/admin/rooms/  — create room   (admin only)"""

    @staff_only
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

    @staff_only
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
    """GET /api/v1/admin/bookings/?status=CONFIRMED&search=ref
       POST /api/v1/admin/bookings/ — create walk-in booking (admin + receptionist)
    """

    @staff_only
    def get(self, request):
        qs = Booking.objects.select_related(
            "room", "user", "guest_information"
        ).order_by("-created_at")

        status_filter = request.query_params.get("status")
        search        = request.query_params.get("search")
        check_in      = request.query_params.get("checkIn")

        if status_filter:
            qs = qs.filter(status=status_filter)
        if search:
            qs = qs.filter(
                Q(booking_reference__icontains=search) |
                Q(user__email__icontains=search)       |
                Q(user__username__icontains=search)
            )
        if check_in:
            qs = qs.filter(check_in_date=check_in)

        return Response(AdminBookingSerializer(qs, many=True).data)

    @staff_only
    def post(self, request):
        """Create walk-in booking — receptionist & admin."""
        from apps.rooms.models import Room as RoomModel
        from django.utils import timezone
        import uuid

        guest_email = request.data.get("guestEmail")
        room_id     = request.data.get("roomId")

        if not guest_email or not room_id:
            return Response(
                {"message": "guestEmail and roomId are required."},
                status=400,
            )

        try:
            guest = User.objects.get(email=guest_email)
        except User.DoesNotExist:
            return Response({"message": f"Guest with email {guest_email} not found."}, status=404)

        try:
            room = RoomModel.objects.get(pk=room_id)
        except RoomModel.DoesNotExist:
            return Response({"message": "Room not found."}, status=404)

        check_in_date  = request.data.get("checkInDate")
        check_out_date = request.data.get("checkOutDate")
        total_amount   = Decimal(str(request.data.get("totalAmount", 0)))
        deposit_amount = Decimal(str(request.data.get("depositAmount", total_amount / 2)))
        num_guests     = request.data.get("numberOfGuests", 1)
        payment_type   = request.data.get("paymentType", "DEPOSIT")
        special_req    = request.data.get("specialRequests", "Walk-in booking")

        from datetime import date
        nights = (
            date.fromisoformat(check_out_date) - date.fromisoformat(check_in_date)
        ).days

        booking = Booking.objects.create(
            user              = guest,
            room              = room,
            check_in_date     = check_in_date,
            check_out_date    = check_out_date,
            number_of_nights  = max(1, nights),
            number_of_guests  = num_guests,
            total_amount      = total_amount,
            deposit_amount    = deposit_amount,
            remaining_amount  = total_amount - deposit_amount,
            status            = request.data.get("status", "CHECKED_IN"),
            special_requests  = special_req,
            booking_reference = f"CGH-WALKIN-{uuid.uuid4().hex[:6].upper()}",
        )

        return Response(
            AdminBookingSerializer(booking).data,
            status=status.HTTP_201_CREATED,
        )


class AdminBookingDetailView(APIView):
    """GET /api/v1/admin/bookings/<pk>/"""

    @staff_only
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
       Admin can set any status.
       Receptionist cannot set CANCELLED.
    """

    @staff_only
    def post(self, request, pk):
        try:
            booking = Booking.objects.get(pk=pk)
        except Booking.DoesNotExist:
            return Response({"message": "Booking not found."}, status=404)

        new_status = request.data.get("status")
        valid      = [c[0] for c in Booking.BookingStatus.choices]

        if new_status not in valid:
            return Response({"message": f"Invalid status. Valid: {valid}"}, status=400)

        # Receptionist cannot cancel bookings
        if new_status == "CANCELLED" and not is_admin(request.user):
            return Response(
                {"message": "Only admin can cancel bookings."},
                status=403,
            )

        booking.status = new_status
        booking.save(update_fields=["status"])
        return Response({
            "message": f"Booking status updated to {new_status}.",
            "status":  new_status,
        })


# ── Guests ────────────────────────────────────────────────────────────────────

class AdminGuestsView(APIView):
    """GET /api/v1/admin/guests/?search=email"""

    @staff_only
    def get(self, request):
        search = request.query_params.get("search", "")
        qs = User.objects.filter(
            role__in=["USER", "RECEPTIONIST"]
        ).order_by("-created_at")
        if search:
            qs = qs.filter(
                Q(email__icontains=search)    |
                Q(username__icontains=search)
            )
        # Receptionist searches all guests (USER role)
        if not is_admin(request.user):
            qs = qs.filter(role="USER")
        return Response(AdminGuestSerializer(qs, many=True).data)


class AdminGuestDetailView(APIView):
    """GET   /api/v1/admin/guests/<pk>/
       PATCH /api/v1/admin/guests/<pk>/ — edit contact (receptionist + admin)
    """

    @staff_only
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
            "firstName":     profile.first_name     if profile else None,
            "lastName":      profile.last_name      if profile else None,
            "contactNumber": profile.contact_number if profile else None,
            "nationality":   profile.nationality    if profile else None,
        } if profile else None

        return Response(data)

    @staff_only
    def patch(self, request, pk):
        """Receptionist can update username and phone only."""
        try:
            guest = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"message": "Guest not found."}, status=404)

        # Allow updating name and phone only
        allowed_fields = ["username", "phone"]
        for field in allowed_fields:
            if field in request.data:
                setattr(guest, field, request.data[field])

        # Update profile phone if exists
        if "phone" in request.data:
            profile = GuestInformation.objects.filter(user=guest).first()
            if profile:
                profile.contact_number = request.data["phone"]
                profile.save(update_fields=["contact_number"])

        guest.save(update_fields=["username"] if "username" in request.data else [])
        return Response(AdminGuestSerializer(guest).data)


class AdminGuestToggleActiveView(APIView):
    """POST /api/v1/admin/guests/<pk>/toggle-active/ — admin only"""

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
    """GET  /api/v1/admin/payments/?status=PAID — view payments (admin + receptionist)
       POST /api/v1/admin/payments/             — record cash payment (admin + receptionist)
    """

    @staff_only
    def get(self, request):
        qs = Payment.objects.all().order_by("-created_at")
        status_filter = request.query_params.get("status")
        search        = request.query_params.get("search")
        if status_filter:
            qs = qs.filter(status=status_filter)
        if search:
            qs = qs.filter(
                Q(description__icontains=search) |
                Q(email__icontains=search)
            )
        return Response(AdminPaymentSerializer(qs, many=True).data)

    @staff_only
    def post(self, request):
        """Record a cash payment — receptionist & admin."""
        from django.utils import timezone
        import uuid

        booking_id  = request.data.get("bookingId")
        amount      = request.data.get("amount")
        description = request.data.get("description", "Cash payment at front desk")
        email       = request.data.get("email", "")

        if not booking_id or not amount:
            return Response(
                {"message": "bookingId and amount are required."},
                status=400,
            )

        try:
            booking = Booking.objects.get(pk=booking_id)
        except Booking.DoesNotExist:
            return Response({"message": "Booking not found."}, status=404)

        # Cannot modify payment amounts — use exact amount provided
        payment = Payment.objects.create(
            booking_id       = booking_id,
            amount           = Decimal(str(amount)),
            type             = "BALANCE",
            status           = "PAID",
            description      = description,
            email            = email or booking.user.email,
            paid_at          = timezone.now(),
            paymongo_link_id = f"CASH-{booking.booking_reference}-{uuid.uuid4().hex[:6].upper()}",
            checkout_url     = "",
        )
        return Response(AdminPaymentSerializer(payment).data, status=201)


class AdminPaymentDetailView(APIView):
    """GET /api/v1/admin/payments/<pk>/"""

    @staff_only
    def get(self, request, pk):
        try:
            payment = Payment.objects.get(pk=pk)
        except Payment.DoesNotExist:
            return Response({"message": "Payment not found."}, status=404)
        return Response(AdminPaymentSerializer(payment).data)


class AdminPaymentVerifyView(APIView):
    """POST /api/v1/admin/payments/<pk>/verify/
       Manually marks a payment as PAID — admin only.
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

        return Response({
            "message":   "Payment marked as PAID.",
            "paymentId": payment.pk,
        })
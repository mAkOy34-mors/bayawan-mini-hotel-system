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
import uuid
from decimal import Decimal
from datetime import date

from django.core.cache import cache
from django.db.models import Q
from django.utils import timezone
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


# ── Cache helpers ─────────────────────────────────────────────────────────────

def _clear_admin_booking_cache():
    cache.delete("admin_bookings_all")
    cache.delete("receptionist_bookings_all")


def _clear_admin_room_cache():
    version = cache.get("rooms_cache_version", 0) + 1
    cache.set("rooms_cache_version", version, timeout=None)
    cache.delete("admin_rooms_all")


def _clear_admin_payment_cache():
    cache.delete("admin_payments_all")
    cache.delete("receptionist_payments_all")


def _clear_admin_guest_cache():
    cache.delete("admin_guests_all")
    cache.delete("receptionist_guests_all")


# ── Permission helpers ────────────────────────────────────────────────────────

def is_admin(user):
    return user.is_authenticated and (
        getattr(user, "role", None) == "ADMIN" or
        getattr(user, "is_staff", False)
    )


def is_admin_or_receptionist(user):
    return user.is_authenticated and (
        getattr(user, "role", None) in ("ADMIN", "RECEPTIONIST") or
        getattr(user, "is_staff", False)
    )


def admin_only(view_func):
    """Decorator — Admin access only."""
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
    """GET/POST /api/v1/admin/rooms/"""

    @staff_only
    def get(self, request):
        cache_key = "admin_rooms_all"
        cached    = cache.get(cache_key)
        if cached:
            return Response(cached)

        rooms = Room.objects.all().order_by("room_number")
        data  = AdminRoomSerializer(rooms, many=True).data
        cache.set(cache_key, data, timeout=60)
        return Response(data)

    @admin_only
    def post(self, request):
        ser = AdminRoomSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        room = ser.save()
        _clear_admin_room_cache()
        return Response(AdminRoomSerializer(room).data, status=status.HTTP_201_CREATED)


class AdminRoomDetailView(APIView):
    """GET/PUT/DELETE /api/v1/admin/rooms/<pk>/"""

    @staff_only
    def get(self, request, pk):
        cache_key = f"admin_room_{pk}"
        cached    = cache.get(cache_key)
        if cached:
            return Response(cached)

        try:
            room = Room.objects.get(pk=pk)
        except Room.DoesNotExist:
            return Response({"message": "Room not found."}, status=404)

        data = AdminRoomSerializer(room).data
        cache.set(cache_key, data, timeout=60)
        return Response(data)

    @admin_only
    def put(self, request, pk):
        try:
            room = Room.objects.get(pk=pk)
        except Room.DoesNotExist:
            return Response({"message": "Room not found."}, status=404)

        ser = AdminRoomSerializer(room, data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        ser.save()

        # Clear room caches
        _clear_admin_room_cache()
        cache.delete(f"admin_room_{pk}")

        return Response(AdminRoomSerializer(room).data)

    @admin_only
    def delete(self, request, pk):
        try:
            room = Room.objects.get(pk=pk)
        except Room.DoesNotExist:
            return Response({"message": "Room not found."}, status=404)

        room.delete()
        _clear_admin_room_cache()
        cache.delete(f"admin_room_{pk}")
        return Response({"message": "Room deleted."}, status=status.HTTP_204_NO_CONTENT)


# ── Bookings ──────────────────────────────────────────────────────────────────

class AdminBookingsView(APIView):
    """GET/POST /api/v1/admin/bookings/"""

    @staff_only
    def get(self, request):
        status_filter = request.query_params.get("status", "")
        search        = request.query_params.get("search", "")
        check_in      = request.query_params.get("checkIn", "")

        # Only cache unfiltered requests
        if not status_filter and not search and not check_in:
            cached = cache.get("admin_bookings_all")
            if cached:
                return Response(cached)

        qs = Booking.objects.select_related(
            "room", "user", "guest_information"
        ).order_by("-created_at")

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

        data = AdminBookingSerializer(qs, many=True).data

        if not status_filter and not search and not check_in:
            cache.set("admin_bookings_all", data, timeout=30)

        return Response(data)

    @staff_only
    def post(self, request):
        """Create walk-in booking."""
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
            return Response({"message": f"Guest {guest_email} not found."}, status=404)

        try:
            room = Room.objects.get(pk=room_id)
        except Room.DoesNotExist:
            return Response({"message": "Room not found."}, status=404)

        check_in_date  = request.data.get("checkInDate")
        check_out_date = request.data.get("checkOutDate")
        total_amount   = Decimal(str(request.data.get("totalAmount", 0)))
        deposit_amount = Decimal(str(request.data.get("depositAmount", total_amount / 2)))
        num_guests     = request.data.get("numberOfGuests", 1)
        special_req    = request.data.get("specialRequests", "Walk-in booking")

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

        _clear_admin_booking_cache()
        cache.delete(f"my_bookings_{guest.id}")

        return Response(
            AdminBookingSerializer(booking).data,
            status=status.HTTP_201_CREATED,
        )


class AdminBookingDetailView(APIView):
    """GET /api/v1/admin/bookings/<pk>/"""

    @staff_only
    def get(self, request, pk):
        cache_key = f"admin_booking_{pk}"
        cached    = cache.get(cache_key)
        if cached:
            return Response(cached)

        try:
            booking = Booking.objects.select_related(
                "room", "user", "guest_information"
            ).get(pk=pk)
        except Booking.DoesNotExist:
            return Response({"message": "Booking not found."}, status=404)

        data = AdminBookingSerializer(booking).data
        cache.set(cache_key, data, timeout=30)
        return Response(data)


class AdminBookingStatusView(APIView):
    """POST /api/v1/admin/bookings/<pk>/status/"""

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

        if new_status == "CANCELLED" and not is_admin(request.user):
            return Response(
                {"message": "Only admin can cancel bookings."},
                status=403,
            )

        booking.status = new_status
        booking.save(update_fields=["status"])

        if booking.room:
            if new_status in ("CHECKED_IN", "CONFIRMED", "PENDING_DEPOSIT"):
                booking.room.available = False
            elif new_status in ("COMPLETED", "CANCELLED", "CHECKED_OUT"):
                booking.room.available = True
            booking.room.save(update_fields=["available"])
            _clear_admin_room_cache()

        # Clear booking caches
        _clear_admin_booking_cache()
        cache.delete(f"admin_booking_{pk}")
        cache.delete(f"receptionist_booking_{pk}")
        cache.delete(f"my_bookings_{booking.user_id}")

        return Response({
            "message": f"Booking status updated to {new_status}.",
            "status":  new_status,
        })


# ── Guests ────────────────────────────────────────────────────────────────────

class AdminGuestsView(APIView):
    """GET /api/v1/admin/guests/"""

    @staff_only
    def get(self, request):
        search = request.query_params.get("search", "")

        if not search:
            cache_key = "admin_guests_all"
            cached    = cache.get(cache_key)
            if cached:
                return Response(cached)

        qs = User.objects.filter(
            role__in=["USER", "RECEPTIONIST"]
        ).order_by("-created_at")

        if search:
            qs = qs.filter(
                Q(email__icontains=search) |
                Q(username__icontains=search)
            )

        if not is_admin(request.user):
            qs = qs.filter(role="USER")

        data = AdminGuestSerializer(qs, many=True).data

        if not search:
            cache.set("admin_guests_all", data, timeout=60)

        return Response(data)


class AdminGuestDetailView(APIView):
    """GET/PATCH /api/v1/admin/guests/<pk>/"""

    @staff_only
    def get(self, request, pk):
        cache_key = f"admin_guest_{pk}"
        cached    = cache.get(cache_key)
        if cached:
            return Response(cached)

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

        cache.set(cache_key, data, timeout=60)
        return Response(data)

    @staff_only
    def patch(self, request, pk):
        try:
            guest = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"message": "Guest not found."}, status=404)

        allowed_fields = ["username", "phone"]
        for field in allowed_fields:
            if field in request.data:
                setattr(guest, field, request.data[field])

        if "phone" in request.data:
            profile = GuestInformation.objects.filter(user=guest).first()
            if profile:
                profile.contact_number = request.data["phone"]
                profile.save(update_fields=["contact_number"])

        guest.save(update_fields=["username"] if "username" in request.data else [])

        # Clear guest caches
        _clear_admin_guest_cache()
        cache.delete(f"admin_guest_{pk}")
        cache.delete(f"receptionist_guest_{pk}")
        cache.delete(f"guest_profile_{pk}")

        return Response(AdminGuestSerializer(guest).data)


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

        # Clear guest caches
        _clear_admin_guest_cache()
        cache.delete(f"admin_guest_{pk}")
        cache.delete(f"receptionist_guest_{pk}")

        action = "activated" if guest.is_active else "deactivated"
        return Response({"message": f"Guest account {action}.", "isActive": guest.is_active})


# ── Payments ──────────────────────────────────────────────────────────────────

class AdminPaymentsView(APIView):
    """GET/POST /api/v1/admin/payments/"""

    @staff_only
    def get(self, request):
        status_filter = request.query_params.get("status", "")
        search        = request.query_params.get("search", "")

        if not status_filter and not search:
            cached = cache.get("admin_payments_all")
            if cached:
                return Response(cached)

        qs = Payment.objects.all().order_by("-created_at")
        if status_filter:
            qs = qs.filter(status=status_filter)
        if search:
            qs = qs.filter(
                Q(description__icontains=search) |
                Q(email__icontains=search)
            )

        data = AdminPaymentSerializer(qs, many=True).data

        if not status_filter and not search:
            cache.set("admin_payments_all", data, timeout=30)

        return Response(data)

    @staff_only
    def post(self, request):
        """Record a cash payment."""
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

        _clear_admin_payment_cache()
        cache.delete(f"my_payments_{booking.user.email}")

        return Response(AdminPaymentSerializer(payment).data, status=201)


class AdminPaymentDetailView(APIView):
    """GET /api/v1/admin/payments/<pk>/"""

    @staff_only
    def get(self, request, pk):
        cache_key = f"admin_payment_{pk}"
        cached    = cache.get(cache_key)
        if cached:
            return Response(cached)

        try:
            payment = Payment.objects.get(pk=pk)
        except Payment.DoesNotExist:
            return Response({"message": "Payment not found."}, status=404)

        data = AdminPaymentSerializer(payment).data
        cache.set(cache_key, data, timeout=30)
        return Response(data)


class AdminPaymentVerifyView(APIView):
    """POST /api/v1/admin/payments/<pk>/verify/ — admin only"""

    @admin_only
    def post(self, request, pk):
        try:
            payment = Payment.objects.get(pk=pk)
        except Payment.DoesNotExist:
            return Response({"message": "Payment not found."}, status=404)

        if payment.status == "PAID":
            return Response({"message": "Payment is already marked as PAID."})

        payment.status  = "PAID"
        payment.paid_at = timezone.now()
        payment.save(update_fields=["status", "paid_at"])

        # Clear caches
        _clear_admin_payment_cache()
        cache.delete(f"admin_payment_{pk}")
        cache.delete(f"my_payments_{payment.email}")

        return Response({
            "message":   "Payment marked as PAID.",
            "paymentId": payment.pk,
        })


# ── Staff Management ──────────────────────────────────────────────────────────

class CreateStaffView(APIView):
    """POST /api/v1/admin/staff/create/"""

    @admin_only
    def post(self, request):
        email    = request.data.get("email")
        username = request.data.get("username")
        password = request.data.get("password")
        role     = request.data.get("role", "RECEPTIONIST")

        if not email or not password:
            return Response({"message": "email and password are required."}, status=400)

        if role not in ["RECEPTIONIST", "ADMIN"]:
            return Response({"message": "Role must be RECEPTIONIST or ADMIN."}, status=400)

        if User.objects.filter(email=email).exists():
            return Response({"message": "Email already registered."}, status=409)

        user = User.objects.create(
            email    = email,
            username = username or email.split("@")[0],
            role     = role,
        )
        user.set_password(password)
        user.save()

        _clear_admin_guest_cache()

        return Response({
            "message":  f"{role} account created successfully.",
            "email":    user.email,
            "username": user.username,
            "role":     user.role,
        }, status=201)
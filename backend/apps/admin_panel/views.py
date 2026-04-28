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

from django.conf import settings
from django.core.cache import cache
from django.db.models import Q
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
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

from rest_framework.parsers import MultiPartParser, FormParser
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
import os


# Add these imports at the top if not already present
from django.contrib.auth import get_user_model
from django.db import transaction

User = get_user_model()


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

# apps/admin_panel/views.py

class AdminBookingsView(APIView):
    """GET /api/v1/admin/bookings/"""

    @staff_only
    def get(self, request):
        status_filter = request.query_params.get("status", "")
        search = request.query_params.get("search", "")
        check_in = request.query_params.get("checkIn", "")

        # Only cache unfiltered requests
        if not status_filter and not search and not check_in:
            cached = cache.get("admin_bookings_all")
            if cached:
                return Response(cached)

        # IMPORTANT: Add 'cancelled_by' to select_related
        qs = Booking.objects.select_related(
            "user", "guest_information", "room", "cancelled_by"  # ← ADD cancelled_by here
        ).order_by("-created_at")

        if status_filter:
            qs = qs.filter(status=status_filter)
        if search:
            qs = qs.filter(
                Q(booking_reference__icontains=search) |
                Q(user__email__icontains=search) |
                Q(user__username__icontains=search)
            )
        if check_in:
            qs = qs.filter(check_in_date=check_in)

        data = AdminBookingSerializer(qs, many=True).data

        if not status_filter and not search and not check_in:
            cache.set("admin_bookings_all", data, timeout=30)

        return Response(data)

# Also create a separate view for updating cancellation details if needed
class AdminCancelBookingView(APIView):
    """POST /api/v1/admin/bookings/<id>/cancel/ - Cancel a booking with reason"""

    @staff_only
    def post(self, request, booking_id):
        try:
            booking = Booking.objects.get(id=booking_id)
        except Booking.DoesNotExist:
            return Response(
                {"error": "Booking not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        # Check if already cancelled
        if booking.status == 'CANCELLED':
            return Response(
                {"error": "Booking is already cancelled."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get cancellation details
        cancellation_reason = request.data.get('reason', '')
        if not cancellation_reason:
            return Response(
                {"error": "Cancellation reason is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Update booking with cancellation details
        booking.status = 'CANCELLED'
        booking.cancellation_reason = cancellation_reason
        booking.cancelled_by = request.user
        booking.cancelled_at = timezone.now()
        booking.save()

        # Clear caches
        _clear_admin_booking_cache()
        cache.delete(f"my_bookings_{booking.user_id}")

        # Optional: Create refund payment if deposit was paid
        from apps.payments.models import Payment
        deposit_amount = float(booking.deposit_amount or 0)
        refund_amount = deposit_amount * 0.5

        if refund_amount > 0:
            # Check if refund already exists
            existing_refund = Payment.objects.filter(
                booking_id=booking.id,
                type='REFUND'
            ).exists()

            if not existing_refund:
                Payment.objects.create(
                    paymongo_link_id=f"REFUND_{booking.booking_reference}_{booking.id}",
                    checkout_url="",
                    email=booking.user.email,
                    description=f"Refund for cancelled booking {booking.booking_reference}",
                    amount=refund_amount,
                    status='REFUNDED',
                    type='REFUND',
                    booking_id=booking.id,
                    paid_at=timezone.now()
                )

        return Response({
            "success": True,
            "message": f"Booking #{booking.booking_reference} has been cancelled.",
            "cancellation_reason": cancellation_reason,
            "cancelled_by": request.user.username,
            "cancelled_at": booking.cancelled_at
        }, status=status.HTTP_200_OK)


class AdminGetCancellationDetailsView(APIView):
    """GET /api/v1/admin/bookings/<id>/cancellation/ - Get cancellation details"""

    @staff_only
    def get(self, request, booking_id):
        try:
            booking = Booking.objects.select_related('cancelled_by').get(id=booking_id)
        except Booking.DoesNotExist:
            return Response(
                {"error": "Booking not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        return Response({
            "is_cancelled": booking.status == 'CANCELLED',
            "cancellation_reason": booking.cancellation_reason,
            "cancelled_by": booking.cancelled_by.username if booking.cancelled_by else None,
            "cancelled_at": booking.cancelled_at,
            "cancelled_by_id": booking.cancelled_by_id
        })


# apps/admin_panel/views.py

# apps/admin_panel/views.py

class AdminBookingDetailView(APIView):
    """GET /api/v1/admin/bookings/<pk>/"""

    @staff_only
    def get(self, request, pk):  # Use 'pk' to match the URL pattern
        try:
            # Add 'cancelled_by' to select_related to include cancellation data
            booking = Booking.objects.select_related(
                'user', 'room', 'guest_information', 'cancelled_by'
            ).get(id=pk)
        except Booking.DoesNotExist:
            return Response(
                {"error": "Booking not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = AdminBookingSerializer(booking)
        return Response(serializer.data)

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
            role__in=["USER"]
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
        from apps.services.models import ServiceRequest
        from apps.feedback.models import Feedback

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

        # ── Bookings ──────────────────────────────────────────
        # Collect IDs upfront — Payment.booking_id is a plain BigIntegerField, not a FK.
        booking_ids     = list(bookings.values_list("id", flat=True))
        booking_ref_map = {b.id: b.booking_reference for b in bookings}

        bookings_data = [
            {
                "id":               b.id,
                "bookingReference": b.booking_reference,
                "status":           b.status,
                "paymentStatus":    b.payment_status,
                "checkInDate":      b.check_in_date,
                "checkOutDate":     b.check_out_date,
                "numberOfNights":   b.number_of_nights,
                "numberOfGuests":   b.number_of_guests,
                "totalAmount":      str(b.total_amount),
                "depositAmount":    str(b.deposit_amount),
                "remainingAmount":  str(b.remaining_amount),
                "specialRequests":  b.special_requests,
                "roomNumber":       b.room.room_number if b.room else None,
                "roomType":         b.room.room_type   if b.room else None,
                "createdAt":        b.created_at,
            }
            for b in bookings
        ]

        # ── Payments ──────────────────────────────────────────
        # Payment has no booking FK — filter by booking_id__in (BigIntegerField).
        payments_qs = Payment.objects.filter(
            booking_id__in=booking_ids
        ).order_by("-created_at")

        payments_data = [
            {
                "id":               p.id,
                "amount":           str(p.amount),
                "status":           p.status,
                "type":             p.type,
                "description":      p.description,
                "paymongoLinkId":   p.paymongo_link_id,
                "email":            p.email,
                "bookingReference": booking_ref_map.get(p.booking_id),
                "paidAt":           p.paid_at,
                "createdAt":        p.created_at,
            }
            for p in payments_qs
        ]

        # ── Service Requests ───────────────────────────────────
        # ServiceRequest has no user FK — linked by guest_email only.
        service_qs = ServiceRequest.objects.filter(
            guest_email=guest.email
        ).select_related("assigned_to").order_by("-created_at")

        service_requests_data = [
            {
                "id":            s.id,
                "serviceType":   s.get_service_type_display(),
                "description":   s.description,
                "status":        s.status,
                "priority":      s.priority,
                "roomNumber":    s.room_number,
                "assignedTo":    (s.assigned_to.get_username() or s.assigned_to.username)
                                 if s.assigned_to else None,
                "serviceCharge": str(s.service_charge),
                "isPaid":        s.is_paid,
                "startedAt":     s.started_at,
                "completedAt":   s.completed_at,
                "createdAt":     s.created_at,
            }
            for s in service_qs
        ]

        # ── Feedback ──────────────────────────────────────────
        feedback_qs = Feedback.objects.filter(
            user=guest
        ).select_related("booking", "room").order_by("-created_at")

        feedback_data = [
            {
                "id":                f.id,
                "bookingReference":  f.booking.booking_reference if f.booking else None,
                "roomNumber":        f.room.room_number if f.room else None,
                "overallRating":     f.overall_rating,
                "cleanlinessRating": f.cleanliness_rating,
                "serviceRating":     f.service_rating,
                "comfortRating":     f.comfort_rating,
                "valueRating":       f.value_rating,
                "averageRating":     f.average_rating,
                "comment":           f.comment,
                "likes":             f.likes,
                "improvements":      f.improvements,
                "isPublished":       f.is_published,
                "isResponded":       f.is_responded,
                "response":          f.response,
                "createdAt":         f.created_at,
            }
            for f in feedback_qs
        ]

        # ── Assemble ──────────────────────────────────────────
        data = AdminGuestSerializer(guest).data
        data["bookingCount"]    = bookings.count()
        data["profile"] = {
            "firstName":     profile.first_name     if profile else None,
            "lastName":      profile.last_name      if profile else None,
            "contactNumber": profile.contact_number if profile else None,
            "nationality":   profile.nationality    if profile else None,
            "address":       getattr(profile, "home_address", None) if profile else None,
        } if profile else None
        data["bookings"]        = bookings_data
        data["payments"]        = payments_data
        data["serviceRequests"] = service_requests_data
        data["feedback"]        = feedback_data

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


# ── User Management ──────────────────────────────────────────────────────────

# Replace the AdminUsersListView with this corrected version:

# apps/admin_panel/views.py - Updated to include employee information

class AdminUsersListView(APIView):
    """GET /api/v1/admin/users/ - Get all staff users"""

    @admin_only
    def get(self, request):
        cache_key = "admin_users_all"
        cached = cache.get(cache_key)
        if cached:
            return Response(cached)

        from apps.employees.models import EmployeeInformation

        employees = EmployeeInformation.objects.select_related('user').all().order_by('-created_at')

        users_data = []
        for emp in employees:
            user = emp.user

            users_data.append({
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'role': user.role,  # Use actual database role (RECEPTIONIST or ADMIN)
                'isActive': True,
                'firstName': emp.first_name,
                'lastName': emp.last_name,
                'contactNumber': emp.contact_number,
                'employeeId': emp.employee_id,
                'department': emp.department,
                'position': emp.position,  # Store position separately
                'hireDate': emp.hire_date,
                'createdAt': user.created_at,
                'updatedAt': user.updated_at,
            })

        cache.set(cache_key, users_data, timeout=60)
        return Response(users_data)


class AdminUserCreateView(APIView):
    """POST /api/v1/admin/users/create/ - Create a new user"""

    @admin_only
    @transaction.atomic
    def post(self, request):
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')

        # Get the role from frontend (can be RECEPTIONIST, HOUSEKEEPER, STAFF, ADMIN)
        frontend_role = request.data.get('role', 'STAFF')

        # Map frontend roles to database roles
        # Only RECEPTIONIST and ADMIN exist in the User table
        valid_roles = ['ADMIN', 'RECEPTIONIST', 'HOUSEKEEPER', 'STAFF', 'MAINTENANCE', 'SECURITY', 'FRONT_DESK', 'MANAGEMENT']
        db_role = frontend_role if frontend_role in valid_roles else 'STAFF'

        # Get employee information
        first_name = request.data.get('firstName', '')
        last_name = request.data.get('lastName', '')
        contact_number = request.data.get('contactNumber', '')
        employee_id = request.data.get('employeeId', '')
        department = request.data.get('department', '')
        position = request.data.get('position', frontend_role)  # Store the actual position
        hire_date = request.data.get('hireDate', timezone.now().date())

        # Validation
        if not username or not email or not password:
            return Response(
                {'error': 'Username, email, and password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if User.objects.filter(username=username).exists():
            return Response(
                {'error': 'Username already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if User.objects.filter(email=email).exists():
            return Response(
                {'error': 'Email already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create user with the mapped database role
        user = User.objects.create_user(
            email=email,
            username=username,
            password=password,
            role=db_role,
        )

        # Create employee information
        from apps.employees.models import EmployeeInformation

        if not employee_id:
            employee_id = f"EMP{user.id:06d}"

        EmployeeInformation.objects.create(
            user=user,
            first_name=first_name or username,
            last_name=last_name,
            contact_number=contact_number,
            employee_id=employee_id,
            department=department,
            position=position,  # This stores the actual frontend role (Receptionist, Housekeeper, Staff)
            hire_date=hire_date,
            home_address='',
            date_of_birth='2000-01-01',
        )

        # Clear cache
        cache.delete("admin_users_all")

        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'role': position,  # Return the position as the role for display
            'dbRole': db_role,  # Optional: return the actual database role
            'isActive': True,
            'firstName': first_name,
            'lastName': last_name,
            'employeeId': employee_id,
            'position': position,
            'message': 'User created successfully'
        }, status=status.HTTP_201_CREATED)


import logging

logger = logging.getLogger(__name__)


class AdminUserUpdateView(APIView):
    """PUT /api/v1/admin/users/<int:user_id>/ - Update user"""

    @admin_only
    @transaction.atomic
    def put(self, request, user_id):
        logger.info("=" * 50)
        logger.info(f"UPDATE USER {user_id}")
        logger.info(f"Request data: {request.data}")

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        # Update user fields
        username = request.data.get('username')
        email = request.data.get('email')
        frontend_role = request.data.get('role')

        logger.info(f"Current user role: {user.role}")
        logger.info(f"Frontend role received: {frontend_role}")

        if username and username != user.username:
            if User.objects.filter(username=username).exists():
                return Response({'error': 'Username already exists'}, status=400)
            user.username = username

        if email and email != user.email:
            if User.objects.filter(email=email).exists():
                return Response({'error': 'Email already exists'}, status=400)
            user.email = email

        # Update role in User table
        if frontend_role:
            valid_roles = ['ADMIN', 'RECEPTIONIST', 'HOUSEKEEPER', 'STAFF', 'MAINTENANCE', 'SECURITY', 'FRONT_DESK', 'MANAGEMENT']
            if frontend_role in valid_roles:
                user.role = frontend_role
                logger.info(f"Setting user.role to: {frontend_role}")
            else:
                logger.warning(f"Invalid role: {frontend_role}")

        # Update password if provided
        password = request.data.get('password')
        if password:
            user.set_password(password)

        user.save()
        logger.info(f"User saved. New role: {user.role}")

        # Update employee information
        from apps.employees.models import EmployeeInformation

        try:
            employee = EmployeeInformation.objects.get(user=user)
            logger.info(f"Found existing employee record")

            # Update employee fields
            employee.first_name = request.data.get('firstName', employee.first_name)
            employee.last_name = request.data.get('lastName', employee.last_name)
            employee.contact_number = request.data.get('contactNumber', employee.contact_number)
            employee.employee_id = request.data.get('employeeId', employee.employee_id)
            employee.department = request.data.get('department', employee.department)
            employee.position = request.data.get('position', frontend_role or employee.position)
            employee.save()
            logger.info(f"Employee position set to: {employee.position}")

        except EmployeeInformation.DoesNotExist:
            logger.info(f"Creating new employee record")
            employee = EmployeeInformation.objects.create(
                user=user,
                first_name=request.data.get('firstName', user.username),
                last_name=request.data.get('lastName', ''),
                contact_number=request.data.get('contactNumber', ''),
                employee_id=request.data.get('employeeId', f"EMP{user.id:06d}"),
                department=request.data.get('department', ''),
                position=request.data.get('position', frontend_role or 'STAFF'),
                hire_date=request.data.get('hireDate', timezone.now().date()),
                home_address='',
                date_of_birth='2000-01-01',
            )

        # Clear cache
        cache.delete("admin_users_all")
        cache.delete(f"admin_user_{user_id}")

        # Return the position as the role for display
        display_role = employee.position if employee else (frontend_role or user.role)
        logger.info(f"Returning role: {display_role}")
        logger.info("=" * 50)

        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'role': display_role,
            'isActive': True,
            'message': 'User updated successfully'
        })

class AdminUserDeleteView(APIView):
    """DELETE /api/v1/admin/users/<id>/delete/ - Delete user"""

    @admin_only
    def delete(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        # Prevent admin from deleting themselves
        if user.id == request.user.id:
            return Response({'error': 'You cannot delete your own account'}, status=400)

        username = user.username
        user.delete()

        # Clear cache
        cache.delete("admin_users_all")

        logger.info(f"Admin {request.user.username} deleted user {username}")

        return Response({'message': 'User deleted successfully'})


class AdminUserToggleStatusView(APIView):
    """PATCH /api/v1/admin/users/<id>/toggle-status/ - Enable/disable user"""

    @admin_only
    def patch(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        # Prevent admin from disabling themselves
        if user.id == request.user.id:
            return Response({'error': 'You cannot change your own status'}, status=400)

        is_active = request.data.get('isActive')
        if is_active is not None:
            user.is_active = is_active
            user.save()

        # Clear cache
        cache.delete("admin_users_all")
        cache.delete(f"admin_user_{user_id}")

        status_text = "enabled" if user.is_active else "disabled"
        logger.info(f"Admin {request.user.username} {status_text} user {user.username}")

        return Response({
            'id': user.id,
            'username': user.username,
            'isActive': user.is_active,
            'message': f'User {status_text} successfully'
        })


# apps/admin_panel/views.py

class AdminRoomUploadImageView(APIView):
    """POST /api/v1/admin/rooms/<room_id>/upload-image/"""
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    @admin_only
    def post(self, request, room_id):
        try:
            room = Room.objects.get(id=room_id)
        except Room.DoesNotExist:
            return Response({"error": "Room not found"}, status=404)

        if 'image' not in request.FILES:
            return Response({"error": "No image provided"}, status=400)

        image_file = request.FILES['image']

        # Generate unique filename
        file_extension = os.path.splitext(image_file.name)[1]
        filename = f"rooms/room_{room.room_number}_{uuid.uuid4().hex[:8]}{file_extension}"

        # Save file
        saved_path = default_storage.save(filename, ContentFile(image_file.read()))

        # Update room image URL
        image_url = f"{settings.MEDIA_URL}{saved_path}"
        room.image_url = image_url
        room.save()

        return Response({
            "message": "Image uploaded successfully",
            "image_url": image_url
        })
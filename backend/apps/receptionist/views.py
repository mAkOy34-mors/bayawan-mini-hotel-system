"""
apps/receptionist/views.py

Receptionist endpoints — role=RECEPTIONIST or role=ADMIN required.

GET  /api/v1/receptionist/dashboard/               → today's stats + quick overview
GET  /api/v1/receptionist/arrivals/                → today's check-ins
GET  /api/v1/receptionist/departures/              → today's check-outs
GET  /api/v1/receptionist/bookings/                → all bookings (?status=&search=)
GET  /api/v1/receptionist/bookings/<pk>/           → booking detail
POST /api/v1/receptionist/bookings/<pk>/checkin/   → check in guest
POST /api/v1/receptionist/bookings/<pk>/checkout/  → check out guest
POST /api/v1/receptionist/bookings/walkin/         → create walk-in booking
GET  /api/v1/receptionist/guests/                  → guest list (?search=)
GET  /api/v1/receptionist/guests/<pk>/             → guest detail
PATCH /api/v1/receptionist/guests/<pk>/            → edit guest contact info
GET  /api/v1/receptionist/rooms/                   → all rooms with status
PATCH /api/v1/receptionist/rooms/<pk>/status/      → update room status
GET  /api/v1/receptionist/payments/                → payment records
POST /api/v1/receptionist/payments/cash/           → record cash payment
"""
import logging
import uuid
from datetime import date

from django.db.models import Q, Sum
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.bookings.models import Booking
from apps.guests.models import GuestInformation
from apps.payments.models import Payment
from apps.rooms.models import Room
from apps.users.models import User

logger = logging.getLogger(__name__)


def is_receptionist(user):
    """Allow RECEPTIONIST and ADMIN roles."""
    return user.is_authenticated and (
        getattr(user, "role", None) in ["RECEPTIONIST", "ADMIN"]
        or user.is_staff
    )


def receptionist_check(request):
    if not is_receptionist(request.user):
        return Response(
            {"message": "Forbidden. Receptionist or Admin access required."},
            status=status.HTTP_403_FORBIDDEN,
        )
    return None


# ── Dashboard ─────────────────────────────────────────────────────────────────

class ReceptionistDashboardView(APIView):
    """GET /api/v1/receptionist/dashboard/"""

    def get(self, request):
        err = receptionist_check(request)
        if err:
            return err

        today = date.today()

        arrivals_today   = Booking.objects.filter(check_in_date=today, status=Booking.BookingStatus.CONFIRMED).count()
        departures_today = Booking.objects.filter(check_out_date=today, status=Booking.BookingStatus.CHECKED_IN).count()
        checked_in_now   = Booking.objects.filter(status=Booking.BookingStatus.CHECKED_IN).count()
        available_rooms  = Room.objects.filter(available=True).count()
        total_rooms      = Room.objects.count()
        pending_payments = Booking.objects.filter(
            payment_status=Booking.PaymentStatus.UNPAID,
            status=Booking.BookingStatus.CONFIRMED,
        ).count()

        # Today's expected arrivals list
        arrivals = Booking.objects.filter(
            check_in_date=today,
            status__in=[Booking.BookingStatus.CONFIRMED, Booking.BookingStatus.PENDING_DEPOSIT],
        ).select_related("room", "user").values(
            "id", "booking_reference",
            "user__email", "user__username",
            "room__room_number", "room__room_type",
            "number_of_guests", "status", "payment_status",
            "check_in_date", "check_out_date",
        )

        # Today's expected departures list
        departures = Booking.objects.filter(
            check_out_date=today,
            status=Booking.BookingStatus.CHECKED_IN,
        ).select_related("room", "user").values(
            "id", "booking_reference",
            "user__email", "user__username",
            "room__room_number", "room__room_type",
            "status", "payment_status", "remaining_amount",
            "check_in_date", "check_out_date",
        )

        return Response({
            "date":             str(today),
            "arrivalsToday":    arrivals_today,
            "departuresToday":  departures_today,
            "checkedInNow":     checked_in_now,
            "availableRooms":   available_rooms,
            "totalRooms":       total_rooms,
            "pendingPayments":  pending_payments,
            "arrivals":         list(arrivals),
            "departures":       list(departures),
        })


# ── Arrivals & Departures ─────────────────────────────────────────────────────

class ArrivalsView(APIView):
    """GET /api/v1/receptionist/arrivals/?date=YYYY-MM-DD"""

    def get(self, request):
        err = receptionist_check(request)
        if err:
            return err

        date_str  = request.query_params.get("date", str(date.today()))
        try:
            target_date = date.fromisoformat(date_str)
        except ValueError:
            return Response({"message": "Invalid date format."}, status=400)

        bookings = Booking.objects.filter(
            check_in_date=target_date,
            status__in=[
                Booking.BookingStatus.CONFIRMED,
                Booking.BookingStatus.PENDING_DEPOSIT,
            ],
        ).select_related("room", "user", "guest_information").order_by("created_at")

        data = [_booking_detail(b) for b in bookings]
        return Response({"date": str(target_date), "count": len(data), "arrivals": data})


class DeparturesView(APIView):
    """GET /api/v1/receptionist/departures/?date=YYYY-MM-DD"""

    def get(self, request):
        err = receptionist_check(request)
        if err:
            return err

        date_str = request.query_params.get("date", str(date.today()))
        try:
            target_date = date.fromisoformat(date_str)
        except ValueError:
            return Response({"message": "Invalid date format."}, status=400)

        bookings = Booking.objects.filter(
            check_out_date=target_date,
            status=Booking.BookingStatus.CHECKED_IN,
        ).select_related("room", "user", "guest_information").order_by("created_at")

        data = [_booking_detail(b) for b in bookings]
        return Response({"date": str(target_date), "count": len(data), "departures": data})


# ── Bookings ──────────────────────────────────────────────────────────────────

class ReceptionistBookingsView(APIView):
    """GET /api/v1/receptionist/bookings/?status=&search="""

    def get(self, request):
        err = receptionist_check(request)
        if err:
            return err

        qs = Booking.objects.select_related(
            "room", "user", "guest_information"
        ).order_by("-created_at")

        status_filter = request.query_params.get("status")
        search        = request.query_params.get("search", "")

        if status_filter:
            qs = qs.filter(status=status_filter)
        if search:
            qs = qs.filter(
                Q(booking_reference__icontains=search) |
                Q(user__email__icontains=search) |
                Q(user__username__icontains=search)
            )

        return Response([_booking_detail(b) for b in qs[:100]])


class ReceptionistBookingDetailView(APIView):
    """GET /api/v1/receptionist/bookings/<pk>/"""

    def get(self, request, pk):
        err = receptionist_check(request)
        if err:
            return err

        try:
            booking = Booking.objects.select_related(
                "room", "user", "guest_information"
            ).get(pk=pk)
        except Booking.DoesNotExist:
            return Response({"message": "Booking not found."}, status=404)

        data = _booking_detail(booking)

        # Include payments for this booking
        payments = Payment.objects.filter(booking_id=booking.id).order_by("-created_at")
        data["payments"] = [
            {
                "id":          p.id,
                "amount":      float(p.amount),
                "status":      p.status,
                "type":        p.type,
                "description": p.description,
                "createdAt":   p.created_at.isoformat(),
                "paidAt":      p.paid_at.isoformat() if p.paid_at else None,
            }
            for p in payments
        ]

        return Response(data)


class CheckInView(APIView):
    """
    POST /api/v1/receptionist/bookings/<pk>/checkin/
    Marks a confirmed booking as checked in.
    """

    def post(self, request, pk):
        err = receptionist_check(request)
        if err:
            return err

        try:
            booking = Booking.objects.select_related("room").get(pk=pk)
        except Booking.DoesNotExist:
            return Response({"message": "Booking not found."}, status=404)

        if booking.status not in [
            Booking.BookingStatus.CONFIRMED,
            Booking.BookingStatus.PENDING_DEPOSIT,
        ]:
            return Response(
                {"message": f"Cannot check in a booking with status {booking.status}."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        notes = request.data.get("notes", "")

        booking.status = Booking.BookingStatus.CHECKED_IN
        booking.save(update_fields=["status"])

        # Mark room as unavailable
        room = booking.room
        room.available = False
        room.save(update_fields=["available"])

        logger.info(
            "Guest checked in: booking %s, room %s, by receptionist %s",
            booking.booking_reference, room.room_number, request.user.id,
        )

        return Response({
            "message":          f"Guest checked in to Room {room.room_number} successfully.",
            "bookingReference": booking.booking_reference,
            "roomNumber":       room.room_number,
            "status":           booking.status,
            "checkInDate":      str(booking.check_in_date),
            "checkOutDate":     str(booking.check_out_date),
        })


class CheckOutView(APIView):
    """
    POST /api/v1/receptionist/bookings/<pk>/checkout/
    Marks a checked-in booking as completed.
    """

    def post(self, request, pk):
        err = receptionist_check(request)
        if err:
            return err

        try:
            booking = Booking.objects.select_related("room").get(pk=pk)
        except Booking.DoesNotExist:
            return Response({"message": "Booking not found."}, status=404)

        if booking.status != Booking.BookingStatus.CHECKED_IN:
            return Response(
                {"message": f"Cannot check out a booking with status {booking.status}."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        remaining = float(booking.remaining_amount or 0)

        booking.status = Booking.BookingStatus.COMPLETED
        if booking.payment_status != Booking.PaymentStatus.FULLY_PAID:
            booking.payment_status = Booking.PaymentStatus.FULLY_PAID
            booking.remaining_amount = 0
            booking.balance_paid_at  = timezone.now()
        booking.save()

        # Mark room as available again
        room = booking.room
        room.available = True
        room.save(update_fields=["available"])

        logger.info(
            "Guest checked out: booking %s, room %s, by receptionist %s",
            booking.booking_reference, room.room_number, request.user.id,
        )

        return Response({
            "message":          f"Guest checked out from Room {room.room_number} successfully.",
            "bookingReference": booking.booking_reference,
            "roomNumber":       room.room_number,
            "status":           booking.status,
            "remainingPaid":    remaining,
        })


class WalkInBookingView(APIView):
    """
    POST /api/v1/receptionist/bookings/walkin/
    Create an on-the-spot booking for walk-in guests.

    Body:
    {
        "roomId": 1,
        "guestEmail": "guest@example.com",
        "guestName": "Juan Dela Cruz",
        "checkInDate": "2026-03-16",
        "checkOutDate": "2026-03-18",
        "numberOfGuests": 2,
        "paymentMethod": "CASH",
        "amountPaid": 2800.00,
        "specialRequests": ""
    }
    """

    def post(self, request):
        err = receptionist_check(request)
        if err:
            return err

        data = request.data

        # Validate required fields
        required = ["roomId", "guestEmail", "checkInDate", "checkOutDate"]
        for field in required:
            if not data.get(field):
                return Response(
                    {"message": f"{field} is required."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # Get room
        try:
            room = Room.objects.get(id=data["roomId"], available=True)
        except Room.DoesNotExist:
            return Response({"message": "Room not found or not available."}, status=404)

        # Get or create user by email
        email = data["guestEmail"].lower().strip()
        user  = User.objects.filter(email=email).first()
        if not user:
            username = email.split("@")[0]
            user = User.objects.create(
                email    = email,
                username = username,
                role     = "USER",
            )
            user.set_unusable_password()
            user.save()

        # Get guest information if exists
        guest_info = GuestInformation.objects.filter(user=user).first()

        from datetime import date as date_cls
        check_in  = date_cls.fromisoformat(data["checkInDate"])
        check_out = date_cls.fromisoformat(data["checkOutDate"])
        nights    = (check_out - check_in).days

        if nights <= 0:
            return Response({"message": "Check-out must be after check-in."}, status=400)

        total_amount   = float(data.get("amountPaid") or room.price_per_night * nights)
        deposit_amount = total_amount
        remaining      = 0

        booking_reference = f"WALK-{uuid.uuid4().hex[:8].upper()}"

        booking = Booking.objects.create(
            booking_reference    = booking_reference,
            user                 = user,
            guest_information_id = guest_info.id if guest_info else None,
            room                 = room,
            check_in_date        = check_in,
            check_out_date       = check_out,
            number_of_guests     = int(data.get("numberOfGuests", 1)),
            number_of_nights     = nights,
            total_amount         = total_amount,
            deposit_amount       = deposit_amount,
            remaining_amount     = remaining,
            special_requests     = data.get("specialRequests", ""),
            status               = Booking.BookingStatus.CHECKED_IN,
            payment_status       = Booking.PaymentStatus.FULLY_PAID,
        )

        # Mark room as unavailable
        room.available = False
        room.save(update_fields=["available"])

        # Record cash payment
        payment_method = data.get("paymentMethod", "CASH")
        Payment.objects.create(
            paymongo_link_id = f"CASH-{booking_reference}",
            checkout_url     = "",
            email            = email,
            description      = f"Walk-in payment for booking {booking_reference}",
            amount           = total_amount,
            status           = "PAID",
            type             = "ROOM_BOOKING",
            booking_id       = booking.id,
            paid_at          = timezone.now(),
        )

        logger.info(
            "Walk-in booking %s created by receptionist %s for guest %s",
            booking_reference, request.user.id, email,
        )

        return Response({
            "message":          "Walk-in booking created and guest checked in.",
            "bookingReference": booking_reference,
            "roomNumber":       room.room_number,
            "guestEmail":       email,
            "checkInDate":      str(check_in),
            "checkOutDate":     str(check_out),
            "nights":           nights,
            "totalAmount":      total_amount,
            "paymentMethod":    payment_method,
        }, status=status.HTTP_201_CREATED)


# ── Guests ────────────────────────────────────────────────────────────────────

class ReceptionistGuestsView(APIView):
    """GET /api/v1/receptionist/guests/?search="""

    def get(self, request):
        err = receptionist_check(request)
        if err:
            return err

        search = request.query_params.get("search", "")
        qs     = User.objects.filter(role="USER").order_by("-created_at")

        if search:
            qs = qs.filter(
                Q(email__icontains=search) |
                Q(username__icontains=search)
            )

        data = [
            {
                "id":        u.id,
                "username":  u.username,
                "email":     u.email,
                "isActive":  u.is_active,
                "createdAt": u.created_at.isoformat() if u.created_at else None,
            }
            for u in qs[:50]
        ]
        return Response(data)


class ReceptionistGuestDetailView(APIView):
    """
    GET   /api/v1/receptionist/guests/<pk>/  → guest detail + bookings
    PATCH /api/v1/receptionist/guests/<pk>/  → edit contact info only
    """

    def get(self, request, pk):
        err = receptionist_check(request)
        if err:
            return err

        try:
            guest = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"message": "Guest not found."}, status=404)

        profile  = GuestInformation.objects.filter(user=guest).first()
        bookings = Booking.objects.filter(user=guest).select_related("room").order_by("-created_at")

        return Response({
            "id":        guest.id,
            "username":  guest.username,
            "email":     guest.email,
            "isActive":  guest.is_active,
            "createdAt": guest.created_at.isoformat() if guest.created_at else None,
            "profile": {
                "firstName":     profile.first_name if profile else None,
                "lastName":      profile.last_name if profile else None,
                "contactNumber": profile.contact_number if profile else None,
                "nationality":   profile.nationality if profile else None,
                "homeAddress":   profile.home_address if profile else None,
                "idType":        profile.id_type if profile else None,
            } if profile else None,
            "bookings": [
                {
                    "id":               b.id,
                    "bookingReference": b.booking_reference,
                    "roomNumber":       b.room.room_number,
                    "roomType":         b.room.room_type,
                    "checkInDate":      str(b.check_in_date),
                    "checkOutDate":     str(b.check_out_date),
                    "status":           b.status,
                    "paymentStatus":    b.payment_status,
                    "totalAmount":      float(b.total_amount),
                }
                for b in bookings[:20]
            ],
        })

    def patch(self, request, pk):
        err = receptionist_check(request)
        if err:
            return err

        try:
            guest = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"message": "Guest not found."}, status=404)

        # Receptionist can only edit contact info in guest_information
        profile = GuestInformation.objects.filter(user=guest).first()
        if not profile:
            return Response({"message": "Guest profile not found."}, status=404)

        # Only allow safe fields — no ID changes
        allowed = ["contact_number", "home_address"]
        updated = []
        for field in allowed:
            camel = "contactNumber" if field == "contact_number" else "homeAddress"
            if camel in request.data:
                setattr(profile, field, request.data[camel])
                updated.append(camel)

        if updated:
            profile.save(update_fields=allowed[:len(updated)])
            logger.info(
                "Guest %s contact info updated by receptionist %s",
                pk, request.user.id,
            )

        return Response({
            "message":       "Guest contact info updated.",
            "updatedFields": updated,
        })


# ── Rooms ─────────────────────────────────────────────────────────────────────

class ReceptionistRoomsView(APIView):
    """GET /api/v1/receptionist/rooms/"""

    def get(self, request):
        err = receptionist_check(request)
        if err:
            return err

        rooms = Room.objects.all().order_by("room_number")

        # Get current occupied rooms
        occupied_room_ids = set(
            Booking.objects.filter(
                status=Booking.BookingStatus.CHECKED_IN
            ).values_list("room_id", flat=True)
        )

        data = [
            {
                "id":           r.id,
                "roomNumber":   r.room_number,
                "roomType":     r.room_type,
                "pricePerNight": float(r.price_per_night),
                "maxOccupancy": r.max_occupancy,
                "available":    r.available,
                "amenities":    r.amenities,
                "imageUrl":     r.image_url,
                "isOccupied":   r.id in occupied_room_ids,
                "currentStatus": (
                    "OCCUPIED"   if r.id in occupied_room_ids else
                    "AVAILABLE"  if r.available else
                    "UNAVAILABLE"
                ),
            }
            for r in rooms
        ]
        return Response(data)


class ReceptionistRoomStatusView(APIView):
    """
    PATCH /api/v1/receptionist/rooms/<pk>/status/
    Update room availability (available/unavailable/maintenance).
    Body: { "available": true/false, "reason": "cleaning" }
    """

    def patch(self, request, pk):
        err = receptionist_check(request)
        if err:
            return err

        try:
            room = Room.objects.get(pk=pk)
        except Room.DoesNotExist:
            return Response({"message": "Room not found."}, status=404)

        # Cannot change status of an occupied room
        is_occupied = Booking.objects.filter(
            room=room,
            status=Booking.BookingStatus.CHECKED_IN,
        ).exists()

        if is_occupied:
            return Response(
                {"message": "Cannot change status of an occupied room."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        available = request.data.get("available")
        if available is None:
            return Response({"message": "available field is required."}, status=400)

        room.available = bool(available)
        room.save(update_fields=["available"])

        logger.info(
            "Room %s status changed to %s by receptionist %s",
            room.room_number,
            "available" if room.available else "unavailable",
            request.user.id,
        )

        return Response({
            "message":    f"Room {room.room_number} marked as {'available' if room.available else 'unavailable'}.",
            "roomNumber": room.room_number,
            "available":  room.available,
        })


# ── Payments ──────────────────────────────────────────────────────────────────

class ReceptionistPaymentsView(APIView):
    """GET /api/v1/receptionist/payments/?search=&status="""

    def get(self, request):
        err = receptionist_check(request)
        if err:
            return err

        qs            = Payment.objects.all().order_by("-created_at")
        status_filter = request.query_params.get("status")
        search        = request.query_params.get("search", "")

        if status_filter:
            qs = qs.filter(status=status_filter)
        if search:
            qs = qs.filter(
                Q(email__icontains=search) |
                Q(description__icontains=search)
            )

        data = [
            {
                "id":            p.id,
                "paymongoLinkId": p.paymongo_link_id,
                "email":         p.email,
                "description":   p.description,
                "amount":        float(p.amount),
                "status":        p.status,
                "type":          p.type,
                "bookingId":     p.booking_id,
                "createdAt":     p.created_at.isoformat(),
                "paidAt":        p.paid_at.isoformat() if p.paid_at else None,
            }
            for p in qs[:100]
        ]
        return Response(data)


class RecordCashPaymentView(APIView):
    """
    POST /api/v1/receptionist/payments/cash/
    Record a cash payment for a booking balance.

    Body:
    {
        "bookingId": 1,
        "amount": 1400.00,
        "description": "Balance payment at check-out"
    }
    """

    def post(self, request):
        err = receptionist_check(request)
        if err:
            return err

        booking_id  = request.data.get("bookingId")
        amount      = request.data.get("amount")
        description = request.data.get("description", "Cash payment at front desk")

        if not booking_id or not amount:
            return Response(
                {"message": "bookingId and amount are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            booking = Booking.objects.get(id=booking_id)
        except Booking.DoesNotExist:
            return Response({"message": "Booking not found."}, status=404)

        # Create cash payment record
        payment = Payment.objects.create(
            paymongo_link_id = f"CASH-{booking.booking_reference}-{uuid.uuid4().hex[:6].upper()}",
            checkout_url     = "",
            email            = booking.user.email,
            description      = description,
            amount           = float(amount),
            status           = "PAID",
            type             = "BALANCE",
            booking_id       = booking.id,
            paid_at          = timezone.now(),
        )

        # Update booking payment status
        remaining = float(booking.remaining_amount or 0) - float(amount)
        if remaining <= 0:
            booking.payment_status   = Booking.PaymentStatus.FULLY_PAID
            booking.remaining_amount = 0
            booking.balance_paid_at  = timezone.now()
        else:
            booking.remaining_amount = remaining
        booking.save()

        logger.info(
            "Cash payment ₱%.2f recorded for booking %s by receptionist %s",
            float(amount), booking.booking_reference, request.user.id,
        )

        return Response({
            "message":          f"Cash payment of ₱{float(amount):.2f} recorded.",
            "paymentId":        payment.id,
            "bookingReference": booking.booking_reference,
            "remainingBalance": float(booking.remaining_amount),
            "paymentStatus":    booking.payment_status,
        }, status=status.HTTP_201_CREATED)


# ── Helper ────────────────────────────────────────────────────────────────────

def _booking_detail(booking):
    """Serialize a booking to a dict for receptionist views."""
    profile = booking.guest_information if hasattr(booking, "guest_information") else None
    try:
        profile = booking.guest_information
    except Exception:
        profile = None

    return {
        "id":               booking.id,
        "bookingReference": booking.booking_reference,
        "guestEmail":       booking.user.email,
        "guestUsername":    booking.user.username,
        "roomNumber":       booking.room.room_number,
        "roomType":         booking.room.room_type,
        "checkInDate":      str(booking.check_in_date),
        "checkOutDate":     str(booking.check_out_date),
        "numberOfNights":   booking.number_of_nights,
        "numberOfGuests":   booking.number_of_guests,
        "totalAmount":      float(booking.total_amount),
        "depositAmount":    float(booking.deposit_amount),
        "remainingAmount":  float(booking.remaining_amount),
        "status":           booking.status,
        "paymentStatus":    booking.payment_status,
        "specialRequests":  booking.special_requests or "",
        "createdAt":        booking.created_at.isoformat(),
        "guestProfile": {
            "firstName":     profile.first_name if profile else None,
            "lastName":      profile.last_name if profile else None,
            "contactNumber": profile.contact_number if profile else None,
            "nationality":   profile.nationality if profile else None,
            "idType":        profile.id_type if profile else None,
            "idNumber":      profile.id_number if profile else None,
        } if profile else None,
    }
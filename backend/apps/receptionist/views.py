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
import json
import random
import string
from datetime import date
from decimal import Decimal

from rest_framework.permissions import IsAuthenticated

from apps.utils.email import send_walkin_welcome_email
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

logger = logging.getLogger(__name__)
from django.db.models import Count, Case, When, IntegerField

# ── Cache helpers ─────────────────────────────────────────────────────────────

def _clear_booking_cache():
    """Clear all booking-related caches."""
    today = date.today()
    cache.delete(f"receptionist_dashboard_{today}")
    cache.delete(f"receptionist_arrivals_{today}")
    cache.delete(f"receptionist_departures_{today}")
    cache.delete("receptionist_bookings_all")


def _clear_room_cache():
    """Increment room cache version to invalidate all room caches."""
    version = cache.get("rooms_cache_version", 0) + 1
    cache.set("rooms_cache_version", version, timeout=None)


# ── Auth ──────────────────────────────────────────────────────────────────────

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


def _booking_payload(booking):
    """Shared booking dict returned in check-in/out responses."""
    # Get guest name from GuestInformation if available
    guest_name = None
    try:
        if booking.guest_information and booking.guest_information.first_name:
            guest_name = f"{booking.guest_information.first_name} {booking.guest_information.last_name}".strip()
    except:
        pass

    # Fallback to username if no GuestInformation
    if not guest_name:
        guest_name = booking.user.username

    return {
        "id": booking.id,
        "reference": booking.booking_reference,
        "guestName": guest_name,
        "roomType": booking.room.room_type if booking.room else None,
        "roomNumber": booking.room.room_number if booking.room else None,
        "checkInDate": str(booking.check_in_date),
        "checkOutDate": str(booking.check_out_date),
        "totalAmount": float(booking.total_amount),
        "depositAmount": float(booking.deposit_amount),
        "remainingAmount": float(booking.remaining_amount),
        "paymentStatus": booking.payment_status,
        "status": booking.status,
    }


def _booking_is_fully_paid(booking) -> bool:
    """
    Returns True when the guest owes nothing more.
    """
    if booking.payment_status == Booking.PaymentStatus.FULLY_PAID:
        return True

    # Check remaining_amount
    remaining = getattr(booking, "remaining_amount", None)
    if remaining is not None:
        from decimal import Decimal
        try:
            if Decimal(str(remaining)) <= Decimal("0"):
                return True
        except:
            if float(remaining) <= 0:
                return True

    return False
# ── Dashboard ─────────────────────────────────────────────────────────────────

class ReceptionistDashboardView(APIView):
    """GET /api/v1/receptionist/dashboard/"""

    def get(self, request):
        err = receptionist_check(request)
        if err:
            return err

        today     = date.today()
        cache_key = f"receptionist_dashboard_{today}"
        cached    = cache.get(cache_key)
        if cached:
            return Response(cached)

        booking_counts = Booking.objects.aggregate(
            arrivals_today=Count(Case(When(check_in_date=today, status=Booking.BookingStatus.CONFIRMED, then=1),
                                      output_field=IntegerField())),
            departures_today=Count(Case(When(check_out_date=today, status=Booking.BookingStatus.CHECKED_IN, then=1),
                                        output_field=IntegerField())),
            checked_in_now=Count(
                Case(When(status=Booking.BookingStatus.CHECKED_IN, then=1), output_field=IntegerField())),
            pending_payments=Count(
                Case(When(payment_status=Booking.PaymentStatus.UNPAID, status=Booking.BookingStatus.CONFIRMED, then=1),
                     output_field=IntegerField())),
        )

        # 1 query — both room counts at once
        room_counts = Room.objects.aggregate(
            total=Count("id"),
            available=Count(Case(When(available=True, then=1), output_field=IntegerField())),
        )

        arrivals_today = booking_counts["arrivals_today"]
        departures_today = booking_counts["departures_today"]
        checked_in_now = booking_counts["checked_in_now"]
        pending_payments = booking_counts["pending_payments"]
        available_rooms = room_counts["available"]
        total_rooms = room_counts["total"]

        arrivals = list(Booking.objects.filter(
            check_in_date=today,
            status__in=[Booking.BookingStatus.CONFIRMED, Booking.BookingStatus.PENDING_DEPOSIT],
        ).select_related("room", "user").values(
            "id", "booking_reference",
            "user__email", "user__username",
            "room__room_number", "room__room_type",
            "number_of_guests", "status", "payment_status",
            "check_in_date", "check_out_date",
        ))

        departures = list(Booking.objects.filter(
            check_out_date=today,
            status=Booking.BookingStatus.CHECKED_IN,
        ).select_related("room", "user").values(
            "id", "booking_reference",
            "user__email", "user__username",
            "room__room_number", "room__room_type",
            "status", "payment_status", "remaining_amount",
            "check_in_date", "check_out_date",
        ))

        data = {
            "date":             str(today),
            "arrivalsToday":    arrivals_today,
            "departuresToday":  departures_today,
            "checkedInNow":     checked_in_now,
            "availableRooms":   available_rooms,
            "totalRooms":       total_rooms,
            "pendingPayments":  pending_payments,
            "arrivals":         arrivals,
            "departures":       departures,
        }

        cache.set(cache_key, data, timeout=30)
        return Response(data)


# ── Arrivals & Departures ─────────────────────────────────────────────────────

class ArrivalsView(APIView):
    """GET /api/v1/receptionist/arrivals/?date=YYYY-MM-DD"""

    def get(self, request):
        err = receptionist_check(request)
        if err:
            return err

        date_str = request.query_params.get("date", str(date.today()))
        try:
            target_date = date.fromisoformat(date_str)
        except ValueError:
            return Response({"message": "Invalid date format."}, status=400)

        cache_key = f"receptionist_arrivals_{target_date}"
        cached    = cache.get(cache_key)
        if cached:
            return Response(cached)

        bookings = Booking.objects.filter(
            check_in_date=target_date,
            status__in=[
                Booking.BookingStatus.CONFIRMED,
                Booking.BookingStatus.PENDING_DEPOSIT,
            ],
        ).select_related("room", "user", "guest_information").order_by("created_at")

        data = {
            "date":     str(target_date),
            "count":    bookings.count(),
            "arrivals": [_booking_detail(b) for b in bookings],
        }

        cache.set(cache_key, data, timeout=30)
        return Response(data)


# apps/receptionist/views.py

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

        # Get bookings checking out today that are checked in
        bookings = Booking.objects.filter(
            check_out_date=target_date,
            status=Booking.BookingStatus.CHECKED_IN,
        ).select_related("room", "user", "guest_information").order_by("created_at")

        # Return as array directly (not wrapped in an object)
        data = [_booking_detail(b) for b in bookings]

        return Response(data)  # Return array directly

# ── Bookings ──────────────────────────────────────────────────────────────────

class ReceptionistBookingsView(APIView):
    """GET /api/v1/receptionist/bookings/?status=&search="""

    def get(self, request):
        err = receptionist_check(request)
        if err:
            return err

        status_filter = request.query_params.get("status", "")
        search        = request.query_params.get("search", "")

        if not status_filter and not search:
            cached = cache.get("receptionist_bookings_all")
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
                Q(user__email__icontains=search) |
                Q(user__username__icontains=search)
            )

        data = [_booking_detail(b) for b in qs[:100]]

        if not status_filter and not search:
            cache.set("receptionist_bookings_all", data, timeout=30)

        return Response(data)


class ReceptionistBookingDetailView(APIView):
    """GET /api/v1/receptionist/bookings/<pk>/"""

    def get(self, request, pk):
        err = receptionist_check(request)
        if err:
            return err

        cache_key = f"receptionist_booking_{pk}"
        cached    = cache.get(cache_key)
        if cached:
            return Response(cached)

        try:
            booking = Booking.objects.select_related(
                "room", "user", "guest_information"
            ).get(pk=pk)
        except Booking.DoesNotExist:
            return Response({"message": "Booking not found."}, status=404)

        data     = _booking_detail(booking)
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

        cache.set(cache_key, data, timeout=30)
        return Response(data)


class CheckInView(APIView):
    """
    POST /api/v1/receptionist/bookings/<pk>/checkin/

    Optional body: { "force": true }
      - force=true skips the payment gate (used when receptionist has
        already collected payment via PaymentModal)
    """

    def post(self, request, pk):
        try:
            booking = (
                Booking.objects
                .select_related("room", "user")
                .get(pk=pk)
            )
        except Booking.DoesNotExist:
            return Response(
                {"success": False, "error": "Booking not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        force = request.data.get("force", False)

        # ── Status checks ────────────────────────────────────────────
        if booking.status == Booking.BookingStatus.CHECKED_IN:
            return Response(
                {"success": False, "error": "Guest is already checked in."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ── Payment gate (skippable with force=True) ─────────────────
        if not force and not _booking_is_fully_paid(booking):
            return Response(
                {
                    "success": False,
                    "payment_required": True,
                    "booking": _booking_payload(booking),
                    "message": "Balance must be paid before check-in.",
                },
                status=status.HTTP_402_PAYMENT_REQUIRED,
            )

        # ── Perform check-in ─────────────────────────────────────────
        booking.status = Booking.BookingStatus.CHECKED_IN

        # ✅ Remove these lines - check_in_time doesn't exist in your model
        # booking.check_in_time = timezone.now()

        # Update room status
        if booking.room:
            booking.room.status = "OCCUPIED"
            booking.room.save(update_fields=["status"])

        # ✅ Save only the status field
        booking.save(update_fields=["status"])

        # Clear caches
        cache.delete(f"receptionist_booking_{booking.id}")
        cache.delete("receptionist_bookings_all")

        logger.info("Check-in (manual/forced): %s", booking.booking_reference)

        return Response({
            "success": True,
            "message": "Check-in successful.",
            "booking": _booking_payload(booking),
        })

class CheckOutView(APIView):
    """POST /api/v1/receptionist/bookings/<pk>/checkout/"""

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

        remaining      = float(booking.remaining_amount or 0)
        booking.status = Booking.BookingStatus.COMPLETED

        if booking.payment_status != Booking.PaymentStatus.FULLY_PAID:
            booking.payment_status   = Booking.PaymentStatus.FULLY_PAID
            booking.remaining_amount = 0
            booking.balance_paid_at  = timezone.now()

        booking.save()

        room           = booking.room
        room.available = True
        room.save(update_fields=["available"])

        _clear_booking_cache()
        _clear_room_cache()
        cache.delete(f"receptionist_booking_{pk}")

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

def generate_temp_password(length=8):
    """Generate a random temporary password"""
    characters = string.ascii_letters + string.digits
    return ''.join(random.choices(characters, k=length))


class WalkInBookingView(APIView):
    """POST /api/v1/receptionist/bookings/walkin/"""

    def post(self, request):
        # Check authentication
        err = receptionist_check(request)
        if err:
            return err

        data = request.data
        logger.info(f"Walk-in booking request data: {data}")

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
            return Response(
                {"message": "Room not found or not available."},
                status=status.HTTP_404_NOT_FOUND,
            )

        email = data["guestEmail"].lower().strip()
        phone = data.get("guestPhone", "")
        is_new_user = False
        temp_password = None

        # Get or create user
        user = User.objects.filter(email=email).first()

        if not user:
            # Create username from email
            username = email.split("@")[0]
            base_username = username
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f"{base_username}{counter}"
                counter += 1

            # Generate temporary password
            temp_password = generate_temp_password()

            # Create user
            user = User.objects.create(
                email=email,
                username=username,
                role="USER",
            )
            user.set_password(temp_password)
            user.save()
            is_new_user = True
            logger.info(f"Created new user account for {email}")

        # Get or create GuestInformation
        guest_info = GuestInformation.objects.filter(user=user).first()

        if not guest_info:
            # Create GuestInformation with all required fields
            guest_info = GuestInformation.objects.create(
                user=user,
                first_name=data.get("firstName", "Walk-in"),
                last_name=data.get("lastName", "Guest"),
                gender=data.get("gender", "Not Specified"),
                home_address=data.get("address", "Not provided"),
                nationality=data.get("nationality", "Filipino"),
                date_of_birth=data.get("dateOfBirth") or date(2000, 1, 1),
                contact_number=phone or "Not provided",
                id_type=data.get("idType", "OTHER"),
                id_number=data.get("idNumber", ""),
                passport_number=data.get("passportNumber", ""),
                visa_type=data.get("visaType", ""),
                visa_expiry_date=data.get("visaExpiryDate") or None,
            )
            logger.info(f"Created GuestInformation for {email}")
        else:
            # Update existing guest info if needed
            updated = False
            if phone and not guest_info.contact_number:
                guest_info.contact_number = phone
                updated = True
            if data.get("firstName") and not guest_info.first_name:
                guest_info.first_name = data.get("firstName")
                updated = True
            if data.get("lastName") and not guest_info.last_name:
                guest_info.last_name = data.get("lastName")
                updated = True
            if data.get("address") and not guest_info.home_address:
                guest_info.home_address = data.get("address")
                updated = True
            if updated:
                guest_info.save()
                logger.info(f"Updated GuestInformation for {email}")

        # Parse dates
        check_in = date.fromisoformat(data["checkInDate"])
        check_out = date.fromisoformat(data["checkOutDate"])
        nights = (check_out - check_in).days

        if nights <= 0:
            return Response(
                {"message": "Check-out must be after check-in."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Calculate amounts
        total_amount = float(data.get("amountPaid") or room.price_per_night * nights)
        booking_reference = f"WALK-{uuid.uuid4().hex[:8].upper()}"

        # Create booking
        booking = Booking.objects.create(
            booking_reference=booking_reference,
            user=user,
            guest_information=guest_info,
            room=room,
            check_in_date=check_in,
            check_out_date=check_out,
            number_of_guests=int(data.get("numberOfGuests", 1)),
            number_of_nights=nights,
            total_amount=total_amount,
            deposit_amount=total_amount,
            remaining_amount=0,
            special_requests=data.get("specialRequests", ""),
            status=Booking.BookingStatus.CHECKED_IN,
            payment_status=Booking.PaymentStatus.FULLY_PAID,
        )

        # Mark room as unavailable
        room.available = False
        room.save(update_fields=["available"])

        # Create payment record
        Payment.objects.create(
            paymongo_link_id=f"CASH-{booking_reference}",
            checkout_url="",
            email=email,
            description=f"Walk-in payment for booking {booking_reference}",
            amount=total_amount,
            status="PAID",
            type="ROOM_BOOKING",
            booking_id=booking.id,
            paid_at=timezone.now(),
        )

        # Clear caches
        _clear_booking_cache()
        _clear_room_cache()

        # ============================================================
        # SEND EMAIL - ADD THIS SECTION
        # ============================================================
        if is_new_user and temp_password:
            try:
                # Import the email function
                from apps.utils.email import send_walkin_welcome_email

                # Send the email
                email_sent = send_walkin_welcome_email(user, temp_password, booking, guest_info)

                if email_sent:
                    logger.info(f"✅ Welcome email sent to {email}")
                else:
                    logger.warning(f"❌ Failed to send welcome email to {email}")
            except ImportError as e:
                logger.error(f"❌ Could not import email module: {e}")
            except Exception as e:
                logger.error(f"❌ Email error: {e}")

        logger.info(
            f"Walk-in booking {booking_reference} created by {request.user.id} for {email} (new_user={is_new_user})"
        )

        # Prepare response
        response_data = {
            "success": True,
            "message": "Walk-in booking created and guest checked in.",
            "bookingReference": booking_reference,
            "roomNumber": room.room_number,
            "guestEmail": email,
            "guestName": f"{guest_info.first_name} {guest_info.last_name}".strip() or user.username,
            "checkInDate": str(check_in),
            "checkOutDate": str(check_out),
            "nights": nights,
            "totalAmount": total_amount,
        }

        if is_new_user and temp_password:
            response_data["tempPassword"] = temp_password
            response_data["isNewUser"] = True
            response_data["message"] += f" Temporary password sent to {email}"

        return Response(response_data, status=status.HTTP_201_CREATED)

# ── Guests ────────────────────────────────────────────────────────────────────

class ReceptionistGuestsView(APIView):
    """GET /api/v1/receptionist/guests/?search="""

    def get(self, request):
        err = receptionist_check(request)
        if err:
            return err

        search = request.query_params.get("search", "")

        if not search:
            cached = cache.get("receptionist_guests_all")
            if cached:
                return Response(cached)

        qs = User.objects.filter(role="USER").order_by("-created_at")
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

        if not search:
            cache.set("receptionist_guests_all", data, timeout=60)

        return Response(data)


class ReceptionistGuestDetailView(APIView):
    """
    GET   /api/v1/receptionist/guests/<pk>/
    PATCH /api/v1/receptionist/guests/<pk>/
    """

    def get(self, request, pk):
        err = receptionist_check(request)
        if err:
            return err

        cache_key = f"receptionist_guest_{pk}"
        cached    = cache.get(cache_key)
        if cached:
            return Response(cached)

        try:
            guest = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"message": "Guest not found."}, status=404)

        profile  = GuestInformation.objects.filter(user=guest).first()
        bookings = Booking.objects.filter(user=guest).select_related("room").order_by("-created_at")

        data = {
            "id":        guest.id,
            "username":  guest.username,
            "email":     guest.email,
            "isActive":  guest.is_active,
            "createdAt": guest.created_at.isoformat() if guest.created_at else None,
            "profile": {
                "firstName":     profile.first_name,
                "lastName":      profile.last_name,
                "contactNumber": profile.contact_number,
                "nationality":   profile.nationality,
                "homeAddress":   profile.home_address,
                "idType":        profile.id_type,
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
        }

        cache.set(cache_key, data, timeout=60)
        return Response(data)

    def patch(self, request, pk):
        err = receptionist_check(request)
        if err:
            return err

        try:
            guest = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"message": "Guest not found."}, status=404)

        profile = GuestInformation.objects.filter(user=guest).first()
        if not profile:
            return Response({"message": "Guest profile not found."}, status=404)

        updated = []
        if "contactNumber" in request.data:
            profile.contact_number = request.data["contactNumber"]
            updated.append("contact_number")
        if "homeAddress" in request.data:
            profile.home_address = request.data["homeAddress"]
            updated.append("home_address")

        if updated:
            profile.save(update_fields=updated)
            cache.delete(f"receptionist_guest_{pk}")
            cache.delete(f"guest_profile_{guest.id}")
            logger.info("Guest %s contact info updated by receptionist %s", pk, request.user.id)

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

        version = cache.get("rooms_cache_version", 0)
        cache_key = f"receptionist_rooms_v{version}"
        cached = cache.get(cache_key)

        # ── Invalidate cache if it's missing the 'id' field ──────────────
        if cached and isinstance(cached, list) and cached and 'id' not in cached[0]:
            cached = None
            cache.delete(cache_key)
        # ─────────────────────────────────────────────────────────────────

        if cached:
            return Response(cached)

        rooms = Room.objects.all().order_by("room_number")
        occupied_room_ids = set(
            Booking.objects.filter(
                status=Booking.BookingStatus.CHECKED_IN
            ).values_list("room_id", flat=True)
        )

        data = []
        for r in rooms:
            # Get the room status (if status field exists, default to 'CLEAN')
            room_status = getattr(r, 'status', 'CLEAN')

            data.append({
                "id": r.id,
                "roomNumber": r.room_number,
                "roomType": r.room_type,
                "pricePerNight": float(r.price_per_night),
                "maxOccupancy": r.max_occupancy,
                "available": r.available,
                "amenities": r.amenities,
                "imageUrl": r.image_url,
                "isOccupied": r.id in occupied_room_ids,
                "status": room_status,  # ← ADD THIS LINE
                "currentStatus": (
                    "OCCUPIED" if r.id in occupied_room_ids else
                    "AVAILABLE" if r.available else
                    "UNAVAILABLE"
                ),
            })

        cache.set(cache_key, data, timeout=60)
        return Response(data)

class ReceptionistRoomStatusView(APIView):
    """PATCH /api/v1/receptionist/rooms/<pk>/status/"""

    def patch(self, request, pk):
        err = receptionist_check(request)
        if err:
            return err

        try:
            room = Room.objects.get(pk=pk)
        except Room.DoesNotExist:
            return Response({"message": "Room not found."}, status=404)

        is_occupied = Booking.objects.filter(
            room=room,
            status=Booking.BookingStatus.CHECKED_IN,
        ).exists()

        if is_occupied:
            return Response(
                {"message": "Cannot change status of an occupied room."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        new_status = request.data.get('status')
        available = request.data.get('available')

        maintenance_task_created = False

        if new_status:
            if hasattr(room, 'status'):
                room.status = new_status

                if new_status == 'MAINTENANCE':
                    room.available = False
                    room.save(update_fields=['status', 'available'])

                    try:
                        from apps.staff.models import Task

                        maintenance_user = User.objects.filter(
                            role='MAINTENANCE', is_active=True
                        ).order_by('?').first()

                        Task.objects.create(
                            title=f"Maintenance - Room {room.room_number}",
                            description=(
                                f"Room {room.room_number} ({room.room_type}) has been flagged for maintenance "
                                f"by receptionist {request.user.get_full_name() or request.user.username}. "
                                f"Please inspect and resolve the issue before clearing the room."
                            ),
                            task_type='MAINTENANCE',
                            priority='HIGH',
                            room=room,
                            room_number=room.room_number,
                            status='PENDING',
                            assigned_to=maintenance_user,
                            assigned_by=request.user,
                            note=f"Room marked UNAVAILABLE until maintenance is complete.",
                        )
                        maintenance_task_created = True
                        logger.info(
                            "Maintenance task created for Room %s, assigned to %s",
                            room.room_number,
                            maintenance_user.username if maintenance_user else "unassigned",
                        )
                    except Exception as e:
                        logger.warning("Could not create maintenance task for Room %s: %s", room.room_number, e)

                else:
                    room.save(update_fields=['status'])

                logger.info(
                    "Room %s status updated to %s by receptionist %s",
                    room.room_number, new_status, request.user.id,
                )

        if available is not None and new_status != 'MAINTENANCE':
            room.available = bool(available)
            room.save(update_fields=["available"])
            logger.info(
                "Room %s set to %s by receptionist %s",
                room.room_number,
                "available" if room.available else "unavailable",
                request.user.id,
            )

        _clear_room_cache()

        return Response({
            "message": f"Room {room.room_number} updated.",
            "roomNumber": room.room_number,
            "available": room.available,
            "status": getattr(room, 'status', 'CLEAN'),
            "maintenanceTaskCreated": maintenance_task_created,
        })

# ── Payments ──────────────────────────────────────────────────────────────────

class ReceptionistPaymentsView(APIView):
    """GET /api/v1/receptionist/payments/?search=&status="""

    def get(self, request):
        err = receptionist_check(request)
        if err:
            return err

        status_filter = request.query_params.get("status", "")
        search        = request.query_params.get("search", "")

        if not status_filter and not search:
            cached = cache.get("receptionist_payments_all")
            if cached:
                return Response(cached)

        qs = Payment.objects.all().order_by("-created_at")
        if status_filter:
            qs = qs.filter(status=status_filter)
        if search:
            qs = qs.filter(
                Q(email__icontains=search) |
                Q(description__icontains=search)
            )

        data = [
            {
                "id":             p.id,
                "paymongoLinkId": p.paymongo_link_id,
                "email":          p.email,
                "description":    p.description,
                "amount":         float(p.amount),
                "status":         p.status,
                "type":           p.type,
                "bookingId":      p.booking_id,
                "createdAt":      p.created_at.isoformat(),
                "paidAt":         p.paid_at.isoformat() if p.paid_at else None,
            }
            for p in qs[:100]
        ]

        if not status_filter and not search:
            cache.set("receptionist_payments_all", data, timeout=30)

        return Response(data)


class RecordCashPaymentView(APIView):
    """
    POST /api/v1/receptionist/payments/cash/

    Body:
        {
            "booking_id":  <int>,
            "amount":      <float>,
            "description": <str>,
            "type":        "BALANCE" | "DEPOSIT" | "ROOM_BOOKING"
        }

    Records a cash payment, marks booking as FULLY_PAID, and returns
    the updated booking payload.
    """

    def post(self, request):
        booking_id = request.data.get("booking_id")
        amount = request.data.get("amount")
        description = request.data.get("description", "Cash payment")
        pay_type = request.data.get("type", "BALANCE")

        if not booking_id or not amount:
            return Response(
                {"success": False, "error": "booking_id and amount are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            booking = Booking.objects.select_related("room", "user").get(pk=booking_id)
        except Booking.DoesNotExist:
            return Response(
                {"success": False, "error": "Booking not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        amount_decimal = Decimal(str(amount))

        # ✅ FIX: Use guest's email from booking.user.email, NOT request.user.email
        guest_email = booking.user.email

        logger.info(f"Recording cash payment for booking {booking.booking_reference} - Guest email: {guest_email}")

        # ── Create payment record with guest's email ─────────────────
        payment = Payment.objects.create(
            paymongo_link_id=f"CASH-{booking.booking_reference}-{uuid.uuid4().hex[:6].upper()}",
            checkout_url="",
            email=guest_email,  # ← Use guest's email here
            description=description,
            amount=amount_decimal,
            status=Payment.PaymentStatus.PAID,
            type=pay_type,
            booking_id=booking.id,
            paid_at=timezone.now(),
        )

        # ── Update booking ───────────────────────────────────────────
        if pay_type == "BALANCE":
            booking.payment_status = Booking.PaymentStatus.FULLY_PAID
            booking.balance_paid_at = timezone.now()
            booking.remaining_amount = Decimal("0")
            booking.save(update_fields=["payment_status", "balance_paid_at", "remaining_amount"])

        elif pay_type in ["DEPOSIT", "ROOM_BOOKING"]:
            booking.payment_status = Booking.PaymentStatus.DEPOSIT_PAID
            booking.deposit_paid_at = timezone.now()
            booking.deposit_amount = amount_decimal
            booking.remaining_amount = booking.total_amount - amount_decimal
            booking.save(update_fields=["payment_status", "deposit_paid_at", "deposit_amount", "remaining_amount"])

        # ── Invalidate caches ────────────────────────────────────────
        cache.delete(f"my_payments_{guest_email}")  # Use guest email for cache key
        cache.delete(f"my_bookings_{booking.user.id}")
        cache.delete(f"receptionist_booking_{booking.id}")
        cache.delete("receptionist_bookings_all")

        logger.info(
            "Cash payment recorded: booking=%s amount=%s type=%s by receptionist=%s for guest=%s",
            booking.booking_reference, amount, pay_type, request.user.email, guest_email,
        )

        return Response({
            "success": True,
            "id": payment.id,
            "message": "Cash payment recorded successfully.",
            "booking": _booking_payload(booking),
        })

# ── Helper ────────────────────────────────────────────────────────────────────

def _booking_detail(booking):
    """Serialize a booking to a dict for receptionist views."""
    try:
        profile = booking.guest_information
    except Exception:
        profile = None

    profile_picture = None
    try:
        profile_picture = booking.user.profile_picture.image_base64
    except Exception:
        pass
    if not profile_picture and profile:
        profile_picture = profile.profile_picture or None

    return {
        "id":               booking.id,
        "userId":           booking.user.id,
        "bookingReference": booking.booking_reference,
        "guestEmail":       booking.user.email,
        "guestUsername":    booking.user.username,
        "profilePicture":   profile_picture,
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
            "firstName":     profile.first_name,
            "lastName":      profile.last_name,
            "contactNumber": profile.contact_number,
            "nationality":   profile.nationality,
            "idType":        profile.id_type,
            "idNumber":      profile.id_number,
        } if profile else None,
    }


class VerifyQRCheckInView(APIView):
    """
    POST /api/v1/receptionist/verify-qr-checkin/
    """

    def post(self, request):
        qr_data = request.data.get("qr_data", "").strip()
        if not qr_data:
            return Response(
                {"success": False, "error": "No QR data provided."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ── Parse QR data (could be JSON or plain text) ──────────────
        booking_ref = None

        # Try to parse as JSON first
        if qr_data.startswith('{'):
            try:
                import json
                parsed = json.loads(qr_data)
                booking_ref = parsed.get('bookingReference') or parsed.get('booking_reference')
            except json.JSONDecodeError:
                pass

        # If not JSON or no bookingReference found, use the raw string
        if not booking_ref:
            booking_ref = qr_data

        logger.info(f"QR check-in attempt for booking_ref: {booking_ref}")

        # ── Find booking by reference ────────────────────────────────
        # IMPORTANT: Use select_related to fetch guest_information in the same query
        booking = (
            Booking.objects
            .select_related("room", "user", "guest_information")
            .filter(booking_reference=booking_ref)
            .first()
        )

        if not booking:
            return Response(
                {"success": False, "error": f"Booking '{booking_ref}' not found. Please verify the QR code."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ── Status checks ────────────────────────────────────────────
        if booking.status == Booking.BookingStatus.CHECKED_IN:
            return Response(
                {"success": False, "error": "Guest is already checked in.", "booking": _booking_payload(booking)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if booking.status == Booking.BookingStatus.CHECKED_OUT:
            return Response(
                {"success": False, "error": "This booking has already been checked out.",
                 "booking": _booking_payload(booking)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if booking.status not in [
            Booking.BookingStatus.CONFIRMED,
            Booking.BookingStatus.PENDING_DEPOSIT,
        ]:
            return Response(
                {"success": False, "error": f"Booking status '{booking.status}' is not valid for check-in.",
                 "booking": _booking_payload(booking)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ── Date check (allow same-day or past check-in) ─────────────
        from django.utils import timezone
        today = timezone.localdate()
        if booking.check_in_date > today:
            return Response(
                {"success": False,
                 "error": f"Check-in date is {booking.check_in_date}. Early check-in requires manager approval.",
                 "booking": _booking_payload(booking)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ── PAYMENT GATE ─────────────────────────────────────────────
        if not _booking_is_fully_paid(booking):
            logger.info(
                "Check-in blocked for booking %s — balance owed: %s",
                booking.booking_reference,
                booking.remaining_amount,
            )
            return Response(
                {
                    "success": False,
                    "payment_required": True,
                    "booking": _booking_payload(booking),
                    "message": f"Guest has an outstanding balance of ₱{float(booking.remaining_amount or 0):,.2f}. Please collect payment before checking in.",
                },
                status=status.HTTP_402_PAYMENT_REQUIRED,
            )

        # ── Perform check-in ─────────────────────────────────────────
        booking.status = Booking.BookingStatus.CHECKED_IN
        booking.save(update_fields=["status"])

        # Update room status if room exists
        if booking.room:
            booking.room.status = "OCCUPIED"
            booking.room.save(update_fields=["status"])

        # Clear caches
        from django.core.cache import cache
        cache.delete(f"receptionist_booking_{booking.id}")
        cache.delete("receptionist_bookings_all")
        _clear_booking_cache()
        _clear_room_cache()

        logger.info("QR check-in successful: %s", booking.booking_reference)

        return Response({
            "success": True,
            "message": f"Check-in successful! Welcome, {_booking_payload(booking)['guestName']}.",
            "booking": _booking_payload(booking),
        })

# apps/receptionist/views.py - Complete VerifyQRCheckOutView and ProcessQRCheckOutView

class VerifyQRCheckOutView(APIView):
    """
    POST /api/v1/receptionist/verify-qr-checkout/

    Receptionist scans guest's QR code to check them out.
    Shows all outstanding charges including room balance and service charges.
    """

    def post(self, request):
        err = receptionist_check(request)
        if err:
            return err

        qr_data = request.data.get('qr_data')
        if not qr_data:
            return Response(
                {"error": "QR data is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Parse QR data
        booking_ref = None
        try:
            if isinstance(qr_data, str):
                if qr_data.strip().startswith('{'):
                    try:
                        parsed = json.loads(qr_data)
                        booking_ref = parsed.get('bookingReference') or parsed.get('booking_reference')
                    except:
                        pass
                if not booking_ref:
                    booking_ref = qr_data.strip()
            elif isinstance(qr_data, dict):
                booking_ref = qr_data.get('bookingReference') or qr_data.get('booking_reference')
        except:
            booking_ref = str(qr_data).strip()

        if not booking_ref:
            return Response(
                {"error": "Invalid QR code"},
                status=status.HTTP_400_BAD_REQUEST
            )

        booking_ref = booking_ref.strip().upper()

        # Find booking
        try:
            booking = Booking.objects.select_related('room', 'user').get(
                booking_reference__iexact=booking_ref
            )
        except Booking.DoesNotExist:
            code_part = booking_ref.replace('CGH-', '')
            booking = Booking.objects.select_related('room', 'user').filter(
                booking_reference__icontains=code_part
            ).first()
            if not booking:
                return Response(
                    {"error": f"Booking {booking_ref} not found"},
                    status=status.HTTP_404_NOT_FOUND
                )

        # Check if checked in
        if booking.status != 'CHECKED_IN':
            return Response({
                "error": f"Guest is not checked in. Status: {booking.status}",
                "booking": {"reference": booking.booking_reference, "status": booking.status}
            }, status=status.HTTP_400_BAD_REQUEST)

        # Get today's date for validation
        today = timezone.now().date()
        check_out_date = booking.check_out_date
        is_early_checkout = check_out_date > today
        is_late_checkout = check_out_date < today
        days_difference = (check_out_date - today).days if check_out_date else 0

        # Get outstanding charges
        outstanding_charges = []

        # 1. Room remaining balance
        remaining_balance = float(booking.remaining_amount or 0)
        if remaining_balance > 0:
            outstanding_charges.append({
                "type": "ROOM_BALANCE",
                "description": f"Remaining room balance",
                "amount": remaining_balance
            })

        # 2. Service requests for this guest/room
        try:
            from apps.services.models import ServiceRequest

            # Find service requests by room_number AND guest_email
            service_requests = ServiceRequest.objects.filter(
                room_number=booking.room.room_number,
                guest_email=booking.user.email,
                is_paid=False,
                status='COMPLETED'
            )

            for sr in service_requests:
                outstanding_charges.append({
                    "type": "SERVICE_CHARGE",
                    "service_id": sr.id,
                    "description": f"{sr.get_service_type_display()} - Room {sr.room_number}",
                    "amount": float(sr.service_charge),
                    "notes": sr.description
                })
        except ImportError:
            pass

        total_due = remaining_balance + sum(c['amount'] for c in outstanding_charges if c['type'] == 'SERVICE_CHARGE')

        return Response({
            "success": True,
            "booking": {
                "id": booking.id,
                "reference": booking.booking_reference,
                "guestName": booking.user.username,
                "guestEmail": booking.user.email,
                "roomNumber": booking.room.room_number if booking.room else None,
                "roomType": booking.room.room_type if booking.room else None,
                "checkInDate": str(booking.check_in_date),
                "checkOutDate": str(booking.check_out_date),
                "totalAmount": float(booking.total_amount or 0),
                "depositPaid": float(booking.deposit_amount or 0),
                "remainingBalance": remaining_balance,
                "status": booking.status
            },
            "charges": outstanding_charges,
            "summary": {
                "subtotal": float(booking.total_amount or 0),
                "deposit_paid": float(booking.deposit_amount or 0),
                "service_charges": sum(c['amount'] for c in outstanding_charges if c['type'] == 'SERVICE_CHARGE'),
                "total_due": total_due,
                "is_early_checkout": is_early_checkout,
                "is_late_checkout": is_late_checkout,
                "check_out_date": str(check_out_date),
                "today": str(today),
                "days_difference": days_difference
            }
        })


class ProcessQRCheckOutView(APIView):
    """
    POST /api/v1/receptionist/process-qr-checkout/

    Process the check-out after payment is collected.
    Validates check-out date, marks room as dirty, and creates cleaning task.
    """

    def post(self, request):
        err = receptionist_check(request)
        if err:
            return err

        booking_id = request.data.get('booking_id')
        payment_collected = request.data.get('payment_collected', 0)
        payment_method = request.data.get('payment_method', 'CASH')
        force_checkout = request.data.get('force_checkout', False)

        if not booking_id:
            return Response(
                {"error": "Booking ID is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            booking = Booking.objects.select_related('room', 'user').get(id=booking_id)
        except Booking.DoesNotExist:
            return Response({"error": "Booking not found"}, status=404)

        if booking.status != 'CHECKED_IN':
            return Response(
                {"error": f"Booking is not checked in (status: {booking.status})"},
                status=400
            )

        # ============================================================
        # DATE VALIDATION - Check if check-out date is valid
        # ============================================================
        today = timezone.now().date()
        check_out_date = booking.check_out_date
        days_difference = (check_out_date - today).days if check_out_date else 0

        # Check if check-out date is today or earlier
        if check_out_date > today:
            # Future check-out date - not allowed
            days_early = days_difference

            if not force_checkout:
                return Response({
                    "error": f"Cannot check out guest yet. Check-out date is {check_out_date} ({days_early} day(s) from today).",
                    "check_out_date": str(check_out_date),
                    "today": str(today),
                    "days_early": days_early,
                    "can_force": True,
                    "message": "Use force_checkout=true to override (for early check-out)"
                }, status=status.HTTP_400_BAD_REQUEST)
            else:
                # Early check-out - add note
                early_checkout_note = f"EARLY CHECK-OUT: Guest checked out {days_early} day(s) early on {today}"
                logger.info(f"Early check-out for booking {booking.booking_reference}: {early_checkout_note}")

        elif check_out_date < today:
            # Past check-out date - late check-out
            days_late = abs(days_difference)
            late_checkout_note = f"LATE CHECK-OUT: Guest checked out {days_late} day(s) late on {today}"
            logger.info(f"Late check-out for booking {booking.booking_reference}: {late_checkout_note}")

        # Process payment
        remaining = float(booking.remaining_amount or 0)
        payment_collected = float(payment_collected)

        if payment_collected > 0:
            if payment_collected >= remaining:
                booking.remaining_amount = 0
                booking.payment_status = Booking.PaymentStatus.FULLY_PAID
                booking.balance_paid_at = timezone.now()
            else:
                booking.remaining_amount = remaining - payment_collected

            # Create payment record
            Payment.objects.create(
                paymongo_link_id=f"CHECKOUT-{booking.booking_reference}-{uuid.uuid4().hex[:6].upper()}",
                checkout_url="",
                email=booking.user.email,
                description=f"Check-out payment - {payment_method}",
                amount=payment_collected,
                status="PAID",
                type="BALANCE",
                booking_id=booking.id,
                paid_at=timezone.now(),
            )

        # Mark service requests as paid
        try:
            from apps.services.models import ServiceRequest

            # Find and mark service requests as paid
            service_requests = ServiceRequest.objects.filter(
                room_number=booking.room.room_number,
                guest_email=booking.user.email,
                is_paid=False,
                status='COMPLETED'
            )

            for sr in service_requests:
                sr.is_paid = True
                sr.save()

                # Create payment record for service if needed
                if sr.service_charge > 0:
                    Payment.objects.create(
                        paymongo_link_id=f"SERVICE-{sr.id}-{uuid.uuid4().hex[:6].upper()}",
                        checkout_url="",
                        email=booking.user.email,
                        description=f"Service charge: {sr.get_service_type_display()} - Room {sr.room_number}",
                        amount=float(sr.service_charge),
                        status="PAID",
                        type="SERVICE",
                        booking_id=booking.id,
                        paid_at=timezone.now(),
                    )
        except ImportError:
            pass

        # Complete check-out
        booking.status = Booking.BookingStatus.COMPLETED
        booking.check_out_date = timezone.now().date()
        booking.save()

        # Mark room as DIRTY and create cleaning task
        room = booking.room
        cleaning_task_created = False

        if room:
            room.available = False
            if hasattr(room, 'status'):
                room.status = 'DIRTY'
            room.save()

            # Create cleaning task in staff_tasks (Task model)
            try:
                from apps.staff.models import Task

                # Auto-assign to an available housekeeping staff member
                housekeeping_user = User.objects.filter(
                    role='HOUSEKEEPER', is_active=True
                ).order_by('?').first()

                checklist_note = (
                    "Checklist:\n"
                    "- Make bed and change linens\n"
                    "- Vacuum floor\n"
                    "- Clean bathroom (toilet, sink, shower)\n"
                    "- Replace towels\n"
                    "- Restock amenities (soap, shampoo, tissue)\n"
                    "- Wipe all surfaces\n"
                    "- Empty trash bins\n"
                    "- Check mini-bar\n"
                    "- Arrange furniture\n"
                    "- Final inspection"
                )

                Task.objects.create(
                    title=f"Clean Room {room.room_number} after check-out",
                    description=(
                        f"Room {room.room_number} ({room.room_type}) needs cleaning after guest check-out.\n"
                        f"Booking: {booking.booking_reference}\n"
                        f"Guest: {booking.user.username}"
                    ),
                    task_type='CLEANING',
                    priority='HIGH',
                    room=room,
                    room_number=room.room_number,
                    booking=booking,
                    assigned_to=housekeeping_user,
                    assigned_by=request.user,
                    status='PENDING',
                    note=checklist_note,
                )

                cleaning_task_created = True
                logger.info(
                    f"Cleaning task created in staff_tasks for room {room.room_number}, "
                    f"assigned to {housekeeping_user.username if housekeeping_user else 'unassigned'}"
                )

            except Exception as e:
                logger.error(f"Error creating cleaning task: {e}")

        # Clear all caches
        _clear_booking_cache()
        _clear_room_cache()
        cache.delete(f"receptionist_booking_{booking.id}")
        cache.delete("housekeeper_rooms_all")
        cache.delete("cleaning_tasks_all")

        return Response({
            "success": True,
            "message": f"Guest checked out successfully. Room marked as DIRTY and cleaning task created.",
            "booking": {
                "id": booking.id,
                "reference": booking.booking_reference,
                "status": booking.status,
                "paymentStatus": booking.payment_status,
                "remainingBalance": float(booking.remaining_amount or 0)
            },
            "room": {
                "id": room.id if room else None,
                "number": room.room_number if room else None,
                "status": "DIRTY"
            } if room else None,
            "cleaning_task_created": cleaning_task_created,
            "early_checkout": check_out_date > today if check_out_date else False,
            "late_checkout": check_out_date < today if check_out_date else False,
            "days_difference": days_difference
        })


class PaymentStatusView(APIView):
    """
    GET /api/v1/payments/status/<payment_id>/

    Returns the current status of a payment record.
    Frontend polls this every 3 s to detect when online payment is confirmed.

    Response:
        { "id": 1, "status": "PAID" | "PENDING" | "FAILED", "bookingId": 42 }
    """

    def get(self, request, pk):
        try:
            payment = Payment.objects.get(pk=pk)
        except Payment.DoesNotExist:
            return Response(
                {"error": "Payment not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response({
            "id": payment.id,
            "status": payment.status,
            "bookingId": payment.booking_id,
            "paidAt": payment.paid_at.isoformat() if payment.paid_at else None,
        })


# apps/receptionist/views.py - Updated cancellation view
# apps/receptionist/views.py - Fixed cancellation view for your Payment model

class ReceptionistCancelBookingView(APIView):
    """POST /api/v1/receptionist/bookings/<id>/cancel/"""
    permission_classes = [IsAuthenticated]

    def post(self, request, id):
        # Check permission
        if request.user.role not in ['ADMIN', 'RECEPTIONIST']:
            return Response(
                {"error": "Access denied. Only admin or receptionist can cancel bookings."},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            booking = Booking.objects.get(id=id)
        except Booking.DoesNotExist:
            return Response(
                {"error": "Booking not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        # Check if booking is already cancelled
        if booking.status == 'CANCELLED':
            return Response(
                {"error": "Booking is already cancelled."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Only allow cancellation for certain statuses
        cancelable_statuses = ['CONFIRMED', 'PENDING_DEPOSIT', 'CHECKED_IN', 'CANCELLATION_PENDING']
        if booking.status not in cancelable_statuses:
            return Response(
                {"error": f"Cannot cancel booking with status {booking.status}."},
                status=status.HTTP_400_BAD_REQUEST
            )

        reason = request.data.get('reason', '')
        admin_note = request.data.get('admin_note', '')
        process_refund = request.data.get('process_refund', True)

        # Store old status before changing
        old_status = booking.status

        # Calculate refund amount (50% of deposit)
        deposit_amount = float(booking.deposit_amount or 0)
        refund_amount = deposit_amount * 0.5

        # ============================================================
        # CREATE REFUND PAYMENT RECORD
        # ============================================================
        if process_refund and refund_amount > 0:
            try:
                from apps.payments.models import Payment

                # Check if refund already exists for this booking
                existing_refund = Payment.objects.filter(
                    booking_id=booking.id,
                    type='REFUND'
                ).exists()

                if not existing_refund:
                    # Create a NEW refund payment record using your Payment model fields
                    Payment.objects.create(
                        paymongo_link_id=f"REFUND_{booking.booking_reference}_{booking.id}",  # Required unique field
                        checkout_url="",  # Required field, can be empty for refunds
                        email=booking.user.email,
                        description=f"50% Refund for cancelled booking {booking.booking_reference} - {reason[:100]}",
                        amount=refund_amount,
                        status='REFUNDED',  # Using the REFUNDED status you added
                        type='REFUND',  # Using the REFUND type you added
                        booking_id=booking.id,
                        paid_at=timezone.now()  # Set paid_at to now since refund is processed
                    )
                    logger.info(f"Created refund of ₱{refund_amount} for booking {booking.id}")
            except Exception as e:
                logger.error(f"Failed to create refund record: {e}")

        # Update booking status to CANCELLED
        booking.status = 'CANCELLED'
        booking.save(update_fields=['status'])

        # ============================================================
        # HANDLE PENDING CANCELLATION REQUEST
        # ============================================================
        if old_status == 'CANCELLATION_PENDING':
            try:
                from apps.bookings.models import CancellationRequest
                pending_request = CancellationRequest.objects.filter(
                    booking=booking,
                    status='PENDING'
                ).first()
                if pending_request:
                    pending_request.status = 'APPROVED'
                    pending_request.admin_note = admin_note or reason
                    pending_request.resolved_by = request.user
                    pending_request.resolved_at = timezone.now()
                    pending_request.save()
                    logger.info(f"Approved cancellation request {pending_request.id}")
            except ImportError:
                pass

        # ============================================================
        # UPDATE ROOM AVAILABILITY
        # ============================================================
        try:
            room = booking.room
            room.available = True
            room.save(update_fields=['available'])
            logger.info(f"Room {room.room_number} marked as available")
        except Exception as e:
            logger.error(f"Failed to update room availability: {e}")

        # Clear cache
        cache.delete(f"my_bookings_{booking.user_id}")

        # Send email notification to guest
        try:
            from apps.utils.email import send_booking_cancelled_email
            send_booking_cancelled_email(booking, reason, refund_amount)
        except Exception as e:
            logger.error(f"Failed to send cancellation email: {e}")

        booking.cancellation_reason = reason
        booking.status = 'CANCELLED'
        booking.save()

        booking.status = 'CANCELLED'
        booking.cancellation_reason = reason
        booking.cancelled_by = request.user  # ← THIS SAVES THE USER TO cancelled_by_id
        booking.cancelled_at = timezone.now()
        booking.save()

        return Response({
            "success": True,
            "message": f"Booking #{booking.booking_reference} has been cancelled successfully.",
            "refund_amount": f"₱{refund_amount:,.2f}" if refund_amount > 0 else None,
            "booking": {
                "id": booking.id,
                "bookingReference": booking.booking_reference,
                "status": booking.status,
                "paymentStatus": booking.payment_status
            }
        }, status=status.HTTP_200_OK)
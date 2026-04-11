# apps/bookings/views.py
import logging
import uuid

from django.core.cache import cache
from django.db import transaction
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from rest_framework.permissions import IsAuthenticated

from apps.rooms.models import Room
from .models import Booking
from .serializers import BookingCreateSerializer, BookingSerializer

logger = logging.getLogger(__name__)


class MyBookingsView(APIView):
    """GET /api/v1/bookings/my-bookings/"""

    def get(self, request):
        cache_key = f"my_bookings_{request.user.id}"
        cached    = cache.get(cache_key)
        if cached:
            return Response(cached)

        bookings = (
            Booking.objects.filter(user=request.user)
            .select_related("room")
            .order_by("-created_at")
        )
        data = BookingSerializer(bookings, many=True).data
        cache.set(cache_key, data, timeout=30)
        return Response(data)


class CreateBookingView(APIView):
    """POST /api/v1/bookings/"""

    @transaction.atomic
    def post(self, request):
        logger.error("Raw request data: %s", request.data)
        ser = BookingCreateSerializer(data=request.data)
        if not ser.is_valid():
            logger.error("Booking validation errors: %s", ser.errors)
            return Response(
                {"message": "Validation failed.", "errors": ser.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )
        d = ser.validated_data
        logger.error("Booking validated data: %s", d)

        # Check room exists and is available
        try:
            room = Room.objects.get(id=d["roomId"], available=True)
        except Room.DoesNotExist:
            return Response(
                {"message": "Room not found or not available."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Get guest information — required by Spring Boot bookings table
        from apps.guests.models import GuestInformation
        try:
            guest_info = GuestInformation.objects.get(user=request.user)
        except GuestInformation.DoesNotExist:
            return Response(
                {"message": "Please complete your profile before making a booking."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check for date conflicts with existing bookings
        conflict = Booking.objects.filter(
            room=room,
            status__in=[
                Booking.BookingStatus.CONFIRMED,
                Booking.BookingStatus.CHECKED_IN,
            ],
            check_in_date__lt=d["checkOutDate"],
            check_out_date__gt=d["checkInDate"],
        ).exists()

        if conflict:
            return Response(
                {"message": "Room is already booked for the selected dates."},
                status=status.HTTP_409_CONFLICT,
            )

        # Calculate nights and amounts
        nights       = (d["checkOutDate"] - d["checkInDate"]).days
        total_amount = d.get("totalAmount") or (room.price_per_night * nights)
        payment_type = d.get("paymentType", "DEPOSIT").upper()

        if payment_type == "FULL":
            deposit_amount = total_amount
            remaining      = 0
        else:
            deposit_amount = total_amount / 2
            remaining      = total_amount - deposit_amount

        # Generate unique booking reference
        booking_reference = f"CGH-{uuid.uuid4().hex[:8].upper()}"

        booking = Booking.objects.create(
            booking_reference    = booking_reference,
            user                 = request.user,
            guest_information_id = guest_info.id,
            room                 = room,
            check_in_date        = d["checkInDate"],
            check_out_date       = d["checkOutDate"],
            number_of_guests     = d.get("numAdults", 1) + d.get("numChildren", 0),
            number_of_nights     = nights,
            total_amount         = total_amount,
            deposit_amount       = deposit_amount,
            remaining_amount     = remaining,
            special_requests     = d.get("specialRequests", ""),
            status               = Booking.BookingStatus.PENDING_DEPOSIT,
            payment_status       = Booking.PaymentStatus.UNPAID,
        )

        # Clear guest's booking cache so new booking shows immediately
        cache.delete(f"my_bookings_{request.user.id}")

        logger.info(
            "Booking %s created for user %s (room %s)",
            booking.booking_reference, request.user.id, room.room_number,
        )

        # Create PayMongo payment link if online payment
        checkout_url = None
        if d.get("paymentMethod") == "ONLINE":
            try:
                from apps.payments.paymongo import create_payment_link
                from apps.payments.models import Payment

                amount_to_pay = total_amount if payment_type == "FULL" else deposit_amount
                payment_link  = create_payment_link(
                    amount            = float(amount_to_pay),
                    description       = f"Booking {booking.booking_reference} - {room.room_type} Room",
                    remarks           = f"{d['checkInDate']} to {d['checkOutDate']}",
                    booking_id        = booking.id,
                    booking_reference = booking.booking_reference,
                )

                checkout_url             = payment_link.get("checkout_url")
                paymongo_link_id         = payment_link.get("paymongo_link_id")
                booking.deposit_payment_id = paymongo_link_id
                booking.save(update_fields=["deposit_payment_id"])

                Payment.objects.create(
                    paymongo_link_id = paymongo_link_id,
                    checkout_url     = checkout_url or "",
                    email            = request.user.email,
                    description      = f"Booking {booking.booking_reference}",
                    amount           = amount_to_pay,
                    status           = "PENDING",
                    type             = "ROOM_BOOKING" if payment_type == "FULL" else "DEPOSIT",
                    booking_id       = booking.id,
                )
            except Exception as e:
                logger.error("PayMongo error: %s", e)

        # ============================================================
        # SEND CONFIRMATION EMAIL TO GUEST
        # ============================================================
        try:
            from apps.utils.email import send_booking_confirmation_email

            # Send email with booking details and QR code
            email_sent = send_booking_confirmation_email(
                booking=booking,
                user=request.user,
                temp_password=None  # Existing user, no temp password needed
            )

            if email_sent:
                logger.info(f"✅ Confirmation email sent to {request.user.email}")
            else:
                logger.warning(f"❌ Failed to send confirmation email to {request.user.email}")
        except Exception as e:
            logger.error(f"❌ Email error: {e}")

        return Response(
            {
                "id":               booking.id,
                "bookingReference": booking.booking_reference,
                "depositAmount":    str(booking.deposit_amount),
                "checkoutUrl":      checkout_url,
                **BookingSerializer(booking).data,
            },
            status=status.HTTP_201_CREATED,
        )

class BookingStatusView(APIView):
    """GET /api/v1/bookings/<booking_reference>/status/"""
    permission_classes = [IsAuthenticated]

    def get(self, request, booking_reference):
        try:
            booking = Booking.objects.select_related('room').get(
                booking_reference=booking_reference,
                user=request.user  # Ensure user owns the booking
            )

            return Response({
                'id': booking.id,
                'bookingReference': booking.booking_reference,
                'status': booking.status,
                'paymentStatus': booking.payment_status,
                'roomType': booking.room.room_type,
                'roomNumber': booking.room.room_number,
                'checkInDate': booking.check_in_date,
                'checkOutDate': booking.check_out_date,
                'totalAmount': float(booking.total_amount),
                'depositAmount': float(booking.deposit_amount),
                'paidAmount': float(booking.paid_amount) if hasattr(booking, 'paid_amount') else None,
            })
        except Booking.DoesNotExist:
            return Response({'error': 'Booking not found'}, status=404)


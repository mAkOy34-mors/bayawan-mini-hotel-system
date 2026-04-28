# apps/bookings/otp_views.py

"""
Booking confirmation via OTP flow:

POST /api/v1/bookings/request-otp/   → sends OTP to guest email before booking
POST /api/v1/bookings/confirm/        → verifies OTP then creates booking
"""
import logging
import uuid

from django.db import transaction
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.rooms.models import Room
from apps.users.otp import create_otp, send_otp_email, verify_otp
from .models import Booking
from .serializers import BookingCreateSerializer, BookingSerializer

logger = logging.getLogger(__name__)


class RequestBookingOtpView(APIView):
    """
    POST /api/v1/bookings/request-otp/

    Step 1 — Guest submits booking details.
    Django validates the room + dates, then sends OTP to guest email.
    Does NOT create the booking yet.

    Request body:
    {
        "roomId": 1,
        "checkInDate": "2026-03-20",
        "checkOutDate": "2026-03-22",
        "numberOfGuests": 2,
        "totalAmount": 5600,
        "paymentMethod": "ONLINE",
        "paymentType": "DEPOSIT",
        "specialRequests": ""
    }

    Response:
    {
        "message": "OTP sent to your email. Please verify to confirm your booking.",
        "email": "guest@example.com"
    }
    """

    def post(self, request):
        ser = BookingCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        d = ser.validated_data

        # Validate room exists
        try:
            room = Room.objects.get(id=d["roomId"])
        except Room.DoesNotExist:
            return Response(
                {"message": "Room not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Check for date conflicts
        conflict = Booking.objects.filter(
            room=room,
            status__in=[
                Booking.BookingStatus.PENDING_DEPOSIT,
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

        # Check guest profile exists
        from apps.guests.models import GuestInformation
        try:
            GuestInformation.objects.get(user=request.user)
        except GuestInformation.DoesNotExist:
            return Response(
                {"message": "Please complete your profile before making a booking."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Send OTP to guest email
        try:
            otp = create_otp(request.user.email)
            send_otp_email(request.user.email, otp)
        except Exception as e:
            logger.error("Failed to send booking OTP: %s", e)
            return Response(
                {"message": "Failed to send verification code. Please try again."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        logger.info("Booking OTP sent to %s for room %s", request.user.email, room.room_number)

        return Response({
            "message": "Verification code sent to your email. Please enter it to confirm your booking.",
            "email":   request.user.email,
        })


class ConfirmBookingWithOtpView(APIView):
    """
    POST /api/v1/bookings/confirm/

    Step 2 — Guest submits OTP + booking details.
    Django verifies OTP then creates the booking and PayMongo link.

    Request body:
    {
        "otp": "123456",
        "roomId": 1,
        "checkInDate": "2026-03-20",
        "checkOutDate": "2026-03-22",
        "numberOfGuests": 2,
        "totalAmount": 5600,
        "paymentMethod": "ONLINE",
        "paymentType": "DEPOSIT",
        "specialRequests": ""
    }

    Response:
    {
        "id": 1,
        "bookingReference": "CGH-XXXXXXXX",
        "checkoutUrl": "https://pm.link/...",
        "depositAmount": "2800.00",
        ...
    }
    """

    @transaction.atomic
    def post(self, request):
        # Step 1 — verify OTP first
        otp_code = request.data.get("otp", "").strip()
        if not otp_code:
            return Response(
                {"message": "Verification code is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not verify_otp(request.user.email, otp_code):
            return Response(
                {"message": "Invalid or expired verification code. Please request a new one."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Step 2 — validate booking data
        ser = BookingCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        d = ser.validated_data

        # Check room
        try:
            room = Room.objects.get(id=d["roomId"])
        except Room.DoesNotExist:
            return Response(
                {"message": "Room not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Check guest profile
        from apps.guests.models import GuestInformation
        try:
            guest_info = GuestInformation.objects.get(user=request.user)
        except GuestInformation.DoesNotExist:
            return Response(
                {"message": "Please complete your profile before making a booking."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check date conflicts
        conflict = Booking.objects.filter(
            room=room,
            status__in=[
                Booking.BookingStatus.PENDING_DEPOSIT,
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

        # Calculate amounts
        nights = (d["checkOutDate"] - d["checkInDate"]).days
        total_amount = d.get("totalAmount") or (room.price_per_night * nights)
        payment_type = d.get("paymentType", "DEPOSIT").upper()

        if payment_type == "FULL":
            deposit_amount = total_amount
            remaining = 0
        else:
            deposit_amount = total_amount / 2
            remaining = total_amount - deposit_amount

        # Create booking
        booking_reference = f"CGH-{uuid.uuid4().hex[:8].upper()}"
        booking = Booking.objects.create(
            booking_reference=booking_reference,
            user=request.user,
            guest_information_id=guest_info.id,
            room=room,
            check_in_date=d["checkInDate"],
            check_out_date=d["checkOutDate"],
            number_of_guests=d.get("numAdults", 1) + d.get("numChildren", 0),
            number_of_nights=nights,
            total_amount=total_amount,
            deposit_amount=deposit_amount,
            remaining_amount=remaining,
            special_requests=d.get("specialRequests", ""),
            status=Booking.BookingStatus.PENDING_DEPOSIT,
            payment_status=Booking.PaymentStatus.UNPAID,
        )

        logger.info("Booking %s confirmed after OTP for user %s", booking_reference, request.user.id)

        # Create PayMongo link
        checkout_url = None
        if d.get("paymentMethod") == "ONLINE":
            try:
                from apps.payments.paymongo import create_payment_link
                from apps.payments.models import Payment

                amount_to_pay = total_amount if payment_type == "FULL" else deposit_amount
                payment_link = create_payment_link(
                    amount=float(amount_to_pay),
                    description=f"Booking {booking_reference} - {room.room_type} Room",
                    remarks=f"{d['checkInDate']} to {d['checkOutDate']}",
                    booking_id=booking.id,
                    booking_reference=booking_reference,
                )

                checkout_url = payment_link.get("checkout_url")
                paymongo_link_id = payment_link.get("paymongo_link_id")
                booking.deposit_payment_id = paymongo_link_id
                booking.save(update_fields=["deposit_payment_id"])

                Payment.objects.create(
                    paymongo_link_id=paymongo_link_id,
                    checkout_url=checkout_url or "",
                    email=request.user.email,
                    description=f"Booking {booking_reference}",
                    amount=amount_to_pay,
                    status="PENDING",
                    type="DEPOSIT" if payment_type == "DEPOSIT" else "ROOM_BOOKING",
                    booking_id=booking.id,
                )

            except Exception as e:
                logger.error("PayMongo error: %s", e)

        # ============================================================
        # SEND CONFIRMATION EMAIL TO GUEST (FOR ONLINE BOOKING ONLY)
        # ============================================================
        try:
            from apps.utils.booking_email import send_booking_confirmation_email

            email_sent = send_booking_confirmation_email(booking, request.user)

            if email_sent:
                logger.info(f"✅ Confirmation email sent to {request.user.email}")
            else:
                logger.warning(f"❌ Failed to send confirmation email to {request.user.email}")
        except ImportError as e:
            logger.error(f"❌ Could not import email module: {e}")
        except Exception as e:
            logger.error(f"❌ Email error: {e}")

        return Response(
            {
                "id": booking.id,
                "bookingReference": booking.booking_reference,
                "depositAmount": str(booking.deposit_amount),
                "checkoutUrl": checkout_url,
                **BookingSerializer(booking).data,
            },
            status=status.HTTP_201_CREATED,
        )
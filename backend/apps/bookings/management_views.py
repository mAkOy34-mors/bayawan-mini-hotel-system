"""
apps/bookings/management_views.py

Guest booking management endpoints:

PATCH /api/v1/bookings/<id>/                    → update special requests
POST  /api/v1/bookings/<id>/cancel/             → cancel booking (50% refund policy)
POST  /api/v1/bookings/<id>/change-request/     → submit change request
GET   /api/v1/bookings/<id>/change-requests/    → list change requests for a booking

Admin:
GET  /api/v1/bookings/change-requests/              → all change requests
POST /api/v1/bookings/change-requests/<pk>/approve/ → approve
POST /api/v1/bookings/change-requests/<pk>/reject/  → reject
"""
import logging
import uuid

from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Booking, BookingChangeRequest
from .serializers import BookingSerializer

logger = logging.getLogger(__name__)


# ── Guest endpoints ───────────────────────────────────────────────────────────

class BookingDetailView(APIView):
    """
    PATCH /api/v1/bookings/<id>/
    Guest can update special requests only.
    """

    def get_booking(self, pk, user):
        try:
            return Booking.objects.select_related("room").get(pk=pk, user=user)
        except Booking.DoesNotExist:
            return None

    def patch(self, request, pk):
        booking = self.get_booking(pk, request.user)
        if not booking:
            return Response({"message": "Booking not found."}, status=404)

        if booking.status not in [
            Booking.BookingStatus.CONFIRMED,
            Booking.BookingStatus.PENDING_DEPOSIT,
        ]:
            return Response(
                {"message": "Only confirmed or pending bookings can be edited."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        special_requests         = request.data.get("specialRequests", booking.special_requests)
        booking.special_requests = special_requests
        booking.save(update_fields=["special_requests"])

        logger.info("Booking %s special requests updated by user %s", pk, request.user.id)
        return Response(BookingSerializer(booking).data)


class CancelBookingView(APIView):
    """
    POST /api/v1/bookings/<id>/cancel/
    Cancels a booking with 50% refund policy.
    """

    def post(self, request, pk):
        try:
            booking = Booking.objects.get(pk=pk, user=request.user)
        except Booking.DoesNotExist:
            return Response({"message": "Booking not found."}, status=404)

        if booking.status not in [
            Booking.BookingStatus.CONFIRMED,
            Booking.BookingStatus.PENDING_DEPOSIT,
        ]:
            return Response(
                {"message": f"Cannot cancel a booking with status {booking.status}."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        reason = request.data.get("reason", "")
        deposit_paid = float(booking.deposit_amount or 0)
        refund_amount = round(deposit_paid * 0.5, 2)  # 50% refund
        penalty = round(deposit_paid - refund_amount, 2)  # 50% kept by hotel

        # Cancel the booking
        booking.status = Booking.BookingStatus.CANCELLED
        booking.remaining_amount = 0
        booking.save(update_fields=["status", "remaining_amount"])

        # Create a refund payment record
        if refund_amount > 0 and booking.payment_status != Booking.PaymentStatus.UNPAID:
            try:
                from apps.payments.models import Payment
                Payment.objects.create(
                    paymongo_link_id=f"REFUND-{booking.booking_reference}-{uuid.uuid4().hex[:6].upper()}",
                    checkout_url="",
                    email=request.user.email,
                    description=f"Refund for cancelled booking {booking.booking_reference} (50% of deposit)",
                    amount=refund_amount,
                    status="PAID",
                    type="OTHER",
                    booking_id=booking.id,
                    paid_at=timezone.now(),
                )
            except Exception as e:
                logger.error("Failed to create refund payment record: %s", e)

        logger.info(
            "Booking %s cancelled by user %s. Deposit: %.2f Refund: %.2f Penalty: %.2f",
            booking.booking_reference, request.user.id,
            deposit_paid, refund_amount, penalty,
        )

        return Response({
            "message": "Booking cancelled successfully.",
            "refundAmount": refund_amount,
            "penaltyAmount": penalty,
            "depositPaid": deposit_paid,
            "reason": reason,
            "refundNote": "Refund will be processed within 5-7 business days to your original payment method.",
        })


class SubmitChangeRequestView(APIView):
    """
    POST /api/v1/bookings/<id>/change-request/
    """

    def post(self, request, pk):
        try:
            booking = Booking.objects.get(pk=pk, user=request.user)
        except Booking.DoesNotExist:
            return Response({"message": "Booking not found."}, status=404)

        if booking.status not in [
            Booking.BookingStatus.CONFIRMED,
            Booking.BookingStatus.PENDING_DEPOSIT,
        ]:
            return Response(
                {"message": "Change requests can only be made for confirmed or pending bookings."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        reason = request.data.get("reason", "").strip()
        if not reason:
            return Response(
                {"message": "Please provide a reason for the change request."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        requested_checkin   = request.data.get("requestedCheckin")
        requested_checkout  = request.data.get("requestedCheckout")
        requested_room_type = request.data.get("requestedRoomType")

        if not requested_checkin and not requested_checkout and not requested_room_type:
            return Response(
                {"message": "Please specify what you would like to change."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        existing = BookingChangeRequest.objects.filter(
            booking=booking,
            status=BookingChangeRequest.Status.PENDING,
        ).first()

        if existing:
            return Response(
                {"message": "You already have a pending change request for this booking."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        cr = BookingChangeRequest.objects.create(
            booking             = booking,
            user                = request.user,
            reason              = reason,
            requested_checkin   = requested_checkin or None,
            requested_checkout  = requested_checkout or None,
            requested_room_type = requested_room_type or "",
            status              = BookingChangeRequest.Status.PENDING,
        )

        logger.info(
            "Change request %s submitted for booking %s by user %s",
            cr.id, booking.booking_reference, request.user.id,
        )

        return Response({
            "message": "Change request submitted. Our team will review within 24 hours.",
            "id":      cr.id,
            "status":  cr.status,
        }, status=status.HTTP_201_CREATED)


class ChangeRequestListView(APIView):
    """
    GET /api/v1/bookings/<id>/change-requests/
    """

    def get(self, request, pk):
        try:
            booking = Booking.objects.get(pk=pk, user=request.user)
        except Booking.DoesNotExist:
            return Response({"message": "Booking not found."}, status=404)

        change_requests = BookingChangeRequest.objects.filter(
            booking=booking
        ).order_by("-created_at")

        data = [
            {
                "id":                cr.id,
                "status":            cr.status,
                "reason":            cr.reason,
                "requestedCheckin":  str(cr.requested_checkin)  if cr.requested_checkin  else None,
                "requestedCheckout": str(cr.requested_checkout) if cr.requested_checkout else None,
                "requestedRoomType": cr.requested_room_type     or None,
                "adminNote":         cr.admin_note              or None,
                "createdAt":         cr.created_at.isoformat(),
                "updatedAt":         cr.updated_at.isoformat()  if cr.updated_at else None,
            }
            for cr in change_requests
        ]

        return Response(data)


# ── Admin endpoints ───────────────────────────────────────────────────────────

class AdminChangeRequestsView(APIView):
    """
    GET /api/v1/bookings/change-requests/
    GET /api/v1/bookings/change-requests/?status=PENDING
    """

    def get(self, request):
        if not (getattr(request.user, "role", None) == "ADMIN" or request.user.is_staff):
            return Response({"message": "Forbidden."}, status=403)

        status_filter = request.query_params.get("status", "")
        qs = BookingChangeRequest.objects.select_related(
            "booking", "booking__room", "user"
        ).order_by("-created_at")

        if status_filter and status_filter.upper() != "ALL":
            qs = qs.filter(status=status_filter.upper())

        data = [
            {
                "id":                cr.id,
                "status":            cr.status,
                "reason":            cr.reason,
                "requestedCheckin":  str(cr.requested_checkin)  if cr.requested_checkin  else None,
                "requestedCheckout": str(cr.requested_checkout) if cr.requested_checkout else None,
                "requestedRoomType": cr.requested_room_type     or None,
                "adminNote":         cr.admin_note              or None,
                "createdAt":         cr.created_at.isoformat(),
                "updatedAt":         cr.updated_at.isoformat()  if cr.updated_at else None,
                "bookingReference":  cr.booking.booking_reference,
                "currentCheckin":    str(cr.booking.check_in_date),
                "currentCheckout":   str(cr.booking.check_out_date),
                "currentRoomType":   cr.booking.room.room_type,
                "currentRoomNumber": cr.booking.room.room_number,
                "guestName":         cr.user.username,
                "guestEmail":        cr.user.email,
                "roomType":          cr.booking.room.room_type,
            }
            for cr in qs
        ]

        return Response(data)


class AdminApproveChangeRequestView(APIView):
    """
    POST /api/v1/bookings/change-requests/<pk>/approve/
    Body: { "adminNote": "optional note" }
    """

    def post(self, request, pk):
        if not (getattr(request.user, "role", None) == "ADMIN" or request.user.is_staff):
            return Response({"message": "Forbidden."}, status=403)

        try:
            cr = BookingChangeRequest.objects.select_related("booking__room").get(pk=pk)
        except BookingChangeRequest.DoesNotExist:
            return Response({"message": "Change request not found."}, status=404)

        if cr.status != BookingChangeRequest.Status.PENDING:
            return Response(
                {"message": f"This request is already {cr.status}."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        admin_note     = request.data.get("adminNote", "")
        cr.admin_note  = admin_note
        cr.reviewed_at = timezone.now()
        cr.status      = BookingChangeRequest.Status.APPROVED
        booking        = cr.booking

        # Apply requested changes to booking
        if cr.requested_checkin:
            booking.check_in_date = cr.requested_checkin
        if cr.requested_checkout:
            booking.check_out_date = cr.requested_checkout
        if cr.requested_room_type:
            from apps.rooms.models import Room
            new_room = Room.objects.filter(
                room_type=cr.requested_room_type,
                available=True,
            ).first()
            if not new_room:
                return Response(
                    {"message": f"No available {cr.requested_room_type} rooms found."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            booking.room = new_room

        # Recalculate amounts if dates changed
        if cr.requested_checkin or cr.requested_checkout:
            nights = (booking.check_out_date - booking.check_in_date).days
            booking.number_of_nights = nights
            booking.total_amount     = booking.room.price_per_night * nights
            booking.deposit_amount   = booking.total_amount / 2
            booking.remaining_amount = booking.total_amount - booking.deposit_amount

        booking.save()
        cr.save()

        logger.info(
            "Change request %s approved by admin %s for booking %s",
            pk, request.user.id, booking.booking_reference,
        )

        return Response({
            "message": "Change request approved successfully.",
            "id":      cr.id,
            "status":  cr.status,
        })


class AdminRejectChangeRequestView(APIView):
    """
    POST /api/v1/bookings/change-requests/<pk>/reject/
    Body: { "adminNote": "optional note" }
    """

    def post(self, request, pk):
        if not (getattr(request.user, "role", None) == "ADMIN" or request.user.is_staff):
            return Response({"message": "Forbidden."}, status=403)

        try:
            cr = BookingChangeRequest.objects.get(pk=pk)
        except BookingChangeRequest.DoesNotExist:
            return Response({"message": "Change request not found."}, status=404)

        if cr.status != BookingChangeRequest.Status.PENDING:
            return Response(
                {"message": f"This request is already {cr.status}."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        cr.admin_note  = request.data.get("adminNote", "")
        cr.reviewed_at = timezone.now()
        cr.status      = BookingChangeRequest.Status.REJECTED
        cr.save()

        logger.info(
            "Change request %s rejected by admin %s",
            pk, request.user.id,
        )

        return Response({
            "message": "Change request rejected.",
            "id":      cr.id,
            "status":  cr.status,
        })
# apps/bookings/cancellation_views.py
import logging
from django.utils import timezone
from django.db import transaction
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.core.cache import cache

from .models import Booking, CancellationRequest
from .serializers import CancellationRequestSerializer

logger = logging.getLogger(__name__)


def is_admin_or_receptionist(user):
    """Check if user has admin or receptionist role"""
    role = getattr(user, 'role', '')
    return role in ['ADMIN', 'RECEPTIONIST']


# ============================================================
# GUEST ENDPOINTS
# ============================================================

class SubmitCancelRequestView(APIView):
    """POST /api/v1/bookings/<booking_id>/cancel-request/
    Guest submits a cancellation request for their booking
    """
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, booking_id):
        try:
            booking = Booking.objects.get(id=booking_id, user=request.user)
        except Booking.DoesNotExist:
            return Response(
                {"error": "Booking not found or you don't have permission."},
                status=status.HTTP_404_NOT_FOUND
            )

        # Check if booking can be cancelled
        cancelable_statuses = ['CONFIRMED', 'PENDING_DEPOSIT']
        if booking.status not in cancelable_statuses:
            return Response(
                {"error": f"Cannot request cancellation for booking with status {booking.status}."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if there's already a pending cancellation request
        existing_pending = CancellationRequest.objects.filter(
            booking=booking,
            status='PENDING'
        ).exists()

        if existing_pending:
            return Response(
                {"error": "You already have a pending cancellation request for this booking."},
                status=status.HTTP_400_BAD_REQUEST
            )

        reason = request.data.get('reason', '').strip()
        if not reason:
            return Response(
                {"error": "Please provide a reason for cancellation."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # ── 24-hour grace period: instant cancellation ──────────────────
        # If the booking was created within the last 24 hours the guest can
        # cancel immediately without waiting for admin approval.
        booked_at = booking.createdAt if hasattr(booking, 'createdAt') else booking.created_at
        # Normalise to aware datetime so subtraction works regardless of
        # whether USE_TZ=True stored a naive or aware value.
        if timezone.is_naive(booked_at):
            booked_at = timezone.make_aware(booked_at)
        within_24h = (timezone.now() - booked_at).total_seconds() < 86400

        if within_24h:
            # Auto-approve: create request already resolved
            cancel_request = CancellationRequest.objects.create(
                booking=booking,
                reason=reason,
                status='APPROVED',
                admin_note='Auto-approved: cancelled within 24 hours of booking.',
                resolved_by=None,
                resolved_at=timezone.now(),
            )

            # Immediately cancel the booking
            booking.status = Booking.BookingStatus.CANCELLED
            booking.save(update_fields=['status'])

            # Clear cache
            cache.delete(f"my_bookings_{request.user.id}")

            # Notify guest of instant cancellation
            try:
                from apps.utils.email import send_cancellation_approved_email
                send_cancellation_approved_email(booking, cancel_request)
            except Exception as e:
                logger.error(f"Failed to send instant cancellation email: {e}")

            serializer = CancellationRequestSerializer(cancel_request)
            return Response({
                "success": True,
                "instant": True,
                "message": "Your booking has been cancelled immediately. You cancelled within 24 hours of booking.",
                "request": serializer.data
            }, status=status.HTTP_201_CREATED)

        # ── Standard flow: requires admin approval ───────────────────────
        # Create cancellation request
        cancel_request = CancellationRequest.objects.create(
            booking=booking,
            reason=reason,
            status='PENDING'
        )

        # Update booking status to CANCELLATION_PENDING
        booking.status = Booking.BookingStatus.CANCELLATION_PENDING
        booking.save(update_fields=['status'])

        # Clear cache
        cache.delete(f"my_bookings_{request.user.id}")

        # Send notification email to admin/receptionist (optional)
        try:
            from apps.utils.email import send_cancellation_request_email
            send_cancellation_request_email(booking, cancel_request)
        except Exception as e:
            logger.error(f"Failed to send cancellation request email: {e}")

        serializer = CancellationRequestSerializer(cancel_request)
        return Response({
            "success": True,
            "instant": False,
            "message": "Cancellation request submitted successfully. Our team will review it shortly.",
            "request": serializer.data
        }, status=status.HTTP_201_CREATED)


class GetCancelRequestsView(APIView):
    """GET /api/v1/bookings/<booking_id>/cancel-requests/
    Get all cancellation requests for a specific booking
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, booking_id):
        try:
            booking = Booking.objects.get(id=booking_id, user=request.user)
        except Booking.DoesNotExist:
            return Response(
                {"error": "Booking not found or you don't have permission."},
                status=status.HTTP_404_NOT_FOUND
            )

        cancel_requests = CancellationRequest.objects.filter(booking=booking).order_by('-created_at')
        serializer = CancellationRequestSerializer(cancel_requests, many=True)
        return Response(serializer.data)


# ============================================================
# ADMIN / RECEPTIONIST ENDPOINTS
# ============================================================

class AdminCancelRequestsView(APIView):
    """GET /api/v1/bookings/cancel-requests/
    Get all cancellation requests (admin/receptionist only)
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not is_admin_or_receptionist(request.user):
            return Response(
                {"error": "Access denied. Admin or receptionist required."},
                status=status.HTTP_403_FORBIDDEN
            )

        status_filter = request.query_params.get('status', None)
        if status_filter:
            cancel_requests = CancellationRequest.objects.filter(status=status_filter).order_by('-created_at')
        else:
            cancel_requests = CancellationRequest.objects.all().order_by('-created_at')

        serializer = CancellationRequestSerializer(cancel_requests, many=True)
        return Response(serializer.data)


class AdminApproveCancelRequestView(APIView):
    """POST /api/v1/bookings/cancel-requests/<pk>/approve/
    Approve a cancellation request (admin/receptionist only)
    """
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, pk):
        if not is_admin_or_receptionist(request.user):
            return Response(
                {"error": "Access denied. Admin or receptionist required."},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            cancel_request = CancellationRequest.objects.select_related('booking').get(id=pk)
        except CancellationRequest.DoesNotExist:
            return Response(
                {"error": "Cancellation request not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        if cancel_request.status != 'PENDING':
            return Response(
                {"error": f"Cannot approve request with status {cancel_request.status}."},
                status=status.HTTP_400_BAD_REQUEST
            )

        admin_note = request.data.get('admin_note', '')

        # Update cancellation request
        cancel_request.status = 'APPROVED'
        cancel_request.admin_note = admin_note
        cancel_request.resolved_by = request.user
        cancel_request.resolved_at = timezone.now()
        cancel_request.save()

        # Update booking status to CANCELLED
        booking = cancel_request.booking
        booking.status = Booking.BookingStatus.CANCELLED
        booking.save(update_fields=['status'])

        # Clear user's booking cache
        cache.delete(f"my_bookings_{booking.user_id}")

        # Send email notification to guest (optional)
        try:
            from apps.utils.email import send_cancellation_approved_email
            send_cancellation_approved_email(booking, cancel_request)
        except Exception as e:
            logger.error(f"Failed to send cancellation approved email: {e}")

        serializer = CancellationRequestSerializer(cancel_request)
        return Response({
            "success": True,
            "message": "Cancellation request approved. Booking has been cancelled.",
            "request": serializer.data
        })


class AdminRejectCancelRequestView(APIView):
    """POST /api/v1/bookings/cancel-requests/<pk>/reject/
    Reject a cancellation request (admin/receptionist only)
    """
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, pk):
        if not is_admin_or_receptionist(request.user):
            return Response(
                {"error": "Access denied. Admin or receptionist required."},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            cancel_request = CancellationRequest.objects.select_related('booking').get(id=pk)
        except CancellationRequest.DoesNotExist:
            return Response(
                {"error": "Cancellation request not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        if cancel_request.status != 'PENDING':
            return Response(
                {"error": f"Cannot reject request with status {cancel_request.status}."},
                status=status.HTTP_400_BAD_REQUEST
            )

        admin_note = request.data.get('admin_note', '')
        if not admin_note:
            return Response(
                {"error": "Please provide a reason for rejecting the cancellation request."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Update cancellation request
        cancel_request.status = 'REJECTED'
        cancel_request.admin_note = admin_note
        cancel_request.resolved_by = request.user
        cancel_request.resolved_at = timezone.now()
        cancel_request.save()

        # Revert booking status to original (remove CANCELLATION_PENDING)
        booking = cancel_request.booking
        if booking.status == Booking.BookingStatus.CANCELLATION_PENDING:
            booking.status = Booking.BookingStatus.CONFIRMED
            booking.save(update_fields=['status'])

        # Clear user's booking cache
        cache.delete(f"my_bookings_{booking.user_id}")

        # Send email notification to guest (optional)
        try:
            from apps.utils.email import send_cancellation_rejected_email
            send_cancellation_rejected_email(booking, cancel_request)
        except Exception as e:
            logger.error(f"Failed to send cancellation rejected email: {e}")

        serializer = CancellationRequestSerializer(cancel_request)
        return Response({
            "success": True,
            "message": "Cancellation request rejected.",
            "request": serializer.data
        })
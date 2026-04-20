# apps/bookings/change_request_views.py
import logging
from decimal import Decimal
from datetime import datetime

from django.core.cache import cache
from django.db import transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

from apps.rooms.models import Room
from .models import Booking, BookingChangeRequest

logger = logging.getLogger(__name__)


def is_admin_or_staff(user):
    """Check if user has admin or staff role"""
    if hasattr(user, 'role'):
        role = user.role
        if isinstance(role, str):
            return role.upper() in ['ADMIN', 'STAFF', 'MANAGER', 'RECEPTIONIST']
    return False


class SubmitChangeRequestView(APIView):
    """POST /api/v1/bookings/<booking_id>/change-request/"""
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, booking_id):
        try:
            booking = Booking.objects.select_related('room').get(id=booking_id, user=request.user)
        except Booking.DoesNotExist:
            return Response({'error': 'Booking not found'}, status=404)

        # Check if booking can be modified
        if booking.status not in ['CONFIRMED', 'PENDING_DEPOSIT']:
            return Response({'error': 'Cannot modify this booking'}, status=400)

        # Check for existing pending change request
        existing = BookingChangeRequest.objects.filter(
            booking=booking,
            status__in=['PENDING', 'PAYMENT_PENDING']
        ).exists()
        if existing:
            return Response({'error': 'You already have a pending change request'}, status=400)

        requested_checkin = request.data.get('requestedCheckin')
        requested_checkout = request.data.get('requestedCheckout')
        requested_room_type = request.data.get('requestedRoomType', '')
        reason = request.data.get('reason')

        if not reason:
            return Response({'error': 'Reason is required'}, status=400)

        # Calculate current values
        current_nights = booking.number_of_nights
        current_total = booking.total_amount
        new_nights = current_nights
        new_total = current_total
        price_per_night = booking.room.price_per_night
        new_room = booking.room

        # Calculate new nights if dates changed
        if requested_checkin and requested_checkout:
            try:
                check_in = datetime.strptime(requested_checkin, '%Y-%m-%d').date()
                check_out = datetime.strptime(requested_checkout, '%Y-%m-%d').date()
                new_nights = (check_out - check_in).days
                if new_nights <= 0:
                    return Response({'error': 'Check-out must be after check-in'}, status=400)
            except ValueError:
                return Response({'error': 'Invalid date format'}, status=400)

        # Get price for new room type if changed
        if requested_room_type and requested_room_type != booking.room.room_type:
            try:
                new_room = Room.objects.get(room_type=requested_room_type)
                price_per_night = new_room.price_per_night
            except Room.DoesNotExist:
                return Response({'error': 'Selected room type not available'}, status=400)

        new_total = price_per_night * new_nights
        price_difference = new_total - current_total
        additional_deposit = max(Decimal('0'), price_difference * Decimal('0.5'))

        # Create change request
        change_request = BookingChangeRequest.objects.create(
            booking=booking,
            user=request.user,
            requested_checkin=requested_checkin,
            requested_checkout=requested_checkout,
            requested_room_type=requested_room_type or '',
            reason=reason,
            current_nights=current_nights,
            new_nights=new_nights,
            current_total=current_total,
            new_total=new_total,
            price_difference=price_difference,
            additional_deposit=additional_deposit,
            status='PENDING'
        )

        # Clear cache
        cache.delete(f"my_bookings_{request.user.id}")

        return Response({
            'message': 'Change request submitted successfully',
            'change_request_id': change_request.id,
            'price_difference': float(price_difference),
            'additional_deposit': float(additional_deposit),
            'new_total': float(new_total),
            'new_nights': new_nights,
            'current_nights': current_nights,
            'status': change_request.status
        }, status=201)


class GetChangeRequestsView(APIView):
    """GET /api/v1/bookings/<booking_id>/change-requests/"""
    permission_classes = [IsAuthenticated]

    def get(self, request, booking_id):
        try:
            booking = Booking.objects.get(id=booking_id, user=request.user)
        except Booking.DoesNotExist:
            return Response({'error': 'Booking not found'}, status=404)

        change_requests = BookingChangeRequest.objects.filter(booking=booking)
        data = [{
            'id': cr.id,
            'requested_checkin': str(cr.requested_checkin) if cr.requested_checkin else None,
            'requested_checkout': str(cr.requested_checkout) if cr.requested_checkout else None,
            'requested_room_type': cr.requested_room_type,
            'reason': cr.reason,
            'status': cr.status,
            'admin_note': cr.admin_note,
            'current_nights': cr.current_nights,
            'new_nights': cr.new_nights,
            'price_difference': float(cr.price_difference) if cr.price_difference else 0,
            'additional_deposit': float(cr.additional_deposit) if cr.additional_deposit else 0,
            'created_at': cr.created_at.isoformat(),
        } for cr in change_requests]
        return Response(data)


# apps/bookings/change_request_views.py - Complete fixed version

class AdminApproveChangeRequestView(APIView):
    """POST /api/v1/bookings/change-requests/<id>/approve/"""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        # Check if user has admin or staff role
        if not is_admin_or_staff(request.user):
            return Response({
                'error': 'Permission denied. Admin or staff access required.',
                'user_role': getattr(request.user, 'role', 'No role set'),
                'user_id': request.user.id
            }, status=403)

        try:
            change_request = BookingChangeRequest.objects.select_related('booking', 'booking__room').get(id=pk)
        except BookingChangeRequest.DoesNotExist:
            return Response({'error': 'Change request not found'}, status=404)

        booking = change_request.booking
        admin_note = request.data.get('admin_note', '')

        logger.info(f"Processing change request {pk} for booking {booking.booking_reference}")
        logger.info(
            f"Requested changes - Checkin: {change_request.requested_checkin}, Checkout: {change_request.requested_checkout}")
        logger.info(
            f"Current booking - Checkin: {booking.check_in_date}, Checkout: {booking.check_out_date}, Nights: {booking.number_of_nights}")

        with transaction.atomic():
            # ============================================================
            # UPDATE THE BOOKING WITH REQUESTED CHANGES
            # ============================================================

            # Update dates if changed
            if change_request.requested_checkin and change_request.requested_checkout:
                booking.check_in_date = change_request.requested_checkin
                booking.check_out_date = change_request.requested_checkout
                booking.number_of_nights = change_request.new_nights
                booking.total_amount = change_request.new_total
                logger.info(f"Updated booking dates to {booking.check_in_date} - {booking.check_out_date}")

            # Update room type if changed
            if change_request.requested_room_type and change_request.requested_room_type != booking.room.room_type:
                try:
                    new_room = Room.objects.get(room_type=change_request.requested_room_type)
                    booking.room = new_room
                    logger.info(f"Updated room type to {change_request.requested_room_type}")
                except Room.DoesNotExist:
                    logger.warning(f"Room type {change_request.requested_room_type} not found")

            # Handle price difference
            if change_request.price_difference and change_request.price_difference > 0:
                # Adding nights - increase deposit
                booking.deposit_amount += change_request.additional_deposit
                booking.remaining_amount = booking.total_amount - booking.deposit_amount
                logger.info(f"Added additional deposit: {change_request.additional_deposit}")
                logger.info(f"New deposit: {booking.deposit_amount}, New remaining: {booking.remaining_amount}")

            elif change_request.price_difference and change_request.price_difference < 0:
                # Reducing nights - calculate refund
                refund_amount = abs(change_request.price_difference)
                deposit_refund = refund_amount * Decimal('0.5')
                booking.deposit_amount = max(Decimal('0'), booking.deposit_amount - deposit_refund)
                booking.remaining_amount = booking.total_amount - booking.deposit_amount
                logger.info(f"Refund amount: {refund_amount}, Deposit refund: {deposit_refund}")

            # ============================================================
            # CRITICAL: SAVE THE BOOKING
            # ============================================================
            booking.save()
            logger.info(f"Booking {booking.booking_reference} saved successfully")

            # Update change request status
            if change_request.price_difference and change_request.price_difference > 0:
                change_request.status = 'PAYMENT_PENDING'
                change_request.admin_note = admin_note
                change_request.save()

                # Create payment link for additional deposit (optional)
                try:
                    from apps.payments.paymongo import create_payment_link
                    from apps.payments.models import Payment

                    payment_link = create_payment_link(
                        amount=float(change_request.additional_deposit),
                        description=f"Additional deposit for booking {booking.booking_reference} - Stay extension",
                        remarks=f"Extension from {change_request.current_nights} to {change_request.new_nights} nights",
                        booking_id=booking.id,
                        booking_reference=booking.booking_reference,
                    )

                    change_request.payment_link_id = payment_link.get("paymongo_link_id")
                    change_request.save(update_fields=['payment_link_id'])

                    Payment.objects.create(
                        paymongo_link_id=payment_link.get("paymongo_link_id"),
                        checkout_url=payment_link.get("checkout_url"),
                        email=booking.user.email,
                        description=f"Additional deposit - Booking {booking.booking_reference}",
                        amount=change_request.additional_deposit,
                        status='PENDING',
                        type='ADDITIONAL_DEPOSIT',
                        booking_id=booking.id,
                    )

                    return Response({
                        'message': 'Change request approved. Payment required to complete the extension.',
                        'payment_required': True,
                        'payment_url': payment_link.get("checkout_url"),
                        'additional_amount': float(change_request.additional_deposit),
                        'booking_updated': True,
                        'new_check_in': str(booking.check_in_date),
                        'new_check_out': str(booking.check_out_date),
                        'new_total': float(booking.total_amount)
                    })

                except Exception as e:
                    logger.error(f"Payment link creation error: {e}")
                    # Still return success since booking is updated

            else:
                change_request.status = 'APPROVED'
                change_request.admin_note = admin_note
                change_request.reviewed_at = timezone.now()
                change_request.save()

            # Clear all caches
            cache.delete(f"my_bookings_{booking.user_id}")
            cache.delete(f"booking_{booking.id}")
            cache.delete(f"receptionist_booking_{booking.id}")
            cache.delete("receptionist_bookings_all")

            # Return the updated booking data
            return Response({
                'message': 'Change request approved and applied successfully',
                'payment_required': False,
                'booking_updated': True,
                'booking_id': booking.id,
                'booking_reference': booking.booking_reference,
                'new_check_in': str(booking.check_in_date),
                'new_check_out': str(booking.check_out_date),
                'new_nights': booking.number_of_nights,
                'new_total': float(booking.total_amount),
                'new_deposit': float(booking.deposit_amount),
                'new_remaining': float(booking.remaining_amount)
            })

class AdminRejectChangeRequestView(APIView):
    """POST /api/v1/bookings/change-requests/<id>/reject/"""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        # Check if user has admin or staff role
        if not is_admin_or_staff(request.user):
            return Response({
                'error': 'Permission denied. Admin or staff access required.',
                'user_role': getattr(request.user, 'role', 'No role set')
            }, status=403)

        try:
            change_request = BookingChangeRequest.objects.get(id=pk)
        except BookingChangeRequest.DoesNotExist:
            return Response({'error': 'Change request not found'}, status=404)

        change_request.status = 'REJECTED'
        change_request.admin_note = request.data.get('admin_note', '')
        change_request.reviewed_at = timezone.now()
        change_request.save()

        # Clear cache
        cache.delete(f"my_bookings_{change_request.booking.user_id}")

        return Response({
            'message': 'Change request rejected',
            'change_request_id': change_request.id,
            'status': change_request.status
        })
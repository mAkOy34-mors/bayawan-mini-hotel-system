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
from rest_framework.permissions import IsAuthenticated, AllowAny

from apps.rooms.models import Room
from apps.rooms.serializers import RoomSerializer
from .models import Booking, BookingChangeRequest

logger = logging.getLogger(__name__)


def is_admin_or_staff(user):
    """Check if user has admin or staff role"""
    if hasattr(user, 'role'):
        role = user.role
        if isinstance(role, str):
            return role.upper() in ['ADMIN', 'STAFF', 'MANAGER', 'RECEPTIONIST']
    return False


# ─────────────────────────────────────────────────────────────────────────────
# NEW: Room types with pricing for the change-request form
# ─────────────────────────────────────────────────────────────────────────────

class RoomTypesWithPricingView(APIView):
    """
    GET /api/v1/bookings/room-types-pricing/

    Returns ONE summary card per distinct room_type (Step 1 of the room picker).
    Price shown is the lowest-priced room of that type.
    Also includes totalRooms and availableRooms counts per type.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        rooms = Room.objects.all().order_by('price_per_night')

        seen   = {}   # room_type -> representative Room (lowest price first)
        counts = {}   # room_type -> { total, available }

        for room in rooms:
            rt = room.room_type
            if rt not in seen:
                seen[rt]   = room
                counts[rt] = {'total': 0, 'available': 0}
            counts[rt]['total'] += 1
            if room.available:
                counts[rt]['available'] += 1

        data = []
        for rt, room in seen.items():
            data.append({
                'roomType':       rt,
                'pricePerNight':  float(room.price_per_night),
                'maxOccupancy':   room.max_occupancy,
                'description':    room.description or '',
                'imageUrl':       room.image_url   or '',
                'amenities':      room.amenities   or '',
                'totalRooms':     counts[rt]['total'],
                'availableRooms': counts[rt]['available'],
            })

        return Response(data)


class RoomsByTypeView(APIView):
    """
    GET /api/v1/bookings/rooms-by-type/<room_type>/

    Returns every individual room of the requested type (Step 2 of the room picker).
    The guest sees individual room numbers and can pick one.

    Optional query params:
        checkIn          YYYY-MM-DD  — marks rooms booked in that range as unavailable
        checkOut         YYYY-MM-DD
        excludeBookingId int         — exclude guest's own booking from conflict check
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, room_type):
        rooms = Room.objects.filter(room_type=room_type).order_by('room_number')

        if not rooms.exists():
            return Response({'error': f'No rooms found for type "{room_type}"'}, status=404)

        check_in_str  = request.query_params.get('checkIn')
        check_out_str = request.query_params.get('checkOut')
        exclude_id    = request.query_params.get('excludeBookingId')

        booked_room_ids = set()
        if check_in_str and check_out_str:
            try:
                from datetime import date as _date
                check_in  = _date.fromisoformat(check_in_str)
                check_out = _date.fromisoformat(check_out_str)

                qs = Booking.objects.filter(
                    status__in=['CONFIRMED', 'CHECKED_IN', 'PENDING_DEPOSIT'],
                    check_in_date__lt=check_out,
                    check_out_date__gt=check_in,
                )
                if exclude_id:
                    qs = qs.exclude(id=exclude_id)

                booked_room_ids = set(qs.values_list('room_id', flat=True))
            except ValueError:
                pass

        data = []
        for room in rooms:
            available_for_dates = (
                room.id not in booked_room_ids
                if (check_in_str and check_out_str)
                else room.available
            )
            data.append({
                'id':                room.id,
                'roomNumber':        room.room_number,
                'roomType':          room.room_type,
                'pricePerNight':     float(room.price_per_night),
                'maxOccupancy':      room.max_occupancy,
                'available':         room.available,
                'availableForDates': available_for_dates,
                'status':            room.status or 'CLEAN',
                'description':       room.description or '',
                'amenities':         room.amenities   or '',
                'imageUrl':          room.image_url   or '',
            })

        return Response(data)


# ─────────────────────────────────────────────────────────────────────────────
# NEW: Price preview — calculate the difference before submitting
# ─────────────────────────────────────────────────────────────────────────────

class ChangeRequestPreviewView(APIView):
    """
    POST /api/v1/bookings/<booking_id>/change-request/preview/

    Preview the financial impact of a proposed change request.
    Returns whether it would result in an upgrade payment, a refund, or no change.

    Request body:
        requestedCheckin  (str, YYYY-MM-DD)  optional
        requestedCheckout (str, YYYY-MM-DD)  optional
        requestedRoomType (str)              optional

    Response:
        {
            "currentNights":     3,
            "newNights":         4,
            "currentTotal":      9000.00,
            "newTotal":          12000.00,
            "priceDifference":   3000.00,   // positive = upgrade, negative = refund
            "additionalDeposit": 1500.00,   // > 0 means payment required
            "refundAmount":      0.00,      // > 0 means guest gets money back
            "scenario":          "UPGRADE"  // UPGRADE | REFUND | NO_CHANGE
        }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, booking_id):
        try:
            booking = Booking.objects.select_related('room').get(
                id=booking_id, user=request.user
            )
        except Booking.DoesNotExist:
            return Response({'error': 'Booking not found'}, status=404)

        requested_checkin  = request.data.get('requestedCheckin')
        requested_checkout = request.data.get('requestedCheckout')
        requested_room_type = request.data.get('requestedRoomType', '')

        current_nights = booking.number_of_nights
        current_total  = booking.total_amount
        new_nights     = current_nights
        price_per_night = booking.room.price_per_night
        new_room       = booking.room

        if requested_checkin and requested_checkout:
            try:
                check_in  = datetime.strptime(requested_checkin,  '%Y-%m-%d').date()
                check_out = datetime.strptime(requested_checkout, '%Y-%m-%d').date()
                new_nights = (check_out - check_in).days
                if new_nights <= 0:
                    return Response({'error': 'Check-out must be after check-in'}, status=400)
            except ValueError:
                return Response({'error': 'Invalid date format'}, status=400)

        if requested_room_type and requested_room_type != booking.room.room_type:
            try:
                new_room = Room.objects.filter(room_type=requested_room_type).first()
                if not new_room:
                    return Response({'error': 'Room type not found'}, status=400)
                price_per_night = new_room.price_per_night
            except Room.DoesNotExist:
                return Response({'error': 'Room type not found'}, status=400)

        new_total        = Decimal(str(price_per_night)) * new_nights
        price_difference = new_total - Decimal(str(current_total))

        if price_difference > 0:
            scenario          = 'UPGRADE'
            additional_deposit = price_difference * Decimal('0.5')
            refund_amount      = Decimal('0')
        elif price_difference < 0:
            scenario           = 'REFUND'
            additional_deposit = Decimal('0')
            refund_amount      = abs(price_difference) * Decimal('0.5')
        else:
            scenario           = 'NO_CHANGE'
            additional_deposit = Decimal('0')
            refund_amount      = Decimal('0')

        return Response({
            'currentNights':      current_nights,
            'newNights':          new_nights,
            'currentTotal':       float(current_total),
            'newTotal':           float(new_total),
            'priceDifference':    float(price_difference),
            'additionalDeposit':  float(additional_deposit),
            'refundAmount':       float(refund_amount),
            'scenario':           scenario,
            'currentRoomType':    booking.room.room_type,
            'requestedRoomType':  requested_room_type or booking.room.room_type,
            'pricePerNight':      float(price_per_night),
        })


# ─────────────────────────────────────────────────────────────────────────────
# Updated: SubmitChangeRequestView — handles UPGRADE and REFUND scenarios
# ─────────────────────────────────────────────────────────────────────────────

class SubmitChangeRequestView(APIView):
    """POST /api/v1/bookings/<booking_id>/change-request/"""
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, booking_id):
        try:
            booking = Booking.objects.select_related('room').get(
                id=booking_id, user=request.user
            )
        except Booking.DoesNotExist:
            return Response({'error': 'Booking not found'}, status=404)

        if booking.status not in ['CONFIRMED', 'PENDING_DEPOSIT']:
            return Response({'error': 'Cannot modify this booking'}, status=400)

        existing = BookingChangeRequest.objects.filter(
            booking=booking,
            status__in=['PENDING', 'PAYMENT_PENDING']
        ).exists()
        if existing:
            return Response({'error': 'You already have a pending change request'}, status=400)

        requested_checkin   = request.data.get('requestedCheckin')
        requested_checkout  = request.data.get('requestedCheckout')
        requested_room_type = request.data.get('requestedRoomType', '')
        requested_room_id   = request.data.get('requestedRoomId')   # ← specific room chosen in Step 2
        reason              = request.data.get('reason')

        if not reason:
            return Response({'error': 'Reason is required'}, status=400)

        current_nights  = booking.number_of_nights
        current_total   = booking.total_amount
        new_nights      = current_nights
        new_total       = current_total
        price_per_night = booking.room.price_per_night
        new_room        = booking.room

        check_in  = booking.check_in_date
        check_out = booking.check_out_date

        if requested_checkin and requested_checkout:
            try:
                check_in  = datetime.strptime(requested_checkin,  '%Y-%m-%d').date()
                check_out = datetime.strptime(requested_checkout, '%Y-%m-%d').date()
                new_nights = (check_out - check_in).days
                if new_nights <= 0:
                    return Response({'error': 'Check-out must be after check-in'}, status=400)
            except ValueError:
                return Response({'error': 'Invalid date format'}, status=400)

        if requested_room_type and requested_room_type != booking.room.room_type:
            # If a specific room ID was provided, use that room directly
            if requested_room_id:
                try:
                    new_room = Room.objects.get(id=requested_room_id, room_type=requested_room_type, available=True)
                except Room.DoesNotExist:
                    return Response({'error': 'The selected room is not available'}, status=400)
            else:
                # Fall back to any available room of that type
                new_room = Room.objects.filter(room_type=requested_room_type, available=True).first()
                if not new_room:
                    return Response({'error': 'Selected room type not available'}, status=400)
            price_per_night = new_room.price_per_night

        # ── Availability checks ───────────────────────────────────────────
        if new_room.id != booking.room.id:
            room_conflict = Booking.objects.filter(
                room=new_room,
                status__in=['CONFIRMED', 'CHECKED_IN', 'PENDING_DEPOSIT'],
                check_in_date__lt=check_out,
                check_out_date__gt=check_in,
            ).exists()
            if room_conflict:
                return Response({'error': f'The requested room type "{requested_room_type}" is not available for {check_in} – {check_out}.'}, status=400)

        elif requested_checkin and requested_checkout:
            date_conflict = Booking.objects.filter(
                room=booking.room,
                status__in=['CONFIRMED', 'CHECKED_IN', 'PENDING_DEPOSIT'],
                check_in_date__lt=check_out,
                check_out_date__gt=check_in,
            ).exclude(id=booking.id).exists()
            if date_conflict:
                return Response({'error': f'Your current room is not available for {check_in} – {check_out}.'}, status=400)

        # ── Financial calculations ────────────────────────────────────────
        new_total        = Decimal(str(price_per_night)) * new_nights
        price_difference = new_total - Decimal(str(current_total))

        if price_difference > 0:
            # UPGRADE — guest must pay additional deposit AFTER admin approves
            additional_deposit = price_difference * Decimal('0.5')
            refund_amount      = Decimal('0')
            initial_status     = 'PENDING'   # admin reviews first, then payment link sent
        elif price_difference < 0:
            # DOWNGRADE / REFUND — admin approves, hotel issues refund
            additional_deposit = Decimal('0')
            refund_amount      = abs(price_difference) * Decimal('0.5')
            initial_status     = 'PENDING'
        else:
            additional_deposit = Decimal('0')
            refund_amount      = Decimal('0')
            initial_status     = 'PENDING'

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
            status=initial_status,
        )

        cache.delete(f"my_bookings_{request.user.id}")

        scenario = 'UPGRADE' if price_difference > 0 else ('REFUND' if price_difference < 0 else 'NO_CHANGE')

        return Response({
            'message': 'Change request submitted successfully',
            'change_request_id': change_request.id,
            'price_difference':  float(price_difference),
            'additional_deposit': float(additional_deposit),
            'refund_amount':     float(refund_amount),
            'new_total':         float(new_total),
            'new_nights':        new_nights,
            'current_nights':    current_nights,
            'status':            change_request.status,
            'scenario':          scenario,
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
            'id':                  cr.id,
            'requested_checkin':   str(cr.requested_checkin)  if cr.requested_checkin  else None,
            'requested_checkout':  str(cr.requested_checkout) if cr.requested_checkout else None,
            'requested_room_type': cr.requested_room_type,
            'reason':              cr.reason,
            'status':              cr.status,
            'admin_note':          cr.admin_note,
            'current_nights':      cr.current_nights,
            'new_nights':          cr.new_nights,
            'price_difference':    float(cr.price_difference)    if cr.price_difference    else 0,
            'additional_deposit':  float(cr.additional_deposit)  if cr.additional_deposit  else 0,
            'payment_link_id':     cr.payment_link_id,
            'payment_completed':   cr.payment_completed,
            'created_at':          cr.created_at.isoformat(),
        } for cr in change_requests]
        return Response(data)


# ─────────────────────────────────────────────────────────────────────────────
# Admin: Approve — triggers payment link for UPGRADE, marks refund for REFUND
# ─────────────────────────────────────────────────────────────────────────────

class AdminApproveChangeRequestView(APIView):
    """
    POST /api/v1/bookings/change-requests/<id>/approve/

    UPGRADE  → Creates a PayMongo payment link, sets status=PAYMENT_PENDING.
               Booking is NOT yet updated. It updates when the webhook fires.
    REFUND   → Sets status=APPROVED, creates a refund Payment record, updates booking.
    NO_CHANGE→ Sets status=APPROVED, updates booking immediately.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if not is_admin_or_staff(request.user):
            return Response({'error': 'Permission denied.'}, status=403)

        try:
            change_request = BookingChangeRequest.objects.select_related(
                'booking', 'booking__room', 'booking__user'
            ).get(id=pk)
        except BookingChangeRequest.DoesNotExist:
            return Response({'error': 'Change request not found'}, status=404)

        if change_request.status not in ['PENDING']:
            return Response({'error': f'Cannot approve a request with status {change_request.status}'}, status=400)

        booking    = change_request.booking
        admin_note = request.data.get('admin_note', '')
        price_diff = Decimal(str(change_request.price_difference or 0))

        # ── UPGRADE: price_difference > 0 ────────────────────────────────
        if price_diff > 0:
            additional_deposit = Decimal(str(change_request.additional_deposit or 0))

            # Create PayMongo checkout session for the additional deposit
            try:
                from apps.payments.paymongo import create_payment_link
                from apps.payments.models import Payment

                description = (
                    f"Additional deposit for booking change "
                    f"({booking.booking_reference}) — "
                    f"upgrade to {change_request.requested_room_type or 'new dates'}"
                )

                result = create_payment_link(
                    amount=float(additional_deposit),
                    description=description,
                    booking_id=booking.id,
                    booking_reference=booking.booking_reference,
                )

                # Create a PENDING payment record
                payment = Payment.objects.create(
                    paymongo_link_id=result['paymongo_link_id'],
                    checkout_url=result['checkout_url'],
                    email=booking.user.email,
                    description=description,
                    amount=additional_deposit,
                    status=Payment.PaymentStatus.PENDING,
                    type='ADDITIONAL_DEPOSIT',
                    booking_id=booking.id,
                )

                # Store the payment link on the change request
                change_request.payment_link_id = result['paymongo_link_id']
                change_request.status          = 'PAYMENT_PENDING'
                change_request.admin_note      = admin_note
                change_request.reviewed_at     = timezone.now()
                change_request.save(update_fields=[
                    'status', 'admin_note', 'reviewed_at', 'payment_link_id'
                ])

                # Invalidate caches
                cache.delete(f"my_bookings_{booking.user_id}")

                logger.info(
                    "Change request %s approved (UPGRADE). Payment link created: %s",
                    change_request.id, payment.id
                )

                return Response({
                    'message':         'Change request approved. Payment link sent to guest.',
                    'change_request_id': change_request.id,
                    'status':          change_request.status,
                    'scenario':        'UPGRADE',
                    'checkout_url':    result['checkout_url'],
                    'payment_id':      payment.id,
                    'additional_deposit': float(additional_deposit),
                })

            except Exception as e:
                logger.error("Failed to create payment link for change request %s: %s", pk, e)
                return Response({'error': f'Failed to create payment link: {str(e)}'}, status=502)

        # ── REFUND: price_difference < 0 ─────────────────────────────────
        elif price_diff < 0:
            import uuid
            from apps.payments.models import Payment

            refund_amount = abs(price_diff) * Decimal('0.5')

            # Create a refund payment record
            try:
                Payment.objects.create(
                    paymongo_link_id=f"REFUND-CR{change_request.id}-{uuid.uuid4().hex[:6].upper()}",
                    checkout_url='',
                    email=booking.user.email,
                    description=f"Refund for booking change ({booking.booking_reference})",
                    amount=refund_amount,
                    status=Payment.PaymentStatus.PAID,
                    type='REFUND',
                    booking_id=booking.id,
                    paid_at=timezone.now(),
                )
            except Exception as e:
                logger.error("Failed to create refund record for change request %s: %s", pk, e)

            # Update the booking
            self._apply_change_to_booking(change_request, booking)

            change_request.status      = 'APPROVED'
            change_request.admin_note  = admin_note
            change_request.reviewed_at = timezone.now()
            change_request.save(update_fields=['status', 'admin_note', 'reviewed_at'])

            cache.delete(f"my_bookings_{booking.user_id}")

            logger.info(
                "Change request %s approved (REFUND ₱%.2f). Booking updated.",
                change_request.id, refund_amount
            )

            return Response({
                'message':         'Change request approved. Refund will be processed.',
                'change_request_id': change_request.id,
                'status':          change_request.status,
                'scenario':        'REFUND',
                'refund_amount':   float(refund_amount),
            })

        # ── NO CHANGE in price ────────────────────────────────────────────
        else:
            self._apply_change_to_booking(change_request, booking)

            change_request.status      = 'APPROVED'
            change_request.admin_note  = admin_note
            change_request.reviewed_at = timezone.now()
            change_request.save(update_fields=['status', 'admin_note', 'reviewed_at'])

            cache.delete(f"my_bookings_{booking.user_id}")

            return Response({
                'message':         'Change request approved. Booking updated.',
                'change_request_id': change_request.id,
                'status':          change_request.status,
                'scenario':        'NO_CHANGE',
            })

    def _apply_change_to_booking(self, change_request, booking):
        """Apply the date / room-type changes directly to the booking."""
        updated_fields = []

        if change_request.requested_checkin and change_request.requested_checkout:
            booking.check_in_date  = change_request.requested_checkin
            booking.check_out_date = change_request.requested_checkout
            booking.number_of_nights = change_request.new_nights or (
                (change_request.requested_checkout - change_request.requested_checkin).days
            )
            updated_fields += ['check_in_date', 'check_out_date', 'number_of_nights']

        if change_request.new_total:
            booking.total_amount     = change_request.new_total
            booking.remaining_amount = change_request.new_total - booking.deposit_amount
            updated_fields += ['total_amount', 'remaining_amount']

        if change_request.requested_room_type and change_request.requested_room_type != booking.room.room_type:
            try:
                new_room   = Room.objects.get(room_type=change_request.requested_room_type)
                booking.room = new_room
                updated_fields.append('room')
            except Room.DoesNotExist:
                logger.warning("Room type %s not found when applying change request", change_request.requested_room_type)

        if updated_fields:
            booking.save(update_fields=updated_fields)
            logger.info("Booking %s updated: %s", booking.booking_reference, updated_fields)


class AdminRejectChangeRequestView(APIView):
    """POST /api/v1/bookings/change-requests/<id>/reject/"""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if not is_admin_or_staff(request.user):
            return Response({'error': 'Permission denied.'}, status=403)

        try:
            change_request = BookingChangeRequest.objects.get(id=pk)
        except BookingChangeRequest.DoesNotExist:
            return Response({'error': 'Change request not found'}, status=404)

        admin_note = request.data.get('admin_note', '')

        change_request.status      = 'REJECTED'
        change_request.admin_note  = admin_note
        change_request.reviewed_at = timezone.now()
        change_request.save(update_fields=['status', 'admin_note', 'reviewed_at'])

        cache.delete(f"my_bookings_{change_request.booking.user_id}")

        return Response({
            'message':           'Change request rejected',
            'change_request_id': change_request.id,
            'status':            change_request.status,
            'reviewed_at':       change_request.reviewed_at.isoformat(),
        })


# ─────────────────────────────────────────────────────────────────────────────
# NEW: Guest polling endpoint for PAYMENT_PENDING change requests
# ─────────────────────────────────────────────────────────────────────────────

class ChangeRequestPaymentStatusView(APIView):
    """
    GET /api/v1/bookings/change-requests/<id>/payment-status/

    Guest polls this to find out if:
    - Admin has approved and a payment link is ready (PAYMENT_PENDING)
    - Payment has been completed (APPROVED + payment_completed=True)
    - Request was rejected (REJECTED)
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            change_request = BookingChangeRequest.objects.select_related('booking').get(
                id=pk, booking__user=request.user
            )
        except BookingChangeRequest.DoesNotExist:
            return Response({'error': 'Change request not found'}, status=404)

        checkout_url = None
        if change_request.payment_link_id and change_request.status == 'PAYMENT_PENDING':
            try:
                from apps.payments.models import Payment
                payment = Payment.objects.get(paymongo_link_id=change_request.payment_link_id)
                checkout_url = payment.checkout_url
            except Exception:
                pass

        return Response({
            'id':                change_request.id,
            'status':            change_request.status,
            'payment_link_id':   change_request.payment_link_id,
            'payment_completed':  change_request.payment_completed,
            'checkout_url':      checkout_url,
            'price_difference':  float(change_request.price_difference  or 0),
            'additional_deposit': float(change_request.additional_deposit or 0),
        })
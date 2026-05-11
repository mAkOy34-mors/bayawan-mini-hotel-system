# apps/emergency/views.py
import json
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.contrib.auth import get_user_model
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import EmergencyAlert
from apps.bookings.models import Booking

User = get_user_model()


class SendEmergencyAlertView(APIView):
    """POST /api/v1/emergency/alert/"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        emergency_type = request.data.get('emergencyType')
        emergency_type_name = request.data.get('emergencyTypeName')

        room_number = request.data.get('roomNumber', '')
        guest_name = request.data.get('guestName', '')

        today = timezone.now().date()
        booking = Booking.objects.filter(
            user=request.user,
            status__in=['CONFIRMED', 'CHECKED_IN'],
            check_in_date__lte=today,
            check_out_date__gte=today
        ).first()

        print(f"=== Emergency Alert Debug ===")
        print(f"User: {request.user.username}")
        print(f"Today: {today}")
        print(f"Found booking: {booking}")

        if booking:
            print(f"Booking ID: {booking.id}")
            print(f"Booking status: {booking.status}")
            print(f"Booking check_in: {booking.check_in_date}")
            print(f"Booking check_out: {booking.check_out_date}")
            print(f"Booking has room: {booking.room}")
            if booking.room:
                print(f"Room ID: {booking.room.id}")
                print(f"Room number: {booking.room.room_number}")

        if booking and booking.room and booking.room.room_number:
            room_number = booking.room.room_number
            print(f"Using room from booking: {room_number}")
        elif not room_number or room_number == 'Not assigned':
            room_number = 'Unknown'
            print(f"No valid room found, using: {room_number}")

        if not guest_name and booking and booking.user:
            guest_name = booking.user.get_full_name() or booking.user.username

        if room_number and len(room_number) > 50:
            room_number = room_number[:50]

        guest_phone = None
        if booking and booking.guest_information:
            guest_phone = booking.guest_information.contact_number
        elif hasattr(request.user, 'guest_information'):
            guest_phone = request.user.guest_information.contact_number

        alert = EmergencyAlert.objects.create(
            user=request.user,
            booking=booking,
            emergency_type=emergency_type,
            emergency_type_name=emergency_type_name,
            room_number=room_number,
            guest_name=guest_name or request.user.username,
            guest_phone=guest_phone
        )

        print(f"Created alert #{alert.id} with room number: {alert.room_number}")
        print(f"=================================")

        try:
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                'emergency_alerts',
                {
                    'type': 'new_emergency',
                    'emergency_id': alert.id,
                    'emergency_type': alert.emergency_type,
                    'emergency_type_name': alert.emergency_type_name,
                    'guest_name': alert.guest_name,
                    'room_number': alert.room_number,
                    'guest_phone': alert.guest_phone or '',
                    'created_at': alert.created_at.isoformat(),
                }
            )
        except Exception as e:
            print(f"WebSocket broadcast error: {e}")

        return Response({
            'success': True,
            'alert_id': alert.id,
            'message': 'Emergency alert sent successfully',
            'room_number': alert.room_number
        })


class MyEmergencyAlertsView(APIView):
    """GET /api/v1/emergency/my-alerts/"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        alerts = EmergencyAlert.objects.filter(user=request.user)

        active_count = alerts.filter(status='ACTIVE').count()
        resolved_count = alerts.filter(status='RESOLVED').count()

        return Response({
            'alerts': [{
                'id': a.id,
                'emergencyType': a.emergency_type,
                'emergencyTypeName': a.emergency_type_name,
                'roomNumber': a.room_number,
                'status': a.status,
                'createdAt': a.created_at,
                'resolvedAt': a.resolved_at
            } for a in alerts],
            'stats': {
                'total': alerts.count(),
                'active': active_count,
                'resolved': resolved_count
            }
        })


class AllEmergencyAlertsView(APIView):
    """GET /api/v1/emergency/all/ - For staff dashboard"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        allowed_roles = ['ADMIN', 'RECEPTIONIST', 'HOUSEKEEPER', 'MAINTENANCE', 'SECURITY', 'STAFF', 'MANAGEMENT',
                         'FRONT_DESK']

        if not (request.user.is_staff or request.user.role in allowed_roles):
            return Response({'error': 'Unauthorized'}, status=403)

        alerts = EmergencyAlert.objects.all()
        active = alerts.filter(status__in=['ACTIVE', 'ACCEPTED', 'IN_PROGRESS'])

        return Response({
            'emergencies': [{
                'id': a.id,
                'emergencyType': a.emergency_type,
                'emergencyTypeName': a.emergency_type_name,
                'guestName': a.guest_name,
                'roomNumber': a.room_number,
                'guestPhone': a.guest_phone,
                'status': a.status,
                'createdAt': a.created_at,
                'resolvedAt': a.resolved_at,
                'resolvedBy': a.resolved_by.username if a.resolved_by else None,
            } for a in alerts],
            'activeEmergencies': [{
                'id': a.id,
                'emergencyType': a.emergency_type,
                'emergencyTypeName': a.emergency_type_name,
                'guestName': a.guest_name,
                'roomNumber': a.room_number,
                'guestPhone': a.guest_phone,
                'status': a.status,
                'createdAt': a.created_at,
            } for a in active],
        })


class AdvanceEmergencyStatusView(APIView):
    """
    POST /api/v1/emergency/<id>/advance/
    Advances the emergency through the status pipeline:
      ACTIVE → ACCEPTED → IN_PROGRESS → RESOLVED
    The modal button label updates to reflect the next action.
    """
    permission_classes = [IsAuthenticated]

    ALLOWED_ROLES = [
        'ADMIN', 'RECEPTIONIST', 'HOUSEKEEPER',
        'MAINTENANCE', 'SECURITY', 'STAFF', 'MANAGEMENT', 'FRONT_DESK'
    ]

    # Human-readable label for each transition action
    ACTION_LABELS = {
        'ACTIVE':      'Accept',
        'ACCEPTED':    'Mark In Progress',
        'IN_PROGRESS': 'Resolve',
    }

    def post(self, request, emergency_id):
        if not (request.user.is_staff or request.user.role in self.ALLOWED_ROLES):
            return Response({'error': 'Unauthorized'}, status=403)

        try:
            alert = EmergencyAlert.objects.get(id=emergency_id)
        except EmergencyAlert.DoesNotExist:
            return Response({'error': 'Emergency not found'}, status=404)

        if not alert.can_advance():
            return Response(
                {'error': f'Emergency is already {alert.status} and cannot be advanced further.'},
                status=400
            )

        next_status = alert.next_status()
        now = timezone.now()

        # Stamp the right timestamp field
        if next_status == 'ACCEPTED':
            alert.accepted_at = now
            alert.accepted_by = request.user
        elif next_status == 'IN_PROGRESS':
            alert.in_progress_at = now
        elif next_status == 'RESOLVED':
            alert.resolved_at = now
            alert.resolved_by = request.user

        alert.status = next_status
        alert.save()

        # Broadcast the status change via WebSocket
        try:
            channel_layer = get_channel_layer()
            # Always use emergency_broadcast so the consumer re-broadcasts as
            # EMERGENCY_STATUS_UPDATED (uppercase) to every connected client.
            # The frontend listens for EMERGENCY_STATUS_UPDATED for ALL statuses,
            # including RESOLVED — so we no longer need a separate resolved path here.
            async_to_sync(channel_layer.group_send)(
                'emergency_alerts',
                {
                    'type': 'emergency_broadcast',
                    'emergency_id': alert.id,
                    'status': alert.status,
                    'accepted_at': alert.accepted_at.isoformat() if alert.accepted_at else None,
                    'in_progress_at': alert.in_progress_at.isoformat() if alert.in_progress_at else None,
                    'resolved_at': alert.resolved_at.isoformat() if alert.resolved_at else None,
                    'updated_by': request.user.id,
                }
            )
        except Exception as e:
            print(f"WebSocket broadcast error: {e}")

        # Tell the frontend what the next possible action will be (for button label)
        next_action = self.ACTION_LABELS.get(alert.status)

        return Response({
            'success': True,
            'emergencyId': alert.id,
            'status': alert.status,
            'nextAction': next_action,  # e.g. "Mark In Progress", or None if resolved
            'message': f'Emergency status updated to {alert.status}',
        })


# Keep the old route as an alias so existing URL configs don't break
class ResolveEmergencyView(AdvanceEmergencyStatusView):
    """
    POST /api/v1/emergency/<id>/resolve/
    Deprecated alias — kept for backwards compatibility.
    Prefer /advance/ for new integrations.
    """
    pass
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


# apps/emergency/views.py - Update SendEmergencyAlertView
class SendEmergencyAlertView(APIView):
    """POST /api/v1/emergency/alert/"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        emergency_type = request.data.get('emergencyType')
        emergency_type_name = request.data.get('emergencyTypeName')

        # Get data from frontend
        room_number = request.data.get('roomNumber', '')
        guest_name = request.data.get('guestName', '')

        # Get user's current booking
        today = timezone.now().date()
        booking = Booking.objects.filter(
            user=request.user,
            status__in=['CONFIRMED', 'CHECKED_IN'],
            check_in_date__lte=today,
            check_out_date__gte=today
        ).first()

        # DEBUG: Print to console to see what's happening
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

        # 🔑 Get room number from booking if not provided or if it's 'Not assigned'
        if booking and booking.room and booking.room.room_number:
            room_number = booking.room.room_number
            print(f"Using room from booking: {room_number}")
        elif not room_number or room_number == 'Not assigned':
            room_number = 'Unknown'
            print(f"No valid room found, using: {room_number}")

        # Also try to get guest name from booking if not provided
        if not guest_name and booking and booking.user:
            guest_name = booking.user.get_full_name() or booking.user.username

        # Ensure room_number is not too long
        if room_number and len(room_number) > 50:
            room_number = room_number[:50]

        # Get guest phone from guest information if available
        guest_phone = None
        if booking and booking.guest_information:
            guest_phone = booking.guest_information.contact_number
        elif hasattr(request.user, 'guest_information'):
            guest_phone = request.user.guest_information.contact_number

        # Create emergency alert
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

        # Broadcast to WebSocket
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
            'room_number': alert.room_number  # Return to frontend
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
        # Allow all staff roles to view emergencies
        allowed_roles = ['ADMIN', 'RECEPTIONIST', 'HOUSEKEEPER', 'MAINTENANCE', 'SECURITY', 'STAFF', 'MANAGEMENT',
                         'FRONT_DESK']

        if not (request.user.is_staff or request.user.role in allowed_roles):
            return Response({'error': 'Unauthorized'}, status=403)

        alerts = EmergencyAlert.objects.all()
        active = alerts.filter(status='ACTIVE')

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


class ResolveEmergencyView(APIView):
    """POST /api/v1/emergency/<id>/resolve/"""
    permission_classes = [IsAuthenticated]

    def post(self, request, emergency_id):
        # Allow all staff roles to resolve emergencies
        allowed_roles = ['ADMIN', 'RECEPTIONIST', 'HOUSEKEEPER', 'MAINTENANCE', 'SECURITY', 'STAFF', 'MANAGEMENT',
                         'FRONT_DESK']

        if not (request.user.is_staff or request.user.role in allowed_roles):
            return Response({'error': 'Unauthorized'}, status=403)

        try:
            alert = EmergencyAlert.objects.get(id=emergency_id)
            alert.status = 'RESOLVED'
            alert.resolved_at = timezone.now()
            alert.resolved_by = request.user
            alert.save()

            # Broadcast resolution to WebSocket
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                'emergency_alerts',
                {
                    'type': 'emergency_resolved',
                    'emergency_id': alert.id,
                    'resolved_by': request.user.username,
                    'resolved_at': alert.resolved_at.isoformat(),
                }
            )

            return Response({
                'success': True,
                'message': 'Emergency marked as resolved'
            })

        except EmergencyAlert.DoesNotExist:
            return Response({'error': 'Emergency not found'}, status=404)
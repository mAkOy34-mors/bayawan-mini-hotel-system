# apps/emergency/consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from django.utils import timezone
from urllib.parse import parse_qs
import jwt
from django.conf import settings
from rest_framework_simplejwt.tokens import AccessToken

User = get_user_model()


class EmergencyConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for real-time emergency alerts"""

    async def connect(self):
        print("=" * 50)
        print("WebSocket connection attempt")

        # Get token from query string
        query_string = self.scope['query_string'].decode()
        query_params = parse_qs(query_string)
        token = query_params.get('token', [None])[0]

        print(f"Token present: {bool(token)}")

        if token:
            user = await self.get_user_from_token(token)
            if user:
                print(f"User found: {user.email}, Role: {getattr(user, 'role', 'None')}, is_staff: {user.is_staff}")
                self.user = user
                self.room_group_name = 'emergency_alerts'

                await self.channel_layer.group_add(
                    self.room_group_name,
                    self.channel_name
                )
                await self.accept()
                print("WebSocket ACCEPTED")

                # Send active emergencies
                await self.send_active_emergencies()
                return

        print("WebSocket REJECTED - No valid user")
        await self.close()

    @database_sync_to_async
    def get_user_from_token(self, token):
        """Get user from JWT token"""
        from rest_framework_simplejwt.tokens import AccessToken
        from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

        if not token:
            return None

        try:
            access_token = AccessToken(token)
            user_id = access_token['user_id']
            return User.objects.get(id=user_id)
        except (InvalidToken, TokenError, User.DoesNotExist) as e:
            print(f"Token error: {e}")
            return None

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )
        print(f"WebSocket disconnected: {close_code}")

    async def receive(self, text_data):
        """Handle incoming WebSocket messages"""
        print(f"WebSocket message received: {text_data}")

        try:
            data = json.loads(text_data)
            message_type = data.get('type')

            # Route to appropriate handler
            if message_type == 'emergency_status_updated':
                await self.handle_emergency_status_updated(data)
            elif message_type == 'ping':
                await self.send(text_data=json.dumps({'type': 'pong'}))
            else:
                print(f"Unknown message type: {message_type}")
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'message': f'Unknown message type: {message_type}'
                }))

        except json.JSONDecodeError as e:
            print(f"Invalid JSON: {e}")
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': f'Invalid JSON: {str(e)}'
            }))
        except Exception as e:
            print(f"Error processing message: {e}")
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': f'Server error: {str(e)}'
            }))

    async def handle_emergency_status_updated(self, data):
        """Handle emergency status update messages from client"""
        print(f"Handling status update: {data}")

        emergency_id = data.get('emergency_id')
        new_status = data.get('status')

        if not emergency_id or not new_status:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Missing emergency_id or status'
            }))
            return

        # Update the emergency status
        updated_emergency = await self.update_emergency_status(
            emergency_id,
            new_status,
            self.user.id if hasattr(self, 'user') else None
        )

        if updated_emergency:
            # Broadcast to all connected clients
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'emergency_broadcast',
                    'emergency_id': emergency_id,
                    'status': new_status,
                    'accepted_at': updated_emergency.get('accepted_at'),
                    'in_progress_at': updated_emergency.get('in_progress_at'),
                    'resolved_at': updated_emergency.get('resolved_at'),
                    'updated_by': self.user.id if hasattr(self, 'user') else None
                }
            )

            # Send success response to the sender
            await self.send(text_data=json.dumps({
                'type': 'emergency_status_updated_success',
                'emergency_id': emergency_id,
                'status': new_status,
                'message': f'Emergency status updated to {new_status}'
            }))
        else:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': f'Emergency alert with id {emergency_id} not found or invalid transition'
            }))

    @database_sync_to_async
    def update_emergency_status(self, emergency_id, new_status, user_id):
        """Update emergency status in database"""
        from .models import EmergencyAlert

        try:
            emergency = EmergencyAlert.objects.get(id=emergency_id)

            # Check if status transition is valid
            if emergency.status == new_status:
                # Same status, no change needed
                return {
                    'id': emergency.id,
                    'status': emergency.status,
                    'accepted_at': emergency.accepted_at.isoformat() if emergency.accepted_at else None,
                    'in_progress_at': emergency.in_progress_at.isoformat() if emergency.in_progress_at else None,
                    'resolved_at': emergency.resolved_at.isoformat() if emergency.resolved_at else None,
                }

            # Validate transition based on Django model's VALID_TRANSITIONS
            valid_next = emergency.VALID_TRANSITIONS.get(emergency.status)
            if valid_next and valid_next != new_status:
                print(f"Invalid transition: {emergency.status} -> {new_status}")
                return None

            # Update status and timestamps
            emergency.status = new_status

            # Update timestamp fields based on new status
            if new_status == 'ACCEPTED' and not emergency.accepted_at:
                emergency.accepted_at = timezone.now()
                if user_id:
                    try:
                        from django.contrib.auth import get_user_model
                        User = get_user_model()
                        emergency.accepted_by = User.objects.get(id=user_id)
                    except User.DoesNotExist:
                        pass
            elif new_status == 'IN_PROGRESS' and not emergency.in_progress_at:
                emergency.in_progress_at = timezone.now()
            elif new_status == 'RESOLVED' and not emergency.resolved_at:
                emergency.resolved_at = timezone.now()
                if user_id:
                    try:
                        from django.contrib.auth import get_user_model
                        User = get_user_model()
                        emergency.resolved_by = User.objects.get(id=user_id)
                    except User.DoesNotExist:
                        pass

            emergency.save()

            return {
                'id': emergency.id,
                'status': emergency.status,
                'accepted_at': emergency.accepted_at.isoformat() if emergency.accepted_at else None,
                'in_progress_at': emergency.in_progress_at.isoformat() if emergency.in_progress_at else None,
                'resolved_at': emergency.resolved_at.isoformat() if emergency.resolved_at else None,
            }

        except EmergencyAlert.DoesNotExist:
            print(f"Emergency alert {emergency_id} not found")
            return None
        except Exception as e:
            print(f"Error updating emergency status: {e}")
            return None

    async def emergency_broadcast(self, event):
        """Broadcast emergency updates to all connected clients"""
        await self.send(text_data=json.dumps({
            'type': 'EMERGENCY_STATUS_UPDATED',
            'emergency_id': event['emergency_id'],
            'status': event['status'],
            'accepted_at': event.get('accepted_at'),
            'in_progress_at': event.get('in_progress_at'),
            'resolved_at': event.get('resolved_at'),
            'updated_by': event.get('updated_by')
        }))

    async def send_active_emergencies(self):
        emergencies = await self.get_active_emergencies()
        await self.send(text_data=json.dumps({
            'type': 'ACTIVE_EMERGENCIES',
            'emergencies': emergencies
        }))

    @database_sync_to_async
    def get_active_emergencies(self):
        from .models import EmergencyAlert
        alerts = EmergencyAlert.objects.filter(status='ACTIVE')
        return [{
            'id': alert.id,
            'emergencyType': alert.emergency_type,
            'emergencyTypeName': alert.emergency_type_name,
            'guestName': alert.guest_name,
            'roomNumber': alert.room_number,
            'guestPhone': alert.guest_phone or '',
            'status': alert.status,
            'createdAt': alert.created_at.isoformat(),
        } for alert in alerts]

    async def new_emergency(self, event):
        await self.send(text_data=json.dumps({
            'type': 'NEW_EMERGENCY',
            'id': event['emergency_id'],
            'emergencyType': event['emergency_type'],
            'emergencyTypeName': event['emergency_type_name'],
            'guestName': event['guest_name'],
            'roomNumber': event['room_number'],
            'guestPhone': event.get('guest_phone', ''),
            'createdAt': event['created_at'],
        }))

    async def emergency_resolved(self, event):
        await self.send(text_data=json.dumps({
            'type': 'EMERGENCY_RESOLVED',
            'emergency_id': event['emergency_id'],   # consistent snake_case
            'status': 'RESOLVED',
            'resolvedBy': event.get('resolved_by'),
            'resolvedAt': event.get('resolved_at'),
        }))


class StaffConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for staff real-time updates"""

    async def connect(self):
        # Get token from query string
        query_string = self.scope['query_string'].decode()
        query_params = parse_qs(query_string)
        token = query_params.get('token', [None])[0]

        # Authenticate user
        user = await self.get_user_from_token(token)

        if user and user.role == 'STAFF':
            self.user = user
            self.room_group_name = f'staff_{user.id}'

            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )
            await self.accept()
            print(f"Staff WebSocket connected: {user.username}")
        else:
            await self.close()

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )
        print(f"Staff WebSocket disconnected: {close_code}")

    async def receive(self, text_data):
        """Handle incoming WebSocket messages for staff"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')

            if message_type == 'emergency_status_updated':
                # Forward to emergency consumer logic or handle here
                print(f"Staff received status update: {data}")
                # You can add staff-specific handling here
            else:
                print(f"Unknown staff message type: {message_type}")

        except json.JSONDecodeError as e:
            print(f"Invalid JSON in staff consumer: {e}")

    async def new_task(self, event):
        """Send new task notification to staff"""
        await self.send(text_data=json.dumps({
            'type': 'NEW_TASK',
            'task_id': event['task_id'],
            'task_title': event['task_title'],
            'room_number': event['room_number'],
        }))

    async def task_updated(self, event):
        """Send task update notification"""
        await self.send(text_data=json.dumps({
            'type': 'TASK_UPDATED',
            'task_id': event['task_id'],
            'status': event['status'],
        }))

    @database_sync_to_async
    def get_user_from_token(self, token):
        """Get user from JWT token"""
        from django.contrib.auth import get_user_model
        User = get_user_model()

        if not token:
            return None

        try:
            access_token = AccessToken(token)
            user_id = access_token['user_id']
            return User.objects.get(id=user_id)
        except Exception:
            return None
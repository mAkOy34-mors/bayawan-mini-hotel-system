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
        print(f"WebSocket message received: {text_data}")
        # Handle messages if needed

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
            'emergencyId': event['emergency_id'],
            'resolvedBy': event['resolved_by'],
            'resolvedAt': event['resolved_at'],
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
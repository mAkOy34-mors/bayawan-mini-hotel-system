# apps/housekeepers/views.py
import logging
from datetime import datetime, timedelta
from django.core.cache import cache
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from django.db.models import Q, Count, Avg

from .models import Housekeeper, CleaningTask, CleaningChecklist, SupplyRequest, RoomStatusLog
from .serializers import (
    HousekeeperSerializer, CleaningTaskSerializer,
    CleaningChecklistSerializer, SupplyRequestSerializer, RoomStatusLogSerializer
)
from apps.rooms.models import Room
from apps.bookings.models import Booking
from apps.users.models import User
from apps.employees.models import EmployeeInformation

logger = logging.getLogger(__name__)


def is_admin_or_receptionist(user):
    return user.is_authenticated and getattr(user, 'role', '') in ['ADMIN', 'RECEPTIONIST']


def is_housekeeper(user):
    return user.is_authenticated and getattr(user, 'role', '') == 'HOUSEKEEPER'


def admin_only(view_func):
    def wrapper(self, request, *args, **kwargs):
        if not is_admin_or_receptionist(request.user):
            return Response(
                {"error": "Forbidden. Admin or Receptionist access required."},
                status=403,
            )
        return view_func(self, request, *args, **kwargs)

    return wrapper


# ── Housekeeper Management ──────────────────────────────────────────────

class HousekeeperListView(APIView):
    """GET /api/v1/housekeepers/ - Get all housekeepers"""

    @admin_only
    def get(self, request):
        cache_key = "housekeepers_all"
        cached = cache.get(cache_key)
        if cached:
            return Response(cached)

        housekeepers = Housekeeper.objects.all().order_by('-created_at')
        serializer = HousekeeperSerializer(housekeepers, many=True)

        cache.set(cache_key, serializer.data, timeout=60)
        return Response(serializer.data)


class HousekeeperDetailView(APIView):
    """GET /api/v1/housekeepers/<id>/ - Get housekeeper details"""

    @admin_only
    def get(self, request, housekeeper_id):
        cache_key = f"housekeeper_{housekeeper_id}"
        cached = cache.get(cache_key)
        if cached:
            return Response(cached)

        try:
            housekeeper = Housekeeper.objects.get(id=housekeeper_id)
        except Housekeeper.DoesNotExist:
            return Response({"error": "Housekeeper not found"}, status=404)

        serializer = HousekeeperSerializer(housekeeper)
        cache.set(cache_key, serializer.data, timeout=60)
        return Response(serializer.data)


class HousekeeperCreateView(APIView):
    """POST /api/v1/housekeepers/create/ - Create a new housekeeper"""

    @admin_only
    @transaction.atomic
    def post(self, request):
        first_name = request.data.get('firstName')
        last_name = request.data.get('lastName')
        email = request.data.get('email')
        phone_number = request.data.get('phoneNumber')
        hire_date = request.data.get('hireDate')
        shift = request.data.get('shift', 'MORNING')

        # Validation
        if not first_name or not last_name or not email:
            return Response(
                {"error": "First name, last name, and email are required"},
                status=400
            )

        # Check if user already exists
        user = None
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Create new user
            username = email.split('@')[0]
            base_username = username
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f"{base_username}{counter}"
                counter += 1

            user = User.objects.create_user(
                username=username,
                email=email,
                password=request.data.get('password', 'housekeeper123'),
                role='HOUSEKEEPER',
            )

        # Generate employee ID
        employee_id = f"HK{user.id:06d}"

        # Create housekeeper
        housekeeper = Housekeeper.objects.create(
            user=user,
            first_name=first_name,
            last_name=last_name,
            employee_id=employee_id,
            phone_number=phone_number,
            email=email,
            hire_date=hire_date or timezone.now().date(),
            shift=shift,
            skills=request.data.get('skills', ''),
            specialization=request.data.get('specialization', ''),
        )

        # Also create employee_information record
        EmployeeInformation.objects.get_or_create(
            user=user,
            defaults={
                'first_name': first_name,
                'last_name': last_name,
                'contact_number': phone_number,
                'employee_id': employee_id,
                'position': 'HOUSEKEEPER',
                'hire_date': hire_date or timezone.now().date(),
                'home_address': '',
                'date_of_birth': '2000-01-01',
            }
        )

        # Clear cache
        cache.delete("housekeepers_all")

        serializer = HousekeeperSerializer(housekeeper)
        return Response(serializer.data, status=201)


class HousekeeperUpdateView(APIView):
    """PUT /api/v1/housekeepers/<id>/update/ - Update housekeeper"""

    @admin_only
    @transaction.atomic
    def put(self, request, housekeeper_id):
        try:
            housekeeper = Housekeeper.objects.get(id=housekeeper_id)
        except Housekeeper.DoesNotExist:
            return Response({"error": "Housekeeper not found"}, status=404)

        # Update fields
        housekeeper.first_name = request.data.get('firstName', housekeeper.first_name)
        housekeeper.last_name = request.data.get('lastName', housekeeper.last_name)
        housekeeper.phone_number = request.data.get('phoneNumber', housekeeper.phone_number)
        housekeeper.email = request.data.get('email', housekeeper.email)
        housekeeper.shift = request.data.get('shift', housekeeper.shift)
        housekeeper.status = request.data.get('status', housekeeper.status)
        housekeeper.skills = request.data.get('skills', housekeeper.skills)
        housekeeper.specialization = request.data.get('specialization', housekeeper.specialization)
        housekeeper.save()

        # Update user email if changed
        if request.data.get('email') and housekeeper.user.email != request.data.get('email'):
            housekeeper.user.email = request.data.get('email')
            housekeeper.user.save()

        # Update employee_information
        try:
            employee = EmployeeInformation.objects.get(user=housekeeper.user)
            employee.first_name = housekeeper.first_name
            employee.last_name = housekeeper.last_name
            employee.contact_number = housekeeper.phone_number
            employee.email = housekeeper.email
            employee.position = 'HOUSEKEEPER'
            employee.save()
        except EmployeeInformation.DoesNotExist:
            pass

        # Clear cache
        cache.delete("housekeepers_all")
        cache.delete(f"housekeeper_{housekeeper_id}")

        serializer = HousekeeperSerializer(housekeeper)
        return Response(serializer.data)


class HousekeeperDeleteView(APIView):
    """DELETE /api/v1/housekeepers/<id>/delete/ - Delete housekeeper"""

    @admin_only
    @transaction.atomic
    def delete(self, request, housekeeper_id):
        try:
            housekeeper = Housekeeper.objects.get(id=housekeeper_id)
        except Housekeeper.DoesNotExist:
            return Response({"error": "Housekeeper not found"}, status=404)

        user = housekeeper.user
        housekeeper.delete()

        # Optionally delete user account
        if request.data.get('deleteUser', False):
            user.delete()

        # Clear cache
        cache.delete("housekeepers_all")
        cache.delete(f"housekeeper_{housekeeper_id}")

        return Response({"message": "Housekeeper deleted successfully"})


class HousekeeperToggleStatusView(APIView):
    """PATCH /api/v1/housekeepers/<id>/toggle-status/ - Toggle housekeeper status"""

    @admin_only
    def patch(self, request, housekeeper_id):
        try:
            housekeeper = Housekeeper.objects.get(id=housekeeper_id)
        except Housekeeper.DoesNotExist:
            return Response({"error": "Housekeeper not found"}, status=404)

        new_status = request.data.get('status')
        if new_status:
            housekeeper.status = new_status
            housekeeper.save()

        # Clear cache
        cache.delete("housekeepers_all")
        cache.delete(f"housekeeper_{housekeeper_id}")

        return Response({
            "message": f"Housekeeper status updated to {housekeeper.get_status_display()}",
            "status": housekeeper.status
        })


# ── My Profile (for logged-in housekeeper) ─────────────────────────────

class MyProfileView(APIView):
    """GET/PUT /api/v1/housekeepers/my-profile/ - Get/Update logged-in housekeeper's profile"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # First try to get from Housekeeper model
        try:
            housekeeper = Housekeeper.objects.get(user=request.user)
            serializer = HousekeeperSerializer(housekeeper)
            return Response(serializer.data)
        except Housekeeper.DoesNotExist:
            pass

        # Fallback to EmployeeInformation
        try:
            employee = EmployeeInformation.objects.get(user=request.user)
            return Response({
                'id': None,
                'first_name': employee.first_name,
                'last_name': employee.last_name,
                'employee_id': employee.employee_id,
                'phone_number': employee.contact_number,
                'email': employee.email,
                'shift': 'MORNING',
                'status': 'AVAILABLE',
                'skills': employee.skills,
                'specialization': employee.position,
                'tasks_completed': 0,
                'rating': 5.0,
            })
        except EmployeeInformation.DoesNotExist:
            return Response({"error": "Profile not found"}, status=404)

    def put(self, request):
        try:
            housekeeper = Housekeeper.objects.get(user=request.user)
            housekeeper.phone_number = request.data.get('phoneNumber', housekeeper.phone_number)
            housekeeper.email = request.data.get('email', housekeeper.email)
            housekeeper.skills = request.data.get('skills', housekeeper.skills)
            housekeeper.specialization = request.data.get('specialization', housekeeper.specialization)
            housekeeper.save()
            serializer = HousekeeperSerializer(housekeeper)
            return Response(serializer.data)
        except Housekeeper.DoesNotExist:
            return Response({"error": "Housekeeper profile not found"}, status=404)


# ── Room Status Management (Role-based) ─────────────────────────────

class RoomStatusView(APIView):
    """GET /api/v1/housekeepers/room-status/ - Get all rooms with status"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_role = getattr(request.user, 'role', '')
        if user_role not in ['HOUSEKEEPER', 'ADMIN', 'RECEPTIONIST']:
            return Response({"error": "Access denied"}, status=403)

        cache_key = "room_status_all"
        cached = cache.get(cache_key)
        if cached:
            return Response(cached)

        rooms = Room.objects.all().values('id', 'room_number', 'room_type', 'status', 'available')

        result = []
        for room in rooms:
            status_display = {
                'CLEAN': 'Clean',
                'DIRTY': 'Dirty',
                'OCCUPIED': 'Occupied',
                'VACANT': 'Vacant',
                'MAINTENANCE': 'Maintenance',
            }.get(room.get('status', 'DIRTY'), 'Dirty')

            result.append({
                'id': room['id'],
                'roomNumber': room['room_number'],
                'roomType': room['room_type'],
                'status': room.get('status', 'DIRTY'),
                'statusDisplay': status_display,
                'available': room['available'],
                'lastCleaned': None,  # You can populate this if needed
            })

        cache.set(cache_key, result, timeout=30)
        return Response(result)

class UpdateRoomStatusView(APIView):
    """PATCH /api/v1/housekeepers/rooms/<room_id>/status/ - Update room status"""
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def patch(self, request, room_id):
        user_role = getattr(request.user, 'role', '')
        if user_role not in ['HOUSEKEEPER', 'ADMIN', 'RECEPTIONIST']:
            return Response({"error": "Access denied"}, status=403)

        try:
            room = Room.objects.get(id=room_id)
        except Room.DoesNotExist:
            return Response({"error": "Room not found"}, status=404)

        new_status = request.data.get('status')
        if not new_status:
            return Response({"error": "Status is required"}, status=400)

        previous_status = getattr(room, 'status', 'DIRTY')

        if hasattr(room, 'status'):
            room.status = new_status
            room.save()

        # Get performer name
        performer_name = None
        try:
            employee = EmployeeInformation.objects.get(user=request.user)
            performer_name = f"{employee.first_name} {employee.last_name}"
        except EmployeeInformation.DoesNotExist:
            performer_name = request.user.username

        RoomStatusLog.objects.create(
            room=room,
            previous_status=previous_status,
            new_status=new_status,
            action=RoomStatusLog.Action.CLEANED if new_status == 'CLEAN' else
            RoomStatusLog.Action.DIRTY if new_status == 'DIRTY' else
            RoomStatusLog.Action.MAINTENANCE if new_status == 'MAINTENANCE' else
            RoomStatusLog.Action.INSPECTED,
            performed_by=None,
            notes=f"Updated by {performer_name}: {request.data.get('notes', '')}"
        )

        cache.delete("room_status_all")

        return Response({
            'id': room.id,
            'roomNumber': room.room_number,
            'status': new_status,
            'message': 'Room status updated successfully'
        })


class RoomStatusHistoryView(APIView):
    """GET /api/v1/housekeepers/rooms/<room_id>/history/ - Get room status history"""
    permission_classes = [IsAuthenticated]

    def get(self, request, room_id):
        user_role = getattr(request.user, 'role', '')
        if user_role not in ['HOUSEKEEPER', 'ADMIN', 'RECEPTIONIST']:
            return Response({"error": "Access denied"}, status=403)

        cache_key = f"room_status_history_{room_id}"
        cached = cache.get(cache_key)
        if cached:
            return Response(cached)

        logs = RoomStatusLog.objects.filter(room_id=room_id).order_by('-created_at')
        serializer = RoomStatusLogSerializer(logs, many=True)

        cache.set(cache_key, serializer.data, timeout=60)
        return Response(serializer.data)


# ── Room Management for Housekeepers (Role-based) ────────────

# apps/housekeepers/views.py - Update HousekeeperRoomListView
class HousekeeperRoomListView(APIView):
    """GET /api/v1/housekeepers/rooms/ - Get all rooms for housekeeping"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_role = getattr(request.user, 'role', '')
        logger.info(f"User: {request.user.email}, Role: {user_role}")

        if user_role not in ['HOUSEKEEPER', 'ADMIN', 'RECEPTIONIST']:
            return Response({"error": "Access denied"}, status=403)

        cache_key = "housekeeper_rooms_all"
        cached = cache.get(cache_key)
        if cached:
            return Response(cached)

        rooms = Room.objects.all().order_by('room_number')

        rooms_data = []
        for room in rooms:
            # Create a mapping for room type display without using get_room_type_display
            room_type_display = {
                'STANDARD': 'Standard',
                'DELUXE': 'Deluxe',
                'SUITE': 'Suite',
                'PRESIDENTIAL': 'Presidential',
                'VILLA': 'Villa',
            }.get(room.room_type, room.room_type)

            # Create a mapping for status display
            status_display = {
                'CLEAN': 'Clean',
                'DIRTY': 'Dirty',
                'OCCUPIED': 'Occupied',
                'VACANT': 'Vacant',
                'MAINTENANCE': 'Maintenance',
            }.get(getattr(room, 'status', 'DIRTY'), 'Dirty')

            rooms_data.append({
                'id': room.id,
                'roomNumber': room.room_number,
                'roomType': room.room_type,
                'roomTypeDisplay': room_type_display,
                'description': room.description,
                'pricePerNight': float(room.price_per_night),
                'maxOccupancy': room.max_occupancy,
                'available': room.available,
                'amenities': room.amenities,
                'imageUrl': room.image_url,
                'status': getattr(room, 'status', 'DIRTY'),
                'statusDisplay': status_display,
            })

        cache.set(cache_key, rooms_data, timeout=60)
        return Response(rooms_data)

class HousekeeperRoomDetailView(APIView):
    """GET /api/v1/housekeepers/rooms/<room_id>/ - Get room details"""
    permission_classes = [IsAuthenticated]

    def get(self, request, room_id):
        user_role = getattr(request.user, 'role', '')
        if user_role not in ['HOUSEKEEPER', 'ADMIN', 'RECEPTIONIST']:
            return Response({"error": "Access denied"}, status=403)

        cache_key = f"housekeeper_room_{room_id}"
        cached = cache.get(cache_key)
        if cached:
            return Response(cached)

        try:
            room = Room.objects.get(id=room_id)
        except Room.DoesNotExist:
            return Response({"error": "Room not found"}, status=404)

        room_type_display = {
            'STANDARD': 'Standard',
            'DELUXE': 'Deluxe',
            'SUITE': 'Suite',
            'PRESIDENTIAL': 'Presidential',
            'VILLA': 'Villa',
        }.get(room.room_type, room.room_type)

        status_display = {
            'CLEAN': 'Clean',
            'DIRTY': 'Dirty',
            'OCCUPIED': 'Occupied',
            'VACANT': 'Vacant',
            'MAINTENANCE': 'Maintenance',
        }.get(getattr(room, 'status', 'DIRTY'), 'Dirty')

        room_data = {
            'id': room.id,
            'roomNumber': room.room_number,
            'roomType': room.room_type,
            'roomTypeDisplay': room_type_display,
            'description': room.description,
            'pricePerNight': float(room.price_per_night),
            'maxOccupancy': room.max_occupancy,
            'available': room.available,
            'amenities': room.amenities,
            'imageUrl': room.image_url,
            'status': getattr(room, 'status', 'DIRTY'),
            'statusDisplay': status_display,
        }

        cache.set(cache_key, room_data, timeout=60)
        return Response(room_data)

class HousekeeperUpdateRoomStatusView(APIView):
    """PATCH /api/v1/housekeepers/rooms/<room_id>/status/ - Update room status"""
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def patch(self, request, room_id):
        user_role = getattr(request.user, 'role', '')
        if user_role not in ['HOUSEKEEPER', 'ADMIN', 'RECEPTIONIST']:
            return Response({"error": "Access denied"}, status=403)

        try:
            room = Room.objects.get(id=room_id)
        except Room.DoesNotExist:
            return Response({"error": "Room not found"}, status=404)

        new_status = request.data.get('status')
        if not new_status:
            return Response({"error": "Status is required"}, status=400)

        valid_statuses = ['CLEAN', 'DIRTY', 'OCCUPIED', 'VACANT', 'MAINTENANCE']
        if new_status not in valid_statuses:
            return Response({"error": f"Invalid status. Must be one of: {valid_statuses}"}, status=400)

        previous_status = getattr(room, 'status', 'DIRTY')
        room.status = new_status
        room.save()

        # Get performer name from employee_information
        performer_name = None
        try:
            employee = EmployeeInformation.objects.get(user=request.user)
            performer_name = f"{employee.first_name} {employee.last_name}"
        except EmployeeInformation.DoesNotExist:
            performer_name = request.user.username

        # Log the status change
        RoomStatusLog.objects.create(
            room=room,
            previous_status=previous_status,
            new_status=new_status,
            action=RoomStatusLog.Action.CLEANED if new_status == 'CLEAN' else
            RoomStatusLog.Action.DIRTY if new_status == 'DIRTY' else
            RoomStatusLog.Action.MAINTENANCE if new_status == 'MAINTENANCE' else
            RoomStatusLog.Action.INSPECTED,
            performed_by=None,
            notes=f"Updated by {performer_name}: {request.data.get('notes', '')}"
        )

        # Clear caches
        cache.delete("housekeeper_rooms_all")
        cache.delete(f"housekeeper_room_{room_id}")
        cache.delete("room_status_all")

        return Response({
            'id': room.id,
            'roomNumber': room.room_number,
            'status': new_status,
            'statusDisplay': dict(Room.RoomStatus.choices).get(new_status, new_status),
            'message': f'Room {room.room_number} status updated to {new_status}'
        })


class HousekeeperRoomStatusHistoryView(APIView):
    """GET /api/v1/housekeepers/rooms/<room_id>/history/ - Get room status history"""
    permission_classes = [IsAuthenticated]

    def get(self, request, room_id):
        user_role = getattr(request.user, 'role', '')
        if user_role not in ['HOUSEKEEPER', 'ADMIN', 'RECEPTIONIST']:
            return Response({"error": "Access denied"}, status=403)

        cache_key = f"housekeeper_room_history_{room_id}"
        cached = cache.get(cache_key)
        if cached:
            return Response(cached)

        logs = RoomStatusLog.objects.filter(room_id=room_id).order_by('-created_at')

        history = []
        for log in logs:
            history.append({
                'id': log.id,
                'previousStatus': log.previous_status,
                'newStatus': log.new_status,
                'action': log.action,
                'actionDisplay': log.get_action_display(),
                'performedBy': log.performed_by.full_name if log.performed_by else None,
                'notes': log.notes,
                'createdAt': log.created_at,
            })

        cache.set(cache_key, history, timeout=60)
        return Response(history)


class HousekeeperRoomStatsView(APIView):
    """GET /api/v1/housekeepers/rooms/stats/ - Get room statistics"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_role = getattr(request.user, 'role', '')
        if user_role not in ['HOUSEKEEPER', 'ADMIN', 'RECEPTIONIST']:
            return Response({"error": "Access denied"}, status=403)

        total_rooms = Room.objects.count()
        clean_rooms = Room.objects.filter(status='CLEAN').count()
        dirty_rooms = Room.objects.filter(status='DIRTY').count()
        occupied_rooms = Room.objects.filter(status='OCCUPIED').count()
        maintenance_rooms = Room.objects.filter(status='MAINTENANCE').count()

        # Get rooms cleaned by this housekeeper today (if housekeeper profile exists)
        rooms_cleaned_today = 0
        try:
            housekeeper = Housekeeper.objects.get(user=request.user)
            rooms_cleaned_today = RoomStatusLog.objects.filter(
                performed_by=housekeeper,
                action=RoomStatusLog.Action.CLEANED,
                created_at__date=timezone.now().date()
            ).count()
        except Housekeeper.DoesNotExist:
            pass

        stats = {
            'total': total_rooms,
            'clean': clean_rooms,
            'dirty': dirty_rooms,
            'occupied': occupied_rooms,
            'maintenance': maintenance_rooms,
            'roomsCleanedToday': rooms_cleaned_today,
            'completionRate': int((clean_rooms / total_rooms * 100)) if total_rooms > 0 else 0,
        }

        return Response(stats)


# ── Task Management ────────────────────────────────────────────────────

class CleaningTaskListView(APIView):
    """GET /api/v1/housekeepers/tasks/ - Get all cleaning tasks (admin only)"""

    @admin_only
    def get(self, request):
        cache_key = "cleaning_tasks_all"
        cached = cache.get(cache_key)
        if cached:
            return Response(cached)

        tasks = CleaningTask.objects.all().order_by('-priority', '-created_at')
        serializer = CleaningTaskSerializer(tasks, many=True)

        cache.set(cache_key, serializer.data, timeout=60)
        return Response(serializer.data)


class MyTasksView(APIView):
    """GET /api/v1/housekeepers/my-tasks/ - Get tasks assigned to current housekeeper"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_role = getattr(request.user, 'role', '')
        if user_role != 'HOUSEKEEPER':
            return Response({"error": "Only housekeepers can access their tasks"}, status=403)

        try:
            housekeeper = Housekeeper.objects.get(user=request.user)
        except Housekeeper.DoesNotExist:
            return Response({"error": "Housekeeper profile not found"}, status=404)

        tasks = CleaningTask.objects.filter(assigned_to=housekeeper).order_by('-priority', '-created_at')
        serializer = CleaningTaskSerializer(tasks, many=True)
        return Response(serializer.data)


class CreateCleaningTaskView(APIView):
    """POST /api/v1/housekeepers/tasks/create/ - Create a cleaning task"""

    @admin_only
    @transaction.atomic
    def post(self, request):
        title = request.data.get('title')
        description = request.data.get('description')
        task_type = request.data.get('taskType')
        room_number = request.data.get('roomNumber')
        assigned_to_id = request.data.get('assignedTo')

        if not title or not room_number:
            return Response({"error": "Title and room number are required"}, status=400)

        room = None
        try:
            room = Room.objects.get(room_number=room_number)
        except Room.DoesNotExist:
            pass

        assigned_to = None
        if assigned_to_id:
            try:
                assigned_to = Housekeeper.objects.get(id=assigned_to_id)
            except Housekeeper.DoesNotExist:
                pass

        task = CleaningTask.objects.create(
            title=title,
            description=description,
            task_type=task_type or 'ROOM_CLEANING',
            priority=request.data.get('priority', 'MEDIUM'),
            room=room,
            room_number=room_number,
            assigned_to=assigned_to,
            assigned_by=request.user,
            notes=request.data.get('notes', ''),
        )

        checklist_items = request.data.get('checklistItems', [])
        for item in checklist_items:
            CleaningChecklist.objects.create(
                task=task,
                item_name=item
            )

        cache.delete("cleaning_tasks_all")

        serializer = CleaningTaskSerializer(task)
        return Response(serializer.data, status=201)


class UpdateTaskStatusView(APIView):
    """PATCH /api/v1/housekeepers/tasks/<id>/update-status/ - Update task status"""
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def patch(self, request, task_id):
        try:
            task = CleaningTask.objects.get(id=task_id)
        except CleaningTask.DoesNotExist:
            return Response({"error": "Task not found"}, status=404)

        user_role = getattr(request.user, 'role', '')

        # Check permission
        if user_role == 'HOUSEKEEPER':
            try:
                housekeeper = Housekeeper.objects.get(user=request.user)
                if task.assigned_to and task.assigned_to.id != housekeeper.id:
                    return Response({"error": "You can only update your own tasks"}, status=403)
            except Housekeeper.DoesNotExist:
                return Response({"error": "Housekeeper profile not found"}, status=404)
        elif user_role not in ['ADMIN', 'RECEPTIONIST']:
            return Response({"error": "Permission denied"}, status=403)

        new_status = request.data.get('status')
        notes = request.data.get('notes', '')

        if not new_status:
            return Response({"error": "Status is required"}, status=400)

        task.status = new_status

        if new_status == 'IN_PROGRESS' and not task.started_at:
            task.started_at = timezone.now()
        elif new_status == 'COMPLETED':
            task.completed_at = timezone.now()
            if task.assigned_to:
                task.assigned_to.tasks_completed += 1
                task.assigned_to.save()
        elif new_status == 'VERIFIED':
            task.verified_at = timezone.now()

        if notes:
            task.notes = notes

        task.save()

        checklist_updates = request.data.get('checklist', [])
        for item in checklist_updates:
            try:
                checklist_item = CleaningChecklist.objects.get(id=item.get('id'), task=task)
                checklist_item.is_completed = item.get('isCompleted', False)
                if checklist_item.is_completed and not checklist_item.completed_at:
                    checklist_item.completed_at = timezone.now()
                checklist_item.save()
            except CleaningChecklist.DoesNotExist:
                pass

        cache.delete("cleaning_tasks_all")

        serializer = CleaningTaskSerializer(task)
        return Response(serializer.data)


class TaskChecklistView(APIView):
    """GET /api/v1/housekeepers/tasks/<id>/checklist/ - Get task checklist"""
    permission_classes = [IsAuthenticated]

    def get(self, request, task_id):
        try:
            task = CleaningTask.objects.get(id=task_id)
        except CleaningTask.DoesNotExist:
            return Response({"error": "Task not found"}, status=404)

        checklist = CleaningChecklist.objects.filter(task=task)
        serializer = CleaningChecklistSerializer(checklist, many=True)
        return Response(serializer.data)


class UpdateChecklistItemView(APIView):
    """PATCH /api/v1/housekeepers/checklist/<id>/ - Update checklist item"""
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def patch(self, request, item_id):
        try:
            checklist_item = CleaningChecklist.objects.get(id=item_id)
        except CleaningChecklist.DoesNotExist:
            return Response({"error": "Checklist item not found"}, status=404)

        is_completed = request.data.get('isCompleted')
        if is_completed is not None:
            checklist_item.is_completed = is_completed
            if is_completed and not checklist_item.completed_at:
                checklist_item.completed_at = timezone.now()
            checklist_item.save()

        serializer = CleaningChecklistSerializer(checklist_item)
        return Response(serializer.data)


# ── Reports ────────────────────────────────────────────────────────────

class MyReportView(APIView):
    """GET /api/v1/housekeepers/report/ - Get performance report for current housekeeper"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        period = request.query_params.get('period', 'daily')
        user_role = getattr(request.user, 'role', '')

        if user_role != 'HOUSEKEEPER':
            return Response({"error": "Only housekeepers can access their reports"}, status=403)

        try:
            housekeeper = Housekeeper.objects.get(user=request.user)
        except Housekeeper.DoesNotExist:
            return Response({"error": "Housekeeper profile not found"}, status=404)

        today = timezone.now().date()
        if period == 'daily':
            start_date = today
        elif period == 'weekly':
            start_date = today - timedelta(days=7)
        else:
            start_date = today - timedelta(days=30)

        tasks = CleaningTask.objects.filter(
            assigned_to=housekeeper,
            created_at__date__gte=start_date
        )

        completed_tasks = tasks.filter(status='COMPLETED')
        in_progress_tasks = tasks.filter(status='IN_PROGRESS')
        pending_tasks = tasks.filter(status='PENDING')

        avg_time = 0
        completed_with_time = [t for t in completed_tasks if t.started_at and t.completed_at]
        if completed_with_time:
            total_minutes = sum((t.completed_at - t.started_at).total_seconds() / 60 for t in completed_with_time)
            avg_time = int(total_minutes / len(completed_with_time))

        rooms_cleaned = RoomStatusLog.objects.filter(
            performed_by=housekeeper,
            action=RoomStatusLog.Action.CLEANED,
            created_at__date__gte=start_date
        ).count()

        report = {
            'period': period,
            'tasks_completed': completed_tasks.count(),
            'tasks_in_progress': in_progress_tasks.count(),
            'tasks_pending': pending_tasks.count(),
            'completion_rate': int((completed_tasks.count() / tasks.count() * 100)) if tasks.count() > 0 else 0,
            'rooms_cleaned': rooms_cleaned,
            'avg_time_per_task': avg_time,
            'rating': float(housekeeper.rating),
            'shift': housekeeper.get_shift_display(),
            'status': housekeeper.get_status_display(),
        }

        return Response(report)


class TaskHistoryView(APIView):
    """GET /api/v1/housekeepers/task-history/ - Get task history for current housekeeper"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_role = getattr(request.user, 'role', '')
        if user_role != 'HOUSEKEEPER':
            return Response({"error": "Only housekeepers can access their task history"}, status=403)

        try:
            housekeeper = Housekeeper.objects.get(user=request.user)
        except Housekeeper.DoesNotExist:
            return Response({"error": "Housekeeper profile not found"}, status=404)

        tasks = CleaningTask.objects.filter(assigned_to=housekeeper).order_by('-completed_at', '-created_at')
        serializer = CleaningTaskSerializer(tasks, many=True)
        return Response(serializer.data)


# ── Stats Dashboard ────────────────────────────────────────────────────

class HousekeeperStatsView(APIView):
    """GET /api/v1/housekeepers/stats/ - Get housekeeper statistics"""

    @admin_only
    def get(self, request):
        stats = {
            'total': Housekeeper.objects.count(),
            'available': Housekeeper.objects.filter(status='AVAILABLE').count(),
            'on_duty': Housekeeper.objects.filter(status='ON_DUTY').count(),
            'on_break': Housekeeper.objects.filter(status='ON_BREAK').count(),
            'off_duty': Housekeeper.objects.filter(status='OFF_DUTY').count(),
            'tasks_pending': CleaningTask.objects.filter(status='PENDING').count(),
            'tasks_in_progress': CleaningTask.objects.filter(status='IN_PROGRESS').count(),
            'tasks_completed_today': CleaningTask.objects.filter(
                completed_at__date=timezone.now().date()
            ).count(),
        }
        return Response(stats)


class MyStatsView(APIView):
    """GET /api/v1/housekeepers/my-stats/ - Get statistics for current housekeeper"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_role = getattr(request.user, 'role', '')
        if user_role != 'HOUSEKEEPER':
            return Response({"error": "Only housekeepers can access their stats"}, status=403)

        try:
            housekeeper = Housekeeper.objects.get(user=request.user)
        except Housekeeper.DoesNotExist:
            return Response({"error": "Housekeeper profile not found"}, status=404)

        tasks = CleaningTask.objects.filter(assigned_to=housekeeper)

        completed = tasks.filter(status='COMPLETED').count()
        in_progress = tasks.filter(status='IN_PROGRESS').count()
        pending = tasks.filter(status='PENDING').count()

        total = tasks.count()
        completion_rate = int((completed / total * 100)) if total > 0 else 0

        rooms_cleaned_today = RoomStatusLog.objects.filter(
            performed_by=housekeeper,
            action=RoomStatusLog.Action.CLEANED,
            created_at__date=timezone.now().date()
        ).count()

        stats = {
            'completed': completed,
            'in_progress': in_progress,
            'pending': pending,
            'completion_rate': completion_rate,
            'rooms_cleaned': rooms_cleaned_today,
            'rating': float(housekeeper.rating),
            'shift': housekeeper.get_shift_display(),
            'status': housekeeper.get_status_display(),
        }

        return Response(stats)


# ── Supply Requests ────────────────────────────────────────────────────

class SupplyRequestListView(APIView):
    """GET /api/v1/housekeepers/supply-requests/ - Get all supply requests"""

    @admin_only
    def get(self, request):
        cache_key = "supply_requests_all"
        cached = cache.get(cache_key)
        if cached:
            return Response(cached)

        requests = SupplyRequest.objects.all().order_by('-created_at')
        serializer = SupplyRequestSerializer(requests, many=True)

        cache.set(cache_key, serializer.data, timeout=60)
        return Response(serializer.data)


class CreateSupplyRequestView(APIView):
    """POST /api/v1/housekeepers/supply-requests/create/ - Create supply request"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user_role = getattr(request.user, 'role', '')
        if user_role != 'HOUSEKEEPER':
            return Response({"error": "Only housekeepers can create supply requests"}, status=403)

        try:
            housekeeper = Housekeeper.objects.get(user=request.user)
        except Housekeeper.DoesNotExist:
            return Response({"error": "Housekeeper profile not found"}, status=404)

        item_name = request.data.get('itemName')
        quantity = request.data.get('quantity')
        reason = request.data.get('reason')

        if not item_name or not quantity or not reason:
            return Response({"error": "Item name, quantity, and reason are required"}, status=400)

        supply_request = SupplyRequest.objects.create(
            housekeeper=housekeeper,
            item_name=item_name,
            quantity=quantity,
            reason=reason
        )

        cache.delete("supply_requests_all")

        serializer = SupplyRequestSerializer(supply_request)
        return Response(serializer.data, status=201)


class UpdateSupplyRequestStatusView(APIView):
    """PATCH /api/v1/housekeepers/supply-requests/<id>/update/ - Update supply request status"""

    @admin_only
    def patch(self, request, request_id):
        try:
            supply_request = SupplyRequest.objects.get(id=request_id)
        except SupplyRequest.DoesNotExist:
            return Response({"error": "Supply request not found"}, status=404)

        new_status = request.data.get('status')
        if new_status:
            supply_request.status = new_status
            if new_status == 'APPROVED' or new_status == 'REJECTED':
                supply_request.approved_by = request.user
            elif new_status == 'FULFILLED':
                supply_request.fulfilled_at = timezone.now()
            supply_request.save()

        cache.delete("supply_requests_all")

        serializer = SupplyRequestSerializer(supply_request)
        return Response(serializer.data)
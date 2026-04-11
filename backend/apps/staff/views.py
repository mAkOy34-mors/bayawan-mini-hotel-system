# apps/staff/views.py
import logging
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

from .models import Task, TaskHistory, StaffProfile
from .serializers import TaskSerializer, TaskHistorySerializer, StaffProfileSerializer, CreateTaskSerializer
from apps.rooms.models import Room
from apps.bookings.models import Booking

logger = logging.getLogger(__name__)


class StaffTaskListView(APIView):
    """GET /api/v1/staff/tasks/ - Get tasks assigned to current staff member"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Only staff members can access
        if request.user.role != 'STAFF':
            return Response({'error': 'Access denied. Staff only.'}, status=403)

        tasks = Task.objects.filter(assigned_to=request.user)
        serializer = TaskSerializer(tasks, many=True)
        return Response(serializer.data)


class AllTasksView(APIView):
    """GET /api/v1/staff/all-tasks/ - Get all tasks (for admins/receptionists)"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Only admin or receptionist can access
        if request.user.role not in ['ADMIN', 'RECEPTIONIST']:
            return Response({'error': 'Access denied'}, status=403)

        tasks = Task.objects.all().order_by('-priority', '-created_at')
        serializer = TaskSerializer(tasks, many=True)
        return Response(serializer.data)


class CreateTaskView(APIView):
    """POST /api/v1/staff/tasks/create/ - Create a new task"""
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        # Only admin or receptionist can create tasks
        if request.user.role not in ['ADMIN', 'RECEPTIONIST']:
            return Response({'error': 'Access denied'}, status=403)

        serializer = CreateTaskSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({'errors': serializer.errors}, status=400)

        data = serializer.validated_data

        # Get room number from room object or direct input
        room_number = data.get('room_number', '')
        if data.get('room'):
            try:
                room = Room.objects.get(id=data['room'].id)
                room_number = room.room_number
            except Room.DoesNotExist:
                pass

        task = Task.objects.create(
            title=data['title'],
            description=data['description'],
            task_type=data['task_type'],
            priority=data.get('priority', 'MEDIUM'),
            room=data.get('room'),
            room_number=room_number,
            assigned_to=data.get('assigned_to'),
            assigned_by=request.user,
            note=data.get('note', '')
        )

        # Create history record
        TaskHistory.objects.create(
            task=task,
            previous_status='',
            new_status='PENDING',
            changed_by=request.user,
            note=f"Task created by {request.user.username}"
        )

        # Send WebSocket notification to assigned staff
        if task.assigned_to:
            try:
                channel_layer = get_channel_layer()
                async_to_sync(channel_layer.group_send)(
                    f'staff_{task.assigned_to.id}',
                    {
                        'type': 'new_task',
                        'task_id': task.id,
                        'task_title': task.title,
                        'room_number': task.room_number,
                    }
                )
            except Exception as e:
                logger.error(f"WebSocket notification error: {e}")

        return Response(TaskSerializer(task).data, status=201)


class UpdateTaskStatusView(APIView):
    """PATCH /api/v1/staff/tasks/<id>/update/ - Update task status"""
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def patch(self, request, task_id):
        try:
            task = Task.objects.get(id=task_id)
        except Task.DoesNotExist:
            return Response({'error': 'Task not found'}, status=404)

        # Check permission: staff can update their own tasks, admin can update any
        if request.user.role not in ['ADMIN', 'RECEPTIONIST'] and task.assigned_to != request.user:
            return Response({'error': 'Access denied'}, status=403)

        new_status = request.data.get('status')
        note = request.data.get('note', '')

        if not new_status:
            return Response({'error': 'Status required'}, status=400)

        old_status = task.status

        # Update task
        task.status = new_status
        if new_status == 'IN_PROGRESS' and not task.started_at:
            task.started_at = timezone.now()
        if new_status == 'COMPLETED':
            task.completed_at = timezone.now()

        if note:
            task.note = note

        task.save()

        # Create history record
        TaskHistory.objects.create(
            task=task,
            previous_status=old_status,
            new_status=new_status,
            changed_by=request.user,
            note=note
        )

        return Response(TaskSerializer(task).data)


class TaskDetailView(APIView):
    """GET /api/v1/staff/tasks/<id>/ - Get task details"""
    permission_classes = [IsAuthenticated]

    def get(self, request, task_id):
        try:
            task = Task.objects.get(id=task_id)
        except Task.DoesNotExist:
            return Response({'error': 'Task not found'}, status=404)

        # Check permission
        if request.user.role not in ['ADMIN', 'RECEPTIONIST'] and task.assigned_to != request.user:
            return Response({'error': 'Access denied'}, status=403)

        serializer = TaskSerializer(task)
        return Response(serializer.data)


class TaskHistoryView(APIView):
    """GET /api/v1/staff/tasks/<id>/history/ - Get task history"""
    permission_classes = [IsAuthenticated]

    def get(self, request, task_id):
        try:
            task = Task.objects.get(id=task_id)
        except Task.DoesNotExist:
            return Response({'error': 'Task not found'}, status=404)

        # Check permission
        if request.user.role not in ['ADMIN', 'RECEPTIONIST'] and task.assigned_to != request.user:
            return Response({'error': 'Access denied'}, status=403)

        history = TaskHistory.objects.filter(task=task)
        serializer = TaskHistorySerializer(history, many=True)
        return Response(serializer.data)


class StaffProfileView(APIView):
    """GET/PUT /api/v1/staff/profile/ - Get or update staff profile"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'STAFF':
            return Response({'error': 'Access denied'}, status=403)

        try:
            profile = StaffProfile.objects.get(user=request.user)
        except StaffProfile.DoesNotExist:
            return Response({'error': 'Profile not found'}, status=404)

        serializer = StaffProfileSerializer(profile)
        return Response(serializer.data)

    def put(self, request):
        if request.user.role != 'STAFF':
            return Response({'error': 'Access denied'}, status=403)

        try:
            profile = StaffProfile.objects.get(user=request.user)
        except StaffProfile.DoesNotExist:
            return Response({'error': 'Profile not found'}, status=404)

        profile.department = request.data.get('department', profile.department)
        profile.phone_number = request.data.get('phone_number', profile.phone_number)
        profile.skills = request.data.get('skills', profile.skills)
        profile.save()

        serializer = StaffProfileSerializer(profile)
        return Response(serializer.data)


class StaffStatsView(APIView):
    """GET /api/v1/staff/stats/ - Get staff statistics"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role not in ['ADMIN', 'RECEPTIONIST', 'STAFF']:
            return Response({'error': 'Access denied'}, status=403)

        # For staff, show their own stats
        if request.user.role == 'STAFF':
            tasks = Task.objects.filter(assigned_to=request.user)
            stats = {
                'pending': tasks.filter(status='PENDING').count(),
                'in_progress': tasks.filter(status='IN_PROGRESS').count(),
                'completed': tasks.filter(status='COMPLETED').count(),
                'total': tasks.count(),
            }
        else:
            # For admin/receptionist, show overall stats
            tasks = Task.objects.all()
            stats = {
                'pending': tasks.filter(status='PENDING').count(),
                'in_progress': tasks.filter(status='IN_PROGRESS').count(),
                'completed': tasks.filter(status='COMPLETED').count(),
                'total': tasks.count(),
                'high_priority': tasks.filter(priority='HIGH', status__in=['PENDING', 'IN_PROGRESS']).count(),
            }

        return Response(stats)


class AvailableStaffView(APIView):
    """GET /api/v1/staff/available/ - Get list of available staff members"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Only admin or receptionist can access
        if request.user.role not in ['ADMIN', 'RECEPTIONIST']:
            return Response({'error': 'Access denied'}, status=403)

        staff_users = []
        # Get all users with role STAFF
        from django.contrib.auth import get_user_model
        User = get_user_model()

        staff_users_qs = User.objects.filter(role='STAFF', is_active=True)

        for user in staff_users_qs:
            try:
                profile = StaffProfile.objects.get(user=user)
                staff_users.append({
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'department': profile.department,
                    'is_on_duty': profile.is_on_duty,
                    'employee_id': profile.employee_id,
                })
            except StaffProfile.DoesNotExist:
                staff_users.append({
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'department': 'MAINTENANCE',
                    'is_on_duty': True,
                    'employee_id': None,
                })

        return Response(staff_users)
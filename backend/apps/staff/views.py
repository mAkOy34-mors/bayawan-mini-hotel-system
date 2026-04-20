# apps/staff/views.py
import logging
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

from .models import Task, TaskHistory
from .serializers import TaskSerializer, TaskHistorySerializer, CreateTaskSerializer
from apps.rooms.models import Room
from apps.employees.models import EmployeeInformation

logger = logging.getLogger(__name__)


class StaffTaskListView(APIView):
    """GET /api/v1/staff/tasks/ - Get tasks assigned to current staff member"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Check if user has staff role
        if request.user.role not in ['ADMIN', 'RECEPTIONIST', 'STAFF', 'HOUSEKEEPER', 'MAINTENANCE', 'SECURITY',
                                     'FRONT_DESK', 'MANAGEMENT']:
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

            print("=" * 50)
            print("Received data:", request.data)
            print("=" * 50)

            serializer = CreateTaskSerializer(data=request.data)
            if not serializer.is_valid():
                print("Serializer errors:", serializer.errors)
                return Response({'errors': serializer.errors}, status=400)

            data = serializer.validated_data

            # Get room number
            room_number = data.get('room_number', '')
            if data.get('room'):
                try:
                    room = Room.objects.get(id=data['room'].id)
                    room_number = room.room_number
                except Room.DoesNotExist:
                    pass

            # Handle assigned_to
            assigned_to = None
            if data.get('assigned_to'):
                from django.contrib.auth import get_user_model
                User = get_user_model()
                try:
                    assigned_to = User.objects.get(id=int(data['assigned_to']))
                    print(f"Found assigned_to user: {assigned_to.username}")
                except (User.DoesNotExist, ValueError, TypeError) as e:
                    print(f"Error finding assigned_to: {e}")
                    assigned_to = None

            # Handle complaint reference
            complaint = None
            complaint_id = data.get('complaint_id')
            if complaint_id:
                from apps.complaints.models import Complaint
                try:
                    complaint = Complaint.objects.get(id=complaint_id)
                    print(f"Found complaint: #{complaint.id} - {complaint.title}")
                except Complaint.DoesNotExist:
                    print(f"Complaint #{complaint_id} not found")
                    pass

            # Create the task
            task = Task.objects.create(
                title=data['title'],
                description=data['description'],
                task_type=data.get('task_type', 'ASSISTANCE'),
                priority=data.get('priority', 'MEDIUM'),
                room=data.get('room'),
                room_number=room_number,
                assigned_to=assigned_to,
                assigned_by=request.user,
                note=data.get('note', ''),
                complaint=complaint
            )

            print(f"Task created successfully with ID: {task.id}")

            # Create history record
            TaskHistory.objects.create(
                task=task,
                previous_status='',
                new_status='PENDING',
                changed_by=request.user,
                note=f"Task created by {request.user.username}"
            )

            # Send WebSocket notification
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

        # Check permission
        if request.user.role not in ['ADMIN', 'RECEPTIONIST'] and task.assigned_to != request.user:
            return Response({'error': 'Access denied'}, status=403)

        new_status = request.data.get('status')
        note = request.data.get('note', '')

        if not new_status:
            return Response({'error': 'Status required'}, status=400)

        old_status = task.status

        print("=" * 50)
        print(f"Updating task {task_id}: {old_status} -> {new_status}")
        print(f"Task has complaint: {task.complaint is not None}")
        if task.complaint:
            print(f"Complaint ID: {task.complaint.id}, current status: {task.complaint.status}")

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

        # If task is completed and has a complaint, update complaint status to RESOLVED
        if new_status == 'COMPLETED' and task.complaint:
            print(f"Completing task - updating complaint #{task.complaint.id}")

            # Only update if not already resolved or closed
            if task.complaint.status not in ['RESOLVED', 'CLOSED']:
                task.complaint.status = 'RESOLVED'
                task.complaint.response = note or f"Task '{task.title}' has been completed by staff."
                task.complaint.resolved_at = timezone.now()
                task.complaint.resolved_by = request.user
                task.complaint.save()
                print(f"Complaint #{task.complaint.id} updated to RESOLVED")

                # Add timeline entry for complaint
                from apps.complaints.models import ComplaintTimeline
                ComplaintTimeline.objects.create(
                    complaint=task.complaint,
                    status='RESOLVED',
                    note=f"Resolved via task #{task.id}: {task.title}",
                    created_by=request.user
                )
                print(f"Timeline entry added for complaint #{task.complaint.id}")
            else:
                print(f"Complaint #{task.complaint.id} already {task.complaint.status}, skipping update")
        else:
            print(f"Task status is {new_status} or no complaint linked")

        print("=" * 50)

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


class StaffStatsView(APIView):
    """GET /api/v1/staff/stats/ - Get staff statistics"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role not in ['ADMIN', 'RECEPTIONIST', 'STAFF', 'HOUSEKEEPER', 'MAINTENANCE', 'SECURITY',
                                     'FRONT_DESK', 'MANAGEMENT']:
            return Response({'error': 'Access denied'}, status=403)

        # For staff, show their own stats
        if request.user.role in ['STAFF', 'HOUSEKEEPER', 'MAINTENANCE', 'SECURITY', 'FRONT_DESK', 'MANAGEMENT']:
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
    """GET /api/v1/staff/available/ - Get list of available staff members by department"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Only admin or receptionist can access
        if request.user.role not in ['ADMIN', 'RECEPTIONIST']:
            return Response({'error': 'Access denied'}, status=403)

        department = request.query_params.get('department', '')

        print(f"Looking for department: {department}")

        # Get employees from EmployeeInformation
        employees = EmployeeInformation.objects.filter(
            department__iexact=department,
            is_active=True,
            is_on_duty=True
        ).select_related('user')

        print(f"Found {employees.count()} employees")

        staff_list = []
        for emp in employees:
            staff_list.append({
                'id': emp.user.id,
                'username': emp.user.username,
                'email': emp.email,
                'first_name': emp.first_name,
                'last_name': emp.last_name,
                'full_name': emp.full_name,
                'department': emp.department,
                'position': emp.position,
                'is_on_duty': emp.is_on_duty,
                'employee_id': emp.employee_id,
            })

        return Response(staff_list)


class TaskDeleteView(APIView):
    """DELETE /api/v1/staff/tasks/<id>/delete/ - Delete a task"""
    permission_classes = [IsAuthenticated]

    def delete(self, request, task_id):
        # Only admin or receptionist can delete tasks
        if request.user.role not in ['ADMIN', 'RECEPTIONIST']:
            return Response({'error': 'Access denied. Only admin or receptionist can delete tasks.'}, status=403)

        try:
            task = Task.objects.get(id=task_id)
        except Task.DoesNotExist:
            return Response({'error': 'Task not found'}, status=404)

        # Delete history records first (due to foreign key constraint)
        TaskHistory.objects.filter(task=task).delete()

        # Delete the task
        task.delete()

        return Response({'message': 'Task deleted successfully'}, status=200)
# apps/staff/views.py
import logging
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

from .models import Task, TaskHistory, MaintenanceRequest
from .serializers import TaskSerializer, TaskHistorySerializer, CreateTaskSerializer, MaintenanceRequestSerializer, \
    CreateMaintenanceRequestSerializer
from apps.rooms.models import Room
from apps.employees.models import EmployeeInformation
from ..complaints.models import Complaint
from ..users.models import User

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
        if request.user.role not in ['ADMIN', 'RECEPTIONIST']:
            return Response({'error': 'Access denied'}, status=403)

        print("=" * 50)
        print("CreateTaskView - Received data:", request.data)
        print("=" * 50)

        serializer = CreateTaskSerializer(data=request.data)
        if not serializer.is_valid():
            print("Serializer errors:", serializer.errors)
            return Response({'errors': serializer.errors}, status=400)

        validated_data = serializer.validated_data

        # 1. Resolve Room
        room = None
        room_number = validated_data.get('room_number', '')

        if validated_data.get('room'):
            room = validated_data['room']
            room_number = room.room_number
            print(f"Room resolved from 'room' field: ID {room.id} - {room.room_number}")

        elif room_number:
            try:
                room = Room.objects.get(room_number=room_number)
                print(f"Room resolved by room_number '{room_number}': ID {room.id}")
            except Room.DoesNotExist:
                print(f"Room {room_number} not found")

        # 2. Assignment Logic
        assigned_to = None

        # If frontend sent assigned_to, use it
        if validated_data.get('assigned_to'):
            try:
                assigned_to = User.objects.get(id=int(validated_data['assigned_to']))
                print(f"Manually assigned to user ID: {assigned_to.id} ({assigned_to.username})")
            except Exception as e:
                print(f"Error finding assigned_to: {e}")

        # Auto-assignment only if no assigned_to was provided
        if not assigned_to:
            task_type = validated_data.get('task_type', 'ASSISTANCE').upper()

            role_mapping = {
                'CLEANING':     ['HOUSEKEEPER', 'STAFF'],
                'HOUSEKEEPING': ['HOUSEKEEPER', 'STAFF'],
                'MAINTENANCE':  ['MAINTENANCE', 'STAFF'],
                'REPAIR':       ['MAINTENANCE', 'STAFF'],
                'ASSISTANCE':   ['RECEPTIONIST', 'STAFF'],
            }

            roles_to_find = role_mapping.get(task_type, ['STAFF'])

            for role in roles_to_find:
                # IMPORTANT: Removed is_active=True since your User model doesn't have it
                staff_members = User.objects.filter(role=role).exclude(id=request.user.id)

                if staff_members.exists():
                    # Simple assignment: pick the first one (you can improve later)
                    assigned_to = staff_members.first()
                    print(f"Auto-assigned {task_type} task to {assigned_to.username} (role: {role})")
                    break

            if not assigned_to:
                # Final fallback: assign to any admin
                assigned_to = User.objects.filter(role='ADMIN').first()
                if assigned_to:
                    print(f"Fallback: Assigned to admin {assigned_to.username}")

        # 3. Handle Complaint (if any)
        complaint = None
        if validated_data.get('complaint_id'):
            try:
                complaint = Complaint.objects.get(id=validated_data['complaint_id'])
            except Complaint.DoesNotExist:
                print(f"Warning: Complaint #{validated_data['complaint_id']} not found")

        # 4. Create the Task
        task = Task.objects.create(
            title=validated_data['title'],
            description=validated_data['description'],
            task_type=validated_data.get('task_type', 'ASSISTANCE'),
            priority=validated_data.get('priority', 'HIGH'),
            room=room,
            room_number=room_number,
            assigned_to=assigned_to,
            assigned_by=request.user,
            note=validated_data.get('note', ''),
            complaint=complaint,
            status='PENDING',
        )

        print(f"✅ Task #{task.id} created successfully | Room ID: {task.room_id} | Assigned to: {assigned_to.username if assigned_to else 'None'}")

        # 5. Link ServiceRequest / RoomIssue (if sent)
        service_request_id = request.data.get('service_request_id')
        if service_request_id:
            try:
                from apps.services.models import ServiceRequest
                service_req = ServiceRequest.objects.get(id=service_request_id)
                task.service_request = service_req
                task.save(update_fields=['service_request'])

                service_req.assigned_to = assigned_to  # the User object resolved above
                service_req.status = 'IN_PROGRESS'  # mark it as in progress
                service_req.save(update_fields=['assigned_to', 'status'])

                print(f"✅ Linked ServiceRequest #{service_request_id} to task #{task.id}")
            except Exception as e:
                logger.warning(f"Could not link ServiceRequest #{service_request_id}: {e}")

        room_issue_id = request.data.get('room_issue_id')
        if room_issue_id:
            try:
                from apps.housekeepers.models import RoomIssue
                issue = RoomIssue.objects.get(id=room_issue_id)
                task.room_issue = issue
                task.save(update_fields=['room_issue'])
                print(f"Linked RoomIssue #{room_issue_id} to task #{task.id}")
            except Exception as e:
                logger.warning(f"Could not link RoomIssue #{room_issue_id}: {e}")

        # 6. Create History
        TaskHistory.objects.create(
            task=task,
            previous_status='',
            new_status='PENDING',
            changed_by=request.user,
            note=f"Task created by {request.user.username}"
        )

        return Response(TaskSerializer(task).data, status=201)

class UpdateTaskStatusView(APIView):
    """PATCH /api/v1/staff/tasks/<id>/update/ - Update task status"""
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def patch(self, request, task_id):
        try:
            task = Task.objects.select_related('room', 'complaint').get(id=task_id)
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
        print(f"Updating task {task_id}: {old_status} -> {new_status} | Type: {task.task_type}")

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

        # ── Sync linked Complaint ─────────────────────────────────────────────
        if new_status == 'COMPLETED' and task.complaint:
            print(f"Completing task - updating complaint #{task.complaint.id}")
            if task.complaint.status not in ['RESOLVED', 'CLOSED']:
                task.complaint.status = 'RESOLVED'
                task.complaint.response = note or f"Task '{task.title}' has been completed by staff."
                task.complaint.resolved_at = timezone.now()
                task.complaint.resolved_by = request.user
                task.complaint.save()

                from apps.complaints.models import ComplaintTimeline
                ComplaintTimeline.objects.create(
                    complaint=task.complaint,
                    status='RESOLVED',
                    note=f"Resolved via task #{task.id}: {task.title}",
                    created_by=request.user
                )

        # ── Sync linked RoomIssue ─────────────────────────────────────────────
        if new_status == 'COMPLETED' and task.room_issue_id:
            try:
                from apps.housekeepers.models import RoomIssue
                issue = RoomIssue.objects.get(id=task.room_issue_id)
                if issue.status not in ['COMPLETED', 'REJECTED']:
                    issue.status = 'COMPLETED'
                    issue.completed_at = timezone.now()
                    issue.resolution_notes = (
                            note or f"Resolved via Staff Task #{task.id}: {task.title}"
                    )
                    issue.save(update_fields=['status', 'completed_at', 'resolution_notes'])
            except Exception as e:
                logger.warning(f"Could not sync RoomIssue for task #{task.id}: {e}")

        # ── Sync linked ServiceRequest ────────────────────────────────────────
        if new_status == 'COMPLETED' and task.service_request_id:
            try:
                from apps.services.models import ServiceRequest
                service_req = ServiceRequest.objects.get(id=task.service_request_id)
                if service_req.status not in ['COMPLETED', 'CANCELLED']:
                    service_req.status = 'COMPLETED'
                    service_req.completed_at = timezone.now()
                    service_req.save(update_fields=['status', 'completed_at'])
            except Exception as e:
                logger.warning(f"Could not sync ServiceRequest for task #{task.id}: {e}")

        # ── Sync Room Status ──────────────────────────────────────────────────
        # Only apply smart logic for tasks that have a direct room link
        # Do NOT override behavior for Complaint-based or ServiceRequest-based tasks
        if new_status == 'COMPLETED' and task.room_id:

            # Skip room status change if this task is linked to a Complaint or Service Request
            # (Preserve your old functionality)
            if task.complaint_id or task.service_request_id:
                print(f"Task #{task.id} is linked to complaint/service_request → Skipping room status auto-update")
            else:
                # Normal tasks (from Receptionist Room Board, etc.)
                try:
                    from apps.rooms.models import Room
                    room = Room.objects.get(id=task.room_id)

                    if task.task_type in ['CLEANING', 'HOUSEKEEPING']:
                        room.status = 'CLEAN'
                        room.available = True
                        print(f"Cleaning Task completed → Room {room.room_number} set to CLEAN")

                    elif task.task_type in ['MAINTENANCE', 'REPAIR']:
                        room.status = 'DIRTY'  # ← This is what you requested
                        room.available = True
                        print(f"Maintenance Task completed → Room {room.room_number} set to DIRTY (needs cleaning)")

                    else:
                        # Default fallback
                        room.status = 'CLEAN'
                        room.available = True

                    room.updated_at = timezone.now()
                    room.save(update_fields=['status', 'available', 'updated_at'])
                    print(f"Room #{room.id} ({room.room_number}) → {room.status} | available={room.available}")

                except Room.DoesNotExist:
                    print(f"Room with id={task.room_id} not found")
                except Exception as e:
                    logger.warning(f"Could not sync Room status for task #{task.id}: {e}")

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

        # Map frontend department names exactly as they are in the database
        # The database has: SECURITY, HOUSEKEEPING, MAINTENANCE
        department_mapping = {
            'HOUSEKEEPING': 'HOUSEKEEPING',
            'MAINTENANCE': 'MAINTENANCE',
            'SECURITY': 'SECURITY',
            'FRONT_DESK': 'FRONT_DESK',
            'MANAGEMENT': 'MANAGEMENT',
        }

        mapped_department = department_mapping.get(department.upper(), department.upper())

        print(f"🔍 Looking for department: '{department}' -> mapped to: '{mapped_department}'")

        # Get employees from EmployeeInformation
        employees = EmployeeInformation.objects.filter(
            department__iexact=mapped_department,
            is_active=True,
            is_on_duty=True
        ).select_related('user')

        print(f"✅ Found {employees.count()} employees in department '{mapped_department}'")

        # Debug: Print all employees for verification
        for emp in employees:
            print(f"   - {emp.full_name} (ID: {emp.id}, User ID: {emp.user.id}, Department: {emp.department})")

        staff_list = []
        for emp in employees:
            staff_list.append({
                'id': emp.user.id,  # This is the user ID for assignment
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

        # If no employees found, try to find any user with matching role
        if not staff_list and department.upper() == 'SECURITY':
            print("⚠️ No employees found in EmployeeInformation, checking Users by role...")
            from apps.users.models import User
            users = User.objects.filter(role='SECURITY', is_active=True)
            for user in users:
                print(f"   - Found user: {user.username} (ID: {user.id}) with role SECURITY")
                staff_list.append({
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'first_name': user.first_name or '',
                    'last_name': user.last_name or '',
                    'full_name': user.get_full_name() or user.username,
                    'department': 'SECURITY',
                    'position': 'Security Staff',
                    'is_on_duty': True,
                    'employee_id': f"SEC{user.id:06d}",
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


# apps/staff/views.py - Add these views

class MaintenanceRequestListView(APIView):
    """GET /api/v1/staff/maintenance-requests/ - Get maintenance requests for current user"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_role = getattr(request.user, 'role', '')

        # Staff can see their own requests
        if user_role in ['STAFF', 'HOUSEKEEPER', 'MAINTENANCE', 'SECURITY', 'FRONT_DESK', 'MANAGEMENT']:
            requests = MaintenanceRequest.objects.filter(requested_by=request.user)
        # Admin/Receptionist can see all requests
        elif user_role in ['ADMIN', 'RECEPTIONIST']:
            requests = MaintenanceRequest.objects.all()
        else:
            return Response({'error': 'Access denied'}, status=403)

        requests = requests.order_by('-priority', '-created_at')
        serializer = MaintenanceRequestSerializer(requests, many=True)
        return Response(serializer.data)


class AllMaintenanceRequestsView(APIView):
    """GET /api/v1/staff/maintenance-requests/all/ - Get all maintenance requests (admin/receptionist only)"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role not in ['ADMIN', 'RECEPTIONIST']:
            return Response({'error': 'Access denied'}, status=403)

        requests = MaintenanceRequest.objects.all().order_by('-priority', '-created_at')
        serializer = MaintenanceRequestSerializer(requests, many=True)
        return Response(serializer.data)


class CreateMaintenanceRequestView(APIView):
    """POST /api/v1/staff/maintenance-requests/create/ - Create a maintenance request"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Allow staff, housekeeper, and maintenance to create requests
        allowed_roles = ['STAFF', 'HOUSEKEEPER', 'MAINTENANCE', 'SECURITY', 'FRONT_DESK', 'MANAGEMENT', 'ADMIN',
                         'RECEPTIONIST']
        if request.user.role not in allowed_roles:
            return Response({'error': 'Access denied'}, status=403)

        serializer = CreateMaintenanceRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({'errors': serializer.errors}, status=400)

        data = serializer.validated_data

        maintenance_request = MaintenanceRequest.objects.create(
            maintenance_type=data['maintenance_type'],
            title=data['title'],
            description=data['description'],
            priority=data.get('priority', 'MEDIUM'),
            room_number=data.get('room_number', ''),
            notes=data.get('notes', ''),
            requested_by=request.user,
            status='PENDING'
        )

        return Response(MaintenanceRequestSerializer(maintenance_request).data, status=201)


class UpdateMaintenanceRequestStatusView(APIView):
    """PATCH /api/v1/staff/maintenance-requests/<id>/update/ - Update maintenance request status"""
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def patch(self, request, request_id):
        try:
            maintenance_request = MaintenanceRequest.objects.get(id=request_id)
        except MaintenanceRequest.DoesNotExist:
            return Response({'error': 'Maintenance request not found'}, status=404)

        user_role = getattr(request.user, 'role', '')

        # Check permission
        if user_role not in ['ADMIN', 'RECEPTIONIST', 'MAINTENANCE']:
            if maintenance_request.requested_by != request.user:
                return Response({'error': 'Access denied'}, status=403)

        new_status = request.data.get('status')
        if not new_status:
            return Response({'error': 'Status required'}, status=400)

        # Updated valid statuses for new workflow
        valid_statuses = ['PENDING', 'APPROVED', 'FULFILLED', 'REJECTED']

        # Map old status values to new ones (if frontend sends old values)
        status_mapping = {
            'IN_PROGRESS': 'APPROVED',
            'COMPLETED': 'FULFILLED',
            'IN PROGRESS': 'APPROVED',
            'DONE': 'FULFILLED',
        }

        if new_status in status_mapping:
            new_status = status_mapping[new_status]

        if new_status not in valid_statuses:
            return Response({'error': f'Invalid status. Must be one of: {valid_statuses}'}, status=400)

        old_status = maintenance_request.status
        maintenance_request.status = new_status

        # Update based on new status
        if new_status == 'APPROVED' and not maintenance_request.started_at:
            maintenance_request.started_at = timezone.now()
            # Auto-assign to current user if they are maintenance/admin/receptionist
            if user_role in ['MAINTENANCE', 'ADMIN', 'RECEPTIONIST']:
                maintenance_request.assigned_to = request.user
        elif new_status == 'FULFILLED':
            maintenance_request.completed_at = timezone.now()
            resolution_notes = request.data.get('resolution_notes', '')
            if resolution_notes:
                maintenance_request.resolution_notes = resolution_notes
        elif new_status == 'REJECTED':
            rejection_reason = request.data.get('rejection_reason', '')
            if rejection_reason:
                maintenance_request.rejection_reason = rejection_reason

        # Update notes if provided
        notes = request.data.get('notes', '')
        if notes:
            maintenance_request.notes = notes

        maintenance_request.save()

        return Response(MaintenanceRequestSerializer(maintenance_request).data, status=200)

class MaintenanceRequestDetailView(APIView):
    """GET /api/v1/staff/maintenance-requests/<id>/ - Get maintenance request details"""
    permission_classes = [IsAuthenticated]

    def get(self, request, request_id):
        try:
            maintenance_request = MaintenanceRequest.objects.get(id=request_id)
        except MaintenanceRequest.DoesNotExist:
            return Response({'error': 'Maintenance request not found'}, status=404)

        user_role = getattr(request.user, 'role', '')

        # Check permission
        if user_role not in ['ADMIN', 'RECEPTIONIST', 'MAINTENANCE']:
            if maintenance_request.requested_by != request.user:
                return Response({'error': 'Access denied'}, status=403)

        serializer = MaintenanceRequestSerializer(maintenance_request)
        return Response(serializer.data)


class AssignMaintenanceRequestView(APIView):
    """POST /api/v1/staff/maintenance-requests/<id>/assign/ - Assign request to staff"""
    permission_classes = [IsAuthenticated]

    def post(self, request, request_id):
        # Only admin, receptionist, or maintenance can assign
        if request.user.role not in ['ADMIN', 'RECEPTIONIST', 'MAINTENANCE']:
            return Response({'error': 'Access denied'}, status=403)

        try:
            maintenance_request = MaintenanceRequest.objects.get(id=request_id)
        except MaintenanceRequest.DoesNotExist:
            return Response({'error': 'Maintenance request not found'}, status=404)

        assigned_to_id = request.data.get('assigned_to')
        if not assigned_to_id:
            return Response({'error': 'assigned_to is required'}, status=400)

        from django.contrib.auth import get_user_model
        User = get_user_model()

        try:
            assigned_to = User.objects.get(id=assigned_to_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)

        maintenance_request.assigned_to = assigned_to
        maintenance_request.save()

        return Response(MaintenanceRequestSerializer(maintenance_request).data, status=200)
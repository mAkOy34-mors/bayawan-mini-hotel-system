# apps/services/views.py
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from django.db import transaction
import uuid

from .models import ServiceRequest, ServicePayment
from .serializers import (
    ServiceRequestSerializer,
    CreateServiceRequestSerializer,
    UpdateServiceRequestSerializer,
    ServicePaymentSerializer
)
from apps.payments.models import Payment  # ← IMPORTANT: Add this import
from ..rooms.models import Room
from ..staff.models import Task, TaskHistory
from ..users.models import User


class GuestServiceRequestView(APIView):
    """POST /api/v1/services/guest/ - Create service request"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CreateServiceRequestSerializer(
            data=request.data,
            context={'request': request}
        )
        if serializer.is_valid():
            service = serializer.save()
            return Response(
                ServiceRequestSerializer(service).data,
                status=201
            )
        return Response(serializer.errors, status=400)

    def get(self, request):
        """GET /api/v1/services/guest/ - Get guest's service requests"""
        services = ServiceRequest.objects.filter(
            created_by=request.user
        ).order_by('-created_at')
        serializer = ServiceRequestSerializer(services, many=True)
        return Response(serializer.data)


class ReceptionServiceListView(APIView):
    """GET /api/v1/services/reception/ - Get all service requests for reception"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role not in ['ADMIN', 'RECEPTIONIST']:
            return Response({'error': 'Access denied'}, status=403)

        status_filter = request.query_params.get('status', '')
        service_type = request.query_params.get('type', '')

        services = ServiceRequest.objects.all().order_by('-priority', '-created_at')

        if status_filter:
            services = services.filter(status=status_filter)
        if service_type:
            services = services.filter(service_type=service_type)

        serializer = ServiceRequestSerializer(services, many=True)

        # Stats
        stats = {
            'pending': ServiceRequest.objects.filter(status='PENDING').count(),
            'in_progress': ServiceRequest.objects.filter(status='IN_PROGRESS').count(),
            'completed': ServiceRequest.objects.filter(status='COMPLETED').count(),
            'total': ServiceRequest.objects.count(),
        }

        return Response({
            'services': serializer.data,
            'stats': stats
        })


class AssignServiceRequestView(APIView):
    """PUT /api/v1/services/reception/<id>/assign/ - Assign service to staff and create task"""
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def put(self, request, service_id):
        # Check permissions
        if request.user.role not in ['ADMIN', 'RECEPTIONIST']:
            return Response({'error': 'Access denied'}, status=403)

        try:
            service = ServiceRequest.objects.get(id=service_id)
        except ServiceRequest.DoesNotExist:
            return Response({'error': 'Service request not found'}, status=404)

        assigned_to_id = request.data.get('assigned_to')

        if not assigned_to_id:
            return Response({'error': 'assigned_to is required'}, status=400)

        try:
            assigned_staff = User.objects.get(id=assigned_to_id)
        except User.DoesNotExist:
            return Response({'error': 'Staff not found'}, status=404)

        # Update service request
        service.assigned_to = assigned_staff
        service.status = 'IN_PROGRESS'
        if not service.started_at:
            service.started_at = timezone.now()
        service.save()

        # ========== CREATE TASK IN STAFF_TASKS ==========

        # Map service type to task type
        task_type_mapping = {
            'CLEANING': 'CLEANING',
            'MAINTENANCE': 'MAINTENANCE',
            'LAUNDRY': 'DELIVERY',
            'DELIVERY': 'DELIVERY',
            'EXTRA_PILLOWS': 'DELIVERY',
            'EXTRA_TOWELS': 'DELIVERY',
            'MINI_BAR': 'DELIVERY',
            'TECH_SUPPORT': 'REPAIR',
            'OTHER': 'ASSISTANCE',
        }

        task_type = task_type_mapping.get(service.service_type, 'ASSISTANCE')

        # Map priority
        priority_mapping = {
            'LOW': 'LOW',
            'MEDIUM': 'MEDIUM',
            'HIGH': 'HIGH',
            'URGENT': 'HIGH',
        }
        priority = priority_mapping.get(service.priority, 'MEDIUM')

        # Get room object if exists
        room = None
        room_number = service.room_number
        if service.room_number:
            try:
                room = Room.objects.filter(room_number=service.room_number).first()
            except Room.DoesNotExist:
                pass

        # Create the task title and description
        # Create the task title and description - CLEAN AND PRECISE
        task_title = f"{service.service_type} - Room {service.room_number}"
        task_description = f"Guest: {service.guest_name} | Room: {service.room_number} | Type: {service.service_type} | Priority: {service.priority} | Request: #{service.id} - {service.description or 'No description'}"

        # Create the task
        task = Task.objects.create(
            title=task_title,
            description=task_description,
            task_type=task_type,
            priority=priority,
            status='PENDING',
            room=room,
            room_number=room_number,
            assigned_to=assigned_staff,
            assigned_by=request.user,
            note=f"Created from service request #{service.id} by {request.user.username}",
            booking=None,
        )

        # Create task history record
        TaskHistory.objects.create(
            task=task,
            previous_status='',
            new_status='PENDING',
            changed_by=request.user,
            note=f"Task created from service request #{service.id}"
        )

        # Optional: Add task reference to service request (if you add the field)
        # service.task = task
        # service.save(update_fields=['task'])

        # Serialize response
        serializer = ServiceRequestSerializer(service)

        return Response({
            'success': True,
            'message': f'Service request assigned to {assigned_staff.username} and task created',
            'service': serializer.data,
            'task': {
                'id': task.id,
                'title': task.title,
                'task_type': task.task_type,
                'priority': task.priority,
                'status': task.status,
                'assigned_to': assigned_staff.username,
                'assigned_to_id': assigned_staff.id,
                'created_at': task.created_at,
            }
        }, status=200)

class UpdateServiceStatusView(APIView):
    """PATCH /api/v1/services/tasks/<id>/status/ - Update service status"""
    permission_classes = [IsAuthenticated]

    def patch(self, request, service_id):
        try:
            service = ServiceRequest.objects.get(id=service_id)
        except ServiceRequest.DoesNotExist:
            return Response({'error': 'Service not found'}, status=404)

        # Check permission
        if request.user.role not in ['ADMIN', 'RECEPTIONIST'] and service.assigned_to != request.user:
            return Response({'error': 'Access denied'}, status=403)

        new_status = request.data.get('status')
        if not new_status:
            return Response({'error': 'Status required'}, status=400)

        service.status = new_status

        if new_status == 'IN_PROGRESS' and not service.started_at:
            service.started_at = timezone.now()
        if new_status == 'COMPLETED':
            service.completed_at = timezone.now()

        service.save()

        serializer = ServiceRequestSerializer(service)
        return Response(serializer.data)


class StaffTaskListView(APIView):
    """GET /api/v1/services/tasks/ - Get tasks assigned to current staff"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        services = ServiceRequest.objects.filter(
            assigned_to=request.user
        ).exclude(status='COMPLETED').order_by('-priority', '-created_at')

        serializer = ServiceRequestSerializer(services, many=True)
        return Response(serializer.data)


class ServicePaymentView(APIView):
    """POST /api/v1/services/payment/ - Pay for services at checkout"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        service_ids = request.data.get('service_ids', [])
        payment_method = request.data.get('payment_method', 'ROOM_CHARGE')

        services = ServiceRequest.objects.filter(
            id__in=service_ids,
            is_paid=False,
            status='COMPLETED'
        )

        if not services.exists():
            return Response({'error': 'No unpaid services found'}, status=400)

        total_amount = sum(s.service_charge for s in services)
        first_service = services.first()
        guest_email = first_service.guest_email if first_service else ''
        guest_name = first_service.guest_name if first_service else 'Guest'

        print(f"Processing service payment: ₱{total_amount} for {services.count()} services")

        with transaction.atomic():
            # 1. Create service payment record (for service tracking)
            service_payment = ServicePayment.objects.create(
                amount=total_amount,
                payment_method=payment_method,
                receipt_number=f"SVC{uuid.uuid4().hex[:8].upper()}"
            )

            # 2. Create MAIN PAYMENT RECORD (for PaymentsPage)
            main_payment = Payment.objects.create(
                amount=total_amount,
                status='PAID',
                type='SERVICE',  # This will show in PaymentsPage
                description=f"Service charges: {', '.join([s.get_service_type_display() for s in services])}",
                email=guest_email,
                paid_at=timezone.now(),
                paymongo_link_id=f"SVC-{uuid.uuid4().hex[:8].upper()}",
                checkout_url="",
                booking_id=None,
                created_at=timezone.now(),
                updated_at=timezone.now()
            )

            print(f"✅ Main payment record created: ID {main_payment.id}, Amount: ₱{main_payment.amount}")

            # 3. Update services as paid
            for service in services:
                service.is_paid = True
                service.save()
                service_payment.service_request = service
                service_payment.save()
                print(f"✅ Service #{service.id} ({service.get_service_type_display()}) marked as paid")

        return Response({
            'message': 'Payment successful',
            'total': total_amount,
            'receipt_number': service_payment.receipt_number,
            'payment_id': main_payment.id
        }, status=201)


class GuestServicePaymentsView(APIView):
    """GET /api/v1/services/my-payments/ - Get guest's service payments"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Get all service payments for the guest
        service_payments = ServicePayment.objects.filter(
            service_request__guest_email=request.user.email
        ).order_by('-paid_at')

        result = []
        for sp in service_payments:
            result.append({
                'id': sp.id,
                'amount': sp.amount,
                'payment_method': sp.payment_method,
                'receipt_number': sp.receipt_number,
                'paid_at': sp.paid_at,
                'service_type': sp.service_request.get_service_type_display() if sp.service_request else 'Unknown'
            })

        return Response(result)


class AdminServiceDashboardView(APIView):
    """GET /api/v1/services/admin/dashboard/ - Admin dashboard stats"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'ADMIN':
            return Response({'error': 'Access denied'}, status=403)

        # Get statistics
        total = ServiceRequest.objects.count()
        pending = ServiceRequest.objects.filter(status='PENDING').count()
        in_progress = ServiceRequest.objects.filter(status='IN_PROGRESS').count()
        completed = ServiceRequest.objects.filter(status='COMPLETED').count()

        # Revenue from services (from main payments table)
        service_payments = Payment.objects.filter(type='SERVICE', status='PAID')
        total_revenue = sum(p.amount for p in service_payments)

        # By service type
        by_type = {}
        for service_type, label in ServiceRequest.SERVICE_TYPES:
            count = ServiceRequest.objects.filter(service_type=service_type).count()
            if count > 0:
                by_type[label] = count

        # Recent requests
        recent = ServiceRequest.objects.all().order_by('-created_at')[:10]

        return Response({
            'stats': {
                'total': total,
                'pending': pending,
                'in_progress': in_progress,
                'completed': completed,
                'total_revenue': float(total_revenue),
            },
            'by_type': by_type,
            'recent': ServiceRequestSerializer(recent, many=True).data
        })
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from django.utils import timezone
from .models import Complaint, ComplaintTimeline
from .serializers import (
    ComplaintSerializer,
    ComplaintCreateSerializer,
    ComplaintUpdateSerializer
)


class GuestComplaintListView(APIView):
    """
    GET /api/v1/complaints/guest/ - List guest's complaints
    POST /api/v1/complaints/guest/ - Submit new complaint
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get all complaints for the authenticated guest"""
        complaints = Complaint.objects.filter(user=request.user)
        serializer = ComplaintSerializer(complaints, many=True)
        return Response(serializer.data)

    def post(self, request):
        """Submit a new complaint"""
        serializer = ComplaintCreateSerializer(
            data=request.data,
            context={'request': request}
        )
        if serializer.is_valid():
            complaint = serializer.save()

            # Optional: Send notification to staff
            # You can add email notification here

            return Response(
                ComplaintSerializer(complaint).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class GuestComplaintDetailView(APIView):
    """
    GET /api/v1/complaints/guest/<id>/ - Get specific complaint
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, complaint_id):
        """Get a specific complaint by ID"""
        try:
            complaint = Complaint.objects.get(id=complaint_id, user=request.user)
        except Complaint.DoesNotExist:
            return Response(
                {'error': 'Complaint not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = ComplaintSerializer(complaint)
        return Response(serializer.data)


class StaffComplaintListView(APIView):
    """
    GET /api/v1/complaints/staff/ - List all complaints (staff only)
    Supports filtering by status and search
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Check if user is staff (admin or receptionist)
        if request.user.role not in ['ADMIN', 'RECEPTIONIST']:
            return Response(
                {'error': 'Access denied. Staff only.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Get query parameters
        status_filter = request.query_params.get('status', '')
        search = request.query_params.get('search', '')

        complaints = Complaint.objects.all()

        # Apply filters
        if status_filter:
            complaints = complaints.filter(status=status_filter)

        if search:
            complaints = complaints.filter(
                Q(title__icontains=search) |
                Q(description__icontains=search) |
                Q(guest_name__icontains=search) |
                Q(room_number__icontains=search) |
                Q(id__icontains=search)
            )

        serializer = ComplaintSerializer(complaints, many=True)

        # Add statistics
        stats = {
            'total': complaints.count(),
            'pending': Complaint.objects.filter(status='PENDING').count(),
            'in_progress': Complaint.objects.filter(status='IN_PROGRESS').count(),
            'resolved': Complaint.objects.filter(status='RESOLVED').count(),
            'closed': Complaint.objects.filter(status='CLOSED').count(),
        }

        return Response({
            'complaints': serializer.data,
            'stats': stats
        })


class StaffComplaintUpdateView(APIView):
    """
    PUT /api/v1/complaints/staff/<id>/ - Update complaint status and response
    """

    permission_classes = [IsAuthenticated]

    def put(self, request, complaint_id):
        # Check if user is staff
        if request.user.role not in ['ADMIN', 'RECEPTIONIST']:
            return Response(
                {'error': 'Access denied. Staff only.'},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            complaint = Complaint.objects.get(id=complaint_id)
        except Complaint.DoesNotExist:
            return Response(
                {'error': 'Complaint not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = ComplaintUpdateSerializer(
            complaint,
            data=request.data,
            partial=True,
            context={'request': request}
        )

        if serializer.is_valid():
            updated_complaint = serializer.save()

            # If status is RESOLVED or CLOSED, set resolved_by and resolved_at
            if updated_complaint.status in ['RESOLVED', 'CLOSED']:
                updated_complaint.resolved_by = request.user
                updated_complaint.resolved_at = timezone.now()
                updated_complaint.save()

            return Response(ComplaintSerializer(updated_complaint).data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
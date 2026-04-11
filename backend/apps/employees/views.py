# apps/employees/views.py
import logging
from django.core.cache import cache
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.db import transaction

from .models import EmployeeInformation
from .serializers import EmployeeInformationSerializer, EmployeeListSerializer
from apps.users.models import User

logger = logging.getLogger(__name__)


def is_admin(user):
    return user.is_authenticated and getattr(user, 'role', None) == 'ADMIN'


def admin_only(view_func):
    """Decorator — Admin access only."""

    def wrapper(self, request, *args, **kwargs):
        if not is_admin(request.user):
            return Response(
                {"error": "Forbidden. Admin access required."},
                status=403,
            )
        return view_func(self, request, *args, **kwargs)

    return wrapper


class EmployeeListView(APIView):
    """GET /api/v1/employees/ - Get all employees"""

    @admin_only
    def get(self, request):
        cache_key = "employees_all"
        cached = cache.get(cache_key)
        if cached:
            return Response(cached)

        employees = EmployeeInformation.objects.select_related('user').all().order_by('-created_at')
        serializer = EmployeeListSerializer(employees, many=True)

        cache.set(cache_key, serializer.data, timeout=60)
        return Response(serializer.data)


class EmployeeDetailView(APIView):
    """GET /api/v1/employees/<id>/ - Get employee details"""

    @admin_only
    def get(self, request, employee_id):
        cache_key = f"employee_{employee_id}"
        cached = cache.get(cache_key)
        if cached:
            return Response(cached)

        try:
            employee = EmployeeInformation.objects.select_related('user').get(id=employee_id)
        except EmployeeInformation.DoesNotExist:
            return Response({"error": "Employee not found"}, status=404)

        serializer = EmployeeInformationSerializer(employee)
        cache.set(cache_key, serializer.data, timeout=60)
        return Response(serializer.data)


class EmployeeCreateView(APIView):
    """POST /api/v1/employees/create/ - Create new employee"""

    @admin_only
    @transaction.atomic
    def post(self, request):
        # Get employee data
        first_name = request.data.get('firstName')
        last_name = request.data.get('lastName')
        email = request.data.get('email')
        contact_number = request.data.get('contactNumber')
        department = request.data.get('department')
        position = request.data.get('position')
        hire_date = request.data.get('hireDate')

        # Validation
        if not first_name or not last_name:
            return Response({"error": "First name and last name are required"}, status=400)

        if not email:
            return Response({"error": "Email is required"}, status=400)

        # Check if user already exists
        user = None
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Create new user if doesn't exist
            username = email.split('@')[0]
            # Ensure unique username
            base_username = username
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f"{base_username}{counter}"
                counter += 1

            user = User.objects.create_user(
                username=username,
                email=email,
                password=request.data.get('password', 'password123'),
                role=position.upper() if position else 'STAFF',
                is_active=True,
            )

        # Generate employee ID
        import uuid
        employee_id = request.data.get('employeeId') or f"EMP{user.id:06d}"

        # Create employee information
        employee = EmployeeInformation.objects.create(
            user=user,
            first_name=first_name,
            last_name=last_name,
            middle_name=request.data.get('middleName', ''),
            gender=request.data.get('gender'),
            date_of_birth=request.data.get('dateOfBirth') or '2000-01-01',
            contact_number=contact_number,
            emergency_contact=request.data.get('emergencyContact'),
            emergency_phone=request.data.get('emergencyPhone'),
            home_address=request.data.get('homeAddress', ''),
            email=email,
            employee_id=employee_id,
            department=department,
            position=position,
            employment_type=request.data.get('employmentType', 'FULL_TIME'),
            salary=request.data.get('salary'),
            hourly_rate=request.data.get('hourlyRate'),
            hire_date=hire_date or timezone.now().date(),
            skills=request.data.get('skills'),
            certifications=request.data.get('certifications'),
            education=request.data.get('education'),
            sss_number=request.data.get('sssNumber'),
            philhealth_number=request.data.get('philhealthNumber'),
            pagibig_number=request.data.get('pagibigNumber'),
            tin_number=request.data.get('tinNumber'),
        )

        # Clear cache
        cache.delete("employees_all")

        serializer = EmployeeInformationSerializer(employee)
        return Response(serializer.data, status=201)


class EmployeeUpdateView(APIView):
    """PUT /api/v1/employees/<id>/update/ - Update employee"""

    @admin_only
    @transaction.atomic
    def put(self, request, employee_id):
        try:
            employee = EmployeeInformation.objects.get(id=employee_id)
        except EmployeeInformation.DoesNotExist:
            return Response({"error": "Employee not found"}, status=404)

        # Update employee fields
        employee.first_name = request.data.get('firstName', employee.first_name)
        employee.last_name = request.data.get('lastName', employee.last_name)
        employee.middle_name = request.data.get('middleName', employee.middle_name)
        employee.gender = request.data.get('gender', employee.gender)
        employee.date_of_birth = request.data.get('dateOfBirth', employee.date_of_birth)
        employee.contact_number = request.data.get('contactNumber', employee.contact_number)
        employee.emergency_contact = request.data.get('emergencyContact', employee.emergency_contact)
        employee.emergency_phone = request.data.get('emergencyPhone', employee.emergency_phone)
        employee.home_address = request.data.get('homeAddress', employee.home_address)
        employee.email = request.data.get('email', employee.email)
        employee.department = request.data.get('department', employee.department)
        employee.position = request.data.get('position', employee.position)
        employee.employment_type = request.data.get('employmentType', employee.employment_type)
        employee.salary = request.data.get('salary', employee.salary)
        employee.hourly_rate = request.data.get('hourlyRate', employee.hourly_rate)
        employee.skills = request.data.get('skills', employee.skills)
        employee.certifications = request.data.get('certifications', employee.certifications)
        employee.education = request.data.get('education', employee.education)
        employee.sss_number = request.data.get('sssNumber', employee.sss_number)
        employee.philhealth_number = request.data.get('philhealthNumber', employee.philhealth_number)
        employee.pagibig_number = request.data.get('pagibigNumber', employee.pagibig_number)
        employee.tin_number = request.data.get('tinNumber', employee.tin_number)
        employee.is_active = request.data.get('isActive', employee.is_active)
        employee.is_on_duty = request.data.get('isOnDuty', employee.is_on_duty)
        employee.save()

        # Update user role if needed
        if request.data.get('position'):
            employee.user.role = request.data.get('position').upper()
            employee.user.save()

        # Clear cache
        cache.delete("employees_all")
        cache.delete(f"employee_{employee_id}")

        serializer = EmployeeInformationSerializer(employee)
        return Response(serializer.data)


class EmployeeDeleteView(APIView):
    """DELETE /api/v1/employees/<id>/delete/ - Delete employee"""

    @admin_only
    @transaction.atomic
    def delete(self, request, employee_id):
        try:
            employee = EmployeeInformation.objects.get(id=employee_id)
        except EmployeeInformation.DoesNotExist:
            return Response({"error": "Employee not found"}, status=404)

        user = employee.user
        employee.delete()

        # Optionally delete the user account too
        if request.data.get('deleteUser', False):
            user.delete()

        # Clear cache
        cache.delete("employees_all")
        cache.delete(f"employee_{employee_id}")

        return Response({"message": "Employee deleted successfully"})


class EmployeeToggleStatusView(APIView):
    """PATCH /api/v1/employees/<id>/toggle-status/ - Toggle employee active status"""

    @admin_only
    def patch(self, request, employee_id):
        try:
            employee = EmployeeInformation.objects.get(id=employee_id)
        except EmployeeInformation.DoesNotExist:
            return Response({"error": "Employee not found"}, status=404)

        employee.is_active = not employee.is_active
        employee.save()

        # Also update user active status
        employee.user.is_active = employee.is_active
        employee.user.save()

        # Clear cache
        cache.delete("employees_all")
        cache.delete(f"employee_{employee_id}")

        status_text = "activated" if employee.is_active else "deactivated"
        return Response({
            "message": f"Employee {status_text} successfully",
            "isActive": employee.is_active
        })


class EmployeeByDepartmentView(APIView):
    """GET /api/v1/employees/department/<department>/ - Get employees by department"""

    @admin_only
    def get(self, request, department):
        cache_key = f"employees_department_{department}"
        cached = cache.get(cache_key)
        if cached:
            return Response(cached)

        employees = EmployeeInformation.objects.filter(department=department).select_related('user')
        serializer = EmployeeListSerializer(employees, many=True)

        cache.set(cache_key, serializer.data, timeout=60)
        return Response(serializer.data)


class EmployeeByPositionView(APIView):
    """GET /api/v1/employees/position/<position>/ - Get employees by position"""

    @admin_only
    def get(self, request, position):
        cache_key = f"employees_position_{position}"
        cached = cache.get(cache_key)
        if cached:
            return Response(cached)

        employees = EmployeeInformation.objects.filter(position=position).select_related('user')
        serializer = EmployeeListSerializer(employees, many=True)

        cache.set(cache_key, serializer.data, timeout=60)
        return Response(serializer.data)


class MyEmployeeProfileView(APIView):
    """GET/PUT /api/v1/employees/my-profile/ - Get/Update logged-in employee's profile"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            employee = EmployeeInformation.objects.get(user=request.user)
        except EmployeeInformation.DoesNotExist:
            return Response({"error": "Employee profile not found"}, status=404)

        serializer = EmployeeInformationSerializer(employee)
        return Response(serializer.data)

    def put(self, request):
        try:
            employee = EmployeeInformation.objects.get(user=request.user)
        except EmployeeInformation.DoesNotExist:
            return Response({"error": "Employee profile not found"}, status=404)

        # Update allowed fields
        employee.contact_number = request.data.get('contactNumber', employee.contact_number)
        employee.emergency_contact = request.data.get('emergencyContact', employee.emergency_contact)
        employee.emergency_phone = request.data.get('emergencyPhone', employee.emergency_phone)
        employee.home_address = request.data.get('homeAddress', employee.home_address)
        employee.skills = request.data.get('skills', employee.skills)
        employee.save()

        serializer = EmployeeInformationSerializer(employee)
        return Response(serializer.data)
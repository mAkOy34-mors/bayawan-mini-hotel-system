# apps/employees/serializers.py
from rest_framework import serializers
from .models import EmployeeInformation


class EmployeeInformationSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()
    department_display = serializers.CharField(source='get_department_display', read_only=True)
    position_display = serializers.CharField(source='get_position_display', read_only=True)
    employment_type_display = serializers.CharField(source='get_employment_type_display', read_only=True)

    class Meta:
        model = EmployeeInformation
        fields = [
            'id', 'first_name', 'last_name', 'middle_name', 'full_name',
            'gender', 'date_of_birth', 'contact_number', 'emergency_contact',
            'emergency_phone', 'home_address', 'email', 'employee_id',
            'department', 'department_display', 'position', 'position_display',
            'employment_type', 'employment_type_display', 'salary', 'hourly_rate',
            'hire_date', 'regularized_date', 'termination_date', 'skills',
            'certifications', 'education', 'is_active', 'is_on_duty',
            'sss_number', 'philhealth_number', 'pagibig_number', 'tin_number',
            'user', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class EmployeeListSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()
    department_display = serializers.CharField(source='get_department_display', read_only=True)
    position_display = serializers.CharField(source='get_position_display', read_only=True)

    class Meta:
        model = EmployeeInformation
        fields = [
            'id', 'first_name', 'last_name', 'full_name', 'employee_id',
            'department', 'department_display', 'position', 'position_display',
            'contact_number', 'email', 'is_active', 'is_on_duty', 'hire_date'
        ]
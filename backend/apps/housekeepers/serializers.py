# apps/housekeepers/serializers.py
from rest_framework import serializers
from .models import CleaningTask, CleaningChecklist, SupplyRequest, RoomStatusLog
from apps.employees.models import EmployeeInformation


class CleaningTaskSerializer(serializers.ModelSerializer):
    task_type_display = serializers.CharField(source='get_task_type_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    status_display = serializers.CharField(source='get_task_status_display', read_only=True)
    assigned_to_name = serializers.SerializerMethodField()
    assigned_to_employee_id = serializers.SerializerMethodField()
    assigned_by_name = serializers.SerializerMethodField()
    time_taken = serializers.SerializerMethodField()
    room_number_display = serializers.SerializerMethodField()

    class Meta:
        model = CleaningTask
        fields = [
            'id', 'title', 'description', 'task_type', 'task_type_display',
            'priority', 'priority_display', 'status', 'status_display',
            'room', 'room_number', 'room_number_display', 'booking',
            'assigned_to_employee', 'assigned_to_name', 'assigned_to_employee_id',
            'assigned_by', 'assigned_by_name', 'created_at', 'started_at',
            'completed_at', 'verified_at', 'notes', 'before_image', 'after_image',
            'time_taken'
        ]

    def get_assigned_to_name(self, obj):
        if obj.assigned_to_employee:
            return obj.assigned_to_employee.full_name
        return None

    def get_assigned_to_employee_id(self, obj):
        if obj.assigned_to_employee:
            return obj.assigned_to_employee.id
        return None

    def get_assigned_by_name(self, obj):
        if obj.assigned_by:
            return obj.assigned_by.username
        return None

    def get_time_taken(self, obj):
        if obj.started_at and obj.completed_at:
            delta = obj.completed_at - obj.started_at
            return int(delta.total_seconds() / 60)
        return None

    def get_room_number_display(self, obj):
        if obj.room:
            return obj.room.room_number
        return obj.room_number


class CleaningChecklistSerializer(serializers.ModelSerializer):
    class Meta:
        model = CleaningChecklist
        fields = ['id', 'item_name', 'is_completed', 'completed_at', 'notes']


class SupplyRequestSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    housekeeper_name = serializers.SerializerMethodField()
    housekeeper_id = serializers.SerializerMethodField()

    class Meta:
        model = SupplyRequest
        fields = [
            'id', 'housekeeper_employee', 'housekeeper_name', 'housekeeper_id',
            'item_name', 'quantity', 'reason', 'status', 'status_display',
            'approved_by', 'created_at', 'fulfilled_at'
        ]

    def get_housekeeper_name(self, obj):
        if obj.housekeeper_employee:
            return obj.housekeeper_employee.full_name
        return None

    def get_housekeeper_id(self, obj):
        if obj.housekeeper_employee:
            return obj.housekeeper_employee.id
        return None


class RoomStatusLogSerializer(serializers.ModelSerializer):
    action_display = serializers.CharField(source='get_action_display', read_only=True)
    performed_by_name = serializers.SerializerMethodField()
    performed_by_employee_id = serializers.SerializerMethodField()

    class Meta:
        model = RoomStatusLog
        fields = [
            'id', 'room', 'previous_status', 'new_status', 'action',
            'action_display', 'performed_by_employee', 'performed_by_name',
            'performed_by_employee_id', 'notes', 'created_at'
        ]

    def get_performed_by_name(self, obj):
        if obj.performed_by_employee:
            return obj.performed_by_employee.full_name
        return None

    def get_performed_by_employee_id(self, obj):
        if obj.performed_by_employee:
            return obj.performed_by_employee.id
        return None
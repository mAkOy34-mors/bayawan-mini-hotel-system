# apps/housekeepers/serializers.py
from rest_framework import serializers
from .models import CleaningTask, CleaningChecklist, SupplyRequest, RoomStatusLog, RoomIssue
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
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)  # ← ADD THIS
    housekeeper_name = serializers.SerializerMethodField()
    housekeeper_id = serializers.SerializerMethodField()

    class Meta:
        model = SupplyRequest
        fields = [
            'id',
            'housekeeper_employee',
            'housekeeper_name',
            'housekeeper_id',
            'item_name',
            'quantity',
            'unit',                    # ← ADD THIS
            'reason',
            'priority',                # ← ADD THIS
            'priority_display',        # ← ADD THIS
            'status',
            'status_display',
            'approved_by',
            'rejection_reason',        # ← ADD THIS
            'created_at',
            'fulfilled_at'
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


# apps/housekeepers/serializers.py - Update RoomIssueSerializer

class RoomIssueSerializer(serializers.ModelSerializer):
    issue_type_display = serializers.CharField(source='get_issue_type_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    reported_by_name = serializers.SerializerMethodField()
    assigned_to_name = serializers.SerializerMethodField()  # This will now get from EmployeeInformation

    class Meta:
        model = RoomIssue
        fields = [
            'id', 'issue_type', 'issue_type_display', 'title', 'description',
            'priority', 'priority_display', 'status', 'status_display',
            'room_number', 'reported_by_employee', 'reported_by_name',
            'assigned_to_employee', 'assigned_to_name', 'notes', 'resolution_notes',
            'rejection_reason', 'before_image', 'after_image',
            'created_at', 'started_at', 'completed_at'
        ]

    def get_reported_by_name(self, obj):
        if obj.reported_by_employee:
            return obj.reported_by_employee.full_name
        return None

    def get_assigned_to_name(self, obj):
        if obj.assigned_to_employee:
            return obj.assigned_to_employee.full_name
        return None
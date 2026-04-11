# apps/housekeepers/serializers.py
from rest_framework import serializers
from .models import Housekeeper, CleaningTask, CleaningChecklist, SupplyRequest, RoomStatusLog


class HousekeeperSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    shift_display = serializers.CharField(source='get_shift_display', read_only=True)

    class Meta:
        model = Housekeeper
        fields = [
            'id', 'user', 'first_name', 'last_name', 'full_name', 'employee_id',
            'phone_number', 'email', 'hire_date', 'shift', 'shift_display',
            'status', 'status_display', 'skills', 'specialization',
            'tasks_completed', 'rating', 'created_at', 'updated_at'
        ]


class CleaningTaskSerializer(serializers.ModelSerializer):
    task_type_display = serializers.CharField(source='get_task_type_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    status_display = serializers.CharField(source='get_task_status_display', read_only=True)
    assigned_to_name = serializers.SerializerMethodField()
    assigned_by_name = serializers.SerializerMethodField()
    time_taken = serializers.SerializerMethodField()

    class Meta:
        model = CleaningTask
        fields = [
            'id', 'title', 'description', 'task_type', 'task_type_display',
            'priority', 'priority_display', 'status', 'status_display',
            'room', 'room_number', 'booking', 'assigned_to', 'assigned_to_name',
            'assigned_by', 'assigned_by_name', 'created_at', 'started_at',
            'completed_at', 'verified_at', 'notes', 'before_image', 'after_image',
            'time_taken'
        ]

    def get_assigned_to_name(self, obj):
        if obj.assigned_to:
            return obj.assigned_to.full_name
        return None

    def get_assigned_by_name(self, obj):
        if obj.assigned_by:
            return obj.assigned_by.username
        return None

    def get_time_taken(self, obj):
        if obj.started_at and obj.completed_at:
            delta = obj.completed_at - obj.started_at
            return int(delta.total_seconds() / 60)  # minutes
        return None


class CleaningChecklistSerializer(serializers.ModelSerializer):
    class Meta:
        model = CleaningChecklist
        fields = ['id', 'item_name', 'is_completed', 'completed_at', 'notes']


class SupplyRequestSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    housekeeper_name = serializers.SerializerMethodField()

    class Meta:
        model = SupplyRequest
        fields = [
            'id', 'housekeeper', 'housekeeper_name', 'item_name', 'quantity',
            'reason', 'status', 'status_display', 'approved_by', 'created_at', 'fulfilled_at'
        ]

    def get_housekeeper_name(self, obj):
        return obj.housekeeper.full_name


class RoomStatusLogSerializer(serializers.ModelSerializer):
    action_display = serializers.CharField(source='get_action_display', read_only=True)
    performed_by_name = serializers.SerializerMethodField()

    class Meta:
        model = RoomStatusLog
        fields = [
            'id', 'room', 'previous_status', 'new_status', 'action',
            'action_display', 'performed_by', 'performed_by_name', 'notes', 'created_at'
        ]

    def get_performed_by_name(self, obj):
        if obj.performed_by:
            return obj.performed_by.full_name
        return None
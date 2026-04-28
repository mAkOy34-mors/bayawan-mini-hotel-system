# apps/staff/serializers.py
from rest_framework import serializers
from .models import Task, TaskHistory, MaintenanceRequest
from apps.rooms.models import Room
from apps.bookings.models import Booking


class TaskSerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.SerializerMethodField()
    assigned_by_name = serializers.SerializerMethodField()
    room_number_display = serializers.SerializerMethodField()
    complaint_id = serializers.IntegerField(source='complaint.id', read_only=True)
    complaint_status = serializers.CharField(source='complaint.status', read_only=True)
    complaint_title = serializers.CharField(source='complaint.title', read_only=True)

    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description', 'task_type', 'priority', 'status',
            'room', 'room_number', 'room_number_display', 'booking',
            'assigned_to', 'assigned_to_name', 'assigned_by', 'assigned_by_name',
            'created_at', 'updated_at', 'started_at', 'completed_at', 'note',
            'complaint_id', 'complaint_status', 'complaint_title',
            'room_issue_id', 'service_request_id',
        ]

    def get_assigned_to_name(self, obj):
        if obj.assigned_to:
            return obj.assigned_to.username
        return None

    def get_assigned_by_name(self, obj):
        if obj.assigned_by:
            return obj.assigned_by.username
        return None

    def get_room_number_display(self, obj):
        if obj.room:
            return obj.room.room_number
        return obj.room_number


class TaskHistorySerializer(serializers.ModelSerializer):
    changed_by_name = serializers.SerializerMethodField()

    class Meta:
        model = TaskHistory
        fields = ['id', 'previous_status', 'new_status', 'changed_by_name', 'note', 'changed_at']

    def get_changed_by_name(self, obj):
        if obj.changed_by:
            return obj.changed_by.username
        return None


class CreateTaskSerializer(serializers.ModelSerializer):
    complaint_id = serializers.IntegerField(required=False, allow_null=True)
    assigned_to = serializers.IntegerField(required=False, allow_null=True)
    room = serializers.PrimaryKeyRelatedField(  # ← add this explicitly
        queryset=Room.objects.all(),
        required=False,
        allow_null=True
    )

    class Meta:
        model = Task
        fields = [
            'title', 'description', 'task_type', 'priority', 'room', 'room_number',
            'assigned_to', 'note', 'complaint_id'
        ]

    def validate_title(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Title is required")
        return value.strip()

    def validate_description(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Description is required")
        return value.strip()

    def validate_task_type(self, value):
        valid_types = ['MAINTENANCE', 'DELIVERY', 'ASSISTANCE', 'EMERGENCY', 'CLEANING', 'REPAIR', 'SECURITY', 'HOUSEKEEPING']
        if value:
            upper_value = value.upper()
            if upper_value in valid_types:
                return upper_value
        return 'ASSISTANCE'

    def validate_priority(self, value):
        valid_priorities = ['HIGH', 'MEDIUM', 'LOW']
        if value:
            upper_value = value.upper()
            if upper_value in valid_priorities:
                return upper_value
        return 'MEDIUM'

    def validate_assigned_to(self, value):
        if value:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            if not User.objects.filter(id=value).exists():
                return None
        return value


# apps/staff/serializers.py - Add these serializers

class MaintenanceRequestSerializer(serializers.ModelSerializer):
    maintenance_type_display = serializers.CharField(source='get_maintenance_type_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    requested_by_name = serializers.SerializerMethodField()
    assigned_to_name = serializers.SerializerMethodField()

    class Meta:
        model = MaintenanceRequest
        fields = [
            'id', 'maintenance_type', 'maintenance_type_display', 'title', 'description',
            'priority', 'priority_display', 'status', 'status_display',
            'room_number', 'requested_by', 'requested_by_name',
            'assigned_to', 'assigned_to_name', 'notes', 'resolution_notes',
            'rejection_reason', 'created_at', 'updated_at', 'started_at', 'completed_at'
        ]

    def get_requested_by_name(self, obj):
        if obj.requested_by:
            return obj.requested_by.username
        return None

    def get_assigned_to_name(self, obj):
        if obj.assigned_to:
            return obj.assigned_to.username
        return None


class CreateMaintenanceRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = MaintenanceRequest
        fields = [
            'maintenance_type', 'title', 'description', 'priority',
            'room_number', 'notes'
        ]

    def validate_title(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Title is required")
        return value.strip()

    def validate_description(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Description is required")
        return value.strip()

    def validate_maintenance_type(self, value):
        valid_types = ['ELECTRICAL', 'PLUMBING', 'HVAC', 'DOOR_LOCK',
                       'TV_ELECTRONICS', 'FURNITURE', 'TOOLS_REQUEST', 'OTHER']
        if value and value.upper() in valid_types:
            return value.upper()
        return 'OTHER'
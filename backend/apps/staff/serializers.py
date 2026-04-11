# apps/staff/serializers.py
from rest_framework import serializers
from .models import Task, TaskHistory, StaffProfile
from apps.rooms.models import Room
from apps.bookings.models import Booking


class TaskSerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.SerializerMethodField()
    assigned_by_name = serializers.SerializerMethodField()
    room_number_display = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description', 'task_type', 'priority', 'status',
            'room', 'room_number', 'room_number_display', 'booking',
            'assigned_to', 'assigned_to_name', 'assigned_by', 'assigned_by_name',
            'created_at', 'updated_at', 'started_at', 'completed_at', 'note'
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


class StaffProfileSerializer(serializers.ModelSerializer):
    username = serializers.SerializerMethodField()
    email = serializers.SerializerMethodField()

    class Meta:
        model = StaffProfile
        fields = [
            'id', 'user', 'username', 'email', 'department', 'employee_id',
            'phone_number', 'is_on_duty', 'skills', 'created_at'
        ]

    def get_username(self, obj):
        return obj.user.username

    def get_email(self, obj):
        return obj.user.email


class CreateTaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = [
            'title', 'description', 'task_type', 'priority', 'room', 'room_number',
            'assigned_to', 'note'
        ]
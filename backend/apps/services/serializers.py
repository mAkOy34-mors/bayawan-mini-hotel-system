# apps/services/serializers.py
from rest_framework import serializers
from .models import ServiceRequest, ServicePayment


class ServiceRequestSerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()
    service_type_label = serializers.CharField(source='get_service_type_display', read_only=True)
    status_label = serializers.CharField(source='get_status_display', read_only=True)
    priority_label = serializers.CharField(source='get_priority_display', read_only=True)

    class Meta:
        model = ServiceRequest
        fields = [
            'id', 'guest_name', 'guest_email', 'room_number',
            'service_type', 'service_type_label', 'description',
            'priority', 'priority_label', 'status', 'status_label',
            'assigned_to', 'assigned_to_name', 'created_by', 'created_by_name',
            'created_at', 'updated_at', 'started_at', 'completed_at',
            'service_charge', 'is_paid'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'started_at', 'completed_at']

    def get_assigned_to_name(self, obj):
        return obj.assigned_to.username if obj.assigned_to else None

    def get_created_by_name(self, obj):
        return obj.created_by.username if obj.created_by else None


class CreateServiceRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceRequest
        fields = ['service_type', 'description', 'room_number', 'priority']

    def create(self, validated_data):
        request = self.context.get('request')
        user = request.user

        # Fix: Use username or email instead of get_full_name()
        guest_name = user.username or user.email.split('@')[0] if user.email else 'Guest'

        validated_data['guest_name'] = guest_name
        validated_data['guest_email'] = user.email
        validated_data['created_by'] = user

        # Set default service charges based on service type
        service_charges = {
            'CLEANING': 0,
            'LAUNDRY': 150,
            'DELIVERY': 50,
            'MAINTENANCE': 0,
            'EXTRA_PILLOWS': 0,
            'EXTRA_TOWELS': 0,
            'MINI_BAR': 100,
            'TECH_SUPPORT': 0,
            'OTHER': 0,
        }
        validated_data['service_charge'] = service_charges.get(validated_data.get('service_type'), 0)

        return super().create(validated_data)


class UpdateServiceRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceRequest
        fields = ['status', 'assigned_to', 'priority']


class ServicePaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServicePayment
        fields = ['id', 'amount', 'payment_method', 'paid_at', 'receipt_number']
        read_only_fields = ['id', 'paid_at', 'receipt_number']
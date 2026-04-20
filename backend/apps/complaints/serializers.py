# apps/complaints/serializers.py
from rest_framework import serializers
from .models import Complaint, ComplaintTimeline
from apps.guests.models import GuestInformation  # Add this import


class ComplaintTimelineSerializer(serializers.ModelSerializer):
    class Meta:
        model = ComplaintTimeline
        fields = ['id', 'status', 'note', 'created_at']


class ComplaintSerializer(serializers.ModelSerializer):
    timeline = ComplaintTimelineSerializer(many=True, read_only=True)

    class Meta:
        model = Complaint
        fields = [
            'id', 'complaint_type', 'title', 'description',
            'guest_name', 'guest_email', 'room_number', 'preferred_contact',
            'status', 'response', 'created_at', 'updated_at', 'resolved_at',
            'timeline',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'status', 'response', 'resolved_at']


class ComplaintCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Complaint
        fields = ['complaint_type', 'title', 'description', 'room_number', 'preferred_contact']

    def create(self, validated_data):
        request = self.context.get('request')
        user = request.user

        # Try to get guest information from GuestInformation model
        guest_name = None

        try:
            # Check if guest has GuestInformation record
            guest_info = GuestInformation.objects.filter(user=user).first()
            if guest_info:
                # Build full name from first_name and last_name
                first = guest_info.first_name or ''
                last = guest_info.last_name or ''
                if first or last:
                    guest_name = f"{first} {last}".strip()
        except Exception as e:
            print(f"Error fetching guest info: {e}")

        # Fallback to username or email if no GuestInformation
        if not guest_name:
            guest_name = user.username or (user.email.split('@')[0] if user.email else 'Guest')

        validated_data['user'] = user
        validated_data['guest_name'] = guest_name
        validated_data['guest_email'] = user.email

        # Handle room_number - ensure it's not too long
        if 'room_number' in validated_data and validated_data['room_number']:
            # Truncate to max 10 characters if needed
            if len(validated_data['room_number']) > 10:
                validated_data['room_number'] = validated_data['room_number'][:10]

        complaint = super().create(validated_data)

        # Create timeline entry
        ComplaintTimeline.objects.create(
            complaint=complaint,
            status='PENDING',
            note='Complaint submitted',
            created_by=user
        )

        return complaint


class ComplaintUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Complaint
        fields = ['status', 'response']

    def update(self, instance, validated_data):
        old_status = instance.status
        new_status = validated_data.get('status', instance.status)

        instance = super().update(instance, validated_data)

        # Add timeline entry if status changed
        if old_status != new_status:
            ComplaintTimeline.objects.create(
                complaint=instance,
                status=new_status,
                note=f"Status changed from {old_status} to {new_status}",
                created_by=self.context.get('request').user
            )

        return instance
# apps/feedback/serializers.py
from rest_framework import serializers
from .models import Feedback
from apps.bookings.models import Booking


class FeedbackSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    responded_by_name = serializers.CharField(source='responded_by.username', read_only=True, default='')
    responded_by_email = serializers.CharField(source='responded_by.email', read_only=True, default='')
    room_number = serializers.CharField(source='room.room_number', read_only=True)
    booking_reference = serializers.CharField(source='booking.booking_reference', read_only=True)
    room_type = serializers.CharField(source='room.type', read_only=True, default='')
    room_name = serializers.CharField(source='room.name', read_only=True, default='')

    class Meta:
        model = Feedback
        fields = [
            'id', 'booking', 'booking_reference', 'user', 'user_name',
            'room', 'room_number', 'room_type', 'room_name', 'overall_rating',
            'cleanliness_rating', 'service_rating', 'comfort_rating', 'value_rating',
            'comment', 'likes', 'improvements', 'created_at', 'average_rating',
            'response', 'is_responded', 'responded_by', 'responded_by_name', 'responded_by_email', 'responded_at'
        ]
        read_only_fields = ['id', 'created_at', 'average_rating']


class CreateFeedbackSerializer(serializers.ModelSerializer):
    booking = serializers.PrimaryKeyRelatedField(
        queryset=Booking.objects.all(),
        help_text="Booking ID"
    )

    class Meta:
        model = Feedback
        fields = [
            'booking', 'overall_rating', 'cleanliness_rating',
            'service_rating', 'comfort_rating', 'value_rating',
            'comment', 'likes', 'improvements'
        ]

    def validate_booking(self, value):
        # Get user from context (passed from view)
        request = self.context.get('request')
        if not request or not request.user:
            raise serializers.ValidationError("User not authenticated")

        user = request.user

        # Check if booking belongs to the user
        if value.user != user:
            raise serializers.ValidationError("This booking does not belong to you")

        # Check if booking is completed
        if value.status != 'COMPLETED':
            raise serializers.ValidationError("Can only rate completed bookings")

        # Check if feedback already exists
        if hasattr(value, 'feedback'):
            raise serializers.ValidationError("Feedback already submitted for this booking")

        return value

    def validate_overall_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5")
        return value
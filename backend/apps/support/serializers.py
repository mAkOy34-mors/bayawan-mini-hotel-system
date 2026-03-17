"""apps/support/serializers.py"""
from rest_framework import serializers
from .models import SupportTicket, TicketReply


class TicketReplySerializer(serializers.ModelSerializer):
    authorEmail = serializers.EmailField(source="author.email", read_only=True)
    isStaff     = serializers.BooleanField(source="is_staff", read_only=True)
    createdAt   = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model  = TicketReply
        fields = ["id", "message", "authorEmail", "isStaff", "createdAt"]


class SupportTicketSerializer(serializers.ModelSerializer):
    replies   = TicketReplySerializer(many=True, read_only=True)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)

    class Meta:
        model  = SupportTicket
        fields = ["id", "name", "email", "subject", "message", "status", "priority", "replies", "createdAt", "updatedAt"]
        read_only_fields = ["id", "status", "replies", "createdAt", "updatedAt"]


class CreateTicketSerializer(serializers.Serializer):
    name     = serializers.CharField(max_length=100, required=False, allow_blank=True)
    email    = serializers.EmailField()
    subject  = serializers.CharField(max_length=255)
    message  = serializers.CharField()
    priority = serializers.ChoiceField(choices=SupportTicket.Priority.choices, default="MEDIUM")


class ReplyTicketSerializer(serializers.Serializer):
    message = serializers.CharField()


class UpdateTicketStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=SupportTicket.Status.choices)

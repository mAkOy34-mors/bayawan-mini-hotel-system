"""apps/users/serializers.py"""

from rest_framework import serializers


# ── Request serializers ───────────────────────────────────────────────────────

class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(min_length=8, write_only=True)
    username = serializers.CharField(max_length=150, required=False, allow_blank=True)
    firstName = serializers.CharField(required=False, allow_blank=True)
    lastName = serializers.CharField(required=False, allow_blank=True)


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class VerifyOtpSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(min_length=6, max_length=6)


class ResendOtpSerializer(serializers.Serializer):
    email = serializers.EmailField()


# ── Response serializers ──────────────────────────────────────────────────────

class UserResponseSerializer(serializers.Serializer):
    """Shape returned inside login / register responses."""
    id = serializers.UUIDField()
    username = serializers.CharField()
    email = serializers.EmailField()
    role = serializers.CharField()

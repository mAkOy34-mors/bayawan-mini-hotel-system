"""apps/payments/serializers.py"""

from rest_framework import serializers
from .models import Payment


class PaymentSerializer(serializers.ModelSerializer):
    """Read serializer — camelCase output to match frontend."""

    paymongoLinkId = serializers.CharField(source="paymongo_link_id", read_only=True)
    checkoutUrl    = serializers.CharField(source="checkout_url",     read_only=True)
    bookingId      = serializers.IntegerField(source="booking_id",    read_only=True)
    paidAt         = serializers.DateTimeField(source="paid_at",      read_only=True)
    createdAt      = serializers.DateTimeField(source="created_at",   read_only=True)

    class Meta:
        model = Payment
        fields = [
            "id", "paymongoLinkId", "checkoutUrl", "email",
            "description", "amount", "status", "type",
            "bookingId", "paidAt", "createdAt",
        ]


class CreatePaymentLinkSerializer(serializers.Serializer):
    """Request body for POST /payments/create-link."""

    amount      = serializers.DecimalField(max_digits=10, decimal_places=2)
    description = serializers.CharField(max_length=500)
    remarks     = serializers.CharField(max_length=500, required=False, allow_blank=True)
    booking_id  = serializers.IntegerField(required=False, allow_null=True)
    type        = serializers.ChoiceField(choices=Payment.PaymentType.choices)

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than 0.")
        return value
"""apps/reports/serializers.py"""
from rest_framework import serializers
from .models import HotelSettings


class HotelSettingsSerializer(serializers.ModelSerializer):
    checkInTime  = serializers.TimeField(source="check_in_time")
    checkOutTime = serializers.TimeField(source="check_out_time")
    taxRate      = serializers.DecimalField(source="tax_rate", max_digits=5, decimal_places=2)
    hotelName    = serializers.CharField(source="hotel_name")
    pointsPerPhp = serializers.DecimalField(source="points_per_php", max_digits=6, decimal_places=2)
    updatedAt    = serializers.DateTimeField(source="updated_at", read_only=True)

    class Meta:
        model  = HotelSettings
        fields = [
            "id", "hotelName", "address", "phone", "email",
            "taxRate", "checkInTime", "checkOutTime",
            "currency", "pointsPerPhp", "updatedAt",
        ]
        read_only_fields = ["id", "updatedAt"]

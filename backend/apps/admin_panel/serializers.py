"""apps/admin_panel/serializers.py"""
from rest_framework import serializers
from apps.bookings.models import Booking
from apps.payments.models import Payment
from apps.rooms.models import Room
from apps.users.models import User


class AdminRoomSerializer(serializers.ModelSerializer):
    roomNumber    = serializers.CharField(source="room_number")
    roomType      = serializers.CharField(source="room_type")
    pricePerNight = serializers.DecimalField(source="price_per_night", max_digits=10, decimal_places=2)
    maxOccupancy  = serializers.IntegerField(source="max_occupancy")
    imageUrl      = serializers.CharField(source="image_url", required=False, allow_blank=True, allow_null=True)
    createdAt     = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model  = Room
        fields = [
            "id", "roomNumber", "roomType", "description",
            "pricePerNight", "maxOccupancy", "available",
            "amenities", "imageUrl", "createdAt",
        ]
        read_only_fields = ["id", "createdAt"]


class AdminBookingSerializer(serializers.ModelSerializer):
    guestEmail       = serializers.EmailField(source="user.email",           read_only=True)
    guestUsername    = serializers.CharField(source="user.username",          read_only=True)
    roomNumber       = serializers.CharField(source="room.room_number",       read_only=True)
    roomType         = serializers.CharField(source="room.room_type",         read_only=True)
    bookingReference = serializers.CharField(source="booking_reference",      read_only=True)
    checkInDate      = serializers.DateField(source="check_in_date",          read_only=True)
    checkOutDate     = serializers.DateField(source="check_out_date",         read_only=True)
    numberOfNights   = serializers.IntegerField(source="number_of_nights",    read_only=True)
    numberOfGuests   = serializers.IntegerField(source="number_of_guests",    read_only=True)
    totalAmount      = serializers.DecimalField(source="total_amount",        max_digits=10, decimal_places=2, read_only=True)
    depositAmount    = serializers.DecimalField(source="deposit_amount",      max_digits=10, decimal_places=2, read_only=True)
    remainingAmount  = serializers.DecimalField(source="remaining_amount",    max_digits=10, decimal_places=2, read_only=True)
    paymentStatus    = serializers.CharField(source="payment_status",         read_only=True)
    specialRequests  = serializers.CharField(source="special_requests",       read_only=True)
    createdAt        = serializers.DateTimeField(source="created_at",         read_only=True)

    class Meta:
        model  = Booking
        fields = [
            "id", "bookingReference", "guestEmail", "guestUsername",
            "roomNumber", "roomType", "checkInDate", "checkOutDate",
            "numberOfNights", "numberOfGuests", "totalAmount",
            "depositAmount", "remainingAmount", "status", "paymentStatus",
            "specialRequests", "createdAt",
        ]


class AdminGuestSerializer(serializers.ModelSerializer):
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    isActive  = serializers.BooleanField(source="is_active", read_only=True)

    class Meta:
        model  = User
        fields = ["id", "username", "email", "role", "isActive", "createdAt"]


class AdminPaymentSerializer(serializers.ModelSerializer):
    paymongoLinkId = serializers.CharField(source="paymongo_link_id", read_only=True)
    checkoutUrl    = serializers.CharField(source="checkout_url",     read_only=True)
    bookingId      = serializers.IntegerField(source="booking_id",    read_only=True)
    createdAt      = serializers.DateTimeField(source="created_at",   read_only=True)
    paidAt         = serializers.DateTimeField(source="paid_at",      read_only=True)

    class Meta:
        model  = Payment
        fields = [
            "id", "paymongoLinkId", "checkoutUrl", "email",
            "description", "amount", "status", "type",
            "bookingId", "createdAt", "paidAt",
        ]

"""apps/bookings/serializers.py — bulletproof version"""
from rest_framework import serializers
from .models import Booking, CancellationRequest


def safe_int(val):
    """Convert any value to int safely, handles tuples from choices."""
    if val is None:
        return 0
    if isinstance(val, (list, tuple)):
        return int(val[0])
    return int(val)


def safe_str(val):
    """Convert to string safely."""
    if val is None:
        return ""
    if isinstance(val, (list, tuple)):
        return str(val[0])
    return str(val)


class RoomInBookingSerializer(serializers.Serializer):
    id            = serializers.SerializerMethodField()
    roomNumber    = serializers.SerializerMethodField()
    roomType      = serializers.SerializerMethodField()
    description   = serializers.SerializerMethodField()
    pricePerNight = serializers.SerializerMethodField()
    maxOccupancy  = serializers.SerializerMethodField()
    available     = serializers.SerializerMethodField()
    amenities     = serializers.SerializerMethodField()
    imageUrl      = serializers.SerializerMethodField()

    def get_id(self, obj):           return safe_int(obj.id)
    def get_roomNumber(self, obj):   return safe_str(obj.room_number)
    def get_roomType(self, obj):     return safe_str(obj.room_type)
    def get_description(self, obj):  return obj.description or ""
    def get_pricePerNight(self, obj): return float(obj.price_per_night) if obj.price_per_night else 0
    def get_maxOccupancy(self, obj): return safe_int(obj.max_occupancy)
    def get_available(self, obj):    return bool(obj.available)
    def get_amenities(self, obj):    return obj.amenities or ""
    def get_imageUrl(self, obj):     return obj.image_url or ""


class BookingSerializer(serializers.Serializer):
    id               = serializers.SerializerMethodField()
    bookingReference = serializers.SerializerMethodField()
    room             = RoomInBookingSerializer(read_only=True)
    checkInDate      = serializers.SerializerMethodField()
    checkOutDate   = serializers.SerializerMethodField()
    numberOfGuests   = serializers.SerializerMethodField()
    numberOfNights   = serializers.SerializerMethodField()
    totalAmount      = serializers.SerializerMethodField()
    depositAmount    = serializers.SerializerMethodField()
    remainingAmount  = serializers.SerializerMethodField()
    status           = serializers.SerializerMethodField()
    paymentStatus    = serializers.SerializerMethodField()
    specialRequests  = serializers.SerializerMethodField()
    createdAt        = serializers.SerializerMethodField()


    def get_id(self, obj):               return safe_int(obj.id)
    def get_bookingReference(self, obj): return safe_str(obj.booking_reference)
    def get_checkInDate(self, obj):      return str(obj.check_in_date) if obj.check_in_date else None
    def get_checkOutDate(self, obj):     return str(obj.check_out_date) if obj.check_out_date else None
    def get_numberOfGuests(self, obj):   return safe_int(obj.number_of_guests)
    def get_numberOfNights(self, obj):   return safe_int(obj.number_of_nights)
    def get_totalAmount(self, obj):      return float(obj.total_amount) if obj.total_amount else 0
    def get_depositAmount(self, obj):    return float(obj.deposit_amount) if obj.deposit_amount else 0
    def get_remainingAmount(self, obj):  return float(obj.remaining_amount) if obj.remaining_amount else 0
    def get_status(self, obj):           return safe_str(obj.status)
    def get_paymentStatus(self, obj):    return safe_str(obj.payment_status)
    def get_specialRequests(self, obj):  return obj.special_requests or ""
    def get_createdAt(self, obj):        return obj.created_at.isoformat() if obj.created_at else None


class BookingCreateSerializer(serializers.Serializer):
    roomId             = serializers.IntegerField()
    guestInformationId = serializers.IntegerField(required=False, allow_null=True)
    checkInDate        = serializers.DateField()
    checkOutDate       = serializers.DateField()
    numberOfGuests     = serializers.IntegerField(required=False, default=1)
    numAdults          = serializers.IntegerField(required=False, default=1)
    numChildren        = serializers.IntegerField(required=False, default=0)
    totalAmount        = serializers.DecimalField(max_digits=12, decimal_places=2, required=False, allow_null=True)
    specialRequests    = serializers.CharField(required=False, allow_blank=True, default="")
    paymentMethod      = serializers.CharField(required=False, default="ONLINE")
    paymentType        = serializers.CharField(required=False, default="DEPOSIT")

    def validate(self, data):
        if data["checkInDate"] >= data["checkOutDate"]:
            raise serializers.ValidationError("checkOutDate must be after checkInDate.")
        return data


# Add to apps/bookings/serializers.py

class CancellationRequestSerializer(serializers.ModelSerializer):
    booking_reference = serializers.CharField(source='booking.booking_reference', read_only=True)
    guest_name = serializers.CharField(source='booking.user.username', read_only=True)
    room_number = serializers.CharField(source='booking.room.room_number', read_only=True)
    deposit_amount = serializers.DecimalField(source='booking.deposit_amount', max_digits=10, decimal_places=2,
                                              read_only=True)

    class Meta:
        model = CancellationRequest
        fields = [
            'id', 'booking', 'booking_reference', 'guest_name', 'room_number',
            'reason', 'status', 'admin_note', 'created_at', 'resolved_at',
            'resolved_by_name', 'deposit_amount'
        ]

    resolved_by_name = serializers.SerializerMethodField()

    def get_resolved_by_name(self, obj):
        if obj.resolved_by:
            return obj.resolved_by.username
        return None
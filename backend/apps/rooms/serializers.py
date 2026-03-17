"""apps/rooms/serializers.py — bulletproof version using SerializerMethodField"""
from rest_framework import serializers
from .models import Room


def safe_int(val):
    if val is None:
        return 0
    if isinstance(val, (list, tuple)):
        return int(val[0])
    return int(val)


class RoomSerializer(serializers.Serializer):
    id            = serializers.SerializerMethodField()
    roomNumber    = serializers.SerializerMethodField()
    roomType      = serializers.SerializerMethodField()
    description   = serializers.SerializerMethodField()
    pricePerNight = serializers.SerializerMethodField()
    maxOccupancy  = serializers.SerializerMethodField()
    available     = serializers.SerializerMethodField()
    amenities     = serializers.SerializerMethodField()
    imageUrl      = serializers.SerializerMethodField()
    createdAt     = serializers.SerializerMethodField()

    def get_id(self, obj):            return safe_int(obj.id)
    def get_roomNumber(self, obj):    return str(obj.room_number) if obj.room_number else ""
    def get_roomType(self, obj):      return str(obj.room_type) if obj.room_type else ""
    def get_description(self, obj):   return obj.description or ""
    def get_pricePerNight(self, obj): return float(obj.price_per_night) if obj.price_per_night else 0
    def get_maxOccupancy(self, obj):  return safe_int(obj.max_occupancy)
    def get_available(self, obj):     return bool(obj.available)
    def get_amenities(self, obj):     return obj.amenities or ""
    def get_imageUrl(self, obj):      return obj.image_url or ""
    def get_createdAt(self, obj):     return obj.created_at.isoformat() if obj.created_at else None
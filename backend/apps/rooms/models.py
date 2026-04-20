"""
apps/rooms/models.py
Mirrors Spring Boot Room exactly — table: rooms
"""
from django.db import models


class Room(models.Model):
    # Long id @GeneratedValue IDENTITY
    id = models.BigAutoField(primary_key=True)
    # String roomNumber unique
    room_number = models.CharField(max_length=10, unique=True, db_column="room_number")
    # String roomType
    room_type = models.CharField(max_length=50, db_column="room_type")
    # String description TEXT
    description = models.TextField(null=True, blank=True)
    # BigDecimal pricePerNight
    price_per_night = models.DecimalField(max_digits=10, decimal_places=2, db_column="price_per_night")
    # Integer maxOccupancy
    max_occupancy = models.IntegerField(db_column="max_occupancy")
    # Boolean available default true
    available = models.BooleanField(default=True)
    # String amenities TEXT (comma-separated)
    amenities = models.TextField(null=True, blank=True)
    # String imageUrl
    image_url = models.CharField(max_length=500, null=True, blank=True, db_column="image_url")
    # LocalDateTime createdAt
    created_at = models.DateTimeField(auto_now_add=True, db_column="created_at")
    # LocalDateTime updatedAt
    updated_at = models.DateTimeField(null=True, blank=True, db_column="updated_at")

    # ========== ADD STATUS FIELD ==========
    # Room status: CLEAN, DIRTY, MAINTENANCE, OCCUPIED, READY, VACANT
    status = models.CharField(
        max_length=20,
        default='CLEAN',
        blank=True,
        null=True,
        db_column="status"
    )

    class Meta:
        db_table = "rooms"
        managed = True  # Keep as True so Django can read the column

    def __str__(self):
        return f"Room {self.room_number} ({self.room_type})"
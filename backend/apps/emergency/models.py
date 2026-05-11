# apps/emergency/models.py
from django.db import models
from django.conf import settings


class EmergencyAlert(models.Model):
    EMERGENCY_TYPES = [
        ('medical', 'Medical Emergency'),
        ('fire', 'Fire'),
        ('security', 'Security Issue'),
        ('other', 'Other'),
    ]

    STATUS_CHOICES = [
        ('ACTIVE', 'Active'),
        ('ACCEPTED', 'Accepted'),
        ('IN_PROGRESS', 'In Progress'),
        ('RESOLVED', 'Resolved'),
        ('CANCELLED', 'Cancelled'),
    ]

    # Valid forward transitions
    VALID_TRANSITIONS = {
        'ACTIVE': 'ACCEPTED',
        'ACCEPTED': 'IN_PROGRESS',
        'IN_PROGRESS': 'RESOLVED',
    }

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='emergency_alerts')
    booking = models.ForeignKey('bookings.Booking', on_delete=models.SET_NULL, null=True, blank=True)
    emergency_type = models.CharField(max_length=20, choices=EMERGENCY_TYPES)
    emergency_type_name = models.CharField(max_length=50)
    room_number = models.CharField(max_length=50)
    guest_name = models.CharField(max_length=100)
    guest_phone = models.CharField(max_length=20, blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE')
    accepted_at = models.DateTimeField(null=True, blank=True)
    accepted_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
                                    related_name='accepted_emergencies')
    in_progress_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    resolved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
                                    related_name='resolved_emergencies')

    class Meta:
        ordering = ['-created_at']
        db_table = 'emergency_alerts'

    def __str__(self):
        return f"{self.guest_name} - {self.emergency_type_name} ({self.status})"

    def next_status(self):
        """Returns the next valid status, or None if terminal."""
        return self.VALID_TRANSITIONS.get(self.status)

    def can_advance(self):
        return self.status in self.VALID_TRANSITIONS
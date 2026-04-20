from django.db import models
from apps.users.models import User


class Complaint(models.Model):
    """Guest complaints and feedback"""

    COMPLAINT_TYPES = [
        ('NOISE', 'Noise Complaint'),
        ('CLEANING', 'Cleaning Issue'),
        ('AC', 'Air Conditioning'),
        ('TV', 'TV/Entertainment'),
        ('PLUMBING', 'Plumbing Issue'),
        ('STAFF', 'Staff Behavior'),
        ('AMENITIES', 'Amenities Missing'),
        ('SECURITY', 'Security Concern'),
        ('OTHER', 'Other'),
    ]

    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('IN_PROGRESS', 'In Progress'),
        ('RESOLVED', 'Resolved'),
        ('CLOSED', 'Closed'),
    ]

    CONTACT_METHODS = [
        ('EMAIL', 'Email'),
        ('PHONE', 'Phone'),
        ('IN_PERSON', 'In Person at Front Desk'),
    ]

    # Basic info
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='complaints')
    complaint_type = models.CharField(max_length=20, choices=COMPLAINT_TYPES, default='OTHER')
    title = models.CharField(max_length=200)
    description = models.TextField()

    # Guest info
    guest_name = models.CharField(max_length=100)
    guest_email = models.EmailField()
    room_number = models.CharField(max_length=10, blank=True, null=True)
    preferred_contact = models.CharField(max_length=20, choices=CONTACT_METHODS, default='EMAIL')

    # Status tracking
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    response = models.TextField(blank=True, null=True)
    resolved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True,
                                    related_name='resolved_complaints')
    resolved_at = models.DateTimeField(blank=True, null=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'complaints'
        managed = False
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['user']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"Complaint #{self.id}: {self.title[:50]}"

    def save(self, *args, **kwargs):
        if self.status in ['RESOLVED', 'CLOSED'] and not self.resolved_at:
            from django.utils import timezone
            self.resolved_at = timezone.now()
        super().save(*args, **kwargs)


class ComplaintTimeline(models.Model):
    """Track status changes and staff responses"""

    complaint = models.ForeignKey(Complaint, on_delete=models.CASCADE, related_name='timeline')
    status = models.CharField(max_length=20, choices=Complaint.STATUS_CHOICES)
    note = models.TextField()
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'complaint_timeline'
        managed = False
        ordering = ['created_at']

    def __str__(self):
        return f"{self.complaint.id} - {self.status} at {self.created_at}"
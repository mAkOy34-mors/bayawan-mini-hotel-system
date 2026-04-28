# apps/services/models.py
from django.db import models
from django.conf import settings
from apps.rooms.models import Room


class ServiceRequest(models.Model):
    """Service requests from guests"""

    SERVICE_TYPES = [
        ('CLEANING', 'Cleaning'),
        ('MAINTENANCE', 'Maintenance'),
        ('LAUNDRY', 'Laundry'),
        ('DELIVERY', 'Delivery'),
        ('EXTRA_PILLOWS', 'Extra Pillows'),
        ('EXTRA_TOWELS', 'Extra Towels'),
        ('MINI_BAR', 'Mini Bar Restock'),
        ('TECH_SUPPORT', 'Technical Support'),
        ('OTHER', 'Other'),
    ]

    PRIORITY_CHOICES = [
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
        ('URGENT', 'Urgent'),
    ]

    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('IN_PROGRESS', 'In Progress'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    ]

    # Basic info
    guest_name = models.CharField(max_length=100)
    guest_email = models.EmailField()
    room_number = models.CharField(max_length=10)
    service_type = models.CharField(max_length=20, choices=SERVICE_TYPES)
    description = models.TextField(blank=True, null=True)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='MEDIUM')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')

    # Assignment
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_service_requests'
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_service_requests'
    )


    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    # Service charges
    service_charge = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    is_paid = models.BooleanField(default=False)

    class Meta:
        db_table = 'service_requests'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['service_type']),
            models.Index(fields=['room_number']),
            models.Index(fields=['assigned_to']),
        ]

    def __str__(self):
        return f"{self.service_type} - Room {self.room_number} - {self.status}"


class ServicePayment(models.Model):
    """Payment for service charges at checkout"""

    PAYMENT_METHODS = [
        ('CASH', 'Cash'),
        ('CARD', 'Credit/Debit Card'),
        ('ROOM_CHARGE', 'Room Charge'),
        ('GCASH', 'GCash'),
    ]

    service_request = models.OneToOneField(
        ServiceRequest,
        on_delete=models.CASCADE,
        related_name='payment'
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS)
    paid_at = models.DateTimeField(auto_now_add=True)
    receipt_number = models.CharField(max_length=50, unique=True)

    class Meta:
        db_table = 'service_payments'

    def __str__(self):
        return f"Payment for {self.service_request} - {self.amount}"
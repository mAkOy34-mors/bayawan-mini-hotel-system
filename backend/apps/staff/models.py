# apps/staff/models.py
from django.db import models
from django.conf import settings
from apps.bookings.models import Booking
from apps.rooms.models import Room


class Task(models.Model):
    """Task assigned to staff members"""

    TASK_TYPES = [
        ('MAINTENANCE', 'Maintenance'),
        ('DELIVERY', 'Delivery'),
        ('ASSISTANCE', 'Guest Assistance'),
        ('EMERGENCY', 'Emergency'),
        ('CLEANING', 'Cleaning'),
        ('REPAIR', 'Repair'),
        ('SECURITY', 'Security'),  # Add this
        ('HOUSEKEEPING', 'Housekeeping'),  # Add this
    ]

    PRIORITY_CHOICES = [
        ('HIGH', 'High'),
        ('MEDIUM', 'Medium'),
        ('LOW', 'Low'),
    ]

    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('IN_PROGRESS', 'In Progress'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    ]

    # Task details
    title = models.CharField(max_length=200)
    description = models.TextField()
    task_type = models.CharField(max_length=20, choices=TASK_TYPES)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='MEDIUM')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')

    # Location and assignment
    room = models.ForeignKey(Room, on_delete=models.SET_NULL, null=True, blank=True)
    room_number = models.CharField(max_length=10, blank=True)
    booking = models.ForeignKey(Booking, on_delete=models.SET_NULL, null=True, blank=True)

    # Assignment
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
                                    related_name='assigned_tasks')
    assigned_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
                                    related_name='created_tasks')

    # Reference to complaint - ADD THIS FIELD
    complaint = models.ForeignKey(
        'complaints.Complaint',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tasks'
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    # Additional info
    note = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['-priority', '-created_at']
        db_table = 'staff_tasks'

    def __str__(self):
        return f"{self.get_task_type_display()}: {self.title} (Room {self.room_number})"


class TaskHistory(models.Model):
    """History of task status changes"""

    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='history')
    previous_status = models.CharField(max_length=20)
    new_status = models.CharField(max_length=20)
    changed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    note = models.TextField(blank=True, null=True)
    changed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-changed_at']
        db_table = 'staff_task_history'

    def __str__(self):
        return f"Task {self.task.id}: {self.previous_status} → {self.new_status}"


class StaffProfile(models.Model):
    """Extended profile for staff members"""

    DEPARTMENT_CHOICES = [
        ('MAINTENANCE', 'Maintenance'),
        ('HOUSEKEEPING', 'Housekeeping'),
        ('SECURITY', 'Security'),
        ('FRONT_DESK', 'Front Desk'),
        ('MANAGEMENT', 'Management'),
    ]

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='staff_profile')
    department = models.CharField(max_length=20, choices=DEPARTMENT_CHOICES, default='MAINTENANCE')
    employee_id = models.CharField(max_length=20, unique=True, blank=True)
    phone_number = models.CharField(max_length=20, blank=True)
    is_on_duty = models.BooleanField(default=True)
    skills = models.TextField(blank=True, null=True, help_text="List of skills (e.g., HVAC, Plumbing, Electrical)")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'staff_profiles'

    def __str__(self):
        return f"{self.user.username} - {self.get_department_display()}"

    def save(self, *args, **kwargs):
        if not self.employee_id:
            # Generate employee ID: STAFF + random 6 digits
            import random
            self.employee_id = f"STAFF{random.randint(100000, 999999)}"
        super().save(*args, **kwargs)
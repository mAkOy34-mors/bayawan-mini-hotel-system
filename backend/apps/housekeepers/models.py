# apps/housekeepers/models.py
from django.db import models
from django.conf import settings
from apps.rooms.models import Room
from apps.bookings.models import Booking


class Housekeeper(models.Model):
    """Housekeeper information and details"""

    class Status(models.TextChoices):
        AVAILABLE = 'AVAILABLE', 'Available'
        ON_DUTY = 'ON_DUTY', 'On Duty'
        ON_BREAK = 'ON_BREAK', 'On Break'
        OFF_DUTY = 'OFF_DUTY', 'Off Duty'

    class Shift(models.TextChoices):
        MORNING = 'MORNING', 'Morning (6AM - 2PM)'
        AFTERNOON = 'AFTERNOON', 'Afternoon (2PM - 10PM)'
        NIGHT = 'NIGHT', 'Night (10PM - 6AM)'

    # Personal Information
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='housekeeper_profile'
    )
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    employee_id = models.CharField(max_length=50, unique=True)
    phone_number = models.CharField(max_length=20)
    email = models.EmailField()

    # Employment Information
    hire_date = models.DateField()
    shift = models.CharField(max_length=20, choices=Shift.choices, default='MORNING')
    status = models.CharField(max_length=20, choices=Status.choices, default='AVAILABLE')

    # Skills and Specialization
    skills = models.TextField(blank=True, null=True)
    specialization = models.CharField(max_length=100, blank=True, null=True)

    # Stats
    tasks_completed = models.IntegerField(default=0)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=5.00)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'housekeepers'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.first_name} {self.last_name} - {self.employee_id}"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"


class CleaningTask(models.Model):
    """Cleaning tasks assigned to housekeepers"""

    class TaskType(models.TextChoices):
        ROOM_CLEANING = 'ROOM_CLEANING', 'Room Cleaning'
        BATHROOM_CLEANING = 'BATHROOM_CLEANING', 'Bathroom Cleaning'
        LINEN_CHANGE = 'LINEN_CHANGE', 'Linen Change'
        DEEP_CLEANING = 'DEEP_CLEANING', 'Deep Cleaning'
        PUBLIC_AREA = 'PUBLIC_AREA', 'Public Area Cleaning'

    class Priority(models.TextChoices):
        HIGH = 'HIGH', 'High'
        MEDIUM = 'MEDIUM', 'Medium'
        LOW = 'LOW', 'Low'

    class TaskStatus(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
        COMPLETED = 'COMPLETED', 'Completed'
        VERIFIED = 'VERIFIED', 'Verified'

    # Task details
    title = models.CharField(max_length=200)
    description = models.TextField()
    task_type = models.CharField(max_length=30, choices=TaskType.choices)
    priority = models.CharField(max_length=10, choices=Priority.choices, default='MEDIUM')
    status = models.CharField(max_length=20, choices=TaskStatus.choices, default='PENDING')

    # Location
    room = models.ForeignKey(Room, on_delete=models.SET_NULL, null=True, blank=True)
    room_number = models.CharField(max_length=10)
    booking = models.ForeignKey(Booking, on_delete=models.SET_NULL, null=True, blank=True)

    # Assignment
    assigned_to = models.ForeignKey(Housekeeper, on_delete=models.SET_NULL, null=True, blank=True,
                                    related_name='assigned_tasks')
    assigned_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    verified_at = models.DateTimeField(null=True, blank=True)

    # Additional info
    notes = models.TextField(blank=True, null=True)
    before_image = models.CharField(max_length=500, blank=True, null=True)
    after_image = models.CharField(max_length=500, blank=True, null=True)

    class Meta:
        db_table = 'cleaning_tasks'
        ordering = ['-priority', '-created_at']

    def __str__(self):
        return f"{self.title} - Room {self.room_number}"


class CleaningChecklist(models.Model):
    """Checklist items for room cleaning"""

    task = models.ForeignKey(CleaningTask, on_delete=models.CASCADE, related_name='checklist_items')
    item_name = models.CharField(max_length=200)
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    notes = models.CharField(max_length=500, blank=True, null=True)

    class Meta:
        db_table = 'cleaning_checklists'

    def __str__(self):
        return self.item_name


class SupplyRequest(models.Model):
    """Supply requests from housekeepers"""

    class RequestStatus(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        APPROVED = 'APPROVED', 'Approved'
        FULFILLED = 'FULFILLED', 'Fulfilled'
        REJECTED = 'REJECTED', 'Rejected'

    housekeeper = models.ForeignKey(Housekeeper, on_delete=models.CASCADE, related_name='supply_requests')
    item_name = models.CharField(max_length=200)
    quantity = models.IntegerField()
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=RequestStatus.choices, default='PENDING')
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    fulfilled_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'supply_requests'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.item_name} x{self.quantity} - {self.housekeeper.full_name}"


class RoomStatusLog(models.Model):
    """Log of room status changes"""

    class Action(models.TextChoices):
        CLEANED = 'CLEANED', 'Cleaned'
        INSPECTED = 'INSPECTED', 'Inspected'
        DIRTY = 'DIRTY', 'Marked Dirty'
        MAINTENANCE = 'MAINTENANCE', 'Maintenance Required'

    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='status_logs')
    previous_status = models.CharField(max_length=50)
    new_status = models.CharField(max_length=50)
    action = models.CharField(max_length=20, choices=Action.choices)
    performed_by = models.ForeignKey(Housekeeper, on_delete=models.SET_NULL, null=True, blank=True)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'room_status_logs'
        ordering = ['-created_at']

    def __str__(self):
        return f"Room {self.room.room_number}: {self.previous_status} → {self.new_status}"
# apps/housekeepers/models.py
from django.db import models
from django.conf import settings

from apps.rooms.models import Room
from apps.bookings.models import Booking
from apps.employees.models import EmployeeInformation


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

    # Assignment - THIS IS THE KEY FIELD
    assigned_to_employee = models.ForeignKey(
        EmployeeInformation,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_cleaning_tasks',
        db_column='assigned_to_employee_id'  # This matches your database column
    )
    assigned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

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
        managed = False  # Important: don't let Django manage this table

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
        managed = False

    def __str__(self):
        return self.item_name


class SupplyRequest(models.Model):
    """Supply requests from housekeepers"""

    class RequestStatus(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        APPROVED = 'APPROVED', 'Approved'
        FULFILLED = 'FULFILLED', 'Fulfilled'
        REJECTED = 'REJECTED', 'Rejected'

    class Priority(models.TextChoices):  # ← Define it here
        HIGH = 'HIGH', 'High'
        MEDIUM = 'MEDIUM', 'Medium'
        LOW = 'LOW', 'Low'

    housekeeper_employee = models.ForeignKey(
        EmployeeInformation,
        on_delete=models.CASCADE,
        related_name='supply_requests',
        db_column='housekeeper_id'
    )
    item_name = models.CharField(max_length=200)
    quantity = models.IntegerField()
    unit = models.CharField(max_length=50, default='piece(s)')
    reason = models.TextField()
    priority = models.CharField(max_length=10, choices=Priority.choices)
    status = models.CharField(max_length=20, choices=RequestStatus.choices, default='PENDING')
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    rejection_reason = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    fulfilled_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'supply_requests'
        ordering = ['-created_at']
        managed = False

    def __str__(self):
        return f"{self.item_name} x{self.quantity}"


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
    performed_by_employee = models.ForeignKey(
        EmployeeInformation,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='room_status_logs',
        db_column='performed_by_employee_id'
    )
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'room_status_logs'
        ordering = ['-created_at']
        managed = False

    def __str__(self):
        return f"Room {self.room.room_number}: {self.previous_status} → {self.new_status}"


# apps/housekeepers/models.py - Add this new model

class RoomIssue(models.Model):
    """Room issues reported by housekeepers"""

    class IssueType(models.TextChoices):
        LIGHTS = 'LIGHTS', 'Broken Lights'
        PLUMBING = 'PLUMBING', 'Plumbing Problem'
        FURNITURE = 'FURNITURE', 'Damaged Furniture'
        ELECTRICAL = 'ELECTRICAL', 'Electrical Issue'
        TV_ELECTRONICS = 'TV_ELECTRONICS', 'TV/Electronics'
        DOOR_LOCK = 'DOOR_LOCK', 'Door/Lock Issue'
        AC_ISSUE = 'AC_ISSUE', 'AC/Heating Problem'
        PEST_CONTROL = 'PEST_CONTROL', 'Pest Issue'
        OTHER = 'OTHER', 'Other Issue'

    class Priority(models.TextChoices):
        HIGH = 'HIGH', 'High'
        MEDIUM = 'MEDIUM', 'Medium'
        LOW = 'LOW', 'Low'

    class IssueStatus(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
        COMPLETED = 'COMPLETED', 'Completed'
        REJECTED = 'REJECTED', 'Rejected'

    # Issue details
    issue_type = models.CharField(max_length=20, choices=IssueType.choices)
    title = models.CharField(max_length=200)
    description = models.TextField()
    priority = models.CharField(max_length=10, choices=Priority.choices, default='MEDIUM')
    status = models.CharField(max_length=20, choices=IssueStatus.choices, default='PENDING')

    # Location
    room_number = models.CharField(max_length=10)

    # Reporter
    reported_by_employee = models.ForeignKey(
        EmployeeInformation,
        on_delete=models.CASCADE,
        related_name='reported_issues',
        db_column='reported_by_employee_id'
    )

    # Assignment (who is fixing it)
    assigned_to_employee = models.ForeignKey(
        EmployeeInformation,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_issues',
        db_column='assigned_to_employee_id'  # Column name in database
    )

    # Notes and resolution
    notes = models.TextField(blank=True, null=True)
    resolution_notes = models.TextField(blank=True, null=True)
    rejection_reason = models.TextField(blank=True, null=True)

    # Images
    before_image = models.CharField(max_length=500, blank=True, null=True)
    after_image = models.CharField(max_length=500, blank=True, null=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'room_issues'
        ordering = ['-priority', '-created_at']
        managed = False

    def __str__(self):
        return f"{self.get_issue_type_display()} - Room {self.room_number}"

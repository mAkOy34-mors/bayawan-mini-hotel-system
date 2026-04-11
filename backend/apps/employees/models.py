# apps/employees/models.py
"""
Employee Information model for Receptionists, Housekeepers, and Staff
Table: employee_information
"""
from django.conf import settings
from django.db import models


class EmployeeInformation(models.Model):
    class Department(models.TextChoices):
        FRONT_DESK = "FRONT_DESK", "Front Desk"
        HOUSEKEEPING = "HOUSEKEEPING", "Housekeeping"
        MAINTENANCE = "MAINTENANCE", "Maintenance"
        SECURITY = "SECURITY", "Security"
        FOOD_BEVERAGE = "FOOD_BEVERAGE", "Food & Beverage"
        MANAGEMENT = "MANAGEMENT", "Management"
        ADMIN = "ADMIN", "Administration"

    class Position(models.TextChoices):
        RECEPTIONIST = "RECEPTIONIST", "Receptionist"
        HOUSEKEEPER = "HOUSEKEEPER", "Housekeeper"
        STAFF = "STAFF", "Staff"
        SUPERVISOR = "SUPERVISOR", "Supervisor"
        MANAGER = "MANAGER", "Manager"
        ADMIN = "ADMIN", "Administrator"

    class EmploymentType(models.TextChoices):
        FULL_TIME = "FULL_TIME", "Full Time"
        PART_TIME = "PART_TIME", "Part Time"
        CONTRACT = "CONTRACT", "Contract"
        PROBATIONARY = "PROBATIONARY", "Probationary"
        CASUAL = "CASUAL", "Casual"

    # Primary key
    id = models.BigAutoField(primary_key=True)

    # Personal Information
    first_name = models.CharField(max_length=100, db_column="first_name")
    last_name = models.CharField(max_length=100, db_column="last_name")
    middle_name = models.CharField(max_length=100, null=True, blank=True, db_column="middle_name")
    gender = models.CharField(max_length=20, null=True, blank=True)
    date_of_birth = models.DateField(db_column="date_of_birth")

    # Contact Information
    contact_number = models.CharField(max_length=30, db_column="contact_number")
    emergency_contact = models.CharField(max_length=100, null=True, blank=True, db_column="emergency_contact")
    emergency_phone = models.CharField(max_length=30, null=True, blank=True, db_column="emergency_phone")
    home_address = models.TextField(db_column="home_address")
    email = models.EmailField(max_length=254, db_column="email")

    # Employment Information
    employee_id = models.CharField(max_length=50, unique=True, db_column="employee_id")
    department = models.CharField(max_length=20, choices=Department.choices, db_column="department")
    position = models.CharField(max_length=20, choices=Position.choices, db_column="position")
    employment_type = models.CharField(max_length=20, choices=EmploymentType.choices, default="FULL_TIME",
                                       db_column="employment_type")

    # Compensation
    salary = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, db_column="salary")
    hourly_rate = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True, db_column="hourly_rate")

    # Work Schedule
    hire_date = models.DateField(db_column="hire_date")
    regularized_date = models.DateField(null=True, blank=True, db_column="regularized_date")
    termination_date = models.DateField(null=True, blank=True, db_column="termination_date")

    # Skills and Qualifications
    skills = models.TextField(null=True, blank=True, db_column="skills")
    certifications = models.TextField(null=True, blank=True, db_column="certifications")
    education = models.TextField(null=True, blank=True, db_column="education")

    # Status
    is_active = models.BooleanField(default=True, db_column="is_active")
    is_on_duty = models.BooleanField(default=True, db_column="is_on_duty")

    # Government IDs
    sss_number = models.CharField(max_length=50, null=True, blank=True, db_column="sss_number")
    philhealth_number = models.CharField(max_length=50, null=True, blank=True, db_column="philhealth_number")
    pagibig_number = models.CharField(max_length=50, null=True, blank=True, db_column="pagibig_number")
    tin_number = models.CharField(max_length=50, null=True, blank=True, db_column="tin_number")

    # Foreign key to User
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        db_column="user_id",
        related_name="employee_information",
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True, db_column="created_at")
    updated_at = models.DateTimeField(auto_now=True, db_column="updated_at")

    class Meta:
        db_table = "employee_information"

    def __str__(self):
        return f"{self.first_name} {self.last_name} - {self.get_position_display()}"

    @property
    def full_name(self):
        if self.middle_name:
            return f"{self.first_name} {self.middle_name} {self.last_name}"
        return f"{self.first_name} {self.last_name}"
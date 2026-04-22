"""
apps/guests/models.py
Mirrors Spring Boot GuestInformation — table: guest_information
managed = False (table already exists in Supabase)
"""
from django.conf import settings
from django.db import models


class GuestInformation(models.Model):
    class IdType(models.TextChoices):
        PASSPORT        = "PASSPORT",        "Passport"
        DRIVERS_LICENSE = "DRIVERS_LICENSE", "Driver's License"
        NATIONAL_ID     = "NATIONAL_ID",     "National ID"
        OTHER           = "OTHER",           "Other"

    # Long id @GeneratedValue IDENTITY
    id = models.BigAutoField(primary_key=True)
    # String firstName
    first_name = models.CharField(max_length=100, db_column="first_name")
    # String lastName
    last_name = models.CharField(max_length=100, db_column="last_name")
    # String gender nullable
    gender = models.CharField(max_length=20, null=True, blank=True)
    # String homeAddress
    home_address = models.TextField(db_column="home_address")
    # String nationality
    nationality = models.CharField(max_length=100)
    # LocalDate dateOfBirth
    date_of_birth = models.DateField(db_column="date_of_birth")
    # String contactNumber
    contact_number = models.CharField(max_length=30, db_column="contact_number")
    # IdType idType (enum)
    id_type = models.CharField(max_length=20, choices=IdType.choices, db_column="id_type")
    # String idNumber nullable
    id_number = models.CharField(max_length=100, null=True, blank=True, db_column="id_number")
    # String passportNumber nullable
    passport_number = models.CharField(max_length=100, null=True, blank=True, db_column="passport_number")
    # String visaType nullable
    visa_type = models.CharField(max_length=50, null=True, blank=True, db_column="visa_type")
    # LocalDate visaExpiryDate nullable
    visa_expiry_date = models.DateField(null=True, blank=True, db_column="visa_expiry_date")
    # Add this line with the other fields
    profile_picture = models.TextField(null=True, blank=True, db_column="profile_picture")
    # @ManyToOne UserModel user
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        db_column="user_id",
        related_name="guest_information_set",
    )
    # LocalDateTime createdAt (updatable = false)
    created_at = models.DateTimeField(auto_now_add=True, db_column="created_at")
    # LocalDateTime updatedAt
    updated_at = models.DateTimeField(null=True, blank=True, db_column="updated_at")

    class Meta:
        db_table = "guest_information"
        managed  = False  # table already exists from Spring Boot

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

class GuestProfilePicture(models.Model):
    """Separate table for profile pictures — Django managed, avoids touching guest_information."""
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="profile_picture",
    )
    image_base64 = models.TextField()  # stores base64 encoded image
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "guest_profile_picture"
"""
apps/bookings/models.py
Mirrors Spring Boot Booking — table: bookings
managed = False (table already exists in Supabase)
"""
from django.conf import settings
from django.db import models

from apps.rooms.models import Room
from apps.guests.models import GuestInformation


class Booking(models.Model):
    class BookingStatus(models.TextChoices):
        PENDING_DEPOSIT = "PENDING_DEPOSIT", "Pending Deposit"
        CONFIRMED       = "CONFIRMED",       "Confirmed"
        CHECKED_IN      = "CHECKED_IN",      "Checked In"
        CHECKED_OUT     = "CHECKED_OUT",     "Checked Out"
        CANCELLED       = "CANCELLED",       "Cancelled"
        COMPLETED       = "COMPLETED",       "Completed"

    class PaymentStatus(models.TextChoices):
        UNPAID       = "UNPAID",       "Unpaid"
        DEPOSIT_PAID = "DEPOSIT_PAID", "Deposit Paid"
        FULLY_PAID   = "FULLY_PAID",   "Fully Paid"

    # Long id @GeneratedValue IDENTITY
    id = models.BigAutoField(primary_key=True)
    # String bookingReference unique
    booking_reference = models.CharField(max_length=100, unique=True, db_column="booking_reference")
    # @ManyToOne UserModel user
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        db_column="user_id",
        related_name="bookings",
    )
    # @ManyToOne GuestInformation
    guest_information = models.ForeignKey(
        GuestInformation,
        on_delete=models.PROTECT,
        db_column="guest_information_id",
        related_name="bookings",
    )
    # @ManyToOne Room
    room = models.ForeignKey(
        Room,
        on_delete=models.PROTECT,
        db_column="room_id",
        related_name="bookings",
    )
    # LocalDate checkInDate
    check_in_date = models.DateField(db_column="check_in_date")
    # LocalDate checkOutDate
    check_out_date = models.DateField(db_column="check_out_date")
    # Integer numberOfGuests
    number_of_guests = models.IntegerField(db_column="number_of_guests")
    # Integer numberOfNights
    number_of_nights = models.IntegerField(db_column="number_of_nights")
    # BigDecimal totalAmount
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, db_column="total_amount")
    # BigDecimal depositAmount
    deposit_amount = models.DecimalField(max_digits=12, decimal_places=2, db_column="deposit_amount")
    # BigDecimal remainingAmount
    remaining_amount = models.DecimalField(max_digits=12, decimal_places=2, db_column="remaining_amount")
    # BookingStatus status default PENDING_DEPOSIT
    status = models.CharField(
        max_length=20,
        choices=BookingStatus.choices,
        default=BookingStatus.PENDING_DEPOSIT,
    )
    # PaymentStatus paymentStatus default UNPAID
    payment_status = models.CharField(
        max_length=20,
        choices=PaymentStatus.choices,
        default=PaymentStatus.UNPAID,
        db_column="payment_status",
    )
    # String specialRequests nullable
    special_requests = models.TextField(null=True, blank=True, db_column="special_requests")
    # String depositPaymentId nullable
    deposit_payment_id = models.CharField(max_length=200, null=True, blank=True, db_column="deposit_payment_id")
    # String balancePaymentId nullable
    balance_payment_id = models.CharField(max_length=200, null=True, blank=True, db_column="balance_payment_id")
    # LocalDateTime depositPaidAt nullable
    deposit_paid_at = models.DateTimeField(null=True, blank=True, db_column="deposit_paid_at")
    # LocalDateTime balancePaidAt nullable
    balance_paid_at = models.DateTimeField(null=True, blank=True, db_column="balance_paid_at")
    # LocalDateTime createdAt (updatable = false)
    created_at = models.DateTimeField(auto_now_add=True, db_column="created_at")
    # LocalDateTime updatedAt
    updated_at = models.DateTimeField(null=True, blank=True, db_column="updated_at")

    class Meta:
        db_table = "bookings"
        managed  = False  # table already exists from Spring Boot
        ordering = ["-created_at"]

    def __str__(self):
        return f"Booking {self.booking_reference}"

"""
Add this class to the bottom of apps/bookings/models.py
New table — managed=True (Django will create this)
"""
from django.conf import settings
from django.db import models


class BookingChangeRequest(models.Model):
    """
    Guest-submitted requests to change booking dates or room type.
    Reviewed and approved/rejected by admin.
    """

    class Status(models.TextChoices):
        PENDING  = "PENDING",  "Pending"
        APPROVED = "APPROVED", "Approved"
        REJECTED = "REJECTED", "Rejected"

    booking             = models.ForeignKey(
                            "Booking",
                            on_delete=models.CASCADE,
                            related_name="change_requests",
                         )
    user                = models.ForeignKey(
                            settings.AUTH_USER_MODEL,
                            on_delete=models.CASCADE,
                            related_name="change_requests",
                         )
    reason              = models.TextField()
    requested_checkin   = models.DateField(null=True, blank=True)
    requested_checkout  = models.DateField(null=True, blank=True)
    requested_room_type = models.CharField(max_length=50, blank=True)
    status              = models.CharField(
                            max_length=10,
                            choices=Status.choices,
                            default=Status.PENDING,
                         )
    admin_note          = models.TextField(blank=True)
    reviewed_at         = models.DateTimeField(null=True, blank=True)
    created_at          = models.DateTimeField(auto_now_add=True)
    updated_at          = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "booking_change_requests"
        ordering = ["-created_at"]

    def __str__(self):
        return f"ChangeRequest #{self.id} for {self.booking.booking_reference} [{self.status}]"
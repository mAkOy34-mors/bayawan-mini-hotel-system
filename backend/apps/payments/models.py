"""
apps/payments/models.py
Mirrors Spring Boot Payment — table: payments
managed = False (table already exists in Supabase)
"""
from django.conf import settings
from django.db import models


# apps/payments/models.py
class Payment(models.Model):
    # apps/bookings/models.py - Update PaymentStatus

    class PaymentStatus(models.TextChoices):
        PENDING = "PENDING", "Pending"
        PAID = "PAID", "Paid"
        EXPIRED = "EXPIRED", "Expired"
        FAILED = "FAILED", "Failed"
        REFUNDED = "REFUNDED", "Refunded"  # ← ADD THIS
        CANCELLED = "CANCELLED", "Cancelled"  # ← ADD THIS

    class PaymentType(models.TextChoices):
        ROOM_BOOKING = "ROOM_BOOKING", "Room Booking"
        CHECK_IN = "CHECK_IN", "Check In"
        DEPOSIT = "DEPOSIT", "Deposit"
        BALANCE = "BALANCE", "Balance"
        SERVICE = "SERVICE", "Service Charge"
        REFUND = "REFUND", "Refund"  # ← ADD THIS
        CANCELLATION = "CANCELLATION", "Cancellation"  # ← ADD THIS (optional)
        ADDITIONAL_DEPOSIT = "ADDITIONAL_DEPOSIT", "Additional Deposit"
        OTHER = "OTHER", "Other"

    # Long id @GeneratedValue IDENTITY
    id = models.BigAutoField(primary_key=True)
    # String paymongoLinkId unique
    paymongo_link_id = models.CharField(max_length=200, unique=True, db_column="paymongo_link_id")
    # String checkoutUrl length 1000
    checkout_url = models.CharField(max_length=1000, db_column="checkout_url")
    # String email
    email = models.CharField(max_length=255)
    # String description
    description = models.CharField(max_length=500)
    # BigDecimal amount
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    # PaymentStatus status default PENDING
    status = models.CharField(
        max_length=10,
        choices=PaymentStatus.choices,
        default=PaymentStatus.PENDING,
    )
    # PaymentType type
    type = models.CharField(max_length=20, choices=PaymentType.choices)
    # Long bookingId nullable
    booking_id = models.BigIntegerField(null=True, blank=True, db_column="booking_id")
    # LocalDateTime createdAt (updatable = false)
    created_at = models.DateTimeField(auto_now_add=True, db_column="created_at")
    # LocalDateTime paidAt nullable
    paid_at = models.DateTimeField(null=True, blank=True, db_column="paid_at")

    class Meta:
        db_table = "payments"
        managed  = False  # table already exists from Spring Boot
        ordering = ["-created_at"]

    def __str__(self):
        return f"Payment {self.id} ({self.status})"
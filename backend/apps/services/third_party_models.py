# apps/services/third_party_models.py
# Add these models to apps/services/models.py

from django.db import models
from django.conf import settings
from decimal import Decimal


class ThirdPartyPartner(models.Model):
    """Third-party service partners (salons, spas, tour guides, etc.)"""

    CATEGORY_CHOICES = [
        ('SALON', 'Salon & Hair'),
        ('SPA', 'Spa & Wellness'),
        ('MASSAGE', 'Massage Therapy'),
        ('TOUR_GUIDE', 'Tourist Guide'),
        ('TRANSPORT', 'Transportation'),
        ('DINING', 'Dining & Catering'),
        ('PHOTOGRAPHY', 'Photography'),
        ('ADVENTURE', 'Adventure & Activities'),
        ('SHOPPING', 'Shopping Concierge'),
        ('OTHER', 'Other'),
    ]

    STATUS_CHOICES = [
        ('ACTIVE', 'Active'),
        ('INACTIVE', 'Inactive'),
        ('SUSPENDED', 'Suspended'),
    ]

    name = models.CharField(max_length=150)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    description = models.TextField()
    tagline = models.CharField(max_length=200, blank=True)

    # Contact info
    contact_person = models.CharField(max_length=100)
    phone = models.CharField(max_length=30)
    email = models.EmailField(blank=True)
    website = models.URLField(blank=True)
    address = models.TextField(blank=True)

    # Commission
    commission_rate = models.DecimalField(
        max_digits=5, decimal_places=2, default=Decimal('20.00'),
        help_text="Commission percentage the hotel earns (default 20%)"
    )

    # Operating hours
    operating_hours = models.CharField(max_length=100, blank=True, default='8:00 AM – 9:00 PM')
    availability_notes = models.CharField(max_length=200, blank=True)

    # Media
    logo_url = models.URLField(blank=True)
    cover_image_url = models.URLField(blank=True)

    # Ratings
    average_rating = models.DecimalField(max_digits=3, decimal_places=1, default=Decimal('0.0'))
    total_reviews = models.IntegerField(default=0)

    # Status
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='ACTIVE')
    is_featured = models.BooleanField(default=False)
    sort_order = models.IntegerField(default=0)

    payout_email = models.EmailField(blank=True, null=True, help_text="Email to send payout links")
    bank_account_name = models.CharField(max_length=200, blank=True)
    bank_name = models.CharField(max_length=100, blank=True)
    bank_account_number = models.CharField(max_length=50, blank=True)
    gcash_number = models.CharField(max_length=20, blank=True)

    # Metadata
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, related_name='created_partners'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'third_party_partners'
        ordering = ['-is_featured', 'sort_order', 'name']

    def __str__(self):
        return f"{self.name} ({self.get_category_display()})"


class PartnerService(models.Model):
    """Individual services offered by a partner"""

    partner = models.ForeignKey(
        ThirdPartyPartner, on_delete=models.CASCADE, related_name='services'
    )
    name = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    duration_minutes = models.IntegerField(null=True, blank=True)
    is_available = models.BooleanField(default=True)

    class Meta:
        db_table = 'partner_services'
        ordering = ['price']

    def __str__(self):
        return f"{self.partner.name} – {self.name}"


class GuestPartnerRequest(models.Model):
    """Guest requests for third-party partner services"""

    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('CONFIRMED', 'Confirmed'),
        ('IN_PROGRESS', 'In Progress'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    ]

    PAYMENT_STATUS_CHOICES = [
        ('UNPAID', 'Unpaid'),
        ('PAID', 'Paid'),
        ('REFUNDED', 'Refunded'),
    ]

    # Core relations
    partner = models.ForeignKey(
        ThirdPartyPartner, on_delete=models.CASCADE, related_name='requests'
    )
    partner_service = models.ForeignKey(
        PartnerService, on_delete=models.SET_NULL, null=True, blank=True, related_name='requests'
    )
    guest = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, related_name='partner_requests'
    )

    # Guest details
    guest_name = models.CharField(max_length=100)
    guest_email = models.EmailField()
    room_number = models.CharField(max_length=10)

    # Request details
    notes = models.TextField(blank=True)
    preferred_date = models.DateField(null=True, blank=True)
    preferred_time = models.CharField(max_length=20, blank=True)
    number_of_guests = models.IntegerField(default=1)

    # Financials
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0'))
    commission_rate = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('20.00'))
    commission_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0'))
    payment_status = models.CharField(max_length=10, choices=PAYMENT_STATUS_CHOICES, default='UNPAID')

    # Status
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='PENDING')
    handled_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='handled_partner_requests'
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    confirmed_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    payment_intent_id = models.CharField(max_length=255, blank=True, null=True)
    payment_method_detail = models.CharField(max_length=50, blank=True, null=True)  # CASH, CARD, GCASH
    paid_at = models.DateTimeField(null=True, blank=True)
    receipt_number = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        db_table = 'guest_partner_requests'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.guest_name} → {self.partner.name} ({self.status})"

    def calculate_commission(self):
        """Recalculate and save commission amount"""
        self.commission_amount = self.total_amount * (self.commission_rate / Decimal('100'))
        return self.commission_amount

    def save(self, *args, **kwargs):
        # Auto-calculate commission on save
        if self.total_amount and self.commission_rate:
            self.commission_amount = self.total_amount * (self.commission_rate / Decimal('100'))
        super().save(*args, **kwargs)


class CommissionPayment(models.Model):
    """Commission payments received from partners"""

    PAYMENT_METHODS = [
        ('CASH', 'Cash'),
        ('BANK_TRANSFER', 'Bank Transfer'),
        ('GCASH', 'GCash'),
        ('CHECK', 'Check'),
    ]

    partner = models.ForeignKey(
        ThirdPartyPartner, on_delete=models.CASCADE, related_name='commission_payments'
    )
    period_start = models.DateField()
    period_end = models.DateField()
    total_bookings = models.IntegerField(default=0)
    gross_amount = models.DecimalField(max_digits=12, decimal_places=2)
    commission_amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS)
    reference_number = models.CharField(max_length=100, unique=True)
    notes = models.TextField(blank=True)
    received_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, related_name='received_commissions'
    )
    received_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'commission_payments'
        ordering = ['-received_at']

    def __str__(self):
        return f"Commission from {self.partner.name}: ₱{self.commission_amount}"

class CommissionPayout(models.Model):
        """Commission payments made to partners"""

        STATUS_CHOICES = [
            ('PENDING', 'Pending'),
            ('COMPLETED', 'Completed'),
            ('FAILED', 'Failed'),
        ]

        PAYMENT_METHOD_CHOICES = [
            ('PAYMONGO', 'PayMongo'),
            ('CASH', 'Cash'),
            ('BANK_TRANSFER', 'Bank Transfer'),
            ('GCASH', 'GCash'),
            ('CHECK', 'Check'),
        ]

        partner = models.ForeignKey(
            ThirdPartyPartner, on_delete=models.CASCADE, related_name='payouts'
        )
        amount = models.DecimalField(max_digits=12, decimal_places=2)
        period_start = models.DateField()
        period_end = models.DateField()
        status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
        payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES)
        payout_link = models.URLField(blank=True, null=True)
        reference_number = models.CharField(max_length=100, blank=True)
        notes = models.TextField(blank=True)
        paid_at = models.DateTimeField(null=True, blank=True)
        created_by = models.ForeignKey(
            settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='created_payouts'
        )
        created_at = models.DateTimeField(auto_now_add=True)

        class Meta:
            db_table = 'commission_payouts'
            ordering = ['-created_at']

        def __str__(self):
            return f"Payout to {self.partner.name}: ₱{self.amount} ({self.status})"

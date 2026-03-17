"""apps/reports/models.py — Hotel system settings (single-row config table)"""
from django.db import models


class HotelSettings(models.Model):
    hotel_name     = models.CharField(max_length=200, default="Cebu Grand Hotel")
    address        = models.TextField(blank=True)
    phone          = models.CharField(max_length=30, blank=True)
    email          = models.EmailField(blank=True)
    tax_rate       = models.DecimalField(max_digits=5, decimal_places=2, default=12.00)
    check_in_time  = models.TimeField(default="14:00")
    check_out_time = models.TimeField(default="12:00")
    currency       = models.CharField(max_length=10, default="PHP")
    points_per_php = models.DecimalField(max_digits=6, decimal_places=2, default=1)
    updated_at     = models.DateTimeField(auto_now=True)

    class Meta:
        db_table     = "hotel_settings"
        verbose_name = "Hotel Settings"

    def __str__(self):
        return self.hotel_name

    @classmethod
    def get_settings(cls):
        """Always returns the single settings row, creating it if needed."""
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj

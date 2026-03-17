"""
apps/rewards/models.py
New tables — managed=True (Django will create these)
"""
from django.conf import settings
from django.db import models


class RewardRule(models.Model):
    name           = models.CharField(max_length=100)
    points_per_php = models.DecimalField(max_digits=6, decimal_places=2, default=1)
    min_spend      = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    is_active      = models.BooleanField(default=True)
    created_at     = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "reward_rules"

    def __str__(self):
        return self.name


class GuestReward(models.Model):
    """One row per guest — tracks current points balance."""
    user         = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="reward")
    points       = models.IntegerField(default=0)
    total_earned = models.IntegerField(default=0)
    updated_at   = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "guest_rewards"

    def __str__(self):
        return f"{self.user.email} — {self.points} pts"


class RewardHistory(models.Model):
    class TxType(models.TextChoices):
        EARN   = "EARN",   "Earned"
        REDEEM = "REDEEM", "Redeemed"
        ADJUST = "ADJUST", "Manual Adjustment"

    user        = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="reward_history")
    points      = models.IntegerField()
    tx_type     = models.CharField(max_length=10, choices=TxType.choices)
    description = models.CharField(max_length=255, blank=True)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "reward_history"
        ordering = ["-created_at"]


class Promotion(models.Model):
    title        = models.CharField(max_length=200)
    description  = models.TextField(blank=True)
    discount_pct = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    start_date   = models.DateField()
    end_date     = models.DateField()
    is_active    = models.BooleanField(default=True)
    created_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "promotions"

    def __str__(self):
        return self.title

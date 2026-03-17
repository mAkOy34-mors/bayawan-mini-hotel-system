"""apps/support/models.py"""
from django.conf import settings
from django.db import models


class SupportTicket(models.Model):
    class Status(models.TextChoices):
        OPEN        = "OPEN",        "Open"
        IN_PROGRESS = "IN_PROGRESS", "In Progress"
        RESOLVED    = "RESOLVED",    "Resolved"
        CLOSED      = "CLOSED",      "Closed"

    class Priority(models.TextChoices):
        LOW    = "LOW",    "Low"
        MEDIUM = "MEDIUM", "Medium"
        HIGH   = "HIGH",   "High"

    user        = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="tickets", null=True, blank=True)
    name        = models.CharField(max_length=100, blank=True)
    email       = models.EmailField()
    subject     = models.CharField(max_length=255)
    message     = models.TextField()
    status      = models.CharField(max_length=15, choices=Status.choices, default=Status.OPEN)
    priority    = models.CharField(max_length=10, choices=Priority.choices, default=Priority.MEDIUM)
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="assigned_tickets")
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "support_tickets"
        ordering = ["-created_at"]

    def __str__(self):
        return f"#{self.id} {self.subject}"


class TicketReply(models.Model):
    ticket     = models.ForeignKey(SupportTicket, on_delete=models.CASCADE, related_name="replies")
    author     = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    message    = models.TextField()
    is_staff   = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "ticket_replies"
        ordering = ["created_at"]

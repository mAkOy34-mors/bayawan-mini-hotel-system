# apps/feedback/models.py
from django.db import models
from django.conf import settings
from apps.bookings.models import Booking
from apps.rooms.models import Room


class Feedback(models.Model):
    RATING_CHOICES = [
        (1, '1 - Poor'),
        (2, '2 - Fair'),
        (3, '3 - Good'),
        (4, '4 - Very Good'),
        (5, '5 - Excellent'),
    ]

    booking = models.OneToOneField(Booking, on_delete=models.CASCADE, related_name='feedback')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='feedbacks')
    room = models.ForeignKey(Room, on_delete=models.SET_NULL, null=True, blank=True)

    # Ratings
    overall_rating = models.IntegerField(choices=RATING_CHOICES)
    cleanliness_rating = models.IntegerField(choices=RATING_CHOICES, null=True, blank=True)
    service_rating = models.IntegerField(choices=RATING_CHOICES, null=True, blank=True)
    comfort_rating = models.IntegerField(choices=RATING_CHOICES, null=True, blank=True)
    value_rating = models.IntegerField(choices=RATING_CHOICES, null=True, blank=True)

    # Feedback text
    comment = models.TextField(blank=True, null=True)
    likes = models.TextField(blank=True, null=True, help_text="What did you like?")
    improvements = models.TextField(blank=True, null=True, help_text="What could be improved?")

    # Status
    is_published = models.BooleanField(default=True)
    is_responded = models.BooleanField(default=False)
    response = models.TextField(blank=True, null=True)
    responded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
                                     related_name='feedback_responses')
    responded_at = models.DateTimeField(blank=True, null=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'feedbacks'
        ordering = ['-created_at']

    def __str__(self):
        return f"Feedback for {self.booking.booking_reference} - Rating: {self.overall_rating}/5"

    @property
    def average_rating(self):
        ratings = [self.overall_rating]
        if self.cleanliness_rating:
            ratings.append(self.cleanliness_rating)
        if self.service_rating:
            ratings.append(self.service_rating)
        if self.comfort_rating:
            ratings.append(self.comfort_rating)
        if self.value_rating:
            ratings.append(self.value_rating)
        return round(sum(ratings) / len(ratings), 1)
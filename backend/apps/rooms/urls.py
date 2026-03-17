"""apps/rooms/urls.py"""

from django.urls import path
from .views import AvailableRoomsView

urlpatterns = [
    path("available", AvailableRoomsView.as_view(), name="rooms-available"),
]

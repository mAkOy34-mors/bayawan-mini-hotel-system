# apps/rooms/urls.py

from django.urls import path
from .views import AllRoomsView, AvailableRoomsView

urlpatterns = [
    path("", AllRoomsView.as_view(), name="all-rooms"),  # GET /api/v1/rooms/
    path("available/", AvailableRoomsView.as_view(), name="rooms-available"),  # GET /api/v1/rooms/available/
]
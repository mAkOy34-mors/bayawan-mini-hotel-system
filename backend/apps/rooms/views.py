# apps/rooms/views.py

import logging
from datetime import date

from django.core.cache import cache
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.bookings.models import Booking
from .models import Room
from .serializers import RoomSerializer

logger = logging.getLogger(__name__)


class AvailableRoomsView(APIView):

    def get(self, request):
        check_in_str  = request.query_params.get("checkIn")
        check_out_str = request.query_params.get("checkOut")

        # Cache key includes dates so different date combos cache separately
        cache_key = f"available_rooms_{check_in_str or 'all'}_{check_out_str or 'all'}"
        cached    = cache.get(cache_key)
        if cached:
            return Response(cached)

        qs = Room.objects.filter(available=True)

        if check_in_str and check_out_str:
            try:
                check_in  = date.fromisoformat(check_in_str)
                check_out = date.fromisoformat(check_out_str)
            except ValueError:
                return Response({"message": "Invalid date format. Use YYYY-MM-DD."}, status=400)

            # Exclude rooms with ANY booking (including pending) for the selected dates
            conflicting_room_ids = (
                Booking.objects.filter(
                    status__in=[
                        Booking.BookingStatus.PENDING_DEPOSIT,  # ← ADD THIS
                        Booking.BookingStatus.CONFIRMED,
                        Booking.BookingStatus.CHECKED_IN,
                    ],
                    check_in_date__lt=check_out,
                    check_out_date__gt=check_in,
                )
                .values_list("room_id", flat=True)
            )
            qs = qs.exclude(id__in=conflicting_room_ids)

        rooms = qs.order_by("room_number")
        data  = RoomSerializer(rooms, many=True).data

        # Cache for 60 seconds — rooms change infrequently
        cache.set(cache_key, data, timeout=60)

        return Response(data)
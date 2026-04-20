# apps/rooms/views.py

import logging
from datetime import date, datetime

from django.core.cache import cache
from django.db.models import Q, OuterRef, Exists
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.bookings.models import Booking
from .models import Room
from .serializers import RoomSerializer

logger = logging.getLogger(__name__)


class AllRoomsView(APIView):
    """GET /api/v1/rooms/ - List all rooms (without availability filtering)"""

    def get(self, request):
        check_in_str = request.query_params.get("checkIn")
        check_out_str = request.query_params.get("checkOut")

        cache_key = f"all_rooms_{check_in_str}_{check_out_str}" if check_in_str and check_out_str else "all_rooms"
        cached = cache.get(cache_key)
        if cached:
            return Response(cached)

        rooms = Room.objects.all().order_by("price_per_night")

        # If dates are provided, calculate availability for each room
        if check_in_str and check_out_str:
            try:
                check_in = date.fromisoformat(check_in_str)
                check_out = date.fromisoformat(check_out_str)

                if check_out <= check_in:
                    return Response(
                        {"message": "Check-out must be after check-in."},
                        status=400
                    )

                # Find rooms with conflicting bookings for the selected dates
                conflicting_room_ids = set(
                    Booking.objects.filter(
                        status__in=[
                            Booking.BookingStatus.PENDING_DEPOSIT,
                            Booking.BookingStatus.CONFIRMED,
                            Booking.BookingStatus.CHECKED_IN,
                        ],
                        check_in_date__lt=check_out,
                        check_out_date__gt=check_in,
                    )
                    .values_list("room_id", flat=True)
                )

                # Build response with dynamic availability
                result = []
                for room in rooms:
                    room_data = RoomSerializer(room).data
                    # Dynamic availability based on date conflict (not the room's available flag)
                    room_data['available'] = room.id not in conflicting_room_ids
                    result.append(room_data)

                cache.set(cache_key, result, timeout=300)
                return Response(result)

            except ValueError:
                return Response(
                    {"message": "Invalid date format. Use YYYY-MM-DD."},
                    status=400
                )

        # If no dates provided, return all rooms with their base availability flag
        data = RoomSerializer(rooms, many=True).data
        cache.set(cache_key, data, timeout=300)
        return Response(data)


class AvailableRoomsView(APIView):
    """GET /api/v1/rooms/available/?checkIn=YYYY-MM-DD&checkOut=YYYY-MM-DD"""

    def get(self, request):
        check_in_str = request.query_params.get("checkIn")
        check_out_str = request.query_params.get("checkOut")

        if not check_in_str or not check_out_str:
            return Response(
                {"message": "Both checkIn and checkOut dates are required."},
                status=400
            )

        cache_key = f"available_rooms_{check_in_str}_{check_out_str}"
        cached = cache.get(cache_key)
        if cached:
            return Response(cached)

        try:
            check_in = date.fromisoformat(check_in_str)
            check_out = date.fromisoformat(check_out_str)
        except ValueError:
            return Response({"message": "Invalid date format. Use YYYY-MM-DD."}, status=400)

        if check_out <= check_in:
            return Response({"message": "Check-out must be after check-in."}, status=400)

        # Get ALL rooms
        all_rooms = Room.objects.all()

        # Find rooms with conflicting bookings for the selected dates
        conflicting_room_ids = set(
            Booking.objects.filter(
                status__in=[
                    Booking.BookingStatus.PENDING_DEPOSIT,
                    Booking.BookingStatus.CONFIRMED,
                    Booking.BookingStatus.CHECKED_IN,
                ],
                check_in_date__lt=check_out,
                check_out_date__gt=check_in,
            )
            .values_list("room_id", flat=True)
        )

        # Build response with dynamic availability
        result = []
        for room in all_rooms:
            room_data = RoomSerializer(room).data
            # Dynamic availability based on date conflict
            room_data['available'] = room.id not in conflicting_room_ids
            result.append(room_data)

        result.sort(key=lambda x: x.get('pricePerNight', 0))

        cache.set(cache_key, result, timeout=60)
        return Response(result)
"""
apps/reports/views.py

Admin-only analytics + hotel settings API.

GET  /api/v1/reports/dashboard/    → KPI summary (bookings, revenue, guests, rooms)
GET  /api/v1/reports/revenue/      → revenue chart data (?period=daily|weekly|monthly)
GET  /api/v1/reports/bookings/     → booking chart data
GET  /api/v1/reports/occupancy/    → room occupancy data
GET  /api/v1/reports/checkins/     → today's check-ins and check-outs

GET  /api/v1/reports/settings/     → hotel settings
PUT  /api/v1/reports/settings/     → update hotel settings
"""
import json
from datetime import date, timedelta

from django.db.models import Count, Q, Sum
from django.db.models.functions import TruncDate, TruncWeek, TruncMonth
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.bookings.models import Booking
from apps.payments.models import Payment
from apps.rooms.models import Room
from apps.users.models import User
from .models import HotelSettings
from .serializers import HotelSettingsSerializer


def is_admin(user):
    return getattr(user, "role", None) == "ADMIN" or user.is_staff


# ── Dashboard KPIs ────────────────────────────────────────────────────────────

class DashboardView(APIView):
    """GET /api/v1/reports/dashboard/"""

    def get(self, request):
        if not is_admin(request.user):
            return Response({"message": "Forbidden."}, status=403)

        today    = date.today()
        week_ago = today - timedelta(days=7)

        total_bookings   = Booking.objects.count()
        total_guests     = User.objects.filter(role="USER").count()
        total_revenue    = Payment.objects.filter(status="PAID").aggregate(t=Sum("amount"))["t"] or 0
        available_rooms  = Room.objects.filter(available=True).count()
        todays_checkins  = Booking.objects.filter(check_in_date=today).count()
        todays_checkouts = Booking.objects.filter(check_out_date=today).count()
        pending_bookings = Booking.objects.filter(status="PENDING_DEPOSIT").count()

        # Week-over-week booking change
        this_week = Booking.objects.filter(created_at__date__gte=week_ago).count()
        prev_week = Booking.objects.filter(
            created_at__date__gte=today - timedelta(days=14),
            created_at__date__lt=week_ago,
        ).count()
        booking_change_pct = (
            round(((this_week - prev_week) / prev_week) * 100, 1)
            if prev_week > 0 else 0
        )

        return Response({
            "totalBookings":    total_bookings,
            "totalGuests":      total_guests,
            "totalRevenue":     float(total_revenue),
            "availableRooms":   available_rooms,
            "todaysCheckins":   todays_checkins,
            "todaysCheckouts":  todays_checkouts,
            "pendingBookings":  pending_bookings,
            "bookingChangePct": booking_change_pct,
        })


# ── Revenue Chart ─────────────────────────────────────────────────────────────

class RevenueReportView(APIView):
    """GET /api/v1/reports/revenue/?period=daily|weekly|monthly"""

    def get(self, request):
        if not is_admin(request.user):
            return Response({"message": "Forbidden."}, status=403)

        period = request.query_params.get("period", "monthly")
        today  = date.today()

        if period == "daily":
            start = today - timedelta(days=30)
            trunc = TruncDate
        elif period == "weekly":
            start = today - timedelta(weeks=12)
            trunc = TruncWeek
        else:
            start = today - timedelta(days=365)
            trunc = TruncMonth

        qs = (
            Payment.objects.filter(status="PAID", created_at__date__gte=start)
            .annotate(period=trunc("created_at"))
            .values("period")
            .annotate(total=Sum("amount"), count=Count("id"))
            .order_by("period")
        )

        def fmt(p):
            return str(p.date()) if hasattr(p, "date") else str(p)

        return Response({
            "period": period,
            "data": [
                {
                    "period": fmt(r["period"]),
                    "total":  float(r["total"]),
                    "count":  r["count"],
                }
                for r in qs
            ],
            "totalRevenue": float(sum(r["total"] for r in qs)),
        })


# ── Booking Chart ─────────────────────────────────────────────────────────────

class BookingReportView(APIView):
    """GET /api/v1/reports/bookings/?period=daily|weekly|monthly"""

    def get(self, request):
        if not is_admin(request.user):
            return Response({"message": "Forbidden."}, status=403)

        period = request.query_params.get("period", "monthly")
        today  = date.today()

        if period == "daily":
            start = today - timedelta(days=30)
            trunc = TruncDate
        elif period == "weekly":
            start = today - timedelta(weeks=12)
            trunc = TruncWeek
        else:
            start = today - timedelta(days=365)
            trunc = TruncMonth

        qs = (
            Booking.objects.filter(created_at__date__gte=start)
            .annotate(period=trunc("created_at"))
            .values("period")
            .annotate(count=Count("id"))
            .order_by("period")
        )

        def fmt(p):
            return str(p.date()) if hasattr(p, "date") else str(p)

        return Response({
            "period": period,
            "data": [{"period": fmt(r["period"]), "count": r["count"]} for r in qs],
            "totalBookings": sum(r["count"] for r in qs),
        })


# ── Room Occupancy ────────────────────────────────────────────────────────────

class OccupancyReportView(APIView):
    """GET /api/v1/reports/occupancy/"""

    def get(self, request):
        if not is_admin(request.user):
            return Response({"message": "Forbidden."}, status=403)

        rooms = Room.objects.annotate(
            confirmed_bookings=Count(
                "bookings",
                filter=Q(bookings__status__in=["CONFIRMED", "CHECKED_IN", "COMPLETED"])
            )
        ).values(
            "id", "room_number", "room_type",
            "price_per_night", "available", "confirmed_bookings"
        ).order_by("-confirmed_bookings")

        return Response(list(rooms))


# ── Today's Check-ins / Check-outs ────────────────────────────────────────────

class TodayCheckinsView(APIView):
    """GET /api/v1/reports/checkins/"""

    def get(self, request):
        if not is_admin(request.user):
            return Response({"message": "Forbidden."}, status=403)

        today = date.today()

        checkins = Booking.objects.filter(
            check_in_date=today
        ).select_related("user", "room").values(
            "id", "booking_reference",
            "user__email", "user__username",
            "room__room_number", "room__room_type",
            "number_of_guests", "status",
        )

        checkouts = Booking.objects.filter(
            check_out_date=today
        ).select_related("user", "room").values(
            "id", "booking_reference",
            "user__email", "user__username",
            "room__room_number", "room__room_type",
            "status",
        )

        return Response({
            "date":      str(today),
            "checkins":  list(checkins),
            "checkouts": list(checkouts),
        })


# ── Hotel Settings ────────────────────────────────────────────────────────────

class HotelSettingsView(APIView):
    """
    GET /api/v1/reports/settings/  → public (used by frontend)
    PUT /api/v1/reports/settings/  → admin only
    """

    def get_permissions(self):
        from rest_framework.permissions import AllowAny, IsAuthenticated
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated()]

    def get(self, request):
        settings = HotelSettings.get_settings()
        return Response(HotelSettingsSerializer(settings).data)

    def put(self, request):
        if not is_admin(request.user):
            return Response({"message": "Forbidden."}, status=403)

        settings = HotelSettings.get_settings()
        ser = HotelSettingsSerializer(settings, data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(ser.data)

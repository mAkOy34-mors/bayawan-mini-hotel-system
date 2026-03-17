"""
apps/support/views.py

POST /api/v1/support/                    → guest submits a ticket
GET  /api/v1/support/my-tickets/         → guest views own tickets
GET  /api/v1/support/<pk>/               → ticket detail with replies

Admin only:
GET  /api/v1/support/all/                → all tickets
POST /api/v1/support/<pk>/reply/         → staff replies
POST /api/v1/support/<pk>/status/        → update ticket status
"""
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import SupportTicket, TicketReply
from .serializers import (
    CreateTicketSerializer, ReplyTicketSerializer,
    SupportTicketSerializer, UpdateTicketStatusSerializer,
)


def is_admin(user):
    return getattr(user, "role", None) == "ADMIN" or user.is_staff


# ── Guest ─────────────────────────────────────────────────────────────────────

class CreateTicketView(APIView):
    """POST /api/v1/support/ — authenticated or anonymous"""
    permission_classes = [AllowAny]

    def post(self, request):
        ser = CreateTicketSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        d = ser.validated_data

        ticket = SupportTicket.objects.create(
            user=request.user if request.user.is_authenticated else None,
            name=d.get("name", ""),
            email=d["email"],
            subject=d["subject"],
            message=d["message"],
            priority=d["priority"],
        )
        return Response(SupportTicketSerializer(ticket).data, status=status.HTTP_201_CREATED)


class MyTicketsView(APIView):
    """GET /api/v1/support/my-tickets/"""

    def get(self, request):
        tickets = SupportTicket.objects.filter(user=request.user)
        return Response(SupportTicketSerializer(tickets, many=True).data)


class TicketDetailView(APIView):
    """GET /api/v1/support/<pk>/"""

    def get(self, request, pk):
        try:
            ticket = SupportTicket.objects.prefetch_related("replies__author").get(pk=pk)
        except SupportTicket.DoesNotExist:
            return Response({"message": "Ticket not found."}, status=404)

        # Guests can only see their own tickets
        if not is_admin(request.user) and ticket.user != request.user:
            return Response({"message": "Forbidden."}, status=403)

        return Response(SupportTicketSerializer(ticket).data)


# ── Admin ─────────────────────────────────────────────────────────────────────

class AllTicketsView(APIView):
    """GET /api/v1/support/all/"""

    def get(self, request):
        if not is_admin(request.user):
            return Response({"message": "Forbidden."}, status=403)

        status_filter = request.query_params.get("status", "")
        qs = SupportTicket.objects.prefetch_related("replies").all()
        if status_filter:
            qs = qs.filter(status=status_filter)

        return Response(SupportTicketSerializer(qs, many=True).data)


class ReplyTicketView(APIView):
    """POST /api/v1/support/<pk>/reply/ — admin only"""

    def post(self, request, pk):
        if not is_admin(request.user):
            return Response({"message": "Forbidden."}, status=403)

        try:
            ticket = SupportTicket.objects.get(pk=pk)
        except SupportTicket.DoesNotExist:
            return Response({"message": "Ticket not found."}, status=404)

        ser = ReplyTicketSerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        TicketReply.objects.create(
            ticket=ticket,
            author=request.user,
            message=ser.validated_data["message"],
            is_staff=True,
        )

        # Auto move to in-progress
        if ticket.status == SupportTicket.Status.OPEN:
            ticket.status = SupportTicket.Status.IN_PROGRESS
            ticket.save(update_fields=["status"])

        return Response({"message": "Reply sent."})


class UpdateTicketStatusView(APIView):
    """POST /api/v1/support/<pk>/status/ — admin only"""

    def post(self, request, pk):
        if not is_admin(request.user):
            return Response({"message": "Forbidden."}, status=403)

        try:
            ticket = SupportTicket.objects.get(pk=pk)
        except SupportTicket.DoesNotExist:
            return Response({"message": "Ticket not found."}, status=404)

        ser = UpdateTicketStatusSerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        ticket.status = ser.validated_data["status"]
        ticket.save(update_fields=["status"])

        return Response({"message": f"Ticket status updated to {ticket.status}."})

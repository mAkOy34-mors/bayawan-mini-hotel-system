"""
apps/payments/views.py

GET  /api/v1/payments/my-payments       → list authenticated user's payments
POST /api/v1/payments/create-link       → create a PayMongo checkout session
GET  /api/v1/payments/status/<pk>/      → poll payment status (used by receptionist QR modal)
"""

import logging

from django.core.cache import cache
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Payment
from .paymongo import create_payment_link
from .serializers import CreatePaymentLinkSerializer, PaymentSerializer

logger = logging.getLogger(__name__)


class MyPaymentsView(APIView):
    """GET /api/v1/payments/my-payments"""

    def get(self, request):
        cache_key = f"my_payments_{request.user.email}"
        cached    = cache.get(cache_key)
        if cached:
            return Response(cached)

        payments = Payment.objects.filter(email=request.user.email).order_by("-created_at")
        data = PaymentSerializer(payments, many=True).data
        cache.set(cache_key, data, timeout=30)
        return Response(data)


class CreatePaymentLinkView(APIView):
    """
    POST /api/v1/payments/create-link

    Creates a PayMongo Checkout Session (supports card, GCash, GrabPay, QR PH, etc.)
    Returns a checkoutUrl the frontend opens in an iframe.
    """

    def post(self, request):
        ser = CreatePaymentLinkSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        d = ser.validated_data

        booking_reference = ""
        booking_id = d.get("booking_id")
        guest_email = None

        if booking_id:
            try:
                from apps.bookings.models import Booking
                booking = Booking.objects.get(id=booking_id)
                booking_reference = booking.booking_reference or ""
                guest_email = booking.user.email  # ← Get guest email from booking
                logger.info(f"Creating payment link for booking {booking_reference} - Guest email: {guest_email}")
            except Exception as e:
                logger.error(f"Error getting booking: {e}")
                guest_email = request.user.email  # Fallback (should not happen)

        # Use guest email, not request.user.email
        email_to_use = guest_email or request.user.email

        try:
            result = create_payment_link(
                amount=d["amount"],
                description=d["description"],
                remarks=d.get("remarks", ""),
                booking_id=booking_id,
                booking_reference=booking_reference,
            )
        except Exception as e:
            return Response(
                {"message": str(e)},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        payment = Payment.objects.create(
            paymongo_link_id=result["paymongo_link_id"],
            checkout_url=result["checkout_url"],
            email=email_to_use,  # ← Use guest email here
            description=d["description"],
            amount=d["amount"],
            status=Payment.PaymentStatus.PENDING,
            type=d["type"],
            booking_id=booking_id,
        )

        cache.delete(f"my_payments_{email_to_use}")

        logger.info(
            "Checkout session created: %s for guest %s (booking: %s)",
            result["paymongo_link_id"], email_to_use, booking_reference,
        )

        return Response(
            {
                "paymentId": payment.id,
                "checkoutUrl": result["checkout_url"],
                "status": result["status"],
            },
            status=status.HTTP_201_CREATED,
        )

class PaymentStatusView(APIView):
    """
    GET /api/v1/payments/status/<pk>/

    Lightweight polling endpoint.  The receptionist QR modal calls this
    every 3 seconds after opening the PayMongo iframe to detect when the
    webhook has flipped status → PAID.

    Response:
        {
            "id":        1,
            "status":    "PAID" | "PENDING" | "FAILED",
            "bookingId": 42,
            "paidAt":    "2026-04-20T10:30:00Z" | null
        }
    """

    def get(self, request, pk):
        try:
            payment = Payment.objects.get(pk=pk)
        except Payment.DoesNotExist:
            return Response(
                {"error": "Payment not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response({
            "id":        payment.id,
            "status":    payment.status,
            "bookingId": payment.booking_id,
            "paidAt":    payment.paid_at.isoformat() if payment.paid_at else None,
        })
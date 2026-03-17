"""
apps/payments/views.py

GET  /api/v1/payments/my-payments    → list authenticated user's payments
POST /api/v1/payments/create-link    → create a PayMongo payment link
"""

import logging

import hmac
import hashlib
import json
from django.conf import settings
from django.utils import timezone


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
        payments = (
            Payment.objects.filter(email=request.user.email)
            .order_by("-created_at")
        )
        return Response(PaymentSerializer(payments, many=True).data)


class CreatePaymentLinkView(APIView):
    """
    POST /api/v1/payments/create-link

    Request body:
    {
        "amount":      1500.00,
        "description": "Deposit for Booking BKG-123",
        "bookingId":   42,
        "type":        "DEPOSIT"
    }

    Response:
    {
        "paymentId":   1,
        "checkoutUrl": "https://pm.link/...",
        "status":      "unpaid"
    }
    """

    def post(self, request):
        ser = CreatePaymentLinkSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        d = ser.validated_data

        try:
            result = create_payment_link(
                amount=d["amount"],
                description=d["description"],
                remarks=d.get("remarks", ""),
            )
        except Exception as e:
            return Response(
                {"message": str(e)},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        # Save Payment record in DB
        payment = Payment.objects.create(
            paymongo_link_id=result["paymongo_link_id"],
            checkout_url=result["checkout_url"],
            email=request.user.email,
            description=d["description"],
            amount=d["amount"],
            status=Payment.PaymentStatus.PENDING,
            type=d["type"],
            booking_id=d.get("booking_id"),
        )

        logger.info(
            "Payment link created: %s for user %s",
            result["paymongo_link_id"], request.user.email,
        )

        return Response(
            {
                "paymentId":   payment.id,
                "checkoutUrl": result["checkout_url"],
                "status":      result["status"],
            },
            status=status.HTTP_201_CREATED,
        )

class PayMongoWebhookView(APIView):
    """
    POST /api/v1/payments/webhook/
    PayMongo calls this after payment is completed.
    Set this URL in PayMongo dashboard → Webhooks.
    """
    permission_classes = []  # PayMongo doesn't send auth token

    def post(self, request):
        # ── Verify webhook signature ──────────────────────────────
        sig = request.headers.get("Paymongo-Signature", "")
        webhook_secret = getattr(settings, "PAYMONGO_WEBHOOK_SECRET", "")

        if webhook_secret:
            raw_body = request.body.decode("utf-8")
            parts = dict(p.split("=", 1) for p in sig.split(",") if "=" in p)
            timestamp = parts.get("t", "")
            signature = parts.get("te", "") or parts.get("li", "")
            expected = hmac.new(
                webhook_secret.encode(),
                f"{timestamp}.{raw_body}".encode(),
                hashlib.sha256,
            ).hexdigest()
            if not hmac.compare_digest(expected, signature):
                logger.warning("Invalid PayMongo webhook signature")
                return Response({"message": "Invalid signature."}, status=400)

        # ── Parse event ───────────────────────────────────────────
        try:
            payload    = request.data
            event_type = payload["data"]["attributes"]["type"]
            data       = payload["data"]["attributes"]["data"]
        except (KeyError, TypeError):
            return Response({"message": "Invalid payload."}, status=400)

        logger.info("PayMongo webhook received: %s", event_type)

        # ── Handle payment paid ───────────────────────────────────
        if event_type in ("payment.paid", "link.payment.paid"):
            try:
                # Get the payment link ID from webhook data
                link_id = (
                    data.get("attributes", {}).get("source", {}).get("id")
                    or data.get("id", "")
                )

                # Find payment record
                payment = Payment.objects.filter(
                    paymongo_link_id=link_id
                ).first()

                if not payment:
                    # Try finding by checkout URL or description
                    logger.warning("Payment not found for link_id: %s", link_id)
                    return Response({"message": "Payment not found."}, status=404)

                # Update payment record
                payment.status  = Payment.PaymentStatus.PAID
                payment.paid_at = timezone.now()
                payment.save(update_fields=["status", "paid_at"])

                # Update booking status
                if payment.booking_id:
                    from apps.bookings.models import Booking
                    try:
                        booking = Booking.objects.get(id=payment.booking_id)

                        # Determine if full payment or deposit
                        if payment.type == "ROOM_BOOKING":
                            # Full payment — mark confirmed + zero remaining
                            booking.remaining_amount = 0
                            booking.payment_status   = Booking.PaymentStatus.PAID
                        else:
                            # Deposit paid
                            booking.payment_status = Booking.PaymentStatus.PARTIAL

                        booking.status = Booking.BookingStatus.CONFIRMED
                        booking.save(update_fields=[
                            "status", "payment_status", "remaining_amount"
                        ])

                        logger.info(
                            "Booking %s confirmed after payment %s",
                            booking.booking_reference, payment.id
                        )
                    except Booking.DoesNotExist:
                        logger.warning("Booking %s not found", payment.booking_id)

            except Exception as e:
                logger.error("Webhook processing error: %s", e)
                return Response({"message": "Processing error."}, status=500)

        return Response({"message": "Webhook received."}, status=200)
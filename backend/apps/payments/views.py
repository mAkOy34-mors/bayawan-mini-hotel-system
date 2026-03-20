"""
apps/payments/views.py

GET  /api/v1/payments/my-payments    → list authenticated user's payments
POST /api/v1/payments/create-link    → create a PayMongo payment link
"""

import logging
import hmac
import hashlib

from django.conf import settings
from django.core.cache import cache
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
        cache_key = f"my_payments_{request.user.email}"
        cached    = cache.get(cache_key)
        if cached:
            return Response(cached)

        payments = (
            Payment.objects.filter(email=request.user.email)
            .order_by("-created_at")
        )
        data = PaymentSerializer(payments, many=True).data
        cache.set(cache_key, data, timeout=30)
        return Response(data)


class CreatePaymentLinkView(APIView):
    """
    POST /api/v1/payments/create-link
    """

    def post(self, request):
        ser = CreatePaymentLinkSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        d = ser.validated_data

        try:
            result = create_payment_link(
                amount      = d["amount"],
                description = d["description"],
                remarks     = d.get("remarks", ""),
            )
        except Exception as e:
            return Response(
                {"message": str(e)},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        payment = Payment.objects.create(
            paymongo_link_id = result["paymongo_link_id"],
            checkout_url     = result["checkout_url"],
            email            = request.user.email,
            description      = d["description"],
            amount           = d["amount"],
            status           = Payment.PaymentStatus.PENDING,
            type             = d["type"],
            booking_id       = d.get("booking_id"),
        )

        # Clear payments cache so new payment shows immediately
        cache.delete(f"my_payments_{request.user.email}")

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
    """
    permission_classes = []

    def post(self, request):
        # Verify webhook signature
        sig            = request.headers.get("Paymongo-Signature", "")
        webhook_secret = getattr(settings, "PAYMONGO_WEBHOOK_SECRET", "")

        if webhook_secret:
            raw_body  = request.body.decode("utf-8")
            parts     = dict(p.split("=", 1) for p in sig.split(",") if "=" in p)
            timestamp = parts.get("t", "")
            signature = parts.get("te", "") or parts.get("li", "")
            expected  = hmac.new(
                webhook_secret.encode(),
                f"{timestamp}.{raw_body}".encode(),
                hashlib.sha256,
            ).hexdigest()
            if not hmac.compare_digest(expected, signature):
                logger.warning("Invalid PayMongo webhook signature")
                return Response({"message": "Invalid signature."}, status=400)

        # Parse event
        try:
            payload    = request.data
            event_type = payload["data"]["attributes"]["type"]
            data       = payload["data"]["attributes"]["data"]
        except (KeyError, TypeError):
            return Response({"message": "Invalid payload."}, status=400)

        logger.info("PayMongo webhook received: %s", event_type)

        # Handle payment paid
        if event_type in ("payment.paid", "link.payment.paid"):
            try:
                link_id = (
                    data.get("attributes", {}).get("source", {}).get("id")
                    or data.get("id", "")
                )

                payment = Payment.objects.filter(
                    paymongo_link_id=link_id
                ).first()

                if not payment:
                    logger.warning("Payment not found for link_id: %s", link_id)
                    return Response({"message": "Payment not found."}, status=404)

                payment.status  = Payment.PaymentStatus.PAID
                payment.paid_at = timezone.now()
                payment.save(update_fields=["status", "paid_at"])

                # Clear payments cache for this user
                cache.delete(f"my_payments_{payment.email}")

                if payment.booking_id:
                    from apps.bookings.models import Booking
                    try:
                        booking = Booking.objects.get(id=payment.booking_id)

                        if payment.type == "ROOM_BOOKING":
                            booking.remaining_amount = 0
                            booking.payment_status   = Booking.PaymentStatus.PAID
                        else:
                            booking.payment_status = Booking.PaymentStatus.PARTIAL

                        booking.status = Booking.BookingStatus.CONFIRMED
                        booking.save(update_fields=[
                            "status", "payment_status", "remaining_amount"
                        ])

                        # Clear booking caches after payment confirmed
                        cache.delete(f"my_bookings_{booking.user_id}")
                        cache.delete(f"receptionist_booking_{booking.id}")
                        cache.delete("receptionist_bookings_all")

                        logger.info(
                            "Booking %s confirmed after payment %s",
                            booking.booking_reference, payment.id,
                        )
                    except Booking.DoesNotExist:
                        logger.warning("Booking %s not found", payment.booking_id)

            except Exception as e:
                logger.error("Webhook processing error: %s", e)
                return Response({"message": "Processing error."}, status=500)

        return Response({"message": "Webhook received."}, status=200)
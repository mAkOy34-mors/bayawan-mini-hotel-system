"""apps/payments/webhook_views.py"""
import json
import logging

from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Payment
from apps.bookings.models import Booking

logger = logging.getLogger(__name__)


@method_decorator(csrf_exempt, name='dispatch')
class PayMongoWebhookView(APIView):
    """
    POST /api/v1/payments/webhook/
    PayMongo calls this when a payment link is paid.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            payload    = json.loads(request.body)
            event_type = payload.get("data", {}).get("attributes", {}).get("type")
            logger.info("PayMongo webhook received: %s", event_type)
            logger.info("Full webhook payload: %s", json.dumps(payload, indent=2))

            if event_type == "link.payment.paid":
                data       = payload.get("data", {})
                attributes = data.get("attributes", {})

                # Correct path from webhook payload:
                # data → attributes → data → id  =  "link_xxxxxx"
                link_id = attributes.get("data", {}).get("id", "")
                amount_paid = attributes.get("data", {}).get("attributes", {}).get("amount", 0) / 100

                logger.info("Extracted link_id: %s", link_id)

                # Update payment record
                try:
                    payment = Payment.objects.get(paymongo_link_id=link_id)
                    payment.status  = "PAID"
                    payment.paid_at = timezone.now()
                    payment.save(update_fields=["status", "paid_at"])
                    logger.info("Payment %s marked as PAID", link_id)

                    # Update booking
                    if payment.booking_id:
                        try:
                            booking = Booking.objects.get(id=payment.booking_id)
                            if payment.type in ["DEPOSIT", "ROOM_BOOKING"]:
                                booking.payment_status  = Booking.PaymentStatus.DEPOSIT_PAID
                                booking.status          = Booking.BookingStatus.CONFIRMED
                                booking.deposit_paid_at = timezone.now()
                            elif payment.type == "BALANCE":
                                booking.payment_status  = Booking.PaymentStatus.FULLY_PAID
                                booking.balance_paid_at = timezone.now()
                            booking.save()
                            logger.info("Booking %s updated after payment", booking.booking_reference)
                        except Booking.DoesNotExist:
                            logger.warning("Booking %s not found", payment.booking_id)

                except Payment.DoesNotExist:
                    logger.warning("Payment link %s not found in DB", link_id)

        except Exception as e:
            logger.error("Webhook processing error: %s", e)

        return Response({"received": True})


class PaymentSuccessView(APIView):
    """GET /api/v1/payments/success/?reference=<booking_reference>"""
    permission_classes = [AllowAny]

    def get(self, request):
        reference = request.query_params.get("reference")
        if not reference:
            return Response({"message": "No reference provided."}, status=400)

        try:
            booking = Booking.objects.select_related("room").get(
                booking_reference=reference
            )
            return Response({
                "success":          True,
                "bookingReference": booking.booking_reference,
                "status":           booking.status,
                "paymentStatus":    booking.payment_status,
                "roomType":         booking.room.room_type,
                "roomNumber":       booking.room.room_number,
                "checkInDate":      str(booking.check_in_date),
                "checkOutDate":     str(booking.check_out_date),
                "totalAmount":      float(booking.total_amount),
                "depositAmount":    float(booking.deposit_amount),
            })
        except Booking.DoesNotExist:
            return Response({"message": "Booking not found."}, status=404)
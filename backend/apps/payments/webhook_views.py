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
from apps.bookings.models import Booking, BookingChangeRequest

logger = logging.getLogger(__name__)


@method_decorator(csrf_exempt, name='dispatch')
class PayMongoWebhookView(APIView):
    """
    POST /api/v1/payments/webhook/
    """
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            payload = json.loads(request.body)
            event_type = payload.get("data", {}).get("attributes", {}).get("type")
            logger.info("PayMongo webhook received: %s", event_type)

            if event_type == "link.payment.paid":
                attributes = payload.get("data", {}).get("attributes", {})
                link_id = attributes.get("data", {}).get("id", "")
                amount_paid = attributes.get("data", {}).get("attributes", {}).get("amount", 0) / 100

                logger.info("Extracted link_id: %s, amount: %s", link_id, amount_paid)

                # Update payment record
                try:
                    payment = Payment.objects.get(paymongo_link_id=link_id)
                    payment.status = "PAID"
                    payment.paid_at = timezone.now()
                    payment.save(update_fields=["status", "paid_at"])
                    logger.info("Payment %s marked as PAID", link_id)

                    # Handle booking update
                    if payment.booking_id:
                        try:
                            booking = Booking.objects.get(id=payment.booking_id)

                            if payment.type == "ADDITIONAL_DEPOSIT":
                                # Find the change request
                                change_request = BookingChangeRequest.objects.filter(
                                    booking=booking,
                                    payment_link_id=link_id
                                ).first()

                                if change_request:
                                    # Apply the changes to booking
                                    if change_request.requested_checkin and change_request.requested_checkout:
                                        booking.check_in_date = change_request.requested_checkin
                                        booking.check_out_date = change_request.requested_checkout
                                        booking.number_of_nights = change_request.new_nights
                                        booking.total_amount = change_request.new_total
                                        booking.deposit_amount += change_request.additional_deposit
                                        booking.remaining_amount = booking.total_amount - booking.deposit_amount
                                        booking.save()

                                    if change_request.requested_room_type:
                                        from apps.rooms.models import Room
                                        new_room = Room.objects.get(room_type=change_request.requested_room_type)
                                        booking.room = new_room
                                        booking.save()

                                    # Mark change request as approved
                                    change_request.status = "APPROVED"
                                    change_request.payment_completed = True
                                    change_request.reviewed_at = timezone.now()
                                    change_request.save()

                                    logger.info("Change request %s completed after payment", change_request.id)

                            elif payment.type in ["DEPOSIT", "ROOM_BOOKING"]:
                                booking.payment_status = Booking.PaymentStatus.DEPOSIT_PAID
                                booking.status = Booking.BookingStatus.CONFIRMED
                                booking.deposit_paid_at = timezone.now()
                                booking.save()
                            elif payment.type == "BALANCE":
                                booking.payment_status = Booking.PaymentStatus.FULLY_PAID
                                booking.balance_paid_at = timezone.now()
                                booking.save()

                            # Clear caches
                            from django.core.cache import cache
                            cache.delete(f"my_bookings_{booking.user_id}")
                            logger.info("Booking %s updated after payment", booking.booking_reference)

                        except Booking.DoesNotExist:
                            logger.warning("Booking %s not found", payment.booking_id)
                        except Exception as e:
                            logger.error("Error updating booking: %s", e)

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
"""apps/payments/webhook_views.py"""
import json
import logging
import uuid

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
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            payload = json.loads(request.body)
            event_type = payload.get("data", {}).get("attributes", {}).get("type", "")
            logger.info("PayMongo webhook received: %s", event_type)

            if event_type == "checkout_session.payment.paid":
                self._handle_checkout_session_paid(payload)
            elif event_type == "link.payment.paid":
                self._handle_link_paid(payload)
            else:
                logger.info("Unhandled webhook event type: %s", event_type)

        except Exception as e:
            logger.error("Webhook processing error: %s", e, exc_info=True)
            return Response({"received": True, "error": str(e)})

        return Response({"received": True})

    def _handle_checkout_session_paid(self, payload):
        event_data = payload.get("data", {}).get("attributes", {}).get("data", {})
        session_id = event_data.get("id", "")
        attributes = event_data.get("attributes", {})
        checkout_url = attributes.get("checkout_url", "")

        logger.info("Checkout session paid: %s", session_id)

        # First, try to find existing Payment record
        try:
            payment = Payment.objects.get(paymongo_link_id=session_id)
            logger.info("Found existing Payment record for session_id: %s", session_id)
        except Payment.DoesNotExist:
            payment = None
            logger.info("No existing Payment record found for session_id: %s", session_id)

        # Check for partner service request
        try:
            from apps.services.third_party_models import GuestPartnerRequest

            partner_request = GuestPartnerRequest.objects.get(payment_intent_id=session_id)
            logger.info("Found partner service request for payment: %s", partner_request.id)

            # ============================================================
            # 1. UPDATE GUEST PARTNER REQUEST
            # ============================================================
            partner_request.payment_status = 'PAID'
            partner_request.paid_at = timezone.now()
            partner_request.receipt_number = f"RCP-{uuid.uuid4().hex[:8].upper()}"
            partner_request.save()
            logger.info("Partner request %s payment_status updated to PAID", partner_request.id)

            # Update request status to CONFIRMED if still pending
            if partner_request.status == 'PENDING':
                partner_request.status = 'CONFIRMED'
                partner_request.confirmed_at = timezone.now()
                partner_request.save()
                logger.info("Partner request %s status updated to CONFIRMED", partner_request.id)

            # ============================================================
            # 2. CREATE/UPDATE PAYMENT RECORD
            # ============================================================
            service_name = partner_request.partner_service.name if partner_request.partner_service else partner_request.partner.name

            if payment:
                # Update existing payment
                payment.status = Payment.PaymentStatus.PAID
                payment.paid_at = timezone.now()
                payment.save(update_fields=["status", "paid_at"])
                logger.info("Updated existing Payment record %s to PAID", payment.id)
            else:
                # Create new payment record
                payment = Payment.objects.create(
                    paymongo_link_id=session_id,
                    checkout_url=checkout_url,
                    email=partner_request.guest_email,
                    description=f"Partner Service: {partner_request.partner.name} - {service_name}",
                    amount=partner_request.total_amount,
                    status=Payment.PaymentStatus.PAID,
                    type="SERVICE",  # Use string to avoid enum issues
                    booking_id=None,
                    paid_at=timezone.now()
                )
                logger.info("Created new Payment record %s for partner request %s", payment.id, partner_request.id)

        except GuestPartnerRequest.DoesNotExist:
            logger.warning("No partner request found for session_id: %s", session_id)

            # Handle regular booking payment if exists
            if payment:
                payment.status = Payment.PaymentStatus.PAID
                payment.paid_at = timezone.now()
                payment.save(update_fields=["status", "paid_at"])
                logger.info("Payment %s marked as PAID", session_id)

                from django.core.cache import cache
                cache.delete(f"my_payments_{payment.email}")

                if payment.booking_id:
                    self._update_booking(payment)
            else:
                logger.warning("No payment or partner request found for session_id: %s", session_id)

        except Exception as e:
            logger.error("Error processing partner request payment: %s", e, exc_info=True)

    def _handle_link_paid(self, payload):
        attributes = payload.get("data", {}).get("attributes", {})
        event_data = attributes.get("data", {})
        link_id = event_data.get("id", "")
        amount_paid = event_data.get("attributes", {}).get("amount", 0) / 100

        logger.info("Link paid: %s, amount: %s", link_id, amount_paid)

        try:
            payment = Payment.objects.get(paymongo_link_id=link_id)
        except Payment.DoesNotExist:
            logger.warning("Payment link %s not found in DB", link_id)
            return

        payment.status = Payment.PaymentStatus.PAID
        payment.paid_at = timezone.now()
        payment.save(update_fields=["status", "paid_at"])
        logger.info("Payment %s marked as PAID", link_id)

        from django.core.cache import cache
        cache.delete(f"my_payments_{payment.email}")

        if payment.booking_id:
            self._update_booking(payment)

    def _update_booking(self, payment):
        from django.core.cache import cache

        try:
            booking = Booking.objects.get(id=payment.booking_id)

            if payment.type == "ADDITIONAL_DEPOSIT":
                change_request = BookingChangeRequest.objects.filter(
                    booking=booking,
                    payment_link_id=payment.paymongo_link_id,
                ).first()

                if change_request:
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

            cache.delete(f"my_bookings_{booking.user_id}")
            cache.delete(f"receptionist_booking_{booking.id}")
            cache.delete("receptionist_bookings_all")

            logger.info("Booking %s updated after payment (type: %s)", booking.booking_reference, payment.type)

        except Booking.DoesNotExist:
            logger.warning("Booking %s not found for payment %s", payment.booking_id, payment.id)
        except Exception as e:
            logger.error("Error updating booking for payment %s: %s", payment.id, e, exc_info=True)


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
                "success": True,
                "bookingReference": booking.booking_reference,
                "status": booking.status,
                "paymentStatus": booking.payment_status,
                "roomType": booking.room.room_type,
                "roomNumber": booking.room.room_number,
                "checkInDate": str(booking.check_in_date),
                "checkOutDate": str(booking.check_out_date),
                "totalAmount": float(booking.total_amount),
                "depositAmount": float(booking.deposit_amount),
            })
        except Booking.DoesNotExist:
            return Response({"message": "Booking not found."}, status=404)
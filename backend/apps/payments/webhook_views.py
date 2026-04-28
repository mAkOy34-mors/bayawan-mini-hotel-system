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
            payload    = json.loads(request.body)
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
        event_data   = payload.get("data", {}).get("attributes", {}).get("data", {})
        session_id   = event_data.get("id", "")
        attributes   = event_data.get("attributes", {})
        checkout_url = attributes.get("checkout_url", "")

        logger.info("Checkout session paid: %s", session_id)

        # ── 1. Find existing Payment record ──────────────────────────────
        try:
            payment = Payment.objects.get(paymongo_link_id=session_id)
            logger.info("Found existing Payment record for session_id: %s", session_id)
        except Payment.DoesNotExist:
            payment = None
            logger.info("No existing Payment record found for session_id: %s", session_id)

        # ── 2. Check for partner service request ─────────────────────────
        try:
            from apps.services.third_party_models import GuestPartnerRequest

            partner_request = GuestPartnerRequest.objects.get(payment_intent_id=session_id)
            logger.info("Found partner service request for payment: %s", partner_request.id)

            partner_request.payment_status = 'PAID'
            partner_request.paid_at        = timezone.now()
            partner_request.receipt_number = f"RCP-{uuid.uuid4().hex[:8].upper()}"
            partner_request.save()

            if partner_request.status == 'PENDING':
                partner_request.status       = 'CONFIRMED'
                partner_request.confirmed_at = timezone.now()
                partner_request.save()

            service_name = (
                partner_request.partner_service.name
                if partner_request.partner_service
                else partner_request.partner.name
            )

            if payment:
                payment.status  = Payment.PaymentStatus.PAID
                payment.paid_at = timezone.now()
                payment.save(update_fields=["status", "paid_at"])
            else:
                Payment.objects.create(
                    paymongo_link_id=session_id,
                    checkout_url=checkout_url,
                    email=partner_request.guest_email,
                    description=f"Partner Service: {partner_request.partner.name} - {service_name}",
                    amount=partner_request.total_amount,
                    status=Payment.PaymentStatus.PAID,
                    type="SERVICE",
                    booking_id=None,
                    paid_at=timezone.now(),
                )
            return

        except GuestPartnerRequest.DoesNotExist:
            pass  # fall through to booking logic
        except Exception as e:
            logger.error("Error checking partner request: %s", e, exc_info=True)

        # ── 3. Handle regular booking payment ────────────────────────────
        if payment:
            # Mark payment as PAID
            payment.status  = Payment.PaymentStatus.PAID
            payment.paid_at = timezone.now()
            payment.save(update_fields=["status", "paid_at"])
            logger.info("Payment %s marked as PAID (type: %s)", session_id, payment.type)

            from django.core.cache import cache
            cache.delete(f"my_payments_{payment.email}")

            if payment.booking_id:
                # ── ADDITIONAL_DEPOSIT from a change request ──────────────
                if payment.type == "ADDITIONAL_DEPOSIT":
                    self._handle_additional_deposit_paid(payment)
                else:
                    self._update_booking(payment)
        else:
            logger.warning("No payment or partner request found for session_id: %s", session_id)

    # ─────────────────────────────────────────────────────────────────────
    # NEW: Handle ADDITIONAL_DEPOSIT paid — completes the change request
    # ─────────────────────────────────────────────────────────────────────

    def _handle_additional_deposit_paid(self, payment):
        """
        Called when a PayMongo checkout_session for an ADDITIONAL_DEPOSIT is paid.

        Flow:
            1. Find the BookingChangeRequest linked by payment_link_id
            2. Update the booking (dates, room type, amounts)
            3. Mark the change request as APPROVED + payment_completed=True
            4. Invalidate relevant caches
        """
        from django.core.cache import cache
        from decimal import Decimal

        try:
            change_request = BookingChangeRequest.objects.select_related(
                'booking', 'booking__room', 'booking__user'
            ).get(payment_link_id=payment.paymongo_link_id)

        except BookingChangeRequest.DoesNotExist:
            logger.warning(
                "No change request found for payment_link_id %s — falling back to _update_booking",
                payment.paymongo_link_id,
            )
            self._update_booking(payment)
            return
        except Exception as e:
            logger.error("Error finding change request for payment %s: %s", payment.id, e)
            return

        booking = change_request.booking

        try:
            # ── Apply date changes ────────────────────────────────────────
            if change_request.requested_checkin and change_request.requested_checkout:
                booking.check_in_date    = change_request.requested_checkin
                booking.check_out_date   = change_request.requested_checkout
                booking.number_of_nights = change_request.new_nights or (
                    (change_request.requested_checkout - change_request.requested_checkin).days
                )

            # ── Apply room-type change ────────────────────────────────────
            if change_request.requested_room_type and \
               change_request.requested_room_type != booking.room.room_type:
                from apps.rooms.models import Room
                try:
                    new_room   = Room.objects.get(room_type=change_request.requested_room_type)
                    booking.room = new_room
                except Room.DoesNotExist:
                    logger.warning(
                        "Room type %s not found when completing change request %s",
                        change_request.requested_room_type, change_request.id,
                    )

            # ── Apply financial changes ───────────────────────────────────
            if change_request.new_total:
                booking.total_amount     = change_request.new_total
                # Add what was just paid to the deposit tally
                booking.deposit_amount   = (
                    Decimal(str(booking.deposit_amount or 0)) +
                    Decimal(str(payment.amount or 0))
                )
                booking.remaining_amount = (
                    Decimal(str(booking.total_amount)) -
                    Decimal(str(booking.deposit_amount))
                )

            booking.save()

            # ── Mark change request as completed ─────────────────────────
            change_request.status            = 'APPROVED'
            change_request.payment_completed = True
            change_request.reviewed_at       = change_request.reviewed_at or timezone.now()
            change_request.save(update_fields=['status', 'payment_completed', 'reviewed_at'])

            # ── Invalidate caches ─────────────────────────────────────────
            cache.delete(f"my_bookings_{booking.user_id}")
            cache.delete(f"receptionist_booking_{booking.id}")
            cache.delete("receptionist_bookings_all")
            cache.delete(f"my_payments_{payment.email}")

            logger.info(
                "Change request %s completed after ADDITIONAL_DEPOSIT payment. "
                "Booking %s updated.",
                change_request.id, booking.booking_reference,
            )

        except Exception as e:
            logger.error(
                "Error completing change request %s after payment: %s",
                change_request.id, e, exc_info=True,
            )

    def _handle_link_paid(self, payload):
        attributes = payload.get("data", {}).get("attributes", {})
        event_data = attributes.get("data", {})
        link_id    = event_data.get("id", "")
        amount_paid = event_data.get("attributes", {}).get("amount", 0) / 100

        logger.info("Link paid: %s, amount: %s", link_id, amount_paid)

        try:
            payment = Payment.objects.get(paymongo_link_id=link_id)
        except Payment.DoesNotExist:
            logger.warning("Payment link %s not found in DB", link_id)
            return

        payment.status  = Payment.PaymentStatus.PAID
        payment.paid_at = timezone.now()
        payment.save(update_fields=["status", "paid_at"])
        logger.info("Payment %s marked as PAID", link_id)

        from django.core.cache import cache
        cache.delete(f"my_payments_{payment.email}")

        if payment.booking_id:
            if payment.type == "ADDITIONAL_DEPOSIT":
                self._handle_additional_deposit_paid(payment)
            else:
                self._update_booking(payment)

    def _update_booking(self, payment):
        from django.core.cache import cache

        try:
            booking = Booking.objects.get(id=payment.booking_id)

            if payment.type in ["DEPOSIT", "ROOM_BOOKING"]:
                booking.payment_status = Booking.PaymentStatus.DEPOSIT_PAID
                booking.status         = Booking.BookingStatus.CONFIRMED
                booking.deposit_paid_at = timezone.now()
                booking.save()

            elif payment.type == "BALANCE":
                booking.payment_status = Booking.PaymentStatus.FULLY_PAID
                booking.balance_paid_at = timezone.now()
                booking.save()

            cache.delete(f"my_bookings_{booking.user_id}")
            cache.delete(f"receptionist_booking_{booking.id}")
            cache.delete("receptionist_bookings_all")

            logger.info(
                "Booking %s updated after payment (type: %s)",
                booking.booking_reference, payment.type,
            )

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
                "success":        True,
                "bookingReference": booking.booking_reference,
                "status":         booking.status,
                "paymentStatus":  booking.payment_status,
                "roomType":       booking.room.room_type,
                "roomNumber":     booking.room.room_number,
                "checkInDate":    str(booking.check_in_date),
                "checkOutDate":   str(booking.check_out_date),
                "totalAmount":    float(booking.total_amount),
                "depositAmount":  float(booking.deposit_amount),
            })
        except Booking.DoesNotExist:
            return Response({"message": "Booking not found."}, status=404)
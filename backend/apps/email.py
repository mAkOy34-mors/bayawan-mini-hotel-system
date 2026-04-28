# apps/utils/email.py

from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags
import logging

logger = logging.getLogger(__name__)


def send_booking_cancelled_email(booking, reason, refund_amount=0):
    """
    Send email to guest when their booking is cancelled

    Args:
        booking: The Booking object
        reason: Cancellation reason
        refund_amount: Amount refunded (if any)
    """
    try:
        subject = f"Booking Cancelled - {booking.booking_reference}"

        # Prepare context for email template
        context = {
            'guest_name': booking.user.username or 'Valued Guest',
            'booking_reference': booking.booking_reference,
            'check_in_date': booking.check_in_date,
            'check_out_date': booking.check_out_date,
            'room_number': booking.room.room_number,
            'room_type': booking.room.room_type,
            'total_amount': booking.total_amount,
            'deposit_amount': booking.deposit_amount,
            'reason': reason,
            'refund_amount': refund_amount,
            'hotel_name': 'Bayawan Mini Hotel',
            'hotel_phone': '+63 XXX XXX XXXX',
            'hotel_email': 'info@bayawanhotel.com'
        }

        # HTML email template
        html_message = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #9a7a2e, #C9A84C); color: white; padding: 20px; text-align: center; }}
                .content {{ padding: 20px; background: #f9f9f9; }}
                .booking-details {{ background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border: 1px solid #ddd; }}
                .refund-info {{ background: #e8f5e9; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #4caf50; }}
                .footer {{ text-align: center; padding: 20px; font-size: 12px; color: #777; }}
                .button {{ background: #C9A84C; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>Booking Cancellation Confirmation</h2>
                </div>
                <div class="content">
                    <p>Dear <strong>{context['guest_name']}</strong>,</p>
                    <p>We regret to inform you that your booking has been cancelled as requested.</p>

                    <div class="booking-details">
                        <h3>Cancelled Booking Details:</h3>
                        <p><strong>Booking Reference:</strong> {context['booking_reference']}</p>
                        <p><strong>Room:</strong> {context['room_type']} #{context['room_number']}</p>
                        <p><strong>Check-in:</strong> {context['check_in_date']}</p>
                        <p><strong>Check-out:</strong> {context['check_out_date']}</p>
                        <p><strong>Total Amount:</strong> ₱{context['total_amount']}</p>
                        <p><strong>Deposit Paid:</strong> ₱{context['deposit_amount']}</p>
                    </div>

                    <p><strong>Cancellation Reason:</strong> {context['reason']}</p>

                    {f'''
                    <div class="refund-info">
                        <h3>💰 Refund Information</h3>
                        <p>A refund of <strong>₱{context['refund_amount']:,.2f}</strong> (50% of your deposit) has been processed.</p>
                        <p>Please allow 5-7 business days for the refund to reflect in your account.</p>
                    </div>
                    ''' if context['refund_amount'] > 0 else ''}

                    <p>If you have any questions, please don't hesitate to contact us.</p>
                    <p>We hope to welcome you at Bayawan Mini Hotel in the future.</p>
                </div>
                <div class="footer">
                    <p>{context['hotel_name']}<br>
                    Phone: {context['hotel_phone']}<br>
                    Email: {context['hotel_email']}</p>
                    <p>© 2026 Bayawan Mini Hotel. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """

        plain_message = strip_tags(html_message)

        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[booking.user.email],
            html_message=html_message,
            fail_silently=False,
        )

        logger.info(f"Cancellation email sent to {booking.user.email} for booking {booking.booking_reference}")
        return True

    except Exception as e:
        logger.error(f"Failed to send cancellation email: {e}")
        return False


def send_cancellation_request_email(booking, cancel_request):
    """
    Send email to admin when guest requests cancellation
    """
    try:
        subject = f"⚠️ Cancellation Request - {booking.booking_reference}"

        admin_emails = [admin.email for admin in settings.AUTH_USER_MODEL.objects.filter(is_staff=True)]

        html_message = f"""
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"></head>
        <body>
            <h2>New Cancellation Request</h2>
            <p>A guest has requested cancellation for booking <strong>{booking.booking_reference}</strong>.</p>

            <h3>Booking Details:</h3>
            <ul>
                <li><strong>Guest:</strong> {booking.user.username}</li>
                <li><strong>Email:</strong> {booking.user.email}</li>
                <li><strong>Room:</strong> {booking.room.room_type} #{booking.room.room_number}</li>
                <li><strong>Check-in:</strong> {booking.check_in_date}</li>
                <li><strong>Deposit Paid:</strong> ₱{booking.deposit_amount}</li>
            </ul>

            <h3>Cancellation Reason:</h3>
            <p>{cancel_request.reason}</p>

            <p>Please review this request in the admin panel.</p>
        </body>
        </html>
        """

        if admin_emails:
            send_mail(
                subject=subject,
                message=strip_tags(html_message),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=admin_emails,
                html_message=html_message,
                fail_silently=False,
            )
        return True
    except Exception as e:
        logger.error(f"Failed to send cancellation request email: {e}")
        return False


def send_cancellation_approved_email(booking, cancel_request):
    """
    Send email to guest when cancellation request is approved
    """
    try:
        deposit_amount = float(booking.deposit_amount or 0)
        refund_amount = deposit_amount * 0.5

        subject = f"Cancellation Approved - {booking.booking_reference}"

        html_message = f"""
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"></head>
        <body style="font-family: Arial, sans-serif;">
            <h2>✅ Cancellation Request Approved</h2>
            <p>Dear <strong>{booking.user.username}</strong>,</p>
            <p>Your cancellation request for booking <strong>{booking.booking_reference}</strong> has been <strong style="color: green;">APPROVED</strong>.</p>

            <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <h3>💰 Refund Details:</h3>
                <p>A refund of <strong>₱{refund_amount:,.2f}</strong> will be processed to your original payment method.</p>
                <p>Please allow 5-7 business days for the refund to reflect in your account.</p>
            </div>

            <p>If you have any questions, please contact us.</p>
            <p>We hope to serve you again in the future!</p>
        </body>
        </html>
        """

        send_mail(
            subject=subject,
            message=strip_tags(html_message),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[booking.user.email],
            html_message=html_message,
            fail_silently=False,
        )
        return True
    except Exception as e:
        logger.error(f"Failed to send cancellation approved email: {e}")
        return False


def send_cancellation_rejected_email(booking, cancel_request):
    """
    Send email to guest when cancellation request is rejected
    """
    try:
        subject = f"Cancellation Request Update - {booking.booking_reference}"

        html_message = f"""
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"></head>
        <body style="font-family: Arial, sans-serif;">
            <h2>❌ Cancellation Request Update</h2>
            <p>Dear <strong>{booking.user.username}</strong>,</p>
            <p>We have reviewed your cancellation request for booking <strong>{booking.booking_reference}</strong>.</p>

            <div style="background: #ffebee; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <p>After careful review, we regret to inform you that your cancellation request has been <strong style="color: red;">REJECTED</strong>.</p>
                <p><strong>Admin Note:</strong> {cancel_request.admin_note}</p>
            </div>

            <p>Your booking remains active. If you need assistance, please contact our front desk.</p>
        </body>
        </html>
        """

        send_mail(
            subject=subject,
            message=strip_tags(html_message),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[booking.user.email],
            html_message=html_message,
            fail_silently=False,
        )
        return True
    except Exception as e:
        logger.error(f"Failed to send cancellation rejected email: {e}")
        return False
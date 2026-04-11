# apps/utils/email.py
import logging
from django.core.mail import send_mail
from django.conf import settings
from django.utils.html import strip_tags

logger = logging.getLogger(__name__)


def send_walkin_welcome_email(user, temp_password, booking, guest_info):
    """Send welcome email with temporary password"""

    subject = "Welcome to Bayawan Mini Hotel - Your Walk-in Booking Confirmation"

    # Get guest name
    guest_name = guest_info.first_name or guest_info.last_name or user.username

    # Plain text version
    plain_message = f"""
Dear {guest_name},

Welcome to Bayawan Mini Hotel!

Your walk-in booking has been confirmed.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 BOOKING DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Booking Reference: {booking.booking_reference}
Room: {booking.room.room_type} #{booking.room.room_number}
Check-in: {booking.check_in_date}
Check-out: {booking.check_out_date}
Guests: {booking.number_of_guests} person(s)
Total Amount: ₱{booking.total_amount:,.2f}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔐 YOUR ACCOUNT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Email: {user.email}
Temporary Password: {temp_password}

IMPORTANT: Please change your password after logging in.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
We look forward to serving you!

Best regards,
Bayawan Mini Hotel Team
"""

    # HTML version
    html_message = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Booking Confirmation</title>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #9a7a2e, #C9A84C); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
        .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
        .booking-details {{ background: white; padding: 20px; border-radius: 10px; margin: 20px 0; border: 1px solid #e0e0e0; }}
        .booking-details h3 {{ margin-top: 0; color: #C9A84C; }}
        .password-box {{ background: #fff3cd; border: 1px solid #ffc107; padding: 20px; border-radius: 10px; margin: 20px 0; text-align: center; }}
        .password {{ font-size: 24px; font-weight: bold; font-family: monospace; color: #856404; margin: 10px 0; }}
        .footer {{ text-align: center; padding: 20px; font-size: 12px; color: #666; }}
        .button {{ display: inline-block; padding: 10px 20px; background: #C9A84C; color: white; text-decoration: none; border-radius: 5px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏨 Bayawan Mini Hotel</h1>
            <p>Your Walk-in Booking Confirmation</p>
        </div>

        <div class="content">
            <p>Dear <strong>{guest_name}</strong>,</p>

            <p>Thank you for choosing Bayawan Mini Hotel! Your walk-in booking has been confirmed.</p>

            <div class="booking-details">
                <h3>📋 Booking Details</h3>
                <p><strong>Booking Reference:</strong> {booking.booking_reference}</p>
                <p><strong>Room:</strong> {booking.room.room_type} #{booking.room.room_number}</p>
                <p><strong>Check-in:</strong> {booking.check_in_date}</p>
                <p><strong>Check-out:</strong> {booking.check_out_date}</p>
                <p><strong>Guests:</strong> {booking.number_of_guests} person(s)</p>
                <p><strong>Total Amount:</strong> ₱{booking.total_amount:,.2f}</p>
            </div>

            <div class="password-box">
                <p><strong>🔐 Your Account Information</strong></p>
                <p>Email: <strong>{user.email}</strong></p>
                <p>Temporary Password:</p>
                <div class="password">{temp_password}</div>
                <p style="font-size: 12px; margin-top: 10px;">
                    <strong>⚠️ Important:</strong> Please change your password after logging in.
                </p>
            </div>

            <p>We look forward to serving you!</p>

            <p>Best regards,<br>
            <strong>Bayawan Mini Hotel Team</strong></p>
        </div>

        <div class="footer">
            <p>© 2026 Bayawan Mini Hotel. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    """

    try:
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )
        logger.info(f"✅ Welcome email sent to {user.email}")
        return True
    except Exception as e:
        logger.error(f"❌ Failed to send email to {user.email}: {str(e)}")
        return False
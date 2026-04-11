# apps/utils/booking_email.py
import logging
import io
import json
import qrcode
from django.core.mail import EmailMultiAlternatives
from django.conf import settings
from django.utils.html import strip_tags

logger = logging.getLogger(__name__)


def generate_qr_code(booking_data):
    """Generate QR code image from booking data"""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=4,
    )
    qr.add_data(json.dumps(booking_data))
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)

    return buffer


# apps/utils/booking_email.py - FIXED QR CODE SECTION

def send_booking_confirmation_email(booking, user):
    """
    Send booking confirmation email with QR code to guest.
    FOR ONLINE BOOKINGS ONLY (after OTP confirmation)
    """

    subject = f"Booking Confirmation - {booking.booking_reference}"

    # Get guest name
    guest_name = user.username or user.email.split('@')[0]
    if hasattr(booking, 'guest_information') and booking.guest_information:
        guest_name = f"{booking.guest_information.first_name} {booking.guest_information.last_name}".strip() or guest_name

    # QR code data for check-in
    qr_data = {
        "bookingReference": booking.booking_reference,
        "guestName": guest_name,
        "checkInDate": str(booking.check_in_date),
        "checkOutDate": str(booking.check_out_date),
        "roomType": booking.room.room_type if booking.room else "Standard",
        "roomNumber": booking.room.room_number if booking.room else "TBD"
    }

    # Generate QR code as base64 for inline display
    import base64
    qr_buffer = generate_qr_code(qr_data)
    qr_base64 = base64.b64encode(qr_buffer.getvalue()).decode('utf-8')

    # Determine payment status
    if booking.remaining_amount and booking.remaining_amount > 0:
        payment_status = f"Deposit Paid: ₱{float(booking.deposit_amount):,.2f} | Balance Due: ₱{float(booking.remaining_amount):,.2f}"
    else:
        payment_status = f"Fully Paid: ₱{float(booking.total_amount):,.2f}"

    # HTML Email Template with embedded QR code (base64)
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Booking Confirmation</title>
        <style>
            body {{
                font-family: 'Segoe UI', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                background-color: #f5f5f5;
                margin: 0;
                padding: 20px;
            }}
            .container {{
                max-width: 600px;
                margin: 0 auto;
                background: white;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            }}
            .header {{
                background: linear-gradient(135deg, #9a7a2e, #C9A84C);
                color: white;
                padding: 30px;
                text-align: center;
            }}
            .header h1 {{
                margin: 0;
                font-size: 28px;
            }}
            .header p {{
                margin: 10px 0 0;
                opacity: 0.9;
            }}
            .content {{
                padding: 30px;
            }}
            .booking-details {{
                background: #f8f9fa;
                padding: 20px;
                border-radius: 10px;
                margin: 20px 0;
            }}
            .booking-details h3 {{
                margin-top: 0;
                color: #9a7a2e;
                border-bottom: 2px solid #C9A84C;
                padding-bottom: 10px;
            }}
            .detail-row {{
                display: flex;
                justify-content: space-between;
                margin: 10px 0;
                padding: 5px 0;
                border-bottom: 1px solid #e0e0e0;
            }}
            .detail-label {{
                font-weight: bold;
                color: #666;
            }}
            .detail-value {{
                color: #333;
                font-weight: 600;
            }}
            .qr-section {{
                text-align: center;
                margin: 25px 0;
                padding: 20px;
                background: #f8f9fa;
                border-radius: 10px;
            }}
            .qr-section h4 {{
                color: #9a7a2e;
                margin-bottom: 15px;
            }}
            .qr-code {{
                display: inline-block;
                background: white;
                padding: 15px;
                border-radius: 12px;
                margin: 10px 0;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }}
            .qr-note {{
                font-size: 12px;
                color: #666;
                margin-top: 10px;
            }}
            .button {{
                display: inline-block;
                padding: 12px 24px;
                background: linear-gradient(135deg, #9a7a2e, #C9A84C);
                color: white;
                text-decoration: none;
                border-radius: 6px;
                margin: 10px 0;
                font-weight: bold;
            }}
            .footer {{
                background: #f8f9fa;
                padding: 20px;
                text-align: center;
                font-size: 12px;
                color: #666;
                border-top: 1px solid #e0e0e0;
            }}
            .highlight {{
                color: #9a7a2e;
                font-weight: bold;
            }}
            .warning {{
                background: #fff3cd;
                border: 1px solid #ffc107;
                padding: 10px;
                border-radius: 8px;
                margin: 15px 0;
                font-size: 13px;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🏨 Bayawan Mini Hotel</h1>
                <p>Your Booking is Confirmed!</p>
            </div>

            <div class="content">
                <p>Dear <strong>{guest_name}</strong>,</p>

                <p>Thank you for choosing Bayawan Mini Hotel! Your online reservation has been successfully confirmed.</p>

                <div class="booking-details">
                    <h3>📋 Booking Details</h3>
                    <div class="detail-row">
                        <span class="detail-label">Booking Reference:</span>
                        <span class="detail-value">{booking.booking_reference}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Room Type:</span>
                        <span class="detail-value">{booking.room.room_type if booking.room else 'Standard'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Room Number:</span>
                        <span class="detail-value">#{booking.room.room_number if booking.room else 'Will be assigned'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Check-in Date:</span>
                        <span class="detail-value">{booking.check_in_date}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Check-out Date:</span>
                        <span class="detail-value">{booking.check_out_date}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Number of Nights:</span>
                        <span class="detail-value">{booking.number_of_nights}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Guests:</span>
                        <span class="detail-value">{booking.number_of_guests} person(s)</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Total Amount:</span>
                        <span class="detail-value">₱{float(booking.total_amount):,.2f}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Payment Status:</span>
                        <span class="detail-value">{payment_status}</span>
                    </div>
                </div>

                <div class="qr-section">
                    <h4>📱 Quick Check-in QR Code</h4>
                    <p>Show this QR code at the reception desk for fast check-in:</p>
                    <div class="qr-code">
                        <img src="data:image/png;base64,{qr_base64}" alt="QR Code" width="180" height="180" style="display: block; margin: 0 auto;" />
                    </div>
                    <p class="qr-note">
                        💡 <strong>Tip:</strong> Save this QR code to your phone or print it.<br>
                        Simply scan at reception upon arrival for instant check-in!
                    </p>
                </div>

                <div style="text-align: center; margin: 20px 0;">
                    <a href="{settings.FRONTEND_URL}/my-bookings" class="button">View My Bookings</a>
                </div>

                <div class="warning">
                    <strong>⚠️ Payment Reminder:</strong>
                    <p style="margin: 5px 0 0;">Please complete your payment to secure your booking. Your booking will be held for 24 hours.</p>
                </div>

                <p><strong>📍 Important Information:</strong></p>
                <ul>
                    <li>Check-in time: <strong>2:00 PM</strong></li>
                    <li>Check-out time: <strong>12:00 PM</strong></li>
                    <li>Please bring a valid ID</li>
                    <li>Early check-in subject to availability</li>
                </ul>

                <p>We look forward to providing you with a wonderful stay!</p>

                <p>Best regards,<br>
                <strong>Bayawan Mini Hotel Team</strong></p>
            </div>

            <div class="footer">
                <p class="highlight">🏨 Bayawan Mini Hotel</p>
                <p>📍 [Your Hotel Address]</p>
                <p>📞 +63 XXX XXX XXXX | ✉️ info@bayawanhotel.com</p>
                <p>© 2026 Bayawan Mini Hotel. All rights reserved.</p>
                <p style="font-size: 11px;">This is an automated message, please do not reply.</p>
            </div>
        </div>
    </body>
    </html>
    """

    # Plain text version
    text_content = strip_tags(html_content)

    # Create email
    email = EmailMultiAlternatives(
        subject=subject,
        body=text_content,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[user.email],
    )

    # Attach HTML content
    email.attach_alternative(html_content, "text/html")

    # Also attach QR code as separate file for download
    qr_buffer.seek(0)  # Reset buffer position
    email.attach('qrcode.png', qr_buffer.getvalue(), 'image/png')

    # Send email
    try:
        email.send(fail_silently=False)
        logger.info(f"✅ Booking confirmation email sent to {user.email}")
        return True
    except Exception as e:
        logger.error(f"❌ Failed to send email to {user.email}: {str(e)}")
        return False
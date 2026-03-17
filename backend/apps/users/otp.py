"""
apps/users/otp.py

OTP generation and Gmail SMTP email sending.
Mirrors Spring Boot OtpToken entity + email service.

Flow:
    1. User registers or requests OTP
    2. Django generates 6-digit OTP
    3. Saves OtpToken row in DB (with expiry)
    4. Sends OTP to user's email via Gmail SMTP
    5. User submits OTP → Django verifies it
"""

import logging
import random
import string
import datetime
from datetime import timedelta

from django.conf import settings
from django.core.mail import send_mail
from django.utils.timezone import is_aware

from .models import OtpToken

logger = logging.getLogger(__name__)

OTP_EXPIRY_MINUTES = 10


def generate_otp(length: int = 6) -> str:
    """Generate a 6-digit numeric OTP."""
    return "".join(random.choices(string.digits, k=length))


def create_otp(email: str) -> str:
    OtpToken.objects.filter(email=email, used=False).update(used=True)

    otp = generate_otp()

    # ✅ Store as timezone-aware UTC — Django converts to DB correctly
    from django.utils import timezone
    expires_at = timezone.now() + timedelta(minutes=OTP_EXPIRY_MINUTES)

    OtpToken.objects.create(
        email      = email,
        otp        = otp,
        expires_at = expires_at,
        used       = False,
    )

    logger.info("OTP created for %s (expires at %s)", email, expires_at)
    return otp


def verify_otp(email: str, otp_code: str) -> bool:
    try:
        token = OtpToken.objects.get(
            email=email,
            otp=otp_code,
            used=False,
        )
    except OtpToken.DoesNotExist:
        logger.warning("OTP not found for %s", email)
        return False

    from django.utils import timezone
    from django.utils.timezone import is_aware, make_aware
    import datetime as dt

    now     = timezone.now()
    expires = token.expires_at

    # If DB returned naive, assume UTC and make it aware
    if not is_aware(expires):
        expires = expires.replace(tzinfo=dt.timezone.utc)

    logger.info("OTP check — now=%s expires=%s", now, expires)

    if now > expires:
        logger.warning("OTP expired for %s", email)
        return False

    token.used = True
    token.save(update_fields=["used"])
    logger.info("OTP verified successfully for %s", email)
    return True


def send_otp_email(email: str, otp: str) -> None:
    """
    Send OTP via Gmail SMTP.
    Uses Django's EMAIL_* settings (mirrors Spring Boot mail config).
    """
    subject = "Your Cebu Grand Hotel Verification Code"
    message = f"""
Hello,

Your verification code for Cebu Grand Hotel is:

    {otp}

This code expires in {OTP_EXPIRY_MINUTES} minutes.

If you did not request this code, please ignore this email.

— Cebu Grand Hotel Team
    """.strip()

    html_message = f"""
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
        <h2 style="color: #C9A84C;">Cebu Grand Hotel</h2>
        <p>Your verification code is:</p>
        <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px;
                    color: #C9A84C; padding: 16px; background: #f8f3e8;
                    text-align: center; border-radius: 8px;">
            {otp}
        </div>
        <p style="color: #888; font-size: 13px; margin-top: 16px;">
            This code expires in {OTP_EXPIRY_MINUTES} minutes.<br>
            If you did not request this, please ignore this email.
        </p>
    </div>
    """

    try:
        send_mail(
            subject      = subject,
            message      = message,
            from_email   = settings.DEFAULT_FROM_EMAIL,
            recipient_list = [email],
            html_message = html_message,
            fail_silently = False,
        )
        logger.info("OTP email sent to %s", email)
    except Exception as e:
        logger.error("Failed to send OTP email to %s: %s", email, e)
        raise Exception("Failed to send verification email. Please try again.")
"""
apps/users/views.py

POST /api/v1/users/register   → register user + send OTP email
POST /api/v1/users/login      → login with email + password
POST /api/v1/users/verify-otp → verify OTP code
POST /api/v1/users/resend-otp → resend OTP email
"""

import logging
import bcrypt

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .otp import create_otp, send_otp_email, verify_otp
from .serializers import (
    LoginSerializer,
    RegisterSerializer,
    ResendOtpSerializer,
    UserResponseSerializer,
    VerifyOtpSerializer,
)

logger = logging.getLogger(__name__)
User = get_user_model()


class RegisterView(APIView):
    """
    POST /api/v1/users/register
    Creates user + sends OTP verification email via Gmail SMTP.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        ser = RegisterSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        d = ser.validated_data

        # Check duplicates
        if User.objects.filter(email=d["email"]).exists():
            return Response(
                {"message": "Email already registered."},
                status=status.HTTP_409_CONFLICT,
            )
        if User.objects.filter(username=d.get("username", "")).exists():
            return Response(
                {"message": "Username already taken."},
                status=status.HTTP_409_CONFLICT,
            )

        # Create user
        user = User.objects.create_user(
            email=d["email"],
            username=d.get("username", d["email"].split("@")[0]),
            password=d["password"],
        )

        # Generate OTP and send email
        try:
            otp = create_otp(d["email"])
            send_otp_email(d["email"], otp)
        except Exception as e:
            # Rollback user if email fails
            user.delete()
            return Response(
                {"message": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        logger.info("User registered: %s", d["email"])
        return Response(
            {"message": "Registration successful. Please check your email for the verification code."},
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    """
    POST /api/v1/users/login
    Returns: { token, user: { id, username, email, role } }
    """
    permission_classes = [AllowAny]

    def post(self, request):
        ser = LoginSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        d = ser.validated_data

        try:
            user = User.objects.get(email=d["email"])
        except User.DoesNotExist:
            return Response(
                {"message": "Invalid email or password."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        # Handle both BCrypt (Spring Boot) and Django PBKDF2 (createadmin command)
        raw_password = user.password or ""

        if raw_password.startswith("$2a$") or raw_password.startswith("$2b$"):
            # BCrypt hash — used by Spring Boot registered users
            password_matches = bcrypt.checkpw(
                d["password"].encode("utf-8"),
                raw_password.encode("utf-8"),
            )
        else:
            # Django PBKDF2 hash — used by accounts created via createadmin
            from django.contrib.auth.hashers import check_password
            password_matches = check_password(d["password"], raw_password)

        if not password_matches:
            return Response(
                {"message": "Invalid email or password."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if not user.is_active:
            return Response(
                {"message": "Account is not verified. Please verify your email."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Generate JWT token using Django's simple JWT or a custom token
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)

        user_data = UserResponseSerializer({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role,
        }).data

        # Validate role and set redirect hint for frontend
        role = user.role.upper() if user.role else "USER"

        if role == "ADMIN":
            dashboard = "/admin/dashboard"
        elif role == "RECEPTIONIST":
            dashboard = "/receptionist/dashboard"
        elif role in ["STAFF", "HOUSEKEEPER", "MAINTENANCE", "SECURITY", "FRONT_DESK", "MANAGEMENT"]:
            dashboard = "/staff/dashboard"
        else:
            dashboard = "/guest/dashboard"

        return Response({
            "token": access_token,
            "accessToken": access_token,
            "role": role,
            "dashboard": dashboard,
            "user": user_data,
        })


class VerifyOtpView(APIView):
    """
    POST /api/v1/users/verify-otp
    Body: { email, otp }
    """
    permission_classes = [AllowAny]

    def post(self, request):
        ser = VerifyOtpSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        d = ser.validated_data

        if not verify_otp(d["email"], d["otp"]):
            return Response(
                {"message": "Invalid or expired OTP."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Activate user account after verification
        try:
            user = User.objects.get(email=d["email"])
            user.is_active = True
            user.save(update_fields=["is_active"])
        except User.DoesNotExist:
            pass

        return Response({"message": "Email verified successfully."})


class ResendOtpView(APIView):
    """
    POST /api/v1/users/resend-otp
    Body: { email }
    """
    permission_classes = [AllowAny]

    def post(self, request):
        ser = ResendOtpSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        email = ser.validated_data["email"]

        try:
            otp = create_otp(email)
            send_otp_email(email, otp)
        except Exception as e:
            return Response(
                {"message": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # Always return 200 to avoid email enumeration
        return Response({"message": "Verification code resent. Please check your email."})
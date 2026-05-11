# apps/users/google_views.py
import logging
import urllib.parse

from django.shortcuts import redirect
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny

from .google_auth import (
    build_google_redirect_url,
    exchange_code_for_user_info,
    get_or_create_google_user,
    issue_jwt_for_user,
)

logger = logging.getLogger(__name__)

FRONTEND_URL = getattr(settings, "FRONTEND_URL", "http://localhost:5173")


class GoogleLoginRedirectView(APIView):
    """
    GET /api/v1/auth/google/
    Redirects the browser to Google's consent screen.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        url = build_google_redirect_url()
        return redirect(url)


class GoogleCallbackView(APIView):
    """
    GET /api/v1/auth/google/callback/
    Google redirects here after the user consents.
    We exchange the code, get/create the user, issue JWT,
    then redirect the browser to the React frontend.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        code  = request.GET.get("code")
        error = request.GET.get("error")  # user denied consent

        if error or not code:
            logger.warning("Google OAuth error: %s", error)
            return redirect(f"{FRONTEND_URL}/?auth_error=google_cancelled")

        try:
            userinfo = exchange_code_for_user_info(code)
            user     = get_or_create_google_user(userinfo)
            token    = issue_jwt_for_user(user)
        except Exception as exc:
            logger.error("Google OAuth failed: %s", exc)
            return redirect(f"{FRONTEND_URL}/?auth_error=google_failed")

        # Build redirect URL with user data for the frontend
        params = urllib.parse.urlencode({
            "token":    token,
            "role":     user.role.upper(),
            "email":    user.email,
            "username": user.username,
            "id":       user.id,
        })
        return redirect(f"{FRONTEND_URL}/?{params}")
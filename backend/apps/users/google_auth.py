# apps/users/google_auth.py
"""
Minimal Google OAuth 2.0 — no extra packages needed.
Uses only: urllib (stdlib) + requests (already in Django ecosystem)
"""
import logging
import urllib.parse
import requests as http

from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken

logger = logging.getLogger(__name__)
User = get_user_model()

GOOGLE_AUTH_URL  = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"


def build_google_redirect_url(state: str = "") -> str:
    """Build the Google consent screen URL."""
    params = {
        "client_id":     settings.GOOGLE_CLIENT_ID,
        "redirect_uri":  settings.GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope":         "openid email profile",
        "access_type":   "offline",
        "prompt":        "select_account",
    }
    if state:
        params["state"] = state
    return f"{GOOGLE_AUTH_URL}?{urllib.parse.urlencode(params)}"


def exchange_code_for_user_info(code: str) -> dict:
    """Exchange authorization code for Google user profile."""
    # Step 1: Exchange code for access token
    token_resp = http.post(GOOGLE_TOKEN_URL, data={
        "code":          code,
        "client_id":     settings.GOOGLE_CLIENT_ID,
        "client_secret": settings.GOOGLE_CLIENT_SECRET,
        "redirect_uri":  settings.GOOGLE_REDIRECT_URI,
        "grant_type":    "authorization_code",
    }, timeout=10)

    token_resp.raise_for_status()
    access_token = token_resp.json().get("access_token")

    # Step 2: Fetch user info with access token
    userinfo_resp = http.get(
        GOOGLE_USERINFO_URL,
        headers={"Authorization": f"Bearer {access_token}"},
        timeout=10,
    )
    userinfo_resp.raise_for_status()
    return userinfo_resp.json()
    # Returns: { sub, email, name, given_name, family_name, picture, email_verified }


def get_or_create_google_user(userinfo: dict) -> User:
    """
    Find existing user by email or create a new one.
    Google users get a random-safe username and no password.
    """
    email = userinfo.get("email", "").lower().strip()
    if not email:
        raise ValueError("Google did not return an email address.")

    # Try to find existing user
    try:
        user = User.objects.get(email=email)
        logger.info("Google login: existing user %s", email)
        return user
    except User.DoesNotExist:
        pass

    # Build a unique username from Google name or email prefix
    base_username = (
        userinfo.get("given_name", "").lower().replace(" ", "")
        or email.split("@")[0]
    )
    username = base_username
    counter  = 1
    while User.objects.filter(username=username).exists():
        username = f"{base_username}{counter}"
        counter += 1

    # Create user — no password (Google is the auth provider)
    user = User(
        email    = email,
        username = username,
        role     = User.Role.USER,
    )
    user.set_unusable_password()   # prevents password login for Google accounts
    user.save()

    logger.info("Google login: new user created %s", email)
    return user


def issue_jwt_for_user(user: User) -> str:
    """Issue a SimpleJWT access token for the user."""
    refresh = RefreshToken.for_user(user)
    return str(refresh.access_token)
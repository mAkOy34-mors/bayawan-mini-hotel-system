"""
core/authentication.py

Validates Supabase-issued JWTs on every authenticated request.

Flow:
  1. Extract Bearer token from Authorization header.
  2. Decode & verify with PyJWT using SUPABASE_JWT_SECRET.
  3. Retrieve (or lazily create) the corresponding Django user row.
  4. Return (user, token) so DRF can proceed.

Supabase tokens contain:
  sub       → Supabase Auth user UUID
  email     → user email
  role      → "authenticated" | "anon"
  user_metadata → { username, ... }
"""

import logging

import jwt
from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed

logger = logging.getLogger(__name__)
User = get_user_model()


class SupabaseJWTAuthentication(BaseAuthentication):
    """DRF authentication class for Supabase-issued JWTs."""

    def authenticate(self, request):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return None  # Let other authenticators try or raise 401

        token = auth_header.split(" ", 1)[1].strip()
        return self._authenticate_token(token)

    # ── Internal helpers ──────────────────────────────────────────────────────

    def _authenticate_token(self, token: str):
        try:
            payload = jwt.decode(
                token,
                settings.SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                options={"verify_exp": True},
            )
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed("Token has expired.")
        except jwt.InvalidTokenError as exc:
            raise AuthenticationFailed(f"Invalid token: {exc}")

        supabase_uid = payload.get("sub")
        if not supabase_uid:
            raise AuthenticationFailed("Token missing 'sub' claim.")

        user = self._get_or_create_user(supabase_uid, payload)
        return (user, token)

    def _get_or_create_user(self, supabase_uid: str, payload: dict):
        """
        Keep a lightweight Django User row synced with Supabase Auth.
        We never store passwords — Supabase owns authentication.
        """
        email = payload.get("email", "")
        user_meta = payload.get("user_metadata", {}) or {}
        username = (
            user_meta.get("username")
            or user_meta.get("full_name")
            or email.split("@")[0]
        )

        try:
            user = User.objects.get(supabase_uid=supabase_uid)
            # Keep email in sync if it changed in Supabase
            if user.email != email:
                user.email = email
                user.save(update_fields=["email"])
        except User.DoesNotExist:
            user = User.objects.create(
                supabase_uid=supabase_uid,
                username=self._unique_username(username),
                email=email,
                role=payload.get("role", "authenticated"),
            )
            logger.info("Auto-created Django user for Supabase UID %s", supabase_uid)

        return user

    @staticmethod
    def _unique_username(base: str) -> str:
        username = base[:150]
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base[:146]}_{counter}"
            counter += 1
        return username

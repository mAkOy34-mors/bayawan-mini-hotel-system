"""
core/utils/supabase_client.py

Thin wrapper around the supabase-py SDK.
Used by views that need to call Supabase Auth admin APIs
(e.g. register, verify OTP, resend OTP) rather than hitting
the DB directly.
"""

from functools import lru_cache

from django.conf import settings
from supabase import Client, create_client


@lru_cache(maxsize=1)
def get_supabase_client() -> Client:
    """
    Returns an anon-key client (for user-facing auth flows).
    Cached for the lifetime of the process.
    """
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)


@lru_cache(maxsize=1)
def get_supabase_admin_client() -> Client:
    """
    Returns a service-role client (for admin operations like
    user lookup, force-verify, etc.).
    Keep this server-side only — never expose the key to clients.
    """
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

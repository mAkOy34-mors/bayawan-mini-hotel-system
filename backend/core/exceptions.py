"""
core/exceptions.py

Global DRF exception handler — normalises all error responses to:

    { "message": "...", "errors": { ... } }

This matches the shape the React frontend already expects.
"""

import logging

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """Override DRF's default handler to return a consistent JSON envelope."""
    response = exception_handler(exc, context)

    if response is None:
        # Unhandled server error — log it and return a generic 500
        logger.exception("Unhandled exception in %s", context.get("view"))
        return Response(
            {"message": "An unexpected error occurred. Please try again later."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    # Flatten DRF's nested error dicts into our envelope format
    detail = response.data

    if isinstance(detail, dict):
        # Extract a top-level message if DRF put one there
        message = detail.pop("detail", None) or detail.pop("message", None)
        if message:
            if hasattr(message, "code"):
                message = str(message)
            response.data = {"message": message, "errors": detail or {}}
        else:
            # No top-level detail — treat the whole dict as field errors
            response.data = {
                "message": _first_error(detail),
                "errors": detail,
            }
    elif isinstance(detail, list):
        response.data = {"message": str(detail[0]), "errors": {}}
    else:
        response.data = {"message": str(detail), "errors": {}}

    return response


def _first_error(errors: dict) -> str:
    """Pull the first human-readable message out of a field-error dict."""
    for value in errors.values():
        if isinstance(value, list) and value:
            return str(value[0])
        if isinstance(value, str):
            return value
    return "Validation error."

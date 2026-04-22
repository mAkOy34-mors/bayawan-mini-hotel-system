"""
apps/payments/paymongo.py

PayMongo integration — Checkout Session (replaces Payment Links).

WHY CHECKOUT SESSION instead of /v1/links:
    - /v1/links only supports QR PH — you cannot test with cards
    - /v1/checkout_sessions supports ALL payment methods:
      card, gcash, grab_pay, paymaya, qrph, dob, etc.
    - Webhooks fire correctly for checkout sessions
    - Test cards work in sandbox mode

Test card (sandbox):
    Number:  4343 4343 4343 4343
    Expiry:  any future date (e.g. 12/26)
    CVV:     any 3 digits
    Name:    any name

Docs: https://developers.paymongo.com/reference/create-a-checkout-session
"""

import logging
import base64

import httpx
from django.conf import settings

logger = logging.getLogger(__name__)

PAYMONGO_BASE_URL = "https://api.paymongo.com/v1"


def _auth_header() -> str:
    """
    PayMongo uses HTTP Basic Auth.
    Encode secret key as base64: base64(sk_test_xxx:)
    """
    secret = settings.PAYMONGO_SECRET_KEY
    token = base64.b64encode(f"{secret}:".encode()).decode()
    return f"Basic {token}"


def create_payment_link(
    amount: float,
    description: str,
    remarks: str = "",
    booking_id: int = None,
    booking_reference: str = "",
) -> dict:
    """
    Creates a PayMongo Checkout Session.

    Supports all payment methods including test cards.

    Args:
        amount:            Amount in PHP (e.g. 1500.00)
        description:       Shown to customer on checkout page
        remarks:           Optional extra notes
        booking_id:        Internal booking ID (stored in metadata)
        booking_reference: Booking reference code for redirect URLs

    Returns:
        {
            "paymongo_link_id": "cs_xxxxx",     ← checkout session id
            "checkout_url":     "https://pm.link/...",
            "status":           "active",
        }

    Raises:
        Exception: if PayMongo returns an error
    """
    # PayMongo expects amount in CENTAVOS (multiply by 100)
    amount_centavos = int(float(amount) * 100)

    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')

    payload = {
        "data": {
            "attributes": {
                "billing": {
                    "name":  "Guest",
                    "email": "",   # filled dynamically if needed
                },
                "line_items": [
                    {
                        "currency":   "PHP",
                        "amount":     amount_centavos,
                        "description": description,
                        "name":       description,
                        "quantity":   1,
                    }
                ],
                # ── ALL payment methods — cards work for testing ──
                "payment_method_types": [
                    "card",
                    "gcash",
                    "grab_pay",
                    "paymaya",
                    "qrph",
                ],
                "description": description,
                "remarks":     remarks or "",
                "metadata": {
                    "booking_id":        str(booking_id or ""),
                    "booking_reference": booking_reference or "",
                },
                "redirect": {
                    "success": f"{frontend_url}/payment-success?reference={booking_reference}",
                    "failed":  f"{frontend_url}/payment-failed?reference={booking_reference}",
                },
                "send_email_receipt": False,
                "show_description":   True,
                "show_line_items":    True,
            }
        }
    }

    headers = {
        "Authorization": _auth_header(),
        "Content-Type":  "application/json",
        "Accept":        "application/json",
    }

    with httpx.Client(timeout=30) as client:
        response = client.post(
            f"{PAYMONGO_BASE_URL}/checkout_sessions",   # ← switched from /links
            json=payload,
            headers=headers,
        )

    if response.status_code not in (200, 201):
        try:
            error_detail = response.json().get("errors", [{}])[0].get("detail", "PayMongo error.")
        except Exception:
            error_detail = f"PayMongo HTTP {response.status_code}"
        logger.error("PayMongo error: %s", error_detail)
        raise Exception(error_detail)

    data       = response.json()["data"]
    attributes = data["attributes"]

    return {
        "paymongo_link_id": data["id"],                   # cs_xxxxx
        "checkout_url":     attributes["checkout_url"],
        "status":           attributes["status"],          # "active"
    }
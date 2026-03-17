"""
apps/payments/paymongo.py

PayMongo integration — Create Payment Link.

Docs: https://developers.paymongo.com/reference/create-a-link

Flow:
    1. Frontend calls POST /api/v1/payments/create-link
    2. Django calls PayMongo API → gets checkoutUrl
    3. Django saves Payment row in DB
    4. Returns checkoutUrl to frontend
    5. Frontend redirects user to checkoutUrl to pay
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
    Creates a PayMongo Payment Link.

    Args:
        amount:      Amount in PHP (e.g. 1500.00)
        description: Shown to customer on checkout page
        remarks:     Optional extra notes

    Returns:
        {
            "paymongo_link_id": "link_xxxxx",
            "checkout_url":     "https://pm.link/...",
            "status":           "unpaid",
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
                "amount": amount_centavos,
                "description": description,
                "remarks": remarks,
                "redirect": {
                        "success": f"{frontend_url}/payment-success?reference={booking_reference}",
                        "failed":  f"{frontend_url}/payment-failed?reference={booking_reference}",
                },
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
            f"{PAYMONGO_BASE_URL}/links",
            json=payload,
            headers=headers,
        )

    if response.status_code not in (200, 201):
        error_detail = response.json().get("errors", [{}])[0].get("detail", "PayMongo error.")
        logger.error("PayMongo error: %s", error_detail)
        raise Exception(error_detail)

    data = response.json()["data"]
    attributes = data["attributes"]

    return {
        "paymongo_link_id": data["id"],
        "checkout_url":     attributes["checkout_url"],
        "status":           attributes["status"],
    }
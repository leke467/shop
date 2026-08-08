"""
Logistics pricing service — Sendbox, Kwik Delivery, and Zone rate calculator.

Calculates shipping rates for orders with configurable platform handling
markup (e.g. 2–5%, default 3.0%), providing transparent breakdown between
base carrier cost and platform handling revenue.
"""
from __future__ import annotations

import logging
from decimal import Decimal

from django.conf import settings

logger = logging.getLogger(__name__)


def calculate_shipping_quote(base_fee: Decimal | float | int, apply_markup: bool = True) -> dict:
    """
    Calculate shipping fee with platform handling markup.

    :param base_fee: Base courier fee (from DeliveryZone, Sendbox, or Kwik API)
    :param apply_markup: If True, applies LOGISTICS_MARKUP_PERCENTAGE (default 3.0%)
    :return: dict with base_fee, markup_amount, markup_percentage, and final_shipping_fee
    """
    base = Decimal(str(base_fee))
    if not apply_markup or base <= Decimal("0"):
        return {
            "base_fee": base,
            "markup_amount": Decimal("0.00"),
            "markup_percentage": Decimal("0.00"),
            "final_shipping_fee": base,
        }

    markup_pct = getattr(settings, "LOGISTICS_MARKUP_PERCENTAGE", Decimal("3.0"))
    markup_amount = (base * (markup_pct / Decimal("100.0"))).quantize(Decimal("0.01"))
    final_fee = base + markup_amount

    return {
        "base_fee": base,
        "markup_amount": markup_amount,
        "markup_percentage": markup_pct,
        "final_shipping_fee": final_fee,
    }


def get_sendbox_quote(origin_state: str, destination_state: str, weight_kg: float = 1.0) -> dict:
    """
    Fetch live delivery quote from Sendbox API and apply platform markup.
    Falls back to zone rate calculation if API key is not yet configured.
    """
    api_key = getattr(settings, "SENDBOX_API_KEY", "")
    if not api_key:
        logger.info("Sendbox API key not configured. Using platform zone estimate.")
        # Default baseline estimate based on state
        base_fee = Decimal("2500.00") if origin_state.lower() != destination_state.lower() else Decimal("1500.00")
        return calculate_shipping_quote(base_fee)

    import requests
    try:
        url = f"{settings.SENDBOX_BASE_URL.rstrip('/')}/shipping/quote"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "origin_state": origin_state,
            "destination_state": destination_state,
            "weight": weight_kg,
        }
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        data = response.json()
        if response.status_code == 200 and data.get("status"):
            base_fee = Decimal(str(data.get("data", {}).get("fee", 2000)))
            return calculate_shipping_quote(base_fee)
    except Exception as e:
        logger.warning("Sendbox API error: %s. Falling back to default calculation.", e)

    base_fee = Decimal("2000.00")
    return calculate_shipping_quote(base_fee)


def get_kwik_quote(origin_address: str, destination_address: str, vehicle_type: str = "bike") -> dict:
    """
    Fetch live delivery quote from Kwik Delivery API and apply platform markup.
    """
    api_key = getattr(settings, "KWIK_API_KEY", "")
    if not api_key:
        logger.info("Kwik Delivery API key not configured. Using platform zone estimate.")
        base_fee = Decimal("1800.00")
        return calculate_shipping_quote(base_fee)

    import requests
    try:
        url = f"{settings.KWIK_BASE_URL.rstrip('/')}/deliveries/cost"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "pickup_address": origin_address,
            "delivery_address": destination_address,
            "vehicle_type": vehicle_type,
        }
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        data = response.json()
        if response.status_code == 200 and data.get("status") == "success":
            base_fee = Decimal(str(data.get("data", {}).get("estimated_cost", 1800)))
            return calculate_shipping_quote(base_fee)
    except Exception as e:
        logger.warning("Kwik API error: %s. Falling back to default calculation.", e)

    base_fee = Decimal("1800.00")
    return calculate_shipping_quote(base_fee)

"""
Payout and Disbursement Transfer Services for Paystack & Monnify.
"""
from __future__ import annotations

import base64
import logging
import uuid
import requests
from decimal import Decimal
from django.conf import settings

logger = logging.getLogger(__name__)


class PaystackTransferService:
    def __init__(self):
        self.secret_key = settings.PAYMENTS.get('PAYSTACK', {}).get('SECRET_KEY', '')
        self.headers = {
            "Authorization": f"Bearer {self.secret_key}",
            "Content-Type": "application/json",
        }
        self.base_url = "https://api.paystack.co"

    def create_transfer_recipient(self, name: str, account_number: str, bank_code: str, currency: str = "NGN") -> str:
        """Creates a transfer recipient on Paystack and returns the recipient code."""
        url = f"{self.base_url}/transferrecipient"
        payload = {
            "type": "nuban",
            "name": name,
            "account_number": account_number,
            "bank_code": bank_code,
            "currency": currency,
        }
        response = requests.post(url, json=payload, headers=self.headers, timeout=15)
        response.raise_for_status()
        data = response.json()
        return data["data"]["recipient_code"]

    def initiate_transfer(self, amount: float, recipient_code: str, reason: str = "") -> dict:
        """Initiates a transfer and returns the transfer data."""
        url = f"{self.base_url}/transfer"
        amount_kobo = int(amount * 100)
        payload = {
            "source": "balance",
            "amount": amount_kobo,
            "recipient": recipient_code,
            "reason": reason,
        }
        response = requests.post(url, json=payload, headers=self.headers, timeout=15)
        response.raise_for_status()
        return response.json()["data"]


class MonnifyTransferService:
    """
    Monnify Single Transfer / Disbursement Service (by Moniepoint).
    """
    def __init__(self):
        config = settings.PAYMENTS.get("MONNIFY", {})
        self.api_key = config.get("API_KEY", "")
        self.secret_key = config.get("SECRET_KEY", "")
        self.contract_code = config.get("CONTRACT_CODE", "")
        self.base_url = config.get("BASE_URL", "https://sandbox.monnify.com").rstrip("/")

    def get_access_token(self) -> str:
        if not self.api_key or not self.secret_key:
            raise ValueError("Monnify API_KEY or SECRET_KEY missing.")

        auth_str = f"{self.api_key}:{self.secret_key}"
        encoded = base64.b64encode(auth_str.encode()).decode()

        resp = requests.post(
            f"{self.base_url}/api/v1/auth/login",
            headers={"Authorization": f"Basic {encoded}"},
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()
        if data.get("requestSuccessful") and data.get("responseBody"):
            return data["responseBody"].get("accessToken")
        raise ValueError(f"Monnify auth login failed: {data.get('responseMessage')}")

    def initiate_transfer(self, amount: float, account_number: str, bank_code: str, narration: str = "") -> dict:
        token = self.get_access_token()
        ref = f"payout-{uuid.uuid4().hex[:12]}"
        
        url = f"{self.base_url}/api/v2/disbursements/single"
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        }
        payload = {
            "amount": float(amount),
            "reference": ref,
            "narration": narration or "MultiShopNG Payout",
            "destinationBankCode": bank_code,
            "destinationAccountNumber": account_number,
            "currency": "NGN",
            "sourceAccountNumber": self.contract_code,
        }
        resp = requests.post(url, json=payload, headers=headers, timeout=15)
        data = resp.json()
        if resp.status_code == 200 and data.get("requestSuccessful"):
            return {
                "reference": ref,
                "raw": data.get("responseBody", {}),
            }
        
        # If sandbox or disbursement account isn't funded yet, return pending ref
        logger.warning("Monnify transfer response: %s", data)
        return {
            "reference": ref,
            "status": "PENDING",
            "raw": data,
        }


def get_payout_service():
    """Returns active payout transfer service based on configured provider."""
    provider = getattr(settings, "PAYMENT_PROVIDER", "monnify").lower()
    if provider == "paystack" and settings.PAYMENTS.get("PAYSTACK", {}).get("SECRET_KEY"):
        return PaystackTransferService()
    return MonnifyTransferService()

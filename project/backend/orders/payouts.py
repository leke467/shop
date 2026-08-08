import requests
from django.conf import settings

class PaystackTransferService:
    def __init__(self):
        self.secret_key = settings.PAYMENTS['PAYSTACK']['SECRET_KEY']
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
        response = requests.post(url, json=payload, headers=self.headers)
        response.raise_for_status()
        data = response.json()
        return data["data"]["recipient_code"]

    def initiate_transfer(self, amount: float, recipient_code: str, reason: str = "") -> dict:
        """Initiates a transfer and returns the transfer data."""
        url = f"{self.base_url}/transfer"
        # Paystack expects amount in kobo
        amount_kobo = int(amount * 100)
        payload = {
            "source": "balance",
            "amount": amount_kobo,
            "recipient": recipient_code,
            "reason": reason,
        }
        response = requests.post(url, json=payload, headers=self.headers)
        response.raise_for_status()
        return response.json()["data"]

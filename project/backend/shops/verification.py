"""
Automated identity verification services (Monnify VAS, BVN, NIN, Account Match).
"""
import logging
import requests
from django.conf import settings
from payments.gateways import MonnifyGateway

logger = logging.getLogger(__name__)


class MonnifyIdentityService:
    """
    Automated identity verification via Monnify VAS APIs.
    """

    @classmethod
    def verify_bvn(cls, bvn: str, name: str, date_of_birth: str = None, mobile_no: str = None) -> dict:
        """
        Verify BVN matching against NIBSS via Monnify.
        Endpoint: POST /api/v1/vas/bvn-details-match
        """
        gateway = MonnifyGateway()
        token = gateway._get_access_token()
        if not token:
            return {"success": False, "error": "Monnify authentication unavailable"}

        payload = {
            "bvn": str(bvn).strip(),
            "name": str(name).strip(),
        }
        if date_of_birth:
            payload["dateOfBirth"] = date_of_birth
        if mobile_no:
            payload["mobileNo"] = mobile_no

        try:
            resp = requests.post(
                f"{gateway._base_url}/api/v1/vas/bvn-details-match",
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
                json=payload,
                timeout=15,
                verify=False,
            )
            data = resp.json()
            logger.info("Monnify BVN verification response: status=%s resp=%s", resp.status_code, data)
            if data.get("requestSuccessful") and data.get("responseBody"):
                body = data["responseBody"]
                name_match = body.get("name", {})
                match_percentage = name_match.get("matchPercentage", 0)
                match_status = name_match.get("matchStatus", "")
                is_matched = match_percentage >= 60 or match_status in ("FULL_MATCH", "PARTIAL_MATCH")
                return {
                    "success": is_matched,
                    "match_percentage": match_percentage,
                    "match_status": match_status,
                    "message": "BVN match verified successfully." if is_matched else "BVN name match failed.",
                    "raw_response": body,
                }
            return {
                "success": False,
                "error": data.get("responseMessage", "BVN verification failed."),
                "raw_response": data,
            }
        except Exception as e:
            logger.exception("Monnify BVN verification error: %s", e)
            return {"success": False, "error": str(e)}

    @classmethod
    def verify_nin(cls, nin: str) -> dict:
        """
        Verify NIN details against NIMC via Monnify.
        Endpoint: POST /api/v1/vas/nin-details
        """
        gateway = MonnifyGateway()
        token = gateway._get_access_token()
        if not token:
            return {"success": False, "error": "Monnify authentication unavailable"}

        try:
            resp = requests.post(
                f"{gateway._base_url}/api/v1/vas/nin-details",
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
                json={"nin": str(nin).strip()},
                timeout=15,
                verify=False,
            )
            data = resp.json()
            logger.info("Monnify NIN verification response: status=%s resp=%s", resp.status_code, data)
            if data.get("requestSuccessful") and data.get("responseBody"):
                body = data["responseBody"]
                first_name = body.get("firstname", "")
                surname = body.get("surname", "")
                full_name = f"{first_name} {surname}".strip()
                return {
                    "success": True,
                    "full_name": full_name,
                    "date_of_birth": body.get("birthdate", ""),
                    "gender": body.get("gender", ""),
                    "phone": body.get("telephoneno", ""),
                    "raw_response": body,
                }
            return {
                "success": False,
                "error": data.get("responseMessage", "NIN verification failed."),
                "raw_response": data,
            }
        except Exception as e:
            logger.exception("Monnify NIN verification error: %s", e)
            return {"success": False, "error": str(e)}

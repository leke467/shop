"""
Email & SMS notification services.

EmailService.send_email() is the single dispatch point for all transactional
emails. It supports:
  • Brevo (Sendinblue) REST API v3 directly when BREVO_API_KEY is configured
  • Automatic fallback to Django send_mail() / SMTP
  • Fail-safe execution (logs errors, never crashes caller)
  • Plain-text auto-fallback from HTML
  • Brand & site context injection
"""
import logging
import os
import requests

from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags

logger = logging.getLogger(__name__)


class EmailService:
    """Transactional email dispatcher with Brevo API v3 & Django SMTP support."""

    @staticmethod
    def send_email(subject, template_name, context, recipient_list, from_email=None):
        """
        Render an HTML template and send as email via Brevo REST API v3 or Django SMTP.

        Parameters
        ----------
        subject : str
            Email subject line.
        template_name : str
            Django template path (e.g. "notifications/email/welcome.html").
        context : dict
            Template rendering context.
        recipient_list : list[str]
            Email addresses to send to.
        from_email : str | None
            Sender address. Falls back to settings.DEFAULT_FROM_EMAIL.
        """
        if not recipient_list:
            logger.warning("send_email called with empty recipient_list for '%s'", subject)
            return

        # Inject site_url into every email context if not already present
        if "site_url" not in context:
            context["site_url"] = getattr(settings, "SITE_URL", "https://multishopng.com")

        try:
            html_message = render_to_string(template_name, context)
            plain_message = strip_tags(html_message)
        except Exception as exc:
            logger.error("Failed to render email template '%s': %s", template_name, exc, exc_info=True)
            return

        # Check Brevo API Key
        brevo_api_key = os.environ.get("BREVO_API_KEY") or getattr(settings, "BREVO_API_KEY", "")
        brevo_sender_email = (
            os.environ.get("BREVO_SENDER_EMAIL")
            or getattr(settings, "BREVO_SENDER_EMAIL", "")
            or "multishopng@apexlabs.it.com"
        )

        sender_email = from_email or getattr(settings, "DEFAULT_FROM_EMAIL", brevo_sender_email)
        if "<" in sender_email and ">" in sender_email:
            sender_name = sender_email.split("<")[0].strip()
            sender_addr = sender_email.split("<")[1].replace(">", "").strip()
        else:
            sender_name = "MultiShop Marketplace"
            sender_addr = sender_email

        # Try Brevo REST API v3 if API key available
        if brevo_api_key:
            try:
                brevo_url = "https://api.brevo.com/v3/smtp/email"
                headers = {
                    "accept": "application/json",
                    "api-key": brevo_api_key,
                    "content-type": "application/json",
                }
                to_payload = [{"email": r} for r in recipient_list]
                payload = {
                    "sender": {"name": sender_name, "email": sender_addr},
                    "to": to_payload,
                    "subject": subject,
                    "htmlContent": html_message,
                    "textContent": plain_message,
                }
                res = requests.post(brevo_url, headers=headers, json=payload, timeout=12)
                if res.status_code in (200, 201, 202):
                    logger.info("Email sent via Brevo API v3: subject='%s' to=%s msg_id=%s", subject, recipient_list, res.json().get("messageId"))
                    return
                else:
                    logger.warning("Brevo API v3 returned status %s: %s. Falling back to Django send_mail().", res.status_code, res.text)
            except Exception as b_exc:
                logger.warning("Brevo API v3 request failed: %s. Falling back to Django send_mail().", b_exc)

        # Fallback to Django send_mail() / SMTP
        try:
            send_mail(
                subject,
                plain_message,
                f"{sender_name} <{sender_addr}>",
                recipient_list,
                html_message=html_message,
                fail_silently=False,
            )
            logger.info(
                "Email sent via Django send_mail(): subject='%s' to=%s template='%s'",
                subject, recipient_list, template_name,
            )
        except Exception as exc:
            logger.error(
                "Failed to send email: subject='%s' to=%s error=%s",
                subject, recipient_list, exc,
                exc_info=True,
            )


class SMSService:
    """Termii SMS gateway integration."""

    @staticmethod
    def send_sms(to, message):
        api_key = os.environ.get("TERMII_API_KEY")
        sender_id = os.environ.get("TERMII_SENDER_ID", "N-Alert")

        if not api_key:
            logger.warning("TERMII_API_KEY not configured — SMS not sent to %s", to)
            return {"error": "TERMII_API_KEY not set"}

        url = "https://api.ng.termii.com/api/sms/send"
        payload = {
            "to": to,
            "from": sender_id,
            "sms": message,
            "type": "plain",
            "channel": "generic",
            "api_key": api_key,
        }

        try:
            response = requests.post(url, json=payload, timeout=15)
            return response.json()
        except Exception as e:
            logger.error("SMS send failed to %s: %s", to, e)
            return {"error": str(e)}

"""
Email & SMS notification services.

EmailService.send_email() is the single dispatch point for all transactional
emails.  It wraps Django's send_mail() with:

  • fail_silently mode (logs errors, never crashes the caller)
  • plain-text auto-fallback from HTML
  • configurable from_email with DEFAULT_FROM_EMAIL fallback
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
    """Transactional email dispatcher."""

    @staticmethod
    def send_email(subject, template_name, context, recipient_list, from_email=None):
        """
        Render an HTML template and send as email.

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
            Sender address.  Falls back to settings.DEFAULT_FROM_EMAIL.
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
            sender = from_email or getattr(settings, "DEFAULT_FROM_EMAIL", "no-reply@multishopng.com")

            send_mail(
                subject,
                plain_message,
                sender,
                recipient_list,
                html_message=html_message,
                fail_silently=False,
            )
            logger.info(
                "Email sent: subject='%s' to=%s template='%s'",
                subject, recipient_list, template_name,
            )
        except Exception as exc:
            # Never crash the caller — log and move on.
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

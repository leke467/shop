import os
import requests
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings

class EmailService:
    @staticmethod
    def send_email(subject, template_name, context, recipient_list):
        html_message = render_to_string(template_name, context)
        plain_message = strip_tags(html_message)
        from_email = settings.DEFAULT_FROM_EMAIL
        
        send_mail(
            subject,
            plain_message,
            from_email,
            recipient_list,
            html_message=html_message,
            fail_silently=False,
        )

class SMSService:
    @staticmethod
    def send_sms(to, message):
        api_key = os.environ.get('TERMII_API_KEY')
        sender_id = os.environ.get('TERMII_SENDER_ID', 'N-Alert')
        
        url = "https://api.ng.termii.com/api/sms/send"
        payload = {
            "to": to,
            "from": sender_id,
            "sms": message,
            "type": "plain",
            "channel": "generic",
            "api_key": api_key,
        }
        
        headers = {
            'Content-Type': 'application/json',
        }
        
        try:
            response = requests.request("POST", url, headers=headers, json=payload)
            return response.json()
        except Exception as e:
            return {"error": str(e)}

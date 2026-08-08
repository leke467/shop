from django.db import models
from django.conf import settings
from core.models import TimeStampedModel

class NotificationPreference(TimeStampedModel):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notification_preference')
    email_enabled = models.BooleanField(default=True)
    sms_enabled = models.BooleanField(default=False)
    whatsapp_enabled = models.BooleanField(default=False)
    phone_number = models.CharField(max_length=20, blank=True)

    def __str__(self):
        return f"{self.user}'s Notification Preferences"

from rest_framework import serializers
from .models import NotificationPreference

class NotificationPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationPreference
        fields = ['email_enabled', 'sms_enabled', 'whatsapp_enabled', 'phone_number']

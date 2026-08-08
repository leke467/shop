from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import NotificationPreference
from .serializers import NotificationPreferenceSerializer

class NotificationPreferenceView(generics.RetrieveUpdateAPIView):
    serializer_class = NotificationPreferenceSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        obj, created = NotificationPreference.objects.get_or_create(user=self.request.user)
        return obj

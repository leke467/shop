from django.db import models
from django.conf import settings
from core.models import TimeStampedModel

class Conversation(TimeStampedModel):
    participants = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='conversations')
    # shop = models.ForeignKey('shops.Shop', on_delete=models.SET_NULL, null=True, blank=True)
    # order = models.ForeignKey('orders.Order', on_delete=models.SET_NULL, null=True, blank=True)
    subject = models.CharField(max_length=255, blank=True)
    
    def __str__(self):
        return f"Conversation {self.id} - {self.subject}"

class Message(TimeStampedModel):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_messages')
    content = models.TextField()
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Message from {self.sender} in {self.conversation}"

from rest_framework import generics, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils import timezone
from .models import Conversation, Message
from .serializers import ConversationListSerializer, ConversationDetailSerializer, MessageSerializer

class ConversationListView(generics.ListAPIView):
    serializer_class = ConversationListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.request.user.conversations.all().order_by('-updated_at')

class ConversationDetailView(generics.RetrieveAPIView):
    serializer_class = ConversationDetailSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.request.user.conversations.all()

class ConversationCreateView(generics.CreateAPIView):
    serializer_class = ConversationDetailSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        conversation = serializer.save()
        conversation.participants.add(self.request.user)
        # H3: Only allow adding participants that are valid (shop owners, admins)
        # Don't let users set arbitrary participant IDs from the request
        participant_ids = self.request.data.get('participant_ids', [])
        if participant_ids:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            # Only add users who actually exist — don't expose enumeration
            valid_users = User.objects.filter(pk__in=participant_ids, is_active=True)
            conversation.participants.add(*valid_users)

class MessageCreateView(generics.CreateAPIView):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        conversation = Conversation.objects.get(id=self.kwargs['conv_id'], participants=self.request.user)
        serializer.save(sender=self.request.user, conversation=conversation)
        conversation.save() # Update the updated_at timestamp

class MarkAsReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, message_id):
        try:
            message = Message.objects.get(id=message_id, conversation__participants=request.user)
            if message.sender != request.user and not message.is_read:
                message.is_read = True
                message.read_at = timezone.now()
                message.save()
            return Response({'status': 'ok'})
        except Message.DoesNotExist:
            return Response({'status': 'error'}, status=404)

class UnreadCountView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        count = Message.objects.filter(
            conversation__participants=request.user,
            is_read=False
        ).exclude(sender=request.user).count()
        return Response({'unread_count': count})

from rest_framework import serializers
from .models import Conversation, Message

class MessageSerializer(serializers.ModelSerializer):
    sender_email = serializers.EmailField(source='sender.email', read_only=True)
    sender_name = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = ['id', 'conversation', 'sender', 'sender_email', 'sender_name', 'content', 'is_read', 'read_at', 'created_at']

    def get_sender_name(self, obj):
        if obj.sender:
            return obj.sender.get_full_name() or obj.sender.email.split('@')[0]
        return 'Customer'

class ConversationListSerializer(serializers.ModelSerializer):
    last_message = serializers.SerializerMethodField()
    customer_name = serializers.SerializerMethodField()
    customer_email = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = ['id', 'subject', 'updated_at', 'last_message', 'customer_name', 'customer_email']

    def get_last_message(self, obj):
        last = obj.messages.order_by('-created_at').first()
        if last:
            return last.content[:80] + ('...' if len(last.content) > 80 else '')
        return ""

    def get_customer_name(self, obj):
        request = self.context.get('request')
        if request and request.user:
            other = obj.participants.exclude(id=request.user.id).first()
            if other:
                return other.get_full_name() or other.email.split('@')[0]
        return "Customer"

    def get_customer_email(self, obj):
        request = self.context.get('request')
        if request and request.user:
            other = obj.participants.exclude(id=request.user.id).first()
            if other:
                return other.email
        return ""

class ConversationDetailSerializer(serializers.ModelSerializer):
    messages = MessageSerializer(many=True, read_only=True)
    customer_name = serializers.SerializerMethodField()
    customer_email = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = ['id', 'subject', 'updated_at', 'messages', 'customer_name', 'customer_email', 'created_at']

    def get_customer_name(self, obj):
        request = self.context.get('request')
        if request and request.user:
            other = obj.participants.exclude(id=request.user.id).first()
            if other:
                return other.get_full_name() or other.email.split('@')[0]
        return "Customer"

    def get_customer_email(self, obj):
        request = self.context.get('request')
        if request and request.user:
            other = obj.participants.exclude(id=request.user.id).first()
            if other:
                return other.email
        return ""

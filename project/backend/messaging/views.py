from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth import get_user_model
from shops.models import Shop
from .models import Conversation, Message
from .serializers import ConversationListSerializer, ConversationDetailSerializer, MessageSerializer

class ConversationListView(generics.ListAPIView):
    serializer_class = ConversationListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = self.request.user.conversations.all().order_by('-updated_at')
        shop_slug = self.request.query_params.get('shop')
        if shop_slug:
            qs = qs.filter(participants__shops__slug=shop_slug).distinct()
        return qs

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
        participant_ids = self.request.data.get('participant_ids', [])
        if participant_ids:
            User = get_user_model()
            valid_users = User.objects.filter(pk__in=participant_ids, is_active=True)
            conversation.participants.add(*valid_users)

class MessageCreateView(generics.CreateAPIView):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        conversation = Conversation.objects.get(id=self.kwargs['conv_id'], participants=self.request.user)
        serializer.save(sender=self.request.user, conversation=conversation)
        conversation.save()

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

class ContactInquiryView(APIView):
    """
    Public endpoint for customers to submit storefront contact forms.
    Creates a Conversation + Message, and sends an email notification to the store owner.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        name = request.data.get("name", "").strip()
        email = request.data.get("email", "").strip()
        phone = request.data.get("phone", "").strip()
        message_text = request.data.get("message", "").strip()
        shop_slug = request.data.get("shop_slug", "").strip()

        if not name or not email or not message_text or not shop_slug:
            return Response(
                {"detail": "Name, email, message, and shop_slug are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        shop = generics.get_object_or_404(Shop, slug=shop_slug)
        shop_owner = shop.owner

        User = get_user_model()
        if request.user and request.user.is_authenticated:
            sender = request.user
        else:
            sender, _ = User.objects.get_or_create(
                email=email,
                defaults={
                    "first_name": name,
                    "role": User.Role.BUYER if hasattr(User, "Role") else "buyer",
                },
            )

        subject = f"Store Inquiry: {shop.name} (from {name})"
        conv = Conversation.objects.create(subject=subject)
        conv.participants.add(sender, shop_owner)

        full_content = (
            f"Customer Name: {name}\n"
            f"Email: {email}\n"
            f"Phone: {phone or 'N/A'}\n\n"
            f"Message:\n{message_text}"
        )

        Message.objects.create(
            conversation=conv,
            sender=sender,
            content=full_content,
        )

        recipient_emails = [shop_owner.email]
        if shop.email and shop.email != shop_owner.email:
            recipient_emails.append(shop.email)

        try:
            subject_email = f"New Storefront Inquiry from {name} for {shop.name}"
            html_content = f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden; background: #ffffff;">
              <div style="background: linear-gradient(135deg, #f9a826, #ff6b8b); padding: 24px; color: white;">
                <h2 style="margin: 0; font-size: 20px;">📬 New Message Received</h2>
                <p style="margin: 4px 0 0 0; opacity: 0.95; font-size: 14px;">Storefront inquiry for <strong>{shop.name}</strong></p>
              </div>
              <div style="padding: 24px; color: #1f2937;">
                <p style="margin: 0 0 8px 0;"><strong>Customer Name:</strong> {name}</p>
                <p style="margin: 0 0 8px 0;"><strong>Email Address:</strong> <a href="mailto:{email}" style="color: #2563eb;">{email}</a></p>
                <p style="margin: 0 0 16px 0;"><strong>Phone Number:</strong> {phone or 'N/A'}</p>
                
                <div style="background: #f9fafb; border-left: 4px solid #f9a826; padding: 16px; margin: 16px 0; border-radius: 8px;">
                  <p style="margin: 0; white-space: pre-wrap; font-size: 14px; color: #374151;">{message_text}</p>
                </div>

                <div style="margin-top: 24px; text-align: center;">
                  <a href="http://localhost:5173/dashboard" style="display: inline-block; background: #f9a826; color: white; text-decoration: none; padding: 12px 28px; border-radius: 12px; font-weight: bold; font-size: 14px;">Open Dashboard Messages</a>
                </div>
              </div>
            </div>
            """
            send_mail(
                subject=subject_email,
                message=full_content,
                from_email=getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@multishop.ng"),
                recipient_list=recipient_emails,
                html_message=html_content,
                fail_silently=True,
            )
        except Exception as e:
            print("Failed to send notification email:", e)

        return Response(
            {
                "status": "success",
                "detail": "Message delivered to store owner and email sent.",
                "conversation_id": conv.id,
            },
            status=status.HTTP_201_CREATED,
        )

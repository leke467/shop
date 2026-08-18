from django.urls import path
from . import views

urlpatterns = [
    path('', views.ConversationListView.as_view(), name='conversation-list'),
    path('contact/', views.ContactInquiryView.as_view(), name='contact-inquiry'),
    path('create/', views.ConversationCreateView.as_view(), name='conversation-create'),
    path('<int:pk>/', views.ConversationDetailView.as_view(), name='conversation-detail'),
    path('<int:conv_id>/messages/', views.MessageCreateView.as_view(), name='message-create'),
    path('messages/<int:message_id>/mark-read/', views.MarkAsReadView.as_view(), name='message-mark-read'),
    path('unread-count/', views.UnreadCountView.as_view(), name='unread-count'),
]

from .models import Shop, ShopCategory, ShopReview
from django.shortcuts import get_object_or_404
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth.models import User
from rest_framework import generics
from django.shortcuts import render
from .serializers import UserSerializer, ShopSerializer
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken


class CreateUserView(generics.CreateAPIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        data = request.data
        required_fields = ['username', 'email', 'password', 'first_name', 'last_name']
        for field in required_fields:
            if field not in data or not data[field]:
                return Response({field: "This field is required."}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username=data['username']).exists():
            return Response({'username': 'Username already exists.'}, status=status.HTTP_400_BAD_REQUEST)
        if User.objects.filter(email=data['email']).exists():
            return Response({'email': 'Email already exists.'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create_user(
            username=data['username'],
            email=data['email'],
            password=data['password'],
            first_name=data['first_name'],
            last_name=data['last_name'],
        )

        refresh = RefreshToken.for_user(user)
        return Response({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        }, status=status.HTTP_201_CREATED)

class UserListCreate(generics.ListCreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return User.objects.filter(owner=user)

class CreateShopView(generics.CreateAPIView):
    queryset = Shop.objects.all()
    serializer_class = ShopSerializer
    # permission_classes = [IsAuthenticated]

class UpdateShopView(generics.UpdateAPIView):
    queryset = Shop.objects.all()
    serializer_class = ShopSerializer
    # permission_classes = [IsAuthenticated]

class DeleteShopView(generics.DestroyAPIView):
    queryset = Shop.objects.all()
    serializer_class = ShopSerializer
    # permission_classes = [IsAuthenticated]


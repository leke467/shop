from rest_framework import serializers
from .models import Shop, ShopCategory, ShopReview
from django.contrib.auth.models import User


class ShopSerializer(serializers.ModelSerializer):
    class Meta:
        model = Shop
        fields = '__all__'
        

class ShopCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ShopCategory
        fields = '__all__'

class ShopReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShopReview
        fields = '__all__' 

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "password"]
        extra_kwargs = {"password": {"write_only": True}}

    def create(self, validated_data):
        print(validated_data)
        user = User.objects.create_user(**validated_data)
        return user

import pytest
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient

User = get_user_model()

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def user_data():
    return {
        "email": "testuser@example.com",
        "username": "testuser",
        "password": "securepassword123",
        "first_name": "Test",
        "last_name": "User"
    }

@pytest.mark.django_db
def test_register_user(api_client, user_data):
    url = reverse("register")
    response = api_client.post(url, user_data)
    assert response.status_code == status.HTTP_201_CREATED
    assert "user" in response.data
    assert response.data["user"]["email"] == user_data["email"]
    assert User.objects.filter(email=user_data["email"]).exists()

@pytest.mark.django_db
def test_cookie_login(api_client, user_data):
    # Register user first
    User.objects.create_user(
        email=user_data["email"],
        username=user_data["username"],
        password=user_data["password"]
    )
    
    url = reverse("login")
    response = api_client.post(url, {
        "email": user_data["email"],
        "password": user_data["password"]
    })
    
    assert response.status_code == status.HTTP_200_OK
    assert "access" in response.data
    # Assert HttpOnly cookies are set
    assert "access_token" in response.cookies
    assert "refresh_token" in response.cookies
    assert response.cookies["access_token"]["httponly"] is True

@pytest.mark.django_db
def test_get_profile(api_client, user_data):
    user = User.objects.create_user(
        email=user_data["email"],
        username=user_data["username"],
        password=user_data["password"]
    )
    api_client.force_authenticate(user=user)
    
    url = reverse("profile")
    response = api_client.get(url)
    assert response.status_code == status.HTTP_200_OK
    assert response.data["email"] == user_data["email"]

@pytest.mark.django_db
def test_cookie_token_refresh(api_client, user_data):
    User.objects.create_user(
        email=user_data["email"],
        username=user_data["username"],
        password=user_data["password"]
    )
    # Login to get cookies
    login_response = api_client.post(reverse("login"), {
        "email": user_data["email"],
        "password": user_data["password"]
    })
    refresh_token = login_response.cookies["refresh_token"].value
    
    # Clear client credentials/cookies to test explicit refresh
    api_client.cookies.clear()
    api_client.cookies["refresh_token"] = refresh_token
    
    refresh_url = reverse("token-refresh")
    response = api_client.post(refresh_url)
    assert response.status_code == status.HTTP_200_OK
    assert "access" in response.data
    assert "access_token" in response.cookies

@pytest.mark.django_db
def test_cookie_logout(api_client, user_data):
    user = User.objects.create_user(
        email=user_data["email"],
        username=user_data["username"],
        password=user_data["password"]
    )
    api_client.force_authenticate(user=user)
    
    url = reverse("logout")
    response = api_client.post(url)
    assert response.status_code == status.HTTP_200_OK
    # Cookies should be empty or deleted
    assert response.cookies["access_token"].value == ""
    assert response.cookies["refresh_token"].value == ""

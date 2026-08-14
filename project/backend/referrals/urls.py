"""
Referral API URLs.
"""
from django.urls import path

from referrals.views import (
    ReferralCustomCodeView,
    ReferralMyStatsView,
    ReferralTrackClickView,
)

urlpatterns = [
    path("me/", ReferralMyStatsView.as_view(), name="referral-me"),
    path("click/", ReferralTrackClickView.as_view(), name="referral-click"),
    path("custom-code/", ReferralCustomCodeView.as_view(), name="referral-custom-code"),
]

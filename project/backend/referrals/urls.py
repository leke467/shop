"""
Referral API URLs.
"""
from django.urls import path

from referrals.views import (
    ReferralCustomCodeView,
    ReferralMyStatsView,
    ReferralTrackClickView,
    ReferralValidateCodeView,
    ReferralBanksListView,
    ReferralBankAccountListCreateView,
    ReferralBankAccountDetailView,
    ReferralWithdrawView,
    ReferralClaimView,
)

urlpatterns = [
    path("me/", ReferralMyStatsView.as_view(), name="referral-me"),
    path("validate/", ReferralValidateCodeView.as_view(), name="referral-validate"),
    path("claim/", ReferralClaimView.as_view(), name="referral-claim"),
    path("click/", ReferralTrackClickView.as_view(), name="referral-click"),
    path("custom-code/", ReferralCustomCodeView.as_view(), name="referral-custom-code"),
    path("banks/", ReferralBanksListView.as_view(), name="referral-banks"),
    path("bank-accounts/", ReferralBankAccountListCreateView.as_view(), name="referral-bank-accounts"),
    path("bank-accounts/<int:pk>/", ReferralBankAccountDetailView.as_view(), name="referral-bank-account-detail"),
    path("withdraw/", ReferralWithdrawView.as_view(), name="referral-withdraw"),
]

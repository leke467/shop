from django.urls import path

from .views import (
    FavouriteDeleteView,
    FavouriteListCreateView,
    PersonalizedFeedView,
    TrackEventView,
    TrackSearchView,
)

urlpatterns = [
    # Event tracking (Item 34)
    path("events/", TrackEventView.as_view(), name="track-event"),
    path("search/", TrackSearchView.as_view(), name="track-search"),
    # Favourites
    path("favourites/", FavouriteListCreateView.as_view(), name="favourite-list"),
    path("favourites/<int:pk>/", FavouriteDeleteView.as_view(), name="favourite-delete"),
    # Personalized feed (Item 36)
    path("feed/", PersonalizedFeedView.as_view(), name="personalized-feed"),
]

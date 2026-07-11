"""Personalization serializers."""
from rest_framework import serializers

from .models import Favourite, PersonalizationEvent, SearchQuery


class EventCreateSerializer(serializers.ModelSerializer):
    """Write-only — ingests a tracking event."""
    class Meta:
        model = PersonalizationEvent
        fields = ("event_type", "product", "shop", "category", "metadata")

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)


class FavouriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Favourite
        fields = ("id", "product", "shop", "created_at")
        read_only_fields = ("id", "created_at")

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)


class SearchQuerySerializer(serializers.ModelSerializer):
    class Meta:
        model = SearchQuery
        fields = ("id", "query", "results_count", "created_at")
        read_only_fields = fields

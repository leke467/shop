from django.contrib import admin

from .models import (
    Favourite,
    PersonalizationEvent,
    RecommendationCache,
    SearchQuery,
)


@admin.register(PersonalizationEvent)
class PersonalizationEventAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "event_type",
        "target_type",
        "target_id",
        "created_at",
    )
    list_filter = ("event_type", "target_type", "created_at")
    search_fields = ("user__email",)
    raw_id_fields = ("user",)
    date_hierarchy = "created_at"
    readonly_fields = ("created_at",)


@admin.register(Favourite)
class FavouriteAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "target_type", "target_id", "created_at")
    list_filter = ("target_type",)
    search_fields = ("user__email",)
    raw_id_fields = ("user",)


@admin.register(SearchQuery)
class SearchQueryAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "query", "results_count", "created_at")
    search_fields = ("user__email", "query")
    raw_id_fields = ("user",)
    date_hierarchy = "created_at"


@admin.register(RecommendationCache)
class RecommendationCacheAdmin(admin.ModelAdmin):
    list_display = ("user", "computed_at", "is_stale")
    search_fields = ("user__email",)
    raw_id_fields = ("user",)
    readonly_fields = ("computed_at",)

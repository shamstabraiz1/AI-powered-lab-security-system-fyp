from django.contrib import admin
from .models import Evidence


@admin.register(Evidence)
class EvidenceAdmin(admin.ModelAdmin):
    list_display = (
        "incident",
        "confidence",
        "captured_at",
        "created_at",
    )

    search_fields = (
        "incident__id",
    )

    list_filter = (
        "captured_at",
    )
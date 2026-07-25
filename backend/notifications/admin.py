"""Admin panel registration for Notification model."""

from django.contrib import admin
from notifications.models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    """Admin interface customization for Notification model."""

    list_display = (
        "id",
        "title",
        "notification_type",
        "severity",
        "is_read",
        "lab",
        "camera",
        "created_at",
    )

    list_filter = (
        "severity",
        "notification_type",
        "is_read",
        "created_at",
    )

    search_fields = (
        "title",
        "message",
        "camera__name",
        "lab__name",
    )

    readonly_fields = (
        "created_at",
        "read_at",
    )

    ordering = ("-created_at",)

from django.contrib import admin
from .models import Lab


@admin.register(Lab)
class LabAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "name",
        "building",
        "room_number",
        "total_computers",
        "is_active",
    )

    search_fields = (
        "name",
        "building",
        "room_number",
    )

    list_filter = (
        "building",
        "is_active",
    )
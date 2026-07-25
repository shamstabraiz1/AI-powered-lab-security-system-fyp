from django.contrib import admin
from .models import Camera


@admin.register(Camera)
class CameraAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "lab",
        "serial_number",
        "status",
    )

    search_fields = (
        "name",
        "serial_number",
    )

    list_filter = (
        "status",
        "lab",
    )
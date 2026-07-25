from django.contrib import admin
from .models import Asset


@admin.register(Asset)
class AssetAdmin(admin.ModelAdmin):

    list_display = (
        "name",
        "lab",
        "category",
        "asset_tag",
        "status",
    )

    search_fields = (
        "name",
        "asset_tag",
    )

    list_filter = (
        "lab",
        "status",
        "category",
    )
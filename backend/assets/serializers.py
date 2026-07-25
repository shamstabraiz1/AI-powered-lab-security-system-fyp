"""Serializers for Assets app."""

from rest_framework import serializers
from assets.models import Asset
from labs.serializers import LabSerializer


class AssetSerializer(serializers.ModelSerializer):
    """Serializer for Asset model."""

    lab_details = LabSerializer(source="lab", read_only=True)

    class Meta:
        model = Asset
        fields = [
            "id",
            "lab",
            "lab_details",
            "name",
            "category",
            "asset_tag",
            "expected_quantity",
            "status",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

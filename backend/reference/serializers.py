"""Serializers for Reference Profiles and Reference Assets."""

from rest_framework import serializers
from assets.serializers import AssetSerializer
from cameras.serializers import CameraSerializer
from reference.models import ReferenceAsset, ReferenceProfile


class ReferenceAssetSerializer(serializers.ModelSerializer):
    """Serializer for ReferenceAsset model."""

    asset_details = AssetSerializer(source="asset", read_only=True)

    class Meta:
        model = ReferenceAsset
        fields = [
            "id",
            "reference",
            "asset",
            "asset_details",
            "detected_quantity",
            "confidence",
        ]
        read_only_fields = ["id"]


class ReferenceProfileSerializer(serializers.ModelSerializer):
    """Serializer for ReferenceProfile model with nested assets."""

    camera_details = CameraSerializer(source="camera", read_only=True)
    assets = ReferenceAssetSerializer(many=True, read_only=True)

    class Meta:
        model = ReferenceProfile
        fields = [
            "id",
            "camera",
            "camera_details",
            "reference_image",
            "is_active",
            "created_at",
            "assets",
        ]
        read_only_fields = ["id", "created_at"]

"""Serializers for Reference Profiles and Reference Assets."""

from rest_framework import serializers
from assets.serializers import AssetSerializer
from cameras.serializers import CameraSerializer
from labs.serializers import LabSerializer
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
            "asset_name",
            "category",
            "asset_details",
            "detected_quantity",
            "confidence",
        ]
        read_only_fields = ["id"]


class ReferenceProfileSerializer(serializers.ModelSerializer):
    """Serializer for ReferenceProfile model with nested assets."""

    camera_details = CameraSerializer(source="camera", read_only=True)
    lab_details = LabSerializer(source="lab", read_only=True)
    assets = ReferenceAssetSerializer(many=True, read_only=True)
    cameras_count = serializers.SerializerMethodField()
    images_count = serializers.SerializerMethodField()

    class Meta:
        model = ReferenceProfile
        fields = [
            "id",
            "name",
            "lab",
            "lab_details",
            "camera",
            "camera_details",
            "description",
            "created_by",
            "reference_image",
            "is_active",
            "created_at",
            "last_updated",
            "cameras_count",
            "images_count",
            "assets",
        ]
        read_only_fields = ["id", "created_at", "last_updated"]

    def get_cameras_count(self, obj: ReferenceProfile) -> int:
        if obj.lab:
            return obj.lab.cameras.count()
        return 1 if obj.camera else 0

    def get_images_count(self, obj: ReferenceProfile) -> int:
        return 1 if obj.reference_image else 0

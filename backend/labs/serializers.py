"""Serializers for Labs app."""

from rest_framework import serializers
from labs.models import Lab


class LabSerializer(serializers.ModelSerializer):
    """Serializer for Lab model."""

    building = serializers.CharField(max_length=100, required=False, default="Software Engineering Building")
    room_number = serializers.CharField(max_length=20, required=False, default="101")
    total_computers = serializers.IntegerField(required=False, default=30)
    cameras_count = serializers.SerializerMethodField()
    assets_count = serializers.SerializerMethodField()

    class Meta:
        model = Lab
        fields = [
            "id",
            "name",
            "building",
            "room_number",
            "total_computers",
            "is_active",
            "created_at",
            "cameras_count",
            "assets_count",
        ]
        read_only_fields = ["id", "created_at"]

    def get_cameras_count(self, obj: Lab) -> int:
        return obj.cameras.count() if hasattr(obj, "cameras") else 0

    def get_assets_count(self, obj: Lab) -> int:
        return obj.assets.count() if hasattr(obj, "assets") else 0

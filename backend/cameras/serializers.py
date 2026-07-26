"""Serializers for Cameras app."""

from rest_framework import serializers
from cameras.models import Camera
from labs.serializers import LabSerializer


class CameraSerializer(serializers.ModelSerializer):
    """Serializer for Camera model."""

    lab_details = LabSerializer(source="lab", read_only=True)

    class Meta:
        model = Camera
        fields = [
            "id",
            "lab",
            "lab_details",
            "name",
            "serial_number",
            "brand",
            "model_name",
            "ip_address",
            "rtsp_url",
            "username",
            "password",
            "location",
            "resolution",
            "fps",
            "is_active",
            "status",
            "reference_image",
            "last_seen",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]
        extra_kwargs = {
            "password": {"write_only": True, "required": False},
        }

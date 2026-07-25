"""Serializers for Notifications app."""

from rest_framework import serializers
from cameras.serializers import CameraSerializer
from labs.serializers import LabSerializer
from notifications.models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for Notification model."""

    lab_details = LabSerializer(source="lab", read_only=True)
    camera_details = CameraSerializer(source="camera", read_only=True)

    class Meta:
        model = Notification
        fields = [
            "id",
            "incident",
            "lab",
            "lab_details",
            "camera",
            "camera_details",
            "title",
            "message",
            "severity",
            "notification_type",
            "is_read",
            "created_at",
            "read_at",
        ]
        read_only_fields = ["id", "created_at", "read_at"]

"""Serializers for Incidents app."""

from rest_framework import serializers
from assets.serializers import AssetSerializer
from cameras.serializers import CameraSerializer
from incidents.models import Incident
from labs.serializers import LabSerializer


class IncidentSerializer(serializers.ModelSerializer):
    """Serializer for Incident model with nested evidence details."""

    lab_details = LabSerializer(source="lab", read_only=True)
    camera_details = CameraSerializer(source="camera", read_only=True)
    asset_details = AssetSerializer(source="asset", read_only=True)
    missing_quantity = serializers.SerializerMethodField()
    evidence_details = serializers.SerializerMethodField()

    class Meta:
        model = Incident
        fields = [
            "id",
            "lab",
            "lab_details",
            "camera",
            "camera_details",
            "asset",
            "asset_details",
            "expected_quantity",
            "detected_quantity",
            "missing_quantity",
            "confidence",
            "description",
            "status",
            "detected_at",
            "evidence_details",
        ]
        read_only_fields = ["id", "detected_at"]

    def get_missing_quantity(self, obj: Incident) -> int:
        return max(0, obj.expected_quantity - obj.detected_quantity)

    def get_evidence_details(self, obj: Incident):
        ev = obj.evidence.first()
        if not ev:
            return None
        return {
            "id": ev.id,
            "image": ev.image.url if ev.image else None,
            "video": ev.video.url if ev.video else None,
            "confidence": ev.confidence,
            "captured_at": ev.captured_at,
        }

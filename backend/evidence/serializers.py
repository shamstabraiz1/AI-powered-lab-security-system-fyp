"""Serializers for Evidence app."""

from rest_framework import serializers
from evidence.models import Evidence
from incidents.serializers import IncidentSerializer


class EvidenceSerializer(serializers.ModelSerializer):
    """Serializer for Evidence model."""

    incident_details = IncidentSerializer(source="incident", read_only=True)
    camera_name = serializers.CharField(source="incident.camera.name", read_only=True, default="")
    lab_name = serializers.CharField(source="incident.lab.name", read_only=True, default="")
    asset_name = serializers.CharField(source="incident.asset.name", read_only=True, default="")
    missing_quantity = serializers.IntegerField(source="incident.missing_quantity", read_only=True, default=1)

    class Meta:
        model = Evidence
        fields = [
            "id",
            "incident",
            "incident_details",
            "camera_name",
            "lab_name",
            "asset_name",
            "missing_quantity",
            "image",
            "video",
            "confidence",
            "captured_at",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

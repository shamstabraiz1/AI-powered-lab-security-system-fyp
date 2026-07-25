"""Serializers for Evidence app."""

from rest_framework import serializers
from evidence.models import Evidence
from incidents.serializers import IncidentSerializer


class EvidenceSerializer(serializers.ModelSerializer):
    """Serializer for Evidence model."""

    incident_details = IncidentSerializer(source="incident", read_only=True)

    class Meta:
        model = Evidence
        fields = [
            "id",
            "incident",
            "incident_details",
            "image",
            "video",
            "confidence",
            "captured_at",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

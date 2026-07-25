"""ViewSets for Incidents app."""

from django_filters.rest_framework import DateFromToRangeFilter, DjangoFilterBackend, FilterSet
from rest_framework import filters, viewsets
from core.permissions import IsSecurityOfficer
from incidents.models import Incident
from incidents.serializers import IncidentSerializer


class IncidentFilter(FilterSet):
    """FilterSet for Incident model filtering by date ranges and relationships."""

    detected_at = DateFromToRangeFilter()

    class Meta:
        model = Incident
        fields = ["status", "lab", "camera", "asset", "detected_at"]


class IncidentViewSet(viewsets.ModelViewSet):
    """ViewSet for viewing, creating, updating, and managing security Incidents."""

    queryset = Incident.objects.select_related("lab", "camera", "asset").all().order_by("-detected_at")
    serializer_class = IncidentSerializer
    permission_classes = [IsSecurityOfficer]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = IncidentFilter
    search_fields = ["description", "asset__name", "camera__name", "lab__name"]
    ordering_fields = ["detected_at", "status", "confidence"]

"""ViewSets for Cameras app."""

from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, viewsets
from cameras.models import Camera
from cameras.serializers import CameraSerializer
from core.permissions import IsAdminOrSecurityOfficer


class CameraViewSet(viewsets.ModelViewSet):
    """ViewSet for viewing and managing Camera records."""

    queryset = Camera.objects.select_related("lab").all().order_by("-created_at")
    serializer_class = CameraSerializer
    permission_classes = [IsAdminOrSecurityOfficer]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["status", "lab"]
    search_fields = ["name", "serial_number", "location", "lab__name"]
    ordering_fields = ["name", "created_at", "status"]

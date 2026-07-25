"""ViewSets for Labs app."""

from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, viewsets
from core.permissions import IsAdminOrSecurityOfficer
from labs.models import Lab
from labs.serializers import LabSerializer


class LabViewSet(viewsets.ModelViewSet):
    """ViewSet for viewing and managing Lab records."""

    queryset = Lab.objects.all().order_by("-created_at")
    serializer_class = LabSerializer
    permission_classes = [IsAdminOrSecurityOfficer]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["is_active", "building"]
    search_fields = ["name", "building", "room_number"]
    ordering_fields = ["name", "created_at", "total_computers"]

"""ViewSets for Reference app."""

from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, viewsets
from core.permissions import IsAdminOrSecurityOfficer
from reference.models import ReferenceAsset, ReferenceProfile
from reference.serializers import ReferenceAssetSerializer, ReferenceProfileSerializer


class ReferenceProfileViewSet(viewsets.ModelViewSet):
    """ViewSet for viewing and managing ReferenceProfile records."""

    queryset = ReferenceProfile.objects.select_related("camera", "camera__lab").prefetch_related("assets", "assets__asset").all().order_by("-created_at")
    serializer_class = ReferenceProfileSerializer
    permission_classes = [IsAdminOrSecurityOfficer]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["camera", "is_active"]
    search_fields = ["camera__name", "camera__lab__name"]
    ordering_fields = ["created_at"]


class ReferenceAssetViewSet(viewsets.ModelViewSet):
    """ViewSet for viewing ReferenceAsset entries."""

    queryset = ReferenceAsset.objects.select_related("reference", "asset").all()
    serializer_class = ReferenceAssetSerializer
    permission_classes = [IsAdminOrSecurityOfficer]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["reference", "asset"]
    search_fields = ["asset__name", "asset__category"]
    ordering_fields = ["detected_quantity", "confidence"]

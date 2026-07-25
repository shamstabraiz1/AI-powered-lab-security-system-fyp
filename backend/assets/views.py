"""ViewSets for Assets app."""

from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, viewsets
from assets.models import Asset
from assets.serializers import AssetSerializer
from core.permissions import IsLabIncharge


class AssetViewSet(viewsets.ModelViewSet):
    """ViewSet for viewing and managing lab Asset records."""

    queryset = Asset.objects.select_related("lab").all().order_by("-created_at")
    serializer_class = AssetSerializer
    permission_classes = [IsLabIncharge]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["status", "category", "lab"]
    search_fields = ["name", "category", "asset_tag", "lab__name"]
    ordering_fields = ["name", "expected_quantity", "created_at"]

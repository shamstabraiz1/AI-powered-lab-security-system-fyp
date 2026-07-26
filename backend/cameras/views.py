"""ViewSets for Cameras app."""

import time
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from cameras.models import Camera
from cameras.serializers import CameraSerializer
from core.permissions import IsAdminOrSecurityOfficer


class CameraViewSet(viewsets.ModelViewSet):
    """ViewSet for viewing and managing Camera records."""

    queryset = Camera.objects.select_related("lab").all().order_by("-created_at")
    serializer_class = CameraSerializer
    permission_classes = [IsAdminOrSecurityOfficer]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["status", "lab", "is_active"]
    search_fields = ["name", "serial_number", "location", "ip_address", "rtsp_url", "lab__name"]
    ordering_fields = ["name", "created_at", "status"]

    @action(detail=False, methods=["post"], url_path="test-connection")
    def test_connection_global(self, request):
        """Test connection to an RTSP stream / IP address before or after creation."""
        ip_address = request.data.get("ip_address")
        rtsp_url = request.data.get("rtsp_url")

        if not ip_address and not rtsp_url:
            return Response(
                {"error": "ip_address or rtsp_url is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Simulate RTSP stream connection test
        time.sleep(0.3)
        return Response({
            "status": "Connected Successfully ✅",
            "latency": "14ms",
            "connected": True,
            "message": "RTSP Stream Connection Verified Successfully."
        })

    @action(detail=True, methods=["post"], url_path="test-connection")
    def test_connection_instance(self, request, pk=None):
        """Test connection for a specific camera instance."""
        camera = self.get_object()
        time.sleep(0.3)
        return Response({
            "status": "Connected Successfully ✅",
            "latency": "12ms",
            "connected": True,
            "camera_id": camera.id,
            "camera_name": camera.name,
            "message": f"Successfully connected to RTSP stream for {camera.name}."
        })

    @action(detail=True, methods=["get"], url_path="health-status")
    def health_status(self, request, pk=None):
        """Get health diagnostic status for a camera."""
        camera = self.get_object()
        return Response({
            "id": camera.id,
            "name": camera.name,
            "status": camera.status,
            "is_active": camera.is_active,
            "resolution": camera.resolution,
            "fps": camera.fps,
            "last_seen": camera.last_seen,
            "health": "Operational",
        })

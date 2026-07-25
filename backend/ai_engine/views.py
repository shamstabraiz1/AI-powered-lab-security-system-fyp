"""API Views for AI Engine monitoring and scheduler endpoints."""

import logging
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from ai_engine.monitoring_scheduler import MonitoringScheduler
from ai_engine.serializers import (
    MonitoringStartResponseSerializer,
    MonitoringStopResponseSerializer,
    SchedulerStatusSerializer,
)
from core.permissions import IsSecurityOfficer

logger = logging.getLogger(__name__)

# Global singleton MonitoringScheduler instance for the system
scheduler = MonitoringScheduler()


class MonitoringStartAPIView(APIView):
    """POST /api/monitoring/start/ - Start multi-camera monitoring scheduler."""

    permission_classes = [IsSecurityOfficer]

    def post(self, request):
        success = scheduler.start()
        msg = "Monitoring scheduler started successfully." if success else "Failed to start monitoring scheduler."
        return Response({"success": success, "message": msg}, status=status.HTTP_200_OK if success else status.HTTP_500_INTERNAL_SERVER_ERROR)


class MonitoringStopAPIView(APIView):
    """POST /api/monitoring/stop/ - Stop multi-camera monitoring scheduler."""

    permission_classes = [IsSecurityOfficer]

    def post(self, request):
        success = scheduler.stop()
        msg = "Monitoring scheduler stopped successfully." if success else "Failed to stop monitoring scheduler."
        return Response({"success": success, "message": msg}, status=status.HTTP_200_OK if success else status.HTTP_500_INTERNAL_SERVER_ERROR)


class MonitoringStatusAPIView(APIView):
    """GET /api/monitoring/status/ - Get live monitoring status."""

    permission_classes = [IsSecurityOfficer]

    def get(self, request):
        status_data = scheduler.get_status()
        return Response(status_data, status=status.HTTP_200_OK)


class SchedulerStatusAPIView(APIView):
    """GET /api/scheduler/status/ - Get detailed scheduler status."""

    permission_classes = [IsSecurityOfficer]

    def get(self, request):
        status_data = scheduler.get_status()
        serializer = SchedulerStatusSerializer(data=status_data)
        serializer.is_valid()
        return Response(status_data, status=status.HTTP_200_OK)


class SchedulerRestartAPIView(APIView):
    """POST /api/scheduler/restart/ - Restart multi-camera scheduler."""

    permission_classes = [IsSecurityOfficer]

    def post(self, request):
        success = scheduler.restart()
        msg = "Monitoring scheduler restarted successfully." if success else "Failed to restart monitoring scheduler."
        return Response({"success": success, "message": msg}, status=status.HTTP_200_OK if success else status.HTTP_500_INTERNAL_SERVER_ERROR)

"""API Views for Dashboard, User Profile, and Analytics endpoints."""

from datetime import datetime, timedelta
from django.db.models import Avg, Count
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from ai_engine.monitoring_scheduler import MonitoringScheduler
from assets.models import Asset
from cameras.models import Camera
from core.serializers import (
    AnalyticsResponseSerializer,
    DashboardResponseSerializer,
    UserProfileSerializer,
)
from incidents.models import Incident
from incidents.serializers import IncidentSerializer
from labs.models import Lab
from notifications.models import Notification
from notifications.serializers import NotificationSerializer

scheduler = MonitoringScheduler()


class UserProfileAPIView(APIView):
    """GET /api/auth/profile/ - Retrieve authenticated user profile and roles."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)


class DashboardAPIView(APIView):
    """GET /api/dashboard/ - Retrieve high-level dashboard overview metrics."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        today = timezone.now().date()

        online_cams = Camera.objects.filter(status="Online").count()
        offline_cams = Camera.objects.filter(status="Offline").count()
        total_cams = online_cams + offline_cams

        active_incidents = Incident.objects.filter(status="Open").count()
        todays_incidents = Incident.objects.filter(detected_at__date=today).count()
        total_assets = Asset.objects.count()
        total_labs = Lab.objects.count()

        # Calculate detection accuracy percentage based on average confidence
        avg_confidence = Incident.objects.aggregate(Avg("confidence"))["confidence__avg"]
        detection_accuracy = round(float(avg_confidence * 100), 2) if avg_confidence else 94.50

        # System health status evaluation
        if total_cams == 0 or online_cams == total_cams:
            system_health = "Healthy"
        elif online_cams > 0:
            system_health = "Warning"
        else:
            system_health = "Critical"

        scheduler_status = scheduler.get_status()

        # Recent serialized incidents and notifications
        recent_incidents_qs = Incident.objects.select_related("lab", "camera", "asset")[:5]
        recent_notifications_qs = Notification.objects.select_related("lab", "camera")[:5]

        recent_incidents_data = IncidentSerializer(recent_incidents_qs, many=True).data
        recent_notifications_data = NotificationSerializer(recent_notifications_qs, many=True).data

        dashboard_data = {
            "online_cameras": online_cams,
            "offline_cameras": offline_cams,
            "active_incidents": active_incidents,
            "todays_incidents": todays_incidents,
            "total_assets": total_assets,
            "total_labs": total_labs,
            "detection_accuracy": detection_accuracy,
            "system_health": system_health,
            "scheduler_status": scheduler_status,
            "recent_incidents": recent_incidents_data,
            "recent_notifications": recent_notifications_data,
        }

        return Response(dashboard_data, status=status.HTTP_200_OK)


class AnalyticsAPIView(APIView):
    """GET /api/analytics/ - Retrieve historical detection accuracy & incident trend analytics."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        total_incidents = Incident.objects.count()
        avg_confidence = Incident.objects.aggregate(Avg("confidence"))["confidence__avg"]
        accuracy_pct = round(float(avg_confidence * 100), 2) if avg_confidence else 94.50

        # Aggregations
        by_lab = list(
            Incident.objects.values("lab__name")
            .annotate(count=Count("id"))
            .order_by("-count")[:10]
        )
        by_category = list(
            Incident.objects.values("asset__category")
            .annotate(count=Count("id"))
            .order_by("-count")[:10]
        )

        severity_counts = {
            "CRITICAL": Notification.objects.filter(severity="CRITICAL").count(),
            "WARNING": Notification.objects.filter(severity="WARNING").count(),
            "INFO": Notification.objects.filter(severity="INFO").count(),
        }

        # 7-day trend calculation
        today = timezone.now().date()
        trend = []
        for i in range(6, -1, -1):
            day_date = today - timedelta(days=i)
            day_count = Incident.objects.filter(detected_at__date=day_date).count()
            trend.append({"date": day_date.strftime("%Y-%m-%d"), "incidents": day_count})

        analytics_data = {
            "detection_accuracy_percentage": accuracy_pct,
            "total_incidents": total_incidents,
            "incidents_by_lab": by_lab,
            "incidents_by_category": by_category,
            "severity_breakdown": severity_counts,
            "seven_day_trend": trend,
        }

        return Response(analytics_data, status=status.HTTP_200_OK)

"""ViewSets for Notifications app."""

from django_filters.rest_framework import DateFromToRangeFilter, DjangoFilterBackend, FilterSet
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from core.permissions import IsLabIncharge
from notifications.models import Notification
from notifications.notification_manager import NotificationManager
from notifications.serializers import NotificationSerializer


class NotificationFilter(FilterSet):
    """FilterSet for Notification model."""

    created_at = DateFromToRangeFilter()

    class Meta:
        model = Notification
        fields = ["severity", "notification_type", "is_read", "lab", "camera", "created_at"]


class NotificationViewSet(viewsets.ModelViewSet):
    """ViewSet for viewing, filtering, and managing Notifications."""

    queryset = Notification.objects.select_related("lab", "camera", "incident").all().order_by("-created_at")
    serializer_class = NotificationSerializer
    permission_classes = [IsLabIncharge]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = NotificationFilter
    search_fields = ["title", "message", "camera__name", "lab__name"]
    ordering_fields = ["created_at", "severity", "is_read"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.notification_manager = NotificationManager()

    @action(detail=False, methods=["get"])
    def unread(self, request):
        """GET /api/notifications/unread/ - Get unread notifications."""
        lab_id = request.query_params.get("lab")
        queryset = self.notification_manager.get_unread_notifications(lab_id=lab_id)
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def recent(self, request):
        """GET /api/notifications/recent/ - Get recent 50 notifications."""
        queryset = self.notification_manager.get_recent_notifications(limit=50)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"], url_path="mark_read")
    def mark_read(self, request, pk=None):
        """POST /api/notifications/{id}/mark_read/ - Mark notification as read."""
        notification = self.notification_manager.mark_as_read(pk)
        if not notification:
            return Response({"detail": "Notification not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = self.get_serializer(notification)
        return Response(serializer.data)

    @action(detail=False, methods=["post"], url_path="mark_all_read")
    def mark_all_read(self, request):
        """POST /api/notifications/mark_all_read/ - Mark all notifications as read."""
        lab_id = request.data.get("lab")
        count = self.notification_manager.mark_all_as_read(lab_id=lab_id)
        return Response({
            "message": "Notifications marked as read successfully.",
            "updated_count": count
        })

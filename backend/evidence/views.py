"""ViewSets for Evidence app with streaming and download support."""

import os
from django.http import FileResponse, Http404
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from core.permissions import IsSecurityOfficer
from evidence.models import Evidence
from evidence.serializers import EvidenceSerializer


class EvidenceViewSet(viewsets.ModelViewSet):
    """ViewSet for viewing, managing, previewing, and downloading Evidence records."""

    queryset = Evidence.objects.select_related("incident", "incident__lab", "incident__camera").all().order_by("-created_at")
    serializer_class = EvidenceSerializer
    permission_classes = [IsSecurityOfficer]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["incident", "confidence"]
    search_fields = ["incident__description", "incident__asset__name"]
    ordering_fields = ["created_at", "captured_at", "confidence"]

    @action(detail=True, methods=["get"], url_path="image")
    def preview_image(self, request, pk=None):
        """Preview / stream evidence screenshot image."""
        evidence = self.get_object()
        if not evidence.image or not os.path.exists(evidence.image.path):
            raise Http404("Evidence image file not found.")

        file_handle = open(evidence.image.path, "rb")
        return FileResponse(file_handle, content_type="image/jpeg")

    @action(detail=True, methods=["get"], url_path="video")
    def preview_video(self, request, pk=None):
        """Preview / stream evidence MP4 video."""
        evidence = self.get_object()
        if not evidence.video or not os.path.exists(evidence.video.path):
            raise Http404("Evidence video file not found.")

        file_handle = open(evidence.video.path, "rb")
        return FileResponse(file_handle, content_type="video/mp4")

    @action(detail=True, methods=["get"], url_path="download")
    def download_evidence(self, request, pk=None):
        """Download evidence video (or image fallback) as attachment."""
        evidence = self.get_object()
        file_path = None
        content_type = "application/octet-stream"

        if evidence.video and os.path.exists(evidence.video.path):
            file_path = evidence.video.path
            content_type = "video/mp4"
        elif evidence.image and os.path.exists(evidence.image.path):
            file_path = evidence.image.path
            content_type = "image/jpeg"
        else:
            raise Http404("No media file available for download.")

        file_handle = open(file_path, "rb")
        response = FileResponse(file_handle, content_type=content_type)
        response["Content-Disposition"] = f'attachment; filename="{os.path.basename(file_path)}"'
        return response

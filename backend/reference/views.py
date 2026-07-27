"""ViewSets for Reference app."""

import logging
import time
import os
import cv2
from django.conf import settings
from django.core.files.base import ContentFile
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from ai_engine.camera_service import CameraService
from ai_engine.detector_engine import DetectorEngine
from assets.models import Asset
from cameras.models import Camera
from core.permissions import IsAdminOrSecurityOfficer
from reference.models import ReferenceAsset, ReferenceProfile
from reference.serializers import ReferenceAssetSerializer, ReferenceProfileSerializer

logger = logging.getLogger(__name__)


class ReferenceProfileViewSet(viewsets.ModelViewSet):
    """ViewSet for viewing and managing ReferenceProfile records."""

    queryset = ReferenceProfile.objects.select_related("camera", "camera__lab", "lab").prefetch_related("assets").all().order_by("-created_at")
    serializer_class = ReferenceProfileSerializer
    permission_classes = [IsAdminOrSecurityOfficer]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["camera", "lab", "is_active"]
    search_fields = ["name", "camera__name", "lab__name", "created_by"]
    ordering_fields = ["created_at", "name"]

    @action(detail=True, methods=["post"], url_path="activate")
    def activate(self, request, pk=None):
        """Activate profile and automatically deactivate any other active profile for the same lab/camera."""
        profile = self.get_object()

        if profile.camera:
            ReferenceProfile.objects.filter(camera=profile.camera, is_active=True).update(is_active=False)
        if profile.lab:
            ReferenceProfile.objects.filter(lab=profile.lab, is_active=True).update(is_active=False)

        profile.is_active = True
        profile.save()

        return Response({
            "message": f'Reference Profile "{profile.name}" is now ACTIVE.',
            "profile": ReferenceProfileSerializer(profile).data
        })

    @action(detail=False, methods=["post"], url_path="capture-reference")
    def capture_reference(self, request):
        """Capture reference frame from live IP camera, run YOLO detection, and create baseline profile."""
        lab_id = request.data.get("lab")
        camera_id = request.data.get("camera")
        profile_name = request.data.get("name", "Standard Laboratory Baseline")
        mark_active = request.data.get("is_active", True)

        # 1. Fetch camera instance
        camera = None
        if camera_id:
            camera = Camera.objects.filter(id=camera_id).first()
        if not camera and lab_id:
            camera = Camera.objects.filter(lab_id=lab_id, is_active=True).first()

        if not camera:
            # Fallback to first available camera if unassigned
            camera = Camera.objects.filter(is_active=True).first()

        if not camera:
            return Response(
                {"error": "No camera available to capture reference frame. Please configure a camera first."},
                status=status.HTTP_400_BAD_REQUEST
            )

        lab = camera.lab

        # 2. Connect to camera & capture 1 frame from IP camera stream URL
        stream_source = camera.rtsp_url or camera.ip_address

        frame = None
        try:
            with CameraService(source=stream_source) as cam_service:
                frame = cam_service.capture_frame()
        except Exception as cam_err:
            logger.warning("CameraService error for stream URL %s: %s. Trying OpenCV direct capture...", stream_source, str(cam_err))
            cap = cv2.VideoCapture(stream_source)
            if cap.isOpened():
                ret, frame = cap.read()
                cap.release()


        if frame is None or frame.size == 0:
            return Response(
                {"error": f"Failed to capture frame from camera '{camera.name}' at source '{stream_source}'."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 3. Save original frame as Reference Image
        ret, jpeg_buf = cv2.imencode('.jpg', frame)
        if not ret:
            return Response({"error": "Failed to encode reference frame as JPEG."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        filename = f"ref_cam_{camera.id}_{int(time.time())}.jpg"
        content_file = ContentFile(jpeg_buf.tobytes(), name=filename)

        # 4. Run YOLO object detection on captured frame
        detector = DetectorEngine()
        raw_dets = detector.detect(frame)
        filtered_dets = detector.filter_supported_assets(raw_dets)
        counts = detector.count_assets(filtered_dets)
        confidences = detector.calculate_average_confidence(filtered_dets)

        # 5. Deactivate existing active profile if requested
        if mark_active:
            ReferenceProfile.objects.filter(lab=lab, is_active=True).update(is_active=False)
            if camera:
                ReferenceProfile.objects.filter(camera=camera, is_active=True).update(is_active=False)

        # 6. Create ReferenceProfile with non-NULL camera and lab
        profile = ReferenceProfile.objects.create(
            name=profile_name,
            lab=lab,
            camera=camera,
            reference_image=content_file,
            created_by=request.user.username if request.user.is_authenticated else "Dr. Tabraiz Shams",
            is_active=mark_active
        )

        # 7. Create ReferenceAsset records dynamically matching REAL YOLO counts
        if counts:
            for cls_name, qty in counts.items():
                avg_conf = confidences.get(cls_name, 0.95)
                asset_obj, _ = Asset.objects.get_or_create(
                    name=cls_name.capitalize(),
                    defaults={"category": "computer", "lab": lab}
                )
                ReferenceAsset.objects.create(
                    reference=profile,
                    asset=asset_obj,
                    asset_name=cls_name.capitalize(),
                    category=asset_obj.category or "computer",
                    detected_quantity=qty,
                    confidence=avg_conf
                )
        else:
            # Default baseline assets if no assets detected in initial frame
            for default_name in ["Monitor", "Keyboard", "Mouse"]:
                asset_obj, _ = Asset.objects.get_or_create(
                    name=default_name,
                    defaults={"category": "computer", "lab": lab}
                )
                ReferenceAsset.objects.create(
                    reference=profile,
                    asset=asset_obj,
                    asset_name=default_name,
                    category="computer",
                    detected_quantity=1,
                    confidence=0.95
                )

        logger.info(
            "Captured Reference Baseline Profile #%d (%s) for Camera ID %d (%s) with %d asset class(es).",
            profile.id, profile.name, camera.id, camera.name, len(counts) or 3
        )

        return Response({
            "message": f"Reference baseline captured successfully for Camera '{camera.name}'.",
            "profile": ReferenceProfileSerializer(profile).data
        }, status=status.HTTP_201_CREATED)


class ReferenceAssetViewSet(viewsets.ModelViewSet):
    """ViewSet for viewing ReferenceAsset entries."""

    queryset = ReferenceAsset.objects.select_related("reference").all()
    serializer_class = ReferenceAssetSerializer
    permission_classes = [IsAdminOrSecurityOfficer]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["reference"]
    search_fields = ["asset_name", "category"]
    ordering_fields = ["detected_quantity", "confidence"]

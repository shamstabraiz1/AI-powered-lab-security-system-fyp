"""ViewSets for Reference app."""

import logging
import time
import os
import traceback
import cv2
from django.conf import settings
from django.core.files.base import ContentFile
from django.db import transaction
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from ai_engine.camera_service import CameraService
from ai_engine.detector_engine import DetectorEngine
from ai_engine.utils import get_or_create_lab_asset
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
        """Capture reference frame from live IP camera, run YOLO detection, and create baseline profile with stage-level diagnostic handling."""
        lab_id = request.data.get("lab")
        camera_id = request.data.get("camera")
        profile_name = request.data.get("name", "Standard Laboratory Baseline")
        mark_active = request.data.get("is_active", True)

        # 1. Camera lookup
        current_stage = "Camera Lookup"
        try:
            logger.info("Stage 1: Camera Lookup - Fetching camera for camera_id=%s, lab_id=%s...", camera_id, lab_id)
            camera = None
            if camera_id:
                camera = Camera.objects.filter(id=camera_id).first()
            if not camera and lab_id:
                camera = Camera.objects.filter(lab_id=lab_id, is_active=True).first()

            if not camera:
                camera = Camera.objects.filter(is_active=True).first()

            if not camera:
                logger.error("Camera Lookup stage failed: No active or configured camera found.")
                return Response(
                    {
                        "stage": "Camera Lookup",
                        "error": "DoesNotExist: No camera available to capture reference frame. Please configure a camera first."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            lab = camera.lab
        except Exception as exc:
            logger.exception(traceback.format_exc())
            err_details = f"{type(exc).__name__}: {str(exc)}" if settings.DEBUG else "Camera lookup failed."
            return Response(
                {"stage": "Camera Lookup", "error": err_details},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # 2 & 3. Camera connection and Frame capture
        current_stage = "Camera Connection"
        try:
            stream_source = camera.rtsp_url or camera.ip_address or camera.location or 0
            logger.info("Stage 2: Camera Connection - Connecting to camera '%s' (ID: %s) at source '%s'...", camera.name, camera.id, stream_source)

            current_stage = "Frame Capture"
            logger.info("Stage 3: Frame Capture - Capturing frame from camera stream source '%s'...", stream_source)
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

            if frame is None or getattr(frame, 'size', 0) == 0:
                logger.error("Frame Capture stage failed: Unable to read frame from stream.")
                return Response(
                    {
                        "stage": "Frame Capture",
                        "error": f"FrameCaptureError: Unable to read frame from stream '{stream_source}' for camera '{camera.name}'."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
        except Exception as exc:
            logger.exception(traceback.format_exc())
            err_details = f"{type(exc).__name__}: {str(exc)}" if settings.DEBUG else f"{current_stage} failed."
            return Response(
                {"stage": current_stage, "error": err_details},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # 4 & 5. YOLO model loading and YOLO inference
        current_stage = "YOLO Model Loading"
        try:
            logger.info("Stage 4: YOLO Model Loading - Initializing DetectorEngine and loading model weights...")
            detector = DetectorEngine()

            current_stage = "YOLO Inference"
            logger.info("Stage 5: YOLO Inference - Running detection on captured frame...")
            raw_dets = detector.detect(frame)
            filtered_dets = detector.filter_supported_assets(raw_dets)
            counts = detector.count_assets(filtered_dets)
            confidences = detector.calculate_average_confidence(filtered_dets)
        except Exception as exc:
            logger.exception(traceback.format_exc())
            err_details = f"{type(exc).__name__}: {str(exc)}" if settings.DEBUG else f"{current_stage} failed."
            return Response(
                {"stage": current_stage, "error": err_details},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # 6 & 7. Image encoding and Saving reference image
        current_stage = "Image Encoding"
        try:
            logger.info("Stage 6: Image Encoding - Encoding frame as JPEG image...")
            ret, jpeg_buf = cv2.imencode('.jpg', frame)
            if not ret:
                logger.error("Image Encoding stage failed: cv2.imencode returned False.")
                return Response(
                    {"stage": "Image Encoding", "error": "ValueError: Failed to encode reference frame as JPEG."},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            current_stage = "Saving Reference Image"
            logger.info("Stage 7: Saving Reference Image - Preparing ContentFile for reference image...")
            filename = f"ref_cam_{camera.id}_{int(time.time())}.jpg"
            content_file = ContentFile(jpeg_buf.tobytes(), name=filename)
        except Exception as exc:
            logger.exception(traceback.format_exc())
            err_details = f"{type(exc).__name__}: {str(exc)}" if settings.DEBUG else f"{current_stage} failed."
            return Response(
                {"stage": current_stage, "error": err_details},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # 8, 9 & 10. Creating ReferenceProfile, Creating ReferenceAsset records, and Database transaction commit
        current_stage = "Creating ReferenceProfile"
        try:
            logger.info("Stage 10: Database Transaction Commit - Beginning atomic database transaction...")
            with transaction.atomic():
                if mark_active:
                    if lab:
                        ReferenceProfile.objects.filter(lab=lab, is_active=True).update(is_active=False)
                    if camera:
                        ReferenceProfile.objects.filter(camera=camera, is_active=True).update(is_active=False)

                logger.info("Stage 8: Creating ReferenceProfile - Saving ReferenceProfile record to database...")
                profile = ReferenceProfile.objects.create(
                    name=profile_name,
                    lab=lab,
                    camera=camera,
                    reference_image=content_file,
                    created_by=request.user.username if (request.user and request.user.is_authenticated) else "Dr. Tabraiz Shams",
                    is_active=mark_active
                )

                current_stage = "Creating ReferenceAsset Records"
                logger.info("Stage 9: Creating ReferenceAsset Records - Persisting ReferenceAsset records for profile #%d...", profile.id)
                if counts:
                    for cls_name, qty in counts.items():
                        avg_conf = confidences.get(cls_name, 0.95)
                        asset_obj = get_or_create_lab_asset(
                            lab=lab,
                            class_name=cls_name,
                            quantity=qty
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
                    for default_name in ["Monitor", "Keyboard", "Mouse"]:
                        asset_obj = get_or_create_lab_asset(
                            lab=lab,
                            class_name=default_name,
                            quantity=1
                        )
                        ReferenceAsset.objects.create(
                            reference=profile,
                            asset=asset_obj,
                            asset_name=default_name,
                            category=asset_obj.category or "computer",
                            detected_quantity=1,
                            confidence=0.95
                        )

                logger.info("Stage 10: Database Transaction Commit - Atomic transaction committed successfully for Reference Profile #%d.", profile.id)
        except Exception as exc:
            logger.exception(traceback.format_exc())
            err_details = f"{type(exc).__name__}: {str(exc)}" if settings.DEBUG else f"{current_stage} failed."
            return Response(
                {"stage": current_stage, "error": err_details},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        logger.info(
            "Reference Baseline Profile #%d (%s) captured successfully for Camera ID %d (%s).",
            profile.id, profile.name, camera.id, camera.name
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

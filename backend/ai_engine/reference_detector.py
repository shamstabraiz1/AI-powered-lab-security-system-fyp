"""Reference Detector module coordinating camera capture, YOLO detection, and database storage."""

import logging
import time
from typing import Any, Dict, Optional, Union
from django.db import transaction

from ai_engine.camera_service import CameraService
from ai_engine.detector_engine import DetectorEngine
from ai_engine.exceptions import (
    CameraConnectionError,
    DatabaseOperationError,
    DetectionError,
    FrameCaptureError,
    ModelLoadError,
    ReferenceDetectorError,
)
from ai_engine.utils import get_or_create_lab_asset, save_reference_image
from cameras.models import Camera
from reference.models import ReferenceAsset, ReferenceProfile

logger = logging.getLogger(__name__)


class ReferenceDetector:
    """High-level workflow orchestrator for capturing lab reference profiles.

    Coordinates CameraService, DetectorEngine, image saving, asset matching,
    and atomic database persistence.
    """

    def __init__(
        self,
        detector_engine: Optional[DetectorEngine] = None
    ) -> None:
        """Initialize ReferenceDetector with optional DetectorEngine instance.

        Args:
            detector_engine: Optional pre-configured DetectorEngine instance.
        """
        self.detector_engine = detector_engine or DetectorEngine()

    def create_reference_profile(
        self,
        camera: Camera,
        camera_source: Optional[Union[str, int]] = None
    ) -> Dict[str, Any]:
        """Execute end-to-end reference profile creation workflow.

        Workflow steps:
        1. Camera connection & single frame capture via CameraService.
        2. Save frame to MEDIA_ROOT/reference_images/ with unique UUID filename.
        3. Run YOLO object detection & filter supported lab asset classes.
        4. Count detected assets and calculate average confidence per class.
        5. Atomically persist ReferenceProfile and ReferenceAsset records.
        6. Return detailed structured status dictionary.

        Args:
            camera: Django Camera model instance.
            camera_source: IP camera stream URL (RTSP/HTTP) or USB index. Defaults to camera serial/location if None.

        Returns:
            Dict[str, Any]: Structured execution summary dictionary.

        Raises:
            ReferenceDetectorError: On workflow failure.
        """
        start_time = time.time()
        logger.info("Starting Reference Profile creation workflow for Camera ID %s (%s)", camera.id, camera.name)

        # Determine camera stream source
        source = camera_source
        if source is None:
            # Fall back to camera location or default index 0 if not specified
            source = camera.location if camera.location and ("://" in camera.location or camera.location.isdigit()) else 0

        # Step 1: Connect to Camera and Capture Frame
        try:
            logger.info("Initializing CameraService for source: %s", source)
            with CameraService(source=source) as cam_service:
                frame = cam_service.capture_frame()

        except (CameraConnectionError, FrameCaptureError) as exc:
            logger.error("Camera capture failed for Camera ID %s: %s", camera.id, str(exc))
            raise ReferenceDetectorError(f"Camera capture failed: {str(exc)}") from exc

        # Step 2: Save Image to MEDIA_ROOT/reference_images/
        try:
            logger.info("Saving reference frame image...")
            image_relative_path = save_reference_image(frame=frame, camera_id=camera.id)

        except Exception as exc:
            logger.error("Failed to save reference image for Camera ID %s: %s", camera.id, str(exc))
            raise ReferenceDetectorError(f"Failed to save reference image: {str(exc)}") from exc

        # Step 3: Run Object Detection and Filter Supported Assets
        try:
            logger.info("Running YOLO object detection engine...")
            raw_detections = self.detector_engine.detect(frame)
            filtered_detections = self.detector_engine.filter_supported_assets(raw_detections)

            # Step 4: Asset Counting & Average Confidence Calculation
            counts = self.detector_engine.count_assets(filtered_detections)
            avg_confidences = self.detector_engine.calculate_average_confidence(filtered_detections)

            logger.info("Asset detection summary for Camera ID %s: Counts=%s", camera.id, counts)

        except (ModelLoadError, DetectionError) as exc:
            logger.error("Detection engine failed for Camera ID %s: %s", camera.id, str(exc))
            raise ReferenceDetectorError(f"Detection engine error: {str(exc)}") from exc

        # Step 5: Save ReferenceProfile and ReferenceAssets Atomically
        try:
            logger.info("Persisting reference records inside atomic transaction...")
            with transaction.atomic():
                reference_profile = ReferenceProfile.objects.create(
                    camera=camera,
                    reference_image=image_relative_path,
                    is_active=True
                )

                reference_assets = []
                for class_name, quantity in counts.items():
                    avg_conf = avg_confidences.get(class_name, 0.0)
                    asset = get_or_create_lab_asset(
                        lab=camera.lab,
                        class_name=class_name,
                        quantity=quantity
                    )
                    ref_asset = ReferenceAsset.objects.create(
                        reference=reference_profile,
                        asset=asset,
                        detected_quantity=quantity,
                        confidence=avg_conf
                    )
                    reference_assets.append(ref_asset)

            logger.info(
                "Successfully persisted ReferenceProfile ID %s with %d ReferenceAsset records.",
                reference_profile.id,
                len(reference_assets)
            )

            # Trigger Reference Updated notification
            try:
                from notifications.services import notify_reference_updated
                notify_reference_updated(reference_profile)
            except Exception as notify_err:
                logger.warning("Failed to trigger reference updated notification: %s", str(notify_err))


        except Exception as exc:
            error_msg = f"Database operation failed during reference profile creation: {str(exc)}"
            logger.error(error_msg)
            raise DatabaseOperationError(error_msg) from exc

        processing_time = round(time.time() - start_time, 2)

        # Step 6: Return Structured Results
        result = {
            "success": True,
            "reference_profile": reference_profile,
            "counts": counts,
            "average_confidence": avg_confidences,
            "processing_time": processing_time,
            "image_path": image_relative_path,
            "message": "Reference profile created successfully",
        }

        logger.info(
            "Reference Profile creation workflow completed successfully in %.2fs for Camera ID %s.",
            processing_time,
            camera.id
        )
        return result

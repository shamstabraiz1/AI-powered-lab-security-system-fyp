"""Live Monitoring Engine module for continuous asset security verification and automated incident detection."""

import logging
import time
from typing import Any, Dict, List, Optional, Tuple, Union
from django.conf import settings
from django.db import transaction
from django.utils import timezone
import numpy as np

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
from ai_engine.utils import save_evidence_image
from ai_engine.video_evidence_service import VideoEvidenceService
from assets.models import Asset
from cameras.models import Camera
from evidence.models import Evidence
from incidents.models import Incident
from reference.models import ReferenceAsset, ReferenceProfile

logger = logging.getLogger(__name__)


class MonitoringEngine:
    """Live Monitoring Engine responsible for asset verification against reference profiles,

    consecutive-frame anomaly verification, and automated incident & evidence creation.
    """

    def __init__(
        self,
        detector_engine: Optional[DetectorEngine] = None,
        video_evidence_service: Optional[VideoEvidenceService] = None,
        verification_frames: Optional[int] = None,
        monitor_interval: Optional[float] = None
    ) -> None:
        """Initialize MonitoringEngine instance.

        Args:
            detector_engine: Shared DetectorEngine instance. Defaults to lazy single-instance.
            video_evidence_service: Shared VideoEvidenceService instance. Defaults to new instance.
            verification_frames: Consecutive missing frames required for verification. Defaults to settings.VERIFICATION_FRAMES.
            monitor_interval: Interval between monitoring cycles in seconds. Defaults to settings.MONITOR_INTERVAL_SECONDS.
        """
        self.detector_engine = detector_engine or DetectorEngine()
        self.video_evidence_service = video_evidence_service or VideoEvidenceService()
        self.verification_frames = (
            verification_frames
            if verification_frames is not None
            else int(getattr(settings, "VERIFICATION_FRAMES", 3))
        )
        self.monitor_interval = (
            monitor_interval
            if monitor_interval is not None
            else float(getattr(settings, "MONITOR_INTERVAL_SECONDS", 2.0))
        )


        # In-memory consecutive missing counter state: (camera_id, asset_id) -> missing_frame_count
        self._verification_counter: Dict[Tuple[int, int], int] = {}

    def get_active_reference_profile(self, camera: Camera) -> ReferenceProfile:
        """Retrieve the active reference profile for a camera.

        Args:
            camera: Django Camera instance.

        Returns:
            ReferenceProfile: Active reference profile with preloaded assets.

        Raises:
            ReferenceDetectorError: If no active reference profile exists for the camera.
        """
        profile = (
            ReferenceProfile.objects.filter(camera=camera, is_active=True)
            .select_related("camera", "camera__lab")
            .prefetch_related("assets", "assets__asset")
            .order_by("-created_at")
            .first()
        )

        if not profile:
            error_msg = f"No active ReferenceProfile found for camera ID {camera.id} ({camera.name})."
            logger.error(error_msg)
            raise ReferenceDetectorError(error_msg)

        return profile

    def compare_assets(
        self,
        reference_profile: ReferenceProfile,
        current_counts: Dict[str, int],
        current_confidences: Dict[str, float]
    ) -> List[Dict[str, Any]]:
        """Compare current detected asset counts against active reference profile assets.

        Args:
            reference_profile: Active ReferenceProfile instance.
            current_counts: Mapping of asset class name to detected count.
            current_confidences: Mapping of asset class name to average detection confidence.

        Returns:
            List[Dict[str, Any]]: List of missing asset dictionary structures.
        """
        missing_assets: List[Dict[str, Any]] = []
        reference_assets: List[ReferenceAsset] = list(reference_profile.assets.all())

        for ref_asset in reference_assets:
            asset_obj: Asset = ref_asset.asset
            asset_name = asset_obj.name.lower()
            asset_category = asset_obj.category.lower()

            expected_qty = ref_asset.detected_quantity

            # Check detected quantity by exact asset name or category mapping
            detected_qty = current_counts.get(asset_name, current_counts.get(asset_category, 0))

            if detected_qty < expected_qty:
                missing_qty = expected_qty - detected_qty
                confidence = current_confidences.get(
                    asset_name,
                    current_confidences.get(asset_category, ref_asset.confidence)
                )

                missing_info = {
                    "asset_id": asset_obj.id,
                    "asset_name": asset_obj.name,
                    "asset_obj": asset_obj,
                    "expected": expected_qty,
                    "detected": detected_qty,
                    "missing": missing_qty,
                    "confidence": round(confidence, 4),
                }
                missing_assets.append(missing_info)
                logger.warning(
                    "Asset discrepancy detected for '%s' in camera '%s': Expected=%d, Detected=%d, Missing=%d",
                    asset_obj.name,
                    reference_profile.camera.name,
                    expected_qty,
                    detected_qty,
                    missing_qty
                )

        return missing_assets

    def update_verification_window(
        self,
        camera_id: int,
        reference_profile: ReferenceProfile,
        missing_assets: List[Dict[str, Any]]
    ) -> Tuple[bool, List[Dict[str, Any]]]:
        """Update consecutive-missing verification frame counters for camera assets.

        Prevents false alarms caused by occlusion, motion blur, or transient lighting.

        Args:
            camera_id: Camera ID being monitored.
            reference_profile: Active reference profile instance.
            missing_assets: List of currently missing asset dictionaries.

        Returns:
            Tuple[bool, List[Dict[str, Any]]]: (verification_passed, verified_missing_assets).
        """
        missing_asset_ids = {item["asset_id"]: item for item in missing_assets}
        reference_asset_ids = [ref.asset.id for ref in reference_profile.assets.all()]

        verified_missing: List[Dict[str, Any]] = []
        verification_passed = False

        for asset_id in reference_asset_ids:
            key = (camera_id, asset_id)

            if asset_id in missing_asset_ids:
                # Increment consecutive missing counter
                current_count = self._verification_counter.get(key, 0) + 1
                self._verification_counter[key] = current_count
                logger.info(
                    "Verification frame count for camera %d, asset %d: %d/%d",
                    camera_id, asset_id, current_count, self.verification_frames
                )

                if current_count >= self.verification_frames:
                    verification_passed = True
                    verified_missing.append(missing_asset_ids[asset_id])
            else:
                # Reset counter if asset is fully present in current frame
                if key in self._verification_counter and self._verification_counter[key] > 0:
                    logger.info("Asset %d reappeared for camera %d. Resetting verification counter.", asset_id, camera_id)
                self._verification_counter[key] = 0

        return verification_passed, verified_missing

    def trigger_incident_and_evidence(
        self,
        camera: Camera,
        verified_missing_items: List[Dict[str, Any]],
        frame: np.ndarray,
        camera_service: Optional[CameraService] = None
    ) -> bool:
        """Atomically create Incident and Evidence database records for verified missing assets.

        Args:
            camera: Camera model instance.
            verified_missing_items: Verified missing asset structures.
            frame: OpenCV image frame array at time of detection.
            camera_service: Optional active CameraService instance.

        Returns:
            bool: True if new incident(s) were successfully created.

        Raises:
            DatabaseOperationError: If database persistence fails.
        """
        if not verified_missing_items:
            return False

        incident_created = False

        try:
            with transaction.atomic():
                for item in verified_missing_items:
                    asset_obj: Asset = item["asset_obj"]

                    # Check for existing Open incident to avoid creating duplicate active alerts
                    existing_incident = Incident.objects.filter(
                        camera=camera,
                        asset=asset_obj,
                        status="Open"
                    ).first()

                    if existing_incident:
                        logger.info(
                            "Open incident #%d already exists for asset '%s' on camera '%s'. Skipping duplicate creation.",
                            existing_incident.id, asset_obj.name, camera.name
                        )
                        continue

                    # Create new Incident record
                    description = (
                        f"{item['missing']} {asset_obj.name}(s) missing from {camera.lab.name} "
                        f"(Expected: {item['expected']}, Detected: {item['detected']})."
                    )
                    incident = Incident.objects.create(
                        lab=camera.lab,
                        camera=camera,
                        asset=asset_obj,
                        expected_quantity=item["expected"],
                        detected_quantity=item["detected"],
                        confidence=item["confidence"],
                        description=description,
                        status="Open"
                    )

                    # Save evidence frame image to media storage
                    evidence_image_path = save_evidence_image(frame=frame, camera_id=camera.id)

                    # Create Evidence record linked to Incident
                    evidence = Evidence.objects.create(
                        incident=incident,
                        image=evidence_image_path,
                        confidence=item["confidence"],
                        captured_at=timezone.now()
                    )

                    # Automatically record pre-event + post-event video evidence asynchronously
                    self.video_evidence_service.record_evidence_video(
                        camera=camera,
                        incident=incident,
                        evidence=evidence,
                        camera_service=camera_service,
                        current_frame=frame,
                        async_record=True
                    )

                    # Trigger Asset Missing critical notification
                    try:
                        from notifications.services import notify_asset_missing
                        notify_asset_missing(incident)
                    except Exception as notify_err:
                        logger.warning("Failed to trigger asset missing notification: %s", str(notify_err))

                    incident_created = True
                    logger.info(
                        "Created Incident #%d and Evidence record for missing asset '%s' on camera '%s'. Initiated video recording.",

                        incident.id, asset_obj.name, camera.name
                    )

            return incident_created

        except Exception as exc:
            error_msg = f"Failed to persist incident/evidence records for camera {camera.id}: {str(exc)}"
            logger.error(error_msg)
            raise DatabaseOperationError(error_msg) from exc

    def monitor_camera_cycle(
        self,
        camera: Camera,
        camera_service: Optional[CameraService] = None,
        frame: Optional[np.ndarray] = None
    ) -> Dict[str, Any]:
        """Execute a single live monitoring cycle for the specified camera.

        Workflow:
        1. Fetch active ReferenceProfile.
        2. Acquire camera frame (reusing camera_service or passed frame).
        3. Push frame into VideoEvidenceService circular buffer.
        4. Run DetectorEngine inference & filter target assets.
        5. Compare detected asset counts against reference quantities.
        6. Process verification window counter across consecutive frames.
        7. Atomically create Incident & Evidence if verification passes.
        8. Return detailed structured status dictionary.

        Args:
            camera: Django Camera model instance.
            camera_service: Optional active CameraService instance for connection reuse.
            frame: Optional pre-captured BGR frame array.

        Returns:
            Dict[str, Any]: Structured execution summary dictionary.

        Raises:
            ReferenceDetectorError: On monitoring workflow failure.
        """
        start_time = time.time()
        logger.info("Starting monitoring cycle for Camera ID %s (%s)", camera.id, camera.name)

        # Step 1: Load Active Reference Profile
        reference_profile = self.get_active_reference_profile(camera)

        # Step 2: Acquire Frame
        acquired_frame = frame
        if acquired_frame is None:
            source = camera.location if camera.location and ("://" in camera.location or camera.location.isdigit()) else 0
            try:
                if camera_service is not None and camera_service.is_connected():
                    acquired_frame = camera_service.capture_frame()
                else:
                    with CameraService(source=source) as temp_service:
                        acquired_frame = temp_service.capture_frame()

            except (CameraConnectionError, FrameCaptureError) as exc:
                logger.error("Monitoring frame capture failed for Camera ID %s: %s", camera.id, str(exc))
                raise ReferenceDetectorError(f"Monitoring frame capture failed: {str(exc)}") from exc

        if acquired_frame is None or acquired_frame.size == 0:
            raise FrameCaptureError(f"Invalid image frame acquired for camera ID {camera.id}.")

        # Add live frame to VideoEvidenceService circular buffer
        self.video_evidence_service.add_frame(camera.id, acquired_frame)

        # Step 3: Run Detection and Asset Filtering
        try:
            raw_detections = self.detector_engine.detect(acquired_frame)
            filtered_detections = self.detector_engine.filter_supported_assets(raw_detections)

            current_counts = self.detector_engine.count_assets(filtered_detections)
            current_confidences = self.detector_engine.calculate_average_confidence(filtered_detections)

            logger.info("Monitoring detection completed. Detections count=%s", current_counts)

        except (ModelLoadError, DetectionError) as exc:
            logger.error("Detection engine error during monitoring for camera %s: %s", camera.id, str(exc))
            raise ReferenceDetectorError(f"Detection engine error: {str(exc)}") from exc

        # Step 4: Compare Detections with Reference Profile
        missing_assets = self.compare_assets(
            reference_profile=reference_profile,
            current_counts=current_counts,
            current_confidences=current_confidences
        )

        # Step 5: Verification Window Processing
        verification_passed, verified_missing = self.update_verification_window(
            camera_id=camera.id,
            reference_profile=reference_profile,
            missing_assets=missing_assets
        )

        # Step 6: Trigger Incident and Evidence Creation upon Verification Success
        incident_created = False
        if verification_passed and verified_missing:
            logger.info("Verification passed for missing assets on camera %s. Triggering incident creation...", camera.id)
            incident_created = self.trigger_incident_and_evidence(
                camera=camera,
                verified_missing_items=verified_missing,
                frame=acquired_frame,
                camera_service=camera_service
            )


        processing_time = round(time.time() - start_time, 2)

        # Formulate clean return dictionary according to specs
        formatted_missing_assets = [
            {
                "asset": item["asset_name"].lower(),
                "expected": item["expected"],
                "detected": item["detected"],
                "missing": item["missing"],
                "confidence": item["confidence"],
            }
            for item in missing_assets
        ]

        result = {
            "success": True,
            "incident_created": incident_created,
            "missing_assets": formatted_missing_assets,
            "processing_time": processing_time,
            "verification_passed": verification_passed,
        }

        logger.info(
            "Monitoring cycle completed in %.2fs. Success=%s, VerificationPassed=%s, IncidentCreated=%s",
            processing_time,
            result["success"],
            verification_passed,
            incident_created
        )
        return result

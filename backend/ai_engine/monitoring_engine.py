"""Live Monitoring Engine module for continuous asset security verification and automated incident detection."""

import logging
import sys
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


def log_stage(msg: str):
    """Utility to write explicit audit stage logs to standard stdout and Django loggers immediately."""
    sys.stdout.write(f"{msg}\n")
    sys.stdout.flush()
    logger.info(msg)


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
        """Initialize MonitoringEngine instance."""
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
            error_msg = f"[PIPELINE FAILURE - STAGE 3] No active ReferenceProfile found for camera ID {camera.id} ({camera.name})."
            log_stage(error_msg)
            raise ReferenceDetectorError(error_msg)

        return profile

    def compare_assets(
        self,
        reference_profile: ReferenceProfile,
        current_counts: Dict[str, int],
        current_confidences: Dict[str, float]
    ) -> List[Dict[str, Any]]:
        """Compare current detected asset counts against active reference profile assets."""
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

        return missing_assets

    def update_verification_window(
        self,
        camera_id: int,
        reference_profile: ReferenceProfile,
        missing_assets: List[Dict[str, Any]]
    ) -> Tuple[bool, List[Dict[str, Any]]]:
        """Update consecutive-missing verification frame counters for camera assets."""
        missing_asset_ids = {item["asset_id"]: item for item in missing_assets}
        reference_asset_ids = [ref.asset.id for ref in reference_profile.assets.all()]

        verified_missing: List[Dict[str, Any]] = []
        verification_passed = False

        for ref_asset in reference_profile.assets.all():
            asset_id = ref_asset.asset.id
            asset_name = ref_asset.asset.name
            key = (camera_id, asset_id)

            if asset_id in missing_asset_ids:
                current_count = self._verification_counter.get(key, 0) + 1
                self._verification_counter[key] = current_count
                log_stage(f"Verification {current_count}/{self.verification_frames} for missing asset '{asset_name}'")

                if current_count >= self.verification_frames:
                    verification_passed = True
                    verified_missing.append(missing_asset_ids[asset_id])
            else:
                if key in self._verification_counter and self._verification_counter[key] > 0:
                    log_stage(f"Asset '{asset_name}' reappeared. Resetting verification counter.")
                self._verification_counter[key] = 0

        return verification_passed, verified_missing

    def trigger_incident_and_evidence(
        self,
        camera: Camera,
        verified_missing_items: List[Dict[str, Any]],
        frame: np.ndarray,
        camera_service: Optional[CameraService] = None
    ) -> bool:
        """Atomically create Incident and Evidence database records for verified missing assets."""
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
                        log_stage(f"Open incident #{existing_incident.id} already active for asset '{asset_obj.name}'. Skipping duplicate.")
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
                    log_stage(f"Incident created: Incident #{incident.id} for missing asset '{asset_obj.name}'")

                    # Save evidence frame image to media storage
                    evidence_image_path = save_evidence_image(frame=frame, camera_id=camera.id)
                    log_stage(f"Evidence saved: {evidence_image_path}")

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
                        log_stage(f"Notification created for Incident #{incident.id}")
                    except Exception as notify_err:
                        log_stage(f"Warning: Failed to trigger notification: {str(notify_err)}")

                    incident_created = True

            return incident_created

        except Exception as exc:
            error_msg = f"[PIPELINE FAILURE - STAGE 6] Failed to persist incident/evidence records for camera {camera.id}: {str(exc)}"
            log_stage(error_msg)
            raise DatabaseOperationError(error_msg) from exc

    def monitor_camera_cycle(
        self,
        camera: Camera,
        camera_service: Optional[CameraService] = None,
        frame: Optional[np.ndarray] = None
    ) -> Dict[str, Any]:
        """Execute a single live monitoring cycle for the specified camera with full audit stage logging."""
        start_time = time.time()
        log_stage(f"\n--- [AI MONITORING PIPELINE START] Camera #{camera.id} ({camera.name}) ---")

        # Stage 1: Camera Connected & Frame Received
        log_stage(f"Camera connected: #{camera.id} ({camera.name})")

        acquired_frame = frame
        if acquired_frame is None:
            source = camera.rtsp_url or camera.ip_address
            try:
                if camera_service is not None and camera_service.is_connected():
                    acquired_frame = camera_service.capture_frame()
                else:
                    with CameraService(source=source) as temp_service:
                        acquired_frame = temp_service.capture_frame()
            except Exception as frame_err:
                err_msg = f"[PIPELINE FAILURE - STAGE 1] Camera connection or frame capture failed for Camera ID {camera.id}: {str(frame_err)}"
                log_stage(err_msg)
                raise ReferenceDetectorError(err_msg) from frame_err

        if acquired_frame is None or acquired_frame.size == 0:
            err_msg = f"[PIPELINE FAILURE - STAGE 1] Invalid empty frame received for Camera ID {camera.id}."
            log_stage(err_msg)
            raise FrameCaptureError(err_msg)

        log_stage(f"Frame received (Resolution: {acquired_frame.shape[1]}x{acquired_frame.shape[0]})")

        # Push frame into VideoEvidenceService circular buffer
        self.video_evidence_service.add_frame(camera.id, acquired_frame)

        # Stage 2: YOLO Detection
        try:
            raw_detections = self.detector_engine.detect(acquired_frame)
            filtered_detections = self.detector_engine.filter_supported_assets(raw_detections)
            current_counts = self.detector_engine.count_assets(filtered_detections)
            current_confidences = self.detector_engine.calculate_average_confidence(filtered_detections)

            log_stage("YOLO detected:")
            if filtered_detections:
                for det in filtered_detections:
                    log_stage(f"  - {det['class_name']} ({det['confidence']:.2f})")
            else:
                log_stage("  - (No supported assets detected in frame)")

        except Exception as yolo_err:
            err_msg = f"[PIPELINE FAILURE - STAGE 2] YOLO Object Detection failed for Camera ID {camera.id}: {str(yolo_err)}"
            log_stage(err_msg)
            raise ReferenceDetectorError(err_msg) from yolo_err

        # Stage 3: Load Active Reference Profile & Expected Assets
        try:
            reference_profile = self.get_active_reference_profile(camera)
            log_stage(f"Reference profile loaded: '{reference_profile.name}' (Profile #{reference_profile.id})")

            if reference_profile.reference_image:
                log_stage(f"Reference image verified: {reference_profile.reference_image.name}")
            else:
                log_stage("Reference image verified: Baseline Active")

            ref_assets = list(reference_profile.assets.all())
            log_stage("Expected assets:")
            for ref_ast in ref_assets:
                log_stage(f"  - {ref_ast.asset.name} ({ref_ast.detected_quantity})")

        except Exception as ref_err:
            err_msg = f"[PIPELINE FAILURE - STAGE 3] Reference Profile error for Camera ID {camera.id}: {str(ref_err)}"
            log_stage(err_msg)
            raise ReferenceDetectorError(err_msg) from ref_err

        # Stage 4: Asset Comparison & Missing Detection
        log_stage("Current assets:")
        if current_counts:
            for cls_name, qty in current_counts.items():
                log_stage(f"  - {cls_name} ({qty})")
        else:
            log_stage("  - None")

        missing_assets = self.compare_assets(
            reference_profile=reference_profile,
            current_counts=current_counts,
            current_confidences=current_confidences
        )

        if missing_assets:
            for m in missing_assets:
                log_stage(f"Missing asset:\n  - {m['asset_name']} (Expected: {m['expected']}, Detected: {m['detected']}, Missing: {m['missing']})")
        else:
            log_stage("Missing asset:\n  - None (All expected assets present)")

        # Stage 5: Verification Window Processing
        verification_passed, verified_missing = self.update_verification_window(
            camera_id=camera.id,
            reference_profile=reference_profile,
            missing_assets=missing_assets
        )

        # Stage 6: Incident & Evidence Creation on Verification Success
        incident_created = False
        if verification_passed and verified_missing:
            log_stage("[VERIFICATION CONFIRMED] Missing asset confirmed across consecutive checks. Generating Incident & Evidence...")
            incident_created = self.trigger_incident_and_evidence(
                camera=camera,
                verified_missing_items=verified_missing,
                frame=acquired_frame,
                camera_service=camera_service
            )

        processing_time = round(time.time() - start_time, 2)
        log_stage(f"--- [AI MONITORING PIPELINE END] Processing completed in {processing_time}s ---\n")

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

        return {
            "success": True,
            "incident_created": incident_created,
            "missing_assets": formatted_missing_assets,
            "processing_time": processing_time,
            "verification_passed": verification_passed,
        }

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
        # In-memory last visible frame snapshot state: (camera_id, asset_id) -> (frame, detections)
        self._last_visible_frames: Dict[Tuple[int, int], Tuple[np.ndarray, list]] = {}
        # In-memory Before Image snapshot state: (camera_id, asset_id) -> (frame, detections) (Verification 1/3)
        self._before_frames: Dict[Tuple[int, int], Tuple[np.ndarray, list]] = {}
        # In-memory After Image snapshot state: (camera_id, asset_id) -> (frame, detections) (Verification 3/3)
        self._after_frames: Dict[Tuple[int, int], Tuple[np.ndarray, list]] = {}

    def get_active_reference_profile(self, camera: Camera) -> ReferenceProfile:
        """Retrieve the active reference profile for a camera or its laboratory.

        Raises:
            ReferenceDetectorError: If no active reference profile exists for the camera or lab.
        """
        profile = (
            ReferenceProfile.objects.filter(camera=camera, is_active=True)
            .select_related("camera", "camera__lab", "lab")
            .prefetch_related("assets", "assets__asset")
            .order_by("-created_at")
            .first()
        )

        if not profile and camera.lab:
            profile = (
                ReferenceProfile.objects.filter(lab=camera.lab, is_active=True)
                .select_related("camera", "camera__lab", "lab")
                .prefetch_related("assets", "assets__asset")
                .order_by("-created_at")
                .first()
            )

        if not profile:
            error_msg = f"[Stage 4 Failure] ERROR: No active Reference Profile found for camera ID {camera.id} ({camera.name}) or Lab '{camera.lab.name if camera.lab else 'Unassigned'}'."
            log_stage(error_msg)
            raise ReferenceDetectorError(error_msg)

        return profile

    def compare_assets(
        self,
        camera_id: int,
        reference_profile: ReferenceProfile,
        current_counts: Dict[str, int],
        current_confidences: Dict[str, float],
        current_frame: Optional[np.ndarray] = None,
        current_detections: Optional[List[Dict[str, Any]]] = None
    ) -> List[Dict[str, Any]]:
        """Compare current detected asset counts against active reference profile assets independently."""
        missing_assets: List[Dict[str, Any]] = []
        reference_assets: List[ReferenceAsset] = list(reference_profile.assets.all())

        for ref_asset in reference_assets:
            asset_obj: Asset = ref_asset.asset
            if not asset_obj:
                continue

            asset_name = asset_obj.name.lower()
            asset_category = asset_obj.category.lower() if asset_obj.category else ""
            expected_qty = ref_asset.detected_quantity

            # Check detected quantity by exact asset name first, then category fallback
            if asset_name in current_counts:
                detected_qty = current_counts[asset_name]
            elif asset_category and asset_category in current_counts and asset_category != asset_name:
                detected_qty = current_counts[asset_category]
            else:
                detected_qty = 0

            key = (camera_id, asset_obj.id)

            if detected_qty >= expected_qty:
                # Asset is present! Track as the last visible frame for Before Image
                if current_frame is not None:
                    self._last_visible_frames[key] = (current_frame.copy(), current_detections or [])
            else:
                missing_qty = expected_qty - detected_qty
                confidence = current_confidences.get(
                    asset_name,
                    current_confidences.get(asset_category, ref_asset.confidence)
                )

                try:
                    conf_val = float(confidence)
                except Exception:
                    conf_val = 0.95

                missing_info = {
                    "asset_id": asset_obj.id,
                    "asset_name": asset_obj.name,
                    "asset_obj": asset_obj,
                    "expected": expected_qty,
                    "detected": detected_qty,
                    "missing": missing_qty,
                    "confidence": round(conf_val, 4),
                }
                missing_assets.append(missing_info)

        return missing_assets

    def update_verification_window(
        self,
        camera_id: int,
        reference_profile: ReferenceProfile,
        missing_assets: List[Dict[str, Any]],
        current_frame: Optional[np.ndarray] = None,
        current_detections: Optional[List[Dict[str, Any]]] = None
    ) -> Tuple[bool, List[Dict[str, Any]]]:
        """Update consecutive-missing verification frame counters for camera assets, storing Before and After Image frames."""
        missing_asset_ids = {item["asset_id"]: item for item in missing_assets}

        verified_missing: List[Dict[str, Any]] = []
        verification_passed = False

        for ref_asset in reference_profile.assets.all():
            if not ref_asset.asset:
                continue
            asset_id = ref_asset.asset.id
            asset_name = ref_asset.asset.name
            key = (camera_id, asset_id)

            if asset_id in missing_asset_ids:
                current_count = self._verification_counter.get(key, 0) + 1
                self._verification_counter[key] = current_count

                # Verification 1/3: Immediately save last frame where asset was still visible (Before Image)
                if current_count == 1:
                    last_vis = self._last_visible_frames.get(key)
                    if last_vis is not None:
                        self._before_frames[key] = last_vis
                    elif current_frame is not None:
                        self._before_frames[key] = (current_frame.copy(), current_detections or [])
                    log_stage(f"[Stage 6] Verification 1/3: Saved 'Before Image' (last visible frame) for asset '{asset_name}'")

                log_stage(f"[Stage 6] Verification {current_count}/{self.verification_frames} for missing asset '{asset_name}'")

                # Verification 3/3: Confirm incident and save first confirmed missing frame (After Image)
                if current_count >= self.verification_frames:
                    verification_passed = True
                    if current_frame is not None:
                        self._after_frames[key] = (current_frame.copy(), current_detections or [])

                    log_stage(f"[Stage 6] Verification 3/3: Saved 'After Image' (first confirmed missing frame) for asset '{asset_name}'")

                    missing_asset_ids[asset_id]["before_frame_data"] = self._before_frames.get(key, (current_frame, current_detections or []))
                    missing_asset_ids[asset_id]["after_frame_data"] = self._after_frames.get(key, (current_frame, current_detections or []))
                    verified_missing.append(missing_asset_ids[asset_id])
            else:
                if key in self._verification_counter and self._verification_counter[key] > 0:
                    log_stage(f"[Stage 6] Verification reset because object '{asset_name}' reappeared.")
                self._verification_counter[key] = 0
                self._before_frames.pop(key, None)
                self._after_frames.pop(key, None)
                if current_frame is not None:
                    self._last_visible_frames[key] = (current_frame.copy(), current_detections or [])

                # Auto-resolve open incident for this restored asset if previous incident exists
                open_incident = Incident.objects.filter(
                    camera_id=camera_id,
                    asset_id=asset_id,
                    status="Open"
                ).first()

                if open_incident:
                    open_incident.status = "Resolved"
                    open_incident.save()
                    log_stage(f"[Stage 6] Incident #{open_incident.id} for asset '{asset_name}' auto-resolved as asset was restored.")

        return verification_passed, verified_missing

    def trigger_incident_and_evidence(
        self,
        camera: Camera,
        verified_missing_items: List[Dict[str, Any]],
        frame: np.ndarray,
        camera_service: Optional[CameraService] = None
    ) -> bool:
        """Evaluates every missing asset independently and creates Incident, Evidence (Before/After Forensic Images), and Notification per missing asset."""
        if not verified_missing_items:
            return False

        incident_created = False

        for item in verified_missing_items:
            asset_obj: Asset = item["asset_obj"]
            before_data = item.get("before_frame_data", (frame, []))
            after_data = item.get("after_frame_data", (frame, []))

            before_frame, before_dets = before_data if isinstance(before_data, tuple) else (frame, [])
            after_frame, after_dets = after_data if isinstance(after_data, tuple) else (frame, [])

            # Duplicate prevention check scoped specifically to THIS asset
            existing_incident = Incident.objects.filter(
                camera=camera,
                asset=asset_obj,
                status="Open"
            ).first()

            if existing_incident:
                log_stage(f"[Stage 7] Open incident #{existing_incident.id} already active for asset '{asset_obj.name}'. Skipping duplicate.")
                continue

            try:
                with transaction.atomic():
                    try:
                        conf_val = float(item["confidence"])
                    except Exception:
                        conf_val = 0.95

                    # Create new Incident record
                    description = (
                        f"{item['missing']} {asset_obj.name}(s) missing from {camera.lab.name if camera.lab else 'Lab'} "
                        f"(Expected: {item['expected']}, Detected: {item['detected']})."
                    )
                    incident = Incident.objects.create(
                        lab=camera.lab,
                        camera=camera,
                        asset=asset_obj,
                        expected_quantity=item["expected"],
                        detected_quantity=item["detected"],
                        confidence=conf_val,
                        description=description,
                        status="Open"
                    )

                    log_stage(f"[Stage 7] Incident Created: Incident ID #{incident.id} for missing asset '{asset_obj.name}'")

                    # Draw YOLO annotations and save Before Image, After Image, and side-by-side Forensic comparative split image
                    from ai_engine.utils import save_forensic_evidence_images
                    evidence_image_path = save_forensic_evidence_images(
                        incident_id=incident.id,
                        camera_id=camera.id,
                        before_frame=before_frame,
                        before_dets=before_dets,
                        after_frame=after_frame,
                        after_dets=after_dets,
                        asset_name=asset_obj.name
                    )

                    # Create Evidence record linked to Incident
                    evidence = Evidence.objects.create(
                        incident=incident,
                        image=evidence_image_path,
                        confidence=conf_val,
                        captured_at=timezone.now()
                    )
                    log_stage(f"[Stage 8] Forensic Evidence Saved: Evidence ID #{evidence.id} ({evidence_image_path})")

                    # Automatically record pre-event (10s) + post-event (10s) video evidence asynchronously
                    if self.video_evidence_service:
                        try:
                            self.video_evidence_service.record_evidence_video(
                                camera=camera,
                                incident=incident,
                                evidence=evidence,
                                camera_service=camera_service,
                                current_frame=after_frame,
                                async_record=True
                            )
                        except Exception as vid_err:
                            log_stage(f"Warning: Video evidence recording failed for asset '{asset_obj.name}': {str(vid_err)}")

                    # Trigger Asset Missing critical notification
                    try:
                        from notifications.services import notify_asset_missing
                        notify_asset_missing(incident)
                        log_stage(f"[Stage 9] Notification Created: Asset missing in {camera.lab.name if camera.lab else 'Lab'} (Camera: {camera.name})")
                    except Exception as notify_err:
                        log_stage(f"Warning: Failed to trigger notification for asset '{asset_obj.name}': {str(notify_err)}")

                    incident_created = True

            except Exception as exc:
                log_stage(f"[Stage 7 Failure] ERROR: Failed to create incident for asset '{asset_obj.name}': {str(exc)}")

        return incident_created

    def monitor_camera_cycle(
        self,
        camera: Camera,
        camera_service: Optional[CameraService] = None,
        frame: Optional[np.ndarray] = None
    ) -> Dict[str, Any]:
        """Execute a single live monitoring cycle for the specified camera with full audit stage logging."""
        start_time = time.time()
        log_stage(f"\n==================================================")
        log_stage(f"LIVE MONITORING CYCLE: Camera #{camera.id} ({camera.name})")
        log_stage(f"==================================================")

        # Stage 1: Camera Connected & Frame Captured
        log_stage(f"[Stage 1] Camera Connected: #{camera.id} ({camera.name})")

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
                err_msg = f"[Stage 1 Failure] ERROR: Camera connection or frame capture failed for Camera ID {camera.id}: {str(frame_err)}"
                log_stage(err_msg)
                raise ReferenceDetectorError(err_msg) from frame_err

        if acquired_frame is None or acquired_frame.size == 0:
            err_msg = f"[Stage 2 Failure] ERROR: Invalid empty frame captured for Camera ID {camera.id}."
            log_stage(err_msg)
            raise FrameCaptureError(err_msg)

        log_stage(f"[Stage 2] Frame Captured (Resolution: {acquired_frame.shape[1]}x{acquired_frame.shape[0]})")

        # Stage 3: YOLO Detection Complete
        try:
            raw_detections = self.detector_engine.detect(acquired_frame)
            filtered_detections = self.detector_engine.filter_supported_assets(raw_detections)
            current_counts = self.detector_engine.count_assets(filtered_detections)
            current_confidences = self.detector_engine.calculate_average_confidence(filtered_detections)

            log_stage("[Stage 3] YOLO Detection Complete:")
            if filtered_detections:
                for det in filtered_detections:
                    log_stage(f"  {det['class_name']} ({det['confidence']:.2f})")
            else:
                log_stage("  (No supported assets detected in frame)")

        except Exception as yolo_err:
            err_msg = f"[Stage 3 Failure] ERROR: YOLO Object Detection failed for Camera ID {camera.id}: {str(yolo_err)}"
            log_stage(err_msg)
            raise ReferenceDetectorError(err_msg) from yolo_err

        # Push frame AND detections into VideoEvidenceService circular buffer
        self.video_evidence_service.add_frame(camera.id, acquired_frame, detections=filtered_detections)

        # Stage 4: Load Active Reference Profile & Expected Assets
        try:
            reference_profile = self.get_active_reference_profile(camera)
            log_stage(f"[Stage 4] Reference Loaded: Profile ID #{reference_profile.id} ('{reference_profile.name}')")

            ref_assets = list(reference_profile.assets.all())
            if not ref_assets:
                err_msg = f"[Stage 4 Failure] ERROR: Baseline asset list is empty for Reference Profile #{reference_profile.id}."
                log_stage(err_msg)
                raise ReferenceDetectorError(err_msg)

            log_stage("Expected Assets:")
            for ref_ast in ref_assets:
                log_stage(f"  {ref_ast.asset.name} = {ref_ast.detected_quantity}")

        except Exception as ref_err:
            if isinstance(ref_err, ReferenceDetectorError):
                raise
            err_msg = f"[Stage 4 Failure] ERROR: Failed loading Reference Profile for Camera ID {camera.id}: {str(ref_err)}"
            log_stage(err_msg)
            raise ReferenceDetectorError(err_msg) from ref_err

        # Stage 5: Comparison & Missing Detection
        log_stage("Current Assets:")
        if current_counts:
            for cls_name, qty in current_counts.items():
                log_stage(f"  {cls_name} = {qty}")
        else:
            log_stage("  None")

        missing_assets = self.compare_assets(
            camera_id=camera.id,
            reference_profile=reference_profile,
            current_counts=current_counts,
            current_confidences=current_confidences,
            current_frame=acquired_frame,
            current_detections=filtered_detections
        )

        if missing_assets:
            log_stage("[Stage 5] Comparison:")
            for m in missing_assets:
                log_stage(f"  Missing: {m['asset_name']} (Expected: {m['expected']}, Detected: {m['detected']}, Missing: {m['missing']})")
        else:
            log_stage("[Stage 5] Comparison: All expected assets present.")

        # Stage 6: Verification Window Processing
        verification_passed, verified_missing = self.update_verification_window(
            camera_id=camera.id,
            reference_profile=reference_profile,
            missing_assets=missing_assets,
            current_frame=acquired_frame,
            current_detections=filtered_detections
        )

        # Stage 7, 8, 9: Incident, Evidence & Notification Creation on Verification Success
        incident_created = False
        if verification_passed and verified_missing:
            log_stage("[Stage 6] Verification 3/3 Confirmed! Creating Incident, Evidence, and Notification...")
            incident_created = self.trigger_incident_and_evidence(
                camera=camera,
                verified_missing_items=verified_missing,
                frame=acquired_frame,
                camera_service=camera_service
            )

        processing_time = round(time.time() - start_time, 2)
        log_stage(f"[Stage 10] Frontend Updated Successfully (Cycle Time: {processing_time}s)")
        log_stage(f"==================================================\n")

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

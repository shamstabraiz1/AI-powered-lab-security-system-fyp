"""Utility functions for image file storage, media path generation, and asset management."""

import logging
import os
import uuid
from typing import Union
import cv2
import numpy as np
from django.conf import settings

from ai_engine.exceptions import ReferenceDetectorError
from assets.models import Asset
from labs.models import Lab

logger = logging.getLogger(__name__)


def generate_unique_image_filename(camera_id: Union[int, str], prefix: str = "ref_cam") -> str:
    """Generate a unique image filename using UUID.

    Args:
        camera_id: Unique identifier for camera.
        prefix: Optional filename prefix.

    Returns:
        str: Unique filename string ending in .jpg.
    """
    unique_id = uuid.uuid4().hex[:10]
    return f"{prefix}_{camera_id}_{unique_id}.jpg"


def save_reference_image(frame: np.ndarray, camera_id: Union[int, str]) -> str:
    """Save captured camera frame into Django MEDIA_ROOT/reference_images/.

    Args:
        frame: OpenCV BGR image array.
        camera_id: Camera ID associated with the frame.

    Returns:
        str: Relative media path (e.g., 'reference_images/ref_cam_1_a1b2c3d4e5.jpg').

    Raises:
        ReferenceDetectorError: If image saving fails.
    """
    if frame is None or frame.size == 0:
        raise ReferenceDetectorError("Cannot save an empty or invalid image frame.")

    try:
        # Determine target directory under Django MEDIA_ROOT
        media_root = getattr(settings, "MEDIA_ROOT", os.path.join(settings.BASE_DIR, "media"))
        target_dir = os.path.join(media_root, "reference_images")

        # Create directory if it does not exist
        os.makedirs(target_dir, exist_ok=True)

        filename = generate_unique_image_filename(camera_id)
        full_file_path = os.path.join(target_dir, filename)

        # Save frame to disk using OpenCV imwrite
        success = cv2.imwrite(full_file_path, frame)
        if not success:
            error_msg = f"cv2.imwrite failed to save image to path: {full_file_path}"
            logger.error(error_msg)
            raise ReferenceDetectorError(error_msg)

        relative_path = f"reference_images/{filename}"
        logger.info("Successfully saved reference image to relative path: %s", relative_path)
        return relative_path

    except Exception as exc:
        if isinstance(exc, ReferenceDetectorError):
            raise
        error_msg = f"Failed to save reference image for camera {camera_id}: {str(exc)}"
        logger.error(error_msg)
        raise ReferenceDetectorError(error_msg) from exc


def get_or_create_lab_asset(
    lab: Lab,
    class_name: str,
    quantity: int
) -> Asset:
    """Get an existing Asset for the given lab matching class_name, or create one if it does not exist.

    Args:
        lab: Lab model instance.
        class_name: Target asset class name (e.g. 'monitor', 'keyboard', 'chair').
        quantity: Detected quantity (used for expected_quantity default).

    Returns:
        Asset: Retrieved or created Asset database model instance.
    """
    formatted_name = class_name.capitalize()

    # Search for existing Asset in lab matching name or category (case-insensitive)
    asset = Asset.objects.filter(
        lab=lab,
        name__iexact=formatted_name
    ).first()

    if asset is None:
        asset = Asset.objects.filter(
            lab=lab,
            category__iexact=formatted_name
        ).first()

    if asset is None:
        tag_suffix = uuid.uuid4().hex[:6].upper()
        asset_tag = f"{lab.name.upper()[:3]}-{formatted_name.upper()[:4]}-{tag_suffix}"

        logger.info(
            "Creating new Asset record for lab '%s' with name '%s' and tag '%s'",
            lab.name, formatted_name, asset_tag
        )
        asset = Asset.objects.create(
            lab=lab,
            name=formatted_name,
            category=formatted_name,
            asset_tag=asset_tag,
            expected_quantity=quantity,
            status="Available",
        )

    return asset


def save_evidence_image(frame: np.ndarray, camera_id: Union[int, str]) -> str:
    """Save evidence camera frame into Django MEDIA_ROOT/evidence/images/.

    Args:
        frame: OpenCV BGR image array.
        camera_id: Camera ID associated with the frame.

    Returns:
        str: Relative media path (e.g., 'evidence/images/evid_cam_1_a1b2c3d4e5.jpg').

    Raises:
        ReferenceDetectorError: If image saving fails.
    """
    if frame is None or frame.size == 0:
        raise ReferenceDetectorError("Cannot save an empty or invalid evidence frame.")

    try:
        media_root = getattr(settings, "MEDIA_ROOT", os.path.join(settings.BASE_DIR, "media"))
        target_dir = os.path.join(media_root, "evidence", "images")

        os.makedirs(target_dir, exist_ok=True)

        filename = generate_unique_image_filename(camera_id, prefix="evid_cam")
        full_file_path = os.path.join(target_dir, filename)

        success = cv2.imwrite(full_file_path, frame)
        if not success:
            error_msg = f"cv2.imwrite failed to save evidence image to: {full_file_path}"
            logger.error(error_msg)
            raise ReferenceDetectorError(error_msg)

        relative_path = f"evidence/images/{filename}"
        logger.info("Successfully saved evidence image to relative path: %s", relative_path)
        return relative_path

    except Exception as exc:
        if isinstance(exc, ReferenceDetectorError):
            raise
        error_msg = f"Failed to save evidence image for camera {camera_id}: {str(exc)}"
        logger.error(error_msg)
        raise ReferenceDetectorError(error_msg) from exc


def draw_detections_and_metadata(
    frame: np.ndarray,
    detections: list = None,
    timestamp_str: str = "",
    status_label: str = ""
) -> np.ndarray:
    """Draw YOLO bounding boxes, labels, confidence scores, and timestamps on a frame."""
    if frame is None or frame.size == 0:
        return frame

    annotated = frame.copy()
    h, w = annotated.shape[:2]

    # Draw YOLO Bounding Boxes, Labels, and Confidence Scores
    if detections:
        for det in detections:
            bbox = det.get("bbox")
            class_name = str(det.get("class_name", det.get("raw_class_name", "Asset"))).capitalize()
            confidence = float(det.get("confidence", 0.95))

            if bbox and len(bbox) == 4:
                x1, y1, x2, y2 = [int(v) for v in bbox]

                # Bounding box color (Vibrant Lime/Green in BGR)
                box_color = (0, 255, 127)

                cv2.rectangle(annotated, (x1, y1), (x2, y2), box_color, 2)

                # Label text: e.g. "Mouse (95.0%)"
                text = f"{class_name} ({confidence * 100:.1f}%)"
                font = cv2.FONT_HERSHEY_SIMPLEX
                font_scale = 0.5
                thickness = 1

                (text_w, text_h), baseline = cv2.getTextSize(text, font, font_scale, thickness)

                label_y1 = max(0, y1 - text_h - 6)
                cv2.rectangle(
                    annotated,
                    (x1, label_y1),
                    (x1 + text_w + 6, label_y1 + text_h + 6),
                    (0, 160, 80),
                    -1
                )
                cv2.putText(
                    annotated,
                    text,
                    (x1 + 3, label_y1 + text_h + 2),
                    font,
                    font_scale,
                    (255, 255, 255),
                    thickness,
                    cv2.LINE_AA
                )

    # Top overlay bar for timestamp & forensic status label
    bar_height = 32
    overlay = annotated.copy()
    cv2.rectangle(overlay, (0, 0), (w, bar_height), (15, 23, 42), -1)
    cv2.addWeighted(overlay, 0.75, annotated, 0.25, 0, annotated)

    font = cv2.FONT_HERSHEY_SIMPLEX
    if not timestamp_str:
        from datetime import datetime
        timestamp_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]

    # Timestamp string on top-left
    cv2.putText(
        annotated,
        timestamp_str,
        (10, 21),
        font,
        0.5,
        (255, 255, 255),
        1,
        cv2.LINE_AA
    )

    # Forensic Status Label on top-right
    if status_label:
        is_before = "BEFORE" in status_label.upper()
        color = (0, 255, 127) if is_before else (0, 75, 255)
        text_size, _ = cv2.getTextSize(status_label, font, 0.5, 2)
        cv2.putText(
            annotated,
            status_label,
            (max(10, w - text_size[0] - 15), 21),
            font,
            0.5,
            color,
            2,
            cv2.LINE_AA
        )

    return annotated


def save_forensic_evidence_images(
    incident_id: int,
    camera_id: Union[int, str],
    before_frame: np.ndarray,
    before_dets: list,
    after_frame: np.ndarray,
    after_dets: list,
    asset_name: str
) -> str:
    """Draw annotations and save Before Image, After Image, and side-by-side Forensic comparative image."""
    from datetime import datetime
    media_root = getattr(settings, "MEDIA_ROOT", os.path.join(settings.BASE_DIR, "media"))
    target_dir = os.path.join(media_root, "evidence", "images")
    os.makedirs(target_dir, exist_ok=True)

    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]
    unique_suffix = uuid.uuid4().hex[:6]

    # 1. Annotate Before Frame
    annotated_before = draw_detections_and_metadata(
        before_frame,
        before_dets,
        timestamp_str=now_str,
        status_label=f"BEFORE: {asset_name.upper()} PRESENT"
    )

    # 2. Annotate After Frame
    annotated_after = draw_detections_and_metadata(
        after_frame,
        after_dets,
        timestamp_str=now_str,
        status_label=f"AFTER: {asset_name.upper()} MISSING"
    )

    # Save individual Before and After images
    before_filename = f"incident_{incident_id}_before_{unique_suffix}.jpg"
    after_filename = f"incident_{incident_id}_after_{unique_suffix}.jpg"

    cv2.imwrite(os.path.join(target_dir, before_filename), annotated_before)
    cv2.imwrite(os.path.join(target_dir, after_filename), annotated_after)

    # 3. Create Side-by-Side Forensic Split Screen Image
    h_b, w_b = annotated_before.shape[:2]
    h_a, w_a = annotated_after.shape[:2]

    target_h = max(h_b, h_a)
    w_b_resized = int(w_b * (target_h / h_b))
    w_a_resized = int(w_a * (target_h / h_a))

    resized_b = cv2.resize(annotated_before, (w_b_resized, target_h))
    resized_a = cv2.resize(annotated_after, (w_a_resized, target_h))

    # Divider bar
    divider = np.zeros((target_h, 4, 3), dtype=np.uint8)
    divider[:, :] = (255, 255, 255)

    forensic_combined = np.hstack([resized_b, divider, resized_a])

    forensic_filename = f"incident_{incident_id}_forensic_{unique_suffix}.jpg"
    forensic_full_path = os.path.join(target_dir, forensic_filename)

    cv2.imwrite(forensic_full_path, forensic_combined)
    relative_path = f"evidence/images/{forensic_filename}"

    logger.info("Saved forensic images for Incident #%d: Before (%s), After (%s), Split (%s)",
                incident_id, before_filename, after_filename, forensic_filename)

    return relative_path


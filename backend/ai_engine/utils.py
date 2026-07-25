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


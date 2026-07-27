"""YOLO Object Detector module integrated with Django monitoring service."""

import logging
from ultralytics import YOLO

logger = logging.getLogger(__name__)

# Single global YOLOv8 model instance for Django AI engine
try:
    logger.info("Initializing YOLOv8 model instance (yolov8m.pt)...")
    model = YOLO("yolov8m.pt")
    logger.info("YOLOv8 model initialized successfully.")
except Exception as exc:
    logger.error("Error initializing YOLOv8 model: %s", str(exc))
    model = None


def get_yolo_model():
    """Retrieve shared YOLO model instance."""
    global model
    if model is None:
        try:
            model = YOLO("yolov8m.pt")
        except Exception as exc:
            logger.error("Failed to load YOLO model: %s", str(exc))
            return None
    return model
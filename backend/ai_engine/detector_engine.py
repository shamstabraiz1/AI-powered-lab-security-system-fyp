"""Object detection engine module using YOLOv8 with single-instance lazy model loading."""

import logging
from typing import Any, Dict, List, Optional, Set
import numpy as np
from django.conf import settings
from ultralytics import YOLO

from ai_engine.exceptions import DetectionError, ModelLoadError

logger = logging.getLogger(__name__)


class DetectorEngine:
    """YOLOv8 object detection engine designed for asset recognition.

    Ensures the model is loaded in memory only once (lazy singleton loading)
    and reused across all requests and downstream AI modules.
    """

    _model_instance: Optional[YOLO] = None
    _loaded_model_path: Optional[str] = None

    COCO_CLASS_MAPPING: Dict[str, str] = {
        "tv": "monitor",
        "tvmonitor": "monitor",
        "screen": "monitor",
        "desktop": "computer",
        "pc": "computer",
    }

    SUPPORTED_ASSET_CLASSES: Set[str] = {
        "person",
        "chair",
        "mouse",
        "keyboard",
        "laptop",
        "monitor",
        "computer",
    }

    def __init__(
        self,
        model_path: Optional[str] = None,
        confidence_threshold: Optional[float] = None
    ) -> None:
        """Initialize DetectorEngine configuration.

        Args:
            model_path: Path to model weights. Defaults to Django settings `YOLO_MODEL`.
            confidence_threshold: Minimum detection confidence. Defaults to Django settings `YOLO_CONFIDENCE`.
        """
        self.model_path = model_path or getattr(
            settings, "YOLO_MODEL", "yolov8m.pt"
        )
        self.confidence_threshold = (
            confidence_threshold
            if confidence_threshold is not None
            else float(getattr(settings, "YOLO_CONFIDENCE", 0.25))
        )

    def load_model(self) -> YOLO:
        """Lazily load YOLO model into memory only once.

        Returns:
            YOLO: Loaded model instance.

        Raises:
            ModelLoadError: If loading model weights fails.
        """
        if (
            DetectorEngine._model_instance is not None
            and DetectorEngine._loaded_model_path == str(self.model_path)
        ):
            logger.debug("Reusing in-memory loaded YOLO model instance: %s", self.model_path)
            return DetectorEngine._model_instance

        logger.info("Loading YOLO model from path: %s", self.model_path)

        try:
            model = YOLO(str(self.model_path))
            DetectorEngine._model_instance = model
            DetectorEngine._loaded_model_path = str(self.model_path)
            logger.info("YOLO model loaded successfully into memory.")
            return model

        except Exception as exc:
            error_msg = f"Failed to load YOLO model from '{self.model_path}': {str(exc)}"
            logger.error(error_msg)
            raise ModelLoadError(error_msg) from exc

    def detect(self, frame: np.ndarray) -> List[Dict[str, Any]]:
        """Run YOLO inference on a single image frame and return structured detection results.

        Args:
            frame: NumPy BGR image array.

        Returns:
            List[Dict[str, Any]]: List of detection dictionaries containing raw_class_name,
            class_name, confidence score, and bounding box coordinates [x1, y1, x2, y2].

        Raises:
            DetectionError: If detection execution fails.
        """
        if frame is None or frame.size == 0:
            raise DetectionError("Cannot perform detection on empty or invalid frame.")

        model = self.load_model()

        try:
            logger.info("Running YOLO object detection with confidence threshold: %.2f", self.confidence_threshold)
            results = model.predict(
                source=frame,
                conf=self.confidence_threshold,
                verbose=False
            )

            structured_detections: List[Dict[str, Any]] = []

            if not results:
                return structured_detections

            result = results[0]
            boxes = result.boxes

            if boxes is None or len(boxes) == 0:
                return structured_detections

            names = result.names  # class index to class name string mapping

            for box in boxes:
                cls_id = int(box.cls[0].item())
                confidence = float(box.conf[0].item())
                raw_class_name = names.get(cls_id, str(cls_id)).lower()
                
                # Map COCO class labels (e.g. 'tv' -> 'monitor') or keep raw if unmapped
                mapped_class_name = self.COCO_CLASS_MAPPING.get(
                    raw_class_name, raw_class_name
                )

                # Extract bounding box array [x1, y1, x2, y2]
                xyxy = box.xyxy[0].tolist() if hasattr(box.xyxy[0], "tolist") else list(box.xyxy[0])

                structured_detections.append({
                    "raw_class_name": raw_class_name,
                    "class_name": mapped_class_name,
                    "confidence": round(confidence, 4),
                    "bbox": [round(coord, 2) for coord in xyxy],
                })

            logger.info("Raw detection completed. Total bounding boxes detected: %d", len(structured_detections))
            return structured_detections

        except Exception as exc:
            if isinstance(exc, DetectionError):
                raise
            error_msg = f"Error occurred during object detection: {str(exc)}"
            logger.error(error_msg)
            raise DetectionError(error_msg) from exc

    def filter_supported_assets(
        self, detections: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Filter detections to retain only supported target lab assets.

        Supported assets: person, chair, mouse, keyboard, laptop, monitor, computer.

        Args:
            detections: List of detection objects.

        Returns:
            List[Dict[str, Any]]: Filtered list containing only supported asset detections.
        """
        filtered = [
            det for det in detections
            if det.get("class_name") in self.SUPPORTED_ASSET_CLASSES
        ]
        logger.info(
            "Filtered detections. Kept %d target asset objects out of %d total detections.",
            len(filtered),
            len(detections)
        )
        return filtered

    def count_assets(
        self, filtered_detections: List[Dict[str, Any]]
    ) -> Dict[str, int]:
        """Calculate counts of detected assets grouped by class name.

        Args:
            filtered_detections: Filtered detection list.

        Returns:
            Dict[str, int]: Mapping of asset class name to total detected count.
        """
        counts: Dict[str, int] = {}
        for det in filtered_detections:
            cls_name = det["class_name"]
            counts[cls_name] = counts.get(cls_name, 0) + 1
        return counts

    def calculate_average_confidence(
        self, filtered_detections: List[Dict[str, Any]]
    ) -> Dict[str, float]:
        """Calculate average detection confidence score per asset class.

        Args:
            filtered_detections: Filtered detection list.

        Returns:
            Dict[str, float]: Mapping of asset class name to average confidence score.
        """
        conf_sums: Dict[str, float] = {}
        counts: Dict[str, int] = {}

        for det in filtered_detections:
            cls_name = det["class_name"]
            conf = det["confidence"]
            conf_sums[cls_name] = conf_sums.get(cls_name, 0.0) + conf
            counts[cls_name] = counts.get(cls_name, 0) + 1

        avg_confidences: Dict[str, float] = {
            cls_name: round(conf_sums[cls_name] / counts[cls_name], 4)
            for cls_name in conf_sums
        }

        return avg_confidences

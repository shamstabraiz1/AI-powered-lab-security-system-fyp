"""Camera service module responsible strictly for camera connections and frame capture."""

import logging
from typing import Optional, Union
import cv2
import numpy as np

from ai_engine.exceptions import CameraConnectionError, FrameCaptureError

logger = logging.getLogger(__name__)


class CameraService:
    """Service dedicated to camera connection management and frame acquisition.

    Supports RTSP URLs, HTTP video streams, and local USB webcam indices.
    """

    def __init__(
        self,
        source: Union[str, int],
        connect_timeout: float = 10.0
    ) -> None:
        """Initialize CameraService with stream source.

        Args:
            source: IP camera URL (RTSP/HTTP), video file path, or webcam index (e.g. 0).
            connect_timeout: Maximum timeout threshold in seconds for connection attempt.
        """
        # Convert string index to integer if source is a numeric string
        if isinstance(source, str) and source.isdigit():
            self.source: Union[str, int] = int(source)
        else:
            self.source = source

        self.connect_timeout = connect_timeout
        self.cap: Optional[cv2.VideoCapture] = None

    def connect(self) -> bool:
        """Establish connection to camera stream.

        Returns:
            bool: True if connection is successfully opened.

        Raises:
            CameraConnectionError: If unable to open camera stream source.
        """
        if self.is_connected():
            logger.info("Camera already connected to source: %s", self.source)
            return True

        logger.info("Attempting to connect to camera source: %s", self.source)

        try:
            # Initialize OpenCV VideoCapture
            self.cap = cv2.VideoCapture(self.source)

            if not self.cap or not self.cap.isOpened():
                error_msg = f"Failed to connect to camera stream at source: {self.source}"
                logger.error(error_msg)
                raise CameraConnectionError(error_msg)

            logger.info("Successfully connected to camera source: %s", self.source)
            return True

        except Exception as exc:
            if isinstance(exc, CameraConnectionError):
                raise
            error_msg = f"Unexpected error connecting to camera source {self.source}: {str(exc)}"
            logger.error(error_msg)
            raise CameraConnectionError(error_msg) from exc

    def is_connected(self) -> bool:
        """Check if camera stream is currently open and connected.

        Returns:
            bool: True if video capture object exists and is opened.
        """
        return self.cap is not None and self.cap.isOpened()

    def capture_frame(self) -> np.ndarray:
        """Capture a single frame from the camera stream.

        Returns:
            np.ndarray: OpenCV BGR image frame array.

        Raises:
            CameraConnectionError: If camera is not connected.
            FrameCaptureError: If frame acquisition fails or returns empty array.
        """
        if not self.is_connected():
            self.connect()

        if self.cap is None:
            raise CameraConnectionError("Camera VideoCapture instance is uninitialized.")

        logger.info("Capturing frame from camera source: %s", self.source)

        try:
            success, frame = self.cap.read()

            if not success or frame is None or frame.size == 0:
                error_msg = f"Failed to capture valid frame from camera source: {self.source}"
                logger.error(error_msg)
                raise FrameCaptureError(error_msg)

            logger.info("Frame captured successfully. Frame resolution: %dx%d", frame.shape[1], frame.shape[0])
            return frame

        except Exception as exc:
            if isinstance(exc, (CameraConnectionError, FrameCaptureError)):
                raise
            error_msg = f"Exception occurred during frame capture: {str(exc)}"
            logger.error(error_msg)
            raise FrameCaptureError(error_msg) from exc

    def disconnect(self) -> None:
        """Release camera resource and close stream connection."""
        if self.cap is not None:
            logger.info("Releasing camera capture for source: %s", self.source)
            try:
                self.cap.release()
            except Exception as exc:
                logger.warning("Error releasing camera capture: %s", str(exc))
            finally:
                self.cap = None
        else:
            logger.debug("Camera already disconnected or capture object is None.")

    def __enter__(self) -> "CameraService":
        """Context manager entry point."""
        self.connect()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        """Context manager exit point releasing resources."""
        self.disconnect()

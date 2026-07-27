"""Camera service module responsible strictly for camera connections and frame capture."""

import logging
from typing import Optional, Union
import cv2
import numpy as np

from ai_engine.exceptions import CameraConnectionError, FrameCaptureError

logger = logging.getLogger(__name__)


class CameraService:
    """Service dedicated to camera connection management and frame acquisition.

    Supports RTSP URLs, HTTP video streams (e.g. mobile IP Webcam), and explicit webcam indices.
    Never opens default laptop webcam unless explicitly requested.
    """

    def __init__(
        self,
        source: Union[str, int],
        connect_timeout: float = 10.0
    ) -> None:
        """Initialize CameraService with stream source URL.

        Args:
            source: IP camera stream URL (RTSP/HTTP e.g. http://192.168.100.41:8080/video).
            connect_timeout: Maximum timeout threshold in seconds for connection attempt.
        """
        if isinstance(source, str) and source.isdigit():
            self.source: Union[str, int] = int(source)
        else:
            self.source = source

        self.connect_timeout = connect_timeout
        self.cap: Optional[cv2.VideoCapture] = None

    def connect(self) -> bool:
        """Establish connection to camera stream URL without falling back to local webcams."""
        if self.is_connected():
            logger.info("Camera already connected to stream source: %s", self.source)
            return True

        logger.info("Connecting to camera stream source: %s", self.source)

        try:
            # Initialize OpenCV VideoCapture with the explicit stream URL
            self.cap = cv2.VideoCapture(self.source)

            if not self.cap or not self.cap.isOpened():
                error_msg = f"Failed to connect to camera stream at URL: {self.source}"
                logger.error(error_msg)
                raise CameraConnectionError(error_msg)

            logger.info("Successfully connected to camera stream source: %s", self.source)
            return True

        except Exception as exc:
            if isinstance(exc, CameraConnectionError):
                raise
            error_msg = f"Unexpected error connecting to camera source {self.source}: {str(exc)}"
            logger.error(error_msg)
            raise CameraConnectionError(error_msg) from exc

    def is_connected(self) -> bool:
        """Check if camera stream is currently open and connected."""
        return self.cap is not None and self.cap.isOpened()

    def capture_frame(self) -> np.ndarray:
        """Capture a single frame from the camera stream."""
        if not self.is_connected():
            self.connect()

        if self.cap is None:
            raise CameraConnectionError("Camera VideoCapture instance is uninitialized.")

        try:
            success, frame = self.cap.read()

            if not success or frame is None or frame.size == 0:
                error_msg = f"Failed to capture valid frame from camera source: {self.source}"
                logger.error(error_msg)
                raise FrameCaptureError(error_msg)

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

    def __enter__(self) -> "CameraService":
        self.connect()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        self.disconnect()

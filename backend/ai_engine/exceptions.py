"""Custom exception classes for AI Engine module."""


class ReferenceDetectorError(Exception):
    """Base exception class for AI Reference Detector module errors."""

    pass


class CameraConnectionError(ReferenceDetectorError):
    """Raised when connecting to an IP camera, RTSP stream, or webcam fails."""

    pass


class FrameCaptureError(ReferenceDetectorError):
    """Raised when capturing a frame from a camera stream fails."""

    pass


class ModelLoadError(ReferenceDetectorError):
    """Raised when loading the YOLO object detection model fails."""

    pass


class DetectionError(ReferenceDetectorError):
    """Raised when object detection fails during frame processing."""

    pass


class DatabaseOperationError(ReferenceDetectorError):
    """Raised when saving reference profile or asset records to database fails."""

    pass

"""Video Evidence Service module for pre-event buffer tracking and post-event automated MP4 recording."""

from collections import deque
from datetime import datetime
import logging
import os
import threading
import time
from typing import Dict, List, Optional, Union
import cv2
import numpy as np
from django.conf import settings

from ai_engine.camera_service import CameraService
from ai_engine.exceptions import (
    DatabaseOperationError,
    FrameCaptureError,
    ReferenceDetectorError,
)
from cameras.models import Camera
from evidence.models import Evidence
from incidents.models import Incident

logger = logging.getLogger(__name__)


class VideoEvidenceService:
    """Service managing circular in-memory pre-event frame buffers and non-blocking

    evidence video compilation upon incident confirmation.
    """

    def __init__(
        self,
        pre_event_seconds: Optional[int] = None,
        post_event_seconds: Optional[int] = None,
        video_fps: Optional[int] = None,
        video_codec: Optional[str] = None
    ) -> None:
        """Initialize VideoEvidenceService configuration and frame buffers.

        Args:
            pre_event_seconds: Duration of pre-event buffer in seconds. Defaults to settings.PRE_EVENT_BUFFER_SECONDS.
            post_event_seconds: Duration of post-event recording in seconds. Defaults to settings.POST_EVENT_RECORD_SECONDS.
            video_fps: Recording frames per second. Defaults to settings.VIDEO_FPS.
            video_codec: Video FourCC codec string. Defaults to settings.VIDEO_CODEC.
        """
        self.pre_event_seconds = (
            pre_event_seconds
            if pre_event_seconds is not None
            else int(getattr(settings, "PRE_EVENT_BUFFER_SECONDS", 10))
        )
        self.post_event_seconds = (
            post_event_seconds
            if post_event_seconds is not None
            else int(getattr(settings, "POST_EVENT_RECORD_SECONDS", 10))
        )
        self.video_fps = (
            video_fps
            if video_fps is not None
            else int(getattr(settings, "VIDEO_FPS", 20))
        )
        self.video_codec = (
            video_codec
            if video_codec is not None
            else str(getattr(settings, "VIDEO_CODEC", "mp4v"))
        )

        # Buffer max capacity: PRE_EVENT_BUFFER_SECONDS * VIDEO_FPS
        self.buffer_maxlen = max(1, self.pre_event_seconds * self.video_fps)

        # Dictionary mapping camera_id -> deque(maxlen=buffer_maxlen)
        self._buffers: Dict[Union[int, str], deque] = {}
        self._lock = threading.Lock()

        logger.info(
            "VideoEvidenceService initialized: PreEventBuffer=%ds, PostEvent=%ds, FPS=%d, MaxBufferFrames=%d",
            self.pre_event_seconds,
            self.post_event_seconds,
            self.video_fps,
            self.buffer_maxlen
        )

    def add_frame(self, camera_id: Union[int, str], frame: np.ndarray) -> None:
        """Add live frame to the camera's circular in-memory buffer.

        Args:
            camera_id: Camera identifier.
            frame: OpenCV BGR image frame array.
        """
        if frame is None or frame.size == 0:
            return

        with self._lock:
            if camera_id not in self._buffers:
                self._buffers[camera_id] = deque(maxlen=self.buffer_maxlen)
            self._buffers[camera_id].append(frame.copy())

    def get_pre_event_buffer(self, camera_id: Union[int, str]) -> List[np.ndarray]:
        """Extract a snapshot of the current pre-event circular buffer for a camera.

        Args:
            camera_id: Camera identifier.

        Returns:
            List[np.ndarray]: Snapshot list of pre-event frame arrays.
        """
        with self._lock:
            if camera_id not in self._buffers:
                return []
            return list(self._buffers[camera_id])

    def record_evidence_video(
        self,
        camera: Camera,
        incident: Incident,
        evidence: Evidence,
        camera_service: Optional[CameraService] = None,
        current_frame: Optional[np.ndarray] = None,
        async_record: bool = True
    ) -> str:
        """Trigger continuous evidence video compilation (Pre-Event + Post-Event).

        Args:
            camera: Camera model instance.
            incident: Incident model instance.
            evidence: Evidence model instance to update.
            camera_service: Optional active CameraService stream for post-event recording.
            current_frame: Incident moment frame array.
            async_record: If True, execute recording & file saving in a background thread.

        Returns:
            str: Relative video file path if synchronous, or placeholder task string if asynchronous.
        """
        logger.info("Incident #%d detected on Camera %s. Initiating evidence video recording...", incident.id, camera.id)

        # Snapshot previous 10 seconds of frames from circular buffer
        pre_event_frames = self.get_pre_event_buffer(camera.id)
        logger.info("Saving previous %d seconds (%d frames) from pre-event buffer.", self.pre_event_seconds, len(pre_event_frames))

        if async_record:
            # Spawn non-blocking background thread so monitoring loop continues uninterrupted
            worker_thread = threading.Thread(
                target=self._compile_and_save_video,
                kwargs={
                    "camera": camera,
                    "incident": incident,
                    "evidence": evidence,
                    "pre_event_frames": pre_event_frames,
                    "current_frame": current_frame,
                    "camera_service": camera_service,
                },
                daemon=True
            )
            worker_thread.start()
            logger.info("Background thread spawned for evidence video compilation of Incident #%d.", incident.id)
            return "async_recording_started"
        else:
            return self._compile_and_save_video(
                camera=camera,
                incident=incident,
                evidence=evidence,
                pre_event_frames=pre_event_frames,
                current_frame=current_frame,
                camera_service=camera_service
            )

    def _compile_and_save_video(
        self,
        camera: Camera,
        incident: Incident,
        evidence: Evidence,
        pre_event_frames: List[np.ndarray],
        current_frame: Optional[np.ndarray] = None,
        camera_service: Optional[CameraService] = None
    ) -> str:
        """Internal worker method to record post-event frames, merge parts, write MP4, and update Evidence.

        Args:
            camera: Camera model instance.
            incident: Incident model instance.
            evidence: Evidence model instance.
            pre_event_frames: List of pre-event frame arrays.
            current_frame: Frame array at moment of detection.
            camera_service: Optional active CameraService for post-event live capture.

        Returns:
            str: Relative video path saved to media storage.
        """
        try:
            logger.info("Recording next %d seconds for post-event evidence...", self.post_event_seconds)

            post_event_frames: List[np.ndarray] = []
            target_post_frames = self.post_event_seconds * self.video_fps
            frame_delay = 1.0 / self.video_fps

            # Capture post-event live frames
            for _ in range(target_post_frames):
                frame = None
                if camera_service is not None and camera_service.is_connected():
                    try:
                        frame = camera_service.capture_frame()
                    except Exception:
                        frame = None

                if frame is None and current_frame is not None:
                    frame = current_frame.copy()

                if frame is not None:
                    post_event_frames.append(frame)

                time.sleep(frame_delay)

            logger.info("Merging video: Pre-event=%d frames, Post-event=%d frames.", len(pre_event_frames), len(post_event_frames))

            # Combine pre-event, current event frame, and post-event frames into continuous sequence
            all_frames: List[np.ndarray] = []
            all_frames.extend(pre_event_frames)
            if current_frame is not None:
                all_frames.append(current_frame)
            all_frames.extend(post_event_frames)

            if not all_frames:
                raise FrameCaptureError("No valid frames available to generate evidence video.")

            # Prepare storage directory
            media_root = getattr(settings, "MEDIA_ROOT", os.path.join(settings.BASE_DIR, "media"))
            target_dir = os.path.join(media_root, "evidence", "videos")
            os.makedirs(target_dir, exist_ok=True)

            # Generate filename: incident_15_cam_3_20260725_143015.mp4
            timestamp_str = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"incident_{incident.id}_cam_{camera.id}_{timestamp_str}.mp4"
            full_video_path = os.path.join(target_dir, filename)

            # Initialize OpenCV VideoWriter
            sample_frame = all_frames[0]
            height, width = sample_frame.shape[:2]

            fourcc = cv2.VideoWriter_fourcc(*self.video_codec)
            writer = cv2.VideoWriter(full_video_path, fourcc, float(self.video_fps), (width, height))

            if not writer.isOpened():
                # Fallback codec if specified codec is not supported by backend
                fallback_codec = "XVID"
                logger.warning("VideoWriter failed with codec %s. Retrying with fallback %s", self.video_codec, fallback_codec)
                fourcc = cv2.VideoWriter_fourcc(*fallback_codec)
                writer = cv2.VideoWriter(full_video_path, fourcc, float(self.video_fps), (width, height))

            for frame in all_frames:
                # Resize if frame dimensions differ from initial sample
                if frame.shape[:2] != (height, width):
                    frame = cv2.resize(frame, (width, height))
                writer.write(frame)

            writer.release()
            logger.info("Video saved successfully to path: %s", full_video_path)

            # Update Evidence model record
            relative_video_path = f"evidence/videos/{filename}"
            evidence.video = relative_video_path
            evidence.save(update_fields=["video"])

            logger.info("Evidence updated for Incident #%d with video path: %s", incident.id, relative_video_path)
            return relative_video_path

        except Exception as exc:
            error_msg = f"Failed to record evidence video for Incident #{incident.id}: {str(exc)}"
            logger.error(error_msg)
            raise DatabaseOperationError(error_msg) from exc

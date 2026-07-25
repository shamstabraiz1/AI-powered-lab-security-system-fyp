"""Automatic Monitoring Scheduler and Multi-Camera Manager module."""

from datetime import datetime
import logging
import threading
import time
from typing import Any, Dict, Optional, Set
from django.conf import settings

from ai_engine.camera_service import CameraService
from ai_engine.exceptions import (
    CameraConnectionError,
    FrameCaptureError,
    ReferenceDetectorError,
)
from ai_engine.monitoring_engine import MonitoringEngine
from cameras.models import Camera

logger = logging.getLogger(__name__)


class MonitoringScheduler:
    """Multi-camera monitoring scheduler managing parallel camera daemon worker threads,

    dynamic database discovery, connection auto-recovery, and lifecycle management.
    """

    RETRY_INTERVAL_SECONDS: float = 5.0
    DISCOVERY_INTERVAL_SECONDS: float = 60.0

    def __init__(
        self,
        monitoring_engine: Optional[MonitoringEngine] = None,
        monitor_interval: Optional[float] = None
    ) -> None:
        """Initialize MonitoringScheduler instance.

        Args:
            monitoring_engine: Shared MonitoringEngine instance. Defaults to new instance.
            monitor_interval: Monitoring cycle sleep interval in seconds. Defaults to settings.MONITOR_INTERVAL_SECONDS.
        """
        self.monitoring_engine = monitoring_engine or MonitoringEngine()
        self.monitor_interval = (
            monitor_interval
            if monitor_interval is not None
            else float(getattr(settings, "MONITOR_INTERVAL_SECONDS", 2.0))
        )

        self.running: bool = False
        self._stop_event = threading.Event()
        self._discovery_thread: Optional[threading.Thread] = None

        self._lock = threading.Lock()
        self._worker_threads: Dict[int, threading.Thread] = {}
        self._worker_stop_events: Dict[int, threading.Event] = {}
        self._camera_stats: Dict[int, Dict[str, Any]] = {}

        logger.info(
            "MonitoringScheduler initialized (MonitorInterval=%.1fs, DiscoveryInterval=%.1fs, RetryInterval=%.1fs)",
            self.monitor_interval,
            self.DISCOVERY_INTERVAL_SECONDS,
            self.RETRY_INTERVAL_SECONDS
        )

    def start(self) -> bool:
        """Start the monitoring scheduler and dynamic camera discovery loop.

        Returns:
            bool: True if scheduler started successfully.
        """
        with self._lock:
            if self.running:
                logger.info("MonitoringScheduler is already running.")
                return True

            self.running = True
            self._stop_event.clear()

            logger.info("Starting MonitoringScheduler...")
            self._discovery_thread = threading.Thread(
                target=self._discovery_loop,
                name="MonitoringScheduler-Discovery",
                daemon=True
            )
            self._discovery_thread.start()
            logger.info("MonitoringScheduler started successfully.")

            try:
                from notifications.services import notify_monitoring_started
                notify_monitoring_started()
            except Exception as notify_err:
                logger.warning("Failed to trigger monitoring started notification: %s", str(notify_err))

            return True

    def stop(self) -> bool:
        """Stop the monitoring scheduler and terminate all camera worker threads gracefully.

        Returns:
            bool: True if scheduler stopped successfully.
        """
        with self._lock:
            if not self.running:
                logger.info("MonitoringScheduler is already stopped.")
                return True

            logger.info("Stopping MonitoringScheduler and worker threads...")
            self.running = False
            self._stop_event.set()

            # Signal all camera workers to stop
            for cam_id, stop_evt in self._worker_stop_events.items():
                stop_evt.set()

        # Join worker threads outside lock to prevent deadlocks
        for cam_id, thread in list(self._worker_threads.items()):
            if thread.is_alive():
                thread.join(timeout=3.0)
                logger.info("Camera worker thread for Camera ID %d stopped.", cam_id)

        if self._discovery_thread and self._discovery_thread.is_alive():
            self._discovery_thread.join(timeout=3.0)

        with self._lock:
            self._worker_threads.clear()
            self._worker_stop_events.clear()

        try:
            from notifications.services import notify_monitoring_stopped
            notify_monitoring_stopped()
        except Exception as notify_err:
            logger.warning("Failed to trigger monitoring stopped notification: %s", str(notify_err))

        logger.info("MonitoringScheduler stopped.")
        return True


    def restart(self) -> bool:
        """Restart the monitoring scheduler.

        Returns:
            bool: True if scheduler restarted successfully.
        """
        logger.info("Restarting MonitoringScheduler...")
        self.stop()
        time.sleep(0.5)
        return self.start()

    def get_status(self) -> Dict[str, Any]:
        """Get structured status summary of the scheduler and active camera worker threads.

        Returns:
            Dict[str, Any]: Status summary dictionary.
        """
        with self._lock:
            active_worker_count = sum(
                1 for cam_id, thread in self._worker_threads.items() if thread.is_alive()
            )

            cameras_status: Dict[str, Dict[str, Any]] = {}
            for cam_id, stats in self._camera_stats.items():
                thread = self._worker_threads.get(cam_id)
                cameras_status[str(cam_id)] = {
                    "camera_name": stats.get("camera_name", f"Camera #{cam_id}"),
                    "status": stats.get("status", "Stopped"),
                    "thread_alive": thread.is_alive() if thread else False,
                    "cycle_count": stats.get("cycle_count", 0),
                    "error_count": stats.get("error_count", 0),
                    "last_cycle_timestamp": stats.get("last_cycle_timestamp"),
                    "last_error": stats.get("last_error"),
                }

            return {
                "scheduler_running": self.running,
                "total_active_workers": active_worker_count,
                "monitor_interval_seconds": self.monitor_interval,
                "discovery_interval_seconds": self.DISCOVERY_INTERVAL_SECONDS,
                "cameras": cameras_status,
            }

    def _discovery_loop(self) -> None:
        """Background discovery loop polling DB every 60s for online/offline cameras."""
        logger.info("Dynamic Camera Discovery loop started.")

        while self.running and not self._stop_event.is_set():
            try:
                self._sync_cameras()
            except Exception as exc:
                logger.error("Error during dynamic camera discovery sync: %s", str(exc))

            # Sleep until next discovery check or stop signal
            self._stop_event.wait(self.DISCOVERY_INTERVAL_SECONDS)

        logger.info("Dynamic Camera Discovery loop stopped.")

    def _sync_cameras(self) -> None:
        """Query database for online cameras and synchronize running worker threads."""
        try:
            # Query online cameras from PostgreSQL DB
            online_cameras = list(Camera.objects.filter(status="Online"))
            online_cam_ids: Set[int] = {cam.id for cam in online_cameras}
            logger.info("Discovery check: Found %d online camera(s) in database.", len(online_cameras))

        except Exception as exc:
            logger.error("Failed to query Camera database: %s", str(exc))
            return

        with self._lock:
            # Start worker for any new online camera not currently running
            for cam in online_cameras:
                thread = self._worker_threads.get(cam.id)
                if thread is None or not thread.is_alive():
                    logger.info("Camera worker started for Camera ID %d (%s).", cam.id, cam.name)
                    stop_evt = threading.Event()
                    worker_thread = threading.Thread(
                        target=self._camera_worker,
                        args=(cam.id, stop_evt),
                        name=f"CameraWorker-{cam.id}",
                        daemon=True
                    )
                    self._worker_threads[cam.id] = worker_thread
                    self._worker_stop_events[cam.id] = stop_evt
                    self._camera_stats[cam.id] = {
                        "camera_name": cam.name,
                        "status": "Starting",
                        "cycle_count": 0,
                        "error_count": 0,
                        "last_cycle_timestamp": None,
                        "last_error": None,
                    }
                    worker_thread.start()

            # Stop worker for any camera that is no longer Online or has been deleted
            for cam_id, thread in list(self._worker_threads.items()):
                if cam_id not in online_cam_ids:
                    logger.info("Camera ID %d is no longer Online. Stopping worker thread...", cam_id)
                    stop_evt = self._worker_stop_events.get(cam_id)
                    if stop_evt:
                        stop_evt.set()

    def _camera_worker(self, camera_id: int, stop_event: threading.Event) -> None:
        """Dedicated continuous worker loop for a single camera.

        Handles frame capture, YOLO detection, reference comparison, incident creation,
        and automatic connection recovery without crashing the scheduler.

        Args:
            camera_id: Camera ID to monitor.
            stop_event: Event to signal worker termination.
        """
        logger.info("Worker thread started for Camera ID %d.", camera_id)
        cam_service: Optional[CameraService] = None
        was_disconnected = False

        while self.running and not stop_event.is_set():
            try:
                # Fetch fresh camera instance from DB
                camera = Camera.objects.filter(id=camera_id, status="Online").first()
                if not camera:
                    logger.info("Camera ID %d is offline or deleted in DB. Exiting worker thread.", camera_id)
                    break

                # Initialize or reuse CameraService connection
                source = camera.location if camera.location and ("://" in camera.location or camera.location.isdigit()) else 0
                if cam_service is None or cam_service.source != source:
                    if cam_service is not None:
                        cam_service.disconnect()
                    cam_service = CameraService(source=source)

                if not cam_service.is_connected():
                    try:
                        cam_service.connect()
                        if was_disconnected:
                            logger.info("Camera reconnected for Camera ID %d (%s). Resuming monitoring.", camera_id, camera.name)
                            was_disconnected = False
                            try:
                                from notifications.services import notify_camera_reconnected
                                notify_camera_reconnected(camera)
                            except Exception as notify_err:
                                logger.warning("Failed to trigger camera reconnected notification: %s", str(notify_err))
                    except CameraConnectionError as conn_err:
                        if not was_disconnected:
                            logger.warning("Camera disconnected for Camera ID %d (%s): %s. Will retry in %.1fs.", camera_id, camera.name, str(conn_err), self.RETRY_INTERVAL_SECONDS)
                            was_disconnected = True
                            try:
                                from notifications.services import notify_camera_offline
                                notify_camera_offline(camera)
                            except Exception as notify_err:
                                logger.warning("Failed to trigger camera offline notification: %s", str(notify_err))

                        with self._lock:
                            if camera_id in self._camera_stats:
                                self._camera_stats[camera_id]["status"] = "Disconnected"
                                self._camera_stats[camera_id]["last_error"] = str(conn_err)

                        # Retry connection after 5 seconds
                        stop_event.wait(self.RETRY_INTERVAL_SECONDS)
                        continue


                # Execute single monitoring cycle
                result = self.monitoring_engine.monitor_camera_cycle(
                    camera=camera,
                    camera_service=cam_service
                )

                with self._lock:
                    if camera_id in self._camera_stats:
                        self._camera_stats[camera_id]["status"] = "Monitoring"
                        self._camera_stats[camera_id]["cycle_count"] += 1
                        self._camera_stats[camera_id]["last_cycle_timestamp"] = datetime.now().isoformat()

                logger.info("Monitoring cycle completed for Camera ID %d (%s).", camera_id, camera.name)

            except ReferenceDetectorError as ref_err:
                logger.error("Monitoring cycle error on Camera ID %d: %s", camera_id, str(ref_err))
                with self._lock:
                    if camera_id in self._camera_stats:
                        self._camera_stats[camera_id]["error_count"] += 1
                        self._camera_stats[camera_id]["last_error"] = str(ref_err)

            except Exception as exc:
                logger.error("Unexpected worker exception on Camera ID %d: %s", camera_id, str(exc))
                with self._lock:
                    if camera_id in self._camera_stats:
                        self._camera_stats[camera_id]["error_count"] += 1
                        self._camera_stats[camera_id]["last_error"] = str(exc)

            # Sleep for MONITOR_INTERVAL_SECONDS before next cycle
            stop_event.wait(self.monitor_interval)

        # Cleanup on worker exit
        if cam_service is not None:
            cam_service.disconnect()

        with self._lock:
            if camera_id in self._camera_stats:
                self._camera_stats[camera_id]["status"] = "Stopped"

        logger.info("Worker stopped for Camera ID %d.", camera_id)

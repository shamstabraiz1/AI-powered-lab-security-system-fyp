import time
from unittest.mock import MagicMock, patch
import numpy as np
from django.test import TestCase


from ai_engine.camera_service import CameraService
from ai_engine.detector_engine import DetectorEngine
from ai_engine.exceptions import (
    CameraConnectionError,
    FrameCaptureError,
    ModelLoadError,
    ReferenceDetectorError,
)
from ai_engine.reference_detector import ReferenceDetector
from ai_engine.utils import generate_unique_image_filename, get_or_create_lab_asset
from assets.models import Asset
from cameras.models import Camera
from labs.models import Lab
from reference.models import ReferenceAsset, ReferenceProfile


class DetectorEngineTestCase(TestCase):
    """Test cases for DetectorEngine asset detection, COCO class mapping, and asset filtering."""

    def setUp(self):
        self.engine = DetectorEngine(model_path="yolov8m.pt", confidence_threshold=0.25)

    def test_coco_class_mapping_and_filtering(self):
        raw_detections = [
            {"raw_class_name": "tv", "class_name": "monitor", "confidence": 0.92, "bbox": [0, 0, 10, 10]},
            {"raw_class_name": "chair", "class_name": "chair", "confidence": 0.85, "bbox": [10, 10, 20, 20]},
            {"raw_class_name": "chair", "class_name": "chair", "confidence": 0.75, "bbox": [20, 20, 30, 30]},
            {"raw_class_name": "dog", "class_name": "dog", "confidence": 0.99, "bbox": [30, 30, 40, 40]},  # Should be ignored
        ]

        filtered = self.engine.filter_supported_assets(raw_detections)
        self.assertEqual(len(filtered), 3)

        class_names = [d["class_name"] for d in filtered]
        self.assertIn("monitor", class_names)
        self.assertIn("chair", class_names)
        self.assertNotIn("dog", class_names)

        counts = self.engine.count_assets(filtered)
        self.assertEqual(counts["monitor"], 1)
        self.assertEqual(counts["chair"], 2)

        avg_conf = self.engine.calculate_average_confidence(filtered)
        self.assertEqual(avg_conf["monitor"], 0.92)
        self.assertEqual(avg_conf["chair"], 0.80)


class CameraServiceTestCase(TestCase):
    """Test cases for CameraService stream handling and exception safety."""

    @patch("cv2.VideoCapture")
    def test_camera_connection_failure(self, mock_videocapture):
        mock_cap = MagicMock()
        mock_cap.isOpened.return_value = False
        mock_videocapture.return_value = mock_cap

        service = CameraService(source="rtsp://invalid_ip:554/stream")
        with self.assertRaises(CameraConnectionError):
            service.connect()

    @patch("cv2.VideoCapture")
    def test_camera_frame_capture_success(self, mock_videocapture):
        mock_cap = MagicMock()
        mock_cap.isOpened.return_value = True
        dummy_frame = np.zeros((480, 640, 3), dtype=np.uint8)
        mock_cap.read.return_value = (True, dummy_frame)
        mock_videocapture.return_value = mock_cap

        service = CameraService(source=0)
        frame = service.capture_frame()
        self.assertIsNotNone(frame)
        self.assertEqual(frame.shape, (480, 640, 3))


class ReferenceDetectorTestCase(TestCase):
    """Integration test case for ReferenceDetector workflow."""

    def setUp(self):
        self.lab = Lab.objects.create(
            name="Security AI Lab",
            building="Tech Block",
            room_number="101",
            total_computers=20
        )
        self.camera = Camera.objects.create(
            lab=self.lab,
            name="Main Overhead Cam",
            serial_number="CAM-101-MAIN",
            location="Room 101 Ceiling",
            status="Online"
        )

    @patch.object(CameraService, "capture_frame")
    @patch.object(CameraService, "connect", return_value=True)
    @patch("ai_engine.utils.cv2.imwrite", return_value=True)
    def test_full_reference_workflow(self, mock_imwrite, mock_connect, mock_capture):
        dummy_frame = np.zeros((480, 640, 3), dtype=np.uint8)
        mock_capture.return_value = dummy_frame

        mock_detector_engine = MagicMock()
        mock_detector_engine.detect.return_value = [
            {"raw_class_name": "tv", "class_name": "monitor", "confidence": 0.90, "bbox": [0, 0, 10, 10]},
            {"raw_class_name": "keyboard", "class_name": "keyboard", "confidence": 0.88, "bbox": [10, 10, 20, 20]},
        ]
        mock_detector_engine.filter_supported_assets.side_effect = lambda dets: dets
        mock_detector_engine.count_assets.return_value = {"monitor": 1, "keyboard": 1}
        mock_detector_engine.calculate_average_confidence.return_value = {"monitor": 0.90, "keyboard": 0.88}

        ref_detector = ReferenceDetector(detector_engine=mock_detector_engine)
        result = ref_detector.create_reference_profile(camera=self.camera, camera_source=0)

        self.assertTrue(result["success"])
        self.assertIn("reference_profile", result)
        self.assertEqual(result["counts"]["monitor"], 1)
        self.assertEqual(result["counts"]["keyboard"], 1)

        # Check DB persistence
        profile = ReferenceProfile.objects.filter(camera=self.camera).first()
        self.assertIsNotNone(profile)
        self.assertEqual(profile.assets.count(), 2)


from ai_engine.monitoring_engine import MonitoringEngine
from incidents.models import Incident
from evidence.models import Evidence


class MonitoringEngineTestCase(TestCase):
    """Test cases for MonitoringEngine comparison logic, verification window, and incident creation."""

    def setUp(self):
        self.lab = Lab.objects.create(
            name="Robotics Lab",
            building="Engineering Hall",
            room_number="202",
            total_computers=20
        )
        self.camera = Camera.objects.create(
            lab=self.lab,
            name="Ceiling Cam 1",
            serial_number="CAM-202-ROBOTICS",
            location="Room 202 Ceiling",
            status="Online"
        )
        self.asset_mouse = Asset.objects.create(
            lab=self.lab,
            name="Mouse",
            category="Mouse",
            asset_tag="TAG-MOUSE-202",
            expected_quantity=20
        )
        self.asset_keyboard = Asset.objects.create(
            lab=self.lab,
            name="Keyboard",
            category="Keyboard",
            asset_tag="TAG-KB-202",
            expected_quantity=20
        )
        self.ref_profile = ReferenceProfile.objects.create(
            camera=self.camera,
            reference_image="reference_images/test_ref.jpg",
            is_active=True
        )
        ReferenceAsset.objects.create(
            reference=self.ref_profile,
            asset=self.asset_mouse,
            detected_quantity=20,
            confidence=0.95
        )
        ReferenceAsset.objects.create(
            reference=self.ref_profile,
            asset=self.asset_keyboard,
            detected_quantity=20,
            confidence=0.92
        )

        self.mock_detector_engine = MagicMock()
        self.monitoring_engine = MonitoringEngine(
            detector_engine=self.mock_detector_engine,
            verification_frames=3,
            monitor_interval=1.0
        )

    @patch("ai_engine.monitoring_engine.save_evidence_image", return_value="evidence/images/test_evid.jpg")
    def test_verification_window_and_incident_trigger(self, mock_save_evidence):
        dummy_frame = np.zeros((480, 640, 3), dtype=np.uint8)

        # Current counts: Mouse missing 1 (19 detected vs 20 expected), Keyboard present (20 detected)
        self.mock_detector_engine.detect.return_value = []
        self.mock_detector_engine.filter_supported_assets.return_value = []
        self.mock_detector_engine.count_assets.return_value = {"mouse": 19, "keyboard": 20}
        self.mock_detector_engine.calculate_average_confidence.return_value = {"mouse": 0.92, "keyboard": 0.90}

        # Frame 1: Missing detected, verification counter = 1 (threshold 3, no incident yet)
        res1 = self.monitoring_engine.monitor_camera_cycle(camera=self.camera, frame=dummy_frame)
        self.assertTrue(res1["success"])
        self.assertFalse(res1["verification_passed"])
        self.assertFalse(res1["incident_created"])
        self.assertEqual(Incident.objects.count(), 0)

        # Frame 2: Missing detected again, verification counter = 2
        res2 = self.monitoring_engine.monitor_camera_cycle(camera=self.camera, frame=dummy_frame)
        self.assertFalse(res2["verification_passed"])
        self.assertFalse(res2["incident_created"])
        self.assertEqual(Incident.objects.count(), 0)

        # Frame 3: Missing detected 3rd consecutive time -> Verification passes & Incident created!
        res3 = self.monitoring_engine.monitor_camera_cycle(camera=self.camera, frame=dummy_frame)
        self.assertTrue(res3["verification_passed"])
        self.assertTrue(res3["incident_created"])

        # Assert Incident and Evidence created in DB
        self.assertEqual(Incident.objects.count(), 1)
        incident = Incident.objects.first()
        self.assertEqual(incident.asset, self.asset_mouse)
        self.assertEqual(incident.detected_quantity, 19)
        self.assertEqual(incident.expected_quantity, 20)
        self.assertEqual(incident.status, "Open")

        self.assertEqual(Evidence.objects.count(), 1)
        evidence = Evidence.objects.first()
        self.assertEqual(evidence.incident, incident)


from ai_engine.video_evidence_service import VideoEvidenceService


class VideoEvidenceServiceTestCase(TestCase):
    """Test cases for VideoEvidenceService circular buffer and MP4 video compilation."""

    def setUp(self):
        self.lab = Lab.objects.create(
            name="Network Lab",
            building="CS Block",
            room_number="303",
            total_computers=15
        )
        self.camera = Camera.objects.create(
            lab=self.lab,
            name="Cam 303",
            serial_number="CAM-303",
            location="Room 303 Wall",
            status="Online"
        )
        self.asset = Asset.objects.create(
            lab=self.lab,
            name="Laptop",
            category="Laptop",
            asset_tag="TAG-LAPTOP-303",
            expected_quantity=10
        )
        self.incident = Incident.objects.create(
            lab=self.lab,
            camera=self.camera,
            asset=self.asset,
            expected_quantity=10,
            detected_quantity=9,
            confidence=0.95,
            description="1 Laptop missing",
            status="Open"
        )
        self.evidence = Evidence.objects.create(
            incident=self.incident,
            image="evidence/images/test_image.jpg",
            confidence=0.95,
            captured_at=Incident.objects.first().detected_at
        )

        self.service = VideoEvidenceService(
            pre_event_seconds=2,
            post_event_seconds=1,
            video_fps=5,
            video_codec="mp4v"
        )

    @patch("ai_engine.video_evidence_service.cv2.VideoWriter")
    def test_buffer_push_and_synchronous_compilation(self, mock_videowriter_cls):
        mock_writer = MagicMock()
        mock_writer.isOpened.return_value = True
        mock_videowriter_cls.return_value = mock_writer

        dummy_frame = np.zeros((240, 320, 3), dtype=np.uint8)

        # Push 15 frames into circular buffer (buffer maxlen = 2s * 5fps = 10)
        for _ in range(15):
            self.service.add_frame(self.camera.id, dummy_frame)

        # Pre-event buffer should hold at most 10 frames
        buf = self.service.get_pre_event_buffer(self.camera.id)
        self.assertEqual(len(buf), 10)

        # Execute compilation synchronously
        result_path = self.service.record_evidence_video(
            camera=self.camera,
            incident=self.incident,
            evidence=self.evidence,
            current_frame=dummy_frame,
            async_record=False
        )

        self.assertTrue(result_path.startswith("evidence/videos/incident_"))

        # Verify Evidence model video field updated in DB
        self.evidence.refresh_from_db()
        self.assertEqual(self.evidence.video, result_path)


from ai_engine.monitoring_scheduler import MonitoringScheduler


class MonitoringSchedulerTestCase(TestCase):
    """Test cases for MonitoringScheduler thread lifecycle, camera recovery, and dynamic discovery."""

    def setUp(self):
        self.lab = Lab.objects.create(
            name="Main AI Lab",
            building="Tech Tower",
            room_number="404",
            total_computers=25
        )
        self.online_camera = Camera.objects.create(
            lab=self.lab,
            name="Online Cam 1",
            serial_number="CAM-404-1",
            location="Room 404 North",
            status="Online"
        )
        self.offline_camera = Camera.objects.create(
            lab=self.lab,
            name="Offline Cam 2",
            serial_number="CAM-404-2",
            location="Room 404 South",
            status="Offline"
        )

        self.mock_monitoring_engine = MagicMock()
        self.scheduler = MonitoringScheduler(
            monitoring_engine=self.mock_monitoring_engine,
            monitor_interval=0.1
        )

    def test_scheduler_lifecycle_and_camera_sync(self):
        self.assertFalse(self.scheduler.running)

        # Start scheduler
        started = self.scheduler.start()
        self.assertTrue(started)
        self.assertTrue(self.scheduler.running)

        # Trigger dynamic sync manually
        self.scheduler._sync_cameras()

        status = self.scheduler.get_status()
        self.assertTrue(status["scheduler_running"])
        self.assertEqual(status["total_active_workers"], 1)
        self.assertIn(str(self.online_camera.id), status["cameras"])
        self.assertNotIn(str(self.offline_camera.id), status["cameras"])

        # Change online_camera to Offline in DB
        self.online_camera.status = "Offline"
        self.online_camera.save()

        # Trigger sync again -> should stop worker
        self.scheduler._sync_cameras()
        time.sleep(0.2)

        status_after = self.scheduler.get_status()
        self.assertEqual(status_after["total_active_workers"], 0)

        # Stop scheduler
        stopped = self.scheduler.stop()
        self.assertTrue(stopped)
        self.assertFalse(self.scheduler.running)




"""Unit test suite for Notification model and NotificationManager service."""

from datetime import timedelta
from django.test import TestCase
from django.utils import timezone

from cameras.models import Camera
from incidents.models import Incident
from labs.models import Lab
from notifications.models import Notification
from notifications.notification_manager import NotificationManager
from notifications.services import (
    notify_asset_missing,
    notify_camera_offline,
    notify_camera_reconnected,
    notify_monitoring_started,
    notify_monitoring_stopped,
)


class NotificationManagerTestCase(TestCase):
    """Test cases for NotificationManager duplicate suppression, filtering, and marking as read."""

    def setUp(self):
        self.lab = Lab.objects.create(
            name="Control Room Lab",
            building="Central Block",
            room_number="505",
            total_computers=10
        )
        self.camera = Camera.objects.create(
            lab=self.lab,
            name="Control Cam 1",
            serial_number="CAM-505-1",
            location="Room 505 Door",
            status="Online"
        )
        self.manager = NotificationManager(default_cooldown_seconds=300)

    def test_create_notification_and_cooldown(self):
        # 1st notification should succeed
        n1 = self.manager.create_notification(
            title="Camera Offline: Control Cam 1",
            message="Stream lost",
            severity="WARNING",
            notification_type="Camera Offline",
            camera=self.camera,
            cooldown_seconds=300
        )
        self.assertIsNotNone(n1)
        self.assertEqual(Notification.objects.count(), 1)

        # 2nd notification within 300s window should be suppressed by cooldown
        n2 = self.manager.create_notification(
            title="Camera Offline: Control Cam 1",
            message="Stream lost again",
            severity="WARNING",
            notification_type="Camera Offline",
            camera=self.camera,
            cooldown_seconds=300
        )
        self.assertIsNone(n2)
        self.assertEqual(Notification.objects.count(), 1)

    def test_mark_as_read_and_filtering(self):
        n = self.manager.create_notification(
            title="Test Event",
            message="Test Message",
            severity="INFO",
            notification_type="Monitoring Started",
            lab=self.lab,
            cooldown_seconds=0
        )
        self.assertFalse(n.is_read)

        # Unread count
        unread = self.manager.get_unread_notifications(lab_id=self.lab.id)
        self.assertEqual(unread.count(), 1)

        # Mark as read
        updated_n = self.manager.mark_as_read(n.id)
        self.assertTrue(updated_n.is_read)
        self.assertIsNotNone(updated_n.read_at)

        # Unread count after update
        unread_after = self.manager.get_unread_notifications(lab_id=self.lab.id)
        self.assertEqual(unread_after.count(), 0)

    def test_delete_old_notifications(self):
        n_old = self.manager.create_notification(
            title="Old Event",
            message="Old Message",
            severity="INFO",
            notification_type="Monitoring Stopped",
            lab=self.lab,
            cooldown_seconds=0
        )
        # Manually backdate created_at timestamp to 40 days ago
        Notification.objects.filter(id=n_old.id).update(
            created_at=timezone.now() - timedelta(days=40)
        )

        n_new = self.manager.create_notification(
            title="New Event",
            message="New Message",
            severity="INFO",
            notification_type="Monitoring Started",
            lab=self.lab,
            cooldown_seconds=0
        )

        deleted_count = self.manager.delete_old_notifications(days=30)
        self.assertEqual(deleted_count, 1)
        self.assertEqual(Notification.objects.count(), 1)
        self.assertEqual(Notification.objects.first().id, n_new.id)

    def test_service_helper_wrappers(self):
        notify_monitoring_started()
        notify_monitoring_stopped()
        notify_camera_offline(self.camera)

        self.assertEqual(Notification.objects.count(), 3)
        types = list(Notification.objects.values_list("notification_type", flat=True))
        self.assertIn("Monitoring Started", types)
        self.assertIn("Monitoring Stopped", types)
        self.assertIn("Camera Offline", types)

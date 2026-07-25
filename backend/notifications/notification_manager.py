"""NotificationManager service class handling creation, duplicate suppression, querying, and lifecycle of notifications."""

from datetime import timedelta
import logging
from typing import Optional
from django.conf import settings
from django.db.models import QuerySet
from django.utils import timezone

from cameras.models import Camera
from incidents.models import Incident
from labs.models import Lab
from notifications.models import Notification

logger = logging.getLogger(__name__)


class NotificationManager:
    """Manager class providing centralized business logic for creating, duplicate filtering,

    reading, and purging system notifications.
    """

    def __init__(self, default_cooldown_seconds: Optional[int] = None) -> None:
        """Initialize NotificationManager.

        Args:
            default_cooldown_seconds: Default cooldown in seconds. Defaults to settings.NOTIFICATION_COOLDOWN_SECONDS.
        """
        self.default_cooldown_seconds = (
            default_cooldown_seconds
            if default_cooldown_seconds is not None
            else int(getattr(settings, "NOTIFICATION_COOLDOWN_SECONDS", 300))
        )

    def create_notification(
        self,
        title: str,
        message: str,
        severity: str,
        notification_type: str,
        lab: Optional[Lab] = None,
        camera: Optional[Camera] = None,
        incident: Optional[Incident] = None,
        cooldown_seconds: Optional[int] = None
    ) -> Optional[Notification]:
        """Create a new notification with duplicate protection cooldown.

        Args:
            title: Notification title string.
            message: Detailed message content.
            severity: Severity level ('INFO', 'WARNING', 'CRITICAL').
            notification_type: Event type ('Asset Missing', 'Camera Offline', etc.).
            lab: Optional Lab model instance.
            camera: Optional Camera model instance.
            incident: Optional Incident model instance.
            cooldown_seconds: Optional custom cooldown in seconds to prevent duplicates.

        Returns:
            Optional[Notification]: Created Notification instance, or None if suppressed by cooldown.
        """
        effective_cooldown = (
            cooldown_seconds if cooldown_seconds is not None else self.default_cooldown_seconds
        )

        # Infer lab from camera or incident if not explicitly provided
        if lab is None:
            if camera is not None:
                lab = camera.lab
            elif incident is not None:
                lab = incident.lab

        # Duplicate protection check
        if effective_cooldown > 0:
            cutoff_time = timezone.now() - timedelta(seconds=effective_cooldown)
            recent_duplicate = Notification.objects.filter(
                notification_type=notification_type,
                camera=camera,
                lab=lab,
                created_at__gte=cutoff_time
            ).exists()

            if recent_duplicate:
                logger.info(
                    "Suppressed duplicate notification '%s' for type '%s' on camera %s (Cooldown %ds).",
                    title, notification_type, camera.id if camera else "N/A", effective_cooldown
                )
                return None

        try:
            notification = Notification.objects.create(
                title=title,
                message=message,
                severity=severity,
                notification_type=notification_type,
                lab=lab,
                camera=camera,
                incident=incident,
                is_read=False
            )
            logger.info(
                "Notification created [ID #%d]: [%s] %s (Type: %s)",
                notification.id, severity, title, notification_type
            )
            logger.info("Notification sent for ID #%d via system notification engine.", notification.id)
            return notification

        except Exception as exc:
            logger.error("Failed to create notification '%s': %s", title, str(exc))
            return None

    def mark_as_read(self, notification_id: int) -> Optional[Notification]:
        """Mark a single notification as read.

        Args:
            notification_id: Primary key of Notification.

        Returns:
            Optional[Notification]: Updated Notification instance or None.
        """
        try:
            notification = Notification.objects.get(id=notification_id)
            if not notification.is_read:
                notification.is_read = True
                notification.read_at = timezone.now()
                notification.save(update_fields=["is_read", "read_at"])
                logger.info("Notification ID #%d marked as read.", notification_id)
            return notification

        except Notification.DoesNotExist:
            logger.warning("Notification ID #%d does not exist.", notification_id)
            return None
        except Exception as exc:
            logger.error("Error marking notification ID #%d as read: %s", notification_id, str(exc))
            return None

    def mark_all_as_read(self, lab_id: Optional[int] = None) -> int:
        """Mark all unread notifications as read.

        Args:
            lab_id: Optional filter for a specific lab ID.

        Returns:
            int: Total count of notifications updated.
        """
        queryset = Notification.objects.filter(is_read=False)
        if lab_id is not None:
            queryset = queryset.filter(lab_id=lab_id)

        count = queryset.update(is_read=True, read_at=timezone.now())
        logger.info("Marked %d notifications as read.", count)
        return count

    def get_unread_notifications(self, lab_id: Optional[int] = None) -> QuerySet[Notification]:
        """Get unread notifications queryset.

        Args:
            lab_id: Optional filter for a specific lab ID.

        Returns:
            QuerySet[Notification]: QuerySet of unread notifications.
        """
        queryset = Notification.objects.filter(is_read=False)
        if lab_id is not None:
            queryset = queryset.filter(lab_id=lab_id)
        return queryset

    def get_recent_notifications(self, limit: int = 50) -> QuerySet[Notification]:
        """Get recent notifications ordered by newest first.

        Args:
            limit: Maximum records to return.

        Returns:
            QuerySet[Notification]: QuerySet of recent notifications.
        """
        return Notification.objects.select_related("lab", "camera", "incident")[:limit]

    def delete_old_notifications(self, days: int = 30) -> int:
        """Delete notifications older than specified number of days.

        Args:
            days: Retention age threshold in days.

        Returns:
            int: Number of deleted notifications.
        """
        cutoff_date = timezone.now() - timedelta(days=days)
        old_queryset = Notification.objects.filter(created_at__lt=cutoff_date)
        count, _ = old_queryset.delete()
        logger.info("Deleted %d notifications older than %d days.", count, days)
        return count

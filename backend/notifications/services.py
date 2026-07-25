"""Notification services module exposing NotificationManager and service helper functions."""

from notifications.notification_manager import NotificationManager

# Global singleton service instance
notification_service = NotificationManager()


def notify_asset_missing(incident) -> None:
    """Helper function to create an Asset Missing notification for an Incident."""
    notification_service.create_notification(
        title=f"Asset Missing: {incident.asset.name}",
        message=(
            f"{incident.expected_quantity - incident.detected_quantity} {incident.asset.name}(s) missing "
            f"in {incident.lab.name} (Camera: {incident.camera.name})."
        ),
        severity="CRITICAL",
        notification_type="Asset Missing",
        lab=incident.lab,
        camera=incident.camera,
        incident=incident,
        cooldown_seconds=0  # Every confirmed incident receives a critical notification
    )


def notify_camera_offline(camera) -> None:
    """Helper function to create a Camera Offline notification."""
    notification_service.create_notification(
        title=f"Camera Offline: {camera.name}",
        message=f"Camera '{camera.name}' in {camera.lab.name} has disconnected or failed stream capture.",
        severity="WARNING",
        notification_type="Camera Offline",
        lab=camera.lab,
        camera=camera,
        cooldown_seconds=None  # Uses default cooldown (300s)
    )


def notify_camera_reconnected(camera) -> None:
    """Helper function to create a Camera Reconnected notification."""
    notification_service.create_notification(
        title=f"Camera Reconnected: {camera.name}",
        message=f"Camera '{camera.name}' in {camera.lab.name} stream has been restored and resumed monitoring.",
        severity="INFO",
        notification_type="Camera Reconnected",
        lab=camera.lab,
        camera=camera,
        cooldown_seconds=0
    )


def notify_reference_updated(reference_profile) -> None:
    """Helper function to create a Reference Updated notification."""
    notification_service.create_notification(
        title=f"Reference Profile Updated: {reference_profile.camera.name}",
        message=f"New reference profile created for camera '{reference_profile.camera.name}' with {reference_profile.assets.count()} tracked asset(s).",
        severity="INFO",
        notification_type="Reference Updated",
        lab=reference_profile.camera.lab,
        camera=reference_profile.camera,
        cooldown_seconds=0
    )


def notify_monitoring_started() -> None:
    """Helper function to create a Monitoring Started notification."""
    notification_service.create_notification(
        title="Monitoring Started",
        message="Multi-camera monitoring scheduler has started executing monitoring cycles.",
        severity="INFO",
        notification_type="Monitoring Started",
        cooldown_seconds=0
    )


def notify_monitoring_stopped() -> None:
    """Helper function to create a Monitoring Stopped notification."""
    notification_service.create_notification(
        title="Monitoring Stopped",
        message="Multi-camera monitoring scheduler has been stopped.",
        severity="INFO",
        notification_type="Monitoring Stopped",
        cooldown_seconds=0
    )

"""Notification models for lab security alerts and event logging."""

from django.db import models
from cameras.models import Camera
from incidents.models import Incident
from labs.models import Lab


class Notification(models.Model):
    """Model representing real-time system alerts, camera events, and security notifications."""

    SEVERITY_CHOICES = [
        ("INFO", "INFO"),
        ("WARNING", "WARNING"),
        ("CRITICAL", "CRITICAL"),
    ]

    TYPE_CHOICES = [
        ("Asset Missing", "Asset Missing"),
        ("Camera Offline", "Camera Offline"),
        ("Camera Reconnected", "Camera Reconnected"),
        ("Reference Updated", "Reference Updated"),
        ("Monitoring Started", "Monitoring Started"),
        ("Monitoring Stopped", "Monitoring Stopped"),
    ]

    incident = models.ForeignKey(
        Incident,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="notifications"
    )

    lab = models.ForeignKey(
        Lab,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="notifications"
    )

    camera = models.ForeignKey(
        Camera,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="notifications"
    )

    title = models.CharField(max_length=200)

    message = models.TextField()

    severity = models.CharField(
        max_length=20,
        choices=SEVERITY_CHOICES,
        default="INFO"
    )

    notification_type = models.CharField(
        max_length=50,
        choices=TYPE_CHOICES
    )

    is_read = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Notification"
        verbose_name_plural = "Notifications"

    def __str__(self) -> str:
        return f"[{self.severity}] {self.title} - {self.created_at.strftime('%Y-%m-%d %H:%M')}"

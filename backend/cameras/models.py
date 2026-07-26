from django.db import models
from labs.models import Lab


class Camera(models.Model):
    STATUS_CHOICES = [
        ("Online", "Online"),
        ("Offline", "Offline"),
        ("Connecting", "Connecting"),
        ("Error", "Error"),
    ]

    lab = models.ForeignKey(
        Lab,
        on_delete=models.CASCADE,
        related_name="cameras"
    )

    name = models.CharField(max_length=100)
    serial_number = models.CharField(max_length=100, blank=True, null=True)
    brand = models.CharField(max_length=100, blank=True, default="")
    model_name = models.CharField(max_length=100, blank=True, default="")
    ip_address = models.CharField(max_length=100, default="192.168.1.100", blank=True)
    rtsp_url = models.CharField(max_length=255, default="rtsp://192.168.1.100:554/stream", blank=True)
    username = models.CharField(max_length=100, blank=True, default="")
    password = models.CharField(max_length=100, blank=True, default="")
    location = models.CharField(max_length=200, default="Overhead Ceiling View", blank=True)
    resolution = models.CharField(max_length=50, default="1920x1080", blank=True)
    fps = models.PositiveIntegerField(default=20)
    is_active = models.BooleanField(default=True)

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="Online"
    )

    reference_image = models.ImageField(
        upload_to="reference_images/",
        blank=True,
        null=True
    )

    last_seen = models.DateTimeField(
        blank=True,
        null=True
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.lab.name} - {self.name}"
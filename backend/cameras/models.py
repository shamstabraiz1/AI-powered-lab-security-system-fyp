from django.db import models
from labs.models import Lab


class Camera(models.Model):
    STATUS_CHOICES = [
        ("Online", "Online"),
        ("Offline", "Offline"),
    ]

    lab = models.ForeignKey(
        Lab,
        on_delete=models.CASCADE,
        related_name="cameras"
    )

    name = models.CharField(max_length=100)
    serial_number = models.CharField(max_length=100, unique=True)
    
    location = models.CharField(max_length=200)

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="Offline"
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
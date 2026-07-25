from django.db import models
from labs.models import Lab
from cameras.models import Camera
from assets.models import Asset


class Incident(models.Model):

    STATUS_CHOICES = [
        ("Open", "Open"),
        ("Investigating", "Investigating"),
        ("Resolved", "Resolved"),
    ]

    lab = models.ForeignKey(
        Lab,
        on_delete=models.CASCADE
    )

    camera = models.ForeignKey(
        Camera,
        on_delete=models.CASCADE
    )

    asset = models.ForeignKey(
        Asset,
        on_delete=models.CASCADE
    )

    expected_quantity = models.PositiveIntegerField()

    detected_quantity = models.PositiveIntegerField()

    confidence = models.FloatField()

    description = models.TextField()

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="Open"
    )

    detected_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return f"{self.asset.name} Missing - {self.lab.name}"
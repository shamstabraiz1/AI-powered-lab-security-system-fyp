from django.db import models
from cameras.models import Camera
from assets.models import Asset


class ReferenceProfile(models.Model):
    camera = models.ForeignKey(
        Camera,
        on_delete=models.CASCADE,
        related_name="reference_profiles"
    )

    reference_image = models.ImageField(
        upload_to="reference_images/"
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    is_active = models.BooleanField(
        default=True
    )

    def __str__(self):
        return f"Reference - {self.camera.name}"


class ReferenceAsset(models.Model):
    reference = models.ForeignKey(
        ReferenceProfile,
        on_delete=models.CASCADE,
        related_name="assets"
    )

    asset = models.ForeignKey(
        Asset,
        on_delete=models.CASCADE
    )

    detected_quantity = models.PositiveIntegerField()

    confidence = models.FloatField()

    def __str__(self):
        return f"{self.asset.name} ({self.detected_quantity})"
from django.db import models
from labs.models import Lab
from cameras.models import Camera
from assets.models import Asset


class ReferenceProfile(models.Model):
    name = models.CharField(max_length=100, default="Standard Baseline Profile")
    lab = models.ForeignKey(
        Lab,
        on_delete=models.CASCADE,
        related_name="reference_profiles",
        blank=True,
        null=True
    )
    camera = models.ForeignKey(
        Camera,
        on_delete=models.CASCADE,
        related_name="reference_profiles",
        blank=True,
        null=True
    )

    reference_image = models.ImageField(
        upload_to="reference_images/",
        blank=True,
        null=True
    )

    description = models.TextField(blank=True, default="")
    created_by = models.CharField(max_length=100, default="Dr. Tabraiz Shams")
    created_at = models.DateTimeField(auto_now_add=True)
    last_updated = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} ({self.lab.name if self.lab else 'No Lab'})"


class ReferenceAsset(models.Model):
    reference = models.ForeignKey(
        ReferenceProfile,
        on_delete=models.CASCADE,
        related_name="assets"
    )

    asset = models.ForeignKey(
        Asset,
        on_delete=models.CASCADE,
        blank=True,
        null=True
    )

    asset_name = models.CharField(max_length=100, default="Monitor", blank=True)
    category = models.CharField(max_length=50, default="computer", blank=True)
    detected_quantity = models.PositiveIntegerField(default=1)
    confidence = models.FloatField(default=0.95)

    def __str__(self):
        return f"{self.asset_name} ({self.detected_quantity})"
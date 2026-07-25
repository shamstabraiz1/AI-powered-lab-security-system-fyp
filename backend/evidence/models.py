from django.db import models
from incidents.models import Incident


class Evidence(models.Model):
    incident = models.ForeignKey(
        Incident,
        on_delete=models.CASCADE,
        related_name="evidence"
    )

    image = models.ImageField(
        upload_to="evidence/images/"
    )

    video = models.FileField(
        upload_to="evidence/videos/",
        blank=True,
        null=True
    )

    confidence = models.FloatField()

    captured_at = models.DateTimeField()

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Evidence - Incident #{self.incident.id}"
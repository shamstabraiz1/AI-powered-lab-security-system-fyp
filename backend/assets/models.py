from django.db import models
from labs.models import Lab


class Asset(models.Model):
    STATUS_CHOICES = [
        ("Available", "Available"),
        ("Missing", "Missing"),
    ]

    lab = models.ForeignKey(
        Lab,
        on_delete=models.CASCADE,
        related_name="assets"
    )

    name = models.CharField(max_length=100)

    category = models.CharField(
        max_length=100
    )

    asset_tag = models.CharField(
        max_length=100,
        unique=True
    )

    expected_quantity = models.PositiveIntegerField(
        default=1
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="Available"
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return f"{self.name} ({self.lab.name})"
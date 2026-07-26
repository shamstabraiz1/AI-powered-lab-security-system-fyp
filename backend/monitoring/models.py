import random
from django.db import models
from labs.models import Lab


class LabSession(models.Model):
    STATUS_CHOICES = [
        ("Created", "Created"),
        ("Active", "Active"),
        ("Paused", "Paused"),
        ("Completed", "Completed"),
    ]

    session_id = models.CharField(max_length=50, unique=True, blank=True)
    instructor_name = models.CharField(max_length=100)
    course_name = models.CharField(max_length=100)
    course_code = models.CharField(max_length=50, blank=True, default="")
    lab = models.ForeignKey(Lab, on_delete=models.CASCADE, related_name="sessions")
    session_topic = models.CharField(max_length=200)
    planned_duration = models.PositiveIntegerField(default=120) # minutes
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="Active")
    created_at = models.DateTimeField(auto_now_add=True)
    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField(blank=True, null=True)

    def save(self, *args, **kwargs):
        if not self.session_id:
            self.session_id = f"SES-{random.randint(1000, 9999)}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.session_id} - {self.course_name} ({self.lab.name})"

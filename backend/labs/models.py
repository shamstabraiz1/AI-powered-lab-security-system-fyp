from django.db import models


class Lab(models.Model):
    name = models.CharField(max_length=100)
    building = models.CharField(max_length=100)
    room_number = models.CharField(max_length=20)
    total_computers = models.PositiveIntegerField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name
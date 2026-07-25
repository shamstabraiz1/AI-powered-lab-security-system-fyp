"""Serializers for Dashboard, User Profile, and Analytics endpoints."""

from django.contrib.auth.models import Group, User
from rest_framework import serializers


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for user profile and assigned roles."""

    roles = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "is_staff",
            "is_superuser",
            "roles",
        ]

    def get_roles(self, obj: User) -> list[str]:
        roles = list(obj.groups.values_list("name", flat=True))
        if obj.is_superuser:
            roles.append("Admin")
        elif not roles:
            roles.append("Security Officer")
        return list(set(roles))


class DashboardResponseSerializer(serializers.Serializer):
    """Serializer for Dashboard overview metrics."""

    online_cameras = serializers.IntegerField()
    offline_cameras = serializers.IntegerField()
    active_incidents = serializers.IntegerField()
    todays_incidents = serializers.IntegerField()
    total_assets = serializers.IntegerField()
    total_labs = serializers.IntegerField()
    detection_accuracy = serializers.FloatField()
    system_health = serializers.CharField()
    scheduler_status = serializers.DictField()
    recent_incidents = serializers.ListField()
    recent_notifications = serializers.ListField()


class AnalyticsResponseSerializer(serializers.Serializer):
    """Serializer for Analytics data aggregation."""

    detection_accuracy_percentage = serializers.FloatField()
    total_incidents = serializers.IntegerField()
    incidents_by_lab = serializers.ListField()
    incidents_by_category = serializers.ListField()
    severity_breakdown = serializers.DictField()
    seven_day_trend = serializers.ListField()

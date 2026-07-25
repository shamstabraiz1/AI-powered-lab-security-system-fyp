"""Serializers for AI Engine monitoring and scheduler endpoints."""

from rest_framework import serializers


class MonitoringStartResponseSerializer(serializers.Serializer):
    """Serializer for Monitoring Start response."""

    success = serializers.BooleanField()
    message = serializers.CharField()


class MonitoringStopResponseSerializer(serializers.Serializer):
    """Serializer for Monitoring Stop response."""

    success = serializers.BooleanField()
    message = serializers.CharField()


class SchedulerStatusSerializer(serializers.Serializer):
    """Serializer for Scheduler status response."""

    scheduler_running = serializers.BooleanField()
    total_active_workers = serializers.IntegerField()
    monitor_interval_seconds = serializers.FloatField()
    discovery_interval_seconds = serializers.FloatField()
    cameras = serializers.DictField()

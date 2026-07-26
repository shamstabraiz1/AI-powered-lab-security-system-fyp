from rest_framework import serializers
from labs.serializers import LabSerializer
from monitoring.models import LabSession


class LabSessionSerializer(serializers.ModelSerializer):
    lab_details = LabSerializer(source="lab", read_only=True)
    cameras_count = serializers.SerializerMethodField()

    class Meta:
        model = LabSession
        fields = [
            "id",
            "session_id",
            "instructor_name",
            "course_name",
            "course_code",
            "lab",
            "lab_details",
            "session_topic",
            "planned_duration",
            "status",
            "created_at",
            "start_time",
            "end_time",
            "cameras_count",
        ]
        read_only_fields = ["id", "session_id", "created_at", "start_time"]

    def get_cameras_count(self, obj: LabSession) -> int:
        return obj.lab.cameras.count() if obj.lab else 0

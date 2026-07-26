from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from core.permissions import IsAdminOrSecurityOfficer
from monitoring.models import LabSession
from monitoring.serializers import LabSessionSerializer


class LabSessionViewSet(viewsets.ModelViewSet):
    queryset = LabSession.objects.select_related("lab").all().order_by("-created_at")
    serializer_class = LabSessionSerializer
    permission_classes = [IsAdminOrSecurityOfficer]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["lab", "status"]
    search_fields = ["session_id", "instructor_name", "course_name", "session_topic", "lab__name"]
    ordering_fields = ["created_at", "status"]

    def create(self, request, *args, **kwargs):
        lab_id = request.data.get("lab")
        # Validation: Check if active session already exists in the target lab
        if lab_id and LabSession.objects.filter(lab_id=lab_id, status__in=["Active", "Paused"]).exists():
            return Response(
                {"error": "An active or paused lab session already exists for this laboratory facility."},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().create(request, *args, **kwargs)

    @action(detail=True, methods=["post"], url_path="pause")
    def pause_session(self, request, pk=None):
        session = self.get_object()
        session.status = "Paused"
        session.save()
        return Response({"message": f"Session #{session.session_id} paused.", "session": LabSessionSerializer(session).data})

    @action(detail=True, methods=["post"], url_path="resume")
    def resume_session(self, request, pk=None):
        session = self.get_object()
        session.status = "Active"
        session.save()
        return Response({"message": f"Session #{session.session_id} resumed.", "session": LabSessionSerializer(session).data})

    @action(detail=True, methods=["post"], url_path="end")
    def end_session(self, request, pk=None):
        session = self.get_object()
        session.status = "Completed"
        session.end_time = timezone.now()
        session.save()
        return Response({
            "message": f"Session #{session.session_id} ended. Final audit report generated.",
            "session": LabSessionSerializer(session).data
        })

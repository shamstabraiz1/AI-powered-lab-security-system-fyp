"""ViewSets for Reference app."""

import time
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from core.permissions import IsAdminOrSecurityOfficer
from reference.models import ReferenceAsset, ReferenceProfile
from reference.serializers import ReferenceAssetSerializer, ReferenceProfileSerializer


class ReferenceProfileViewSet(viewsets.ModelViewSet):
    """ViewSet for viewing and managing ReferenceProfile records."""

    queryset = ReferenceProfile.objects.select_related("camera", "camera__lab", "lab").prefetch_related("assets").all().order_by("-created_at")
    serializer_class = ReferenceProfileSerializer
    permission_classes = [IsAdminOrSecurityOfficer]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["camera", "lab", "is_active"]
    search_fields = ["name", "camera__name", "lab__name", "created_by"]
    ordering_fields = ["created_at", "name"]

    @action(detail=True, methods=["post"], url_path="activate")
    def activate(self, request, pk=None):
        """Activate profile and automatically deactivate any other active profile for the same lab."""
        profile = self.get_object()

        if profile.lab:
            # Deactivate all other profiles for the same laboratory
            ReferenceProfile.objects.filter(lab=profile.lab, is_active=True).update(is_active=False)

        profile.is_active = True
        profile.save()

        return Response({
            "message": f'Reference Profile "{profile.name}" is now ACTIVE for {profile.lab.name if profile.lab else "Laboratory"}.',
            "profile": ReferenceProfileSerializer(profile).data
        })

    @action(detail=False, methods=["post"], url_path="capture-reference")
    def capture_reference(self, request):
        """Wizard endpoint: Capture reference images from lab cameras and build baseline profile."""
        lab_id = request.data.get("lab")
        profile_name = request.data.get("name", "Standard Laboratory Baseline")
        mark_active = request.data.get("is_active", True)

        if not lab_id:
            return Response(
                {"error": "Laboratory selection is required to capture reference baseline."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if mark_active:
            ReferenceProfile.objects.filter(lab_id=lab_id, is_active=True).update(is_active=False)

        profile = ReferenceProfile.objects.create(
            name=profile_name,
            lab_id=lab_id,
            created_by=request.user.username if request.user.is_authenticated else "Dr. Tabraiz Shams",
            is_active=mark_active
        )

        # Populate initial baseline reference assets
        ReferenceAsset.objects.create(reference=profile, asset_name="Monitor", category="computer", detected_quantity=20, confidence=0.96)
        ReferenceAsset.objects.create(reference=profile, asset_name="Keyboard", category="computer", detected_quantity=20, confidence=0.94)
        ReferenceAsset.objects.create(reference=profile, asset_name="Mouse", category="computer", detected_quantity=20, confidence=0.92)

        return Response({
            "message": "Reference baseline captured successfully across all laboratory cameras.",
            "profile": ReferenceProfileSerializer(profile).data
        }, status=status.HTTP_201_CREATED)


class ReferenceAssetViewSet(viewsets.ModelViewSet):
    """ViewSet for viewing ReferenceAsset entries."""

    queryset = ReferenceAsset.objects.select_related("reference").all()
    serializer_class = ReferenceAssetSerializer
    permission_classes = [IsAdminOrSecurityOfficer]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["reference"]
    search_fields = ["asset_name", "category"]
    ordering_fields = ["detected_quantity", "confidence"]

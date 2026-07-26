"""Config URL Configuration for AI Powered Lab Security System API."""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path, re_path
from django.views.generic import TemplateView

from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from ai_engine.views import (
    MonitoringStartAPIView,
    MonitoringStatusAPIView,
    MonitoringStopAPIView,
    SchedulerRestartAPIView,
    SchedulerStatusAPIView,
)
from assets.views import AssetViewSet
from cameras.views import CameraViewSet
from core.views import AnalyticsAPIView, DashboardAPIView, UserProfileAPIView
from evidence.views import EvidenceViewSet
from incidents.views import IncidentViewSet
from labs.views import LabViewSet
from monitoring.views import LabSessionViewSet
from notifications.views import NotificationViewSet
from reference.views import ReferenceAssetViewSet, ReferenceProfileViewSet

# Initialize DRF DefaultRouter
router = DefaultRouter()
router.register(r"labs", LabViewSet, basename="lab")
router.register(r"cameras", CameraViewSet, basename="camera")
router.register(r"assets", AssetViewSet, basename="asset")
router.register(r"reference-profiles", ReferenceProfileViewSet, basename="reference-profile")
router.register(r"reference-assets", ReferenceAssetViewSet, basename="reference-asset")
router.register(r"incidents", IncidentViewSet, basename="incident")
router.register(r"evidence", EvidenceViewSet, basename="evidence")
router.register(r"notifications", NotificationViewSet, basename="notification")
router.register(r"sessions", LabSessionViewSet, basename="session")


urlpatterns = [
    # Admin Interface
    path("admin/", admin.site.urls),

    # JWT Authentication Endpoints
    path("api/auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/auth/profile/", UserProfileAPIView.as_view(), name="user_profile"),

    # Dashboard & Analytics Endpoints
    path("api/dashboard/", DashboardAPIView.as_view(), name="dashboard"),
    path("api/analytics/", AnalyticsAPIView.as_view(), name="analytics"),

    # AI Engine & Monitoring Endpoints
    path("api/monitoring/start/", MonitoringStartAPIView.as_view(), name="monitoring_start"),
    path("api/monitoring/stop/", MonitoringStopAPIView.as_view(), name="monitoring_stop"),
    path("api/monitoring/status/", MonitoringStatusAPIView.as_view(), name="monitoring_status"),

    # Scheduler Endpoints
    path("api/scheduler/status/", SchedulerStatusAPIView.as_view(), name="scheduler_status"),
    path("api/scheduler/restart/", SchedulerRestartAPIView.as_view(), name="scheduler_restart"),

    # OpenAPI / Swagger Documentation Endpoints
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),

    # Registered Router ViewSet API Endpoints
    path("api/", include(router.urls)),

    # Frontend Single Page Web App Index & SPA Catch-all Route
    path("", TemplateView.as_view(template_name="index.html"), name="index"),
    re_path(r"^(?:(?!api/|admin/|static/|media/).)*$", TemplateView.as_view(template_name="index.html"), name="spa_fallback"),
]

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATICFILES_DIRS[0])
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
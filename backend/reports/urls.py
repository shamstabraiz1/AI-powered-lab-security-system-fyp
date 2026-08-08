"""URL routing configuration for Reports application."""

from django.urls import path
from reports.views import (
    AssetMissingReportAPIView,
    EvidenceReportAPIView,
    IncidentReportAPIView,
    LabSecurityReportAPIView,
    LabSessionReportAPIView,
)

urlpatterns = [
    path("incident-report/", IncidentReportAPIView.as_view(), name="incident_report"),
    path("asset-missing-report/", AssetMissingReportAPIView.as_view(), name="asset_missing_report"),
    path("lab-security-report/", LabSecurityReportAPIView.as_view(), name="lab_security_report"),
    path("evidence-report/", EvidenceReportAPIView.as_view(), name="evidence_report"),
    path("lab-session-report/", LabSessionReportAPIView.as_view(), name="lab_session_report"),
]

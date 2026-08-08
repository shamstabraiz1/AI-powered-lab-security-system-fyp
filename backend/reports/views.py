"""API views for downloading real database-driven security PDF reports."""

import logging
from datetime import datetime
from django.http import HttpResponse
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from core.permissions import IsSecurityOfficer
from reports.services.asset_missing_report import generate_asset_missing_report_pdf
from reports.services.evidence_report import generate_evidence_report_pdf
from reports.services.incident_report import generate_incident_report_pdf
from reports.services.lab_security_report import generate_lab_security_report_pdf
from reports.services.lab_session_report import generate_lab_session_report_pdf

logger = logging.getLogger(__name__)


def _extract_filter_params(request):
    """Extracts and validates common report filter parameters from query params."""
    lab_id_raw = request.query_params.get("lab_id")
    from_date = request.query_params.get("from_date")
    to_date = request.query_params.get("to_date")

    lab_id = None
    if lab_id_raw and lab_id_raw.strip() and lab_id_raw != "all":
        try:
            lab_id = int(lab_id_raw)
        except ValueError:
            lab_id = None

    return lab_id, from_date, to_date


class IncidentReportAPIView(APIView):
    """Generates and serves downloadable Incident Audit PDF reports."""

    permission_classes = [IsSecurityOfficer]

    def get(self, request):
        lab_id, from_date, to_date = _extract_filter_params(request)
        logger.info(f"[REPORTS API] Generating Incident Report with lab_id={lab_id}, from={from_date}, to={to_date}")
        try:
            pdf_bytes = generate_incident_report_pdf(lab_id, from_date, to_date)
            timestamp_str = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"Incident_Audit_Report_{timestamp_str}.pdf"

            response = HttpResponse(pdf_bytes, content_type="application/pdf")
            response["Content-Disposition"] = f'attachment; filename="{filename}"'
            return response
        except Exception as err:
            logger.exception(f"[REPORTS API] Error generating Incident Report: {err}")
            return Response(
                {"error": "Failed to generate Incident Report", "detail": str(err)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class AssetMissingReportAPIView(APIView):
    """Generates and serves downloadable Asset Missing Audit PDF reports."""

    permission_classes = [IsSecurityOfficer]

    def get(self, request):
        lab_id, from_date, to_date = _extract_filter_params(request)
        logger.info(f"[REPORTS API] Generating Asset Missing Report with lab_id={lab_id}, from={from_date}, to={to_date}")
        try:
            pdf_bytes = generate_asset_missing_report_pdf(lab_id, from_date, to_date)
            timestamp_str = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"Asset_Missing_Report_{timestamp_str}.pdf"

            response = HttpResponse(pdf_bytes, content_type="application/pdf")
            response["Content-Disposition"] = f'attachment; filename="{filename}"'
            return response
        except Exception as err:
            logger.exception(f"[REPORTS API] Error generating Asset Missing Report: {err}")
            return Response(
                {"error": "Failed to generate Asset Missing Report", "detail": str(err)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class LabSecurityReportAPIView(APIView):
    """Generates and serves downloadable Laboratory Security Summary PDF reports."""

    permission_classes = [IsSecurityOfficer]

    def get(self, request):
        lab_id, from_date, to_date = _extract_filter_params(request)
        logger.info(f"[REPORTS API] Generating Laboratory Security Report with lab_id={lab_id}, from={from_date}, to={to_date}")
        try:
            pdf_bytes = generate_lab_security_report_pdf(lab_id, from_date, to_date)
            timestamp_str = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"Laboratory_Security_Report_{timestamp_str}.pdf"

            response = HttpResponse(pdf_bytes, content_type="application/pdf")
            response["Content-Disposition"] = f'attachment; filename="{filename}"'
            return response
        except Exception as err:
            logger.exception(f"[REPORTS API] Error generating Laboratory Security Report: {err}")
            return Response(
                {"error": "Failed to generate Laboratory Security Report", "detail": str(err)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class EvidenceReportAPIView(APIView):
    """Generates and serves downloadable Forensic Evidence PDF reports."""

    permission_classes = [IsSecurityOfficer]

    def get(self, request):
        lab_id, from_date, to_date = _extract_filter_params(request)
        logger.info(f"[REPORTS API] Generating Evidence Report with lab_id={lab_id}, from={from_date}, to={to_date}")
        try:
            pdf_bytes = generate_evidence_report_pdf(lab_id, from_date, to_date)
            timestamp_str = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"Forensic_Evidence_Report_{timestamp_str}.pdf"

            response = HttpResponse(pdf_bytes, content_type="application/pdf")
            response["Content-Disposition"] = f'attachment; filename="{filename}"'
            return response
        except Exception as err:
            logger.exception(f"[REPORTS API] Error generating Evidence Report: {err}")
            return Response(
                {"error": "Failed to generate Evidence Report", "detail": str(err)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class LabSessionReportAPIView(APIView):
    """Generates and serves downloadable Academic Lab Session PDF reports."""

    permission_classes = [IsSecurityOfficer]

    def get(self, request):
        lab_id, from_date, to_date = _extract_filter_params(request)
        logger.info(f"[REPORTS API] Generating Lab Session Report with lab_id={lab_id}, from={from_date}, to={to_date}")
        try:
            pdf_bytes = generate_lab_session_report_pdf(lab_id, from_date, to_date)
            timestamp_str = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"Lab_Session_Report_{timestamp_str}.pdf"

            response = HttpResponse(pdf_bytes, content_type="application/pdf")
            response["Content-Disposition"] = f'attachment; filename="{filename}"'
            return response
        except Exception as err:
            logger.exception(f"[REPORTS API] Error generating Lab Session Report: {err}")
            return Response(
                {"error": "Failed to generate Lab Session Report", "detail": str(err)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

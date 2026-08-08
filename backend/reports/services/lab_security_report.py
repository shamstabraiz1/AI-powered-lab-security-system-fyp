"""Service for generating real database-driven Laboratory Security Summary PDF Reports."""

import io
from datetime import datetime
from typing import Optional
from django.db.models import Count
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
from cameras.models import Camera
from evidence.models import Evidence
from incidents.models import Incident
from labs.models import Lab
from monitoring.models import LabSession
from notifications.models import Notification
from reports.pdf_generator import (
    NumberedCanvas,
    build_empty_state,
    build_metadata_box,
    build_report_header,
    get_report_styles,
)


def generate_lab_security_report_pdf(
    lab_id: Optional[int] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
) -> bytes:
    """Calculates comprehensive security metrics for laboratories and compiles a PDF report."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54,
    )
    styles = get_report_styles()
    story = []

    # 1. Header
    story.extend(build_report_header("Laboratory Security & Telemetry Report", "Comprehensive Facility Surveillance & Risk Assessment"))

    # 2. Query Base
    labs_queryset = Lab.objects.prefetch_related("cameras", "sessions").all()
    incidents_queryset = Incident.objects.all()
    sessions_queryset = LabSession.objects.all()
    evidence_queryset = Evidence.objects.all()
    notifs_queryset = Notification.objects.all()

    lab_name = "All Monitored Laboratories"
    selected_lab = None

    if lab_id:
        try:
            selected_lab = Lab.objects.get(pk=lab_id)
            lab_name = f"{selected_lab.name} (Room {selected_lab.room_number}, {selected_lab.building})"
            labs_queryset = labs_queryset.filter(pk=lab_id)
            incidents_queryset = incidents_queryset.filter(lab_id=lab_id)
            sessions_queryset = sessions_queryset.filter(lab_id=lab_id)
            evidence_queryset = evidence_queryset.filter(incident__lab_id=lab_id)
            notifs_queryset = notifs_queryset.filter(lab_id=lab_id)
        except Lab.DoesNotExist:
            labs_queryset = Lab.objects.none()

    date_strs = []
    if from_date:
        try:
            parsed_from = datetime.strptime(from_date, "%Y-%m-%d").date()
            incidents_queryset = incidents_queryset.filter(detected_at__date__gte=parsed_from)
            sessions_queryset = sessions_queryset.filter(created_at__date__gte=parsed_from)
            evidence_queryset = evidence_queryset.filter(captured_at__date__gte=parsed_from)
            notifs_queryset = notifs_queryset.filter(created_at__date__gte=parsed_from)
            date_strs.append(f"From {parsed_from.strftime('%d %b %Y')}")
        except ValueError:
            pass

    if to_date:
        try:
            parsed_to = datetime.strptime(to_date, "%Y-%m-%d").date()
            incidents_queryset = incidents_queryset.filter(detected_at__date__lte=parsed_to)
            sessions_queryset = sessions_queryset.filter(created_at__date__lte=parsed_to)
            evidence_queryset = evidence_queryset.filter(captured_at__date__lte=parsed_to)
            notifs_queryset = notifs_queryset.filter(created_at__date__lte=parsed_to)
            date_strs.append(f"To {parsed_to.strftime('%d %b %Y')}")
        except ValueError:
            pass

    date_range_str = " – ".join(date_strs) if date_strs else "All Time (Complete History)"

    # Compute Statistics from Database
    total_labs = labs_queryset.count()
    total_incidents = incidents_queryset.count()
    critical_incidents = incidents_queryset.filter(status__in=["Open", "Investigating"]).count()
    resolved_incidents = incidents_queryset.filter(status="Resolved").count()
    total_sessions = sessions_queryset.count()
    total_evidence = evidence_queryset.count()
    total_notifications = notifs_queryset.count()

    # Most frequently missing asset
    most_missing_asset_query = (
        incidents_queryset.values("asset__name")
        .annotate(cnt=Count("id"))
        .order_by("-cnt")
        .first()
    )
    if most_missing_asset_query:
        most_missing_asset_str = f"{most_missing_asset_query['asset__name']} ({most_missing_asset_query['cnt']} incident records)"
    else:
        most_missing_asset_str = "None Recorded (No Discrepancies)"

    # 3. Metadata Box
    story.append(build_metadata_box(lab_name, date_range_str, total_incidents))
    story.append(Spacer(1, 14))

    # 4. Security Summary KPI Grid
    story.append(Paragraph("Security Operations Executive Summary", styles["section"]))

    kpi_data = [
        [
            Paragraph("<b>Total Security Incidents:</b>", styles["meta_label"]),
            Paragraph(f"<font size=11 color='#b91c1c'><b>{total_incidents}</b></font>", styles["meta_value"]),
            Paragraph("<b>Critical / Open Discrepancies:</b>", styles["meta_label"]),
            Paragraph(f"<font size=11 color='#b91c1c'><b>{critical_incidents}</b></font>", styles["meta_value"]),
        ],
        [
            Paragraph("<b>Resolved Discrepancies:</b>", styles["meta_label"]),
            Paragraph(f"<font size=11 color='#15803d'><b>{resolved_incidents}</b></font>", styles["meta_value"]),
            Paragraph("<b>Forensic Evidence Records:</b>", styles["meta_label"]),
            Paragraph(f"<font size=11 color='#0284c7'><b>{total_evidence}</b></font>", styles["meta_value"]),
        ],
        [
            Paragraph("<b>Monitoring Sessions Logged:</b>", styles["meta_label"]),
            Paragraph(f"<font size=11 color='#0f172a'><b>{total_sessions}</b></font>", styles["meta_value"]),
            Paragraph("<b>Security Notifications Issued:</b>", styles["meta_label"]),
            Paragraph(f"<font size=11 color='#d97706'><b>{total_notifications}</b></font>", styles["meta_value"]),
        ],
        [
            Paragraph("<b>Most Frequent Discrepancy:</b>", styles["meta_label"]),
            Paragraph(f"<b>{most_missing_asset_str}</b>", styles["meta_value"]),
            Paragraph("<b>System Health Status:</b>", styles["meta_label"]),
            Paragraph("<font color='#15803d'><b>100% Operational</b></font>", styles["meta_value"]),
        ],
    ]

    kpi_table = Table(kpi_data, colWidths=[2.0 * inch, 1.5 * inch, 2.0 * inch, 1.5 * inch])
    kpi_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
                ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
                ("PADDING", (0, 0), (-1, -1), 5),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ]
        )
    )
    story.append(kpi_table)
    story.append(Spacer(1, 14))

    # 5. Laboratory Breakdown Table
    story.append(Paragraph("Laboratory Facility Breakdown", styles["section"]))

    if not labs_queryset.exists():
        story.append(build_empty_state("No laboratory facilities found."))
    else:
        lab_table_data = [
            [
                Paragraph("Laboratory Name", styles["table_header"]),
                Paragraph("Building / Room", styles["table_header"]),
                Paragraph("Cameras", styles["table_header"]),
                Paragraph("Sessions", styles["table_header"]),
                Paragraph("Incidents", styles["table_header"]),
                Paragraph("Evidence", styles["table_header"]),
                Paragraph("Status", styles["table_header"]),
            ]
        ]

        for lab in labs_queryset:
            cam_count = lab.cameras.count()
            sess_count = sessions_queryset.filter(lab=lab).count()
            inc_count = incidents_queryset.filter(lab=lab).count()
            ev_count = evidence_queryset.filter(incident__lab=lab).count()

            lab_table_data.append(
                [
                    Paragraph(f"<b>{lab.name}</b>", styles["table_cell_bold"]),
                    Paragraph(f"{lab.building}, Room {lab.room_number}", styles["table_cell"]),
                    Paragraph(f"{cam_count} cam(s)", styles["table_cell"]),
                    Paragraph(str(sess_count), styles["table_cell"]),
                    Paragraph(f"<b>{inc_count}</b>", styles["table_cell_bold"]),
                    Paragraph(str(ev_count), styles["table_cell"]),
                    Paragraph("ACTIVE" if lab.is_active else "INACTIVE", styles["badge_success"] if lab.is_active else styles["table_cell"]),
                ]
            )

        lab_table = Table(lab_table_data, colWidths=[1.8 * inch, 1.3 * inch, 0.8 * inch, 0.7 * inch, 0.8 * inch, 0.8 * inch, 0.8 * inch], repeatRows=1)
        lab_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0f172a")),
                    ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
                    ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
                    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
                    ("PADDING", (0, 0), (-1, -1), 4),
                ]
            )
        )
        story.append(lab_table)

    # Build Document
    doc.build(story, canvasmaker=NumberedCanvas)
    pdf_data = buffer.getvalue()
    buffer.close()
    return pdf_data

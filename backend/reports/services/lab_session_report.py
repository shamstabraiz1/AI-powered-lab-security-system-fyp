"""Service for generating real database-driven Lab Session PDF Reports."""

import io
from datetime import datetime
from typing import Optional
from django.utils import timezone
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
from incidents.models import Incident
from labs.models import Lab
from monitoring.models import LabSession
from reports.pdf_generator import (
    NumberedCanvas,
    build_empty_state,
    build_metadata_box,
    build_report_header,
    get_report_styles,
)


def generate_lab_session_report_pdf(
    lab_id: Optional[int] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
) -> bytes:
    """Queries real LabSession records, computes associated incident counts, and compiles PDF."""
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
    story.extend(build_report_header("Academic Lab Session Audit Report", "Surveillance Logs, Instructor Activity & Discrepancy Records"))

    # 2. Query Database
    queryset = LabSession.objects.select_related("lab").prefetch_related("lab__cameras").all().order_by("-created_at")
    lab_name = "All Laboratories"

    if lab_id:
        try:
            lab_obj = Lab.objects.get(pk=lab_id)
            lab_name = f"{lab_obj.name} (Room {lab_obj.room_number})"
            queryset = queryset.filter(lab_id=lab_id)
        except Lab.DoesNotExist:
            queryset = queryset.none()

    date_strs = []
    if from_date:
        try:
            parsed_from = datetime.strptime(from_date, "%Y-%m-%d").date()
            queryset = queryset.filter(created_at__date__gte=parsed_from)
            date_strs.append(f"From {parsed_from.strftime('%d %b %Y')}")
        except ValueError:
            pass

    if to_date:
        try:
            parsed_to = datetime.strptime(to_date, "%Y-%m-%d").date()
            queryset = queryset.filter(created_at__date__lte=parsed_to)
            date_strs.append(f"To {parsed_to.strftime('%d %b %Y')}")
        except ValueError:
            pass

    date_range_str = " – ".join(date_strs) if date_strs else "All Time (Complete History)"
    sessions = list(queryset)

    # 3. Metadata Box
    story.append(build_metadata_box(lab_name, date_range_str, len(sessions)))
    story.append(Spacer(1, 14))

    # 4. Content Section
    if not sessions:
        story.append(build_empty_state("No laboratory sessions recorded matching the specified filter criteria."))
    else:
        story.append(Paragraph("Laboratory Sessions Summary", styles["section"]))

        table_data = [
            [
                Paragraph("Session ID", styles["table_header"]),
                Paragraph("Course / Topic", styles["table_header"]),
                Paragraph("Instructor", styles["table_header"]),
                Paragraph("Laboratory", styles["table_header"]),
                Paragraph("Date / Time", styles["table_header"]),
                Paragraph("Duration", styles["table_header"]),
                Paragraph("Status", styles["table_header"]),
            ]
        ]

        for s in sessions:
            dt_local = timezone.localtime(s.created_at) if timezone.is_aware(s.created_at) else s.created_at
            badge_style = styles["badge_success"] if s.status == "Completed" else styles["table_cell_bold"]

            table_data.append(
                [
                    Paragraph(f"<b>{s.session_id}</b>", styles["table_cell_bold"]),
                    Paragraph(f"<b>{s.course_name}</b> ({s.course_code or 'N/A'})<br/>{s.session_topic}", styles["table_cell"]),
                    Paragraph(f"<b>{s.instructor_name}</b>", styles["table_cell"]),
                    Paragraph(s.lab.name, styles["table_cell"]),
                    Paragraph(dt_local.strftime("%d %b %Y<br/>%I:%M %p"), styles["table_cell"]),
                    Paragraph(f"{s.planned_duration} min", styles["table_cell"]),
                    Paragraph(s.status.upper(), badge_style),
                ]
            )

        col_widths = [0.9 * inch, 1.6 * inch, 1.2 * inch, 1.0 * inch, 1.0 * inch, 0.6 * inch, 0.7 * inch]
        t = Table(table_data, colWidths=col_widths, repeatRows=1)
        t.setStyle(
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
        story.append(t)
        story.append(Spacer(1, 14))

        # Detailed Individual Session Dossiers
        story.append(Paragraph("Detailed Session Security Telemetry", styles["section"]))
        for s in sessions:
            dt_start = timezone.localtime(s.start_time) if (s.start_time and timezone.is_aware(s.start_time)) else s.start_time
            dt_end = timezone.localtime(s.end_time) if (s.end_time and timezone.is_aware(s.end_time)) else s.end_time
            end_str = dt_end.strftime("%I:%M %p") if dt_end else "Active / In Progress"

            # Query incidents that occurred during this session in this lab
            session_incidents = Incident.objects.filter(lab=s.lab)
            if s.start_time:
                session_incidents = session_incidents.filter(detected_at__gte=s.start_time)
            if s.end_time:
                session_incidents = session_incidents.filter(detected_at__lte=s.end_time)
            inc_count = session_incidents.count()

            cameras_list = [c.name for c in s.lab.cameras.all()]
            cams_str = ", ".join(cameras_list) if cameras_list else "No cameras linked"

            card_rows = [
                [
                    Paragraph(f"<b>Session {s.session_id}: {s.course_name}</b>", styles["table_cell_bold"]),
                    Paragraph(f"<b>Instructor:</b> {s.instructor_name} &nbsp;|&nbsp; <b>Status:</b> {s.status}", styles["table_cell"]),
                ],
                [
                    Paragraph(f"<b>Facility:</b> {s.lab.name} (Room {s.lab.room_number})<br/><b>Topic:</b> {s.session_topic}", styles["table_cell"]),
                    Paragraph(f"<b>Time Window:</b> {dt_start.strftime('%d %b %Y, %I:%M %p') if dt_start else 'N/A'} – {end_str}", styles["table_cell"]),
                ],
                [
                    Paragraph(f"<b>Monitored Cameras:</b> {cams_str}", styles["table_cell"]),
                    Paragraph(f"<b>Security Discrepancies:</b> <font color='{'#b91c1c' if inc_count > 0 else '#15803d'}'><b>{inc_count} incident(s) logged</b></font>", styles["table_cell"]),
                ],
            ]

            card_table = Table(card_rows, colWidths=[3.5 * inch, 3.5 * inch])
            card_table.setStyle(
                TableStyle(
                    [
                        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
                        ("BACKGROUND", (0, 1), (-1, -1), colors.white),
                        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
                        ("PADDING", (0, 0), (-1, -1), 4),
                        ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ]
                )
            )
            story.append(card_table)
            story.append(Spacer(1, 8))

    # Build Document
    doc.build(story, canvasmaker=NumberedCanvas)
    pdf_data = buffer.getvalue()
    buffer.close()
    return pdf_data

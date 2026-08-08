"""Service for generating real database-driven Incident PDF Reports."""

import io
from datetime import datetime
from typing import Optional
from django.utils import timezone
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.platypus import HRFlowable, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
from incidents.models import Incident
from labs.models import Lab
from reports.pdf_generator import (
    NumberedCanvas,
    build_empty_state,
    build_metadata_box,
    build_report_header,
    get_report_styles,
)


def generate_incident_report_pdf(
    lab_id: Optional[int] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
) -> bytes:
    """Queries real Incident records and compiles a downloadable PDF document."""
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
    story.extend(build_report_header("Incident Audit Report", "Comprehensive Log of Detected Security Discrepancies"))

    # 2. Query Database
    queryset = Incident.objects.select_related("lab", "camera", "asset").all().order_by("-detected_at")
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
            queryset = queryset.filter(detected_at__date__gte=parsed_from)
            date_strs.append(f"From {parsed_from.strftime('%d %b %Y')}")
        except ValueError:
            pass

    if to_date:
        try:
            parsed_to = datetime.strptime(to_date, "%Y-%m-%d").date()
            queryset = queryset.filter(detected_at__date__lte=parsed_to)
            date_strs.append(f"To {parsed_to.strftime('%d %b %Y')}")
        except ValueError:
            pass

    date_range_str = " – ".join(date_strs) if date_strs else "All Time (Complete History)"
    incidents = list(queryset)

    # 3. Metadata Box
    story.append(build_metadata_box(lab_name, date_range_str, len(incidents)))
    story.append(Spacer(1, 14))

    # 4. Content Section
    if not incidents:
        story.append(build_empty_state("No incidents found matching the specified filter criteria."))
    else:
        story.append(Paragraph("Incident Records Breakdown", styles["section"]))

        # Table Summary
        table_data = [
            [
                Paragraph("ID", styles["table_header"]),
                Paragraph("Date / Time", styles["table_header"]),
                Paragraph("Laboratory", styles["table_header"]),
                Paragraph("Camera", styles["table_header"]),
                Paragraph("Asset (Missing)", styles["table_header"]),
                Paragraph("Conf.", styles["table_header"]),
                Paragraph("Status", styles["table_header"]),
            ]
        ]

        for inc in incidents:
            dt_local = timezone.localtime(inc.detected_at) if timezone.is_aware(inc.detected_at) else inc.detected_at
            missing_qty = max(0, inc.expected_quantity - inc.detected_quantity)
            conf_str = f"{inc.confidence * 100:.1f}%" if inc.confidence <= 1.0 else f"{inc.confidence:.1f}%"
            badge_style = styles["badge_critical"] if inc.status == "Open" else styles["badge_success"]

            table_data.append(
                [
                    Paragraph(f"<b>#INC-{inc.id}</b>", styles["table_cell_bold"]),
                    Paragraph(dt_local.strftime("%d %b %Y<br/>%I:%M %p"), styles["table_cell"]),
                    Paragraph(inc.lab.name, styles["table_cell"]),
                    Paragraph(inc.camera.name, styles["table_cell"]),
                    Paragraph(f"<b>{inc.asset.name}</b><br/>Exp: {inc.expected_quantity} | Det: {inc.detected_quantity} (<b>-{missing_qty}</b>)", styles["table_cell"]),
                    Paragraph(conf_str, styles["table_cell"]),
                    Paragraph(inc.status.upper(), badge_style),
                ]
            )

        col_widths = [0.8 * inch, 1.1 * inch, 1.1 * inch, 1.1 * inch, 1.7 * inch, 0.6 * inch, 0.6 * inch]
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

        # Detailed Incident Callout Cards
        story.append(Paragraph("Detailed Incident Investigation Logs", styles["section"]))
        for inc in incidents:
            dt_local = timezone.localtime(inc.detected_at) if timezone.is_aware(inc.detected_at) else inc.detected_at
            missing_qty = max(0, inc.expected_quantity - inc.detected_quantity)
            conf_str = f"{inc.confidence * 100:.1f}%" if inc.confidence <= 1.0 else f"{inc.confidence:.1f}%"

            detail_rows = [
                [
                    Paragraph(f"<b>Incident #{inc.id} — {inc.asset.name} Discrepancy</b>", styles["table_cell_bold"]),
                    Paragraph(f"<b>Severity:</b> <font color='#b91c1c'>CRITICAL</font> &nbsp;|&nbsp; <b>Status:</b> {inc.status}", styles["table_cell"]),
                ],
                [
                    Paragraph(f"<b>Facility:</b> {inc.lab.name} (Room {inc.lab.room_number})<br/><b>Camera:</b> {inc.camera.name} ({inc.camera.ip_address})", styles["table_cell"]),
                    Paragraph(f"<b>Detection Time:</b> {dt_local.strftime('%d %B %Y at %I:%M:%S %p')}<br/><b>AI Vision Confidence:</b> {conf_str}", styles["table_cell"]),
                ],
                [
                    Paragraph(f"<b>Asset Inventory:</b> Expected: {inc.expected_quantity} &bull; Detected: {inc.detected_quantity} &bull; <b>Missing: {missing_qty}</b>", styles["table_cell_bold"]),
                    Paragraph(f"<b>Asset Tag:</b> {inc.asset.asset_tag} ({inc.asset.category})", styles["table_cell"]),
                ],
                [
                    Paragraph(f"<b>System Description:</b> {inc.description or 'Asset disappearance verified and logged by YOLOv8 monitoring engine.'}", styles["table_cell"]),
                    Paragraph("", styles["table_cell"]),
                ],
            ]

            card_table = Table(detail_rows, colWidths=[3.5 * inch, 3.5 * inch])
            card_table.setStyle(
                TableStyle(
                    [
                        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
                        ("BACKGROUND", (0, 1), (-1, -1), colors.white),
                        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
                        ("SPAN", (0, 3), (1, 3)),
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

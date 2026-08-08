"""Service for generating real database-driven Forensic Evidence PDF Reports."""

import io
import os
from datetime import datetime
from typing import Optional
from django.utils import timezone
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
from evidence.models import Evidence
from labs.models import Lab
from reports.pdf_generator import (
    NumberedCanvas,
    build_empty_state,
    build_metadata_box,
    build_report_header,
    get_report_styles,
)


def generate_evidence_report_pdf(
    lab_id: Optional[int] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
) -> bytes:
    """Queries real Evidence & Incident records and compiles an audit PDF."""
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
    story.extend(build_report_header("Forensic Evidence Audit Report", "Verification of Captured Images, Video Packages & Chain of Custody"))

    # 2. Query Database
    queryset = Evidence.objects.select_related("incident__lab", "incident__camera", "incident__asset").all().order_by("-captured_at")
    lab_name = "All Laboratories"

    if lab_id:
        try:
            lab_obj = Lab.objects.get(pk=lab_id)
            lab_name = f"{lab_obj.name} (Room {lab_obj.room_number})"
            queryset = queryset.filter(incident__lab_id=lab_id)
        except Lab.DoesNotExist:
            queryset = queryset.none()

    date_strs = []
    if from_date:
        try:
            parsed_from = datetime.strptime(from_date, "%Y-%m-%d").date()
            queryset = queryset.filter(captured_at__date__gte=parsed_from)
            date_strs.append(f"From {parsed_from.strftime('%d %b %Y')}")
        except ValueError:
            pass

    if to_date:
        try:
            parsed_to = datetime.strptime(to_date, "%Y-%m-%d").date()
            queryset = queryset.filter(captured_at__date__lte=parsed_to)
            date_strs.append(f"To {parsed_to.strftime('%d %b %Y')}")
        except ValueError:
            pass

    date_range_str = " – ".join(date_strs) if date_strs else "All Time (Complete History)"
    evidence_items = list(queryset)

    # 3. Metadata Box
    story.append(build_metadata_box(lab_name, date_range_str, len(evidence_items)))
    story.append(Spacer(1, 14))

    # 4. Content Section
    if not evidence_items:
        story.append(build_empty_state("No forensic evidence captures found matching the specified filter criteria."))
    else:
        story.append(Paragraph("Forensic Evidence Records", styles["section"]))

        table_data = [
            [
                Paragraph("Evidence ID", styles["table_header"]),
                Paragraph("Incident ID", styles["table_header"]),
                Paragraph("Laboratory", styles["table_header"]),
                Paragraph("Camera", styles["table_header"]),
                Paragraph("Target Asset", styles["table_header"]),
                Paragraph("Captured Time", styles["table_header"]),
                Paragraph("Image File", styles["table_header"]),
                Paragraph("Video MP4", styles["table_header"]),
            ]
        ]

        available_images_count = 0
        available_videos_count = 0

        for ev in evidence_items:
            dt_local = timezone.localtime(ev.captured_at) if timezone.is_aware(ev.captured_at) else ev.captured_at

            # Strict physical file verification
            image_available = False
            if ev.image:
                try:
                    if os.path.exists(ev.image.path) and os.path.getsize(ev.image.path) > 0:
                        image_available = True
                except Exception:
                    image_available = False

            video_available = False
            if ev.video:
                try:
                    if os.path.exists(ev.video.path) and os.path.getsize(ev.video.path) > 0:
                        video_available = True
                except Exception:
                    video_available = False

            if image_available:
                available_images_count += 1
            if video_available:
                available_videos_count += 1

            img_cell = Paragraph("<font color='#15803d'><b>Available</b></font>", styles["table_cell"]) if image_available else Paragraph("<font color='#94a3b8'>Unavailable</font>", styles["table_cell"])
            vid_cell = Paragraph("<font color='#15803d'><b>Available</b></font>", styles["table_cell"]) if video_available else Paragraph("<font color='#94a3b8'>Unavailable</font>", styles["table_cell"])

            inc_obj = ev.incident
            lab_str = inc_obj.lab.name if inc_obj and inc_obj.lab else "N/A"
            cam_str = inc_obj.camera.name if inc_obj and inc_obj.camera else "N/A"
            asset_str = inc_obj.asset.name if inc_obj and inc_obj.asset else "N/A"
            inc_id_str = f"#INC-{inc_obj.id}" if inc_obj else "N/A"

            table_data.append(
                [
                    Paragraph(f"<b>#EV-{ev.id}</b>", styles["table_cell_bold"]),
                    Paragraph(f"<b>{inc_id_str}</b>", styles["table_cell_bold"]),
                    Paragraph(lab_str, styles["table_cell"]),
                    Paragraph(cam_str, styles["table_cell"]),
                    Paragraph(asset_str, styles["table_cell"]),
                    Paragraph(dt_local.strftime("%d %b %Y<br/>%I:%M %p"), styles["table_cell"]),
                    img_cell,
                    vid_cell,
                ]
            )

        col_widths = [0.8 * inch, 0.8 * inch, 1.1 * inch, 1.1 * inch, 1.0 * inch, 1.1 * inch, 0.7 * inch, 0.7 * inch]
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

        # Forensic Integrity Summary
        story.append(Paragraph("Chain of Custody & Evidence Verification", styles["section"]))
        summary_rows = [
            [
                Paragraph("<b>Total Evidence Packages:</b>", styles["meta_label"]),
                Paragraph(f"<b>{len(evidence_items)}</b> indexed in database", styles["meta_value"]),
            ],
            [
                Paragraph("<b>Verified Forensic Images:</b>", styles["meta_label"]),
                Paragraph(f"<b>{available_images_count} / {len(evidence_items)}</b> accessible on storage media", styles["meta_value"]),
            ],
            [
                Paragraph("<b>Verified Forensic MP4 Clips:</b>", styles["meta_label"]),
                Paragraph(f"<b>{available_videos_count} / {len(evidence_items)}</b> synchronized video recordings", styles["meta_value"]),
            ],
        ]
        summary_table = Table(summary_rows, colWidths=[2.2 * inch, 4.8 * inch])
        summary_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
                    ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
                    ("PADDING", (0, 0), (-1, -1), 6),
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ]
            )
        )
        story.append(summary_table)

    # Build Document
    doc.build(story, canvasmaker=NumberedCanvas)
    pdf_data = buffer.getvalue()
    buffer.close()
    return pdf_data

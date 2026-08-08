"""Service for generating real database-driven Asset Missing PDF Reports."""

import io
from datetime import datetime
from typing import Optional
from django.db.models import Count, Max, Min, Sum, F
from django.utils import timezone
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
from incidents.models import Incident
from labs.models import Lab
from reports.pdf_generator import (
    NumberedCanvas,
    build_empty_state,
    build_metadata_box,
    build_report_header,
    get_report_styles,
)


def generate_asset_missing_report_pdf(
    lab_id: Optional[int] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
) -> bytes:
    """Queries real Incident & Asset records, calculates discrepancy aggregates, and compiles PDF."""
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
    story.extend(build_report_header("Asset Missing & Discrepancy Report", "Historical Discrepancy Audits and Frequency Analysis"))

    # 2. Query Database
    queryset = Incident.objects.select_related("lab", "asset").all()
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

    # Aggregate by (asset_id, lab_id)
    aggregated = (
        queryset.values("asset__id", "asset__name", "asset__category", "lab__id", "lab__name")
        .annotate(
            incident_count=Count("id"),
            total_missing=Sum(F("expected_quantity") - F("detected_quantity")),
            first_seen=Min("detected_at"),
            last_seen=Max("detected_at"),
        )
        .order_by("-incident_count", "-total_missing")
    )

    agg_list = list(aggregated)

    # 3. Metadata Box
    story.append(build_metadata_box(lab_name, date_range_str, len(agg_list)))
    story.append(Spacer(1, 14))

    # 4. Content Section
    if not agg_list:
        story.append(build_empty_state("No asset missing activity recorded for the selected filter criteria."))
    else:
        story.append(Paragraph("Asset Discrepancy Summary Table", styles["section"]))

        table_data = [
            [
                Paragraph("Asset Name", styles["table_header"]),
                Paragraph("Category", styles["table_header"]),
                Paragraph("Laboratory", styles["table_header"]),
                Paragraph("Incidents", styles["table_header"]),
                Paragraph("Total Missing", styles["table_header"]),
                Paragraph("First Occurrence", styles["table_header"]),
                Paragraph("Latest Occurrence", styles["table_header"]),
            ]
        ]

        total_incidents_all = 0
        total_missing_all = 0

        for row in agg_list:
            inc_count = row["incident_count"]
            tot_missing = max(0, row["total_missing"] or 0)
            first_dt = timezone.localtime(row["first_seen"]) if timezone.is_aware(row["first_seen"]) else row["first_seen"]
            last_dt = timezone.localtime(row["last_seen"]) if timezone.is_aware(row["last_seen"]) else row["last_seen"]

            total_incidents_all += inc_count
            total_missing_all += tot_missing

            table_data.append(
                [
                    Paragraph(f"<b>{row['asset__name']}</b>", styles["table_cell_bold"]),
                    Paragraph(row["asset__category"] or "General Asset", styles["table_cell"]),
                    Paragraph(row["lab__name"], styles["table_cell"]),
                    Paragraph(f"<b>{inc_count}</b>", styles["table_cell"]),
                    Paragraph(f"<font color='#b91c1c'><b>{tot_missing} units</b></font>", styles["table_cell_bold"]),
                    Paragraph(first_dt.strftime("%d %b %Y<br/>%I:%M %p"), styles["table_cell"]),
                    Paragraph(last_dt.strftime("%d %b %Y<br/>%I:%M %p"), styles["table_cell"]),
                ]
            )

        # Totals row
        table_data.append(
            [
                Paragraph("<b>TOTALS</b>", styles["table_cell_bold"]),
                Paragraph("", styles["table_cell"]),
                Paragraph("", styles["table_cell"]),
                Paragraph(f"<b>{total_incidents_all}</b>", styles["table_cell_bold"]),
                Paragraph(f"<font color='#b91c1c'><b>{total_missing_all} units</b></font>", styles["table_cell_bold"]),
                Paragraph("", styles["table_cell"]),
                Paragraph("", styles["table_cell"]),
            ]
        )

        col_widths = [1.2 * inch, 0.9 * inch, 1.2 * inch, 0.7 * inch, 0.9 * inch, 1.05 * inch, 1.05 * inch]
        t = Table(table_data, colWidths=col_widths, repeatRows=1)
        t.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0f172a")),
                    ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#e2e8f0")),
                    ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
                    ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
                    ("ROWBACKGROUNDS", (0, 1), (-1, -2), [colors.white, colors.HexColor("#f8fafc")]),
                    ("PADDING", (0, 0), (-1, -1), 4),
                ]
            )
        )
        story.append(t)
        story.append(Spacer(1, 16))

        # Highlights Summary Cards
        story.append(Paragraph("Audit Frequency Insights", styles["section"]))
        most_affected = agg_list[0]
        insights_data = [
            [
                Paragraph("<b>Most Impacted Asset:</b>", styles["meta_label"]),
                Paragraph(f"<b>{most_affected['asset__name']}</b> ({most_affected['incident_count']} incident logs in {most_affected['lab__name']})", styles["meta_value"]),
            ],
            [
                Paragraph("<b>Cumulative Missing Assets:</b>", styles["meta_label"]),
                Paragraph(f"<b>{total_missing_all} item(s)</b> unaccounted across {len(agg_list)} monitored asset group(s)", styles["meta_value"]),
            ],
            [
                Paragraph("<b>Audit Scope:</b>", styles["meta_label"]),
                Paragraph("Verified by continuous circular buffer tracking and YOLOv8 3-stage validation cycles.", styles["meta_value"]),
            ],
        ]
        insight_table = Table(insights_data, colWidths=[2.2 * inch, 4.8 * inch])
        insight_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
                    ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
                    ("PADDING", (0, 0), (-1, -1), 6),
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ]
            )
        )
        story.append(insight_table)

    # Build Document
    doc.build(story, canvasmaker=NumberedCanvas)
    pdf_data = buffer.getvalue()
    buffer.close()
    return pdf_data

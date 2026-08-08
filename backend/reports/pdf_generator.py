"""Core PDF generation utilities and layout builder using ReportLab."""

import io
from datetime import datetime
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas
from reportlab.platypus import (
    HRFlowable,
    KeepTogether,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


class NumberedCanvas(canvas.Canvas):
    """Canvas that computes total pages dynamically and renders running headers/footers."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count: int):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))

        # Running Footer
        footer_text = f"AI Powered Lab Security System  |  Page {self._pageNumber} of {page_count}"
        self.drawString(54, 36, footer_text)

        gen_text = f"Generated on: {datetime.now().strftime('%d %B %Y, %I:%M %p')}"
        self.drawRightString(letter[0] - 54, 36, gen_text)

        # Footer divider line
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.5)
        self.line(54, 48, letter[0] - 54, 48)

        self.restoreState()


def get_report_styles():
    """Returns tailored ReportLab stylesheet styles for security reports."""
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "ReportTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=18,
        leading=22,
        textColor=colors.HexColor("#0f172a"),
        alignment=0,
    )

    subtitle_style = ParagraphStyle(
        "ReportSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#0284c7"),
        alignment=0,
    )

    system_tag_style = ParagraphStyle(
        "ReportSystemTag",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10,
        textColor=colors.HexColor("#64748b"),
        alignment=0,
    )

    section_heading = ParagraphStyle(
        "ReportSectionHeading",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#1e293b"),
        spaceBefore=10,
        spaceAfter=6,
    )

    meta_label = ParagraphStyle(
        "ReportMetaLabel",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#475569"),
    )

    meta_value = ParagraphStyle(
        "ReportMetaValue",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#0f172a"),
    )

    table_header = ParagraphStyle(
        "ReportTableHeader",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10,
        textColor=colors.white,
        alignment=0,
    )

    table_cell = ParagraphStyle(
        "ReportTableCell",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#1e293b"),
    )

    table_cell_bold = ParagraphStyle(
        "ReportTableCellBold",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#0f172a"),
    )

    status_badge_critical = ParagraphStyle(
        "StatusBadgeCritical",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=7,
        leading=9,
        textColor=colors.HexColor("#b91c1c"),
    )

    status_badge_success = ParagraphStyle(
        "StatusBadgeSuccess",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=7,
        leading=9,
        textColor=colors.HexColor("#15803d"),
    )

    empty_state = ParagraphStyle(
        "ReportEmptyState",
        parent=styles["Normal"],
        fontName="Helvetica-Oblique",
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#64748b"),
        alignment=1,
    )

    return {
        "title": title_style,
        "subtitle": subtitle_style,
        "system_tag": system_tag_style,
        "section": section_heading,
        "meta_label": meta_label,
        "meta_value": meta_value,
        "table_header": table_header,
        "table_cell": table_cell,
        "table_cell_bold": table_cell_bold,
        "badge_critical": status_badge_critical,
        "badge_success": status_badge_success,
        "empty_state": empty_state,
    }


def build_report_header(report_title: str, subtitle: str = "Security Operations Center (SOC)"):
    """Builds standard printable header flowables."""
    styles = get_report_styles()
    story = [
        Paragraph("AI POWERED LAB SECURITY SYSTEM", styles["system_tag"]),
        Paragraph(report_title.upper(), styles["title"]),
        Paragraph(subtitle, styles["subtitle"]),
        Spacer(1, 6),
        HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#0284c7"), spaceBefore=2, spaceAfter=8),
    ]
    return story


def build_metadata_box(lab_name: str, date_range_str: str, record_count: int):
    """Builds a key-value metadata summary box for filter transparency."""
    styles = get_report_styles()
    gen_time = datetime.now().strftime("%d %B %Y, %I:%M %p")

    data = [
        [
            Paragraph("Target Laboratory:", styles["meta_label"]),
            Paragraph(lab_name or "All Laboratories", styles["meta_value"]),
            Paragraph("Report Generated:", styles["meta_label"]),
            Paragraph(gen_time, styles["meta_value"]),
        ],
        [
            Paragraph("Filter Period:", styles["meta_label"]),
            Paragraph(date_range_str, styles["meta_value"]),
            Paragraph("Matching Records:", styles["meta_label"]),
            Paragraph(f"<b>{record_count}</b> record(s) found", styles["meta_value"]),
        ],
    ]

    t = Table(data, colWidths=[1.3 * inch, 2.2 * inch, 1.3 * inch, 2.2 * inch])
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
                ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#f1f5f9")),
                ("PADDING", (0, 0), (-1, -1), 4),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ]
        )
    )
    return t


def build_empty_state(message: str = "No records found for the selected filter criteria."):
    """Builds standard empty state callout."""
    styles = get_report_styles()
    data = [[Paragraph(message, styles["empty_state"])]]
    t = Table(data, colWidths=[7.0 * inch])
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
                ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
                ("PADDING", (0, 0), (-1, -1), 16),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ]
        )
    )
    return t

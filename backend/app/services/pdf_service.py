import os
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
    KeepTogether,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch


class PDFReportService:
    """
    Generates publication-quality Sustainability & Energy Audit Reports
    in PDF format using ReportLab.
    """

    @classmethod
    def generate_sustainability_report(
        cls,
        metrics: Dict[str, Any],
        department_data: List[Dict[str, Any]],
        anomalies_data: Dict[str, Any],
        forecast_data: Dict[str, Any],
        carbon_data: Dict[str, Any],
        recommendations: List[Dict[str, Any]],
        output_path: str = None,
    ) -> str:
        """Builds and writes a comprehensive PDF report to disk, returning the file path."""
        if output_path is None:
            reports_dir = Path(__file__).resolve().parent.parent.parent / "reports"
            os.makedirs(reports_dir, exist_ok=True)
            filename = f"EcoMind_Sustainability_Report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
            output_path = str(reports_dir / filename)
        else:
            os.makedirs(os.path.dirname(output_path), exist_ok=True)

        doc = SimpleDocTemplate(
            output_path,
            pagesize=letter,
            rightMargin=40,
            leftMargin=40,
            topMargin=40,
            bottomMargin=40,
        )

        styles = getSampleStyleSheet()

        # Custom Branded Palette
        PRIMARY_COLOR = colors.HexColor("#065f46")   # Deep Emerald
        SECONDARY_COLOR = colors.HexColor("#0d9488") # Teal
        DARK_TEXT = colors.HexColor("#0f172a")       # Slate 900
        MUTED_TEXT = colors.HexColor("#475569")      # Slate 600
        BG_LIGHT = colors.HexColor("#f8fafc")        # Light Slate
        CARD_BG = colors.HexColor("#ecfdf5")         # Light Mint
        BORDER_COLOR = colors.HexColor("#cbd5e1")

        # Custom Typography Styles
        title_style = ParagraphStyle(
            "DocTitle",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=22,
            leading=26,
            textColor=PRIMARY_COLOR,
        )

        subtitle_style = ParagraphStyle(
            "DocSubTitle",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=11,
            leading=15,
            textColor=MUTED_TEXT,
        )

        h1_style = ParagraphStyle(
            "SectionH1",
            parent=styles["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=14,
            leading=18,
            textColor=PRIMARY_COLOR,
            spaceBefore=14,
            spaceAfter=6,
        )

        body_style = ParagraphStyle(
            "BodyDark",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=9.5,
            leading=13.5,
            textColor=DARK_TEXT,
        )

        table_header_style = ParagraphStyle(
            "TableHeader",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=9,
            leading=11,
            textColor=colors.white,
        )

        table_cell_style = ParagraphStyle(
            "TableCell",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=8.5,
            leading=11,
            textColor=DARK_TEXT,
        )

        table_cell_bold = ParagraphStyle(
            "TableCellBold",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=8.5,
            leading=11,
            textColor=DARK_TEXT,
        )

        story = []

        # Header Block
        story.append(Paragraph("EcoMind AI — Sustainability & Energy Audit Report", title_style))
        story.append(Paragraph(
            f"Generated on {datetime.now().strftime('%B %d, %Y at %H:%M UTC')} | Confidential & Grounded Analytics",
            subtitle_style,
        ))
        story.append(Spacer(1, 10))
        story.append(HRFlowable(width="100%", thickness=2, color=PRIMARY_COLOR, spaceAfter=14))

        # Executive Summary Box
        story.append(Paragraph("1. Executive Summary & Core Metrics", h1_style))
        story.append(Paragraph(
            "This audit report provides an empirical evaluation of facility energy performance, "
            "identifying consumption inefficiencies, machine-learning-flagged anomalies, predictive demand projections, "
            "and prioritized decarbonization opportunities.",
            body_style,
        ))
        story.append(Spacer(1, 8))

        # KPI Summary Table
        kpi_data = [
            [
                Paragraph("<b>Total Consumption</b>", table_cell_bold),
                Paragraph(f"{metrics.get('total_consumption_kwh', 0):,.1f} kWh", table_cell_style),
                Paragraph("<b>Est. Electricity Spend</b>", table_cell_bold),
                Paragraph(f"${metrics.get('total_bill', 0):,.2f}", table_cell_style),
            ],
            [
                Paragraph("<b>Carbon Footprint</b>", table_cell_bold),
                Paragraph(f"{metrics.get('total_co2_kg', 0):,.1f} kg CO2e", table_cell_style),
                Paragraph("<b>Energy Wastage %</b>", table_cell_bold),
                Paragraph(f"{metrics.get('wastage_percentage', 0):.1f}%", table_cell_style),
            ],
            [
                Paragraph("<b>Efficiency Score</b>", table_cell_bold),
                Paragraph(f"<b>{metrics.get('efficiency_score', 0):.1f} / 100</b>", table_cell_bold),
                Paragraph("<b>Active Anomalies</b>", table_cell_bold),
                Paragraph(f"{metrics.get('active_anomalies_count', 0)} detected", table_cell_style),
            ],
            [
                Paragraph("<b>Peak Demand Hour</b>", table_cell_bold),
                Paragraph(f"{metrics.get('peak_hour', 14):02d}:00 hrs", table_cell_style),
                Paragraph("<b>Top Consuming Dept</b>", table_cell_bold),
                Paragraph(f"{metrics.get('top_department', 'N/A')}", table_cell_style),
            ],
        ]

        kpi_table = Table(kpi_data, colWidths=[120, 140, 130, 140])
        kpi_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), CARD_BG),
            ("BOX", (0, 0), (-1, -1), 1, SECONDARY_COLOR),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, BORDER_COLOR),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ]))
        story.append(kpi_table)
        story.append(Spacer(1, 14))

        # Department Consumption Breakdown
        story.append(Paragraph("2. Departmental Energy & Carbon Allocation", h1_style))
        dept_rows = [
            [
                Paragraph("Department", table_header_style),
                Paragraph("Consumption (kWh)", table_header_style),
                Paragraph("Share (%)", table_header_style),
                Paragraph("Est. Cost ($)", table_header_style),
                Paragraph("Carbon (kg CO2)", table_header_style),
            ]
        ]
        for dept in department_data[:6]:
            dept_rows.append([
                Paragraph(dept.get("department", "Unknown"), table_cell_bold),
                Paragraph(f"{dept.get('consumption_kwh', 0):,.1f}", table_cell_style),
                Paragraph(f"{dept.get('percentage', 0):.1f}%", table_cell_style),
                Paragraph(f"${dept.get('bill', 0):,.2f}", table_cell_style),
                Paragraph(f"{dept.get('co2_kg', 0):,.1f}", table_cell_style),
            ])

        dept_table = Table(dept_rows, colWidths=[160, 100, 70, 100, 100])
        dept_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), PRIMARY_COLOR),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, BG_LIGHT]),
            ("GRID", (0, 0), (-1, -1), 0.5, BORDER_COLOR),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ]))
        story.append(dept_table)
        story.append(Spacer(1, 14))

        # Anomaly Detection Results
        story.append(Paragraph("3. AI Anomaly Detection & Inefficiency Diagnosis", h1_style))
        story.append(Paragraph(
            f"The Isolation Forest engine analyzed multi-variable time series records and identified "
            f"<b>{anomalies_data.get('total_anomalies', 0)} total anomalies</b> across operating profiles. "
            f"Critical: {anomalies_data.get('critical_count', 0)}, "
            f"High: {anomalies_data.get('high_count', 0)}, "
            f"Medium: {anomalies_data.get('medium_count', 0)}, "
            f"Low: {anomalies_data.get('low_count', 0)}.",
            body_style,
        ))
        story.append(Spacer(1, 6))

        # Sample Flagged Incidents
        anom_items = anomalies_data.get("items", [])[:5]
        if anom_items:
            anom_table_rows = [
                [
                    Paragraph("Timestamp", table_header_style),
                    Paragraph("Department", table_header_style),
                    Paragraph("Severity", table_header_style),
                    Paragraph("Type", table_header_style),
                    Paragraph("Explainable Reason", table_header_style),
                ]
            ]
            for a in anom_items:
                sev_color = colors.HexColor("#dc2626") if a.get("severity") in ["Critical", "High"] else colors.HexColor("#d97706")
                anom_table_rows.append([
                    Paragraph(str(a.get("timestamp", ""))[:16], table_cell_style),
                    Paragraph(str(a.get("department", "")), table_cell_style),
                    Paragraph(f"<font color='{sev_color}'><b>{a.get('severity')}</b></font>", table_cell_style),
                    Paragraph(str(a.get("anomaly_type", "")), table_cell_style),
                    Paragraph(str(a.get("reason", ""))[:70] + "...", table_cell_style),
                ])
            anom_tbl = Table(anom_table_rows, colWidths=[90, 105, 55, 95, 185])
            anom_tbl.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), SECONDARY_COLOR),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, BG_LIGHT]),
                ("GRID", (0, 0), (-1, -1), 0.5, BORDER_COLOR),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ("LEFTPADDING", (0, 0), (-1, -1), 5),
            ]))
            story.append(anom_tbl)
        story.append(Spacer(1, 14))

        # Energy Forecasting & Machine Learning Outlook
        story.append(Paragraph("4. Predictive Forecasting & 30-Day Outlook", h1_style))
        story.append(Paragraph(
            f"Model: <b>{forecast_data.get('model_name', 'RandomForest-TimeSeries')}</b> | "
            f"Validation MAE: <b>{forecast_data.get('mae', 0):.2f} kWh</b> | "
            f"RMSE: <b>{forecast_data.get('rmse', 0):.2f} kWh</b> | "
            f"Confidence: <b>{forecast_data.get('confidence_level_pct', 95.0)}%</b>",
            body_style,
        ))
        story.append(Spacer(1, 6))

        fc_summary = [
            [
                Paragraph("<b>Next 7-Day Forecast</b>", table_cell_bold),
                Paragraph(f"{forecast_data.get('next_7_days_kwh', 0):,.1f} kWh", table_cell_style),
                Paragraph("<b>Projected Monthly Load</b>", table_cell_bold),
                Paragraph(f"{forecast_data.get('expected_monthly_kwh', 0):,.1f} kWh", table_cell_style),
            ],
            [
                Paragraph("<b>Estimated Monthly Bill</b>", table_cell_bold),
                Paragraph(f"${forecast_data.get('estimated_future_bill', 0):,.2f}", table_cell_style),
                Paragraph("<b>Potential Wastage Risk</b>", table_cell_bold),
                Paragraph(f"{forecast_data.get('potential_wastage_kwh', 0):,.1f} kWh", table_cell_style),
            ],
        ]
        fc_tbl = Table(fc_summary, colWidths=[130, 135, 130, 135])
        fc_tbl.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), BG_LIGHT),
            ("BOX", (0, 0), (-1, -1), 1, BORDER_COLOR),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, BORDER_COLOR),
            ("PADDING", (0, 0), (-1, -1), 5),
        ]))
        story.append(fc_tbl)
        story.append(Spacer(1, 14))

        # Top Actionable Recommendations
        story.append(Paragraph("5. AI Sustainability Recommendations & Action Plan", h1_style))
        rec_rows = [
            [
                Paragraph("Priority", table_header_style),
                Paragraph("Initiative", table_header_style),
                Paragraph("Annual kWh Saved", table_header_style),
                Paragraph("Cost Savings ($)", table_header_style),
                Paragraph("CO2 Saved (kg)", table_header_style),
                Paragraph("Difficulty", table_header_style),
            ]
        ]
        for r in recommendations[:5]:
            rec_rows.append([
                Paragraph(f"<b>{r.get('priority')}</b>", table_cell_bold),
                Paragraph(r.get("title", "")[:45] + "...", table_cell_style),
                Paragraph(f"{r.get('est_savings_kwh', 0):,.0f}", table_cell_style),
                Paragraph(f"${r.get('est_monetary_savings', 0):,.2f}", table_cell_style),
                Paragraph(f"{r.get('est_co2_reduction', 0):,.0f}", table_cell_style),
                Paragraph(r.get("difficulty", "Moderate"), table_cell_style),
            ])

        rec_table = Table(rec_rows, colWidths=[60, 180, 85, 80, 75, 50])
        rec_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), PRIMARY_COLOR),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, CARD_BG]),
            ("GRID", (0, 0), (-1, -1), 0.5, BORDER_COLOR),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ]))
        story.append(rec_table)
        story.append(Spacer(1, 14))

        # Roadmap
        story.append(Paragraph("6. Sustainability Roadmap & Next Steps", h1_style))
        roadmap_text = (
            "<b>Phase 1 (Immediate 0–30 Days):</b> Implement BMS schedule setbacks for night and weekend "
            "HVAC and lighting operations. Address flagged zero-occupancy leaks.<br/>"
            "<b>Phase 2 (Medium Term 30–90 Days):</b> Calibrate chiller temperature setpoint to 23.5°C; "
            "perform ultrasonic acoustic leak detection across compressed air lines.<br/>"
            "<b>Phase 3 (Long Term 90–180 Days):</b> Evaluate rooftop solar photovoltaic capacity "
            "modeled in EcoMind What-If Simulator to target net-zero scope 2 emissions."
        )
        story.append(Paragraph(roadmap_text, body_style))
        story.append(Spacer(1, 16))

        # Footer Notice
        story.append(HRFlowable(width="100%", thickness=1, color=BORDER_COLOR, spaceAfter=8))
        story.append(Paragraph(
            "EcoMind AI © 2026. Automated Sustainability Platform. Predictions and savings are modeled estimates.",
            subtitle_style,
        ))

        doc.build(story)
        return output_path

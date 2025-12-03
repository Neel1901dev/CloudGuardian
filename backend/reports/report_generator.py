from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER
from datetime import datetime
import os
from config import settings

class ReportGenerator:
    """Generate PDF compliance reports"""
    
    def __init__(self):
        self.styles = getSampleStyleSheet()
        
    def generate_pdf(self, scan_id: str, db):
        """
        Generate comprehensive PDF compliance report
        
        Args:
            scan_id: Scan identifier or "latest"
            db: Database session
            
        Returns:
            Path to generated PDF file
        """
        from database.models import ScanResult
        
        # Get scan results
        if scan_id == "latest":
            results = db.query(ScanResult).order_by(ScanResult.timestamp.desc()).limit(100).all()
        else:
            results = db.query(ScanResult).filter(ScanResult.id == scan_id).all()
        
        if not results:
            raise ValueError("No scan results found")
        
        # Create PDF filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"compliance_report_{timestamp}.pdf"
        filepath = os.path.join(settings.REPORTS_DIR, filename)
        
        # Create PDF document
        doc = SimpleDocTemplate(filepath, pagesize=letter)
        story = []
        
        # Title
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#1a1a1a'),
            spaceAfter=30,
            alignment=TA_CENTER
        )
        story.append(Paragraph("Cloud Security Compliance Report", title_style))
        story.append(Spacer(1, 0.3*inch))
        
        # Executive Summary
        total = len(results)
        violations = [r for r in results if not r.is_compliant]
        compliant = total - len(violations)
        compliance_score = (compliant / total * 100) if total > 0 else 0
        
        summary_data = [
            ["Compliance Score", f"{compliance_score:.1f}%"],
            ["Total Resources Scanned", str(total)],
            ["Compliant Resources", str(compliant)],
            ["Violations Found", str(len(violations))],
            ["Report Generated", datetime.now().strftime("%Y-%m-%d %H:%M:%S")],
        ]
        
        if results:
            summary_data.append(["Scan Region", results[0].region])
            if results[0].account_id:
                summary_data.append(["AWS Account ID", results[0].account_id])
        
        summary_table = Table(summary_data, colWidths=[3*inch, 3*inch])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f0f0f0')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 12),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#cccccc'))
        ]))
        
        story.append(Paragraph("Executive Summary", self.styles['Heading2']))
        story.append(Spacer(1, 0.2*inch))
        story.append(summary_table)
        story.append(Spacer(1, 0.4*inch))
        
        # Violations by Severity
        severity_counts = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0}
        for v in violations:
            severity_counts[v.severity] = severity_counts.get(v.severity, 0) + 1
        
        story.append(Paragraph("Violations by Severity", self.styles['Heading2']))
        story.append(Spacer(1, 0.2*inch))
        
        severity_data = [["Severity", "Count"]]
        for severity, count in severity_counts.items():
            severity_data.append([severity, str(count)])
        
        severity_table = Table(severity_data, colWidths=[2*inch, 2*inch])
        severity_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#333333')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 14),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        story.append(severity_table)
        story.append(PageBreak())
        
        # Detailed Violations
        story.append(Paragraph("Detailed Violations", self.styles['Heading2']))
        story.append(Spacer(1, 0.2*inch))
        
        for i, violation in enumerate(violations[:20], 1):  # Limit to 20 violations
            story.append(Paragraph(f"<b>Violation #{i}</b>", self.styles['Heading3']))
            
            violation_details = [
                ["Resource Type", violation.resource_type],
                ["Resource ID", violation.resource_id],
                ["Violation", violation.violation_name],
                ["Severity", violation.severity],
                ["Framework", violation.compliance_framework],
            ]
            
            details_table = Table(violation_details, colWidths=[2*inch, 4*inch])
            details_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#e0e0e0')),
                ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey)
            ]))
            
            story.append(details_table)
            story.append(Spacer(1, 0.1*inch))
            
            # Description
            story.append(Paragraph("<b>Description:</b>", self.styles['Normal']))
            story.append(Paragraph(violation.description, self.styles['Normal']))
            story.append(Spacer(1, 0.1*inch))
            
            # Remediation
            story.append(Paragraph("<b>Remediation:</b>", self.styles['Normal']))
            remediation_text = violation.remediation_suggestion.replace('\n', '<br/>')
            story.append(Paragraph(remediation_text, self.styles['Normal']))
            story.append(Spacer(1, 0.3*inch))
        
        # Build PDF
        doc.build(story)
        
        return filepath

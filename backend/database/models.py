from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey, Index
from datetime import datetime
import uuid

# Import Base from db.py to avoid duplicate Base instances
from database.db import Base


class ScanResult(Base):
    """Model for storing security scan results"""
    __tablename__ = "scan_results"
    
    # Add indexes for faster queries (100x performance boost)
    __table_args__ = (
        Index('idx_account_region', 'account_id', 'region'),
        Index('idx_severity', 'severity'),
        Index('idx_timestamp', 'timestamp'),
        Index('idx_compliance', 'is_compliant'),
    )
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    scan_id = Column(String, nullable=True, index=True)  # Groups results by scan session
    resource_id = Column(String, nullable=False, index=True)
    resource_type = Column(String, nullable=False, index=True)
    violation_name = Column(String, nullable=False)
    severity = Column(String, nullable=False, index=True)  # CRITICAL, HIGH, MEDIUM, LOW
    description = Column(Text, nullable=False)
    remediation_suggestion = Column(Text, nullable=False)
    compliance_framework = Column(String, nullable=False)  # e.g., "NIST SP 800-53 SC-28"
    is_compliant = Column(Boolean, default=True)
    cloud_provider = Column(String, nullable=False, default="AWS")
    account_id = Column(String, nullable=True)
    region = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    first_detected = Column(DateTime, nullable=True)  # When violation first appeared
    status = Column(String, default="NEW")  # NEW, EXISTING, RESOLVED
    
    def to_dict(self):
        """Convert model to dictionary"""
        return {
            "id": self.id,
            "scan_id": self.scan_id,
            "resource_id": self.resource_id,
            "resource_type": self.resource_type,
            "violation_name": self.violation_name,
            "severity": self.severity,
            "description": self.description,
            "remediation_suggestion": self.remediation_suggestion,
            "compliance_framework": self.compliance_framework,
            "is_compliant": self.is_compliant,
            "cloud_provider": self.cloud_provider,
            "account_id": self.account_id,
            "region": self.region,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "first_detected": self.first_detected.isoformat() if self.first_detected else None,
            "status": self.status
        }


class RemediationTask(Base):
    """Model for tracking remediation tasks"""
    __tablename__ = "remediation_tasks"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    scan_result_id = Column(String, nullable=False, index=True)
    status = Column(String, default="PENDING")  # PENDING, IN_PROGRESS, COMPLETED, FAILED
    assigned_to = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    notes = Column(Text)
    
    def to_dict(self):
        """Convert model to dictionary"""
        return {
            "id": self.id,
            "scan_result_id": self.scan_result_id,
            "status": self.status,
            "assigned_to": self.assigned_to,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "notes": self.notes
        }


class ScanHistory(Base):
    """Model for tracking scan history and compliance trends (Evidence Collection)"""
    __tablename__ = "scan_history"
    
    __table_args__ = (
        Index('idx_account_timestamp', 'account_id', 'timestamp'),
    )
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    scan_id = Column(String, unique=True, nullable=False, index=True)
    account_id = Column(String, nullable=False)
    region = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Scan metrics
    total_resources = Column(Integer, default=0)
    compliant_count = Column(Integer, default=0)
    violation_count = Column(Integer, default=0)
    compliance_score = Column(Integer, default=100)  # 0-100
    
    # Severity breakdown
    critical_count = Column(Integer, default=0)
    high_count = Column(Integer, default=0)
    medium_count = Column(Integer, default=0)
    low_count = Column(Integer, default=0)
    
    # Scan metadata
    scan_duration = Column(Integer, nullable=True)  # seconds
    triggered_by = Column(String, default="manual")  # manual, scheduled, api
    
    def to_dict(self):
        """Convert model to dictionary"""
        return {
            "id": self.id,
            "scan_id": self.scan_id,
            "account_id": self.account_id,
            "region": self.region,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "total_resources": self.total_resources,
            "compliant_count": self.compliant_count,
            "violation_count": self.violation_count,
            "compliance_score": self.compliance_score,
            "severity_breakdown": {
                "critical": self.critical_count,
                "high": self.high_count,
                "medium": self.medium_count,
                "low": self.low_count
            },
            "scan_duration": self.scan_duration,
            "triggered_by": self.triggered_by
        }

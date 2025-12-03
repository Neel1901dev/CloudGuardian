from fastapi import FastAPI, HTTPException, BackgroundTasks, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from datetime import datetime
from pydantic import BaseModel
import logging

from database.db import engine, Base, get_db, init_db
from database.models import ScanResult, RemediationTask, ScanHistory
from scanners.aws_scanner import AWSScanner
from reports.report_generator import ReportGenerator
from config import settings

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Enterprise-grade cloud security compliance automation tool"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Database on startup
@app.on_event("startup")
async def startup_event():
    """Initialize database on application startup"""
    init_db()
    logger.info(f"{settings.APP_NAME} v{settings.APP_VERSION} started successfully")


# Pydantic models for request/response
class AWSScanRequest(BaseModel):
    account_id: str
    region: str = "us-east-1"


# API Routes

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": f"Welcome to {settings.APP_NAME}",
        "version": settings.APP_VERSION,
        "docs": "/docs"
    }


@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": settings.APP_VERSION
    }


@app.post("/api/scan/aws")
async def scan_aws(
    request: AWSScanRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Trigger AWS resource scanning"""
    try:
        scanner = AWSScanner(request.account_id, request.region)
        background_tasks.add_task(scanner.scan_all_resources, db)
        
        logger.info(f"AWS scan initiated for account {request.account_id} in region {request.region}")
        
        return {
            "message": "AWS scan initiated successfully",
            "account_id": request.account_id,
            "region": request.region,
            "status": "processing"
        }
    except Exception as e:
        logger.error(f"AWS scan error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/dashboard")
async def get_dashboard(db: Session = Depends(get_db)):
    """Get dashboard summary"""
    try:
        violations = db.query(ScanResult).all()
        
        # Calculate compliance score
        total_resources = len(violations)
        compliant_resources = sum(1 for v in violations if v.is_compliant)
        compliance_score = (compliant_resources / total_resources * 100) if total_resources > 0 else 100
        
        # Get summary by severity
        critical_count = sum(1 for v in violations if v.severity == "CRITICAL")
        high_count = sum(1 for v in violations if v.severity == "HIGH")
        medium_count = sum(1 for v in violations if v.severity == "MEDIUM")
        low_count = sum(1 for v in violations if v.severity == "LOW")
        
        return {
            "compliance_score": round(compliance_score, 2),
            "violations": [
                {
                    "resource_id": v.resource_id,
                    "resource_type": v.resource_type,
                    "violation": v.violation_name,
                    "severity": v.severity,
                    "description": v.description,
                    "remediation": v.remediation_suggestion,
                    "compliance_framework": v.compliance_framework,
                    "timestamp": v.timestamp.isoformat() if v.timestamp else None
                }
                for v in violations
            ],
            "summary": {
                "critical": critical_count,
                "high": high_count,
                "medium": medium_count,
                "low": low_count,
                "total_resources_scanned": total_resources
            }
        }
    except Exception as e:
        logger.error(f"Dashboard error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/violations")
async def get_violations(
    severity: str = None,
    resource_type: str = None,
    db: Session = Depends(get_db)
):
    """Get all violations with optional filtering"""
    try:
        query = db.query(ScanResult).filter(ScanResult.is_compliant == False)
        
        if severity:
            query = query.filter(ScanResult.severity == severity.upper())
        
        if resource_type:
            query = query.filter(ScanResult.resource_type == resource_type)
        
        violations = query.order_by(ScanResult.timestamp.desc()).all()
        
        return {
            "total": len(violations),
            "violations": [v.to_dict() for v in violations]
        }
    except Exception as e:
        logger.error(f"Violations query error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/remediation/{violation_id}")
async def get_remediation_details(violation_id: str, db: Session = Depends(get_db)):
    """Get detailed remediation steps for a specific violation"""
    try:
        violation = db.query(ScanResult).filter(ScanResult.id == violation_id).first()
        
        if not violation:
            raise HTTPException(status_code=404, detail="Violation not found")
        
        return {
            "violation_id": violation.id,
            "resource_id": violation.resource_id,
            "resource_type": violation.resource_type,
            "violation_name": violation.violation_name,
            "description": violation.description,
            "severity": violation.severity,
            "remediation_steps": violation.remediation_suggestion,
            "compliance_framework": violation.compliance_framework,
            "timestamp": violation.timestamp.isoformat()
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Remediation query error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/report/pdf")
async def generate_pdf_report(account_id: str = None, db: Session = Depends(get_db)):
    """Generate and download compliance report as PDF"""
    try:
        generator = ReportGenerator()
        pdf_path = generator.generate_pdf(account_id or "latest", db)
        
        return FileResponse(
            pdf_path,
            media_type="application/pdf",
            filename=f"compliance_report_{account_id or 'latest'}.pdf"
        )
    except Exception as e:
        logger.error(f"PDF generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/stats")
async def get_statistics(db: Session = Depends(get_db)):
    """Get compliance statistics"""
    try:
        results = db.query(ScanResult).all()
        
        severity_counts = {
            "CRITICAL": 0,
            "HIGH": 0,
            "MEDIUM": 0,
            "LOW": 0
        }
        
        resource_types = {}
        
        for result in results:
            if not result.is_compliant:
                severity_counts[result.severity] = severity_counts.get(result.severity, 0) + 1
                resource_types[result.resource_type] = resource_types.get(result.resource_type, 0) + 1
        
        return {
            "severity_breakdown": severity_counts,
            "resource_type_breakdown": resource_types,
            "total_violations": sum(severity_counts.values())
        }
    except Exception as e:
        logger.error(f"Statistics error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/history")
async def get_scan_history(
    account_id: str = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Get scan history timeline for evidence collection"""
    try:
        query = db.query(ScanHistory).order_by(ScanHistory.timestamp.desc())
        
        if account_id:
            query = query.filter(ScanHistory.account_id == account_id)
        
        history = query.limit(limit).all()
        
        return {
            "total": len(history),
            "history": [h.to_dict() for h in history]
        }
    except Exception as e:
        logger.error(f"History error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/history/{scan_id}")
async def get_scan_details(scan_id: str, db: Session = Depends(get_db)):
    """Get detailed information for a specific scan"""
    try:
        scan = db.query(ScanHistory).filter(ScanHistory.scan_id == scan_id).first()
        
        if not scan:
            raise HTTPException(status_code=404, detail="Scan not found")
        
        # Get all violations from this scan
        violations = db.query(ScanResult).filter(
            ScanResult.scan_id == scan_id
        ).all()
        
        return {
            "scan": scan.to_dict(),
            "violations": [v.to_dict() for v in violations]
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Scan details error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/trends")
async def get_compliance_trends(
    account_id: str = None,
    days: int = 30,
    db: Session = Depends(get_db)
):
    """Get compliance trends over time"""
    try:
        from datetime import timedelta
        
        cutoff_date = datetime.now() - timedelta(days=days)
        query = db.query(ScanHistory).filter(
            ScanHistory.timestamp >= cutoff_date
        )
        
        if account_id:
            query = query.filter(ScanHistory.account_id == account_id)
        
        scans = query.order_by(ScanHistory.timestamp.asc()).all()
        
        return {
            "trends": [
                {
                    "date": s.timestamp.isoformat(),
                    "compliance_score": s.compliance_score,
                    "violation_count": s.violation_count,
                    "severity_breakdown": {
                        "critical": s.critical_count,
                        "high": s.high_count,
                        "medium": s.medium_count,
                        "low": s.low_count
                    }
                }
                for s in scans
            ]
        }
    except Exception as e:
        logger.error(f"Trends error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# Continuous Monitoring Endpoints
@app.get("/api/monitoring/status")
async def get_monitoring_status():
    """Get current monitoring status and configuration"""
    try:
        from scheduler import get_monitoring_status
        return get_monitoring_status()
    except Exception as e:
        logger.error(f"Monitoring status error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


class MonitoringConfig(BaseModel):
    enabled: bool
    interval_hours: int
    account_id: str = None
    region: str = None


@app.post("/api/monitoring/configure")
async def configure_monitoring(config: MonitoringConfig):
    """Configure continuous monitoring settings (Admin only)"""
    try:
        from scheduler import configure_monitoring
        
        # Build accounts list if account provided
        accounts = []
        if config.account_id and config.region:
            accounts = [{
                "account_id": config.account_id,
                "region": config.region,
                "access_key": None,  # Will use default AWS credentials
                "secret_key": None
            }]
        
        result = configure_monitoring(
            enabled=config.enabled,
            interval_hours=config.interval_hours,
            accounts=accounts
        )
        
        return {
            "success": True,
            "config": result
        }
    except Exception as e:
        logger.error(f"Monitoring config error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/monitoring/start")
async def start_monitoring():
    """Start continuous monitoring"""
    try:
        from scheduler import start_monitoring
        config = start_monitoring()
        return {"success": True, "config": config}
    except Exception as e:
        logger.error(f"Start monitoring error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/monitoring/stop")
async def stop_monitoring():
    """Stop continuous monitoring"""
    try:
        from scheduler import stop_monitoring
        stop_monitoring()
        return {"success": True, "message": "Monitoring stopped"}
    except Exception as e:
        logger.error(f"Stop monitoring error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# User Access Reviews Endpoint
@app.get("/api/access-reviews")
async def get_access_reviews(
    account_id: str = None,
    region: str = "us-east-1"
):
    """Get IAM access review - analyze users and roles for overprivileged access"""
    try:
        from scanners.iam_scanner import IAMScanner
        
        logger.info(f"Starting IAM access review for region {region}")
        
        # Initialize IAM scanner
        scanner = IAMScanner(region=region)
        
        # Scan all users and roles
        results = scanner.scan_all()
        
        logger.info(f"IAM scan complete: {results['summary']['total_entities']} entities reviewed")
        
        return {
            "success": True,
            "data": results
        }
    
    except Exception as e:
        logger.error(f"Access review error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=settings.DEBUG)

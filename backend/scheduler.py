"""
Continuous Monitoring Scheduler
Automated background scans for compliance monitoring
"""
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from datetime import datetime
import logging
import json
import os

logger = logging.getLogger(__name__)

# Configuration file path
CONFIG_FILE = "monitoring_config.json"

# Global scheduler instance
scheduler = BackgroundScheduler()
scheduler.start()

# Default configuration
DEFAULT_CONFIG = {
    "enabled": False,
    "interval_hours": 24,
    "accounts": []  # List of {account_id, region, access_key, secret_key}
}


def load_config():
    """Load monitoring configuration from file"""
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, 'r') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Error loading monitoring config: {e}")
    return DEFAULT_CONFIG.copy()


def save_config(config):
    """Save monitoring configuration to file"""
    try:
        with open(CONFIG_FILE, 'w') as f:
            json.dump(config, f, indent=2)
        return True
    except Exception as e:
        logger.error(f"Error saving monitoring config: {e}")
        return False


def scheduled_scan_job():
    """Background job that runs scheduled scans"""
    from database.db import SessionLocal
    from database.models import ScanHistory
    from scanners.aws_scanner import AWSScanner
    import uuid
    
    logger.info("🔄 Starting scheduled compliance scan")
    
    config = load_config()
    
    if not config.get("enabled"):
        logger.info("Monitoring disabled, skipping scan")
        return
    
    accounts = config.get("accounts", [])
    
    if not accounts:
        logger.warning("No accounts configured for monitoring")
        return
    
    db = SessionLocal()
    
    try:
        for account in accounts:
            scan_id = str(uuid.uuid4())
            account_id = account.get("account_id")
            region = account.get("region")
            
            logger.info(f"Scanning account {account_id} in {region}")
            
            # Initialize scanner
            scanner = AWSScanner(
                account_id=account_id,
                region=region,
                access_key=account.get("access_key"),
                secret_key=account.get("secret_key")
            )
            
            # Run scan
            start_time = datetime.now()
            results = scanner.scan_all()
            scan_duration = int((datetime.now() - start_time).total_seconds())
            
            # Save results with scan_id
            from database.models import ScanResult
            
            for result in results:
                scan_result = ScanResult(
                    scan_id=scan_id,
                    resource_id=result["resource_id"],
                    resource_type=result["resource_type"],
                    violation_name=result["violation_name"],
                    severity=result["severity"],
                    description=result["description"],
                    remediation_suggestion=result["remediation_suggestion"],
                    compliance_framework=result["compliance_framework"],
                    is_compliant=result["is_compliant"],
                    cloud_provider="AWS",
                    account_id=account_id,
                    region=region,
                    first_detected=datetime.now(),
                    status="NEW"
                )
                db.add(scan_result)
            
            # Calculate compliance metrics
            total_resources = len(results)
            violations = [r for r in results if not r["is_compliant"]]
            violation_count = len(violations)
            compliant_count = total_resources - violation_count
            compliance_score = int((compliant_count / total_resources * 100)) if total_resources > 0 else 100
            
            # Count by severity
            severity_counts = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0}
            for v in violations:
                severity = v.get("severity", "LOW")
                severity_counts[severity] = severity_counts.get(severity, 0) + 1
            
            # Create scan history record
            history = ScanHistory(
                scan_id=scan_id,
                account_id=account_id,
                region=region,
                timestamp=datetime.now(),
                total_resources=total_resources,
                compliant_count=compliant_count,
                violation_count=violation_count,
                compliance_score=compliance_score,
                critical_count=severity_counts["CRITICAL"],
                high_count=severity_counts["HIGH"],
                medium_count=severity_counts["MEDIUM"],
                low_count=severity_counts["LOW"],
                scan_duration=scan_duration,
                triggered_by="scheduled"
            )
            db.add(history)
            db.commit()
            
            logger.info(f"✅ Scheduled scan completed: {compliance_score}% compliance, {violation_count} violations")
    
    except Exception as e:
        logger.error(f"Error in scheduled scan: {str(e)}")
        db.rollback()
    finally:
        db.close()


def configure_monitoring(enabled, interval_hours, accounts=None):
    """Configure continuous monitoring settings"""
    config = load_config()
    
    config["enabled"] = enabled
    config["interval_hours"] = interval_hours
    
    if accounts is not None:
        config["accounts"] = accounts
    
    # Remove existing jobs
    scheduler.remove_all_jobs()
    
    # Add new job if enabled
    if enabled:
        trigger = IntervalTrigger(hours=interval_hours)
        scheduler.add_job(
            scheduled_scan_job,
            trigger=trigger,
            id="compliance_scan",
            name="Automated Compliance Scan",
            replace_existing=True
        )
        logger.info(f"✅ Monitoring enabled: scanning every {interval_hours} hours")
    else:
        logger.info("❌ Monitoring disabled")
    
    save_config(config)
    return config


def get_monitoring_status():
    """Get current monitoring status"""
    config = load_config()
    
    next_run = None
    job = scheduler.get_job("compliance_scan")
    if job and job.next_run_time:
        next_run = job.next_run_time.isoformat()
    
    return {
        "enabled": config.get("enabled", False),
        "interval_hours": config.get("interval_hours", 24),
        "accounts_count": len(config.get("accounts", [])),
        "next_scan": next_run,
        "scheduler_running": scheduler.running
    }


def stop_monitoring():
    """Stop all scheduled scans"""
    config = load_config()
    config["enabled"] = False
    save_config(config)
    scheduler.remove_all_jobs()
    logger.info("Monitoring stopped")


def start_monitoring():
    """Start scheduled scans with current config"""
    config = load_config()
    return configure_monitoring(
        enabled=True,
        interval_hours=config.get("interval_hours", 24),
        accounts=config.get("accounts", [])
    )

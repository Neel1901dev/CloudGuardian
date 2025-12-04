# Project Status & Technical Implementation

> **Note for Resume/Interviews**: This document details the specific technical implementations and "under the hood" work completed so far. Use this to discuss the depth of your engineering work.

## 🟢 Implemented Features

### 1. AWS Resource Scanner Engine (`backend/scanners/aws_scanner.py`)
I have built a modular scanning engine using `boto3` that currently supports 5 key AWS services. The scanner is designed to be extensible for future services.

*   **S3 Security**:
    *   **Implementation**: Uses `s3_client.get_bucket_encryption` to check for Server-Side Encryption (SSE).
    *   **Compliance Check**: Flags buckets without AES-256 or KMS encryption (NIST SC-28).
*   **IAM Analysis**:
    *   **Implementation**: Iterates through users with `iam_client.list_attached_user_policies`.
    *   **Compliance Check**: Identifies users with `AdministratorAccess` or `PowerUserAccess` to enforce Least Privilege (NIST AC-6).
*   **Security Groups**:
    *   **Implementation**: Analyzes `IpPermissions` in `ec2_client.describe_security_groups`.
    *   **Compliance Check**: Detects `0.0.0.0/0` (open to world) on sensitive ports (NIST SC-7).
*   **CloudTrail Auditing**:
    *   **Implementation**: Checks `cloudtrail_client.get_trail_status`.
    *   **Compliance Check**: Verifies that logging is actively enabled for audit trails (NIST AU-2).
*   **RDS Database Protection**:
    *   **Implementation**: Inspects `StorageEncrypted` and `PubliclyAccessible` flags via `rds_client.describe_db_instances`.
    *   **Compliance Check**: Ensures databases are encrypted and not exposed to the public internet.

### 2. Real-time Compliance Dashboard (`frontend/src/components/`)
A React-based Single Page Application (SPA) that visualizes the backend data.

*   **Live Statistics**: `ComplianceScore.jsx` calculates a weighted score based on the number and severity of violations.
*   **Interactive Violations List**: `ViolationsList.jsx` renders a filterable table of issues, color-coded by severity (Critical, High, Medium).
*   **Remediation Guidance**: `RemediationModal.jsx` provides copy-pasteable AWS CLI commands to fix specific issues found during the scan.

### 3. Data Persistence & Reporting
*   **SQLite Database**: Uses **SQLAlchemy** ORM (`backend/database/models.py`) to store scan results, allowing for historical trend analysis.
*   **PDF Reporting**: `backend/reports/report_generator.py` generates professional compliance reports using `reportlab`, suitable for executive review.

---

## Tech Stack & Design Decisions

*   **Backend**: Python 3.11 + FastAPI
    *   *Why?* FastAPI provides high performance (async support) and automatic Swagger documentation, which sped up frontend integration.
*   **Frontend**: React 18 + Vite + Tailwind CSS
    *   *Why?* Vite offers instant HMR (Hot Module Replacement) for rapid development. Tailwind allows for building a professional "Enterprise UI" without writing custom CSS files.
*   **AWS Integration**: Boto3 SDK
    *   *Why?* The standard AWS SDK for Python provides comprehensive access to all AWS service APIs needed for deep inspection.

---

## 🚧 Current Limitations & Next Steps

*   **Single Account Only**: Currently scans the AWS account configured in the environment. *Next Step: Add support for AssumeRole to scan cross-account.*
*   **On-Demand Scanning**: Scans are triggered manually via API. *Next Step: Implement Celery/Redis for scheduled background scanning.*
*   **Read-Only**: The tool identifies issues but does not auto-remediate. *Next Step: Add an "Auto-Fix" button for simple issues like enabling S3 encryption.*

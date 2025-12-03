
<div align="center">

  # 🛡️ CloudGuardian - Cloud Security Compliance Tool

**Enterprise-grade cloud security compliance scanner for AWS resources**

[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18+-61dafb.svg)](https://reactjs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

</div>

---

## Overview

An automated cloud security compliance tool that scans AWS resources, validates them against **NIST SP 800-53** and **ISO 27001** frameworks, and provides actionable remediation suggestions through an interactive real-time dashboard.

### Key Highlights

-  **Multi-Service AWS Scanning**: S3, EC2, IAM, RDS, CloudTrail, Security Groups
-  **Real-time Compliance Dashboard**: Live compliance score and violation tracking
-  **Automated Remediation Guidance**: Step-by-step fixes with CLI commands
-  **Professional PDF Reports**: Executive summaries with compliance metrics
-  **Framework Alignment**: NIST SP 800-53 & ISO 27001 compliant
-  **AWS Free Tier Compatible**: No cost for basic usage

---

##  Features

### Cloud Resource Scanning
- ✅ **S3 Bucket Security**
  - Encryption verification (AES-256/KMS)
  - Public access detection
  - Versioning status checks

- ✅ **IAM Policy Analysis**
  - Overly permissive policy detection
  - Least privilege violations
  - Admin access flagging

- ✅ **Security Group Auditing**
  - Unrestricted inbound rules (0.0.0.0/0)
  - Port exposure analysis
  - Security best practices validation

- ✅ **CloudTrail Monitoring**
  - Logging status verification
  - Trail configuration checks
  - Compliance with audit requirements

- ✅ **EC2 Instance Security**
  - Security group associations
  - Public IP exposure
  - Instance metadata service configuration

- ✅ **RDS Database Protection**
  - Encryption-at-rest verification
  - Backup retention policies
  - Public accessibility checks

### Compliance & Reporting
- Real-time compliance score calculation
- Severity-based violation prioritization (Critical/High/Medium/Low)
- Historical trend analysis
- Exportable PDF compliance reports
- Framework-specific alignment (NIST/ISO)

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│          React Frontend (Dashboard)                 │
│  - Compliance Score Visualization                   │
│  - Real-time Violations List                        │
│  - Remediation Steps Modal                          │
└────────────────┬────────────────────────────────────┘
                 │ REST API
┌────────────────▼────────────────────────────────────┐
│           FastAPI Backend (Python)                   │
│  ┌──────────────────────────────────────────────┐  │
│  │         AWS Scanner Engine                    │  │
│  │  - S3 | IAM | EC2 | RDS | CloudTrail          │  │
│  └──────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────┐  │
│  │      Compliance Rule Engine                   │  │
│  │  - NIST SP 800-53 | ISO 27001                 │  │
│  └──────────────────────────────────────────────┘  │
└────────────┬───────────────────┬────────────────────┘
             │                   │
   ┌─────────▼────────┐   ┌─────▼──────────┐
   │   AWS SDK        │   │  SQLite DB     │
   │   (boto3)        │   │  (Audit Logs)  │
   └──────────────────┘   └────────────────┘
```

---

## Installation

### Prerequisites

- Python 3.11+
- Node.js 18+
- AWS Account (Free Tier)
- AWS CLI configured with credentials

### Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/cloud-security-compliance-tool.git
cd cloud-security-compliance-tool
```

### Step 2: Backend Setup

```bash
cd backend
pip install -r requirements.txt
```

### Step 3: Configure AWS Credentials

```bash
# Option 1: AWS CLI
aws configure

# Option 2: Environment Variables
export AWS_ACCESS_KEY_ID=your_access_key
export AWS_SECRET_ACCESS_KEY=your_secret_key
export AWS_DEFAULT_REGION=us-east-1
```

### Step 4: Frontend Setup

```bash
cd ../frontend
npm install
```

### Step 5: Run the Application

**Backend:**
```bash
cd backend
uvicorn app:app --reload
# API will be available at http://localhost:8000
```

**Frontend:**
```bash
cd frontend
npm run dev
# Dashboard will be available at http://localhost:3000
```

---

##  Usage

### Running a Compliance Scan

1. **Navigate to Dashboard**: Open `http://localhost:3000`
2. **Initiate Scan**: Click "Start AWS Scan" button
3. **Enter Details**: Provide AWS Account ID and Region
4. **View Results**: Monitor real-time compliance score updates
5. **Review Violations**: Click on violations for detailed remediation steps
6. **Export Report**: Download PDF compliance report

### API Endpoints

```http
POST   /api/scan/aws           # Trigger AWS resource scan
GET    /api/dashboard          # Retrieve compliance metrics
GET    /api/report/pdf/{id}    # Download PDF report
GET    /api/remediation/{id}   # Get remediation details
GET    /api/health             # Health check
```

### Example API Call

```bash
# Trigger AWS scan
curl -X POST "http://localhost:8000/api/scan/aws" \
  -H "Content-Type: application/json" \
  -d '{"aws_account_id": "123456789012", "region": "us-east-1"}'

# Get dashboard data
curl http://localhost:8000/api/dashboard
```

---

##  Security Best Practices

> [!IMPORTANT]
> **Use Read-Only IAM Permissions**: Create a dedicated IAM user with read-only policies

**Recommended IAM Policy:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetEncryptionConfiguration",
        "s3:GetBucketVersioning",
        "s3:ListAllMyBuckets",
        "ec2:DescribeSecurityGroups",
        "ec2:DescribeInstances",
        "iam:ListUsers",
        "iam:ListAttachedUserPolicies",
        "rds:DescribeDBInstances",
        "cloudtrail:DescribeTrails"
      ],
      "Resource": "*"
    }
  ]
}
```
py -m uvicorn app:app --reload --host 127.0.0.1 --port 8001
---

## Compliance Frameworks

### NIST SP 800-53 Controls Covered
- **AC-6**: Least Privilege
- **AU-2**: Audit Events
- **SC-7**: Boundary Protection
- **SC-28**: Protection of Information at Rest

### ISO 27001 Controls Covered
- **A.9.2.3**: Management of Privileged Access Rights
- **A.10.1.1**: Policy on the Use of Cryptographic Controls
- **A.12.4.1**: Event Logging
- **A.13.1.3**: Segregation in Networks

---

## Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up --build

# Access dashboard at http://localhost:3000
# API available at http://localhost:8000
```

---

##  Testing

```bash
# Run backend tests
cd backend
pytest tests/ -v

# Run frontend tests
cd frontend
npm test
```

---

## Screenshots

> Screenshots will be added as development progresses

---

## 🗺️ Roadmap & Status

> 🔍 **See [PROJECT_STATUS.md](PROJECT_STATUS.md) for a detailed breakdown of currently implemented features and technical internals.**

- [x] AWS Scanner Implementation
- [x] SQLite Database Integration
- [x] React Dashboard
- [x] PDF Report Generation
- [ ] Multi-account AWS scanning
- [ ] Azure/GCP support
- [ ] Automated remediation scripts
- [ ] CI/CD pipeline integration
- [ ] Slack/Email notifications

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Author

**Neel Suthar**
- GitHub: [@Neel1901Dev](https://github.com/Neel1901Dev)
- LinkedIn: [Neel Suthar](https://linkedin.com/in/neelsuthar)

---


<div align="center">

**⭐ Star this repository if you find it helpful!**

Made with ❤️ by [Neel Suthar]

</div>

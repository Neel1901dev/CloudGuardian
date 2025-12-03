import boto3
from botocore.exceptions import ClientError, NoCredentialsError
from typing import List, Dict
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class AWSScanner:
    """AWS Resource Scanner for compliance checking"""
    
    def __init__(self, account_id: str, region: str):
        self.account_id = account_id
        self.region = region
        
        try:
            # Initialize AWS clients
            self.s3_client = boto3.client('s3', region_name=region)
            self.ec2_client = boto3.client('ec2', region_name=region)
            self.iam_client = boto3.client('iam')
            self.cloudtrail_client = boto3.client('cloudtrail', region_name=region)
            self.rds_client = boto3.client('rds', region_name=region)
        except NoCredentialsError:
            logger.error("AWS credentials not found. Please configure AWS CLI or set environment variables.")
            raise
        
    def scan_s3_encryption(self) -> List[Dict]:
        """
        Check for unencrypted S3 buckets
        NIST SP 800-53: SC-28 (Protection of Information at Rest)
        ISO 27001: A.10.1.1 (Policy on the use of cryptographic controls)
        """
        violations = []
        try:
            response = self.s3_client.list_buckets()
            logger.info(f"Scanning {len(response['Buckets'])} S3 buckets for encryption...")
            
            for bucket in response['Buckets']:
                bucket_name = bucket['Name']
                try:
                    # Check encryption configuration
                    encryption = self.s3_client.get_bucket_encryption(Bucket=bucket_name)
                    if 'ServerSideEncryptionConfiguration' not in encryption:
                        violations.append({
                            'resource_id': bucket_name,
                            'resource_type': 'S3 Bucket',
                            'violation_name': 'Unencrypted S3 Bucket',
                            'severity': 'HIGH',
                            'description': f'S3 bucket "{bucket_name}" does not have encryption enabled',
                            'remediation': f'Enable default S3 bucket encryption:\n\naws s3api put-bucket-encryption --bucket {bucket_name} --server-side-encryption-configuration \'{{"Rules": [{{"ApplyServerSideEncryptionByDefault": {{"SSEAlgorithm": "AES256"}}}}]}}\'',
                            'compliance_framework': 'NIST SP 800-53 SC-28'
                        })
                except self.s3_client.exceptions.ServerSideEncryptionConfigurationNotFoundError:
                    violations.append({
                        'resource_id': bucket_name,
                        'resource_type': 'S3 Bucket',
                        'violation_name': 'S3 Encryption Not Configured',
                        'severity': 'CRITICAL',
                        'description': f'S3 bucket "{bucket_name}" has no encryption configuration',
                        'remediation': f'Enable S3 bucket encryption:\n\naws s3api put-bucket-encryption --bucket {bucket_name} --server-side-encryption-configuration \'{{"Rules": [{{"ApplyServerSideEncryptionByDefault": {{"SSEAlgorithm": "AES256"}}}}]}}\'',
                        'compliance_framework': 'ISO 27001 A.10.1.1'
                    })
                except ClientError as e:
                    if e.response['Error']['Code'] != 'AccessDenied':
                        logger.warning(f"Error checking bucket {bucket_name}: {str(e)}")
        except Exception as e:
            logger.error(f"S3 scanning error: {str(e)}")
        
        return violations

    def scan_iam_policies(self) -> List[Dict]:
        """
        Check for overly permissive IAM policies (least privilege violations)
        NIST SP 800-53: AC-6 (Least Privilege)
        """
        violations = []
        try:
            logger.info("Scanning IAM policies for least privilege violations...")
            
            paginator = self.iam_client.get_paginator('list_users')
            for page in paginator.paginate():
                for user in page['Users']:
                    username = user['UserName']
                    
                    # Check attached policies
                    try:
                        policies = self.iam_client.list_attached_user_policies(UserName=username)
                        for policy in policies['AttachedPolicies']:
                            if policy['PolicyName'] in ['AdministratorAccess', 'PowerUserAccess']:
                                violations.append({
                                    'resource_id': username,
                                    'resource_type': 'IAM User',
                                    'violation_name': 'Overly Permissive IAM Policy',
                                    'severity': 'CRITICAL',
                                    'description': f'IAM user "{username}" has {policy["PolicyName"]} policy attached, violating least privilege principle',
                                    'remediation': f'Review and apply principle of least privilege:\n\n1. Identify minimum required permissions for "{username}"\n2. Create custom policy with specific permissions\n3. Detach {policy["PolicyName"]} policy\n4. Attach new restricted policy',
                                    'compliance_framework': 'NIST SP 800-53 AC-6'
                                })
                    except ClientError as e:
                        logger.warning(f"Error checking user {username}: {str(e)}")
        except Exception as e:
            logger.error(f"IAM scanning error: {str(e)}")
        
        return violations

    def scan_security_groups(self) -> List[Dict]:
        """
        Check for overly permissive security groups
        NIST SP 800-53: SC-7 (Boundary Protection)
        """
        violations = []
        try:
            logger.info("Scanning security groups for unrestricted access...")
            
            response = self.ec2_client.describe_security_groups()
            for sg in response['SecurityGroups']:
                for rule in sg['IpPermissions']:
                    # Check for 0.0.0.0/0 (unrestricted access)
                    for ip_range in rule.get('IpRanges', []):
                        if ip_range.get('CidrIp') == '0.0.0.0/0':
                            port_info = "all ports" if not rule.get('FromPort') else f"port {rule.get('FromPort')}"
                            protocol = rule.get('IpProtocol', 'all')
                            
                            violations.append({
                                'resource_id': sg['GroupId'],
                                'resource_type': 'Security Group',
                                'violation_name': 'Unrestricted Inbound Access',
                                'severity': 'HIGH',
                                'description': f'Security group "{sg["GroupName"]}" ({sg["GroupId"]}) allows unrestricted inbound traffic from 0.0.0.0/0 on {port_info} ({protocol} protocol)',
                                'remediation': f'Restrict access to specific IP ranges:\n\n1. Review legitimate IP addresses that need access\n2. Remove 0.0.0.0/0 rule\n3. Add specific CIDR blocks:\n\naws ec2 revoke-security-group-ingress --group-id {sg["GroupId"]} --ip-permissions IpProtocol={protocol},FromPort={rule.get("FromPort", 0)},ToPort={rule.get("ToPort", 0)},IpRanges=[{{CidrIp=0.0.0.0/0}}]',
                                'compliance_framework': 'NIST SP 800-53 SC-7'
                            })
        except Exception as e:
            logger.error(f"Security group scanning error: {str(e)}")
        
        return violations

    def scan_cloudtrail_logging(self) -> List[Dict]:
        """
        Check if CloudTrail logging is enabled
        NIST SP 800-53: AU-2 (Audit Events)
        ISO 27001: A.12.4.1 (Event logging)
        """
        violations = []
        try:
            logger.info("Checking CloudTrail logging status...")
            
            response = self.cloudtrail_client.describe_trails()
            if not response['trailList']:
                violations.append({
                    'resource_id': f'account-{self.account_id}',
                    'resource_type': 'CloudTrail',
                    'violation_name': 'CloudTrail Not Enabled',
                    'severity': 'CRITICAL',
                    'description': f'No CloudTrail logging trails found in account {self.account_id}, region {self.region}. Audit logging is required for compliance.',
                    'remediation': 'Enable CloudTrail to log API calls and activities:\n\n1. Navigate to CloudTrail console\n2. Create a new trail\n3. Enable logging for all regions\n4. Configure S3 bucket for log storage\n5. Or use CLI:\n\naws cloudtrail create-trail --name my-trail --s3-bucket-name my-bucket',
                    'compliance_framework': 'NIST SP 800-53 AU-2'
                })
            else:
                # Check if trails are actually logging
                for trail in response['trailList']:
                    status = self.cloudtrail_client.get_trail_status(Name=trail['TrailARN'])
                    if not status.get('IsLogging', False):
                        violations.append({
                            'resource_id': trail['Name'],
                            'resource_type': 'CloudTrail',
                            'violation_name': 'CloudTrail Not Logging',
                            'severity': 'HIGH',
                            'description': f'CloudTrail "{trail["Name"]}" exists but is not actively logging',
                            'remediation': f'Enable logging for CloudTrail:\n\naws cloudtrail start-logging --name {trail["Name"]}',
                            'compliance_framework': 'ISO 27001 A.12.4.1'
                        })
        except Exception as e:
            logger.error(f"CloudTrail scanning error: {str(e)}")
        
        return violations

    def scan_rds_encryption(self) -> List[Dict]:
        """
        Check for unencrypted RDS instances
        NIST SP 800-53: SC-28 (Protection of Information at Rest)
        """
        violations = []
        try:
            logger.info("Scanning RDS instances for encryption...")
            
            response = self.rds_client.describe_db_instances()
            for db_instance in response['DBInstances']:
                db_id = db_instance['DBInstanceIdentifier']
                
                # Check encryption
                if not db_instance.get('StorageEncrypted', False):
                    violations.append({
                        'resource_id': db_id,
                        'resource_type': 'RDS Instance',
                        'violation_name': 'Unencrypted RDS Instance',
                        'severity': 'CRITICAL',
                        'description': f'RDS instance "{db_id}" does not have encryption at rest enabled',
                        'remediation': f'Enable encryption for RDS:\n\n1. Create snapshot of current instance\n2. Copy snapshot with encryption enabled\n3. Restore from encrypted snapshot\n4. Update application connection strings\n\nNote: Cannot enable encryption on existing instance directly.',
                        'compliance_framework': 'NIST SP 800-53 SC-28'
                    })
                
                # Check if publicly accessible
                if db_instance.get('PubliclyAccessible', False):
                    violations.append({
                        'resource_id': db_id,
                        'resource_type': 'RDS Instance',
                        'violation_name': 'Publicly Accessible RDS Instance',
                        'severity': 'CRITICAL',
                        'description': f'RDS instance "{db_id}" is publicly accessible from the internet',
                        'remediation': f'Disable public accessibility:\n\naws rds modify-db-instance --db-instance-identifier {db_id} --no-publicly-accessible',
                        'compliance_framework': 'NIST SP 800-53 SC-7'
                    })
        except Exception as e:
            logger.error(f"RDS scanning error: {str(e)}")
        
        return violations
    
    def scan_all_resources(self, db):
        """
        Execute all scans and save results to database
        Clear old scan results for this account/region first
        """
        from database.models import ScanResult
        from datetime import datetime
        
        logger.info(f"Starting comprehensive AWS scan for account {self.account_id} in region {self.region}")
        
        # Clear old scan results for this account/region
        try:
            old_results = db.query(ScanResult).filter(
                ScanResult.account_id == self.account_id,
                ScanResult.region == self.region
            ).all()
            
            for result in old_results:
                db.delete(result)
            
            db.commit()
            logger.info(f"Cleared {len(old_results)} old scan results")
        except Exception as e:
            logger.error(f"Error clearing old results: {str(e)}")
            db.rollback()
        
        # Run all scanners
        all_violations = []
        all_violations.extend(self.scan_s3_encryption())
        all_violations.extend(self.scan_iam_policies())
        all_violations.extend(self.scan_security_groups())
        all_violations.extend(self.scan_cloudtrail_logging())
        all_violations.extend(self.scan_rds_encryption())
        
        # Save to database
        for violation in all_violations:
            scan_result = ScanResult(
                resource_id=violation['resource_id'],
                resource_type=violation['resource_type'],
                violation_name=violation['violation_name'],
                severity=violation['severity'],
                description=violation['description'],
                remediation_suggestion=violation['remediation'],
                compliance_framework=violation['compliance_framework'],
                is_compliant=False,
                cloud_provider='AWS',
                account_id=self.account_id,
                region=self.region,
                timestamp=datetime.utcnow()
            )
            db.add(scan_result)
        
        db.commit()
        logger.info(f"Scan completed: {len(all_violations)} violations found and saved to database")

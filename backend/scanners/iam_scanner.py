"""
IAM Access Review Scanner
Analyzes IAM users, roles, and permissions to detect overprivileged access
"""
import boto3
from typing import List, Dict
import logging

logger = logging.getLogger(__name__)

# High-risk managed policies to flag
RISKY_POLICIES = [
    'AdministratorAccess',
    'PowerUserAccess',
    'IAMFullAccess',
    'SecurityAudit',
    '*FullAccess'
]

# Risky actions to detect
RISKY_ACTIONS = [
    'iam:*',
    's3:*',
    'ec2:*',
    '*:*'
]


class IAMScanner:
    """Scanner for IAM access review"""
    
    def __init__(self, region='us-east-1', access_key=None, secret_key=None):
        """Initialize IAM scanner"""
        if access_key and secret_key:
            self.iam_client = boto3.client(
                'iam',
                region_name=region,
                aws_access_key_id=access_key,
                aws_secret_access_key=secret_key
            )
        else:
            # Use default credentials
            self.iam_client = boto3.client('iam', region_name=region)
    
    def scan_users(self) -> List[Dict]:
        """Scan all IAM users and their permissions"""
        results = []
        
        try:
            # Get all users
            paginator = self.iam_client.get_paginator('list_users')
            
            for page in paginator.paginate():
                for user in page['Users']:
                    user_name = user['UserName']
                    user_arn = user['Arn']
                    created = user['CreateDate']
                    
                    # Get attached policies
                    attached_policies = self.get_attached_policies(user_name, 'user')
                    
                    # Get inline policies
                    inline_policies = self.get_inline_policies(user_name, 'user')
                    
                    # Analyze risk
                    risk_level, risk_reasons = self.analyze_risk(
                        attached_policies, 
                        inline_policies
                    )
                    
                    # Get last activity
                    last_activity = self.get_last_activity(user_name)
                    
                    results.append({
                        'type': 'user',
                        'name': user_name,
                        'arn': user_arn,
                        'created_date': created.isoformat(),
                        'last_activity': last_activity,
                        'attached_policies': attached_policies,
                        'inline_policies': inline_policies,
                        'risk_level': risk_level,
                        'risk_reasons': risk_reasons,
                        'total_policies': len(attached_policies) + len(inline_policies)
                    })
        
        except Exception as e:
            logger.error(f"Error scanning IAM users: {str(e)}")
            raise
        
        return results
    
    def scan_roles(self) -> List[Dict]:
        """Scan all IAM roles and their permissions"""
        results = []
        
        try:
            # Get all roles
            paginator = self.iam_client.get_paginator('list_roles')
            
            for page in paginator.paginate():
                for role in page['Roles']:
                    role_name = role['RoleName']
                    role_arn = role['Arn']
                    created = role['CreateDate']
                    
                    # Skip AWS service roles
                    if role_name.startswith('AWS'):
                        continue
                    
                    # Get attached policies
                    attached_policies = self.get_attached_policies(role_name, 'role')
                    
                    # Get inline policies
                    inline_policies = self.get_inline_policies(role_name, 'role')
                    
                    # Analyze risk
                    risk_level, risk_reasons = self.analyze_risk(
                        attached_policies,
                        inline_policies
                    )
                    
                    results.append({
                        'type': 'role',
                        'name': role_name,
                        'arn': role_arn,
                        'created_date': created.isoformat(),
                        'attached_policies': attached_policies,
                        'inline_policies': inline_policies,
                        'risk_level': risk_level,
                        'risk_reasons': risk_reasons,
                        'total_policies': len(attached_policies) + len(inline_policies)
                    })
        
        except Exception as e:
            logger.error(f"Error scanning IAM roles: {str(e)}")
            raise
        
        return results
    
    def get_attached_policies(self, entity_name: str, entity_type: str) -> List[str]:
        """Get attached managed policies"""
        policies = []
        
        try:
            if entity_type == 'user':
                response = self.iam_client.list_attached_user_policies(UserName=entity_name)
            else:  # role
                response = self.iam_client.list_attached_role_policies(RoleName=entity_name)
            
            for policy in response.get('AttachedPolicies', []):
                policies.append(policy['PolicyName'])
        
        except Exception as e:
            logger.error(f"Error getting attached policies: {str(e)}")
        
        return policies
    
    def get_inline_policies(self, entity_name: str, entity_type: str) -> List[str]:
        """Get inline policy names"""
        policies = []
        
        try:
            if entity_type == 'user':
                response = self.iam_client.list_user_policies(UserName=entity_name)
            else:  # role
                response = self.iam_client.list_role_policies(RoleName=entity_name)
            
            policies = response.get('PolicyNames', [])
        
        except Exception as e:
            logger.error(f"Error getting inline policies: {str(e)}")
        
        return policies
    
    def analyze_risk(self, attached_policies: List[str], inline_policies: List[str]) -> tuple:
        """Analyze risk level based on policies"""
        risk_reasons = []
        
        # Check for risky managed policies
        for policy in attached_policies:
            if policy in RISKY_POLICIES:
                risk_reasons.append(f"Has {policy} policy")
            elif 'FullAccess' in policy:
                risk_reasons.append(f"Has {policy} policy")
        
        # Check total number of policies
        total = len(attached_policies) + len(inline_policies)
        if total > 10:
            risk_reasons.append(f"Has {total} policies (excessive)")
        
        # Check for inline policies (less secure)
        if len(inline_policies) > 0:
            risk_reasons.append(f"Has {len(inline_policies)} inline policies")
        
        # Determine risk level
        if 'AdministratorAccess' in attached_policies or 'IAMFullAccess' in attached_policies:
            risk_level = 'CRITICAL'
        elif len(risk_reasons) >= 3:
            risk_level = 'HIGH'
        elif len(risk_reasons) > 0:
            risk_level = 'MEDIUM'
        else:
            risk_level = 'LOW'
        
        return risk_level, risk_reasons
    
    def get_last_activity(self, user_name: str) -> str:
        """Get last activity timestamp for user"""
        try:
            response = self.iam_client.get_user(UserName=user_name)
            # Try to get password last used
            if 'PasswordLastUsed' in response['User']:
                return response['User']['PasswordLastUsed'].isoformat()
        except Exception as e:
            logger.debug(f"Could not get last activity for {user_name}")
        
        return None
    
    def scan_all(self) -> Dict:
        """Scan both users and roles"""
        users = self.scan_users()
        roles = self.scan_roles()
        
        # Calculate summary stats
        total_entities = len(users) + len(roles)
        
        critical_count = len([e for e in users + roles if e['risk_level'] == 'CRITICAL'])
        high_count = len([e for e in users + roles if e['risk_level'] == 'HIGH'])
        medium_count = len([e for e in users + roles if e['risk_level'] == 'MEDIUM'])
        low_count = len([e for e in users + roles if e['risk_level'] == 'LOW'])
        
        return {
            'users': users,
            'roles': roles,
            'summary': {
                'total_entities': total_entities,
                'total_users': len(users),
                'total_roles': len(roles),
                'critical_risk': critical_count,
                'high_risk': high_count,
                'medium_risk': medium_count,
                'low_risk': low_count
            }
        }

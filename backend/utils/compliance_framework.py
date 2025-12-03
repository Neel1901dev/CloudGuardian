"""
Compliance framework definitions and mappings
"""

# NIST SP 800-53 Rev 5 Controls
NIST_CONTROLS = {
    "AC-6": {
        "name": "Least Privilege",
        "description": "Employ the principle of least privilege, allowing only authorized accesses for users which are necessary to accomplish assigned organizational tasks."
    },
    "AU-2": {
        "name": "Audit Events",
        "description": "Identify the types of events that the system is capable of logging in support of the audit logging function."
    },
    "SC-7": {
        "name": "Boundary Protection",
        "description": "Monitor and control communications at the external interfaces to the system and at key internal interfaces within the system."
    },
    "SC-28": {
        "name": "Protection of Information at Rest",
        "description": "Protect the confidentiality and integrity of information at rest."
    }
}

# ISO 27001:2022 Controls
ISO_27001_CONTROLS = {
    "A.9.2.3": {
        "name": "Management of Privileged Access Rights",
        "description": "The allocation and use of privileged access rights shall be restricted and controlled."
    },
    "A.10.1.1": {
        "name": "Policy on the Use of Cryptographic Controls",
        "description": "A policy on the use of cryptographic controls for protection of information shall be developed and implemented."
    },
    "A.12.4.1": {
        "name": "Event Logging",
        "description": "Event logs recording user activities, exceptions, faults and information security events shall be produced, kept and regularly reviewed."
    },
    "A.13.1.3": {
        "name": "Segregation in Networks",
        "description": "Groups of information services, users and information systems shall be segregated on networks."
    }
}

# Severity levels
SEVERITY_LEVELS = {
    "CRITICAL": {
        "score": 10,
        "description": "Immediate action required - severe security risk"
    },
    "HIGH": {
        "score": 7,
        "description": "High priority - significant security concern"
    },
    "MEDIUM": {
        "score": 4,
        "description": "Medium priority - moderate security issue"
    },
    "LOW": {
        "score": 2,
        "description": "Low priority - minor security consideration"
    }
}

def get_compliance_score(violations: list) -> float:
    """
    Calculate compliance score based on violations
    
    Args:
        violations: List of violation dictionaries
        
    Returns:
        Compliance score (0-100)
    """
    if not violations:
        return 100.0
    
    total_severity = sum(SEVERITY_LEVELS[v.get('severity', 'LOW')]['score'] for v in violations)
    max_possible = len(violations) * 10  # Maximum severity is 10
    
    compliance_score = max(0, 100 - (total_severity / max_possible * 100))
    return round(compliance_score, 2)

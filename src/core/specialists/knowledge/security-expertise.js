/**
 * BUMBA Security Specialists Expertise
 * Enhanced knowledge for Cybersecurity, Information Security, and Security Architecture specialists
 * Sprint 15 Implementation
 */

class SecurityExpertise {
  /**
   * Cybersecurity Expert Knowledge
   */
  static getCybersecurityExpertise() {
    return {
      name: 'Cybersecurity Expert',
      expertise: {
        core: {
          threat_analysis: 'Threat modeling, risk assessment, vulnerability analysis',
          incident_response: 'DFIR, forensics, malware analysis, breach containment',
          penetration_testing: 'Ethical hacking, red team exercises, vulnerability assessments',
          security_operations: 'SOC operations, SIEM, threat hunting, monitoring',
          compliance: 'Regulatory frameworks, audit preparation, compliance management'
        },
        
        offensive_security: {
          penetration_testing: 'Web app, network, wireless, mobile penetration testing',
          red_teaming: 'Advanced persistent threat simulation, social engineering',
          vulnerability_research: 'Zero-day discovery, exploit development, CVE analysis',
          tools: 'Metasploit, Burp Suite, Nmap, Wireshark, Kali Linux'
        },
        
        defensive_security: {
          detection: 'SIEM, EDR, network monitoring, behavioral analysis',
          prevention: 'Firewalls, IPS, antimalware, access controls',
          response: 'Incident response, forensics, recovery procedures',
          threat_intelligence: 'IOC analysis, threat feeds, attribution'
        },
        
        frameworks: {
          nist: 'NIST Cybersecurity Framework, risk management',
          iso27001: 'Information security management systems',
          mitre: 'MITRE ATT&CK framework, threat modeling',
          owasp: 'OWASP Top 10, secure coding practices',
          sans: 'SANS incident response, digital forensics'
        },
        
        technologies: {
          cloud_security: 'AWS, Azure, GCP security, container security',
          network_security: 'Firewalls, VPN, zero trust, network segmentation',
          endpoint_security: 'EDR, antimalware, device management',
          application_security: 'SAST, DAST, secure coding, DevSecOps'
        }
      },
      
      capabilities: [
        'Threat assessment and risk analysis',
        'Penetration testing and vulnerability assessment',
        'Incident response and digital forensics',
        'Security operations center (SOC) management',
        'Malware analysis and reverse engineering',
        'Red team and adversarial simulation',
        'Security awareness training and education',
        'Compliance and regulatory framework implementation',
        'Cloud security architecture and implementation',
        'Network security design and monitoring',
        'Application security testing and remediation',
        'Threat intelligence analysis and correlation',
        'Security tool deployment and management',
        'Business continuity and disaster recovery',
        'Security metrics and reporting',
        'Zero trust architecture implementation'
      ],
      
      systemPromptAdditions: `
You are a Cybersecurity expert specializing in:
- Threat analysis, risk assessment, and vulnerability management
- Penetration testing, red teaming, and offensive security operations
- Incident response, digital forensics, and security operations
- Security frameworks, compliance, and governance
- Cloud security, network security, and application security
- Threat intelligence, malware analysis, and attribution
- Security architecture design and implementation

Always prioritize defense in depth, assume breach mentality, and focus on business risk reduction.`,

      bestPractices: [
        'Implement defense in depth security strategies',
        'Assume breach and design resilient systems',
        'Conduct regular risk assessments and threat modeling',
        'Maintain updated threat intelligence and IOCs',
        'Implement continuous security monitoring and detection',
        'Practice incident response procedures regularly',
        'Keep security tools and signatures up to date',
        'Implement principle of least privilege access',
        'Conduct regular security awareness training',
        'Maintain detailed security documentation and playbooks',
        'Implement security by design in all systems',
        'Use threat-informed defense strategies',
        'Regularly test and validate security controls',
        'Implement proper logging and audit trails',
        'Maintain business continuity and recovery plans'
      ],
      
      codePatterns: {
        incidentResponse: `
# Incident Response Playbook Template

## Incident Classification
**Severity Levels:**
- Critical: Data breach, ransomware, system compromise
- High: Unauthorized access, malware infection, service disruption
- Medium: Policy violation, suspicious activity, failed attacks
- Low: Informational alerts, minor policy violations

## Response Procedures

### Phase 1: Identification and Initial Response
1. **Alert Validation**
   - Verify the incident is genuine
   - Assess initial scope and impact
   - Classify severity level

2. **Notification**
   - Notify incident response team
   - Escalate to management if critical
   - Document initial findings

### Phase 2: Containment
1. **Immediate Containment**
   - Isolate affected systems
   - Preserve evidence
   - Prevent lateral movement

2. **System Containment**
   - Network segmentation
   - Account lockdown
   - Service isolation

### Phase 3: Eradication and Recovery
1. **Root Cause Analysis**
   - Identify attack vectors
   - Assess vulnerabilities
   - Implement fixes

2. **System Recovery**
   - Rebuild compromised systems
   - Restore from clean backups
   - Validate system integrity

### Phase 4: Post-Incident Activities
1. **Lessons Learned**
   - Document timeline
   - Identify improvements
   - Update procedures

2. **Communication**
   - Stakeholder briefing
   - Regulatory reporting
   - Customer notification`,

        threatModel: `
# Threat Modeling Framework

## Asset Identification
**Critical Assets:**
- Customer data (PII, financial information)
- Intellectual property and trade secrets
- System infrastructure and applications
- Business processes and operations

## Threat Actor Analysis
**External Threats:**
- Nation-state actors (APT groups)
- Cybercriminals (ransomware, fraud)
- Hacktivists (ideological motivation)
- Script kiddies (opportunistic attacks)

**Internal Threats:**
- Malicious insiders (privilege abuse)
- Negligent employees (accidental exposure)
- Compromised accounts (credential theft)
- Third-party vendors (supply chain)

## Attack Vector Assessment
**Network-based Attacks:**
- Lateral movement and privilege escalation
- Network reconnaissance and scanning
- Man-in-the-middle attacks
- DDoS and availability attacks

**Application-based Attacks:**
- SQL injection and code injection
- Cross-site scripting (XSS)
- Authentication bypass
- Business logic flaws

**Social Engineering:**
- Phishing and spear phishing
- Pretexting and baiting
- Physical social engineering
- Business email compromise

## Risk Assessment Matrix
| Threat | Likelihood | Impact | Risk Level | Mitigation Priority |
|--------|------------|--------|------------|-------------------|
| Ransomware | High | Critical | Critical | Immediate |
| Data Breach | Medium | High | High | Short-term |
| Insider Threat | Low | High | Medium | Medium-term |
| DDoS Attack | Medium | Medium | Medium | Medium-term |`,

        securityMonitoring: `
# Security Monitoring and Detection Rules

## SIEM Rule Templates

### Suspicious Login Activity
```
rule_name: "Multiple Failed Logins"
description: "Detect brute force login attempts"
query: |
  eventType="authentication" AND 
  result="failure" AND
  source_ip=* |
  stats count by source_ip, user |
  where count > 10
severity: "medium"
action: "alert_and_block"
```

### Privilege Escalation Detection
```
rule_name: "Privilege Escalation Attempt"
description: "Detect unauthorized privilege escalation"
query: |
  eventType="privilege_change" AND
  (action="sudo" OR action="runas" OR action="elevation") |
  where user NOT IN (admin_users) AND
  destination_privilege IN ("administrator", "root", "system")
severity: "high"
action: "immediate_alert"
```

### Data Exfiltration Detection
```
rule_name: "Unusual Data Transfer"
description: "Detect potential data exfiltration"
query: |
  eventType="network_traffic" AND
  bytes_out > 100MB AND
  destination_external=true |
  stats sum(bytes_out) by source_host |
  where sum > 1GB
severity: "high"
action: "alert_and_investigate"
```

## Threat Hunting Queries

### PowerShell Execution Analysis
```
# Hunt for suspicious PowerShell activity
index=windows EventCode=4103 OR EventCode=4104
| search "powershell.exe" 
| eval suspicious_commands=case(
    match(CommandLine, "(?i)(invoke-expression|iex|downloadstring|invoke-webrequest)"), "Download/Execute",
    match(CommandLine, "(?i)(bypass|unrestricted|hidden|encoded)"), "Evasion",
    match(CommandLine, "(?i)(mimikatz|password|credential)"), "Credential Access"
)
| where isnotnull(suspicious_commands)
| stats count by Computer, User, suspicious_commands
```

### Network Beacon Detection
```
# Detect potential C2 beacons
index=network_logs
| eval time_diff=_time-lag(_time)
| where time_diff > 0
| stats count, avg(time_diff) as avg_interval, stdev(time_diff) as stdev_interval by src_ip, dest_ip, dest_port
| where count > 50 AND avg_interval < 3600 AND stdev_interval < (avg_interval * 0.1)
| eval regularity_score=(count * (3600/avg_interval)) / (stdev_interval + 1)
| where regularity_score > 100
```

## Incident Response Automation
```python
# Automated incident response script
import requests
import json
from datetime import datetime

class IncidentResponse:
    def __init__(self, siem_api, firewall_api, edr_api):
        self.siem_api = siem_api
        self.firewall_api = firewall_api
        self.edr_api = edr_api
    
    def respond_to_malware_detection(self, alert_data):
        """Automated response to malware detection"""
        host_ip = alert_data['host_ip']
        malware_hash = alert_data['malware_hash']
        
        # Step 1: Isolate the host
        self.isolate_host(host_ip)
        
        # Step 2: Block malware hash globally
        self.block_malware_hash(malware_hash)
        
        # Step 3: Search for similar indicators
        self.hunt_similar_threats(malware_hash)
        
        # Step 4: Create incident ticket
        self.create_incident_ticket(alert_data)
    
    def isolate_host(self, host_ip):
        """Isolate compromised host"""
        isolation_rule = {
            "action": "block",
            "source": host_ip,
            "destination": "any",
            "description": f"Automated isolation - malware detected on {host_ip}"
        }
        
        response = requests.post(
            f"{self.firewall_api}/rules",
            json=isolation_rule,
            headers={"Authorization": "Bearer <token>"}
        )
        
        if response.status_code == 200:
            print(f"Successfully isolated host {host_ip}")
        else:
            print(f"Failed to isolate host {host_ip}: {response.text}")
```
      }
    };
  }
  
  /**
   * Information Security Expert Knowledge
   */
  static getInformationSecurityExpertise() {
    return {
      name: 'Information Security Expert',
      expertise: {
        core: {
          governance: 'Security governance, policy development, risk management',
          compliance: 'Regulatory compliance, audit management, control frameworks',
          risk_management: 'Risk assessment, treatment, monitoring, reporting',
          data_protection: 'Data classification, privacy, encryption, DLP',
          access_management: 'Identity management, access control, privilege management'
        },
        
        frameworks: {
          iso27001: 'ISO 27001/27002, ISMS implementation and management',
          nist: 'NIST Framework, SP 800 series, risk management',
          cobit: 'COBIT governance framework, IT control objectives',
          coso: 'COSO internal controls, enterprise risk management',
          itil: 'ITIL service management, security service delivery'
        },
        
        compliance: {
          regulations: 'GDPR, CCPA, HIPAA, SOX, PCI DSS',
          standards: 'ISO 27001, SOC 2, FedRAMP, Common Criteria',
          industry: 'Financial services, healthcare, government',
          auditing: 'Internal audit, external audit, compliance reporting'
        },
        
        data_security: {
          classification: 'Data classification schemes, handling procedures',
          encryption: 'Encryption at rest, in transit, key management',
          privacy: 'Privacy by design, data minimization, consent management',
          dlp: 'Data loss prevention, monitoring, enforcement'
        },
        
        business: {
          continuity: 'Business continuity planning, disaster recovery',
          vendor_management: 'Third-party risk, vendor assessments',
          training: 'Security awareness, training programs',
          metrics: 'Security metrics, KPIs, reporting dashboards'
        }
      },
      
      capabilities: [
        'Information security governance and strategy',
        'Risk assessment and management programs',
        'Compliance framework implementation',
        'Security policy and procedure development',
        'Data protection and privacy program management',
        'Identity and access management strategy',
        'Security awareness training programs',
        'Vendor risk management and assessment',
        'Business continuity and disaster recovery planning',
        'Security metrics and KPI development',
        'Audit coordination and compliance reporting',
        'Regulatory compliance management',
        'Security control design and implementation',
        'Incident management and communication',
        'Security architecture review and approval',
        'Third-party security assessment'
      ],
      
      systemPromptAdditions: `
You are an Information Security expert specializing in:
- Information security governance, strategy, and risk management
- Regulatory compliance and audit management
- Data protection, privacy, and classification programs
- Security policy development and implementation
- Business continuity and disaster recovery planning
- Identity and access management frameworks
- Security awareness and training programs

Always focus on business alignment, regulatory compliance, and risk-based decision making.`,

      bestPractices: [
        'Align security strategy with business objectives',
        'Implement risk-based security decision making',
        'Maintain comprehensive security policies and procedures',
        'Conduct regular risk assessments and reviews',
        'Implement data classification and handling procedures',
        'Establish clear roles and responsibilities',
        'Maintain compliance with applicable regulations',
        'Implement continuous monitoring and improvement',
        'Provide regular security awareness training',
        'Document all security processes and decisions',
        'Implement proper change management procedures',
        'Maintain vendor risk management programs',
        'Establish incident communication procedures',
        'Regular review and update of security controls',
        'Implement proper audit trails and logging'
      ],
      
      codePatterns: {
        securityPolicy: `
# Information Security Policy Template

## 1. Purpose and Scope
This policy establishes the framework for protecting [Organization] information assets and ensuring compliance with applicable laws and regulations.

**Scope:** All employees, contractors, and third parties with access to organizational information.

## 2. Data Classification

### Classification Levels:
**Public:** Information intended for public disclosure
- Marketing materials, public website content
- Handling: No special protection required

**Internal:** Information for internal use only
- Internal communications, policies, procedures
- Handling: Standard business protection

**Confidential:** Sensitive business information
- Financial data, strategic plans, customer lists
- Handling: Restricted access, encryption required

**Restricted:** Highly sensitive information
- Personal data, trade secrets, security information
- Handling: Strict access controls, monitoring required

## 3. Access Control Requirements

### User Access Management:
- Access granted based on business need and least privilege
- Regular access reviews (quarterly for privileged accounts)
- Immediate access revocation upon role change/termination
- Multi-factor authentication for all remote access

### Privileged Access:
- Separate privileged accounts for administrative functions
- Regular review and approval of privileged access
- Monitoring and logging of all privileged activities
- Periodic recertification of privileged access rights

## 4. Data Protection Requirements

### Encryption Standards:
- AES-256 for data at rest
- TLS 1.3 for data in transit
- Key management using hardware security modules
- Regular key rotation (annually or as required)

### Data Handling:
- Secure disposal of confidential information
- Authorized data transfer methods only
- Data backup and recovery procedures
- Incident reporting for data breaches

## 5. Compliance Requirements
- Annual policy review and approval
- Security awareness training (mandatory)
- Regular compliance assessments
- Incident reporting within 24 hours`,

        riskAssessment: `
# Risk Assessment Framework

## Risk Identification Process

### Asset Inventory
1. **Information Assets**
   - Customer databases
   - Financial systems
   - Intellectual property
   - Business applications

2. **Technology Assets**
   - Servers and infrastructure
   - Network equipment
   - Endpoints and mobile devices
   - Cloud services

3. **People Assets**
   - Employees and contractors
   - Third-party vendors
   - Business partners
   - Customers

### Threat Assessment
**Threat Categories:**
- Malicious attacks (external/internal)
- System failures and errors
- Natural disasters
- Regulatory changes

### Vulnerability Analysis
**Technical Vulnerabilities:**
- Unpatched systems
- Misconfigurations
- Weak authentication
- Inadequate monitoring

**Process Vulnerabilities:**
- Insufficient training
- Poor change management
- Lack of documentation
- Inadequate testing

## Risk Calculation Matrix

| Likelihood | Impact Level | Risk Score |
|------------|-------------|------------|
| Very High (5) | Critical (5) | 25 (Critical) |
| High (4) | High (4) | 16 (High) |
| Medium (3) | Medium (3) | 9 (Medium) |
| Low (2) | Low (2) | 4 (Low) |
| Very Low (1) | Minimal (1) | 1 (Minimal) |

## Risk Treatment Options
1. **Accept:** Document and monitor
2. **Avoid:** Eliminate the risk source
3. **Mitigate:** Implement controls
4. **Transfer:** Insurance or outsourcing

## Risk Monitoring Plan
- Monthly review of critical risks
- Quarterly risk assessment updates
- Annual comprehensive risk review
- Continuous monitoring of key indicators`,

        complianceFramework: `
# Compliance Management Framework

## Regulatory Mapping

### GDPR Compliance Program
**Article 32 - Security Requirements:**
- Implement appropriate technical and organizational measures
- Regular testing and evaluation of security measures
- Encryption and pseudonymization where appropriate
- Ability to restore availability of personal data

**Implementation Controls:**
- Data protection impact assessments (DPIA)
- Privacy by design and default
- Data subject rights management
- Breach notification procedures (72 hours)

### SOC 2 Type II Controls
**Security Principle:**
- Logical and physical access controls
- System operation controls
- Change management controls
- Risk mitigation controls

**Availability Principle:**
- Performance monitoring
- Capacity planning
- System backup and recovery
- Environmental protection

**Processing Integrity:**
- Data validation controls
- Error handling procedures
- Processing authorization
- Data completeness checks

## Audit Management

### Internal Audit Program
**Quarterly Reviews:**
- Access management controls
- Change management processes
- Incident response procedures
- Security awareness effectiveness

**Annual Assessments:**
- Comprehensive control testing
- Risk assessment updates
- Policy review and updates
- Third-party risk assessments

### External Audit Coordination
**Preparation Activities:**
- Evidence collection and organization
- Control documentation updates
- Staff interview preparation
- Remediation of prior findings

**Audit Response:**
- Finding documentation and analysis
- Corrective action planning
- Implementation timeline development
- Follow-up validation testing

## Compliance Reporting Dashboard
```sql
-- Compliance metrics query
SELECT 
    compliance_area,
    total_controls,
    controls_tested,
    controls_passed,
    ROUND((controls_passed * 100.0 / controls_tested), 2) as pass_rate,
    outstanding_findings,
    overdue_findings
FROM compliance_scorecard
WHERE reporting_period = CURRENT_QUARTER()
ORDER BY pass_rate ASC;
```

## Continuous Monitoring
- Real-time compliance dashboards
- Automated control testing where possible
- Exception reporting and investigation
- Trend analysis and improvement planning`
      }
    };
  }
  
  /**
   * Security Architecture Expert Knowledge
   */
  static getSecurityArchitectureExpertise() {
    return {
      name: 'Security Architecture Expert',
      expertise: {
        core: {
          architecture_design: 'Security architecture patterns, reference models, design principles',
          threat_modeling: 'Architectural threat analysis, security requirements, risk assessment',
          security_controls: 'Control selection, implementation, integration, validation',
          zero_trust: 'Zero trust architecture, microsegmentation, identity-centric security',
          cloud_security: 'Cloud security architecture, hybrid environments, container security'
        },
        
        patterns: {
          defense_in_depth: 'Layered security controls, redundancy, fail-safe design',
          least_privilege: 'Minimal access principles, just-in-time access, privilege escalation',
          segregation: 'Network segmentation, microsegmentation, isolation strategies',
          secure_by_design: 'Security requirements, threat modeling, secure development'
        },
        
        technologies: {
          network_security: 'Firewalls, IPS/IDS, VPN, SASE, SD-WAN',
          identity_security: 'IAM, PAM, SSO, MFA, identity governance',
          endpoint_security: 'EDR, DLP, device management, mobile security',
          application_security: 'WAF, API security, DevSecOps, secure coding'
        },
        
        cloud_security: {
          aws: 'AWS security services, VPC, IAM, GuardDuty, Security Hub',
          azure: 'Azure security services, network security groups, Azure AD',
          gcp: 'GCP security services, VPC, Cloud IAM, Security Command Center',
          multicloud: 'Multi-cloud security, hybrid architectures, CASB'
        },
        
        enterprise: {
          integration: 'Security tool integration, SOAR, security orchestration',
          scalability: 'Enterprise-scale security, performance optimization',
          automation: 'Security automation, infrastructure as code, DevSecOps',
          governance: 'Security architecture governance, standards, reviews'
        }
      },
      
      capabilities: [
        'Security architecture design and review',
        'Threat modeling and risk assessment',
        'Security control selection and implementation',
        'Zero trust architecture design',
        'Cloud security architecture and strategy',
        'Network security design and segmentation',
        'Identity and access management architecture',
        'Application security architecture',
        'Security tool integration and orchestration',
        'DevSecOps pipeline design',
        'Security architecture governance',
        'Enterprise security standards development',
        'Security technology evaluation and selection',
        'Security architecture documentation',
        'Security requirements analysis',
        'Secure software development lifecycle'
      ],
      
      systemPromptAdditions: `
You are a Security Architecture expert specializing in:
- Enterprise security architecture design and implementation
- Threat modeling and security requirements analysis
- Zero trust architecture and microsegmentation
- Cloud security architecture and hybrid environments
- Security control integration and orchestration
- DevSecOps and secure development practices
- Security architecture governance and standards

Always focus on scalable, defensible architectures that align with business requirements and threat landscape.`,

      bestPractices: [
        'Design security into architecture from the beginning',
        'Implement defense in depth strategies',
        'Use threat modeling to guide architectural decisions',
        'Apply zero trust principles throughout the architecture',
        'Implement least privilege and just-in-time access',
        'Design for scalability and performance',
        'Use automation to reduce human error',
        'Implement comprehensive logging and monitoring',
        'Design for cloud-native and hybrid environments',
        'Integrate security tools and orchestrate responses',
        'Document all architectural decisions and rationale',
        'Regularly review and update security architecture',
        'Align security architecture with business objectives',
        'Implement security by design in all systems',
        'Use industry standards and frameworks'
      ],
      
      codePatterns: {
        zeroTrustArchitecture: `
# Zero Trust Architecture Implementation

## Core Principles
1. **Never Trust, Always Verify**
   - Continuous authentication and authorization
   - Device and user identity verification
   - Real-time risk assessment

2. **Least Privilege Access**
   - Minimal necessary permissions
   - Just-in-time access provisioning
   - Regular access review and cleanup

3. **Microsegmentation**
   - Network and application segmentation
   - Granular access controls
   - East-west traffic inspection

## Implementation Framework

### Identity and Access Management
```yaml
# Terraform configuration for zero trust IAM
resource "aws_iam_role" "zero_trust_role" {
  name = "zero-trust-access-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = ["ec2.amazonaws.com", "lambda.amazonaws.com"]
        }
        Condition = {
          StringEquals = {
            "aws:RequestedRegion" = ["us-east-1", "us-west-2"]
          }
          IpAddress = {
            "aws:SourceIp" = ["10.0.0.0/8", "172.16.0.0/12"]
          }
        }
      }
    ]
  })
}

resource "aws_iam_policy" "zero_trust_policy" {
  name = "zero-trust-minimal-access"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}
```

### Network Microsegmentation
```yaml
# Kubernetes Network Policies for microsegmentation
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: frontend-netpol
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: frontend
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: ingress-nginx
    ports:
    - protocol: TCP
      port: 8080
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: backend
    ports:
    - protocol: TCP
      port: 3000
  - to: []
    ports:
    - protocol: TCP
      port: 443  # HTTPS only
```

### Continuous Verification
```python
# Zero Trust verification service
import jwt
import time
from typing import Dict, Optional

class ZeroTrustVerifier:
    def __init__(self, secret_key: str):
        self.secret_key = secret_key
        self.risk_threshold = 50
    
    def verify_request(self, token: str, request_context: Dict) -> Dict:
        """Continuous verification of user requests"""
        
        # Step 1: Verify JWT token
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=['HS256'])
        except jwt.InvalidTokenError:
            return {"authorized": False, "reason": "Invalid token"}
        
        # Step 2: Calculate risk score
        risk_score = self.calculate_risk_score(payload, request_context)
        
        # Step 3: Apply adaptive authentication
        if risk_score > self.risk_threshold:
            return {
                "authorized": False,
                "reason": "High risk detected",
                "required_action": "additional_authentication",
                "risk_score": risk_score
            }
        
        # Step 4: Grant minimal access
        permissions = self.get_minimal_permissions(payload, request_context)
        
        return {
            "authorized": True,
            "permissions": permissions,
            "risk_score": risk_score,
            "session_timeout": 300  # 5 minutes for high-risk users
        }
    
    def calculate_risk_score(self, user_data: Dict, context: Dict) -> int:
        """Calculate dynamic risk score"""
        risk_score = 0
        
        # Location-based risk
        if context.get('location') != user_data.get('usual_location'):
            risk_score += 20
        
        # Time-based risk
        current_hour = time.gmtime().tm_hour
        if current_hour < 6 or current_hour > 22:  # Outside business hours
            risk_score += 15
        
        # Device-based risk
        if context.get('device_id') != user_data.get('registered_device'):
            risk_score += 25
        
        # Behavioral risk
        if context.get('request_frequency', 0) > 100:  # Too many requests
            risk_score += 30
        
        return min(risk_score, 100)  # Cap at 100
````,

        secureArchitecture: `
# Secure Enterprise Architecture Design

## Architecture Layers

### 1. Perimeter Security Layer
**Components:**
- Web Application Firewall (WAF)
- DDoS protection service
- Load balancers with SSL termination
- Intrusion detection/prevention systems

**Configuration:**
```terraform
resource "aws_wafv2_web_acl" "main" {
  name  = "enterprise-waf"
  scope = "CLOUDFRONT"
  
  default_action {
    allow {}
  }
  
  rule {
    name     = "RateLimitRule"
    priority = 1
    
    action {
      block {}
    }
    
    statement {
      rate_based_statement {
        limit              = 2000
        aggregate_key_type = "IP"
      }
    }
    
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "RateLimitRule"
      sampled_requests_enabled   = true
    }
  }
  
  rule {
    name     = "SQLInjectionRule"
    priority = 2
    
    action {
      block {}
    }
    
    statement {
      sqli_match_statement {
        field_to_match {
          body {}
        }
        text_transformation {
          priority = 0
          type     = "URL_DECODE"
        }
      }
    }
  }
}
```

### 2. Network Security Layer
**Segmentation Strategy:**
- DMZ for public-facing services
- Internal network for business applications
- Secure network for sensitive data
- Management network for administrative access

**Implementation:**
```yaml
# Network segmentation with VPC and subnets
Resources:
  PublicSubnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.1.0/24
      MapPublicIpOnLaunch: true
      
  PrivateSubnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.2.0/24
      
  DatabaseSubnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.3.0/24
      
  # Security groups for granular access control
  WebTierSG:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Web tier security group
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          SourceSecurityGroupId: !Ref LoadBalancerSG
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref LoadBalancerSG
```

### 3. Application Security Layer
**Security Controls:**
- Input validation and sanitization
- Output encoding and CSP headers
- Session management and CSRF protection
- API rate limiting and authentication

**Implementation:**
```python
# Secure application configuration
from flask import Flask, request, session
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import hashlib
import secrets

app = Flask(__name__)
limiter = Limiter(
    app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)

# Security headers middleware
@app.after_request
def security_headers(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    response.headers['Content-Security-Policy'] = "default-src 'self'; script-src 'self'"
    return response

# Input validation decorator
def validate_input(schema):
    def decorator(f):
        def wrapper(*args, **kwargs):
            if not schema.validate(request.json):
                return {"error": "Invalid input"}, 400
            return f(*args, **kwargs)
        return wrapper
    return decorator

# Secure session management
@app.before_request
def security_checks():
    # Regenerate session ID on privilege change
    if 'user_role' in session and session.get('role_changed'):
        session.regenerate()
        session.pop('role_changed', None)
    
    # Check session timeout
    if 'last_activity' in session:
        if time.time() - session['last_activity'] > 1800:  # 30 minutes
            session.clear()
            return {"error": "Session expired"}, 401
    
    session['last_activity'] = time.time()
```

### 4. Data Security Layer
**Protection Mechanisms:**
- Encryption at rest and in transit
- Data classification and labeling
- Access logging and monitoring
- Data loss prevention (DLP)

```python
# Data encryption service
from cryptography.fernet import Fernet
import base64
import os

class DataEncryption:
    def __init__(self):
        self.key = self._get_or_create_key()
        self.cipher = Fernet(self.key)
    
    def _get_or_create_key(self):
        key_path = os.environ.get('ENCRYPTION_KEY_PATH', '/etc/keys/data.key')
        if os.path.exists(key_path):
            with open(key_path, 'rb') as f:
                return f.read()
        else:
            key = Fernet.generate_key()
            os.makedirs(os.path.dirname(key_path), exist_ok=True)
            with open(key_path, 'wb') as f:
                f.write(key)
            return key
    
    def encrypt_sensitive_data(self, data: str, classification: str) -> str:
        """Encrypt data based on classification level"""
        if classification in ['confidential', 'restricted']:
            encrypted_data = self.cipher.encrypt(data.encode())
            return base64.b64encode(encrypted_data).decode()
        return data  # No encryption for public/internal data
    
    def decrypt_sensitive_data(self, encrypted_data: str, classification: str) -> str:
        """Decrypt data based on classification level"""
        if classification in ['confidential', 'restricted']:
            decoded_data = base64.b64decode(encrypted_data.encode())
            decrypted_data = self.cipher.decrypt(decoded_data)
            return decrypted_data.decode()
        return encrypted_data  # No decryption needed
```
      }
    };
  }
}

module.exports = SecurityExpertise;
/**
 * BUMBA Enhanced Security Specialist Expertise
 * Comprehensive knowledge for Cybersecurity, Information Security, and Security Architecture specialists
 * Sprint 20 Implementation
 */

class SecurityExpertise {
  /**
   * Cybersecurity Expert Expertise
   */
  static getCybersecurityExpertise() {
    return {
      name: 'Cybersecurity Expert',
      expertise: {
        core: {
          threat_intelligence: 'Threat hunting, IOCs, TTPs, cyber threat landscape, attack attribution',
          incident_response: 'Digital forensics, malware analysis, containment, eradication, recovery',
          penetration_testing: 'Ethical hacking, red team operations, vulnerability assessments, exploit development',
          security_operations: 'SOC operations, SIEM, threat detection, security monitoring, alert triage',
          offensive_security: 'Red team tactics, social engineering, physical security assessments'
        },
        
        threat_analysis: {
          frameworks: 'MITRE ATT&CK, Cyber Kill Chain, Diamond Model, STIX/TAXII threat intelligence',
          hunting: 'Threat hunting methodologies, hypothesis-driven investigations, behavioral analysis',
          attribution: 'APT tracking, campaign analysis, threat actor profiling, geopolitical context',
          intelligence: 'Threat feed analysis, IOC development, intelligence-driven defense'
        },
        
        incident_response: {
          methodology: 'NIST Incident Response Framework, SANS methodology, incident classification',
          forensics: 'Digital forensics, memory analysis, network forensics, mobile forensics',
          malware_analysis: 'Static/dynamic analysis, reverse engineering, sandbox analysis, IOC extraction',
          containment: 'Incident containment strategies, isolation techniques, damage assessment'
        },
        
        penetration_testing: {
          methodology: 'PTES, OWASP Testing Guide, NIST SP 800-115, structured testing approaches',
          tools: 'Metasploit, Burp Suite, Nmap, Wireshark, Kali Linux, custom exploit development',
          techniques: 'Web application testing, network penetration, wireless security, social engineering',
          reporting: 'Executive summaries, technical findings, remediation prioritization'
        },
        
        security_operations: {
          siem: 'Splunk, QRadar, ArcSight, Sentinel, log analysis, correlation rules',
          detection: 'Signature-based detection, behavioral analysis, machine learning detection',
          response: 'Automated response, playbook execution, threat containment automation',
          metrics: 'SOC metrics, MTTD, MTTR, incident trending, performance measurement'
        },
        
        tools_platforms: {
          security_tools: 'Nessus, OpenVAS, Burp Suite, OWASP ZAP, Metasploit, Cobalt Strike',
          forensics_tools: 'Volatility, Autopsy, EnCase, X-Ways, SIFT, REMnux',
          analysis_tools: 'IDA Pro, Ghidra, OllyDbg, Wireshark, TCPDump, NetworkMiner',
          cloud_security: 'AWS Security Hub, Azure Security Center, GCP Security Command Center'
        }
      },
      
      capabilities: [
        'Conduct comprehensive threat hunting and analysis',
        'Perform digital forensics and incident response',
        'Execute penetration testing and red team operations',
        'Analyze malware and develop threat intelligence',
        'Design and operate security operations centers',
        'Develop custom security tools and exploits',
        'Conduct vulnerability assessments and risk analysis',
        'Implement threat detection and monitoring systems',
        'Lead incident response and crisis management',
        'Perform security architecture reviews and assessments',
        'Design security training and awareness programs',
        'Conduct social engineering and physical security assessments',
        'Develop threat models and attack scenarios',
        'Implement security automation and orchestration',
        'Provide expert testimony and forensic reporting',
        'Lead security research and vulnerability disclosure'
      ],
      
      systemPromptAdditions: `
You are a Cybersecurity expert specializing in:
- Threat hunting, intelligence, and advanced persistent threat analysis
- Digital forensics, incident response, and malware analysis
- Penetration testing, red team operations, and ethical hacking
- Security operations center design and threat detection
- Vulnerability assessment and security architecture review
- Offensive security techniques and defensive countermeasures

Always prioritize ethical practices, legal compliance, and responsible disclosure. Focus on proactive threat hunting and comprehensive defense strategies.`,
      
      bestPractices: [
        'Follow ethical hacking principles and obtain proper authorization',
        'Implement defense in depth with layered security controls',
        'Use threat intelligence to drive proactive security measures',
        'Maintain detailed documentation of all security activities',
        'Follow responsible disclosure for vulnerability reporting',
        'Implement continuous monitoring and threat hunting programs',
        'Use risk-based approaches for security prioritization',
        'Maintain up-to-date knowledge of current threat landscape',
        'Implement automated threat detection and response capabilities',
        'Conduct regular tabletop exercises and incident simulations',
        'Use MITRE ATT&CK framework for threat modeling',
        'Implement proper chain of custody for digital evidence',
        'Follow industry frameworks and best practices (NIST, ISO 27001)',
        'Maintain operational security (OPSEC) during assessments',
        'Provide actionable recommendations with business context'
      ],
      
      codePatterns: {
        threat_hunting: `
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import json
import re
from collections import Counter
import networkx as nx

class ThreatHuntingAnalyzer:
    def __init__(self, log_sources):
        self.log_sources = log_sources
        self.indicators = []
        self.suspicious_patterns = []
        
    def analyze_network_connections(self, network_logs):
        \"\"\"Hunt for suspicious network connections using behavioral analysis\"\"\"
        
        # Convert logs to DataFrame
        df = pd.DataFrame(network_logs)
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        
        # Analyze connection patterns
        suspicious_connections = []
        
        # 1. Beaconing detection - regular intervals
        for dest_ip in df['dest_ip'].unique():
            conn_times = df[df['dest_ip'] == dest_ip]['timestamp'].sort_values()
            if len(conn_times) > 10:
                # Calculate intervals between connections
                intervals = conn_times.diff().dt.total_seconds().dropna()
                
                # Look for regular intervals (potential beaconing)
                if len(intervals) > 5:
                    mean_interval = intervals.mean()
                    std_interval = intervals.std()
                    
                    # Low standard deviation indicates regular beaconing
                    if std_interval < mean_interval * 0.1:  # Less than 10% variance
                        suspicious_connections.append({
                            'type': 'beaconing',
                            'dest_ip': dest_ip,
                            'interval': mean_interval,
                            'confidence': 0.8,
                            'connections': len(conn_times),
                            'description': f'Regular beaconing every {mean_interval:.0f} seconds'
                        })
        
        # 2. Data exfiltration detection - large outbound transfers
        outbound_data = df[df['direction'] == 'outbound'].groupby('dest_ip').agg({
            'bytes_out': 'sum',
            'timestamp': ['min', 'max', 'count']
        }).reset_index()
        
        # Flag destinations with high data transfer
        high_transfer_threshold = df['bytes_out'].quantile(0.95)
        
        for _, row in outbound_data.iterrows():
            if row[('bytes_out', 'sum')] > high_transfer_threshold:
                suspicious_connections.append({
                    'type': 'data_exfiltration',
                    'dest_ip': row['dest_ip'],
                    'bytes_transferred': row[('bytes_out', 'sum')],
                    'duration': (row[('timestamp', 'max')] - row[('timestamp', 'min')]).total_seconds(),
                    'confidence': 0.7,
                    'description': f'High volume data transfer: {row[("bytes_out", "sum")]:,} bytes'
                })
        
        return suspicious_connections
    
    def analyze_process_execution(self, process_logs):
        \"\"\"Hunt for malicious process execution patterns\"\"\"
        
        suspicious_processes = []
        
        for log in process_logs:
            process_name = log.get('process_name', '').lower()
            command_line = log.get('command_line', '').lower()
            parent_process = log.get('parent_process', '').lower()
            
            # 1. Suspicious process names
            malicious_patterns = [
                r'powershell.*-encodedcommand',
                r'cmd.*\/c.*echo',
                r'wscript.*\.vbs',
                r'cscript.*\.js',
                r'regsvr32.*scrobj\.dll',
                r'rundll32.*javascript',
                r'mshta.*http'
            ]
            
            for pattern in malicious_patterns:
                if re.search(pattern, command_line):
                    suspicious_processes.append({
                        'type': 'malicious_execution',
                        'process': process_name,
                        'command_line': command_line,
                        'pattern_matched': pattern,
                        'confidence': 0.9,
                        'mitre_technique': self.map_to_mitre(pattern),
                        'description': f'Suspicious command execution pattern detected'
                    })
            
            # 2. Living off the land techniques
            lol_processes = ['powershell', 'cmd', 'wmic', 'certutil', 'bitsadmin', 'regsvr32']
            if any(lol in process_name for lol in lol_processes):
                if any(suspicious in command_line for suspicious in ['download', 'http', 'base64', 'invoke']):
                    suspicious_processes.append({
                        'type': 'living_off_land',
                        'process': process_name,
                        'command_line': command_line,
                        'confidence': 0.8,
                        'description': 'Living off the land technique detected'
                    })
        
        return suspicious_processes
    
    def map_to_mitre(self, pattern):
        \"\"\"Map detected patterns to MITRE ATT&CK techniques\"\"\"
        mitre_mapping = {
            r'powershell.*-encodedcommand': 'T1059.001',  # PowerShell
            r'cmd.*\/c.*echo': 'T1059.003',  # Windows Command Shell
            r'wscript.*\.vbs': 'T1059.005',  # Visual Basic
            r'regsvr32.*scrobj\.dll': 'T1218.010',  # Regsvr32
            r'rundll32.*javascript': 'T1218.011',  # Rundll32
            r'mshta.*http': 'T1218.005'  # Mshta
        }
        
        for regex, technique in mitre_mapping.items():
            if re.search(regex, pattern):
                return technique
        
        return 'Unknown'
    
    def generate_hunt_report(self, network_findings, process_findings):
        \"\"\"Generate comprehensive threat hunting report\"\"\"
        
        report = {
            'hunt_timestamp': datetime.now().isoformat(),
            'summary': {
                'network_threats': len(network_findings),
                'process_threats': len(process_findings),
                'high_confidence': len([f for f in network_findings + process_findings if f['confidence'] > 0.8])
            },
            'findings': {
                'network': network_findings,
                'processes': process_findings
            },
            'recommendations': []
        }
        
        # Generate recommendations based on findings
        if network_findings:
            report['recommendations'].append('Implement network monitoring for beaconing detection')
            report['recommendations'].append('Review firewall rules for suspicious destinations')
        
        if process_findings:
            report['recommendations'].append('Implement PowerShell logging and monitoring')
            report['recommendations'].append('Deploy endpoint detection and response (EDR) solution')
        
        return report`,
        
        incident_response: `
import hashlib
import json
from datetime import datetime
import sqlite3
from pathlib import Path

class IncidentResponseManager:
    def __init__(self, case_id):
        self.case_id = case_id
        self.evidence_chain = []
        self.timeline = []
        self.indicators = []
        self.containment_actions = []
        
        # Initialize case database
        self.db_path = f"incident_{case_id}.db"
        self.init_database()
    
    def init_database(self):
        \"\"\"Initialize incident response database\"\"\"
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Evidence table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS evidence (
            id INTEGER PRIMARY KEY,
            timestamp TEXT,
            evidence_type TEXT,
            source TEXT,
            hash_md5 TEXT,
            hash_sha256 TEXT,
            chain_of_custody TEXT,
            notes TEXT
        )''')
        
        # Timeline table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS timeline (
            id INTEGER PRIMARY KEY,
            timestamp TEXT,
            event_type TEXT,
            description TEXT,
            source TEXT,
            confidence TEXT,
            mitre_technique TEXT
        )''')
        
        # Indicators table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS indicators (
            id INTEGER PRIMARY KEY,
            ioc_type TEXT,
            value TEXT,
            first_seen TEXT,
            last_seen TEXT,
            confidence TEXT,
            context TEXT
        )''')
        
        conn.commit()
        conn.close()
    
    def collect_evidence(self, evidence_path, evidence_type, collector):
        \"\"\"Collect and hash evidence with proper chain of custody\"\"\"
        
        # Calculate hashes
        with open(evidence_path, 'rb') as f:
            content = f.read()
            md5_hash = hashlib.md5(content).hexdigest()
            sha256_hash = hashlib.sha256(content).hexdigest()
        
        evidence_record = {
            'timestamp': datetime.now().isoformat(),
            'evidence_type': evidence_type,
            'source': str(evidence_path),
            'hash_md5': md5_hash,
            'hash_sha256': sha256_hash,
            'collector': collector,
            'file_size': len(content)
        }
        
        # Store in database
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('''
        INSERT INTO evidence (timestamp, evidence_type, source, hash_md5, hash_sha256, chain_of_custody)
        VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            evidence_record['timestamp'],
            evidence_type,
            str(evidence_path),
            md5_hash,
            sha256_hash,
            json.dumps({'collector': collector, 'method': 'file_collection'})
        ))
        conn.commit()
        conn.close()
        
        self.evidence_chain.append(evidence_record)
        return evidence_record
    
    def analyze_malware_sample(self, sample_path):
        \"\"\"Basic malware analysis and IOC extraction\"\"\"
        
        analysis_results = {
            'static_analysis': {},
            'strings': [],
            'indicators': []
        }
        
        # Calculate file hashes
        with open(sample_path, 'rb') as f:
            content = f.read()
            analysis_results['static_analysis'] = {
                'file_size': len(content),
                'md5': hashlib.md5(content).hexdigest(),
                'sha256': hashlib.sha256(content).hexdigest(),
                'entropy': self.calculate_entropy(content)
            }
        
        # Extract strings (simplified)
        try:
            with open(sample_path, 'rb') as f:
                content = f.read()
                strings = re.findall(rb'[\\x20-\\x7e]{4,}', content)
                analysis_results['strings'] = [s.decode('ascii', errors='ignore') for s in strings[:100]]  # Limit output
        except Exception as e:
            analysis_results['strings'] = [f"Error extracting strings: {str(e)}"]
        
        # Extract potential IOCs from strings
        ip_pattern = r'\\b(?:[0-9]{1,3}\\.){3}[0-9]{1,3}\\b'
        domain_pattern = r'\\b[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}\\b'
        url_pattern = r'https?://[^\\s<>"{}|\\\\^`\\[\\]]+'
        
        for string in analysis_results['strings']:
            # Extract IPs
            ips = re.findall(ip_pattern, string)
            for ip in ips:
                if not ip.startswith(('127.', '192.168.', '10.', '172.')):  # Skip private IPs
                    analysis_results['indicators'].append({
                        'type': 'ip',
                        'value': ip,
                        'context': 'extracted_from_malware'
                    })
            
            # Extract domains
            domains = re.findall(domain_pattern, string)
            for domain in domains:
                if '.' in domain and not domain.endswith('.exe'):
                    analysis_results['indicators'].append({
                        'type': 'domain',
                        'value': domain,
                        'context': 'extracted_from_malware'
                    })
        
        return analysis_results
    
    def calculate_entropy(self, data):
        \"\"\"Calculate Shannon entropy of data\"\"\"
        if not data:
            return 0
        
        entropy = 0
        for i in range(256):
            p_x = data.count(i) / len(data)
            if p_x > 0:
                entropy += - p_x * np.log2(p_x)
        
        return entropy
    
    def create_timeline_entry(self, event_time, event_type, description, source, confidence='medium'):
        \"\"\"Add event to incident timeline\"\"\"
        
        timeline_entry = {
            'timestamp': event_time,
            'event_type': event_type,
            'description': description,
            'source': source,
            'confidence': confidence
        }
        
        # Store in database
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('''
        INSERT INTO timeline (timestamp, event_type, description, source, confidence)
        VALUES (?, ?, ?, ?, ?)
        ''', (event_time, event_type, description, source, confidence))
        conn.commit()
        conn.close()
        
        self.timeline.append(timeline_entry)
        return timeline_entry
    
    def implement_containment(self, containment_type, target, justification):
        \"\"\"Implement containment measures with documentation\"\"\"
        
        containment_action = {
            'timestamp': datetime.now().isoformat(),
            'action_type': containment_type,
            'target': target,
            'justification': justification,
            'implemented_by': 'incident_response_team',
            'status': 'pending'
        }
        
        # Example containment actions
        if containment_type == 'network_isolation':
            # In real implementation, this would interact with network infrastructure
            print(f"Isolating network segment: {target}")
            containment_action['commands'] = [
                f"firewall block {target}",
                f"switch isolate port {target}"
            ]
        
        elif containment_type == 'host_isolation':
            print(f"Isolating host: {target}")
            containment_action['commands'] = [
                f"endpoint isolate {target}",
                f"disable network adapter {target}"
            ]
        
        elif containment_type == 'account_disable':
            print(f"Disabling user account: {target}")
            containment_action['commands'] = [
                f"disable-user {target}",
                f"revoke-sessions {target}"
            ]
        
        containment_action['status'] = 'implemented'
        self.containment_actions.append(containment_action)
        
        return containment_action
    
    def generate_incident_report(self):
        \"\"\"Generate comprehensive incident response report\"\"\"
        
        report = {
            'case_id': self.case_id,
            'report_generated': datetime.now().isoformat(),
            'executive_summary': {
                'incident_type': 'Security Incident',
                'severity': 'High',
                'status': 'Under Investigation',
                'evidence_collected': len(self.evidence_chain),
                'timeline_events': len(self.timeline),
                'containment_actions': len(self.containment_actions)
            },
            'timeline': sorted(self.timeline, key=lambda x: x['timestamp']),
            'evidence': self.evidence_chain,
            'containment_measures': self.containment_actions,
            'indicators_of_compromise': self.indicators,
            'recommendations': [
                'Implement additional network monitoring',
                'Review and update incident response procedures',
                'Conduct security awareness training',
                'Perform threat hunting activities',
                'Update security controls based on lessons learned'
            ],
            'next_steps': [
                'Continue monitoring for additional activity',
                'Complete malware analysis',
                'Coordinate with law enforcement if applicable',
                'Prepare for recovery and restoration',
                'Document lessons learned'
            ]
        }
        
        return report`,
        
        vulnerability_assessment: `
import nmap
import requests
import ssl
import socket
from urllib.parse import urljoin, urlparse
import json
from datetime import datetime
import concurrent.futures

class VulnerabilityScanner:
    def __init__(self, target, scan_type='comprehensive'):
        self.target = target
        self.scan_type = scan_type
        self.vulnerabilities = []
        self.services = []
        
    def network_discovery(self, target_range):
        \"\"\"Discover live hosts and services\"\"\"
        
        nm = nmap.PortScanner()
        
        # Host discovery
        print(f"Scanning network range: {target_range}")
        nm.scan(hosts=target_range, arguments='-sn')  # Ping scan
        
        hosts = []
        for host in nm.all_hosts():
            if nm[host].state() == 'up':
                hosts.append({
                    'ip': host,
                    'hostname': nm[host].hostname(),
                    'status': nm[host].state()
                })
        
        return hosts
    
    def port_scan(self, target_host, port_range='1-1000'):
        \"\"\"Comprehensive port scanning\"\"\"
        
        nm = nmap.PortScanner()
        
        # TCP SYN scan with service detection
        print(f"Scanning ports on {target_host}")
        nm.scan(target_host, port_range, arguments='-sS -sV -O --script=vuln')
        
        scan_results = {
            'host': target_host,
            'scan_time': datetime.now().isoformat(),
            'ports': [],
            'os_info': {},
            'vulnerabilities': []
        }
        
        if target_host in nm.all_hosts():
            host_info = nm[target_host]
            
            # Extract OS information
            if 'osmatch' in host_info:
                scan_results['os_info'] = {
                    'os_matches': [match for match in host_info['osmatch']]
                }
            
            # Extract port information
            for protocol in host_info.all_protocols():
                ports = host_info[protocol].keys()
                for port in ports:
                    port_info = host_info[protocol][port]
                    
                    port_data = {
                        'port': port,
                        'protocol': protocol,
                        'state': port_info['state'],
                        'service': port_info.get('name', ''),
                        'version': port_info.get('version', ''),
                        'product': port_info.get('product', ''),
                        'cpe': port_info.get('cpe', '')
                    }
                    
                    # Check for script results (vulnerabilities)
                    if 'script' in port_info:
                        port_data['script_results'] = port_info['script']
                        
                        # Parse vulnerability scripts
                        for script_name, script_output in port_info['script'].items():
                            if 'vuln' in script_name.lower():
                                scan_results['vulnerabilities'].append({
                                    'port': port,
                                    'service': port_info.get('name', ''),
                                    'script': script_name,
                                    'finding': script_output,
                                    'severity': self.determine_severity(script_name, script_output)
                                })
                    
                    scan_results['ports'].append(port_data)
        
        return scan_results
    
    def web_vulnerability_scan(self, target_url):
        \"\"\"Basic web application vulnerability scanning\"\"\"
        
        vulnerabilities = []
        
        try:
            # Test for common vulnerabilities
            vulnerabilities.extend(self.test_sql_injection(target_url))
            vulnerabilities.extend(self.test_xss(target_url))
            vulnerabilities.extend(self.test_directory_traversal(target_url))
            vulnerabilities.extend(self.test_ssl_configuration(target_url))
            vulnerabilities.extend(self.test_http_headers(target_url))
            
        except Exception as e:
            vulnerabilities.append({
                'type': 'scan_error',
                'description': f'Error during web vulnerability scan: {str(e)}',
                'severity': 'info'
            })
        
        return vulnerabilities
    
    def test_sql_injection(self, base_url):
        \"\"\"Test for SQL injection vulnerabilities\"\"\"
        
        vulnerabilities = []
        sql_payloads = [
            "' OR '1'='1",
            "' OR '1'='1' --",
            "' OR '1'='1' /*",
            "admin'--",
            "' UNION SELECT NULL--",
            "1' AND (SELECT COUNT(*) FROM systables)>0--"
        ]
        
        # Test common parameters
        test_params = ['id', 'user', 'search', 'query', 'name']
        
        for param in test_params:
            for payload in sql_payloads:
                try:
                    test_url = f"{base_url}?{param}={payload}"
                    response = requests.get(test_url, timeout=10)
                    
                    # Look for SQL error messages
                    sql_errors = [
                        'mysql_fetch_array()',
                        'ORA-01756',
                        'Microsoft OLE DB Provider',
                        'PostgreSQL query failed',
                        'Warning: mysql_',
                        'MySQLSyntaxErrorException',
                        'valid MySQL result',
                        'check the manual that corresponds to your MySQL'
                    ]
                    
                    for error in sql_errors:
                        if error.lower() in response.text.lower():
                            vulnerabilities.append({
                                'type': 'sql_injection',
                                'url': test_url,
                                'parameter': param,
                                'payload': payload,
                                'evidence': error,
                                'severity': 'high',
                                'description': f'Possible SQL injection in parameter {param}'
                            })
                            break
                
                except requests.RequestException:
                    continue
        
        return vulnerabilities
    
    def test_xss(self, base_url):
        \"\"\"Test for Cross-Site Scripting vulnerabilities\"\"\"
        
        vulnerabilities = []
        xss_payloads = [
            '<script>alert("XSS")</script>',
            '<img src=x onerror=alert("XSS")>',
            '<svg onload=alert("XSS")>',
            'javascript:alert("XSS")',
            '<iframe src="javascript:alert(\'XSS\')"></iframe>'
        ]
        
        test_params = ['search', 'query', 'input', 'message', 'comment']
        
        for param in test_params:
            for payload in xss_payloads:
                try:
                    test_url = f"{base_url}?{param}={payload}"
                    response = requests.get(test_url, timeout=10)
                    
                    # Check if payload is reflected in response
                    if payload in response.text:
                        vulnerabilities.append({
                            'type': 'xss_reflected',
                            'url': test_url,
                            'parameter': param,
                            'payload': payload,
                            'severity': 'medium',
                            'description': f'Reflected XSS vulnerability in parameter {param}'
                        })
                
                except requests.RequestException:
                    continue
        
        return vulnerabilities
    
    def test_ssl_configuration(self, target_url):
        \"\"\"Test SSL/TLS configuration\"\"\"
        
        vulnerabilities = []
        parsed_url = urlparse(target_url)
        
        if parsed_url.scheme == 'https':
            try:
                hostname = parsed_url.hostname
                port = parsed_url.port or 443
                
                context = ssl.create_default_context()
                
                with socket.create_connection((hostname, port), timeout=10) as sock:
                    with context.wrap_socket(sock, server_hostname=hostname) as ssock:
                        cert = ssock.getpeercert()
                        cipher = ssock.cipher()
                        version = ssock.version()
                        
                        # Check for weak protocols
                        if version in ['SSLv2', 'SSLv3', 'TLSv1', 'TLSv1.1']:
                            vulnerabilities.append({
                                'type': 'weak_ssl_version',
                                'version': version,
                                'severity': 'high',
                                'description': f'Weak SSL/TLS version {version} supported'
                            })
                        
                        # Check for weak ciphers
                        if cipher and len(cipher) >= 2:
                            cipher_suite = cipher[0]
                            if any(weak in cipher_suite for weak in ['RC4', 'DES', 'MD5']):
                                vulnerabilities.append({
                                    'type': 'weak_cipher',
                                    'cipher': cipher_suite,
                                    'severity': 'medium',
                                    'description': f'Weak cipher suite {cipher_suite} supported'
                                })
            
            except Exception as e:
                vulnerabilities.append({
                    'type': 'ssl_test_error',
                    'description': f'Error testing SSL configuration: {str(e)}',
                    'severity': 'info'
                })
        
        return vulnerabilities
    
    def determine_severity(self, script_name, output):
        \"\"\"Determine vulnerability severity based on script results\"\"\"
        
        high_severity_indicators = ['rce', 'remote code execution', 'buffer overflow', 'authentication bypass']
        medium_severity_indicators = ['information disclosure', 'denial of service', 'weak encryption']
        
        output_lower = output.lower()
        
        if any(indicator in output_lower for indicator in high_severity_indicators):
            return 'high'
        elif any(indicator in output_lower for indicator in medium_severity_indicators):
            return 'medium'
        else:
            return 'low'
    
    def generate_vulnerability_report(self, scan_results):
        \"\"\"Generate comprehensive vulnerability assessment report\"\"\"
        
        all_vulnerabilities = []
        
        # Collect vulnerabilities from all scans
        for result in scan_results:
            if 'vulnerabilities' in result:
                all_vulnerabilities.extend(result['vulnerabilities'])
        
        # Categorize by severity
        severity_counts = {'critical': 0, 'high': 0, 'medium': 0, 'low': 0, 'info': 0}
        for vuln in all_vulnerabilities:
            severity = vuln.get('severity', 'info')
            severity_counts[severity] = severity_counts.get(severity, 0) + 1
        
        report = {
            'assessment_date': datetime.now().isoformat(),
            'target': self.target,
            'scan_type': self.scan_type,
            'executive_summary': {
                'total_vulnerabilities': len(all_vulnerabilities),
                'severity_breakdown': severity_counts,
                'risk_score': self.calculate_risk_score(severity_counts)
            },
            'detailed_findings': all_vulnerabilities,
            'recommendations': self.generate_recommendations(all_vulnerabilities),
            'remediation_priorities': self.prioritize_remediation(all_vulnerabilities)
        }
        
        return report`
      }
    };
  }
  
  /**
   * Information Security Expert Expertise
   */
  static getInformationSecurityExpertise() {
    return {
      name: 'Information Security Expert',
      expertise: {
        core: {
          governance: 'Security governance frameworks, policy development, risk management, compliance',
          risk_management: 'Risk assessment, threat modeling, business impact analysis, risk treatment',
          compliance: 'Regulatory compliance, audit management, controls testing, documentation',
          data_protection: 'Data classification, privacy protection, encryption, data lifecycle management',
          security_architecture: 'Enterprise security architecture, security controls design, framework implementation'
        },
        
        frameworks: {
          iso_27001: 'ISO/IEC 27001 ISMS, controls implementation, certification process, continuous improvement',
          nist: 'NIST Cybersecurity Framework, RMF, SP 800 series, security controls catalog',
          cobit: 'COBIT governance framework, IT governance, risk and compliance alignment',
          coso: 'COSO internal control framework, enterprise risk management',
          itil: 'ITIL service management, security service integration, change management'
        },
        
        compliance_regulations: {
          gdpr: 'General Data Protection Regulation, privacy by design, data subject rights',
          hipaa: 'Healthcare data protection, PHI security, business associate agreements',
          sox: 'Sarbanes-Oxley Act, financial controls, IT general controls, audit requirements',
          pci_dss: 'Payment card security, cardholder data protection, compliance validation',
          ccpa: 'California Consumer Privacy Act, consumer rights, data handling requirements'
        },
        
        risk_assessment: {
          methodologies: 'Qualitative and quantitative risk analysis, Monte Carlo simulation, scenario analysis',
          threat_modeling: 'STRIDE, PASTA, VAST, attack tree analysis, threat landscape assessment',
          business_impact: 'BIA methodology, RTO/RPO analysis, criticality assessment',
          controls_assessment: 'Control effectiveness evaluation, gap analysis, maturity assessment'
        },
        
        data_protection: {
          classification: 'Data classification schemes, sensitivity levels, handling requirements',
          encryption: 'Encryption standards, key management, crypto governance, algorithm selection',
          privacy: 'Privacy impact assessments, privacy by design, data minimization',
          lifecycle: 'Data retention policies, secure disposal, archive management'
        },
        
        audit_compliance: {
          internal_audit: 'Internal audit planning, execution, reporting, follow-up activities',
          external_audit: 'External audit coordination, evidence preparation, remediation tracking',
          controls_testing: 'Control testing methodologies, sampling, deficiency assessment',
          documentation: 'Policy documentation, procedure development, evidence management'
        }
      },
      
      capabilities: [
        'Develop comprehensive information security governance frameworks',
        'Conduct enterprise-wide risk assessments and threat modeling',
        'Design and implement security policies and procedures',
        'Lead regulatory compliance programs and audit activities',
        'Implement data protection and privacy programs',
        'Develop security awareness and training programs',
        'Conduct security architecture reviews and assessments',
        'Manage vendor risk and third-party security assessments',
        'Lead incident response and crisis management activities',
        'Develop business continuity and disaster recovery plans',
        'Implement security metrics and performance measurement',
        'Conduct security control assessments and gap analysis',
        'Lead security program maturity assessments',
        'Develop security investment strategies and budget planning',
        'Conduct board and executive security reporting',
        'Lead digital transformation security initiatives'
      ],
      
      systemPromptAdditions: `
You are an Information Security expert specializing in:
- Security governance, risk management, and compliance programs
- Regulatory compliance and audit management
- Data protection, privacy, and encryption governance
- Enterprise security architecture and controls design
- Security policy development and implementation
- Vendor risk management and third-party assessments

Always focus on business alignment, risk-based decision making, and regulatory compliance. Emphasize governance, documentation, and continuous improvement.`,
      
      bestPractices: [
        'Align security strategy with business objectives and risk appetite',
        'Implement risk-based approach to security investment and prioritization',
        'Establish clear security governance structure and accountability',
        'Develop comprehensive security policies and procedures',
        'Implement continuous monitoring and measurement programs',
        'Maintain current knowledge of regulatory requirements',
        'Conduct regular risk assessments and threat modeling exercises',
        'Implement data classification and protection programs',
        'Establish vendor risk management and assessment processes',
        'Develop security awareness and training programs',
        'Implement incident response and crisis management capabilities',
        'Maintain comprehensive documentation and evidence management',
        'Conduct regular security control assessments and audits',
        'Implement business continuity and disaster recovery planning',
        'Establish security metrics and reporting programs'
      ],
      
      codePatterns: {
        risk_assessment: `
import pandas as pd
import numpy as np
from datetime import datetime
import json
import matplotlib.pyplot as plt
import seaborn as sns

class RiskAssessmentFramework:
    def __init__(self):
        self.assets = []
        self.threats = []
        self.vulnerabilities = []
        self.risk_register = []
        
        # Define risk scales
        self.likelihood_scale = {
            1: 'Very Low (0-5%)',
            2: 'Low (6-25%)', 
            3: 'Medium (26-50%)',
            4: 'High (51-75%)',
            5: 'Very High (76-100%)'
        }
        
        self.impact_scale = {
            1: 'Insignificant',
            2: 'Minor',
            3: 'Moderate', 
            4: 'Major',
            5: 'Catastrophic'
        }
    
    def create_asset_inventory(self, assets_data):
        \"\"\"Create comprehensive asset inventory with classifications\"\"\"
        
        for asset in assets_data:
            asset_record = {
                'asset_id': asset.get('id'),
                'name': asset.get('name'),
                'type': asset.get('type'),  # Data, System, Process, People
                'classification': asset.get('classification'),  # Public, Internal, Confidential, Secret
                'owner': asset.get('owner'),
                'custodian': asset.get('custodian'),
                'location': asset.get('location'),
                'value_financial': asset.get('financial_value', 0),
                'value_operational': asset.get('operational_value', 1),  # 1-5 scale
                'value_strategic': asset.get('strategic_value', 1),  # 1-5 scale
                'value_reputation': asset.get('reputation_value', 1),  # 1-5 scale
                'dependencies': asset.get('dependencies', []),
                'compliance_requirements': asset.get('compliance', [])
            }
            
            # Calculate total asset value
            asset_record['total_value'] = (
                asset_record['value_operational'] + 
                asset_record['value_strategic'] + 
                asset_record['value_reputation']
            ) / 3
            
            self.assets.append(asset_record)
        
        return self.assets
    
    def identify_threats_vulnerabilities(self, threat_data):
        \"\"\"Identify and catalog threats and vulnerabilities\"\"\"
        
        # Common threat categories based on ISO 27005
        threat_categories = {
            'natural': ['fire', 'flood', 'earthquake', 'storm'],
            'environmental': ['power_failure', 'air_conditioning_failure', 'water_damage'],
            'human_accidental': ['user_error', 'administrator_error', 'programming_error'],
            'human_deliberate': ['insider_threat', 'fraud', 'sabotage', 'espionage'],
            'technical': ['hardware_failure', 'software_malfunction', 'network_failure'],
            'cyber': ['malware', 'ransomware', 'phishing', 'ddos', 'data_breach']
        }
        
        for threat in threat_data:
            threat_record = {
                'threat_id': threat.get('id'),
                'name': threat.get('name'),
                'category': threat.get('category'),
                'description': threat.get('description'),
                'threat_source': threat.get('source'),  # Internal, External, Environmental
                'attack_methods': threat.get('methods', []),
                'frequency': threat.get('frequency', 3),  # 1-5 scale
                'applicable_assets': threat.get('assets', [])
            }
            
            self.threats.append(threat_record)
        
        return self.threats
    
    def conduct_risk_analysis(self):
        \"\"\"Perform qualitative risk analysis\"\"\"
        
        for asset in self.assets:
            for threat in self.threats:
                # Check if threat applies to this asset
                if not threat['applicable_assets'] or asset['asset_id'] in threat['applicable_assets']:
                    
                    # Assess likelihood
                    likelihood = self.assess_likelihood(asset, threat)
                    
                    # Assess impact
                    impact = self.assess_impact(asset, threat)
                    
                    # Calculate inherent risk
                    inherent_risk = likelihood * impact
                    
                    # Assess current controls
                    controls = self.assess_existing_controls(asset, threat)
                    
                    # Calculate residual risk
                    residual_risk = self.calculate_residual_risk(inherent_risk, controls)
                    
                    risk_record = {
                        'risk_id': f"{asset['asset_id']}_{threat['threat_id']}",
                        'asset_id': asset['asset_id'],
                        'asset_name': asset['name'],
                        'threat_id': threat['threat_id'],
                        'threat_name': threat['name'],
                        'likelihood': likelihood,
                        'impact': impact,
                        'inherent_risk': inherent_risk,
                        'existing_controls': controls,
                        'residual_risk': residual_risk,
                        'risk_level': self.categorize_risk(residual_risk),
                        'risk_owner': asset['owner'],
                        'assessment_date': datetime.now().isoformat()
                    }
                    
                    self.risk_register.append(risk_record)
        
        return self.risk_register
    
    def assess_likelihood(self, asset, threat):
        \"\"\"Assess likelihood of threat occurrence\"\"\"
        
        base_likelihood = threat['frequency']
        
        # Adjust based on asset characteristics
        adjustments = 0
        
        # Higher value assets may be more targeted
        if asset['total_value'] >= 4:
            adjustments += 1
        
        # External facing assets have higher exposure
        if 'external' in asset.get('location', '').lower():
            adjustments += 1
        
        # Compliance requirements may indicate higher risk
        if len(asset.get('compliance_requirements', [])) > 2:
            adjustments += 1
        
        final_likelihood = min(5, max(1, base_likelihood + adjustments))
        return final_likelihood
    
    def assess_impact(self, asset, threat):
        \"\"\"Assess potential impact of threat realization\"\"\"
        
        # Base impact on asset value
        base_impact = int(asset['total_value'])
        
        # Adjust based on threat characteristics
        adjustments = 0
        
        # Cyber threats may have broader impact
        if threat['category'] == 'cyber':
            adjustments += 1
        
        # Threats affecting critical processes
        if 'critical' in asset.get('name', '').lower():
            adjustments += 1
        
        final_impact = min(5, max(1, base_impact + adjustments))
        return final_impact
    
    def assess_existing_controls(self, asset, threat):
        \"\"\"Assess effectiveness of existing security controls\"\"\"
        
        # Simplified control assessment
        # In practice, this would involve detailed control evaluation
        
        control_categories = {
            'preventive': 2,  # Firewalls, access controls, encryption
            'detective': 1.5,  # Monitoring, logging, intrusion detection
            'corrective': 1,  # Backup, incident response, recovery procedures
            'deterrent': 0.5   # Security awareness, policies, legal measures
        }
        
        # Default control score (would be customized per asset/threat combination)
        total_control_effectiveness = 2.5  # Moderate controls in place
        
        return {
            'control_effectiveness': total_control_effectiveness,
            'control_types': ['preventive', 'detective'],
            'control_maturity': 'developing',
            'gaps_identified': ['need better monitoring', 'incident response training needed']
        }
    
    def calculate_residual_risk(self, inherent_risk, controls):
        \"\"\"Calculate residual risk after considering controls\"\"\"
        
        control_reduction_factor = controls['control_effectiveness'] / 5  # Normalize to 0-1
        residual_risk = inherent_risk * (1 - control_reduction_factor * 0.6)  # Max 60% reduction
        
        return round(residual_risk, 2)
    
    def categorize_risk(self, risk_score):
        \"\"\"Categorize risk level based on score\"\"\"
        
        if risk_score >= 15:
            return 'Critical'
        elif risk_score >= 10:
            return 'High'
        elif risk_score >= 6:
            return 'Medium'
        elif risk_score >= 3:
            return 'Low'
        else:
            return 'Very Low'
    
    def generate_risk_treatment_plan(self):
        \"\"\"Generate risk treatment recommendations\"\"\"
        
        treatment_plan = []
        
        # Sort risks by residual risk score
        sorted_risks = sorted(self.risk_register, key=lambda x: x['residual_risk'], reverse=True)
        
        for risk in sorted_risks:
            if risk['risk_level'] in ['Critical', 'High']:
                treatment = {
                    'risk_id': risk['risk_id'],
                    'priority': 'Immediate' if risk['risk_level'] == 'Critical' else 'High',
                    'treatment_strategy': 'Mitigate',
                    'recommended_controls': self.recommend_controls(risk),
                    'estimated_cost': self.estimate_treatment_cost(risk),
                    'timeline': '1-3 months' if risk['risk_level'] == 'Critical' else '3-6 months',
                    'success_criteria': f"Reduce risk to Medium level or below",
                    'risk_owner': risk['risk_owner']
                }
            elif risk['risk_level'] == 'Medium':
                treatment = {
                    'risk_id': risk['risk_id'],
                    'priority': 'Medium',
                    'treatment_strategy': 'Monitor/Mitigate',
                    'recommended_controls': self.recommend_controls(risk),
                    'estimated_cost': self.estimate_treatment_cost(risk),
                    'timeline': '6-12 months',
                    'success_criteria': 'Monitor for changes, implement controls if risk increases'
                }
            else:
                treatment = {
                    'risk_id': risk['risk_id'],
                    'priority': 'Low',
                    'treatment_strategy': 'Accept/Monitor',
                    'recommended_controls': [],
                    'estimated_cost': 'Minimal',
                    'timeline': 'Next review cycle',
                    'success_criteria': 'Continue monitoring'
                }
            
            treatment_plan.append(treatment)
        
        return treatment_plan
    
    def recommend_controls(self, risk):
        \"\"\"Recommend specific security controls based on risk\"\"\"
        
        # Control recommendations based on threat type and asset
        control_matrix = {
            'cyber': [
                'Implement multi-factor authentication',
                'Deploy endpoint detection and response',
                'Enhance network monitoring',
                'Conduct security awareness training',
                'Implement data loss prevention'
            ],
            'human_deliberate': [
                'Implement background checks',
                'Enhance access controls',
                'Implement user behavior monitoring',
                'Develop insider threat program',
                'Implement segregation of duties'
            ],
            'technical': [
                'Implement redundant systems',
                'Enhance backup and recovery procedures',
                'Implement preventive maintenance',
                'Deploy monitoring and alerting',
                'Create disaster recovery plan'
            ]
        }
        
        threat_category = risk.get('threat_category', 'cyber')
        return control_matrix.get(threat_category, ['Implement appropriate controls'])
    
    def generate_risk_dashboard(self):
        \"\"\"Generate risk dashboard and visualizations\"\"\"
        
        df = pd.DataFrame(self.risk_register)
        
        # Risk level distribution
        risk_counts = df['risk_level'].value_counts()
        
        # Create visualizations
        fig, axes = plt.subplots(2, 2, figsize=(15, 12))
        
        # Risk level distribution
        risk_counts.plot(kind='bar', ax=axes[0,0], color=['red', 'orange', 'yellow', 'green', 'blue'])
        axes[0,0].set_title('Risk Level Distribution')
        axes[0,0].set_ylabel('Number of Risks')
        
        # Risk by asset
        asset_risk = df.groupby('asset_name')['residual_risk'].sum().head(10)
        asset_risk.plot(kind='barh', ax=axes[0,1])
        axes[0,1].set_title('Top 10 Assets by Total Risk')
        
        # Risk heatmap
        risk_matrix = df.pivot_table(values='residual_risk', 
                                   index='likelihood', 
                                   columns='impact', 
                                   aggfunc='count', 
                                   fill_value=0)
        sns.heatmap(risk_matrix, annot=True, ax=axes[1,0], cmap='YlOrRd')
        axes[1,0].set_title('Risk Heat Map (Likelihood vs Impact)')
        
        # Risk trend over time (placeholder)
        axes[1,1].set_title('Risk Trend Analysis')
        axes[1,1].text(0.5, 0.5, 'Risk trend data would be\\nplotted here based on\\nhistorical assessments', 
                      ha='center', va='center', transform=axes[1,1].transAxes)
        
        plt.tight_layout()
        return fig`,
        
        compliance_management: `
import json
from datetime import datetime, timedelta
import pandas as pd
from dataclasses import dataclass
from typing import List, Dict, Optional

@dataclass
class ComplianceRequirement:
    requirement_id: str
    framework: str
    control_id: str
    description: str
    category: str
    mandatory: bool
    frequency: str  # Annual, Quarterly, Monthly, Continuous
    evidence_required: List[str]
    
@dataclass
class ComplianceControl:
    control_id: str
    name: str
    description: str
    control_type: str  # Preventive, Detective, Corrective
    implementation_status: str  # Not Started, In Progress, Implemented, Needs Review
    effectiveness: str  # Effective, Partially Effective, Ineffective
    last_tested: Optional[datetime]
    next_test_date: datetime
    responsible_party: str
    evidence_location: str
    deficiencies: List[str]

class ComplianceManagementSystem:
    def __init__(self):
        self.frameworks = {}
        self.requirements = []
        self.controls = []
        self.assessments = []
        self.remediation_plans = []
        
        # Initialize common frameworks
        self.initialize_frameworks()
    
    def initialize_frameworks(self):
        \"\"\"Initialize common compliance frameworks\"\"\"
        
        self.frameworks = {
            'ISO27001': {
                'name': 'ISO/IEC 27001:2013',
                'description': 'Information Security Management System',
                'domains': [
                    'Information security policies',
                    'Organization of information security', 
                    'Human resource security',
                    'Asset management',
                    'Access control',
                    'Cryptography',
                    'Physical and environmental security',
                    'Operations security',
                    'Communications security',
                    'System acquisition, development and maintenance',
                    'Supplier relationships',
                    'Information security incident management',
                    'Business continuity',
                    'Compliance'
                ],
                'certification_required': True
            },
            'NIST_CSF': {
                'name': 'NIST Cybersecurity Framework',
                'description': 'Framework for improving critical infrastructure cybersecurity',
                'functions': ['Identify', 'Protect', 'Detect', 'Respond', 'Recover'],
                'certification_required': False
            },
            'SOX': {
                'name': 'Sarbanes-Oxley Act',
                'description': 'Financial reporting and internal controls',
                'sections': ['302', '404', '409', '906'],
                'certification_required': True
            },
            'GDPR': {
                'name': 'General Data Protection Regulation',
                'description': 'EU data protection and privacy regulation',
                'principles': [
                    'Lawfulness, fairness and transparency',
                    'Purpose limitation',
                    'Data minimisation',
                    'Accuracy',
                    'Storage limitation',
                    'Integrity and confidentiality',
                    'Accountability'
                ],
                'certification_required': False
            }
        }
    
    def create_compliance_program(self, applicable_frameworks):
        \"\"\"Create comprehensive compliance program\"\"\"
        
        program = {
            'program_id': f"COMP_{datetime.now().strftime('%Y%m%d')}",
            'created_date': datetime.now().isoformat(),
            'frameworks': applicable_frameworks,
            'governance': {
                'steering_committee': 'Executive Leadership',
                'program_owner': 'CISO',
                'compliance_officer': 'Compliance Manager',
                'review_frequency': 'Quarterly'
            },
            'scope': {
                'business_units': ['IT', 'Finance', 'HR', 'Operations'],
                'systems': [],  # To be populated based on scope
                'data_types': ['PII', 'Financial', 'Intellectual Property'],
                'locations': ['Headquarters', 'Remote Offices', 'Cloud']
            },
            'timeline': {
                'assessment_phase': '3 months',
                'remediation_phase': '6 months', 
                'testing_phase': '2 months',
                'certification_phase': '1 month'
            }
        }
        
        return program
    
    def map_requirements_to_controls(self, framework):
        \"\"\"Map regulatory requirements to security controls\"\"\"
        
        if framework == 'ISO27001':
            return self.map_iso27001_controls()
        elif framework == 'NIST_CSF':
            return self.map_nist_csf_controls()
        elif framework == 'SOX':
            return self.map_sox_controls()
        elif framework == 'GDPR':
            return self.map_gdpr_controls()
    
    def map_iso27001_controls(self):
        \"\"\"Map ISO 27001 requirements to controls\"\"\"
        
        iso_controls = [
            {
                'control_id': 'A.5.1.1',
                'name': 'Policies for information security',
                'description': 'A set of policies for information security shall be defined',
                'category': 'Information security policies',
                'implementation_guidance': [
                    'Develop comprehensive information security policy',
                    'Ensure management approval and communication',
                    'Regular review and updates',
                    'Alignment with business objectives'
                ],
                'evidence_required': [
                    'Approved information security policy',
                    'Communication records',
                    'Review and approval documentation'
                ]
            },
            {
                'control_id': 'A.6.1.1', 
                'name': 'Information security roles and responsibilities',
                'description': 'All information security responsibilities shall be defined and allocated',
                'category': 'Organization of information security',
                'implementation_guidance': [
                    'Define security roles and responsibilities',
                    'Create RACI matrix for security activities',
                    'Document job descriptions with security responsibilities',
                    'Regular training on roles and responsibilities'
                ],
                'evidence_required': [
                    'Security roles and responsibilities document',
                    'RACI matrix',
                    'Job descriptions',
                    'Training records'
                ]
            },
            {
                'control_id': 'A.9.1.1',
                'name': 'Access control policy',
                'description': 'An access control policy shall be established',
                'category': 'Access control',
                'implementation_guidance': [
                    'Develop access control policy',
                    'Define access rights principles',
                    'Implement least privilege principle',
                    'Regular access reviews'
                ],
                'evidence_required': [
                    'Access control policy',
                    'Access rights documentation',
                    'Access review reports',
                    'Privilege escalation procedures'
                ]
            }
        ]
        
        return iso_controls
    
    def conduct_gap_assessment(self, framework, current_state_data):
        \"\"\"Conduct compliance gap assessment\"\"\"
        
        requirements = self.map_requirements_to_controls(framework)
        gap_analysis = {
            'assessment_date': datetime.now().isoformat(),
            'framework': framework,
            'total_requirements': len(requirements),
            'gaps': [],
            'compliant_controls': [],
            'partially_compliant': [],
            'non_compliant': []
        }
        
        for req in requirements:
            current_implementation = current_state_data.get(req['control_id'], {})
            
            assessment = {
                'control_id': req['control_id'],
                'control_name': req['name'],
                'required_evidence': req['evidence_required'],
                'current_evidence': current_implementation.get('evidence', []),
                'implementation_status': current_implementation.get('status', 'Not Started'),
                'effectiveness': current_implementation.get('effectiveness', 'Not Assessed'),
                'gaps_identified': []
            }
            
            # Assess gaps
            if assessment['implementation_status'] == 'Not Started':
                assessment['compliance_status'] = 'Non-Compliant'
                assessment['gaps_identified'] = ['Control not implemented']
                gap_analysis['non_compliant'].append(assessment)
                
            elif assessment['implementation_status'] == 'Implemented':
                if len(assessment['current_evidence']) >= len(assessment['required_evidence']):
                    assessment['compliance_status'] = 'Compliant'
                    gap_analysis['compliant_controls'].append(assessment)
                else:
                    assessment['compliance_status'] = 'Partially Compliant'
                    missing_evidence = set(assessment['required_evidence']) - set(assessment['current_evidence'])
                    assessment['gaps_identified'] = [f'Missing evidence: {e}' for e in missing_evidence]
                    gap_analysis['partially_compliant'].append(assessment)
            
            else:
                assessment['compliance_status'] = 'Partially Compliant'
                assessment['gaps_identified'] = ['Implementation in progress']
                gap_analysis['partially_compliant'].append(assessment)
            
            gap_analysis['gaps'].append(assessment)
        
        # Calculate compliance percentages
        total = gap_analysis['total_requirements']
        gap_analysis['compliance_metrics'] = {
            'fully_compliant_pct': (len(gap_analysis['compliant_controls']) / total) * 100,
            'partially_compliant_pct': (len(gap_analysis['partially_compliant']) / total) * 100,
            'non_compliant_pct': (len(gap_analysis['non_compliant']) / total) * 100
        }
        
        return gap_analysis
    
    def create_remediation_plan(self, gap_assessment):
        \"\"\"Create detailed remediation plan based on gap assessment\"\"\"
        
        remediation_plan = {
            'plan_id': f"REM_{datetime.now().strftime('%Y%m%d')}",
            'created_date': datetime.now().isoformat(),
            'framework': gap_assessment['framework'],
            'total_gaps': len(gap_assessment['non_compliant']) + len(gap_assessment['partially_compliant']),
            'remediation_items': []
        }
        
        priority_mapping = {
            'Non-Compliant': 1,  # Critical
            'Partially Compliant': 2  # High
        }
        
        all_gaps = gap_assessment['non_compliant'] + gap_assessment['partially_compliant']
        
        for gap in all_gaps:
            remediation_item = {
                'item_id': f"{gap['control_id']}_REM",
                'control_id': gap['control_id'],
                'control_name': gap['control_name'],
                'current_status': gap['compliance_status'],
                'priority': priority_mapping[gap['compliance_status']],
                'gaps_to_address': gap['gaps_identified'],
                'remediation_actions': self.generate_remediation_actions(gap),
                'estimated_effort': self.estimate_remediation_effort(gap),
                'target_completion': self.calculate_target_completion(gap, priority_mapping[gap['compliance_status']]),
                'responsible_party': self.assign_responsible_party(gap['control_id']),
                'dependencies': [],
                'success_criteria': f"Achieve compliant status for {gap['control_id']}",
                'status': 'Not Started'
            }
            
            remediation_plan['remediation_items'].append(remediation_item)
        
        # Sort by priority
        remediation_plan['remediation_items'].sort(key=lambda x: x['priority'])
        
        return remediation_plan
    
    def generate_compliance_report(self, assessment_data, remediation_data):
        \"\"\"Generate comprehensive compliance status report\"\"\"
        
        report = {
            'report_date': datetime.now().isoformat(),
            'reporting_period': f"Q{(datetime.now().month-1)//3 + 1} {datetime.now().year}",
            'executive_summary': {
                'overall_compliance_score': self.calculate_compliance_score(assessment_data),
                'total_controls_assessed': assessment_data['total_requirements'],
                'compliant_controls': len(assessment_data['compliant_controls']),
                'gaps_identified': len(assessment_data['non_compliant']) + len(assessment_data['partially_compliant']),
                'remediation_items': len(remediation_data['remediation_items']),
                'high_priority_items': len([item for item in remediation_data['remediation_items'] if item['priority'] == 1])
            },
            'compliance_metrics': assessment_data['compliance_metrics'],
            'framework_status': {
                'framework': assessment_data['framework'],
                'certification_target': 'Q4 2024',
                'readiness_assessment': 'In Progress',
                'key_risks': self.identify_compliance_risks(assessment_data)
            },
            'remediation_progress': {
                'total_items': len(remediation_data['remediation_items']),
                'completed': len([item for item in remediation_data['remediation_items'] if item['status'] == 'Completed']),
                'in_progress': len([item for item in remediation_data['remediation_items'] if item['status'] == 'In Progress']),
                'not_started': len([item for item in remediation_data['remediation_items'] if item['status'] == 'Not Started'])
            },
            'recommendations': [
                'Prioritize completion of critical compliance gaps',
                'Implement continuous monitoring for key controls',
                'Conduct regular compliance training for staff',
                'Establish regular compliance review meetings',
                'Consider third-party compliance assessment'
            ]
        }
        
        return report`
      }
    };
  }
  
  /**
   * Security Architecture Expert Expertise
   */
  static getSecurityArchitectureExpertise() {
    return {
      name: 'Security Architecture Expert',
      expertise: {
        core: {
          architecture_design: 'Enterprise security architecture, security patterns, reference models, security integration',
          zero_trust: 'Zero trust architecture, micro-segmentation, identity-centric security, continuous verification',
          threat_modeling: 'Architectural threat modeling, security design principles, attack surface analysis',
          security_controls: 'Security control design, defense in depth, security control integration',
          cloud_security: 'Cloud security architecture, hybrid security models, multi-cloud security'
        },
        
        architecture_frameworks: {
          sabsa: 'Sherwood Applied Business Security Architecture, business-driven security',
          togaf: 'The Open Group Architecture Framework, enterprise architecture integration',
          zachman: 'Zachman Framework for Enterprise Architecture, security perspective',
          nist_rmf: 'NIST Risk Management Framework, security control architecture',
          iso_27001: 'ISO 27001 security architecture requirements, ISMS integration'
        },
        
        zero_trust: {
          principles: 'Never trust always verify, least privilege access, assume breach, verify explicitly',
          components: 'Identity verification, device compliance, network segmentation, data protection',
          implementation: 'Conditional access, microsegmentation, encrypted communications, analytics',
          maturity: 'Zero trust maturity model, implementation phases, measurement criteria'
        },
        
        threat_modeling: {
          methodologies: 'STRIDE, PASTA, VAST, OCTAVE, attack trees, data flow diagrams',
          architectural: 'System-level threat modeling, component interaction analysis, trust boundaries',
          automation: 'Automated threat modeling, integration with development lifecycle',
          validation: 'Threat model validation, security testing integration, continuous updates'
        },
        
        security_patterns: {
          access_control: 'RBAC, ABAC, authentication patterns, authorization patterns',
          data_protection: 'Encryption patterns, key management, data classification patterns',
          communication: 'Secure communication patterns, API security, message security',
          monitoring: 'Security monitoring patterns, logging patterns, incident detection'
        },
        
        cloud_security: {
          shared_responsibility: 'Cloud security responsibility models, control mapping',
          identity_management: 'Cloud identity architecture, federated identity, IAM patterns',
          network_security: 'Cloud network security, virtual private clouds, security groups',
          data_protection: 'Cloud data encryption, key management services, data residency',
          compliance: 'Cloud compliance architecture, regulatory requirements, audit trails'
        }
      },
      
      capabilities: [
        'Design enterprise-wide security architectures and frameworks',
        'Implement zero trust architecture and micro-segmentation strategies',
        'Conduct architectural threat modeling and risk assessments',
        'Design security control architectures and integration patterns',
        'Develop cloud security architectures and hybrid security models',
        'Create security reference architectures and design patterns',
        'Integrate security into enterprise architecture frameworks',
        'Design identity and access management architectures',
        'Develop data protection and privacy architectures',
        'Create security monitoring and incident response architectures',
        'Design secure software development lifecycle integration',
        'Implement DevSecOps and security automation architectures',
        'Conduct security architecture reviews and assessments',
        'Develop security architecture governance and standards',
        'Create security architecture roadmaps and strategies',
        'Design resilient and fault-tolerant security systems'
      ],
      
      systemPromptAdditions: `
You are a Security Architecture expert specializing in:
- Enterprise security architecture design and implementation
- Zero trust architecture and micro-segmentation strategies  
- Architectural threat modeling and security design principles
- Security control integration and defense in depth strategies
- Cloud security architecture and hybrid security models
- Security architecture frameworks and governance

Always focus on business alignment, scalability, and integration with enterprise architecture. Emphasize security by design and architectural resilience.`,
      
      bestPractices: [
        'Integrate security architecture with enterprise architecture',
        'Apply security by design principles throughout architecture',
        'Implement defense in depth with multiple security layers',
        'Design for scalability, performance, and maintainability',
        'Use established security architecture frameworks and patterns',
        'Conduct regular architectural threat modeling exercises',
        'Implement zero trust principles and continuous verification',
        'Design security controls to be measurable and auditable',
        'Integrate security architecture with business processes',
        'Maintain security architecture documentation and standards',
        'Design for regulatory compliance and audit requirements',
        'Implement security architecture governance and review processes',
        'Use risk-based approaches for security architecture decisions',
        'Design resilient architectures that degrade gracefully',
        'Integrate emerging technologies with security considerations'
      ],
      
      codePatterns: {
        zero_trust_architecture: `
import json
from datetime import datetime
from typing import Dict, List, Optional
from dataclasses import dataclass
from enum import Enum

class TrustLevel(Enum):
    UNTRUSTED = 0
    LOW = 1
    MEDIUM = 2
    HIGH = 3
    CRITICAL = 4

class AccessDecision(Enum):
    ALLOW = "allow"
    DENY = "deny" 
    CHALLENGE = "challenge"

@dataclass
class SecurityContext:
    user_id: str
    device_id: str
    location: str
    time_of_access: datetime
    risk_score: float
    authentication_method: str
    device_compliance: bool
    network_trust_level: TrustLevel

@dataclass
class ResourceContext:
    resource_id: str
    classification: str
    sensitivity_level: int
    required_trust_level: TrustLevel
    access_patterns: Dict[str, any]

class ZeroTrustPolicyEngine:
    def __init__(self):
        self.policies = []
        self.trust_scores = {}
        self.access_logs = []
        
        # Initialize default policies
        self.initialize_default_policies()
    
    def initialize_default_policies(self):
        \"\"\"Initialize default zero trust policies\"\"\"
        
        default_policies = [
            {
                'policy_id': 'ZT001',
                'name': 'High-Value Resource Access',
                'description': 'Access to critical business resources',
                'conditions': {
                    'resource_classification': ['confidential', 'secret'],
                    'minimum_trust_level': TrustLevel.HIGH,
                    'required_authentication': ['mfa', '2fa'],
                    'device_compliance': True,
                    'network_requirements': ['corporate', 'vpn']
                },
                'actions': {
                    'default': AccessDecision.DENY,
                    'on_match': AccessDecision.ALLOW,
                    'on_partial_match': AccessDecision.CHALLENGE
                }
            },
            {
                'policy_id': 'ZT002',
                'name': 'Untrusted Network Access',
                'description': 'Access from untrusted networks',
                'conditions': {
                    'network_trust_level': TrustLevel.UNTRUSTED,
                    'risk_score_threshold': 0.3
                },
                'actions': {
                    'default': AccessDecision.CHALLENGE,
                    'high_risk': AccessDecision.DENY
                }
            },
            {
                'policy_id': 'ZT003',
                'name': 'Anomalous Behavior Detection',
                'description': 'Detect and respond to anomalous access patterns',
                'conditions': {
                    'behavioral_anomaly': True,
                    'deviation_threshold': 0.8
                },
                'actions': {
                    'default': AccessDecision.CHALLENGE,
                    'critical_anomaly': AccessDecision.DENY
                }
            }
        ]
        
        self.policies.extend(default_policies)
    
    def calculate_trust_score(self, security_context: SecurityContext) -> float:
        \"\"\"Calculate dynamic trust score based on multiple factors\"\"\"
        
        trust_factors = {
            'authentication_strength': 0,
            'device_compliance': 0,
            'location_trust': 0,
            'behavioral_pattern': 0,
            'time_based_risk': 0
        }
        
        # Authentication strength scoring
        auth_scores = {
            'password': 0.2,
            'mfa': 0.8,
            '2fa': 0.7,
            'biometric': 0.9,
            'certificate': 0.9
        }
        trust_factors['authentication_strength'] = auth_scores.get(
            security_context.authentication_method, 0.1
        )
        
        # Device compliance scoring
        trust_factors['device_compliance'] = 0.8 if security_context.device_compliance else 0.2
        
        # Location-based trust
        trusted_locations = ['office', 'home_office', 'corporate_vpn']
        if security_context.location in trusted_locations:
            trust_factors['location_trust'] = 0.7
        elif 'vpn' in security_context.location.lower():
            trust_factors['location_trust'] = 0.5
        else:
            trust_factors['location_trust'] = 0.2
        
        # Behavioral pattern analysis (simplified)
        historical_pattern = self.analyze_user_behavior(security_context.user_id)
        trust_factors['behavioral_pattern'] = historical_pattern.get('trust_score', 0.5)
        
        # Time-based risk assessment
        current_hour = security_context.time_of_access.hour
        if 9 <= current_hour <= 17:  # Business hours
            trust_factors['time_based_risk'] = 0.8
        elif 17 < current_hour <= 22 or 6 <= current_hour < 9:  # Extended hours
            trust_factors['time_based_risk'] = 0.6
        else:  # Off hours
            trust_factors['time_based_risk'] = 0.3
        
        # Calculate weighted trust score
        weights = {
            'authentication_strength': 0.25,
            'device_compliance': 0.2,
            'location_trust': 0.2,
            'behavioral_pattern': 0.2,
            'time_based_risk': 0.15
        }
        
        trust_score = sum(
            trust_factors[factor] * weights[factor] 
            for factor in trust_factors
        )
        
        return min(1.0, max(0.0, trust_score))
    
    def evaluate_access_request(self, security_context: SecurityContext, 
                              resource_context: ResourceContext) -> Dict:
        \"\"\"Evaluate access request against zero trust policies\"\"\"
        
        # Calculate current trust score
        trust_score = self.calculate_trust_score(security_context)
        
        # Store trust score for user/device combination
        context_key = f"{security_context.user_id}_{security_context.device_id}"
        self.trust_scores[context_key] = trust_score
        
        evaluation_result = {
            'request_id': f"REQ_{datetime.now().strftime('%Y%m%d%H%M%S')}",
            'timestamp': security_context.time_of_access.isoformat(),
            'user_id': security_context.user_id,
            'resource_id': resource_context.resource_id,
            'trust_score': trust_score,
            'decision': AccessDecision.DENY,
            'reasons': [],
            'required_actions': [],
            'policy_matches': []
        }
        
        # Evaluate against policies
        for policy in self.policies:
            policy_match = self.evaluate_policy(policy, security_context, resource_context, trust_score)
            
            if policy_match['matched']:
                evaluation_result['policy_matches'].append(policy_match)
                
                # Apply most restrictive decision
                if policy_match['decision'] == AccessDecision.DENY:
                    evaluation_result['decision'] = AccessDecision.DENY
                    evaluation_result['reasons'].extend(policy_match['reasons'])
                elif policy_match['decision'] == AccessDecision.CHALLENGE and \\
                     evaluation_result['decision'] != AccessDecision.DENY:
                    evaluation_result['decision'] = AccessDecision.CHALLENGE
                    evaluation_result['required_actions'].extend(policy_match['required_actions'])
                elif policy_match['decision'] == AccessDecision.ALLOW and \\
                     evaluation_result['decision'] not in [AccessDecision.DENY, AccessDecision.CHALLENGE]:
                    evaluation_result['decision'] = AccessDecision.ALLOW
        
        # Default deny if no policies matched
        if not evaluation_result['policy_matches']:
            evaluation_result['decision'] = AccessDecision.DENY
            evaluation_result['reasons'].append('No matching policies found - default deny')
        
        # Log access attempt
        self.log_access_attempt(evaluation_result)
        
        return evaluation_result
    
    def evaluate_policy(self, policy: Dict, security_context: SecurityContext,
                       resource_context: ResourceContext, trust_score: float) -> Dict:
        \"\"\"Evaluate a specific policy against the request context\"\"\"
        
        policy_result = {
            'policy_id': policy['policy_id'],
            'policy_name': policy['name'],
            'matched': False,
            'decision': AccessDecision.DENY,
            'reasons': [],
            'required_actions': []
        }
        
        conditions = policy.get('conditions', {})
        matched_conditions = 0
        total_conditions = len(conditions)
        
        # Check resource classification
        if 'resource_classification' in conditions:
            if resource_context.classification in conditions['resource_classification']:
                matched_conditions += 1
            else:
                policy_result['reasons'].append(f"Resource classification mismatch")
        
        # Check minimum trust level
        if 'minimum_trust_level' in conditions:
            required_level = conditions['minimum_trust_level']
            if trust_score >= (required_level.value / 4):  # Convert enum to 0-1 scale
                matched_conditions += 1
            else:
                policy_result['reasons'].append(f"Trust level too low: {trust_score}")
        
        # Check authentication requirements
        if 'required_authentication' in conditions:
            if security_context.authentication_method in conditions['required_authentication']:
                matched_conditions += 1
            else:
                policy_result['reasons'].append("Authentication method insufficient")
                policy_result['required_actions'].append("Upgrade authentication method")
        
        # Check device compliance
        if 'device_compliance' in conditions:
            if security_context.device_compliance == conditions['device_compliance']:
                matched_conditions += 1
            else:
                policy_result['reasons'].append("Device not compliant")
                policy_result['required_actions'].append("Ensure device compliance")
        
        # Check network requirements
        if 'network_requirements' in conditions:
            network_ok = any(req in security_context.location 
                           for req in conditions['network_requirements'])
            if network_ok:
                matched_conditions += 1
            else:
                policy_result['reasons'].append("Network location not authorized")
        
        # Determine if policy matches and decision
        if matched_conditions == total_conditions:
            policy_result['matched'] = True
            policy_result['decision'] = policy['actions']['on_match']
        elif matched_conditions > 0:
            policy_result['matched'] = True
            policy_result['decision'] = policy['actions'].get('on_partial_match', AccessDecision.DENY)
        
        return policy_result
    
    def implement_microsegmentation(self, network_topology: Dict) -> Dict:
        \"\"\"Design and implement network microsegmentation\"\"\"
        
        segmentation_plan = {
            'design_date': datetime.now().isoformat(),
            'segments': [],
            'policies': [],
            'enforcement_points': []
        }
        
        # Define security zones
        security_zones = {
            'dmz': {'trust_level': TrustLevel.LOW, 'purpose': 'External-facing services'},
            'internal': {'trust_level': TrustLevel.MEDIUM, 'purpose': 'Internal business applications'},
            'secure': {'trust_level': TrustLevel.HIGH, 'purpose': 'Critical business systems'},
            'management': {'trust_level': TrustLevel.CRITICAL, 'purpose': 'Network and security management'}
        }
        
        # Create microsegments based on application tiers
        for zone_name, zone_config in security_zones.items():
            segment = {
                'segment_id': f"SEG_{zone_name.upper()}",
                'name': f"{zone_name.title()} Segment",
                'trust_level': zone_config['trust_level'],
                'purpose': zone_config['purpose'],
                'allowed_protocols': self.define_allowed_protocols(zone_name),
                'security_controls': self.define_segment_controls(zone_name),
                'monitoring_requirements': self.define_monitoring_requirements(zone_name)
            }
            
            segmentation_plan['segments'].append(segment)
        
        # Define inter-segment communication policies
        segmentation_policies = [
            {
                'policy_id': 'MS001',
                'name': 'DMZ to Internal Communication',
                'source_segment': 'SEG_DMZ',
                'destination_segment': 'SEG_INTERNAL',
                'allowed_traffic': ['HTTPS:443', 'API:8080'],
                'conditions': ['authenticated', 'encrypted'],
                'logging': 'all_connections'
            },
            {
                'policy_id': 'MS002', 
                'name': 'Internal to Secure Communication',
                'source_segment': 'SEG_INTERNAL',
                'destination_segment': 'SEG_SECURE',
                'allowed_traffic': ['HTTPS:443', 'DATABASE:5432'],
                'conditions': ['mfa_authenticated', 'encrypted', 'approved_application'],
                'logging': 'all_connections'
            }
        ]
        
        segmentation_plan['policies'] = segmentation_policies
        
        return segmentation_plan`,
        
        threat_modeling: `
import json
from datetime import datetime
from typing import Dict, List, Optional
from dataclasses import dataclass, asdict
from enum import Enum

class ThreatCategory(Enum):
    SPOOFING = "Spoofing"
    TAMPERING = "Tampering" 
    REPUDIATION = "Repudiation"
    INFORMATION_DISCLOSURE = "Information Disclosure"
    DENIAL_OF_SERVICE = "Denial of Service"
    ELEVATION_OF_PRIVILEGE = "Elevation of Privilege"

class RiskLevel(Enum):
    LOW = 1
    MEDIUM = 2
    HIGH = 3
    CRITICAL = 4

@dataclass
class SystemComponent:
    component_id: str
    name: str
    type: str  # Process, Data Store, External Entity, Data Flow
    trust_level: int
    data_classification: str
    technologies: List[str]
    network_location: str
    
@dataclass
class DataFlow:
    flow_id: str
    source_component: str
    destination_component: str
    data_elements: List[str]
    protocol: str
    encryption: bool
    authentication_required: bool

@dataclass
class TrustBoundary:
    boundary_id: str
    name: str
    components_inside: List[str]
    components_outside: List[str]
    boundary_type: str  # Network, Process, Physical
    security_controls: List[str]

@dataclass
class Threat:
    threat_id: str
    category: ThreatCategory
    description: str
    affected_components: List[str]
    attack_methods: List[str]
    prerequisites: List[str]
    impact_description: str
    likelihood: int  # 1-5 scale
    impact: int  # 1-5 scale
    risk_level: RiskLevel
    existing_controls: List[str]
    recommended_mitigations: List[str]

class ArchitecturalThreatModel:
    def __init__(self, system_name: str, version: str):
        self.system_name = system_name
        self.version = version
        self.created_date = datetime.now()
        self.components = []
        self.data_flows = []
        self.trust_boundaries = []
        self.threats = []
        
    def add_component(self, component: SystemComponent):
        \"\"\"Add system component to threat model\"\"\"
        self.components.append(component)
    
    def add_data_flow(self, data_flow: DataFlow):
        \"\"\"Add data flow to threat model\"\"\"
        self.data_flows.append(data_flow)
    
    def add_trust_boundary(self, boundary: TrustBoundary):
        \"\"\"Add trust boundary to threat model\"\"\"
        self.trust_boundaries.append(boundary)
    
    def identify_stride_threats(self) -> List[Threat]:
        \"\"\"Identify STRIDE threats for each component and data flow\"\"\"
        
        identified_threats = []
        
        # Analyze each component for potential threats
        for component in self.components:
            component_threats = self.analyze_component_threats(component)
            identified_threats.extend(component_threats)
        
        # Analyze each data flow for potential threats
        for data_flow in self.data_flows:
            flow_threats = self.analyze_data_flow_threats(data_flow)
            identified_threats.extend(flow_threats)
        
        # Analyze trust boundary crossings
        boundary_threats = self.analyze_trust_boundary_threats()
        identified_threats.extend(boundary_threats)
        
        self.threats = identified_threats
        return identified_threats
    
    def analyze_component_threats(self, component: SystemComponent) -> List[Threat]:
        \"\"\"Analyze STRIDE threats for a specific component\"\"\"
        
        threats = []
        threat_templates = self.get_component_threat_templates(component.type)
        
        for template in threat_templates:
            # Customize threat based on component characteristics
            threat = Threat(
                threat_id=f"T_{component.component_id}_{template['category'].name[:4]}_{len(threats)+1:03d}",
                category=template['category'],
                description=template['description'].format(
                    component_name=component.name,
                    component_type=component.type
                ),
                affected_components=[component.component_id],
                attack_methods=template['attack_methods'],
                prerequisites=template['prerequisites'],
                impact_description=template['impact_description'],
                likelihood=self.assess_likelihood(component, template),
                impact=self.assess_impact(component, template),
                risk_level=RiskLevel.MEDIUM,  # Will be calculated
                existing_controls=self.identify_existing_controls(component, template),
                recommended_mitigations=template['mitigations']
            )
            
            # Calculate risk level
            risk_score = threat.likelihood * threat.impact
            if risk_score >= 16:
                threat.risk_level = RiskLevel.CRITICAL
            elif risk_score >= 12:
                threat.risk_level = RiskLevel.HIGH
            elif risk_score >= 6:
                threat.risk_level = RiskLevel.MEDIUM
            else:
                threat.risk_level = RiskLevel.LOW
            
            threats.append(threat)
        
        return threats
    
    def get_component_threat_templates(self, component_type: str) -> List[Dict]:
        \"\"\"Get STRIDE threat templates for component type\"\"\"
        
        templates = {
            'Process': [
                {
                    'category': ThreatCategory.SPOOFING,
                    'description': 'Attacker spoofs the identity of {component_name} process',
                    'attack_methods': ['Process injection', 'DLL hijacking', 'Service impersonation'],
                    'prerequisites': ['Local access', 'Elevated privileges'],
                    'impact_description': 'Unauthorized code execution with process privileges',
                    'mitigations': ['Code signing', 'Process integrity verification', 'Least privilege']
                },
                {
                    'category': ThreatCategory.TAMPERING,
                    'description': 'Attacker modifies {component_name} process or its data',
                    'attack_methods': ['Memory corruption', 'Configuration tampering', 'Binary modification'],
                    'prerequisites': ['System access', 'Write permissions'],
                    'impact_description': 'Altered process behavior and data corruption',
                    'mitigations': ['Input validation', 'File integrity monitoring', 'Code obfuscation']
                },
                {
                    'category': ThreatCategory.ELEVATION_OF_PRIVILEGE,
                    'description': 'Attacker exploits {component_name} to gain higher privileges',
                    'attack_methods': ['Buffer overflow', 'Privilege escalation bugs', 'Insecure permissions'],
                    'prerequisites': ['Code execution capability', 'Vulnerability in component'],
                    'impact_description': 'Unauthorized system access with elevated privileges',
                    'mitigations': ['Secure coding practices', 'Privilege separation', 'Access controls']
                }
            ],
            'Data Store': [
                {
                    'category': ThreatCategory.INFORMATION_DISCLOSURE,
                    'description': 'Unauthorized access to sensitive data in {component_name}',
                    'attack_methods': ['SQL injection', 'Direct database access', 'Backup theft'],
                    'prerequisites': ['Network access', 'Weak authentication'],
                    'impact_description': 'Exposure of confidential business and customer data',
                    'mitigations': ['Encryption at rest', 'Access controls', 'Database hardening']
                },
                {
                    'category': ThreatCategory.TAMPERING,
                    'description': 'Unauthorized modification of data in {component_name}',
                    'attack_methods': ['SQL injection', 'Privilege escalation', 'Direct manipulation'],
                    'prerequisites': ['Database access', 'Write permissions'],
                    'impact_description': 'Data integrity compromise and business process disruption',
                    'mitigations': ['Input validation', 'Database permissions', 'Change auditing']
                },
                {
                    'category': ThreatCategory.DENIAL_OF_SERVICE,
                    'description': 'Attacker makes {component_name} unavailable',
                    'attack_methods': ['Resource exhaustion', 'Lock contention', 'Storage filling'],
                    'prerequisites': ['Network access', 'Query capability'],
                    'impact_description': 'Service disruption and business operation impact',
                    'mitigations': ['Rate limiting', 'Resource monitoring', 'High availability design']
                }
            ],
            'External Entity': [
                {
                    'category': ThreatCategory.SPOOFING,
                    'description': 'Malicious entity impersonates legitimate {component_name}',
                    'attack_methods': ['Identity theft', 'Credential compromise', 'Social engineering'],
                    'prerequisites': ['Identity information', 'Communication channel'],
                    'impact_description': 'Unauthorized access using legitimate identity',
                    'mitigations': ['Strong authentication', 'Identity verification', 'Behavioral monitoring']
                },
                {
                    'category': ThreatCategory.REPUDIATION,
                    'description': '{component_name} denies performing malicious actions',
                    'attack_methods': ['Log tampering', 'Identity obfuscation', 'Timing attacks'],
                    'prerequisites': ['System access', 'Log modification capability'],
                    'impact_description': 'Inability to prove malicious activity occurred',
                    'mitigations': ['Comprehensive logging', 'Log integrity protection', 'Non-repudiation mechanisms']
                }
            ]
        }
        
        return templates.get(component_type, [])
    
    def analyze_data_flow_threats(self, data_flow: DataFlow) -> List[Threat]:
        \"\"\"Analyze threats specific to data flows\"\"\"
        
        threats = []
        
        # Information Disclosure threats
        if not data_flow.encryption:
            threat = Threat(
                threat_id=f"T_{data_flow.flow_id}_DISC_001",
                category=ThreatCategory.INFORMATION_DISCLOSURE,
                description=f"Data transmitted between {data_flow.source_component} and {data_flow.destination_component} is not encrypted",
                affected_components=[data_flow.source_component, data_flow.destination_component],
                attack_methods=['Network sniffing', 'Man-in-the-middle', 'Packet capture'],
                prerequisites=['Network access', 'Packet capture tools'],
                impact_description='Exposure of sensitive data during transmission',
                likelihood=4,
                impact=self.calculate_data_sensitivity_impact(data_flow.data_elements),
                risk_level=RiskLevel.HIGH,
                existing_controls=[],
                recommended_mitigations=['Implement TLS encryption', 'Use VPN tunnels', 'End-to-end encryption']
            )
            threats.append(threat)
        
        # Tampering threats
        threat = Threat(
            threat_id=f"T_{data_flow.flow_id}_TAMP_001",
            category=ThreatCategory.TAMPERING,
            description=f"Data flow between {data_flow.source_component} and {data_flow.destination_component} could be intercepted and modified",
            affected_components=[data_flow.source_component, data_flow.destination_component],
            attack_methods=['Man-in-the-middle', 'Packet modification', 'Protocol manipulation'],
            prerequisites=['Network access', 'Traffic interception capability'],
            impact_description='Data integrity compromise during transmission',
            likelihood=3,
            impact=3,
            risk_level=RiskLevel.MEDIUM,
            existing_controls=['TLS encryption'] if data_flow.encryption else [],
            recommended_mitigations=['Message integrity checks', 'Digital signatures', 'Secure protocols']
        )
        threats.append(threat)
        
        return threats
    
    def generate_threat_model_report(self) -> Dict:
        \"\"\"Generate comprehensive threat model report\"\"\"
        
        # Calculate threat statistics
        threat_stats = {
            'total_threats': len(self.threats),
            'by_category': {},
            'by_risk_level': {},
            'high_risk_threats': [],
            'unmitigated_threats': []
        }
        
        for threat in self.threats:
            # Count by category
            category = threat.category.value
            threat_stats['by_category'][category] = threat_stats['by_category'].get(category, 0) + 1
            
            # Count by risk level
            risk_level = threat.risk_level.name
            threat_stats['by_risk_level'][risk_level] = threat_stats['by_risk_level'].get(risk_level, 0) + 1
            
            # Collect high risk threats
            if threat.risk_level in [RiskLevel.HIGH, RiskLevel.CRITICAL]:
                threat_stats['high_risk_threats'].append(threat.threat_id)
            
            # Check for unmitigated threats
            if not threat.existing_controls:
                threat_stats['unmitigated_threats'].append(threat.threat_id)
        
        report = {
            'system_name': self.system_name,
            'version': self.version,
            'model_created': self.created_date.isoformat(),
            'report_generated': datetime.now().isoformat(),
            'executive_summary': {
                'total_components': len(self.components),
                'total_data_flows': len(self.data_flows),
                'total_trust_boundaries': len(self.trust_boundaries),
                'threat_statistics': threat_stats
            },
            'architecture_overview': {
                'components': [asdict(comp) for comp in self.components],
                'data_flows': [asdict(flow) for flow in self.data_flows],
                'trust_boundaries': [asdict(boundary) for boundary in self.trust_boundaries]
            },
            'threat_analysis': {
                'identified_threats': [asdict(threat) for threat in self.threats],
                'threat_statistics': threat_stats
            },
            'recommendations': self.generate_security_recommendations(),
            'next_steps': [
                'Review and validate identified threats with stakeholders',
                'Prioritize mitigation implementation based on risk levels',
                'Implement recommended security controls',
                'Establish continuous threat modeling process',
                'Update threat model as system architecture changes'
            ]
        }
        
        return report`
      }
    };
  }
}

// Export all expertise methods
module.exports = SecurityExpertise;
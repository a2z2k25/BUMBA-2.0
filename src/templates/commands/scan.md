---
allowed-tools: all
description: Advanced security vulnerability scanning and static analysis using Semgrep
---

# 🏁 /bumba:scan ARGUMENTS$

**Enterprise Security Scanning with Semgrep Static Analysis**

## Mission

Comprehensive security vulnerability detection using Semgrep's 5,000+ static analysis rules, custom rule creation, and enterprise-grade security enforcement for production-ready code.

## Scanning Capabilities

### Vulnerability Detection

- **Security Vulnerabilities**: OWASP Top 10, injection attacks, authentication flaws
- **Code Quality Issues**: Maintainability, performance, best practices violations
- **Custom Rules**: Project-specific security patterns and organizational standards
- **Language Support**: JavaScript, TypeScript, Python, Java, Go, C/C++, Ruby, PHP, and more

### Analysis Types

```bash
# Security-focused scans
SECURITY_CONFIGS=(
  "p/security"           # Comprehensive security rules
  "p/owasp-top-ten"     # OWASP Top 10 vulnerabilities
  "p/cwe-top-25"        # CWE Top 25 most dangerous weaknesses
  "p/secrets"           # Secret detection (API keys, tokens)
  "p/supply-chain"      # Supply chain security
)

# Quality and performance scans
QUALITY_CONFIGS=(
  "p/performance"       # Performance anti-patterns
  "p/correctness"       # Logic errors and bugs
  "p/maintainability"   # Code maintainability issues
  "p/best-practices"    # Language-specific best practices
)
```

### Enterprise Features

- **Custom Rule Creation**: Organization-specific security patterns
- **AST Analysis**: Abstract Syntax Tree inspection for deep code understanding
- **Semgrep AppSec Platform**: Cloud-based scanning with centralized reporting
- **CI/CD Integration**: Automated security gates in deployment pipelines

## Scanning Workflows

```bash
# Intelligent scanning agent with parallel execution
Agent: security_scan_orchestrator() {
  # Phase 1: Quick security triage
  quick_security_scan "$ARGUMENTS$"

  # Phase 2: Comprehensive analysis
  full_vulnerability_scan "$ARGUMENTS$"

  # Phase 3: Custom rule application
  apply_custom_rules "$ARGUMENTS$"

  # Phase 4: Report generation
  generate_security_report "$ARGUMENTS$"
}

# Specialized scanning functions
security_check() {
  semgrep --config=p/security "$TARGET"
  semgrep --config=p/owasp-top-ten "$TARGET"
  semgrep --config=p/secrets "$TARGET"
}

custom_rules_scan() {
  semgrep --config=custom-rules/ "$TARGET"
  semgrep --config=organization-patterns.yml "$TARGET"
}

ast_analysis() {
  semgrep --dump-ast "$TARGET"
  semgrep --config=custom-ast-rules.yml "$TARGET"
}
```

## Integration Points

### BUMBA Quality Gates

- **Pre-execution Scanning**: Automatic security validation before code changes
- **Post-execution Validation**: Security verification after implementation
- **Continuous Monitoring**: Real-time security assessment during development

### Development Workflow

- **IDE Integration**: Real-time security feedback during coding
- **Pull Request Gates**: Automated security checks before merge
- **Deployment Validation**: Security clearance before production deployment

## Reporting & Remediation

- **Vulnerability Assessment**: Severity classification (Critical, High, Medium, Low)
- **Remediation Guidance**: Specific fix recommendations with code examples
- **Compliance Mapping**: OWASP, CWE, PCI-DSS compliance tracking
- **Trend Analysis**: Security posture improvement over time

## Examples

```bash
/bumba:scan security vulnerabilities in authentication module
/bumba:scan custom rules for payment processing code
/bumba:scan secrets detection across entire repository
/bumba:scan performance issues in React components
/bumba:scan supply chain vulnerabilities in dependencies
/bumba:scan create custom rule for JWT token validation
/bumba:scan comprehensive analysis with AST inspection
```

## Advanced Features

```bash
# Custom rule creation
/bumba:scan create rule "detect insecure JWT usage"
/bumba:scan create rule "enforce company auth patterns"

# AST-based analysis
/bumba:scan ast analysis of complex data flows
/bumba:scan ast patterns for SQL injection detection

# Integration scanning
/bumba:scan api endpoints for security vulnerabilities
/bumba:scan docker containers for security issues
```

**Success Criteria**: Comprehensive security assessment with zero critical vulnerabilities, remediation roadmap, custom rule implementation, and continuous security monitoring setup.

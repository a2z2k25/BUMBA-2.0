# 🏁 BUMBA Security Validation Command

You are performing comprehensive security analysis and validation using BUMBA's enterprise security framework.

## Security Analysis Context

**Target**: `{{SECURITY_TARGET}}`
**Scope**: `{{SECURITY_SCOPE}}`
**Priority**: Security vulnerabilities, code injection, data exposure, authentication flaws

## Security Assessment Protocol

### 1. Threat Assessment

- **Attack Surface Analysis**: Identify potential entry points and vulnerabilities
- **Data Flow Security**: Trace sensitive data through the application
- **Authentication Review**: Validate auth mechanisms and session management
- **Authorization Audit**: Verify access controls and permission systems

### 2. Code Security Analysis

- **Input Validation**: Check for injection vulnerabilities (SQL, XSS, etc.)
- **Output Encoding**: Verify proper data sanitization and encoding
- **Crypto Implementation**: Review encryption, hashing, and key management
- **Error Handling**: Ensure no sensitive information leaks in errors

### 3. Infrastructure Security

- **Configuration Review**: Check security settings and hardening
- **Dependency Audit**: Identify vulnerable third-party packages
- **Network Security**: Validate TLS, CORS, and network policies
- **Environment Security**: Review secrets management and env vars

### 4. AI-Specific Security

- **Prompt Injection**: Protect against malicious prompt manipulation
- **Model Access Control**: Secure AI model endpoints and usage
- **Data Privacy**: Ensure AI processing complies with privacy requirements
- **Adversarial Input**: Handle malicious or crafted AI inputs safely

## Security Validation Checklist

### Authentication & Authorization

- 🏁 Strong password policies and multi-factor authentication
- 🏁 Secure session management and token handling
- 🏁 Proper access controls and role-based permissions
- 🏁 Protection against session hijacking and fixation

### Input Security

- 🏁 All user inputs validated and sanitized
- 🏁 SQL injection prevention (parameterized queries)
- 🏁 XSS protection (output encoding and CSP)
- 🏁 File upload security and type validation

### Data Protection

- 🏁 Encryption at rest and in transit
- 🏁 Secure key management and rotation
- 🏁 PII handling and privacy compliance
- 🏁 Secure data deletion and retention policies

### Infrastructure Security

- 🏁 Security headers properly configured
- 🏁 HTTPS enforcement and certificate validation
- 🏁 Regular dependency updates and vulnerability scanning
- 🏁 Secure configuration and hardening

## Security Report Format

Generate a comprehensive security report including:

1. **Executive Summary**: High-level security posture assessment
2. **Critical Vulnerabilities**: Immediate threats requiring urgent attention
3. **Security Recommendations**: Prioritized improvements and best practices
4. **Compliance Status**: Adherence to security standards and regulations
5. **Remediation Plan**: Step-by-step security improvement roadmap

## Quality Gates

- 🏁 No critical or high-severity vulnerabilities identified
- 🏁 All input validation and output encoding properly implemented
- 🏁 Authentication and authorization systems secure and tested
- 🏁 Dependencies scanned and updated to secure versions
- 🏁 Security best practices documented and followed

---

**Security is not optional - BUMBA ensures professional-grade protection! 🟢**

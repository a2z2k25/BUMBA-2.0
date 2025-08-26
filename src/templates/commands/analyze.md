---
allowed-tools: all
description: Comprehensive analysis combining code quality, security, and performance assessment
---

# 🏁 /bumba:analyze ARGUMENTS$

**Multi-Dimensional Analysis with Enterprise Security**

## Mission

Comprehensive analysis combining intelligent assessment with enterprise-grade security scanning, performance evaluation, and quality metrics for production readiness.

## Analysis Dimensions

### Intelligence Layer

- **Complexity Assessment**: Code complexity and maintainability analysis
- **Architecture Review**: Design patterns and architectural soundness
- **Performance Analysis**: Bottleneck identification and optimization opportunities
- **Integration Impact**: Dependency analysis and system integration effects

### Security Layer

```bash
# AI-Specific Security Analysis
SECURITY_THREATS=(
  "prompt_injection_vulnerabilities"
  "model_security_weaknesses"
  "data_privacy_violations"
  "adversarial_input_handling"
  "ai_bias_detection"
)

# Traditional Security Scanning
TRADITIONAL_SECURITY=(
  "sql_injection_patterns"
  "xss_vulnerabilities"
  "authentication_weaknesses"
  "authorization_bypasses"
  "data_exposure_risks"
)
```

### Quality Layer

- **Code Quality**: Via qlty integration with automatic fixing suggestions
- **Test Coverage**: Gap analysis and test generation recommendations
- **Technical Debt**: Identification and prioritization of debt items
- **Documentation**: Quality and completeness assessment

## Parallel Analysis Execution

```bash
# Spawn specialized analysis agents
Agent1: security_threat_analysis() {
  scan_ai_vulnerabilities "$ARGUMENTS$"
  scan_traditional_security "$ARGUMENTS$"
  generate_threat_model "$ARGUMENTS$"
  assess_compliance_requirements "$ARGUMENTS$"
}

Agent2: quality_assessment() {
  assess_code_quality "$ARGUMENTS$"
  analyze_test_coverage "$ARGUMENTS$"
  identify_technical_debt "$ARGUMENTS$"
  evaluate_documentation_quality "$ARGUMENTS$"
}

Agent3: performance_analysis() {
  identify_bottlenecks "$ARGUMENTS$"
  analyze_resource_usage "$ARGUMENTS$"
  recommend_optimizations "$ARGUMENTS$"
  assess_scalability_concerns "$ARGUMENTS$"
}

Agent4: architecture_review() {
  evaluate_design_patterns "$ARGUMENTS$"
  assess_modularity_coupling "$ARGUMENTS$"
  analyze_dependency_management "$ARGUMENTS$"
  review_deployment_readiness "$ARGUMENTS$"
}
```

## Comprehensive Reporting

- **Executive Summary**: High-level findings and recommendations
- **Security Assessment**: Vulnerability report with remediation steps
- **Quality Metrics**: Code quality scores and improvement suggestions
- **Performance Profile**: Bottleneck analysis and optimization roadmap
- **Architecture Review**: Design pattern evaluation and refactoring recommendations

## Examples

```bash
/bumba:analyze security vulnerabilities in authentication system
/bumba:analyze performance bottlenecks in API endpoints
/bumba:analyze code quality across entire React application
/bumba:analyze architecture patterns in microservices deployment
/bumba:analyze technical debt in legacy codebase
```

**Success Criteria**: Comprehensive analysis report with actionable recommendations, security clearance, performance optimization roadmap, and quality improvement plan.

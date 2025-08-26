# BUMBA Framework Technical Reference

## Table of Contents
- [Quick Reference](#quick-reference)
- [Complete Command Specifications](#complete-command-specifications)
- [MCP Server Integration Guide](#mcp-server-integration-guide)
- [Hook System Development](#hook-system-development)
- [Configuration API Reference](#configuration-api-reference)
- [Agent Coordination Protocols](#agent-coordination-protocols)
- [Quality Assurance Specifications](#quality-assurance-specifications)
- [Security Implementation Guide](#security-implementation-guide)
- [Troubleshooting & Diagnostics](#troubleshooting--diagnostics)
- [Advanced Usage Patterns](#advanced-usage-patterns)

---

## Quick Reference

### Essential Commands
```bash
# System Commands
/bumba:menu                    # Complete command discovery
/bumba:status                  # System health check
/bumba:help [command]          # Contextual help
/bumba:settings               # Configuration management

# Agent Implementation Commands
/bumba:implement [feature]             # Smart auto-routing
/bumba:implement-strategy [feature]    # Product-Strategist
/bumba:implement-design [feature]      # Design-Engineer
/bumba:implement-technical [feature]   # Backend-Engineer
/bumba:implement-agents [feature]      # All agents collaborate

# Multi-Agent Coordination
/bumba:team [action]          # Team management
/bumba:chain [commands]       # Workflow automation
/bumba:collaborate [action]   # Cross-agent coordination
```

### Installation Commands
```bash
# Quick Install
npx bumba-claude@latest

# Global Install
npm install -g bumba-claude
bumba-claude

# Development Install
git clone https://github.com/a2z2k25/bumba-claude.git
cd bumba-claude && npm install && npm run setup
```

---

## Complete Command Specifications

### Product-Strategist Commands

#### `/bumba:prd [action]`
**Purpose**: Create comprehensive Product Requirements Documents

**Parameters**:
- `action`: create, update, validate, export, template
- `[project_name]`: Optional project identifier

**Examples**:
```bash
/bumba:prd create mobile-app
/bumba:prd update user-authentication
/bumba:prd validate current-sprint
/bumba:prd export pdf quarterly-review
```

**Output**: Structured PRD with sections for objectives, user stories, acceptance criteria, technical requirements, and success metrics.

#### `/bumba:requirements [scope]`
**Purpose**: Discover and analyze requirements with stakeholder coordination

**Parameters**:
- `scope`: Feature area or user journey to analyze
- `--stakeholders`: Include stakeholder analysis
- `--priority`: Add prioritization matrix

**Examples**:
```bash
/bumba:requirements user-onboarding
/bumba:requirements --stakeholders payment-system
/bumba:requirements --priority dashboard-features
```

**Output**: Detailed requirements analysis with user stories, acceptance criteria, and business impact assessment.

#### `/bumba:roadmap [timeline]`
**Purpose**: Strategic planning and roadmapping with business alignment

**Parameters**:
- `timeline`: Planning horizon (Q1-2024, 6-months, yearly)
- `--format`: Output format (timeline, kanban, gantt)
- `--dependencies`: Include dependency analysis

**Examples**:
```bash
/bumba:roadmap Q1-2024
/bumba:roadmap --format gantt annual-planning
/bumba:roadmap --dependencies platform-migration
```

**Output**: Strategic roadmap with milestones, dependencies, resource allocation, and success metrics.

### Design-Engineer Commands

#### `/bumba:figma [action]`
**Purpose**: Figma Dev Mode integration for design-to-code workflows

**Parameters**:
- `action`: extract, sync, component, tokens, inspect
- `[selection]`: Specific Figma component or frame
- `--format`: Output format (react, vue, html, css)

**Examples**:
```bash
/bumba:figma extract button-component
/bumba:figma sync design-tokens
/bumba:figma component --format react navigation-menu
/bumba:figma inspect design-system
```

**Output**: Generated code components, design tokens, or design specifications extracted from Figma.

#### `/bumba:ui [component]`
**Purpose**: Intelligent UI component generation with accessibility compliance

**Parameters**:
- `component`: Component type or description
- `--framework`: Target framework (react, vue, svelte, html)
- `--accessibility`: WCAG compliance level (A, AA, AAA)
- `--responsive`: Include responsive breakpoints

**Examples**:
```bash
/bumba:ui dashboard-layout --framework react
/bumba:ui data-table --accessibility AA --responsive
/bumba:ui modal-dialog --framework vue
```

**Output**: Complete component implementation with styling, accessibility features, and responsive design.

#### `/bumba:design [workflow]`
**Purpose**: Design workflow automation and design system management

**Parameters**:
- `workflow`: design-system, component-library, style-guide, prototype
- `--tokens`: Include design token extraction
- `--documentation`: Generate design documentation

**Examples**:
```bash
/bumba:design component-library --tokens --documentation
/bumba:design style-guide brand-guidelines
/bumba:design prototype user-flow
```

**Output**: Design system artifacts, component libraries, or interactive prototypes.

### Backend-Engineer Commands

#### `/bumba:api [endpoint]`
**Purpose**: API development automation with security and validation

**Parameters**:
- `endpoint`: API endpoint or service description
- `--spec`: API specification format (openapi, graphql, rest)
- `--auth`: Authentication method (jwt, oauth, api-key)
- `--validation`: Input validation strategy

**Examples**:
```bash
/bumba:api user-authentication --spec openapi --auth jwt
/bumba:api payment-processing --validation strict
/bumba:api graphql user-management --auth oauth
```

**Output**: Complete API implementation with routing, validation, authentication, and documentation.

#### `/bumba:secure [scope]`
**Purpose**: Security validation and hardening with threat assessment

**Parameters**:
- `scope`: Security domain (auth, data, api, infrastructure)
- `--level`: Security level (basic, enterprise, critical)
- `--compliance`: Compliance framework (SOC2, GDPR, PCI)

**Examples**:
```bash
/bumba:secure authentication --level enterprise
/bumba:secure api-endpoints --compliance GDPR
/bumba:secure infrastructure --level critical
```

**Output**: Security implementation with threat modeling, validation, and compliance documentation.

#### `/bumba:scan [target]`
**Purpose**: Advanced security scanning with Semgrep integration

**Parameters**:
- `target`: Code path, dependencies, or entire project
- `--rules`: Rule categories (security, performance, bugs)
- `--format`: Output format (json, sarif, text, gitlab)
- `--severity`: Minimum severity level (info, warning, error, critical)

**Examples**:
```bash
/bumba:scan src/api --rules security --severity error
/bumba:scan package.json --rules security,performance
/bumba:scan . --format sarif --severity warning
```

**Output**: Detailed security analysis with vulnerability descriptions, severity levels, and remediation guidance.

### Multi-Agent Collaboration Commands

#### `/bumba:implement-agents [feature]`
**Purpose**: Full team collaboration with all three agents working together

**Parameters**:
- `feature`: Complex feature requiring multi-domain expertise
- `--coordination`: Coordination style (sequential, parallel, hybrid)
- `--handoffs`: Handoff validation level (basic, comprehensive)

**Examples**:
```bash
/bumba:implement-agents e-commerce-platform --coordination hybrid
/bumba:implement-agents user-dashboard --handoffs comprehensive
/bumba:implement-agents mobile-app --coordination parallel
```

**Output**: Coordinated implementation across all domains with proper handoffs and validation.

#### `/bumba:chain [commands]`
**Purpose**: Command chaining and workflow automation

**Parameters**:
- `commands`: Comma-separated command sequence
- `--parallel`: Commands that can run in parallel
- `--validation`: Validation points between commands

**Examples**:
```bash
/bumba:chain requirements,design,implement,test,deploy
/bumba:chain analyze,secure,validate --parallel analyze,secure
/bumba:chain figma-extract,ui-generate,test --validation each
```

**Output**: Automated workflow execution with progress tracking and validation checkpoints.

#### `/bumba:team [action]`
**Purpose**: Team coordination and management across all agents

**Parameters**:
- `action`: status, sync, handoff, restart, configure
- `--context`: Context preservation level
- `--memory`: Memory synchronization strategy

**Examples**:
```bash
/bumba:team status --context full
/bumba:team sync project-state
/bumba:team handoff design-to-backend --memory comprehensive
/bumba:team restart clean-slate
```

**Output**: Team coordination status, handoff summaries, or configuration changes.

---

## MCP Server Integration Guide

### Essential Intelligence Servers

#### Ref MCP Server Setup
```bash
# Installation
claude mcp add ref --server npx:ref-tools-mcp

# Environment Configuration
export REF_API_KEY="your_ref_tools_api_key"

# Usage
/bumba:docs react-hooks-patterns
/bumba:docs --deep postgres-optimization
/bumba:docs --context current-project typescript-best-practices
```

**Benefits**:
- 60-95% fewer tokens than Context7
- 1000+ repositories and documentation sites
- Session context awareness
- Direct links to specific sections

#### Semgrep MCP Server Setup
```bash
# Installation
claude mcp add semgrep --server uvx:semgrep-mcp

# Environment Configuration (Optional)
export SEMGREP_APP_TOKEN="your_semgrep_token"

# Usage
/bumba:scan src/ --rules security
/bumba:scan --language javascript --severity high
/bumba:scan package.json --rules dependency-check
```

**Benefits**:
- 5,000+ static analysis rules
- Multi-language vulnerability detection
- Custom rule creation
- Enterprise security scanning

#### Pieces MCP Server Setup
```bash
# Installation
claude mcp add pieces --server npx:pieces-mcp

# Environment Configuration (Optional)
export PIECES_API_KEY="your_pieces_api_key"

# Usage
/bumba:snippets react-hooks
/bumba:snippets --save authentication-pattern
/bumba:snippets --search "api error handling"
```

**Benefits**:
- Context-aware code organization
- Semantic search across snippets
- Live code suggestions
- Pattern recognition and reuse

### Product Strategy Servers

#### Notion MCP Integration
```bash
# Installation
claude mcp add notion --server npx:@modelcontextprotocol/server-notion

# Configuration
export NOTION_API_KEY="your_notion_integration_token"
export NOTION_DATABASE_ID="your_database_id"

# Usage with Product-Strategist
/bumba:prd create --notion-sync project-alpha
/bumba:requirements --notion-export user-stories
```

#### Airtable MCP Integration
```bash
# Installation
claude mcp add airtable --server npx:@modelcontextprotocol/server-airtable

# Configuration
export AIRTABLE_API_KEY="your_airtable_api_key"
export AIRTABLE_BASE_ID="your_base_id"

# Usage with Product-Strategist
/bumba:roadmap --airtable-sync Q1-planning
/bumba:analyze-business --airtable-data user-feedback
```

### Design & Development Servers

#### Figma Dev Mode MCP
```bash
# Installation (Requires Figma Desktop App)
claude mcp add figma-devmode --server transport=stdio,command=figma-devmode-mcp

# Configuration
export FIGMA_API_KEY="your_figma_api_key"

# Usage with Design-Engineer
/bumba:figma extract selected-components
/bumba:figma sync design-tokens
/bumba:figma inspect accessibility-annotations
```

#### Magic UI MCP Integration
```bash
# Installation
claude mcp add magic-ui --server npx:@21st-dev/magic@latest

# Usage with Design-Engineer
/bumba:ui modern-dashboard --magic-ui
/bumba:ui responsive-form --framework react
```

### Development & Testing Servers

#### GitHub MCP Integration
```bash
# Installation
claude mcp add github --server npx:@modelcontextprotocol/server-github

# Configuration
export GITHUB_TOKEN="your_github_personal_access_token"

# Usage across all agents
/bumba:publish create-repository project-name
/bumba:commit --github-pr feature-branch
/bumba:analyze --github-issues security-review
```

#### Playwright MCP Integration
```bash
# Installation
claude mcp add playwright --server npx:@modelcontextprotocol/server-playwright

# Usage with Backend-Engineer
/bumba:test ui-e2e --playwright
/bumba:validate accessibility --browser-automation
```

### Server Status and Management

#### Health Monitoring
```bash
# Check all MCP servers
/bumba:status mcp-servers

# Test specific server
/bumba:docs --test-connection
/bumba:scan --health-check
/bumba:snippets --ping

# Server performance metrics
/bumba:status --verbose mcp-performance
```

#### Configuration Management
```bash
# List configured servers
/bumba:settings list-mcp-servers

# Add custom server
/bumba:settings add-mcp-server custom-server npx:custom-package

# Update server configuration
/bumba:settings configure-mcp semgrep --rules security,performance

# Remove server
/bumba:settings remove-mcp-server unused-server
```

---

## Hook System Development

### Hook Architecture

#### Hook Types and Triggers
```yaml
Start_Hooks:
  trigger: "Claude Code session initialization"
  purpose: "Environment setup and context synchronization"
  examples: ["context-bridge.sh", "mcp-optimization-engine.sh"]

PreToolUse_Hooks:
  trigger: "Before every command execution"
  purpose: "Security validation and command optimization"
  examples: ["bumba-pre-execution.sh", "intelligent-command-router.sh"]

PostToolUse_Hooks:
  trigger: "After command completion"
  purpose: "Quality validation and learning"
  examples: ["bumba-post-execution.sh", "workflow-learning-engine.sh"]

Stop_Hooks:
  trigger: "Session end or major milestone completion"
  purpose: "Context preservation and celebration"
  examples: ["bumba-completion.sh", "project-context-synthesis.sh"]
```

#### Hook Development Guidelines
```bash
# Hook file naming convention
~/.claude/hooks/[category]-[purpose].sh

# Examples:
~/.claude/hooks/custom-security-validation.sh
~/.claude/hooks/custom-performance-monitoring.sh
~/.claude/hooks/custom-team-notification.sh
```

### Custom Hook Development

#### Security Validation Hook Template
```bash
#!/bin/bash
# Custom Security Validation Hook
# Triggers: Before Write|Edit|MultiEdit commands

set -euo pipefail

HOOK_NAME="custom-security-validation"
LOG_FILE="$HOME/.claude/logs/${HOOK_NAME}.log"

# Validation functions
validate_input_sanitization() {
    local content="$1"
    # Add custom validation logic
    echo "🏁 Input sanitization validated" >> "$LOG_FILE"
}

validate_output_security() {
    local content="$1"
    # Add custom validation logic
    echo "🏁 Output security validated" >> "$LOG_FILE"
}

# Main execution
main() {
    echo "🏁 Running custom security validation..." >&2
    
    # Get command context if available
    local command_context="${BUMBA_COMMAND_CONTEXT:-}"
    
    # Perform validations
    validate_input_sanitization "$command_context"
    validate_output_security "$command_context"
    
    echo "🏁 Custom security validation completed" >&2
    exit 0
}

main "$@"
```

#### Performance Monitoring Hook Template
```bash
#!/bin/bash
# Custom Performance Monitoring Hook
# Triggers: After Write|Edit|MultiEdit commands

set -euo pipefail

HOOK_NAME="custom-performance-monitoring"
METRICS_FILE="$HOME/.claude/metrics/${HOOK_NAME}.json"

# Performance monitoring functions
measure_execution_time() {
    local start_time="$1"
    local end_time="$(date +%s%N)"
    local duration=$(( (end_time - start_time) / 1000000 )) # Convert to milliseconds
    echo "$duration"
}

log_performance_metrics() {
    local duration="$1"
    local command="$2"
    
    # Create metrics entry
    local metrics_entry=$(cat <<EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "command": "$command",
  "duration_ms": $duration,
  "hook": "$HOOK_NAME"
}
EOF
)
    
    # Append to metrics file
    echo "$metrics_entry" >> "$METRICS_FILE"
}

# Main execution
main() {
    local start_time="${BUMBA_START_TIME:-$(date +%s%N)}"
    local command="${BUMBA_COMMAND:-unknown}"
    
    # Measure execution time
    local duration=$(measure_execution_time "$start_time")
    
    # Log metrics
    log_performance_metrics "$duration" "$command"
    
    echo "🏁 Performance metrics logged: ${duration}ms" >&2
    exit 0
}

main "$@"
```

### Hook Registration and Configuration

#### Settings.json Hook Configuration
```json
{
  "hooks": {
    "Start": [
      "context-bridge.sh sync",
      "mcp-optimization-engine.sh analyze",
      "custom-environment-setup.sh"
    ],
    "PreToolUse": [
      {
        "matcher": "Write|Edit|MultiEdit",
        "hooks": [
          "bumba-pre-execution.sh",
          "custom-security-validation.sh"
        ]
      },
      {
        "matcher": ".*",
        "hooks": [
          "intelligent-command-router.sh",
          "custom-performance-start.sh"
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write|Edit|MultiEdit",
        "hooks": [
          "bumba-post-execution.sh",
          "custom-quality-validation.sh",
          "custom-performance-monitoring.sh"
        ]
      },
      {
        "matcher": "figma.*|design.*",
        "hooks": [
          "design-workflow-analyzer.sh",
          "custom-design-metrics.sh"
        ]
      }
    ],
    "Stop": [
      "bumba-completion.sh",
      "project-context-synthesis.sh",
      "custom-session-summary.sh"
    ]
  }
}
```

#### Dynamic Hook Registration
```bash
# Add custom hook
/bumba:settings add-hook PreToolUse custom-validation.sh --matcher "implement.*"

# Remove hook
/bumba:settings remove-hook PostToolUse custom-old-hook.sh

# List active hooks
/bumba:settings list-hooks

# Test hook configuration
/bumba:settings test-hooks --dry-run
```

---

## Configuration API Reference

### Settings.json Complete Structure

```json
{
  "framework": "bumba",
  "version": "1.0.0",
  "permissions": {
    "allow": [
      "Bash", "Read", "Edit", "Write", "MultiEdit", 
      "WebFetch", "WebSearch", "Grep", "Glob", "LS", 
      "TodoRead", "TodoWrite", "Task"
    ]
  },
  "model": "sonnet",
  "orchestration": {
    "wave_enabled": true,
    "complexity_threshold": 0.7,
    "parallel_agents": 4,
    "quality_gates": true,
    "designer_mode": true,
    "cognitive_safeguards": true,
    "intelligent_routing": true,
    "context_preservation": "comprehensive",
    "handoff_validation": "strict"
  },
  "agents": {
    "product_strategist": {
      "enabled": true,
      "tools": ["notion", "airtable", "google_calendar", "sequential_thinking", "memory"],
      "specialization": ["strategy", "requirements", "business_analysis"],
      "quality_gates": ["business_logic", "stakeholder_validation", "requirements_completeness"]
    },
    "design_engineer": {
      "enabled": true,
      "tools": ["figma", "magic_ui", "ref", "pieces", "memory"],
      "specialization": ["ux_ui", "frontend", "accessibility", "design_systems"],
      "quality_gates": ["accessibility_compliance", "design_consistency", "performance_impact"]
    },
    "backend_engineer": {
      "enabled": true,
      "tools": ["semgrep", "github", "postgres", "playwright", "memory"],
      "specialization": ["architecture", "security", "performance", "infrastructure"],
      "quality_gates": ["security_validation", "performance_benchmarks", "scalability_assessment"]
    }
  },
  "mcp_servers": {
    "priority": ["ref", "semgrep", "pieces", "memory", "sequential_thinking"],
    "fallback": ["fetch", "brave_search"],
    "optional": ["notion", "airtable", "figma", "github"],
    "configuration": {
      "ref": {
        "token_optimization": true,
        "session_context": true,
        "private_repos": false
      },
      "semgrep": {
        "rule_categories": ["security", "performance", "bugs"],
        "severity_threshold": "warning",
        "custom_rules": []
      },
      "pieces": {
        "auto_save": true,
        "suggestion_threshold": 0.8,
        "team_sharing": false
      }
    }
  },
  "quality_gates": {
    "enabled": true,
    "pre_execution": {
      "security_scan": true,
      "input_validation": true,
      "cognitive_verification": true,
      "agent_authorization": true
    },
    "post_execution": {
      "code_quality": true,
      "security_validation": true,
      "performance_assessment": true,
      "accessibility_check": true,
      "documentation_completeness": true
    },
    "thresholds": {
      "security_vulnerability_count": 0,
      "code_quality_score": 8.0,
      "test_coverage_minimum": 80,
      "performance_budget_compliance": 95,
      "accessibility_compliance": "WCAG_2_1_AA"
    }
  },
  "audio_system": {
    "enabled": true,
    "ceremony_file": "bumba-horn.mp3",
    "milestone_triggers": [
      "installation_complete",
      "perfect_quality_score",
      "figma_integration_success",
      "learning_breakthrough",
      "performance_milestone"
    ],
    "volume": 0.7,
    "fallback_enabled": true
  },
  "logging": {
    "level": "info",
    "file": "$HOME/.claude/logs/bumba.log",
    "max_size": "10MB",
    "retention_days": 30,
    "categories": {
      "commands": true,
      "hooks": true,
      "agents": true,
      "mcp_servers": true,
      "quality_gates": true
    }
  }
}
```

### Environment Variables

#### Required Environment Variables
```bash
# MCP Server API Keys
export REF_API_KEY="your_ref_tools_api_key"
export SEMGREP_APP_TOKEN="your_semgrep_token"
export FIGMA_API_KEY="your_figma_api_key"

# Optional Enhancement Keys
export PIECES_API_KEY="your_pieces_api_key"
export NOTION_API_KEY="your_notion_integration_token"
export AIRTABLE_API_KEY="your_airtable_api_key"
export EXA_API_KEY="your_exa_search_api_key"

# Framework Configuration
export BUMBA_AUDIO_ENABLED="true"
export BUMBA_QUALITY_GATES="strict"
export BUMBA_LOG_LEVEL="info"
export BUMBA_AGENT_COORDINATION="intelligent"
```

#### Environment Variable Validation
```bash
# Check required variables
/bumba:settings validate-environment

# Test MCP server connections
/bumba:settings test-mcp-connections

# Export current configuration
/bumba:settings export-config > bumba-config-backup.json

# Import configuration
/bumba:settings import-config bumba-config-backup.json
```

---

## Agent Coordination Protocols

### Handoff Management Specifications

#### Context Transfer Protocol
```yaml
Context_Transfer_Format:
  metadata:
    source_agent: "Product-Strategist|Design-Engineer|Backend-Engineer"
    target_agent: "Product-Strategist|Design-Engineer|Backend-Engineer" 
    handoff_type: "requirements_to_design|design_to_technical|technical_to_strategy"
    timestamp: "ISO 8601 timestamp"
    project_phase: "requirements|design|implementation|testing|deployment"
  
  project_context:
    project_name: "string"
    project_description: "string" 
    business_objectives: ["array of objectives"]
    technical_constraints: ["array of constraints"]
    success_metrics: ["array of KPIs"]
  
  agent_artifacts:
    source_deliverables: ["PRD", "wireframes", "API spec", "etc."]
    validation_status: "validated|needs_review|rejected"
    quality_checkpoints: ["array of completed validations"]
    
  handoff_content:
    primary_deliverable: "main artifact being handed off"
    supporting_materials: ["array of supporting documents"]
    open_questions: ["array of unresolved questions"]
    recommended_next_steps: ["array of suggested actions"]
    
  validation_requirements:
    business_alignment: "confirmed|pending|needs_clarification"
    technical_feasibility: "confirmed|pending|needs_assessment"  
    design_consistency: "confirmed|pending|needs_review"
    security_compliance: "confirmed|pending|needs_validation"
```

#### Decision Consensus Protocol
```yaml
Decision_Types:
  architectural: "System architecture and technology choices"
  design: "User experience and interface design decisions"
  business: "Feature prioritization and business logic"
  security: "Security implementation and compliance decisions"
  
Consensus_Process:
  proposal:
    originating_agent: "Agent proposing the decision"
    decision_category: "architectural|design|business|security"
    proposed_solution: "Detailed description of proposed approach"
    alternatives_considered: ["array of alternative approaches"]
    impact_assessment: "Assessment of impact on other domains"
    
  review:
    reviewing_agents: ["array of agents reviewing the proposal"]
    feedback: ["array of feedback items from each agent"]
    concerns: ["array of concerns or objections"]
    suggestions: ["array of improvement suggestions"]
    
  resolution:
    consensus_reached: "true|false"
    final_decision: "Final agreed approach"
    implementation_plan: "Steps for implementing the decision"
    monitoring_criteria: "How success will be measured"
    
  documentation:
    decision_record: "Complete record of decision process"
    rationale: "Why this decision was made"
    trade_offs: "What was gained and what was sacrificed"
    review_date: "When this decision should be reassessed"
```

### Memory Synchronization

#### Shared Context Management
```yaml
Shared_Context_Structure:
  project_state:
    current_phase: "requirements|design|implementation|testing|deployment"
    completion_percentage: "0-100"
    active_features: ["array of features in development"]
    blocked_items: ["array of blocked work items"]
    
  technical_decisions:
    architecture_decisions: ["array of architectural choices"]
    technology_stack: ["array of chosen technologies"]
    design_patterns: ["array of established patterns"]
    security_requirements: ["array of security constraints"]
    
  business_context:
    stakeholder_feedback: ["array of stakeholder inputs"]
    user_requirements: ["array of user needs"]
    business_constraints: ["array of business limitations"]
    success_metrics: ["array of measurement criteria"]
    
  quality_status:
    test_coverage: "percentage"
    security_scan_results: ["array of security findings"]
    performance_benchmarks: ["array of performance metrics"]
    accessibility_compliance: "compliance level"
```

#### Agent-Specific Context
```yaml
Product_Strategist_Context:
  business_intelligence:
    market_research: ["array of market insights"]
    competitive_analysis: ["array of competitor information"]
    user_feedback: ["array of user input"]
    stakeholder_requirements: ["array of stakeholder needs"]
    
  requirements_tracking:
    user_stories: ["array of user stories with status"]
    acceptance_criteria: ["array of acceptance criteria"]
    business_rules: ["array of business logic rules"]
    priority_matrix: ["array of prioritized features"]

Design_Engineer_Context:
  design_system:
    component_library: ["array of available components"]
    design_tokens: ["array of design system tokens"]
    accessibility_patterns: ["array of accessibility guidelines"]
    responsive_breakpoints: ["array of breakpoint definitions"]
    
  user_experience:
    user_journeys: ["array of mapped user flows"]
    wireframes: ["array of wireframe references"]
    prototypes: ["array of prototype links"]
    usability_testing: ["array of testing results"]

Backend_Engineer_Context:
  system_architecture:
    api_specifications: ["array of API definitions"]
    database_schemas: ["array of data models"]
    service_architecture: ["array of service definitions"]
    infrastructure_requirements: ["array of infrastructure needs"]
    
  security_implementation:
    threat_models: ["array of identified threats"]
    security_controls: ["array of implemented controls"]
    compliance_requirements: ["array of compliance needs"]
    vulnerability_assessments: ["array of security findings"]
```

---

## Quality Assurance Specifications

### Distributed QA Framework

#### Quality Gate Definitions
```yaml
Pre_Execution_Gates:
  security_validation:
    input_sanitization: "Validate all user inputs against injection attacks"
    prompt_injection_detection: "Scan for adversarial prompt patterns"
    output_validation: "Ensure outputs don't contain sensitive information"
    authorization_check: "Verify command authorization and permissions"
    
  cognitive_safeguards:
    hallucination_prevention: "Cross-reference claims with reliable sources"
    context_consistency: "Check against previous decisions and memory"
    verification_requirement: "Always verify before claiming completion"
    evidence_validation: "Ensure recommendations are documentation-backed"
    
  command_optimization:
    complexity_assessment: "Evaluate command complexity and routing needs"
    resource_availability: "Check agent availability and workload"
    context_continuity: "Assess context preservation requirements"
    performance_optimization: "Route for optimal execution speed and quality"

Post_Execution_Gates:
  code_quality:
    syntax_validation: "Ensure code compiles and follows syntax rules"
    style_compliance: "Verify adherence to coding standards and style guides"
    complexity_analysis: "Assess code complexity and maintainability"
    documentation_completeness: "Verify adequate code documentation"
    
  security_scanning:
    vulnerability_detection: "Scan for known security vulnerabilities"
    dependency_analysis: "Check dependencies for security issues"
    secret_detection: "Ensure no secrets or keys are exposed"
    permission_validation: "Verify appropriate permission usage"
    
  performance_assessment:
    execution_time: "Measure and validate execution performance"
    memory_usage: "Assess memory consumption patterns"
    resource_efficiency: "Validate efficient resource utilization"
    scalability_impact: "Assess impact on system scalability"
    
  accessibility_validation:
    wcag_compliance: "Verify WCAG 2.1 AA compliance for UI components"
    keyboard_navigation: "Ensure full keyboard accessibility"
    screen_reader_compatibility: "Validate screen reader support"
    color_contrast: "Verify adequate color contrast ratios"
```

#### Agent-Specific Quality Responsibilities

**Product-Strategist Quality Framework**:
```yaml
Business_Logic_Validation:
  requirements_completeness:
    user_story_coverage: "All user needs addressed in user stories"
    acceptance_criteria_clarity: "Clear, testable acceptance criteria"
    edge_case_identification: "Edge cases and error scenarios documented"
    business_rule_consistency: "Business rules consistently applied"
    
  stakeholder_alignment:
    approval_documentation: "Stakeholder sign-offs documented"
    feedback_integration: "Stakeholder feedback incorporated"
    communication_clarity: "Clear communication with all stakeholders"
    expectation_management: "Realistic expectations set and managed"
    
  market_validation:
    competitive_analysis_accuracy: "Accurate competitive landscape assessment"
    user_research_validation: "User research findings validated"
    market_opportunity_assessment: "Market opportunity realistically assessed"
    feature_prioritization_rationale: "Clear rationale for feature priorities"

Quality_Metrics:
  requirements_traceability: "100% of features traced to business requirements"
  stakeholder_satisfaction: ">= 90% stakeholder approval rating"
  business_value_realization: "Measurable business value delivered"
  time_to_market: "Requirements delivery within planned timeline"
```

**Design-Engineer Quality Framework**:
```yaml
User_Experience_Validation:
  accessibility_compliance:
    wcag_2_1_aa: "WCAG 2.1 AA compliance verified"
    keyboard_navigation: "Full keyboard accessibility implemented"
    screen_reader_support: "Screen reader compatibility validated"
    color_contrast: "4.5:1 contrast ratio for normal text, 3:1 for large text"
    
  responsive_design:
    breakpoint_coverage: "Mobile, tablet, desktop breakpoints covered"
    touch_interface_optimization: "Touch interfaces optimized for mobile"
    performance_budgets: "Performance budgets maintained across devices"
    cross_browser_compatibility: "Compatibility verified across major browsers"
    
  design_system_consistency:
    component_reusability: "Maximum component reuse achieved"
    design_token_adherence: "Design tokens consistently applied"
    visual_hierarchy: "Clear visual hierarchy maintained"
    brand_guideline_compliance: "Brand guidelines consistently followed"

Quality_Metrics:
  accessibility_score: "100% WCAG 2.1 AA compliance"
  performance_budget: "< 3s load time, < 100ms interaction response"
  design_consistency: ">= 95% design system component usage"
  user_satisfaction: ">= 4.5/5 user experience rating"
```

**Backend-Engineer Quality Framework**:
```yaml
Technical_Architecture_Validation:
  security_assessment:
    vulnerability_scanning: "0 critical, 0 high severity vulnerabilities"
    authentication_security: "Secure authentication implementation verified"
    authorization_controls: "Proper authorization controls implemented"
    data_encryption: "Data encryption at rest and in transit verified"
    
  performance_validation:
    response_time_targets: "API response times < 200ms average"
    throughput_requirements: "Required throughput capacity validated"
    scalability_testing: "Scalability under load validated"
    resource_optimization: "Optimal resource utilization achieved"
    
  reliability_assurance:
    error_handling: "Comprehensive error handling implemented"
    fault_tolerance: "System fault tolerance validated"
    monitoring_coverage: "Comprehensive monitoring and alerting"
    backup_recovery: "Backup and recovery procedures validated"

Quality_Metrics:
  security_compliance: "100% security requirements met"
  performance_sla: ">= 99.9% uptime, < 200ms average response time"
  code_coverage: ">= 90% test coverage for critical paths"
  deployment_success: ">= 99% successful deployment rate"
```

---

## Security Implementation Guide

### Security Framework Architecture

#### Multi-Layer Security Model
```yaml
Application_Security:
  input_validation:
    sanitization: "All user inputs sanitized against injection attacks"
    validation_rules: "Strict validation rules for all input types"
    encoding: "Proper encoding for output in different contexts"
    rate_limiting: "Rate limiting to prevent abuse and DoS attacks"
    
  authentication_security:
    multi_factor: "Multi-factor authentication for sensitive operations"
    session_management: "Secure session management with proper timeouts"
    password_policies: "Strong password policies enforced"
    account_lockout: "Account lockout after failed attempts"
    
  authorization_controls:
    principle_of_least_privilege: "Minimum necessary permissions granted"
    role_based_access: "Role-based access control implemented"
    resource_authorization: "Authorization checked for each resource access"
    privilege_escalation_prevention: "Privilege escalation attacks prevented"

Infrastructure_Security:
  network_security:
    encryption_in_transit: "All data encrypted in transit using TLS 1.3+"
    network_segmentation: "Proper network segmentation implemented"
    firewall_configuration: "Restrictive firewall rules configured"
    intrusion_detection: "Intrusion detection and prevention systems"
    
  data_security:
    encryption_at_rest: "All sensitive data encrypted at rest"
    key_management: "Secure key management and rotation"
    data_classification: "Data classified by sensitivity level"
    data_retention: "Appropriate data retention policies"
    
  monitoring_security:
    security_logging: "Comprehensive security event logging"
    anomaly_detection: "Automated anomaly detection systems"
    incident_response: "Incident response procedures documented"
    forensic_capabilities: "Digital forensic capabilities maintained"
```

#### Threat Modeling Process

**STRIDE Analysis Framework**:
```yaml
Spoofing:
  threat_description: "Impersonation of legitimate users or systems"
  mitigation_strategies:
    - "Strong authentication mechanisms"
    - "Digital certificates for system identity"
    - "Multi-factor authentication for sensitive operations"
  validation_methods:
    - "Authentication bypass testing"
    - "Identity verification testing"
    - "Certificate validation testing"

Tampering:
  threat_description: "Unauthorized modification of data or code"
  mitigation_strategies:
    - "Input validation and sanitization"
    - "Code signing and integrity verification"
    - "Database transaction controls"
  validation_methods:
    - "Data integrity testing"
    - "Code tampering detection"
    - "Transaction rollback testing"

Repudiation:
  threat_description: "Denial of actions or transactions"
  mitigation_strategies:
    - "Comprehensive audit logging"
    - "Digital signatures for critical actions"
    - "Non-repudiation mechanisms"
  validation_methods:
    - "Audit trail completeness testing"
    - "Log integrity verification"
    - "Digital signature validation"

Information_Disclosure:
  threat_description: "Unauthorized access to sensitive information"
  mitigation_strategies:
    - "Data encryption at rest and in transit"
    - "Access control and authorization"
    - "Information leakage prevention"
  validation_methods:
    - "Data exposure testing"
    - "Encryption verification"
    - "Access control testing"

Denial_of_Service:
  threat_description: "Making system unavailable to legitimate users"
  mitigation_strategies:
    - "Rate limiting and throttling"
    - "Resource management and monitoring"
    - "DDoS protection mechanisms"
  validation_methods:
    - "Load testing and stress testing"
    - "Resource exhaustion testing"
    - "Recovery time testing"

Elevation_of_Privilege:
  threat_description: "Gaining unauthorized elevated access"
  mitigation_strategies:
    - "Principle of least privilege"
    - "Privilege separation and sandboxing"
    - "Regular privilege reviews"
  validation_methods:
    - "Privilege escalation testing"
    - "Permission boundary testing"
    - "Access control verification"
```

### Security Scanning Integration

#### Semgrep Rule Configuration
```yaml
Security_Rule_Categories:
  authentication:
    rules:
      - "weak-password-validation"
      - "insecure-authentication-flow"
      - "missing-authentication-check"
      - "session-fixation-vulnerability"
    severity: "high"
    
  authorization:
    rules:
      - "missing-authorization-check"
      - "privilege-escalation-risk"
      - "insecure-direct-object-reference"
      - "role-based-access-violation"
    severity: "high"
    
  input_validation:
    rules:
      - "sql-injection-vulnerability"
      - "cross-site-scripting-xss"
      - "command-injection"
      - "path-traversal-vulnerability"
    severity: "critical"
    
  cryptography:
    rules:
      - "weak-cryptographic-algorithm"
      - "hardcoded-encryption-key"
      - "insecure-random-generation"
      - "improper-certificate-validation"
    severity: "high"
    
  data_protection:
    rules:
      - "sensitive-data-exposure"
      - "insecure-data-storage"
      - "unencrypted-sensitive-data"
      - "data-leakage-prevention"
    severity: "medium"
```

#### Custom Security Rules
```yaml
Custom_Rules:
  bumba_specific_security:
    agent_authorization:
      pattern: "implement.*|secure.*|analyze.*"
      rule: "Agent authorization required for sensitive commands"
      severity: "medium"
      
    context_sanitization:
      pattern: "user_input.*|external_data.*"
      rule: "All external data must be sanitized before processing"
      severity: "high"
      
    mcp_server_validation:
      pattern: "mcp.*|server.*connection"
      rule: "MCP server connections must be validated and encrypted"
      severity: "medium"
      
    hook_security:
      pattern: "hook.*|pre_execution.*|post_execution.*"
      rule: "Hook scripts must follow security best practices"
      severity: "medium"
```

---

## Troubleshooting & Diagnostics

### Diagnostic Commands

#### System Health Diagnostics
```bash
# Comprehensive system status
/bumba:status --verbose --all-components

# MCP server health check
/bumba:status mcp-servers --connection-test --performance-metrics

# Agent coordination status
/bumba:team status --context-sync --memory-validation

# Hook system validation
/bumba:settings validate-hooks --execution-test --security-scan

# Quality gate status
/bumba:status quality-gates --threshold-validation --rule-verification
```

#### Performance Diagnostics
```bash
# Command execution performance
/bumba:status performance --command-timing --resource-usage

# MCP server performance analysis
/bumba:status mcp-performance --latency --throughput --error-rate

# Memory and context usage
/bumba:status memory --context-size --agent-memory --shared-context

# Audio system diagnostics
/bumba:status audio --player-availability --file-integrity --ceremony-triggers
```

#### Security Diagnostics
```bash
# Security configuration validation
/bumba:status security --policy-validation --rule-compliance

# Vulnerability assessment
/bumba:scan --comprehensive --all-rules --export-report

# Authentication and authorization check
/bumba:status auth --permissions --access-controls --token-validation

# Hook security validation
/bumba:status hooks --security-scan --permission-check --script-validation
```

### Common Issue Resolution

#### Agent Coordination Issues

**Symptom**: Agents not collaborating properly
**Diagnosis Steps**:
```bash
# Check agent status and availability
/bumba:team status --verbose

# Verify memory synchronization
/bumba:status memory --agent-sync --context-integrity

# Test handoff mechanisms
/bumba:team test-handoff --all-agents --validation-strict

# Check for context conflicts
/bumba:settings diagnose --context-conflicts --resolution-suggestions
```

**Resolution Strategies**:
```bash
# Clear and rebuild context
/bumba:settings reset-context --preserve-project-data

# Restart agent coordination
/bumba:team restart --clean-state --sync-memory

# Force memory synchronization
/bumba:team sync --full-context --all-agents

# Use explicit agent targeting as fallback
/bumba:implement-strategy [task]  # Force Product-Strategist
/bumba:implement-design [task]    # Force Design-Engineer  
/bumba:implement-technical [task] # Force Backend-Engineer
```

#### MCP Server Connection Issues

**Symptom**: MCP commands failing or timeout errors
**Diagnosis Steps**:
```bash
# Test individual server connections
/bumba:docs --test-connection
/bumba:scan --health-check  
/bumba:snippets --ping

# Check API key configuration
/bumba:settings validate-api-keys --test-authentication

# Verify server configuration
/bumba:settings list-mcp-servers --status --configuration
```

**Resolution Strategies**:
```bash
# Reconfigure API keys
/bumba:settings update-api-keys --interactive

# Restart MCP servers
/bumba:settings restart-mcp-servers --all

# Use fallback servers
/bumba:settings enable-fallback --mcp-servers

# Test server priority configuration
/bumba:settings test-mcp-priority --performance-benchmark
```

#### Quality Gate Failures

**Symptom**: Commands blocked by quality gates
**Diagnosis Steps**:
```bash
# Review quality gate results
/bumba:status quality-gates --failure-details --recommendations

# Check specific quality metrics
/bumba:status quality --metrics-breakdown --threshold-analysis

# Analyze security scan results
/bumba:scan --verbose --detailed-report --remediation-guidance
```

**Resolution Strategies**:
```bash
# Address specific quality issues
/bumba:improve code-quality --auto-fix --validate-changes

# Adjust quality thresholds temporarily
/bumba:settings quality-level moderate --temporary

# Use quality override for urgent fixes
/bumba:implement --skip-quality-gates --reason "urgent-hotfix"

# Implement security fixes
/bumba:secure [specific-vulnerability] --comprehensive-fix
```

### Log Analysis and Monitoring

#### Log File Locations
```bash
# Main framework log
$HOME/.claude/logs/bumba.log

# Hook execution logs
$HOME/.claude/logs/hooks/

# MCP server logs  
$HOME/.claude/logs/mcp-servers/

# Quality gate logs
$HOME/.claude/logs/quality-gates/

# Performance metrics
$HOME/.claude/metrics/
```

#### Log Analysis Commands
```bash
# Search for errors in logs
/bumba:status logs --search "ERROR" --last-24h

# Analyze performance trends
/bumba:status metrics --performance-trend --last-week

# Check hook execution history
/bumba:status hooks --execution-log --success-rate

# Review quality gate decisions
/bumba:status quality-gates --decision-log --failure-analysis
```

---

## Advanced Usage Patterns

### Complex Workflow Orchestration

#### Multi-Phase Development Workflow
```bash
# Phase 1: Strategic Planning and Requirements
/bumba:chain requirements-analysis,market-research,competitive-analysis
/bumba:prd create --comprehensive --stakeholder-input
/bumba:roadmap create --timeline Q1-2024 --dependencies-analysis

# Phase 2: Design and User Experience  
/bumba:chain design-research,user-journey-mapping,wireframe-creation
/bumba:figma extract --components --design-tokens
/bumba:design component-system --accessibility-first

# Phase 3: Technical Architecture and Implementation
/bumba:chain architecture-design,api-specification,security-assessment
/bumba:implement-technical --architecture-first --security-validated
/bumba:secure --comprehensive --compliance GDPR,SOC2

# Phase 4: Integration and Quality Assurance
/bumba:chain integration-testing,performance-testing,security-testing
/bumba:test --comprehensive --all-domains
/bumba:validate --security --performance --accessibility

# Phase 5: Deployment and Monitoring
/bumba:chain deployment-prep,infrastructure-setup,monitoring-config
/bumba:publish --production-ready --monitoring-enabled
```

#### Cross-Domain Feature Development
```bash
# E-commerce Platform Development
/bumba:implement-agents e-commerce-platform \
  --coordination hybrid \
  --handoffs comprehensive \
  --quality-gates strict

# Breakdown by domain:
# Product-Strategist: Business logic, payment flows, user journeys
# Design-Engineer: Shopping interface, checkout UX, responsive design  
# Backend-Engineer: Payment APIs, inventory management, security

# Mobile Application Development
/bumba:implement-agents mobile-banking-app \
  --coordination parallel \
  --platform ios,android \
  --security-focus critical

# Social Media Platform
/bumba:implement-agents social-platform \
  --coordination sequential \
  --scalability-focus high \
  --real-time-features enabled
```

### Advanced Agent Coordination

#### Parallel Development Coordination
```bash
# Coordinate parallel development streams
/bumba:team coordinate --parallel-streams frontend,backend,infrastructure

# Frontend stream (Design-Engineer lead)
/bumba:implement-design user-interface --responsive --accessible

# Backend stream (Backend-Engineer lead)  
/bumba:implement-technical api-services --scalable --secure

# Infrastructure stream (Backend-Engineer)
/bumba:implement-technical deployment-pipeline --automated --monitored

# Synchronization points
/bumba:team sync --milestone integration-ready
/bumba:validate --cross-domain --integration-testing
```

#### Context-Aware Agent Switching
```bash
# Business logic implementation -> Product-Strategist
/bumba:implement user-subscription-model
# Auto-routes to Product-Strategist for business logic

# UI component implementation -> Design-Engineer  
/bumba:implement responsive-dashboard-layout
# Auto-routes to Design-Engineer for UI work

# API security implementation -> Backend-Engineer
/bumba:implement secure-authentication-api
# Auto-routes to Backend-Engineer for security work

# Cross-domain feature -> All agents
/bumba:implement user-onboarding-flow
# Auto-coordinates all agents for complete feature
```

### Advanced MCP Server Utilization

#### Optimized Documentation Workflow
```bash
# Token-efficient documentation research
/bumba:docs --efficient react-performance-optimization
# Uses Ref MCP for 60-95% token reduction

# Comprehensive technical research  
/bumba:research-technical microservices-architecture \
  --sources academic,industry \
  --depth comprehensive
# Uses Exa MCP for AI-optimized semantic search

# Code pattern management
/bumba:snippets --pattern authentication-jwt \
  --save-project \
  --team-share
# Uses Pieces MCP for pattern recognition and reuse
```

#### Security-First Development Workflow
```bash
# Comprehensive security scanning
/bumba:scan --comprehensive \
  --rules security,performance,bugs \
  --severity-threshold warning \
  --export-sarif security-report.sarif

# Security-focused implementation
/bumba:implement-technical payment-processing \
  --security-first \
  --compliance PCI-DSS \
  --threat-modeling included

# Continuous security validation
/bumba:chain implement,scan,secure,validate \
  --security-gates strict \
  --vulnerability-threshold zero
```

### Custom Workflow Development

#### Creating Custom Command Chains
```bash
# Define custom workflow
/bumba:workflow create design-to-production \
  --steps "figma-extract,ui-implement,test-responsive,deploy-staging" \
  --validation-points "design-review,accessibility-check,performance-test" \
  --rollback-strategy "automatic"

# Execute custom workflow
/bumba:workflow execute design-to-production \
  --project mobile-app-redesign \
  --environment staging
```

#### Advanced Hook Configuration
```bash
# Performance monitoring hooks
/bumba:settings add-hook PostToolUse performance-monitor.sh \
  --matcher "implement.*" \
  --config "threshold=500ms,alert=true"

# Custom quality gates
/bumba:settings add-hook PreToolUse custom-business-validation.sh \
  --matcher "prd.*|requirements.*" \
  --config "stakeholder-approval=required"

# Team notification hooks
/bumba:settings add-hook Stop team-notification.sh \
  --config "slack-webhook=$SLACK_WEBHOOK,channels=#dev-team"
```

This completes the comprehensive BUMBA Framework Technical Reference, providing detailed specifications for all aspects of the framework including commands, integrations, protocols, and advanced usage patterns.
# BUMBA Command Architecture
## Interactive Menu System & Unified Commands

### /bumba:menu - Interactive Command Discovery
---
allowed-tools: all
description: Interactive command discovery and help system for BUMBA framework
---

# 🏁 /bumba:menu

**Interactive Command Discovery System**

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                           BUMBA COMMAND CENTER                              ║
║                    Intelligence • Quality • Security • Design               ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  🏁 PRODUCT STRATEGY & MANAGEMENT                                           ║
║  ────────────────────────────────────────────────────────────────────────   ║
║  /bumba:prd [action]          🏁 PRD creation, analysis & management        ║
║  /bumba:requirements [scope]  🟢 Requirements discovery & stakeholder sync  ║
║  /bumba:roadmap [timeline]    🏁🏁🏁🏁🏁🏁️ Strategic planning & milestone tracking    ║
║                                                                              ║
║  🟢 DEVELOPMENT COMMANDS                                                     ║
║  ────────────────────────────────────────────────────────────────────────   ║
║  /bumba:implement [feature]   🏁🏁🏁🏁🏁🏁 Intelligent feature development            ║
║  /bumba:analyze [target]      🟢 Multi-dimensional code analysis            ║
║  /bumba:api [endpoint]        🟢 Comprehensive API development               ║
║  /bumba:build [target]        🟢️ Smart build with optimization              ║
║  /bumba:test [scope]          🟢 Intelligent testing workflows              ║
║                                                                              ║
║  🏁 DESIGNER COMMANDS                                                        ║
║  ────────────────────────────────────────────────────────────────────────   ║
║  /bumba:design [workflow]     🏁 Designer-optimized workflows               ║
║  /bumba:figma [action]        🟢 Figma integration & Dev Mode               ║
║  /bumba:visual [task]         🟢 Visual documentation & assets              ║
║  /bumba:ui [component]        🏁🏁🏁🏁🏁🏁 Intelligent UI generation                  ║
║                                                                              ║
║  🟢 QUALITY & MAINTENANCE                                                    ║
║  ────────────────────────────────────────────────────────────────────────   ║
║  /bumba:improve [target]      🏁 Quality-driven improvements               ║
║  /bumba:secure [scope]        🟢️ Security analysis & hardening             ║
║  /bumba:troubleshoot [issue]  🟢 Intelligent debugging workflows            ║
║  /bumba:optimize [target]     🏁 Performance optimization                   ║
║                                                                              ║
║  🏁 SYSTEM & HELP                                                            ║
║  ────────────────────────────────────────────────────────────────────────   ║
║  /bumba:help [command]        🏁🏁🏁🏁🏁🏁 Contextual assistance                      ║
║  /bumba:settings              🟢 Framework configuration                    ║
║  /bumba:status                🏁 System status & health                     ║
║  /bumba:memory [action]       🏁 Context & memory management                ║
║                                                                              ║
║  🏁 QUICK TIPS                                                               ║
║  • Use /bumba:help [command] for detailed examples                          ║
║  • All commands include quality gates and security validation               ║
║  • Designer commands integrate with Figma and visual tools                  ║
║  • Context is preserved across sessions via memory system                   ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

**Interactive Mode**: Type a command name for detailed help and examples.

---

### /bumba:implement - Intelligent Feature Development
---
allowed-tools: all
description: Professional implementation with cognitive safeguards and quality enforcement
---

# 🏁🏁🏁🏁🏁🏁 /bumba:implement ARGUMENTS$

**Intelligent Feature Development with Quality Enforcement**

## Mission
Professional feature development combining intelligent orchestration with mandatory quality gates and security validation.

## Phase 1: Intelligent Assessment
```bash
# Automatic complexity scoring and resource allocation
COMPLEXITY_SCORE=$(analyze_feature_complexity "$ARGUMENTS$")
ORCHESTRATION_APPROACH=$(determine_orchestration_strategy $COMPLEXITY_SCORE)
QUALITY_GATES=$(configure_quality_requirements $COMPLEXITY_SCORE)

memory store-requirement: "$ARGUMENTS$"
memory store-complexity: $COMPLEXITY_SCORE
memory store-approach: $ORCHESTRATION_APPROACH
```

## Phase 2: Wave Orchestration with Security
**Parallel agent spawning for comprehensive analysis:**
- **Agent 1**: Architecture analysis and design patterns
- **Agent 2**: Security threat modeling and validation  
- **Agent 3**: Quality requirements and acceptance criteria
- **Agent 4**: Integration impact and dependency analysis

**Security Pre-validation**: All inputs scanned for vulnerabilities before implementation

## Phase 3: Quality-Enforced Implementation
- **Pre-execution**: Security scanning and input validation
- **During execution**: Real-time quality monitoring via qlty integration
- **Post-execution**: Comprehensive validation and optimization
- **Memory storage**: Context preservation for future reference

## Examples
```bash
/bumba:implement user authentication system
/bumba:implement responsive dashboard component  
/bumba:implement REST API for order management
/bumba:implement real-time chat functionality
```

**Success Criteria**: Feature implemented with zero security vulnerabilities, passing all quality gates, and comprehensive documentation.

---

### /bumba:design - Designer-Optimized Workflows
---
allowed-tools: all
description: Designer-focused workflows with Figma integration and visual tools
---

# 🏁 /bumba:design ARGUMENTS$

**Designer-Optimized Workflows with Professional Tool Integration**

## Mission
Seamless design-to-development workflows combining Figma integration, visual documentation, and intelligent UI generation.

## Designer Workflow Engine
```bash
# Detect design workflow type
WORKFLOW_TYPE=$(analyze_design_request "$ARGUMENTS$")
FIGMA_INTEGRATION=$(check_figma_availability)
VISUAL_TOOLS=$(initialize_visual_capture)

# Activate appropriate design tools
case $WORKFLOW_TYPE in
  "figma-to-code") activate_figma_devmode ;;
  "asset-generation") activate_visual_capture ;;
  "ui-component") activate_ui_generation ;;
  "design-system") activate_comprehensive_workflow ;;
esac
```

## Phase 1: Design Analysis
- **Figma Integration**: Direct workspace access and asset extraction
- **Visual Analysis**: Screenshot analysis and design pattern recognition  
- **Component Mapping**: Design system component identification
- **Responsive Planning**: Breakpoint and layout strategy

## Phase 2: Asset Processing
- **Asset Optimization**: Image compression and format optimization
- **Color Extraction**: Palette generation and CSS variable creation
- **Typography Mapping**: Font stack analysis and web font integration
- **Icon Processing**: SVG optimization and icon system generation

## Phase 3: Code Generation
- **Component Generation**: React/Vue/Angular component creation
- **Styling Systems**: CSS/SCSS/Tailwind implementation
- **Responsive Implementation**: Mobile-first responsive design
- **Design Token Integration**: Systematic design token application

## Designer-Specific Features
```bash
# Figma Dev Mode Integration
figma-devmode extract-specs [node-id]
figma-devmode generate-tokens [layer-name]
figma-devmode export-assets [selection]

# Visual Documentation
visual-capture screenshot [viewport]
visual-capture record-interaction [workflow]
visual-capture compare-designs [before/after]

# UI Generation
ui-generation create-component [design-file]
ui-generation generate-variants [base-component]
ui-generation optimize-assets [asset-folder]
```

## Examples
```bash
/bumba:design convert Figma component to React
/bumba:design create responsive landing page
/bumba:design extract design tokens from mockup
/bumba:design generate component library
/bumba:design optimize design assets
```

**Success Criteria**: Pixel-perfect implementation with optimized assets, responsive design, and maintainable code structure.

---

### /bumba:analyze - Multi-Dimensional Analysis
---
allowed-tools: all  
description: Comprehensive analysis combining code quality, security, and performance assessment
---

# 🟢 /bumba:analyze ARGUMENTS$

**Multi-Dimensional Analysis with Enterprise Security**

## Mission
Comprehensive analysis combining intelligent assessment with enterprise-grade security scanning and quality evaluation.

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
  "ai_bias_detection"
  "adversarial_input_handling"
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
- **Code Quality**: Via qlty integration with automatic fixing
- **Test Coverage**: Gap analysis and test generation recommendations
- **Technical Debt**: Identification and prioritization of debt items
- **Documentation**: Quality and completeness assessment

## Parallel Analysis Execution
```bash
# Spawn specialized analysis agents
Agent1: security_threat_analysis() {
  # Comprehensive security assessment
  scan_ai_vulnerabilities "$ARGUMENTS$"
  scan_traditional_security "$ARGUMENTS$"
  generate_threat_model "$ARGUMENTS$"
}

Agent2: quality_assessment() {
  # Quality and maintainability analysis
  assess_code_quality "$ARGUMENTS$"
  analyze_test_coverage "$ARGUMENTS$"
  identify_technical_debt "$ARGUMENTS$"
}

Agent3: performance_analysis() {
  # Performance and optimization analysis
  identify_bottlenecks "$ARGUMENTS$"
  analyze_resource_usage "$ARGUMENTS$"
  recommend_optimizations "$ARGUMENTS$"
}
```

## Examples
```bash
/bumba:analyze security vulnerabilities in auth system
/bumba:analyze performance bottlenecks in API
/bumba:analyze code quality across entire project
/bumba:analyze design patterns in component library
```

**Success Criteria**: Comprehensive analysis report with actionable recommendations, security clearance, and optimization roadmap.

---

### /bumba:help - Contextual Assistance
---
allowed-tools: all
description: Intelligent contextual assistance and command guidance
---

# 🏁🏁🏁🏁🏁🏁 /bumba:help ARGUMENTS$

**Intelligent Contextual Assistance System**

## Smart Help Engine
```bash
# Context-aware help generation
if [[ -n "$ARGUMENTS$" ]]; then
  # Specific command help
  provide_command_help "$ARGUMENTS$"
  show_usage_examples "$ARGUMENTS$"  
  suggest_related_commands "$ARGUMENTS$"
else
  # General assistance
  show_quick_start_guide
  recommend_next_steps
  display_common_workflows
fi
```

## Command-Specific Help
When you specify a command (e.g., `/bumba:help implement`):
- **Detailed Usage**: Syntax, parameters, and options
- **Real Examples**: Working examples with actual use cases  
- **Best Practices**: Professional development recommendations
- **Integration Tips**: How the command works with other tools
- **Quality Guidelines**: What quality gates will be applied

## Workflow Assistance
When you specify a workflow (e.g., `/bumba:help design workflow`):
- **Step-by-Step Guide**: Complete workflow breakdown
- **Tool Integration**: How different tools work together
- **Common Patterns**: Proven approaches for similar tasks
- **Troubleshooting**: Common issues and solutions

## Examples
```bash
/bumba:help                      # General getting started guide
/bumba:help implement            # Detailed help for implement command
/bumba:help design workflow      # Designer workflow guidance  
/bumba:help security analysis    # Security analysis procedures
/bumba:help troubleshooting      # Debugging and problem-solving
```

---

### /bumba:settings - Framework Configuration
---
allowed-tools: all
description: BUMBA framework configuration and customization
---

# 🟢 /bumba:settings ARGUMENTS$

**Framework Configuration & Customization**

## Configuration Interface
```
╔══════════════════════════════════════════════════════════════════════════════╗
║                        BUMBA SETTINGS PANEL                                ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  🏁️ ORCHESTRATION SETTINGS                                                   ║
║  ──────────────────────────────────────────────────────────────────────────  ║
║  □ Wave Orchestration: ENABLED    🟢 Complexity Threshold: 0.7             ║
║  □ Parallel Agents: 4             🟢 Quality Gates: MANDATORY               ║
║  □ Designer Mode: ENABLED         🟢 Audio Feedback: ENABLED                ║
║                                                                              ║
║  🟢️ SECURITY SETTINGS                                                        ║
║  ──────────────────────────────────────────────────────────────────────────  ║
║  □ Pre-execution Scanning: ENABLED                                          ║
║  □ AI Threat Detection: ENABLED                                             ║  
║  □ Compliance Validation: ENABLED                                           ║
║  □ Security Alerts: AUDIO + VISUAL                                          ║
║                                                                              ║
║  🏁 MCP SERVER STATUS                                                        ║
║  ──────────────────────────────────────────────────────────────────────────  ║
║  🏁 notion               🏁 figma-integration     🏁 context7               ║
║  🏁 google-calendar      🏁 magic-ui              🏁 ui-generation           ║
║  🏁 airtable            🏁 playwright            🏁 browser-automation      ║
║  🏁 memory               🏁 visual-capture        🏁 sequential-thinking     ║
║                                                                              ║
║  🏁 DESIGNER PREFERENCES                                                     ║
║  ──────────────────────────────────────────────────────────────────────────  ║
║  □ Auto Figma Integration: ENABLED                                          ║
║  □ Visual Asset Optimization: ENABLED                                       ║
║  □ Component Generation: REACT (Vue/Angular available)                      ║
║  □ Design Token Export: CSS VARIABLES                                       ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

## Configuration Commands
```bash
/bumba:settings show              # Display current configuration
/bumba:settings orchestration     # Configure orchestration parameters  
/bumba:settings security          # Configure security settings
/bumba:settings design           # Configure designer preferences
/bumba:settings mcp              # Manage MCP server status
/bumba:settings reset            # Reset to default configuration
```

---

### Core Framework Integration

## Quality Gate Integration
Every command automatically includes:
- **Pre-execution**: Security scanning and input validation
- **During execution**: Real-time quality monitoring  
- **Post-execution**: Comprehensive validation and optimization
- **Memory persistence**: Context and decision preservation

## MCP Server Coordination
All commands leverage the verified MCP ecosystem:
- **memory**: Persistent context across sessions
- **sequential-thinking**: Multi-step reasoning with safeguards
- **figma-integration**: Direct Figma workspace access
- **visual-capture**: Screenshot and visual documentation
- **context7**: Live documentation lookup
- **ui-generation**: Intelligent component creation

## Designer Tool Integration
Design-focused commands automatically:
- **Connect to Figma**: Both standard and Dev Mode integration
- **Optimize assets**: Automatic image and asset optimization
- **Generate code**: Professional component and styling generation
- **Preserve quality**: Design implementation with quality enforcement

This command architecture provides a unified, professional experience optimized for both developers and designers with enterprise-grade quality enforcement.

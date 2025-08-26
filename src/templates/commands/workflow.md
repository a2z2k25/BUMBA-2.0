# 🏁 BUMBA Workflow Generation Command

You are generating optimized development workflows using BUMBA's intelligent orchestration capabilities.

## Workflow Context

**Workflow Type**: `{{WORKFLOW_TYPE}}`
**Complexity**: `{{WORKFLOW_COMPLEXITY}}`
**Team Size**: `{{TEAM_SIZE}}`
**Goal**: Create efficient, repeatable processes that leverage BUMBA's full capabilities

## Workflow Generation Protocol

### 1. Workflow Analysis

- **Requirements Assessment**: Understand the specific workflow needs and constraints
- **Team Dynamics**: Consider team size, skills, and collaboration patterns
- **Technology Stack**: Align workflow with existing tools and technologies
- **Success Metrics**: Define measurable outcomes and quality indicators

### 2. Workflow Categories

#### Development Workflows

- **Feature Development**: End-to-end feature implementation with quality gates
- **Bug Fix Process**: Systematic issue resolution and validation
- **Code Review**: Collaborative review process with automated quality checks
- **Deployment Pipeline**: Continuous integration and deployment automation

#### Design Workflows

- **Design to Code**: Figma to implementation with quality validation
- **Component Creation**: Design system component development and documentation
- **Visual Documentation**: Asset creation and maintenance processes
- **User Testing**: Feedback collection and iteration workflows

#### Product Workflows

- **Requirements Gathering**: Stakeholder collaboration and documentation
- **Feature Planning**: Strategic planning and roadmap development
- **Release Management**: Version planning, testing, and deployment coordination
- **Stakeholder Communication**: Regular updates and milestone reporting

#### Quality Workflows

- **Testing Strategy**: Automated and manual testing processes
- **Security Review**: Security validation and vulnerability management
- **Performance Optimization**: Monitoring, analysis, and improvement cycles
- **Documentation Maintenance**: Keeping documentation current and comprehensive

### 3. BUMBA Integration Points

#### Multi-Agent Collaboration

```yaml
workflow_steps:
  - name: 'Requirements Analysis'
    agent: 'product-strategist'
    tools: ['notion', 'memory', 'sequential-thinking']
    output: 'detailed_requirements.md'

  - name: 'Design Planning'
    agent: 'design-engineer'
    tools: ['figma', 'context7', 'filesystem']
    input: 'detailed_requirements.md'
    output: 'design_specifications.figma'

  - name: 'Technical Implementation'
    agent: 'backend-engineer'
    tools: ['github', 'semgrep', 'memory']
    input: 'design_specifications.figma'
    output: 'implemented_feature'
```

#### Quality Gate Integration

```yaml
quality_checkpoints:
  - stage: 'pre_development'
    gates: ['security_scan', 'requirements_validation']

  - stage: 'development'
    gates: ['code_quality', 'test_coverage']

  - stage: 'pre_deployment'
    gates: ['security_audit', 'performance_validation']
```

#### Automation Hooks

```bash
# Example: Automated workflow triggers
~/.claude/hooks/workflow-automation.sh \
  --trigger "pull_request" \
  --workflow "feature_review" \
  --agents "design-engineer,backend-engineer"
```

### 4. Workflow Templates

#### Feature Development Workflow

```markdown
## Feature Development Process

### Phase 1: Planning (Product-Strategist Lead)

1. **Stakeholder Interview**: `/bumba:requirements gather stakeholder needs`
2. **Requirements Documentation**: `/bumba:prd create feature specification`
3. **Success Criteria**: Define measurable outcomes and acceptance criteria

### Phase 2: Design (Design-Engineer Lead)

1. **Design Exploration**: `/bumba:design explore user interface options`
2. **Figma Implementation**: `/bumba:figma create interactive prototype`
3. **Design Review**: Collaborative review with stakeholders

### Phase 3: Development (Backend-Engineer Lead)

1. **Architecture Planning**: `/bumba:analyze technical requirements`
2. **Implementation**: `/bumba:implement feature with quality gates`
3. **Testing**: `/bumba:secure validate security and performance`

### Phase 4: Validation (All Agents)

1. **Quality Review**: `/bumba:collaborate validate complete feature`
2. **Documentation**: Update all relevant documentation
3. **Deployment**: Coordinate release and monitoring
```

#### Bug Fix Workflow

```markdown
## Bug Resolution Process

### Phase 1: Triage

1. **Issue Analysis**: `/bumba:analyze reproduce and understand bug`
2. **Impact Assessment**: Determine severity and affected systems
3. **Assignment**: Route to appropriate agent based on bug type

### Phase 2: Resolution

1. **Root Cause Analysis**: Deep investigation of underlying issues
2. **Fix Implementation**: Targeted resolution with minimal side effects
3. **Testing**: Comprehensive validation including regression tests

### Phase 3: Deployment

1. **Quality Gates**: All security and quality checks pass
2. **Deployment Strategy**: Safe rollout with monitoring
3. **Verification**: Confirm resolution in production environment
```

### 5. Workflow Optimization

#### Performance Metrics

- **Cycle Time**: Time from workflow start to completion
- **Quality Score**: Percentage of workflows passing all quality gates
- **Team Satisfaction**: Developer experience and workflow efficiency
- **Defect Rate**: Issues discovered after workflow completion

#### Continuous Improvement

- **Workflow Analytics**: Track bottlenecks and optimization opportunities
- **Team Feedback**: Regular retrospectives and process improvements
- **Tool Integration**: Leverage new MCP servers and capabilities
- **Best Practice Sharing**: Document and share successful patterns

#### Customization Options

- **Team Adaptation**: Modify workflows for specific team needs and preferences
- **Project Scaling**: Adjust processes for different project sizes and complexities
- **Tool Integration**: Incorporate team-specific tools and preferences
- **Quality Standards**: Customize quality gates for project requirements

## Workflow Documentation

### Process Documentation

```markdown
# Workflow: [Name]

## Overview

- **Purpose**: [What this workflow accomplishes]
- **Participants**: [Who is involved]
- **Duration**: [Expected timeline]
- **Success Criteria**: [How success is measured]

## Prerequisites

- [ ] Required tools and access permissions
- [ ] Team training and onboarding complete
- [ ] Initial setup and configuration

## Steps

1. **Step Name**
   - Agent: [Responsible agent]
   - Tools: [Required BUMBA tools/MCP servers]
   - Input: [Required inputs]
   - Output: [Expected deliverables]
   - Quality Gates: [Validation checkpoints]

## Quality Gates

- [ ] All automated quality checks pass
- [ ] Manual review and approval complete
- [ ] Documentation updated and accurate
- [ ] Stakeholder sign-off received

## Troubleshooting

- **Common Issues**: [Frequent problems and solutions]
- **Escalation Path**: [When and how to escalate]
- **Recovery Procedures**: [How to handle failures]
```

### Metrics and Monitoring

- **Workflow Dashboards**: Real-time visibility into process status
- **Performance Tracking**: Historical data and trend analysis
- **Quality Metrics**: Track success rates and improvement opportunities
- **Team Health**: Monitor workload distribution and satisfaction

## Quality Gates

- 🏁 Workflow optimized for team size and project complexity
- 🏁 All BUMBA agents and tools properly integrated
- 🏁 Quality gates strategically placed throughout process
- 🏁 Clear documentation with steps, responsibilities, and success criteria
- 🏁 Metrics defined for continuous improvement and optimization
- 🏁 Flexibility built in for team customization and adaptation

---

**Design workflows that scale with your team and leverage BUMBA's full power! 🟢**

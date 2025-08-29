# BUMBA Notion Dashboard - AI Agent Implementation Guidelines

## 🟡 Mission Statement

This guide teaches AI agents how to properly create, populate, and maintain the Notion dashboard system as a **real product team**. Every action should reflect genuine product development workflows with proper department coordination, manager oversight, and cross-team collaboration.

## 📋 Core Principles

### 1. **Department Identity & Ownership**
- **Strategic Department (🟡)**: Owns requirements, research, roadmap, stakeholder communication
- **Experience Department (🔴)**: Owns design systems, UI/UX, user testing, prototypes  
- **Technical Department (🟢️)**: Owns architecture, implementation, testing, DevOps

### 2. **Manager Certification Workflow**
- **NEVER** mark deliverables as complete without manager review
- **ALWAYS** submit work through certification workflow
- **ONLY** managers can approve cross-department handoffs
- **MANDATORY** quality gates for all work outputs

### 3. **Real-Time Collaboration**
- Update progress **during** sprints, not just at completion
- Maintain **bidirectional** cross-references between related work
- Use **10-minute sprint boundaries** for focused execution
- **Block** work when dependencies aren't met

## 🟢️ Dashboard Structure Overview

```
Main Dashboard (Product Team Command Center)
├── 📊 Executive Summary (Real-time team health)
├── 🟢 Active Sprints (Live progress tracking)
├── 🟡 Department Hubs (Strategic/Experience/Technical)
├── 🔗 Cross-Department Dependencies 
├── 🏁 Manager Certification Queue
├── 📈 Velocity & Performance Metrics
├── 🔴 Blockers & Critical Alerts
└── 📚 Knowledge Repository
    ├── /strategic/ (PRDs, research, decisions)
    ├── /experience/ (designs, prototypes, testing)
    ├── /technical/ (specs, architecture, code)
    └── /shared/ (cross-team collaboration)
```

## 🟡 Strategic Department Agent Guidelines

### Product-Strategist-Manager Responsibilities

#### 1. **Product Requirements (PRD) Creation**
```javascript
// CORRECT Implementation
async createPRD(featureName, requirements) {
  // 1. Create PRD sub-page in /strategic/prd/
  const prdPage = await this.createSubPage({
    department: 'strategic',
    category: 'prd',
    title: `PRD: ${featureName}`,
    template: 'prdTemplate',
    status: 'draft'
  });
  
  // 2. Populate with structured content
  await this.populatePRDSections(prdPage, {
    problemStatement: requirements.problem,
    solution: requirements.solution,
    userStories: requirements.stories,
    successMetrics: requirements.metrics
  });
  
  // 3. Submit for manager certification
  await this.submitForCertification({
    deliverable: prdPage,
    type: 'PRD',
    manager: 'Product-Strategist-Manager',
    qualityGates: ['problem_clarity', 'solution_completeness', 'stakeholder_alignment']
  });
  
  // 4. Create timeline milestone
  await this.createMilestone({
    name: `${featureName} - Requirements Complete`,
    department: 'Strategic',
    deliverable: prdPage,
    nextHandoff: 'Experience Department'
  });
}
```

#### 2. **Cross-Department Coordination**
```javascript
// CORRECT: Coordinate handoff to Experience team
async handoffToExperience(prdPage) {
  // Only proceed if manager-certified
  if (!await this.isCertified(prdPage)) {
    throw new Error('Cannot handoff uncertified PRD');
  }
  
  // Create handoff coordination milestone
  await this.createHandoffMilestone({
    from: 'Strategic',
    to: 'Experience', 
    deliverable: prdPage,
    dependencies: ['PRD approval', 'Design brief creation'],
    timeline: '+48 hours'
  });
  
  // Notify Experience manager
  await this.notifyManager('Design-Engineer-Manager', {
    type: 'handoff_ready',
    deliverable: prdPage,
    context: 'PRD approved and ready for design phase'
  });
}
```

#### 3. **Sprint Planning & Tracking**
```javascript
// CORRECT: Create and track strategic sprints
async planStrategicSprint(sprintName, duration = 10) {
  const sprint = await this.createSprint({
    name: sprintName,
    department: 'Strategic',
    owner: 'Product-Strategist-Manager',
    estimatedMinutes: duration,
    dependencies: [], // List any blockers
    deliverables: [], // Expected outputs
    qualityChecks: [] // Manager checkpoints
  });
  
  // Real-time progress tracking
  await this.trackSprintProgress(sprint, {
    updateFrequency: 'real-time',
    progressCallback: this.updateDashboard,
    completionCallback: this.submitForReview
  });
}
```

### Strategic Sub-Agents (Research, Analysis, Planning)

#### User Research Documentation
```javascript
// CORRECT: Document research findings
async documentResearch(studyName, findings) {
  const researchPage = await this.createSubPage({
    department: 'strategic',
    category: 'research',
    title: `Research: ${studyName}`,
    template: 'researchTemplate'
  });
  
  await this.populateResearchFindings(researchPage, {
    methodology: findings.methodology,
    sampleSize: findings.participants,
    keyInsights: findings.insights,
    recommendations: findings.recommendations,
    confidence: findings.confidence
  });
  
  // Cross-reference with relevant PRDs
  await this.createCrossReference({
    source: researchPage,
    targets: findings.relatedPRDs,
    type: 'supports',
    strength: 'important'
  });
}
```

## 🔴 Experience Department Agent Guidelines

### Design-Engineer-Manager Responsibilities

#### 1. **Design System Development**
```javascript
// CORRECT: Build and maintain design system
async developDesignSystem() {
  const designSystemHub = await this.createSubPage({
    department: 'experience',
    category: 'systems',
    title: 'Design System Hub',
    template: 'designSystemTemplate'
  });
  
  // Create component library structure
  const components = await this.createComponentLibrary({
    tokens: this.defineDesignTokens(),
    patterns: this.createDesignPatterns(),
    guidelines: this.createUsageGuidelines()
  });
  
  // Manager certification for each component
  for (const component of components) {
    await this.submitForCertification({
      deliverable: component,
      type: 'Design Component',
      manager: 'Design-Engineer-Manager',
      qualityGates: ['design_consistency', 'accessibility_compliance', 'implementation_ready']
    });
  }
}
```

#### 2. **PRD to Design Translation**
```javascript
// CORRECT: Receive PRD and create design specifications
async translatePRDToDesign(certifiedPRD) {
  // Verify PRD is manager-certified from Strategic
  if (!await this.isCrossTeamCertified(certifiedPRD, 'Strategic')) {
    await this.createBlocker('Waiting for certified PRD from Strategic team');
    return;
  }
  
  // Create design specification page
  const designSpec = await this.createSubPage({
    department: 'experience',
    category: 'designs',
    title: `Design: ${certifiedPRD.featureName}`,
    template: 'designSpecTemplate'
  });
  
  // Reference the source PRD
  await this.createCrossReference({
    source: designSpec,
    target: certifiedPRD,
    type: 'implements',
    strength: 'critical'
  });
  
  // Break into design sprints
  await this.planDesignSprints(designSpec, {
    exploration: 3, // 3 ten-minute sprints
    iteration: 4,   // 4 ten-minute sprints  
    validation: 2   // 2 ten-minute sprints
  });
}
```

#### 3. **User Testing Integration**
```javascript
// CORRECT: Plan and execute user testing
async conductUserTesting(prototype) {
  const testingSession = await this.createSubPage({
    department: 'experience',
    category: 'feedback',
    title: `User Testing: ${prototype.name}`,
    template: 'userTestingTemplate'
  });
  
  // Link to tested prototype
  await this.createCrossReference({
    source: testingSession,
    target: prototype,
    type: 'validates',
    strength: 'important'
  });
  
  // Document findings and iterations
  await this.documentTestingResults(testingSession, {
    participants: 8,
    scenarios: ['login_flow', 'checkout_process'],
    insights: ['confusion_on_step_3', 'positive_feedback_on_animations'],
    recommendations: ['simplify_form', 'add_progress_indicator']
  });
}
```

### Experience Sub-Agents (UI Design, UX Research, Prototyping)

#### Component Creation Workflow
```javascript
// CORRECT: Create new UI component
async createUIComponent(componentName, specifications) {
  const component = await this.createSubPage({
    department: 'experience',
    category: 'components',
    title: `Component: ${componentName}`,
    template: 'componentTemplate'
  });
  
  await this.defineComponentSpecs(component, {
    states: specifications.states, // hover, active, disabled, etc.
    variants: specifications.variants, // size, color, style variations
    accessibility: specifications.a11y, // WCAG compliance details
    implementation: specifications.code // CSS/JS implementation notes
  });
  
  // Submit each component for manager review
  await this.submitForCertification({
    deliverable: component,
    type: 'UI Component',
    manager: 'Design-Engineer-Manager',
    qualityGates: ['design_system_compliance', 'accessibility_standards', 'implementation_feasibility']
  });
}
```

## 🟢️ Technical Department Agent Guidelines

### Backend-Engineer-Manager Responsibilities

#### 1. **Architecture Planning**
```javascript
// CORRECT: Create system architecture
async planSystemArchitecture(requirements) {
  const architectureDoc = await this.createSubPage({
    department: 'technical',
    category: 'specs',
    title: `Architecture: ${requirements.systemName}`,
    template: 'architectureTemplate'
  });
  
  await this.defineArchitecture(architectureDoc, {
    systemComponents: requirements.components,
    dataFlow: requirements.dataFlow,
    scalingStrategy: requirements.scaling,
    securityConsiderations: requirements.security,
    performanceTargets: requirements.performance
  });
  
  // Critical: Must be certified before any implementation
  await this.submitForCertification({
    deliverable: architectureDoc,
    type: 'Technical Architecture',
    manager: 'Backend-Engineer-Manager',
    qualityGates: ['scalability_validated', 'security_reviewed', 'performance_feasible'],
    escalationRequired: true // Architecture needs senior approval
  });
}
```

#### 2. **Design-to-Code Translation**
```javascript
// CORRECT: Implement designs with proper references
async implementDesign(certifiedDesign) {
  // Block until design is manager-certified
  if (!await this.isCrossTeamCertified(certifiedDesign, 'Experience')) {
    await this.createBlocker('Waiting for certified design specifications');
    return;
  }
  
  const implementation = await this.createSubPage({
    department: 'technical',
    category: 'implementation',
    title: `Implementation: ${certifiedDesign.componentName}`,
    template: 'implementationTemplate'
  });
  
  // Reference source design
  await this.createCrossReference({
    source: implementation,
    target: certifiedDesign,
    type: 'implements',
    strength: 'critical'
  });
  
  // Break into technical sprints
  await this.planImplementationSprints(implementation, {
    setup: 1,      // Environment and tooling
    core: 4,       // Core functionality
    testing: 3,    // Unit and integration tests
    integration: 2 // System integration
  });
}
```

#### 3. **API Development & Documentation**
```javascript
// CORRECT: Create and document APIs
async developAPI(endpoint, specification) {
  const apiDoc = await this.createSubPage({
    department: 'technical',
    category: 'specs',
    title: `API: ${endpoint}`,
    template: 'apiSpecTemplate'
  });
  
  await this.defineAPISpecification(apiDoc, {
    endpoint: specification.path,
    methods: specification.methods,
    requestFormat: specification.request,
    responseFormat: specification.response,
    authentication: specification.auth,
    errorHandling: specification.errors,
    examples: specification.examples
  });
  
  // Submit for security and architecture review
  await this.submitForCertification({
    deliverable: apiDoc,
    type: 'API Specification',
    manager: 'Backend-Engineer-Manager',
    qualityGates: ['security_validated', 'performance_tested', 'documentation_complete']
  });
}
```

### Technical Sub-Agents (Development, Testing, DevOps)

#### Database Schema Design
```javascript
// CORRECT: Design and document database schema
async designDatabaseSchema(requirements) {
  const schemaDoc = await this.createSubPage({
    department: 'technical',
    category: 'schemas',
    title: `Database: ${requirements.schemaName}`,
    template: 'databaseTemplate'
  });
  
  await this.defineSchema(schemaDoc, {
    tables: requirements.tables,
    relationships: requirements.relations,
    indexes: requirements.indexes,
    constraints: requirements.constraints,
    migrations: requirements.migrations
  });
  
  // Cross-reference with related APIs
  await this.createCrossReference({
    source: schemaDoc,
    targets: requirements.relatedAPIs,
    type: 'supports',
    strength: 'critical'
  });
}
```

## 🔄 Cross-Department Workflows

### Handoff Protocols

#### 1. **Strategic → Experience Handoff**
```javascript
// Strategic Agent: Prepare handoff
async prepareExperienceHandoff(prdPage) {
  // Ensure PRD is manager-certified
  await this.waitForCertification(prdPage);
  
  // Create handoff package
  const handoffPackage = await this.createHandoffPackage({
    deliverable: prdPage,
    targetDepartment: 'Experience',
    targetManager: 'Design-Engineer-Manager',
    context: 'PRD complete, ready for design phase',
    dependencies: ['User research complete', 'Technical feasibility confirmed'],
    nextSteps: ['Design exploration', 'Prototype creation', 'User validation']
  });
  
  // Schedule handoff meeting
  await this.scheduleHandoffMeeting(handoffPackage);
}

// Experience Agent: Receive handoff
async receiveStrategicHandoff(handoffPackage) {
  // Validate handoff completeness
  if (!await this.validateHandoff(handoffPackage)) {
    await this.requestHandoffClarification(handoffPackage.issues);
    return;
  }
  
  // Accept handoff and begin design phase
  await this.acceptHandoff(handoffPackage);
  await this.beginDesignPhase(handoffPackage.deliverable);
}
```

#### 2. **Experience → Technical Handoff**
```javascript
// Experience Agent: Prepare technical handoff
async prepareTechnicalHandoff(designSpecs) {
  const handoffPackage = await this.createTechnicalHandoffPackage({
    designSpecs: designSpecs,
    componentLibrary: await this.getComponentLibrary(),
    prototypes: await this.getApprovedPrototypes(),
    implementationNotes: await this.generateImplementationNotes(),
    assetExports: await this.exportDesignAssets()
  });
  
  await this.scheduleHandoffMeeting({
    attendees: ['Design-Engineer-Manager', 'Backend-Engineer-Manager'],
    agenda: 'Design to development handoff',
    materials: handoffPackage
  });
}
```

### Dependency Management

#### Blocking Work Properly
```javascript
// CORRECT: Handle dependencies and blockers
async handleDependency(currentWork, dependency) {
  if (!await this.isDependencySatisfied(dependency)) {
    // Create blocker in dashboard
    await this.createBlocker({
      blockedWork: currentWork,
      blockedBy: dependency,
      estimatedResolution: dependency.estimatedCompletion,
      escalationPath: dependency.ownerManager,
      impact: this.calculateBlockerImpact(currentWork)
    });
    
    // Notify dependency owner
    await this.notifyDependencyOwner(dependency, {
      message: `${currentWork.name} is blocked waiting for ${dependency.name}`,
      urgency: currentWork.priority,
      requestedCompletion: currentWork.deadline
    });
    
    // Update dashboard status
    await this.updateDashboardStatus(currentWork, 'blocked');
  }
}
```

## 📊 Progress Tracking & Updates

### Sprint Progress Updates

#### Real-Time Progress Tracking
```javascript
// CORRECT: Update progress during sprints
async trackSprintProgress(sprint) {
  const progressTracker = setInterval(async () => {
    const currentProgress = await this.calculateSprintProgress(sprint);
    
    // Update dashboard immediately
    await this.updateDashboardWidget('activeSprints', {
      sprintId: sprint.id,
      progress: currentProgress.percentage,
      timeRemaining: currentProgress.minutesLeft,
      nextMilestone: currentProgress.nextCheckpoint
    });
    
    // Check for blockers or delays
    if (currentProgress.isBlocked) {
      await this.triggerBlockerAlert(sprint, currentProgress.blocker);
    }
    
    if (currentProgress.isBehindSchedule) {
      await this.triggerScheduleAlert(sprint, currentProgress.delay);
    }
  }, 30000); // Update every 30 seconds
}
```

#### Sprint Completion Workflow
```javascript
// CORRECT: Complete sprint with proper workflow
async completeSprint(sprint) {
  // Validate all deliverables
  const deliverables = await this.getSprintDeliverables(sprint);
  for (const deliverable of deliverables) {
    if (!await this.isDeliverableComplete(deliverable)) {
      await this.flagIncompleteDeliverable(deliverable);
      return; // Cannot complete sprint with incomplete work
    }
  }
  
  // Submit sprint for manager review
  const sprintSummary = await this.generateSprintSummary(sprint);
  await this.submitForCertification({
    deliverable: sprintSummary,
    type: 'Sprint Completion',
    manager: sprint.departmentManager,
    qualityGates: ['deliverables_complete', 'quality_standards_met', 'next_steps_defined']
  });
  
  // Update velocity metrics
  await this.updateVelocityMetrics(sprint);
  
  // Plan next sprint if needed
  if (sprint.hasFollowUp) {
    await this.planFollowUpSprint(sprint);
  }
}
```

## 🟡 Quality Gates & Manager Interaction

### Manager Certification Process

#### Submitting Work for Review
```javascript
// CORRECT: Submit deliverable for manager certification
async submitForManagerReview(deliverable, manager) {
  // Pre-submission quality check
  const qualityCheck = await this.runQualityCheck(deliverable);
  if (qualityCheck.criticalIssues > 0) {
    await this.fixCriticalIssues(deliverable, qualityCheck.issues);
  }
  
  // Create certification request
  const certificationRequest = await this.createCertificationRequest({
    deliverable: deliverable,
    submitter: this.agentName,
    manager: manager,
    submissionDate: new Date(),
    qualityScore: qualityCheck.score,
    estimatedReviewTime: this.estimateReviewTime(deliverable.type),
    urgency: deliverable.priority,
    blocksOtherWork: await this.getBlockedWork(deliverable)
  });
  
  // Add to manager's review queue
  await this.addToManagerQueue(manager, certificationRequest);
  
  // Set up review monitoring
  await this.monitorReviewProgress(certificationRequest);
}
```

#### Manager Review Simulation
```javascript
// FOR MANAGERS: Simulate realistic review process
async reviewDeliverable(certificationRequest) {
  const deliverable = certificationRequest.deliverable;
  
  // Simulate review time (2-4 hours for most deliverables)
  const reviewDuration = this.calculateReviewTime(deliverable);
  await this.simulateReviewDelay(reviewDuration);
  
  // Check quality gates
  const qualityGateResults = await this.checkQualityGates(deliverable);
  
  if (qualityGateResults.allPassed) {
    // Approve and certify
    await this.approveCertification(certificationRequest);
    await this.notifySubmitter('approved', deliverable);
    await this.unblockDependentWork(deliverable);
  } else {
    // Request revisions
    await this.requestRevisions(certificationRequest, qualityGateResults.issues);
    await this.notifySubmitter('revision_required', deliverable, qualityGateResults.issues);
  }
  
  // Update dashboard metrics
  await this.updateManagerMetrics(this.managerName, certificationRequest);
}
```

## 🔴 Error Handling & Recovery

### Common Error Scenarios

#### 1. **Blocked Dependencies**
```javascript
// CORRECT: Handle blocked work gracefully
async handleBlockedWork(work, blocker) {
  // Log the blocker
  await this.createBlockerRecord({
    blockedWork: work,
    blocker: blocker,
    discoveredAt: new Date(),
    estimatedImpact: await this.calculateImpact(work, blocker),
    escalationPath: await this.getEscalationPath(blocker)
  });
  
  // Find alternative work
  const alternativeWork = await this.findAlternativeWork(work.department);
  if (alternativeWork) {
    await this.switchToAlternativeWork(alternativeWork);
  } else {
    await this.enterIdleState('No unblocked work available');
  }
  
  // Monitor blocker for resolution
  await this.monitorBlockerResolution(blocker);
}
```

#### 2. **Manager Review Delays**
```javascript
// CORRECT: Handle delayed manager reviews
async handleReviewDelay(certificationRequest) {
  const delayDuration = Date.now() - certificationRequest.submissionDate;
  
  if (delayDuration > 48 * 60 * 60 * 1000) { // 48 hours
    // Escalate to senior management
    await this.escalateReviewDelay({
      certificationRequest: certificationRequest,
      delayDuration: delayDuration,
      impact: await this.calculateDelayImpact(certificationRequest),
      escalateTo: 'Senior Management'
    });
  } else if (delayDuration > 24 * 60 * 60 * 1000) { // 24 hours
    // Send reminder to manager
    await this.sendReviewReminder(certificationRequest);
  }
}
```

#### 3. **Cross-Reference Failures**
```javascript
// CORRECT: Handle broken cross-references
async handleBrokenCrossReference(brokenRef) {
  // Attempt automatic repair
  const repairAttempt = await this.attemptAutoRepair(brokenRef);
  
  if (repairAttempt.success) {
    await this.updateCrossReference(brokenRef, repairAttempt.newTarget);
  } else {
    // Flag for manual review
    await this.flagForManualReview({
      brokenReference: brokenRef,
      repairAttempts: repairAttempt.attempts,
      suggestedActions: repairAttempt.suggestions,
      impact: await this.assessReferenceImpact(brokenRef)
    });
  }
}
```

## 📈 Success Metrics & KPIs

### Agent Performance Tracking

#### Individual Agent Metrics
```javascript
// Track agent effectiveness
const agentMetrics = {
  sprintCompletionRate: 95, // % of sprints completed on time
  qualityGatePassRate: 87,  // % passing manager review on first try
  crossTeamCollaboration: 92, // Quality of handoffs and communication
  documentationQuality: 89,   // Completeness and usefulness of documentation
  blockerResolutionTime: 4.2, // Average hours to resolve blockers
  velocityConsistency: 88     // Consistency in sprint completion velocity
};

// Update metrics after each sprint
await this.updateAgentMetrics(this.agentName, agentMetrics);
```

#### Department Performance Tracking
```javascript
// Track department effectiveness
const departmentMetrics = {
  departmentVelocity: 8.4,      // Sprints completed per week
  handoffEfficiency: 94,        // % successful cross-team handoffs
  managerReviewTime: 2.1,       // Average hours for manager reviews
  qualityScore: 91,             // Overall quality of deliverables
  stakeholderSatisfaction: 88,  // External stakeholder feedback
  innovationIndex: 76           // New ideas and process improvements
};

await this.updateDepartmentMetrics('Strategic', departmentMetrics);
```

## 🟡 Best Practices Summary

### DO 🏁
- **Always** submit work through manager certification
- **Always** update progress in real-time during sprints
- **Always** create proper cross-references between related work
- **Always** block work when dependencies aren't satisfied
- **Always** use 10-minute sprint boundaries
- **Always** maintain department identity and workflows
- **Always** document decisions and context in sub-pages
- **Always** coordinate handoffs through proper channels

### DON'T 🔴
- **Never** mark work complete without manager approval
- **Never** skip quality gates or certification workflows
- **Never** work on tasks that should be blocked by dependencies
- **Never** create content without proper department categorization
- **Never** ignore cross-department coordination requirements
- **Never** assume other departments' work is complete without verification
- **Never** break the 10-minute sprint rule for individual tasks
- **Never** create orphaned content without cross-references

### CRITICAL REMINDERS 🔴
1. **This is a REAL product team** - Act accordingly with professional standards
2. **Managers have authority** - Respect the certification hierarchy
3. **Dependencies matter** - Don't work on blocked items
4. **Communication is key** - Keep all stakeholders informed
5. **Quality over speed** - Better to deliver certified work than fast work
6. **Document everything** - Future team members depend on your documentation
7. **Learn and adapt** - Improve processes based on what works

---

## 📞 Support & Escalation

If you encounter scenarios not covered in these guidelines:

1. **Check existing patterns** in the knowledge repository
2. **Consult department manager** through certification workflow
3. **Escalate to cross-department coordination** if multiple teams affected
4. **Document new patterns** for future agents to follow

Remember: You are part of a real product team. Every action should reflect the professionalism, collaboration, and quality standards expected in actual product development environments.

---

**Version**: 1.0  
**Last Updated**: August 14, 2025  
**Applies To**: All BUMBA CLI AI Agents  
**Next Review**: When new workflow patterns emerge
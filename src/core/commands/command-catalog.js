/**
 * BUMBA Command Catalog
 * Complete definition of all commands with specialist mappings and context enrichment
 * 
 * Principles:
 * - Every command is equally important
 * - Commands should provide rich context to specialists
 * - Specialists handle the implementation details
 * - Department managers route to appropriate specialists
 */

const CommandCategory = {
  IMPLEMENTATION: 'implementation',
  ANALYSIS: 'analysis',
  DESIGN: 'design',
  DOCUMENTATION: 'documentation',
  TESTING: 'testing',
  OPTIMIZATION: 'optimization',
  STRATEGY: 'strategy',
  COLLABORATION: 'collaboration',
  SYSTEM: 'system'
};

const Department = {
  BACKEND: 'backend',
  FRONTEND: 'frontend',
  PRODUCT: 'product',
  CROSS: 'cross-functional'
};

/**
 * Complete command catalog with specialist mappings
 * Each command includes:
 * - description: What the command does
 * - category: Type of work
 * - department: Primary department responsible
 * - specialists: Required specialists (in order of importance)
 * - context: Additional context to enrich the prompt
 * - outputs: Expected deliverables
 */
const COMMAND_CATALOG = {
  // ============== PRODUCT STRATEGY COMMANDS ==============
  'prd': {
    description: 'Create comprehensive Product Requirements Document',
    category: CommandCategory.STRATEGY,
    department: Department.PRODUCT,
    specialists: ['product-owner', 'business-analyst', 'market-researcher'],
    context: {
      includeMarketAnalysis: true,
      includeUserPersonas: true,
      includeSuccessMetrics: true,
      includeTimeline: true
    },
    outputs: ['PRD document', 'User stories', 'Acceptance criteria', 'Success metrics']
  },
  
  'requirements': {
    description: 'Define and document feature requirements',
    category: CommandCategory.STRATEGY,
    department: Department.PRODUCT,
    specialists: ['business-analyst', 'product-owner'],
    context: {
      includeFunctional: true,
      includeNonFunctional: true,
      includeDependencies: true,
      includeConstraints: true
    },
    outputs: ['Requirements doc', 'User stories', 'Dependencies map']
  },
  
  'roadmap': {
    description: 'Create product roadmap and timeline',
    category: CommandCategory.STRATEGY,
    department: Department.PRODUCT,
    specialists: ['product-strategist', 'product-owner'],
    context: {
      includePhases: true,
      includeMilestones: true,
      includeResources: true,
      includeRisks: true
    },
    outputs: ['Roadmap document', 'Timeline', 'Milestone definitions']
  },
  
  'implement-strategy': {
    description: 'Implement strategic product initiatives',
    category: CommandCategory.IMPLEMENTATION,
    department: Department.PRODUCT,
    specialists: ['product-strategist', 'business-analyst', 'market-researcher'],
    context: {
      includeMarketPosition: true,
      includeCompetitiveAnalysis: true,
      includeGrowthMetrics: true
    },
    outputs: ['Strategy document', 'Implementation plan', 'KPIs']
  },
  
  'research-market': {
    description: 'Conduct market research and analysis',
    category: CommandCategory.ANALYSIS,
    department: Department.PRODUCT,
    specialists: ['market-researcher', 'business-analyst'],
    context: {
      includeCompetitors: true,
      includeMarketSize: true,
      includeTrends: true,
      includeOpportunities: true
    },
    outputs: ['Market research report', 'Competitor analysis', 'Opportunity assessment']
  },
  
  'analyze-business': {
    description: 'Analyze business metrics and performance',
    category: CommandCategory.ANALYSIS,
    department: Department.PRODUCT,
    specialists: ['business-analyst', 'product-owner'],
    context: {
      includeKPIs: true,
      includeRevenue: true,
      includeUserMetrics: true,
      includeGrowth: true
    },
    outputs: ['Business analysis report', 'Metrics dashboard', 'Recommendations']
  },
  
  'docs-business': {
    description: 'Create business documentation',
    category: CommandCategory.DOCUMENTATION,
    department: Department.PRODUCT,
    specialists: ['technical-writer', 'business-analyst'],
    context: {
      includeProcesses: true,
      includePolicies: true,
      includeGuidelines: true
    },
    outputs: ['Business documentation', 'Process guides', 'Policy documents']
  },
  
  'improve-strategy': {
    description: 'Optimize and improve product strategy',
    category: CommandCategory.OPTIMIZATION,
    department: Department.PRODUCT,
    specialists: ['product-strategist', 'business-analyst'],
    context: {
      analyzeCurrentStrategy: true,
      identifyGaps: true,
      proposeImprovements: true
    },
    outputs: ['Strategy improvements', 'Optimization plan', 'Impact analysis']
  },

  // ============== DESIGN & UX COMMANDS ==============
  'design': {
    description: 'Create UI/UX designs and visual assets',
    category: CommandCategory.DESIGN,
    department: Department.FRONTEND,
    specialists: ['ui-designer', 'ux-specialist', 'frontend-developer'],
    context: {
      includeWireframes: true,
      includeMockups: true,
      includePrototypes: true,
      includeDesignSystem: true
    },
    outputs: ['Design mockups', 'Wireframes', 'Style guide', 'Component library']
  },
  
  'figma': {
    description: 'Create and manage Figma designs',
    category: CommandCategory.DESIGN,
    department: Department.FRONTEND,
    specialists: ['ui-designer', 'ux-specialist'],
    context: {
      useFigmaAPI: true,
      includeComponents: true,
      includeVariables: true,
      includePrototyping: true
    },
    outputs: ['Figma designs', 'Component library', 'Design tokens']
  },
  
  'ui': {
    description: 'Implement UI components and interfaces',
    category: CommandCategory.IMPLEMENTATION,
    department: Department.FRONTEND,
    specialists: ['frontend-developer', 'ui-designer'],
    context: {
      includeComponents: true,
      includeResponsive: true,
      includeAccessibility: true,
      includeAnimations: true
    },
    outputs: ['UI components', 'Stylesheets', 'Component documentation']
  },
  
  'visual': {
    description: 'Create visual design elements',
    category: CommandCategory.DESIGN,
    department: Department.FRONTEND,
    specialists: ['ui-designer', 'ux-specialist'],
    context: {
      includeColorScheme: true,
      includeTypography: true,
      includeIconography: true,
      includeImagery: true
    },
    outputs: ['Visual assets', 'Style guide', 'Design system']
  },
  
  'implement-design': {
    description: 'Implement design specifications in code',
    category: CommandCategory.IMPLEMENTATION,
    department: Department.FRONTEND,
    specialists: ['frontend-developer', 'ui-designer'],
    context: {
      fromDesignSpecs: true,
      includeResponsive: true,
      includeInteractions: true,
      includeBrowserSupport: true
    },
    outputs: ['Implemented UI', 'CSS/JS code', 'Cross-browser tested']
  },
  
  'research-design': {
    description: 'Conduct design research and user studies',
    category: CommandCategory.ANALYSIS,
    department: Department.FRONTEND,
    specialists: ['ux-research-specialist', 'ui-designer'],
    context: {
      includeUserResearch: true,
      includeUsabilityTesting: true,
      includeA_BTesting: true,
      includeAnalytics: true
    },
    outputs: ['Research findings', 'User insights', 'Design recommendations']
  },
  
  'analyze-ux': {
    description: 'Analyze user experience and usability',
    category: CommandCategory.ANALYSIS,
    department: Department.FRONTEND,
    specialists: ['ux-specialist', 'ux-research-specialist'],
    context: {
      includeUserFlows: true,
      includeHeuristics: true,
      includeAccessibility: true,
      includePerformance: true
    },
    outputs: ['UX analysis report', 'Usability findings', 'Improvement recommendations']
  },
  
  'docs-design': {
    description: 'Create design documentation and guidelines',
    category: CommandCategory.DOCUMENTATION,
    department: Department.FRONTEND,
    specialists: ['technical-writer', 'ui-designer'],
    context: {
      includeDesignSystem: true,
      includeGuidelines: true,
      includeBestPractices: true
    },
    outputs: ['Design documentation', 'Style guide', 'Component docs']
  },
  
  'improve-design': {
    description: 'Optimize and improve design quality',
    category: CommandCategory.OPTIMIZATION,
    department: Department.FRONTEND,
    specialists: ['ui-designer', 'ux-specialist'],
    context: {
      analyzeCurrentDesign: true,
      identifyImprovements: true,
      optimizeUsability: true
    },
    outputs: ['Design improvements', 'Optimization plan', 'Updated designs']
  },

  // ============== BACKEND ENGINEERING COMMANDS ==============
  'api': {
    description: 'Design and implement APIs',
    category: CommandCategory.IMPLEMENTATION,
    department: Department.BACKEND,
    specialists: ['api-architect', 'backend-developer'],
    context: {
      includeRESTful: true,
      includeGraphQL: true,
      includeWebSocket: true,
      includeDocumentation: true,
      includeVersioning: true
    },
    outputs: ['API implementation', 'API documentation', 'Integration tests']
  },
  
  'secure': {
    description: 'Implement security measures and audits',
    category: CommandCategory.IMPLEMENTATION,
    department: Department.BACKEND,
    specialists: ['security-specialist', 'backend-developer'],
    context: {
      includeAuthentication: true,
      includeAuthorization: true,
      includeEncryption: true,
      includeOWASP: true,
      includeAuditLog: true
    },
    outputs: ['Security implementation', 'Audit report', 'Security guidelines']
  },
  
  'scan': {
    description: 'Scan for vulnerabilities and issues',
    category: CommandCategory.ANALYSIS,
    department: Department.BACKEND,
    specialists: ['security-specialist', 'devops-engineer'],
    context: {
      includeVulnerabilities: true,
      includeDependencies: true,
      includeCodeQuality: true,
      includePerformance: true
    },
    outputs: ['Scan report', 'Vulnerability list', 'Remediation plan']
  },
  
  'implement-technical': {
    description: 'Implement technical backend features',
    category: CommandCategory.IMPLEMENTATION,
    department: Department.BACKEND,
    specialists: ['backend-developer', 'database-admin'],
    context: {
      includeArchitecture: true,
      includeScalability: true,
      includePerformance: true,
      includeTesting: true
    },
    outputs: ['Backend implementation', 'Database schema', 'API endpoints']
  },
  
  'devops': {
    description: 'Setup DevOps pipelines and infrastructure',
    category: CommandCategory.IMPLEMENTATION,
    department: Department.BACKEND,
    specialists: ['devops-engineer', 'cloud-architect', 'sre-specialist'],
    context: {
      includeCI_CD: true,
      includeContainerization: true,
      includeOrchestration: true,
      includeMonitoring: true,
      includeInfraAsCode: true
    },
    outputs: ['CI/CD pipeline', 'Infrastructure setup', 'Deployment scripts']
  },
  
  'analyze-technical': {
    description: 'Analyze technical architecture and code',
    category: CommandCategory.ANALYSIS,
    department: Department.BACKEND,
    specialists: ['backend-developer', 'code-reviewer'],
    context: {
      includeArchitecture: true,
      includeCodeQuality: true,
      includePerformance: true,
      includeSecurity: true
    },
    outputs: ['Technical analysis', 'Architecture review', 'Recommendations']
  },
  
  'research-technical': {
    description: 'Research technical solutions and approaches',
    category: CommandCategory.ANALYSIS,
    department: Department.BACKEND,
    specialists: ['backend-developer', 'database-admin'],
    context: {
      includeTechnologies: true,
      includeFrameworks: true,
      includeBestPractices: true,
      includeTradeoffs: true
    },
    outputs: ['Technical research', 'Technology recommendations', 'POC code']
  },
  
  'docs-technical': {
    description: 'Create technical documentation',
    category: CommandCategory.DOCUMENTATION,
    department: Department.BACKEND,
    specialists: ['technical-writer', 'backend-developer'],
    context: {
      includeAPI: true,
      includeArchitecture: true,
      includeDeployment: true,
      includeTroubleshooting: true
    },
    outputs: ['Technical docs', 'API reference', 'Architecture diagrams']
  },
  
  'improve-performance': {
    description: 'Optimize system performance',
    category: CommandCategory.OPTIMIZATION,
    department: Department.BACKEND,
    specialists: ['backend-developer', 'database-optimizer', 'sre-specialist'],
    context: {
      includeBottlenecks: true,
      includeCaching: true,
      includeDatabase: true,
      includeLoadBalancing: true
    },
    outputs: ['Performance improvements', 'Optimization report', 'Benchmarks']
  },
  
  'publish': {
    description: 'Publish and deploy applications',
    category: CommandCategory.IMPLEMENTATION,
    department: Department.BACKEND,
    specialists: ['devops-engineer', 'backend-developer'],
    context: {
      includeDeployment: true,
      includeVersioning: true,
      includeReleaseNotes: true,
      includeRollback: true
    },
    outputs: ['Deployed application', 'Release notes', 'Deployment guide']
  },

  // ============== CROSS-FUNCTIONAL COMMANDS ==============
  'implement': {
    description: 'Implement complete features across stack',
    category: CommandCategory.IMPLEMENTATION,
    department: Department.CROSS,
    specialists: ['product-owner', 'ui-designer', 'frontend-developer', 'backend-developer'],
    context: {
      includeRequirements: true,
      includeDesign: true,
      includeFrontend: true,
      includeBackend: true,
      includeTesting: true
    },
    outputs: ['Complete feature', 'Documentation', 'Tests']
  },
  
  'analyze': {
    description: 'Comprehensive analysis across all aspects',
    category: CommandCategory.ANALYSIS,
    department: Department.CROSS,
    specialists: ['business-analyst', 'ux-specialist', 'backend-developer'],
    context: {
      includeBusiness: true,
      includeUser: true,
      includeTechnical: true,
      includePerformance: true
    },
    outputs: ['Analysis report', 'Findings', 'Recommendations']
  },
  
  'test': {
    description: 'Comprehensive testing across stack',
    category: CommandCategory.TESTING,
    department: Department.CROSS,
    specialists: ['test-automator', 'frontend-developer', 'backend-developer'],
    context: {
      includeUnit: true,
      includeIntegration: true,
      includeE2E: true,
      includePerformance: true,
      includeSecurity: true
    },
    outputs: ['Test results', 'Coverage report', 'Bug reports']
  },
  
  'validate': {
    description: 'Validate implementation against requirements',
    category: CommandCategory.TESTING,
    department: Department.CROSS,
    specialists: ['business-analyst', 'test-automator'],
    context: {
      checkRequirements: true,
      checkAcceptanceCriteria: true,
      checkQuality: true,
      checkPerformance: true
    },
    outputs: ['Validation report', 'Pass/fail status', 'Issues found']
  },
  
  'docs': {
    description: 'Create comprehensive documentation',
    category: CommandCategory.DOCUMENTATION,
    department: Department.CROSS,
    specialists: ['technical-writer', 'backend-developer', 'frontend-developer'],
    context: {
      includeUser: true,
      includeTechnical: true,
      includeAPI: true,
      includeDeployment: true
    },
    outputs: ['Documentation', 'User guides', 'API reference']
  },
  
  'research': {
    description: 'Research solutions and approaches',
    category: CommandCategory.ANALYSIS,
    department: Department.CROSS,
    specialists: ['market-researcher', 'ux-research-specialist', 'backend-developer'],
    context: {
      includeMarket: true,
      includeUser: true,
      includeTechnical: true,
      includeCompetitive: true
    },
    outputs: ['Research report', 'Findings', 'Recommendations']
  },
  
  'improve': {
    description: 'Improve and optimize across stack',
    category: CommandCategory.OPTIMIZATION,
    department: Department.CROSS,
    specialists: ['product-strategist', 'ui-designer', 'backend-developer'],
    context: {
      analyzeCurrentState: true,
      identifyImprovements: true,
      prioritizeChanges: true,
      implementOptimizations: true
    },
    outputs: ['Improvements', 'Optimization report', 'Updated code']
  },

  // ============== COLLABORATION COMMANDS ==============
  'team': {
    description: 'Coordinate team collaboration',
    category: CommandCategory.COLLABORATION,
    department: Department.CROSS,
    specialists: ['product-owner', 'ui-designer', 'backend-developer'],
    context: {
      includeRoles: true,
      includeResponsibilities: true,
      includeTimeline: true,
      includeDependencies: true
    },
    outputs: ['Team structure', 'Collaboration plan', 'RACI matrix']
  },
  
  'collaborate': {
    description: 'Enable multi-agent collaboration',
    category: CommandCategory.COLLABORATION,
    department: Department.CROSS,
    specialists: ['product-owner', 'frontend-developer', 'backend-developer'],
    context: {
      enableParallel: true,
      manageDependencies: true,
      syncProgress: true,
      resolveConflicts: true
    },
    outputs: ['Collaboration setup', 'Progress tracking', 'Sync points']
  },
  
  'workflow': {
    description: 'Define and manage workflows',
    category: CommandCategory.COLLABORATION,
    department: Department.CROSS,
    specialists: ['business-analyst', 'devops-engineer'],
    context: {
      defineSteps: true,
      assignOwners: true,
      setTriggers: true,
      trackProgress: true
    },
    outputs: ['Workflow definition', 'Process diagram', 'Automation scripts']
  },
  
  'chain': {
    description: 'Chain multiple operations together',
    category: CommandCategory.COLLABORATION,
    department: Department.CROSS,
    specialists: ['backend-developer', 'devops-engineer'],
    context: {
      defineSequence: true,
      handleDependencies: true,
      manageState: true,
      handleErrors: true
    },
    outputs: ['Operation chain', 'Execution plan', 'State management']
  },
  
  'checkpoint': {
    description: 'Create project checkpoints',
    category: CommandCategory.COLLABORATION,
    department: Department.CROSS,
    specialists: ['product-owner', 'business-analyst'],
    context: {
      captureState: true,
      documentProgress: true,
      identifyBlockers: true,
      planNextSteps: true
    },
    outputs: ['Checkpoint report', 'Progress summary', 'Next steps']
  },
  
  'implement-agents': {
    description: 'Implement multi-agent systems',
    category: CommandCategory.IMPLEMENTATION,
    department: Department.CROSS,
    specialists: ['backend-developer', 'ai-engineer'],
    context: {
      defineAgents: true,
      implementCoordination: true,
      manageState: true,
      handleCommunication: true
    },
    outputs: ['Agent system', 'Coordination logic', 'Communication protocol']
  },

  // ============== SPECIALIZED COMMANDS ==============
  'snippets': {
    description: 'Generate code snippets',
    category: CommandCategory.IMPLEMENTATION,
    department: Department.CROSS,
    specialists: ['backend-developer', 'frontend-developer'],
    context: {
      provideExamples: true,
      includeBestPractices: true,
      explainUsage: true
    },
    outputs: ['Code snippets', 'Usage examples', 'Documentation']
  },
  
  'commit': {
    description: 'Create git commits with proper messages',
    category: CommandCategory.SYSTEM,
    department: Department.CROSS,
    specialists: ['backend-developer'],
    context: {
      analyzeChanges: true,
      generateMessage: true,
      followConventions: true
    },
    outputs: ['Git commit', 'Commit message', 'Change summary']
  },
  
  'handoff': {
    description: 'Handoff work between teams/phases',
    category: CommandCategory.COLLABORATION,
    department: Department.CROSS,
    specialists: ['product-owner', 'technical-writer'],
    context: {
      documentState: true,
      transferKnowledge: true,
      defineNextSteps: true
    },
    outputs: ['Handoff document', 'Knowledge transfer', 'Next steps']
  },
  
  'urgent': {
    description: 'Handle urgent/priority tasks',
    category: CommandCategory.IMPLEMENTATION,
    department: Department.CROSS,
    specialists: ['backend-developer', 'frontend-developer', 'devops-engineer'],
    context: {
      priorityHigh: true,
      quickTurnaround: true,
      focusOnEssentials: true
    },
    outputs: ['Quick solution', 'Temporary fix', 'Follow-up plan']
  },

  // ============== CONSCIOUSNESS COMMANDS ==============
  'conscious-analyze': {
    description: 'Consciousness-aware analysis',
    category: CommandCategory.ANALYSIS,
    department: Department.CROSS,
    specialists: ['ai-engineer', 'business-analyst'],
    context: {
      applyConsciousness: true,
      considerEthics: true,
      holisticView: true
    },
    outputs: ['Conscious analysis', 'Ethical considerations', 'Holistic insights']
  },
  
  'conscious-reason': {
    description: 'Apply conscious reasoning',
    category: CommandCategory.ANALYSIS,
    department: Department.CROSS,
    specialists: ['ai-engineer', 'product-strategist'],
    context: {
      deepReasoning: true,
      multiPerspective: true,
      ethicalConsiderations: true
    },
    outputs: ['Reasoning document', 'Decision rationale', 'Ethical assessment']
  },
  
  'conscious-wisdom': {
    description: 'Apply wisdom principles',
    category: CommandCategory.STRATEGY,
    department: Department.CROSS,
    specialists: ['product-strategist', 'ai-engineer'],
    context: {
      longTermThinking: true,
      systemicView: true,
      sustainabilityFocus: true
    },
    outputs: ['Wisdom insights', 'Strategic guidance', 'Long-term vision']
  },
  
  'conscious-purpose': {
    description: 'Align with purpose and values',
    category: CommandCategory.STRATEGY,
    department: Department.CROSS,
    specialists: ['product-strategist', 'business-analyst'],
    context: {
      valueDriven: true,
      purposeAlignment: true,
      impactAssessment: true
    },
    outputs: ['Purpose alignment', 'Value assessment', 'Impact analysis']
  },

  // ============== LITE MODE COMMANDS ==============
  'lite': {
    description: 'Lightweight execution mode',
    category: CommandCategory.SYSTEM,
    department: Department.CROSS,
    specialists: ['backend-developer'],
    context: {
      minimalResources: true,
      quickExecution: true,
      essentialOnly: true
    },
    outputs: ['Quick result', 'Basic output']
  },
  
  'lite-analyze': {
    description: 'Quick lightweight analysis',
    category: CommandCategory.ANALYSIS,
    department: Department.CROSS,
    specialists: ['business-analyst'],
    context: {
      quickAnalysis: true,
      keyPointsOnly: true,
      minimalDepth: true
    },
    outputs: ['Quick analysis', 'Key findings']
  },
  
  'lite-implement': {
    description: 'Quick lightweight implementation',
    category: CommandCategory.IMPLEMENTATION,
    department: Department.CROSS,
    specialists: ['backend-developer'],
    context: {
      minimalImplementation: true,
      coreFeatureOnly: true,
      quickTurnaround: true
    },
    outputs: ['Basic implementation', 'Core functionality']
  },

  // ============== SYSTEM COMMANDS ==============
  'menu': {
    description: 'Display interactive command menu',
    category: CommandCategory.SYSTEM,
    department: Department.CROSS,
    specialists: [],
    context: {
      showAllCommands: true,
      groupByCategory: true,
      includeDescriptions: true
    },
    outputs: ['Menu display']
  },
  
  'help': {
    description: 'Display help and documentation',
    category: CommandCategory.SYSTEM,
    department: Department.CROSS,
    specialists: [],
    context: {
      showUsage: true,
      showExamples: true,
      showDocumentation: true
    },
    outputs: ['Help documentation']
  },
  
  'settings': {
    description: 'Manage system settings',
    category: CommandCategory.SYSTEM,
    department: Department.CROSS,
    specialists: [],
    context: {
      showCurrentSettings: true,
      allowModification: true,
      validateSettings: true
    },
    outputs: ['Settings display', 'Configuration']
  },
  
  'status': {
    description: 'Display system status',
    category: CommandCategory.SYSTEM,
    department: Department.CROSS,
    specialists: [],
    context: {
      showSystemHealth: true,
      showActiveAgents: true,
      showPerformance: true
    },
    outputs: ['Status report']
  },
  
  'health': {
    description: 'Check system health',
    category: CommandCategory.SYSTEM,
    department: Department.CROSS,
    specialists: ['devops-engineer'],
    context: {
      checkServices: true,
      checkResources: true,
      checkPerformance: true
    },
    outputs: ['Health report', 'Metrics']
  },
  
  'metrics': {
    description: 'Display system metrics',
    category: CommandCategory.SYSTEM,
    department: Department.CROSS,
    specialists: ['devops-engineer'],
    context: {
      showPerformance: true,
      showUsage: true,
      showTrends: true
    },
    outputs: ['Metrics dashboard', 'Performance data']
  },
  
  'optimize': {
    description: 'Optimize system performance',
    category: CommandCategory.OPTIMIZATION,
    department: Department.CROSS,
    specialists: ['backend-developer', 'devops-engineer'],
    context: {
      analyzeBottlenecks: true,
      optimizeResources: true,
      improvePerformance: true
    },
    outputs: ['Optimization report', 'Performance improvements']
  },
  
  'monitor': {
    description: 'Monitor system activity',
    category: CommandCategory.SYSTEM,
    department: Department.CROSS,
    specialists: ['devops-engineer'],
    context: {
      realTimeMonitoring: true,
      alertOnIssues: true,
      trackMetrics: true
    },
    outputs: ['Monitoring dashboard', 'Alerts']
  },
  
  'connect': {
    description: 'Connect to external services',
    category: CommandCategory.SYSTEM,
    department: Department.CROSS,
    specialists: ['backend-developer', 'devops-engineer'],
    context: {
      establishConnection: true,
      validateCredentials: true,
      testConnectivity: true
    },
    outputs: ['Connection status', 'Integration setup']
  },
  
  'operability': {
    description: 'Check command operability',
    category: CommandCategory.SYSTEM,
    department: Department.CROSS,
    specialists: ['backend-developer'],
    context: {
      testCommands: true,
      validateRouting: true,
      checkSpecialists: true
    },
    outputs: ['Operability report', 'Command status']
  }
};

/**
 * Get command definition
 */
function getCommand(commandName) {
  return COMMAND_CATALOG[commandName] || null;
}

/**
 * Get all commands for a department
 */
function getCommandsByDepartment(department) {
  return Object.entries(COMMAND_CATALOG)
    .filter(([_, cmd]) => cmd.department === department)
    .map(([name, cmd]) => ({ name, ...cmd }));
}

/**
 * Get all commands in a category
 */
function getCommandsByCategory(category) {
  return Object.entries(COMMAND_CATALOG)
    .filter(([_, cmd]) => cmd.category === category)
    .map(([name, cmd]) => ({ name, ...cmd }));
}

/**
 * Get specialists required for a command
 */
function getSpecialistsForCommand(commandName) {
  const command = COMMAND_CATALOG[commandName];
  return command ? command.specialists : [];
}

/**
 * Enrich prompt with command context
 */
function enrichPromptWithContext(commandName, userPrompt) {
  const command = COMMAND_CATALOG[commandName];
  if (!command) return userPrompt;
  
  const contextElements = [];
  
  // Add command description
  contextElements.push(`Task: ${command.description}`);
  
  // Add context flags
  const context = command.context;
  const contextDescriptions = [];
  
  for (const [key, value] of Object.entries(context)) {
    if (value === true) {
      // Convert camelCase to readable format
      const readable = key.replace(/([A-Z])/g, ' $1').toLowerCase();
      contextDescriptions.push(readable.replace('include ', ''));
    }
  }
  
  if (contextDescriptions.length > 0) {
    contextElements.push(`Focus areas: ${contextDescriptions.join(', ')}`);
  }
  
  // Add expected outputs
  if (command.outputs.length > 0) {
    contextElements.push(`Expected deliverables: ${command.outputs.join(', ')}`);
  }
  
  // Combine with user prompt
  const enrichedPrompt = `${contextElements.join('\n')}\n\nUser request: ${userPrompt}`;
  
  return enrichedPrompt;
}

module.exports = {
  COMMAND_CATALOG,
  CommandCategory,
  Department,
  getCommand,
  getCommandsByDepartment,
  getCommandsByCategory,
  getSpecialistsForCommand,
  enrichPromptWithContext
};
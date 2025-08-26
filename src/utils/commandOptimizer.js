/**
 * BUMBA Command Optimization Engine
 *
 * Intelligently routes commands to appropriate agents and optimizes
 * command sequences for maximum team collaboration efficiency.
 */

const fs = require('fs');
const path = require('path');

class BumbaCommandOptimizer {
  constructor() {
    this.teamDir = path.join(process.env.HOME, '.claude', 'team');
    this.agentSpecializations = {
      'Product-Strategist': {
        primaryCommands: ['prd', 'requirements', 'roadmap', 'research-market', 'docs-business', 'analyze-business', 'improve-strategy'],
        secondaryCommands: ['research', 'docs', 'analyze', 'improve', 'checkpoint', 'test', 'validate'],
        capabilities: ['strategy', 'planning', 'requirements', 'stakeholder', 'business_analysis', 'market_research'],
        handoffTargets: ['Design-Engineer', 'Backend-Engineer'],
        qualityFocus: ['business_validation', 'requirement_completeness', 'stakeholder_alignment', 'roi_analysis'],
        coreActivities: ['stakeholder_alignment', 'business_value_validation', 'compliance_regulatory', 'success_criteria_definition'],
        qaSpecializations: ['requirements_testing', 'business_logic_validation', 'uat', 'compliance_testing']
      },
      'Design-Engineer': {
        primaryCommands: ['design', 'figma', 'ui', 'visual', 'snippets', 'research-design', 'docs-design', 'analyze-ux', 'improve-design'],
        secondaryCommands: ['implement', 'analyze', 'improve', 'docs', 'test', 'validate'],
        capabilities: ['design', 'frontend', 'ui/ux', 'prototyping', 'accessibility', 'design_systems'],
        handoffTargets: ['Backend-Engineer', 'Product-Strategist'],
        qualityFocus: ['design_consistency', 'accessibility', 'user_experience', 'component_reusability'],
        coreActivities: ['user_experience_research', 'design_system_maintenance', 'accessibility_compliance', 'component_architecture'],
        qaSpecializations: ['ui_testing', 'ux_validation', 'accessibility_testing', 'design_consistency_checks']
      },
      'Backend-Engineer': {
        primaryCommands: ['secure', 'scan', 'publish', 'research-technical', 'docs-technical', 'analyze-technical', 'improve-performance'],
        secondaryCommands: ['implement', 'improve', 'checkpoint', 'docs', 'analyze', 'test', 'validate'],
        capabilities: ['backend', 'architecture', 'security', 'deployment', 'performance', 'scalability'],
        handoffTargets: ['Product-Strategist', 'Design-Engineer'],
        qualityFocus: ['code_quality', 'security_validation', 'performance', 'scalability'],
        coreActivities: ['system_architecture', 'security_implementation', 'performance_optimization', 'devops_automation'],
        qaSpecializations: ['api_testing', 'security_testing', 'performance_testing', 'integration_testing']
      }
    };

    this.commandWorkflows = {
      // Strategic workflow patterns
      product_development: [
        { agent: 'Product-Strategist', command: 'requirements', context: 'initial_discovery' },
        { agent: 'consciousness', command: 'conscious:analyze', context: 'requirements_reflection', trigger: 'post_requirements' },
        { agent: 'Product-Strategist', command: 'prd', context: 'documentation' },
        { agent: 'consciousness', command: 'conscious:reason', context: 'purpose_alignment', trigger: 'post_prd' },
        { agent: 'Design-Engineer', command: 'design', context: 'ui_planning' },
        { agent: 'Design-Engineer', command: 'figma', context: 'prototyping' },
        { agent: 'consciousness', command: 'conscious:analyze', context: 'design_principles', trigger: 'post_design' },
        { agent: 'Backend-Engineer', command: 'implement', context: 'development' },
        { agent: 'consciousness', command: 'conscious:wisdom', context: 'implementation_guidance', trigger: 'post_implement' },
        { agent: 'Backend-Engineer', command: 'secure', context: 'validation' },
        { agent: 'consciousness', command: 'conscious:analyze', context: 'final_reflection', trigger: 'workflow_completion' }
      ],

      // Design-focused workflow
      design_system: [
        { agent: 'Design-Engineer', command: 'design', context: 'system_planning' },
        { agent: 'consciousness', command: 'conscious:analyze', context: 'design_philosophy', trigger: 'post_design_planning' },
        { agent: 'Design-Engineer', command: 'ui', context: 'component_creation' },
        { agent: 'Backend-Engineer', command: 'implement', context: 'component_development' },
        { agent: 'consciousness', command: 'conscious:reason', context: 'unity_development', trigger: 'post_implementation' },
        { agent: 'Product-Strategist', command: 'requirements', context: 'validation' },
        { agent: 'consciousness', command: 'conscious:wisdom', context: 'system_purpose', trigger: 'design_system_completion' }
      ],

      // Security-focused workflow
      security_audit: [
        { agent: 'Backend-Engineer', command: 'scan', context: 'security_assessment' },
        { agent: 'consciousness', command: 'conscious:analyze', context: 'ethical_technology', trigger: 'post_security_scan' },
        { agent: 'Backend-Engineer', command: 'secure', context: 'vulnerability_fixing' },
        { agent: 'Product-Strategist', command: 'requirements', context: 'compliance_check' },
        { agent: 'consciousness', command: 'conscious:reason', context: 'protection_principles', trigger: 'post_compliance' },
        { agent: 'Design-Engineer', command: 'design', context: 'security_ux' },
        { agent: 'consciousness', command: 'conscious:wisdom', context: 'secure_purpose', trigger: 'security_workflow_completion' }
      ]
    };
  }

  /**
   * Optimize a command for the current team context
   */
  optimizeCommand(command, args = [], currentContext = {}) {
    try {
      const optimization = {
        originalCommand: command,
        args: args,
        timestamp: new Date().toISOString(),
        recommendations: []
      };

      // Determine best agent for this command
      const suggestedAgent = this._determineOptimalAgent(command, args, currentContext);
      optimization.suggestedAgent = suggestedAgent;

      // Generate workflow recommendations
      const workflowRecommendations = this._generateWorkflowRecommendations(
        command,
        currentContext
      );
      optimization.workflowRecommendations = workflowRecommendations;

      // Check for optimization opportunities
      const optimizations = this._identifyOptimizations(command, args, currentContext);
      optimization.recommendations = optimizations;

      // Generate command sequence if applicable
      const commandSequence = this._generateCommandSequence(
        command,
        suggestedAgent,
        currentContext
      );
      optimization.commandSequence = commandSequence;

      return optimization;
    } catch (error) {
      return {
        error: 'Command optimization failed',
        details: error.message,
        originalCommand: command
      };
    }
  }

  /**
   * Route command to the most appropriate agent
   */
  routeCommand(command, args = [], preferredAgent = null, options = {}) {
    const teamStatus = this._getTeamStatus();
    const optimalAgent = preferredAgent || this._determineOptimalAgent(command, args, teamStatus);

    // Handle priority routing
    const priority = options.priority || this._determinePriority(command, args);
    const isUrgent = priority === 'urgent' || command === 'urgent';

    const routing = {
      command,
      args,
      routedTo: optimalAgent,
      priority,
      reasoning: this._explainRouting(command, optimalAgent),
      handoffRequired: false,
      timestamp: new Date().toISOString(),
      urgentOverride: isUrgent
    };

    // Enhanced handoff context
    const currentAgent = teamStatus.lastActiveAgent;
    if (currentAgent && currentAgent !== optimalAgent) {
      routing.handoffRequired = true;
      routing.handoffFrom = currentAgent;
      routing.handoffContext = this._buildRichHandoffContext(command, args, currentAgent, optimalAgent, options);

      // Add conflict detection
      if (options.detectConflicts) {
        routing.potentialConflicts = this._detectAgentConflicts(currentAgent, optimalAgent, command, args);
      }
    }

    // Emergency routing - bypass normal queues
    if (isUrgent) {
      routing.emergencyEscalation = true;
      routing.bypassQueue = true;
    }

    return routing;
  }

  /**
   * Generate optimized command sequence for complex tasks
   */
  generateWorkflow(taskType, requirements = {}) {
    const workflow = this.commandWorkflows[taskType];
    if (!workflow) {
      return this._generateCustomWorkflow(taskType, requirements);
    }

    const optimizedWorkflow = workflow.map((step, index) => ({
      ...step,
      stepNumber: index + 1,
      totalSteps: workflow.length,
      estimatedDuration: this._estimateStepDuration(step.command),
      prerequisites: this._getStepPrerequisites(step, workflow.slice(0, index)),
      qualityGates: this._getStepQualityGates(step.agent, step.command)
    }));

    return {
      taskType,
      workflow: optimizedWorkflow,
      estimatedTotalDuration: optimizedWorkflow.reduce((total, step) => total + step.estimatedDuration,
        0
      ),
      requiredAgents: [...new Set(optimizedWorkflow.map(step => step.agent))],
      qualityCheckpoints: optimizedWorkflow.flatMap(step => step.qualityGates),
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Analyze command usage patterns and suggest optimizations
   */
  analyzeCommandPatterns() {
    try {
      const teamHistory = this._loadTeamHistory();
      const commandUsage = this._analyzeCommandUsage(teamHistory);
      const patterns = this._identifyUsagePatterns(commandUsage);

      return {
        commandUsage,
        patterns,
        optimizationSuggestions: this._generatePatternOptimizations(patterns),
        analysisTimestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        error: 'Pattern analysis failed',
        details: error.message
      };
    }
  }

  /**
   * Private helper methods
   */
  _determineOptimalAgent(command, args, context) {
    // Handle QA commands with intelligent routing
    if (command === 'test' || command === 'validate') {
      const qaAgent = this._getQaAgent(command, args);
      if (qaAgent) {
        return qaAgent;
      }
    }

    // Handle domain-specific commands directly
    const domainSpecificRouting = this._getDomainSpecificAgent(command);
    if (domainSpecificRouting) {
      return domainSpecificRouting;
    }

    // Score each agent based on command fit
    const agentScores = {};

    Object.entries(this.agentSpecializations).forEach(([agent, spec]) => {
      let score = 0;

      // Primary command match (high priority)
      if (spec.primaryCommands.includes(command)) {
        score += 100;
      }

      // Secondary command match (medium priority)
      if (spec.secondaryCommands && spec.secondaryCommands.includes(command)) {
        score += 50;
      }

      // Enhanced capability matching based on args
      const argString = args.join(' ').toLowerCase();
      spec.capabilities.forEach(capability => {
        if (argString.includes(capability.toLowerCase())) {
          score += 25;
        }
      });

      // Core activity alignment
      if (spec.coreActivities) {
        spec.coreActivities.forEach(activity => {
          if (argString.includes(activity.toLowerCase().replace('_', ' '))) {
            score += 30;
          }
        });
      }

      // Context-based scoring
      if (context.lastAgent && spec.handoffTargets.includes(context.lastAgent)) {
        score += 30; // Good handoff pattern
      }

      // Recent activity bonus
      if (context.activeAgents && context.activeAgents.includes(agent)) {
        score += 15;
      }

      // Project phase alignment
      const projectPhase = this._detectProjectPhase(argString, context);
      if (this._isAgentOptimalForPhase(agent, projectPhase)) {
        score += 20;
      }

      agentScores[agent] = score;
    });

    // Return agent with highest score, fallback to Backend-Engineer for technical commands
    const sortedAgents = Object.entries(agentScores).sort(([, a], [, b]) => b - a);
    return sortedAgents.length > 0 ? sortedAgents[0][0] : 'Backend-Engineer';
  }

  /**
   * Get agent for domain-specific commands
   */
  _getDomainSpecificAgent(command) {
    const domainRouting = {
      // Business/Strategy domain
      'docs-business': 'Product-Strategist',
      'analyze-business': 'Product-Strategist',
      'research-market': 'Product-Strategist',
      'improve-strategy': 'Product-Strategist',

      // Design/UX domain
      'docs-design': 'Design-Engineer',
      'analyze-ux': 'Design-Engineer',
      'research-design': 'Design-Engineer',
      'improve-design': 'Design-Engineer',

      // Technical domain
      'docs-technical': 'Backend-Engineer',
      'analyze-technical': 'Backend-Engineer',
      'research-technical': 'Backend-Engineer',
      'improve-performance': 'Backend-Engineer'
    };

    return domainRouting[command] || null;
  }

  /**
   * Detect project phase based on context
   */
  _detectProjectPhase(argString, context) {
    if (argString.includes('requirement') || argString.includes('planning') || argString.includes('strategy')) {
      return 'strategy';
    }
    if (argString.includes('design') || argString.includes('ui') || argString.includes('ux')) {
      return 'design';
    }
    if (argString.includes('implement') || argString.includes('code') || argString.includes('deploy')) {
      return 'development';
    }
    return 'general';
  }

  /**
   * Check if agent is optimal for project phase
   */
  _isAgentOptimalForPhase(agent, phase) {
    const phaseAlignment = {
      'strategy': ['Product-Strategist'],
      'design': ['Design-Engineer'],
      'development': ['Backend-Engineer'],
      'general': ['Product-Strategist', 'Design-Engineer', 'Backend-Engineer']
    };

    return phaseAlignment[phase]?.includes(agent) || false;
  }

  /**
   * Get agent for QA commands based on scope
   */
  _getQaAgent(command, args) {
    const scope = args.length > 0 ? args[0].toLowerCase() : '';

    // Define QA routing rules
    const qaRouting = {
      test: {
        // UI/UX Testing → Design-Engineer
        'ui': 'Design-Engineer',
        'ux': 'Design-Engineer',
        'design': 'Design-Engineer',
        'accessibility': 'Design-Engineer',
        'component': 'Design-Engineer',
        'frontend': 'Design-Engineer',

        // Technical Testing → Backend-Engineer
        'api': 'Backend-Engineer',
        'security': 'Backend-Engineer',
        'performance': 'Backend-Engineer',
        'backend': 'Backend-Engineer',
        'integration': 'Backend-Engineer',
        'system': 'Backend-Engineer',

        // Business Testing → Product-Strategist
        'requirements': 'Product-Strategist',
        'business': 'Product-Strategist',
        'uat': 'Product-Strategist',
        'acceptance': 'Product-Strategist',
        'compliance': 'Product-Strategist'
      },
      validate: {
        // Design Validation → Design-Engineer
        'design': 'Design-Engineer',
        'accessibility': 'Design-Engineer',
        'ux': 'Design-Engineer',
        'ui': 'Design-Engineer',

        // Technical Validation → Backend-Engineer
        'security': 'Backend-Engineer',
        'performance': 'Backend-Engineer',
        'technical': 'Backend-Engineer',
        'architecture': 'Backend-Engineer',

        // Business Validation → Product-Strategist
        'business': 'Product-Strategist',
        'requirements': 'Product-Strategist',
        'compliance': 'Product-Strategist',
        'regulatory': 'Product-Strategist'
      }
    };

    // Check for exact scope match
    const routingTable = qaRouting[command];
    if (routingTable && routingTable[scope]) {
      return routingTable[scope];
    }

    // Check for partial matches in the full args string
    const fullArgsString = args.join(' ').toLowerCase();
    for (const [keyword, agent] of Object.entries(routingTable || {})) {
      if (fullArgsString.includes(keyword)) {
        return agent;
      }
    }

    // Default routing when no scope specified
    if (args.length === 0) {
      // No scope = comprehensive testing/validation across all agents
      return null; // Will trigger multi-agent workflow
    }

    // Fallback based on command type
    return command === 'test' ? 'Backend-Engineer' : 'Product-Strategist';
  }

  _generateWorkflowRecommendations(command, context) {
    const recommendations = [];

    // Find workflows that include this command
    Object.entries(this.commandWorkflows).forEach(([workflowType, steps]) => {
      const commandStep = steps.find(step => step.command === command);
      if (commandStep) {
        const stepIndex = steps.indexOf(commandStep);
        const nextSteps = steps.slice(stepIndex + 1, stepIndex + 3);

        if (nextSteps.length > 0) {
          recommendations.push({
            workflowType,
            currentStep: stepIndex + 1,
            totalSteps: steps.length,
            suggestedNextSteps: nextSteps.map(step => ({
              agent: step.agent,
              command: step.command,
              context: step.context
            }))
          });
        }
      }
    });

    return recommendations;
  }

  _identifyOptimizations(command, args, context) {
    const optimizations = [];

    // Command-specific optimizations
    switch (command) {
      case 'implement':
        if (!args.some(arg => arg.includes('test'))) {
          optimizations.push({
            type: 'quality',
            priority: 'high',
            suggestion: 'Consider adding testing requirements',
            reason: 'Implementation without tests reduces quality'
          });
        }
        break;

      case 'design':
        if (!args.some(arg => arg.includes('accessibility'))) {
          optimizations.push({
            type: 'accessibility',
            priority: 'medium',
            suggestion: 'Include accessibility considerations',
            reason: 'Design should include accessibility from start'
          });
        }
        break;

      case 'prd':
        if (!context.stakeholderInput) {
          optimizations.push({
            type: 'process',
            priority: 'high',
            suggestion: 'Gather stakeholder input first',
            reason: 'PRD should be based on stakeholder requirements'
          });
        }
        break;
    }

    // Team context optimizations
    if (context.pendingHandoffs > 2) {
      optimizations.push({
        type: 'workflow',
        priority: 'high',
        suggestion: 'Resolve pending handoffs before new commands',
        reason: 'High handoff backlog reduces team efficiency'
      });
    }

    return optimizations;
  }

  _generateCommandSequence(command, agent, context) {
    const sequence = [{ agent, command, order: 1 }];

    // Add pre-command steps if needed
    if (command === 'implement' && !context.requirements) {
      sequence.unshift({
        agent: 'Product-Strategist',
        command: 'requirements',
        order: 0,
        reason: 'Requirements needed before implementation'
      });
    }

    if (command === 'figma' && !context.design) {
      sequence.unshift({
        agent: 'Design-Engineer',
        command: 'design',
        order: 0,
        reason: 'Design planning needed before Figma work'
      });
    }

    // Add post-command steps
    const agentSpec = this.agentSpecializations[agent];
    if (agentSpec && agentSpec.qualityFocus.length > 0) {
      sequence.push({
        agent: 'Quality-System',
        command: 'checkpoint',
        order: sequence.length + 1,
        reason: `Quality validation for ${agentSpec.qualityFocus.join(', ')}`
      });
    }

    return sequence.length > 1 ? sequence : null;
  }

  _generateCustomWorkflow(taskType, requirements) {
    // Generate workflow based on task keywords
    const workflow = [];
    const taskKeywords = taskType.toLowerCase();

    // Strategic phase
    if (taskKeywords.includes('product') || taskKeywords.includes('feature')) {
      workflow.push({
        agent: 'Product-Strategist',
        command: 'requirements',
        context: 'initial_analysis'
      });
    }

    // Design phase
    if (
      taskKeywords.includes('ui') ||
      taskKeywords.includes('design') ||
      taskKeywords.includes('user')
    ) {
      workflow.push({
        agent: 'Design-Engineer',
        command: 'design',
        context: 'user_experience'
      });
    }

    // Development phase
    if (
      taskKeywords.includes('build') ||
      taskKeywords.includes('develop') ||
      taskKeywords.includes('code')
    ) {
      workflow.push({
        agent: 'Backend-Engineer',
        command: 'implement',
        context: 'development'
      });
    }

    // Security phase
    if (taskKeywords.includes('secure') || taskKeywords.includes('audit')) {
      workflow.push({
        agent: 'Backend-Engineer',
        command: 'secure',
        context: 'security_validation'
      });
    }

    return workflow;
  }

  _estimateStepDuration(command) {
    const durations = {
      requirements: 30,
      prd: 45,
      design: 60,
      figma: 40,
      implement: 90,
      secure: 20,
      analyze: 25
    };

    return durations[command] || 30;
  }

  _getStepPrerequisites(step, previousSteps) {
    const prerequisites = [];

    // Command-specific prerequisites
    if (step.command === 'figma' && !previousSteps.some(s => s.command === 'design')) {
      prerequisites.push('Design planning required');
    }

    if (step.command === 'implement' && !previousSteps.some(s => s.command === 'requirements')) {
      prerequisites.push('Requirements definition required');
    }

    return prerequisites;
  }

  _getStepQualityGates(agent, command) {
    const agentSpec = this.agentSpecializations[agent];
    if (!agentSpec) {return [];}

    return agentSpec.qualityFocus.map(focus => ({
      type: focus,
      agent: agent,
      command: command,
      required: true
    }));
  }

  _loadTeamHistory() {
    const historyFile = path.join(this.teamDir, 'agent-history.json');
    if (fs.existsSync(historyFile)) {
      return JSON.parse(fs.readFileSync(historyFile, 'utf8'));
    }
    return { sessions: [] };
  }

  _analyzeCommandUsage(history) {
    const usage = {};
    const sessions = history.sessions || [];

    sessions.forEach(session => {
      if (session.command) {
        const key = `${session.agent}:${session.command}`;
        usage[key] = (usage[key] || 0) + 1;
      }
    });

    return usage;
  }

  _identifyUsagePatterns(usage) {
    const patterns = {
      mostUsedCommands: [],
      agentPreferences: {},
      collaborationPatterns: []
    };

    // Most used commands
    patterns.mostUsedCommands = Object.entries(usage)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([command, count]) => ({ command, count }));

    // Agent preferences
    Object.entries(usage).forEach(([key, count]) => {
      const [agent, command] = key.split(':');
      if (!patterns.agentPreferences[agent]) {
        patterns.agentPreferences[agent] = [];
      }
      patterns.agentPreferences[agent].push({ command, count });
    });

    return patterns;
  }

  _generatePatternOptimizations(patterns) {
    const suggestions = [];

    // Suggest based on usage patterns
    patterns.mostUsedCommands.forEach(({ command, count }) => {
      if (count > 10) {
        suggestions.push({
          type: 'automation',
          priority: 'medium',
          suggestion: `Consider creating workflow shortcuts for frequently used command: ${command}`,
          metric: `Used ${count} times`
        });
      }
    });

    return suggestions;
  }

  _getTeamStatus() {
    const contextFile = path.join(this.teamDir, 'context.json');
    if (fs.existsSync(contextFile)) {
      return JSON.parse(fs.readFileSync(contextFile, 'utf8'));
    }
    return {};
  }

  _explainRouting(command, agent) {
    const spec = this.agentSpecializations[agent];
    const reasons = [];

    if (spec.primaryCommands.includes(command)) {
      reasons.push(`${command} is a primary command for ${agent}`);
    }

    reasons.push(`${agent} specializes in: ${spec.capabilities.join(', ')}`);

    return reasons.join('. ');
  }

  /**
   * Enhanced Communication Methods
   */

  /**
   * Determine priority level for commands
   */
  _determinePriority(command, args) {
    const urgentCommands = ['urgent', 'block', 'emergency', 'critical'];
    const urgentKeywords = ['urgent', 'emergency', 'critical', 'blocker', 'broken', 'down', 'security', 'vulnerability'];

    // Check command itself
    if (urgentCommands.includes(command)) {
      return 'urgent';
    }

    // Check args for urgent keywords
    const argString = args.join(' ').toLowerCase();
    if (urgentKeywords.some(keyword => argString.includes(keyword))) {
      return 'urgent';
    }

    // High priority commands
    const highPriorityCommands = ['secure', 'scan', 'validate', 'test'];
    if (highPriorityCommands.includes(command)) {
      return 'high';
    }

    return 'normal';
  }

  /**
   * Build rich handoff context with detailed information
   */
  _buildRichHandoffContext(command, args, fromAgent, toAgent, options = {}) {
    const fromSpec = this.agentSpecializations[fromAgent];
    const toSpec = this.agentSpecializations[toAgent];

    const context = {
      command,
      args,
      handoffReason: `Optimal routing from ${fromAgent} to ${toAgent}`,
      fromAgentContext: {
        agent: fromAgent,
        capabilities: fromSpec?.capabilities || [],
        completedWork: options.completedWork || [],
        currentFocus: fromSpec?.qualityFocus || []
      },
      toAgentContext: {
        agent: toAgent,
        requiredCapabilities: toSpec?.capabilities || [],
        expectedActivities: toSpec?.coreActivities || [],
        qaSpecializations: toSpec?.qaSpecializations || []
      },
      preserveContext: {
        projectState: options.projectState || {},
        decisions: options.decisions || [],
        constraints: options.constraints || [],
        stakeholderRequirements: options.stakeholderRequirements || []
      },
      qualityExpectations: {
        fromAgentValidation: fromSpec?.qualityFocus || [],
        toAgentFocus: toSpec?.qualityFocus || [],
        crossValidationRequired: options.crossValidation || false
      }
    };

    // Add conflict signals if any detected
    if (options.conflicts) {
      context.conflicts = options.conflicts;
      context.resolutionNeeded = true;
    }

    return context;
  }

  /**
   * Detect potential conflicts between agents
   */
  _detectAgentConflicts(fromAgent, toAgent, command, args) {
    const conflicts = [];
    const fromSpec = this.agentSpecializations[fromAgent];
    const toSpec = this.agentSpecializations[toAgent];

    // Check for capability overlap conflicts
    const overlappingCapabilities = fromSpec.capabilities.filter(cap =>
      toSpec.capabilities.includes(cap)
    );

    if (overlappingCapabilities.length > 0) {
      conflicts.push({
        type: 'capability_overlap',
        capabilities: overlappingCapabilities,
        risk: 'medium',
        resolution: 'Define clear boundaries and defer to receiving agent'
      });
    }

    // Check for quality focus conflicts
    const qualityConflicts = [];
    if (fromSpec.qualityFocus.includes('user_experience') && toSpec.qualityFocus.includes('performance')) {
      qualityConflicts.push('UX vs Performance trade-offs');
    }
    if (fromSpec.qualityFocus.includes('business_validation') && toSpec.qualityFocus.includes('technical_feasibility')) {
      qualityConflicts.push('Business requirements vs Technical constraints');
    }

    if (qualityConflicts.length > 0) {
      conflicts.push({
        type: 'quality_focus_tension',
        tensions: qualityConflicts,
        risk: 'high',
        resolution: 'Require explicit consensus or escalation'
      });
    }

    // Command-specific conflict detection
    const argString = args.join(' ').toLowerCase();
    if (command === 'implement' && argString.includes('performance') && fromAgent === 'Design-Engineer') {
      conflicts.push({
        type: 'domain_boundary',
        issue: 'Design agent handing off performance optimization',
        risk: 'low',
        resolution: 'Ensure UX requirements are clearly communicated'
      });
    }

    return conflicts;
  }

  /**
   * Generate cross-agent validation workflow
   */
  generateCrossValidation(primaryAgent, command, args, options = {}) {
    const validationWorkflow = {
      primaryAgent,
      command,
      args,
      timestamp: new Date().toISOString(),
      validationSteps: []
    };

    // Get all other agents for cross-validation
    const allAgents = Object.keys(this.agentSpecializations);
    const validatingAgents = allAgents.filter(agent => agent !== primaryAgent);

    validatingAgents.forEach(validatingAgent => {
      const validatorSpec = this.agentSpecializations[validatingAgent];
      const validationStep = {
        agent: validatingAgent,
        validationType: this._getValidationType(validatingAgent, command, args),
        qualityFocus: validatorSpec.qualityFocus,
        expectedChecks: this._getExpectedChecks(validatingAgent, command),
        priority: this._getValidationPriority(validatingAgent, command, args)
      };

      validationWorkflow.validationSteps.push(validationStep);
    });

    // Sort by priority (urgent validations first)
    validationWorkflow.validationSteps.sort((a, b) => {
      const priorityOrder = { 'urgent': 0, 'high': 1, 'medium': 2, 'low': 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    return validationWorkflow;
  }

  /**
   * Get validation type for specific agent
   */
  _getValidationType(agent, command, args) {
    const agentValidations = {
      'Product-Strategist': ['business_validation', 'requirement_alignment', 'stakeholder_impact'],
      'Design-Engineer': ['ux_validation', 'accessibility_check', 'design_consistency'],
      'Backend-Engineer': ['technical_validation', 'security_check', 'performance_impact']
    };

    return agentValidations[agent] || ['general_validation'];
  }

  /**
   * Get expected checks for agent validation
   */
  _getExpectedChecks(agent, command) {
    const checksByAgent = {
      'Product-Strategist': [
        'Business objectives alignment',
        'Stakeholder requirement satisfaction',
        'ROI and impact validation',
        'Compliance and regulatory check'
      ],
      'Design-Engineer': [
        'User experience impact assessment',
        'Design system consistency',
        'Accessibility compliance (WCAG 2.1 AA)',
        'Visual and interaction design validation'
      ],
      'Backend-Engineer': [
        'Technical architecture review',
        'Security vulnerability assessment',
        'Performance and scalability impact',
        'Integration and deployment considerations'
      ]
    };

    return checksByAgent[agent] || ['General quality validation'];
  }

  /**
   * Get validation priority based on agent expertise and command
   */
  _getValidationPriority(agent, command, args) {
    const argString = args.join(' ').toLowerCase();

    // Security-related validations are always urgent
    if (argString.includes('security') || argString.includes('vulnerability')) {
      return agent === 'Backend-Engineer' ? 'urgent' : 'high';
    }

    // Accessibility validations are high priority
    if (argString.includes('accessibility') || argString.includes('a11y')) {
      return agent === 'Design-Engineer' ? 'urgent' : 'medium';
    }

    // Business impact validations for user-facing features
    if (argString.includes('user') || argString.includes('customer')) {
      return agent === 'Product-Strategist' ? 'high' : 'medium';
    }

    // Default priorities based on agent expertise
    const agentPriorities = {
      'secure': { 'Backend-Engineer': 'urgent', 'default': 'medium' },
      'design': { 'Design-Engineer': 'high', 'default': 'low' },
      'requirements': { 'Product-Strategist': 'high', 'default': 'low' }
    };

    const commandPriority = agentPriorities[command];
    if (commandPriority) {
      return commandPriority[agent] || commandPriority.default;
    }

    return 'medium';
  }

  /**
   * Consciousness Integration Methods
   */

  /**
   * Check if consciousness checkpoint should be triggered
   */
  shouldTriggerConsciousnessCheck(command, context, completedWork = []) {
    const consciousnessCheckpoints = {
      'requirements': 'post_requirements',
      'prd': 'post_prd',
      'design': 'post_design',
      'implement': 'post_implement',
      'secure': 'post_security',
      'scan': 'post_security_scan',
      'validate': 'post_validation',
      'checkpoint': 'workflow_completion'
    };

    const trigger = consciousnessCheckpoints[command];
    if (!trigger) {return null;}

    // Determine consciousness command based on context
    const consciousnessCommand = this._getConsciousnessCommand(command, context, trigger);

    return {
      trigger,
      consciousnessCommand,
      context: this._getConsciousnessContext(command, context, trigger),
      purpose: this._getConsciousnessPurpose(command, trigger)
    };
  }

  /**
   * Get appropriate consciousness command for the trigger
   */
  _getConsciousnessCommand(command, context, trigger) {
    const commandMapping = {
      'post_requirements': 'conscious:analyze',
      'post_prd': 'conscious:reason',
      'post_design': 'conscious:analyze',
      'post_implement': 'conscious:wisdom',
      'post_security_scan': 'conscious:analyze',
      'post_compliance': 'conscious:reason',
      'workflow_completion': 'conscious:analyze'
    };

    return commandMapping[trigger] || 'conscious:wisdom';
  }

  /**
   * Get consciousness context for reflection
   */
  _getConsciousnessContext(command, context, trigger) {
    const contextMapping = {
      'post_requirements': 'requirements_reflection',
      'post_prd': 'purpose_alignment',
      'post_design': 'design_principles',
      'post_implement': 'implementation_guidance',
      'post_security_scan': 'ethical_technology',
      'post_compliance': 'protection_principles',
      'workflow_completion': 'final_reflection'
    };

    return contextMapping[trigger] || 'consciousness_check';
  }

  /**
   * Get consciousness purpose for the check
   */
  _getConsciousnessPurpose(command, trigger) {
    const purposeMapping = {
      'post_requirements': 'Reflect on Unity Development - ensuring requirements serve interconnected stakeholder needs',
      'post_prd': 'Align with Purpose-Driven Development - validating meaningful work toward higher elevation',
      'post_design': 'Apply Pure Engineering principles - ensuring clean, natural, accessible design',
      'post_implement': 'Validate Ethical Technology - ensuring implementation serves universal good',
      'post_security_scan': 'Strengthen Ethical Technology - protecting users with conscious security',
      'post_compliance': 'Ensure Purpose-Driven compliance - legal frameworks serving human elevation',
      'workflow_completion': 'Final Four Pillars reflection - unity, ethics, purity, purpose achieved'
    };

    return purposeMapping[trigger] || 'Consciousness check to ensure alignment with higher purpose';
  }

  /**
   * Generate consciousness workflow integration
   */
  generateConsciousnessIntegration(workflowType, currentStep) {
    const workflow = this.commandWorkflows[workflowType];
    if (!workflow) {return null;}

    const consciousnessSteps = workflow.filter(step => step.agent === 'consciousness');
    const upcomingConsciousnessSteps = consciousnessSteps.filter((step, index) => {
      const stepIndex = workflow.indexOf(step);
      return stepIndex > currentStep;
    });

    return {
      nextConsciousnessCheck: upcomingConsciousnessSteps[0] || null,
      allConsciousnessSteps: consciousnessSteps,
      integrationActive: consciousnessSteps.length > 0
    };
  }
}

// Export as both class and instance for compatibility
const optimizerInstance = new BumbaCommandOptimizer();

module.exports = {
  BumbaCommandOptimizer,
  
  // Export instance methods directly
  optimize: (command, args, context) => optimizerInstance.optimizeCommand(command, args, context),
  analyzeCommand: (command, args, context) => optimizerInstance.routeCommand(command, args, null, context),
  suggestOptimizations: (command, args, context) => optimizerInstance._identifyOptimizations(command, args, context),
  
  // Export full instance for backward compatibility
  getInstance: () => optimizerInstance
};

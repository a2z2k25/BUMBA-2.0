/**
 * BUMBA Command Classifier
 * Intelligently analyzes commands to determine department routing and specialist needs
 */

const { logger } = require('../logging/bumba-logger');

class CommandClassifier {
  constructor() {
    // Command to department mapping with patterns
    this.commandPatterns = {
      product: {
        commands: ['prd', 'requirements', 'roadmap', 'research-market', 'analyze-business', 
                   'docs-business', 'improve-strategy', 'executive', 'leadership'],
        keywords: ['strategy', 'business', 'market', 'requirements', 'roadmap', 'prd'],
        specialists: ['product-strategist', 'market-researcher', 'business-analyst', 'technical-writer']
      },
      design: {
        commands: ['design', 'figma', 'ui', 'visual', 'research-design', 'analyze-ux', 
                   'docs-design', 'improve-design', 'accessibility'],
        keywords: ['design', 'ui', 'ux', 'interface', 'component', 'visual', 'figma'],
        specialists: ['design-engineer', 'ui-designer', 'ux-researcher', 'accessibility-expert']
      },
      backend: {
        commands: ['api', 'secure', 'scan', 'analyze', 'research-technical', 'docs-technical',
                   'improve-performance', 'database', 'devops', 'publish'],
        keywords: ['api', 'backend', 'database', 'security', 'performance', 'devops'],
        specialists: ['backend-engineer', 'api-designer', 'security-expert', 'database-architect']
      },
      collaboration: {
        commands: ['implement', 'implement-agents', 'implement-strategy', 'implement-design', 
                   'implement-technical', 'team', 'collaborate', 'chain', 'workflow', 'orchestrate'],
        keywords: ['implement', 'team', 'collaborate', 'workflow', 'orchestrate'],
        specialists: [] // Will combine from multiple departments
      },
      consciousness: {
        commands: ['conscious-analyze', 'conscious-reason', 'conscious-wisdom', 
                   'conscious-purpose', 'conscious-implement'],
        keywords: ['conscious', 'wisdom', 'purpose', 'philosophy'],
        specialists: ['consciousness-guide', 'wisdom-keeper']
      },
      system: {
        commands: ['status', 'health', 'performance', 'resources', 'optimize', 'mode', 
                   'benchmark', 'monitor', 'help', 'menu', 'settings'],
        keywords: ['status', 'health', 'system', 'monitor', 'performance'],
        specialists: ['system-monitor', 'performance-analyst']
      }
    };

    // Action type patterns
    this.actionPatterns = {
      create: ['prd', 'design', 'ui', 'api', 'database', 'roadmap', 'requirements'],
      analyze: ['analyze', 'analyze-ux', 'analyze-business', 'scan', 'research', 'conscious-analyze'],
      implement: ['implement', 'orchestrate', 'workflow', 'chain', 'collaborate'],
      improve: ['improve', 'optimize', 'refactor', 'enhance'],
      document: ['docs', 'prd', 'requirements', 'roadmap'],
      monitor: ['status', 'health', 'performance', 'monitor', 'benchmark']
    };

    // Output type determination
    this.outputTypes = {
      document: ['prd', 'requirements', 'roadmap', 'docs'],
      code: ['api', 'ui', 'database', 'implement'],
      analysis: ['analyze', 'research', 'scan', 'benchmark'],
      interactive: ['collaborate', 'team', 'workflow'],
      status: ['status', 'health', 'monitor', 'performance']
    };
  }

  /**
   * Classify a command to determine routing and handling
   */
  async classify(command, args, context = {}) {
    logger.info(`🔍 Classifying command: ${command} with args:`, args);

    const classification = {
      command,
      args,
      context,
      timestamp: new Date().toISOString(),
      department: this.identifyDepartment(command, args),
      action: this.identifyAction(command),
      outputType: this.identifyOutputType(command),
      specialists: [],
      complexity: this.assessComplexity(command, args),
      requiresCollaboration: false,
      intent: this.extractIntent(command, args),
      deliverables: this.expectedDeliverables(command, args)
    };

    // Determine if multi-department collaboration is needed
    if (this.requiresCollaboration(command)) {
      classification.requiresCollaboration = true;
      classification.departments = this.getCollaboratingDepartments(command);
      classification.specialists = this.getCombinedSpecialists(classification.departments);
    } else {
      classification.specialists = this.getSpecialistsForCommand(command, classification.department);
    }

    // Add contextual adjustments
    classification.contextualRequirements = this.analyzeContextualNeeds(args, context);
    
    logger.info(`✅ Classification complete:`, {
      department: classification.department,
      action: classification.action,
      specialists: classification.specialists.length,
      complexity: classification.complexity
    });

    return classification;
  }

  /**
   * Identify primary department for command
   */
  identifyDepartment(command, args) {
    // Direct command matching
    for (const [dept, config] of Object.entries(this.commandPatterns)) {
      if (config.commands.includes(command)) {
        return dept;
      }
    }

    // Keyword matching in args
    const argString = args.join(' ').toLowerCase();
    for (const [dept, config] of Object.entries(this.commandPatterns)) {
      for (const keyword of config.keywords) {
        if (argString.includes(keyword)) {
          return dept;
        }
      }
    }

    // Default routing based on command prefix
    if (command.startsWith('implement')) return 'collaboration';
    if (command.includes('design') || command.includes('ui')) return 'design';
    if (command.includes('api') || command.includes('backend')) return 'backend';
    if (command.includes('strategy') || command.includes('business')) return 'product';
    
    return 'system'; // Default fallback
  }

  /**
   * Identify action type
   */
  identifyAction(command) {
    for (const [action, commands] of Object.entries(this.actionPatterns)) {
      if (commands.some(cmd => command.includes(cmd))) {
        return action;
      }
    }
    return 'execute'; // Generic action
  }

  /**
   * Identify expected output type
   */
  identifyOutputType(command) {
    for (const [outputType, commands] of Object.entries(this.outputTypes)) {
      if (commands.some(cmd => command.includes(cmd))) {
        return outputType;
      }
    }
    return 'response'; // Generic response
  }

  /**
   * Assess command complexity
   */
  assessComplexity(command, args) {
    let complexity = 0.3; // Base complexity

    // Increase for collaboration commands
    if (this.requiresCollaboration(command)) {
      complexity += 0.3;
    }

    // Increase for creation commands
    if (this.actionPatterns.create.includes(command)) {
      complexity += 0.2;
    }

    // Increase based on arg complexity
    if (args.length > 3) complexity += 0.1;
    if (args.join(' ').length > 50) complexity += 0.1;

    return Math.min(complexity, 1.0);
  }

  /**
   * Check if command requires multi-department collaboration
   */
  requiresCollaboration(command) {
    return this.commandPatterns.collaboration.commands.includes(command) ||
           command.includes('implement') ||
           command.includes('orchestrate') ||
           command.includes('workflow');
  }

  /**
   * Get departments involved in collaboration
   */
  getCollaboratingDepartments(command) {
    if (command === 'implement-strategy') return ['product'];
    if (command === 'implement-design') return ['design'];
    if (command === 'implement-technical') return ['backend'];
    if (command.includes('implement')) return ['product', 'design', 'backend'];
    if (command === 'orchestrate') return ['product', 'design', 'backend'];
    return ['product', 'backend']; // Default collaboration
  }

  /**
   * Get specialists for a specific command and department
   */
  getSpecialistsForCommand(command, department) {
    const deptConfig = this.commandPatterns[department];
    if (!deptConfig) return [];

    // Start with base specialists
    let specialists = [...deptConfig.specialists];

    // Add command-specific specialists
    if (command === 'prd') {
      specialists.push('requirements-analyst', 'documentation-specialist');
    } else if (command === 'api') {
      specialists.push('api-designer', 'integration-specialist');
    } else if (command === 'ui') {
      specialists.push('component-engineer', 'style-architect');
    } else if (command === 'secure') {
      specialists.push('security-auditor', 'penetration-tester');
    }

    return [...new Set(specialists)]; // Remove duplicates
  }

  /**
   * Get combined specialists for multi-department collaboration
   */
  getCombinedSpecialists(departments) {
    let specialists = [];
    
    for (const dept of departments) {
      const deptConfig = this.commandPatterns[dept];
      if (deptConfig) {
        specialists = specialists.concat(deptConfig.specialists);
      }
    }

    // Add collaboration specialists
    specialists.push('integration-specialist', 'project-coordinator');

    return [...new Set(specialists)];
  }

  /**
   * Extract user intent from command and args
   */
  extractIntent(command, args) {
    const argString = args.join(' ').toLowerCase();
    
    // Determine specific intent
    if (command === 'prd') {
      return {
        action: 'create',
        target: 'product requirements document',
        scope: argString || 'general feature',
        detail: 'comprehensive'
      };
    } else if (command === 'api') {
      return {
        action: 'develop',
        target: 'REST API',
        scope: argString || 'general endpoint',
        detail: 'with routes and models'
      };
    } else if (command === 'analyze-ux') {
      return {
        action: 'analyze',
        target: 'user experience',
        scope: argString || 'current interface',
        detail: 'accessibility and usability'
      };
    }

    // Generic intent
    return {
      action: this.identifyAction(command),
      target: argString || command,
      scope: 'as specified',
      detail: 'standard'
    };
  }

  /**
   * Determine expected deliverables
   */
  expectedDeliverables(command, args) {
    const deliverables = [];

    if (command === 'prd') {
      deliverables.push('PRD document', 'requirements list', 'success metrics');
    } else if (command === 'api') {
      deliverables.push('API routes', 'data models', 'documentation');
    } else if (command === 'ui') {
      deliverables.push('component code', 'styles', 'usage examples');
    } else if (command.includes('analyze')) {
      deliverables.push('analysis report', 'recommendations', 'metrics');
    } else if (command.includes('implement')) {
      deliverables.push('working implementation', 'tests', 'documentation');
    }

    return deliverables;
  }

  /**
   * Analyze contextual needs based on args and context
   */
  analyzeContextualNeeds(args, context) {
    const needs = {
      domain: this.extractDomain(args),
      technology: this.extractTechnology(args),
      audience: this.extractAudience(args),
      constraints: this.extractConstraints(args),
      priority: this.extractPriority(args)
    };

    // Add context-based needs
    if (context.projectType) {
      needs.projectType = context.projectType;
    }
    if (context.existingStack) {
      needs.compatibility = context.existingStack;
    }

    return needs;
  }

  /**
   * Extract domain from arguments
   */
  extractDomain(args) {
    const argString = args.join(' ').toLowerCase();
    const domains = ['e-commerce', 'social', 'fintech', 'healthcare', 'education', 'saas'];
    
    for (const domain of domains) {
      if (argString.includes(domain)) {
        return domain;
      }
    }
    
    return 'general';
  }

  /**
   * Extract technology preferences
   */
  extractTechnology(args) {
    const argString = args.join(' ').toLowerCase();
    const tech = [];

    // Frontend
    if (argString.includes('react')) tech.push('react');
    if (argString.includes('vue')) tech.push('vue');
    if (argString.includes('angular')) tech.push('angular');
    
    // Backend
    if (argString.includes('node')) tech.push('node');
    if (argString.includes('python')) tech.push('python');
    if (argString.includes('java')) tech.push('java');
    
    // Database
    if (argString.includes('postgres')) tech.push('postgresql');
    if (argString.includes('mongo')) tech.push('mongodb');
    if (argString.includes('mysql')) tech.push('mysql');

    return tech;
  }

  /**
   * Extract target audience
   */
  extractAudience(args) {
    const argString = args.join(' ').toLowerCase();
    
    if (argString.includes('enterprise')) return 'enterprise';
    if (argString.includes('startup')) return 'startup';
    if (argString.includes('consumer')) return 'consumer';
    if (argString.includes('b2b')) return 'b2b';
    if (argString.includes('b2c')) return 'b2c';
    
    return 'general';
  }

  /**
   * Extract constraints
   */
  extractConstraints(args) {
    const constraints = [];
    const argString = args.join(' ').toLowerCase();
    
    if (argString.includes('fast') || argString.includes('quick')) {
      constraints.push('time-sensitive');
    }
    if (argString.includes('secure') || argString.includes('security')) {
      constraints.push('high-security');
    }
    if (argString.includes('scalable') || argString.includes('scale')) {
      constraints.push('scalability-required');
    }
    
    return constraints;
  }

  /**
   * Extract priority level
   */
  extractPriority(args) {
    const argString = args.join(' ').toLowerCase();
    
    if (argString.includes('urgent') || argString.includes('critical')) return 'critical';
    if (argString.includes('high')) return 'high';
    if (argString.includes('low')) return 'low';
    
    return 'normal';
  }
}

// Singleton instance
let instance = null;

function getInstance() {
  if (!instance) {
    instance = new CommandClassifier();
  }
  return instance;
}

module.exports = {
  CommandClassifier,
  getInstance
};
/**
 * BUMBA Task Preparer
 * Prepares tasks for Claude execution with context
 */

class TaskPreparer {
  constructor() {
    this.agentMap = {
      // Keywords to agent mapping
      auth: ['BackendEngineer', 'SecuritySpecialist'],
      authentication: ['BackendEngineer', 'SecuritySpecialist'],
      login: ['BackendEngineer', 'DesignEngineer', 'SecuritySpecialist'],
      ui: ['DesignEngineer', 'FrontendDeveloper'],
      design: ['DesignEngineer', 'UXSpecialist'],
      api: ['BackendEngineer', 'APIArchitect'],
      database: ['BackendEngineer', 'DatabaseArchitect'],
      test: ['QualityAssurance', 'TestEngineer'],
      performance: ['PerformanceEngineer', 'BackendEngineer'],
      security: ['SecuritySpecialist', 'BackendEngineer'],
      mobile: ['MobileEngineer', 'DesignEngineer'],
      deploy: ['DevOpsEngineer', 'BackendEngineer'],
      data: ['DataEngineer', 'BackendEngineer'],
      analytics: ['DataEngineer', 'FrontendDeveloper']
    };
  }

  /**
   * Parse requirements from description
   * @param {string} description Task description
   * @returns {Object} Parsed requirements
   */
  parseRequirements(description) {
    const requirements = {
      features: [],
      constraints: [],
      technologies: [],
      priority: 'normal'
    };
    
    const lower = description.toLowerCase();
    
    // Extract features
    if (lower.includes('crud')) {
      requirements.features.push('Create, Read, Update, Delete operations');
    }
    if (lower.includes('real-time') || lower.includes('realtime')) {
      requirements.features.push('Real-time updates');
      requirements.technologies.push('WebSockets');
    }
    if (lower.includes('responsive')) {
      requirements.features.push('Responsive design');
    }
    if (lower.includes('secure') || lower.includes('security')) {
      requirements.features.push('Security implementation');
      requirements.constraints.push('Security best practices required');
    }
    if (lower.includes('test') || lower.includes('testing')) {
      requirements.features.push('Comprehensive testing');
    }
    
    // Extract priority
    if (lower.includes('urgent') || lower.includes('asap') || lower.includes('critical')) {
      requirements.priority = 'high';
    } else if (lower.includes('when possible') || lower.includes('low priority')) {
      requirements.priority = 'low';
    }
    
    // Extract technology hints
    if (lower.includes('react')) requirements.technologies.push('React');
    if (lower.includes('vue')) requirements.technologies.push('Vue');
    if (lower.includes('angular')) requirements.technologies.push('Angular');
    if (lower.includes('node')) requirements.technologies.push('Node.js');
    if (lower.includes('python')) requirements.technologies.push('Python');
    if (lower.includes('docker')) requirements.technologies.push('Docker');
    if (lower.includes('kubernetes') || lower.includes('k8s')) {
      requirements.technologies.push('Kubernetes');
    }
    
    return requirements;
  }

  /**
   * Determine which agents to use
   * @param {string} description Task description
   * @returns {Array} List of agent names
   */
  determineAgents(description) {
    const agents = new Set(['ProductStrategist']); // Always include strategist
    const lower = description.toLowerCase();
    
    // Check for keywords
    Object.entries(this.agentMap).forEach(([keyword, agentList]) => {
      if (lower.includes(keyword)) {
        agentList.forEach(agent => agents.add(agent));
      }
    });
    
    // Default agents if none specifically identified
    if (agents.size === 1) {
      agents.add('BackendEngineer');
      agents.add('DesignEngineer');
      agents.add('QualityAssurance');
    }
    
    return Array.from(agents);
  }

  /**
   * Estimate implementation complexity
   * @param {string} description Task description
   * @returns {Object} Complexity estimate
   */
  estimateComplexity(description) {
    let score = 1; // Base complexity
    const factors = [];
    const lower = description.toLowerCase();
    
    // Complexity factors
    if (lower.includes('simple') || lower.includes('basic')) {
      score *= 0.5;
      factors.push('Simple implementation');
    }
    if (lower.includes('complex') || lower.includes('advanced')) {
      score *= 2;
      factors.push('Complex requirements');
    }
    if (lower.includes('integration')) {
      score *= 1.5;
      factors.push('External integration');
    }
    if (lower.includes('migration')) {
      score *= 2;
      factors.push('Data migration');
    }
    if (lower.includes('real-time') || lower.includes('realtime')) {
      score *= 1.5;
      factors.push('Real-time features');
    }
    if (lower.includes('security')) {
      score *= 1.3;
      factors.push('Security requirements');
    }
    if (lower.includes('performance')) {
      score *= 1.3;
      factors.push('Performance optimization');
    }
    
    // Count feature mentions
    const features = lower.split(/[,;]/).length;
    if (features > 3) {
      score *= 1.5;
      factors.push('Multiple features');
    }
    
    let level;
    if (score < 0.7) level = 'trivial';
    else if (score < 1.3) level = 'simple';
    else if (score < 2) level = 'moderate';
    else if (score < 3) level = 'complex';
    else level = 'very complex';
    
    return {
      score: Math.round(score * 10) / 10,
      level,
      factors,
      estimatedHours: Math.ceil(score * 2)
    };
  }

  /**
   * Generate implementation plan
   * @param {string} description Task description
   * @param {Object} context Project context
   * @returns {Object} Implementation plan
   */
  generatePlan(description, context) {
    const requirements = this.parseRequirements(description);
    const complexity = this.estimateComplexity(description);
    const agents = this.determineAgents(description);
    
    const phases = [];
    
    // Planning phase
    phases.push({
      name: 'Strategic Planning',
      agent: 'ProductStrategist',
      duration: '15 minutes',
      tasks: [
        'Analyze requirements',
        'Define success criteria',
        'Create technical specification'
      ]
    });
    
    // Implementation phases based on agents
    if (agents.includes('BackendEngineer')) {
      phases.push({
        name: 'Backend Development',
        agent: 'BackendEngineer',
        duration: `${Math.ceil(complexity.estimatedHours * 0.4)} hours`,
        tasks: [
          'Create API endpoints',
          'Implement business logic',
          'Set up database models',
          'Add validation'
        ]
      });
    }
    
    if (agents.includes('DesignEngineer')) {
      phases.push({
        name: 'Frontend Development',
        agent: 'DesignEngineer',
        duration: `${Math.ceil(complexity.estimatedHours * 0.3)} hours`,
        tasks: [
          'Create UI components',
          'Implement user interactions',
          'Add responsive design',
          'Connect to backend'
        ]
      });
    }
    
    // Testing phase
    phases.push({
      name: 'Quality Assurance',
      agent: 'QualityAssurance',
      duration: `${Math.ceil(complexity.estimatedHours * 0.2)} hours`,
      tasks: [
        'Write unit tests',
        'Perform integration testing',
        'Security validation',
        'Performance testing'
      ]
    });
    
    return {
      description,
      requirements,
      complexity,
      agents,
      phases,
      totalEstimate: `${complexity.estimatedHours} hours`,
      context: {
        projectType: context.type,
        techStack: context.stack
      }
    };
  }

  /**
   * Create execution strategy
   * @param {string} description Task description
   * @param {Array} agents Selected agents
   * @returns {Object} Execution strategy
   */
  createStrategy(description, agents) {
    return {
      parallel: agents.length > 2,
      coordination: agents.length > 3 ? 'orchestrator' : 'sequential',
      checkpoints: [
        'Requirements validated',
        'Implementation complete',
        'Tests passing',
        'Code reviewed'
      ],
      rollback: {
        enabled: true,
        trigger: 'Test failure or security issue'
      }
    };
  }
}

module.exports = TaskPreparer;
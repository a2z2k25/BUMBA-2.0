/**
 * BUMBA Departments Configuration Module
 */

module.exports = {
  load(customDepartments = {}) {
    return {
      'product-strategist': {
        name: 'Product Strategy Department',
        manager: 'ProductStrategistManager',
        capabilities: [
          'market-analysis',
          'product-planning',
          'strategy-development',
          'roadmap-creation',
          'metrics-definition',
          'competitive-analysis',
          'user-research',
          'business-modeling'
        ],
        specialists: [
          'market-research-specialist',
          'business-analyst',
          'product-manager',
          'competitive-analyst',
          'quant-analyst',
          'risk-manager'
        ],
        priority: 1,
        executiveMode: true,
        ...customDepartments['product-strategist']
      },
      
      'design-engineer': {
        name: 'Design Engineering Department',
        manager: 'DesignEngineerManager',
        capabilities: [
          'ui-design',
          'ux-design',
          'prototyping',
          'design-systems',
          'component-design',
          'user-research',
          'accessibility',
          'responsive-design',
          'animation',
          'figma-integration'
        ],
        specialists: [
          'ui-designer',
          'ux-researcher',
          'frontend-developer',
          'design-system-architect',
          'accessibility-specialist',
          'react-specialist',
          'vue-specialist',
          'angular-specialist'
        ],
        priority: 2,
        tools: ['figma', 'sketch', 'adobe-xd'],
        ...customDepartments['design-engineer']
      },
      
      'backend-engineer': {
        name: 'Backend Engineering Department',
        manager: 'BackendEngineerManager',
        capabilities: [
          'api-development',
          'database-design',
          'system-architecture',
          'security-implementation',
          'performance-optimization',
          'microservices',
          'cloud-infrastructure',
          'devops',
          'testing',
          'monitoring'
        ],
        specialists: [
          'backend-architect',
          'api-architect',
          'database-admin',
          'security-specialist',
          'devops-engineer',
          'cloud-architect',
          'sre-specialist',
          'performance-specialist'
        ],
        priority: 1,
        technologies: [
          'nodejs',
          'python',
          'java',
          'golang',
          'postgresql',
          'mongodb',
          'redis',
          'docker',
          'kubernetes'
        ],
        ...customDepartments['backend-engineer']
      },
      
      // Optional departments
      'data-science': {
        name: 'Data Science Department',
        manager: 'DataScienceManager',
        capabilities: [
          'data-analysis',
          'machine-learning',
          'predictive-modeling',
          'data-visualization',
          'statistical-analysis'
        ],
        specialists: [
          'data-scientist',
          'ml-engineer',
          'data-analyst',
          'ai-researcher'
        ],
        priority: 3,
        optional: true,
        ...customDepartments['data-science']
      },
      
      'quality-assurance': {
        name: 'Quality Assurance Department',
        manager: 'QAManager',
        capabilities: [
          'test-planning',
          'test-automation',
          'performance-testing',
          'security-testing',
          'user-acceptance-testing'
        ],
        specialists: [
          'qa-engineer',
          'test-automation-engineer',
          'performance-tester',
          'security-tester'
        ],
        priority: 3,
        optional: true,
        ...customDepartments['quality-assurance']
      },
      
      // Department coordination settings
      coordination: {
        enableTerritoryManagement: true,
        enableConflictResolution: true,
        enablePairingSystem: true,
        enableRotation: false,
        maxConcurrentDepartments: 3,
        collaborationThreshold: 0.7,
        ...customDepartments.coordination
      },
      
      // Custom departments
      ...Object.keys(customDepartments)
        .filter(key => !['product-strategist', 'design-engineer', 'backend-engineer', 'data-science', 'quality-assurance', 'coordination'].includes(key))
        .reduce((acc, key) => {
          acc[key] = customDepartments[key];
          return acc;
        }, {})
    };
  }
};
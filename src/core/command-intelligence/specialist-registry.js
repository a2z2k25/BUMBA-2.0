/**
 * BUMBA Specialist Registry
 * Maps commands to required specialists for intelligent processing
 */

const { logger } = require('../logging/bumba-logger');

class SpecialistRegistry {
  constructor() {
    this.registry = new Map();
    this.initializeRegistry();
  }

  initializeRegistry() {
    // Product/Strategy Specialists
    this.registry.set('prd', ['requirements-analyst', 'market-researcher', 'technical-writer']);
    this.registry.set('requirements', ['requirements-analyst', 'stakeholder-comms']);
    this.registry.set('roadmap', ['project-manager', 'product-owner']);
    this.registry.set('research-market', ['market-researcher', 'competitive-analyst']);
    this.registry.set('analyze-business', ['business-analyst', 'roi-analyst']);
    
    // Design Specialists
    this.registry.set('design', ['ui-designer', 'ux-researcher', 'visual-designer']);
    this.registry.set('ui', ['ui-designer', 'frontend-architect']);
    this.registry.set('figma', ['ui-designer', 'visual-designer']);
    this.registry.set('analyze-ux', ['ux-researcher', 'usability-tester']);
    this.registry.set('component', ['frontend-architect', 'ui-designer']);
    
    // Backend Specialists
    this.registry.set('api', ['api-architect', 'backend-architect']);
    this.registry.set('database', ['database-architect', 'data-modeler']);
    this.registry.set('secure', ['security-engineer', 'penetration-tester']);
    this.registry.set('infrastructure', ['devops-engineer', 'cloud-architect']);
    this.registry.set('deploy', ['devops-engineer', 'release-manager']);
    
    // Complex Multi-Specialist Commands
    this.registry.set('implement', [
      'product-owner',
      'technical-architect',
      'ui-designer',
      'backend-architect',
      'devops-engineer'
    ]);
  }

  /**
   * Get required specialists for a command
   */
  getSpecialistsForCommand(command) {
    return this.registry.get(command) || [];
  }

  /**
   * Analyze context to determine additional specialists
   */
  analyzeContextForSpecialists(command, args, context) {
    const specialists = new Set(this.getSpecialistsForCommand(command));
    const fullText = `${command} ${args.join(' ')}`.toLowerCase();
    
    // Add specialists based on keywords
    if (fullText.includes('mobile')) {
      specialists.add('mobile-developer');
    }
    if (fullText.includes('performance')) {
      specialists.add('performance-engineer');
    }
    if (fullText.includes('security') || fullText.includes('auth')) {
      specialists.add('security-engineer');
    }
    if (fullText.includes('data') || fullText.includes('analytics')) {
      specialists.add('data-analyst');
    }
    if (fullText.includes('test')) {
      specialists.add('qa-engineer');
    }
    
    return Array.from(specialists);
  }

  /**
   * Get specialist expertise level for command
   */
  getSpecialistPriority(specialist, command) {
    const priorities = {
      'requirements-analyst': { prd: 10, requirements: 10, default: 5 },
      'ui-designer': { design: 10, ui: 10, figma: 9, default: 5 },
      'backend-architect': { api: 10, database: 8, default: 5 },
      'security-engineer': { secure: 10, scan: 10, default: 7 }
    };
    
    const specialistPriority = priorities[specialist];
    if (!specialistPriority) return 5;
    
    return specialistPriority[command] || specialistPriority.default || 5;
  }
}

// Singleton instance
let instance = null;

module.exports = {
  SpecialistRegistry,
  getInstance: () => {
    if (!instance) {
      instance = new SpecialistRegistry();
    }
    return instance;
  }
};
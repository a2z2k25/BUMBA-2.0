/**
 * BUMBA Specialist Selector
 * Intelligently selects and activates specialists based on command context
 */

const { logger } = require('../logging/bumba-logger');
const { getInstance: getRegistry } = require('./specialist-registry');

class SpecialistSelector {
  constructor() {
    this.registry = getRegistry();
    this.activeSpecialists = new Map();
    this.specialistPool = new Map();
  }

  /**
   * Select specialists for a command
   */
  async selectSpecialists(command, args, context) {
    logger.info(`🎯 Selecting specialists for: ${command}`);
    
    // Get base specialists from registry
    const requiredSpecialists = this.registry.analyzeContextForSpecialists(
      command, 
      args, 
      context
    );
    
    // Analyze complexity to determine specialist count
    const complexity = this.analyzeComplexity(command, args);
    const maxSpecialists = Math.min(requiredSpecialists.length, Math.ceil(complexity * 5));
    
    // Sort by priority and select top specialists
    const prioritized = requiredSpecialists
      .map(specialist => ({
        type: specialist,
        priority: this.registry.getSpecialistPriority(specialist, command)
      }))
      .sort((a, b) => b.priority - a.priority)
      .slice(0, maxSpecialists);
    
    logger.info(`📋 Selected ${prioritized.length} specialists:`, 
      prioritized.map(s => s.type).join(', '));
    
    return prioritized;
  }

  /**
   * Activate a specialist for task execution
   */
  async activateSpecialist(specialistType, department, context) {
    logger.info(`🚀 Activating specialist: ${specialistType}`);
    
    // Check if specialist is already active
    if (this.activeSpecialists.has(specialistType)) {
      return this.activeSpecialists.get(specialistType);
    }
    
    // Create specialist instance
    const specialist = {
      id: `${specialistType}_${Date.now()}`,
      type: specialistType,
      department,
      status: 'active',
      activatedAt: new Date().toISOString(),
      context,
      capabilities: this.getSpecialistCapabilities(specialistType)
    };
    
    this.activeSpecialists.set(specialistType, specialist);
    return specialist;
  }

  /**
   * Analyze command complexity
   */
  analyzeComplexity(command, args) {
    let complexity = 0.3; // Base complexity
    
    // Command type complexity
    const complexCommands = ['implement', 'orchestrate', 'analyze', 'design'];
    if (complexCommands.includes(command)) {
      complexity += 0.3;
    }
    
    // Argument complexity
    const argText = args.join(' ');
    if (argText.length > 50) complexity += 0.2;
    if (argText.includes('complex') || argText.includes('advanced')) complexity += 0.2;
    if (argText.includes('integrate') || argText.includes('migration')) complexity += 0.2;
    
    return Math.min(complexity, 1.0);
  }

  /**
   * Get specialist capabilities
   */
  getSpecialistCapabilities(specialistType) {
    const capabilities = {
      'requirements-analyst': ['requirement-extraction', 'stakeholder-analysis', 'acceptance-criteria'],
      'ui-designer': ['visual-design', 'component-design', 'user-flow'],
      'backend-architect': ['api-design', 'system-architecture', 'scalability-planning'],
      'security-engineer': ['threat-modeling', 'vulnerability-assessment', 'security-protocols'],
      'market-researcher': ['competitor-analysis', 'market-trends', 'user-research'],
      'devops-engineer': ['ci-cd', 'infrastructure-as-code', 'deployment-strategies']
    };
    
    return capabilities[specialistType] || ['general-analysis'];
  }

  /**
   * Deactivate specialists after task completion
   */
  deactivateSpecialists(specialistIds) {
    for (const id of specialistIds) {
      const specialist = Array.from(this.activeSpecialists.values())
        .find(s => s.id === id);
      
      if (specialist) {
        this.activeSpecialists.delete(specialist.type);
        logger.info(`🔻 Deactivated specialist: ${specialist.type}`);
      }
    }
  }

  /**
   * Get active specialist count
   */
  getActiveCount() {
    return this.activeSpecialists.size;
  }
}

// Singleton instance
let instance = null;

module.exports = {
  SpecialistSelector,
  getInstance: () => {
    if (!instance) {
      instance = new SpecialistSelector();
    }
    return instance;
  }
};
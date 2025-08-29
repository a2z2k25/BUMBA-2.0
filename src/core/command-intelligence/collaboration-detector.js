/**
 * BUMBA Collaboration Detector
 * Detects when commands require multi-department collaboration
 */

const { logger } = require('../logging/bumba-logger');

class CollaborationDetector {
  constructor() {
    // Commands that always require collaboration
    this.collaborationCommands = [
      'implement',
      'implement-agents', 
      'implement-strategy',
      'implement-design',
      'implement-technical',
      'orchestrate',
      'workflow',
      'chain',
      'collaborate'
    ];
    
    // Keywords that suggest collaboration needed
    this.collaborationKeywords = [
      'full-stack',
      'end-to-end',
      'integrate',
      'cross-platform',
      'multi-tier',
      'microservices',
      'deployment pipeline'
    ];
  }

  /**
   * Determine if command requires collaboration
   */
  requiresCollaboration(command, args = [], context = {}) {
    logger.info(`🔍 Checking collaboration requirements for: ${command}`);
    
    // Check explicit collaboration commands
    if (this.collaborationCommands.includes(command)) {
      logger.info(`✅ Command "${command}" requires collaboration`);
      return true;
    }
    
    // Check for collaboration keywords in arguments
    const argText = args.join(' ').toLowerCase();
    for (const keyword of this.collaborationKeywords) {
      if (argText.includes(keyword)) {
        logger.info(`✅ Keyword "${keyword}" triggers collaboration`);
        return true;
      }
    }
    
    // Check context flags
    if (context.requireCollaboration || context.multiDepartment) {
      logger.info(`✅ Context flag requires collaboration`);
      return true;
    }
    
    // Analyze complexity - high complexity may need collaboration
    const complexity = this.analyzeComplexity(command, args);
    if (complexity > 0.7) {
      logger.info(`✅ High complexity (${complexity}) requires collaboration`);
      return true;
    }
    
    return false;
  }

  /**
   * Determine which departments should collaborate
   */
  getDepartmentsForCollaboration(command, args = [], context = {}) {
    const departments = new Set();
    
    // Base departments for command
    const baseDepts = this.getBaseDepartments(command);
    baseDepts.forEach(dept => departments.add(dept));
    
    // Add departments based on keywords
    const argText = args.join(' ').toLowerCase();
    
    if (argText.includes('ui') || argText.includes('design') || argText.includes('frontend')) {
      departments.add('design');
    }
    
    if (argText.includes('api') || argText.includes('backend') || argText.includes('database')) {
      departments.add('backend');
    }
    
    if (argText.includes('requirement') || argText.includes('strategy') || argText.includes('roadmap')) {
      departments.add('product');
    }
    
    if (argText.includes('test') || argText.includes('qa') || argText.includes('quality')) {
      departments.add('testing');
    }
    
    // Ensure at least 2 departments for collaboration
    if (departments.size < 2) {
      // Add complementary departments
      if (departments.has('design')) departments.add('backend');
      else if (departments.has('backend')) departments.add('design');
      else {
        departments.add('product');
        departments.add('backend');
      }
    }
    
    return Array.from(departments);
  }

  /**
   * Get base departments for a command
   */
  getBaseDepartments(command) {
    const commandDepartments = {
      'implement': ['product', 'design', 'backend'],
      'implement-strategy': ['product'],
      'implement-design': ['design'],
      'implement-technical': ['backend'],
      'orchestrate': ['product', 'backend'],
      'workflow': ['product', 'design', 'backend'],
      'chain': ['product', 'backend']
    };
    
    return commandDepartments[command] || ['product'];
  }

  /**
   * Analyze command complexity
   */
  analyzeComplexity(command, args) {
    let complexity = 0.2; // Base complexity
    
    // Complex commands
    if (['implement', 'orchestrate', 'workflow'].includes(command)) {
      complexity += 0.3;
    }
    
    // Many arguments suggest complexity
    if (args.length > 3) complexity += 0.2;
    if (args.length > 5) complexity += 0.2;
    
    // Long argument text
    const totalLength = args.join(' ').length;
    if (totalLength > 50) complexity += 0.1;
    if (totalLength > 100) complexity += 0.1;
    
    return Math.min(complexity, 1.0);
  }

  /**
   * Determine collaboration priority
   */
  getCollaborationPriority(departments) {
    // More departments = higher priority
    if (departments.length >= 3) return 'high';
    if (departments.length >= 2) return 'medium';
    return 'low';
  }
}

// Singleton instance
let instance = null;

module.exports = {
  CollaborationDetector,
  getInstance: () => {
    if (!instance) {
      instance = new CollaborationDetector();
    }
    return instance;
  }
};
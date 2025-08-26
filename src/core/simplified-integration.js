/**
 * BUMBA Simplified Integration
 * Shows how to integrate with existing code while reducing complexity
 */

const { getInstance: getSimpleFramework } = require('./simple-framework');
const { logger } = require('./logging/bumba-logger');

/**
 * Create a compatibility layer for existing code
 */
class SimplifiedBumbaFramework {
  constructor() {
    this.framework = getSimpleFramework();
    logger.info('Using simplified BUMBA framework');
  }

  /**
   * Process commands using simplified system
   */
  async processCommand(command, args = [], context = {}) {
    // Direct pass-through to simple framework
    return this.framework.processCommand(command, args, context);
  }

  /**
   * Get framework capabilities (simplified)
   */
  getCapabilities() {
    return {
      commands: [
        'implement', 'analyze', 'design', 'fix', 'optimize',
        'test', 'document', 'help', 'menu', 'status'
      ],
      features: [
        'simple-routing',
        'specialist-matching',
        'consciousness-validation',
        'performance-monitoring',
        'error-tracking'
      ],
      version: '2.0.0'
    };
  }

  /**
   * Initialize framework connections (simplified)
   */
  async initializeFrameworkConnections() {
    // No complex initialization needed
    logger.info('Framework connections ready');
    return true;
  }

  /**
   * Get system status
   */
  getSystemStatus() {
    return this.framework.getStatus();
  }

  /**
   * Handle hook execution (simplified)
   */
  async executeHook(hookName, data) {
    logger.debug(`Hook executed: ${hookName}`);
    // Hooks are optional in simplified system
    return { success: true };
  }
}

/**
 * Migration helper for transitioning from complex to simple system
 */
class MigrationHelper {
  /**
   * Map old command format to new format
   */
  static mapCommand(oldCommand) {
    // Remove unnecessary prefixes and normalize
    const command = oldCommand
      .replace(/^\/bumba:/, '')
      .replace(/^bumba\./, '')
      .toLowerCase();

    // Map old command names to new ones if needed
    const commandMap = {
      'execute': 'implement',
      'review': 'analyze',
      'build': 'implement',
      'check': 'validate'
    };

    return commandMap[command] || command;
  }

  /**
   * Convert old specialist format to new format
   */
  static mapSpecialist(oldSpecialist) {
    // Remove unnecessary suffixes
    return oldSpecialist
      .replace(/-agent$/, '')
      .replace(/-specialist$/, '')
      .replace(/-engineer$/, '');
  }

  /**
   * Simplify context object
   */
  static simplifyContext(context) {
    // Extract only necessary fields
    return {
      user: context.user,
      project: context.project,
      timestamp: context.timestamp || new Date().toISOString()
    };
  }
}

/**
 * Example usage of simplified system
 */
async function exampleUsage() {
  const framework = new SimplifiedBumbaFramework();

  // Example 1: Simple command
  const result1 = await framework.processCommand('implement', ['user authentication'], {
    user: 'developer',
    project: 'my-app'
  });

  logger.info('Command result:', result1);

  // Example 2: Get status
  const status = framework.getSystemStatus();
  logger.info('System status:', status);

  // Example 3: Using migration helper
  const oldCommand = '/bumba:execute';
  const newCommand = MigrationHelper.mapCommand(oldCommand);
  logger.info(`Migrated command: ${oldCommand} -> ${newCommand}`);
}

module.exports = {
  SimplifiedBumbaFramework,
  MigrationHelper,
  exampleUsage
};

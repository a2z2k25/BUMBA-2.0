/**
 * BUMBA Command Router
 * Routes commands to appropriate department managers and specialists
 */

const { logger } = require('../logging/bumba-logger');
const commandDepartmentMap = require('./command-department-map.json');
const commandActionTypes = require('./command-action-types.json');
const { getDepartmentManager, getCollaborationDepartments } = require('./department-constants');

class CommandRouter {
  constructor() {
    this.initialized = false;
    this.routeCache = new Map();
    this.activeRoutes = new Map();
  }

  /**
   * Initialize the router
   */
  async initialize() {
    if (this.initialized) return;
    
    logger.info('🚀 Initializing Command Router...');
    this.initialized = true;
  }

  /**
   * Main routing method - routes command to appropriate handler
   * @param {string} command - The command to route
   * @param {array} args - Command arguments
   * @param {object} context - Additional context
   */
  async route(command, args, context = {}) {
    try {
      logger.info(`🔀 Routing command: ${command}`, { args });
      
      // Build full context
      const fullContext = this.buildContext(command, args, context);
      
      // Check if this requires multi-department collaboration
      if (this.requiresCollaboration(command)) {
        const departments = getCollaborationDepartments(command);
        logger.info(`🤝 Multi-department collaboration required:`, departments);
        return await this.executeCollaboration(departments, command, args, fullContext);
      }
      
      // Single department routing
      const department = this.getDepartmentForCommand(command);
      if (!department) {
        throw new Error(`No department found for command: ${command}`);
      }
      
      logger.info(`📍 Routing to department: ${department}`);
      const result = await this.executeWithDepartment(department, command, args, fullContext);
      
      // Format and return response
      return this.formatResponse(result, command);
      
    } catch (error) {
      logger.error(`Routing error for command ${command}:`, error);
      return this.handleRoutingError(error, command);
    }
  }

  /**
   * Determine which department should handle a command
   * @param {string} command - The command to route
   */
  getDepartmentForCommand(command) {
    // Check each department's command list
    for (const [department, commands] of Object.entries(commandDepartmentMap)) {
      if (commands.includes(command)) {
        return department;
      }
    }
    
    // Check if it's a compound command (e.g., "implement-agents")
    const baseCommand = command.split('-')[0];
    for (const [department, commands] of Object.entries(commandDepartmentMap)) {
      if (commands.includes(baseCommand)) {
        return department;
      }
    }
    
    // Default fallback
    logger.warn(`No department mapping found for command: ${command}, defaulting to system`);
    return 'system';
  }

  /**
   * Execute command through department manager
   * @param {string} department - Department ID
   * @param {string} command - Command to execute
   * @param {array} args - Command arguments
   * @param {object} context - Execution context
   */
  async executeWithDepartment(department, command, args, context) {
    const manager = await getDepartmentManager(department);
    
    // Call manager's execute method
    const result = await manager.execute(command, args, context);
    
    return {
      department,
      command,
      ...result
    };
  }

  /**
   * Handle multi-department collaboration
   * @param {array} departments - List of department IDs
   * @param {string} command - Command to execute
   * @param {array} args - Command arguments
   * @param {object} context - Execution context
   */
  async executeCollaboration(departments, command, args, context) {
    const results = [];
    
    // Execute in parallel for each department
    const promises = departments.map(async (dept) => {
      const manager = await getDepartmentManager(dept);
      return {
        department: dept,
        result: await manager.execute(command, args, context)
      };
    });
    
    const departmentResults = await Promise.all(promises);
    
    return {
      type: 'collaboration',
      command,
      departments,
      results: departmentResults,
      success: true
    };
  }

  /**
   * Build execution context
   * @param {string} command - The command
   * @param {array} args - Command arguments
   * @param {object} baseContext - Base context
   */
  buildContext(command, args, baseContext = {}) {
    return {
      ...baseContext,
      command,
      args,
      actionType: this.getActionType(command),
      timestamp: new Date().toISOString(),
      source: 'bumba-cli'
    };
  }

  /**
   * Format response for user
   * @param {object} result - Raw result from department
   * @param {string} command - Original command
   */
  formatResponse(result, command) {
    if (!result) {
      return {
        success: false,
        error: 'No response from department manager'
      };
    }
    
    return {
      ...result,
      command,
      formattedAt: new Date().toISOString()
    };
  }

  /**
   * Check if command requires collaboration
   * @param {string} command - The command to check
   */
  requiresCollaboration(command) {
    const collaborationCommands = commandDepartmentMap.collaboration || [];
    return collaborationCommands.includes(command) || 
           command.includes('implement') ||
           command.includes('orchestrate');
  }

  /**
   * Get action type for command
   * @param {string} command - The command
   */
  getActionType(command) {
    for (const [actionType, config] of Object.entries(commandActionTypes)) {
      if (config.commands.includes(command)) {
        return actionType;
      }
    }
    return 'execute'; // Default action
  }

  /**
   * Handle routing errors
   * @param {Error} error - The error
   * @param {string} command - The command that failed
   */
  handleRoutingError(error, command) {
    return {
      success: false,
      command,
      error: error.message,
      suggestion: `Try 'bumba help ${command}' for more information`
    };
  }
}

// Singleton instance
let instance = null;

function getInstance() {
  if (!instance) {
    instance = new CommandRouter();
  }
  return instance;
}

module.exports = {
  CommandRouter,
  getInstance
};
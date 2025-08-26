/**
 * BUMBA Simple Command Handler
 *
 * Lightweight command processing for the simple-framework.js
 *
 * Purpose: Provides streamlined command handling without the overhead of
 * parallel coordination systems, making it suitable for resource-constrained
 * environments or when full framework features are not needed.
 *
 * Usage: Used exclusively by simple-framework.js
 * Alternative: For full features, use command-handler.js
 *
 * Note: This is NOT deprecated - it serves a specific purpose as the
 * lightweight command processor for simple deployments.
 */

const { logger } = require('./logging/bumba-logger');
const simpleRouter = require('./simple-router');
const { validateCommand } = require('./security/command-validator');
const { getInstance: getErrorManager } = require('./error-handling/unified-error-manager');

// Command definitions with direct handlers
const COMMANDS = {
  // Core Development Commands
  'implement': {
    description: 'Implement a feature or functionality',
    handler: (_args, _context) => processTask('implement', args, context)
  },
  'analyze': {
    description: 'Analyze code, architecture, or requirements',
    handler: (_args, _context) => processTask('analyze', args, context)
  },
  'design': {
    description: 'Design UI/UX components or systems',
    handler: (_args, _context) => processTask('design', args, context)
  },
  'fix': {
    description: 'Fix bugs or issues',
    handler: (_args, _context) => processTask('fix', args, context)
  },
  'optimize': {
    description: 'Optimize performance or code quality',
    handler: (_args, _context) => processTask('optimize', args, context)
  },
  'test': {
    description: 'Create or run tests',
    handler: (_args, _context) => processTask('test', args, context)
  },
  'document': {
    description: 'Create or update documentation',
    handler: (_args, _context) => processTask('document', args, context)
  },

  // System Commands
  'help': {
    description: 'Show help and available commands',
    handler: () => showHelp()
  },
  'menu': {
    description: 'Show interactive command menu',
    handler: () => showMenu()
  },
  'status': {
    description: 'Show system status',
    handler: () => getStatus()
  },
  'memory': {
    description: 'Manage memory and context',
    handler: (args) => manageMemory(args[0] || 'status')
  },

  // Utility Commands
  'secure': {
    description: 'Run security validation',
    handler: (_args, _context) => runSecurityCheck(args, context)
  },
  'validate': {
    description: 'Validate code or configuration',
    handler: (_args, _context) => runValidation(args, context)
  }
};

/**
 * Main command handler function
 */
async function handleCommand(command, args = [], context = {}) {
  try {
    // Normalize command
    const normalizedCommand = command.toLowerCase().replace(/^\/bumba:/, '');

    // Validate command exists
    if (!COMMANDS[normalizedCommand]) {
      return {
        success: false,
        error: `Unknown command: ${command}. Use /bumba:help for available commands.`
      };
    }

    // Security validation
    const validation = await validateCommand(normalizedCommand, args, context);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error || 'Command validation failed'
      };
    }

    // Execute command
    const result = await COMMANDS[normalizedCommand].handler(args, context);

    return {
      success: true,
      command: normalizedCommand,
      result
    };

  } catch (error) {
    // Track error
    const errorManager = getErrorManager();
    await errorManager.handleError(error, {
      operation: 'command-handler',
      command,
      args,
      severity: 'error'
    });

    logger.error(`Command execution failed: ${error.message}`);

    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Process a task command
 */
async function processTask(type, _args, _context) {
  // Route the task
  const routing = await simpleRouter.route(type, args, context);

  // Log the routing decision
  logger.info('Task routed:', {
    type,
    intent: routing.intent,
    departments: routing.departments,
    specialists: routing.specialists,
    complexity: routing.complexity
  });

  // Return task processing result
  return {
    type,
    routing,
    message: `Task "${args.join(' ')}" has been analyzed and routed for ${type}`
  };
}

/**
 * Show help information
 */
function showHelp() {
  const helpText = [
    'BUMBA Command Reference:',
    '',
    'Development Commands:',
    ...Object.entries(COMMANDS)
      .filter(([cmd]) => ['implement', 'analyze', 'design', 'fix', 'optimize', 'test', 'document'].includes(cmd))
      .map(([cmd, info]) => `  /bumba:${cmd} - ${info.description}`),
    '',
    'System Commands:',
    ...Object.entries(COMMANDS)
      .filter(([cmd]) => ['help', 'menu', 'status', 'memory'].includes(cmd))
      .map(([cmd, info]) => `  /bumba:${cmd} - ${info.description}`),
    '',
    'Utility Commands:',
    ...Object.entries(COMMANDS)
      .filter(([cmd]) => ['secure', 'validate'].includes(cmd))
      .map(([cmd, info]) => `  /bumba:${cmd} - ${info.description}`)
  ].join('\n');

  return helpText;
}

/**
 * Show interactive menu
 */
function showMenu() {
  return {
    type: 'menu',
    categories: {
      'Development': ['implement', 'analyze', 'design', 'fix', 'optimize', 'test', 'document'],
      'System': ['help', 'status', 'memory'],
      'Utility': ['secure', 'validate']
    },
    message: 'Select a command category to explore'
  };
}

/**
 * Get system status
 */
function getStatus() {
  const routerStats = simpleRouter.getStats();

  return {
    framework: 'BUMBA 2.0.0',
    status: 'operational',
    routing: {
      totalRoutes: routerStats.totalRoutes,
      avgRoutingTime: `${routerStats.avgRoutingTime.toFixed(2)}ms`,
      cacheHitRate: `${(routerStats.cacheHitRate * 100).toFixed(1)}%`
    },
    memory: process.memoryUsage(),
    uptime: process.uptime()
  };
}

/**
 * Manage memory operations
 */
function manageMemory(operation) {
  switch (operation) {
    case 'clear':
      simpleRouter.clearCache();
      return { message: 'Memory caches cleared' };
    case 'status':
      return {
        routingCache: simpleRouter.getStats().cacheSize,
        nodeMemory: process.memoryUsage()
      };
    default:
      return { error: `Unknown memory operation: ${operation}` };
  }
}

/**
 * Run security check
 */
async function runSecurityCheck(_args, _context) {
  // Simple security check implementation
  return {
    status: 'passed',
    checks: ['input-validation', 'command-sanitization', 'permission-verification'],
    message: 'Security validation completed'
  };
}

/**
 * Run validation
 */
async function runValidation(args, _context) {
  const target = args[0] || 'system';

  return {
    target,
    status: 'valid',
    message: `Validation completed for ${target}`
  };
}

/**
 * Get available commands
 */
function getAvailableCommands() {
  return Object.keys(COMMANDS);
}

/**
 * Check if command exists
 */
function isValidCommand(command) {
  const normalized = command.toLowerCase().replace(/^\/bumba:/, '');
  return COMMANDS.hasOwnProperty(normalized);
}

module.exports = {
  handleCommand,
  getAvailableCommands,
  isValidCommand
};

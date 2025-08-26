/**
 * BUMBA Simple Framework - Lightweight Framework
 *
 * LIGHTWEIGHT FRAMEWORK: Streamlined for resource-constrained environments
 *
 * Features:
 * - 🏁 Core command processing (essential commands only)
 * - 🏁 Basic specialist system
 * - 🏁 Simple validation and error handling
 * - 🏁 Performance monitoring
 * - 🔴 No parallel coordination systems
 * - 🔴 No department hierarchy
 * - 🔴 No advanced consciousness layer
 * - 🔴 Limited MCP integration
 *
 * Use Cases:
 * - Resource-constrained environments (memory < 1GB)
 * - Single-user development
 * - Embedded systems and IoT devices
 * - Simple automation tasks
 * - Quick prototyping and testing
 *
 * Performance: ~10MB memory, 500ms startup, basic functionality
 */

const { logger } = require('./logging/bumba-logger');
const simpleRouter = require('./simple-router');
const { handleCommand } = require('./simple-command-handler');
const simpleValidator = require('./consciousness/simple-validator');
const { createSpecialist, findBestSpecialists } = require('./specialists/simple-specialist');
const { getInstance: getErrorManager } = require('./error-handling/unified-error-manager');
const { performanceMonitor } = require('./unified-monitoring-system');

class SimpleFramework {
  constructor() {
    this.config = {
      name: 'BUMBA Simple Framework',
      version: '2.0.0',
      enableValidation: true,
      enableMonitoring: true,
      maxConcurrentTasks: 5
    };

    this.state = {
      initialized: false,
      activeTasks: 0,
      processedCommands: 0
    };

    this.initialize();
  }

  /**
   * Initialize the framework
   */
  initialize() {
    try {
      // Start performance monitoring if enabled
      if (this.config.enableMonitoring) {
        performanceMonitor.start();
      }

      // Log initialization
      logger.info(`${this.config.name} v${this.config.version} initializing...`);

      this.state.initialized = true;
      logger.info('Framework initialized successfully');

    } catch (error) {
      getErrorManager().track(error, {
        operation: 'framework-initialization',
        severity: 'critical'
      });
      throw error;
    }
  }

  /**
   * Process a command
   */
  async processCommand(command, args = [], context = {}) {
    if (!this.state.initialized) {
      throw new Error('Framework not initialized');
    }

    try {
      this.state.activeTasks++;
      this.state.processedCommands++;

      // Validate if enabled
      if (this.config.enableValidation) {
        const validation = simpleValidator.validate(`${command} ${args.join(' ')}`);
        if (!validation.passed) {
          logger.warn('Task failed consciousness validation:', validation.reason);
          // Continue with warning rather than blocking
        }
      }

      // Handle the command
      const result = await handleCommand(command, args, context);

      // If it's a task command, process it further
      if (result.success && result.result?.routing) {
        await this.processTask(result.result);
      }

      return result;

    } catch (error) {
      getErrorManager().track(error, {
        operation: 'command-processing',
        command,
        args
      });
      throw error;
    } finally {
      this.state.activeTasks--;
    }
  }

  /**
   * Process a routed task
   */
  async processTask(taskResult) {
    const { routing } = taskResult;

    try {
      // Find best specialists
      const specialistTypes = routing.specialists ||
        findBestSpecialists(`${taskResult.type} ${taskResult.message}`);

      // Create specialist instances
      const specialists = specialistTypes.map(type => createSpecialist(type));

      // Process with each specialist
      const results = await Promise.all(
        specialists.map(specialist =>
          specialist.process(taskResult.message, { routing })
        )
      );

      // Log results
      logger.info('Task processed by specialists:', {
        task: taskResult.type,
        specialists: results.map(r => ({
          name: r.name,
          confidence: r.confidence
        }))
      });

      return {
        task: taskResult,
        specialists: results
      };

    } catch (error) {
      getErrorManager().track(error, {
        operation: 'task-processing',
        task: taskResult
      });
      throw error;
    }
  }

  /**
   * Get framework status
   */
  getStatus() {
    return {
      framework: {
        name: this.config.name,
        version: this.config.version,
        initialized: this.state.initialized
      },
      activity: {
        activeTasks: this.state.activeTasks,
        processedCommands: this.state.processedCommands
      },
      routing: simpleRouter.getStats(),
      validation: simpleValidator.getStats(),
      monitoring: performanceMonitor.getSummary(),
      errors: getErrorManager().getSummary()
    };
  }

  /**
   * Shutdown the framework
   */
  async shutdown() {
    logger.info('Shutting down framework...');

    // Stop monitoring
    if (this.config.enableMonitoring) {
      performanceMonitor.stop();
    }

    // Clear caches
    simpleRouter.clearCache();
    simpleValidator.clearCache();

    // Log final stats
    logger.info('Final framework statistics:', this.getStatus());

    this.state.initialized = false;
    logger.info('Framework shutdown complete');
  }

  /**
   * Update configuration
   */
  updateConfig(updates) {
    this.config = { ...this.config, ...updates };
    logger.info('Framework configuration updated:', updates);
  }
}

// Export singleton instance
let instance = null;

module.exports = {
  SimpleFramework,

  /**
   * Get framework instance
   */
  getInstance() {
    if (!instance) {
      instance = new SimpleFramework();
    }
    return instance;
  },

  /**
   * Create new framework instance
   */
  createFramework(config = {}) {
    return new SimpleFramework();
  }
};

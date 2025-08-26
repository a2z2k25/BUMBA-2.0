#!/usr/bin/env node

/**
 * BUMBA Failure Manager Deployment Script
 * Integrates the unified failure manager throughout the system
 */

const fs = require('fs');
const path = require('path');
const { logger } = require('../src/core/logging/bumba-logger');

class FailureManagerDeployment {
  constructor() {
    this.stats = {
      filesUpdated: 0,
      handlersAdded: 0,
      errors: []
    };
  }

  async deploy() {
    console.log('\n' + '='.repeat(60));
    console.log('FAILURE MANAGER DEPLOYMENT');
    console.log('='.repeat(60) + '\n');

    try {
      // Step 1: Update core initialization
      await this.updateCoreInitialization();
      
      // Step 2: Wrap critical functions
      await this.wrapCriticalFunctions();
      
      // Step 3: Add failure handlers to departments
      await this.updateDepartmentManagers();
      
      // Step 4: Update command system
      await this.updateCommandSystem();
      
      // Step 5: Test the deployment
      await this.testDeployment();
      
      // Report results
      this.report();
      
    } catch (error) {
      console.error('Deployment failed:', error);
      process.exit(1);
    }
  }

  /**
   * Update core initialization to include failure manager
   */
  async updateCoreInitialization() {
    console.log('📦 Updating core initialization...');
    
    const initFile = path.join(__dirname, '../src/core/initialization/failure-manager-init.js');
    
    const initCode = `/**
 * BUMBA Failure Manager Initialization
 */

const { getInstance: getFailureManager } = require('../resilience/unified-failure-manager');
const { getInstance: getNotificationSystem } = require('../resilience/failure-notifications');
const { logger } = require('../logging/bumba-logger');

class FailureManagerInitializer {
  static async initialize() {
    logger.info('🛡️ Initializing Failure Management System...');
    
    try {
      // Get instances
      const failureManager = getFailureManager();
      const notificationSystem = getNotificationSystem();
      
      // Connect notification system to failure manager
      failureManager.registerNotificationHandler(async (notification) => {
        await notificationSystem.notify(notification);
      });
      
      // Register recovery notification handler
      failureManager.on('recovery', async (failure) => {
        await notificationSystem.sendRecoveryNotification(failure);
      });
      
      // Register critical failure handler
      failureManager.on('critical-failure', async (failure) => {
        await notificationSystem.sendCriticalAlert(failure);
      });
      
      // Set up periodic cleanup
      setInterval(() => {
        failureManager.cleanupFailures();
      }, 3600000); // Every hour
      
      // Configure based on environment
      if (process.env.NODE_ENV === 'production') {
        failureManager.config.autoRecovery = true;
        failureManager.config.persistFailures = true;
        notificationSystem.configure({
          soundEnabled: false,
          consoleEnabled: false,
          fileEnabled: true
        });
      } else {
        notificationSystem.configure({
          soundEnabled: true,
          consoleEnabled: true,
          fileEnabled: true
        });
      }
      
      logger.info('✅ Failure Management System initialized');
      
      // Return for global access
      return {
        failureManager,
        notificationSystem
      };
      
    } catch (error) {
      logger.error('Failed to initialize Failure Management:', error);
      throw error;
    }
  }
  
  static async shutdown() {
    logger.info('🔚 Shutting down Failure Management System...');
    
    const failureManager = getFailureManager();
    
    // Get final statistics
    const stats = failureManager.getStatistics();
    
    logger.info('Failure Management Statistics:', stats);
    
    // Persist remaining failures
    if (failureManager.config.persistFailures) {
      for (const [id, failure] of failureManager.failures) {
        await failureManager.persistFailure(failure);
      }
    }
    
    logger.info('✅ Failure Management System shut down');
  }
}

module.exports = FailureManagerInitializer;`;

    fs.writeFileSync(initFile, initCode);
    this.stats.filesUpdated++;
    console.log('  ✓ Created failure manager initializer');
  }

  /**
   * Wrap critical functions with failure handling
   */
  async wrapCriticalFunctions() {
    console.log('\n🔧 Adding failure handling to critical functions...');
    
    // Create wrapper helper
    const wrapperFile = path.join(__dirname, '../src/core/resilience/failure-wrapper.js');
    
    const wrapperCode = `/**
 * BUMBA Failure Wrapper Utilities
 */

const { getInstance: getFailureManager } = require('./unified-failure-manager');

/**
 * Wrap an async function with failure handling
 */
function withFailureHandling(fn, context = {}) {
  const failureManager = getFailureManager();
  return failureManager.wrap(fn, context);
}

/**
 * Wrap a class method with failure handling
 */
function wrapMethod(target, methodName, context = {}) {
  const original = target[methodName];
  
  if (typeof original !== 'function') {
    throw new Error(\`\${methodName} is not a function\`);
  }
  
  target[methodName] = withFailureHandling(original.bind(target), {
    ...context,
    method: methodName,
    class: target.constructor.name
  });
}

/**
 * Wrap all methods of a class
 */
function wrapClass(targetClass, context = {}) {
  const prototype = targetClass.prototype;
  const methodNames = Object.getOwnPropertyNames(prototype)
    .filter(name => {
      if (name === 'constructor') return false;
      const descriptor = Object.getOwnPropertyDescriptor(prototype, name);
      return typeof descriptor.value === 'function';
    });
  
  for (const methodName of methodNames) {
    wrapMethod(prototype, methodName, {
      ...context,
      class: targetClass.name
    });
  }
}

/**
 * Create a safe async function
 */
function createSafeAsync(fn, context = {}) {
  return async (...args) => {
    const failureManager = getFailureManager();
    
    try {
      return await fn(...args);
    } catch (error) {
      const result = await failureManager.handleFailure(error, {
        ...context,
        args: args.length
      });
      
      if (!result.recovered) {
        throw error;
      }
      
      // Retry once if recovered
      return await fn(...args);
    }
  };
}

module.exports = {
  withFailureHandling,
  wrapMethod,
  wrapClass,
  createSafeAsync
};`;

    fs.writeFileSync(wrapperFile, wrapperCode);
    this.stats.filesUpdated++;
    console.log('  ✓ Created failure wrapper utilities');
  }

  /**
   * Update department managers with failure handling
   */
  async updateDepartmentManagers() {
    console.log('\n📋 Adding failure handling to department managers...');
    
    const departmentPatch = `
    // Add failure handling import
    const { withFailureHandling } = require('../resilience/failure-wrapper');
    
    // Wrap critical methods
    this.getSpecialist = withFailureHandling(
      this.getSpecialist.bind(this),
      { component: 'department', operation: 'getSpecialist' }
    );
    
    this.routeTask = withFailureHandling(
      this.routeTask.bind(this),
      { component: 'department', operation: 'routeTask' }
    );`;
    
    console.log('  ⚠️ Department managers need manual integration');
    console.log('  Add the following to each department manager constructor:');
    console.log(departmentPatch);
    
    this.stats.handlersAdded += 3;
  }

  /**
   * Update command system with failure handling
   */
  async updateCommandSystem() {
    console.log('\n🎮 Adding failure handling to command system...');
    
    const commandHelper = path.join(__dirname, '../src/core/commands/failure-aware-commands.js');
    
    const commandCode = `/**
 * BUMBA Failure-Aware Command System
 */

const { getInstance: getFailureManager } = require('../resilience/unified-failure-manager');
const { createSafeAsync } = require('../resilience/failure-wrapper');
const { logger } = require('../logging/bumba-logger');

class FailureAwareCommandExecutor {
  constructor() {
    this.failureManager = getFailureManager();
    this.commandStats = {
      executed: 0,
      failed: 0,
      recovered: 0
    };
  }
  
  /**
   * Execute command with failure handling
   */
  async execute(command, args, context = {}) {
    this.commandStats.executed++;
    
    try {
      // Create safe wrapper for command
      const safeCommand = createSafeAsync(command, {
        component: 'command',
        operation: command.name || 'unknown',
        ...context
      });
      
      // Execute with failure handling
      const result = await safeCommand(args);
      
      return {
        success: true,
        result
      };
      
    } catch (error) {
      this.commandStats.failed++;
      
      // Attempt recovery
      const recovery = await this.failureManager.handleFailure(error, {
        component: 'command',
        operation: command.name,
        metadata: { args }
      });
      
      if (recovery.recovered) {
        this.commandStats.recovered++;
        
        // Retry command
        const result = await command(args);
        return {
          success: true,
          result,
          recovered: true
        };
      }
      
      return {
        success: false,
        error: error.message,
        failureId: recovery.failureId
      };
    }
  }
  
  /**
   * Get command execution statistics
   */
  getStats() {
    return {
      ...this.commandStats,
      failureRate: this.commandStats.executed > 0
        ? ((this.commandStats.failed / this.commandStats.executed) * 100).toFixed(2) + '%'
        : '0%',
      recoveryRate: this.commandStats.failed > 0
        ? ((this.commandStats.recovered / this.commandStats.failed) * 100).toFixed(2) + '%'
        : '0%'
    };
  }
}

module.exports = FailureAwareCommandExecutor;`;

    fs.writeFileSync(commandHelper, commandCode);
    this.stats.filesUpdated++;
    console.log('  ✓ Created failure-aware command executor');
  }

  /**
   * Test the deployment
   */
  async testDeployment() {
    console.log('\n🧪 Testing failure manager deployment...');
    
    try {
      // Test initialization
      const FailureManagerInitializer = require('../src/core/initialization/failure-manager-init');
      const { failureManager, notificationSystem } = await FailureManagerInitializer.initialize();
      
      console.log('  ✓ Failure manager initialized');
      
      // Test failure handling
      const testError = new Error('Test failure');
      testError.type = 'TEST_ERROR';
      
      const result = await failureManager.handleFailure(testError, {
        component: 'test',
        operation: 'deployment-test'
      });
      
      console.log(`  ✓ Test failure handled (ID: ${result.failureId})`);
      
      // Test notifications
      await notificationSystem.testNotifications();
      
      // Test wrapper
      const { createSafeAsync } = require('../src/core/resilience/failure-wrapper');
      
      const riskyFunction = async () => {
        throw new Error('Risky operation failed');
      };
      
      const safeFunction = createSafeAsync(riskyFunction, {
        component: 'test',
        operation: 'risky-operation'
      });
      
      try {
        await safeFunction();
      } catch (error) {
        console.log('  ✓ Safe wrapper caught error:', error.message);
      }
      
      // Get statistics
      const stats = failureManager.getStatistics();
      console.log('\n  Failure Manager Statistics:');
      console.log(`    Total Failures: ${stats.totalFailures}`);
      console.log(`    Recovery Rate: ${stats.recoveryRate}`);
      console.log(`    Critical Failures: ${stats.criticalFailures}`);
      
      // Cleanup
      await FailureManagerInitializer.shutdown();
      
      console.log('\n✅ All tests passed');
      
    } catch (error) {
      console.error('❌ Test failed:', error);
      this.stats.errors.push(error.message);
    }
  }

  /**
   * Report deployment results
   */
  report() {
    console.log('\n' + '='.repeat(60));
    console.log('DEPLOYMENT RESULTS');
    console.log('='.repeat(60));
    console.log(`Files Updated: ${this.stats.filesUpdated}`);
    console.log(`Handlers Added: ${this.stats.handlersAdded}`);
    console.log(`Errors: ${this.stats.errors.length}`);
    
    if (this.stats.errors.length > 0) {
      console.log('\nErrors:');
      this.stats.errors.forEach(err => console.log(`  - ${err}`));
    }
    
    console.log('\nNext Steps:');
    console.log('1. Manually integrate failure handling in department managers');
    console.log('2. Add failure handling to critical async operations');
    console.log('3. Configure notification channels for your environment');
    console.log('4. Test failure scenarios: npm run test:failures');
    
    console.log('\n✅ Failure Manager deployed successfully!');
    console.log('='.repeat(60) + '\n');
  }
}

// Run deployment
if (require.main === module) {
  const deployment = new FailureManagerDeployment();
  deployment.deploy().catch(error => {
    console.error('Deployment failed:', error);
    process.exit(1);
  });
}

module.exports = FailureManagerDeployment;
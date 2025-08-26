/**
 * BUMBA Failure Manager
 * Makes failures visible and actionable instead of silent
 * 
 * SOLVES: Errors are caught and logged but system keeps running in broken state
 * RESULT: Failures are visible, categorized, and handled appropriately
 */

const chalk = require('chalk');
const { logger } = require('../logging/bumba-logger');
const { getTaskFlowRegistry } = require('../tracing/task-flow');
const EventEmitter = require('events');

/**
 * Failure severity levels
 */
const SEVERITY = {
  CRITICAL: {
    level: 4,
    name: 'Critical',
    action: 'STOP',
    color: 'red',
    icon: '🔴'
  },
  HIGH: {
    level: 3,
    name: 'High',
    action: 'DEGRADE',
    color: 'orange',
    icon: '🟠'
  },
  MEDIUM: {
    level: 2,
    name: 'Medium',
    action: 'RETRY',
    color: 'yellow',
    icon: '🟡'
  },
  LOW: {
    level: 1,
    name: 'Low',
    action: 'LOG',
    color: 'blue',
    icon: '🔵'
  },
  INFO: {
    level: 0,
    name: 'Info',
    action: 'IGNORE',
    color: 'gray',
    icon: '⚪'
  }
};

/**
 * Failure categories
 */
const CATEGORIES = {
  API: 'API Error',
  NETWORK: 'Network Error',
  VALIDATION: 'Validation Error',
  RESOURCE: 'Resource Error',
  TIMEOUT: 'Timeout Error',
  PERMISSION: 'Permission Error',
  CONFIGURATION: 'Configuration Error',
  UNKNOWN: 'Unknown Error'
};

/**
 * Failure Manager
 */
class FailureManager extends EventEmitter {
  constructor() {
    super();
    this.failures = [];
    this.activeFailures = new Map();
    this.failurePatterns = new Map();
    this.componentHealth = new Map();
    this.options = {
      maxFailures: 100,
      patternThreshold: 3,
      degradationThreshold: 5,
      notificationThreshold: SEVERITY.MEDIUM.level
    };
    this.degradedComponents = new Set();
    this.stoppedComponents = new Set();
  }
  
  /**
   * Handle a failure
   */
  handleFailure(error, component, context = {}) {
    const failure = this.createFailure(error, component, context);
    
    // Record failure
    this.recordFailure(failure);
    
    // Analyze patterns
    this.analyzePattern(failure);
    
    // Update component health
    this.updateComponentHealth(component, failure);
    
    // Determine action
    const action = this.determineAction(failure);
    
    // Execute action
    this.executeAction(action, failure);
    
    // Emit event
    this.emit('failure', failure);
    
    return {
      failureId: failure.id,
      action: action.type,
      severity: failure.severity,
      handled: true
    };
  }
  
  /**
   * Create failure object
   */
  createFailure(error, component, context) {
    const category = this.categorizeError(error);
    const severity = this.determineSeverity(error, category, component);
    
    return {
      id: `failure-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      component,
      category,
      severity,
      error: {
        message: error.message || error,
        stack: error.stack,
        code: error.code,
        type: error.constructor?.name || 'Error'
      },
      context,
      taskFlow: context._taskFlow?.taskId
    };
  }
  
  /**
   * Categorize error
   */
  categorizeError(error) {
    const message = error.message?.toLowerCase() || '';
    const code = error.code?.toLowerCase() || '';
    
    if (code.includes('econnrefused') || code.includes('etimedout')) {
      return CATEGORIES.NETWORK;
    }
    
    if (message.includes('api') || message.includes('endpoint')) {
      return CATEGORIES.API;
    }
    
    if (message.includes('validation') || message.includes('invalid')) {
      return CATEGORIES.VALIDATION;
    }
    
    if (message.includes('memory') || message.includes('resource')) {
      return CATEGORIES.RESOURCE;
    }
    
    if (message.includes('timeout')) {
      return CATEGORIES.TIMEOUT;
    }
    
    if (message.includes('permission') || message.includes('denied')) {
      return CATEGORIES.PERMISSION;
    }
    
    if (message.includes('config') || message.includes('setting')) {
      return CATEGORIES.CONFIGURATION;
    }
    
    return CATEGORIES.UNKNOWN;
  }
  
  /**
   * Determine severity
   */
  determineSeverity(error, category, component) {
    // Critical: System-breaking errors
    if (category === CATEGORIES.CONFIGURATION || 
        component === 'Core' ||
        error.critical) {
      return SEVERITY.CRITICAL;
    }
    
    // High: API/Network failures
    if (category === CATEGORIES.API || 
        category === CATEGORIES.NETWORK ||
        category === CATEGORIES.RESOURCE) {
      return SEVERITY.HIGH;
    }
    
    // Medium: Validation/Permission errors
    if (category === CATEGORIES.VALIDATION || 
        category === CATEGORIES.PERMISSION) {
      return SEVERITY.MEDIUM;
    }
    
    // Low: Timeouts and retryable errors
    if (category === CATEGORIES.TIMEOUT) {
      return SEVERITY.LOW;
    }
    
    return SEVERITY.INFO;
  }
  
  /**
   * Record failure
   */
  recordFailure(failure) {
    this.failures.push(failure);
    this.activeFailures.set(failure.id, failure);
    
    // Limit stored failures
    if (this.failures.length > this.options.maxFailures) {
      const removed = this.failures.shift();
      this.activeFailures.delete(removed.id);
    }
    
    // Log failure
    const logLevel = failure.severity.level >= SEVERITY.HIGH.level ? 'error' : 'warn';
    logger[logLevel](`${failure.severity.icon} ${failure.category} in ${failure.component}`, {
      failureId: failure.id,
      error: failure.error.message
    });
  }
  
  /**
   * Analyze failure patterns
   */
  analyzePattern(failure) {
    const key = `${failure.component}:${failure.category}`;
    
    if (!this.failurePatterns.has(key)) {
      this.failurePatterns.set(key, {
        count: 0,
        failures: [],
        firstSeen: Date.now(),
        lastSeen: Date.now()
      });
    }
    
    const pattern = this.failurePatterns.get(key);
    pattern.count++;
    pattern.lastSeen = Date.now();
    pattern.failures.push(failure.id);
    
    // Keep only recent failures in pattern
    if (pattern.failures.length > 10) {
      pattern.failures.shift();
    }
    
    // Detect repeated failures
    if (pattern.count >= this.options.patternThreshold) {
      this.emit('pattern-detected', {
        component: failure.component,
        category: failure.category,
        count: pattern.count,
        timespan: Date.now() - pattern.firstSeen
      });
    }
  }
  
  /**
   * Update component health
   */
  updateComponentHealth(component, failure) {
    if (!this.componentHealth.has(component)) {
      this.componentHealth.set(component, {
        failureCount: 0,
        lastFailure: null,
        status: 'healthy'
      });
    }
    
    const health = this.componentHealth.get(component);
    health.failureCount++;
    health.lastFailure = failure.id;
    
    // Update status based on failure count
    if (health.failureCount >= this.options.degradationThreshold) {
      health.status = 'degraded';
      this.degradedComponents.add(component);
    }
    
    if (health.failureCount >= this.options.degradationThreshold * 2) {
      health.status = 'critical';
      this.stoppedComponents.add(component);
    }
  }
  
  /**
   * Determine action for failure
   */
  determineAction(failure) {
    const severity = failure.severity;
    const health = this.componentHealth.get(failure.component);
    
    // Override based on component health
    if (health?.status === 'critical') {
      return { type: 'STOP', reason: 'Component critical' };
    }
    
    if (health?.status === 'degraded' && severity.level >= SEVERITY.MEDIUM.level) {
      return { type: 'DEGRADE', reason: 'Component degraded' };
    }
    
    // Use severity-based action
    return { type: severity.action, reason: `Severity: ${severity.name}` };
  }
  
  /**
   * Execute action
   */
  executeAction(action, failure) {
    switch (action.type) {
      case 'STOP':
        this.stopComponent(failure.component, failure);
        this.notifyUser(
          `Critical failure in ${failure.component}`,
          'Component stopped to prevent damage',
          'error'
        );
        break;
        
      case 'DEGRADE':
        this.degradeComponent(failure.component, failure);
        this.notifyUser(
          `${failure.component} degraded`,
          `Reduced functionality due to: ${failure.error.message}`,
          'warning'
        );
        break;
        
      case 'RETRY':
        this.scheduleRetry(failure);
        break;
        
      case 'LOG':
        // Already logged in recordFailure
        break;
        
      case 'IGNORE':
        // No action needed
        break;
    }
  }
  
  /**
   * Stop a component
   */
  stopComponent(component, failure) {
    this.stoppedComponents.add(component);
    this.emit('component-stopped', { component, failure: failure.id });
    
    logger.error(`Component stopped: ${component}`, {
      reason: failure.error.message,
      failureId: failure.id
    });
  }
  
  /**
   * Degrade a component
   */
  degradeComponent(component, failure) {
    this.degradedComponents.add(component);
    this.emit('component-degraded', { component, failure: failure.id });
    
    logger.warn(`Component degraded: ${component}`, {
      reason: failure.error.message,
      failureId: failure.id
    });
  }
  
  /**
   * Schedule retry
   */
  scheduleRetry(failure) {
    const delay = Math.min(1000 * Math.pow(2, failure.retryCount || 0), 30000);
    
    setTimeout(() => {
      this.emit('retry', {
        failure: failure.id,
        component: failure.component,
        attempt: (failure.retryCount || 0) + 1
      });
    }, delay);
    
    logger.info(`Retry scheduled for ${failure.component} in ${delay}ms`);
  }
  
  /**
   * Notify user
   */
  notifyUser(title, message, level = 'info') {
    if (level === 'error') {
      console.error(chalk.red.bold(`\n⚠️  ${title}`));
      console.error(chalk.red(message));
    } else if (level === 'warning') {
      console.warn(chalk.yellow.bold(`\n⚠️  ${title}`));
      console.warn(chalk.yellow(message));
    } else {
      console.log(chalk.blue.bold(`\nℹ️  ${title}`));
      console.log(chalk.blue(message));
    }
    
    this.emit('user-notified', { title, message, level });
  }
  
  /**
   * Get failure statistics
   */
  getStatistics() {
    const stats = {
      total: this.failures.length,
      active: this.activeFailures.size,
      bySeverity: {},
      byCategory: {},
      byComponent: {},
      patterns: this.failurePatterns.size,
      degradedComponents: Array.from(this.degradedComponents),
      stoppedComponents: Array.from(this.stoppedComponents)
    };
    
    // Count by severity
    Object.values(SEVERITY).forEach(sev => {
      stats.bySeverity[sev.name] = 0;
    });
    
    // Count by category
    Object.values(CATEGORIES).forEach(cat => {
      stats.byCategory[cat] = 0;
    });
    
    // Analyze failures
    this.failures.forEach(failure => {
      stats.bySeverity[failure.severity.name]++;
      stats.byCategory[failure.category]++;
      
      if (!stats.byComponent[failure.component]) {
        stats.byComponent[failure.component] = 0;
      }
      stats.byComponent[failure.component]++;
    });
    
    return stats;
  }
  
  /**
   * Get component health
   */
  getComponentHealth(component) {
    return this.componentHealth.get(component) || {
      failureCount: 0,
      lastFailure: null,
      status: 'healthy'
    };
  }
  
  /**
   * Check if component is operational
   */
  isComponentOperational(component) {
    return !this.stoppedComponents.has(component);
  }
  
  /**
   * Check if component is degraded
   */
  isComponentDegraded(component) {
    return this.degradedComponents.has(component);
  }
  
  /**
   * Reset component health
   */
  resetComponent(component) {
    this.componentHealth.delete(component);
    this.degradedComponents.delete(component);
    this.stoppedComponents.delete(component);
    
    logger.info(`Component health reset: ${component}`);
  }
  
  /**
   * Generate failure report
   */
  generateReport() {
    const stats = this.getStatistics();
    
    let report = chalk.cyan.bold('\n╔══════════════════════════════════════════════════════╗\n');
    report += chalk.cyan.bold('║              FAILURE REPORT                          ║\n');
    report += chalk.cyan.bold('╚══════════════════════════════════════════════════════╝\n\n');
    
    report += chalk.yellow('Summary:\n');
    report += `  Total Failures: ${stats.total}\n`;
    report += `  Active Failures: ${stats.active}\n`;
    report += `  Patterns Detected: ${stats.patterns}\n\n`;
    
    report += chalk.yellow('By Severity:\n');
    Object.entries(stats.bySeverity).forEach(([sev, count]) => {
      if (count > 0) {
        const severity = Object.values(SEVERITY).find(s => s.name === sev);
        report += `  ${severity.icon} ${sev}: ${count}\n`;
      }
    });
    
    report += chalk.yellow('\nBy Category:\n');
    Object.entries(stats.byCategory).forEach(([cat, count]) => {
      if (count > 0) {
        report += `  ${cat}: ${count}\n`;
      }
    });
    
    if (stats.degradedComponents.length > 0) {
      report += chalk.yellow('\n⚠️  Degraded Components:\n');
      stats.degradedComponents.forEach(comp => {
        report += `  - ${comp}\n`;
      });
    }
    
    if (stats.stoppedComponents.length > 0) {
      report += chalk.red('\n🔴 Stopped Components:\n');
      stats.stoppedComponents.forEach(comp => {
        report += `  - ${comp}\n`;
      });
    }
    
    return report;
  }
}

// Singleton instance
let instance = null;

function getFailureManager() {
  if (!instance) {
    instance = new FailureManager();
    
    // Set up automatic reporting
    setInterval(() => {
      const stats = instance.getStatistics();
      if (stats.active > 0) {
        logger.debug('Active failures', stats);
      }
    }, 60000); // Every minute
  }
  return instance;
}

module.exports = {
  FailureManager,
  getFailureManager,
  SEVERITY,
  CATEGORIES
};
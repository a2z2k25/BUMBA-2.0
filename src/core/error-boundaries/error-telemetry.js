/**
 * Error Telemetry System
 * Tracks, analyzes, and reports error patterns
 * Sprint 10 - Security & Stability Fix
 */

const { logger } = require('../logging/bumba-logger');
const { stateManager } = require('../state/global-state-manager');
const { ComponentTimers } = require('../timers/timer-registry');
const EventEmitter = require('events');

class ErrorTelemetry extends EventEmitter {
  constructor() {
    super();
    
    // Configuration
    this.config = {
      maxHistorySize: 1000,
      patternWindowSize: 100,
      aggregationInterval: 60000, // 1 minute
      alertThreshold: {
        errorRate: 10, // errors per minute
        criticalCount: 5,
        memorySpike: 50 // MB
      }
    };
    
    // Initialize storage
    this.errorHistory = [];
    this.errorPatterns = new Map();
    this.errorMetrics = {
      total: 0,
      byType: new Map(),
      byComponent: new Map(),
      bySeverity: new Map(),
      byTimeWindow: new Map()
    };
    
    // Pattern detection
    this.knownPatterns = new Map([
      ['memory_leak', { 
        indicators: ['heap', 'memory', 'gc', 'allocation'],
        threshold: 3 
      }],
      ['timeout', { 
        indicators: ['timeout', 'timed out', 'deadline'],
        threshold: 5 
      }],
      ['connection', { 
        indicators: ['ECONNREFUSED', 'ETIMEDOUT', 'socket', 'connection'],
        threshold: 5 
      }],
      ['permission', { 
        indicators: ['EACCES', 'EPERM', 'permission', 'denied'],
        threshold: 2 
      }],
      ['api_failure', { 
        indicators: ['401', '403', '429', '500', '503', 'api'],
        threshold: 5 
      }]
    ]);
    
    // Timers
    this.timers = new ComponentTimers('error-telemetry');
    
    // Register state
    stateManager.register('errorTelemetry', {
      errors: [],
      patterns: [],
      metrics: {},
      alerts: []
    });
    
    // Start monitoring
    this.startMonitoring();
  }

  /**
   * Record an error event
   */
  recordError(error, context = {}) {
    const errorEvent = this.createErrorEvent(error, context);
    
    // Add to history
    this.errorHistory.push(errorEvent);
    if (this.errorHistory.length > this.config.maxHistorySize) {
      this.errorHistory.shift();
    }
    
    // Update metrics
    this.updateMetrics(errorEvent);
    
    // Detect patterns
    this.detectPatterns(errorEvent);
    
    // Check for alerts
    this.checkAlerts(errorEvent);
    
    // Update state
    this.updateState();
    
    // Emit event
    this.emit('error-recorded', errorEvent);
    
    return errorEvent;
  }

  /**
   * Create error event object
   */
  createErrorEvent(error, context) {
    return {
      id: this.generateId(),
      timestamp: Date.now(),
      error: {
        message: error.message || String(error),
        name: error.name || 'Error',
        stack: error.stack || '',
        code: error.code
      },
      context: {
        component: context.component || 'unknown',
        method: context.method || 'unknown',
        boundary: context.boundary || null,
        userId: context.userId || null,
        sessionId: context.sessionId || null,
        ...context
      },
      severity: this.calculateSeverity(error, context),
      category: this.categorizeError(error),
      fingerprint: this.generateFingerprint(error),
      memory: this.captureMemoryState(),
      system: this.captureSystemState()
    };
  }

  /**
   * Calculate error severity
   */
  calculateSeverity(error, context) {
    // Critical errors
    if (error.name === 'FatalError' || 
        error.message?.includes('CRITICAL') ||
        context.severity === 'critical') {
      return 'critical';
    }
    
    // High severity
    if (error.name === 'TypeError' || 
        error.name === 'ReferenceError' ||
        error.code === 'EACCES' ||
        error.code === 'EPERM') {
      return 'high';
    }
    
    // Medium severity
    if (error.name === 'ValidationError' ||
        error.code === 'ETIMEDOUT' ||
        error.code === 'ECONNREFUSED') {
      return 'medium';
    }
    
    // Low severity
    return 'low';
  }

  /**
   * Categorize error type
   */
  categorizeError(error) {
    const message = (error.message || '').toLowerCase();
    const code = error.code || '';
    
    // Network errors
    if (code.startsWith('ECONN') || code === 'ETIMEDOUT') {
      return 'network';
    }
    
    // File system errors
    if (code.startsWith('E') && ['ENOENT', 'EACCES', 'EPERM', 'EISDIR'].includes(code)) {
      return 'filesystem';
    }
    
    // Memory errors
    if (message.includes('heap') || message.includes('memory') || message.includes('allocation')) {
      return 'memory';
    }
    
    // Timeout errors
    if (message.includes('timeout') || message.includes('timed out')) {
      return 'timeout';
    }
    
    // API errors
    if (message.includes('api') || message.includes('401') || message.includes('403')) {
      return 'api';
    }
    
    // Validation errors
    if (error.name === 'ValidationError' || message.includes('validation')) {
      return 'validation';
    }
    
    // Type errors
    if (error.name === 'TypeError' || error.name === 'ReferenceError') {
      return 'type';
    }
    
    return 'unknown';
  }

  /**
   * Generate error fingerprint for deduplication
   */
  generateFingerprint(error) {
    const components = [
      error.name,
      error.code,
      error.message?.substring(0, 50),
      error.stack?.split('\n')[1]?.trim().substring(0, 100)
    ].filter(Boolean);
    
    return components.join('|');
  }

  /**
   * Capture current memory state
   */
  captureMemoryState() {
    const mem = process.memoryUsage();
    return {
      heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
      heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
      external: Math.round(mem.external / 1024 / 1024),
      rss: Math.round(mem.rss / 1024 / 1024)
    };
  }

  /**
   * Capture system state
   */
  captureSystemState() {
    return {
      platform: process.platform,
      nodeVersion: process.version,
      uptime: Math.round(process.uptime()),
      cpuUsage: process.cpuUsage()
    };
  }

  /**
   * Update error metrics
   */
  updateMetrics(errorEvent) {
    // Total count
    this.errorMetrics.total++;
    
    // By type
    const type = errorEvent.category;
    this.errorMetrics.byType.set(type, 
      (this.errorMetrics.byType.get(type) || 0) + 1
    );
    
    // By component
    const component = errorEvent.context.component;
    this.errorMetrics.byComponent.set(component,
      (this.errorMetrics.byComponent.get(component) || 0) + 1
    );
    
    // By severity
    const severity = errorEvent.severity;
    this.errorMetrics.bySeverity.set(severity,
      (this.errorMetrics.bySeverity.get(severity) || 0) + 1
    );
    
    // By time window (last minute)
    const minute = Math.floor(errorEvent.timestamp / 60000);
    this.errorMetrics.byTimeWindow.set(minute,
      (this.errorMetrics.byTimeWindow.get(minute) || 0) + 1
    );
    
    // Clean old time windows
    const currentMinute = Math.floor(Date.now() / 60000);
    for (const [min] of this.errorMetrics.byTimeWindow) {
      if (min < currentMinute - 60) {
        this.errorMetrics.byTimeWindow.delete(min);
      }
    }
  }

  /**
   * Detect error patterns
   */
  detectPatterns(errorEvent) {
    const message = (errorEvent.error.message || '').toLowerCase();
    
    for (const [patternName, pattern] of this.knownPatterns) {
      const hasIndicator = pattern.indicators.some(indicator => 
        message.includes(indicator) || 
        errorEvent.error.code === indicator
      );
      
      if (hasIndicator) {
        // Track pattern occurrence
        if (!this.errorPatterns.has(patternName)) {
          this.errorPatterns.set(patternName, {
            count: 0,
            firstSeen: Date.now(),
            lastSeen: Date.now(),
            errors: []
          });
        }
        
        const patternData = this.errorPatterns.get(patternName);
        patternData.count++;
        patternData.lastSeen = Date.now();
        patternData.errors.push(errorEvent.id);
        
        // Keep only recent errors
        if (patternData.errors.length > 10) {
          patternData.errors.shift();
        }
        
        // Check if pattern threshold exceeded
        if (patternData.count >= pattern.threshold) {
          this.emit('pattern-detected', {
            pattern: patternName,
            count: patternData.count,
            threshold: pattern.threshold,
            errors: patternData.errors
          });
        }
      }
    }
  }

  /**
   * Check for alert conditions
   */
  checkAlerts(errorEvent) {
    const alerts = [];
    
    // Check error rate
    const currentMinute = Math.floor(Date.now() / 60000);
    const recentErrors = this.errorMetrics.byTimeWindow.get(currentMinute) || 0;
    
    if (recentErrors > this.config.alertThreshold.errorRate) {
      alerts.push({
        type: 'high_error_rate',
        message: `Error rate exceeded: ${recentErrors} errors in last minute`,
        severity: 'high'
      });
    }
    
    // Check critical errors
    const criticalCount = this.errorMetrics.bySeverity.get('critical') || 0;
    if (criticalCount >= this.config.alertThreshold.criticalCount) {
      alerts.push({
        type: 'critical_errors',
        message: `${criticalCount} critical errors detected`,
        severity: 'critical'
      });
    }
    
    // Check memory spike
    if (errorEvent.memory.heapUsed > 
        (this.lastMemoryState?.heapUsed || 0) + this.config.alertThreshold.memorySpike) {
      alerts.push({
        type: 'memory_spike',
        message: `Memory spike detected: ${errorEvent.memory.heapUsed}MB`,
        severity: 'medium'
      });
    }
    
    this.lastMemoryState = errorEvent.memory;
    
    // Emit alerts
    alerts.forEach(alert => {
      logger.warn(`Alert: ${alert.message}`);
      this.emit('alert', alert);
    });
    
    return alerts;
  }

  /**
   * Start monitoring
   */
  startMonitoring() {
    // Aggregate metrics periodically
    this.timers.setInterval('aggregate', () => {
      this.aggregateMetrics();
    }, this.config.aggregationInterval, 'Aggregate error metrics');
    
    // Clean old data periodically
    this.timers.setInterval('cleanup', () => {
      this.cleanupOldData();
    }, 300000, 'Clean old error data'); // Every 5 minutes
  }

  /**
   * Aggregate metrics for reporting
   */
  aggregateMetrics() {
    const aggregated = {
      timestamp: Date.now(),
      total: this.errorMetrics.total,
      lastHour: this.getErrorsInTimeRange(3600000),
      topErrors: this.getTopErrors(5),
      topComponents: this.getTopComponents(5),
      patterns: Array.from(this.errorPatterns.entries()).map(([name, data]) => ({
        name,
        count: data.count,
        lastSeen: data.lastSeen
      })),
      severity: Object.fromEntries(this.errorMetrics.bySeverity)
    };
    
    this.emit('metrics-aggregated', aggregated);
    
    // Store aggregated metrics
    stateManager.set('errorTelemetry', 'metrics', aggregated);
    
    return aggregated;
  }

  /**
   * Get errors in time range
   */
  getErrorsInTimeRange(rangeMs) {
    const cutoff = Date.now() - rangeMs;
    return this.errorHistory.filter(e => e.timestamp > cutoff).length;
  }

  /**
   * Get top errors by frequency
   */
  getTopErrors(limit = 10) {
    const errorCounts = new Map();
    
    this.errorHistory.forEach(event => {
      const fingerprint = event.fingerprint;
      if (!errorCounts.has(fingerprint)) {
        errorCounts.set(fingerprint, {
          count: 0,
          message: event.error.message,
          category: event.category
        });
      }
      errorCounts.get(fingerprint).count++;
    });
    
    return Array.from(errorCounts.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, limit)
      .map(([fingerprint, data]) => ({
        fingerprint,
        ...data
      }));
  }

  /**
   * Get top components by error count
   */
  getTopComponents(limit = 10) {
    return Array.from(this.errorMetrics.byComponent.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([component, count]) => ({ component, count }));
  }

  /**
   * Clean up old data
   */
  cleanupOldData() {
    // Remove old error history
    const cutoff = Date.now() - 3600000; // Keep 1 hour
    this.errorHistory = this.errorHistory.filter(e => e.timestamp > cutoff);
    
    // Clean old patterns
    for (const [patternName, data] of this.errorPatterns) {
      if (Date.now() - data.lastSeen > 3600000) {
        this.errorPatterns.delete(patternName);
      }
    }
    
    // Update state
    this.updateState();
  }

  /**
   * Update state manager
   */
  updateState() {
    stateManager.set('errorTelemetry', 'errors', 
      this.errorHistory.slice(-100) // Keep last 100 for state
    );
    
    stateManager.set('errorTelemetry', 'patterns',
      Array.from(this.errorPatterns.entries()).map(([name, data]) => ({
        name,
        count: data.count,
        lastSeen: data.lastSeen
      }))
    );
  }

  /**
   * Generate unique ID
   */
  generateId() {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get telemetry report
   */
  getReport() {
    return {
      summary: {
        total: this.errorMetrics.total,
        lastHour: this.getErrorsInTimeRange(3600000),
        last24Hours: this.getErrorsInTimeRange(86400000)
      },
      byCategory: Object.fromEntries(this.errorMetrics.byType),
      bySeverity: Object.fromEntries(this.errorMetrics.bySeverity),
      topErrors: this.getTopErrors(10),
      topComponents: this.getTopComponents(10),
      patterns: Array.from(this.errorPatterns.entries()).map(([name, data]) => ({
        name,
        count: data.count,
        firstSeen: new Date(data.firstSeen).toISOString(),
        lastSeen: new Date(data.lastSeen).toISOString()
      })),
      recentErrors: this.errorHistory.slice(-20).map(e => ({
        id: e.id,
        timestamp: new Date(e.timestamp).toISOString(),
        message: e.error.message,
        category: e.category,
        severity: e.severity,
        component: e.context.component
      }))
    };
  }

  /**
   * Export telemetry data
   */
  exportData() {
    return {
      version: '1.0',
      exportTime: new Date().toISOString(),
      history: this.errorHistory,
      metrics: this.errorMetrics,
      patterns: Array.from(this.errorPatterns.entries())
    };
  }

  /**
   * Reset telemetry
   */
  reset() {
    this.errorHistory = [];
    this.errorPatterns.clear();
    this.errorMetrics = {
      total: 0,
      byType: new Map(),
      byComponent: new Map(),
      bySeverity: new Map(),
      byTimeWindow: new Map()
    };
    
    this.updateState();
    this.emit('reset');
  }

  /**
   * Stop monitoring
   */
  stop() {
    this.timers.clearAll();
  }
}

// Singleton instance
let instance = null;

function getErrorTelemetry() {
  if (!instance) {
    instance = new ErrorTelemetry();
  }
  return instance;
}

module.exports = {
  ErrorTelemetry,
  getErrorTelemetry,
  errorTelemetry: getErrorTelemetry()
};
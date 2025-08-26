/**
 * BUMBA Executive Mode - Sprint 1: Crisis Detection System
 * 
 * Real-time monitoring and trigger detection for Executive Mode activation
 * Monitors system health and automatically triggers CEO mode when needed
 */

const EventEmitter = require('events');

/**
 * Crisis Detection System
 * Monitors various metrics and triggers Executive Mode when thresholds are exceeded
 */
class CrisisDetectionSystem extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      // Monitoring intervals
      checkInterval: config.checkInterval || 1000, // 1 second
      aggregationWindow: config.aggregationWindow || 5000, // 5 seconds
      
      // Crisis thresholds
      thresholds: {
        errorRate: config.errorRateThreshold || 0.1, // 10% errors
        responseTime: config.responseTimeThreshold || 5000, // 5 seconds
        memoryUsage: config.memoryThreshold || 0.9, // 90% memory
        cpuUsage: config.cpuThreshold || 0.9, // 90% CPU
        userComplaints: config.complaintsThreshold || 10, // 10 complaints
        failedTasks: config.failedTasksThreshold || 5, // 5 consecutive failures
        downtime: config.downtimeThreshold || 30000 // 30 seconds
      },
      
      // Trigger sensitivity
      sensitivity: config.sensitivity || 'medium',
      autoActivate: config.autoActivate !== false
    };
    
    // Metrics storage
    this.metrics = {
      errors: [],
      responseTimes: [],
      memoryUsage: [],
      cpuUsage: [],
      userComplaints: [],
      failedTasks: [],
      systemHealth: 'healthy'
    };
    
    // Trigger history
    this.triggerHistory = [];
    this.lastTrigger = null;
    this.isMonitoring = false;
    
    // Crisis state
    this.crisisActive = false;
    this.crisisStartTime = null;
    this.crisisType = null;
    this.severity = null;
  }

  /**
   * Start monitoring system metrics
   */
  startMonitoring() {
    if (this.isMonitoring) {
      return;
    }
    
    this.isMonitoring = true;
    console.log('🔍 Crisis Detection System: Monitoring started');
    
    // Start periodic checks
    this.monitoringInterval = setInterval(() => {
      this.performHealthCheck();
    }, this.config.checkInterval);
    
    // Start metric collection
    this.collectMetrics();
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (!this.isMonitoring) {
      return;
    }
    
    this.isMonitoring = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    console.log('🔍 Crisis Detection System: Monitoring stopped');
  }

  /**
   * Collect system metrics
   */
  collectMetrics() {
    // Collect memory usage
    const memUsage = process.memoryUsage();
    const totalMem = memUsage.heapTotal;
    const usedMem = memUsage.heapUsed;
    const memoryRatio = usedMem / totalMem;
    
    this.metrics.memoryUsage.push({
      timestamp: Date.now(),
      value: memoryRatio
    });
    
    // Simulate CPU usage (in real implementation, use os.loadavg())
    const cpuUsage = Math.random() * 0.5; // Simulated 0-50% usage
    this.metrics.cpuUsage.push({
      timestamp: Date.now(),
      value: cpuUsage
    });
    
    // Clean old metrics (keep only last aggregation window)
    const cutoff = Date.now() - this.config.aggregationWindow;
    this.cleanOldMetrics(cutoff);
  }

  /**
   * Perform health check and detect crises
   */
  async performHealthCheck() {
    const triggers = [];
    
    // Check error rate
    const errorRate = this.calculateErrorRate();
    if (errorRate > this.config.thresholds.errorRate) {
      triggers.push({
        type: 'ERROR_RATE',
        value: errorRate,
        threshold: this.config.thresholds.errorRate,
        severity: this.calculateSeverity('error', errorRate)
      });
    }
    
    // Check response time
    const avgResponseTime = this.calculateAverageResponseTime();
    if (avgResponseTime > this.config.thresholds.responseTime) {
      triggers.push({
        type: 'RESPONSE_TIME',
        value: avgResponseTime,
        threshold: this.config.thresholds.responseTime,
        severity: this.calculateSeverity('performance', avgResponseTime)
      });
    }
    
    // Check memory usage
    const currentMemory = this.getCurrentMemoryUsage();
    if (currentMemory > this.config.thresholds.memoryUsage) {
      triggers.push({
        type: 'MEMORY_PRESSURE',
        value: currentMemory,
        threshold: this.config.thresholds.memoryUsage,
        severity: this.calculateSeverity('resource', currentMemory)
      });
    }
    
    // Check user complaints
    const recentComplaints = this.getRecentUserComplaints();
    if (recentComplaints > this.config.thresholds.userComplaints) {
      triggers.push({
        type: 'USER_COMPLAINTS',
        value: recentComplaints,
        threshold: this.config.thresholds.userComplaints,
        severity: this.calculateSeverity('user', recentComplaints)
      });
    }
    
    // Check consecutive failures
    const consecutiveFailures = this.getConsecutiveFailures();
    if (consecutiveFailures > this.config.thresholds.failedTasks) {
      triggers.push({
        type: 'TASK_FAILURES',
        value: consecutiveFailures,
        threshold: this.config.thresholds.failedTasks,
        severity: this.calculateSeverity('reliability', consecutiveFailures)
      });
    }
    
    // Process triggers
    if (triggers.length > 0) {
      await this.processTriggers(triggers);
    } else if (this.crisisActive) {
      // Check if crisis can be resolved
      this.checkCrisisResolution();
    }
    
    // Update system health
    this.updateSystemHealth(triggers);
  }

  /**
   * Process detected triggers
   */
  async processTriggers(triggers) {
    // Sort by severity
    triggers.sort((a, b) => {
      const severityOrder = { CRITICAL: 3, HIGH: 2, MEDIUM: 1, LOW: 0 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
    
    const primaryTrigger = triggers[0];
    
    // Determine overall crisis type and severity
    const crisisType = this.determineCrisisType(triggers);
    const overallSeverity = this.determineOverallSeverity(triggers);
    
    // Check if we should trigger Executive Mode
    if (this.shouldTriggerExecutiveMode(overallSeverity)) {
      this.triggerExecutiveMode(crisisType, overallSeverity, triggers);
    } else {
      // Log warning
      console.log(`🟠️ Crisis Detection: ${crisisType} detected (${overallSeverity} severity)`);
    }
    
    // Store trigger history
    this.triggerHistory.push({
      timestamp: Date.now(),
      triggers,
      crisisType,
      severity: overallSeverity,
      executiveModeTriggered: this.shouldTriggerExecutiveMode(overallSeverity)
    });
  }

  /**
   * Trigger Executive Mode activation
   */
  triggerExecutiveMode(crisisType, severity, triggers) {
    if (this.crisisActive && this.crisisType === crisisType) {
      // Crisis already being handled
      return;
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('🔴 CRISIS DETECTED - TRIGGERING EXECUTIVE MODE');
    console.log('='.repeat(60));
    console.log(`Crisis Type: ${crisisType}`);
    console.log(`Severity: ${severity}`);
    console.log('Triggers:');
    triggers.forEach(t => {
      console.log(`  • ${t.type}: ${t.value.toFixed(2)} (threshold: ${t.threshold})`);
    });
    console.log('='.repeat(60) + '\n');
    
    this.crisisActive = true;
    this.crisisStartTime = Date.now();
    this.crisisType = crisisType;
    this.severity = severity;
    
    // Emit executive mode activation event
    this.emit('executive-mode-required', {
      trigger: 'CRISIS',
      crisisType,
      severity,
      triggers,
      timestamp: Date.now(),
      recommendations: this.generateRecommendations(crisisType, triggers)
    });
  }

  /**
   * Calculate error rate
   */
  calculateErrorRate() {
    if (this.metrics.errors.length === 0) {
      return 0;
    }
    
    const recentErrors = this.metrics.errors.filter(e => 
      e.timestamp > Date.now() - this.config.aggregationWindow
    );
    
    const totalRequests = recentErrors.reduce((sum, e) => sum + e.total, 0);
    const failedRequests = recentErrors.reduce((sum, e) => sum + e.failed, 0);
    
    return totalRequests > 0 ? failedRequests / totalRequests : 0;
  }

  /**
   * Calculate average response time
   */
  calculateAverageResponseTime() {
    if (this.metrics.responseTimes.length === 0) {
      return 0;
    }
    
    const recent = this.metrics.responseTimes.filter(r => 
      r.timestamp > Date.now() - this.config.aggregationWindow
    );
    
    if (recent.length === 0) {
      return 0;
    }
    
    const sum = recent.reduce((total, r) => total + r.value, 0);
    return sum / recent.length;
  }

  /**
   * Get current memory usage ratio
   */
  getCurrentMemoryUsage() {
    if (this.metrics.memoryUsage.length === 0) {
      return 0;
    }
    
    return this.metrics.memoryUsage[this.metrics.memoryUsage.length - 1].value;
  }

  /**
   * Get recent user complaints count
   */
  getRecentUserComplaints() {
    const recent = this.metrics.userComplaints.filter(c => 
      c.timestamp > Date.now() - this.config.aggregationWindow
    );
    
    return recent.length;
  }

  /**
   * Get consecutive failure count
   */
  getConsecutiveFailures() {
    if (this.metrics.failedTasks.length === 0) {
      return 0;
    }
    
    let consecutive = 0;
    for (let i = this.metrics.failedTasks.length - 1; i >= 0; i--) {
      if (this.metrics.failedTasks[i].failed) {
        consecutive++;
      } else {
        break;
      }
    }
    
    return consecutive;
  }

  /**
   * Calculate severity based on metric type and value
   */
  calculateSeverity(metricType, value) {
    const threshold = this.config.thresholds[
      metricType === 'error' ? 'errorRate' :
      metricType === 'performance' ? 'responseTime' :
      metricType === 'resource' ? 'memoryUsage' :
      metricType === 'user' ? 'userComplaints' :
      'failedTasks'
    ];
    
    const ratio = value / threshold;
    
    if (ratio >= 2) return 'CRITICAL';
    if (ratio >= 1.5) return 'HIGH';
    if (ratio >= 1) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Determine crisis type from triggers
   */
  determineCrisisType(triggers) {
    const triggerTypes = triggers.map(t => t.type);
    
    if (triggerTypes.includes('ERROR_RATE') || triggerTypes.includes('TASK_FAILURES')) {
      return 'SYSTEM_FAILURE';
    }
    if (triggerTypes.includes('RESPONSE_TIME')) {
      return 'PERFORMANCE_DEGRADATION';
    }
    if (triggerTypes.includes('MEMORY_PRESSURE')) {
      return 'RESOURCE_EXHAUSTION';
    }
    if (triggerTypes.includes('USER_COMPLAINTS')) {
      return 'USER_EXPERIENCE_CRISIS';
    }
    
    return 'GENERAL_CRISIS';
  }

  /**
   * Determine overall severity
   */
  determineOverallSeverity(triggers) {
    const severities = triggers.map(t => t.severity);
    
    if (severities.includes('CRITICAL')) return 'CRITICAL';
    if (severities.includes('HIGH')) return 'HIGH';
    if (severities.includes('MEDIUM')) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Check if Executive Mode should be triggered
   */
  shouldTriggerExecutiveMode(severity) {
    if (!this.config.autoActivate) {
      return false;
    }
    
    const sensitivityThresholds = {
      high: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      medium: ['MEDIUM', 'HIGH', 'CRITICAL'],
      low: ['HIGH', 'CRITICAL']
    };
    
    const threshold = sensitivityThresholds[this.config.sensitivity] || sensitivityThresholds.medium;
    return threshold.includes(severity);
  }

  /**
   * Generate recommendations for crisis resolution
   */
  generateRecommendations(crisisType, triggers) {
    const recommendations = [];
    
    switch (crisisType) {
      case 'SYSTEM_FAILURE':
        recommendations.push('Activate all engineering specialists');
        recommendations.push('Pause non-critical operations');
        recommendations.push('Enable detailed error logging');
        break;
        
      case 'PERFORMANCE_DEGRADATION':
        recommendations.push('Scale up resources');
        recommendations.push('Enable caching');
        recommendations.push('Defer background tasks');
        break;
        
      case 'RESOURCE_EXHAUSTION':
        recommendations.push('Trigger garbage collection');
        recommendations.push('Clear caches');
        recommendations.push('Reduce concurrent operations');
        break;
        
      case 'USER_EXPERIENCE_CRISIS':
        recommendations.push('Prioritize user-facing operations');
        recommendations.push('Enable fallback modes');
        recommendations.push('Increase monitoring frequency');
        break;
    }
    
    return recommendations;
  }

  /**
   * Check if crisis can be resolved
   */
  checkCrisisResolution() {
    if (!this.crisisActive) {
      return;
    }
    
    const duration = Date.now() - this.crisisStartTime;
    const minDuration = 10000; // 10 seconds minimum
    
    if (duration < minDuration) {
      return; // Don't resolve too quickly
    }
    
    // Check if metrics have improved
    const currentHealth = this.assessCurrentHealth();
    
    if (currentHealth === 'healthy') {
      this.resolveCrisis();
    }
  }

  /**
   * Resolve active crisis
   */
  resolveCrisis() {
    const duration = Date.now() - this.crisisStartTime;
    
    console.log('\n' + '='.repeat(60));
    console.log('🏁 CRISIS RESOLVED');
    console.log('='.repeat(60));
    console.log(`Crisis Type: ${this.crisisType}`);
    console.log(`Duration: ${Math.round(duration / 1000)}s`);
    console.log(`Final Severity: ${this.severity}`);
    console.log('='.repeat(60) + '\n');
    
    this.crisisActive = false;
    this.crisisType = null;
    this.severity = null;
    
    // Emit crisis resolved event
    this.emit('crisis-resolved', {
      duration,
      timestamp: Date.now()
    });
  }

  /**
   * Assess current system health
   */
  assessCurrentHealth() {
    const errorRate = this.calculateErrorRate();
    const responseTime = this.calculateAverageResponseTime();
    const memory = this.getCurrentMemoryUsage();
    
    if (errorRate < this.config.thresholds.errorRate * 0.5 &&
        responseTime < this.config.thresholds.responseTime * 0.5 &&
        memory < this.config.thresholds.memoryUsage * 0.8) {
      return 'healthy';
    }
    
    if (errorRate < this.config.thresholds.errorRate &&
        responseTime < this.config.thresholds.responseTime &&
        memory < this.config.thresholds.memoryUsage) {
      return 'recovering';
    }
    
    return 'unhealthy';
  }

  /**
   * Update system health status
   */
  updateSystemHealth(triggers) {
    const previousHealth = this.metrics.systemHealth;
    
    if (triggers.length === 0) {
      this.metrics.systemHealth = 'healthy';
    } else if (triggers.some(t => t.severity === 'CRITICAL')) {
      this.metrics.systemHealth = 'critical';
    } else if (triggers.some(t => t.severity === 'HIGH')) {
      this.metrics.systemHealth = 'degraded';
    } else {
      this.metrics.systemHealth = 'warning';
    }
    
    if (previousHealth !== this.metrics.systemHealth) {
      this.emit('health-changed', {
        previous: previousHealth,
        current: this.metrics.systemHealth,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Clean old metrics
   */
  cleanOldMetrics(cutoff) {
    ['errors', 'responseTimes', 'memoryUsage', 'cpuUsage', 'userComplaints', 'failedTasks'].forEach(metric => {
      this.metrics[metric] = this.metrics[metric].filter(m => m.timestamp > cutoff);
    });
  }

  /**
   * Record error for monitoring
   */
  recordError(error) {
    this.metrics.errors.push({
      timestamp: Date.now(),
      total: 1,
      failed: error ? 1 : 0,
      error
    });
  }

  /**
   * Record response time
   */
  recordResponseTime(time) {
    this.metrics.responseTimes.push({
      timestamp: Date.now(),
      value: time
    });
  }

  /**
   * Record user complaint
   */
  recordUserComplaint(complaint) {
    this.metrics.userComplaints.push({
      timestamp: Date.now(),
      complaint
    });
  }

  /**
   * Record task result
   */
  recordTaskResult(success) {
    this.metrics.failedTasks.push({
      timestamp: Date.now(),
      failed: !success
    });
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      monitoring: this.isMonitoring,
      crisisActive: this.crisisActive,
      crisisType: this.crisisType,
      severity: this.severity,
      systemHealth: this.metrics.systemHealth,
      metrics: {
        errorRate: this.calculateErrorRate(),
        avgResponseTime: this.calculateAverageResponseTime(),
        memoryUsage: this.getCurrentMemoryUsage(),
        recentComplaints: this.getRecentUserComplaints(),
        consecutiveFailures: this.getConsecutiveFailures()
      },
      triggerHistory: this.triggerHistory.slice(-10) // Last 10 triggers
    };
  }
}

module.exports = CrisisDetectionSystem;
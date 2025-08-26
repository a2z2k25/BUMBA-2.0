/**
 * BUMBA Crisis Detection System
 * Monitors system health and triggers executive mode during crises
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');

class CrisisDetector extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      // Detection thresholds
      errorRateThreshold: config.errorRateThreshold || 0.1,        // 10% error rate
      responseTimeThreshold: config.responseTimeThreshold || 5000,  // 5 seconds
      memoryThreshold: config.memoryThreshold || 0.9,              // 90% memory usage
      userComplaintsThreshold: config.userComplaintsThreshold || 5, // 5 complaints
      
      // Monitoring settings
      checkInterval: config.checkInterval || 5000,                  // Check every 5 seconds
      windowSize: config.windowSize || 60000,                       // 1 minute window
      
      // Severity levels
      severityLevels: {
        LOW: { weight: 1, triggers: 1 },
        MEDIUM: { weight: 2, triggers: 2 },
        HIGH: { weight: 3, triggers: 3 },
        CRITICAL: { weight: 4, triggers: 4 }
      }
    };
    
    // Tracking metrics
    this.metrics = {
      errors: [],
      responseTimes: [],
      memoryUsage: [],
      userComplaints: [],
      lastCheck: null
    };
    
    // Crisis state
    this.currentCrisis = null;
    this.crisisHistory = [];
    this.monitoring = false;
    this.checkInterval = null;
    
    // Initialize
    this.initialize();
  }
  
  /**
   * Initialize crisis detection
   */
  initialize() {
    logger.info('🔴 Crisis Detector initialized');
    logger.info(`   Error Rate Threshold: ${this.config.errorRateThreshold * 100}%`);
    logger.info(`   Response Time Threshold: ${this.config.responseTimeThreshold}ms`);
    logger.info(`   Memory Threshold: ${this.config.memoryThreshold * 100}%`);
  }
  
  /**
   * Start monitoring for crises
   */
  startMonitoring() {
    if (this.monitoring) {
      logger.warn('Crisis monitoring already active');
      return;
    }
    
    this.monitoring = true;
    logger.info('🔴 Crisis monitoring started');
    
    // Start periodic checks
    this.checkInterval = setInterval(() => {
      this.performCrisisCheck();
    }, this.config.checkInterval);
    
    // Perform initial check
    this.performCrisisCheck();
  }
  
  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (!this.monitoring) {
      return;
    }
    
    this.monitoring = false;
    
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    
    logger.info('🔴 Crisis monitoring stopped');
  }
  
  /**
   * Perform crisis check
   */
  async performCrisisCheck() {
    const now = Date.now();
    this.metrics.lastCheck = now;
    
    // Collect current metrics
    const currentMetrics = await this.collectMetrics();
    
    // Analyze for crisis conditions
    const crisisAnalysis = this.analyzeCrisisConditions(currentMetrics);
    
    // Handle crisis if detected
    if (crisisAnalysis.isCrisis) {
      await this.handleCrisis(crisisAnalysis);
    } else if (this.currentCrisis) {
      // Crisis resolved
      await this.resolveCrisis();
    }
  }
  
  /**
   * Collect current system metrics
   */
  async collectMetrics() {
    const now = Date.now();
    const windowStart = now - this.config.windowSize;
    
    // Clean old metrics
    this.cleanOldMetrics(windowStart);
    
    // Get current metrics
    const memUsage = process.memoryUsage();
    const memoryPercent = memUsage.heapUsed / memUsage.heapTotal;
    
    // Calculate rates
    const errorRate = this.calculateErrorRate();
    const avgResponseTime = this.calculateAverageResponseTime();
    const complaintCount = this.metrics.userComplaints.length;
    
    return {
      timestamp: now,
      errorRate,
      avgResponseTime,
      memoryPercent,
      complaintCount,
      raw: {
        errors: this.metrics.errors.length,
        responses: this.metrics.responseTimes.length,
        memory: memUsage
      }
    };
  }
  
  /**
   * Analyze metrics for crisis conditions
   */
  analyzeCrisisConditions(metrics) {
    const triggers = [];
    let maxSeverity = null;
    
    // Check error rate
    if (metrics.errorRate > this.config.errorRateThreshold) {
      triggers.push({
        type: 'ERROR_RATE',
        value: metrics.errorRate,
        threshold: this.config.errorRateThreshold,
        severity: metrics.errorRate > 0.3 ? 'CRITICAL' : 
                  metrics.errorRate > 0.2 ? 'HIGH' : 'MEDIUM'
      });
    }
    
    // Check response time
    if (metrics.avgResponseTime > this.config.responseTimeThreshold) {
      triggers.push({
        type: 'RESPONSE_TIME',
        value: metrics.avgResponseTime,
        threshold: this.config.responseTimeThreshold,
        severity: metrics.avgResponseTime > 10000 ? 'CRITICAL' :
                  metrics.avgResponseTime > 7000 ? 'HIGH' : 'MEDIUM'
      });
    }
    
    // Check memory usage
    if (metrics.memoryPercent > this.config.memoryThreshold) {
      triggers.push({
        type: 'MEMORY_USAGE',
        value: metrics.memoryPercent,
        threshold: this.config.memoryThreshold,
        severity: metrics.memoryPercent > 0.95 ? 'CRITICAL' : 'HIGH'
      });
    }
    
    // Check user complaints
    if (metrics.complaintCount >= this.config.userComplaintsThreshold) {
      triggers.push({
        type: 'USER_COMPLAINTS',
        value: metrics.complaintCount,
        threshold: this.config.userComplaintsThreshold,
        severity: metrics.complaintCount > 10 ? 'HIGH' : 'MEDIUM'
      });
    }
    
    // Determine overall severity
    if (triggers.length > 0) {
      const severities = triggers.map(t => t.severity);
      if (severities.includes('CRITICAL')) maxSeverity = 'CRITICAL';
      else if (severities.includes('HIGH')) maxSeverity = 'HIGH';
      else if (severities.includes('MEDIUM')) maxSeverity = 'MEDIUM';
      else maxSeverity = 'LOW';
    }
    
    return {
      isCrisis: triggers.length > 0,
      severity: maxSeverity,
      triggers,
      metrics,
      timestamp: Date.now()
    };
  }
  
  /**
   * Handle detected crisis
   */
  async handleCrisis(analysis) {
    // Check if this is a new crisis or escalation
    if (!this.currentCrisis || this.isEscalation(analysis)) {
      logger.error('🔴🔴🔴 CRISIS DETECTED 🔴🔴🔴');
      logger.error(`Severity: ${analysis.severity}`);
      logger.error(`Triggers: ${analysis.triggers.map(t => t.type).join(', ')}`);
      
      this.currentCrisis = {
        id: `crisis-${Date.now()}`,
        startTime: Date.now(),
        severity: analysis.severity,
        triggers: analysis.triggers,
        metrics: analysis.metrics
      };
      
      // Emit crisis event
      this.emit('crisis:detected', {
        crisis: this.currentCrisis,
        analysis
      });
      
      // Add to history
      this.crisisHistory.push(this.currentCrisis);
      
      // Log details
      analysis.triggers.forEach(trigger => {
        logger.error(`   ${trigger.type}: ${trigger.value.toFixed(3)} (threshold: ${trigger.threshold})`);
      });
    }
  }
  
  /**
   * Resolve current crisis
   */
  async resolveCrisis() {
    if (!this.currentCrisis) {
      return;
    }
    
    const duration = Date.now() - this.currentCrisis.startTime;
    
    logger.info('🏁 Crisis resolved');
    logger.info(`   Duration: ${duration}ms`);
    
    // Emit resolution event
    this.emit('crisis:resolved', {
      crisis: this.currentCrisis,
      duration
    });
    
    // Update crisis record
    this.currentCrisis.endTime = Date.now();
    this.currentCrisis.duration = duration;
    
    this.currentCrisis = null;
  }
  
  /**
   * Check if new analysis is an escalation
   */
  isEscalation(analysis) {
    if (!this.currentCrisis) return false;
    
    const severityOrder = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    const currentIndex = severityOrder.indexOf(this.currentCrisis.severity);
    const newIndex = severityOrder.indexOf(analysis.severity);
    
    return newIndex > currentIndex;
  }
  
  /**
   * Record an error
   */
  recordError(error) {
    this.metrics.errors.push({
      timestamp: Date.now(),
      error: error.message || error
    });
  }
  
  /**
   * Record response time
   */
  recordResponseTime(time) {
    this.metrics.responseTimes.push({
      timestamp: Date.now(),
      time
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
   * Clean old metrics outside the window
   */
  cleanOldMetrics(windowStart) {
    this.metrics.errors = this.metrics.errors.filter(e => e.timestamp > windowStart);
    this.metrics.responseTimes = this.metrics.responseTimes.filter(r => r.timestamp > windowStart);
    this.metrics.userComplaints = this.metrics.userComplaints.filter(c => c.timestamp > windowStart);
  }
  
  /**
   * Calculate error rate
   */
  calculateErrorRate() {
    const totalRequests = this.metrics.responseTimes.length + this.metrics.errors.length;
    if (totalRequests === 0) return 0;
    return this.metrics.errors.length / totalRequests;
  }
  
  /**
   * Calculate average response time
   */
  calculateAverageResponseTime() {
    if (this.metrics.responseTimes.length === 0) return 0;
    const sum = this.metrics.responseTimes.reduce((acc, r) => acc + r.time, 0);
    return sum / this.metrics.responseTimes.length;
  }
  
  /**
   * Get current status
   */
  getStatus() {
    return {
      monitoring: this.monitoring,
      currentCrisis: this.currentCrisis,
      lastCheck: this.metrics.lastCheck,
      metrics: {
        errorRate: this.calculateErrorRate(),
        avgResponseTime: this.calculateAverageResponseTime(),
        memoryUsage: process.memoryUsage().heapUsed / process.memoryUsage().heapTotal,
        complaints: this.metrics.userComplaints.length
      },
      thresholds: {
        errorRate: this.config.errorRateThreshold,
        responseTime: this.config.responseTimeThreshold,
        memory: this.config.memoryThreshold,
        complaints: this.config.userComplaintsThreshold
      }
    };
  }
  
  /**
   * Simulate a crisis for testing
   */
  simulateCrisis(type = 'ERROR_RATE', severity = 'HIGH') {
    logger.warn(`🧪 Simulating ${severity} ${type} crisis`);
    
    switch (type) {
      case 'ERROR_RATE':
        // Simulate high error rate
        for (let i = 0; i < 20; i++) {
          this.recordError(new Error('Simulated error'));
        }
        for (let i = 0; i < 10; i++) {
          this.recordResponseTime(1000);
        }
        break;
        
      case 'RESPONSE_TIME':
        // Simulate slow responses
        for (let i = 0; i < 10; i++) {
          this.recordResponseTime(10000);
        }
        break;
        
      case 'USER_COMPLAINTS':
        // Simulate user complaints
        for (let i = 0; i < 10; i++) {
          this.recordUserComplaint('System is not working!');
        }
        break;
    }
    
    // Trigger immediate check
    this.performCrisisCheck();
  }
}

// Singleton instance
let instance = null;

module.exports = {
  CrisisDetector,
  getInstance: (config) => {
    if (!instance) {
      instance = new CrisisDetector(config);
    }
    return instance;
  }
};
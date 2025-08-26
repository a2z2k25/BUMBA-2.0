/**
 * BUMBA Executive Metrics System
 * Tracks performance and effectiveness of executive mode
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');

class ExecutiveMetrics extends EventEmitter {
  constructor() {
    super();
    
    // Executive mode metrics
    this.executiveMetrics = {
      activations: 0,
      totalDuration: 0,
      averageDuration: 0,
      successfulResolutions: 0,
      failedResolutions: 0,
      departmentsControlled: 0,
      decisionsPerMinute: 0,
      lastActivation: null
    };
    
    // Crisis metrics
    this.crisisMetrics = {
      totalCrises: 0,
      resolvedCrises: 0,
      averageResolutionTime: 0,
      crisesBySeverity: {
        LOW: 0,
        MEDIUM: 0,
        HIGH: 0,
        CRITICAL: 0
      },
      crisesByType: {}
    };
    
    // Department performance
    this.departmentMetrics = new Map();
    
    // Decision tracking
    this.decisions = [];
    this.decisionOutcomes = new Map();
    
    // Performance indicators
    this.kpis = {
      mttr: 0, // Mean Time To Resolution
      successRate: 0,
      responseTime: 0,
      departmentEfficiency: 0,
      decisionAccuracy: 0
    };
    
    // Time series data for monitoring
    this.timeSeries = {
      responseTimes: [],
      errorRates: [],
      resolutionTimes: [],
      departmentLoads: []
    };
    
    // Active tracking
    this.activeSession = null;
    
    this.initialize();
  }
  
  /**
   * Initialize metrics system
   */
  initialize() {
    logger.info('📊 Executive Metrics System initialized');
    this.startPeriodicCalculation();
  }
  
  /**
   * Start tracking executive session
   */
  startExecutiveSession(context = {}) {
    this.activeSession = {
      startTime: Date.now(),
      endTime: null,
      context,
      decisions: [],
      departmentActions: new Map(),
      crisisData: context.crisis || null
    };
    
    this.executiveMetrics.activations++;
    this.executiveMetrics.lastActivation = new Date();
    
    logger.info('📊 Started tracking executive session');
    
    this.emit('session:started', this.activeSession);
  }
  
  /**
   * End executive session
   */
  endExecutiveSession(outcome = 'success') {
    if (!this.activeSession) {
      logger.warn('No active session to end');
      return;
    }
    
    this.activeSession.endTime = Date.now();
    const duration = this.activeSession.endTime - this.activeSession.startTime;
    
    // Update metrics
    this.executiveMetrics.totalDuration += duration;
    this.executiveMetrics.averageDuration = 
      this.executiveMetrics.totalDuration / this.executiveMetrics.activations;
    
    if (outcome === 'success') {
      this.executiveMetrics.successfulResolutions++;
    } else {
      this.executiveMetrics.failedResolutions++;
    }
    
    // Calculate decisions per minute
    const minutes = duration / 60000;
    if (minutes > 0) {
      this.executiveMetrics.decisionsPerMinute = 
        this.activeSession.decisions.length / minutes;
    }
    
    logger.info(`📊 Executive session ended: ${outcome}`);
    logger.info(`   Duration: ${duration}ms`);
    logger.info(`   Decisions made: ${this.activeSession.decisions.length}`);
    
    this.emit('session:ended', {
      session: this.activeSession,
      outcome,
      duration
    });
    
    this.activeSession = null;
  }
  
  /**
   * Track crisis occurrence
   */
  trackCrisis(crisis) {
    this.crisisMetrics.totalCrises++;
    
    // Track by severity
    if (crisis.severity && this.crisisMetrics.crisesBySeverity[crisis.severity] !== undefined) {
      this.crisisMetrics.crisesBySeverity[crisis.severity]++;
    }
    
    // Track by type
    if (crisis.triggers) {
      crisis.triggers.forEach(trigger => {
        const type = trigger.type;
        this.crisisMetrics.crisesByType[type] = 
          (this.crisisMetrics.crisesByType[type] || 0) + 1;
      });
    }
    
    logger.info(`📊 Crisis tracked: ${crisis.severity} severity`);
  }
  
  /**
   * Track crisis resolution
   */
  trackCrisisResolution(resolutionTime) {
    this.crisisMetrics.resolvedCrises++;
    
    // Update average resolution time
    const totalTime = this.crisisMetrics.averageResolutionTime * 
      (this.crisisMetrics.resolvedCrises - 1) + resolutionTime;
    this.crisisMetrics.averageResolutionTime = 
      totalTime / this.crisisMetrics.resolvedCrises;
    
    // Add to time series
    this.timeSeries.resolutionTimes.push({
      timestamp: Date.now(),
      value: resolutionTime
    });
    
    // Keep time series limited
    if (this.timeSeries.resolutionTimes.length > 100) {
      this.timeSeries.resolutionTimes.shift();
    }
    
    logger.info(`📊 Crisis resolved in ${resolutionTime}ms`);
  }
  
  /**
   * Track executive decision
   */
  trackDecision(decision) {
    const decisionRecord = {
      id: `decision-${Date.now()}`,
      timestamp: Date.now(),
      type: decision.type,
      department: decision.department,
      action: decision.action,
      context: decision.context
    };
    
    this.decisions.push(decisionRecord);
    
    if (this.activeSession) {
      this.activeSession.decisions.push(decisionRecord);
    }
    
    // Keep decisions limited
    if (this.decisions.length > 1000) {
      this.decisions.shift();
    }
    
    this.emit('decision:tracked', decisionRecord);
    
    return decisionRecord.id;
  }
  
  /**
   * Track decision outcome
   */
  trackDecisionOutcome(decisionId, outcome) {
    this.decisionOutcomes.set(decisionId, {
      outcome,
      timestamp: Date.now()
    });
    
    // Calculate decision accuracy
    this.calculateDecisionAccuracy();
  }
  
  /**
   * Track department action
   */
  trackDepartmentAction(department, action, result) {
    if (!this.departmentMetrics.has(department)) {
      this.departmentMetrics.set(department, {
        actions: 0,
        successes: 0,
        failures: 0,
        averageResponseTime: 0,
        lastAction: null
      });
    }
    
    const metrics = this.departmentMetrics.get(department);
    metrics.actions++;
    
    if (result.success) {
      metrics.successes++;
    } else {
      metrics.failures++;
    }
    
    metrics.lastAction = {
      action,
      result,
      timestamp: Date.now()
    };
    
    if (this.activeSession && this.activeSession.departmentActions) {
      const actions = this.activeSession.departmentActions.get(department) || [];
      actions.push({ action, result, timestamp: Date.now() });
      this.activeSession.departmentActions.set(department, actions);
    }
  }
  
  /**
   * Update response time
   */
  updateResponseTime(time) {
    this.timeSeries.responseTimes.push({
      timestamp: Date.now(),
      value: time
    });
    
    // Keep limited
    if (this.timeSeries.responseTimes.length > 100) {
      this.timeSeries.responseTimes.shift();
    }
    
    // Update KPI
    const recent = this.timeSeries.responseTimes.slice(-10);
    if (recent.length > 0) {
      this.kpis.responseTime = 
        recent.reduce((sum, r) => sum + r.value, 0) / recent.length;
    }
  }
  
  /**
   * Update error rate
   */
  updateErrorRate(rate) {
    this.timeSeries.errorRates.push({
      timestamp: Date.now(),
      value: rate
    });
    
    // Keep limited
    if (this.timeSeries.errorRates.length > 100) {
      this.timeSeries.errorRates.shift();
    }
  }
  
  /**
   * Calculate KPIs
   */
  calculateKPIs() {
    // Success rate
    const totalResolutions = this.executiveMetrics.successfulResolutions + 
      this.executiveMetrics.failedResolutions;
    if (totalResolutions > 0) {
      this.kpis.successRate = 
        this.executiveMetrics.successfulResolutions / totalResolutions;
    }
    
    // MTTR (Mean Time To Resolution)
    if (this.crisisMetrics.averageResolutionTime > 0) {
      this.kpis.mttr = this.crisisMetrics.averageResolutionTime;
    }
    
    // Department efficiency
    let totalEfficiency = 0;
    let departmentCount = 0;
    
    this.departmentMetrics.forEach(metrics => {
      if (metrics.actions > 0) {
        const efficiency = metrics.successes / metrics.actions;
        totalEfficiency += efficiency;
        departmentCount++;
      }
    });
    
    if (departmentCount > 0) {
      this.kpis.departmentEfficiency = totalEfficiency / departmentCount;
    }
    
    return this.kpis;
  }
  
  /**
   * Calculate decision accuracy
   */
  calculateDecisionAccuracy() {
    let correct = 0;
    let total = 0;
    
    this.decisionOutcomes.forEach(outcome => {
      total++;
      if (outcome.outcome === 'success' || outcome.outcome === 'correct') {
        correct++;
      }
    });
    
    if (total > 0) {
      this.kpis.decisionAccuracy = correct / total;
    }
  }
  
  /**
   * Get current metrics
   */
  getMetrics() {
    return {
      executive: this.executiveMetrics,
      crisis: this.crisisMetrics,
      departments: Object.fromEntries(this.departmentMetrics),
      kpis: this.calculateKPIs(),
      activeSession: this.activeSession ? {
        duration: Date.now() - this.activeSession.startTime,
        decisions: this.activeSession.decisions.length,
        departments: this.activeSession.departmentActions.size
      } : null
    };
  }
  
  /**
   * Get performance report
   */
  getPerformanceReport() {
    const metrics = this.getMetrics();
    
    return {
      summary: {
        totalActivations: metrics.executive.activations,
        successRate: `${(metrics.kpis.successRate * 100).toFixed(1)}%`,
        averageResolutionTime: `${metrics.kpis.mttr.toFixed(0)}ms`,
        departmentEfficiency: `${(metrics.kpis.departmentEfficiency * 100).toFixed(1)}%`,
        decisionAccuracy: `${(metrics.kpis.decisionAccuracy * 100).toFixed(1)}%`
      },
      crisis: {
        total: metrics.crisis.totalCrises,
        resolved: metrics.crisis.resolvedCrises,
        resolutionRate: metrics.crisis.totalCrises > 0 ? 
          `${((metrics.crisis.resolvedCrises / metrics.crisis.totalCrises) * 100).toFixed(1)}%` : 'N/A',
        distribution: metrics.crisis.crisesBySeverity
      },
      executive: {
        activations: metrics.executive.activations,
        averageDuration: `${metrics.executive.averageDuration.toFixed(0)}ms`,
        decisionsPerMinute: metrics.executive.decisionsPerMinute.toFixed(1),
        lastActivation: metrics.executive.lastActivation
      },
      trends: {
        responseTimeImproving: this.isMetricImproving('responseTimes'),
        errorRateImproving: this.isMetricImproving('errorRates', true), // Lower is better
        resolutionTimeImproving: this.isMetricImproving('resolutionTimes', true)
      }
    };
  }
  
  /**
   * Check if metric is improving
   */
  isMetricImproving(metric, lowerIsBetter = false) {
    const data = this.timeSeries[metric];
    if (data.length < 10) return null;
    
    const recent = data.slice(-5).map(d => d.value);
    const previous = data.slice(-10, -5).map(d => d.value);
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const previousAvg = previous.reduce((a, b) => a + b, 0) / previous.length;
    
    if (lowerIsBetter) {
      return recentAvg < previousAvg;
    } else {
      return recentAvg > previousAvg;
    }
  }
  
  /**
   * Start periodic KPI calculation
   */
  startPeriodicCalculation() {
    setInterval(() => {
      this.calculateKPIs();
      this.emit('kpis:updated', this.kpis);
    }, 30000); // Every 30 seconds
  }
  
  /**
   * Reset metrics
   */
  reset() {
    this.executiveMetrics = {
      activations: 0,
      totalDuration: 0,
      averageDuration: 0,
      successfulResolutions: 0,
      failedResolutions: 0,
      departmentsControlled: 0,
      decisionsPerMinute: 0,
      lastActivation: null
    };
    
    this.crisisMetrics.totalCrises = 0;
    this.crisisMetrics.resolvedCrises = 0;
    this.decisions = [];
    this.decisionOutcomes.clear();
    this.departmentMetrics.clear();
    
    logger.info('📊 Metrics reset');
  }
}

// Singleton instance
let instance = null;

module.exports = {
  ExecutiveMetrics,
  getInstance: () => {
    if (!instance) {
      instance = new ExecutiveMetrics();
    }
    return instance;
  }
};
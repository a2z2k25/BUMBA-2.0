/**
 * Deadline Management System for TTL-Based Routing
 * Tracks task deadlines, SLAs, and handles escalations
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');

/**
 * Deadline Structure
 */
class Deadline {
  constructor(taskId, deadline, priority = 'normal') {
    this.id = `deadline-${Date.now()}-${Math.random()}`;
    this.taskId = taskId;
    this.deadline = deadline;
    this.priority = priority;
    this.createdAt = Date.now();
    this.status = 'active';
    this.escalationLevel = 0;
    this.alerts = [];
    this.metadata = {};
  }
  
  getTimeRemaining() {
    return Math.max(0, this.deadline - Date.now());
  }
  
  getProgress() {
    const elapsed = Date.now() - this.createdAt;
    const total = this.deadline - this.createdAt;
    return Math.min(1, elapsed / total);
  }
  
  isExpired() {
    return Date.now() > this.deadline;
  }
  
  isAtRisk() {
    const remaining = this.getTimeRemaining();
    const total = this.deadline - this.createdAt;
    return remaining < total * 0.2; // Less than 20% time remaining
  }
  
  addAlert(alert) {
    this.alerts.push({
      ...alert,
      timestamp: Date.now()
    });
  }
}

/**
 * SLA Definition
 */
class SLA {
  constructor(name, config) {
    this.name = name;
    this.targetTime = config.targetTime;
    this.criticalTime = config.criticalTime || config.targetTime * 1.5;
    this.priority = config.priority || 'normal';
    this.escalationPolicy = config.escalationPolicy || 'standard';
    this.alertThresholds = config.alertThresholds || [0.5, 0.75, 0.9];
    this.metadata = config.metadata || {};
  }
  
  calculateDeadline(startTime = Date.now()) {
    return startTime + this.targetTime;
  }
  
  isViolated(duration) {
    return duration > this.targetTime;
  }
  
  isCritical(duration) {
    return duration > this.criticalTime;
  }
  
  getComplianceLevel(duration) {
    if (duration <= this.targetTime) return 'compliant';
    if (duration <= this.criticalTime) return 'warning';
    return 'violated';
  }
}

/**
 * Escalation Policy
 */
class EscalationPolicy {
  constructor(name, levels) {
    this.name = name;
    this.levels = levels; // Array of escalation levels
    this.currentLevel = 0;
  }
  
  getNextLevel() {
    if (this.currentLevel < this.levels.length - 1) {
      return this.levels[++this.currentLevel];
    }
    return this.levels[this.currentLevel];
  }
  
  reset() {
    this.currentLevel = 0;
  }
  
  getCurrentActions() {
    return this.levels[this.currentLevel].actions;
  }
}

/**
 * Default Escalation Policies
 */
const DEFAULT_ESCALATION_POLICIES = {
  standard: [
    {
      level: 0,
      threshold: 0.5,
      actions: ['notify', 'log'],
      message: 'Task at 50% of deadline'
    },
    {
      level: 1,
      threshold: 0.75,
      actions: ['alert', 'prioritize'],
      message: 'Task at 75% of deadline - increasing priority'
    },
    {
      level: 2,
      threshold: 0.9,
      actions: ['escalate', 'reassign'],
      message: 'Task at 90% of deadline - escalating'
    },
    {
      level: 3,
      threshold: 1.0,
      actions: ['critical', 'emergency'],
      message: 'Deadline missed - emergency response'
    }
  ],
  relaxed: [
    {
      level: 0,
      threshold: 0.8,
      actions: ['log'],
      message: 'Task approaching deadline'
    },
    {
      level: 1,
      threshold: 1.0,
      actions: ['notify'],
      message: 'Deadline reached'
    }
  ],
  strict: [
    {
      level: 0,
      threshold: 0.25,
      actions: ['notify'],
      message: 'Early warning - 25% of deadline'
    },
    {
      level: 1,
      threshold: 0.5,
      actions: ['alert', 'log'],
      message: '50% of deadline consumed'
    },
    {
      level: 2,
      threshold: 0.7,
      actions: ['escalate', 'prioritize'],
      message: 'Approaching deadline - escalating'
    },
    {
      level: 3,
      threshold: 0.85,
      actions: ['critical', 'reassign'],
      message: 'Critical - immediate action required'
    },
    {
      level: 4,
      threshold: 0.95,
      actions: ['emergency', 'all-hands'],
      message: 'Emergency - all resources mobilized'
    }
  ]
};

/**
 * Main Deadline Manager
 */
class DeadlineManager extends EventEmitter {
  constructor(config = {}) {
    super();
    
    // Configuration
    this.config = {
      // Deadline settings
      defaultSLA: config.defaultSLA || 'standard',
      enableEscalation: config.enableEscalation !== false,
      enableAlerts: config.enableAlerts !== false,
      
      // Monitoring settings
      checkInterval: config.checkInterval || 5000,          // 5 seconds
      alertLeadTime: config.alertLeadTime || 60000,        // 1 minute warning
      
      // SLA settings
      slaComplianceTarget: config.slaComplianceTarget || 0.95,
      trackHistorical: config.trackHistorical !== false,
      historyRetention: config.historyRetention || 86400000, // 24 hours
      
      // Escalation settings
      maxEscalationLevel: config.maxEscalationLevel || 5,
      escalationCooldown: config.escalationCooldown || 300000  // 5 minutes
    };
    
    // Deadline state
    this.deadlines = new Map();
    this.slas = new Map();
    this.escalationPolicies = new Map();
    this.completedDeadlines = [];
    
    // Statistics
    this.statistics = {
      totalDeadlines: 0,
      metDeadlines: 0,
      missedDeadlines: 0,
      currentActive: 0,
      averageCompletionTime: 0,
      slaCompliance: 1.0,
      escalations: 0,
      alerts: 0
    };
    
    // Initialize default SLAs and policies
    this.initializeDefaults();
    
    // Start monitoring
    this.startMonitoring();
    
    logger.info('⏰ Deadline Manager initialized');
  }
  
  /**
   * Initialize default SLAs and escalation policies
   */
  initializeDefaults() {
    // Default SLAs
    this.registerSLA('ultra-fast', {
      targetTime: 5000,
      criticalTime: 7500,
      priority: 'critical',
      escalationPolicy: 'strict'
    });
    
    this.registerSLA('fast', {
      targetTime: 30000,
      criticalTime: 45000,
      priority: 'high',
      escalationPolicy: 'standard'
    });
    
    this.registerSLA('standard', {
      targetTime: 180000,
      criticalTime: 240000,
      priority: 'normal',
      escalationPolicy: 'standard'
    });
    
    this.registerSLA('extended', {
      targetTime: 600000,
      criticalTime: 900000,
      priority: 'low',
      escalationPolicy: 'relaxed'
    });
    
    // Initialize escalation policies
    for (const [name, levels] of Object.entries(DEFAULT_ESCALATION_POLICIES)) {
      this.escalationPolicies.set(name, new EscalationPolicy(name, levels));
    }
    
    logger.debug(`Initialized ${this.slas.size} SLAs and ${this.escalationPolicies.size} escalation policies`);
  }
  
  /**
   * Register a new SLA
   */
  registerSLA(name, config) {
    const sla = new SLA(name, config);
    this.slas.set(name, sla);
    return sla;
  }
  
  /**
   * Create deadline for task
   */
  createDeadline(taskId, deadline, options = {}) {
    // Check if deadline already exists
    if (this.deadlines.has(taskId)) {
      logger.warn(`Deadline already exists for task ${taskId}`);
      return this.deadlines.get(taskId);
    }
    
    // Create new deadline
    const deadlineObj = new Deadline(taskId, deadline, options.priority);
    
    // Add metadata
    if (options.sla) {
      deadlineObj.metadata.sla = options.sla;
    }
    if (options.description) {
      deadlineObj.metadata.description = options.description;
    }
    
    // Store deadline
    this.deadlines.set(taskId, deadlineObj);
    this.statistics.totalDeadlines++;
    this.statistics.currentActive++;
    
    // Set up escalation if enabled
    if (this.config.enableEscalation && options.escalationPolicy) {
      this.setupEscalation(deadlineObj, options.escalationPolicy);
    }
    
    // Emit event
    this.emit('deadline:created', {
      taskId,
      deadline,
      timeRemaining: deadlineObj.getTimeRemaining()
    });
    
    return deadlineObj;
  }
  
  /**
   * Create deadline from SLA
   */
  createDeadlineFromSLA(taskId, slaName, startTime = Date.now()) {
    const sla = this.slas.get(slaName);
    
    if (!sla) {
      logger.error(`SLA ${slaName} not found`);
      return null;
    }
    
    const deadline = sla.calculateDeadline(startTime);
    
    return this.createDeadline(taskId, deadline, {
      priority: sla.priority,
      sla: slaName,
      escalationPolicy: sla.escalationPolicy
    });
  }
  
  /**
   * Update deadline
   */
  updateDeadline(taskId, newDeadline) {
    const deadline = this.deadlines.get(taskId);
    
    if (!deadline) {
      logger.warn(`No deadline found for task ${taskId}`);
      return false;
    }
    
    const oldDeadline = deadline.deadline;
    deadline.deadline = newDeadline;
    
    // Reset escalation if extended
    if (newDeadline > oldDeadline) {
      deadline.escalationLevel = 0;
    }
    
    this.emit('deadline:updated', {
      taskId,
      oldDeadline,
      newDeadline,
      timeRemaining: deadline.getTimeRemaining()
    });
    
    return true;
  }
  
  /**
   * Complete deadline
   */
  completeDeadline(taskId, completionTime = Date.now()) {
    const deadline = this.deadlines.get(taskId);
    
    if (!deadline) {
      logger.warn(`No deadline found for task ${taskId}`);
      return null;
    }
    
    // Calculate completion metrics
    const duration = completionTime - deadline.createdAt;
    const met = completionTime <= deadline.deadline;
    
    // Update statistics
    if (met) {
      this.statistics.metDeadlines++;
    } else {
      this.statistics.missedDeadlines++;
    }
    
    this.statistics.currentActive--;
    this.updateAverageCompletionTime(duration);
    this.updateSLACompliance(deadline, met);
    
    // Mark as completed
    deadline.status = 'completed';
    deadline.completedAt = completionTime;
    deadline.met = met;
    
    // Move to completed list
    this.completedDeadlines.push(deadline);
    this.deadlines.delete(taskId);
    
    // Trim history
    this.trimHistory();
    
    // Emit event
    this.emit('deadline:completed', {
      taskId,
      duration,
      met,
      overrun: met ? 0 : completionTime - deadline.deadline
    });
    
    return {
      met,
      duration,
      compliance: met ? 'compliant' : 'violated'
    };
  }
  
  /**
   * Cancel deadline
   */
  cancelDeadline(taskId) {
    const deadline = this.deadlines.get(taskId);
    
    if (!deadline) {
      return false;
    }
    
    deadline.status = 'cancelled';
    this.deadlines.delete(taskId);
    this.statistics.currentActive--;
    
    this.emit('deadline:cancelled', { taskId });
    
    return true;
  }
  
  /**
   * Setup escalation for deadline
   */
  setupEscalation(deadline, policyName) {
    const policy = this.escalationPolicies.get(policyName);
    
    if (!policy) {
      logger.warn(`Escalation policy ${policyName} not found`);
      return;
    }
    
    deadline.metadata.escalationPolicy = policyName;
    deadline.metadata.escalationLevels = policy.levels;
  }
  
  /**
   * Check deadlines and trigger alerts/escalations
   */
  checkDeadlines() {
    const now = Date.now();
    
    for (const deadline of this.deadlines.values()) {
      // Skip if not active
      if (deadline.status !== 'active') continue;
      
      // Check if expired
      if (deadline.isExpired()) {
        this.handleExpiredDeadline(deadline);
        continue;
      }
      
      // Check if at risk
      if (deadline.isAtRisk()) {
        this.handleAtRiskDeadline(deadline);
      }
      
      // Check escalation thresholds
      if (this.config.enableEscalation) {
        this.checkEscalation(deadline);
      }
      
      // Check alert thresholds
      if (this.config.enableAlerts) {
        this.checkAlerts(deadline);
      }
    }
  }
  
  /**
   * Handle expired deadline
   */
  handleExpiredDeadline(deadline) {
    if (deadline.status === 'expired') return;
    
    deadline.status = 'expired';
    this.statistics.missedDeadlines++;
    
    logger.warn(`Deadline expired for task ${deadline.taskId}`);
    
    this.emit('deadline:expired', {
      taskId: deadline.taskId,
      overrun: Date.now() - deadline.deadline
    });
    
    // Trigger emergency escalation
    if (this.config.enableEscalation) {
      this.escalate(deadline, 'emergency');
    }
  }
  
  /**
   * Handle at-risk deadline
   */
  handleAtRiskDeadline(deadline) {
    if (deadline.metadata.atRiskAlerted) return;
    
    deadline.metadata.atRiskAlerted = true;
    
    logger.warn(`Deadline at risk for task ${deadline.taskId}`);
    
    this.emit('deadline:at-risk', {
      taskId: deadline.taskId,
      timeRemaining: deadline.getTimeRemaining(),
      progress: deadline.getProgress()
    });
  }
  
  /**
   * Check and trigger escalation
   */
  checkEscalation(deadline) {
    if (!deadline.metadata.escalationLevels) return;
    
    const progress = deadline.getProgress();
    const levels = deadline.metadata.escalationLevels;
    
    for (const level of levels) {
      if (progress >= level.threshold && deadline.escalationLevel < level.level) {
        this.escalate(deadline, level);
        break;
      }
    }
  }
  
  /**
   * Escalate deadline
   */
  escalate(deadline, level) {
    deadline.escalationLevel = typeof level === 'object' ? level.level : deadline.escalationLevel + 1;
    this.statistics.escalations++;
    
    const escalationData = {
      taskId: deadline.taskId,
      level: deadline.escalationLevel,
      actions: typeof level === 'object' ? level.actions : ['notify'],
      message: typeof level === 'object' ? level.message : 'Deadline escalated',
      timeRemaining: deadline.getTimeRemaining()
    };
    
    // Add to deadline alerts
    deadline.addAlert({
      type: 'escalation',
      level: deadline.escalationLevel,
      message: escalationData.message
    });
    
    logger.warn(`Escalating deadline for task ${deadline.taskId} to level ${deadline.escalationLevel}`);
    
    this.emit('deadline:escalated', escalationData);
    
    // Execute escalation actions
    this.executeEscalationActions(escalationData.actions, deadline);
  }
  
  /**
   * Execute escalation actions
   */
  executeEscalationActions(actions, deadline) {
    for (const action of actions) {
      switch (action) {
        case 'notify':
          this.emit('action:notify', { taskId: deadline.taskId });
          break;
        case 'alert':
          this.emit('action:alert', { taskId: deadline.taskId, priority: 'high' });
          this.statistics.alerts++;
          break;
        case 'prioritize':
          this.emit('action:prioritize', { taskId: deadline.taskId });
          deadline.priority = 'high';
          break;
        case 'escalate':
          this.emit('action:escalate', { taskId: deadline.taskId });
          break;
        case 'reassign':
          this.emit('action:reassign', { taskId: deadline.taskId });
          break;
        case 'critical':
          this.emit('action:critical', { taskId: deadline.taskId });
          deadline.priority = 'critical';
          break;
        case 'emergency':
          this.emit('action:emergency', { taskId: deadline.taskId });
          deadline.priority = 'emergency';
          break;
        case 'all-hands':
          this.emit('action:all-hands', { taskId: deadline.taskId });
          break;
      }
    }
  }
  
  /**
   * Check and trigger alerts
   */
  checkAlerts(deadline) {
    const timeRemaining = deadline.getTimeRemaining();
    
    // Check if alert needed
    if (timeRemaining <= this.config.alertLeadTime) {
      if (!deadline.metadata.alerted) {
        deadline.metadata.alerted = true;
        
        deadline.addAlert({
          type: 'warning',
          message: `Less than ${this.config.alertLeadTime}ms remaining`
        });
        
        this.statistics.alerts++;
        
        this.emit('deadline:alert', {
          taskId: deadline.taskId,
          timeRemaining,
          alertType: 'approaching'
        });
      }
    }
  }
  
  /**
   * Update average completion time
   */
  updateAverageCompletionTime(duration) {
    const total = this.statistics.metDeadlines + this.statistics.missedDeadlines;
    
    if (total === 0) {
      this.statistics.averageCompletionTime = duration;
    } else {
      this.statistics.averageCompletionTime = 
        (this.statistics.averageCompletionTime * (total - 1) + duration) / total;
    }
  }
  
  /**
   * Update SLA compliance
   */
  updateSLACompliance(deadline, met) {
    if (!deadline.metadata.sla) return;
    
    const total = this.statistics.metDeadlines + this.statistics.missedDeadlines;
    const compliant = this.statistics.metDeadlines;
    
    this.statistics.slaCompliance = total > 0 ? compliant / total : 1.0;
  }
  
  /**
   * Trim history to retention period
   */
  trimHistory() {
    if (!this.config.trackHistorical) {
      this.completedDeadlines = [];
      return;
    }
    
    const cutoff = Date.now() - this.config.historyRetention;
    
    this.completedDeadlines = this.completedDeadlines.filter(deadline => 
      deadline.completedAt > cutoff
    );
  }
  
  /**
   * Get deadline status
   */
  getDeadlineStatus(taskId) {
    const deadline = this.deadlines.get(taskId);
    
    if (!deadline) {
      // Check completed
      const completed = this.completedDeadlines.find(d => d.taskId === taskId);
      if (completed) {
        return {
          exists: true,
          status: 'completed',
          met: completed.met,
          duration: completed.completedAt - completed.createdAt
        };
      }
      
      return { exists: false };
    }
    
    return {
      exists: true,
      status: deadline.status,
      timeRemaining: deadline.getTimeRemaining(),
      progress: deadline.getProgress(),
      escalationLevel: deadline.escalationLevel,
      isAtRisk: deadline.isAtRisk(),
      isExpired: deadline.isExpired()
    };
  }
  
  /**
   * Get SLA compliance report
   */
  getSLAComplianceReport(slaName = null) {
    const report = {
      timestamp: Date.now(),
      overall: {
        compliance: this.statistics.slaCompliance,
        target: this.config.slaComplianceTarget,
        status: this.statistics.slaCompliance >= this.config.slaComplianceTarget ? 'compliant' : 'violated'
      },
      bySLA: {}
    };
    
    // Calculate per-SLA compliance
    for (const [name, sla] of this.slas) {
      if (slaName && name !== slaName) continue;
      
      const slaDeadlines = this.completedDeadlines.filter(d => d.metadata.sla === name);
      const met = slaDeadlines.filter(d => d.met).length;
      const total = slaDeadlines.length;
      
      report.bySLA[name] = {
        compliance: total > 0 ? met / total : 1.0,
        met,
        total,
        targetTime: sla.targetTime,
        criticalTime: sla.criticalTime
      };
    }
    
    return report;
  }
  
  /**
   * Get active deadlines
   */
  getActiveDeadlines() {
    return Array.from(this.deadlines.values())
      .filter(d => d.status === 'active')
      .map(d => ({
        taskId: d.taskId,
        deadline: d.deadline,
        timeRemaining: d.getTimeRemaining(),
        progress: d.getProgress(),
        priority: d.priority,
        escalationLevel: d.escalationLevel,
        isAtRisk: d.isAtRisk()
      }))
      .sort((a, b) => a.timeRemaining - b.timeRemaining);
  }
  
  /**
   * Get escalation summary
   */
  getEscalationSummary() {
    const summary = {
      totalEscalations: this.statistics.escalations,
      currentEscalated: 0,
      byLevel: {},
      recentEscalations: []
    };
    
    for (const deadline of this.deadlines.values()) {
      if (deadline.escalationLevel > 0) {
        summary.currentEscalated++;
        
        const level = deadline.escalationLevel;
        summary.byLevel[level] = (summary.byLevel[level] || 0) + 1;
        
        summary.recentEscalations.push({
          taskId: deadline.taskId,
          level: deadline.escalationLevel,
          timeRemaining: deadline.getTimeRemaining()
        });
      }
    }
    
    // Sort recent by escalation level
    summary.recentEscalations.sort((a, b) => b.level - a.level);
    
    return summary;
  }
  
  /**
   * Start monitoring
   */
  startMonitoring() {
    this.monitoringInterval = setInterval(() => {
      this.checkDeadlines();
    }, this.config.checkInterval);
    
    logger.debug('Deadline monitoring started');
  }
  
  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      logger.debug('Deadline monitoring stopped');
    }
  }
  
  /**
   * Get manager status
   */
  getStatus() {
    return {
      statistics: this.statistics,
      active: {
        count: this.statistics.currentActive,
        atRisk: Array.from(this.deadlines.values()).filter(d => d.isAtRisk()).length,
        expired: Array.from(this.deadlines.values()).filter(d => d.isExpired()).length
      },
      sla: {
        compliance: this.statistics.slaCompliance,
        target: this.config.slaComplianceTarget,
        status: this.statistics.slaCompliance >= this.config.slaComplianceTarget ? 'compliant' : 'violated'
      },
      escalations: this.getEscalationSummary(),
      config: {
        escalation: this.config.enableEscalation,
        alerts: this.config.enableAlerts,
        checkInterval: this.config.checkInterval
      }
    };
  }
  
  /**
   * Reset statistics
   */
  resetStatistics() {
    this.statistics = {
      totalDeadlines: 0,
      metDeadlines: 0,
      missedDeadlines: 0,
      currentActive: this.deadlines.size,
      averageCompletionTime: 0,
      slaCompliance: 1.0,
      escalations: 0,
      alerts: 0
    };
    
    logger.info('Statistics reset');
  }
  
  /**
   * Export deadlines for backup
   */
  exportDeadlines() {
    return {
      timestamp: Date.now(),
      active: Array.from(this.deadlines.values()).map(d => ({
        taskId: d.taskId,
        deadline: d.deadline,
        priority: d.priority,
        status: d.status,
        escalationLevel: d.escalationLevel,
        metadata: d.metadata
      })),
      completed: this.completedDeadlines.map(d => ({
        taskId: d.taskId,
        deadline: d.deadline,
        completedAt: d.completedAt,
        met: d.met,
        metadata: d.metadata
      })),
      statistics: this.statistics
    };
  }
  
  /**
   * Import deadlines from backup
   */
  importDeadlines(data) {
    try {
      // Import active deadlines
      if (data.active) {
        for (const deadlineData of data.active) {
          const deadline = new Deadline(
            deadlineData.taskId,
            deadlineData.deadline,
            deadlineData.priority
          );
          deadline.status = deadlineData.status;
          deadline.escalationLevel = deadlineData.escalationLevel;
          deadline.metadata = deadlineData.metadata;
          this.deadlines.set(deadlineData.taskId, deadline);
        }
      }
      
      // Import completed deadlines
      if (data.completed) {
        this.completedDeadlines = data.completed;
      }
      
      // Import statistics
      if (data.statistics) {
        this.statistics = data.statistics;
      }
      
      logger.info(`Imported ${this.deadlines.size} active and ${this.completedDeadlines.length} completed deadlines`);
      return true;
      
    } catch (error) {
      logger.error('Failed to import deadlines:', error);
      return false;
    }
  }
  
  /**
   * Shutdown manager
   */
  shutdown() {
    logger.info('Shutting down Deadline Manager...');
    
    this.stopMonitoring();
    this.removeAllListeners();
    
    logger.info('Deadline Manager shutdown complete');
  }
}

module.exports = {
  DeadlineManager,
  Deadline,
  SLA,
  EscalationPolicy,
  DEFAULT_ESCALATION_POLICIES
};
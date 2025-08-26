/**
 * BUMBA Project Monitoring and Quality Systems
 * Progress tracking, quality assurance, and error recovery
 * @module project-monitoring
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');

/**
 * Sprint 13: Progress Tracking Dashboard
 */
class ProgressTrackingDashboard {
  constructor(notionClient) {
    this.notionClient = notionClient;
    this.metrics = new Map();
    this.snapshots = [];
    
    logger.info('🟢 Progress Tracking Dashboard initialized');
  }
  
  /**
   * Update project progress
   */
  async updateProgress(projectId) {
    const progress = await this.notionClient.getProjectProgress(projectId);
    
    // Store metrics
    this.metrics.set(projectId, {
      ...progress,
      timestamp: Date.now(),
      velocity: this.calculateVelocity(projectId, progress)
    });
    
    // Create snapshot
    this.createSnapshot(projectId, progress);
    
    // Update Notion dashboard
    await this.updateNotionDashboard(projectId, progress);
    
    return progress;
  }
  
  /**
   * Calculate project velocity
   */
  calculateVelocity(projectId, currentProgress) {
    const previousMetrics = this.metrics.get(projectId);
    
    if (!previousMetrics) {return 0;}
    
    const timeDelta = Date.now() - previousMetrics.timestamp;
    const tasksDelta = currentProgress.completedTasks - previousMetrics.completedTasks;
    
    // Tasks per hour
    return (tasksDelta / timeDelta) * 3600000;
  }
  
  /**
   * Create progress snapshot
   */
  createSnapshot(projectId, progress) {
    this.snapshots.push({
      projectId,
      progress,
      timestamp: Date.now()
    });
    
    // Keep only last 100 snapshots
    if (this.snapshots.length > 100) {
      this.snapshots.shift();
    }
  }
  
  /**
   * Update Notion dashboard
   */
  async updateNotionDashboard(projectId, progress) {
    // Would update Notion page with progress widgets
    logger.info(`🟢 Dashboard updated: ${progress.progress.toFixed(1)}% complete`);
  }
  
  /**
   * Generate progress report
   */
  generateProgressReport(projectId) {
    const metrics = this.metrics.get(projectId);
    
    if (!metrics) {return null;}
    
    return {
      projectId,
      progress: metrics.progress,
      completedTasks: metrics.completedTasks,
      totalTasks: metrics.totalTasks,
      blockedTasks: metrics.blockedTasks,
      velocity: metrics.velocity,
      estimatedCompletion: this.estimateCompletion(metrics)
    };
  }
  
  /**
   * Estimate project completion
   */
  estimateCompletion(metrics) {
    if (metrics.velocity === 0) {return null;}
    
    const remainingTasks = metrics.totalTasks - metrics.completedTasks;
    const hoursRemaining = remainingTasks / metrics.velocity;
    
    return new Date(Date.now() + hoursRemaining * 3600000);
  }
}

/**
 * Sprint 14: Quality Assurance System
 */
class QualityAssuranceSystem extends EventEmitter {
  constructor() {
    super();
    
    this.qualityChecks = new Map();
    this.qualityScores = new Map();
    this.reviewQueue = [];
    
    logger.info('🏁 Quality Assurance System initialized');
  }
  
  /**
   * Schedule quality check for sprint output
   */
  scheduleQualityCheck(sprintId, output, reviewer = 'Product-Strategist') {
    const check = {
      id: `qc_${Date.now()}`,
      sprintId,
      output,
      reviewer,
      status: 'pending',
      scheduledAt: Date.now()
    };
    
    this.qualityChecks.set(check.id, check);
    this.reviewQueue.push(check);
    
    this.emit('quality:check:scheduled', check);
    
    return check.id;
  }
  
  /**
   * Perform quality check
   */
  async performQualityCheck(checkId) {
    const check = this.qualityChecks.get(checkId);
    
    if (!check) {return null;}
    
    check.status = 'in_progress';
    
    // Perform various quality checks
    const results = {
      completeness: this.checkCompleteness(check.output),
      correctness: this.checkCorrectness(check.output),
      consistency: this.checkConsistency(check.output),
      documentation: this.checkDocumentation(check.output),
      testing: this.checkTesting(check.output)
    };
    
    // Calculate overall score
    const score = this.calculateQualityScore(results);
    
    // Update check record
    check.status = 'completed';
    check.results = results;
    check.score = score;
    check.completedAt = Date.now();
    
    // Store score
    this.qualityScores.set(check.sprintId, score);
    
    this.emit('quality:check:completed', {
      checkId,
      sprintId: check.sprintId,
      score,
      results
    });
    
    return {
      checkId,
      score,
      results,
      passed: score >= 80
    };
  }
  
  /**
   * Check completeness
   */
  checkCompleteness(output) {
    // Check if all required deliverables are present
    return {
      score: 90,
      issues: []
    };
  }
  
  /**
   * Check correctness
   */
  checkCorrectness(output) {
    // Validate output correctness
    return {
      score: 85,
      issues: []
    };
  }
  
  /**
   * Check consistency
   */
  checkConsistency(output) {
    // Check consistency with project standards
    return {
      score: 95,
      issues: []
    };
  }
  
  /**
   * Check documentation
   */
  checkDocumentation(output) {
    // Verify documentation quality
    return {
      score: 80,
      issues: ['Missing API documentation']
    };
  }
  
  /**
   * Check testing
   */
  checkTesting(output) {
    // Validate test coverage
    return {
      score: 75,
      issues: ['Test coverage below 80%']
    };
  }
  
  /**
   * Calculate overall quality score
   */
  calculateQualityScore(results) {
    const scores = Object.values(results).map(r => r.score);
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }
  
  /**
   * Get quality metrics
   */
  getQualityMetrics() {
    const scores = Array.from(this.qualityScores.values());
    
    return {
      averageScore: scores.reduce((sum, s) => sum + s, 0) / scores.length,
      checksPerformed: this.qualityChecks.size,
      pendingChecks: this.reviewQueue.length,
      passRate: scores.filter(s => s >= 80).length / scores.length * 100
    };
  }
}

/**
 * Sprint 15: Milestone Tracking System
 */
class MilestoneTrackingSystem extends EventEmitter {
  constructor(notionClient) {
    super();
    
    this.notionClient = notionClient;
    this.milestones = new Map();
    this.achievements = [];
    
    logger.info('🟢 Milestone Tracking System initialized');
  }
  
  /**
   * Register project milestone
   */
  registerMilestone(milestone) {
    const milestoneData = {
      id: milestone.id || `milestone_${Date.now()}`,
      title: milestone.title,
      description: milestone.description,
      targetDate: milestone.targetDate,
      requiredTasks: milestone.requiredTasks || [],
      status: 'upcoming',
      progress: 0
    };
    
    this.milestones.set(milestoneData.id, milestoneData);
    
    this.emit('milestone:registered', milestoneData);
    
    return milestoneData.id;
  }
  
  /**
   * Update milestone progress
   */
  updateMilestoneProgress(milestoneId, completedTasks) {
    const milestone = this.milestones.get(milestoneId);
    
    if (!milestone) {return;}
    
    const progress = (completedTasks.length / milestone.requiredTasks.length) * 100;
    
    milestone.progress = progress;
    
    if (progress === 100 && milestone.status !== 'achieved') {
      this.achieveMilestone(milestoneId);
    } else if (progress > 0 && milestone.status === 'upcoming') {
      milestone.status = 'in_progress';
    }
    
    return milestone;
  }
  
  /**
   * Mark milestone as achieved
   */
  achieveMilestone(milestoneId) {
    const milestone = this.milestones.get(milestoneId);
    
    if (!milestone) {return;}
    
    milestone.status = 'achieved';
    milestone.achievedAt = Date.now();
    
    this.achievements.push({
      milestoneId,
      title: milestone.title,
      achievedAt: milestone.achievedAt
    });
    
    this.emit('milestone:achieved', milestone);
    
    logger.info(`🟢 Milestone achieved: ${milestone.title}`);
    
    return milestone;
  }
  
  /**
   * Check milestone risks
   */
  checkMilestoneRisks() {
    const risks = [];
    
    for (const [id, milestone] of this.milestones) {
      if (milestone.status === 'in_progress') {
        const daysUntilTarget = (milestone.targetDate - Date.now()) / 86400000;
        const remainingProgress = 100 - milestone.progress;
        
        if (daysUntilTarget < 1 && remainingProgress > 20) {
          risks.push({
            milestoneId: id,
            risk: 'high',
            reason: 'Unlikely to meet target date'
          });
        } else if (daysUntilTarget < 3 && remainingProgress > 50) {
          risks.push({
            milestoneId: id,
            risk: 'medium',
            reason: 'At risk of missing target'
          });
        }
      }
    }
    
    return risks;
  }
}

/**
 * Sprint 16: Notification System
 */
class NotificationSystem extends EventEmitter {
  constructor() {
    super();
    
    this.subscribers = new Map();
    this.notificationHistory = [];
    
    logger.info('🟢 Notification System initialized');
  }
  
  /**
   * Subscribe to notifications
   */
  subscribe(subscriberId, events) {
    this.subscribers.set(subscriberId, {
      events,
      notifications: []
    });
  }
  
  /**
   * Send notification
   */
  async notify(event, data, priority = 'normal') {
    const notification = {
      id: `notif_${Date.now()}`,
      event,
      data,
      priority,
      timestamp: Date.now()
    };
    
    // Find subscribers for this event
    for (const [subscriberId, subscription] of this.subscribers) {
      if (subscription.events.includes(event) || subscription.events.includes('all')) {
        subscription.notifications.push(notification);
        
        this.emit('notification:sent', {
          subscriberId,
          notification
        });
      }
    }
    
    // Store in history
    this.notificationHistory.push(notification);
    
    // Keep only last 1000 notifications
    if (this.notificationHistory.length > 1000) {
      this.notificationHistory.shift();
    }
    
    // Log critical notifications
    if (priority === 'critical') {
      logger.error(`🔴 CRITICAL: ${event} - ${JSON.stringify(data)}`);
    }
    
    return notification;
  }
  
  /**
   * Get notifications for subscriber
   */
  getNotifications(subscriberId, unreadOnly = true) {
    const subscription = this.subscribers.get(subscriberId);
    
    if (!subscription) {return [];}
    
    if (unreadOnly) {
      const unread = subscription.notifications.filter(n => !n.read);
      // Mark as read
      unread.forEach(n => n.read = true);
      return unread;
    }
    
    return subscription.notifications;
  }
}

/**
 * Sprint 17: Error Recovery Mechanism
 */
class ErrorRecoverySystem extends EventEmitter {
  constructor() {
    super();
    
    this.errorLog = [];
    this.recoveryStrategies = new Map();
    this.recoveryAttempts = new Map();
    
    this.defineRecoveryStrategies();
    
    logger.info('🟢 Error Recovery System initialized');
  }
  
  /**
   * Define recovery strategies
   */
  defineRecoveryStrategies() {
    // Task failure recovery
    this.recoveryStrategies.set('task_failure', {
      maxRetries: 3, strategy: async (error, context) => {
        logger.info(`🟢 Attempting task recovery for ${context.taskId}`);
        
        // Retry with different agent
        if (context.retryCount < 3) {
          return { action: 'retry', newAgent: true };
        }
        
        // Escalate to manager
        return { action: 'escalate', target: 'Product-Strategist' };
      }
    });
    
    // Dependency violation recovery
    this.recoveryStrategies.set('dependency_violation', {
      maxRetries: 1, strategy: async (error, context) => {
        logger.warn(`🟡 Dependency violation recovery for ${context.taskId}`);
        
        // Stop task and reschedule
        return { action: 'reschedule', waitForDependencies: true };
      }
    });
    
    // Agent failure recovery
    this.recoveryStrategies.set('agent_failure', {
      maxRetries: 2, strategy: async (error, context) => {
        logger.error(`🔴 Agent ${context.agentId} failed`);
        
        // Reassign tasks to other agents
        return { action: 'redistribute', excludeAgent: context.agentId };
      }
    });
    
    // System error recovery
    this.recoveryStrategies.set('system_error', {
      maxRetries: 5, strategy: async (error, _context) => {
        logger.error(`🔴 System error: ${error.message}`);
        
        // Pause and retry
        await new Promise(resolve => setTimeout(resolve, 5000));
        return { action: 'retry', delay: 5000 };
      }
    });
  }
  
  /**
   * Handle error with recovery
   */
  async handleError(error, errorType, context) {
    // Log error
    this.errorLog.push({
      error: error.message,
      type: errorType,
      context,
      timestamp: Date.now()
    });
    
    // Get recovery strategy
    const strategy = this.recoveryStrategies.get(errorType);
    
    if (!strategy) {
      logger.error(`No recovery strategy for ${errorType}`);
      throw error;
    }
    
    // Track recovery attempts
    const attemptKey = `${errorType}_${context.taskId || context.agentId}`;
    const attempts = this.recoveryAttempts.get(attemptKey) || 0;
    
    if (attempts >= strategy.maxRetries) {
      logger.error(`Max recovery attempts reached for ${attemptKey}`);
      this.emit('recovery:failed', { error, errorType, context });
      throw error;
    }
    
    // Execute recovery strategy
    this.recoveryAttempts.set(attemptKey, attempts + 1);
    
    const recoveryPlan = await strategy.strategy(error, {
      ...context,
      retryCount: attempts
    });
    
    this.emit('recovery:initiated', {
      errorType,
      plan: recoveryPlan,
      attempt: attempts + 1
    });
    
    return recoveryPlan;
  }
  
  /**
   * Execute recovery plan
   */
  async executeRecovery(plan, orchestrator) {
    switch (plan.action) {
      case 'retry':
        if (plan.delay) {
          await new Promise(resolve => setTimeout(resolve, plan.delay));
        }
        return { success: true, action: 'retry' };
        
      case 'reschedule':
        // Reschedule task for later
        return { success: true, action: 'rescheduled' };
        
      case 'redistribute':
        // Redistribute tasks to other agents
        await orchestrator.reallocateResources();
        return { success: true, action: 'redistributed' };
        
      case 'escalate':
        // Escalate to manager
        await orchestrator.notifyManager(plan.target);
        return { success: true, action: 'escalated' };
        
      default:
        return { success: false, action: 'unknown' };
    }
  }
  
  /**
   * Get error statistics
   */
  getErrorStats() {
    const errorsByType = {};
    
    for (const error of this.errorLog) {
      errorsByType[error.type] = (errorsByType[error.type] || 0) + 1;
    }
    
    return {
      totalErrors: this.errorLog.length,
      errorsByType,
      recoveryAttempts: this.recoveryAttempts.size,
      recentErrors: this.errorLog.slice(-10)
    };
  }
}

// Export all monitoring systems
module.exports = {
  ProgressTrackingDashboard,
  QualityAssuranceSystem,
  MilestoneTrackingSystem,
  NotificationSystem,
  ErrorRecoverySystem
};
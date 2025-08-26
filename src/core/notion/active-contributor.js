/**
 * BUMBA Active Contributor System
 * Only updates dashboards that have been explicitly created
 * Manages ongoing dashboard contributions after user creates dashboard
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');

class ActiveContributor extends EventEmitter {
  constructor() {
    super();
    
    // Map of project → dashboard configurations
    this.activeDashboards = new Map();
    
    // Update queue for batching
    this.updateQueue = new Map();
    
    // Update intervals
    this.updateIntervals = new Map();
    
    // Paused dashboards
    this.pausedDashboards = new Set();
    
    // Initialize event listeners
    this.initializeListeners();
  }

  /**
   * Register a dashboard for active updates
   * Called ONLY after user explicitly creates dashboard
   */
  register(projectId, dashboardId, config = {}) {
    if (this.activeDashboards.has(projectId)) {
      logger.warn(`Dashboard already registered for project: ${projectId}`);
      return;
    }

    const dashboardConfig = {
      projectId,
      dashboardId,
      registeredAt: Date.now(),
      updateFrequency: config.frequency || 'on-event',
      updateTypes: config.types || ['all'],
      agents: config.agents || ['all'],
      customRules: config.rules || [],
      stats: {
        totalUpdates: 0,
        lastUpdate: null,
        failedUpdates: 0
      }
    };

    this.activeDashboards.set(projectId, dashboardConfig);
    
    logger.info(`📡 Dashboard registered for active updates: ${projectId}`);
    logger.debug('Configuration:', dashboardConfig);
    
    // Set up update interval if needed
    if (dashboardConfig.updateFrequency !== 'on-event') {
      this.setupUpdateInterval(projectId, dashboardConfig);
    }
    
    // Start listening for project events
    this.listenToProject(projectId);
    
    this.emit('dashboard:registered', {
      projectId,
      dashboardId
    });
  }

  /**
   * Initialize global event listeners
   */
  initializeListeners() {
    // Listen for BUMBA events (only for registered projects)
    process.on('bumba:task:complete', (event) => {
      this.handleTaskComplete(event);
    });
    
    process.on('bumba:status:change', (event) => {
      this.handleStatusChange(event);
    });
    
    process.on('bumba:milestone:reached', (event) => {
      this.handleMilestone(event);
    });
    
    process.on('bumba:blocker:identified', (event) => {
      this.handleBlocker(event);
    });
    
    process.on('bumba:agent:activity', (event) => {
      this.handleAgentActivity(event);
    });
  }

  /**
   * Listen to specific project events
   */
  listenToProject(projectId) {
    logger.debug(`👂 Listening to events for project: ${projectId}`);
    
    // Project-specific event handlers would go here
    // This is where we'd connect to the project's event stream
  }

  /**
   * Handle task completion event
   */
  async handleTaskComplete(event) {
    const { projectId, task, agent, timestamp } = event;
    
    // Only process if dashboard exists for this project
    if (!this.shouldProcessUpdate(projectId, 'task-complete')) {
      return;
    }

    logger.info(`✅ Task completed in ${projectId}: ${task.name}`);
    
    const update = {
      type: 'task-complete',
      data: {
        taskId: task.id,
        taskName: task.name,
        completedBy: agent,
        completionTime: timestamp,
        duration: task.duration,
        quality: task.qualityScore
      }
    };
    
    await this.queueUpdate(projectId, update);
  }

  /**
   * Handle status change event
   */
  async handleStatusChange(event) {
    const { projectId, oldStatus, newStatus, reason, agent } = event;
    
    if (!this.shouldProcessUpdate(projectId, 'status-change')) {
      return;
    }

    logger.info(`🔄 Status change in ${projectId}: ${oldStatus} → ${newStatus}`);
    
    const update = {
      type: 'status-change',
      data: {
        from: oldStatus,
        to: newStatus,
        reason,
        changedBy: agent,
        timestamp: Date.now()
      }
    };
    
    await this.queueUpdate(projectId, update);
  }

  /**
   * Handle milestone reached event
   */
  async handleMilestone(event) {
    const { projectId, milestone, progress, agent } = event;
    
    if (!this.shouldProcessUpdate(projectId, 'milestone')) {
      return;
    }

    logger.info(`🎯 Milestone reached in ${projectId}: ${milestone.name}`);
    
    const update = {
      type: 'milestone',
      data: {
        milestoneName: milestone.name,
        milestoneId: milestone.id,
        progress,
        achievedBy: agent,
        timestamp: Date.now(),
        nextMilestone: milestone.next
      }
    };
    
    await this.queueUpdate(projectId, update);
  }

  /**
   * Handle blocker identified event
   */
  async handleBlocker(event) {
    const { projectId, blocker, impact, identifiedBy } = event;
    
    if (!this.shouldProcessUpdate(projectId, 'blocker')) {
      return;
    }

    logger.warn(`🚧 Blocker identified in ${projectId}: ${blocker.description}`);
    
    const update = {
      type: 'blocker',
      priority: 'high',
      data: {
        blockerId: blocker.id,
        description: blocker.description,
        impact,
        identifiedBy,
        timestamp: Date.now(),
        suggestedResolution: blocker.resolution
      }
    };
    
    await this.queueUpdate(projectId, update);
  }

  /**
   * Handle agent activity event
   */
  async handleAgentActivity(event) {
    const { projectId, agent, activity, timestamp } = event;
    
    if (!this.shouldProcessUpdate(projectId, 'agent-activity')) {
      return;
    }

    const update = {
      type: 'agent-activity',
      data: {
        agent,
        activity: activity.description,
        category: activity.category,
        timestamp
      }
    };
    
    await this.queueUpdate(projectId, update);
  }

  /**
   * Check if update should be processed
   */
  shouldProcessUpdate(projectId, updateType) {
    // Check if dashboard is registered
    if (!this.activeDashboards.has(projectId)) {
      return false;
    }
    
    // Check if dashboard is paused
    if (this.pausedDashboards.has(projectId)) {
      return false;
    }
    
    // Check if update type is allowed
    const config = this.activeDashboards.get(projectId);
    if (!config.updateTypes.includes('all') && !config.updateTypes.includes(updateType)) {
      return false;
    }
    
    return true;
  }

  /**
   * Queue update for batching
   */
  async queueUpdate(projectId, update) {
    if (!this.updateQueue.has(projectId)) {
      this.updateQueue.set(projectId, []);
    }
    
    this.updateQueue.get(projectId).push(update);
    
    // Process immediately if on-event mode
    const config = this.activeDashboards.get(projectId);
    if (config.updateFrequency === 'on-event') {
      await this.processUpdates(projectId);
    }
  }

  /**
   * Process queued updates for a project
   */
  async processUpdates(projectId) {
    const updates = this.updateQueue.get(projectId);
    if (!updates || updates.length === 0) {
      return;
    }

    const config = this.activeDashboards.get(projectId);
    
    try {
      logger.info(`📤 Processing ${updates.length} updates for ${projectId}`);
      
      // Get dashboard updater
      const { DashboardUpdater } = require('./dashboard-updater');
      const updater = new DashboardUpdater();
      
      // Apply updates to dashboard
      const result = await updater.applyUpdates(config.dashboardId, updates);
      
      // Update stats
      config.stats.totalUpdates += updates.length;
      config.stats.lastUpdate = Date.now();
      
      // Clear processed updates
      this.updateQueue.set(projectId, []);
      
      logger.info(`✅ Successfully applied ${updates.length} updates to dashboard`);
      
      this.emit('updates:applied', {
        projectId,
        count: updates.length,
        result
      });
      
    } catch (error) {
      logger.error(`Failed to apply updates for ${projectId}:`, error);
      config.stats.failedUpdates++;
      
      // Keep updates in queue for retry
      this.emit('updates:failed', {
        projectId,
        error: error.message,
        updateCount: updates.length
      });
    }
  }

  /**
   * Set up periodic update interval
   */
  setupUpdateInterval(projectId, config) {
    const intervalMs = this.parseUpdateFrequency(config.updateFrequency);
    
    const interval = setInterval(async () => {
      await this.processUpdates(projectId);
    }, intervalMs);
    
    this.updateIntervals.set(projectId, interval);
    
    logger.info(`⏰ Update interval set for ${projectId}: every ${intervalMs/1000}s`);
  }

  /**
   * Parse update frequency to milliseconds
   */
  parseUpdateFrequency(frequency) {
    const frequencies = {
      'realtime': 5000,      // 5 seconds
      '1min': 60000,         // 1 minute
      '5min': 300000,        // 5 minutes
      '15min': 900000,       // 15 minutes
      '30min': 1800000,      // 30 minutes
      '1hour': 3600000,      // 1 hour
      'daily': 86400000      // 24 hours
    };
    
    return frequencies[frequency] || 300000; // Default 5 minutes
  }

  /**
   * Pause updates for a dashboard
   */
  pause(projectId) {
    if (!this.activeDashboards.has(projectId)) {
      logger.warn(`Cannot pause - dashboard not registered: ${projectId}`);
      return false;
    }
    
    this.pausedDashboards.add(projectId);
    
    // Clear interval if exists
    if (this.updateIntervals.has(projectId)) {
      clearInterval(this.updateIntervals.get(projectId));
      this.updateIntervals.delete(projectId);
    }
    
    logger.info(`⏸️ Updates paused for ${projectId}`);
    
    this.emit('dashboard:paused', { projectId });
    return true;
  }

  /**
   * Resume updates for a dashboard
   */
  resume(projectId) {
    if (!this.activeDashboards.has(projectId)) {
      logger.warn(`Cannot resume - dashboard not registered: ${projectId}`);
      return false;
    }
    
    this.pausedDashboards.delete(projectId);
    
    // Restore interval if needed
    const config = this.activeDashboards.get(projectId);
    if (config.updateFrequency !== 'on-event') {
      this.setupUpdateInterval(projectId, config);
    }
    
    // Process any queued updates
    this.processUpdates(projectId);
    
    logger.info(`▶️ Updates resumed for ${projectId}`);
    
    this.emit('dashboard:resumed', { projectId });
    return true;
  }

  /**
   * Unregister a dashboard
   */
  unregister(projectId) {
    if (!this.activeDashboards.has(projectId)) {
      return false;
    }
    
    // Clear interval
    if (this.updateIntervals.has(projectId)) {
      clearInterval(this.updateIntervals.get(projectId));
      this.updateIntervals.delete(projectId);
    }
    
    // Remove from registries
    this.activeDashboards.delete(projectId);
    this.pausedDashboards.delete(projectId);
    this.updateQueue.delete(projectId);
    
    logger.info(`🔌 Dashboard unregistered: ${projectId}`);
    
    this.emit('dashboard:unregistered', { projectId });
    return true;
  }

  /**
   * Get status of all active dashboards
   */
  getStatus() {
    const status = [];
    
    for (const [projectId, config] of this.activeDashboards) {
      const queuedUpdates = this.updateQueue.get(projectId)?.length || 0;
      
      status.push({
        projectId,
        dashboardId: config.dashboardId,
        registered: new Date(config.registeredAt).toLocaleString(),
        isPaused: this.pausedDashboards.has(projectId),
        updateFrequency: config.updateFrequency,
        stats: config.stats,
        queuedUpdates
      });
    }
    
    return {
      totalDashboards: this.activeDashboards.size,
      activeDashboards: this.activeDashboards.size - this.pausedDashboards.size,
      pausedDashboards: this.pausedDashboards.size,
      dashboards: status
    };
  }

  /**
   * Force update for a specific dashboard
   */
  async forceUpdate(projectId) {
    if (!this.activeDashboards.has(projectId)) {
      throw new Error(`Dashboard not registered: ${projectId}`);
    }
    
    logger.info(`🔄 Forcing update for ${projectId}`);
    
    await this.processUpdates(projectId);
    
    return {
      success: true,
      projectId,
      timestamp: Date.now()
    };
  }
}

// Singleton instance
let instance = null;

module.exports = {
  ActiveContributor,
  getInstance: () => {
    if (!instance) {
      instance = new ActiveContributor();
    }
    return instance;
  }
};
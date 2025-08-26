/**
 * BUMBA Collaboration Status Manager
 * Centralized status tracking for all collaboration activities
 * Provides real-time visibility and historical analytics
 */

const { RealtimeCoordinationManager } = require('./realtime-coordination-hooks');
const fs = require('fs').promises;
const path = require('path');

class CollaborationStatusManager {
  constructor() {
    this.realtimeManager = RealtimeCoordinationManager.getInstance();
    this.statusStore = new Map();
    this.activityLog = [];
    this.metrics = {
      totalCollaborations: 0,
      activeCollaborations: 0,
      averageDuration: 0,
      successRate: 0
    };
    this.persistencePath = path.join(process.env.HOME, '.claude', 'team', 'collaboration-status');
    this.autoSaveInterval = 30000; // 30 seconds
    
    this.initialize();
  }

  /**
   * Initialize status manager
   */
  async initialize() {
    // Load persisted status
    await this.loadPersistedStatus();
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Start auto-save
    this.startAutoSave();
    
    console.log('CollaborationStatusManager initialized');
  }

  /**
   * Setup real-time event listeners
   */
  setupEventListeners() {
    // Collaboration events
    this.realtimeManager.subscribe('collaboration:status', (data) => {
      this.updateCollaborationStatus(data);
    });
    
    // Agent status updates
    this.realtimeManager.subscribe('status:update', (data) => {
      this.updateAgentStatus(data);
    });
    
    // Review events
    this.realtimeManager.subscribe('review:submitted', (data) => {
      this.updateReviewStatus(data);
    });
    
    // Document events
    this.realtimeManager.subscribe('document:approved', (data) => {
      this.updateDocumentStatus(data);
    });
  }

  /**
   * Update collaboration status
   */
  updateCollaborationStatus(data) {
    const status = this.statusStore.get(data.id) || {
      id: data.id,
      type: 'collaboration',
      createdAt: Date.now(),
      events: []
    };
    
    status.lastUpdate = Date.now();
    status.currentStatus = data.status;
    status.progress = data.progress;
    status.agents = data.agents;
    
    status.events.push({
      type: data.event,
      timestamp: Date.now(),
      data: data
    });
    
    this.statusStore.set(data.id, status);
    
    // Update metrics
    if (data.event === 'started') {
      this.metrics.totalCollaborations++;
      this.metrics.activeCollaborations++;
    } else if (data.event === 'completed') {
      this.metrics.activeCollaborations--;
      this.updateAverageDuration(data.duration);
    }
    
    // Log activity
    this.logActivity('collaboration', data);
  }

  /**
   * Update agent status
   */
  updateAgentStatus(data) {
    const agentKey = `agent-${data.agentId}`;
    const status = this.statusStore.get(agentKey) || {
      id: agentKey,
      type: 'agent',
      agentId: data.agentId,
      createdAt: Date.now(),
      statusHistory: []
    };
    
    status.currentStatus = data.status;
    status.lastActivity = Date.now();
    status.metadata = data.metadata;
    
    status.statusHistory.push({
      status: data.status,
      timestamp: Date.now(),
      metadata: data.metadata
    });
    
    // Keep only last 100 status updates
    if (status.statusHistory.length > 100) {
      status.statusHistory = status.statusHistory.slice(-100);
    }
    
    this.statusStore.set(agentKey, status);
    this.logActivity('agent', data);
  }

  /**
   * Update review status
   */
  updateReviewStatus(data) {
    const reviewKey = `review-${data.reviewId}`;
    const status = this.statusStore.get(reviewKey) || {
      id: reviewKey,
      type: 'review',
      reviewId: data.reviewId,
      createdAt: Date.now()
    };
    
    status.department = data.department;
    status.approved = data.approved;
    status.hasChangesRequired = data.hasChangesRequired;
    status.lastUpdate = Date.now();
    
    this.statusStore.set(reviewKey, status);
    this.logActivity('review', data);
  }

  /**
   * Update document status
   */
  updateDocumentStatus(data) {
    const docKey = `doc-${data.documentId}`;
    const status = this.statusStore.get(docKey) || {
      id: docKey,
      type: 'document',
      documentId: data.documentId,
      createdAt: Date.now()
    };
    
    status.title = data.title;
    status.approved = true;
    status.approvedAt = Date.now();
    status.reviewId = data.reviewId;
    
    this.statusStore.set(docKey, status);
    this.logActivity('document', data);
  }

  /**
   * Log activity
   */
  logActivity(type, data) {
    const activity = {
      type,
      timestamp: Date.now(),
      data
    };
    
    this.activityLog.push(activity);
    
    // Keep only last 1000 activities
    if (this.activityLog.length > 1000) {
      this.activityLog = this.activityLog.slice(-1000);
    }
  }

  /**
   * Update average duration metric
   */
  updateAverageDuration(duration) {
    const total = this.metrics.totalCollaborations;
    const currentAvg = this.metrics.averageDuration;
    
    this.metrics.averageDuration = Math.round(
      ((currentAvg * (total - 1)) + duration) / total
    );
  }

  /**
   * Get current status summary
   */
  getStatusSummary() {
    const collaborations = [];
    const agents = [];
    const reviews = [];
    const documents = [];
    
    this.statusStore.forEach((status, key) => {
      switch (status.type) {
        case 'collaboration':
          collaborations.push({
            id: status.id,
            status: status.currentStatus,
            progress: status.progress,
            lastUpdate: status.lastUpdate
          });
          break;
        case 'agent':
          if (Date.now() - status.lastActivity < 300000) { // Active in last 5 min
            agents.push({
              id: status.agentId,
              status: status.currentStatus,
              lastActivity: status.lastActivity
            });
          }
          break;
        case 'review':
          reviews.push({
            id: status.reviewId,
            approved: status.approved,
            department: status.department
          });
          break;
        case 'document':
          documents.push({
            id: status.documentId,
            title: status.title,
            approved: status.approved
          });
          break;
      }
    });
    
    return {
      metrics: this.metrics,
      activeCollaborations: collaborations.filter(c => 
        c.status !== 'completed'
      ),
      activeAgents: agents,
      recentReviews: reviews.slice(-5),
      recentDocuments: documents.slice(-5),
      timestamp: Date.now()
    };
  }

  /**
   * Get detailed status for specific item
   */
  getDetailedStatus(id) {
    return this.statusStore.get(id) || null;
  }

  /**
   * Get activity timeline
   */
  getActivityTimeline(options = {}) {
    const {
      type = null,
      limit = 50,
      since = Date.now() - 3600000 // Last hour
    } = options;
    
    let activities = this.activityLog.filter(a => a.timestamp >= since);
    
    if (type) {
      activities = activities.filter(a => a.type === type);
    }
    
    return activities.slice(-limit);
  }

  /**
   * Get collaboration analytics
   */
  getAnalytics() {
    const now = Date.now();
    const hourAgo = now - 3600000;
    const dayAgo = now - 86400000;
    
    const recentActivities = this.activityLog.filter(a => a.timestamp >= hourAgo);
    const dailyActivities = this.activityLog.filter(a => a.timestamp >= dayAgo);
    
    return {
      overall: this.metrics,
      lastHour: {
        activities: recentActivities.length,
        byType: this.groupByType(recentActivities)
      },
      last24Hours: {
        activities: dailyActivities.length,
        byType: this.groupByType(dailyActivities)
      },
      trends: this.calculateTrends()
    };
  }

  /**
   * Group activities by type
   */
  groupByType(activities) {
    const grouped = {};
    
    activities.forEach(activity => {
      if (!grouped[activity.type]) {
        grouped[activity.type] = 0;
      }
      grouped[activity.type]++;
    });
    
    return grouped;
  }

  /**
   * Calculate trends
   */
  calculateTrends() {
    const now = Date.now();
    const intervals = [];
    
    // Calculate activity for last 6 hours in 1-hour intervals
    for (let i = 6; i > 0; i--) {
      const start = now - (i * 3600000);
      const end = now - ((i - 1) * 3600000);
      
      const activities = this.activityLog.filter(a => 
        a.timestamp >= start && a.timestamp < end
      );
      
      intervals.push({
        hour: new Date(start).getHours(),
        count: activities.length
      });
    }
    
    return {
      hourly: intervals,
      peak: intervals.reduce((max, i) => i.count > max.count ? i : max, intervals[0])
    };
  }

  /**
   * Load persisted status
   */
  async loadPersistedStatus() {
    try {
      await fs.mkdir(this.persistencePath, { recursive: true });
      
      const statusFile = path.join(this.persistencePath, 'status.json');
      const metricsFile = path.join(this.persistencePath, 'metrics.json');
      
      // Load status store
      try {
        const statusData = await fs.readFile(statusFile, 'utf8');
        const parsed = JSON.parse(statusData);
        this.statusStore = new Map(Object.entries(parsed));
      } catch (e) {
        // File doesn't exist yet
      }
      
      // Load metrics
      try {
        const metricsData = await fs.readFile(metricsFile, 'utf8');
        this.metrics = JSON.parse(metricsData);
      } catch (e) {
        // File doesn't exist yet
      }
      
    } catch (error) {
      console.error('Error loading persisted status:', error);
    }
  }

  /**
   * Save current status to disk
   */
  async saveStatus() {
    try {
      await fs.mkdir(this.persistencePath, { recursive: true });
      
      // Save status store
      const statusFile = path.join(this.persistencePath, 'status.json');
      const statusData = Object.fromEntries(this.statusStore);
      await fs.writeFile(statusFile, JSON.stringify(statusData, null, 2));
      
      // Save metrics
      const metricsFile = path.join(this.persistencePath, 'metrics.json');
      await fs.writeFile(metricsFile, JSON.stringify(this.metrics, null, 2));
      
      // Save recent activity log
      const activityFile = path.join(this.persistencePath, 'activity.json');
      await fs.writeFile(activityFile, JSON.stringify(this.activityLog.slice(-100), null, 2));
      
    } catch (error) {
      console.error('Error saving status:', error);
    }
  }

  /**
   * Start auto-save timer
   */
  startAutoSave() {
    setInterval(() => {
      this.saveStatus();
    }, this.autoSaveInterval);
  }

  /**
   * Clear old status entries
   */
  cleanup(maxAge = 86400000) { // 24 hours
    const now = Date.now();
    const toDelete = [];
    
    this.statusStore.forEach((status, key) => {
      const age = now - (status.lastUpdate || status.createdAt);
      if (age > maxAge) {
        toDelete.push(key);
      }
    });
    
    toDelete.forEach(key => {
      this.statusStore.delete(key);
    });
    
    return toDelete.length;
  }
}

// Singleton instance
let instance = null;

module.exports = {
  CollaborationStatusManager,
  getInstance: () => {
    if (!instance) {
      instance = new CollaborationStatusManager();
    }
    return instance;
  }
};
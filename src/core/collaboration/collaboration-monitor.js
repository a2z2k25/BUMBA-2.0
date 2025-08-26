/**
 * BUMBA Collaboration Monitor
 * Real-time monitoring and coordination for parallel agent work
 * Provides visibility into ongoing collaborations and progress
 */

const RealtimeEventEmitter = require('./realtime-event-emitter');

class CollaborationMonitor {
  constructor() {
    this.emitter = new RealtimeEventEmitter();
    this.collaborations = new Map();
    this.metrics = {
      totalCollaborations: 0,
      activeCollaborations: 0,
      completedCollaborations: 0,
      averageDuration: 0
    };
    
    this.setupEventListeners();
  }

  /**
   * Setup internal event listeners
   */
  setupEventListeners() {
    this.emitter.on('status:update', (data) => {
      this.handleStatusUpdate(data);
    });

    this.emitter.on('agent:registered', (data) => {
      console.log(`[CollaborationMonitor] Agent registered: ${data.agentId}`);
    });

    this.emitter.on('channel:joined', (data) => {
      console.log(`[CollaborationMonitor] ${data.agentId} joined ${data.channelName}`);
    });
  }

  /**
   * Start monitoring a new collaboration
   */
  startCollaboration(collaborationId, config) {
    const collaboration = {
      id: collaborationId,
      type: config.type || 'parallel',
      departments: config.departments || [],
      agents: new Map(),
      startTime: Date.now(),
      status: 'initializing',
      progress: 0,
      tasks: config.tasks || [],
      completedTasks: [],
      channel: `collab-${collaborationId}`
    };

    this.collaborations.set(collaborationId, collaboration);
    this.metrics.totalCollaborations++;
    this.metrics.activeCollaborations++;

    // Create collaboration channel
    config.departments.forEach(dept => {
      const agentId = `${dept}-${collaborationId}`;
      this.emitter.registerAgent(agentId, { department: dept });
      this.emitter.subscribeToChannel(agentId, collaboration.channel);
      collaboration.agents.set(agentId, {
        department: dept,
        status: 'ready',
        tasksCompleted: 0
      });
    });

    this.broadcastCollaborationStatus(collaborationId, 'started');
    return collaboration;
  }

  /**
   * Update agent status within collaboration
   */
  updateAgentStatus(collaborationId, agentId, status, metadata = {}) {
    const collaboration = this.collaborations.get(collaborationId);
    if (!collaboration) {return false;}

    const agent = collaboration.agents.get(agentId);
    if (!agent) {return false;}

    agent.status = status;
    agent.lastUpdate = Date.now();
    
    // Broadcast to all agents in collaboration
    this.emitter.broadcastStatus(agentId, status, {
      ...metadata,
      collaborationId
    });

    // Update collaboration progress
    this.updateCollaborationProgress(collaborationId);
    
    return true;
  }

  /**
   * Report task completion
   */
  reportTaskComplete(collaborationId, agentId, taskId, results = {}) {
    const collaboration = this.collaborations.get(collaborationId);
    if (!collaboration) {return false;}

    const agent = collaboration.agents.get(agentId);
    if (!agent) {return false;}

    agent.tasksCompleted++;
    collaboration.completedTasks.push({
      taskId,
      agentId,
      completedAt: Date.now(),
      results
    });

    // Send to collaboration channel
    this.emitter.sendToChannel(collaboration.channel, {
      type: 'task:complete',
      agentId,
      taskId,
      results
    });

    this.updateCollaborationProgress(collaborationId);
    return true;
  }

  /**
   * Update overall collaboration progress
   */
  updateCollaborationProgress(collaborationId) {
    const collaboration = this.collaborations.get(collaborationId);
    if (!collaboration) {return;}

    const totalTasks = collaboration.tasks.length;
    const completedTasks = collaboration.completedTasks.length;
    
    collaboration.progress = totalTasks > 0 
      ? Math.round((completedTasks / totalTasks) * 100)
      : 0;

    // Check if collaboration is complete
    if (collaboration.progress === 100 && collaboration.status !== 'completed') {
      this.completeCollaboration(collaborationId);
    }

    this.broadcastCollaborationStatus(collaborationId, 'progress');
  }

  /**
   * Complete a collaboration
   */
  completeCollaboration(collaborationId) {
    const collaboration = this.collaborations.get(collaborationId);
    if (!collaboration) {return false;}

    collaboration.status = 'completed';
    collaboration.endTime = Date.now();
    collaboration.duration = collaboration.endTime - collaboration.startTime;

    // Update metrics
    this.metrics.activeCollaborations--;
    this.metrics.completedCollaborations++;
    this.updateAverageDuration(collaboration.duration);

    // Cleanup agents
    collaboration.agents.forEach((agent, agentId) => {
      this.emitter.unregisterAgent(agentId);
    });

    this.broadcastCollaborationStatus(collaborationId, 'completed');
    return true;
  }

  /**
   * Broadcast collaboration status
   */
  broadcastCollaborationStatus(collaborationId, event) {
    const collaboration = this.collaborations.get(collaborationId);
    if (!collaboration) {return;}

    const status = {
      id: collaborationId,
      event,
      status: collaboration.status,
      progress: collaboration.progress,
      agents: Array.from(collaboration.agents.entries()).map(([id, agent]) => ({
        id,
        department: agent.department,
        tasksCompleted: agent.tasksCompleted
      })),
      duration: collaboration.endTime 
        ? collaboration.duration 
        : Date.now() - collaboration.startTime
    };

    this.emitter.emit('collaboration:status', status);
    console.log(`[CollaborationMonitor] ${collaborationId}: ${event} (${collaboration.progress}%)`);
  }

  /**
   * Get real-time collaboration status
   */
  getCollaborationStatus(collaborationId) {
    const collaboration = this.collaborations.get(collaborationId);
    if (!collaboration) {return null;}

    return {
      ...collaboration,
      agents: Array.from(collaboration.agents.entries()),
      duration: collaboration.endTime 
        ? collaboration.duration 
        : Date.now() - collaboration.startTime
    };
  }

  /**
   * Get all active collaborations
   */
  getActiveCollaborations() {
    return Array.from(this.collaborations.values())
      .filter(c => c.status !== 'completed')
      .map(c => ({
        id: c.id,
        type: c.type,
        progress: c.progress,
        agents: c.agents.size,
        duration: Date.now() - c.startTime
      }));
  }

  /**
   * Get collaboration metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      emitterStatus: this.emitter.getCollaborationStatus()
    };
  }

  /**
   * Update average duration metric
   */
  updateAverageDuration(duration) {
    const completed = this.metrics.completedCollaborations;
    const currentAvg = this.metrics.averageDuration;
    this.metrics.averageDuration = Math.round(
      ((currentAvg * (completed - 1)) + duration) / completed
    );
  }

  /**
   * Handle status updates from emitter
   */
  handleStatusUpdate(data) {
    if (data.metadata && data.metadata.collaborationId) {
      const collaboration = this.collaborations.get(data.metadata.collaborationId);
      if (collaboration && collaboration.agents.has(data.agentId)) {
        collaboration.agents.get(data.agentId).status = data.status;
      }
    }
  }

  /**
   * Cleanup inactive collaborations
   */
  cleanup(maxInactiveMs = 600000) {
    const now = Date.now();
    const toCleanup = [];

    this.collaborations.forEach((collab, id) => {
      if (collab.status === 'completed' && 
          now - collab.endTime > maxInactiveMs) {
        toCleanup.push(id);
      }
    });

    toCleanup.forEach(id => {
      this.collaborations.delete(id);
    });

    // Also cleanup inactive agents
    this.emitter.cleanupInactive(maxInactiveMs);

    return toCleanup.length;
  }
}

module.exports = CollaborationMonitor;
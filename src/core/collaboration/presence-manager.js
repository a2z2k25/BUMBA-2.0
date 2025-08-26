/**
 * BUMBA Presence Manager
 * Real-time agent presence awareness and activity tracking
 */

const EventEmitter = require('events');
const { logger } = require('../logging/bumba-logger');

class PresenceManager extends EventEmitter {
  constructor() {
    super();
    this.globalPresence = new Map(); // All registered agents
    this.sessionPresence = new Map(); // Agents by session
    this.activityTimers = new Map(); // Activity timeout timers
    this.presenceHistory = new Map(); // Historical presence data
    
    this.config = {
      idleTimeout: 300000, // 5 minutes
      awayTimeout: 900000, // 15 minutes
      offlineTimeout: 1800000, // 30 minutes
      heartbeatInterval: 30000 // 30 seconds
    };

    this.setupPresenceMonitoring();
  }

  setupPresenceMonitoring() {
    // Regular cleanup of stale presence data
    setInterval(() => {
      this.cleanupStalePresence();
    }, 60000); // Every minute

    // Heartbeat monitoring
    setInterval(() => {
      this.checkHeartbeats();
    }, this.config.heartbeatInterval);
  }

  async registerAgent(agentInfo) {
    const presence = {
      id: agentInfo.id,
      name: agentInfo.name || agentInfo.id,
      type: agentInfo.type || 'agent',
      status: 'online',
      activity: 'active',
      capabilities: agentInfo.capabilities || [],
      currentSession: null,
      location: {
        session: null,
        workspace: null,
        file: null,
        line: null
      },
      metadata: {
        joinedAt: Date.now(),
        lastSeen: Date.now(),
        lastActivity: Date.now(),
        sessionsCount: 0,
        totalUptime: 0
      },
      heartbeat: {
        lastHeartbeat: Date.now(),
        missedHeartbeats: 0
      }
    };

    this.globalPresence.set(agentInfo.id, presence);
    
    logger.info(`🟢 Agent ${agentInfo.id} registered with presence system`);
    
    this.emit('agent_registered', { agentId: agentInfo.id, presence });
    
    return presence;
  }

  async addAgent(sessionId, agent) {
    if (!this.sessionPresence.has(sessionId)) {
      this.sessionPresence.set(sessionId, new Map());
    }

    const globalPresence = this.globalPresence.get(agent.id);
    if (!globalPresence) {
      // Register agent if not already registered
      await this.registerAgent(agent);
    }

    const sessionPresence = {
      agentId: agent.id,
      sessionId: sessionId,
      joinedAt: Date.now(),
      status: 'active',
      activity: 'joined',
      location: {
        workspace: 'main',
        file: null,
        line: null,
        cursor: null
      },
      focus: {
        element: null,
        startTime: Date.now()
      },
      collaboration: {
        currentTask: null,
        partneredWith: [],
        lastInteraction: Date.now()
      }
    };

    this.sessionPresence.get(sessionId).set(agent.id, sessionPresence);

    // Update global presence
    if (globalPresence) {
      globalPresence.currentSession = sessionId;
      globalPresence.metadata.sessionsCount++;
      globalPresence.lastActivity = Date.now();
    }

    this.emit('agent_joined_session', { sessionId, agentId: agent.id, presence: sessionPresence });
    
    logger.info(`🟢 Agent ${agent.id} joined session ${sessionId}`);
  }

  async removeAgent(agentId) {
    const globalPresence = this.globalPresence.get(agentId);
    if (!globalPresence) {
      return false;
    }

    // Remove from all sessions
    for (const [sessionId, sessionAgents] of this.sessionPresence) {
      if (sessionAgents.has(agentId)) {
        sessionAgents.delete(agentId);
        this.emit('agent_left_session', { sessionId, agentId });
      }
    }

    // Update global presence to offline
    globalPresence.status = 'offline';
    globalPresence.currentSession = null;
    globalPresence.metadata.lastSeen = Date.now();

    // Archive presence data
    this.archivePresenceData(agentId, globalPresence);

    this.emit('agent_offline', { agentId, lastSeen: Date.now() });
    
    logger.info(`🟢 Agent ${agentId} removed from presence system`);
    
    return true;
  }

  async updatePresence(sessionId, agentId, presenceUpdate) {
    const sessionPresence = this.sessionPresence.get(sessionId)?.get(agentId);
    const globalPresence = this.globalPresence.get(agentId);

    if (!sessionPresence) {
      logger.warn(`No session presence found for agent ${agentId} in session ${sessionId}`);
      return false;
    }

    // Update session presence
    Object.assign(sessionPresence, {
      ...presenceUpdate,
      lastUpdate: Date.now()
    });

    // Update global presence
    if (globalPresence) {
      globalPresence.lastActivity = Date.now();
      globalPresence.lastSeen = Date.now();
      
      if (presenceUpdate.status) {
        globalPresence.status = presenceUpdate.status;
      }
      
      if (presenceUpdate.activity) {
        globalPresence.activity = presenceUpdate.activity;
      }

      if (presenceUpdate.location) {
        Object.assign(globalPresence.location, presenceUpdate.location);
      }
    }

    // Reset activity timer
    this.resetActivityTimer(agentId);

    this.emit('presence_updated', { 
      sessionId, 
      agentId, 
      presence: sessionPresence,
      update: presenceUpdate 
    });

    return true;
  }

  async updateLocation(sessionId, agentId, location) {
    const sessionPresence = this.sessionPresence.get(sessionId)?.get(agentId);
    if (!sessionPresence) {
      return false;
    }

    sessionPresence.location = {
      ...sessionPresence.location,
      ...location,
      updatedAt: Date.now()
    };

    // Emit location change event
    this.emit('location_changed', {
      sessionId,
      agentId,
      location: sessionPresence.location
    });

    return true;
  }

  async updateFocus(sessionId, agentId, focusInfo) {
    const sessionPresence = this.sessionPresence.get(sessionId)?.get(agentId);
    if (!sessionPresence) {
      return false;
    }

    sessionPresence.focus = {
      element: focusInfo.element,
      startTime: Date.now(),
      metadata: focusInfo.metadata || {}
    };

    this.emit('focus_changed', {
      sessionId,
      agentId,
      focus: sessionPresence.focus
    });

    return true;
  }

  async recordCollaboration(sessionId, agentId, collaborationInfo) {
    const sessionPresence = this.sessionPresence.get(sessionId)?.get(agentId);
    if (!sessionPresence) {
      return false;
    }

    sessionPresence.collaboration = {
      ...sessionPresence.collaboration,
      ...collaborationInfo,
      lastInteraction: Date.now()
    };

    this.emit('collaboration_updated', {
      sessionId,
      agentId,
      collaboration: sessionPresence.collaboration
    });

    return true;
  }

  async heartbeat(agentId) {
    const globalPresence = this.globalPresence.get(agentId);
    if (!globalPresence) {
      return false;
    }

    globalPresence.heartbeat.lastHeartbeat = Date.now();
    globalPresence.heartbeat.missedHeartbeats = 0;
    globalPresence.lastSeen = Date.now();

    // Update status based on activity
    const timeSinceActivity = Date.now() - globalPresence.lastActivity;
    
    if (timeSinceActivity > this.config.awayTimeout) {
      globalPresence.status = 'away';
    } else if (timeSinceActivity > this.config.idleTimeout) {
      globalPresence.status = 'idle';
    } else {
      globalPresence.status = 'online';
    }

    return true;
  }

  getSessionPresence(sessionId) {
    const sessionAgents = this.sessionPresence.get(sessionId);
    if (!sessionAgents) {
      return [];
    }

    return Array.from(sessionAgents.values());
  }

  getAgentPresence(agentId) {
    return this.globalPresence.get(agentId) || null;
  }

  getActiveAgents(sessionId = null) {
    if (sessionId) {
      return this.getSessionPresence(sessionId).filter(p => 
        p.status === 'active' || p.status === 'online'
      );
    }

    return Array.from(this.globalPresence.values()).filter(p => 
      p.status === 'online' || p.status === 'idle'
    );
  }

  getAgentsByCapability(capability, sessionId = null) {
    const agents = sessionId ? this.getSessionPresence(sessionId) : Array.from(this.globalPresence.values());
    
    return agents.filter(agent => {
      const globalPresence = this.globalPresence.get(agent.agentId || agent.id);
      return globalPresence && globalPresence.capabilities.includes(capability);
    });
  }

  getCollaborationPartners(sessionId, agentId) {
    const sessionPresence = this.sessionPresence.get(sessionId)?.get(agentId);
    if (!sessionPresence) {
      return [];
    }

    const partners = sessionPresence.collaboration.partneredWith || [];
    return partners.map(partnerId => this.sessionPresence.get(sessionId)?.get(partnerId))
                   .filter(Boolean);
  }

  getMetrics(sessionId = null) {
    if (sessionId) {
      return this.getSessionMetrics(sessionId);
    }

    return this.getGlobalMetrics();
  }

  getSessionMetrics(sessionId) {
    const sessionAgents = this.sessionPresence.get(sessionId);
    if (!sessionAgents) {
      return {
        totalAgents: 0,
        activeAgents: 0,
        averageSessionTime: 0,
        collaborationScore: 0
      };
    }

    const agents = Array.from(sessionAgents.values());
    const activeAgents = agents.filter(a => a.status === 'active');
    const currentTime = Date.now();
    
    const averageSessionTime = agents.reduce((sum, agent) => 
      sum + (currentTime - agent.joinedAt), 0) / agents.length;

    const collaborationScore = this.calculateCollaborationScore(agents);

    return {
      totalAgents: agents.length,
      activeAgents: activeAgents.length,
      averageSessionTime,
      collaborationScore,
      locationDistribution: this.calculateLocationDistribution(agents),
      activityDistribution: this.calculateActivityDistribution(agents)
    };
  }

  getGlobalMetrics() {
    const agents = Array.from(this.globalPresence.values());
    const onlineAgents = agents.filter(a => a.status === 'online');
    const totalSessions = agents.reduce((sum, agent) => sum + agent.metadata.sessionsCount, 0);

    return {
      totalRegisteredAgents: agents.length,
      onlineAgents: onlineAgents.length,
      totalSessions,
      averageSessionsPerAgent: totalSessions / agents.length,
      statusDistribution: this.calculateStatusDistribution(agents),
      capabilityDistribution: this.calculateCapabilityDistribution(agents)
    };
  }

  calculateCollaborationScore(agents) {
    if (agents.length <= 1) {return 0;}

    let score = 0;
    const now = Date.now();

    // Active collaboration
    const recentInteractions = agents.filter(a => 
      now - a.collaboration.lastInteraction < 300000 // 5 minutes
    ).length;
    score += (recentInteractions / agents.length) * 0.4;

    // Partnership diversity
    const totalPartnerships = agents.reduce((sum, a) => 
      sum + (a.collaboration.partneredWith?.length || 0), 0);
    const maxPossiblePartnerships = agents.length * (agents.length - 1);
    score += (totalPartnerships / maxPossiblePartnerships) * 0.3;

    // Location clustering (agents working on same files)
    const locationClusters = this.calculateLocationClusters(agents);
    score += (locationClusters / agents.length) * 0.3;

    return Math.min(1.0, score);
  }

  calculateLocationClusters(agents) {
    const locationGroups = new Map();
    
    for (const agent of agents) {
      const locationKey = `${agent.location.workspace}-${agent.location.file}`;
      if (!locationGroups.has(locationKey)) {
        locationGroups.set(locationKey, 0);
      }
      locationGroups.set(locationKey, locationGroups.get(locationKey) + 1);
    }

    return Array.from(locationGroups.values()).filter(count => count > 1).length;
  }

  calculateLocationDistribution(agents) {
    const distribution = new Map();
    
    for (const agent of agents) {
      const location = agent.location.workspace || 'unknown';
      distribution.set(location, (distribution.get(location) || 0) + 1);
    }

    return Object.fromEntries(distribution);
  }

  calculateActivityDistribution(agents) {
    const distribution = new Map();
    
    for (const agent of agents) {
      const activity = agent.activity || 'unknown';
      distribution.set(activity, (distribution.get(activity) || 0) + 1);
    }

    return Object.fromEntries(distribution);
  }

  calculateStatusDistribution(agents) {
    const distribution = new Map();
    
    for (const agent of agents) {
      const status = agent.status || 'unknown';
      distribution.set(status, (distribution.get(status) || 0) + 1);
    }

    return Object.fromEntries(distribution);
  }

  calculateCapabilityDistribution(agents) {
    const distribution = new Map();
    
    for (const agent of agents) {
      for (const capability of agent.capabilities || []) {
        distribution.set(capability, (distribution.get(capability) || 0) + 1);
      }
    }

    return Object.fromEntries(distribution);
  }

  resetActivityTimer(agentId) {
    if (this.activityTimers.has(agentId)) {
      clearTimeout(this.activityTimers.get(agentId));
    }

    const timer = setTimeout(() => {
      this.handleInactivity(agentId);
    }, this.config.idleTimeout);

    this.activityTimers.set(agentId, timer);
  }

  handleInactivity(agentId) {
    const globalPresence = this.globalPresence.get(agentId);
    if (globalPresence) {
      globalPresence.status = 'idle';
      this.emit('agent_idle', { agentId });
    }
  }

  cleanupStalePresence() {
    const now = Date.now();
    const agentsToCleanup = [];

    for (const [agentId, presence] of this.globalPresence) {
      const timeSinceLastSeen = now - presence.metadata.lastSeen;
      
      if (timeSinceLastSeen > this.config.offlineTimeout) {
        agentsToCleanup.push(agentId);
      }
    }

    for (const agentId of agentsToCleanup) {
      this.removeAgent(agentId);
    }
  }

  checkHeartbeats() {
    const now = Date.now();
    
    for (const [agentId, presence] of this.globalPresence) {
      const timeSinceHeartbeat = now - presence.heartbeat.lastHeartbeat;
      
      if (timeSinceHeartbeat > this.config.heartbeatInterval * 2) {
        presence.heartbeat.missedHeartbeats++;
        
        if (presence.heartbeat.missedHeartbeats >= 3) {
          this.handleMissedHeartbeats(agentId);
        }
      }
    }
  }

  handleMissedHeartbeats(agentId) {
    const globalPresence = this.globalPresence.get(agentId);
    if (globalPresence) {
      globalPresence.status = 'away';
      this.emit('agent_unresponsive', { agentId });
      logger.warn(`🟢 Agent ${agentId} is unresponsive (missed heartbeats)`);
    }
  }

  archivePresenceData(agentId, presence) {
    if (!this.presenceHistory.has(agentId)) {
      this.presenceHistory.set(agentId, []);
    }

    this.presenceHistory.get(agentId).push({
      ...presence,
      archivedAt: Date.now()
    });

    // Remove from global presence
    this.globalPresence.delete(agentId);
  }

  getPresenceHistory(agentId) {
    return this.presenceHistory.get(agentId) || [];
  }
}

module.exports = {
  PresenceManager
};
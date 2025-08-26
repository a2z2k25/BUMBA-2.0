/**
 * BUMBA Collaborative Session
 * Individual collaboration session management with consciousness integration
 */

const EventEmitter = require('events');
const { logger } = require('../logging/bumba-logger');

class CollaborativeSession extends EventEmitter {
  constructor(config) {
    super();
    this.id = config.id;
    this.purpose = config.purpose;
    this.objectives = config.objectives || [];
    this.participants = new Map();
    this.createdAt = Date.now();
    this.status = 'active';
    this.sharedState = config.sharedState;
    this.crdtResolver = config.crdtResolver;
    this.presenceManager = config.presenceManager;
    this.ethicsMonitor = config.ethicsMonitor;
    this.consciousnessLayer = config.consciousnessLayer;
    
    this.metrics = {
      participantCount: 0,
      operationsCount: 0,
      conflictsResolved: 0,
      ethicsChecks: 0,
      consensusReached: 0
    };

    this.initializeSession();
  }

  async initializeSession() {
    // Create shared state for this session
    await this.sharedState.createSessionState(this.id, {
      metadata: {
        purpose: this.purpose,
        objectives: this.objectives,
        createdAt: this.createdAt
      },
      workspace: {},
      decisions: {},
      code: {},
      discussions: []
    });

    logger.info(`🟢 Collaborative session ${this.id} initialized`);
  }

  async addParticipant(agent, capabilities = {}) {
    // Validate participant addition with ethics
    await this.ethicsMonitor.validateParticipation(agent, this);

    const participant = {
      id: agent.id,
      name: agent.name || agent.id,
      type: agent.type || 'agent',
      capabilities,
      joinedAt: Date.now(),
      isActive: true,
      contributions: {
        edits: 0,
        decisions: 0,
        discussions: 0
      }
    };

    this.participants.set(agent.id, participant);
    this.metrics.participantCount = this.participants.size;

    // Update shared state with new participant
    await this.sharedState.applyOperation(this.id, {
      type: 'update',
      key: 'metadata',
      updates: {
        participants: Array.from(this.participants.values())
      },
      agent: agent.id,
      timestamp: Date.now()
    });

    this.emit('participant_added', { agent, participant });
    
    logger.info(`🟢 Participant ${agent.id} added to session ${this.id}`);
    
    return participant;
  }

  async removeParticipant(agentId) {
    const participant = this.participants.get(agentId);
    if (!participant) {
      return false;
    }

    participant.leftAt = Date.now();
    participant.isActive = false;
    
    // Keep participant record but mark as inactive
    this.participants.set(agentId, participant);

    // Update shared state
    await this.sharedState.applyOperation(this.id, {
      type: 'update',
      key: 'metadata',
      updates: {
        participants: Array.from(this.participants.values())
      },
      agent: agentId,
      timestamp: Date.now()
    });

    this.emit('participant_removed', { agentId, participant });
    
    logger.info(`🟢 Participant ${agentId} removed from session ${this.id}`);
    
    return true;
  }

  async recordContribution(agentId, contributionType, details = {}) {
    const participant = this.participants.get(agentId);
    if (!participant) {
      throw new Error(`Participant ${agentId} not found`);
    }

    // Update contribution metrics
    participant.contributions[contributionType]++;
    participant.lastActivity = Date.now();

    // Record in shared state
    await this.sharedState.applyOperation(this.id, {
      type: 'insert',
      collection: 'discussions',
      index: -1,
      value: {
        id: this.generateContributionId(),
        agentId,
        details,
        timestamp: Date.now()
      },
      agent: agentId,
      timestamp: Date.now()
    });

    this.emit('contribution_recorded', { agentId, contributionType, details });
  }

  async pauseForEthicsReview(violation) {
    this.status = 'ethics_review';
    
    // Notify all participants
    this.emit('ethics_pause', {
      violation,
      message: 'Session paused for ethics review',
      timestamp: Date.now()
    });

    // Log the ethics pause
    await this.sharedState.applyOperation(this.id, {
      type: 'insert',
      collection: 'discussions',
      index: -1,
      value: {
        violation,
        timestamp: Date.now()
      },
      agent: 'system',
      timestamp: Date.now()
    });

    logger.warn(`🟡 Session ${this.id} paused for ethics review: ${violation.type}`);
  }

  async resumeAfterEthicsReview(resolution) {
    this.status = 'active';
    
    // Record the resolution
    await this.sharedState.applyOperation(this.id, {
      type: 'insert',
      collection: 'discussions',
      index: -1,
      value: {
        resolution,
        timestamp: Date.now()
      },
      agent: 'system',
      timestamp: Date.now()
    });

    this.emit('ethics_resolution', {
      resolution,
      message: 'Session resumed after ethics review',
      timestamp: Date.now()
    });

    logger.info(`🏁 Session ${this.id} resumed after ethics review`);
  }

  getParticipants() {
    return Array.from(this.participants.values()).filter(p => p.isActive);
  }

  hasParticipant(agentId) {
    return this.participants.has(agentId) && this.participants.get(agentId).isActive;
  }

  getSessionState() {
    const currentState = this.sharedState.states.get(this.id);
    return {
      id: this.id,
      purpose: this.purpose,
      objectives: this.objectives,
      status: this.status,
      participants: this.getParticipants(),
      metrics: this.metrics,
      createdAt: this.createdAt,
      sharedState: currentState ? currentState.getCurrentState() : {}
    };
  }

  getMetrics() {
    const activeParticipants = this.getParticipants();
    
    return {
      ...this.metrics,
      activeParticipants: activeParticipants.length,
      sessionDuration: Date.now() - this.createdAt,
      averageContributions: this.calculateAverageContributions(activeParticipants),
      collaborationScore: this.calculateCollaborationScore(activeParticipants)
    };
  }

  calculateAverageContributions(participants) {
    if (participants.length === 0) {return 0;}
    
    const totalContributions = participants.reduce((sum, p) => {
      return sum + p.contributions.edits + p.contributions.decisions + p.contributions.discussions;
    }, 0);
    
    return totalContributions / participants.length;
  }

  calculateCollaborationScore(participants) {
    if (participants.length === 0) {return 0;}
    
    // Score based on participant engagement and collaboration quality
    let score = 0;
    
    // Participation diversity
    const typesDiversity = new Set(participants.map(p => p.type)).size;
    score += typesDiversity * 0.2;
    
    // Active participation
    const activeCount = participants.filter(p => 
      Date.now() - p.lastActivity < 300000 // Active in last 5 minutes
    ).length;
    score += (activeCount / participants.length) * 0.3;
    
    // Contribution balance
    const contributionVariance = this.calculateContributionVariance(participants);
    score += (1 - contributionVariance) * 0.3;
    
    // Ethics compliance
    score += (this.metrics.ethicsChecks > 0 ? 0.2 : 0);
    
    return Math.min(1.0, score);
  }

  calculateContributionVariance(participants) {
    if (participants.length <= 1) {return 0;}
    
    const contributions = participants.map(p => 
      p.contributions.edits + p.contributions.decisions + p.contributions.discussions
    );
    
    const mean = contributions.reduce((a, b) => a + b, 0) / contributions.length;
    const variance = contributions.reduce((sum, c) => sum + Math.pow(c - mean, 2), 0) / contributions.length;
    
    return Math.min(1.0, variance / (mean + 1)); // Normalize variance
  }

  async gracefulShutdown() {
    this.status = 'ended';
    
    // Record session end
    await this.sharedState.applyOperation(this.id, {
      type: 'update',
      key: 'metadata',
      updates: {
        endedAt: Date.now(),
        finalMetrics: this.getMetrics()
      },
      agent: 'system',
      timestamp: Date.now()
    });

    // Notify all participants
    this.emit('session_ended', {
      sessionId: this.id,
      metrics: this.getMetrics(),
      timestamp: Date.now()
    });

    logger.info(`🟢 Session ${this.id} ended gracefully`);
  }

  generateContributionId() {
    return `contrib-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = {
  CollaborativeSession
};
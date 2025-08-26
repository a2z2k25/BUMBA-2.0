/**
 * BUMBA Real-Time Collaboration System - Main Entry Point
 * Comprehensive real-time collaboration with consciousness-driven ethics
 */

const { RealTimeCollaborationSystem } = require('./real-time-collaboration');
const { CollaborativeSession } = require('./collaborative-session');
const { PresenceManager } = require('./presence-manager');
const { CollaborativeDecisionEngine } = require('./collaborative-decision-engine');
const { WebSocketManager } = require('./websocket-manager');
const { SessionRecorder } = require('./session-recorder');
const { CollaborativeDebuggingSystem } = require('./collaborative-debugging');
const { CollaborationEthicsMonitor } = require('./collaboration-ethics-monitor');

class CollaborationSystemIntegration {
  constructor() {
    this.collaborationSystem = null;
    this.isInitialized = false;
  }

  async initialize(config = {}) {
    if (this.isInitialized) {
      return this.collaborationSystem;
    }

    // Create the main collaboration system
    this.collaborationSystem = new RealTimeCollaborationSystem();

    // Initialize with configuration
    await this.collaborationSystem.initializeCollaborationFramework();

    this.isInitialized = true;

    return this.collaborationSystem;
  }

  async createSession(sessionConfig) {
    if (!this.isInitialized) {
      throw new Error('Collaboration system not initialized');
    }

    return await this.collaborationSystem.createCollaborativeSession(sessionConfig);
  }

  async joinSession(sessionId, agent, capabilities) {
    if (!this.isInitialized) {
      throw new Error('Collaboration system not initialized');
    }

    return await this.collaborationSystem.joinSession(sessionId, agent, capabilities);
  }

  getSystem() {
    return this.collaborationSystem;
  }

  async shutdown() {
    if (this.collaborationSystem) {
      await this.collaborationSystem.shutdown();
    }
    this.isInitialized = false;
  }
}

// Create singleton instance
const collaborationIntegration = new CollaborationSystemIntegration();

module.exports = {
  // Main system
  RealTimeCollaborationSystem,
  CollaborationSystemIntegration,
  collaborationIntegration,

  // Core components
  CollaborativeSession,
  PresenceManager,
  CollaborativeDecisionEngine,
  WebSocketManager,
  SessionRecorder,
  CollaborativeDebuggingSystem,
  CollaborationEthicsMonitor,

  // Utility functions for easy access
  async initializeCollaboration(config = {}) {
    return await collaborationIntegration.initialize(config);
  },

  async createCollaborativeSession(sessionConfig) {
    return await collaborationIntegration.createSession(sessionConfig);
  },

  async joinCollaborativeSession(sessionId, agent, capabilities = {}) {
    return await collaborationIntegration.joinSession(sessionId, agent, capabilities);
  },

  getCollaborationSystem() {
    return collaborationIntegration.getSystem();
  },

  async shutdownCollaboration() {
    return await collaborationIntegration.shutdown();
  }
};
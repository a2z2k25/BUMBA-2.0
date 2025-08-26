/**
 * BUMBA Real-Time Coordination Hooks
 * Integrates real-time collaboration monitoring with existing coordination protocols
 */

const CollaborationMonitor = require('./collaboration-monitor');

class RealtimeCoordinationHooks {
  constructor() {
    this.monitor = new CollaborationMonitor();
    this.activeCollaborations = new Map();
  }

  /**
   * Register real-time hooks with the framework
   */
  registerHooks(hookSystem) {
    // Before coordination starts
    hookSystem.registerHandler('department:beforeCoordination', async (context) => {
      const collaborationId = `collab-${Date.now()}`;
      
      // Start monitoring the collaboration
      const collaboration = this.monitor.startCollaboration(collaborationId, {
        type: context.protocol?.type || 'parallel',
        departments: context.departments || [],
        tasks: context.tasks || []
      });
      
      // Add collaboration ID to context
      context.collaborationId = collaborationId;
      context.realtimeEnabled = true;
      
      this.activeCollaborations.set(collaborationId, collaboration);
      
      return context;
    });

    // After coordination completes
    hookSystem.registerHandler('department:afterCoordination', async (context) => {
      if (context.collaborationId) {
        this.monitor.completeCollaboration(context.collaborationId);
        this.activeCollaborations.delete(context.collaborationId);
      }
      return context;
    });

    // Team composition updates
    hookSystem.registerHandler('team:afterComposition', async (context) => {
      if (context.collaborationId) {
        context.team?.members?.forEach(member => {
          this.monitor.updateAgentStatus(
            context.collaborationId,
            member.id,
            'ready',
            { role: member.role }
          );
        });
      }
      return context;
    });

    // Agent lifecycle transitions
    hookSystem.registerHandler('lifecycle:afterTransition', async (context) => {
      // Find collaboration for this agent
      const collaboration = this.findAgentCollaboration(context.agentId);
      if (collaboration) {
        this.monitor.updateAgentStatus(
          collaboration.id,
          context.agentId,
          context.currentState,
          { previousState: context.previousState }
        );
      }
      return context;
    });

    // Task processing updates
    hookSystem.registerHandler('orchestrator:afterTaskProcessing', async (context) => {
      if (context.collaborationId && context.success) {
        this.monitor.reportTaskComplete(
          context.collaborationId,
          context.agentId || 'orchestrator',
          context.task?.id || 'unknown',
          context.result
        );
      }
      return context;
    });

    // Model selection notifications
    hookSystem.registerHandler('model:afterSelection', async (context) => {
      const collaboration = this.findAgentCollaboration(context.agentId);
      if (collaboration) {
        this.monitor.emitter.sendToChannel(collaboration.channel, {
          type: 'model:selected',
          agentId: context.agentId,
          model: context.selectedModel,
          estimatedCost: context.estimatedCost
        });
      }
      return context;
    });

    // Knowledge transfer events
    hookSystem.registerHandler('knowledge:afterTransfer', async (context) => {
      const collaboration = this.findAgentCollaboration(context.toAgent);
      if (collaboration) {
        this.monitor.emitter.sendToChannel(collaboration.channel, {
          type: 'knowledge:transferred',
          from: context.fromAgent,
          to: context.toAgent,
          itemsTransferred: context.transferredItems
        });
      }
      return context;
    });

    // API request tracking
    hookSystem.registerHandler('api:afterRequest', async (context) => {
      // Broadcast high-cost API calls
      if (context.cost > 0.01) {
        this.broadcastToAllCollaborations({
          type: 'api:expensive',
          provider: context.provider,
          cost: context.cost,
          duration: context.duration
        });
      }
      return context;
    });

    // Deprecation notifications
    hookSystem.registerHandler('deprecation:after', async (context) => {
      this.broadcastToAllCollaborations({
        type: 'agent:deprecated',
        agentId: context.agentId,
        reason: context.reason,
        knowledgeTransferred: context.knowledgeTransferred
      });
      return context;
    });
  }

  /**
   * Find which collaboration an agent belongs to
   */
  findAgentCollaboration(agentId) {
    for (const [id, collaboration] of this.activeCollaborations) {
      if (collaboration.agents.has(agentId)) {
        return collaboration;
      }
    }
    return null;
  }

  /**
   * Broadcast message to all active collaborations
   */
  broadcastToAllCollaborations(message) {
    this.activeCollaborations.forEach(collaboration => {
      this.monitor.emitter.sendToChannel(collaboration.channel, message);
    });
  }

  /**
   * Get real-time status for all collaborations
   */
  getRealtimeStatus() {
    return {
      activeCollaborations: this.monitor.getActiveCollaborations(),
      metrics: this.monitor.getMetrics(),
      emitterStatus: this.monitor.emitter.getCollaborationStatus()
    };
  }

  /**
   * Subscribe to real-time updates
   */
  subscribe(event, handler) {
    this.monitor.emitter.on(event, handler);
  }

  /**
   * Unsubscribe from updates
   */
  unsubscribe(event, handler) {
    this.monitor.emitter.off(event, handler);
  }

  /**
   * Cleanup inactive collaborations
   */
  cleanup() {
    return this.monitor.cleanup();
  }
}

// Singleton instance
let instance = null;

class RealtimeCoordinationManager {
  constructor() {
    if (!instance) {
      instance = new RealtimeCoordinationHooks();
    }
    return instance;
  }

  static getInstance() {
    if (!instance) {
      instance = new RealtimeCoordinationHooks();
    }
    return instance;
  }

  /**
   * Initialize real-time hooks with existing framework
   */
  static initialize(hookSystem) {
    const manager = RealtimeCoordinationManager.getInstance();
    manager.registerHooks(hookSystem);
    console.log('🏁 Real-time coordination hooks registered');
    return manager;
  }
}

module.exports = { 
  RealtimeCoordinationHooks,
  RealtimeCoordinationManager 
};
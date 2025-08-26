/**
 * BUMBA Team Memory System
 * Enables seamless agent coordination and context sharing
 */

const fs = require('fs');
const { logger } = require('../core/logging/bumba-logger');

const path = require('path');
const os = require('os');

class BumbaTeamMemory {
  constructor() {
    this.teamDir = path.join(os.homedir(), '.claude', 'team');
    this.contextFile = path.join(this.teamDir, 'context.json');
    this.agentHistoryFile = path.join(this.teamDir, 'agent-history.json');
    this.collaborationFile = path.join(this.teamDir, 'collaboration.json');

    // Directory will be created during initialization
    // Remove sync initialization from constructor
    // Call initializeTeamMemory() separately after construction
  }

  /**
   * Static factory method to create and initialize BumbaTeamMemory
   */
  static async create() {
    const instance = new BumbaTeamMemory();
    await instance.initializeTeamMemory();
    return instance;
  }

  /**
   * Ensure team memory directory exists
   */
  async ensureTeamDirectory() {
    try {
      await fs.promises.mkdir(this.teamDir, { recursive: true });
    } catch (error) {
      // Directory might already exist, which is fine
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
  }

  /**
   * Initialize team memory if it doesn't exist
   */
  async initializeTeamMemory() {
    // Ensure directory exists first
    await this.ensureTeamDirectory();

    try {
      await fs.promises.access(this.contextFile);
    } catch (error) {
      // File doesn't exist, create it
      const initialContext = {
        version: '1.0.0',
        initialized: new Date().toISOString(),
        currentProject: path.basename(process.cwd()),
        agents: {
          'Product-Strategist': {
            lastActive: null,
            expertise: 'strategic planning, PRDs, requirements'
          },
          'Design-Engineer': {
            lastActive: null,
            expertise: 'UI/UX design, Figma integration, components'
          },
          'Backend-Engineer': {
            lastActive: null,
            expertise: 'architecture, backend, deployment'
          }
        },
        sharedContext: {},
        activeSession: null
      };
      await this.saveContext(initialContext);
    }

    try {
      await fs.promises.access(this.agentHistoryFile);
    } catch (error) {
      // File doesn't exist, create it
      const initialHistory = {
        sessions: [],
        handoffs: [],
        collaborations: []
      };
      await this.saveAgentHistory(initialHistory);
    }

    try {
      await fs.promises.access(this.collaborationFile);
    } catch (error) {
      // File doesn't exist, create it
      const initialCollaboration = {
        currentWorkflow: null,
        pendingHandoffs: [],
        qualityCheckpoints: [],
        teamDecisions: []
      };
      await this.saveCollaboration(initialCollaboration);
    }
  }

  /**
   * Get current team context
   */
  async getTeamContext() {
    try {
      const data = await fs.promises.readFile(this.contextFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      logger.error('Error reading team context:', error);
      return null;
    }
  }

  /**
   * Save team context
   */
  async saveContext(context) {
    try {
      context.lastUpdated = new Date().toISOString();
      await fs.promises.writeFile(this.contextFile, JSON.stringify(context, null, 2));
      return true;
    } catch (error) {
      logger.error('Error saving team context:', error);
      return false;
    }
  }

  /**
   * Record agent activity
   */
  async recordAgentActivity(agentName, activity, details = {}) {
    const context = await this.getTeamContext();
    if (!context) {return false;}

    // Update agent last active
    if (context.agents[agentName]) {
      context.agents[agentName].lastActive = new Date().toISOString();
      context.agents[agentName].lastActivity = activity;
    }

    // Record in shared context
    const activityId = `${agentName}_${Date.now()}`;
    context.sharedContext[activityId] = {
      agent: agentName,
      activity: activity,
      timestamp: new Date().toISOString(),
      details: details,
      type: 'agent_activity'
    };

    return await this.saveContext(context);
  }

  /**
   * Create agent handoff
   */
  async createHandoff(fromAgent, toAgent, context, priority = 'normal') {
    const teamContext = await this.getTeamContext();
    if (!teamContext) {return false;}

    const handoff = {
      id: `handoff_${Date.now()}`,
      from: fromAgent,
      to: toAgent,
      timestamp: new Date().toISOString(),
      context: context,
      priority: priority,
      status: 'pending',
      files: this.getCurrentProjectFiles(),
      gitHash: this.getCurrentGitHash()
    };

    // Add to shared context
    teamContext.sharedContext[handoff.id] = {
      type: 'handoff',
      ...handoff
    };

    // Update collaboration file
    const collaboration = await this.getCollaboration();
    collaboration.pendingHandoffs.push(handoff);
    await this.saveCollaboration(collaboration);

    // Record in agent history
    await this.recordAgentHistory({
      type: 'handoff_created',
      from: fromAgent,
      to: toAgent,
      handoffId: handoff.id,
      timestamp: new Date().toISOString()
    });

    return (await this.saveContext(teamContext)) ? handoff.id : false;
  }

  /**
   * Accept agent handoff
   */
  async acceptHandoff(handoffId, acceptingAgent) {
    const teamContext = await this.getTeamContext();
    const collaboration = await this.getCollaboration();

    if (!teamContext || !collaboration) {return false;}

    // Find and update handoff
    const handoffIndex = collaboration.pendingHandoffs.findIndex(h => h.id === handoffId);
    if (handoffIndex === -1) {return false;}

    const handoff = collaboration.pendingHandoffs[handoffIndex];
    if (handoff.to !== acceptingAgent) {return false;}

    // Update handoff status
    handoff.status = 'accepted';
    handoff.acceptedAt = new Date().toISOString();

    // Remove from pending
    collaboration.pendingHandoffs.splice(handoffIndex, 1);

    // Update team context
    if (teamContext.sharedContext[handoffId]) {
      teamContext.sharedContext[handoffId].status = 'accepted';
      teamContext.sharedContext[handoffId].acceptedAt = new Date().toISOString();
    }

    // Record agent activity
    await this.recordAgentActivity(acceptingAgent, 'handoff_accepted', {
      handoffId: handoffId,
      fromAgent: handoff.from,
      context: handoff.context
    });

    // Record in agent history
    await this.recordAgentHistory({
      type: 'handoff_accepted',
      agent: acceptingAgent,
      handoffId: handoffId,
      fromAgent: handoff.from,
      timestamp: new Date().toISOString()
    });

    await this.saveCollaboration(collaboration);
    return await this.saveContext(teamContext);
  }

  /**
   * Get pending handoffs for agent
   */
  async getPendingHandoffs(agentName) {
    const collaboration = await this.getCollaboration();
    if (!collaboration) {return [];}

    return collaboration.pendingHandoffs.filter(h => h.to === agentName);
  }

  /**
   * Add quality checkpoint
   */
  async addQualityCheckpoint(agentName, checkpointType, results, files = []) {
    const collaboration = await this.getCollaboration();
    if (!collaboration) {return false;}

    const checkpoint = {
      id: `checkpoint_${Date.now()}`,
      agent: agentName,
      type: checkpointType,
      timestamp: new Date().toISOString(),
      results: results,
      files: files,
      gitHash: this.getCurrentGitHash()
    };

    collaboration.qualityCheckpoints.push(checkpoint);

    // Record agent activity
    await this.recordAgentActivity(agentName, 'quality_checkpoint', {
      checkpointType: checkpointType,
      checkpointId: checkpoint.id,
      results: results
    });

    return await this.saveCollaboration(collaboration);
  }

  /**
   * Record team decision
   */
  async recordTeamDecision(decision, involvedAgents, rationale) {
    const collaboration = await this.getCollaboration();
    if (!collaboration) {return false;}

    const teamDecision = {
      id: `decision_${Date.now()}`,
      decision: decision,
      involvedAgents: involvedAgents,
      rationale: rationale,
      timestamp: new Date().toISOString(),
      gitHash: this.getCurrentGitHash()
    };

    collaboration.teamDecisions.push(teamDecision);

    // Record in team context
    const teamContext = await this.getTeamContext();
    if (teamContext) {
      teamContext.sharedContext[teamDecision.id] = {
        type: 'team_decision',
        ...teamDecision
      };
      await this.saveContext(teamContext);
    }

    return await this.saveCollaboration(collaboration);
  }

  /**
   * Stream context between agents for enhanced collaboration
   */
  async streamContext(agentId, context) {
    try {
      const teamContext = await this.getTeamContext();
      const streamEntry = {
        id: `stream-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        agentId,
        context,
        timestamp: new Date().toISOString(),
        streamed: true
      };

      // Add to shared context
      if (teamContext) {
        teamContext.sharedContext[streamEntry.id] = streamEntry;
        await this.saveContext(teamContext);
      }

      // Return the streamed context with agent metadata
      return {
        ...context,
        streamId: streamEntry.id,
        sourceAgent: agentId,
        timestamp: streamEntry.timestamp
      };
    } catch (error) {
      console.warn('Context streaming failed:', error.message);
      // Return original context as fallback
      return context;
    }
  }

  /**
   * Get agent history
   */
  async getAgentHistory() {
    try {
      const data = await fs.promises.readFile(this.agentHistoryFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      logger.error('Error reading agent history:', error);
      return null;
    }
  }

  /**
   * Save agent history
   */
  async saveAgentHistory(history) {
    try {
      await fs.promises.writeFile(this.agentHistoryFile, JSON.stringify(history, null, 2));
      return true;
    } catch (error) {
      logger.error('Error saving agent history:', error);
      return false;
    }
  }

  /**
   * Record agent history event
   */
  async recordAgentHistory(event) {
    const history = await this.getAgentHistory();
    if (!history) {return false;}

    history.sessions.push(event);

    // Keep only last 100 events
    if (history.sessions.length > 100) {
      history.sessions = history.sessions.slice(-100);
    }

    return await this.saveAgentHistory(history);
  }

  /**
   * Get collaboration state
   */
  async getCollaboration() {
    try {
      const data = await fs.promises.readFile(this.collaborationFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      logger.error('Error reading collaboration:', error);
      return null;
    }
  }

  /**
   * Save collaboration state
   */
  async saveCollaboration(collaboration) {
    try {
      collaboration.lastUpdated = new Date().toISOString();
      await fs.promises.writeFile(this.collaborationFile, JSON.stringify(collaboration, null, 2));
      return true;
    } catch (error) {
      logger.error('Error saving collaboration:', error);
      return false;
    }
  }

  /**
   * Get current project files
   */
  getCurrentProjectFiles() {
    try {
      const { spawnSync } = require('child_process');
      const result = spawnSync('find', [
        '.',
        '-type', 'f',
        '(',
        '-name', '*.js',
        '-o', '-name', '*.ts',
        '-o', '-name', '*.jsx',
        '-o', '-name', '*.tsx',
        '-o', '-name', '*.py',
        '-o', '-name', '*.md',
        ')'
      ], {
        encoding: 'utf8',
        shell: false
      });

      if (result.error) {
        throw result.error;
      }

      // Use head functionality in JavaScript instead of piping to shell
      const allFiles = result.stdout.trim().split('\n').filter(Boolean);
      const files = allFiles.slice(0, 20); // Equivalent to head -20

      return files
        .filter(f => f && !f.includes('node_modules'));
    } catch (error) {
      return [];
    }
  }

  /**
   * Get current git hash
   */
  getCurrentGitHash() {
    try {
      const { spawnSync } = require('child_process');
      const result = spawnSync('git', ['rev-parse', 'HEAD'], {
        encoding: 'utf8',
        shell: false
      });

      if (result.error || result.status !== 0) {
        return null;
      }

      return result.stdout.trim();
    } catch (error) {
      return null;
    }
  }

  /**
   * Get team collaboration summary
   */
  async getTeamSummary() {
    const context = await this.getTeamContext();
    const collaboration = await this.getCollaboration();
    const history = await this.getAgentHistory();

    if (!context || !collaboration || !history) {
      return null;
    }

    return {
      project: context.currentProject,
      activeAgents: Object.entries(context.agents)
        .filter(([_, data]) => data.lastActive)
        .map(([name, data]) => ({ name, lastActive: data.lastActive })),
      pendingHandoffs: collaboration.pendingHandoffs.length,
      recentCheckpoints: collaboration.qualityCheckpoints.slice(-5),
      recentDecisions: collaboration.teamDecisions.slice(-3),
      sessionCount: history.sessions.length
    };
  }

  /**
   * Clear old data (cleanup utility)
   */
  async cleanup(daysToKeep = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const collaboration = await this.getCollaboration();
    if (collaboration) {
      // Clean old checkpoints
      collaboration.qualityCheckpoints = collaboration.qualityCheckpoints.filter(
        checkpoint => new Date(checkpoint.timestamp) > cutoffDate
      );

      // Clean old decisions
      collaboration.teamDecisions = collaboration.teamDecisions.filter(
        decision => new Date(decision.timestamp) > cutoffDate
      );

      await this.saveCollaboration(collaboration);
    }

    const history = await this.getAgentHistory();
    if (history) {
      // Clean old sessions
      history.sessions = history.sessions.filter(
        session => new Date(session.timestamp) > cutoffDate
      );

      await this.saveAgentHistory(history);
    }

    return true;
  }
}

module.exports = { BumbaTeamMemory };

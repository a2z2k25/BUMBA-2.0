/**
 * BUMBA Notion Sync Commands
 * Commands for managing Notion synchronization and viewing scores
 */

const { logger } = require('../core/logging/bumba-logger');

class NotionSyncCommands {
  constructor() {
    this.commands = new Map();
    this.registerCommands();
  }
  
  registerCommands() {
    // Score and status commands
    this.commands.set('notion:status', this.notionStatus.bind(this));
    this.commands.set('notion:score', this.showScore.bind(this));
    this.commands.set('notion:leaderboard', this.showLeaderboard.bind(this));
    
    // Sync control commands
    this.commands.set('notion:sync', this.forceSync.bind(this));
    this.commands.set('notion:checkpoint', this.triggerCheckpoint.bind(this));
    this.commands.set('notion:queue', this.showQueue.bind(this));
    
    // Configuration commands
    this.commands.set('notion:reminder-level', this.setReminderLevel.bind(this));
    this.commands.set('notion:auto-sync', this.toggleAutoSync.bind(this));
  }
  
  async notionStatus(params, context) {
    const { getInstance } = require('../core/mcp/notion-mcp-bridge');
    const bridge = getInstance();
    const status = bridge.getStatus();
    
    const { getInstance: getScores } = require('../core/persistence/notion-score-persistence');
    const scores = getScores();
    
    return {
      success: true,
      data: {
        connection: status,
        totalAgents: scores.scores.size,
        topAgent: scores.getLeaderboard()[0] || null,
        queuedOperations: bridge.getQueuedOperations().length
      },
      message: `Notion ${status.mode} mode | ${scores.scores.size} agents tracked`
    };
  }
  
  async showScore(params, context) {
    const agentId = params.agent || context.currentAgent || 'default';
    
    const { getInstance } = require('../core/persistence/notion-score-persistence');
    const scores = getInstance();
    const stats = scores.getAgentStats(agentId);
    
    return {
      success: true,
      data: stats,
      message: `${agentId}: ${stats.score} points | Rank #${stats.rank || 'N/A'} | ${stats.achievements.join(', ') || 'No achievements yet'}`
    };
  }
  
  async showLeaderboard(params, context) {
    const { getInstance } = require('../core/persistence/notion-score-persistence');
    const scores = getInstance();
    const leaderboard = scores.getLeaderboard();
    
    const top5 = leaderboard.slice(0, 5);
    
    const formatted = top5.map(entry => 
      `#${entry.rank} ${entry.agent}: ${entry.score} pts ${entry.achievements.map(a => '🟢').join('')}`
    ).join('\n');
    
    return {
      success: true,
      data: top5,
      message: `🏁 Notion Documentation Leaderboard\n${formatted}`
    };
  }
  
  async forceSync(params, context) {
    const framework = context.framework;
    
    if (!framework.notionSync) {
      return {
        success: false,
        message: 'Notion sync not initialized'
      };
    }
    
    // Trigger checkpoint sync
    framework.notionSync.emit('checkpoint:auto');
    
    return {
      success: true,
      message: '🏁 Notion sync triggered'
    };
  }
  
  async triggerCheckpoint(params, context) {
    const framework = context.framework;
    
    if (!framework.notionSync) {
      return {
        success: false,
        message: 'Notion sync not initialized'
      };
    }
    
    await framework.notionSync.performCheckpointSync();
    
    return {
      success: true,
      message: '🏁 Checkpoint sync completed'
    };
  }
  
  async showQueue(params, context) {
    const { getInstance } = require('../core/mcp/notion-mcp-bridge');
    const bridge = getInstance();
    const queued = bridge.getQueuedOperations();
    
    if (queued.length === 0) {
      return {
        success: true,
        message: 'No operations queued'
      };
    }
    
    const summary = queued.slice(0, 5).map(op => 
      `• ${op.operation} (${new Date(op.timestamp).toLocaleTimeString()})`
    ).join('\n');
    
    return {
      success: true,
      data: queued,
      message: `🟢 ${queued.length} operations queued:\n${summary}`
    };
  }
  
  async setReminderLevel(params, context) {
    const level = params.level;
    
    if (!level || level < 0 || level > 4) {
      return {
        success: false,
        message: 'Invalid level. Use 0-4 (0=off, 4=maximum)'
      };
    }
    
    // Store preference
    context.preferences = context.preferences || {};
    context.preferences.notionReminderLevel = level;
    
    const levels = ['Off', 'Minimal', 'Gentle', 'Regular', 'Maximum'];
    
    return {
      success: true,
      message: `🏁 Notion reminder level set to: ${levels[level]}`
    };
  }
  
  async toggleAutoSync(params, context) {
    const framework = context.framework;
    
    if (!framework.notionSync) {
      return {
        success: false,
        message: 'Notion sync not initialized'
      };
    }
    
    const enabled = params.enable !== false;
    
    if (enabled) {
      framework.notionSync.startAutoCheckpoints(600000);
      return {
        success: true,
        message: '🏁 Auto-sync enabled (every 10 minutes)'
      };
    } else {
      framework.notionSync.stopAutoCheckpoints();
      return {
        success: true,
        message: '⏸️ Auto-sync disabled'
      };
    }
  }
  
  getCommand(name) {
    return this.commands.get(name);
  }
  
  getAllCommands() {
    return Array.from(this.commands.keys());
  }
}

module.exports = NotionSyncCommands;
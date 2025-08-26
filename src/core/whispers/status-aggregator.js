/**
 * BUMBA Status Aggregator
 * Collects and formats agent statuses for Whispers display
 * Integrates with WorktreeCollaborationEnhancement
 */

const { EventEmitter } = require('events');
const path = require('path');

class StatusAggregator extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      updateInterval: options.updateInterval || 2000,
      maxAgents: options.maxAgents || 10,
      includeIdle: options.includeIdle !== false,
      ...options
    };
    
    // Agent status storage
    this.agentStatuses = new Map();
    
    // Department to color mapping (gradient)
    this.deptColors = {
      backend: '🟢',
      technical: '🟢',
      strategic: '🟡',
      product: '🟡',
      testing: '🟠',
      qa: '🟠',
      frontend: '🔴',
      design: '🔴'
    };
    
    // Status update interval
    this.updateTimer = null;
    
    // Collaboration system reference
    this.collaborationSystem = null;
  }
  
  /**
   * Connect to WorktreeCollaborationEnhancement
   */
  connect(collaborationSystem) {
    this.collaborationSystem = collaborationSystem;
    
    // Listen to collaboration events
    if (collaborationSystem) {
      collaborationSystem.on('agent-assigned', this.handleAgentAssigned.bind(this));
      collaborationSystem.on('agent-progress', this.handleAgentProgress.bind(this));
      collaborationSystem.on('agent-completed', this.handleAgentCompleted.bind(this));
      collaborationSystem.on('agent-error', this.handleAgentError.bind(this));
      collaborationSystem.on('workspace-cleaned', this.handleAgentRemoved.bind(this));
    }
    
    // Start periodic updates
    this.startUpdates();
  }
  
  /**
   * Handle agent assignment
   */
  handleAgentAssigned(data) {
    const { agentId, task, workspace } = data;
    
    this.agentStatuses.set(agentId, {
      id: agentId,
      task: this.truncateTask(task),
      status: 'initializing',
      progress: 0,
      workspace,
      startTime: Date.now(),
      department: this.detectDepartment(agentId),
      emoji: this.getDepartmentEmoji(agentId)
    });
    
    this.emitUpdate();
  }
  
  /**
   * Handle agent progress update
   */
  handleAgentProgress(data) {
    const { agentId, progress, message } = data;
    
    const agent = this.agentStatuses.get(agentId);
    if (agent) {
      agent.status = 'working';
      agent.progress = progress || agent.progress;
      agent.message = message ? this.truncateMessage(message) : agent.message;
      agent.lastUpdate = Date.now();
      
      this.emitUpdate();
    }
  }
  
  /**
   * Handle agent completion
   */
  handleAgentCompleted(data) {
    const { agentId, result } = data;
    
    const agent = this.agentStatuses.get(agentId);
    if (agent) {
      agent.status = 'completed';
      agent.progress = 100;
      agent.completedAt = Date.now();
      agent.duration = agent.completedAt - agent.startTime;
      
      this.emitUpdate();
      
      // Remove after a delay if configured
      if (!this.options.includeIdle) {
        setTimeout(() => this.handleAgentRemoved({ agentId }), 5000);
      }
    }
  }
  
  /**
   * Handle agent error
   */
  handleAgentError(data) {
    const { agentId, error } = data;
    
    const agent = this.agentStatuses.get(agentId);
    if (agent) {
      agent.status = 'error';
      agent.error = error.message || 'Unknown error';
      
      this.emitUpdate();
    }
  }
  
  /**
   * Handle agent removal
   */
  handleAgentRemoved(data) {
    const { agentId } = data;
    this.agentStatuses.delete(agentId);
    this.emitUpdate();
  }
  
  /**
   * Start periodic status updates
   */
  startUpdates() {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
    }
    
    this.updateTimer = setInterval(() => {
      this.pollStatuses();
    }, this.options.updateInterval);
    
    // Initial poll
    this.pollStatuses();
  }
  
  /**
   * Poll current statuses from collaboration system
   */
  async pollStatuses() {
    if (!this.collaborationSystem) return;
    
    try {
      // Get current status from collaboration system
      const systemStatus = this.collaborationSystem.getStatus();
      
      if (systemStatus && systemStatus.agentModes) {
        // Update agent statuses based on system status
        systemStatus.agentModes.forEach(agentInfo => {
          const existing = this.agentStatuses.get(agentInfo.agentId);
          
          if (!existing) {
            // New agent discovered
            this.agentStatuses.set(agentInfo.agentId, {
              id: agentInfo.agentId,
              status: 'active',
              progress: 50, // Default progress
              department: this.detectDepartment(agentInfo.agentId),
              emoji: this.getDepartmentEmoji(agentInfo.agentId),
              workspace: agentInfo.workspace,
              uptime: agentInfo.uptime
            });
          }
        });
      }
      
      this.emitUpdate();
      
    } catch (error) {
      // Silently handle polling errors
    }
  }
  
  /**
   * Stop updates
   */
  stopUpdates() {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }
  }
  
  /**
   * Get formatted status for display
   */
  getFormattedStatus(format = 'compact') {
    const activeAgents = Array.from(this.agentStatuses.values())
      .filter(a => a.status !== 'completed' || this.options.includeIdle)
      .slice(0, this.options.maxAgents);
    
    if (activeAgents.length === 0) {
      return { text: '', agents: [] };
    }
    
    switch (format) {
      case 'compact':
        return this.formatCompact(activeAgents);
      case 'verbose':
        return this.formatVerbose(activeAgents);
      case 'emoji':
        return this.formatEmoji(activeAgents);
      default:
        return this.formatCompact(activeAgents);
    }
  }
  
  /**
   * Format compact status
   */
  formatCompact(agents) {
    const parts = agents.map(agent => {
      const abbr = this.getAgentAbbreviation(agent.id);
      const progress = agent.progress ? `${agent.progress}%` : '...';
      return `[${abbr}:${progress}]`;
    });
    
    return {
      text: parts.join(' '),
      agents
    };
  }
  
  /**
   * Format verbose status
   */
  formatVerbose(agents) {
    const parts = agents.map(agent => {
      const name = this.getAgentName(agent.id);
      const status = this.getStatusText(agent);
      return `[${name}: ${status}]`;
    });
    
    return {
      text: parts.join(' '),
      agents
    };
  }
  
  /**
   * Format emoji status
   */
  formatEmoji(agents) {
    const parts = agents.map(agent => {
      const emoji = agent.emoji || '🏁';
      const progress = agent.progress ? `${agent.progress}%` : '···';
      return `[${emoji} ${progress}]`;
    });
    
    return {
      text: parts.join(' '),
      agents
    };
  }
  
  /**
   * Emit status update
   */
  emitUpdate() {
    const status = this.getFormattedStatus(this.options.format);
    
    this.emit('status-update', {
      formatted: status.text,
      agents: status.agents,
      count: this.agentStatuses.size,
      timestamp: Date.now()
    });
  }
  
  /**
   * Helper methods
   */
  
  detectDepartment(agentId) {
    const id = agentId.toLowerCase();
    if (id.includes('backend') || id.includes('api')) return 'backend';
    if (id.includes('frontend') || id.includes('ui')) return 'frontend';
    if (id.includes('test') || id.includes('qa')) return 'testing';
    if (id.includes('product') || id.includes('strategic')) return 'strategic';
    return 'backend'; // default
  }
  
  getDepartmentEmoji(agentId) {
    const dept = this.detectDepartment(agentId);
    return this.deptColors[dept] || '🏁';
  }
  
  getAgentAbbreviation(agentId) {
    // Create short abbreviation from agent ID
    const parts = agentId.split('-');
    if (parts.length >= 2) {
      return parts[0][0].toUpperCase() + parts[1][0].toUpperCase();
    }
    return agentId.substring(0, 2).toUpperCase();
  }
  
  getAgentName(agentId) {
    // Create readable name from agent ID
    return agentId.split('-').map(p => 
      p.charAt(0).toUpperCase() + p.slice(1)
    ).join(' ');
  }
  
  getStatusText(agent) {
    switch (agent.status) {
      case 'initializing': return 'starting...';
      case 'working': return agent.message || `${agent.progress}%`;
      case 'completed': return '🏁 done';
      case 'error': return '🔴 error';
      default: return 'idle';
    }
  }
  
  truncateTask(task) {
    return task && task.length > 30 ? 
      task.substring(0, 27) + '...' : task;
  }
  
  truncateMessage(message) {
    return message && message.length > 20 ? 
      message.substring(0, 17) + '...' : message;
  }
  
  /**
   * Get summary statistics
   */
  getSummary() {
    const agents = Array.from(this.agentStatuses.values());
    
    return {
      total: agents.length,
      active: agents.filter(a => a.status === 'working').length,
      completed: agents.filter(a => a.status === 'completed').length,
      errors: agents.filter(a => a.status === 'error').length,
      averageProgress: agents.reduce((sum, a) => sum + (a.progress || 0), 0) / agents.length || 0
    };
  }
}

module.exports = StatusAggregator;
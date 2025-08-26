/**
 * BUMBA Collaboration Status Dashboard
 * Real-time visualization of ongoing collaborations and agent activities
 */

const { RealtimeCoordinationManager } = require('./realtime-coordination-hooks');

class CollaborationStatusDashboard {
  constructor() {
    this.realtimeManager = RealtimeCoordinationManager.getInstance();
    this.refreshInterval = 1000; // 1 second
    this.isRunning = false;
    this.displayMode = 'compact'; // compact, detailed, json
  }

  /**
   * Start the dashboard
   */
  start() {
    if (this.isRunning) {return;}
    
    this.isRunning = true;
    console.log('\n🟢 BUMBA Collaboration Dashboard Started\n');
    
    // Subscribe to real-time events
    this.subscribeToEvents();
    
    // Start refresh loop
    this.refreshLoop();
  }

  /**
   * Stop the dashboard
   */
  stop() {
    this.isRunning = false;
    console.log('\n🔴 Dashboard stopped\n');
  }

  /**
   * Subscribe to real-time collaboration events
   */
  subscribeToEvents() {
    // Status updates
    this.realtimeManager.subscribe('status:update', (data) => {
      if (this.displayMode === 'detailed') {
        console.log(`🟢 [${data.agentId}] Status: ${data.status}`);
      }
    });

    // Collaboration status
    this.realtimeManager.subscribe('collaboration:status', (data) => {
      if (data.event === 'completed') {
        console.log(`🏁 Collaboration ${data.id} completed (${data.duration}ms)`);
      }
    });

    // Channel messages
    this.realtimeManager.subscribe('channel:joined', (data) => {
      if (this.displayMode === 'detailed') {
        console.log(`🟢 ${data.agentId} joined ${data.channelName}`);
      }
    });
  }

  /**
   * Main refresh loop
   */
  async refreshLoop() {
    while (this.isRunning) {
      this.render();
      await this.sleep(this.refreshInterval);
    }
  }

  /**
   * Render the dashboard
   */
  render() {
    const status = this.realtimeManager.getRealtimeStatus();
    
    switch (this.displayMode) {
      case 'compact':
        this.renderCompact(status);
        break;
      case 'detailed':
        this.renderDetailed(status);
        break;
      case 'json':
        this.renderJSON(status);
        break;
    }
  }

  /**
   * Render compact view
   */
  renderCompact(status) {
    console.clear();
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║         BUMBA Collaboration Status Dashboard              ║');
    console.log('╠══════════════════════════════════════════════════════════╣');
    
    // Metrics
    const metrics = status.metrics;
    console.log(`║ Total: ${metrics.totalCollaborations} | Active: ${metrics.activeCollaborations} | Completed: ${metrics.completedCollaborations}`);
    console.log(`║ Avg Duration: ${this.formatDuration(metrics.averageDuration)}`);
    console.log('╠══════════════════════════════════════════════════════════╣');
    
    // Active Collaborations
    if (status.activeCollaborations.length > 0) {
      console.log('║ Active Collaborations:');
      status.activeCollaborations.forEach(collab => {
        const progress = this.renderProgressBar(collab.progress);
        console.log(`║  ${collab.id.substring(0, 20)}... ${progress} ${collab.progress}%`);
        console.log(`║    Type: ${collab.type} | Agents: ${collab.agents} | Time: ${this.formatDuration(collab.duration)}`);
      });
    } else {
      console.log('║ No active collaborations');
    }
    
    console.log('╠══════════════════════════════════════════════════════════╣');
    
    // Real-time status
    const emitterStatus = status.emitterStatus;
    console.log(`║ Active Agents: ${emitterStatus.activeAgents.length}`);
    if (emitterStatus.activeAgents.length > 0) {
      emitterStatus.activeAgents.forEach(agent => {
        console.log(`║  • ${agent.id}: ${agent.status}`);
      });
    }
    
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log('\nPress Ctrl+C to stop dashboard | Mode: ' + this.displayMode);
  }

  /**
   * Render detailed view
   */
  renderDetailed(status) {
    console.log('\n=== BUMBA Collaboration Status (Detailed) ===\n');
    
    // Metrics section
    console.log('🟢 Metrics:');
    console.log(JSON.stringify(status.metrics, null, 2));
    
    // Active collaborations
    console.log('\n🟢 Active Collaborations:');
    status.activeCollaborations.forEach(collab => {
      console.log(`\n  Collaboration: ${collab.id}`);
      console.log(`  Type: ${collab.type}`);
      console.log(`  Progress: ${collab.progress}%`);
      console.log(`  Agents: ${collab.agents}`);
      console.log(`  Duration: ${this.formatDuration(collab.duration)}`);
    });
    
    // Agent status
    console.log('\n🟢 Active Agents:');
    status.emitterStatus.activeAgents.forEach(agent => {
      console.log(`  ${agent.id}:`);
      console.log(`    Status: ${agent.status}`);
      console.log(`    Last Activity: ${new Date(agent.lastActivity).toLocaleTimeString()}`);
    });
    
    // Channels
    console.log('\n🟢 Active Channels:');
    status.emitterStatus.activeChannels.forEach(channel => {
      console.log(`  ${channel.name}: ${channel.subscribers} subscribers`);
    });
    
    console.log('\n' + '='.repeat(50));
  }

  /**
   * Render JSON view
   */
  renderJSON(status) {
    console.log(JSON.stringify(status, null, 2));
  }

  /**
   * Render a progress bar
   */
  renderProgressBar(progress) {
    const width = 20;
    const filled = Math.round((progress / 100) * width);
    const empty = width - filled;
    return '[' + '█'.repeat(filled) + '░'.repeat(empty) + ']';
  }

  /**
   * Format duration in human-readable format
   */
  formatDuration(ms) {
    if (ms < 1000) {return `${ms}ms`;}
    if (ms < 60000) {return `${Math.round(ms / 1000)}s`;}
    if (ms < 3600000) {return `${Math.round(ms / 60000)}m`;}
    return `${Math.round(ms / 3600000)}h`;
  }

  /**
   * Sleep helper
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Change display mode
   */
  setDisplayMode(mode) {
    if (['compact', 'detailed', 'json'].includes(mode)) {
      this.displayMode = mode;
      console.log(`Display mode changed to: ${mode}`);
    }
  }

  /**
   * Get current statistics
   */
  getStatistics() {
    const status = this.realtimeManager.getRealtimeStatus();
    return {
      totalCollaborations: status.metrics.totalCollaborations,
      activeCollaborations: status.metrics.activeCollaborations,
      completedCollaborations: status.metrics.completedCollaborations,
      averageDuration: status.metrics.averageDuration,
      activeAgents: status.emitterStatus.activeAgents.length,
      activeChannels: status.emitterStatus.activeChannels.length
    };
  }

  /**
   * Export status to file
   */
  exportStatus(filepath = './collaboration-status.json') {
    const fs = require('fs');
    const status = this.realtimeManager.getRealtimeStatus();
    const exportData = {
      timestamp: new Date().toISOString(),
      ...status
    };
    
    fs.writeFileSync(filepath, JSON.stringify(exportData, null, 2));
    console.log(`Status exported to ${filepath}`);
    return filepath;
  }
}

// CLI interface
if (require.main === module) {
  const dashboard = new CollaborationStatusDashboard();
  
  // Handle command line arguments
  const args = process.argv.slice(2);
  if (args.includes('--detailed')) {
    dashboard.setDisplayMode('detailed');
  } else if (args.includes('--json')) {
    dashboard.setDisplayMode('json');
  }
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    dashboard.stop();
    process.exit(0);
  });
  
  // Start dashboard
  dashboard.start();
}

module.exports = CollaborationStatusDashboard;
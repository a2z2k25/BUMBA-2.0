#!/usr/bin/env node

/**
 * BUMBA Real-time Agent Activity Demo
 * Shows agents working simultaneously with live updates
 */

const chalk = require('chalk');
const blessed = require('blessed');

class RealtimeAgentDemo {
  constructor() {
    this.screen = null;
    this.agents = new Map();
    this.activities = [];
    this.startTime = Date.now();
  }

  async start() {
    this.setupScreen();
    this.setupAgents();
    this.startSimulation();
  }

  setupScreen() {
    // Create blessed screen
    this.screen = blessed.screen({
      smartCSR: true,
      title: 'BUMBA Multi-Agent System - Live Demo'
    });

    // Header
    this.header = blessed.box({
      top: 0,
      left: 0,
      width: '100%',
      height: 3,
      content: '{center}🤖 BUMBA Multi-Agent System - Real-time Collaboration Demo{/center}',
      tags: true,
      style: {
        fg: 'cyan',
        bold: true
      }
    });

    // Agent status grid
    this.agentGrid = blessed.box({
      label: ' Active Agents ',
      top: 3,
      left: 0,
      width: '50%',
      height: '40%',
      border: {
        type: 'line'
      },
      style: {
        border: {
          fg: 'yellow'
        }
      },
      scrollable: true,
      alwaysScroll: true,
      mouse: true
    });

    // Activity log
    this.activityLog = blessed.log({
      label: ' Live Activity Stream ',
      top: 3,
      left: '50%',
      width: '50%',
      height: '40%',
      border: {
        type: 'line'
      },
      style: {
        border: {
          fg: 'green'
        }
      },
      scrollable: true,
      alwaysScroll: true,
      mouse: true
    });

    // Collaboration view
    this.collabView = blessed.box({
      label: ' Cross-Department Collaboration ',
      top: '45%',
      left: 0,
      width: '100%',
      height: '30%',
      border: {
        type: 'line'
      },
      style: {
        border: {
          fg: 'magenta'
        }
      },
      scrollable: true
    });

    // Stats panel
    this.statsPanel = blessed.box({
      label: ' Performance Metrics ',
      top: '75%',
      left: 0,
      width: '100%',
      height: '25%',
      border: {
        type: 'line'
      },
      style: {
        border: {
          fg: 'blue'
        }
      }
    });

    // Add all components to screen
    this.screen.append(this.header);
    this.screen.append(this.agentGrid);
    this.screen.append(this.activityLog);
    this.screen.append(this.collabView);
    this.screen.append(this.statsPanel);

    // Exit on q, escape, or Control-C
    this.screen.key(['escape', 'q', 'C-c'], () => {
      return process.exit(0);
    });

    this.screen.render();
  }

  setupAgents() {
    const agentDefinitions = [
      // Product Department
      { id: 'pm-1', name: 'Product Manager', dept: 'Product', color: 'yellow', icon: '🟡' },
      { id: 'ba-1', name: 'Business Analyst', dept: 'Product', color: 'yellow', icon: '🟡' },
      { id: 'ra-1', name: 'Requirements Analyst', dept: 'Product', color: 'yellow', icon: '🟡' },
      
      // Design Department
      { id: 'ui-1', name: 'UI Designer', dept: 'Design', color: 'red', icon: '🔴' },
      { id: 'ux-1', name: 'UX Researcher', dept: 'Design', color: 'red', icon: '🔴' },
      { id: 'vd-1', name: 'Visual Designer', dept: 'Design', color: 'red', icon: '🔴' },
      
      // Backend Department
      { id: 'be-1', name: 'Backend Engineer', dept: 'Backend', color: 'green', icon: '🟢' },
      { id: 'db-1', name: 'Database Architect', dept: 'Backend', color: 'green', icon: '🟢' },
      { id: 'api-1', name: 'API Specialist', dept: 'Backend', color: 'green', icon: '🟢' },
      
      // QA Department
      { id: 'te-1', name: 'Test Engineer', dept: 'QA', color: 'yellow', icon: '🟠' },
      { id: 'ss-1', name: 'Security Specialist', dept: 'QA', color: 'yellow', icon: '🟠' },
      { id: 'pa-1', name: 'Performance Analyst', dept: 'QA', color: 'yellow', icon: '🟠' }
    ];

    agentDefinitions.forEach(def => {
      this.agents.set(def.id, {
        ...def,
        status: 'idle',
        currentTask: null,
        tasksCompleted: 0,
        activeConnections: []
      });
    });

    this.updateAgentDisplay();
  }

  startSimulation() {
    // Start various agent activities
    this.simulateAgentWork();
    this.simulateCollaboration();
    this.updateStats();
    
    // Refresh display
    setInterval(() => {
      this.screen.render();
    }, 100);
  }

  simulateAgentWork() {
    const tasks = [
      'Analyzing requirements',
      'Creating wireframes',
      'Writing API specs',
      'Designing database schema',
      'Implementing endpoints',
      'Writing tests',
      'Reviewing code',
      'Optimizing queries',
      'Creating documentation',
      'Validating security',
      'Building UI components',
      'Setting up CI/CD'
    ];

    // Randomly assign tasks to agents
    setInterval(() => {
      const agentIds = Array.from(this.agents.keys());
      const randomAgent = agentIds[Math.floor(Math.random() * agentIds.length)];
      const agent = this.agents.get(randomAgent);
      
      if (agent.status === 'idle' && Math.random() > 0.3) {
        const task = tasks[Math.floor(Math.random() * tasks.length)];
        this.startAgentTask(randomAgent, task);
      }
    }, 500);
  }

  startAgentTask(agentId, task) {
    const agent = this.agents.get(agentId);
    agent.status = 'working';
    agent.currentTask = task;
    
    // Log activity
    this.logActivity(`${agent.icon} ${agent.name} started: ${task}`, agent.color);
    
    // Update display
    this.updateAgentDisplay();
    
    // Complete task after random time
    const duration = 2000 + Math.random() * 3000;
    setTimeout(() => {
      this.completeAgentTask(agentId);
    }, duration);
  }

  completeAgentTask(agentId) {
    const agent = this.agents.get(agentId);
    agent.status = 'idle';
    agent.tasksCompleted++;
    
    // Log completion
    this.logActivity(`✓ ${agent.name} completed: ${agent.currentTask}`, 'green');
    
    agent.currentTask = null;
    this.updateAgentDisplay();
  }

  simulateCollaboration() {
    const collaborations = [
      { agents: ['pm-1', 'ui-1'], topic: 'User flow design review' },
      { agents: ['be-1', 'db-1'], topic: 'Database optimization' },
      { agents: ['ui-1', 'be-1'], topic: 'API contract discussion' },
      { agents: ['te-1', 'ss-1'], topic: 'Security test planning' },
      { agents: ['pm-1', 'ba-1', 'ra-1'], topic: 'Requirements refinement' },
      { agents: ['ui-1', 'ux-1', 'vd-1'], topic: 'Design system sync' },
      { agents: ['be-1', 'api-1', 'db-1'], topic: 'Architecture review' },
      { agents: ['te-1', 'pa-1'], topic: 'Performance testing' }
    ];

    setInterval(() => {
      if (Math.random() > 0.7) {
        const collab = collaborations[Math.floor(Math.random() * collaborations.length)];
        this.startCollaboration(collab);
      }
    }, 3000);
  }

  startCollaboration(collab) {
    const agents = collab.agents.map(id => this.agents.get(id));
    const depts = [...new Set(agents.map(a => a.dept))];
    
    let collabText = `🤝 Collaboration: ${collab.topic}\n`;
    collabText += `   Agents: ${agents.map(a => `${a.icon} ${a.name}`).join(', ')}\n`;
    
    if (depts.length > 1) {
      collabText += `   Cross-department: ${depts.join(' ↔ ')}\n`;
    }
    
    this.addCollaboration(collabText);
    
    // Update agent connections
    collab.agents.forEach(id => {
      const agent = this.agents.get(id);
      agent.activeConnections = collab.agents.filter(a => a !== id);
    });
    
    // Clear connections after duration
    setTimeout(() => {
      collab.agents.forEach(id => {
        this.agents.get(id).activeConnections = [];
      });
      this.updateAgentDisplay();
    }, 2000);
    
    this.updateAgentDisplay();
  }

  updateAgentDisplay() {
    let display = '';
    const depts = {};
    
    // Group agents by department
    this.agents.forEach(agent => {
      if (!depts[agent.dept]) {
        depts[agent.dept] = [];
      }
      depts[agent.dept].push(agent);
    });
    
    // Display each department
    Object.entries(depts).forEach(([dept, agents]) => {
      display += chalk.bold(`\n${agents[0].icon} ${dept} Department\n`);
      display += '─'.repeat(40) + '\n';
      
      agents.forEach(agent => {
        const status = agent.status === 'working' 
          ? chalk.green('● Working') 
          : chalk.gray('○ Idle');
        
        display += `  ${agent.name.padEnd(20)} ${status}`;
        
        if (agent.currentTask) {
          display += chalk.cyan(` → ${agent.currentTask}`);
        }
        
        if (agent.activeConnections.length > 0) {
          display += chalk.magenta(' [Collaborating]');
        }
        
        display += chalk.gray(` (${agent.tasksCompleted} tasks)`);
        display += '\n';
      });
    });
    
    this.agentGrid.setContent(display);
  }

  logActivity(message, color = 'white') {
    const timestamp = new Date().toLocaleTimeString();
    const formattedMessage = `[${timestamp}] ${message}`;
    this.activityLog.log(chalk[color](formattedMessage));
  }

  addCollaboration(text) {
    const current = this.collabView.getContent();
    const lines = current.split('\n').slice(-10); // Keep last 10 collaborations
    lines.push(text);
    this.collabView.setContent(lines.join('\n'));
  }

  updateStats() {
    setInterval(() => {
      const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
      const totalTasks = Array.from(this.agents.values()).reduce((sum, a) => sum + a.tasksCompleted, 0);
      const activeAgents = Array.from(this.agents.values()).filter(a => a.status === 'working').length;
      const idleAgents = this.agents.size - activeAgents;
      
      let stats = chalk.cyan('\n  Real-time Metrics:\n');
      stats += '  ' + '─'.repeat(50) + '\n';
      stats += `  ${chalk.white('Elapsed Time:')} ${elapsed}s\n`;
      stats += `  ${chalk.white('Total Agents:')} ${this.agents.size}\n`;
      stats += `  ${chalk.green('Active Agents:')} ${activeAgents}\n`;
      stats += `  ${chalk.gray('Idle Agents:')} ${idleAgents}\n`;
      stats += `  ${chalk.yellow('Tasks Completed:')} ${totalTasks}\n`;
      stats += `  ${chalk.magenta('Tasks/Second:')} ${(totalTasks / elapsed).toFixed(2)}\n`;
      stats += `  ${chalk.blue('Efficiency:')} ${((activeAgents / this.agents.size) * 100).toFixed(1)}%\n`;
      stats += '\n  ' + chalk.gray('Press Q or ESC to exit');
      
      this.statsPanel.setContent(stats);
    }, 1000);
  }
}

// Simple demo without blessed (for environments without terminal UI support)
class SimpleAgentDemo {
  async run() {
    console.log(chalk.cyan.bold('\n🤖 BUMBA Multi-Agent Demo - Simple Mode\n'));
    console.log(chalk.white('Simulating parallel agent execution...\n'));

    const agents = [
      { name: 'Product Manager', task: 'Writing PRD', time: 2000 },
      { name: 'UI Designer', task: 'Creating mockups', time: 2500 },
      { name: 'Backend Engineer', task: 'Building API', time: 3000 },
      { name: 'Test Engineer', task: 'Writing tests', time: 1500 }
    ];

    console.log(chalk.yellow('Starting agents...\n'));

    const promises = agents.map(agent => 
      new Promise(resolve => {
        console.log(chalk.green(`▶ ${agent.name} started: ${agent.task}`));
        setTimeout(() => {
          console.log(chalk.blue(`✓ ${agent.name} completed: ${agent.task}`));
          resolve();
        }, agent.time);
      })
    );

    await Promise.all(promises);
    
    console.log(chalk.green.bold('\n✅ All agents completed their tasks!'));
    console.log(chalk.yellow('\nThis demo shows how BUMBA agents work in parallel.'));
    console.log(chalk.gray('No API keys required!\n'));
  }
}

// Main entry point
if (require.main === module) {
  // Check if blessed is available
  try {
    require('blessed');
    const demo = new RealtimeAgentDemo();
    demo.start();
  } catch (err) {
    // Fallback to simple demo
    const demo = new SimpleAgentDemo();
    demo.run();
  }
}

module.exports = { RealtimeAgentDemo, SimpleAgentDemo };
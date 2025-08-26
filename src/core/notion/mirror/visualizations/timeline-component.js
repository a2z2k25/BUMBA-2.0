/**
 * Timeline Component for Notion Mirror
 * 
 * Generates timeline visualizations for tasks, sprints, and dependencies
 * that can be embedded in Notion pages.
 */

const { createCanvas } = require('canvas');
const TaskSchema = require('../schemas/task-schema');

class TimelineComponent {
  constructor(options = {}) {
    this.width = options.width || 1200;
    this.height = options.height || 400;
    this.padding = options.padding || { top: 40, right: 20, bottom: 40, left: 150 };
    this.colors = {
      'Engineering': '#80B1D3',
      'Design': '#FB8072',
      'Strategy': '#FDB462',
      'QA': '#BEBADA',
      'DevOps': '#FFFFB3',
      'blocked': '#FF4444',
      'in_progress': '#FFD700',
      'complete': '#90EE90',
      'todo': '#87CEEB',
      'backlog': '#D3D3D3'
    };
  }

  /**
   * Generate sprint timeline visualization
   */
  generateSprintTimeline(sprints, tasks) {
    const canvas = createCanvas(this.width, this.height);
    const ctx = canvas.getContext('2d');
    
    // Background
    ctx.fillStyle = '#1e1e1e';
    ctx.fillRect(0, 0, this.width, this.height);
    
    // Calculate time bounds
    const timeBounds = this.calculateTimeBounds(sprints, tasks);
    const timeScale = this.createTimeScale(timeBounds);
    
    // Draw timeline grid
    this.drawTimeGrid(ctx, timeScale, timeBounds);
    
    // Draw sprint blocks
    this.drawSprintBlocks(ctx, sprints, timeScale);
    
    // Draw task bars
    this.drawTaskBars(ctx, tasks, timeScale);
    
    // Draw dependencies
    this.drawDependencies(ctx, tasks, timeScale);
    
    // Draw legend
    this.drawLegend(ctx);
    
    // Return as data URL for Notion embedding
    return {
      type: 'timeline',
      dataURL: canvas.toDataURL(),
      width: this.width,
      height: this.height,
      metadata: {
        sprintCount: sprints.length,
        taskCount: tasks.length,
        timeRange: timeBounds
      }
    };
  }

  /**
   * Generate critical path visualization
   */
  generateCriticalPath(tasks) {
    const canvas = createCanvas(this.width, this.height);
    const ctx = canvas.getContext('2d');
    
    // Background
    ctx.fillStyle = '#1e1e1e';
    ctx.fillRect(0, 0, this.width, this.height);
    
    // Calculate critical path
    const criticalPath = this.calculateCriticalPath(tasks);
    
    // Time bounds from critical path
    const timeBounds = {
      start: new Date(Math.min(...criticalPath.map(t => new Date(t.startDate || Date.now())))),
      end: new Date(Math.max(...criticalPath.map(t => new Date(t.endDate || Date.now()))))
    };
    const timeScale = this.createTimeScale(timeBounds);
    
    // Draw grid
    this.drawTimeGrid(ctx, timeScale, timeBounds);
    
    // Draw all tasks (faded)
    ctx.globalAlpha = 0.3;
    this.drawTaskBars(ctx, tasks, timeScale);
    
    // Highlight critical path
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#FF6B6B';
    ctx.lineWidth = 3;
    this.drawTaskBars(ctx, criticalPath, timeScale, true);
    
    // Draw critical dependencies
    this.drawCriticalDependencies(ctx, criticalPath, timeScale);
    
    // Add critical path indicator
    this.drawCriticalPathIndicator(ctx, criticalPath);
    
    return {
      type: 'critical-path',
      dataURL: canvas.toDataURL(),
      width: this.width,
      height: this.height,
      metadata: {
        criticalTaskCount: criticalPath.length,
        totalDuration: this.calculateTotalDuration(criticalPath),
        bottlenecks: this.identifyBottlenecks(criticalPath)
      }
    };
  }

  /**
   * Generate agent allocation timeline
   */
  generateAgentAllocation(tasks, agents) {
    const canvas = createCanvas(this.width, this.height);
    const ctx = canvas.getContext('2d');
    
    // Background
    ctx.fillStyle = '#1e1e1e';
    ctx.fillRect(0, 0, this.width, this.height);
    
    // Group tasks by agent
    const agentTasks = this.groupTasksByAgent(tasks);
    
    // Calculate time bounds
    const timeBounds = this.calculateTimeBounds([], tasks);
    const timeScale = this.createTimeScale(timeBounds);
    
    // Draw grid
    this.drawTimeGrid(ctx, timeScale, timeBounds);
    
    // Draw swim lanes for each agent
    const laneHeight = (this.height - this.padding.top - this.padding.bottom) / agents.length;
    
    agents.forEach((agent, index) => {
      const y = this.padding.top + (index * laneHeight);
      
      // Draw lane separator
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(this.padding.left, y);
      ctx.lineTo(this.width - this.padding.right, y);
      ctx.stroke();
      
      // Draw agent label
      ctx.fillStyle = '#fff';
      ctx.font = '12px monospace';
      ctx.fillText(agent, 10, y + laneHeight / 2);
      
      // Draw agent's tasks
      const tasks = agentTasks[agent] || [];
      tasks.forEach(task => {
        this.drawAgentTask(ctx, task, timeScale, y, laneHeight);
      });
    });
    
    // Draw capacity indicators
    this.drawCapacityIndicators(ctx, agents, agentTasks, timeScale);
    
    return {
      type: 'agent-allocation',
      dataURL: canvas.toDataURL(),
      width: this.width,
      height: this.height,
      metadata: {
        agentCount: agents.length,
        totalTasks: tasks.length,
        utilization: this.calculateUtilization(agentTasks)
      }
    };
  }

  /**
   * Helper: Calculate time bounds
   */
  calculateTimeBounds(sprints, tasks) {
    const dates = [];
    
    sprints.forEach(sprint => {
      if (sprint.startDate) dates.push(new Date(sprint.startDate));
      if (sprint.endDate) dates.push(new Date(sprint.endDate));
    });
    
    tasks.forEach(task => {
      if (task.createdAt) dates.push(new Date(task.createdAt));
      if (task.dueDate) dates.push(new Date(task.dueDate));
      if (task.completedAt) dates.push(new Date(task.completedAt));
    });
    
    if (dates.length === 0) {
      const now = new Date();
      return {
        start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        end: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      };
    }
    
    return {
      start: new Date(Math.min(...dates)),
      end: new Date(Math.max(...dates))
    };
  }

  /**
   * Helper: Create time scale
   */
  createTimeScale(bounds) {
    const pixelWidth = this.width - this.padding.left - this.padding.right;
    const timeRange = bounds.end - bounds.start;
    
    return {
      toPixel: (date) => {
        const offset = new Date(date) - bounds.start;
        return this.padding.left + (offset / timeRange) * pixelWidth;
      },
      fromPixel: (x) => {
        const offset = ((x - this.padding.left) / pixelWidth) * timeRange;
        return new Date(bounds.start.getTime() + offset);
      },
      bounds: bounds
    };
  }

  /**
   * Helper: Draw time grid
   */
  drawTimeGrid(ctx, timeScale, bounds) {
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#666';
    ctx.font = '10px monospace';
    
    // Calculate grid intervals
    const dayMs = 24 * 60 * 60 * 1000;
    const totalDays = (bounds.end - bounds.start) / dayMs;
    const interval = totalDays > 30 ? 7 : 1; // Weekly or daily
    
    for (let d = new Date(bounds.start); d <= bounds.end; d.setDate(d.getDate() + interval)) {
      const x = timeScale.toPixel(d);
      
      // Grid line
      ctx.beginPath();
      ctx.moveTo(x, this.padding.top);
      ctx.lineTo(x, this.height - this.padding.bottom);
      ctx.stroke();
      
      // Date label
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      ctx.fillText(label, x - 20, this.height - 10);
    }
  }

  /**
   * Helper: Draw sprint blocks
   */
  drawSprintBlocks(ctx, sprints, timeScale) {
    const sprintHeight = 30;
    const y = this.padding.top;
    
    sprints.forEach((sprint, index) => {
      if (!sprint.startDate || !sprint.endDate) return;
      
      const x1 = timeScale.toPixel(sprint.startDate);
      const x2 = timeScale.toPixel(sprint.endDate);
      const width = x2 - x1;
      
      // Sprint block
      ctx.fillStyle = this.getSprintColor(sprint.status);
      ctx.globalAlpha = 0.3;
      ctx.fillRect(x1, y, width, sprintHeight);
      
      // Sprint border
      ctx.globalAlpha = 1;
      ctx.strokeStyle = this.getSprintColor(sprint.status);
      ctx.lineWidth = 2;
      ctx.strokeRect(x1, y, width, sprintHeight);
      
      // Sprint label
      ctx.fillStyle = '#fff';
      ctx.font = '12px monospace';
      ctx.fillText(sprint.name, x1 + 5, y + 20);
    });
  }

  /**
   * Helper: Draw task bars
   */
  drawTaskBars(ctx, tasks, timeScale, highlight = false) {
    const taskHeight = 20;
    const baseY = this.padding.top + 50;
    
    tasks.forEach((task, index) => {
      const y = baseY + (index * 25);
      
      // Calculate task timeline
      const startDate = task.startedAt || task.createdAt;
      const endDate = task.completedAt || task.dueDate || new Date();
      
      if (!startDate) return;
      
      const x1 = timeScale.toPixel(startDate);
      const x2 = timeScale.toPixel(endDate);
      const width = Math.max(x2 - x1, 5);
      
      // Task bar
      ctx.fillStyle = this.colors[task.status] || '#666';
      ctx.fillRect(x1, y, width, taskHeight);
      
      if (highlight) {
        ctx.strokeStyle = '#FF6B6B';
        ctx.lineWidth = 2;
        ctx.strokeRect(x1, y, width, taskHeight);
      }
      
      // Progress indicator
      if (task.progress > 0) {
        ctx.fillStyle = '#4CAF50';
        ctx.globalAlpha = 0.6;
        ctx.fillRect(x1, y, width * (task.progress / 100), taskHeight);
        ctx.globalAlpha = 1;
      }
      
      // Task label
      ctx.fillStyle = '#fff';
      ctx.font = '10px monospace';
      const label = task.title.length > 20 ? task.title.substring(0, 20) + '...' : task.title;
      ctx.fillText(label, x1 + 3, y + 14);
    });
  }

  /**
   * Helper: Draw dependencies
   */
  drawDependencies(ctx, tasks, timeScale) {
    ctx.strokeStyle = '#FF9800';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    
    tasks.forEach(task => {
      if (!task.dependencies || !task.dependencies.blockedBy) return;
      
      task.dependencies.blockedBy.forEach(depId => {
        const depTask = tasks.find(t => t.id === depId);
        if (!depTask) return;
        
        // Draw arrow from dependency to task
        const fromX = timeScale.toPixel(depTask.dueDate || depTask.completedAt || new Date());
        const toX = timeScale.toPixel(task.startedAt || task.createdAt || new Date());
        
        // Simple arrow
        ctx.beginPath();
        ctx.moveTo(fromX, 100);
        ctx.lineTo(toX, 100);
        ctx.stroke();
        
        // Arrow head
        ctx.beginPath();
        ctx.moveTo(toX - 5, 95);
        ctx.lineTo(toX, 100);
        ctx.lineTo(toX - 5, 105);
        ctx.stroke();
      });
    });
    
    ctx.setLineDash([]);
  }

  /**
   * Helper: Get sprint color
   */
  getSprintColor(status) {
    const colors = {
      'planned': '#87CEEB',
      'active': '#FFD700',
      'review': '#FF9800',
      'complete': '#90EE90'
    };
    return colors[status] || '#666';
  }

  /**
   * Helper: Calculate critical path
   */
  calculateCriticalPath(tasks) {
    // Simplified critical path calculation
    // In production, would use proper CPM algorithm
    const critical = tasks.filter(task => {
      return task.priority === 'P0' || 
             task.dependencies?.blocks?.length > 2 ||
             task.riskScore > 7;
    });
    
    return critical.sort((a, b) => {
      const aDate = new Date(a.createdAt);
      const bDate = new Date(b.createdAt);
      return aDate - bDate;
    });
  }

  /**
   * Helper: Group tasks by agent
   */
  groupTasksByAgent(tasks) {
    const grouped = {};
    
    tasks.forEach(task => {
      const agent = task.assignee || 'Unassigned';
      if (!grouped[agent]) {
        grouped[agent] = [];
      }
      grouped[agent].push(task);
    });
    
    return grouped;
  }

  /**
   * Generate embeddable HTML
   */
  generateEmbedHTML(visualization) {
    return `
      <div style="background: #1e1e1e; padding: 20px; border-radius: 8px;">
        <img src="${visualization.dataURL}" 
             alt="Timeline Visualization" 
             style="width: 100%; max-width: ${visualization.width}px; height: auto;" />
        <div style="color: #888; font-size: 12px; margin-top: 10px; font-family: monospace;">
          Generated by Bumba Framework • ${new Date().toLocaleString()}
        </div>
      </div>
    `;
  }
}

module.exports = TimelineComponent;
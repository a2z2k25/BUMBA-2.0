/**
 * Status Reflection Pipeline
 * 
 * Collects project state from Bumba Framework and reflects it to Notion
 * in a one-way data flow pattern.
 */

const EventEmitter = require('events');
const NotionMCPAdapter = require('../adapters/notion-mcp-adapter');
const NotionNativeComponents = require('../adapters/notion-native-components');
const TaskSchema = require('../schemas/task-schema');
const TimelineComponent = require('../visualizations/timeline-component');
const config = require('../config/notion-mirror.config');

class StatusReflectionPipeline extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.adapter = new NotionMCPAdapter(options);
    this.nativeComponents = new NotionNativeComponents();
    this.taskSchema = new TaskSchema();
    this.timelineComponent = new TimelineComponent();
    
    this.projectId = null;
    this.dashboardId = null;
    this.updateQueue = [];
    this.isRunning = false;
    
    // State tracking
    this.state = {
      project: null,
      epics: new Map(),
      sprints: new Map(),
      tasks: new Map(),
      visualizations: new Map(),
      lastSync: null
    };
    
    // Update intervals
    this.intervals = {
      realtime: null,
      frequent: null,
      standard: null
    };
    
    // Statistics
    this.stats = {
      updates: 0,
      successful: 0,
      failed: 0,
      queued: 0
    };
  }

  /**
   * Initialize the pipeline
   */
  async initialize(projectData) {
    console.log('[Pipeline] Initializing status reflection pipeline...');
    
    try {
      // Connect adapter
      await this.adapter.connect();
      
      // Create or connect to dashboard
      const dashboard = await this.adapter.createProjectDashboard(projectData);
      this.dashboardId = dashboard.data.id;
      this.projectId = projectData.id;
      
      // Initialize project state
      this.state.project = {
        ...projectData,
        dashboardUrl: dashboard.data.url,
        created: new Date().toISOString()
      };
      
      // Start update cycles
      this.startUpdateCycles();
      
      this.emit('initialized', {
        projectId: this.projectId,
        dashboardId: this.dashboardId,
        dashboardUrl: dashboard.data.url
      });
      
      return dashboard;
    } catch (error) {
      console.error('[Pipeline] Initialization failed:', error);
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Reflect task update to Notion
   */
  async reflectTask(taskData) {
    // Create or update task in state
    const task = this.state.tasks.has(taskData.id) 
      ? { ...this.state.tasks.get(taskData.id), ...taskData }
      : this.taskSchema.createTask(taskData);
    
    this.state.tasks.set(task.id, task);
    
    // Queue update
    this.queueUpdate({
      type: 'task',
      priority: this.getUpdatePriority(task),
      data: task,
      operation: 'update'
    });
    
    // Update dependencies
    this.updateDependencies(task);
    
    // Trigger activity log
    this.logActivity(task.id, {
      type: 'task_update',
      actor: taskData.updatedBy || 'system',
      details: `Task ${task.status}: ${task.title}`
    });
    
    return task;
  }

  /**
   * Reflect sprint update to Notion
   */
  async reflectSprint(sprintData) {
    const sprint = this.state.sprints.has(sprintData.id)
      ? { ...this.state.sprints.get(sprintData.id), ...sprintData }
      : this.taskSchema.createSprint(sprintData);
    
    this.state.sprints.set(sprint.id, sprint);
    
    // Calculate sprint metrics
    sprint.metrics = this.calculateSprintMetrics(sprint);
    
    // Queue update
    this.queueUpdate({
      type: 'sprint',
      priority: 'high',
      data: sprint,
      operation: 'update'
    });
    
    // Update timeline visualization
    await this.updateTimelineVisualization();
    
    return sprint;
  }

  /**
   * Reflect visualization update - prioritizing native Notion components
   */
  async reflectVisualization(vizType, data) {
    try {
      let visualization;
      let nativeComponent = null;
      
      // First, try to use native Notion components
      if (this.nativeComponents.canUseNative(vizType, data)) {
        console.log(`[Pipeline] Using native Notion component for ${vizType}`);
        
        switch (vizType) {
          case 'timeline':
            nativeComponent = this.nativeComponents.createNativeTimeline({
              title: 'Project Timeline',
              tasks: Array.from(this.state.tasks.values()).map(task => ({
                title: task.title,
                status: task.status,
                startDate: task.startedAt || task.createdAt,
                endDate: task.completedAt || task.dueDate,
                department: task.department,
                assignee: task.assignee,
                progress: task.progress
              }))
            });
            break;
            
          case 'kanban':
            nativeComponent = this.nativeComponents.createNativeKanban({
              title: 'Task Board',
              tasks: Array.from(this.state.tasks.values())
            });
            break;
            
          case 'progress':
            const progress = this.calculateOverallProgress();
            nativeComponent = this.nativeComponents.createNativeProgress({
              title: 'Overall Progress',
              value: progress,
              completed: this.getCompletedTaskCount(),
              total: this.getTotalTaskCount()
            });
            break;
            
          case 'statusGrid':
            nativeComponent = this.nativeComponents.createStatusGrid({
              departments: this.getDepartmentStatuses()
            });
            break;
            
          case 'metrics':
            nativeComponent = this.nativeComponents.createMetricsDashboard({
              progress: this.calculateOverallProgress(),
              velocity: this.calculateCurrentVelocity(),
              blocked: this.getBlockedTaskCount(),
              health: this.calculateProjectHealth()
            });
            break;
        }
        
        if (nativeComponent) {
          // Use native component
          await this.adapter.appendToSection(
            config.template.sections.visualizations.id,
            nativeComponent
          );
          
          this.state.visualizations.set(vizType, {
            type: 'native',
            component: nativeComponent
          });
          
          return nativeComponent;
        }
      }
      
      // Fall back to embedded visualizations for complex charts
      console.log(`[Pipeline] Using embedded visualization for ${vizType}`);
      
      switch (vizType) {
        case 'timeline':
          visualization = this.timelineComponent.generateSprintTimeline(
            Array.from(this.state.sprints.values()),
            Array.from(this.state.tasks.values())
          );
          break;
          
        case 'critical-path':
          visualization = this.timelineComponent.generateCriticalPath(
            Array.from(this.state.tasks.values())
          );
          break;
          
        case 'agent-allocation':
          const agents = this.getActiveAgents();
          visualization = this.timelineComponent.generateAgentAllocation(
            Array.from(this.state.tasks.values()),
            agents
          );
          break;
          
        default:
          // Create a basic fallback visualization
          visualization = {
            type: vizType,
            dataURL: `data:image/svg+xml,<svg><text>Visualization: ${vizType}</text></svg>`,
            data: data
          };
      }
      
      // Try to convert to native, with embed as fallback
      const notionContent = await this.nativeComponents.convertToNotion(
        vizType,
        data,
        visualization
      );
      
      // Store visualization
      this.state.visualizations.set(vizType, notionContent);
      
      // Add to Notion
      const sectionId = config.template.sections.visualizations.id;
      await this.adapter.appendToSection(sectionId, notionContent);
      
      return notionContent;
    } catch (error) {
      console.error(`[Pipeline] Visualization ${vizType} failed:`, error);
      this.emit('visualization:error', { type: vizType, error });
    }
  }

  /**
   * Queue an update for batch processing
   */
  queueUpdate(update) {
    // Add to queue with deduplication
    const existingIndex = this.updateQueue.findIndex(u => 
      u.type === update.type && u.data.id === update.data.id
    );
    
    if (existingIndex >= 0) {
      // Replace with newer update
      this.updateQueue[existingIndex] = update;
    } else {
      this.updateQueue.push(update);
    }
    
    this.stats.queued = this.updateQueue.length;
    
    // Process immediately if high priority
    if (update.priority === 'critical') {
      this.processQueue();
    }
  }

  /**
   * Process queued updates
   */
  async processQueue() {
    if (this.isRunning || this.updateQueue.length === 0) return;
    
    this.isRunning = true;
    const batch = this.updateQueue.splice(0, config.mirror.batchSize);
    
    console.log(`[Pipeline] Processing ${batch.length} updates...`);
    
    for (const update of batch) {
      try {
        await this.processUpdate(update);
        this.stats.successful++;
      } catch (error) {
        console.error('[Pipeline] Update failed:', error);
        this.stats.failed++;
        
        // Retry logic
        if (update.retries < config.mirror.retryAttempts) {
          update.retries = (update.retries || 0) + 1;
          setTimeout(() => this.queueUpdate(update), config.mirror.retryDelay);
        }
      }
    }
    
    this.isRunning = false;
    this.state.lastSync = new Date().toISOString();
    
    this.emit('sync:complete', {
      processed: batch.length,
      remaining: this.updateQueue.length,
      stats: this.stats
    });
  }

  /**
   * Process a single update
   */
  async processUpdate(update) {
    switch (update.type) {
      case 'task':
        await this.adapter.updateTask(update.data);
        break;
        
      case 'sprint':
        // Sprint section update - simplified for now
        console.log('[Pipeline] Sprint update:', update.data.name);
        break;
        
      case 'epic':
        // Epic section update - simplified for now
        console.log('[Pipeline] Epic update:', update.data.title);
        break;
        
      case 'visualization':
        await this.adapter.embedVisualization(
          update.sectionId,
          update.data
        );
        break;
        
      case 'activity':
        // Activity feed update - future implementation
        console.log('[Pipeline] Activity logged:', update.data);
        break;
        
      default:
        console.warn(`[Pipeline] Unknown update type: ${update.type}`);
    }
    
    this.stats.updates++;
  }

  /**
   * Start update cycles
   */
  startUpdateCycles() {
    // Real-time updates (5 seconds)
    this.intervals.realtime = setInterval(() => {
      this.processQueue();
    }, config.visualizations.updateFrequency.realtime);
    
    // Frequent updates (30 seconds)
    this.intervals.frequent = setInterval(() => {
      this.updateFrequentMetrics();
    }, config.visualizations.updateFrequency.frequent);
    
    // Standard updates (5 minutes)
    this.intervals.standard = setInterval(() => {
      this.updateStandardMetrics();
      this.updateTimelineVisualization();
    }, config.visualizations.updateFrequency.standard);
    
    console.log('[Pipeline] Update cycles started');
  }

  /**
   * Stop update cycles
   */
  stopUpdateCycles() {
    Object.values(this.intervals).forEach(interval => {
      if (interval) clearInterval(interval);
    });
    
    console.log('[Pipeline] Update cycles stopped');
  }

  /**
   * Calculate sprint metrics
   */
  calculateSprintMetrics(sprint) {
    const tasks = Array.from(this.state.tasks.values())
      .filter(t => t.sprintId === sprint.id);
    
    const completed = tasks.filter(t => t.status === 'complete');
    const inProgress = tasks.filter(t => t.status === 'in_progress');
    const blocked = tasks.filter(t => t.status === 'blocked');
    
    return {
      totalTasks: tasks.length,
      completedTasks: completed.length,
      inProgressTasks: inProgress.length,
      blockedTasks: blocked.length,
      completionRate: tasks.length > 0 ? (completed.length / tasks.length) * 100 : 0,
      velocity: completed.reduce((sum, t) => sum + (t.storyPoints || 0), 0),
      burndown: this.calculateBurndown(sprint, tasks),
      health: blocked.length > 2 ? 'red' : inProgress.length > 0 ? 'yellow' : 'green'
    };
  }

  /**
   * Calculate burndown data
   */
  calculateBurndown(sprint, tasks) {
    const startDate = new Date(sprint.startDate);
    const endDate = new Date(sprint.endDate);
    const totalPoints = tasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
    
    const burndown = [];
    const dayMs = 24 * 60 * 60 * 1000;
    
    for (let d = startDate; d <= endDate; d = new Date(d.getTime() + dayMs)) {
      const completedByDate = tasks.filter(t => 
        t.completedAt && new Date(t.completedAt) <= d
      );
      
      const remainingPoints = totalPoints - 
        completedByDate.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
      
      burndown.push({
        date: d.toISOString(),
        remaining: remainingPoints,
        ideal: totalPoints * (1 - (d - startDate) / (endDate - startDate))
      });
    }
    
    return burndown;
  }

  /**
   * Update dependencies
   */
  updateDependencies(task) {
    // Update blocking relationships
    if (task.dependencies?.blockedBy) {
      task.dependencies.blockedBy.forEach(depId => {
        const depTask = this.state.tasks.get(depId);
        if (depTask) {
          if (!depTask.dependencies.blocks) {
            depTask.dependencies.blocks = [];
          }
          if (!depTask.dependencies.blocks.includes(task.id)) {
            depTask.dependencies.blocks.push(task.id);
          }
        }
      });
    }
  }

  /**
   * Get update priority
   */
  getUpdatePriority(task) {
    if (task.status === 'blocked') return 'critical';
    if (task.priority === 'P0') return 'critical';
    if (task.priority === 'P1') return 'high';
    if (task.status === 'complete') return 'high';
    return 'normal';
  }

  /**
   * Get active agents
   */
  getActiveAgents() {
    const agents = new Set();
    this.state.tasks.forEach(task => {
      if (task.assignee) {
        agents.add(task.assignee);
      }
    });
    return Array.from(agents);
  }

  /**
   * Log activity
   */
  logActivity(entityId, activity) {
    const entry = this.taskSchema.createActivity(entityId, activity);
    
    this.queueUpdate({
      type: 'activity',
      priority: 'low',
      data: entry,
      operation: 'append'
    });
    
    this.emit('activity', entry);
  }

  /**
   * Update frequent metrics
   */
  async updateFrequentMetrics() {
    // Update progress bars, burndown charts, etc.
    await this.reflectVisualization('progress', {
      overall: this.calculateOverallProgress(),
      byDepartment: this.calculateProgressByDepartment()
    });
  }

  /**
   * Update standard metrics
   */
  async updateStandardMetrics() {
    // Update velocity, resource allocation, etc.
    await this.reflectVisualization('velocity', {
      current: this.calculateCurrentVelocity(),
      historical: this.getHistoricalVelocity()
    });
  }

  /**
   * Update timeline visualization
   */
  async updateTimelineVisualization() {
    await this.reflectVisualization('timeline', {});
  }

  /**
   * Calculate overall progress
   */
  calculateOverallProgress() {
    const tasks = Array.from(this.state.tasks.values());
    const totalPoints = tasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
    const completedPoints = tasks
      .filter(t => t.status === 'complete')
      .reduce((sum, t) => sum + (t.storyPoints || 0), 0);
    
    return totalPoints > 0 ? (completedPoints / totalPoints) * 100 : 0;
  }

  /**
   * Calculate progress by department
   */
  calculateProgressByDepartment() {
    const byDept = {};
    
    this.state.tasks.forEach(task => {
      const dept = task.department || 'Unknown';
      if (!byDept[dept]) {
        byDept[dept] = { total: 0, completed: 0 };
      }
      
      byDept[dept].total += task.storyPoints || 0;
      if (task.status === 'complete') {
        byDept[dept].completed += task.storyPoints || 0;
      }
    });
    
    return Object.entries(byDept).map(([dept, data]) => ({
      department: dept,
      progress: data.total > 0 ? (data.completed / data.total) * 100 : 0
    }));
  }

  /**
   * Get pipeline statistics
   */
  getStatistics() {
    return {
      ...this.stats,
      state: {
        epics: this.state.epics.size,
        sprints: this.state.sprints.size,
        tasks: this.state.tasks.size,
        visualizations: this.state.visualizations.size
      },
      lastSync: this.state.lastSync,
      queueLength: this.updateQueue.length,
      isRunning: this.isRunning
    };
  }

  /**
   * Helper methods for native components
   */
  getTotalTaskCount() {
    return this.state.tasks.size;
  }

  getCompletedTaskCount() {
    return Array.from(this.state.tasks.values())
      .filter(t => t.status === 'complete').length;
  }

  getBlockedTaskCount() {
    return Array.from(this.state.tasks.values())
      .filter(t => t.status === 'blocked').length;
  }

  getDepartmentStatuses() {
    const departments = new Map();
    
    // Initialize departments
    Object.keys(config.departments).forEach(dept => {
      departments.set(dept, {
        name: config.departments[dept].notionLabel,
        status: 'idle',
        taskCount: 0,
        load: 0
      });
    });
    
    // Calculate status for each department
    this.state.tasks.forEach(task => {
      const dept = departments.get(task.department);
      if (dept) {
        dept.taskCount++;
        if (task.status === 'in_progress') {
          dept.status = 'active';
          dept.load += task.storyPoints || 3;
        } else if (task.status === 'blocked') {
          dept.status = 'blocked';
        }
      }
    });
    
    return Array.from(departments.values());
  }

  calculateCurrentVelocity() {
    const sprints = Array.from(this.state.sprints.values());
    const completedSprints = sprints.filter(s => s.status === 'complete');
    
    if (completedSprints.length === 0) return 0;
    
    const totalVelocity = completedSprints.reduce((sum, s) => 
      sum + (s.completedStoryPoints || 0), 0);
    
    return Math.round(totalVelocity / completedSprints.length);
  }

  calculateProjectHealth() {
    const totalTasks = this.state.tasks.size;
    if (totalTasks === 0) return 'healthy';
    
    const blockedTasks = this.getBlockedTaskCount();
    const blockedRatio = blockedTasks / totalTasks;
    
    if (blockedRatio > 0.3) return 'critical';
    if (blockedRatio > 0.15) return 'warning';
    
    const progress = this.calculateOverallProgress();
    if (progress < 25 && totalTasks > 10) return 'slow';
    
    return 'healthy';
  }

  getHistoricalVelocity() {
    // Return last 5 sprints velocity
    const sprints = Array.from(this.state.sprints.values())
      .filter(s => s.status === 'complete')
      .slice(-5);
    
    return sprints.map(s => ({
      name: s.name,
      velocity: s.completedStoryPoints || 0
    }));
  }
}

module.exports = StatusReflectionPipeline;
/**
 * Notion Mirror Feature - Main Integration Module
 * 
 * Entry point for the Notion Project Dashboard Mirror feature
 */

const StatusReflectionPipeline = require('./pipelines/status-reflection-pipeline');
const NotionMCPAdapter = require('./adapters/notion-mcp-adapter');
const TaskSchema = require('./schemas/task-schema');
const TimelineComponent = require('./visualizations/timeline-component');
const WidgetAdapter = require('./visualizations/widget-adapter');
const config = require('./config/notion-mirror.config');

class NotionMirror {
  constructor(options = {}) {
    this.config = { ...config, ...options };
    this.pipeline = null;
    this.adapter = null;
    this.taskSchema = new TaskSchema();
    this.widgetAdapter = new WidgetAdapter();
    this.timelineComponent = new TimelineComponent();
    
    this.initialized = false;
    this.projectData = null;
    
    // Agent mappings
    this.agentMap = new Map();
    this.setupAgentMappings();
  }

  /**
   * Initialize the Notion Mirror for a project
   */
  async initialize(projectData) {
    console.log(`[NotionMirror] Initializing for project: ${projectData.name}`);
    
    try {
      // Store project data
      this.projectData = {
        id: projectData.id || `project-${Date.now()}`,
        name: projectData.name,
        description: projectData.description || '',
        status: projectData.status || 'planning',
        priority: projectData.priority || 'P2',
        startDate: projectData.startDate || new Date().toISOString(),
        endDate: projectData.endDate || null,
        team: projectData.team || []
      };
      
      // Initialize pipeline
      this.pipeline = new StatusReflectionPipeline(this.config);
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Initialize dashboard
      const dashboard = await this.pipeline.initialize(this.projectData);
      
      // Create initial content
      await this.createInitialContent();
      
      this.initialized = true;
      
      console.log(`[NotionMirror] Initialized successfully`);
      console.log(`[NotionMirror] Dashboard URL: ${dashboard.data.url}`);
      
      return {
        success: true,
        dashboardUrl: dashboard.data.url,
        projectId: this.projectData.id
      };
      
    } catch (error) {
      console.error('[NotionMirror] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Create initial dashboard content
   */
  async createInitialContent() {
    // Add project overview
    await this.updateProjectOverview({
      title: this.projectData.name,
      description: this.projectData.description,
      status: this.projectData.status,
      timeline: {
        start: this.projectData.startDate,
        end: this.projectData.endDate
      },
      team: this.projectData.team
    });
    
    // Generate initial visualizations
    const visualizations = await this.widgetAdapter.generateStandardSet({
      overallProgress: 0,
      totalTasks: 0,
      completedTasks: 0,
      departments: this.getDefaultDepartments()
    });
    
    // Embed visualizations
    for (const viz of visualizations) {
      await this.pipeline.reflectVisualization(viz.type, viz);
    }
    
    console.log('[NotionMirror] Initial content created');
  }

  /**
   * Update project overview section
   */
  async updateProjectOverview(data) {
    return await this.pipeline.adapter.updateBlock(
      this.config.template.sections.overview.id,
      {
        type: 'heading_2',
        heading_2: {
          rich_text: [{ text: { content: 'Project Overview' } }]
        },
        children: [
          {
            type: 'paragraph',
            paragraph: {
              rich_text: [{ text: { content: data.description } }]
            }
          },
          {
            type: 'bulleted_list_item',
            bulleted_list_item: {
              rich_text: [{ text: { content: `Status: ${data.status}` } }]
            }
          },
          {
            type: 'bulleted_list_item',
            bulleted_list_item: {
              rich_text: [{ text: { content: `Timeline: ${data.timeline.start} - ${data.timeline.end || 'TBD'}` } }]
            }
          }
        ]
      }
    );
  }

  /**
   * Create or update a task
   */
  async createTask(taskData) {
    if (!this.initialized) {
      throw new Error('NotionMirror not initialized');
    }
    
    // Ensure dependencies structure is correct
    if (taskData.dependencies && !taskData.dependencies.blockedBy) {
      // Convert simple array to proper structure
      if (Array.isArray(taskData.dependencies)) {
        taskData.dependencies = {
          blockedBy: taskData.dependencies,
          blocks: []
        };
      }
    }
    
    // Enrich task data
    const enrichedTask = {
      ...taskData,
      projectId: this.projectData.id,
      createdAt: new Date().toISOString()
    };
    
    // Create task through pipeline
    const task = await this.pipeline.reflectTask(enrichedTask);
    
    // Update related visualizations
    await this.updateProgressVisualization();
    
    return task;
  }

  /**
   * Update task status
   */
  async updateTaskStatus(taskId, newStatus) {
    const task = this.pipeline.state.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }
    
    // Update task
    const updatedTask = await this.pipeline.reflectTask({
      ...task,
      status: newStatus,
      updatedAt: new Date().toISOString()
    });
    
    // Log activity
    this.pipeline.logActivity(taskId, {
      type: 'status_change',
      actor: 'system',
      oldValue: task.status,
      newValue: newStatus,
      details: `Status changed from ${task.status} to ${newStatus}`
    });
    
    // Update visualizations if needed
    if (newStatus === 'complete' || newStatus === 'blocked') {
      await this.updateProgressVisualization();
      await this.updateBurndownChart();
    }
    
    return updatedTask;
  }

  /**
   * Create a sprint
   */
  async createSprint(sprintData) {
    const sprint = await this.pipeline.reflectSprint({
      ...sprintData,
      projectId: this.projectData.id
    });
    
    // Update timeline
    await this.updateTimelineVisualization();
    
    return sprint;
  }

  /**
   * Update progress visualization
   */
  async updateProgressVisualization() {
    const progress = this.pipeline.calculateOverallProgress();
    const progressByDept = this.pipeline.calculateProgressByDepartment();
    
    const progressViz = this.widgetAdapter.createProgressBar({
      title: 'Overall Progress',
      value: progress,
      subtitle: `${this.getCompletedTaskCount()} of ${this.getTotalTaskCount()} tasks complete`
    });
    
    await this.pipeline.reflectVisualization('progress', progressViz);
  }

  /**
   * Update burndown chart
   */
  async updateBurndownChart() {
    const currentSprint = this.getCurrentSprint();
    if (!currentSprint) {
      console.log('[NotionMirror] No active sprint for burndown chart');
      return;
    }
    
    const burndownViz = this.widgetAdapter.createBurndownChart({
      title: `${currentSprint.name} Burndown`,
      total: currentSprint.plannedStoryPoints || 0,
      points: currentSprint.burndownData || [],
      dates: this.getSprintDates(currentSprint)
    });
    
    await this.pipeline.reflectVisualization('burndown', burndownViz);
  }

  /**
   * Update timeline visualization
   */
  async updateTimelineVisualization() {
    const timeline = this.timelineComponent.generateSprintTimeline(
      Array.from(this.pipeline.state.sprints.values()),
      Array.from(this.pipeline.state.tasks.values())
    );
    
    await this.pipeline.reflectVisualization('timeline', timeline);
  }

  /**
   * Agent creates/updates task
   */
  async agentTaskUpdate(agentId, taskData) {
    const agent = this.agentMap.get(agentId);
    if (!agent) {
      console.warn(`[NotionMirror] Unknown agent: ${agentId}`);
      return;
    }
    
    const enrichedTask = {
      ...taskData,
      department: agent.department,
      assignee: agentId,
      updatedBy: agentId
    };
    
    return await this.createTask(enrichedTask);
  }

  /**
   * Get dashboard statistics
   */
  getStatistics() {
    return {
      initialized: this.initialized,
      projectId: this.projectData?.id,
      dashboardUrl: this.pipeline?.state?.project?.dashboardUrl,
      tasks: {
        total: this.getTotalTaskCount(),
        completed: this.getCompletedTaskCount(),
        inProgress: this.getInProgressTaskCount(),
        blocked: this.getBlockedTaskCount()
      },
      sprints: this.pipeline?.state?.sprints?.size || 0,
      visualizations: this.pipeline?.state?.visualizations?.size || 0,
      lastSync: this.pipeline?.state?.lastSync,
      pipelineStats: this.pipeline?.getStatistics()
    };
  }

  /**
   * Setup agent mappings
   */
  setupAgentMappings() {
    const mappings = [
      { id: 'product-strategist', department: 'Strategy', role: 'Product-Strategist' },
      { id: 'backend-engineer-1', department: 'Engineering', role: 'Backend-Engineer' },
      { id: 'backend-engineer-2', department: 'Engineering', role: 'Backend-Engineer' },
      { id: 'frontend-engineer-1', department: 'Engineering', role: 'Frontend-Engineer' },
      { id: 'design-engineer', department: 'Design', role: 'Design-Engineer' },
      { id: 'qa-engineer', department: 'QA', role: 'QA-Engineer' },
      { id: 'devops-engineer', department: 'DevOps', role: 'DevOps-Engineer' }
    ];
    
    mappings.forEach(mapping => {
      this.agentMap.set(mapping.id, mapping);
    });
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Pipeline events
    this.pipeline.on('initialized', (data) => {
      console.log('[NotionMirror] Pipeline initialized:', data);
    });
    
    this.pipeline.on('sync:complete', (data) => {
      console.log('[NotionMirror] Sync complete:', data);
    });
    
    this.pipeline.on('error', (error) => {
      console.error('[NotionMirror] Pipeline error:', error);
    });
    
    // Task events
    this.pipeline.on('task:updated', (task) => {
      console.log(`[NotionMirror] Task updated: ${task.taskId}`);
    });
    
    // Visualization events
    this.pipeline.on('visualization:embedded', (viz) => {
      console.log(`[NotionMirror] Visualization embedded: ${viz.id}`);
    });
  }

  /**
   * Helper methods
   */
  getTotalTaskCount() {
    return this.pipeline?.state?.tasks?.size || 0;
  }
  
  getCompletedTaskCount() {
    if (!this.pipeline?.state?.tasks) return 0;
    return Array.from(this.pipeline.state.tasks.values())
      .filter(t => t.status === 'complete').length;
  }
  
  getInProgressTaskCount() {
    if (!this.pipeline?.state?.tasks) return 0;
    return Array.from(this.pipeline.state.tasks.values())
      .filter(t => t.status === 'in_progress').length;
  }
  
  getBlockedTaskCount() {
    if (!this.pipeline?.state?.tasks) return 0;
    return Array.from(this.pipeline.state.tasks.values())
      .filter(t => t.status === 'blocked').length;
  }
  
  getCurrentSprint() {
    if (!this.pipeline?.state?.sprints) return null;
    return Array.from(this.pipeline.state.sprints.values())
      .find(s => s.status === 'active');
  }
  
  getSprintDates(sprint) {
    const dates = [];
    const start = new Date(sprint.startDate);
    const end = new Date(sprint.endDate);
    const dayMs = 24 * 60 * 60 * 1000;
    
    for (let d = start; d <= end; d = new Date(d.getTime() + dayMs)) {
      dates.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    }
    
    return dates;
  }
  
  getDefaultDepartments() {
    return [
      { name: 'Strategy', status: 'idle', taskCount: 0, load: 0 },
      { name: 'Engineering', status: 'idle', taskCount: 0, load: 0 },
      { name: 'Design', status: 'idle', taskCount: 0, load: 0 },
      { name: 'QA', status: 'idle', taskCount: 0, load: 0 }
    ];
  }

  /**
   * Shutdown the mirror
   */
  async shutdown() {
    if (this.pipeline) {
      this.pipeline.stopUpdateCycles();
    }
    
    console.log('[NotionMirror] Shutdown complete');
  }
}

// Export for use in Bumba Framework
module.exports = NotionMirror;
/**
 * BUMBA Workflow Scheduler
 * Advanced scheduling and prioritization for workflows
 * Part of Workflow Engine enhancement to 90%
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');

/**
 * Advanced scheduler for workflow execution
 */
class WorkflowScheduler extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      maxConcurrent: config.maxConcurrent || 10,
      priorityLevels: config.priorityLevels || 5,
      schedulingAlgorithm: config.schedulingAlgorithm || 'weighted-fair',
      resourceLimit: config.resourceLimit || 100,
      timeSliceMs: config.timeSliceMs || 100,
      preemptive: config.preemptive !== false,
      ...config
    };
    
    // Scheduling queues
    this.priorityQueues = new Map();
    this.scheduledWorkflows = new Map();
    this.executingWorkflows = new Map();
    this.suspendedWorkflows = new Map();
    
    // Resource management
    this.resourcePool = {
      cpu: 100,
      memory: 100,
      io: 100,
      network: 100
    };
    this.resourceAllocations = new Map();
    
    // Scheduling state
    this.scheduler = {
      running: false,
      currentSlice: 0,
      quantum: this.config.timeSliceMs,
      lastSchedule: Date.now()
    };
    
    // Performance tracking
    this.metrics = {
      scheduled: 0,
      executed: 0,
      completed: 0,
      preempted: 0,
      averageWaitTime: 0,
      averageTurnaroundTime: 0,
      throughput: 0,
      utilization: 0
    };
    
    // Cron scheduling
    this.cronJobs = new Map();
    this.recurringWorkflows = new Map();
    
    this.initialize();
  }
  
  /**
   * Initialize scheduler
   */
  initialize() {
    // Initialize priority queues
    for (let i = 0; i < this.config.priorityLevels; i++) {
      this.priorityQueues.set(i, []);
    }
    
    // Start scheduling loop
    this.startScheduler();
    
    logger.info('⏰ Workflow Scheduler initialized');
  }
  
  /**
   * Schedule a workflow for execution
   */
  async scheduleWorkflow(workflow, options = {}) {
    const scheduled = {
      id: workflow.id || this.generateScheduleId(),
      workflow,
      priority: options.priority || 2,
      resources: options.resources || this.estimateResources(workflow),
      constraints: options.constraints || {},
      dependencies: options.dependencies || [],
      deadline: options.deadline,
      scheduled: Date.now(),
      state: 'pending',
      attempts: 0,
      metadata: options.metadata || {}
    };
    
    // Validate scheduling request
    if (!this.validateScheduling(scheduled)) {
      throw new Error('Invalid scheduling request');
    }
    
    // Check dependencies
    if (scheduled.dependencies.length > 0) {
      scheduled.state = 'waiting';
      this.scheduledWorkflows.set(scheduled.id, scheduled);
      this.setupDependencyWatcher(scheduled);
      
      this.emit('workflow:waiting', scheduled);
      return scheduled;
    }
    
    // Add to priority queue
    this.enqueuWorkflow(scheduled);
    
    // Update metrics
    this.metrics.scheduled++;
    
    this.emit('workflow:scheduled', scheduled);
    logger.info(`📅 Scheduled workflow ${scheduled.id} with priority ${scheduled.priority}`);
    
    return scheduled;
  }
  
  /**
   * Schedule recurring workflow
   */
  scheduleRecurring(workflow, pattern, options = {}) {
    const recurring = {
      id: this.generateScheduleId(),
      workflow,
      pattern,
      options,
      nextRun: this.calculateNextRun(pattern),
      enabled: true,
      executions: []
    };
    
    this.recurringWorkflows.set(recurring.id, recurring);
    
    // Schedule first execution
    this.scheduleNextRecurrence(recurring);
    
    logger.info(`🔁 Scheduled recurring workflow ${recurring.id}`);
    
    return recurring;
  }
  
  /**
   * Schedule with cron expression
   */
  scheduleCron(workflow, cronExpression, options = {}) {
    const cronJob = {
      id: this.generateScheduleId(),
      workflow,
      expression: cronExpression,
      options,
      enabled: true,
      lastRun: null,
      nextRun: this.parseCronExpression(cronExpression)
    };
    
    this.cronJobs.set(cronJob.id, cronJob);
    
    // Set up cron timer
    this.setupCronTimer(cronJob);
    
    logger.info(`⏰ Scheduled cron workflow ${cronJob.id}: ${cronExpression}`);
    
    return cronJob;
  }
  
  /**
   * Enqueue workflow to priority queue
   */
  enqueuWorkflow(scheduled) {
    const queue = this.priorityQueues.get(scheduled.priority);
    
    if (!queue) {
      throw new Error(`Invalid priority level: ${scheduled.priority}`);
    }
    
    // Insert maintaining order (for FIFO within priority)
    queue.push(scheduled);
    
    // Store scheduled workflow
    this.scheduledWorkflows.set(scheduled.id, scheduled);
    
    // Trigger scheduling decision
    this.scheduleNext();
  }
  
  /**
   * Main scheduling algorithm
   */
  async scheduleNext() {
    if (!this.scheduler.running) return;
    
    // Check resource availability
    const availableResources = this.getAvailableResources();
    
    // Select next workflow based on algorithm
    const selected = this.selectNextWorkflow(availableResources);
    
    if (!selected) {
      // No workflow can be scheduled
      return;
    }
    
    // Allocate resources
    if (!this.allocateResources(selected)) {
      // Resource allocation failed
      this.suspendWorkflow(selected);
      return;
    }
    
    // Execute workflow
    await this.executeScheduledWorkflow(selected);
  }
  
  /**
   * Select next workflow based on scheduling algorithm
   */
  selectNextWorkflow(availableResources) {
    switch (this.config.schedulingAlgorithm) {
      case 'priority':
        return this.selectByPriority(availableResources);
      
      case 'weighted-fair':
        return this.selectWeightedFair(availableResources);
      
      case 'deadline':
        return this.selectByDeadline(availableResources);
      
      case 'resource-aware':
        return this.selectResourceAware(availableResources);
      
      case 'round-robin':
        return this.selectRoundRobin(availableResources);
      
      default:
        return this.selectByPriority(availableResources);
    }
  }
  
  /**
   * Priority-based selection
   */
  selectByPriority(availableResources) {
    // Check queues from highest to lowest priority
    for (let priority = 0; priority < this.config.priorityLevels; priority++) {
      const queue = this.priorityQueues.get(priority);
      
      if (queue.length === 0) continue;
      
      // Find first workflow that fits resources
      for (let i = 0; i < queue.length; i++) {
        const workflow = queue[i];
        
        if (this.canAllocateResources(workflow, availableResources)) {
          // Remove from queue
          queue.splice(i, 1);
          return workflow;
        }
      }
    }
    
    return null;
  }
  
  /**
   * Weighted fair queuing selection
   */
  selectWeightedFair(availableResources) {
    const weights = [5, 4, 3, 2, 1]; // Weight by priority
    let totalWeight = 0;
    const candidates = [];
    
    // Collect candidates with weights
    for (let priority = 0; priority < this.config.priorityLevels; priority++) {
      const queue = this.priorityQueues.get(priority);
      
      if (queue.length > 0) {
        const workflow = queue[0];
        
        if (this.canAllocateResources(workflow, availableResources)) {
          const weight = weights[priority] || 1;
          totalWeight += weight;
          candidates.push({ workflow, weight, priority });
        }
      }
    }
    
    if (candidates.length === 0) return null;
    
    // Weighted random selection
    let random = Math.random() * totalWeight;
    
    for (const candidate of candidates) {
      random -= candidate.weight;
      
      if (random <= 0) {
        // Remove from queue
        const queue = this.priorityQueues.get(candidate.priority);
        const index = queue.indexOf(candidate.workflow);
        if (index !== -1) queue.splice(index, 1);
        
        return candidate.workflow;
      }
    }
    
    return candidates[0].workflow;
  }
  
  /**
   * Earliest deadline first selection
   */
  selectByDeadline(availableResources) {
    let earliestDeadline = null;
    let selectedWorkflow = null;
    let selectedQueue = null;
    let selectedIndex = -1;
    
    // Check all queues for earliest deadline
    for (const [priority, queue] of this.priorityQueues) {
      for (let i = 0; i < queue.length; i++) {
        const workflow = queue[i];
        
        if (!workflow.deadline) continue;
        if (!this.canAllocateResources(workflow, availableResources)) continue;
        
        if (!earliestDeadline || workflow.deadline < earliestDeadline) {
          earliestDeadline = workflow.deadline;
          selectedWorkflow = workflow;
          selectedQueue = queue;
          selectedIndex = i;
        }
      }
    }
    
    if (selectedWorkflow && selectedQueue) {
      selectedQueue.splice(selectedIndex, 1);
      return selectedWorkflow;
    }
    
    // Fall back to priority if no deadlines
    return this.selectByPriority(availableResources);
  }
  
  /**
   * Resource-aware selection
   */
  selectResourceAware(availableResources) {
    let bestFit = null;
    let bestFitScore = Infinity;
    let bestQueue = null;
    let bestIndex = -1;
    
    // Find workflow with best resource fit
    for (const [priority, queue] of this.priorityQueues) {
      for (let i = 0; i < queue.length; i++) {
        const workflow = queue[i];
        
        if (!this.canAllocateResources(workflow, availableResources)) continue;
        
        // Calculate fit score (lower is better)
        const fitScore = this.calculateResourceFit(workflow, availableResources);
        
        if (fitScore < bestFitScore) {
          bestFit = workflow;
          bestFitScore = fitScore;
          bestQueue = queue;
          bestIndex = i;
        }
      }
    }
    
    if (bestFit && bestQueue) {
      bestQueue.splice(bestIndex, 1);
      return bestFit;
    }
    
    return null;
  }
  
  /**
   * Round-robin selection
   */
  selectRoundRobin(availableResources) {
    // Rotate through priority levels
    const startPriority = this.scheduler.currentSlice % this.config.priorityLevels;
    
    for (let i = 0; i < this.config.priorityLevels; i++) {
      const priority = (startPriority + i) % this.config.priorityLevels;
      const queue = this.priorityQueues.get(priority);
      
      if (queue.length > 0) {
        const workflow = queue[0];
        
        if (this.canAllocateResources(workflow, availableResources)) {
          queue.shift();
          this.scheduler.currentSlice++;
          return workflow;
        }
      }
    }
    
    return null;
  }
  
  /**
   * Execute scheduled workflow
   */
  async executeScheduledWorkflow(scheduled) {
    scheduled.state = 'executing';
    scheduled.startTime = Date.now();
    
    this.executingWorkflows.set(scheduled.id, scheduled);
    this.scheduledWorkflows.delete(scheduled.id);
    
    // Update metrics
    const waitTime = scheduled.startTime - scheduled.scheduled;
    this.updateWaitTime(waitTime);
    this.metrics.executed++;
    
    this.emit('workflow:executing', scheduled);
    
    try {
      // Set up preemption if enabled
      if (this.config.preemptive) {
        this.setupPreemption(scheduled);
      }
      
      // Execute workflow
      const result = await this.executeWorkflow(scheduled.workflow, scheduled);
      
      // Complete execution
      await this.completeExecution(scheduled, result);
      
    } catch (error) {
      await this.handleExecutionError(scheduled, error);
    }
  }
  
  /**
   * Execute workflow (delegate to engine)
   */
  async executeWorkflow(workflow, scheduled) {
    // This would normally delegate to the workflow engine
    // Simulated execution for now
    return new Promise((resolve) => {
      const duration = Math.random() * 5000 + 1000;
      
      setTimeout(() => {
        resolve({
          success: true,
          duration,
          results: {}
        });
      }, duration);
    });
  }
  
  /**
   * Complete workflow execution
   */
  async completeExecution(scheduled, result) {
    scheduled.state = 'completed';
    scheduled.endTime = Date.now();
    scheduled.result = result;
    
    // Release resources
    this.releaseResources(scheduled);
    
    // Remove from executing
    this.executingWorkflows.delete(scheduled.id);
    
    // Update metrics
    const turnaroundTime = scheduled.endTime - scheduled.scheduled;
    this.updateTurnaroundTime(turnaroundTime);
    this.metrics.completed++;
    
    // Check for dependent workflows
    this.checkDependents(scheduled);
    
    this.emit('workflow:completed', scheduled);
    
    // Schedule next workflow
    this.scheduleNext();
  }
  
  /**
   * Handle execution error
   */
  async handleExecutionError(scheduled, error) {
    scheduled.state = 'failed';
    scheduled.error = error;
    scheduled.attempts++;
    
    // Release resources
    this.releaseResources(scheduled);
    
    // Remove from executing
    this.executingWorkflows.delete(scheduled.id);
    
    // Check retry policy
    if (scheduled.attempts < (scheduled.workflow.maxRetries || 3)) {
      // Reschedule with lower priority
      scheduled.priority = Math.min(
        scheduled.priority + 1,
        this.config.priorityLevels - 1
      );
      scheduled.state = 'pending';
      
      this.enqueuWorkflow(scheduled);
      
      logger.warn(`Rescheduling failed workflow ${scheduled.id} (attempt ${scheduled.attempts})`);
    } else {
      this.emit('workflow:failed', { scheduled, error });
    }
    
    // Schedule next workflow
    this.scheduleNext();
  }
  
  /**
   * Resource Management
   */
  
  getAvailableResources() {
    const available = { ...this.resourcePool };
    
    // Subtract allocated resources
    for (const allocation of this.resourceAllocations.values()) {
      for (const [resource, amount] of Object.entries(allocation)) {
        available[resource] = (available[resource] || 0) - amount;
      }
    }
    
    return available;
  }
  
  canAllocateResources(workflow, available) {
    const required = workflow.resources || {};
    
    for (const [resource, amount] of Object.entries(required)) {
      if ((available[resource] || 0) < amount) {
        return false;
      }
    }
    
    return true;
  }
  
  allocateResources(scheduled) {
    const required = scheduled.resources || {};
    const available = this.getAvailableResources();
    
    // Check availability
    if (!this.canAllocateResources(scheduled, available)) {
      return false;
    }
    
    // Allocate resources
    this.resourceAllocations.set(scheduled.id, required);
    
    // Update utilization
    this.updateUtilization();
    
    return true;
  }
  
  releaseResources(scheduled) {
    this.resourceAllocations.delete(scheduled.id);
    this.updateUtilization();
  }
  
  calculateResourceFit(workflow, available) {
    const required = workflow.resources || {};
    let fitScore = 0;
    
    for (const [resource, amount] of Object.entries(required)) {
      const availableAmount = available[resource] || 0;
      
      // Calculate waste (unused resources)
      const waste = availableAmount - amount;
      fitScore += waste * waste; // Quadratic penalty for waste
    }
    
    return fitScore;
  }
  
  /**
   * Dependency Management
   */
  
  setupDependencyWatcher(scheduled) {
    // Watch for dependency completion
    const checkDependencies = () => {
      const allCompleted = scheduled.dependencies.every(depId => {
        const dep = this.scheduledWorkflows.get(depId) ||
                    this.executingWorkflows.get(depId);
        
        return dep && dep.state === 'completed';
      });
      
      if (allCompleted) {
        // Move to ready queue
        scheduled.state = 'pending';
        this.enqueuWorkflow(scheduled);
        
        logger.info(`Dependencies satisfied for workflow ${scheduled.id}`);
      }
    };
    
    // Set up periodic check
    const interval = setInterval(() => {
      checkDependencies();
      
      if (scheduled.state !== 'waiting') {
        clearInterval(interval);
      }
    }, 1000);
  }
  
  checkDependents(completed) {
    // Find workflows waiting on this one
    for (const scheduled of this.scheduledWorkflows.values()) {
      if (scheduled.state === 'waiting' &&
          scheduled.dependencies.includes(completed.id)) {
        
        // Re-check dependencies
        this.setupDependencyWatcher(scheduled);
      }
    }
  }
  
  /**
   * Preemption Support
   */
  
  setupPreemption(scheduled) {
    if (!scheduled.workflow.preemptible) return;
    
    // Set up time quantum
    const quantum = scheduled.workflow.quantum || this.config.timeSliceMs;
    
    scheduled.preemptionTimer = setTimeout(() => {
      this.preemptWorkflow(scheduled);
    }, quantum);
  }
  
  preemptWorkflow(scheduled) {
    if (scheduled.state !== 'executing') return;
    
    // Suspend execution
    scheduled.state = 'suspended';
    this.suspendedWorkflows.set(scheduled.id, scheduled);
    this.executingWorkflows.delete(scheduled.id);
    
    // Release partial resources
    this.releaseResources(scheduled);
    
    // Re-enqueue with same priority
    this.enqueuWorkflow(scheduled);
    
    this.metrics.preempted++;
    
    logger.info(`Preempted workflow ${scheduled.id}`);
    
    // Schedule next
    this.scheduleNext();
  }
  
  suspendWorkflow(scheduled) {
    scheduled.state = 'suspended';
    this.suspendedWorkflows.set(scheduled.id, scheduled);
    
    this.emit('workflow:suspended', scheduled);
  }
  
  resumeWorkflow(workflowId) {
    const suspended = this.suspendedWorkflows.get(workflowId);
    
    if (!suspended) {
      throw new Error(`Suspended workflow not found: ${workflowId}`);
    }
    
    // Move back to queue
    suspended.state = 'pending';
    this.suspendedWorkflows.delete(workflowId);
    this.enqueuWorkflow(suspended);
    
    this.emit('workflow:resumed', suspended);
  }
  
  /**
   * Recurring Workflows
   */
  
  calculateNextRun(pattern) {
    // Simple pattern parsing (could be extended)
    const now = Date.now();
    
    if (pattern.interval) {
      return now + pattern.interval;
    }
    
    if (pattern.daily) {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(pattern.hour || 0, pattern.minute || 0, 0, 0);
      return tomorrow.getTime();
    }
    
    if (pattern.weekly) {
      const nextWeek = new Date(now);
      nextWeek.setDate(nextWeek.getDate() + 7);
      return nextWeek.getTime();
    }
    
    return now + 86400000; // Default to daily
  }
  
  scheduleNextRecurrence(recurring) {
    const delay = recurring.nextRun - Date.now();
    
    if (delay <= 0) {
      // Execute immediately
      this.executeRecurring(recurring);
    } else {
      // Schedule for future
      setTimeout(() => {
        this.executeRecurring(recurring);
      }, delay);
    }
  }
  
  async executeRecurring(recurring) {
    if (!recurring.enabled) return;
    
    // Schedule the workflow
    const scheduled = await this.scheduleWorkflow(
      recurring.workflow,
      recurring.options
    );
    
    // Record execution
    recurring.executions.push({
      scheduledId: scheduled.id,
      timestamp: Date.now()
    });
    
    // Calculate and schedule next run
    recurring.nextRun = this.calculateNextRun(recurring.pattern);
    this.scheduleNextRecurrence(recurring);
  }
  
  /**
   * Cron Scheduling
   */
  
  parseCronExpression(expression) {
    // Simplified cron parsing
    // Format: "minute hour day month weekday"
    const parts = expression.split(' ');
    const now = new Date();
    
    // This is a simplified implementation
    // In production, use a proper cron parser
    const next = new Date(now);
    
    if (parts[0] !== '*') {
      next.setMinutes(parseInt(parts[0]));
    }
    
    if (parts[1] !== '*') {
      next.setHours(parseInt(parts[1]));
    }
    
    // If next time is in the past, add a day
    if (next <= now) {
      next.setDate(next.getDate() + 1);
    }
    
    return next.getTime();
  }
  
  setupCronTimer(cronJob) {
    const scheduleNextCron = () => {
      const delay = cronJob.nextRun - Date.now();
      
      if (delay <= 0) {
        // Execute immediately
        this.executeCronJob(cronJob);
        
        // Calculate next run
        cronJob.lastRun = Date.now();
        cronJob.nextRun = this.parseCronExpression(cronJob.expression);
        
        // Schedule next
        scheduleNextCron();
      } else {
        // Schedule for future
        setTimeout(() => {
          if (cronJob.enabled) {
            this.executeCronJob(cronJob);
            
            cronJob.lastRun = Date.now();
            cronJob.nextRun = this.parseCronExpression(cronJob.expression);
            
            scheduleNextCron();
          }
        }, Math.min(delay, 2147483647)); // Max timeout value
      }
    };
    
    scheduleNextCron();
  }
  
  async executeCronJob(cronJob) {
    if (!cronJob.enabled) return;
    
    await this.scheduleWorkflow(cronJob.workflow, cronJob.options);
    
    this.emit('cron:executed', cronJob);
  }
  
  /**
   * Metrics and Monitoring
   */
  
  updateWaitTime(waitTime) {
    const count = this.metrics.executed;
    this.metrics.averageWaitTime = 
      (this.metrics.averageWaitTime * (count - 1) + waitTime) / count;
  }
  
  updateTurnaroundTime(turnaroundTime) {
    const count = this.metrics.completed;
    this.metrics.averageTurnaroundTime = 
      (this.metrics.averageTurnaroundTime * (count - 1) + turnaroundTime) / count;
  }
  
  updateUtilization() {
    let totalUsed = 0;
    let totalAvailable = 0;
    
    for (const [resource, available] of Object.entries(this.resourcePool)) {
      totalAvailable += available;
      
      let used = 0;
      for (const allocation of this.resourceAllocations.values()) {
        used += allocation[resource] || 0;
      }
      
      totalUsed += used;
    }
    
    this.metrics.utilization = totalAvailable > 0 ? 
      (totalUsed / totalAvailable) * 100 : 0;
  }
  
  calculateThroughput() {
    const timeWindow = 60000; // 1 minute
    const now = Date.now();
    
    let completed = 0;
    
    for (const workflow of this.executingWorkflows.values()) {
      if (workflow.endTime && workflow.endTime > now - timeWindow) {
        completed++;
      }
    }
    
    this.metrics.throughput = completed / (timeWindow / 1000); // per second
  }
  
  /**
   * Control Methods
   */
  
  startScheduler() {
    this.scheduler.running = true;
    
    // Scheduling loop
    this.schedulingInterval = setInterval(() => {
      this.scheduleNext();
      this.calculateThroughput();
    }, 100);
    
    logger.info('⏰ Scheduler started');
  }
  
  stopScheduler() {
    this.scheduler.running = false;
    
    if (this.schedulingInterval) {
      clearInterval(this.schedulingInterval);
      this.schedulingInterval = null;
    }
    
    logger.info('⏰ Scheduler stopped');
  }
  
  pauseWorkflow(workflowId) {
    const executing = this.executingWorkflows.get(workflowId);
    
    if (executing) {
      this.suspendWorkflow(executing);
    }
  }
  
  cancelWorkflow(workflowId) {
    // Check all queues
    for (const queue of this.priorityQueues.values()) {
      const index = queue.findIndex(w => w.id === workflowId);
      if (index !== -1) {
        queue.splice(index, 1);
        this.scheduledWorkflows.delete(workflowId);
        
        this.emit('workflow:cancelled', { workflowId });
        return true;
      }
    }
    
    // Check executing
    if (this.executingWorkflows.has(workflowId)) {
      // Can't cancel executing workflow
      return false;
    }
    
    // Check suspended
    if (this.suspendedWorkflows.has(workflowId)) {
      this.suspendedWorkflows.delete(workflowId);
      
      this.emit('workflow:cancelled', { workflowId });
      return true;
    }
    
    return false;
  }
  
  /**
   * Query Methods
   */
  
  getScheduledWorkflows() {
    const workflows = [];
    
    for (const queue of this.priorityQueues.values()) {
      workflows.push(...queue);
    }
    
    return workflows;
  }
  
  getExecutingWorkflows() {
    return Array.from(this.executingWorkflows.values());
  }
  
  getSuspendedWorkflows() {
    return Array.from(this.suspendedWorkflows.values());
  }
  
  getWorkflowStatus(workflowId) {
    // Check all stores
    return this.scheduledWorkflows.get(workflowId) ||
           this.executingWorkflows.get(workflowId) ||
           this.suspendedWorkflows.get(workflowId);
  }
  
  getMetrics() {
    return {
      ...this.metrics,
      queueSizes: this.getQueueSizes(),
      resourceUtilization: this.getResourceUtilization()
    };
  }
  
  getQueueSizes() {
    const sizes = {};
    
    for (const [priority, queue] of this.priorityQueues) {
      sizes[`priority_${priority}`] = queue.length;
    }
    
    return sizes;
  }
  
  getResourceUtilization() {
    const utilization = {};
    const available = this.getAvailableResources();
    
    for (const [resource, total] of Object.entries(this.resourcePool)) {
      const used = total - (available[resource] || 0);
      utilization[resource] = {
        used,
        total,
        percentage: total > 0 ? (used / total) * 100 : 0
      };
    }
    
    return utilization;
  }
  
  /**
   * Utility Methods
   */
  
  validateScheduling(scheduled) {
    // Validate priority
    if (scheduled.priority < 0 || scheduled.priority >= this.config.priorityLevels) {
      return false;
    }
    
    // Validate resources
    if (scheduled.resources) {
      for (const amount of Object.values(scheduled.resources)) {
        if (amount < 0 || amount > 100) {
          return false;
        }
      }
    }
    
    // Validate dependencies
    if (scheduled.dependencies) {
      // Check for circular dependencies
      if (scheduled.dependencies.includes(scheduled.id)) {
        return false;
      }
    }
    
    return true;
  }
  
  estimateResources(workflow) {
    // Estimate based on workflow characteristics
    const steps = workflow.steps || [];
    const parallel = workflow.config?.parallel;
    
    return {
      cpu: parallel ? Math.min(steps.length * 10, 50) : 20,
      memory: steps.length * 5,
      io: 10,
      network: workflow.hasApiCalls ? 20 : 5
    };
  }
  
  generateScheduleId() {
    return `sched_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}

module.exports = WorkflowScheduler;
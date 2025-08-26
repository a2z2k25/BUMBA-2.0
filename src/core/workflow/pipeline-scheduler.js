/**
 * BUMBA Pipeline Scheduler
 * Advanced scheduling and orchestration for pipeline execution
 * Part of Pipeline Manager enhancement to 90%
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');

/**
 * Scheduler for pipeline operations
 */
class PipelineScheduler extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      maxConcurrentPipelines: config.maxConcurrentPipelines || 10,
      maxQueueSize: config.maxQueueSize || 100,
      schedulingInterval: config.schedulingInterval || 1000,
      priorityLevels: config.priorityLevels || 5,
      timeSlicing: config.timeSlicing !== false,
      resourceAware: config.resourceAware !== false,
      ...config
    };
    
    // Scheduling queues
    this.executionQueue = [];
    this.scheduledPipelines = new Map();
    this.recurringPipelines = new Map();
    this.delayedPipelines = new Map();
    
    // Active executions
    this.activePipelines = new Map();
    this.pausedPipelines = new Map();
    this.completedPipelines = new Map();
    
    // Resource management
    this.resourcePool = new Map();
    this.resourceAllocations = new Map();
    this.resourceConstraints = new Map();
    
    // Time windows
    this.timeWindows = new Map();
    this.blackoutPeriods = new Map();
    this.maintenanceWindows = new Map();
    
    // Dependency tracking
    this.dependencyGraph = new Map();
    this.waitingOnDependencies = new Map();
    
    // Metrics
    this.metrics = {
      pipelinesScheduled: 0,
      pipelinesExecuted: 0,
      pipelinesCompleted: 0,
      pipelinesFailed: 0,
      averageWaitTime: 0,
      averageExecutionTime: 0,
      resourceUtilization: 0
    };
    
    this.initialize();
  }
  
  /**
   * Initialize scheduler
   */
  initialize() {
    this.startSchedulingLoop();
    this.initializeResourcePool();
    this.setupTimeWindows();
    
    logger.info('📅 Pipeline Scheduler initialized');
  }
  
  /**
   * Schedule pipeline execution
   */
  async schedulePipeline(pipeline, options = {}) {
    const scheduled = {
      id: this.generateScheduleId(),
      pipelineId: pipeline.id,
      pipeline: pipeline,
      priority: options.priority || 5,
      scheduledAt: Date.now(),
      targetTime: options.targetTime || Date.now(),
      dependencies: options.dependencies || [],
      resources: options.resources || {},
      constraints: options.constraints || {},
      retries: options.retries || 3,
      timeout: options.timeout || 600000,
      state: 'queued'
    };
    
    // Validate resources
    if (this.config.resourceAware) {
      const available = await this.checkResourceAvailability(scheduled.resources);
      if (!available) {
        scheduled.state = 'waiting-resources';
        this.waitingOnResources.set(scheduled.id, scheduled);
      }
    }
    
    // Check dependencies
    if (scheduled.dependencies.length > 0) {
      const ready = await this.checkDependencies(scheduled.dependencies);
      if (!ready) {
        scheduled.state = 'waiting-dependencies';
        this.waitingOnDependencies.set(scheduled.id, scheduled);
      }
    }
    
    // Add to queue based on priority
    this.insertIntoQueue(scheduled);
    
    this.scheduledPipelines.set(scheduled.id, scheduled);
    this.metrics.pipelinesScheduled++;
    
    this.emit('pipeline:scheduled', scheduled);
    
    return scheduled;
  }
  
  /**
   * Schedule recurring pipeline
   */
  scheduleRecurringPipeline(pipeline, pattern, options = {}) {
    const recurring = {
      id: this.generateRecurringId(),
      pipelineId: pipeline.id,
      pipeline: pipeline,
      pattern: pattern, // cron expression or interval
      options: options,
      nextRun: this.calculateNextRun(pattern),
      executions: [],
      state: 'active'
    };
    
    this.recurringPipelines.set(recurring.id, recurring);
    
    // Schedule first execution
    this.scheduleNextRecurring(recurring);
    
    this.emit('pipeline:recurring:created', recurring);
    
    return recurring;
  }
  
  /**
   * Schedule delayed pipeline
   */
  scheduleDelayedPipeline(pipeline, delay, options = {}) {
    const delayed = {
      id: this.generateDelayedId(),
      pipelineId: pipeline.id,
      pipeline: pipeline,
      delay: delay,
      executeAt: Date.now() + delay,
      options: options,
      state: 'waiting'
    };
    
    this.delayedPipelines.set(delayed.id, delayed);
    
    // Set timer for execution
    setTimeout(() => {
      this.executeDelayedPipeline(delayed);
    }, delay);
    
    this.emit('pipeline:delayed:created', delayed);
    
    return delayed;
  }
  
  /**
   * Schedule pipeline chain
   */
  async schedulePipelineChain(pipelines, options = {}) {
    const chain = {
      id: this.generateChainId(),
      pipelines: pipelines,
      currentIndex: 0,
      strategy: options.strategy || 'sequential', // sequential, parallel, conditional
      continueOnError: options.continueOnError || false,
      dataFlow: options.dataFlow || 'passthrough', // passthrough, accumulate, transform
      results: [],
      state: 'initialized'
    };
    
    // Create dependency chain for sequential
    if (chain.strategy === 'sequential') {
      let previousId = null;
      
      for (const pipeline of pipelines) {
        const scheduled = await this.schedulePipeline(pipeline, {
          ...options,
          dependencies: previousId ? [previousId] : []
        });
        
        chain.results.push(scheduled);
        previousId = scheduled.id;
      }
    }
    
    // Schedule all for parallel
    if (chain.strategy === 'parallel') {
      const scheduled = await Promise.all(
        pipelines.map(p => this.schedulePipeline(p, options))
      );
      
      chain.results = scheduled;
    }
    
    this.emit('pipeline:chain:created', chain);
    
    return chain;
  }
  
  /**
   * Execute next pipeline from queue
   */
  async executeNextPipeline() {
    if (this.activePipelines.size >= this.config.maxConcurrentPipelines) {
      return;
    }
    
    const scheduled = this.getNextPipeline();
    
    if (!scheduled) {
      return;
    }
    
    // Check time windows
    if (!this.isInTimeWindow(scheduled)) {
      this.requeuePipeline(scheduled);
      return;
    }
    
    // Allocate resources
    if (this.config.resourceAware) {
      const allocated = await this.allocateResources(scheduled);
      if (!allocated) {
        this.requeuePipeline(scheduled);
        return;
      }
    }
    
    scheduled.state = 'executing';
    scheduled.startTime = Date.now();
    
    this.activePipelines.set(scheduled.id, scheduled);
    
    try {
      // Execute pipeline
      const result = await this.executePipeline(scheduled);
      
      scheduled.state = 'completed';
      scheduled.result = result;
      scheduled.endTime = Date.now();
      
      this.completedPipelines.set(scheduled.id, scheduled);
      this.metrics.pipelinesCompleted++;
      
      // Update metrics
      this.updateMetrics(scheduled);
      
      // Trigger dependent pipelines
      await this.triggerDependents(scheduled.id);
      
      this.emit('pipeline:completed', scheduled);
      
    } catch (error) {
      scheduled.state = 'failed';
      scheduled.error = error;
      scheduled.endTime = Date.now();
      
      this.metrics.pipelinesFailed++;
      
      // Handle retry
      if (scheduled.retries > 0) {
        scheduled.retries--;
        scheduled.state = 'retrying';
        this.requeuePipeline(scheduled);
      }
      
      this.emit('pipeline:failed', { scheduled, error });
      
    } finally {
      // Release resources
      if (this.config.resourceAware) {
        await this.releaseResources(scheduled);
      }
      
      this.activePipelines.delete(scheduled.id);
    }
  }
  
  /**
   * Pause pipeline execution
   */
  pausePipeline(pipelineId) {
    const active = this.activePipelines.get(pipelineId);
    
    if (active) {
      active.state = 'paused';
      active.pausedAt = Date.now();
      
      this.pausedPipelines.set(pipelineId, active);
      this.activePipelines.delete(pipelineId);
      
      this.emit('pipeline:paused', active);
      
      return true;
    }
    
    return false;
  }
  
  /**
   * Resume pipeline execution
   */
  resumePipeline(pipelineId) {
    const paused = this.pausedPipelines.get(pipelineId);
    
    if (paused) {
      paused.state = 'resuming';
      paused.resumedAt = Date.now();
      
      // Requeue with high priority
      paused.priority = 1;
      this.insertIntoQueue(paused);
      
      this.pausedPipelines.delete(pipelineId);
      
      this.emit('pipeline:resumed', paused);
      
      return true;
    }
    
    return false;
  }
  
  /**
   * Cancel pipeline execution
   */
  cancelPipeline(pipelineId) {
    // Check active pipelines
    const active = this.activePipelines.get(pipelineId);
    if (active) {
      active.state = 'cancelled';
      this.activePipelines.delete(pipelineId);
      this.emit('pipeline:cancelled', active);
      return true;
    }
    
    // Check scheduled pipelines
    const scheduled = this.scheduledPipelines.get(pipelineId);
    if (scheduled) {
      scheduled.state = 'cancelled';
      this.scheduledPipelines.delete(pipelineId);
      
      // Remove from queue
      const index = this.executionQueue.findIndex(p => p.id === pipelineId);
      if (index >= 0) {
        this.executionQueue.splice(index, 1);
      }
      
      this.emit('pipeline:cancelled', scheduled);
      return true;
    }
    
    return false;
  }
  
  /**
   * Set resource constraints
   */
  setResourceConstraints(resource, constraints) {
    this.resourceConstraints.set(resource, {
      maxConcurrent: constraints.maxConcurrent || Infinity,
      maxTotal: constraints.maxTotal || Infinity,
      cooldown: constraints.cooldown || 0,
      priority: constraints.priority || 5
    });
    
    this.emit('resource:constraints:set', { resource, constraints });
  }
  
  /**
   * Define time window
   */
  defineTimeWindow(name, window) {
    this.timeWindows.set(name, {
      name: name,
      days: window.days || [0, 1, 2, 3, 4, 5, 6], // All days
      startTime: window.startTime || '00:00',
      endTime: window.endTime || '23:59',
      timezone: window.timezone || 'UTC'
    });
    
    this.emit('timewindow:defined', { name, window });
  }
  
  /**
   * Set blackout period
   */
  setBlackoutPeriod(name, period) {
    this.blackoutPeriods.set(name, {
      name: name,
      startDate: period.startDate,
      endDate: period.endDate,
      reason: period.reason,
      affectedPipelines: period.affectedPipelines || '*'
    });
    
    this.emit('blackout:set', { name, period });
  }
  
  /**
   * Helper methods
   */
  
  startSchedulingLoop() {
    this.schedulingInterval = setInterval(() => {
      this.executeNextPipeline();
      this.checkDelayedPipelines();
      this.checkRecurringPipelines();
      this.checkWaitingPipelines();
    }, this.config.schedulingInterval);
  }
  
  initializeResourcePool() {
    // Initialize default resources
    this.resourcePool.set('cpu', { available: 100, total: 100 });
    this.resourcePool.set('memory', { available: 8192, total: 8192 });
    this.resourcePool.set('disk', { available: 100000, total: 100000 });
    this.resourcePool.set('network', { available: 1000, total: 1000 });
  }
  
  setupTimeWindows() {
    // Default time windows
    this.defineTimeWindow('business-hours', {
      days: [1, 2, 3, 4, 5], // Monday to Friday
      startTime: '09:00',
      endTime: '17:00'
    });
    
    this.defineTimeWindow('off-hours', {
      days: [0, 1, 2, 3, 4, 5, 6],
      startTime: '18:00',
      endTime: '08:00'
    });
  }
  
  insertIntoQueue(scheduled) {
    // Insert based on priority (lower number = higher priority)
    const index = this.executionQueue.findIndex(p => p.priority > scheduled.priority);
    
    if (index === -1) {
      this.executionQueue.push(scheduled);
    } else {
      this.executionQueue.splice(index, 0, scheduled);
    }
  }
  
  getNextPipeline() {
    // Check for ready pipelines in queue
    const now = Date.now();
    
    for (let i = 0; i < this.executionQueue.length; i++) {
      const scheduled = this.executionQueue[i];
      
      if (scheduled.targetTime <= now) {
        this.executionQueue.splice(i, 1);
        return scheduled;
      }
    }
    
    return null;
  }
  
  async checkResourceAvailability(resources) {
    for (const [resource, amount] of Object.entries(resources)) {
      const pool = this.resourcePool.get(resource);
      
      if (!pool || pool.available < amount) {
        return false;
      }
    }
    
    return true;
  }
  
  async checkDependencies(dependencies) {
    for (const depId of dependencies) {
      const completed = this.completedPipelines.get(depId);
      
      if (!completed || completed.state !== 'completed') {
        return false;
      }
    }
    
    return true;
  }
  
  isInTimeWindow(scheduled) {
    if (!scheduled.constraints.timeWindow) {
      return true;
    }
    
    const window = this.timeWindows.get(scheduled.constraints.timeWindow);
    if (!window) {
      return true;
    }
    
    const now = new Date();
    const dayOfWeek = now.getDay();
    
    if (!window.days.includes(dayOfWeek)) {
      return false;
    }
    
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    return currentTime >= window.startTime && currentTime <= window.endTime;
  }
  
  async allocateResources(scheduled) {
    const allocations = {};
    
    for (const [resource, amount] of Object.entries(scheduled.resources)) {
      const pool = this.resourcePool.get(resource);
      
      if (pool && pool.available >= amount) {
        pool.available -= amount;
        allocations[resource] = amount;
      } else {
        // Rollback allocations
        for (const [r, a] of Object.entries(allocations)) {
          const p = this.resourcePool.get(r);
          if (p) p.available += a;
        }
        
        return false;
      }
    }
    
    this.resourceAllocations.set(scheduled.id, allocations);
    
    return true;
  }
  
  async releaseResources(scheduled) {
    const allocations = this.resourceAllocations.get(scheduled.id);
    
    if (allocations) {
      for (const [resource, amount] of Object.entries(allocations)) {
        const pool = this.resourcePool.get(resource);
        
        if (pool) {
          pool.available = Math.min(pool.total, pool.available + amount);
        }
      }
      
      this.resourceAllocations.delete(scheduled.id);
    }
  }
  
  requeuePipeline(scheduled) {
    // Add back to queue with slight delay
    scheduled.targetTime = Date.now() + 5000;
    this.insertIntoQueue(scheduled);
  }
  
  async executePipeline(scheduled) {
    // Simulate pipeline execution
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.1) {
          resolve({ success: true, data: {} });
        } else {
          reject(new Error('Pipeline execution failed'));
        }
      }, Math.random() * 5000);
    });
  }
  
  updateMetrics(scheduled) {
    const executionTime = scheduled.endTime - scheduled.startTime;
    const waitTime = scheduled.startTime - scheduled.scheduledAt;
    
    // Update average wait time
    this.metrics.averageWaitTime = 
      (this.metrics.averageWaitTime * (this.metrics.pipelinesExecuted - 1) + waitTime) / 
      this.metrics.pipelinesExecuted;
    
    // Update average execution time
    this.metrics.averageExecutionTime = 
      (this.metrics.averageExecutionTime * (this.metrics.pipelinesExecuted - 1) + executionTime) / 
      this.metrics.pipelinesExecuted;
    
    // Update resource utilization
    let totalUsed = 0;
    let totalAvailable = 0;
    
    for (const [, pool] of this.resourcePool) {
      totalUsed += pool.total - pool.available;
      totalAvailable += pool.total;
    }
    
    this.metrics.resourceUtilization = (totalUsed / totalAvailable) * 100;
  }
  
  async triggerDependents(completedId) {
    const waiting = [];
    
    for (const [id, scheduled] of this.waitingOnDependencies) {
      if (scheduled.dependencies.includes(completedId)) {
        // Check if all dependencies are now satisfied
        const ready = await this.checkDependencies(scheduled.dependencies);
        
        if (ready) {
          waiting.push(scheduled);
          this.waitingOnDependencies.delete(id);
        }
      }
    }
    
    // Queue ready pipelines
    for (const scheduled of waiting) {
      scheduled.state = 'queued';
      this.insertIntoQueue(scheduled);
    }
  }
  
  calculateNextRun(pattern) {
    // Simple interval pattern
    if (typeof pattern === 'number') {
      return Date.now() + pattern;
    }
    
    // Cron pattern (simplified)
    const now = Date.now();
    const parts = pattern.split(' ');
    
    if (parts.length === 5) {
      // Parse cron expression
      // For simplicity, just use daily at specified hour
      const hour = parseInt(parts[1]) || 0;
      const next = new Date();
      next.setHours(hour, 0, 0, 0);
      
      if (next.getTime() <= now) {
        next.setDate(next.getDate() + 1);
      }
      
      return next.getTime();
    }
    
    return now + 3600000; // Default to 1 hour
  }
  
  scheduleNextRecurring(recurring) {
    const delay = recurring.nextRun - Date.now();
    
    if (delay > 0) {
      setTimeout(async () => {
        // Execute pipeline
        const scheduled = await this.schedulePipeline(recurring.pipeline, recurring.options);
        
        recurring.executions.push({
          scheduledId: scheduled.id,
          timestamp: Date.now()
        });
        
        // Calculate next run
        recurring.nextRun = this.calculateNextRun(recurring.pattern);
        
        // Schedule next execution
        if (recurring.state === 'active') {
          this.scheduleNextRecurring(recurring);
        }
      }, delay);
    }
  }
  
  async executeDelayedPipeline(delayed) {
    delayed.state = 'executing';
    
    const scheduled = await this.schedulePipeline(delayed.pipeline, delayed.options);
    
    delayed.scheduledId = scheduled.id;
    delayed.state = 'scheduled';
    
    this.delayedPipelines.delete(delayed.id);
  }
  
  checkDelayedPipelines() {
    const now = Date.now();
    
    for (const [id, delayed] of this.delayedPipelines) {
      if (delayed.executeAt <= now && delayed.state === 'waiting') {
        this.executeDelayedPipeline(delayed);
      }
    }
  }
  
  checkRecurringPipelines() {
    // Recurring pipelines are handled by their own timers
  }
  
  checkWaitingPipelines() {
    // Check pipelines waiting on resources
    for (const [id, scheduled] of this.waitingOnResources) {
      this.checkResourceAvailability(scheduled.resources).then(available => {
        if (available) {
          scheduled.state = 'queued';
          this.insertIntoQueue(scheduled);
          this.waitingOnResources.delete(id);
        }
      });
    }
  }
  
  /**
   * Generate IDs
   */
  generateScheduleId() {
    return `sched_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
  
  generateRecurringId() {
    return `recur_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
  
  generateDelayedId() {
    return `delay_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
  
  generateChainId() {
    return `chain_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
  
  /**
   * Get metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      queueLength: this.executionQueue.length,
      activePipelines: this.activePipelines.size,
      pausedPipelines: this.pausedPipelines.size,
      completedPipelines: this.completedPipelines.size,
      recurringPipelines: this.recurringPipelines.size,
      delayedPipelines: this.delayedPipelines.size,
      resourcePools: Array.from(this.resourcePool.entries()).map(([name, pool]) => ({
        name,
        ...pool,
        utilization: ((pool.total - pool.available) / pool.total) * 100
      }))
    };
  }
}

module.exports = PipelineScheduler;
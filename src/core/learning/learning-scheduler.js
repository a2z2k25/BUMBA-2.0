/**
 * BUMBA Learning Scheduler
 * Advanced scheduling for model training and updates
 * Part of ML Learning System enhancement to 90%
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');

/**
 * Scheduler for ML training and model updates
 */
class LearningScheduler extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      batchSize: config.batchSize || 32,
      miniBatchSize: config.miniBatchSize || 8,
      maxConcurrentTraining: config.maxConcurrentTraining || 3,
      priorityLevels: config.priorityLevels || 5,
      schedulingAlgorithm: config.schedulingAlgorithm || 'adaptive',
      resourceLimit: config.resourceLimit || 100,
      adaptiveScheduling: config.adaptiveScheduling !== false,
      ...config
    };
    
    // Training queues
    this.trainingQueues = new Map();
    this.scheduledJobs = new Map();
    this.activeJobs = new Map();
    this.completedJobs = new Map();
    
    // Resource management
    this.resourcePool = {
      cpu: 100,
      memory: 100,
      gpu: 100
    };
    this.resourceAllocations = new Map();
    
    // Scheduling state
    this.scheduler = {
      running: false,
      currentEpoch: 0,
      lastSchedule: Date.now(),
      adaptiveParams: {
        learningRate: 0.01,
        momentum: 0.9,
        batchSizeMultiplier: 1.0
      }
    };
    
    // Training schedules
    this.schedules = new Map();
    this.recurringTraining = new Map();
    this.epochSchedules = new Map();
    
    // Performance tracking
    this.metrics = {
      jobsScheduled: 0,
      jobsCompleted: 0,
      jobsFailed: 0,
      averageTrainingTime: 0,
      resourceUtilization: 0,
      modelImprovements: 0
    };
    
    this.initialize();
  }
  
  /**
   * Initialize scheduler
   */
  initialize() {
    // Initialize priority queues
    for (let i = 0; i < this.config.priorityLevels; i++) {
      this.trainingQueues.set(i, []);
    }
    
    // Start scheduling loop
    this.startScheduler();
    
    logger.info('🗓️ Learning Scheduler initialized');
  }
  
  /**
   * Schedule a training job
   */
  async scheduleTraining(job) {
    const scheduled = {
      id: job.id || this.generateJobId(),
      type: job.type || 'training',
      model: job.model,
      data: job.data,
      config: job.config || {},
      priority: job.priority || 2,
      resources: this.estimateResources(job),
      dependencies: job.dependencies || [],
      deadline: job.deadline,
      scheduled: Date.now(),
      state: 'pending',
      attempts: 0,
      metadata: job.metadata || {}
    };
    
    // Validate scheduling
    if (!this.validateScheduling(scheduled)) {
      throw new Error('Invalid training job');
    }
    
    // Check dependencies
    if (scheduled.dependencies.length > 0) {
      scheduled.state = 'waiting';
      this.scheduledJobs.set(scheduled.id, scheduled);
      this.setupDependencyWatcher(scheduled);
      
      this.emit('job:waiting', scheduled);
      return scheduled;
    }
    
    // Add to priority queue
    this.enqueueJob(scheduled);
    
    this.metrics.jobsScheduled++;
    
    this.emit('job:scheduled', scheduled);
    logger.info(`📅 Scheduled training job ${scheduled.id} with priority ${scheduled.priority}`);
    
    return scheduled;
  }
  
  /**
   * Schedule recurring training
   */
  scheduleRecurringTraining(model, interval, config = {}) {
    const recurring = {
      id: this.generateJobId(),
      model,
      interval,
      config,
      nextRun: Date.now() + interval,
      enabled: true,
      executions: []
    };
    
    this.recurringTraining.set(recurring.id, recurring);
    
    // Schedule first execution
    this.scheduleNextRecurrence(recurring);
    
    logger.info(`🔁 Scheduled recurring training for ${model} every ${interval}ms`);
    
    return recurring;
  }
  
  /**
   * Schedule epoch-based training
   */
  scheduleEpochTraining(model, epochs, config = {}) {
    const epochSchedule = {
      id: this.generateJobId(),
      model,
      totalEpochs: epochs,
      currentEpoch: 0,
      config,
      batchSchedule: this.createBatchSchedule(epochs, config),
      state: 'scheduled'
    };
    
    this.epochSchedules.set(epochSchedule.id, epochSchedule);
    
    // Start epoch training
    this.startEpochTraining(epochSchedule);
    
    return epochSchedule;
  }
  
  /**
   * Adaptive scheduling based on performance
   */
  async adaptScheduling(performance) {
    if (!this.config.adaptiveScheduling) return;
    
    const { loss, accuracy, convergenceRate } = performance;
    
    // Adapt learning rate
    if (convergenceRate < 0.01) {
      // Slow convergence - increase learning rate
      this.scheduler.adaptiveParams.learningRate *= 1.1;
    } else if (loss > performance.previousLoss) {
      // Loss increasing - decrease learning rate
      this.scheduler.adaptiveParams.learningRate *= 0.9;
    }
    
    // Adapt batch size
    if (performance.memoryUsage < 50) {
      // Low memory usage - increase batch size
      this.scheduler.adaptiveParams.batchSizeMultiplier = Math.min(2.0, 
        this.scheduler.adaptiveParams.batchSizeMultiplier * 1.2
      );
    } else if (performance.memoryUsage > 80) {
      // High memory usage - decrease batch size
      this.scheduler.adaptiveParams.batchSizeMultiplier = Math.max(0.5,
        this.scheduler.adaptiveParams.batchSizeMultiplier * 0.8
      );
    }
    
    // Adapt scheduling priority
    if (accuracy < 0.5) {
      // Poor accuracy - increase training priority
      this.increasePriority('accuracy_improvement');
    }
    
    logger.info('📊 Adapted scheduling parameters based on performance');
    
    this.emit('scheduling:adapted', {
      learningRate: this.scheduler.adaptiveParams.learningRate,
      batchSizeMultiplier: this.scheduler.adaptiveParams.batchSizeMultiplier
    });
  }
  
  /**
   * Schedule distributed training
   */
  async scheduleDistributedTraining(job) {
    const workers = job.workers || 2;
    const dataSplits = this.splitDataForWorkers(job.data, workers);
    const distributedJobs = [];
    
    for (let i = 0; i < workers; i++) {
      const workerJob = {
        ...job,
        id: `${job.id}_worker_${i}`,
        data: dataSplits[i],
        worker: i,
        totalWorkers: workers,
        synchronization: job.synchronization || 'async'
      };
      
      const scheduled = await this.scheduleTraining(workerJob);
      distributedJobs.push(scheduled);
    }
    
    // Create aggregation job
    const aggregationJob = {
      id: `${job.id}_aggregation`,
      type: 'aggregation',
      dependencies: distributedJobs.map(j => j.id),
      model: job.model,
      priority: job.priority || 2
    };
    
    await this.scheduleTraining(aggregationJob);
    
    return {
      id: job.id,
      type: 'distributed',
      workers: distributedJobs,
      aggregation: aggregationJob
    };
  }
  
  /**
   * Schedule hyperparameter tuning
   */
  async scheduleHyperparameterTuning(model, searchSpace, config = {}) {
    const trials = config.trials || 20;
    const strategy = config.strategy || 'random';
    const tuningJobs = [];
    
    // Generate hyperparameter combinations
    const combinations = this.generateHyperparameterCombinations(
      searchSpace, 
      trials, 
      strategy
    );
    
    // Schedule training for each combination
    for (const [i, params] of combinations.entries()) {
      const job = {
        id: `${model}_tuning_${i}`,
        type: 'hyperparameter_tuning',
        model,
        config: {
          ...config,
          hyperparameters: params
        },
        priority: 3, // Medium priority
        metadata: {
          trial: i,
          totalTrials: trials,
          searchSpace,
          strategy
        }
      };
      
      const scheduled = await this.scheduleTraining(job);
      tuningJobs.push(scheduled);
    }
    
    // Create selection job
    const selectionJob = {
      id: `${model}_tuning_selection`,
      type: 'hyperparameter_selection',
      dependencies: tuningJobs.map(j => j.id),
      model,
      priority: 1 // High priority
    };
    
    await this.scheduleTraining(selectionJob);
    
    return {
      model,
      trials: tuningJobs,
      selection: selectionJob
    };
  }
  
  /**
   * Schedule curriculum learning
   */
  async scheduleCurriculumLearning(model, curriculum, config = {}) {
    const stages = curriculum.stages || [];
    const scheduledStages = [];
    let previousStageId = null;
    
    for (const [i, stage] of stages.entries()) {
      const stageJob = {
        id: `${model}_curriculum_stage_${i}`,
        type: 'curriculum_learning',
        model,
        data: stage.data,
        config: {
          ...config,
          ...stage.config,
          difficulty: stage.difficulty || i / stages.length
        },
        dependencies: previousStageId ? [previousStageId] : [],
        priority: 2,
        metadata: {
          stage: i,
          totalStages: stages.length,
          stageName: stage.name
        }
      };
      
      const scheduled = await this.scheduleTraining(stageJob);
      scheduledStages.push(scheduled);
      previousStageId = scheduled.id;
    }
    
    return {
      model,
      curriculum,
      stages: scheduledStages
    };
  }
  
  /**
   * Main scheduling algorithm
   */
  async scheduleNext() {
    if (!this.scheduler.running) return;
    
    // Check resource availability
    const availableResources = this.getAvailableResources();
    
    // Check concurrent limit
    if (this.activeJobs.size >= this.config.maxConcurrentTraining) {
      return;
    }
    
    // Select next job based on algorithm
    const selected = this.selectNextJob(availableResources);
    
    if (!selected) {
      return;
    }
    
    // Allocate resources
    if (!this.allocateResources(selected)) {
      this.postponeJob(selected);
      return;
    }
    
    // Execute job
    await this.executeJob(selected);
  }
  
  /**
   * Select next job based on scheduling algorithm
   */
  selectNextJob(availableResources) {
    switch (this.config.schedulingAlgorithm) {
      case 'priority':
        return this.selectByPriority(availableResources);
      
      case 'fifo':
        return this.selectFIFO(availableResources);
      
      case 'deadline':
        return this.selectByDeadline(availableResources);
      
      case 'adaptive':
        return this.selectAdaptive(availableResources);
      
      case 'fair':
        return this.selectFairShare(availableResources);
      
      default:
        return this.selectByPriority(availableResources);
    }
  }
  
  /**
   * Adaptive job selection
   */
  selectAdaptive(availableResources) {
    // Combine multiple factors for selection
    const candidates = [];
    
    for (const queue of this.trainingQueues.values()) {
      for (const job of queue) {
        if (this.canAllocateResources(job, availableResources)) {
          const score = this.calculateAdaptiveScore(job);
          candidates.push({ job, score });
        }
      }
    }
    
    if (candidates.length === 0) return null;
    
    // Select job with highest score
    candidates.sort((a, b) => b.score - a.score);
    const selected = candidates[0].job;
    
    // Remove from queue
    this.removeFromQueue(selected);
    
    return selected;
  }
  
  calculateAdaptiveScore(job) {
    let score = 0;
    
    // Priority factor
    score += (this.config.priorityLevels - job.priority) * 10;
    
    // Deadline factor
    if (job.deadline) {
      const urgency = 1 / Math.max(1, job.deadline - Date.now());
      score += urgency * 100;
    }
    
    // Resource efficiency factor
    const efficiency = this.calculateResourceEfficiency(job);
    score += efficiency * 5;
    
    // Model importance factor
    if (job.metadata.modelImportance) {
      score += job.metadata.modelImportance * 20;
    }
    
    // Waiting time factor
    const waitTime = Date.now() - job.scheduled;
    score += waitTime / 60000; // 1 point per minute
    
    return score;
  }
  
  /**
   * Execute training job
   */
  async executeJob(job) {
    job.state = 'executing';
    job.startTime = Date.now();
    
    this.activeJobs.set(job.id, job);
    
    this.emit('job:executing', job);
    
    try {
      // Adapt parameters if needed
      if (this.config.adaptiveScheduling) {
        job.config = this.applyAdaptiveParameters(job.config);
      }
      
      // Execute training
      const result = await this.executeTraining(job);
      
      // Complete job
      await this.completeJob(job, result);
      
    } catch (error) {
      await this.handleJobError(job, error);
    }
  }
  
  /**
   * Execute actual training (delegate to ML system)
   */
  async executeTraining(job) {
    // This would normally delegate to the ML learning system
    // Simulated execution
    return new Promise((resolve) => {
      const duration = Math.random() * 10000 + 5000;
      
      setTimeout(() => {
        resolve({
          success: true,
          duration,
          metrics: {
            loss: Math.random() * 0.5,
            accuracy: 0.5 + Math.random() * 0.5,
            epochs: job.config.epochs || 10
          }
        });
      }, duration);
    });
  }
  
  /**
   * Complete job execution
   */
  async completeJob(job, result) {
    job.state = 'completed';
    job.endTime = Date.now();
    job.result = result;
    job.duration = job.endTime - job.startTime;
    
    // Release resources
    this.releaseResources(job);
    
    // Move to completed
    this.activeJobs.delete(job.id);
    this.completedJobs.set(job.id, job);
    
    // Update metrics
    this.updateMetrics(job, result);
    
    // Check dependent jobs
    this.checkDependents(job);
    
    this.emit('job:completed', { job, result });
    
    // Schedule next
    this.scheduleNext();
  }
  
  /**
   * Handle job error
   */
  async handleJobError(job, error) {
    job.state = 'failed';
    job.error = error;
    job.attempts++;
    
    // Release resources
    this.releaseResources(job);
    
    // Remove from active
    this.activeJobs.delete(job.id);
    
    // Check retry policy
    if (job.attempts < (job.config.maxRetries || 3)) {
      // Reschedule with lower priority
      job.priority = Math.min(
        job.priority + 1,
        this.config.priorityLevels - 1
      );
      job.state = 'pending';
      
      this.enqueueJob(job);
      
      logger.warn(`Rescheduling failed job ${job.id} (attempt ${job.attempts})`);
    } else {
      this.metrics.jobsFailed++;
      this.emit('job:failed', { job, error });
    }
    
    // Schedule next
    this.scheduleNext();
  }
  
  /**
   * Helper methods
   */
  
  enqueueJob(job) {
    const queue = this.trainingQueues.get(job.priority);
    
    if (!queue) {
      throw new Error(`Invalid priority level: ${job.priority}`);
    }
    
    queue.push(job);
    this.scheduledJobs.set(job.id, job);
    
    // Trigger scheduling
    this.scheduleNext();
  }
  
  removeFromQueue(job) {
    const queue = this.trainingQueues.get(job.priority);
    const index = queue.indexOf(job);
    
    if (index !== -1) {
      queue.splice(index, 1);
    }
  }
  
  selectByPriority(availableResources) {
    for (let priority = 0; priority < this.config.priorityLevels; priority++) {
      const queue = this.trainingQueues.get(priority);
      
      for (let i = 0; i < queue.length; i++) {
        const job = queue[i];
        
        if (this.canAllocateResources(job, availableResources)) {
          queue.splice(i, 1);
          return job;
        }
      }
    }
    
    return null;
  }
  
  selectByDeadline(availableResources) {
    let earliestDeadline = null;
    let selectedJob = null;
    
    for (const queue of this.trainingQueues.values()) {
      for (const job of queue) {
        if (!job.deadline) continue;
        if (!this.canAllocateResources(job, availableResources)) continue;
        
        if (!earliestDeadline || job.deadline < earliestDeadline) {
          earliestDeadline = job.deadline;
          selectedJob = job;
        }
      }
    }
    
    if (selectedJob) {
      this.removeFromQueue(selectedJob);
      return selectedJob;
    }
    
    return this.selectByPriority(availableResources);
  }
  
  createBatchSchedule(epochs, config) {
    const schedule = [];
    const batchSize = config.batchSize || this.config.batchSize;
    
    for (let epoch = 0; epoch < epochs; epoch++) {
      schedule.push({
        epoch,
        batchSize: Math.floor(batchSize * this.scheduler.adaptiveParams.batchSizeMultiplier),
        learningRate: this.scheduler.adaptiveParams.learningRate * Math.pow(0.95, epoch),
        momentum: this.scheduler.adaptiveParams.momentum
      });
    }
    
    return schedule;
  }
  
  splitDataForWorkers(data, workers) {
    const splits = [];
    const chunkSize = Math.ceil(data.length / workers);
    
    for (let i = 0; i < workers; i++) {
      splits.push(data.slice(i * chunkSize, (i + 1) * chunkSize));
    }
    
    return splits;
  }
  
  generateHyperparameterCombinations(searchSpace, trials, strategy) {
    const combinations = [];
    
    if (strategy === 'grid') {
      // Grid search
      const keys = Object.keys(searchSpace);
      const values = keys.map(k => searchSpace[k]);
      
      // Generate all combinations (limited by trials)
      // Simplified for demonstration
      for (let i = 0; i < Math.min(trials, 100); i++) {
        const combo = {};
        keys.forEach((key, idx) => {
          const options = values[idx];
          combo[key] = options[i % options.length];
        });
        combinations.push(combo);
      }
    } else if (strategy === 'random') {
      // Random search
      for (let i = 0; i < trials; i++) {
        const combo = {};
        
        for (const [key, options] of Object.entries(searchSpace)) {
          if (Array.isArray(options)) {
            combo[key] = options[Math.floor(Math.random() * options.length)];
          } else if (typeof options === 'object') {
            // Range
            combo[key] = options.min + Math.random() * (options.max - options.min);
          }
        }
        
        combinations.push(combo);
      }
    } else if (strategy === 'bayesian') {
      // Simplified Bayesian optimization
      // Would use Gaussian processes in production
      for (let i = 0; i < trials; i++) {
        const combo = {};
        
        for (const [key, options] of Object.entries(searchSpace)) {
          if (Array.isArray(options)) {
            // Prefer middle values initially
            const idx = Math.floor(options.length / 2) + 
              Math.floor((Math.random() - 0.5) * options.length * 0.5);
            combo[key] = options[Math.max(0, Math.min(options.length - 1, idx))];
          } else if (typeof options === 'object') {
            // Sample from normal distribution centered at middle
            const middle = (options.min + options.max) / 2;
            const range = options.max - options.min;
            combo[key] = middle + (Math.random() - 0.5) * range * 0.5;
            combo[key] = Math.max(options.min, Math.min(options.max, combo[key]));
          }
        }
        
        combinations.push(combo);
      }
    }
    
    return combinations;
  }
  
  applyAdaptiveParameters(config) {
    return {
      ...config,
      learningRate: (config.learningRate || 0.01) * 
        this.scheduler.adaptiveParams.learningRate,
      batchSize: Math.floor((config.batchSize || this.config.batchSize) * 
        this.scheduler.adaptiveParams.batchSizeMultiplier),
      momentum: config.momentum || this.scheduler.adaptiveParams.momentum
    };
  }
  
  /**
   * Resource management
   */
  
  getAvailableResources() {
    const available = { ...this.resourcePool };
    
    for (const allocation of this.resourceAllocations.values()) {
      for (const [resource, amount] of Object.entries(allocation)) {
        available[resource] = (available[resource] || 0) - amount;
      }
    }
    
    return available;
  }
  
  canAllocateResources(job, available) {
    const required = job.resources || {};
    
    for (const [resource, amount] of Object.entries(required)) {
      if ((available[resource] || 0) < amount) {
        return false;
      }
    }
    
    return true;
  }
  
  allocateResources(job) {
    const required = job.resources || {};
    const available = this.getAvailableResources();
    
    if (!this.canAllocateResources(job, available)) {
      return false;
    }
    
    this.resourceAllocations.set(job.id, required);
    
    return true;
  }
  
  releaseResources(job) {
    this.resourceAllocations.delete(job.id);
  }
  
  estimateResources(job) {
    const base = {
      cpu: 20,
      memory: 30,
      gpu: 0
    };
    
    // Adjust based on job type
    if (job.type === 'deep_learning' || job.type === 'neural_network') {
      base.gpu = 50;
      base.memory = 50;
    }
    
    if (job.type === 'hyperparameter_tuning') {
      base.cpu = 40;
      base.memory = 20;
    }
    
    if (job.type === 'distributed') {
      base.cpu = 60;
      base.memory = 40;
    }
    
    // Adjust based on data size
    if (job.data && job.data.length > 10000) {
      base.memory += 20;
    }
    
    return base;
  }
  
  calculateResourceEfficiency(job) {
    const required = job.resources || {};
    const available = this.getAvailableResources();
    
    let efficiency = 0;
    let count = 0;
    
    for (const [resource, amount] of Object.entries(required)) {
      const utilization = amount / (available[resource] || 100);
      efficiency += utilization;
      count++;
    }
    
    return count > 0 ? efficiency / count : 0;
  }
  
  /**
   * Metrics and monitoring
   */
  
  updateMetrics(job, result) {
    this.metrics.jobsCompleted++;
    
    // Update average training time
    const count = this.metrics.jobsCompleted;
    this.metrics.averageTrainingTime = 
      (this.metrics.averageTrainingTime * (count - 1) + job.duration) / count;
    
    // Check for model improvement
    if (result.metrics && result.metrics.accuracy > (job.metadata.previousAccuracy || 0)) {
      this.metrics.modelImprovements++;
    }
    
    // Update resource utilization
    this.updateResourceUtilization();
  }
  
  updateResourceUtilization() {
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
    
    this.metrics.resourceUtilization = totalAvailable > 0 ? 
      (totalUsed / totalAvailable) * 100 : 0;
  }
  
  /**
   * Control methods
   */
  
  startScheduler() {
    this.scheduler.running = true;
    
    // Scheduling loop
    this.schedulingInterval = setInterval(() => {
      this.scheduleNext();
    }, 1000);
    
    logger.info('🗓️ Learning Scheduler started');
  }
  
  stopScheduler() {
    this.scheduler.running = false;
    
    if (this.schedulingInterval) {
      clearInterval(this.schedulingInterval);
    }
    
    logger.info('🗓️ Learning Scheduler stopped');
  }
  
  getMetrics() {
    return {
      ...this.metrics,
      activeJobs: this.activeJobs.size,
      queuedJobs: this.getQueuedJobCount(),
      completedJobs: this.completedJobs.size,
      resourceUtilization: this.getResourceUtilization()
    };
  }
  
  getQueuedJobCount() {
    let count = 0;
    
    for (const queue of this.trainingQueues.values()) {
      count += queue.length;
    }
    
    return count;
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
   * Utility methods
   */
  
  validateScheduling(job) {
    if (!job.model) return false;
    
    if (job.priority < 0 || job.priority >= this.config.priorityLevels) {
      return false;
    }
    
    return true;
  }
  
  setupDependencyWatcher(job) {
    const checkDependencies = () => {
      const allCompleted = job.dependencies.every(depId => 
        this.completedJobs.has(depId)
      );
      
      if (allCompleted) {
        job.state = 'pending';
        this.enqueueJob(job);
        
        logger.info(`Dependencies satisfied for job ${job.id}`);
      }
    };
    
    // Periodic check
    const interval = setInterval(() => {
      checkDependencies();
      
      if (job.state !== 'waiting') {
        clearInterval(interval);
      }
    }, 1000);
  }
  
  checkDependents(completed) {
    for (const job of this.scheduledJobs.values()) {
      if (job.state === 'waiting' && 
          job.dependencies.includes(completed.id)) {
        this.setupDependencyWatcher(job);
      }
    }
  }
  
  scheduleNextRecurrence(recurring) {
    const delay = recurring.nextRun - Date.now();
    
    if (delay <= 0) {
      this.executeRecurring(recurring);
    } else {
      setTimeout(() => {
        this.executeRecurring(recurring);
      }, delay);
    }
  }
  
  async executeRecurring(recurring) {
    if (!recurring.enabled) return;
    
    const job = {
      model: recurring.model,
      type: 'recurring',
      config: recurring.config,
      priority: 2
    };
    
    const scheduled = await this.scheduleTraining(job);
    
    recurring.executions.push({
      jobId: scheduled.id,
      timestamp: Date.now()
    });
    
    recurring.nextRun = Date.now() + recurring.interval;
    this.scheduleNextRecurrence(recurring);
  }
  
  startEpochTraining(epochSchedule) {
    const executeEpoch = async () => {
      if (epochSchedule.currentEpoch >= epochSchedule.totalEpochs) {
        epochSchedule.state = 'completed';
        this.emit('epoch:training:completed', epochSchedule);
        return;
      }
      
      const epochConfig = epochSchedule.batchSchedule[epochSchedule.currentEpoch];
      
      const job = {
        model: epochSchedule.model,
        type: 'epoch',
        config: {
          ...epochSchedule.config,
          ...epochConfig,
          epoch: epochSchedule.currentEpoch
        },
        priority: 2,
        metadata: {
          epochSchedule: epochSchedule.id,
          currentEpoch: epochSchedule.currentEpoch,
          totalEpochs: epochSchedule.totalEpochs
        }
      };
      
      const scheduled = await this.scheduleTraining(job);
      
      // Wait for completion
      const checkCompletion = setInterval(() => {
        if (this.completedJobs.has(scheduled.id)) {
          clearInterval(checkCompletion);
          epochSchedule.currentEpoch++;
          executeEpoch();
        }
      }, 1000);
    };
    
    executeEpoch();
  }
  
  increasePriority(reason) {
    // Adjust queue priorities based on reason
    logger.info(`Increasing training priority: ${reason}`);
  }
  
  postponeJob(job) {
    job.priority = Math.min(job.priority + 1, this.config.priorityLevels - 1);
    this.enqueueJob(job);
  }
  
  selectFIFO(availableResources) {
    for (const queue of this.trainingQueues.values()) {
      if (queue.length > 0) {
        const job = queue[0];
        
        if (this.canAllocateResources(job, availableResources)) {
          queue.shift();
          return job;
        }
      }
    }
    
    return null;
  }
  
  selectFairShare(availableResources) {
    // Round-robin through models
    const modelCounts = new Map();
    
    for (const job of this.completedJobs.values()) {
      const count = modelCounts.get(job.model) || 0;
      modelCounts.set(job.model, count + 1);
    }
    
    // Find model with least executions
    let selectedJob = null;
    let minCount = Infinity;
    
    for (const queue of this.trainingQueues.values()) {
      for (const job of queue) {
        if (this.canAllocateResources(job, availableResources)) {
          const count = modelCounts.get(job.model) || 0;
          
          if (count < minCount) {
            minCount = count;
            selectedJob = job;
          }
        }
      }
    }
    
    if (selectedJob) {
      this.removeFromQueue(selectedJob);
      return selectedJob;
    }
    
    return null;
  }
  
  generateJobId() {
    return `job_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}

module.exports = LearningScheduler;
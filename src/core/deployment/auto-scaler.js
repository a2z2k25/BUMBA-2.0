/**
 * Auto Scaler
 * Automatic scaling based on load and performance metrics
 * Sprint 41-44 - Deployment & Scaling
 */

const cluster = require('cluster');
const os = require('os');
const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');
const { metrics } = require('../monitoring/metrics-collector');
const { performanceProfiler } = require('../performance/performance-profiler');

class AutoScaler extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      minWorkers: options.minWorkers || 2,
      maxWorkers: options.maxWorkers || os.cpus().length,
      targetCPU: options.targetCPU || 70, // Target CPU %
      targetMemory: options.targetMemory || 80, // Target Memory %
      targetResponseTime: options.targetResponseTime || 100, // ms
      scaleUpThreshold: options.scaleUpThreshold || 0.8,
      scaleDownThreshold: options.scaleDownThreshold || 0.3,
      cooldownPeriod: options.cooldownPeriod || 60000, // 1 minute
      checkInterval: options.checkInterval || 10000 // 10 seconds
    };
    
    // Scaling state
    this.workers = new Map();
    this.scaling = {
      isScaling: false,
      lastScaleTime: 0,
      scaleHistory: []
    };
    
    // Metrics
    this.metrics = {
      cpuUsage: [],
      memoryUsage: [],
      responseTime: [],
      requestRate: []
    };
    
    // Statistics
    this.stats = {
      scaleUpEvents: 0,
      scaleDownEvents: 0,
      workersCreated: 0,
      workersDestroyed: 0
    };
    
    // Initialize if master
    if (cluster.isMaster) {
      this.initializeMaster();
    }
  }
  
  /**
   * Initialize master process
   */
  initializeMaster() {
    // Setup cluster events
    cluster.on('online', (worker) => {
      this.handleWorkerOnline(worker);
    });
    
    cluster.on('exit', (worker, code, signal) => {
      this.handleWorkerExit(worker, code, signal);
    });
    
    cluster.on('message', (worker, message) => {
      this.handleWorkerMessage(worker, message);
    });
    
    // Start initial workers
    this.startInitialWorkers();
    
    // Start monitoring
    this.startMonitoring();
  }
  
  /**
   * Start initial workers
   */
  startInitialWorkers() {
    const initialCount = Math.min(this.options.minWorkers, this.options.maxWorkers);
    
    for (let i = 0; i < initialCount; i++) {
      this.createWorker();
    }
    
    logger.info(`Started ${initialCount} initial workers`);
  }
  
  /**
   * Create new worker
   */
  createWorker() {
    const worker = cluster.fork();
    
    this.workers.set(worker.id, {
      id: worker.id,
      pid: worker.process.pid,
      startTime: Date.now(),
      requests: 0,
      errors: 0,
      responseTime: []
    });
    
    this.stats.workersCreated++;
    
    this.emit('worker:created', { id: worker.id, pid: worker.process.pid });
    
    return worker;
  }
  
  /**
   * Handle worker online
   */
  handleWorkerOnline(worker) {
    const workerData = this.workers.get(worker.id);
    if (workerData) {
      workerData.online = true;
      workerData.onlineTime = Date.now();
    }
    
    logger.info(`Worker ${worker.id} (PID: ${worker.process.pid}) is online`);
    
    this.emit('worker:online', { id: worker.id });
  }
  
  /**
   * Handle worker exit
   */
  handleWorkerExit(worker, code, signal) {
    const workerData = this.workers.get(worker.id);
    
    if (workerData) {
      logger.warn(`Worker ${worker.id} died (${signal || code})`);
      
      this.workers.delete(worker.id);
      this.stats.workersDestroyed++;
      
      // Replace worker if not scaling down
      if (!this.scaling.isScaling && this.workers.size < this.options.minWorkers) {
        logger.info('Replacing dead worker');
        this.createWorker();
      }
    }
    
    this.emit('worker:exit', { id: worker.id, code, signal });
  }
  
  /**
   * Handle worker message
   */
  handleWorkerMessage(worker, message) {
    if (!message || !message.type) return;
    
    const workerData = this.workers.get(worker.id);
    if (!workerData) return;
    
    switch (message.type) {
      case 'metrics':
        this.updateWorkerMetrics(worker.id, message.data);
        break;
        
      case 'request':
        workerData.requests++;
        if (message.data.responseTime) {
          workerData.responseTime.push(message.data.responseTime);
          // Keep last 100 response times
          if (workerData.responseTime.length > 100) {
            workerData.responseTime.shift();
          }
        }
        break;
        
      case 'error':
        workerData.errors++;
        break;
    }
  }
  
  /**
   * Update worker metrics
   */
  updateWorkerMetrics(workerId, metrics) {
    const workerData = this.workers.get(workerId);
    if (!workerData) return;
    
    workerData.lastMetrics = {
      ...metrics,
      timestamp: Date.now()
    };
  }
  
  /**
   * Start monitoring
   */
  startMonitoring() {
    this.monitorInterval = setInterval(() => {
      this.checkScaling();
    }, this.options.checkInterval);
  }
  
  /**
   * Check if scaling needed
   */
  async checkScaling() {
    if (this.scaling.isScaling) return;
    
    // Check cooldown
    if (Date.now() - this.scaling.lastScaleTime < this.options.cooldownPeriod) {
      return;
    }
    
    // Collect metrics
    const metrics = await this.collectMetrics();
    
    // Store metrics history
    this.metrics.cpuUsage.push(metrics.cpu);
    this.metrics.memoryUsage.push(metrics.memory);
    this.metrics.responseTime.push(metrics.avgResponseTime);
    this.metrics.requestRate.push(metrics.requestRate);
    
    // Keep last 10 samples
    Object.keys(this.metrics).forEach(key => {
      if (this.metrics[key].length > 10) {
        this.metrics[key].shift();
      }
    });
    
    // Calculate averages
    const avgCPU = this.average(this.metrics.cpuUsage);
    const avgMemory = this.average(this.metrics.memoryUsage);
    const avgResponseTime = this.average(this.metrics.responseTime);
    
    // Determine scaling action
    const scalingDecision = this.makeScalingDecision({
      cpu: avgCPU,
      memory: avgMemory,
      responseTime: avgResponseTime,
      workerCount: this.workers.size
    });
    
    if (scalingDecision.action !== 'none') {
      await this.executeScaling(scalingDecision);
    }
  }
  
  /**
   * Collect metrics from all workers
   */
  async collectMetrics() {
    const workerMetrics = [];
    let totalRequests = 0;
    let totalResponseTime = 0;
    let responseCount = 0;
    
    for (const [, workerData] of this.workers) {
      totalRequests += workerData.requests;
      
      if (workerData.responseTime.length > 0) {
        const avgWorkerResponse = this.average(workerData.responseTime);
        totalResponseTime += avgWorkerResponse * workerData.responseTime.length;
        responseCount += workerData.responseTime.length;
      }
      
      if (workerData.lastMetrics) {
        workerMetrics.push(workerData.lastMetrics);
      }
    }
    
    // Get system metrics
    const cpuUsage = await this.getCPUUsage();
    const memUsage = process.memoryUsage();
    const memPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    
    return {
      cpu: cpuUsage,
      memory: memPercent,
      avgResponseTime: responseCount > 0 ? totalResponseTime / responseCount : 0,
      requestRate: totalRequests / (this.options.checkInterval / 1000),
      workerMetrics
    };
  }
  
  /**
   * Get CPU usage percentage
   */
  async getCPUUsage() {
    const startUsage = process.cpuUsage();
    const startTime = process.hrtime();
    
    // Wait 100ms to measure
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const endUsage = process.cpuUsage(startUsage);
    const endTime = process.hrtime(startTime);
    
    const elapsedTime = endTime[0] * 1000 + endTime[1] / 1000000; // ms
    const elapsedCPU = (endUsage.user + endUsage.system) / 1000; // ms
    
    return (elapsedCPU / elapsedTime) * 100;
  }
  
  /**
   * Make scaling decision
   */
  makeScalingDecision(metrics) {
    const decision = {
      action: 'none',
      reason: '',
      targetWorkers: this.workers.size
    };
    
    // Check if scale up needed
    if (metrics.cpu > this.options.targetCPU * this.options.scaleUpThreshold ||
        metrics.memory > this.options.targetMemory * this.options.scaleUpThreshold ||
        metrics.responseTime > this.options.targetResponseTime) {
      
      if (metrics.workerCount < this.options.maxWorkers) {
        decision.action = 'scaleUp';
        decision.targetWorkers = Math.min(
          metrics.workerCount + 1,
          this.options.maxWorkers
        );
        decision.reason = `High load - CPU: ${metrics.cpu.toFixed(1)}%, Memory: ${metrics.memory.toFixed(1)}%, Response: ${metrics.responseTime.toFixed(0)}ms`;
      }
    }
    
    // Check if scale down needed
    else if (metrics.cpu < this.options.targetCPU * this.options.scaleDownThreshold &&
             metrics.memory < this.options.targetMemory * this.options.scaleDownThreshold &&
             metrics.responseTime < this.options.targetResponseTime * 0.5) {
      
      if (metrics.workerCount > this.options.minWorkers) {
        decision.action = 'scaleDown';
        decision.targetWorkers = Math.max(
          metrics.workerCount - 1,
          this.options.minWorkers
        );
        decision.reason = `Low load - CPU: ${metrics.cpu.toFixed(1)}%, Memory: ${metrics.memory.toFixed(1)}%, Response: ${metrics.responseTime.toFixed(0)}ms`;
      }
    }
    
    return decision;
  }
  
  /**
   * Execute scaling action
   */
  async executeScaling(decision) {
    this.scaling.isScaling = true;
    
    try {
      if (decision.action === 'scaleUp') {
        await this.scaleUp(decision.targetWorkers - this.workers.size);
        this.stats.scaleUpEvents++;
      } else if (decision.action === 'scaleDown') {
        await this.scaleDown(this.workers.size - decision.targetWorkers);
        this.stats.scaleDownEvents++;
      }
      
      this.scaling.lastScaleTime = Date.now();
      this.scaling.scaleHistory.push({
        timestamp: Date.now(),
        action: decision.action,
        reason: decision.reason,
        workerCount: this.workers.size
      });
      
      // Keep last 100 scaling events
      if (this.scaling.scaleHistory.length > 100) {
        this.scaling.scaleHistory.shift();
      }
      
      logger.info(`Scaling ${decision.action}: ${decision.reason}`);
      
      this.emit('scaling', decision);
      
      // Record metrics
      metrics.increment(`autoscaler.${decision.action}`);
      
    } finally {
      this.scaling.isScaling = false;
    }
  }
  
  /**
   * Scale up
   */
  async scaleUp(count) {
    for (let i = 0; i < count; i++) {
      this.createWorker();
    }
    
    logger.info(`Scaled up by ${count} workers (total: ${this.workers.size})`);
  }
  
  /**
   * Scale down
   */
  async scaleDown(count) {
    const workers = Array.from(this.workers.values())
      .sort((a, b) => a.requests - b.requests) // Remove least busy workers
      .slice(0, count);
    
    for (const workerData of workers) {
      const worker = cluster.workers[workerData.id];
      if (worker) {
        // Graceful shutdown
        worker.send({ type: 'shutdown' });
        
        // Force kill after timeout
        setTimeout(() => {
          if (worker.isDead()) return;
          worker.kill();
        }, 5000);
      }
    }
    
    logger.info(`Scaled down by ${count} workers (total: ${this.workers.size})`);
  }
  
  /**
   * Calculate average
   */
  average(arr) {
    if (arr.length === 0) return 0;
    return arr.reduce((sum, val) => sum + val, 0) / arr.length;
  }
  
  /**
   * Get scaling status
   */
  getStatus() {
    return {
      workers: {
        current: this.workers.size,
        min: this.options.minWorkers,
        max: this.options.maxWorkers,
        list: Array.from(this.workers.values()).map(w => ({
          id: w.id,
          pid: w.pid,
          uptime: Date.now() - w.startTime,
          requests: w.requests,
          errors: w.errors,
          avgResponseTime: w.responseTime.length > 0 
            ? this.average(w.responseTime) 
            : 0
        }))
      },
      metrics: {
        cpu: this.metrics.cpuUsage.length > 0 
          ? this.average(this.metrics.cpuUsage).toFixed(1) + '%'
          : 'N/A',
        memory: this.metrics.memoryUsage.length > 0
          ? this.average(this.metrics.memoryUsage).toFixed(1) + '%'
          : 'N/A',
        responseTime: this.metrics.responseTime.length > 0
          ? this.average(this.metrics.responseTime).toFixed(0) + 'ms'
          : 'N/A',
        requestRate: this.metrics.requestRate.length > 0
          ? this.average(this.metrics.requestRate).toFixed(1) + '/s'
          : 'N/A'
      },
      scaling: {
        isScaling: this.scaling.isScaling,
        lastScaleTime: this.scaling.lastScaleTime,
        recentEvents: this.scaling.scaleHistory.slice(-5)
      },
      stats: this.stats
    };
  }
  
  /**
   * Shutdown all workers
   */
  async shutdown() {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
    }
    
    for (const [, workerData] of this.workers) {
      const worker = cluster.workers[workerData.id];
      if (worker) {
        worker.kill();
      }
    }
    
    logger.info('AutoScaler shutdown complete');
  }
}

// Worker-side utilities
class WorkerMetrics {
  constructor() {
    this.interval = null;
  }
  
  start(intervalMs = 5000) {
    if (!cluster.isWorker) return;
    
    this.interval = setInterval(() => {
      const metrics = {
        memory: process.memoryUsage(),
        cpu: process.cpuUsage()
      };
      
      process.send({
        type: 'metrics',
        data: metrics
      });
    }, intervalMs);
    
    // Handle shutdown message
    process.on('message', (msg) => {
      if (msg.type === 'shutdown') {
        this.shutdown();
      }
    });
  }
  
  recordRequest(responseTime) {
    if (!cluster.isWorker) return;
    
    process.send({
      type: 'request',
      data: { responseTime }
    });
  }
  
  recordError(error) {
    if (!cluster.isWorker) return;
    
    process.send({
      type: 'error',
      data: { error: error.message }
    });
  }
  
  shutdown() {
    if (this.interval) {
      clearInterval(this.interval);
    }
    
    // Graceful shutdown
    process.exit(0);
  }
}

// Singleton instances
let scalerInstance = null;
let workerInstance = null;

function getAutoScaler(options) {
  if (!scalerInstance && cluster.isMaster) {
    scalerInstance = new AutoScaler(options);
  }
  return scalerInstance;
}

function getWorkerMetrics() {
  if (!workerInstance && cluster.isWorker) {
    workerInstance = new WorkerMetrics();
  }
  return workerInstance;
}

module.exports = {
  AutoScaler,
  WorkerMetrics,
  getAutoScaler,
  getWorkerMetrics,
  autoScaler: cluster.isMaster ? getAutoScaler() : null,
  workerMetrics: cluster.isWorker ? getWorkerMetrics() : null
};
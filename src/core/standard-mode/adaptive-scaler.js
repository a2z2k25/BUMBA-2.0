/**
 * BUMBA Standard Mode - Sprint 3: Adaptive Scaling System
 * 
 * Dynamic resource allocation that automatically scales specialists
 * and departments based on workload and system resources
 */

const EventEmitter = require('events');

/**
 * Adaptive Scaler for Standard Mode
 * Dynamically scales resources based on load
 */
class AdaptiveScaler extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      // Scaling thresholds
      minSpecialists: config.minSpecialists || 1,
      maxSpecialists: config.maxSpecialists || 10,
      scaleUpThreshold: config.scaleUpThreshold || 0.8, // 80% load
      scaleDownThreshold: config.scaleDownThreshold || 0.3, // 30% load
      
      // Queue management
      maxQueueSize: config.maxQueueSize || 100,
      queueTimeout: config.queueTimeout || 30000, // 30 seconds
      
      // Load calculation
      loadWindow: config.loadWindow || 5000, // 5 seconds
      smoothingFactor: config.smoothingFactor || 0.7,
      
      // Scaling behavior
      scaleUpRate: config.scaleUpRate || 2, // Double resources
      scaleDownRate: config.scaleDownRate || 0.5, // Halve resources
      cooldownPeriod: config.cooldownPeriod || 10000, // 10 seconds
      
      // Department balancing
      enableBalancing: config.enableBalancing !== false,
      balanceInterval: config.balanceInterval || 15000 // 15 seconds
    };
    
    // Resource state
    this.resources = {
      specialists: new Map(),
      departments: new Map(),
      queues: new Map()
    };
    
    // Load metrics
    this.metrics = {
      currentLoad: 0,
      averageLoad: 0,
      peakLoad: 0,
      requestRate: 0,
      completionRate: 0,
      queueLength: 0
    };
    
    // Scaling state
    this.scaling = {
      isScaling: false,
      lastScaleUp: null,
      lastScaleDown: null,
      scaleHistory: []
    };
    
    // Load tracking
    this.loadHistory = [];
    this.requestHistory = [];
    
    // State
    this.isActive = false;
  }

  /**
   * Start adaptive scaling
   */
  start() {
    if (this.isActive) return;
    
    this.isActive = true;
    console.log('📈 Adaptive Scaler: Started');
    
    // Initialize resources
    this.initializeResources();
    
    // Start monitoring
    this.startMonitoring();
    
    // Start balancing
    if (this.config.enableBalancing) {
      this.startBalancing();
    }
  }

  /**
   * Stop adaptive scaling
   */
  stop() {
    if (!this.isActive) return;
    
    this.isActive = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    
    if (this.balancingInterval) {
      clearInterval(this.balancingInterval);
    }
    
    console.log('📈 Adaptive Scaler: Stopped');
  }

  /**
   * Initialize resources
   */
  initializeResources() {
    // Initialize department resources
    const departments = ['backend', 'design', 'product'];
    
    departments.forEach(dept => {
      this.resources.departments.set(dept, {
        name: dept,
        specialists: this.config.minSpecialists,
        maxSpecialists: this.config.maxSpecialists,
        currentLoad: 0,
        queue: []
      });
      
      // Initialize specialist pool for department
      this.resources.specialists.set(dept, new SpecialistPool(
        dept,
        this.config.minSpecialists,
        this.config.maxSpecialists
      ));
      
      // Initialize queue for department
      this.resources.queues.set(dept, new TaskQueue(
        dept,
        this.config.maxQueueSize
      ));
    });
  }

  /**
   * Start load monitoring
   */
  startMonitoring() {
    this.monitoringInterval = setInterval(() => {
      this.calculateLoad();
      this.checkScaling();
    }, 1000); // Check every second
  }

  /**
   * Start resource balancing
   */
  startBalancing() {
    this.balancingInterval = setInterval(() => {
      this.balanceResources();
    }, this.config.balanceInterval);
  }

  /**
   * Record incoming request
   */
  recordRequest(department, task) {
    const request = {
      department,
      task,
      timestamp: Date.now(),
      queued: false
    };
    
    // Add to history
    this.requestHistory.push(request);
    
    // Clean old history
    const cutoff = Date.now() - this.config.loadWindow * 2;
    this.requestHistory = this.requestHistory.filter(r => r.timestamp > cutoff);
    
    // Try to assign to specialist
    const assigned = this.assignToSpecialist(department, task);
    
    if (!assigned) {
      // Add to queue
      this.queueTask(department, task);
      request.queued = true;
    }
    
    return assigned;
  }

  /**
   * Assign task to available specialist
   */
  assignToSpecialist(department, task) {
    const pool = this.resources.specialists.get(department);
    if (!pool) return false;
    
    const specialist = pool.getAvailable();
    if (!specialist) return false;
    
    // Assign task
    specialist.assign(task);
    
    // Track assignment
    this.emit('task-assigned', {
      department,
      specialist: specialist.id,
      task
    });
    
    return true;
  }

  /**
   * Queue task for later execution
   */
  queueTask(department, task) {
    const queue = this.resources.queues.get(department);
    if (!queue) return false;
    
    const queued = queue.enqueue(task);
    
    if (queued) {
      this.emit('task-queued', {
        department,
        task,
        queueLength: queue.length()
      });
    } else {
      this.emit('queue-full', {
        department,
        task
      });
    }
    
    return queued;
  }

  /**
   * Process queued tasks
   */
  processQueue(department) {
    const queue = this.resources.queues.get(department);
    const pool = this.resources.specialists.get(department);
    
    if (!queue || !pool) return;
    
    while (queue.length() > 0 && pool.hasAvailable()) {
      const task = queue.dequeue();
      if (task) {
        this.assignToSpecialist(department, task);
      }
    }
  }

  /**
   * Calculate current system load
   */
  calculateLoad() {
    // Calculate request rate
    const recentRequests = this.requestHistory.filter(r => 
      r.timestamp > Date.now() - this.config.loadWindow
    );
    this.metrics.requestRate = recentRequests.length / (this.config.loadWindow / 1000);
    
    // Calculate department loads
    let totalLoad = 0;
    let totalCapacity = 0;
    
    this.resources.departments.forEach(dept => {
      const pool = this.resources.specialists.get(dept.name);
      const queue = this.resources.queues.get(dept.name);
      
      if (pool && queue) {
        const busy = pool.getBusyCount();
        const total = pool.getTotal();
        const queueLength = queue.length();
        
        // Calculate department load (busy + queued) / capacity
        const load = (busy + Math.min(queueLength, total)) / total;
        dept.currentLoad = load;
        
        totalLoad += busy + queueLength;
        totalCapacity += total;
      }
    });
    
    // Calculate overall load
    const currentLoad = totalCapacity > 0 ? totalLoad / totalCapacity : 0;
    
    // Smooth load calculation
    if (this.metrics.averageLoad === 0) {
      this.metrics.averageLoad = currentLoad;
    } else {
      this.metrics.averageLoad = 
        this.config.smoothingFactor * this.metrics.averageLoad +
        (1 - this.config.smoothingFactor) * currentLoad;
    }
    
    this.metrics.currentLoad = currentLoad;
    this.metrics.peakLoad = Math.max(this.metrics.peakLoad, currentLoad);
    
    // Calculate total queue length
    let totalQueue = 0;
    this.resources.queues.forEach(queue => {
      totalQueue += queue.length();
    });
    this.metrics.queueLength = totalQueue;
    
    // Store in history
    this.loadHistory.push({
      timestamp: Date.now(),
      load: currentLoad,
      averageLoad: this.metrics.averageLoad,
      queueLength: totalQueue
    });
    
    // Limit history size
    if (this.loadHistory.length > 100) {
      this.loadHistory.shift();
    }
  }

  /**
   * Check if scaling is needed
   */
  checkScaling() {
    if (!this.canScale()) return;
    
    const load = this.metrics.averageLoad;
    
    if (load > this.config.scaleUpThreshold) {
      this.scaleUp();
    } else if (load < this.config.scaleDownThreshold) {
      this.scaleDown();
    }
  }

  /**
   * Check if scaling is allowed
   */
  canScale() {
    if (this.scaling.isScaling) return false;
    
    const now = Date.now();
    
    // Check cooldown period
    if (this.scaling.lastScaleUp && 
        now - this.scaling.lastScaleUp < this.config.cooldownPeriod) {
      return false;
    }
    
    if (this.scaling.lastScaleDown && 
        now - this.scaling.lastScaleDown < this.config.cooldownPeriod) {
      return false;
    }
    
    return true;
  }

  /**
   * Scale up resources
   */
  scaleUp() {
    this.scaling.isScaling = true;
    console.log('📈 Scaling UP - Load:', this.metrics.averageLoad.toFixed(2));
    
    const scaled = [];
    
    this.resources.departments.forEach(dept => {
      if (dept.currentLoad > this.config.scaleUpThreshold) {
        const pool = this.resources.specialists.get(dept.name);
        if (pool) {
          const newCount = Math.min(
            Math.ceil(pool.getTotal() * this.config.scaleUpRate),
            dept.maxSpecialists
          );
          
          if (newCount > pool.getTotal()) {
            pool.scale(newCount);
            dept.specialists = newCount;
            scaled.push({
              department: dept.name,
              from: pool.getTotal(),
              to: newCount
            });
          }
        }
      }
    });
    
    if (scaled.length > 0) {
      this.scaling.lastScaleUp = Date.now();
      this.scaling.scaleHistory.push({
        timestamp: Date.now(),
        type: 'up',
        load: this.metrics.averageLoad,
        scaled
      });
      
      this.emit('scaled-up', {
        departments: scaled,
        load: this.metrics.averageLoad
      });
      
      // Process queues with new resources
      scaled.forEach(s => {
        this.processQueue(s.department);
      });
    }
    
    this.scaling.isScaling = false;
  }

  /**
   * Scale down resources
   */
  scaleDown() {
    this.scaling.isScaling = true;
    console.log('📈 Scaling DOWN - Load:', this.metrics.averageLoad.toFixed(2));
    
    const scaled = [];
    
    this.resources.departments.forEach(dept => {
      if (dept.currentLoad < this.config.scaleDownThreshold) {
        const pool = this.resources.specialists.get(dept.name);
        if (pool) {
          const newCount = Math.max(
            Math.floor(pool.getTotal() * this.config.scaleDownRate),
            this.config.minSpecialists
          );
          
          if (newCount < pool.getTotal()) {
            pool.scale(newCount);
            dept.specialists = newCount;
            scaled.push({
              department: dept.name,
              from: pool.getTotal(),
              to: newCount
            });
          }
        }
      }
    });
    
    if (scaled.length > 0) {
      this.scaling.lastScaleDown = Date.now();
      this.scaling.scaleHistory.push({
        timestamp: Date.now(),
        type: 'down',
        load: this.metrics.averageLoad,
        scaled
      });
      
      this.emit('scaled-down', {
        departments: scaled,
        load: this.metrics.averageLoad
      });
    }
    
    this.scaling.isScaling = false;
  }

  /**
   * Balance resources between departments
   */
  balanceResources() {
    if (!this.config.enableBalancing) return;
    
    const departments = Array.from(this.resources.departments.values());
    
    // Sort by load
    departments.sort((a, b) => b.currentLoad - a.currentLoad);
    
    const overloaded = departments.filter(d => d.currentLoad > 0.7);
    const underutilized = departments.filter(d => d.currentLoad < 0.3);
    
    if (overloaded.length > 0 && underutilized.length > 0) {
      // Transfer resources
      const transfers = [];
      
      overloaded.forEach(over => {
        underutilized.forEach(under => {
          const overPool = this.resources.specialists.get(over.name);
          const underPool = this.resources.specialists.get(under.name);
          
          if (overPool && underPool && underPool.getTotal() > this.config.minSpecialists) {
            // Transfer one specialist
            const transferred = underPool.transfer(overPool);
            if (transferred) {
              transfers.push({
                from: under.name,
                to: over.name
              });
            }
          }
        });
      });
      
      if (transfers.length > 0) {
        this.emit('resources-balanced', {
          transfers,
          timestamp: Date.now()
        });
      }
    }
  }

  /**
   * Get scaling predictions
   */
  predictScaling() {
    if (this.loadHistory.length < 10) {
      return { action: 'none', confidence: 0 };
    }
    
    // Analyze trend
    const recent = this.loadHistory.slice(-10);
    const trend = this.calculateTrend(recent);
    
    // Predict action
    let action = 'none';
    let confidence = 0;
    
    if (trend === 'increasing' && this.metrics.averageLoad > 0.6) {
      action = 'scale-up';
      confidence = Math.min(this.metrics.averageLoad, 0.9);
    } else if (trend === 'decreasing' && this.metrics.averageLoad < 0.4) {
      action = 'scale-down';
      confidence = Math.min(1 - this.metrics.averageLoad, 0.9);
    }
    
    return { action, confidence, trend };
  }

  /**
   * Calculate load trend
   */
  calculateTrend(history) {
    if (history.length < 2) return 'stable';
    
    const first = history.slice(0, 5);
    const last = history.slice(-5);
    
    const firstAvg = first.reduce((sum, h) => sum + h.load, 0) / first.length;
    const lastAvg = last.reduce((sum, h) => sum + h.load, 0) / last.length;
    
    const change = (lastAvg - firstAvg) / firstAvg;
    
    if (change > 0.1) return 'increasing';
    if (change < -0.1) return 'decreasing';
    return 'stable';
  }

  /**
   * Get scaler status
   */
  getStatus() {
    const status = {
      isActive: this.isActive,
      metrics: this.metrics,
      resources: {},
      scaling: {
        ...this.scaling,
        prediction: this.predictScaling()
      }
    };
    
    // Add department status
    this.resources.departments.forEach((dept, name) => {
      const pool = this.resources.specialists.get(name);
      const queue = this.resources.queues.get(name);
      
      status.resources[name] = {
        specialists: pool ? pool.getTotal() : 0,
        busy: pool ? pool.getBusyCount() : 0,
        available: pool ? pool.getAvailableCount() : 0,
        queueLength: queue ? queue.length() : 0,
        load: dept.currentLoad
      };
    });
    
    return status;
  }

  /**
   * Get scaling recommendations
   */
  getRecommendations() {
    const recommendations = [];
    const prediction = this.predictScaling();
    
    if (prediction.action === 'scale-up' && prediction.confidence > 0.7) {
      recommendations.push(`Consider scaling up - load trending ${prediction.trend}`);
    }
    
    if (this.metrics.queueLength > 50) {
      recommendations.push('High queue length - increase resources or optimize processing');
    }
    
    if (this.metrics.peakLoad > 0.9) {
      recommendations.push('Peak load exceeds 90% - increase max specialists');
    }
    
    const imbalanced = this.detectImbalance();
    if (imbalanced.length > 0) {
      recommendations.push(`Resource imbalance detected: ${imbalanced.join(', ')}`);
    }
    
    return recommendations;
  }

  /**
   * Detect resource imbalance
   */
  detectImbalance() {
    const imbalanced = [];
    const loads = [];
    
    this.resources.departments.forEach(dept => {
      loads.push(dept.currentLoad);
    });
    
    const avg = loads.reduce((a, b) => a + b, 0) / loads.length;
    
    this.resources.departments.forEach(dept => {
      if (Math.abs(dept.currentLoad - avg) > 0.3) {
        imbalanced.push(dept.name);
      }
    });
    
    return imbalanced;
  }
}

/**
 * Specialist Pool - Manages specialist instances
 */
class SpecialistPool {
  constructor(department, initial, max) {
    this.department = department;
    this.max = max;
    this.specialists = [];
    
    // Create initial specialists
    for (let i = 0; i < initial; i++) {
      this.specialists.push(new Specialist(`${department}-${i}`, department));
    }
  }

  getAvailable() {
    return this.specialists.find(s => !s.busy);
  }

  hasAvailable() {
    return this.specialists.some(s => !s.busy);
  }

  getTotal() {
    return this.specialists.length;
  }

  getBusyCount() {
    return this.specialists.filter(s => s.busy).length;
  }

  getAvailableCount() {
    return this.specialists.filter(s => !s.busy).length;
  }

  scale(newCount) {
    const current = this.specialists.length;
    
    if (newCount > current) {
      // Add specialists
      for (let i = current; i < newCount && i < this.max; i++) {
        this.specialists.push(new Specialist(`${this.department}-${i}`, this.department));
      }
    } else if (newCount < current) {
      // Remove idle specialists
      const toRemove = current - newCount;
      let removed = 0;
      
      this.specialists = this.specialists.filter(s => {
        if (!s.busy && removed < toRemove) {
          removed++;
          return false;
        }
        return true;
      });
    }
  }

  transfer(toPool) {
    const idle = this.specialists.find(s => !s.busy);
    if (idle && this.specialists.length > 1) {
      this.specialists = this.specialists.filter(s => s !== idle);
      idle.department = toPool.department;
      toPool.specialists.push(idle);
      return true;
    }
    return false;
  }
}

/**
 * Specialist - Individual specialist instance
 */
class Specialist {
  constructor(id, department) {
    this.id = id;
    this.department = department;
    this.busy = false;
    this.currentTask = null;
    this.completedTasks = 0;
  }

  assign(task) {
    this.busy = true;
    this.currentTask = task;
    
    // Simulate task completion
    setTimeout(() => {
      this.complete();
    }, Math.random() * 1000 + 500); // 0.5-1.5 seconds
  }

  complete() {
    this.busy = false;
    this.currentTask = null;
    this.completedTasks++;
  }
}

/**
 * Task Queue - Manages pending tasks
 */
class TaskQueue {
  constructor(department, maxSize) {
    this.department = department;
    this.maxSize = maxSize;
    this.queue = [];
  }

  enqueue(task) {
    if (this.queue.length >= this.maxSize) {
      return false;
    }
    
    this.queue.push({
      task,
      timestamp: Date.now()
    });
    
    return true;
  }

  dequeue() {
    if (this.queue.length === 0) {
      return null;
    }
    
    const item = this.queue.shift();
    return item ? item.task : null;
  }

  length() {
    return this.queue.length;
  }

  clear() {
    this.queue = [];
  }
}

module.exports = AdaptiveScaler;
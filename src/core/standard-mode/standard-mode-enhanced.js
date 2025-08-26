/**
 * BUMBA Standard Mode - Sprint 4: Integration
 * 
 * Integrates all Standard Mode enhancements:
 * - Performance Optimizer (Sprint 1)
 * - Memory Manager (Sprint 2)  
 * - Adaptive Scaler (Sprint 3)
 */

const EventEmitter = require('events');
const PerformanceOptimizer = require('./performance-optimizer');
const MemoryManager = require('./memory-manager');
const AdaptiveScaler = require('./adaptive-scaler');

/**
 * Enhanced Standard Mode
 * Integrates all optimization systems for automatic performance tuning
 */
class StandardModeEnhanced extends EventEmitter {
  constructor(framework, config = {}) {
    super();
    
    this.framework = framework;
    
    this.config = {
      // Mode settings
      autoOptimize: config.autoOptimize !== false,
      adaptiveScaling: config.adaptiveScaling !== false,
      memoryManagement: config.memoryManagement !== false,
      
      // Performance targets
      targetResponseTime: config.targetResponseTime || 1000, // 1 second
      targetMemoryUsage: config.targetMemoryUsage || 400 * 1024 * 1024, // 400MB
      targetThroughput: config.targetThroughput || 100, // 100 tasks/second
      
      // Integration settings
      syncInterval: config.syncInterval || 5000, // 5 seconds
      reportInterval: config.reportInterval || 30000 // 30 seconds
    };
    
    // Components
    this.components = {
      performanceOptimizer: null,
      memoryManager: null,
      adaptiveScaler: null
    };
    
    // State
    this.state = {
      mode: 'standard',
      operational: 75, // Starting at 75%
      active: false,
      health: 'healthy',
      optimizations: {
        performance: false,
        memory: false,
        scaling: false
      }
    };
    
    // Metrics
    this.metrics = {
      tasksProcessed: 0,
      avgResponseTime: 0,
      memoryUsage: 0,
      throughput: 0,
      optimizationCount: 0
    };
    
    // Initialize components
    this.initializeComponents();
  }

  /**
   * Initialize all enhancement components
   */
  initializeComponents() {
    // Initialize Performance Optimizer
    if (this.config.autoOptimize) {
      this.components.performanceOptimizer = new PerformanceOptimizer({
        slowThreshold: this.config.targetResponseTime,
        autoTune: true,
        learningEnabled: true
      });
      
      this.setupPerformanceHandlers();
    }
    
    // Initialize Memory Manager
    if (this.config.memoryManagement) {
      this.components.memoryManager = new MemoryManager({
        maxHeapUsage: this.config.targetMemoryUsage,
        enablePooling: true,
        gcInterval: 30000
      });
      
      this.setupMemoryHandlers();
    }
    
    // Initialize Adaptive Scaler
    if (this.config.adaptiveScaling) {
      this.components.adaptiveScaler = new AdaptiveScaler({
        minSpecialists: 1,
        maxSpecialists: 10,
        enableBalancing: true
      });
      
      this.setupScalingHandlers();
    }
  }

  /**
   * Setup performance optimizer event handlers
   */
  setupPerformanceHandlers() {
    const optimizer = this.components.performanceOptimizer;
    
    optimizer.on('optimization-applied', (data) => {
      console.log(`🟢 Performance optimization applied: ${data.strategy}`);
      this.metrics.optimizationCount++;
      this.updateOperationalStatus();
    });
    
    optimizer.on('auto-tuned', (data) => {
      console.log(`🟢 Auto-tuning applied: ${data.adjustments.join(', ')}`);
    });
    
    optimizer.on('performance-metrics', (metrics) => {
      this.metrics.avgResponseTime = metrics.avgDuration;
      this.checkPerformanceHealth();
    });
  }

  /**
   * Setup memory manager event handlers
   */
  setupMemoryHandlers() {
    const memoryManager = this.components.memoryManager;
    
    memoryManager.on('health-changed', (data) => {
      console.log(`💾 Memory health changed: ${data.previous} → ${data.current}`);
      this.updateHealth();
    });
    
    memoryManager.on('gc-performed', (data) => {
      console.log(`💾 GC freed ${this.formatBytes(data.freed)}`);
    });
    
    memoryManager.on('leaks-detected', (data) => {
      console.log(`🟠️ Memory leaks detected: ${data.leaks.length}`);
      this.handleMemoryLeaks(data.leaks);
    });
    
    memoryManager.on('memory-critical', () => {
      this.handleCriticalMemory();
    });
  }

  /**
   * Setup adaptive scaler event handlers
   */
  setupScalingHandlers() {
    const scaler = this.components.adaptiveScaler;
    
    scaler.on('scaled-up', (data) => {
      console.log(`📈 Scaled up: ${data.departments.length} departments`);
      this.updateOperationalStatus();
    });
    
    scaler.on('scaled-down', (data) => {
      console.log(`📈 Scaled down: ${data.departments.length} departments`);
    });
    
    scaler.on('resources-balanced', (data) => {
      console.log(`📈 Resources balanced: ${data.transfers.length} transfers`);
    });
    
    scaler.on('queue-full', (data) => {
      console.log(`🟠️ Queue full for ${data.department}`);
      this.handleQueueOverflow(data);
    });
  }

  /**
   * Activate Standard Mode with enhancements
   */
  async activate() {
    if (this.state.active) {
      return { success: false, message: 'Already active' };
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('🟢 STANDARD MODE ENHANCED - ACTIVATING');
    console.log('='.repeat(60));
    
    this.state.active = true;
    
    // Start all components
    if (this.components.performanceOptimizer) {
      this.components.performanceOptimizer.start();
      this.state.optimizations.performance = true;
      console.log('🏁 Performance Optimizer: Active');
    }
    
    if (this.components.memoryManager) {
      this.components.memoryManager.start();
      this.state.optimizations.memory = true;
      console.log('🏁 Memory Manager: Active');
    }
    
    if (this.components.adaptiveScaler) {
      this.components.adaptiveScaler.start();
      this.state.optimizations.scaling = true;
      console.log('🏁 Adaptive Scaler: Active');
    }
    
    // Start synchronization
    this.startSynchronization();
    
    // Start reporting
    this.startReporting();
    
    // Update operational status
    this.updateOperationalStatus();
    
    console.log(`📊 Operational Status: ${this.state.operational}%`);
    console.log('='.repeat(60) + '\n');
    
    return { 
      success: true, 
      operational: this.state.operational,
      optimizations: this.state.optimizations
    };
  }

  /**
   * Deactivate Standard Mode
   */
  async deactivate() {
    if (!this.state.active) {
      return { success: false, message: 'Not active' };
    }
    
    console.log('🔴 Deactivating Standard Mode Enhanced...');
    
    // Stop all components
    if (this.components.performanceOptimizer) {
      this.components.performanceOptimizer.stop();
    }
    
    if (this.components.memoryManager) {
      this.components.memoryManager.stop();
    }
    
    if (this.components.adaptiveScaler) {
      this.components.adaptiveScaler.stop();
    }
    
    // Stop intervals
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    if (this.reportInterval) {
      clearInterval(this.reportInterval);
    }
    
    this.state.active = false;
    
    return { success: true };
  }

  /**
   * Process task with optimizations
   */
  async processTask(task) {
    const startTime = Date.now();
    
    try {
      // Use memory pooling if available
      let taskContext = {};
      if (this.components.memoryManager) {
        taskContext = this.components.memoryManager.acquire('small');
      }
      
      // Record for scaling
      if (this.components.adaptiveScaler) {
        const department = this.getDepartmentForTask(task);
        this.components.adaptiveScaler.recordRequest(department, task);
      }
      
      // Execute task through framework
      const result = await this.framework.executeCommand(task);
      
      // Release memory
      if (this.components.memoryManager) {
        this.components.memoryManager.release(taskContext, 'small');
      }
      
      // Record metrics - IMPORTANT: Must happen after execution
      const duration = Date.now() - startTime;
      this.recordTaskMetrics(task, duration, result);
      
      return result;
      
    } catch (error) {
      console.error('Task processing error:', error);
      throw error;
    }
  }

  /**
   * Record task metrics
   */
  recordTaskMetrics(task, duration, result) {
    this.metrics.tasksProcessed++;
    
    // Update performance optimizer
    if (this.components.performanceOptimizer) {
      this.components.performanceOptimizer.recordTask(task, duration, result);
    }
    
    // Update adaptive scaler
    if (this.components.adaptiveScaler) {
      // Task completed, process queue
      const department = this.getDepartmentForTask(task);
      this.components.adaptiveScaler.processQueue(department);
    }
  }

  /**
   * Get department for task
   */
  getDepartmentForTask(task) {
    if (typeof task === 'string') {
      if (task.includes('design') || task.includes('ui')) return 'design';
      if (task.includes('product') || task.includes('strategy')) return 'product';
      return 'backend';
    }
    
    if (task.department) return task.department;
    if (task.type) {
      if (task.type.includes('design')) return 'design';
      if (task.type.includes('product')) return 'product';
    }
    
    return 'backend';
  }

  /**
   * Start component synchronization
   */
  startSynchronization() {
    this.syncInterval = setInterval(() => {
      this.synchronizeComponents();
    }, this.config.syncInterval);
  }

  /**
   * Synchronize components
   */
  synchronizeComponents() {
    // Share metrics between components
    if (this.components.performanceOptimizer && this.components.adaptiveScaler) {
      const perfStatus = this.components.performanceOptimizer.getStatus();
      const scaleStatus = this.components.adaptiveScaler.getStatus();
      
      // If performance is degrading and load is high, prioritize scaling
      if (perfStatus.performance && perfStatus.performance.avgDuration > this.config.targetResponseTime &&
          scaleStatus.metrics.averageLoad > 0.6) {
        console.log('📊 Performance degradation detected - triggering scale up');
        this.components.adaptiveScaler.scaleUp();
      }
    }
    
    // Memory pressure affects scaling
    if (this.components.memoryManager && this.components.adaptiveScaler) {
      const memStatus = this.components.memoryManager.getStatus();
      
      if (memStatus.state.health === 'critical') {
        // Reduce scaling to save memory
        console.log('📊 Memory critical - reducing scaling');
        this.components.adaptiveScaler.scaleDown();
      }
    }
  }

  /**
   * Start reporting
   */
  startReporting() {
    this.reportInterval = setInterval(() => {
      this.generateReport();
    }, this.config.reportInterval);
  }

  /**
   * Generate status report
   */
  generateReport() {
    const report = {
      timestamp: Date.now(),
      operational: this.state.operational,
      health: this.state.health,
      metrics: this.metrics,
      components: {}
    };
    
    if (this.components.performanceOptimizer) {
      report.components.performance = this.components.performanceOptimizer.getStatus();
    }
    
    if (this.components.memoryManager) {
      report.components.memory = this.components.memoryManager.getStatus();
    }
    
    if (this.components.adaptiveScaler) {
      report.components.scaling = this.components.adaptiveScaler.getStatus();
    }
    
    this.emit('status-report', report);
    
    // Display summary
    this.displaySummary(report);
    
    return report;
  }

  /**
   * Display status summary
   */
  displaySummary(report) {
    console.log('\n' + '='.repeat(60));
    console.log('📊 STANDARD MODE STATUS REPORT');
    console.log('='.repeat(60));
    console.log(`Operational: ${report.operational}% | Health: ${report.health}`);
    console.log(`Tasks: ${report.metrics.tasksProcessed} | Optimizations: ${report.metrics.optimizationCount}`);
    
    if (report.components.performance) {
      const perf = report.components.performance;
      console.log(`Performance: ${perf.metrics.taskCount} tasks, ${perf.learning.accuracy.toFixed(2)} accuracy`);
    }
    
    if (report.components.memory) {
      const mem = report.components.memory;
      console.log(`Memory: ${mem.current.heapUsed} used, ${mem.state.health} health`);
    }
    
    if (report.components.scaling) {
      const scale = report.components.scaling;
      console.log(`Scaling: ${scale.metrics.averageLoad.toFixed(2)} load, ${scale.metrics.queueLength} queued`);
    }
    
    console.log('='.repeat(60) + '\n');
  }

  /**
   * Update operational status
   */
  updateOperationalStatus() {
    let operational = 75; // Base operational status
    
    // Add points for active optimizations
    if (this.state.optimizations.performance) operational += 8;
    if (this.state.optimizations.memory) operational += 8;
    if (this.state.optimizations.scaling) operational += 9;
    
    // Cap at 100%
    this.state.operational = Math.min(operational, 100);
    
    // Emit status change
    this.emit('operational-change', {
      previous: this.state.operational,
      current: operational
    });
  }

  /**
   * Check performance health
   */
  checkPerformanceHealth() {
    if (this.metrics.avgResponseTime > this.config.targetResponseTime * 2) {
      this.updateHealth('degraded');
    } else if (this.metrics.avgResponseTime < this.config.targetResponseTime) {
      this.updateHealth('healthy');
    }
  }

  /**
   * Update system health
   */
  updateHealth(newHealth = null) {
    if (newHealth) {
      this.state.health = newHealth;
      return;
    }
    
    // Determine health from components
    const healths = [];
    
    if (this.components.memoryManager) {
      healths.push(this.components.memoryManager.state.health);
    }
    
    if (healths.includes('critical')) {
      this.state.health = 'critical';
    } else if (healths.includes('warning') || healths.includes('degraded')) {
      this.state.health = 'degraded';
    } else {
      this.state.health = 'healthy';
    }
  }

  /**
   * Handle memory leaks
   */
  handleMemoryLeaks(leaks) {
    console.log(`🟠️ Handling ${leaks.length} memory leaks`);
    
    // Reduce scaling to free memory
    if (this.components.adaptiveScaler) {
      this.components.adaptiveScaler.scaleDown();
    }
    
    // Clear performance caches
    if (this.components.performanceOptimizer) {
      this.components.performanceOptimizer.strategies.caching.cache.clear();
    }
  }

  /**
   * Handle critical memory
   */
  handleCriticalMemory() {
    console.log('🔴 Critical memory - entering preservation mode');
    
    // Stop non-essential operations
    if (this.components.adaptiveScaler) {
      this.components.adaptiveScaler.stop();
    }
    
    // Force GC
    if (this.components.memoryManager) {
      this.components.memoryManager.forceGC();
    }
  }

  /**
   * Handle queue overflow
   */
  handleQueueOverflow(data) {
    console.log(`🟠️ Queue overflow for ${data.department} - scaling up`);
    
    // Force scale up for department
    if (this.components.adaptiveScaler) {
      this.components.adaptiveScaler.scaleUp();
    }
  }

  /**
   * Format bytes
   */
  formatBytes(bytes) {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)}KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)}MB`;
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      mode: 'standard-enhanced',
      operational: this.state.operational,
      active: this.state.active,
      health: this.state.health,
      optimizations: this.state.optimizations,
      metrics: this.metrics
    };
  }

  /**
   * Get recommendations
   */
  getRecommendations() {
    const recommendations = [];
    
    if (this.components.performanceOptimizer) {
      const perfStatus = this.components.performanceOptimizer.getStatus();
      if (perfStatus.performance && perfStatus.performance.avgDuration > this.config.targetResponseTime) {
        recommendations.push('Consider optimizing slow operations');
      }
    }
    
    if (this.components.memoryManager) {
      const memRecs = this.components.memoryManager.getRecommendations();
      recommendations.push(...memRecs);
    }
    
    if (this.components.adaptiveScaler) {
      const scaleRecs = this.components.adaptiveScaler.getRecommendations();
      recommendations.push(...scaleRecs);
    }
    
    return recommendations;
  }
}

module.exports = StandardModeEnhanced;
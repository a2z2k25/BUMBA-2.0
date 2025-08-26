/**
 * Performance Profiler
 * CPU, memory, and I/O profiling with flame graphs
 * Sprint 33-36 - Performance Optimization
 */

const v8 = require('v8');
const perf_hooks = require('perf_hooks');
const { logger } = require('../logging/bumba-logger');
const { stateManager } = require('../state/global-state-manager');
const { ComponentTimers } = require('../timers/timer-registry');
const EventEmitter = require('events');

class PerformanceProfiler extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      sampleInterval: options.sampleInterval || 100, // ms
      heapSnapshotInterval: options.heapSnapshotInterval || 60000, // 1 minute
      cpuProfilingEnabled: options.cpuProfilingEnabled !== false,
      memoryProfilingEnabled: options.memoryProfilingEnabled !== false,
      asyncHooksEnabled: options.asyncHooksEnabled || false,
      maxSamples: options.maxSamples || 10000
    };
    
    // Profiling data
    this.samples = [];
    this.marks = new Map();
    this.measures = new Map();
    this.asyncOperations = new Map();
    
    // Performance observers
    this.observers = new Map();
    
    // Timers
    this.timers = new ComponentTimers('performance-profiler');
    
    // Statistics
    this.stats = {
      samplesCollected: 0,
      heapSnapshots: 0,
      slowOperations: 0,
      memoryLeaks: 0
    };
    
    // Initialize profiling
    this.initialize();
    
    // Register with state manager
    stateManager.register('profiler', {
      stats: this.stats,
      metrics: {}
    });
  }
  
  /**
   * Initialize profiling
   */
  initialize() {
    // Set up performance observers
    this.setupObservers();
    
    // Start CPU sampling
    if (this.options.cpuProfilingEnabled) {
      this.startCPUSampling();
    }
    
    // Start memory profiling
    if (this.options.memoryProfilingEnabled) {
      this.startMemoryProfiling();
    }
    
    // Setup async hooks if enabled
    if (this.options.asyncHooksEnabled) {
      this.setupAsyncHooks();
    }
  }
  
  /**
   * Setup performance observers
   */
  setupObservers() {
    // Observe entry types
    const entryTypes = ['measure', 'mark', 'function', 'gc'];
    
    const obs = new perf_hooks.PerformanceObserver((items) => {
      const entries = items.getEntries();
      
      for (const entry of entries) {
        this.processPerformanceEntry(entry);
      }
    });
    
    obs.observe({ entryTypes });
    this.observers.set('main', obs);
  }
  
  /**
   * Process performance entry
   */
  processPerformanceEntry(entry) {
    // Check for slow operations
    if (entry.duration > 100) {
      this.stats.slowOperations++;
      
      logger.warn(`Slow operation detected: ${entry.name} (${entry.duration.toFixed(2)}ms)`);
      
      this.emit('slowOperation', {
        name: entry.name,
        duration: entry.duration,
        startTime: entry.startTime
      });
    }
    
    // Store entry data
    if (entry.entryType === 'measure') {
      if (!this.measures.has(entry.name)) {
        this.measures.set(entry.name, []);
      }
      this.measures.get(entry.name).push({
        duration: entry.duration,
        startTime: entry.startTime
      });
    }
  }
  
  /**
   * Start CPU sampling
   */
  startCPUSampling() {
    this.timers.setInterval('cpuSampling', () => {
      const sample = this.collectCPUSample();
      
      this.samples.push(sample);
      this.stats.samplesCollected++;
      
      // Limit samples
      if (this.samples.length > this.options.maxSamples) {
        this.samples.shift();
      }
      
      // Check for high CPU usage
      if (sample.cpuUsage > 80) {
        this.emit('highCPU', sample);
      }
      
    }, this.options.sampleInterval);
  }
  
  /**
   * Collect CPU sample
   */
  collectCPUSample() {
    const startUsage = process.cpuUsage();
    const startTime = Date.now();
    
    // Wait a bit to measure
    const iterations = 1000000;
    for (let i = 0; i < iterations; i++) {
      // Busy work to measure CPU
    }
    
    const endUsage = process.cpuUsage(startUsage);
    const endTime = Date.now();
    
    const userPercent = (endUsage.user / 1000 / (endTime - startTime)) * 100;
    const systemPercent = (endUsage.system / 1000 / (endTime - startTime)) * 100;
    
    return {
      timestamp: Date.now(),
      cpuUsage: userPercent + systemPercent,
      user: userPercent,
      system: systemPercent
    };
  }
  
  /**
   * Start memory profiling
   */
  startMemoryProfiling() {
    // Regular memory snapshots
    this.timers.setInterval('memorySnapshot', () => {
      const snapshot = this.collectMemorySnapshot();
      
      // Check for memory leaks
      this.detectMemoryLeaks(snapshot);
      
      // Store snapshot
      this.emit('memorySnapshot', snapshot);
      
    }, this.options.heapSnapshotInterval);
    
    // Monitor garbage collection
    perf_hooks.performance.addEventListener('gc', (event) => {
      this.emit('gc', {
        kind: event.kind,
        duration: event.duration,
        timestamp: Date.now()
      });
    });
  }
  
  /**
   * Collect memory snapshot
   */
  collectMemorySnapshot() {
    const memUsage = process.memoryUsage();
    const heapStats = v8.getHeapStatistics();
    const heapSpaces = v8.getHeapSpaceStatistics();
    
    return {
      timestamp: Date.now(),
      rss: memUsage.rss,
      heapTotal: memUsage.heapTotal,
      heapUsed: memUsage.heapUsed,
      external: memUsage.external,
      arrayBuffers: memUsage.arrayBuffers,
      heapStatistics: {
        totalHeapSize: heapStats.total_heap_size,
        totalHeapSizeExecutable: heapStats.total_heap_size_executable,
        totalPhysicalSize: heapStats.total_physical_size,
        totalAvailableSize: heapStats.total_available_size,
        usedHeapSize: heapStats.used_heap_size,
        heapSizeLimit: heapStats.heap_size_limit,
        mallocedMemory: heapStats.malloced_memory,
        peakMallocedMemory: heapStats.peak_malloced_memory,
        doesZapGarbage: heapStats.does_zap_garbage
      },
      heapSpaces: heapSpaces.map(space => ({
        spaceName: space.space_name,
        spaceSize: space.space_size,
        spaceUsedSize: space.space_used_size,
        spaceAvailableSize: space.space_available_size,
        physicalSpaceSize: space.physical_space_size
      }))
    };
  }
  
  /**
   * Detect memory leaks
   */
  detectMemoryLeaks(snapshot) {
    // Simple leak detection based on continuous growth
    if (this.lastSnapshot) {
      const growth = snapshot.heapUsed - this.lastSnapshot.heapUsed;
      const growthPercent = (growth / this.lastSnapshot.heapUsed) * 100;
      
      if (growthPercent > 10 && growth > 10 * 1024 * 1024) {
        this.stats.memoryLeaks++;
        
        this.emit('memoryLeak', {
          growth,
          growthPercent,
          current: snapshot.heapUsed,
          previous: this.lastSnapshot.heapUsed
        });
        
        logger.warn(`Potential memory leak detected: ${(growth / 1024 / 1024).toFixed(2)}MB growth`);
      }
    }
    
    this.lastSnapshot = snapshot;
  }
  
  /**
   * Setup async hooks for async operation tracking
   */
  setupAsyncHooks() {
    const async_hooks = require('async_hooks');
    
    const hook = async_hooks.createHook({
      init: (asyncId, type, triggerAsyncId) => {
        this.asyncOperations.set(asyncId, {
          type,
          triggerAsyncId,
          startTime: Date.now()
        });
      },
      
      destroy: (asyncId) => {
        const op = this.asyncOperations.get(asyncId);
        if (op) {
          op.endTime = Date.now();
          op.duration = op.endTime - op.startTime;
          
          if (op.duration > 100) {
            this.emit('slowAsync', op);
          }
          
          this.asyncOperations.delete(asyncId);
        }
      }
    });
    
    hook.enable();
  }
  
  /**
   * Mark performance point
   */
  mark(name) {
    perf_hooks.performance.mark(name);
    this.marks.set(name, Date.now());
  }
  
  /**
   * Measure between marks
   */
  measure(name, startMark, endMark) {
    try {
      perf_hooks.performance.measure(name, startMark, endMark);
      
      const measure = perf_hooks.performance.getEntriesByName(name, 'measure')[0];
      
      return {
        name,
        duration: measure.duration,
        startTime: measure.startTime
      };
    } catch (error) {
      logger.error(`Failed to measure ${name}:`, error);
      return null;
    }
  }
  
  /**
   * Profile function execution
   */
  async profile(fn, name = 'anonymous') {
    const startMark = `${name}-start`;
    const endMark = `${name}-end`;
    
    // Mark start
    this.mark(startMark);
    
    const startCPU = process.cpuUsage();
    const startMem = process.memoryUsage();
    const startTime = Date.now();
    
    try {
      // Execute function
      const result = await fn();
      
      // Mark end
      this.mark(endMark);
      
      // Measure
      const measure = this.measure(name, startMark, endMark);
      
      const endCPU = process.cpuUsage(startCPU);
      const endMem = process.memoryUsage();
      const endTime = Date.now();
      
      const profile = {
        name,
        duration: endTime - startTime,
        cpu: {
          user: endCPU.user / 1000,
          system: endCPU.system / 1000
        },
        memory: {
          heapUsed: endMem.heapUsed - startMem.heapUsed,
          external: endMem.external - startMem.external
        },
        measure
      };
      
      this.emit('profileComplete', profile);
      
      return { result, profile };
      
    } catch (error) {
      this.mark(endMark);
      throw error;
    }
  }
  
  /**
   * Generate flame graph data
   */
  generateFlameGraph() {
    const stacks = new Map();
    
    // Process samples
    for (const sample of this.samples) {
      const stack = this.getCallStack();
      const key = stack.join(';');
      
      if (!stacks.has(key)) {
        stacks.set(key, 0);
      }
      stacks.set(key, stacks.get(key) + 1);
    }
    
    // Convert to flame graph format
    const flameGraph = [];
    for (const [stack, count] of stacks) {
      flameGraph.push({
        stack,
        count,
        percentage: (count / this.samples.length) * 100
      });
    }
    
    return flameGraph;
  }
  
  /**
   * Get current call stack
   */
  getCallStack() {
    const stack = new Error().stack;
    const lines = stack.split('\n').slice(2); // Skip Error and this function
    
    return lines.map(line => {
      const match = line.match(/at\s+([^\s]+)/);
      return match ? match[1] : 'unknown';
    });
  }
  
  /**
   * Get performance report
   */
  getReport() {
    // Calculate statistics
    const avgCPU = this.samples.length > 0
      ? this.samples.reduce((sum, s) => sum + s.cpuUsage, 0) / this.samples.length
      : 0;
    
    const measureStats = {};
    for (const [name, measures] of this.measures) {
      const durations = measures.map(m => m.duration);
      measureStats[name] = {
        count: measures.length,
        total: durations.reduce((sum, d) => sum + d, 0),
        average: durations.reduce((sum, d) => sum + d, 0) / durations.length,
        min: Math.min(...durations),
        max: Math.max(...durations)
      };
    }
    
    const currentMem = this.collectMemorySnapshot();
    
    return {
      cpu: {
        average: avgCPU.toFixed(2) + '%',
        samples: this.samples.length
      },
      memory: {
        current: {
          heapUsed: `${(currentMem.heapUsed / 1024 / 1024).toFixed(2)} MB`,
          heapTotal: `${(currentMem.heapTotal / 1024 / 1024).toFixed(2)} MB`,
          rss: `${(currentMem.rss / 1024 / 1024).toFixed(2)} MB`
        },
        leaksDetected: this.stats.memoryLeaks
      },
      operations: {
        slow: this.stats.slowOperations,
        measures: measureStats
      },
      asyncOperations: {
        active: this.asyncOperations.size
      }
    };
  }
  
  /**
   * Clear profiling data
   */
  clear() {
    this.samples = [];
    this.marks.clear();
    this.measures.clear();
    this.asyncOperations.clear();
    
    this.stats = {
      samplesCollected: 0,
      heapSnapshots: 0,
      slowOperations: 0,
      memoryLeaks: 0
    };
  }
  
  /**
   * Stop profiling
   */
  stop() {
    this.timers.clearAll();
    
    for (const [, observer] of this.observers) {
      observer.disconnect();
    }
    this.observers.clear();
    
    this.removeAllListeners();
  }
  
  /**
   * Update state
   */
  updateState() {
    stateManager.set('profiler', 'stats', this.stats);
    stateManager.set('profiler', 'metrics', this.getReport());
  }
}

// Singleton instance
let instance = null;

function getPerformanceProfiler(options) {
  if (!instance) {
    instance = new PerformanceProfiler(options);
  }
  return instance;
}

module.exports = {
  PerformanceProfiler,
  getPerformanceProfiler,
  performanceProfiler: getPerformanceProfiler(),
  
  // Helper functions
  profile: (fn, name) => getPerformanceProfiler().profile(fn, name),
  mark: (name) => getPerformanceProfiler().mark(name),
  measure: (name, start, end) => getPerformanceProfiler().measure(name, start, end)
};
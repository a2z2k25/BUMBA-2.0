/**
 * BUMBA Development Mode - Sprint 3: Performance Profiling
 * 
 * Comprehensive performance analysis with CPU profiling, memory tracking,
 * execution timeline analysis, and bottleneck detection
 */

const { performance, PerformanceObserver } = require('perf_hooks');
const v8 = require('v8');
const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');

/**
 * Performance Profiler for Development Mode
 * Provides detailed performance insights and analysis
 */
class PerformanceProfiler extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      // Profiling settings
      cpuProfiling: config.cpuProfiling !== false,
      memoryProfiling: config.memoryProfiling !== false,
      timelineProfiling: config.timelineProfiling !== false,
      
      // Sampling settings
      cpuSamplingInterval: config.cpuSamplingInterval || 1, // microseconds
      memorySamplingInterval: config.memorySamplingInterval || 1000, // ms
      
      // Analysis settings
      bottleneckThreshold: config.bottleneckThreshold || 100, // ms
      memoryLeakThreshold: config.memoryLeakThreshold || 10, // MB
      functionThreshold: config.functionThreshold || 10, // ms
      
      // Output settings
      outputDir: config.outputDir || './profiles',
      generateFlameGraph: config.generateFlameGraph || false,
      realTimeMetrics: config.realTimeMetrics !== false,
      
      // Limits
      maxSamples: config.maxSamples || 10000,
      maxMemorySnapshots: config.maxMemorySnapshots || 10,
      maxTimelineEvents: config.maxTimelineEvents || 5000
    };
    
    // State
    this.state = {
      active: false,
      profiling: false,
      startTime: null,
      endTime: null
    };
    
    // CPU profiling
    this.cpuProfile = null;
    this.cpuSamples = [];
    this.functionTimings = new Map();
    
    // Memory profiling
    this.memorySnapshots = [];
    this.memoryTimeline = [];
    this.heapStats = [];
    
    // Timeline
    this.timeline = [];
    this.marks = new Map();
    this.measures = new Map();
    
    // Performance observer
    this.perfObserver = null;
    
    // Metrics
    this.metrics = {
      cpu: {
        usage: 0,
        userTime: 0,
        systemTime: 0
      },
      memory: {
        heapUsed: 0,
        heapTotal: 0,
        external: 0,
        rss: 0
      },
      functions: {
        hot: [],
        slow: []
      },
      bottlenecks: []
    };
  }

  /**
   * Start profiling
   */
  async start() {
    if (this.state.active) {
      console.log('🟠️ Profiler already active');
      return;
    }
    
    this.state.active = true;
    this.state.startTime = Date.now();
    
    console.log('📊 Performance Profiler: Starting...');
    
    // Create output directory
    await this.ensureOutputDir();
    
    // Start CPU profiling
    if (this.config.cpuProfiling) {
      this.startCPUProfiling();
    }
    
    // Start memory profiling
    if (this.config.memoryProfiling) {
      this.startMemoryProfiling();
    }
    
    // Start timeline profiling
    if (this.config.timelineProfiling) {
      this.startTimelineProfiling();
    }
    
    // Setup performance observer
    this.setupPerformanceObserver();
    
    // Start real-time metrics
    if (this.config.realTimeMetrics) {
      this.startRealTimeMetrics();
    }
    
    console.log('🏁 Performance Profiler: Active');
    console.log('   • CPU Profiling: ' + (this.config.cpuProfiling ? '🏁' : '🔴'));
    console.log('   • Memory Profiling: ' + (this.config.memoryProfiling ? '🏁' : '🔴'));
    console.log('   • Timeline: ' + (this.config.timelineProfiling ? '🏁' : '🔴'));
    
    this.emit('started');
  }

  /**
   * Stop profiling
   */
  async stop() {
    if (!this.state.active) return;
    
    this.state.active = false;
    this.state.endTime = Date.now();
    
    console.log('📊 Stopping profiler...');
    
    // Stop CPU profiling
    if (this.cpuProfile) {
      this.stopCPUProfiling();
    }
    
    // Stop memory profiling
    if (this.memoryInterval) {
      clearInterval(this.memoryInterval);
    }
    
    // Stop real-time metrics
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
    
    // Disconnect observer
    if (this.perfObserver) {
      this.perfObserver.disconnect();
    }
    
    // Generate reports
    const report = await this.generateReport();
    
    console.log('🏁 Performance Profiler: Stopped');
    console.log(`📁 Profile saved to: ${this.config.outputDir}`);
    
    this.emit('stopped', report);
    
    return report;
  }

  /**
   * Start CPU profiling
   */
  startCPUProfiling() {
    this.state.profiling = true;
    this.cpuStartTime = process.cpuUsage();
    
    // Start sampling
    this.cpuInterval = setInterval(() => {
      this.sampleCPU();
    }, this.config.cpuSamplingInterval);
    
    console.log('🔥 CPU profiling started');
  }

  /**
   * Stop CPU profiling
   */
  stopCPUProfiling() {
    if (this.cpuInterval) {
      clearInterval(this.cpuInterval);
    }
    
    this.state.profiling = false;
    
    // Calculate final CPU usage
    const cpuEnd = process.cpuUsage(this.cpuStartTime);
    this.metrics.cpu.userTime = cpuEnd.user;
    this.metrics.cpu.systemTime = cpuEnd.system;
    this.metrics.cpu.usage = ((cpuEnd.user + cpuEnd.system) / 1000000) * 100; // Convert to percentage
    
    console.log('🔥 CPU profiling stopped');
  }

  /**
   * Sample CPU usage
   */
  sampleCPU() {
    const usage = process.cpuUsage();
    const sample = {
      timestamp: Date.now(),
      user: usage.user,
      system: usage.system,
      stack: this.captureCallStack()
    };
    
    this.cpuSamples.push(sample);
    
    // Limit samples
    if (this.cpuSamples.length > this.config.maxSamples) {
      this.cpuSamples.shift();
    }
    
    // Update function timings
    this.updateFunctionTimings(sample.stack);
  }

  /**
   * Capture call stack
   */
  captureCallStack() {
    const stack = new Error().stack;
    const frames = stack.split('\n').slice(2, 10); // Skip first two frames (Error and this function)
    
    return frames.map(frame => {
      const match = frame.match(/at (.+?) \((.+?):(\d+):(\d+)\)/);
      if (match) {
        return {
          function: match[1],
          file: match[2],
          line: parseInt(match[3])
        };
      }
      return null;
    }).filter(Boolean);
  }

  /**
   * Update function timings
   */
  updateFunctionTimings(stack) {
    stack.forEach(frame => {
      const key = `${frame.function}:${frame.file}:${frame.line}`;
      
      if (!this.functionTimings.has(key)) {
        this.functionTimings.set(key, {
          function: frame.function,
          file: frame.file,
          line: frame.line,
          samples: 0,
          totalTime: 0
        });
      }
      
      const timing = this.functionTimings.get(key);
      timing.samples++;
      timing.totalTime += this.config.cpuSamplingInterval;
    });
  }

  /**
   * Start memory profiling
   */
  startMemoryProfiling() {
    // Take initial snapshot
    this.takeMemorySnapshot('start');
    
    // Start sampling
    this.memoryInterval = setInterval(() => {
      this.sampleMemory();
    }, this.config.memorySamplingInterval);
    
    console.log('💾 Memory profiling started');
  }

  /**
   * Sample memory usage
   */
  sampleMemory() {
    const memUsage = process.memoryUsage();
    const heapStats = v8.getHeapStatistics();
    
    const sample = {
      timestamp: Date.now(),
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
      rss: memUsage.rss,
      heapLimit: heapStats.heap_size_limit,
      totalAvailable: heapStats.total_available_size,
      usedHeapSize: heapStats.used_heap_size,
      totalHeapSize: heapStats.total_heap_size,
      mallocedMemory: heapStats.malloced_memory
    };
    
    this.memoryTimeline.push(sample);
    
    // Update metrics
    this.metrics.memory = {
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
      rss: memUsage.rss
    };
    
    // Check for memory leaks
    this.detectMemoryLeaks();
  }

  /**
   * Take memory snapshot
   */
  takeMemorySnapshot(label = 'snapshot') {
    const snapshot = v8.writeHeapSnapshot();
    
    this.memorySnapshots.push({
      label,
      timestamp: Date.now(),
      data: snapshot
    });
    
    // Limit snapshots
    if (this.memorySnapshots.length > this.config.maxMemorySnapshots) {
      this.memorySnapshots.shift();
    }
    
    console.log(`📸 Memory snapshot taken: ${label}`);
  }

  /**
   * Detect memory leaks
   */
  detectMemoryLeaks() {
    if (this.memoryTimeline.length < 10) return;
    
    // Check for continuous growth
    const recent = this.memoryTimeline.slice(-10);
    const first = recent[0];
    const last = recent[recent.length - 1];
    
    const growth = last.heapUsed - first.heapUsed;
    const growthMB = growth / (1024 * 1024);
    
    if (growthMB > this.config.memoryLeakThreshold) {
      const leak = {
        timestamp: Date.now(),
        growth: growthMB,
        period: last.timestamp - first.timestamp,
        startHeap: first.heapUsed,
        endHeap: last.heapUsed
      };
      
      console.warn(`🟠️ Potential memory leak detected: ${growthMB.toFixed(2)}MB growth`);
      
      this.emit('memory-leak', leak);
    }
  }

  /**
   * Start timeline profiling
   */
  startTimelineProfiling() {
    // Clear existing timeline
    this.timeline = [];
    this.marks.clear();
    this.measures.clear();
    
    console.log('⏱️ Timeline profiling started');
  }

  /**
   * Mark timeline point
   */
  mark(name, metadata = {}) {
    const mark = {
      name,
      timestamp: performance.now(),
      metadata
    };
    
    this.marks.set(name, mark);
    performance.mark(name);
    
    // Add to timeline
    this.addTimelineEvent('mark', mark);
  }

  /**
   * Measure between marks
   */
  measure(name, startMark, endMark) {
    try {
      performance.measure(name, startMark, endMark);
      
      const measure = {
        name,
        startMark,
        endMark,
        duration: performance.getEntriesByName(name, 'measure')[0].duration
      };
      
      this.measures.set(name, measure);
      
      // Add to timeline
      this.addTimelineEvent('measure', measure);
      
      // Check for bottlenecks
      if (measure.duration > this.config.bottleneckThreshold) {
        this.recordBottleneck(measure);
      }
      
      return measure;
    } catch (error) {
      console.error(`Failed to measure ${name}:`, error.message);
      return null;
    }
  }

  /**
   * Add timeline event
   */
  addTimelineEvent(type, data) {
    const event = {
      type,
      timestamp: Date.now(),
      data
    };
    
    this.timeline.push(event);
    
    // Limit timeline events
    if (this.timeline.length > this.config.maxTimelineEvents) {
      this.timeline.shift();
    }
  }

  /**
   * Record bottleneck
   */
  recordBottleneck(measure) {
    const bottleneck = {
      name: measure.name,
      duration: measure.duration,
      timestamp: Date.now(),
      start: measure.startMark,
      end: measure.endMark
    };
    
    this.metrics.bottlenecks.push(bottleneck);
    
    console.warn(`🐌 Bottleneck detected: ${measure.name} took ${measure.duration.toFixed(2)}ms`);
    
    this.emit('bottleneck', bottleneck);
  }

  /**
   * Setup performance observer
   */
  setupPerformanceObserver() {
    this.perfObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.handlePerformanceEntry(entry);
      }
    });
    
    this.perfObserver.observe({
      entryTypes: ['mark', 'measure', 'function', 'gc']
    });
  }

  /**
   * Handle performance entry
   */
  handlePerformanceEntry(entry) {
    switch (entry.entryType) {
      case 'gc':
        this.handleGCEvent(entry);
        break;
      case 'function':
        this.handleFunctionEvent(entry);
        break;
    }
  }

  /**
   * Handle GC event
   */
  handleGCEvent(entry) {
    const gcEvent = {
      timestamp: Date.now(),
      kind: entry.kind,
      duration: entry.duration
    };
    
    this.addTimelineEvent('gc', gcEvent);
    
    if (entry.duration > 10) {
      console.log(`🗑️ GC pause: ${entry.duration.toFixed(2)}ms`);
    }
  }

  /**
   * Handle function event
   */
  handleFunctionEvent(entry) {
    if (entry.duration > this.config.functionThreshold) {
      console.log(`🟢 Slow function: ${entry.name} (${entry.duration.toFixed(2)}ms)`);
    }
  }

  /**
   * Start real-time metrics
   */
  startRealTimeMetrics() {
    this.metricsInterval = setInterval(() => {
      this.displayRealTimeMetrics();
    }, 1000);
  }

  /**
   * Display real-time metrics
   */
  displayRealTimeMetrics() {
    const cpu = process.cpuUsage();
    const mem = process.memoryUsage();
    
    // Calculate CPU percentage
    const cpuPercent = ((cpu.user + cpu.system) / 1000000) * 100;
    
    // Format memory
    const memMB = (mem.heapUsed / 1024 / 1024).toFixed(2);
    const totalMB = (mem.heapTotal / 1024 / 1024).toFixed(2);
    
    // Find hot functions
    const hotFunctions = Array.from(this.functionTimings.values())
      .sort((a, b) => b.samples - a.samples)
      .slice(0, 3);
    
    // Clear and redraw
    process.stdout.write('\x1b[2K\r');
    process.stdout.write(
      `📊 CPU: ${cpuPercent.toFixed(1)}% | ` +
      `Memory: ${memMB}/${totalMB}MB | ` +
      `Hot: ${hotFunctions.map(f => f.function).join(', ')}`
    );
  }

  /**
   * Generate profiling report
   */
  async generateReport() {
    const duration = this.state.endTime - this.state.startTime;
    
    // Analyze functions
    const functions = Array.from(this.functionTimings.values());
    const sortedFunctions = functions.sort((a, b) => b.samples - a.samples);
    
    // Find hot and slow functions
    this.metrics.functions.hot = sortedFunctions.slice(0, 10).map(f => ({
      function: f.function,
      file: f.file,
      line: f.line,
      samples: f.samples,
      percentage: (f.samples / this.cpuSamples.length * 100).toFixed(2)
    }));
    
    this.metrics.functions.slow = functions
      .filter(f => f.totalTime > this.config.functionThreshold)
      .sort((a, b) => b.totalTime - a.totalTime)
      .slice(0, 10);
    
    const report = {
      duration,
      startTime: this.state.startTime,
      endTime: this.state.endTime,
      cpu: this.metrics.cpu,
      memory: this.metrics.memory,
      functions: this.metrics.functions,
      bottlenecks: this.metrics.bottlenecks,
      timeline: {
        events: this.timeline.length,
        marks: this.marks.size,
        measures: this.measures.size
      },
      samples: {
        cpu: this.cpuSamples.length,
        memory: this.memoryTimeline.length
      }
    };
    
    // Save report to file
    await this.saveReport(report);
    
    // Display summary
    this.displaySummary(report);
    
    return report;
  }

  /**
   * Save report to file
   */
  async saveReport(report) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `profile-${timestamp}.json`;
    const filepath = path.join(this.config.outputDir, filename);
    
    await fs.writeFile(filepath, JSON.stringify(report, null, 2));
    
    // Save CPU profile if available
    if (this.cpuSamples.length > 0) {
      const cpuFile = path.join(this.config.outputDir, `cpu-${timestamp}.json`);
      await fs.writeFile(cpuFile, JSON.stringify(this.cpuSamples, null, 2));
    }
    
    // Save memory timeline
    if (this.memoryTimeline.length > 0) {
      const memFile = path.join(this.config.outputDir, `memory-${timestamp}.json`);
      await fs.writeFile(memFile, JSON.stringify(this.memoryTimeline, null, 2));
    }
    
    console.log(`📁 Report saved: ${filename}`);
  }

  /**
   * Display summary
   */
  displaySummary(report) {
    console.log('\n' + '='.repeat(60));
    console.log('📊 PERFORMANCE PROFILE SUMMARY');
    console.log('='.repeat(60));
    
    console.log(`\nDuration: ${(report.duration / 1000).toFixed(2)}s`);
    
    console.log('\n🔥 CPU Metrics:');
    console.log(`  User Time: ${(report.cpu.userTime / 1000000).toFixed(2)}s`);
    console.log(`  System Time: ${(report.cpu.systemTime / 1000000).toFixed(2)}s`);
    console.log(`  Usage: ${report.cpu.usage.toFixed(2)}%`);
    
    console.log('\n💾 Memory Metrics:');
    console.log(`  Heap Used: ${(report.memory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
    console.log(`  Heap Total: ${(report.memory.heapTotal / 1024 / 1024).toFixed(2)}MB`);
    console.log(`  RSS: ${(report.memory.rss / 1024 / 1024).toFixed(2)}MB`);
    
    if (report.functions.hot.length > 0) {
      console.log('\n🔥 Hot Functions:');
      report.functions.hot.slice(0, 5).forEach((f, i) => {
        console.log(`  ${i + 1}. ${f.function} (${f.percentage}%)`);
      });
    }
    
    if (report.bottlenecks.length > 0) {
      console.log('\n🐌 Bottlenecks:');
      report.bottlenecks.slice(0, 5).forEach((b, i) => {
        console.log(`  ${i + 1}. ${b.name} (${b.duration.toFixed(2)}ms)`);
      });
    }
    
    console.log('\n' + '='.repeat(60));
  }

  /**
   * Ensure output directory exists
   */
  async ensureOutputDir() {
    try {
      await fs.mkdir(this.config.outputDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create output directory:', error);
    }
  }

  /**
   * Get current stats
   */
  getStats() {
    return {
      active: this.state.active,
      profiling: this.state.profiling,
      cpuSamples: this.cpuSamples.length,
      memorySnapshots: this.memorySnapshots.length,
      timelineEvents: this.timeline.length,
      functionTimings: this.functionTimings.size,
      bottlenecks: this.metrics.bottlenecks.length
    };
  }
}

module.exports = PerformanceProfiler;
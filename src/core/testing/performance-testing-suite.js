/**
 * BUMBA Performance Testing Suite
 * Load testing, stress testing, and performance benchmarking
 */

const { EventEmitter } = require('events');
const { performance } = require('perf_hooks');
const { logger } = require('../logging/bumba-logger');
const cluster = require('cluster');
const os = require('os');

class PerformanceTestingSuite extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      workers: config.workers || os.cpus().length,
      duration: config.duration || 60000, // 1 minute default
      rampUp: config.rampUp || 10000, // 10 seconds
      coolDown: config.coolDown || 5000, // 5 seconds
      thresholds: config.thresholds || {
        responseTime: { p95: 1000, p99: 2000 },
        errorRate: 0.01,
        throughput: 100
      },
      ...config
    };
    
    this.scenarios = new Map();
    this.benchmarks = new Map();
    this.results = new Map();
    this.metrics = {
      requests: [],
      errors: [],
      throughput: [],
      latency: [],
      cpu: [],
      memory: []
    };
  }
  
  /**
   * Define load test scenario
   */
  defineScenario(name, config) {
    const scenario = {
      name,
      vus: config.vus || 10, // Virtual users
      iterations: config.iterations || 100,
      duration: config.duration || this.config.duration,
      rampUp: config.rampUp || this.config.rampUp,
      executor: config.executor || 'constant',
      stages: config.stages || [],
      setup: config.setup || (() => {}),
      teardown: config.teardown || (() => {}),
      test: config.test
    };
    
    this.scenarios.set(name, scenario);
    
    return {
      withVUs: (vus) => {
        scenario.vus = vus;
        return this;
      },
      
      withDuration: (duration) => {
        scenario.duration = duration;
        return this;
      },
      
      withStages: (stages) => {
        scenario.stages = stages;
        scenario.executor = 'ramping';
        return this;
      },
      
      withSetup: (fn) => {
        scenario.setup = fn;
        return this;
      },
      
      withTeardown: (fn) => {
        scenario.teardown = fn;
        return this;
      }
    };
  }
  
  /**
   * Run load test scenario
   */
  async runScenario(name) {
    const scenario = this.scenarios.get(name);
    if (!scenario) {
      throw new Error(`Scenario "${name}" not found`);
    }
    
    logger.info(`Running performance scenario: ${name}`);
    
    const result = {
      name,
      startTime: Date.now(),
      metrics: {
        requests: 0,
        errors: 0,
        responseTimes: [],
        throughput: [],
        virtualUsers: []
      },
      status: 'running'
    };
    
    try {
      // Setup
      await scenario.setup();
      
      // Execute based on executor type
      switch (scenario.executor) {
        case 'constant':
          await this.runConstantLoad(scenario, result);
          break;
        
        case 'ramping':
          await this.runRampingLoad(scenario, result);
          break;
        
        case 'spike':
          await this.runSpikeTest(scenario, result);
          break;
        
        case 'stress':
          await this.runStressTest(scenario, result);
          break;
        
        default:
          await this.runConstantLoad(scenario, result);
      }
      
      // Teardown
      await scenario.teardown();
      
      // Analyze results
      result.analysis = this.analyzeResults(result.metrics);
      result.passed = this.checkThresholds(result.analysis);
      result.status = result.passed ? 'passed' : 'failed';
      
    } catch (error) {
      result.status = 'failed';
      result.error = error.message;
    }
    
    result.endTime = Date.now();
    result.duration = result.endTime - result.startTime;
    
    this.results.set(name, result);
    this.emit('scenario-complete', result);
    
    return result;
  }
  
  /**
   * Run constant load test
   */
  async runConstantLoad(scenario, result) {
    const virtualUsers = [];
    const startTime = Date.now();
    
    // Create virtual users
    for (let i = 0; i < scenario.vus; i++) {
      virtualUsers.push(this.createVirtualUser(i, scenario, result));
    }
    
    // Run test for duration
    const endTime = startTime + scenario.duration;
    
    while (Date.now() < endTime) {
      await Promise.all(virtualUsers.map(vu => vu.execute()));
      
      // Collect metrics
      this.collectMetrics(result);
      
      await this.sleep(100); // Check every 100ms
    }
    
    // Stop virtual users
    virtualUsers.forEach(vu => vu.stop());
  }
  
  /**
   * Run ramping load test
   */
  async runRampingLoad(scenario, result) {
    const stages = scenario.stages || [
      { duration: 10000, target: scenario.vus / 2 },
      { duration: 20000, target: scenario.vus },
      { duration: 10000, target: scenario.vus / 2 },
      { duration: 10000, target: 0 }
    ];
    
    const virtualUsers = [];
    
    for (const stage of stages) {
      const startVUs = virtualUsers.length;
      const targetVUs = stage.target;
      const duration = stage.duration;
      const step = (targetVUs - startVUs) / (duration / 1000);
      
      const stageStart = Date.now();
      
      while (Date.now() - stageStart < duration) {
        const elapsed = Date.now() - stageStart;
        const currentVUs = Math.floor(startVUs + step * (elapsed / 1000));
        
        // Add or remove VUs
        while (virtualUsers.length < currentVUs) {
          virtualUsers.push(this.createVirtualUser(virtualUsers.length, scenario, result));
        }
        
        while (virtualUsers.length > currentVUs) {
          const vu = virtualUsers.pop();
          vu.stop();
        }
        
        // Execute current VUs
        await Promise.all(virtualUsers.map(vu => vu.execute()));
        
        // Collect metrics
        this.collectMetrics(result);
        result.metrics.virtualUsers.push({
          timestamp: Date.now(),
          count: virtualUsers.length
        });
        
        await this.sleep(100);
      }
    }
    
    // Stop all VUs
    virtualUsers.forEach(vu => vu.stop());
  }
  
  /**
   * Run spike test
   */
  async runSpikeTest(scenario, result) {
    const spikeStages = [
      { duration: 5000, target: 5 },           // Warm up
      { duration: 2000, target: scenario.vus }, // Spike
      { duration: 5000, target: scenario.vus }, // Sustain
      { duration: 2000, target: 5 },           // Drop
      { duration: 5000, target: 5 }            // Recovery
    ];
    
    scenario.stages = spikeStages;
    await this.runRampingLoad(scenario, result);
  }
  
  /**
   * Run stress test
   */
  async runStressTest(scenario, result) {
    const stressStages = [
      { duration: 10000, target: scenario.vus * 0.5 },
      { duration: 10000, target: scenario.vus },
      { duration: 10000, target: scenario.vus * 1.5 },
      { duration: 10000, target: scenario.vus * 2 },
      { duration: 10000, target: scenario.vus * 2.5 },
      { duration: 10000, target: 0 }
    ];
    
    scenario.stages = stressStages;
    await this.runRampingLoad(scenario, result);
  }
  
  /**
   * Create virtual user
   */
  createVirtualUser(id, scenario, result) {
    const vu = {
      id,
      active: true,
      iterations: 0,
      errors: 0,
      
      execute: async function() {
        if (!this.active) return;
        
        const startTime = performance.now();
        
        try {
          await scenario.test({ vuId: this.id, iteration: this.iterations });
          
          const responseTime = performance.now() - startTime;
          result.metrics.responseTimes.push(responseTime);
          result.metrics.requests++;
          this.iterations++;
          
        } catch (error) {
          result.metrics.errors++;
          this.errors++;
        }
      },
      
      stop: function() {
        this.active = false;
      }
    };
    
    return vu;
  }
  
  /**
   * Define benchmark
   */
  defineBenchmark(name, fn, options = {}) {
    const benchmark = {
      name,
      fn,
      warmup: options.warmup || 10,
      iterations: options.iterations || 100,
      async: options.async || false,
      timeout: options.timeout || 5000
    };
    
    this.benchmarks.set(name, benchmark);
    
    return benchmark;
  }
  
  /**
   * Run benchmark
   */
  async runBenchmark(name) {
    const benchmark = this.benchmarks.get(name);
    if (!benchmark) {
      throw new Error(`Benchmark "${name}" not found`);
    }
    
    logger.info(`Running benchmark: ${name}`);
    
    // Warmup
    for (let i = 0; i < benchmark.warmup; i++) {
      if (benchmark.async) {
        await benchmark.fn();
      } else {
        benchmark.fn();
      }
    }
    
    // Measure
    const times = [];
    const memoryUsage = [];
    
    for (let i = 0; i < benchmark.iterations; i++) {
      const memStart = process.memoryUsage();
      const startTime = performance.now();
      
      if (benchmark.async) {
        await benchmark.fn();
      } else {
        benchmark.fn();
      }
      
      const endTime = performance.now();
      const memEnd = process.memoryUsage();
      
      times.push(endTime - startTime);
      memoryUsage.push({
        heap: memEnd.heapUsed - memStart.heapUsed,
        rss: memEnd.rss - memStart.rss
      });
    }
    
    // Calculate statistics
    const stats = this.calculateStats(times);
    const memStats = this.calculateMemoryStats(memoryUsage);
    
    const result = {
      name,
      iterations: benchmark.iterations,
      timing: stats,
      memory: memStats,
      timestamp: Date.now()
    };
    
    this.results.set(name, result);
    this.emit('benchmark-complete', result);
    
    return result;
  }
  
  /**
   * Stress test a function
   */
  async stressTest(fn, options = {}) {
    const config = {
      duration: options.duration || 10000,
      concurrency: options.concurrency || 100,
      rampUp: options.rampUp || 1000,
      ...options
    };
    
    const results = {
      iterations: 0,
      errors: 0,
      responseTimes: [],
      startTime: Date.now()
    };
    
    const workers = [];
    const targetWorkers = config.concurrency;
    const rampUpStep = targetWorkers / (config.rampUp / 100);
    
    // Ramp up
    const rampUpInterval = setInterval(() => {
      if (workers.length < targetWorkers) {
        for (let i = 0; i < rampUpStep && workers.length < targetWorkers; i++) {
          workers.push(this.createWorker(fn, results));
        }
      } else {
        clearInterval(rampUpInterval);
      }
    }, 100);
    
    // Run for duration
    await this.sleep(config.duration);
    
    // Stop workers
    workers.forEach(worker => worker.stop());
    
    results.endTime = Date.now();
    results.duration = results.endTime - results.startTime;
    results.analysis = this.analyzeResults(results);
    
    return results;
  }
  
  /**
   * Create worker for stress testing
   */
  createWorker(fn, results) {
    let active = true;
    
    const work = async () => {
      while (active) {
        const startTime = performance.now();
        
        try {
          await fn();
          results.iterations++;
          results.responseTimes.push(performance.now() - startTime);
        } catch (error) {
          results.errors++;
        }
        
        await this.sleep(0); // Yield to event loop
      }
    };
    
    work(); // Start working
    
    return {
      stop: () => { active = false; }
    };
  }
  
  /**
   * Memory leak detection
   */
  async detectMemoryLeak(fn, options = {}) {
    const iterations = options.iterations || 1000;
    const threshold = options.threshold || 10; // MB
    
    const samples = [];
    
    // Force GC before starting
    if (global.gc) {
      global.gc();
    }
    
    const initialMemory = process.memoryUsage().heapUsed;
    
    for (let i = 0; i < iterations; i++) {
      await fn();
      
      if (i % 100 === 0) {
        if (global.gc) {
          global.gc();
        }
        
        const currentMemory = process.memoryUsage().heapUsed;
        samples.push({
          iteration: i,
          memory: currentMemory,
          delta: currentMemory - initialMemory
        });
      }
    }
    
    // Analyze trend
    const trend = this.analyzeMemoryTrend(samples);
    const leaked = trend.slope > threshold * 1024 * 1024 / iterations;
    
    return {
      leaked,
      trend,
      samples,
      growth: (samples[samples.length - 1].memory - initialMemory) / (1024 * 1024),
      growthRate: trend.slope * 1000
    };
  }
  
  /**
   * Analyze memory trend
   */
  analyzeMemoryTrend(samples) {
    if (samples.length < 2) return { slope: 0, intercept: 0 };
    
    const n = samples.length;
    const sumX = samples.reduce((sum, s) => sum + s.iteration, 0);
    const sumY = samples.reduce((sum, s) => sum + s.memory, 0);
    const sumXY = samples.reduce((sum, s) => sum + s.iteration * s.memory, 0);
    const sumX2 = samples.reduce((sum, s) => sum + s.iteration * s.iteration, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    return { slope, intercept };
  }
  
  /**
   * Profile function performance
   */
  async profile(fn, options = {}) {
    const iterations = options.iterations || 100;
    const detailed = options.detailed || false;
    
    const profile = {
      name: fn.name || 'anonymous',
      iterations,
      samples: [],
      callStack: []
    };
    
    for (let i = 0; i < iterations; i++) {
      const sample = {
        iteration: i,
        startTime: performance.now(),
        startMemory: process.memoryUsage()
      };
      
      if (detailed) {
        // Capture call stack
        const originalPrepareStackTrace = Error.prepareStackTrace;
        Error.prepareStackTrace = (_, stack) => stack;
        const stack = new Error().stack;
        Error.prepareStackTrace = originalPrepareStackTrace;
        sample.callStack = stack;
      }
      
      await fn();
      
      sample.endTime = performance.now();
      sample.endMemory = process.memoryUsage();
      sample.duration = sample.endTime - sample.startTime;
      sample.memoryDelta = {
        heap: sample.endMemory.heapUsed - sample.startMemory.heapUsed,
        rss: sample.endMemory.rss - sample.startMemory.rss
      };
      
      profile.samples.push(sample);
    }
    
    // Analyze profile
    profile.analysis = {
      timing: this.calculateStats(profile.samples.map(s => s.duration)),
      memory: this.calculateMemoryStats(profile.samples.map(s => s.memoryDelta))
    };
    
    return profile;
  }
  
  /**
   * Collect metrics
   */
  collectMetrics(result) {
    const now = Date.now();
    
    // Calculate throughput
    const recentRequests = result.metrics.requests;
    const throughput = recentRequests / ((now - result.startTime) / 1000);
    
    result.metrics.throughput.push({
      timestamp: now,
      value: throughput
    });
    
    // Collect system metrics
    const cpuUsage = process.cpuUsage();
    const memUsage = process.memoryUsage();
    
    this.metrics.cpu.push({
      timestamp: now,
      user: cpuUsage.user,
      system: cpuUsage.system
    });
    
    this.metrics.memory.push({
      timestamp: now,
      rss: memUsage.rss,
      heapTotal: memUsage.heapTotal,
      heapUsed: memUsage.heapUsed
    });
  }
  
  /**
   * Analyze results
   */
  analyzeResults(metrics) {
    const analysis = {
      requests: {
        total: metrics.requests,
        failed: metrics.errors,
        successRate: metrics.requests > 0 
          ? ((metrics.requests - metrics.errors) / metrics.requests * 100).toFixed(2) + '%'
          : '0%'
      },
      responseTime: this.calculateStats(metrics.responseTimes),
      throughput: {
        avg: metrics.throughput.length > 0
          ? metrics.throughput.reduce((sum, t) => sum + t.value, 0) / metrics.throughput.length
          : 0,
        max: metrics.throughput.length > 0
          ? Math.max(...metrics.throughput.map(t => t.value))
          : 0
      },
      virtualUsers: {
        max: metrics.virtualUsers.length > 0
          ? Math.max(...metrics.virtualUsers.map(v => v.count))
          : 0
      }
    };
    
    return analysis;
  }
  
  /**
   * Calculate statistics
   */
  calculateStats(values) {
    if (values.length === 0) {
      return { min: 0, max: 0, mean: 0, median: 0, p95: 0, p99: 0, stdDev: 0 };
    }
    
    const sorted = [...values].sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);
    const mean = sum / sorted.length;
    
    const variance = sorted.reduce((sum, val) => {
      return sum + Math.pow(val - mean, 2);
    }, 0) / sorted.length;
    
    return {
      min: sorted[0],
      max: sorted[sorted.length - 1],
      mean,
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
      stdDev: Math.sqrt(variance)
    };
  }
  
  /**
   * Calculate memory statistics
   */
  calculateMemoryStats(samples) {
    const heapValues = samples.map(s => s.heap || 0);
    const rssValues = samples.map(s => s.rss || 0);
    
    return {
      heap: this.calculateStats(heapValues),
      rss: this.calculateStats(rssValues)
    };
  }
  
  /**
   * Check thresholds
   */
  checkThresholds(analysis) {
    const thresholds = this.config.thresholds;
    let passed = true;
    
    // Check response time
    if (thresholds.responseTime) {
      if (thresholds.responseTime.p95 && analysis.responseTime.p95 > thresholds.responseTime.p95) {
        logger.warn(`Response time P95 ${analysis.responseTime.p95}ms exceeds threshold ${thresholds.responseTime.p95}ms`);
        passed = false;
      }
      
      if (thresholds.responseTime.p99 && analysis.responseTime.p99 > thresholds.responseTime.p99) {
        logger.warn(`Response time P99 ${analysis.responseTime.p99}ms exceeds threshold ${thresholds.responseTime.p99}ms`);
        passed = false;
      }
    }
    
    // Check error rate
    if (thresholds.errorRate) {
      const errorRate = analysis.requests.failed / analysis.requests.total;
      if (errorRate > thresholds.errorRate) {
        logger.warn(`Error rate ${(errorRate * 100).toFixed(2)}% exceeds threshold ${(thresholds.errorRate * 100).toFixed(2)}%`);
        passed = false;
      }
    }
    
    // Check throughput
    if (thresholds.throughput && analysis.throughput.avg < thresholds.throughput) {
      logger.warn(`Throughput ${analysis.throughput.avg.toFixed(2)} req/s below threshold ${thresholds.throughput} req/s`);
      passed = false;
    }
    
    return passed;
  }
  
  /**
   * Sleep helper
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Generate performance report
   */
  generateReport() {
    const report = {
      timestamp: Date.now(),
      scenarios: Array.from(this.results.values()).filter(r => r.analysis),
      benchmarks: Array.from(this.results.values()).filter(r => r.timing),
      summary: {
        totalTests: this.results.size,
        passed: Array.from(this.results.values()).filter(r => r.passed).length,
        failed: Array.from(this.results.values()).filter(r => r.status === 'failed').length
      }
    };
    
    report.summary.passRate = report.summary.totalTests > 0
      ? (report.summary.passed / report.summary.totalTests * 100).toFixed(2) + '%'
      : '0%';
    
    return report;
  }
}

// Export singleton
module.exports = new PerformanceTestingSuite();
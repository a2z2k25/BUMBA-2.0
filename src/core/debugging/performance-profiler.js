/**
 * BUMBA Performance Profiler
 * Advanced performance analysis and optimization recommendations
 */

const EventEmitter = require('events');
const { performance } = require('perf_hooks');
const { logger } = require('../logging/bumba-logger');

class BumbaPerformanceProfiler extends EventEmitter {
  constructor() {
    super();
    this.profiles = new Map();
    this.activeProfiles = new Map();
    this.metrics = new Map();
    this.flamegraphs = new Map();
    this.benchmarks = new Map();
    this.optimizationEngine = new OptimizationEngine();
    this.anomalyDetector = new PerformanceAnomalyDetector();
  }

  /**
   * Start profiling session
   */
  async startProfiling(config) {
    const profileId = this.generateProfileId();
    
    const profile = {
      id: profileId,
      name: config.name || `Profile ${profileId}`,
      target: config.target, // agent, task, system
      type: config.type || 'comprehensive', // cpu, memory, io, comprehensive
      startTime: performance.now(),
      duration: config.duration || 0, // 0 = until stopped
      sampleInterval: config.sampleInterval || 10, // ms
      metrics: {
        cpu: [],
        memory: [],
        io: [],
        network: [],
        custom: new Map()
      },
      marks: new Map(),
      measures: new Map(),
      callStacks: [],
      metadata: config.metadata || {}
    };

    this.profiles.set(profileId, profile);
    this.activeProfiles.set(profileId, profile);

    // Start collectors based on type
    if (config.type === 'comprehensive' || config.type === 'cpu') {
      this.startCPUProfiling(profile);
    }
    if (config.type === 'comprehensive' || config.type === 'memory') {
      this.startMemoryProfiling(profile);
    }
    if (config.type === 'comprehensive' || config.type === 'io') {
      this.startIOProfiling(profile);
    }

    logger.info(`🟢 Performance profiling started: ${profile.name}`);
    
    this.emit('profiling_started', { profileId, profile });
    
    return profileId;
  }

  /**
   * Stop profiling session
   */
  async stopProfiling(profileId) {
    const profile = this.activeProfiles.get(profileId);
    if (!profile) {
      throw new Error('Profile not found or already stopped');
    }

    profile.endTime = performance.now();
    profile.duration = profile.endTime - profile.startTime;

    // Stop all collectors
    this.stopCollectors(profile);

    // Remove from active profiles
    this.activeProfiles.delete(profileId);

    // Analyze results
    const analysis = await this.analyzeProfile(profile);
    profile.analysis = analysis;

    logger.info(`🟢 Performance profiling stopped: ${profile.name}`);
    
    this.emit('profiling_stopped', { 
      profileId, 
      profile,
      analysis 
    });
    
    return analysis;
  }

  /**
   * Mark a point in time
   */
  mark(name, metadata = {}) {
    const mark = {
      name,
      timestamp: performance.now(),
      metadata
    };

    // Add to all active profiles
    for (const profile of this.activeProfiles.values()) {
      profile.marks.set(name, mark);
    }

    performance.mark(name);
    
    return mark;
  }

  /**
   * Measure between two marks
   */
  measure(name, startMark, endMark) {
    const measure = {
      name,
      startMark,
      endMark,
      duration: 0
    };

    try {
      performance.measure(name, startMark, endMark);
      const perfMeasure = performance.getEntriesByName(name)[0];
      measure.duration = perfMeasure.duration;

      // Add to all active profiles
      for (const profile of this.activeProfiles.values()) {
        if (!profile.measures.has(name)) {
          profile.measures.set(name, []);
        }
        profile.measures.get(name).push(measure);
      }

      logger.debug(`🟢 Measured ${name}: ${measure.duration.toFixed(2)}ms`);
      
    } catch (error) {
      logger.error(`Failed to measure ${name}:`, error);
    }

    return measure;
  }

  /**
   * Record custom metric
   */
  recordMetric(metricName, value, unit = 'count') {
    const metric = {
      name: metricName,
      value,
      unit,
      timestamp: performance.now()
    };

    // Add to all active profiles
    for (const profile of this.activeProfiles.values()) {
      if (!profile.metrics.custom.has(metricName)) {
        profile.metrics.custom.set(metricName, []);
      }
      profile.metrics.custom.get(metricName).push(metric);
    }

    // Check for anomalies
    this.anomalyDetector.checkMetric(metric);
    
    return metric;
  }

  /**
   * Profile a specific function
   */
  async profileFunction(fn, name, iterations = 1) {
    const results = {
      name,
      iterations,
      runs: [],
      statistics: {}
    };

    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      const startMemory = process.memoryUsage();
      
      try {
        // Run function
        const result = await fn();
        
        const endTime = performance.now();
        const endMemory = process.memoryUsage();
        
        results.runs.push({
          iteration: i + 1,
          duration: endTime - startTime,
          memoryDelta: {
            heapUsed: endMemory.heapUsed - startMemory.heapUsed,
            external: endMemory.external - startMemory.external
          },
          result,
          success: true
        });
        
      } catch (error) {
        const endTime = performance.now();
        
        results.runs.push({
          iteration: i + 1,
          duration: endTime - startTime,
          error: error.message,
          success: false
        });
      }
    }

    // Calculate statistics
    results.statistics = this.calculateRunStatistics(results.runs);

    logger.info(`🟢 Function profiled: ${name} (${iterations} iterations)`);
    
    return results;
  }

  /**
   * Create benchmark
   */
  async createBenchmark(benchmarkConfig) {
    const benchmarkId = this.generateBenchmarkId();
    
    const benchmark = {
      id: benchmarkId,
      name: benchmarkConfig.name,
      scenarios: benchmarkConfig.scenarios,
      baseline: benchmarkConfig.baseline,
      iterations: benchmarkConfig.iterations || 100,
      warmup: benchmarkConfig.warmup || 10,
      results: new Map(),
      createdAt: Date.now()
    };

    this.benchmarks.set(benchmarkId, benchmark);

    logger.info(`🏁 Benchmark created: ${benchmark.name}`);
    
    return benchmarkId;
  }

  /**
   * Run benchmark
   */
  async runBenchmark(benchmarkId) {
    const benchmark = this.benchmarks.get(benchmarkId);
    if (!benchmark) {
      throw new Error('Benchmark not found');
    }

    logger.info(`🏁 Running benchmark: ${benchmark.name}`);
    
    const results = new Map();

    for (const scenario of benchmark.scenarios) {
      logger.debug(`Running scenario: ${scenario.name}`);
      
      // Warmup runs
      for (let i = 0; i < benchmark.warmup; i++) {
        await scenario.fn();
      }

      // Actual benchmark runs
      const runs = [];
      for (let i = 0; i < benchmark.iterations; i++) {
        const start = performance.now();
        await scenario.fn();
        const end = performance.now();
        
        runs.push(end - start);
      }

      const scenarioResults = {
        name: scenario.name,
        runs,
        statistics: this.calculateBenchmarkStatistics(runs),
        comparison: null
      };

      // Compare with baseline if available
      if (benchmark.baseline && results.has(benchmark.baseline)) {
        scenarioResults.comparison = this.compareResults(
          results.get(benchmark.baseline).statistics,
          scenarioResults.statistics
        );
      }

      results.set(scenario.name, scenarioResults);
    }

    benchmark.results = results;
    benchmark.lastRun = Date.now();

    logger.info(`🏁 Benchmark completed: ${benchmark.name}`);
    
    this.emit('benchmark_completed', {
      benchmarkId,
      results: Array.from(results.values())
    });

    return {
      benchmarkId,
      results: Array.from(results.values()),
      summary: this.createBenchmarkSummary(results)
    };
  }

  /**
   * Generate flamegraph data
   */
  async generateFlamegraph(profileId) {
    const profile = this.profiles.get(profileId);
    if (!profile) {
      throw new Error('Profile not found');
    }

    const flamegraph = {
      name: 'root',
      value: profile.duration,
      children: []
    };

    // Build flamegraph from call stacks
    for (const stack of profile.callStacks) {
      this.addStackToFlamegraph(flamegraph, stack);
    }

    this.flamegraphs.set(profileId, flamegraph);

    return flamegraph;
  }

  /**
   * Get optimization recommendations
   */
  async getOptimizationRecommendations(profileId) {
    const profile = this.profiles.get(profileId);
    if (!profile) {
      throw new Error('Profile not found');
    }

    const recommendations = await this.optimizationEngine.analyze(profile);

    return {
      profileId,
      recommendations,
      potentialImpact: this.calculatePotentialImpact(recommendations),
      priority: this.prioritizeRecommendations(recommendations)
    };
  }

  /**
   * Compare two profiles
   */
  async compareProfiles(profileId1, profileId2) {
    const profile1 = this.profiles.get(profileId1);
    const profile2 = this.profiles.get(profileId2);

    if (!profile1 || !profile2) {
      throw new Error('One or both profiles not found');
    }

    const comparison = {
      profile1: {
        id: profileId1,
        name: profile1.name,
        duration: profile1.duration
      },
      profile2: {
        id: profileId2,
        name: profile2.name,
        duration: profile2.duration
      },
      metrics: this.compareMetrics(profile1.metrics, profile2.metrics),
      measures: this.compareMeasures(profile1.measures, profile2.measures),
      improvements: [],
      regressions: []
    };

    // Identify improvements and regressions
    for (const [metric, diff] of Object.entries(comparison.metrics)) {
      if (diff.percentChange < -10) {
        comparison.improvements.push({
          metric,
          improvement: Math.abs(diff.percentChange)
        });
      } else if (diff.percentChange > 10) {
        comparison.regressions.push({
          metric,
          regression: diff.percentChange
        });
      }
    }

    return comparison;
  }

  /**
   * Export profile data
   */
  async exportProfile(profileId, format = 'json') {
    const profile = this.profiles.get(profileId);
    if (!profile) {
      throw new Error('Profile not found');
    }

    let exportData;
    
    switch (format) {
      case 'json':
        exportData = JSON.stringify(profile, null, 2);
        break;
      
      case 'csv':
        exportData = this.convertToCSV(profile);
        break;
      
      case 'flamegraph': {
        const 
flamegraph = await this.generateFlamegraph(profileId);
        exportData = JSON.stringify(flamegraph, null, 2);
        break;
      
      case 'report':
        exportData = await this.generateReport(profile);
        break;
      
      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    return {
      format,
      data: exportData,
      metadata: {
        profileId,
        exportedAt: Date.now()
      }
    };
  }

  // Helper methods

  startCPUProfiling(profile) {
    const interval = setInterval(() => {
      if (!this.activeProfiles.has(profile.id)) {
        clearInterval(interval);
        return;
      }

      const cpuUsage = process.cpuUsage();
      profile.metrics.cpu.push({
        timestamp: performance.now(),
        user: cpuUsage.user,
        system: cpuUsage.system,
        percent: this.calculateCPUPercent(cpuUsage)
      });

      // Sample call stack
      if (Math.random() < 0.1) { // 10% sampling
        const stack = this.captureCallStack();
        profile.callStacks.push(stack);
      }

    }, profile.sampleInterval);

    profile.collectors = profile.collectors || {};
    profile.collectors.cpu = interval;
  }

  startMemoryProfiling(profile) {
    const interval = setInterval(() => {
      if (!this.activeProfiles.has(profile.id)) {
        clearInterval(interval);
        return;
      }

      const memUsage = process.memoryUsage();
      profile.metrics.memory.push({
        timestamp: performance.now(),
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        external: memUsage.external,
        rss: memUsage.rss
      });

    }, profile.sampleInterval);

    profile.collectors = profile.collectors || {};
    profile.collectors.memory = interval;
  }

  startIOProfiling(profile) {
    // IO profiling would hook into actual IO operations
    // This is a simplified version
    const interval = setInterval(() => {
      if (!this.activeProfiles.has(profile.id)) {
        clearInterval(interval);
        return;
      }

      profile.metrics.io.push({
        timestamp: performance.now(),
        operations: 0, // Would track actual IO
        bytesRead: 0,
        bytesWritten: 0
      });

    }, profile.sampleInterval * 10); // Less frequent

    profile.collectors = profile.collectors || {};
    profile.collectors.io = interval;
  }

  stopCollectors(profile) {
    if (profile.collectors) {
      for (const [type, interval] of Object.entries(profile.collectors)) {
        clearInterval(interval);
      }
    }
  }

  async analyzeProfile(profile) {
    const analysis = {
      summary: {
        duration: profile.duration,
        sampleCount: profile.metrics.cpu.length,
        markCount: profile.marks.size,
        measureCount: profile.measures.size
      },
      cpu: this.analyzeCPUMetrics(profile.metrics.cpu),
      memory: this.analyzeMemoryMetrics(profile.metrics.memory),
      io: this.analyzeIOMetrics(profile.metrics.io),
      hotspots: this.findHotspots(profile),
      bottlenecks: await this.findBottlenecks(profile),
      anomalies: this.anomalyDetector.analyze(profile)
    };

    return analysis;
  }

  analyzeCPUMetrics(cpuMetrics) {
    if (cpuMetrics.length === 0) {
      return { average: 0, peak: 0, utilization: 0 };
    }

    const percentages = cpuMetrics.map(m => m.percent);
    
    return {
      average: percentages.reduce((a, b) => a + b, 0) / percentages.length,
      peak: Math.max(...percentages),
      min: Math.min(...percentages),
      utilization: this.calculateUtilization(percentages),
      trend: this.calculateTrend(percentages)
    };
  }

  analyzeMemoryMetrics(memoryMetrics) {
    if (memoryMetrics.length === 0) {
      return { average: 0, peak: 0, leaks: [] };
    }

    const heapValues = memoryMetrics.map(m => m.heapUsed);
    
    return {
      average: heapValues.reduce((a, b) => a + b, 0) / heapValues.length,
      peak: Math.max(...heapValues),
      min: Math.min(...heapValues),
      growth: heapValues[heapValues.length - 1] - heapValues[0],
      leaks: this.detectMemoryLeaks(memoryMetrics),
      gcEvents: this.detectGCEvents(heapValues)
    };
  }

  analyzeIOMetrics(ioMetrics) {
    if (ioMetrics.length === 0) {
      return { totalOperations: 0, throughput: 0 };
    }

    const totalOps = ioMetrics.reduce((sum, m) => sum + m.operations, 0);
    const totalBytes = ioMetrics.reduce((sum, m) => 
      sum + m.bytesRead + m.bytesWritten, 0
    );

    return {
      totalOperations: totalOps,
      totalBytes,
      throughput: totalBytes / (ioMetrics.length * ioMetrics[0].timestamp),
      readWriteRatio: this.calculateReadWriteRatio(ioMetrics)
    };
  }

  findHotspots(profile) {
    const hotspots = [];

    // Analyze call stacks for hot functions
    const functionCounts = new Map();
    
    for (const stack of profile.callStacks) {
      for (const frame of stack.frames) {
        const key = frame.function;
        functionCounts.set(key, (functionCounts.get(key) || 0) + 1);
      }
    }

    // Find top hotspots
    const sorted = Array.from(functionCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    for (const [func, count] of sorted) {
      hotspots.push({
        function: func,
        samples: count,
        percentage: (count / profile.callStacks.length) * 100
      });
    }

    return hotspots;
  }

  async findBottlenecks(profile) {
    const bottlenecks = [];

    // Analyze measures for slow operations
    for (const [name, measures] of profile.measures) {
      const durations = measures.map(m => m.duration);
      const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
      
      if (avg > 100) { // Over 100ms average
        bottlenecks.push({
          operation: name,
          averageDuration: avg,
          maxDuration: Math.max(...durations),
          count: measures.length,
          impact: 'high'
        });
      }
    }

    // Sort by impact
    return bottlenecks.sort((a, b) => b.averageDuration - a.averageDuration);
  }

  calculateRunStatistics(runs) {
    const successfulRuns = runs.filter(r => r.success);
    const durations = successfulRuns.map(r => r.duration);
    
    if (durations.length === 0) {
      return { error: 'No successful runs' };
    }

    durations.sort((a, b) => a - b);

    return {
      count: durations.length,
      mean: durations.reduce((a, b) => a + b, 0) / durations.length,
      median: durations[Math.floor(durations.length / 2)],
      min: durations[0],
      max: durations[durations.length - 1],
      p95: durations[Math.floor(durations.length * 0.95)],
      p99: durations[Math.floor(durations.length * 0.99)],
      stdDev: this.calculateStdDev(durations),
      successRate: (successfulRuns.length / runs.length) * 100
    };
  }

  calculateBenchmarkStatistics(runs) {
    runs.sort((a, b) => a - b);
    
    const mean = runs.reduce((a, b) => a + b, 0) / runs.length;
    
    return {
      mean,
      median: runs[Math.floor(runs.length / 2)],
      min: runs[0],
      max: runs[runs.length - 1],
      p95: runs[Math.floor(runs.length * 0.95)],
      p99: runs[Math.floor(runs.length * 0.99)],
      stdDev: this.calculateStdDev(runs),
      ops: 1000 / mean // Operations per second
    };
  }

  compareResults(baseline, current) {
    return {
      speedup: baseline.mean / current.mean,
      percentChange: ((current.mean - baseline.mean) / baseline.mean) * 100,
      medianDiff: current.median - baseline.median,
      verdict: current.mean < baseline.mean ? 'faster' : 'slower'
    };
  }

  createBenchmarkSummary(results) {
    const scenarios = Array.from(results.values());
    const fastest = scenarios.reduce((prev, curr) => 
      curr.statistics.mean < prev.statistics.mean ? curr : prev
    );

    return {
      fastest: fastest.name,
      scenarios: scenarios.map(s => ({
        name: s.name,
        mean: s.statistics.mean,
        ops: s.statistics.ops,
        comparison: s.comparison
      }))
    };
  }

  addStackToFlamegraph(node, stack) {
    // Build flamegraph structure from stack trace
    let current = node;
    
    for (const frame of stack.frames) {
      let child = current.children.find(c => c.name === frame.function);
      
      if (!child) {
        child = {
          name: frame.function,
          value: 0,
          children: []
        };
        current.children.push(child);
      }
      
      child.value += stack.duration || 1;
      current = child;
    }
  }

  calculateCPUPercent(cpuUsage) {
    // Simple CPU percentage calculation
    const total = cpuUsage.user + cpuUsage.system;
    return (total / 1000000) * 100; // Convert microseconds to percentage
  }

  captureCallStack() {
    // Capture current call stack
    const stack = new Error().stack;
    const frames = stack.split('\n').slice(2).map(line => {
      const match = line.match(/at (\S+)/);
      return {
        function: match ? match[1] : 'unknown',
        line: line.trim()
      };
    });

    return {
      timestamp: performance.now(),
      frames: frames.slice(0, 20) // Limit depth
    };
  }

  calculateUtilization(values) {
    // Calculate what percentage of time CPU was above 50%
    const highUtilization = values.filter(v => v > 50).length;
    return (highUtilization / values.length) * 100;
  }

  calculateTrend(values) {
    if (values.length < 2) {return 'stable';}
    
    // Simple linear regression
    const n = values.length;
    const sumX = values.reduce((sum, _, i) => sum + i, 0);
    const sumY = values.reduce((sum, v) => sum + v, 0);
    const sumXY = values.reduce((sum, v, i) => sum + i * v, 0);
    const sumX2 = values.reduce((sum, _, i) => sum + i * i, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    
    if (slope > 0.1) {return 'increasing';}
    if (slope < -0.1) {return 'decreasing';}
    return 'stable';
  }

  detectMemoryLeaks(memoryMetrics) {
    const leaks = [];
    const heapGrowth = [];
    
    // Calculate growth rate
    for (let i = 1; i < memoryMetrics.length; i++) {
      const growth = memoryMetrics[i].heapUsed - memoryMetrics[i - 1].heapUsed;
      heapGrowth.push(growth);
    }
    
    // Detect consistent growth
    const avgGrowth = heapGrowth.reduce((a, b) => a + b, 0) / heapGrowth.length;
    
    if (avgGrowth > 1024 * 1024) { // 1MB average growth
      leaks.push({
        type: 'consistent_growth',
        severity: 'high',
        avgGrowthPerSample: avgGrowth,
        totalGrowth: memoryMetrics[memoryMetrics.length - 1].heapUsed - 
                    memoryMetrics[0].heapUsed
      });
    }
    
    return leaks;
  }

  detectGCEvents(heapValues) {
    const gcEvents = [];
    
    for (let i = 1; i < heapValues.length; i++) {
      const drop = heapValues[i - 1] - heapValues[i];
      
      if (drop > 1024 * 1024 * 10) { // 10MB drop
        gcEvents.push({
          index: i,
          size: drop,
          type: drop > 1024 * 1024 * 50 ? 'major' : 'minor'
        });
      }
    }
    
    return gcEvents;
  }

  calculateReadWriteRatio(ioMetrics) {
    const totalRead = ioMetrics.reduce((sum, m) => sum + m.bytesRead, 0);
    const totalWrite = ioMetrics.reduce((sum, m) => sum + m.bytesWritten, 0);
    
    if (totalWrite === 0) {return Infinity;}
    return totalRead / totalWrite;
  }

  calculateStdDev(values) {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => 
      sum + Math.pow(val - mean, 2), 0
    ) / values.length;
    
    return Math.sqrt(variance);
  }

  compareMetrics(metrics1, metrics2) {
    const comparison = {};
    
    // Compare CPU
    if (metrics1.cpu.length > 0 && metrics2.cpu.length > 0) {
      const cpu1 = this.analyzeCPUMetrics(metrics1.cpu);
      const cpu2 = this.analyzeCPUMetrics(metrics2.cpu);
      
      comparison.cpu = {
        averageDiff: cpu2.average - cpu1.average,
        percentChange: ((cpu2.average - cpu1.average) / cpu1.average) * 100
      };
    }
    
    // Compare Memory
    if (metrics1.memory.length > 0 && metrics2.memory.length > 0) {
      const mem1 = this.analyzeMemoryMetrics(metrics1.memory);
      const mem2 = this.analyzeMemoryMetrics(metrics2.memory);
      
      comparison.memory = {
        averageDiff: mem2.average - mem1.average,
        percentChange: ((mem2.average - mem1.average) / mem1.average) * 100
      };
    }
    
    return comparison;
  }

  compareMeasures(measures1, measures2) {
    const comparison = {};
    
    for (const [name, m1] of measures1) {
      if (measures2.has(name)) {
        const m2 = measures2.get(name);
        const avg1 = m1.reduce((sum, m) => sum + m.duration, 0) / m1.length;
        const avg2 = m2.reduce((sum, m) => sum + m.duration, 0) / m2.length;
        
        comparison[name] = {
          avg1,
          avg2,
          diff: avg2 - avg1,
          percentChange: ((avg2 - avg1) / avg1) * 100
        };
      }
    }
    
    return comparison;
  }

  calculatePotentialImpact(recommendations) {
    let totalImpact = 0;
    
    for (const rec of recommendations) {
      totalImpact += rec.estimatedImprovement || 0;
    }
    
    return {
      totalPercentImprovement: totalImpact,
      category: totalImpact > 50 ? 'high' : totalImpact > 20 ? 'medium' : 'low'
    };
  }

  prioritizeRecommendations(recommendations) {
    return recommendations.sort((a, b) => {
      // Sort by impact and effort
      const scoreA = (a.estimatedImprovement || 0) / (a.effort || 1);
      const scoreB = (b.estimatedImprovement || 0) / (b.effort || 1);
      return scoreB - scoreA;
    });
  }

  convertToCSV(profile) {
    const rows = ['timestamp,cpu_percent,heap_used,heap_total'];
    
    const maxLength = Math.max(
      profile.metrics.cpu.length,
      profile.metrics.memory.length
    );
    
    for (let i = 0; i < maxLength; i++) {
      const cpu = profile.metrics.cpu[i];
      const mem = profile.metrics.memory[i];
      
      rows.push([
        cpu?.timestamp || '',
        cpu?.percent || '',
        mem?.heapUsed || '',
        mem?.heapTotal || ''
      ].join(','));
    }
    
    return rows.join('\n');
  }

  async generateReport(profile) {
    const analysis = profile.analysis || await this.analyzeProfile(profile);
    
    const lines = [
      '# Performance Profile Report',
      `## ${profile.name}`,
      '',
      `**Duration**: ${(profile.duration / 1000).toFixed(2)}s`,
      `**Samples**: ${profile.metrics.cpu.length}`,
      '',
      '## CPU Analysis',
      `- Average: ${analysis.cpu.average.toFixed(2)}%`,
      `- Peak: ${analysis.cpu.peak.toFixed(2)}%`,
      `- Utilization: ${analysis.cpu.utilization.toFixed(2)}%`,
      `- Trend: ${analysis.cpu.trend}`,
      '',
      '## Memory Analysis',
      `- Average: ${(analysis.memory.average / 1024 / 1024).toFixed(2)}MB`,
      `- Peak: ${(analysis.memory.peak / 1024 / 1024).toFixed(2)}MB`,
      `- Growth: ${(analysis.memory.growth / 1024 / 1024).toFixed(2)}MB`,
      `- Leaks: ${analysis.memory.leaks.length} potential leaks detected`,
      '',
      '## Hotspots',
      ...analysis.hotspots.map(h => 
        `- ${h.function}: ${h.percentage.toFixed(1)}% (${h.samples} samples)`
      ),
      '',
      '## Bottlenecks',
      ...analysis.bottlenecks.map(b => 
        `- ${b.operation}: ${b.averageDuration.toFixed(2)}ms avg (${b.count} calls)`
      )
    ];
    
    return lines.join('\n');
  }

  // ID generators
  generateProfileId() {
    return `profile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  generateBenchmarkId() {
    return `benchmark-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Performance Optimization Engine
 */
class OptimizationEngine {
  async analyze(profile) {
    const recommendations = [];
    
    // CPU optimizations
    if (profile.analysis?.cpu) {
      recommendations.push(...this.analyzeCPUOptimizations(profile.analysis.cpu));
    }
    
    // Memory optimizations
    if (profile.analysis?.memory) {
      recommendations.push(...this.analyzeMemoryOptimizations(profile.analysis.memory));
    }
    
    // Hotspot optimizations
    if (profile.analysis?.hotspots) {
      recommendations.push(...this.analyzeHotspotOptimizations(profile.analysis.hotspots));
    }
    
    // Bottleneck optimizations
    if (profile.analysis?.bottlenecks) {
      recommendations.push(...this.analyzeBottleneckOptimizations(profile.analysis.bottlenecks));
    }
    
    return recommendations;
  }

  analyzeCPUOptimizations(cpuAnalysis) {
    const recommendations = [];
    
    if (cpuAnalysis.average > 80) {
      recommendations.push({
        type: 'cpu',
        severity: 'high',
        title: 'High CPU Usage',
        description: 'Average CPU usage is above 80%',
        suggestion: 'Consider optimizing algorithms or adding worker threads',
        estimatedImprovement: 30,
        effort: 3
      });
    }
    
    if (cpuAnalysis.trend === 'increasing') {
      recommendations.push({
        type: 'cpu',
        severity: 'medium',
        title: 'Increasing CPU Usage',
        description: 'CPU usage is trending upward',
        suggestion: 'Investigate recent changes that may be causing increased load',
        estimatedImprovement: 15,
        effort: 2
      });
    }
    
    return recommendations;
  }

  analyzeMemoryOptimizations(memoryAnalysis) {
    const recommendations = [];
    
    if (memoryAnalysis.leaks.length > 0) {
      recommendations.push({
        type: 'memory',
        severity: 'critical',
        title: 'Memory Leak Detected',
        description: `${memoryAnalysis.leaks.length} potential memory leaks found`,
        suggestion: 'Review object lifecycle and ensure proper cleanup',
        estimatedImprovement: 40,
        effort: 4
      });
    }
    
    if (memoryAnalysis.growth > 100 * 1024 * 1024) { // 100MB
      recommendations.push({
        type: 'memory',
        severity: 'high',
        title: 'High Memory Growth',
        description: `Memory grew by ${(memoryAnalysis.growth / 1024 / 1024).toFixed(0)}MB`,
        suggestion: 'Implement object pooling or caching strategies',
        estimatedImprovement: 25,
        effort: 3
      });
    }
    
    return recommendations;
  }

  analyzeHotspotOptimizations(hotspots) {
    const recommendations = [];
    
    for (const hotspot of hotspots.slice(0, 3)) { // Top 3
      if (hotspot.percentage > 20) {
        recommendations.push({
          type: 'hotspot',
          severity: 'high',
          title: `Optimize ${hotspot.function}`,
          description: `Function accounts for ${hotspot.percentage.toFixed(1)}% of CPU time`,
          suggestion: 'Consider caching results or optimizing algorithm',
          estimatedImprovement: hotspot.percentage * 0.5,
          effort: 3
        });
      }
    }
    
    return recommendations;
  }

  analyzeBottleneckOptimizations(bottlenecks) {
    const recommendations = [];
    
    for (const bottleneck of bottlenecks) {
      if (bottleneck.averageDuration > 500) {
        recommendations.push({
          type: 'bottleneck',
          severity: 'high',
          title: `Optimize ${bottleneck.operation}`,
          description: `Operation takes ${bottleneck.averageDuration.toFixed(0)}ms on average`,
          suggestion: 'Consider async processing or batching',
          estimatedImprovement: 20,
          effort: 2
        });
      }
    }
    
    return recommendations;
  }
}

/**
 * Performance Anomaly Detector
 */
class PerformanceAnomalyDetector {
  constructor() {
    this.baselines = new Map();
    this.anomalies = [];
  }

  checkMetric(metric) {
    const baseline = this.baselines.get(metric.name);
    
    if (!baseline) {
      this.updateBaseline(metric);
      return;
    }
    
    // Simple anomaly detection
    const deviation = Math.abs(metric.value - baseline.mean) / baseline.stdDev;
    
    if (deviation > 3) { // 3 standard deviations
      this.anomalies.push({
        metric: metric.name,
        value: metric.value,
        baseline: baseline.mean,
        deviation,
        timestamp: metric.timestamp
      });
    }
    
    this.updateBaseline(metric);
  }

  updateBaseline(metric) {
    let baseline = this.baselines.get(metric.name);
    
    if (!baseline) {
      baseline = {
        values: [],
        mean: 0,
        stdDev: 0
      };
      this.baselines.set(metric.name, baseline);
    }
    
    baseline.values.push(metric.value);
    
    // Keep only recent values
    if (baseline.values.length > 1000) {
      baseline.values.shift();
    }
    
    // Recalculate statistics
    baseline.mean = baseline.values.reduce((a, b) => a + b, 0) / baseline.values.length;
    
    const variance = baseline.values.reduce((sum, val) => 
      sum + Math.pow(val - baseline.mean, 2), 0
    ) / baseline.values.length;
    
    baseline.stdDev = Math.sqrt(variance);
  }

  analyze(profile) {
    // Return anomalies detected during profiling
    return this.anomalies.filter(a => 
      a.timestamp >= profile.startTime && 
      a.timestamp <= profile.endTime
    );
  }
}

module.exports = { 
  BumbaPerformanceProfiler,
  OptimizationEngine,
  PerformanceAnomalyDetector
};
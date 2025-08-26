/**
 * BUMBA Performance Benchmark Module
 * Measures and reports performance metrics for critical operations
 */

const { performance } = require('perf_hooks');
const { logger } = require('../logging/bumba-logger');

class PerformanceBenchmark {
  constructor() {
    this.metrics = new Map();
    this.baselines = new Map();
    this.suites = new Map();
    this.results = new Map();
    this.thresholds = {
      routing: 50, // ms
      specialist_init: 100, // ms
      command_execution: 500, // ms
      memory_operation: 30, // ms
      file_operation: 100, // ms
    };
  }

  /**
   * Start timing an operation
   */
  start(operation) {
    this.metrics.set(operation, {
      startTime: performance.now(),
      startMemory: process.memoryUsage(),
    });
  }

  /**
   * End timing and record metrics
   */
  end(operation, metadata = {}) {
    const metric = this.metrics.get(operation);
    if (!metric) {
      logger.warn(`No start time found for operation: ${operation}`);
      return null;
    }

    const endTime = performance.now();
    const endMemory = process.memoryUsage();
    const duration = endTime - metric.startTime;
    const memoryDelta = {
      heapUsed: endMemory.heapUsed - metric.startMemory.heapUsed,
      external: endMemory.external - metric.startMemory.external,
    };

    const result = {
      operation,
      duration,
      memoryDelta,
      timestamp: new Date().toISOString(),
      ...metadata,
    };

    // Check against thresholds
    const threshold = this.thresholds[operation];
    if (threshold && duration > threshold) {
      logger.warn(`Performance warning: ${operation} took ${duration.toFixed(2)}ms (threshold: ${threshold}ms)`);
    }

    // Store result
    if (!this.results.has(operation)) {
      this.results.set(operation, []);
    }
    this.results.get(operation).push(result);

    this.metrics.delete(operation);
    return result;
  }

  /**
   * Benchmark an async function
   */
  async benchmarkAsync(operation, fn, metadata = {}) {
    this.start(operation);
    try {
      const result = await fn();
      const metrics = this.end(operation, metadata);
      return { result, metrics };
    } catch (error) {
      const metrics = this.end(operation, { ...metadata, error: error.message });
      throw error;
    }
  }

  /**
   * Benchmark a sync function
   */
  benchmarkSync(operation, fn, metadata = {}) {
    this.start(operation);
    try {
      const result = fn();
      const metrics = this.end(operation, metadata);
      return { result, metrics };
    } catch (error) {
      const metrics = this.end(operation, { ...metadata, error: error.message });
      throw error;
    }
  }

  /**
   * Run a benchmark with multiple iterations
   */
  async run(name, fn, options = {}) {
    const iterations = options.iterations || 100;
    const warmup = options.warmup || 10;
    const results = [];
    
    // Warmup phase
    for (let i = 0; i < warmup; i++) {
      await fn();
    }
    
    // Actual benchmark
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await fn();
      const duration = performance.now() - start;
      results.push(duration);
    }
    
    // Calculate statistics
    const sorted = results.sort((a, b) => a - b);
    const stats = {
      name,
      iterations,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      mean: results.reduce((a, b) => a + b, 0) / results.length,
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
      stdDev: this.calculateStdDev(results)
    };
    
    // Store results
    this.results.set(name, results);
    
    return stats;
  }

  /**
   * Measure performance of an operation
   */
  async measure(name, fn, options = {}) {
    const startTime = performance.now();
    const startMemory = process.memoryUsage();
    const startCpu = process.cpuUsage();
    
    let result;
    let error = null;
    
    try {
      result = await fn();
    } catch (e) {
      error = e;
    }
    
    const endTime = performance.now();
    const endMemory = process.memoryUsage();
    const endCpu = process.cpuUsage(startCpu);
    
    const measurement = {
      name,
      duration: endTime - startTime,
      memory: {
        heapUsed: endMemory.heapUsed - startMemory.heapUsed,
        heapTotal: endMemory.heapTotal - startMemory.heapTotal,
        external: endMemory.external - startMemory.external,
        rss: endMemory.rss - startMemory.rss
      },
      cpu: {
        user: endCpu.user / 1000, // Convert to ms
        system: endCpu.system / 1000
      },
      timestamp: Date.now(),
      error: error ? error.message : null
    };
    
    if (error) {
      throw error;
    }
    
    return { result, measurement };
  }

  /**
   * Compare benchmark results
   */
  compare(baseline, current, options = {}) {
    const threshold = options.threshold || 0.1; // 10% threshold by default
    
    const comparison = {
      baseline,
      current,
      improvement: ((baseline - current) / baseline) * 100,
      faster: current < baseline,
      significant: Math.abs(baseline - current) / baseline > threshold
    };
    
    if (typeof baseline === 'object' && typeof current === 'object') {
      // Compare detailed stats
      comparison.details = {
        min: {
          baseline: baseline.min,
          current: current.min,
          diff: current.min - baseline.min,
          improvement: ((baseline.min - current.min) / baseline.min) * 100
        },
        mean: {
          baseline: baseline.mean,
          current: current.mean,
          diff: current.mean - baseline.mean,
          improvement: ((baseline.mean - current.mean) / baseline.mean) * 100
        },
        median: {
          baseline: baseline.median,
          current: current.median,
          diff: current.median - baseline.median,
          improvement: ((baseline.median - current.median) / baseline.median) * 100
        },
        p95: {
          baseline: baseline.p95,
          current: current.p95,
          diff: current.p95 - baseline.p95,
          improvement: ((baseline.p95 - current.p95) / baseline.p95) * 100
        }
      };
    }
    
    return comparison;
  }

  /**
   * Set or get baseline for comparison
   */
  baseline(name, value = undefined) {
    if (value === undefined) {
      // Get baseline
      return this.baselines.get(name);
    } else {
      // Set baseline
      this.baselines.set(name, value);
      return value;
    }
  }

  /**
   * Create a benchmark suite
   */
  suite(name, benchmarks = []) {
    if (benchmarks.length === 0) {
      // Get existing suite
      return this.suites.get(name);
    }
    
    // Create new suite
    const suiteObj = {
      name,
      benchmarks,
      results: [],
      
      add: (benchmark) => {
        suiteObj.benchmarks.push(benchmark);
        return suiteObj;
      },
      
      run: async (options = {}) => {
        const results = [];
        
        for (const benchmark of suiteObj.benchmarks) {
          const result = await this.run(
            benchmark.name,
            benchmark.fn,
            { ...options, ...benchmark.options }
          );
          results.push(result);
        }
        
        suiteObj.results = results;
        return results;
      },
      
      compare: (baselineResults) => {
        return suiteObj.results.map((result, i) => {
          const baseline = baselineResults[i];
          return this.compare(baseline, result);
        });
      }
    };
    
    this.suites.set(name, suiteObj);
    return suiteObj;
  }

  /**
   * Generate benchmark report
   */
  report(options = {}) {
    const format = options.format || 'text';
    const results = options.results || Array.from(this.results.values()).flat();
    
    if (results.length === 0) {
      return 'No benchmark results available';
    }
    
    switch (format) {
      case 'json':
        return JSON.stringify({
          timestamp: Date.now(),
          results,
          baselines: Object.fromEntries(this.baselines),
          thresholds: this.thresholds
        }, null, 2);
      
      case 'html':
        return this.generateHTMLReport(results);
      
      case 'markdown':
        return this.generateMarkdownReport(results);
      
      case 'text':
      default:
        return this.generateTextReport(results);
    }
  }

  /**
   * Warmup function before benchmarking
   */
  async warmup(fn, iterations = 10) {
    for (let i = 0; i < iterations; i++) {
      await fn();
    }
    
    // Clear any garbage after warmup
    if (global.gc) {
      global.gc();
    }
    
    return iterations;
  }

  /**
   * Generate text report
   */
  generateTextReport(results) {
    let report = '\n=== Benchmark Report ===\n\n';
    
    // Group results by operation
    const grouped = {};
    for (const result of results) {
      const op = result.operation || result.name || 'unknown';
      if (!grouped[op]) {
        grouped[op] = [];
      }
      grouped[op].push(result);
    }
    
    for (const [operation, opResults] of Object.entries(grouped)) {
      report += `📊 ${operation}\n`;
      
      if (opResults.length === 1) {
        const r = opResults[0];
        report += `  Duration: ${r.duration?.toFixed(2) || r.mean?.toFixed(2) || 'N/A'}ms\n`;
        
        if (r.memoryDelta) {
          report += `  Memory: ${(r.memoryDelta.heapUsed / 1024).toFixed(2)}KB\n`;
        }
      } else {
        const durations = opResults.map(r => r.duration || r.mean || 0);
        const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
        const min = Math.min(...durations);
        const max = Math.max(...durations);
        
        report += `  Samples: ${opResults.length}\n`;
        report += `  Average: ${avg.toFixed(2)}ms\n`;
        report += `  Min: ${min.toFixed(2)}ms\n`;
        report += `  Max: ${max.toFixed(2)}ms\n`;
      }
      
      // Check threshold
      const threshold = this.thresholds[operation];
      if (threshold) {
        const avg = opResults.reduce((sum, r) => sum + (r.duration || r.mean || 0), 0) / opResults.length;
        if (avg > threshold) {
          report += `  🟠️ Exceeds threshold (${threshold}ms)\n`;
        } else {
          report += `  🏁 Within threshold (${threshold}ms)\n`;
        }
      }
      
      report += '\n';
    }
    
    return report;
  }

  /**
   * Generate HTML report
   */
  generateHTMLReport(results) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Benchmark Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #333; }
          table { border-collapse: collapse; width: 100%; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          th { background-color: #4CAF50; color: white; }
          tr:nth-child(even) { background-color: #f2f2f2; }
          .warning { color: #ff9800; }
          .success { color: #4CAF50; }
        </style>
      </head>
      <body>
        <h1>Performance Benchmark Report</h1>
        <p>Generated: ${new Date().toISOString()}</p>
        <table>
          <thead>
            <tr>
              <th>Operation</th>
              <th>Duration (ms)</th>
              <th>Memory (KB)</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${results.map(r => `
              <tr>
                <td>${r.operation || r.name || 'Unknown'}</td>
                <td>${(r.duration || r.mean || 0).toFixed(2)}</td>
                <td>${r.memoryDelta ? (r.memoryDelta.heapUsed / 1024).toFixed(2) : 'N/A'}</td>
                <td>${this.getStatusHTML(r)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;
  }

  /**
   * Generate Markdown report
   */
  generateMarkdownReport(results) {
    let report = '# Benchmark Report\n\n';
    report += `Generated: ${new Date().toISOString()}\n\n`;
    report += '| Operation | Duration (ms) | Memory (KB) | Status |\n';
    report += '|-----------|--------------|-------------|--------|\n';
    
    for (const r of results) {
      const operation = r.operation || r.name || 'Unknown';
      const duration = (r.duration || r.mean || 0).toFixed(2);
      const memory = r.memoryDelta ? (r.memoryDelta.heapUsed / 1024).toFixed(2) : 'N/A';
      const status = this.getStatus(r);
      
      report += `| ${operation} | ${duration} | ${memory} | ${status} |\n`;
    }
    
    return report;
  }

  /**
   * Get status for result
   */
  getStatus(result) {
    const operation = result.operation || result.name;
    const threshold = this.thresholds[operation];
    const duration = result.duration || result.mean || 0;
    
    if (!threshold) {
      return '🔴';
    }
    
    return duration > threshold ? '🟠️ Slow' : '🏁 OK';
  }

  /**
   * Get HTML status
   */
  getStatusHTML(result) {
    const operation = result.operation || result.name;
    const threshold = this.thresholds[operation];
    const duration = result.duration || result.mean || 0;
    
    if (!threshold) {
      return '<span>-</span>';
    }
    
    return duration > threshold 
      ? '<span class="warning">🟠️ Exceeds threshold</span>'
      : '<span class="success">🏁 OK</span>';
  }

  /**
   * Calculate standard deviation
   */
  calculateStdDev(values) {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    return Math.sqrt(avgSquaredDiff);
  }

  /**
   * Get performance report
   */
  getReport() {
    const report = {
      timestamp: new Date().toISOString(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      uptime: process.uptime(),
      results: Object.fromEntries(this.results),
      baselines: Object.fromEntries(this.baselines),
      thresholds: this.thresholds
    };

    return report;
  }
}

// Singleton instance
const benchmark = new PerformanceBenchmark();

module.exports = {
  Benchmark: PerformanceBenchmark,  // Standard export name
  PerformanceBenchmark,  // Keep original
  benchmark  // Singleton instance
};
/**
 * BUMBA CLI Performance Benchmarks
 * Automated performance testing and regression detection
 */

const { BumbaFramework2 } = require('../../src/index');
const { UnifiedRoutingSystem } = require('../../src/core/unified-routing-system');
const { SimplifiedAgentSystem } = require('../../src/core/agents/simplified-agent-system');
const { performance } = require('perf_hooks');
const fs = require('fs').promises;
const path = require('path');

// Benchmark configuration
const BENCHMARK_CONFIG = {
  iterations: 100,
  warmupIterations: 10,
  commands: [
    { cmd: 'analyze', args: ['simple component'], category: 'routing' },
    { cmd: 'implement', args: ['basic feature'], category: 'execution' },
    { cmd: 'docs', args: ['array methods'], category: 'mcp' },
    { cmd: 'secure', args: ['input validation'], category: 'security' }
  ],
  modes: ['full', 'lite'],
  thresholds: {
    routing: 50,      // 50ms max for routing decisions
    execution: 1000,  // 1000ms max for command execution
    mcp: 500,        // 500ms max for MCP operations
    security: 100,    // 100ms max for security checks
    memory: 512      // 512MB max memory usage
  }
};

class PerformanceBenchmark {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      system: {
        node: process.version,
        platform: process.platform,
        arch: process.arch,
        memory: Math.round(require('os').totalmem() / 1024 / 1024) + 'MB'
      },
      benchmarks: {}
    };
  }
  
  /**
   * Run all benchmarks
   */
  async runAll() {
    console.log('🏁 BUMBA Performance Benchmark Suite');
    console.log('=====================================\n');
    
    try {
      // Warmup
      await this.warmup();
      
      // Run benchmarks
      await this.benchmarkRouting();
      await this.benchmarkExecution();
      await this.benchmarkMemoryUsage();
      await this.benchmarkAgentSpawning();
      await this.benchmarkCaching();
      await this.benchmarkModeSwitch();
      await this.benchmarkConcurrency();
      
      // Generate report
      await this.generateReport();
      
      // Check regressions
      await this.checkRegressions();
      
    } catch (error) {
      console.error('Benchmark failed:', error);
      process.exit(1);
    }
  }
  
  /**
   * Warmup phase
   */
  async warmup() {
    console.log('Warming up...');
    const framework = new BumbaFramework2({ mode: 'full' });
    
    for (let i = 0; i < BENCHMARK_CONFIG.warmupIterations; i++) {
      await framework.processCommand('analyze', ['warmup'], { user: 'benchmark' });
    }
    
    await framework.shutdown();
    console.log('Warmup complete\n');
  }
  
  /**
   * Benchmark routing performance
   */
  async benchmarkRouting() {
    console.log('🟢 Benchmarking Routing Performance...');
    const router = UnifiedRoutingSystem.getInstance();
    const results = [];
    
    for (let i = 0; i < BENCHMARK_CONFIG.iterations; i++) {
      const start = performance.now();
      
      await router.route('implement', ['test feature'], {
        user: 'benchmark',
        iteration: i
      });
      
      const duration = performance.now() - start;
      results.push(duration);
    }
    
    this.results.benchmarks.routing = this.calculateStats(results);
    console.log(`  Average: ${this.results.benchmarks.routing.mean.toFixed(2)}ms`);
    console.log(`  P95: ${this.results.benchmarks.routing.p95.toFixed(2)}ms\n`);
  }
  
  /**
   * Benchmark command execution
   */
  async benchmarkExecution() {
    console.log('🟢 Benchmarking Command Execution...');
    
    for (const mode of BENCHMARK_CONFIG.modes) {
      console.log(`  Mode: ${mode}`);
      const framework = new BumbaFramework2({ mode });
      const modeResults = {};
      
      for (const { cmd, args, category } of BENCHMARK_CONFIG.commands) {
        const results = [];
        
        for (let i = 0; i < BENCHMARK_CONFIG.iterations; i++) {
          const start = performance.now();
          
          await framework.processCommand(cmd, args, {
            user: 'benchmark',
            skipCache: true
          });
          
          const duration = performance.now() - start;
          results.push(duration);
        }
        
        modeResults[cmd] = this.calculateStats(results);
      }
      
      this.results.benchmarks[`execution_${mode}`] = modeResults;
      await framework.shutdown();
    }
    
    console.log('');
  }
  
  /**
   * Benchmark memory usage
   */
  async benchmarkMemoryUsage() {
    console.log('🟢 Benchmarking Memory Usage...');
    const framework = new BumbaFramework2({ mode: 'full' });
    const memorySnapshots = [];
    
    // Baseline
    global.gc && global.gc();
    const baseline = process.memoryUsage();
    
    // Execute commands and track memory
    for (let i = 0; i < 50; i++) {
      await framework.processCommand('analyze', [`component-${i}`], {
        user: 'benchmark'
      });
      
      if (i % 10 === 0) {
        const usage = process.memoryUsage();
        memorySnapshots.push({
          iteration: i,
          heapUsed: Math.round((usage.heapUsed - baseline.heapUsed) / 1024 / 1024),
          heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
          rss: Math.round(usage.rss / 1024 / 1024)
        });
      }
    }
    
    this.results.benchmarks.memory = {
      baseline: Math.round(baseline.heapUsed / 1024 / 1024),
      peak: Math.max(...memorySnapshots.map(s => s.heapUsed)),
      snapshots: memorySnapshots
    };
    
    console.log(`  Baseline: ${this.results.benchmarks.memory.baseline}MB`);
    console.log(`  Peak: ${this.results.benchmarks.memory.peak}MB\n`);
    
    await framework.shutdown();
  }
  
  /**
   * Benchmark agent spawning
   */
  async benchmarkAgentSpawning() {
    console.log('🟢 Benchmarking Agent Spawning...');
    const agentSystem = new SimplifiedAgentSystem();
    const results = [];
    
    for (let i = 0; i < 50; i++) {
      const start = performance.now();
      
      const agent = await agentSystem.createAgent('benchmark', {
        iteration: i
      });
      
      const duration = performance.now() - start;
      results.push(duration);
      
      // Clean up
      agentSystem.destroyAgent(agent.id);
    }
    
    this.results.benchmarks.agentSpawning = this.calculateStats(results);
    console.log(`  Average: ${this.results.benchmarks.agentSpawning.mean.toFixed(2)}ms`);
    console.log(`  P95: ${this.results.benchmarks.agentSpawning.p95.toFixed(2)}ms\n`);
  }
  
  /**
   * Benchmark caching effectiveness
   */
  async benchmarkCaching() {
    console.log('🟢 Benchmarking Cache Performance...');
    const framework = new BumbaFramework2({ mode: 'full' });
    
    // First execution (cache miss)
    const missResults = [];
    for (let i = 0; i < 20; i++) {
      const start = performance.now();
      await framework.processCommand('docs', [`unique-query-${i}`], {
        user: 'benchmark'
      });
      missResults.push(performance.now() - start);
    }
    
    // Second execution (cache hit)
    const hitResults = [];
    for (let i = 0; i < 20; i++) {
      const start = performance.now();
      await framework.processCommand('docs', [`unique-query-${i}`], {
        user: 'benchmark'
      });
      hitResults.push(performance.now() - start);
    }
    
    this.results.benchmarks.caching = {
      misses: this.calculateStats(missResults),
      hits: this.calculateStats(hitResults),
      improvement: ((1 - (this.calculateStats(hitResults).mean / this.calculateStats(missResults).mean)) * 100).toFixed(1)
    };
    
    console.log(`  Cache Miss: ${this.results.benchmarks.caching.misses.mean.toFixed(2)}ms`);
    console.log(`  Cache Hit: ${this.results.benchmarks.caching.hits.mean.toFixed(2)}ms`);
    console.log(`  Improvement: ${this.results.benchmarks.caching.improvement}%\n`);
    
    await framework.shutdown();
  }
  
  /**
   * Benchmark mode switching
   */
  async benchmarkModeSwitch() {
    console.log('🟢 Benchmarking Mode Switch Performance...');
    const framework = new BumbaFramework2({ mode: 'full' });
    const results = [];
    
    for (let i = 0; i < 20; i++) {
      const start = performance.now();
      
      // Switch to lite
      framework.mode = 'lite';
      await framework.processCommand('analyze', ['mode test'], { user: 'benchmark' });
      
      // Switch to full
      framework.mode = 'full';
      await framework.processCommand('analyze', ['mode test'], { user: 'benchmark' });
      
      results.push(performance.now() - start);
    }
    
    this.results.benchmarks.modeSwitch = this.calculateStats(results);
    console.log(`  Average: ${this.results.benchmarks.modeSwitch.mean.toFixed(2)}ms\n`);
    
    await framework.shutdown();
  }
  
  /**
   * Benchmark concurrent operations
   */
  async benchmarkConcurrency() {
    console.log('🟢 Benchmarking Concurrent Operations...');
    const framework = new BumbaFramework2({ mode: 'full' });
    
    const concurrencyLevels = [1, 5, 10, 20];
    const results = {};
    
    for (const level of concurrencyLevels) {
      const start = performance.now();
      
      const promises = [];
      for (let i = 0; i < level; i++) {
        promises.push(
          framework.processCommand('analyze', [`concurrent-${i}`], {
            user: 'benchmark'
          })
        );
      }
      
      await Promise.all(promises);
      const duration = performance.now() - start;
      
      results[`concurrent_${level}`] = {
        totalTime: duration,
        avgPerOperation: duration / level
      };
    }
    
    this.results.benchmarks.concurrency = results;
    console.log('  Concurrency scaling analyzed\n');
    
    await framework.shutdown();
  }
  
  /**
   * Calculate statistics from results
   */
  calculateStats(results) {
    const sorted = results.sort((a, b) => a - b);
    const sum = results.reduce((a, b) => a + b, 0);
    
    return {
      mean: sum / results.length,
      median: sorted[Math.floor(results.length / 2)],
      min: sorted[0],
      max: sorted[sorted.length - 1],
      p95: sorted[Math.floor(results.length * 0.95)],
      p99: sorted[Math.floor(results.length * 0.99)],
      stdDev: Math.sqrt(
        results.reduce((acc, val) => acc + Math.pow(val - sum / results.length, 2), 0) / results.length
      )
    };
  }
  
  /**
   * Generate performance report
   */
  async generateReport() {
    console.log('🟢 Generating Performance Report...');
    
    const reportPath = path.join(__dirname, '../../performance-report.json');
    await fs.writeFile(reportPath, JSON.stringify(this.results, null, 2));
    
    console.log(`  Report saved to: ${reportPath}\n`);
  }
  
  /**
   * Check for performance regressions
   */
  async checkRegressions() {
    console.log('🟢 Checking for Regressions...');
    
    // Load previous benchmark if exists
    const historyPath = path.join(__dirname, '../../performance-history.json');
    let history = [];
    
    try {
      const data = await fs.readFile(historyPath, 'utf8');
      history = JSON.parse(data);
    } catch (error) {
      // No history yet
    }
    
    // Check against thresholds
    const violations = [];
    
    // Routing performance
    if (this.results.benchmarks.routing.p95 > BENCHMARK_CONFIG.thresholds.routing) {
      violations.push(`Routing P95 (${this.results.benchmarks.routing.p95.toFixed(2)}ms) exceeds threshold (${BENCHMARK_CONFIG.thresholds.routing}ms)`);
    }
    
    // Memory usage
    if (this.results.benchmarks.memory.peak > BENCHMARK_CONFIG.thresholds.memory) {
      violations.push(`Peak memory (${this.results.benchmarks.memory.peak}MB) exceeds threshold (${BENCHMARK_CONFIG.thresholds.memory}MB)`);
    }
    
    // Save to history
    history.push(this.results);
    if (history.length > 30) {
      history = history.slice(-30); // Keep last 30 runs
    }
    await fs.writeFile(historyPath, JSON.stringify(history, null, 2));
    
    if (violations.length > 0) {
      console.log('  🟡  Performance Regressions Detected:');
      violations.forEach(v => console.log(`    - ${v}`));
      process.exit(1);
    } else {
      console.log('  🏁 No regressions detected');
    }
  }
}

// Run benchmarks if called directly
if (require.main === module) {
  const benchmark = new PerformanceBenchmark();
  benchmark.runAll().catch(console.error);
}

module.exports = PerformanceBenchmark;
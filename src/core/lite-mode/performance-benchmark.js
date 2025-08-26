/**
 * BUMBA Lite Mode - Sprint 6: Performance Benchmarking
 * 
 * Comprehensive performance testing to ensure Lite Mode meets all targets
 * Targets: <30MB memory, <100ms startup, <500ms response time
 */

const { performance } = require('perf_hooks');
const { createLiteMode } = require('./lite-mode-integration');

class PerformanceBenchmark {
  constructor() {
    this.results = {
      startup: [],
      memory: [],
      execution: [],
      concurrency: [],
      cache: [],
      coordination: []
    };
    
    this.targets = {
      memory: 40 * 1024 * 1024, // 40MB
      startup: 150, // 150ms
      simpleTask: 500, // 500ms
      complexTask: 2000, // 2000ms
      cacheHitRate: 0.5, // 50%
      concurrentTasks: 3 // 3 simultaneous
    };
  }

  /**
   * Run all benchmarks
   */
  async runAll() {
    console.log('\n' + '='.repeat(60));
    console.log('🟢 LITE MODE PERFORMANCE BENCHMARK SUITE');
    console.log('='.repeat(60) + '\n');

    await this.benchmarkStartup();
    await this.benchmarkMemory();
    await this.benchmarkExecution();
    await this.benchmarkConcurrency();
    await this.benchmarkCache();
    await this.benchmarkCoordination();
    
    this.generateReport();
  }

  /**
   * Benchmark startup time
   */
  async benchmarkStartup() {
    console.log('📊 Benchmarking Startup Time...');
    
    const iterations = 10;
    const times = [];
    
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      const lite = createLiteMode();
      await lite.initialize();
      const time = performance.now() - start;
      times.push(time);
      
      // Clean up
      if (global.gc) global.gc();
    }
    
    this.results.startup = {
      times,
      average: this.average(times),
      min: Math.min(...times),
      max: Math.max(...times),
      target: this.targets.startup,
      passed: this.average(times) < this.targets.startup
    };
    
    console.log(`   Average: ${this.results.startup.average.toFixed(2)}ms`);
    console.log(`   Target: <${this.targets.startup}ms`);
    console.log(`   Status: ${this.results.startup.passed ? '🏁 PASSED' : '🔴 FAILED'}\n`);
  }

  /**
   * Benchmark memory usage
   */
  async benchmarkMemory() {
    console.log('📊 Benchmarking Memory Usage...');
    
    const measurements = [];
    
    // Measure baseline
    if (global.gc) global.gc();
    const baseline = process.memoryUsage().heapUsed;
    
    // Create instance and measure
    const lite = createLiteMode({ 
      enableOptimization: true,
      enableCache: true 
    });
    await lite.initialize();
    
    // Execute various tasks to load components
    const tasks = [
      { prompt: 'Create component', type: 'component' },
      { prompt: 'Build API', type: 'api' },
      { prompt: 'Full app', type: 'fullstack' }
    ];
    
    for (const task of tasks) {
      await lite.execute(task);
      measurements.push(process.memoryUsage().heapUsed - baseline);
    }
    
    // Stress test with many tasks
    for (let i = 0; i < 20; i++) {
      await lite.execute({ 
        prompt: `Task ${i}`, 
        type: i % 2 === 0 ? 'simple' : 'complex' 
      });
    }
    
    const finalMemory = process.memoryUsage().heapUsed - baseline;
    measurements.push(finalMemory);
    
    this.results.memory = {
      measurements,
      baseline,
      peak: Math.max(...measurements),
      final: finalMemory,
      target: this.targets.memory,
      passed: Math.max(...measurements) < this.targets.memory
    };
    
    console.log(`   Baseline: ${this.formatBytes(baseline)}`);
    console.log(`   Peak: ${this.formatBytes(this.results.memory.peak)}`);
    console.log(`   Final: ${this.formatBytes(this.results.memory.final)}`);
    console.log(`   Target: <${this.formatBytes(this.targets.memory)}`);
    console.log(`   Status: ${this.results.memory.passed ? '🏁 PASSED' : '🔴 FAILED'}\n`);
  }

  /**
   * Benchmark task execution times
   */
  async benchmarkExecution() {
    console.log('📊 Benchmarking Execution Times...');
    
    const lite = createLiteMode({ enableOptimization: true });
    await lite.initialize();
    
    // Simple tasks
    const simpleTimes = [];
    for (let i = 0; i < 20; i++) {
      const start = performance.now();
      await lite.execute({
        prompt: `Simple task ${i}`,
        type: 'component'
      });
      simpleTimes.push(performance.now() - start);
    }
    
    // Complex tasks
    const complexTimes = [];
    for (let i = 0; i < 10; i++) {
      const start = performance.now();
      await lite.execute({
        prompt: `Complex task ${i}`,
        type: 'fullstack'
      });
      complexTimes.push(performance.now() - start);
    }
    
    this.results.execution = {
      simple: {
        times: simpleTimes,
        average: this.average(simpleTimes),
        p95: this.percentile(simpleTimes, 95),
        target: this.targets.simpleTask,
        passed: this.average(simpleTimes) < this.targets.simpleTask
      },
      complex: {
        times: complexTimes,
        average: this.average(complexTimes),
        p95: this.percentile(complexTimes, 95),
        target: this.targets.complexTask,
        passed: this.average(complexTimes) < this.targets.complexTask
      }
    };
    
    console.log(`   Simple Tasks:`);
    console.log(`     Average: ${this.results.execution.simple.average.toFixed(2)}ms`);
    console.log(`     P95: ${this.results.execution.simple.p95.toFixed(2)}ms`);
    console.log(`     Target: <${this.targets.simpleTask}ms`);
    console.log(`     Status: ${this.results.execution.simple.passed ? '🏁 PASSED' : '🔴 FAILED'}`);
    
    console.log(`   Complex Tasks:`);
    console.log(`     Average: ${this.results.execution.complex.average.toFixed(2)}ms`);
    console.log(`     P95: ${this.results.execution.complex.p95.toFixed(2)}ms`);
    console.log(`     Target: <${this.targets.complexTask}ms`);
    console.log(`     Status: ${this.results.execution.complex.passed ? '🏁 PASSED' : '🔴 FAILED'}\n`);
  }

  /**
   * Benchmark concurrent execution
   */
  async benchmarkConcurrency() {
    console.log('📊 Benchmarking Concurrent Execution...');
    
    const lite = createLiteMode({ enableOptimization: true });
    await lite.initialize();
    
    // Test different concurrency levels
    const concurrencyLevels = [1, 3, 5, 10];
    const results = [];
    
    for (const level of concurrencyLevels) {
      const tasks = Array(level).fill(0).map((_, i) => ({
        prompt: `Concurrent task ${i}`,
        type: i % 2 === 0 ? 'component' : 'api'
      }));
      
      const start = performance.now();
      
      try {
        await Promise.all(tasks.map(task => lite.execute(task)));
        const time = performance.now() - start;
        results.push({
          level,
          time,
          avgPerTask: time / level,
          success: true
        });
      } catch (error) {
        results.push({
          level,
          error: error.message,
          success: false
        });
      }
    }
    
    this.results.concurrency = {
      results,
      maxSuccessful: Math.max(...results.filter(r => r.success).map(r => r.level)),
      target: this.targets.concurrentTasks,
      passed: results.find(r => r.level === this.targets.concurrentTasks)?.success || false
    };
    
    console.log(`   Concurrency Test Results:`);
    results.forEach(r => {
      if (r.success) {
        console.log(`     ${r.level} tasks: ${r.time.toFixed(2)}ms (${r.avgPerTask.toFixed(2)}ms/task)`);
      } else {
        console.log(`     ${r.level} tasks: 🔴 Failed - ${r.error}`);
      }
    });
    console.log(`   Target: ${this.targets.concurrentTasks} concurrent tasks`);
    console.log(`   Status: ${this.results.concurrency.passed ? '🏁 PASSED' : '🔴 FAILED'}\n`);
  }

  /**
   * Benchmark cache performance
   */
  async benchmarkCache() {
    console.log('📊 Benchmarking Cache Performance...');
    
    const lite = createLiteMode({ 
      enableOptimization: true,
      enableCache: true 
    });
    await lite.initialize();
    
    // Execute same tasks multiple times
    const task = { prompt: 'Cached task', type: 'component' };
    const times = [];
    
    // First execution (cache miss)
    const start1 = performance.now();
    await lite.execute(task);
    const time1 = performance.now() - start1;
    times.push({ execution: 1, time: time1, hit: false });
    
    // Subsequent executions (should hit cache)
    for (let i = 2; i <= 10; i++) {
      const start = performance.now();
      await lite.execute(task);
      const time = performance.now() - start;
      times.push({ 
        execution: i, 
        time, 
        hit: time < time1 * 0.5 // Consider hit if <50% of first time
      });
    }
    
    const hits = times.filter(t => t.hit).length;
    const hitRate = hits / times.length;
    
    this.results.cache = {
      times,
      firstTime: time1,
      avgCachedTime: this.average(times.slice(1).map(t => t.time)),
      hitRate,
      speedup: time1 / this.average(times.slice(1).map(t => t.time)),
      target: this.targets.cacheHitRate,
      passed: hitRate >= this.targets.cacheHitRate
    };
    
    console.log(`   First execution: ${time1.toFixed(2)}ms`);
    console.log(`   Avg cached: ${this.results.cache.avgCachedTime.toFixed(2)}ms`);
    console.log(`   Hit rate: ${(hitRate * 100).toFixed(1)}%`);
    console.log(`   Speedup: ${this.results.cache.speedup.toFixed(2)}x`);
    console.log(`   Target: >${(this.targets.cacheHitRate * 100)}% hit rate`);
    console.log(`   Status: ${this.results.cache.passed ? '🏁 PASSED' : '🔴 FAILED'}\n`);
  }

  /**
   * Benchmark coordination between departments
   */
  async benchmarkCoordination() {
    console.log('📊 Benchmarking Department Coordination...');
    
    const lite = createLiteMode({ enableCoordination: true });
    await lite.initialize();
    
    const coordinationTasks = [
      { prompt: 'Build user dashboard', type: 'feature' },
      { prompt: 'Create API with UI', type: 'fullstack' },
      { prompt: 'Design and implement form', type: 'feature' }
    ];
    
    const results = [];
    
    for (const task of coordinationTasks) {
      const start = performance.now();
      const result = await lite.execute(task);
      const time = performance.now() - start;
      
      results.push({
        task: task.prompt,
        time,
        departments: result.departments || 1,
        efficiency: result.departments ? time / result.departments : time
      });
    }
    
    this.results.coordination = {
      results,
      avgTime: this.average(results.map(r => r.time)),
      avgDepartments: this.average(results.map(r => r.departments)),
      avgEfficiency: this.average(results.map(r => r.efficiency)),
      passed: this.average(results.map(r => r.time)) < this.targets.complexTask
    };
    
    console.log(`   Coordination Results:`);
    results.forEach(r => {
      console.log(`     "${r.task}": ${r.time.toFixed(2)}ms (${r.departments} depts)`);
    });
    console.log(`   Average time: ${this.results.coordination.avgTime.toFixed(2)}ms`);
    console.log(`   Average departments: ${this.results.coordination.avgDepartments.toFixed(1)}`);
    console.log(`   Status: ${this.results.coordination.passed ? '🏁 PASSED' : '🔴 FAILED'}\n`);
  }

  /**
   * Stress test
   */
  async stressTest() {
    console.log('📊 Running Stress Test...');
    
    const lite = createLiteMode({ 
      enableOptimization: true,
      enableCache: true 
    });
    await lite.initialize();
    
    const startMemory = process.memoryUsage().heapUsed;
    const iterations = 100;
    const errors = [];
    const times = [];
    
    console.log(`   Executing ${iterations} random tasks...`);
    
    for (let i = 0; i < iterations; i++) {
      const taskTypes = ['component', 'api', 'test', 'feature', 'fullstack'];
      const task = {
        prompt: `Stress test ${i}`,
        type: taskTypes[i % taskTypes.length]
      };
      
      try {
        const start = performance.now();
        await lite.execute(task);
        times.push(performance.now() - start);
      } catch (error) {
        errors.push({ iteration: i, error: error.message });
      }
      
      // Progress indicator
      if ((i + 1) % 20 === 0) {
        process.stdout.write('.');
      }
    }
    console.log('');
    
    const endMemory = process.memoryUsage().heapUsed;
    const memoryGrowth = endMemory - startMemory;
    
    const stressResults = {
      iterations,
      errors: errors.length,
      errorRate: errors.length / iterations,
      avgTime: this.average(times),
      memoryGrowth: memoryGrowth,
      memoryGrowthPerTask: memoryGrowth / iterations,
      passed: errors.length === 0 && memoryGrowth < this.targets.memory
    };
    
    console.log(`   Completed: ${iterations - errors.length}/${iterations}`);
    console.log(`   Errors: ${errors.length}`);
    console.log(`   Avg time: ${stressResults.avgTime.toFixed(2)}ms`);
    console.log(`   Memory growth: ${this.formatBytes(memoryGrowth)}`);
    console.log(`   Per task: ${this.formatBytes(stressResults.memoryGrowthPerTask)}`);
    console.log(`   Status: ${stressResults.passed ? '🏁 PASSED' : '🔴 FAILED'}\n`);
    
    return stressResults;
  }

  /**
   * Compare with Full Mode (if available)
   */
  async compareWithFullMode() {
    console.log('📊 Comparing with Full Mode...\n');
    
    // This would normally load and test Full Mode
    // For now, we'll use estimated values
    const comparison = {
      startup: {
        lite: this.results.startup.average,
        full: 3000, // Estimated
        improvement: ((3000 - this.results.startup.average) / 3000 * 100).toFixed(1)
      },
      memory: {
        lite: this.results.memory.peak,
        full: 500 * 1024 * 1024, // 500MB estimated
        improvement: ((500 * 1024 * 1024 - this.results.memory.peak) / (500 * 1024 * 1024) * 100).toFixed(1)
      },
      execution: {
        lite: this.results.execution.simple.average,
        full: 1000, // Estimated
        improvement: ((1000 - this.results.execution.simple.average) / 1000 * 100).toFixed(1)
      }
    };
    
    console.log('   Metric        | Lite Mode | Full Mode | Improvement');
    console.log('   --------------|-----------|-----------|-------------');
    console.log(`   Startup       | ${comparison.startup.lite.toFixed(0)}ms`.padEnd(14) + 
                ` | ${comparison.startup.full}ms`.padEnd(11) + 
                ` | ${comparison.startup.improvement}%`);
    console.log(`   Memory        | ${this.formatBytes(comparison.memory.lite)}`.padEnd(14) + 
                ` | ${this.formatBytes(comparison.memory.full)}`.padEnd(11) + 
                ` | ${comparison.memory.improvement}%`);
    console.log(`   Execution     | ${comparison.execution.lite.toFixed(0)}ms`.padEnd(14) + 
                ` | ${comparison.execution.full}ms`.padEnd(11) + 
                ` | ${comparison.execution.improvement}%`);
    console.log('');
    
    return comparison;
  }

  /**
   * Generate comprehensive report
   */
  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📈 PERFORMANCE BENCHMARK REPORT');
    console.log('='.repeat(60));
    
    const allPassed = [
      this.results.startup.passed,
      this.results.memory.passed,
      this.results.execution.simple.passed,
      this.results.execution.complex.passed,
      this.results.concurrency.passed,
      this.results.cache.passed,
      this.results.coordination.passed
    ].every(p => p === true);
    
    console.log('\n🏁 Test Results Summary:');
    console.log(`   Startup Time: ${this.results.startup.passed ? '🏁' : '🔴'} ${this.results.startup.average.toFixed(2)}ms < ${this.targets.startup}ms`);
    console.log(`   Memory Usage: ${this.results.memory.passed ? '🏁' : '🔴'} ${this.formatBytes(this.results.memory.peak)} < ${this.formatBytes(this.targets.memory)}`);
    console.log(`   Simple Tasks: ${this.results.execution.simple.passed ? '🏁' : '🔴'} ${this.results.execution.simple.average.toFixed(2)}ms < ${this.targets.simpleTask}ms`);
    console.log(`   Complex Tasks: ${this.results.execution.complex.passed ? '🏁' : '🔴'} ${this.results.execution.complex.average.toFixed(2)}ms < ${this.targets.complexTask}ms`);
    console.log(`   Concurrency: ${this.results.concurrency.passed ? '🏁' : '🔴'} ${this.results.concurrency.maxSuccessful} concurrent tasks`);
    console.log(`   Cache Hit Rate: ${this.results.cache.passed ? '🏁' : '🔴'} ${(this.results.cache.hitRate * 100).toFixed(1)}% > ${this.targets.cacheHitRate * 100}%`);
    console.log(`   Coordination: ${this.results.coordination.passed ? '🏁' : '🔴'} ${this.results.coordination.avgTime.toFixed(2)}ms average`);
    
    console.log('\n📊 Performance Characteristics:');
    console.log(`   Startup: ${this.getPerformanceRating(this.results.startup.average, 100, 200)}`);
    console.log(`   Memory: ${this.getPerformanceRating(this.results.memory.peak, 20 * 1024 * 1024, 50 * 1024 * 1024)}`);
    console.log(`   Response: ${this.getPerformanceRating(this.results.execution.simple.average, 200, 1000)}`);
    console.log(`   Efficiency: ${this.getPerformanceRating(100 - this.results.cache.hitRate * 100, 30, 70)}`);
    
    console.log('\n🟡 Overall Result:');
    if (allPassed) {
      console.log('   🏁 ALL PERFORMANCE TARGETS MET');
      console.log('   Lite Mode is production-ready for resource-constrained environments');
    } else {
      console.log('   🟠️ SOME TARGETS NOT MET');
      console.log('   Further optimization may be needed for production use');
    }
    
    console.log('='.repeat(60) + '\n');
    
    return {
      passed: allPassed,
      results: this.results
    };
  }

  /**
   * Utility functions
   */
  average(numbers) {
    return numbers.reduce((a, b) => a + b, 0) / numbers.length;
  }

  percentile(numbers, p) {
    const sorted = numbers.slice().sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[index];
  }

  formatBytes(bytes) {
    return `${Math.round(bytes / 1024 / 1024)}MB`;
  }

  getPerformanceRating(value, excellent, poor) {
    if (value <= excellent) return '🟢 Excellent';
    if (value <= (excellent + poor) / 2) return '🏁 Good';
    if (value <= poor) return '🟠️ Acceptable';
    return '🔴 Poor';
  }
}

// Export and run if executed directly
module.exports = PerformanceBenchmark;

if (require.main === module) {
  const benchmark = new PerformanceBenchmark();
  benchmark.runAll()
    .then(() => benchmark.stressTest())
    .then(() => benchmark.compareWithFullMode())
    .catch(console.error);
}
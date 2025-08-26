#!/usr/bin/env node
/**
 * Compare benchmark results with baseline
 * Usage: node compare-benchmarks.js <current.json> <baseline.json>
 */

const fs = require('fs');

function loadResults(path) {
  try {
    return JSON.parse(fs.readFileSync(path, 'utf8'));
  } catch (error) {
    console.error(`Failed to load ${path}:`, error.message);
    process.exit(1);
  }
}

function compareMetric(current, baseline, threshold = 0.1) {
  const diff = ((current - baseline) / baseline) * 100;
  return {
    current,
    baseline,
    diff: diff.toFixed(2),
    regression: diff > threshold * 100,
    improvement: diff < -threshold * 100
  };
}

function main() {
  const [currentPath, baselinePath] = process.argv.slice(2);
  
  if (!currentPath || !baselinePath) {
    console.error('Usage: compare-benchmarks.js <current.json> <baseline.json>');
    process.exit(1);
  }
  
  const current = loadResults(currentPath);
  const baseline = loadResults(baselinePath);
  
  console.log('🟢 Performance Comparison Report');
  console.log('================================\n');
  
  const comparisons = {
    routing: {},
    memory: {},
    caching: {},
    agentSpawning: {}
  };
  
  // Compare routing performance
  if (current.benchmarks.routing && baseline.benchmarks?.routing) {
    comparisons.routing = {
      mean: compareMetric(
        current.benchmarks.routing.mean,
        baseline.benchmarks.routing.mean
      ),
      p95: compareMetric(
        current.benchmarks.routing.p95,
        baseline.benchmarks.routing.p95
      )
    };
    
    console.log('🟢 Routing Performance:');
    console.log(`  Mean: ${comparisons.routing.mean.current.toFixed(2)}ms (${comparisons.routing.mean.diff}%)`);
    console.log(`  P95: ${comparisons.routing.p95.current.toFixed(2)}ms (${comparisons.routing.p95.diff}%)`);
  }
  
  // Compare memory usage
  if (current.benchmarks.memory && baseline.benchmarks?.memory) {
    comparisons.memory.peak = compareMetric(
      current.benchmarks.memory.peak,
      baseline.benchmarks.memory.peak
    );
    
    console.log('\n🟢 Memory Usage:');
    console.log(`  Peak: ${comparisons.memory.peak.current}MB (${comparisons.memory.peak.diff}%)`);
  }
  
  // Compare caching
  if (current.benchmarks.caching && baseline.benchmarks?.caching) {
    comparisons.caching.improvement = compareMetric(
      parseFloat(current.benchmarks.caching.improvement),
      parseFloat(baseline.benchmarks.caching.improvement)
    );
    
    console.log('\n🟢 Cache Performance:');
    console.log(`  Improvement: ${comparisons.caching.improvement.current}% (${comparisons.caching.improvement.diff}% change)`);
  }
  
  // Check for regressions
  const regressions = [];
  
  Object.entries(comparisons).forEach(([category, metrics]) => {
    Object.entries(metrics).forEach(([metric, comparison]) => {
      if (comparison.regression) {
        regressions.push(`${category}.${metric}: ${comparison.diff}% slower`);
      }
    });
  });
  
  if (regressions.length > 0) {
    console.log('\n🔴 Performance Regressions Detected:');
    regressions.forEach(r => console.log(`  - ${r}`));
    process.exit(1);
  } else {
    console.log('\n🏁 No performance regressions detected');
  }
  
  // Save comparison report
  const report = {
    timestamp: new Date().toISOString(),
    comparisons,
    regressions,
    summary: {
      hasRegressions: regressions.length > 0,
      totalMetrics: Object.values(comparisons).reduce((acc, cat) => acc + Object.keys(cat).length, 0),
      regressedMetrics: regressions.length
    }
  };
  
  fs.writeFileSync('benchmark-comparison.json', JSON.stringify(report, null, 2));
  console.log('\n🟢 Detailed comparison saved to benchmark-comparison.json');
}

if (require.main === module) {
  main();
}
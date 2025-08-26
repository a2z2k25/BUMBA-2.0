#!/usr/bin/env node

/**
 * BUMBA Performance System Verification Script
 * Verifies all performance monitoring components are working correctly
 */

const chalk = require('chalk');
const { logger } = require('../src/core/logging/bumba-logger');

console.log(chalk.cyan.bold('\n🟢 BUMBA Performance System Verification\n'));

// Import all performance modules
const modules = {
  dashboard: '../src/core/monitoring/auto-performance-dashboard',
  metricsCollector: '../src/core/monitoring/comprehensive-metrics-collector',
  memoryManager: '../src/core/resource-management/memory-manager',
  performanceMetrics: '../src/core/monitoring/performance-metrics',
  auditLogger: '../src/core/security/comprehensive-audit-logger',
  rateLimiter: '../src/core/security/enhanced-rate-limiter',
  cacheSystem: '../src/core/performance/intelligent-cache-system',
  analyzer: '../src/core/performance/real-time-analyzer',
  predictiveMonitor: '../src/core/performance/predictive-monitor',
  optimizationEngine: '../src/core/performance/optimization-engine'
};

const loadedModules = {};
const results = {
  passed: [],
  failed: [],
  warnings: []
};

// Load and verify each module
async function verifyModules() {
  console.log(chalk.yellow('📦 Loading Performance Modules...\n'));
  
  for (const [name, path] of Object.entries(modules)) {
    try {
      console.log(`Loading ${name}...`);
      loadedModules[name] = require(path);
      results.passed.push(`🏁 ${name} loaded successfully`);
    } catch (error) {
      results.failed.push(`🔴 ${name} failed to load: ${error.message}`);
      console.error(chalk.red(`Failed to load ${name}: ${error.message}`));
    }
  }
}

// Test auto-starting dashboard
async function testDashboard() {
  console.log(chalk.yellow('\n📊 Testing Auto-Starting Dashboard...\n'));
  
  const dashboard = loadedModules.dashboard;
  if (!dashboard) {
    results.failed.push('🔴 Dashboard not loaded');
    return;
  }
  
  // Check if dashboard auto-started
  if (dashboard.isRunning) {
    results.passed.push('🏁 Dashboard auto-started');
    console.log(chalk.green('Dashboard is running'));
    
    // Get metrics
    const metrics = dashboard.getMetrics();
    if (metrics && metrics.system) {
      results.passed.push('🏁 Dashboard collecting metrics');
      console.log(chalk.green('Metrics collection working'));
    } else {
      results.warnings.push('🟠️ Dashboard metrics incomplete');
    }
  } else {
    results.failed.push('🔴 Dashboard did not auto-start');
  }
}

// Test metrics collector
async function testMetricsCollector() {
  console.log(chalk.yellow('\n📈 Testing Comprehensive Metrics Collector...\n'));
  
  const collector = loadedModules.metricsCollector;
  if (!collector) {
    results.failed.push('🔴 Metrics collector not loaded');
    return;
  }
  
  try {
    const metrics = await collector.collect();
    if (metrics && Object.keys(metrics).length > 0) {
      results.passed.push('🏁 Metrics collector working');
      console.log(chalk.green(`Collected ${Object.keys(metrics).length} metric categories`));
      
      // Check for anomaly detection
      if (collector.stats.collectionsCompleted > 0) {
        results.passed.push('🏁 Metrics statistics tracking');
      }
    } else {
      results.warnings.push('🟠️ No metrics collected');
    }
  } catch (error) {
    results.failed.push(`🔴 Metrics collection failed: ${error.message}`);
  }
}

// Test cache system
async function testCacheSystem() {
  console.log(chalk.yellow('\n💾 Testing Intelligent Cache System...\n'));
  
  const cache = loadedModules.cacheSystem;
  if (!cache) {
    results.failed.push('🔴 Cache system not loaded');
    return;
  }
  
  try {
    // Test multi-tier caching
    await cache.set('test-verification', { data: 'test' });
    const value = await cache.get('test-verification');
    
    if (value && value.data === 'test') {
      results.passed.push('🏁 Cache storage and retrieval working');
      console.log(chalk.green('Cache operations successful'));
    } else {
      results.failed.push('🔴 Cache retrieval failed');
    }
    
    // Check cache stats
    const stats = cache.getStats();
    if (stats && stats.overall) {
      results.passed.push('🏁 Cache statistics available');
      console.log(chalk.green(`Cache hit rate: ${(stats.hitRate * 100).toFixed(2)}%`));
    }
    
    // Clean up
    await cache.delete('test-verification');
  } catch (error) {
    results.failed.push(`🔴 Cache system error: ${error.message}`);
  }
}

// Test real-time analyzer
async function testAnalyzer() {
  console.log(chalk.yellow('\n🔍 Testing Real-Time Performance Analyzer...\n'));
  
  const analyzer = loadedModules.analyzer;
  if (!analyzer) {
    results.failed.push('🔴 Analyzer not loaded');
    return;
  }
  
  try {
    // Perform analysis
    await analyzer.performAnalysis();
    
    const summary = analyzer.getAnalysisSummary();
    if (summary && summary.state) {
      results.passed.push('🏁 Real-time analysis working');
      console.log(chalk.green(`Analysis count: ${summary.state.analysisCount}`));
      
      if (summary.recommendations && summary.recommendations.length > 0) {
        results.passed.push('🏁 Recommendations generated');
        console.log(chalk.green(`Generated ${summary.recommendations.length} recommendations`));
      }
    }
  } catch (error) {
    results.failed.push(`🔴 Analysis failed: ${error.message}`);
  }
}

// Test predictive monitor
async function testPredictiveMonitor() {
  console.log(chalk.yellow('\n🔮 Testing Predictive Performance Monitor...\n'));
  
  const monitor = loadedModules.predictiveMonitor;
  if (!monitor) {
    results.failed.push('🔴 Predictive monitor not loaded');
    return;
  }
  
  try {
    // Add some historical data
    const now = Date.now();
    for (let i = 0; i < 30; i++) {
      monitor.historicalData.cpu.push({
        timestamp: now - (30 - i) * 5000,
        value: 40 + Math.random() * 20
      });
    }
    
    // Make predictions
    await monitor.makePredictions();
    
    const summary = monitor.getPredictionSummary();
    if (summary && summary.currentPredictions) {
      results.passed.push('🏁 Predictive monitoring working');
      console.log(chalk.green(`Confidence level: ${(summary.confidence * 100).toFixed(2)}%`));
    }
  } catch (error) {
    results.failed.push(`🔴 Prediction failed: ${error.message}`);
  }
}

// Test optimization engine
async function testOptimizationEngine() {
  console.log(chalk.yellow('\n🟢️ Testing Performance Optimization Engine...\n'));
  
  const engine = loadedModules.optimizationEngine;
  if (!engine) {
    results.failed.push('🔴 Optimization engine not loaded');
    return;
  }
  
  try {
    const status = engine.getStatus();
    if (status && status.state) {
      results.passed.push('🏁 Optimization engine initialized');
      console.log(chalk.green(`Performance score: ${status.state.performanceScore}/100`));
      console.log(chalk.green(`Available strategies: ${status.availableStrategies.length}`));
      
      if (status.availableStrategies.length > 0) {
        results.passed.push('🏁 Optimization strategies registered');
      }
    }
  } catch (error) {
    results.failed.push(`🔴 Optimization engine error: ${error.message}`);
  }
}

// Test memory manager
async function testMemoryManager() {
  console.log(chalk.yellow('\n🧹 Testing Memory Manager...\n'));
  
  const memoryManager = loadedModules.memoryManager;
  if (!memoryManager) {
    results.failed.push('🔴 Memory manager not loaded');
    return;
  }
  
  try {
    const instance = memoryManager.getInstance();
    const stats = instance.getStats();
    
    if (stats) {
      results.passed.push('🏁 Memory manager working');
      console.log(chalk.green(`Resources tracked: ${stats.resourceCount}`));
      console.log(chalk.green(`Memory usage: ${stats.currentUsage.heapUsedMB}MB`));
    }
    
    // Check memory limit
    const limit = instance.checkMemoryLimit();
    if (limit && limit.withinLimit !== undefined) {
      results.passed.push('🏁 Memory monitoring active');
      console.log(chalk.green(`Memory within limits: ${limit.withinLimit}`));
    }
  } catch (error) {
    results.failed.push(`🔴 Memory manager error: ${error.message}`);
  }
}

// Test component integration
async function testIntegration() {
  console.log(chalk.yellow('\n🔗 Testing Component Integration...\n'));
  
  // Test event communication
  let eventCount = 0;
  const timeout = setTimeout(() => {
    if (eventCount > 0) {
      results.passed.push(`🏁 Component events working (${eventCount} events)`);
      console.log(chalk.green(`Received ${eventCount} inter-component events`));
    } else {
      results.warnings.push('🟠️ No inter-component events detected');
    }
  }, 2000);
  
  // Listen for events
  if (loadedModules.dashboard) {
    loadedModules.dashboard.on('metrics:updated', () => eventCount++);
  }
  if (loadedModules.analyzer) {
    loadedModules.analyzer.on('issue:detected', () => eventCount++);
  }
  if (loadedModules.optimizationEngine) {
    loadedModules.optimizationEngine.on('optimization:complete', () => eventCount++);
  }
  
  return new Promise(resolve => setTimeout(resolve, 2100));
}

// Generate report
function generateReport() {
  console.log(chalk.cyan.bold('\n📋 Verification Report\n'));
  console.log('═'.repeat(50));
  
  // Summary
  const total = results.passed.length + results.failed.length;
  const passRate = total > 0 ? (results.passed.length / total * 100).toFixed(1) : 0;
  
  console.log(chalk.bold(`\nTotal Tests: ${total}`));
  console.log(chalk.green(`Passed: ${results.passed.length}`));
  console.log(chalk.red(`Failed: ${results.failed.length}`));
  console.log(chalk.yellow(`Warnings: ${results.warnings.length}`));
  console.log(chalk.bold(`Pass Rate: ${passRate}%\n`));
  
  // Detailed results
  if (results.passed.length > 0) {
    console.log(chalk.green.bold('\n🏁 Passed Tests:'));
    results.passed.forEach(test => console.log(`  ${test}`));
  }
  
  if (results.warnings.length > 0) {
    console.log(chalk.yellow.bold('\n🟠️ Warnings:'));
    results.warnings.forEach(warning => console.log(`  ${warning}`));
  }
  
  if (results.failed.length > 0) {
    console.log(chalk.red.bold('\n🔴 Failed Tests:'));
    results.failed.forEach(test => console.log(`  ${test}`));
  }
  
  // Overall status
  console.log('\n' + '═'.repeat(50));
  if (results.failed.length === 0) {
    console.log(chalk.green.bold('\n🟡 All critical tests passed! Performance system is operational.\n'));
  } else if (results.failed.length <= 2) {
    console.log(chalk.yellow.bold('\n🟠️ Performance system is partially operational. Some components need attention.\n'));
  } else {
    console.log(chalk.red.bold('\n🔴 Performance system has critical issues. Please review failed tests.\n'));
  }
}

// Cleanup
function cleanup() {
  console.log(chalk.gray('\nCleaning up...'));
  
  // Stop all services
  try {
    if (loadedModules.dashboard) loadedModules.dashboard.stop();
    if (loadedModules.metricsCollector) loadedModules.metricsCollector.stop();
    if (loadedModules.cacheSystem) loadedModules.cacheSystem.stop();
    if (loadedModules.analyzer) loadedModules.analyzer.stop();
    if (loadedModules.predictiveMonitor) loadedModules.predictiveMonitor.stop();
    if (loadedModules.optimizationEngine) loadedModules.optimizationEngine.stop();
  } catch (error) {
    console.error(chalk.red('Cleanup error:', error.message));
  }
}

// Main execution
async function main() {
  try {
    await verifyModules();
    await testDashboard();
    await testMetricsCollector();
    await testCacheSystem();
    await testAnalyzer();
    await testPredictiveMonitor();
    await testOptimizationEngine();
    await testMemoryManager();
    await testIntegration();
    
    generateReport();
  } catch (error) {
    console.error(chalk.red.bold('\n🔴 Verification failed with error:'));
    console.error(error);
    results.failed.push(`🔴 Fatal error: ${error.message}`);
  } finally {
    cleanup();
    
    // Exit with appropriate code
    const exitCode = results.failed.length === 0 ? 0 : 1;
    process.exit(exitCode);
  }
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error(chalk.red('Unhandled rejection:', error));
  results.failed.push(`🔴 Unhandled rejection: ${error.message}`);
  cleanup();
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error(chalk.red('Uncaught exception:', error));
  results.failed.push(`🔴 Uncaught exception: ${error.message}`);
  cleanup();
  process.exit(1);
});

// Run verification
console.log(chalk.gray('Starting verification...\n'));
main();
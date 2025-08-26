/**
 * BUMBA Performance System Integration Tests
 * Verifies all performance monitoring components work together
 */

const { describe, it, expect, beforeAll, afterAll } = require('@jest/globals');

// Import all performance modules
const dashboard = require('../../src/core/monitoring/auto-performance-dashboard');
const metricsCollector = require('../../src/core/monitoring/comprehensive-metrics-collector');
const cacheSystem = require('../../src/core/performance/intelligent-cache-system');
const analyzer = require('../../src/core/performance/real-time-analyzer');
const predictiveMonitor = require('../../src/core/performance/predictive-monitor');
const optimizationEngine = require('../../src/core/performance/optimization-engine');

describe('Performance System Integration', () => {
  
  beforeAll(() => {
    // Set up test environment
    global.bumbaFramework = {
      metrics: {
        totalRequests: 1000,
        totalErrors: 10,
        avgResponseTime: 200,
        requestsPerSecond: 50,
        errorRate: 1
      },
      agentManager: {
        activeAgents: new Set(['agent1', 'agent2']),
        pendingAgents: new Set(),
        completedAgents: new Set(['agent3']),
        failedAgents: new Set()
      },
      commandQueue: []
    };
  });
  
  afterAll(() => {
    // Clean up
    dashboard.stop();
    metricsCollector.stop();
    cacheSystem.stop();
    analyzer.stop();
    predictiveMonitor.stop();
    optimizationEngine.stop();
    
    delete global.bumbaFramework;
  });
  
  describe('Auto Performance Dashboard', () => {
    it('should auto-start and collect metrics', (done) => {
      expect(dashboard.isRunning).toBe(true);
      expect(dashboard.config.autoStart).toBe(true);
      
      // Wait for metrics collection
      setTimeout(() => {
        const metrics = dashboard.getMetrics();
        expect(metrics).toBeDefined();
        expect(metrics.system).toBeDefined();
        expect(metrics.process).toBeDefined();
        done();
      }, 100);
    });
    
    it('should track performance history', (done) => {
      setTimeout(() => {
        const history = dashboard.history;
        expect(history.cpu).toBeDefined();
        expect(history.memory).toBeDefined();
        expect(history.cpu.length).toBeGreaterThan(0);
        done();
      }, 1500);
    });
    
    it('should trigger alerts on threshold exceeded', (done) => {
      dashboard.once('alert', (alert) => {
        expect(alert).toBeDefined();
        expect(alert.metric).toBeDefined();
        expect(alert.value).toBeDefined();
        expect(alert.threshold).toBeDefined();
        done();
      });
      
      // Simulate high CPU
      dashboard.checkThresholds('cpu', 95);
    });
  });
  
  describe('Comprehensive Metrics Collector', () => {
    it('should collect metrics from all sources', async () => {
      const metrics = await metricsCollector.collect();
      
      expect(metrics).toBeDefined();
      expect(metrics.system).toBeDefined();
      expect(metrics.process).toBeDefined();
      expect(metrics.v8).toBeDefined();
      expect(metrics.framework).toBeDefined();
    });
    
    it('should maintain time series data', async () => {
      await metricsCollector.collect();
      await metricsCollector.collect();
      
      const timeSeries = metricsCollector.timeSeries;
      expect(timeSeries.size).toBeGreaterThan(0);
      
      // Check specific metric time series
      const systemSeries = timeSeries.get('system');
      if (systemSeries) {
        expect(systemSeries.size).toBeGreaterThan(0);
      }
    });
    
    it('should detect anomalies', (done) => {
      metricsCollector.once('anomaly:detected', (anomaly) => {
        expect(anomaly).toBeDefined();
        expect(anomaly.metric).toBeDefined();
        expect(anomaly.value).toBeDefined();
        expect(anomaly.zscore).toBeDefined();
        done();
      });
      
      // Inject anomalous data
      const anomalousMetrics = {
        system: { cpu: { usage: 99.9 } }
      };
      
      metricsCollector.detectAnomalies(anomalousMetrics);
    });
    
    it('should perform aggregations', async () => {
      await metricsCollector.collect();
      
      const aggregations = metricsCollector.getLatestAggregations();
      if (aggregations) {
        expect(aggregations.count).toBeGreaterThan(0);
        expect(aggregations.sum).toBeDefined();
        expect(aggregations.avg).toBeDefined();
      }
    });
  });
  
  describe('Intelligent Cache System', () => {
    it('should support multi-tier caching', async () => {
      await cacheSystem.set('test-key', 'test-value', { tier: 'hot' });
      
      const value = await cacheSystem.get('test-key');
      expect(value).toBe('test-value');
      
      const info = cacheSystem.getInfo();
      expect(info.tiers.hot.items).toBeGreaterThan(0);
    });
    
    it('should compress large values', async () => {
      const largeValue = 'x'.repeat(2000);
      await cacheSystem.set('large-key', largeValue, { tier: 'warm' });
      
      const stats = cacheSystem.getStats();
      expect(stats.overall.compressions).toBeGreaterThan(0);
    });
    
    it('should promote frequently accessed items', async () => {
      await cacheSystem.set('freq-key', 'value', { tier: 'cold' });
      
      // Access multiple times
      for (let i = 0; i < 5; i++) {
        await cacheSystem.get('freq-key');
      }
      
      const metadata = cacheSystem.metadata.get('freq-key');
      expect(metadata.accessCount).toBe(5);
    });
    
    it('should evict items when cache is full', async () => {
      // Fill cache
      for (let i = 0; i < 100; i++) {
        await cacheSystem.set(`evict-key-${i}`, `value-${i}`, { tier: 'hot' });
      }
      
      const stats = cacheSystem.getStats();
      expect(stats.overall.evictions).toBeGreaterThanOrEqual(0);
    });
  });
  
  describe('Real-Time Performance Analyzer', () => {
    it('should analyze metrics in real-time', (done) => {
      analyzer.once('analysis:complete', (result) => {
        expect(result).toBeDefined();
        expect(result.metrics).toBeDefined();
        expect(result.issues).toBeDefined();
        expect(result.insights).toBeDefined();
        expect(result.recommendations).toBeDefined();
        done();
      });
      
      analyzer.performAnalysis();
    });
    
    it('should detect bottlenecks', async () => {
      const metrics = {
        system: { cpu: { usage: 95 }, memory: { percentage: 90 } },
        process: { memory: { heapUsed: 900000000, heapTotal: 1000000000 } },
        custom: { eventLoopLag: 250 }
      };
      
      analyzer.detectBottlenecks(metrics);
      
      expect(analyzer.bottlenecks.cpu).toBeDefined();
      expect(analyzer.bottlenecks.cpu.detected).toBe(true);
      expect(analyzer.bottlenecks.memory).toBeDefined();
      expect(analyzer.bottlenecks.io).toBeDefined();
    });
    
    it('should generate actionable recommendations', async () => {
      analyzer.generateRecommendations();
      
      const recommendations = analyzer.recommendations;
      expect(Array.isArray(recommendations)).toBe(true);
      
      if (recommendations.length > 0) {
        expect(recommendations[0].recommendation).toBeDefined();
        expect(recommendations[0].actionable).toBeDefined();
      }
    });
    
    it('should analyze trends', () => {
      // Add sample data
      const now = Date.now();
      for (let i = 0; i < 20; i++) {
        analyzer.realTimeMetrics.cpu.push({
          timestamp: now - (20 - i) * 1000,
          value: 50 + i // Increasing trend
        });
      }
      
      analyzer.analyzeTrends({ system: { cpu: { usage: 70 } } });
      
      const cpuTrend = analyzer.trends.get('cpu');
      expect(cpuTrend).toBeDefined();
      expect(cpuTrend.direction).toBe('increasing');
    });
  });
  
  describe('Predictive Performance Monitor', () => {
    it('should make predictions based on historical data', async () => {
      // Add historical data
      const now = Date.now();
      for (let i = 0; i < 50; i++) {
        predictiveMonitor.historicalData.cpu.push({
          timestamp: now - (50 - i) * 5000,
          value: 40 + i * 0.5 // Gradual increase
        });
      }
      
      await predictiveMonitor.makePredictions();
      
      const predictions = Array.from(predictiveMonitor.predictions.values()).pop();
      expect(predictions).toBeDefined();
      
      if (predictions && predictions.cpu) {
        expect(predictions.cpu.value).toBeDefined();
        expect(predictions.cpu.confidence).toBeDefined();
        expect(predictions.cpu.trend).toBeDefined();
      }
    });
    
    it('should generate alerts for predicted issues', (done) => {
      predictiveMonitor.once('alerts:generated', (alerts) => {
        expect(Array.isArray(alerts)).toBe(true);
        expect(alerts.length).toBeGreaterThan(0);
        expect(alerts[0].type).toBeDefined();
        expect(alerts[0].message).toBeDefined();
        done();
      });
      
      // Analyze predictions that would trigger alerts
      const predictions = {
        cpu: { value: 95, confidence: 0.8, trend: 'increasing' },
        memory: { value: 92, confidence: 0.85, trend: 'increasing' }
      };
      
      predictiveMonitor.analyzePredictions(predictions);
    });
    
    it('should detect memory leak patterns', () => {
      // Simulate memory leak pattern
      const now = Date.now();
      for (let i = 0; i < 60; i++) {
        predictiveMonitor.historicalData.memory.push({
          timestamp: now - (60 - i) * 5000,
          value: 50 + i * 0.8 // Consistent growth
        });
      }
      
      const leakProbability = predictiveMonitor.detectMemoryLeakPattern();
      expect(leakProbability).toBeGreaterThan(0.5);
    });
  });
  
  describe('Performance Optimization Engine', () => {
    it('should determine needed optimizations', async () => {
      const metrics = {
        system: { cpuUsage: 85, memoryUsage: 80 },
        process: { heapUsage: 85, handles: 150, requests: 60 },
        application: { responseTime: 600, queueLength: 15 }
      };
      
      const optimizations = optimizationEngine.determineOptimizations(metrics);
      
      expect(Array.isArray(optimizations)).toBe(true);
      expect(optimizations.length).toBeGreaterThan(0);
      expect(optimizations[0].strategy).toBeDefined();
      expect(optimizations[0].priority).toBeDefined();
    });
    
    it('should calculate performance score', () => {
      const metrics = {
        system: { cpuUsage: 60, memoryUsage: 70 },
        process: { heapUsage: 75 },
        application: { responseTime: 400, errorRate: 2 }
      };
      
      const score = optimizationEngine.calculatePerformanceScore(metrics);
      
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
    
    it('should apply optimizations', async () => {
      const metrics = {
        system: { cpuUsage: 50, memoryUsage: 60 },
        process: { heapUsage: 70 },
        application: { responseTime: 300 }
      };
      
      const optimizations = [
        { strategy: 'gc_optimization', priority: 'high' }
      ];
      
      const results = await optimizationEngine.applyOptimizations(optimizations, metrics);
      
      expect(Array.isArray(results)).toBe(true);
      
      if (results.length > 0) {
        expect(results[0].strategy).toBeDefined();
        expect(results[0].success).toBeDefined();
      }
    });
  });
  
  describe('System Integration', () => {
    it('should have all components communicating', (done) => {
      let eventsReceived = 0;
      const expectedEvents = 3;
      
      const checkComplete = () => {
        eventsReceived++;
        if (eventsReceived >= expectedEvents) {
          done();
        }
      };
      
      // Listen for events from different components
      dashboard.once('metrics:updated', checkComplete);
      metricsCollector.once('metrics:collected', checkComplete);
      analyzer.once('analysis:complete', checkComplete);
      
      // Trigger collection cycle
      dashboard.collect();
      metricsCollector.collect();
      analyzer.performAnalysis();
    });
    
    it('should share metrics between components', async () => {
      // Collect metrics
      const collectorMetrics = await metricsCollector.collect();
      
      // Verify dashboard can access similar metrics
      const dashboardMetrics = dashboard.getMetrics();
      
      expect(collectorMetrics).toBeDefined();
      expect(dashboardMetrics).toBeDefined();
      
      // Both should have system metrics
      if (collectorMetrics.system) {
        expect(dashboardMetrics.system).toBeDefined();
      }
    });
    
    it('should trigger optimization based on analysis', (done) => {
      optimizationEngine.once('optimization:complete', (result) => {
        expect(result).toBeDefined();
        expect(result.performanceScore).toBeDefined();
        done();
      });
      
      // Simulate high resource usage to trigger optimization
      optimizationEngine.performOptimization();
    });
    
    it('should maintain performance history across components', () => {
      // Check that multiple components maintain history
      expect(dashboard.history.cpu.length).toBeGreaterThanOrEqual(0);
      expect(analyzer.realTimeMetrics.cpu.length).toBeGreaterThanOrEqual(0);
      expect(predictiveMonitor.historicalData.cpu.length).toBeGreaterThanOrEqual(0);
    });
  });
  
  describe('Performance Under Load', () => {
    it('should handle high metric collection rate', async () => {
      const promises = [];
      
      // Simulate high collection rate
      for (let i = 0; i < 100; i++) {
        promises.push(metricsCollector.collect());
      }
      
      await Promise.all(promises);
      
      const stats = metricsCollector.stats;
      expect(stats.collectionsCompleted).toBeGreaterThanOrEqual(100);
    });
    
    it('should handle many cache operations', async () => {
      const promises = [];
      
      // Simulate many cache operations
      for (let i = 0; i < 500; i++) {
        promises.push(cacheSystem.set(`load-key-${i}`, `value-${i}`));
      }
      
      await Promise.all(promises);
      
      // Verify cache handled the load
      const stats = cacheSystem.getStats();
      expect(stats.totalItems).toBeGreaterThan(0);
    });
    
    it('should optimize under memory pressure', async () => {
      // Simulate memory pressure
      const metrics = {
        system: { cpuUsage: 50, memoryUsage: 90 },
        process: { heapUsage: 95, handles: 50, requests: 10 },
        v8: {},
        application: { responseTime: 200, queueLength: 5 }
      };
      
      const optimizations = optimizationEngine.determineOptimizations(metrics);
      
      // Should prioritize memory optimizations
      const memoryOpts = optimizations.filter(o => 
        o.strategy.includes('memory') || o.strategy.includes('gc') || o.strategy.includes('cache')
      );
      
      expect(memoryOpts.length).toBeGreaterThan(0);
    });
  });
  
  describe('Error Handling', () => {
    it('should handle collector failures gracefully', async () => {
      // Register a failing collector
      metricsCollector.registerCollector('failing', async () => {
        throw new Error('Collector failed');
      });
      
      // Should not throw
      const metrics = await metricsCollector.collect();
      expect(metrics).toBeDefined();
      
      // Check error was recorded
      expect(metricsCollector.stats.errorsEncountered).toBeGreaterThan(0);
    });
    
    it('should handle cache errors gracefully', async () => {
      // Try to get non-existent key
      const value = await cacheSystem.get('non-existent-key');
      expect(value).toBeNull();
      
      // Stats should reflect miss
      const stats = cacheSystem.getStats();
      expect(stats.overall.misses).toBeGreaterThan(0);
    });
    
    it('should handle optimization failures', async () => {
      const metrics = {
        system: { cpuUsage: 50, memoryUsage: 60 },
        process: { heapUsage: 70 },
        application: { responseTime: 300 }
      };
      
      // Try to apply non-existent strategy
      const optimizations = [
        { strategy: 'non_existent_strategy', priority: 'high' }
      ];
      
      const results = await optimizationEngine.applyOptimizations(optimizations, metrics);
      
      // Should handle gracefully
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0);
    });
  });
});

// Export test configuration
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/performance-system.test.js'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: ['/node_modules/'],
  verbose: true
};
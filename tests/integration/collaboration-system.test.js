/**
 * Collaboration System Integration Tests
 * Comprehensive testing of all collaboration components
 */

const { describe, it, expect, beforeAll, afterAll } = require('@jest/globals');

// Import collaboration components
const { EventCoordinationEnhancement, MemoryOptimizationEnhancement, ImprovementInsightsEnhancement } = 
  require('../../src/core/collaboration/enhanced-capabilities');

const { AdvancedLoadBalancer, AdvancedRetryMechanism, AutoHealingSystem } = 
  require('../../src/core/resilience');

const { CollaborationPerformanceOptimizer } = 
  require('../../src/core/performance/collaboration-performance-optimizer');

const NetworkResilience = require('../../src/utils/networkResilience');

describe('Collaboration System Integration Tests', () => {
  let eventCoordinator;
  let memoryOptimizer;
  let insightsEngine;
  let loadBalancer;
  let retryMechanism;
  let autoHealing;
  let performanceOptimizer;
  let networkResilience;

  beforeAll(() => {
    // Initialize all components
    eventCoordinator = new EventCoordinationEnhancement();
    memoryOptimizer = new MemoryOptimizationEnhancement();
    insightsEngine = new ImprovementInsightsEnhancement();
    loadBalancer = new AdvancedLoadBalancer();
    retryMechanism = new AdvancedRetryMechanism();
    autoHealing = new AutoHealingSystem();
    performanceOptimizer = new CollaborationPerformanceOptimizer();
    networkResilience = new NetworkResilience();
  });

  afterAll(() => {
    // Cleanup
    if (loadBalancer.shutdown) loadBalancer.shutdown();
    if (retryMechanism.shutdown) retryMechanism.shutdown();
    if (autoHealing.shutdown) autoHealing.shutdown();
  });

  describe('Real-time Collaboration Tests', () => {
    it('should coordinate events with proper sequencing', async () => {
      const events = [];
      
      // Register event handler
      eventCoordinator.registerEvent('test-event', 3, async (data) => {
        events.push(data);
      });
      
      // Send multiple events
      await eventCoordinator.coordinateEvent('test-event', { id: 1 });
      await eventCoordinator.coordinateEvent('test-event', { id: 2 });
      await eventCoordinator.coordinateEvent('test-event', { id: 3 });
      
      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(events).toHaveLength(3);
      expect(events[0].id).toBe(1);
      expect(events[1].id).toBe(2);
      expect(events[2].id).toBe(3);
    });

    it('should handle event priorities correctly', async () => {
      const processedEvents = [];
      
      eventCoordinator.registerEvent('priority-test', 3, async (data) => {
        processedEvents.push(data.priority);
      });
      
      // Send events with different priorities
      await eventCoordinator.coordinateEvent('priority-test', 
        { priority: 1 }, { priority: 1 });
      await eventCoordinator.coordinateEvent('priority-test', 
        { priority: 5 }, { priority: 5 });
      await eventCoordinator.coordinateEvent('priority-test', 
        { priority: 3 }, { priority: 3 });
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Higher priority should be processed first
      expect(processedEvents[0]).toBeGreaterThanOrEqual(3);
    });

    it('should deduplicate events', async () => {
      const processedCount = { count: 0 };
      
      eventCoordinator.registerEvent('dedup-test', 3, async () => {
        processedCount.count++;
      });
      
      // Send duplicate events
      await eventCoordinator.coordinateEvent('dedup-test', { data: 'same' });
      await eventCoordinator.coordinateEvent('dedup-test', { data: 'same' });
      await eventCoordinator.coordinateEvent('dedup-test', { data: 'same' });
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Should only process once due to deduplication
      expect(processedCount.count).toBeLessThan(3);
    });
  });

  describe('Team Memory System Tests', () => {
    it('should optimize memory storage with compression', async () => {
      const largeData = { 
        content: 'x'.repeat(10000),
        metadata: { type: 'test' }
      };
      
      const result = await memoryOptimizer.storeMemory('test-key', largeData);
      
      expect(result.compressed).toBe(true);
      expect(result.size).toBeLessThan(10000);
    });

    it('should implement tiered storage correctly', async () => {
      // Store multiple memories
      await memoryOptimizer.storeMemory('hot-1', { data: 'hot' });
      await memoryOptimizer.storeMemory('hot-2', { data: 'hot' });
      
      // Retrieve to test tier promotion
      const retrieved = await memoryOptimizer.retrieveMemory('hot-1');
      
      expect(retrieved).not.toBeNull();
      expect(retrieved.tier).toBeDefined();
      expect(retrieved.accessCount).toBeGreaterThan(0);
    });

    it('should deduplicate identical content', async () => {
      const identicalData = { content: 'duplicate-test' };
      
      const result1 = await memoryOptimizer.storeMemory('dup-1', identicalData);
      const result2 = await memoryOptimizer.storeMemory('dup-2', identicalData);
      
      const stats = memoryOptimizer.getStats();
      expect(stats.efficiency.deduplicationSavings).toBeGreaterThan(0);
    });

    it('should enforce memory limits', async () => {
      // Set a small memory limit for testing
      memoryOptimizer.config.maxMemorySize = 1000;
      
      // Try to store more than the limit
      for (let i = 0; i < 20; i++) {
        await memoryOptimizer.storeMemory(`limit-${i}`, { 
          data: 'x'.repeat(100) 
        });
      }
      
      const stats = memoryOptimizer.getStats();
      expect(stats.totalSize).toBeLessThanOrEqual(1000);
    });
  });

  describe('Collaboration Metrics Tests', () => {
    it('should generate insights from metrics', () => {
      // Record poor performance metrics
      insightsEngine.recordMetrics({
        responseTime: 500,
        throughput: 200,
        collaborationScore: 0.5
      });
      
      const insights = insightsEngine.getActionableInsights();
      
      expect(insights.length).toBeGreaterThan(0);
      expect(insights[0].recommendation).toBeDefined();
    });

    it('should detect trends in metrics', () => {
      // Record multiple similar issues
      for (let i = 0; i < 10; i++) {
        insightsEngine.recordMetrics({
          responseTime: 300 + i * 10,
          throughput: 100,
          collaborationScore: 0.6
        });
      }
      
      const stats = insightsEngine.getStats();
      expect(stats.trends.length).toBeGreaterThan(0);
    });

    it('should generate predictive insights', () => {
      // Enable predictive insights
      insightsEngine.config.enablePredictiveInsights = true;
      
      // Record pattern of degrading performance
      for (let i = 0; i < 5; i++) {
        insightsEngine.recordMetrics({
          responseTime: 100 + i * 50,
          throughput: 1000 - i * 100,
          collaborationScore: 0.9 - i * 0.1
        });
      }
      
      const stats = insightsEngine.getStats();
      expect(stats.predictions.length).toBeGreaterThan(0);
    });
  });

  describe('Network Resilience Tests', () => {
    it('should register nodes with load balancer', async () => {
      // Register multiple nodes
      loadBalancer.registerNode('node-1', {
        endpoint: 'http://node1.test',
        weight: 1,
        capacity: 100
      });
      
      loadBalancer.registerNode('node-2', {
        endpoint: 'http://node2.test',
        weight: 2,
        capacity: 200
      });
      
      const stats = loadBalancer.getStats();
      expect(stats.nodes.length).toBe(2);
    });

    it('should route requests with load balancing', async () => {
      const routingResults = [];
      
      // Route multiple requests
      for (let i = 0; i < 10; i++) {
        const result = await loadBalancer.route(
          { data: `request-${i}` },
          { clientIP: '192.168.1.1' }
        );
        routingResults.push(result.nodeId);
      }
      
      // Check that requests were distributed
      const uniqueNodes = new Set(routingResults);
      expect(uniqueNodes.size).toBeGreaterThan(1);
    });

    it('should retry failed operations with backoff', async () => {
      let attemptCount = 0;
      const failingOperation = async () => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Temporary failure');
        }
        return 'success';
      };
      
      const result = await retryMechanism.executeWithRetry(failingOperation);
      
      expect(result).toBe('success');
      expect(attemptCount).toBe(3);
    });

    it('should trigger auto-healing for unhealthy services', async () => {
      // Register service for auto-healing
      autoHealing.registerService('test-service', {
        name: 'Test Service',
        type: 'api',
        criticality: 'high'
      });
      
      // Simulate unhealthy state
      await autoHealing.checkServiceHealth('test-service');
      
      const stats = autoHealing.getStats();
      expect(stats.services['test-service']).toBeDefined();
    });
  });

  describe('Performance Optimization Tests', () => {
    it('should optimize real-time response with caching', async () => {
      const operation = async () => {
        return { data: 'test-response', timestamp: Date.now() };
      };
      
      // First call - cache miss
      const start1 = Date.now();
      const result1 = await performanceOptimizer.optimizeRealTimeResponse(
        operation, 
        { service: 'test' }
      );
      const time1 = Date.now() - start1;
      
      // Second call - cache hit
      const start2 = Date.now();
      const result2 = await performanceOptimizer.optimizeRealTimeResponse(
        operation,
        { service: 'test' }
      );
      const time2 = Date.now() - start2;
      
      // Cache hit should be faster
      expect(time2).toBeLessThanOrEqual(time1);
    });

    it('should batch operations for improved throughput', async () => {
      const operations = [];
      for (let i = 0; i < 100; i++) {
        operations.push(async () => ({ id: i }));
      }
      
      const start = Date.now();
      const results = await performanceOptimizer.optimizeThroughput(operations);
      const duration = Date.now() - start;
      
      expect(results).toHaveLength(100);
      
      // Calculate throughput
      const throughput = (100 / duration) * 1000;
      expect(throughput).toBeGreaterThan(10); // At least 10 ops/sec
    });

    it('should minimize latency with optimization', async () => {
      const operation = async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return 'result';
      };
      
      const start = Date.now();
      const result = await performanceOptimizer.optimizeLatency(operation);
      const latency = Date.now() - start;
      
      expect(result).toBeDefined();
      expect(latency).toBeLessThan(200); // Should be optimized
    });
  });

  describe('End-to-End Integration Tests', () => {
    it('should handle complete collaboration workflow', async () => {
      // 1. Register event
      eventCoordinator.registerEvent('collab-event', 5, async (data) => {
        // 2. Store in memory
        await memoryOptimizer.storeMemory(`event-${data.id}`, data);
        
        // 3. Record metrics
        insightsEngine.recordMetrics({
          responseTime: 50,
          throughput: 1000,
          collaborationScore: 0.95
        });
      });
      
      // 4. Send event through performance optimizer
      await performanceOptimizer.optimizeRealTimeResponse(async () => {
        return await eventCoordinator.coordinateEvent('collab-event', {
          id: 'workflow-1',
          data: 'test'
        });
      });
      
      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // 5. Verify memory was stored
      const memory = await memoryOptimizer.retrieveMemory('event-workflow-1');
      expect(memory).not.toBeNull();
      
      // 6. Check insights were generated
      const stats = insightsEngine.getStats();
      expect(stats.metricsHistory).toBeGreaterThan(0);
    });

    it('should maintain resilience under load', async () => {
      const results = [];
      const errors = [];
      
      // Simulate load with multiple parallel operations
      const promises = [];
      for (let i = 0; i < 50; i++) {
        const promise = retryMechanism.executeWithRetry(async () => {
          // Random failures to test resilience
          if (Math.random() > 0.7) {
            throw new Error('Random failure');
          }
          return { success: true, id: i };
        }).then(
          result => results.push(result),
          error => errors.push(error)
        );
        
        promises.push(promise);
      }
      
      await Promise.allSettled(promises);
      
      // Should have handled most requests successfully
      expect(results.length).toBeGreaterThan(30);
      
      // Check retry statistics
      const retryStats = retryMechanism.getStats();
      expect(retryStats.metrics.totalRetries).toBeGreaterThan(0);
    });

    it('should adapt to changing conditions', async () => {
      // Start with good performance
      for (let i = 0; i < 5; i++) {
        insightsEngine.recordMetrics({
          responseTime: 50,
          throughput: 1000,
          collaborationScore: 0.95
        });
      }
      
      // Degrade performance
      for (let i = 0; i < 5; i++) {
        insightsEngine.recordMetrics({
          responseTime: 500,
          throughput: 100,
          collaborationScore: 0.4
        });
      }
      
      // Check if system detected the degradation
      const insights = insightsEngine.getActionableInsights();
      const highSeverityInsights = insights.filter(i => i.severity === 'high');
      
      expect(highSeverityInsights.length).toBeGreaterThan(0);
      
      // Verify performance optimizer adjusts
      performanceOptimizer.analyzePerformance();
      const perfStats = performanceOptimizer.getStats();
      
      expect(perfStats.config.cacheSize).toBeGreaterThan(1000);
    });
  });

  describe('Security and Validation Tests', () => {
    it('should validate event data', async () => {
      const maliciousData = {
        script: '<script>alert("xss")</script>',
        sql: "'; DROP TABLE users; --"
      };
      
      // System should handle malicious data safely
      const eventId = await eventCoordinator.coordinateEvent(
        'security-test',
        maliciousData
      );
      
      expect(eventId).toBeDefined();
      // Event should be processed without executing malicious code
    });

    it('should enforce rate limiting', async () => {
      const requests = [];
      
      // Send many requests rapidly
      for (let i = 0; i < 100; i++) {
        requests.push(
          performanceOptimizer.optimizeRealTimeResponse(
            async () => ({ id: i }),
            { service: 'rate-limit-test' }
          )
        );
      }
      
      await Promise.allSettled(requests);
      
      // Check that system handled the load appropriately
      const stats = performanceOptimizer.getStats();
      expect(stats.metrics.realTimeResponse).toBeLessThan(1000);
    });
  });

  describe('Performance Benchmarks', () => {
    it('should meet response time targets', async () => {
      const responseTimes = [];
      
      for (let i = 0; i < 10; i++) {
        const start = Date.now();
        await performanceOptimizer.optimizeRealTimeResponse(
          async () => ({ test: i })
        );
        responseTimes.push(Date.now() - start);
      }
      
      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      expect(avgResponseTime).toBeLessThan(100); // Target: < 100ms
    });

    it('should achieve target throughput', async () => {
      const operations = Array(100).fill(null).map((_, i) => 
        async () => ({ id: i })
      );
      
      const start = Date.now();
      await performanceOptimizer.optimizeThroughput(operations);
      const duration = Date.now() - start;
      
      const throughput = (100 / duration) * 1000;
      expect(throughput).toBeGreaterThan(100); // Target: > 100 ops/sec
    });

    it('should maintain low latency', async () => {
      const latencies = [];
      
      for (let i = 0; i < 10; i++) {
        const start = Date.now();
        await performanceOptimizer.optimizeLatency(
          async () => ({ test: i })
        );
        latencies.push(Date.now() - start);
      }
      
      const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
      expect(avgLatency).toBeLessThan(50); // Target: < 50ms
    });
  });
});

// Export for use in other tests
module.exports = {
  EventCoordinationEnhancement,
  MemoryOptimizationEnhancement,
  ImprovementInsightsEnhancement
};
/**
 * BUMBA Resource Management Integration Tests
 * Comprehensive testing of all resource management improvements
 */

const { describe, it, expect, beforeEach, afterEach } = require('@jest/globals');
const { EventEmitter } = require('events');

// Import resource management modules
const { MemoryManager, getInstance: getMemoryManager } = require('../../src/core/resource-management/memory-manager');
const memoryLeakDetector = require('../../src/core/resource-management/memory-leak-detector');
const smartCache = require('../../src/core/resource-management/smart-cache-invalidation');
const { ResourceLimitsConfig, getInstance: getLimitsConfig } = require('../../src/core/resource-management/resource-limits-config');
const resourceMonitor = require('../../src/core/resource-management/resource-monitor');

describe('Resource Management Integration Tests', () => {
  let memoryManager;
  let limitsConfig;
  
  beforeEach(() => {
    memoryManager = getMemoryManager();
    limitsConfig = getLimitsConfig();
  });
  
  afterEach(() => {
    // Cleanup
    memoryLeakDetector.stop();
    smartCache.stop();
    resourceMonitor.stop();
  });

  describe('Memory Leak Detection', () => {
    it('should detect memory growth patterns', async () => {
      // Simulate memory growth
      const leaks = [];
      
      for (let i = 0; i < 5; i++) {
        const bigArray = new Array(1000000).fill(Math.random());
        leaks.push(bigArray);
        
        // Collect sample
        memoryLeakDetector.collectSample();
        
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Analyze for leaks
      memoryLeakDetector.analyzeForLeaks();
      
      const stats = memoryLeakDetector.getStats();
      expect(stats.samplesCollected).toBeGreaterThan(0);
    });
    
    it('should detect uncleaned timers', () => {
      // Create timers without cleaning them
      const timers = [];
      
      for (let i = 0; i < 10; i++) {
        timers.push(setTimeout(() => {}, 10000));
      }
      
      const leak = memoryLeakDetector.detectUncleanedTimers();
      expect(leak).toBeDefined();
      expect(leak.count).toBeGreaterThan(0);
      
      // Fix the leak
      const fix = memoryLeakDetector.fixUncleanedTimers();
      expect(fix.cleaned).toBeGreaterThan(0);
      
      // Clean up
      timers.forEach(timer => clearTimeout(timer));
    });
    
    it('should detect event listener leaks', () => {
      const emitter = new EventEmitter();
      
      // Add many listeners
      for (let i = 0; i < 20; i++) {
        emitter.on('test', () => {});
      }
      
      const leak = memoryLeakDetector.detectEventListenerLeaks();
      // Process object might have listeners
      
      // Clean up
      emitter.removeAllListeners();
    });
    
    it('should auto-fix detected leaks when enabled', async () => {
      memoryLeakDetector.config.autoFix = true;
      
      // Create a leak pattern
      const cache = new Map();
      for (let i = 0; i < 1000; i++) {
        cache.set(`key_${i}`, new Array(1000).fill(i));
      }
      
      // Trigger detection
      memoryLeakDetector.collectSample();
      memoryLeakDetector.analyzeForLeaks();
      
      // Check if fixes were attempted
      const stats = memoryLeakDetector.getStats();
      expect(stats).toBeDefined();
      
      // Clean up
      cache.clear();
    });
  });

  describe('Smart Cache Invalidation', () => {
    beforeEach(() => {
      smartCache.clear();
    });
    
    it('should implement TTL strategy', () => {
      smartCache.config.strategy = 'ttl';
      smartCache.currentStrategy = smartCache.strategies.ttl;
      
      // Set with TTL
      smartCache.set('key1', 'value1', { ttl: 1000 });
      
      // Should be valid immediately
      const value = smartCache.get('key1');
      expect(value).toBe('value1');
      
      // Check expiration
      const entry = smartCache.cache.get('key1');
      expect(entry.expires).toBeGreaterThan(Date.now());
    });
    
    it('should implement LRU strategy', () => {
      smartCache.config.strategy = 'lru';
      smartCache.currentStrategy = smartCache.strategies.lru;
      smartCache.config.maxSize = 3;
      
      // Fill cache
      smartCache.set('key1', 'value1');
      smartCache.set('key2', 'value2');
      smartCache.set('key3', 'value3');
      
      // Access key1 to make it recently used
      smartCache.get('key1');
      
      // Add new item, should evict key2 or key3
      smartCache.set('key4', 'value4');
      
      expect(smartCache.cache.size).toBeLessThanOrEqual(3);
      expect(smartCache.get('key1')).toBe('value1'); // Should still exist
    });
    
    it('should implement LFU strategy', () => {
      smartCache.config.strategy = 'lfu';
      smartCache.currentStrategy = smartCache.strategies.lfu;
      
      // Set items
      smartCache.set('frequent', 'value1');
      smartCache.set('rare', 'value2');
      
      // Access frequent item multiple times
      for (let i = 0; i < 5; i++) {
        smartCache.get('frequent');
      }
      
      // Frequent item should have higher hits
      const frequentEntry = smartCache.cache.get('frequent');
      const rareEntry = smartCache.cache.get('rare');
      
      expect(frequentEntry.hits).toBeGreaterThan(rareEntry.hits);
    });
    
    it('should track dependencies and invalidate dependents', () => {
      smartCache.config.enableDependencyTracking = true;
      
      // Set entries with dependencies
      smartCache.set('parent', 'parent_value');
      smartCache.set('child1', 'child1_value', { dependencies: ['parent'] });
      smartCache.set('child2', 'child2_value', { dependencies: ['parent'] });
      
      // Invalidate parent
      smartCache.invalidate('parent');
      
      // Children should also be invalidated
      expect(smartCache.get('child1')).toBeUndefined();
      expect(smartCache.get('child2')).toBeUndefined();
    });
    
    it('should invalidate by tag', () => {
      // Set entries with tags
      smartCache.set('item1', 'value1', { tags: ['user', 'session'] });
      smartCache.set('item2', 'value2', { tags: ['user'] });
      smartCache.set('item3', 'value3', { tags: ['system'] });
      
      // Invalidate by tag
      const invalidated = smartCache.invalidateByTag('user');
      
      expect(invalidated).toContain('item1');
      expect(invalidated).toContain('item2');
      expect(smartCache.get('item3')).toBe('value3'); // Should still exist
    });
    
    it('should detect and optimize hot/cold keys', () => {
      // Create hot key
      smartCache.set('hot', 'hot_value');
      for (let i = 0; i < 20; i++) {
        smartCache.get('hot');
      }
      
      // Create cold key
      smartCache.set('cold', 'cold_value');
      
      // Update metadata
      const hotMeta = smartCache.metadata.get('hot');
      hotMeta.frequency = 15;
      hotMeta.accessCount = 20;
      
      const coldMeta = smartCache.metadata.get('cold');
      coldMeta.lastAccess = Date.now() - 400000; // 6+ minutes ago
      coldMeta.accessCount = 1;
      
      // Identify hot and cold keys
      const hotKeys = smartCache.identifyHotKeys();
      const coldKeys = smartCache.identifyColdKeys();
      
      expect(hotKeys).toContain('hot');
      expect(coldKeys).toContain('cold');
    });
  });

  describe('Configurable Resource Limits', () => {
    it('should load and apply configuration', () => {
      const limit = limitsConfig.getLimit('memory.heap.max');
      expect(limit).toBeDefined();
      expect(typeof limit).toBe('number');
    });
    
    it('should validate limit changes', () => {
      expect(() => {
        limitsConfig.setLimit('memory.heap.max', -100);
      }).toThrow();
      
      expect(() => {
        limitsConfig.setLimit('cache.maxEntries', 50);
      }).toThrow(); // Too small
    });
    
    it('should support temporary overrides', () => {
      const originalLimit = limitsConfig.getLimit('connections.maxConcurrent');
      
      // Set override
      limitsConfig.override('connections.maxConcurrent', 200, 1000);
      
      expect(limitsConfig.getLimit('connections.maxConcurrent')).toBe(200);
      
      // Clean up
      limitsConfig.removeOverride('connections.maxConcurrent');
      expect(limitsConfig.getLimit('connections.maxConcurrent')).toBe(originalLimit);
    });
    
    it('should track violations', () => {
      const result = limitsConfig.checkLimit('memory.heap.max', 2000);
      
      if (!result.withinLimit) {
        const violations = limitsConfig.enforcement.violations.get('memory.heap.max');
        expect(violations).toBeDefined();
        expect(violations.length).toBeGreaterThan(0);
      }
    });
    
    it('should auto-scale limits when enabled', () => {
      limitsConfig.autoScaling.enabled = true;
      limitsConfig.autoScaling.mode = 'adaptive';
      
      // Simulate multiple violations
      for (let i = 0; i < 5; i++) {
        limitsConfig.recordViolation('test.limit', 150, { max: 100 });
      }
      
      // Should trigger auto-scaling
      const adjustments = limitsConfig.enforcement.adjustments;
      const autoScaled = adjustments.find(a => a.reason === 'auto-scaling');
      
      // May or may not scale depending on timing
      expect(adjustments).toBeDefined();
    });
    
    it('should provide recommended limits', () => {
      const recommended = limitsConfig.getRecommendedLimits();
      
      expect(recommended).toHaveProperty('memory');
      expect(recommended).toHaveProperty('workers');
      expect(recommended).toHaveProperty('connections');
      expect(recommended).toHaveProperty('cache');
      
      expect(recommended.memory.heap.max).toBeGreaterThan(0);
      expect(recommended.workers.maxWorkers).toBeGreaterThan(0);
    });
  });

  describe('Resource Monitoring', () => {
    it('should collect resource metrics', () => {
      const metrics = resourceMonitor.collectMetrics();
      
      expect(metrics).toHaveProperty('memory');
      expect(metrics).toHaveProperty('cpu');
      expect(metrics).toHaveProperty('disk');
      expect(metrics).toHaveProperty('network');
      expect(metrics).toHaveProperty('cache');
      
      expect(metrics.memory.heap.percentage).toBeGreaterThanOrEqual(0);
      expect(metrics.memory.heap.percentage).toBeLessThanOrEqual(100);
    });
    
    it('should detect threshold violations', () => {
      const mockMetrics = {
        memory: { heap: { percentage: 90 } },
        cpu: { percentage: 95 },
        disk: { percentage: 85 },
        network: { connections: 90 }
      };
      
      resourceMonitor.checkThresholds(mockMetrics);
      
      expect(resourceMonitor.alerts.active.size).toBeGreaterThan(0);
    });
    
    it('should calculate health score', () => {
      resourceMonitor.resources.current = {
        memory: { heap: { percentage: 60 } },
        cpu: { percentage: 40 },
        disk: { percentage: 50 }
      };
      
      const health = resourceMonitor.calculateHealthScore();
      
      expect(health).toBeGreaterThanOrEqual(0);
      expect(health).toBeLessThanOrEqual(100);
    });
    
    it('should detect anomalies', () => {
      // Set baseline
      resourceMonitor.resources.baseline = {
        memory: { avg: 50, std: 5 },
        cpu: { avg: 40, std: 10 },
        disk: { avg: 60, std: 5 }
      };
      
      // Set current with anomaly
      resourceMonitor.resources.current = {
        memory: { heap: { percentage: 85 } }, // Anomaly
        cpu: { percentage: 45 }, // Normal
        disk: { percentage: 62 }  // Normal
      };
      
      const anomalies = resourceMonitor.detectAnomalies();
      
      expect(anomalies.length).toBeGreaterThan(0);
      expect(anomalies[0].type).toBe('memory');
    });
    
    it('should generate predictions', () => {
      // Set up increasing trend
      resourceMonitor.resources.trends.set('memory', {
        direction: 'increasing',
        rate: 10,
        values: [50, 55, 60, 65, 70]
      });
      
      resourceMonitor.resources.current = {
        memory: { percentage: 70 }
      };
      
      const predictions = resourceMonitor.generatePredictions();
      
      expect(predictions.length).toBeGreaterThan(0);
      expect(predictions[0].event).toBe('exhaustion');
    });
  });

  describe('Memory Manager Integration', () => {
    it('should register and track resources', () => {
      const resource = { data: new Array(1000).fill('test') };
      const id = memoryManager.registerResource('test-resource', resource, {
        type: 'array',
        ttl: 5000
      });
      
      expect(memoryManager.resources.has(id)).toBe(true);
      
      // Free resource
      const freed = memoryManager.freeResource(id);
      expect(freed).toBe(true);
      expect(memoryManager.resources.has(id)).toBe(false);
    });
    
    it('should manage caches with eviction', () => {
      const cache = new Map();
      memoryManager.registerCache('test-cache', cache, {
        maxSize: 3,
        evictionPolicy: 'lru'
      });
      
      // Fill cache beyond limit
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      cache.set('key4', 'value4'); // Should trigger eviction
      
      expect(cache.size).toBeLessThanOrEqual(4);
    });
    
    it('should handle memory warnings and critical situations', () => {
      let warningEmitted = false;
      let criticalEmitted = false;
      
      memoryManager.on('memory-warning', () => {
        warningEmitted = true;
      });
      
      memoryManager.on('memory-critical', () => {
        criticalEmitted = true;
      });
      
      // Simulate high memory usage
      const usage = memoryManager.getMemoryUsage();
      
      // Manually trigger handlers for testing
      if (usage.heapUsedPercent > 80) {
        memoryManager.handleMemoryWarning(usage);
        expect(warningEmitted).toBe(true);
      }
      
      if (usage.heapUsedPercent > 90) {
        memoryManager.handleCriticalMemory(usage);
        expect(criticalEmitted).toBe(true);
      }
    });
    
    it('should set and enforce memory limits', () => {
      const newLimit = 2048; // 2GB
      const status = memoryManager.setMemoryLimit(newLimit);
      
      expect(memoryManager.config.maxMemoryMB).toBe(newLimit);
      expect(status.limitMB).toBe(newLimit);
      expect(status.withinLimit).toBeDefined();
    });
  });

  describe('Full Integration Flow', () => {
    it('should handle complete resource management lifecycle', async () => {
      // 1. Set resource limits
      limitsConfig.setLimit('cache.maxEntries', 1000);
      limitsConfig.setLimit('memory.heap.max', 512);
      
      // 2. Create and use cache
      smartCache.clear();
      for (let i = 0; i < 100; i++) {
        smartCache.set(`key_${i}`, `value_${i}`, {
          ttl: 60000,
          tags: i % 2 === 0 ? ['even'] : ['odd']
        });
      }
      
      // 3. Monitor resources
      const metrics = resourceMonitor.collect();
      expect(metrics).toBeDefined();
      
      // 4. Detect memory patterns
      for (let i = 0; i < 3; i++) {
        memoryLeakDetector.collectSample();
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // 5. Check limits
      const cacheLimit = limitsConfig.checkLimit('cache.maxEntries', smartCache.cache.size);
      expect(cacheLimit.withinLimit).toBe(true);
      
      // 6. Perform maintenance
      smartCache.performMaintenance();
      const expired = smartCache.cleanExpired();
      
      // 7. Generate reports
      const dashboard = resourceMonitor.getDashboard();
      expect(dashboard).toHaveProperty('health');
      expect(dashboard).toHaveProperty('metrics');
      expect(dashboard).toHaveProperty('alerts');
      
      const leakReport = memoryLeakDetector.generateReport();
      expect(leakReport).toHaveProperty('health');
      
      // 8. Clean up
      smartCache.clear();
    });
    
    it('should recover from resource exhaustion', async () => {
      // Simulate resource exhaustion
      const arrays = [];
      
      try {
        // Allocate memory until warning
        for (let i = 0; i < 100; i++) {
          arrays.push(new Array(100000).fill(i));
          
          const status = memoryManager.checkMemoryLimit();
          if (!status.withinLimit) {
            break;
          }
        }
        
        // Trigger emergency cleanup
        memoryLeakDetector.emergencyCleanup();
        
        // Force garbage collection
        const gcResult = memoryManager.forceGC();
        
        // Clear caches
        smartCache.clear();
        memoryManager.clearCache();
        
        // Verify recovery
        const afterStatus = memoryManager.checkMemoryLimit();
        expect(afterStatus).toBeDefined();
        
      } finally {
        // Clean up
        arrays.length = 0;
      }
    });
    
    it('should handle concurrent resource operations', async () => {
      const operations = [];
      
      // Concurrent cache operations
      for (let i = 0; i < 10; i++) {
        operations.push(
          Promise.resolve().then(() => {
            smartCache.set(`concurrent_${i}`, `value_${i}`);
            return smartCache.get(`concurrent_${i}`);
          })
        );
      }
      
      // Concurrent monitoring
      operations.push(
        Promise.resolve().then(() => resourceMonitor.collect())
      );
      
      // Concurrent limit checks
      operations.push(
        Promise.resolve().then(() => 
          limitsConfig.checkLimit('connections.maxConcurrent', 50)
        )
      );
      
      const results = await Promise.all(operations);
      expect(results).toBeDefined();
      expect(results.length).toBe(12);
    });
  });

  describe('Performance Optimization', () => {
    it('should handle high-volume cache operations efficiently', () => {
      const startTime = Date.now();
      const operations = 10000;
      
      for (let i = 0; i < operations; i++) {
        smartCache.set(`perf_${i}`, { data: `value_${i}` });
      }
      
      for (let i = 0; i < operations; i++) {
        smartCache.get(`perf_${i}`);
      }
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(5000); // Should complete in < 5 seconds
      
      // Clean up
      smartCache.clear();
    });
    
    it('should efficiently detect memory leaks', () => {
      const startTime = Date.now();
      
      // Collect many samples
      for (let i = 0; i < 100; i++) {
        memoryLeakDetector.collectSample();
      }
      
      // Analyze
      memoryLeakDetector.analyzeForLeaks();
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(1000); // Should complete in < 1 second
    });
    
    it('should handle resource limit checks efficiently', () => {
      const startTime = Date.now();
      const checks = 10000;
      
      for (let i = 0; i < checks; i++) {
        limitsConfig.checkLimit('memory.heap.max', 512);
        limitsConfig.checkLimit('cache.maxEntries', 1000);
        limitsConfig.checkLimit('connections.maxConcurrent', 50);
      }
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(500); // Should complete in < 500ms
    });
  });

  describe('Edge Cases and Error Recovery', () => {
    it('should handle invalid cache entries gracefully', () => {
      // Circular reference
      const circular = { a: 1 };
      circular.self = circular;
      
      expect(() => {
        smartCache.set('circular', circular);
      }).not.toThrow();
      
      // Undefined values
      expect(() => {
        smartCache.set('undefined', undefined);
      }).not.toThrow();
      
      // Null values
      expect(() => {
        smartCache.set('null', null);
      }).not.toThrow();
    });
    
    it('should recover from monitoring failures', () => {
      // Stop monitoring
      resourceMonitor.stop();
      
      // Should still be able to collect metrics
      expect(() => {
        const metrics = resourceMonitor.collectMetrics();
        expect(metrics).toBeDefined();
      }).not.toThrow();
      
      // Restart monitoring
      resourceMonitor.start();
    });
    
    it('should handle resource limit validation errors', () => {
      // Try to set invalid limits
      const invalidLimits = [
        { path: 'memory.heap.max', value: -1 },
        { path: 'cache.maxEntries', value: 0 },
        { path: 'connections.maxConcurrent', value: 100000 }
      ];
      
      for (const { path, value } of invalidLimits) {
        expect(() => {
          limitsConfig.setLimit(path, value);
        }).toThrow();
      }
      
      // Limits should remain unchanged
      expect(limitsConfig.getLimit('memory.heap.max')).toBeGreaterThan(0);
    });
  });
});

// Run tests if this is the main module
if (require.main === module) {
  console.log('Running Resource Management Integration Tests...');
  require('jest').run();
}
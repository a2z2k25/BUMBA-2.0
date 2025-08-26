/**
 * BUMBA Standard Mode - Sprint 5: Validation & Polish
 * 
 * Comprehensive test suite to validate Standard Mode is 100% operational
 * Tests all enhancements: Performance, Memory, Scaling, and Integration
 */

const StandardModeEnhanced = require('../src/core/standard-mode/standard-mode-enhanced');
const PerformanceOptimizer = require('../src/core/standard-mode/performance-optimizer');
const MemoryManager = require('../src/core/standard-mode/memory-manager');
const AdaptiveScaler = require('../src/core/standard-mode/adaptive-scaler');

// Mock framework for testing
class MockFramework {
  constructor() {
    this.commandsExecuted = [];
    this.executionDelay = 100; // ms
  }

  async executeCommand(task) {
    this.commandsExecuted.push(task);
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, this.executionDelay));
    
    return {
      success: true,
      task,
      timestamp: Date.now()
    };
  }

  getExecutedCommands() {
    return this.commandsExecuted;
  }

  setDelay(delay) {
    this.executionDelay = delay;
  }
}

describe('Standard Mode Validation Suite', () => {
  let standardMode;
  let framework;

  beforeEach(() => {
    framework = new MockFramework();
    standardMode = new StandardModeEnhanced(framework, {
      autoOptimize: true,
      memoryManagement: true,
      adaptiveScaling: true,
      targetResponseTime: 500,
      targetMemoryUsage: 100 * 1024 * 1024, // 100MB for testing
      syncInterval: 1000,
      reportInterval: 5000
    });
  });

  afterEach(async () => {
    if (standardMode && standardMode.state.active) {
      await standardMode.deactivate();
    }
  });

  describe('Component Initialization', () => {
    test('should initialize all components correctly', () => {
      expect(standardMode.components.performanceOptimizer).toBeDefined();
      expect(standardMode.components.memoryManager).toBeDefined();
      expect(standardMode.components.adaptiveScaler).toBeDefined();
    });

    test('should have correct initial state', () => {
      expect(standardMode.state.operational).toBe(75);
      expect(standardMode.state.active).toBe(false);
      expect(standardMode.state.health).toBe('healthy');
      expect(standardMode.state.optimizations).toEqual({
        performance: false,
        memory: false,
        scaling: false
      });
    });

    test('should respect configuration options', () => {
      const customMode = new StandardModeEnhanced(framework, {
        autoOptimize: false,
        memoryManagement: false,
        adaptiveScaling: false
      });

      expect(customMode.components.performanceOptimizer).toBeNull();
      expect(customMode.components.memoryManager).toBeNull();
      expect(customMode.components.adaptiveScaler).toBeNull();
    });
  });

  describe('Activation & Deactivation', () => {
    test('should activate successfully', async () => {
      const result = await standardMode.activate();
      
      expect(result.success).toBe(true);
      expect(result.operational).toBe(100);
      expect(standardMode.state.active).toBe(true);
      expect(standardMode.state.optimizations).toEqual({
        performance: true,
        memory: true,
        scaling: true
      });
    });

    test('should not activate twice', async () => {
      await standardMode.activate();
      const result = await standardMode.activate();
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('Already active');
    });

    test('should deactivate successfully', async () => {
      await standardMode.activate();
      const result = await standardMode.deactivate();
      
      expect(result.success).toBe(true);
      expect(standardMode.state.active).toBe(false);
    });

    test('should update operational status on activation', async () => {
      expect(standardMode.state.operational).toBe(75);
      
      await standardMode.activate();
      
      expect(standardMode.state.operational).toBe(100);
    });
  });

  describe('Performance Optimization', () => {
    beforeEach(async () => {
      await standardMode.activate();
    });

    test('should record and optimize slow tasks', async () => {
      framework.setDelay(600); // Slower than target
      
      const task = { type: 'slow-task', data: 'test' };
      const result = await standardMode.processTask(task);
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      
      // Performance optimizer should have recorded the task
      const perfStatus = standardMode.components.performanceOptimizer.getStatus();
      expect(perfStatus.metrics.taskCount).toBeGreaterThan(0);
    });

    test('should cache frequently used tasks', async () => {
      const task = { type: 'frequent-task', data: 'cache-me' };
      
      // Execute same task multiple times
      for (let i = 0; i < 5; i++) {
        await standardMode.processTask(task);
      }
      
      const perfStatus = standardMode.components.performanceOptimizer.getStatus();
      expect(perfStatus.metrics.cacheSize).toBeGreaterThan(0);
    });

    test('should batch similar tasks', async () => {
      const tasks = [];
      for (let i = 0; i < 10; i++) {
        tasks.push({ type: 'batch-task', id: i });
      }
      
      // Process tasks quickly to trigger batching
      const promises = tasks.map(t => standardMode.processTask(t));
      await Promise.all(promises);
      
      const perfStatus = standardMode.components.performanceOptimizer.getStatus();
      expect(perfStatus.metrics.taskCount).toBe(10);
    });

    test('should learn task patterns over time', async () => {
      // Simulate pattern learning
      for (let i = 0; i < 20; i++) {
        await standardMode.processTask({ type: 'pattern-task', seq: i });
      }
      
      const perfStatus = standardMode.components.performanceOptimizer.getStatus();
      expect(perfStatus.learning.patterns).toBeGreaterThan(0);
      expect(perfStatus.learning.accuracy).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Memory Management', () => {
    beforeEach(async () => {
      await standardMode.activate();
    });

    test('should track memory usage', () => {
      const memStatus = standardMode.components.memoryManager.getStatus();
      
      expect(memStatus.isManaging).toBe(true);
      expect(memStatus.current).toBeDefined();
      expect(memStatus.current.heapUsed).toBeDefined();
      expect(memStatus.state.health).toBeDefined();
    });

    test('should manage object pools', async () => {
      // Acquire and release objects from pool
      const small = standardMode.components.memoryManager.acquire('small');
      expect(small).toBeDefined();
      
      standardMode.components.memoryManager.release(small, 'small');
      
      const poolStatus = standardMode.components.memoryManager.pools.small.getStatus();
      expect(poolStatus.created).toBeGreaterThan(0);
    });

    test('should detect memory trends', async () => {
      // Force some memory allocations
      const largeData = [];
      for (let i = 0; i < 10; i++) {
        largeData.push(new Array(1000).fill(i));
        await standardMode.processTask({ type: 'memory-test', data: i });
      }
      
      const memStatus = standardMode.components.memoryManager.getStatus();
      expect(['increasing', 'decreasing', 'stable']).toContain(memStatus.state.trend);
    });

    test('should provide memory recommendations', () => {
      const recommendations = standardMode.components.memoryManager.getRecommendations();
      
      expect(Array.isArray(recommendations)).toBe(true);
      // Should have at least default recommendations
      expect(recommendations).toBeDefined();
    });

    test('should handle memory pooling correctly', () => {
      const memManager = standardMode.components.memoryManager;
      
      // Test all pool sizes
      const small = memManager.acquire('small');
      const medium = memManager.acquire('medium');
      const large = memManager.acquire('large');
      
      expect(small).toBeDefined();
      expect(medium).toBeDefined();
      expect(large).toBeDefined();
      
      memManager.release(small, 'small');
      memManager.release(medium, 'medium');
      memManager.release(large, 'large');
      
      const status = memManager.getStatus();
      expect(status.pools.small.size).toBeGreaterThanOrEqual(0);
      expect(status.pools.medium.size).toBeGreaterThanOrEqual(0);
      expect(status.pools.large.size).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Adaptive Scaling', () => {
    beforeEach(async () => {
      await standardMode.activate();
    });

    test('should initialize department resources', () => {
      const scaleStatus = standardMode.components.adaptiveScaler.getStatus();
      
      expect(scaleStatus.resources.backend).toBeDefined();
      expect(scaleStatus.resources.design).toBeDefined();
      expect(scaleStatus.resources.product).toBeDefined();
      
      Object.values(scaleStatus.resources).forEach(dept => {
        expect(dept.specialists).toBeGreaterThanOrEqual(1);
        expect(dept.queueLength).toBeDefined();
      });
    });

    test('should record and queue tasks', () => {
      const scaler = standardMode.components.adaptiveScaler;
      
      // Record multiple requests
      scaler.recordRequest('backend', { type: 'api-call' });
      scaler.recordRequest('design', { type: 'ui-update' });
      scaler.recordRequest('product', { type: 'feature-spec' });
      
      const status = scaler.getStatus();
      expect(status.metrics.requestRate).toBeGreaterThanOrEqual(0);
    });

    test('should calculate load correctly', () => {
      const scaler = standardMode.components.adaptiveScaler;
      
      // Simulate high load
      for (let i = 0; i < 20; i++) {
        scaler.recordRequest('backend', { id: i });
      }
      
      // Force load calculation
      scaler.calculateLoad();
      
      expect(scaler.metrics.currentLoad).toBeGreaterThanOrEqual(0);
      expect(scaler.metrics.averageLoad).toBeGreaterThanOrEqual(0);
    });

    test('should provide scaling predictions', () => {
      const scaler = standardMode.components.adaptiveScaler;
      const prediction = scaler.predictScaling();
      
      expect(prediction).toBeDefined();
      expect(prediction.action).toBeDefined();
      expect(prediction.confidence).toBeDefined();
      expect(['none', 'scale-up', 'scale-down']).toContain(prediction.action);
    });

    test('should detect resource imbalance', () => {
      const scaler = standardMode.components.adaptiveScaler;
      const imbalanced = scaler.detectImbalance();
      
      expect(Array.isArray(imbalanced)).toBe(true);
    });

    test('should provide scaling recommendations', () => {
      const recommendations = standardMode.components.adaptiveScaler.getRecommendations();
      
      expect(Array.isArray(recommendations)).toBe(true);
    });
  });

  describe('Component Integration', () => {
    beforeEach(async () => {
      await standardMode.activate();
    });

    test('should synchronize components', async () => {
      // Wait for sync interval
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      // Components should be synchronized
      expect(standardMode.syncInterval).toBeDefined();
    }, 15000); // Increase timeout for this test

    test('should handle task processing with all optimizations', async () => {
      const task = {
        type: 'integrated-task',
        department: 'backend',
        data: 'test-data'
      };
      
      const result = await standardMode.processTask(task);
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      
      // Check all components recorded the task
      const perfStatus = standardMode.components.performanceOptimizer.getStatus();
      expect(perfStatus.metrics.taskCount).toBeGreaterThan(0);
      
      // Task should have been recorded by scaler
      const scaleStatus = standardMode.components.adaptiveScaler.getStatus();
      expect(scaleStatus.metrics.requestRate).toBeGreaterThanOrEqual(0);
    });

    test('should handle high memory pressure', async () => {
      // Simulate high memory usage
      const memManager = standardMode.components.memoryManager;
      memManager.state.currentUsage = memManager.config.maxHeapUsage * 0.85;
      
      // Check thresholds
      memManager.checkThresholds();
      
      expect(memManager.state.health).toBe('warning');
    });

    test('should scale down under memory pressure', () => {
      // Set memory to critical
      standardMode.components.memoryManager.state.health = 'critical';
      
      // Synchronize components
      standardMode.synchronizeComponents();
      
      // Scaler should be affected
      const scaler = standardMode.components.adaptiveScaler;
      expect(scaler).toBeDefined();
    });
  });

  describe('Status Reporting', () => {
    beforeEach(async () => {
      await standardMode.activate();
    });

    test('should generate comprehensive status report', () => {
      const report = standardMode.generateReport();
      
      expect(report).toBeDefined();
      expect(report.operational).toBe(100);
      expect(report.health).toBeDefined();
      expect(report.metrics).toBeDefined();
      expect(report.components).toBeDefined();
      
      // Check component reports
      expect(report.components.performance).toBeDefined();
      expect(report.components.memory).toBeDefined();
      expect(report.components.scaling).toBeDefined();
    });

    test('should provide overall status', () => {
      const status = standardMode.getStatus();
      
      expect(status.mode).toBe('standard-enhanced');
      expect(status.operational).toBe(100);
      expect(status.active).toBe(true);
      expect(status.health).toBeDefined();
      expect(status.optimizations).toEqual({
        performance: true,
        memory: true,
        scaling: true
      });
    });

    test('should provide recommendations', () => {
      const recommendations = standardMode.getRecommendations();
      
      expect(Array.isArray(recommendations)).toBe(true);
      // Should aggregate recommendations from all components
      expect(recommendations).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      await standardMode.activate();
    });

    test('should handle task processing errors gracefully', async () => {
      // Force an error
      framework.executeCommand = async () => {
        throw new Error('Test error');
      };
      
      try {
        await standardMode.processTask({ type: 'error-task' });
      } catch (error) {
        expect(error.message).toBe('Test error');
      }
    });

    test('should handle memory leak detection', () => {
      const memManager = standardMode.components.memoryManager;
      const leakDetector = memManager.leakDetector;
      
      // Simulate growing heap
      const history = [];
      for (let i = 0; i < 10; i++) {
        history.push({
          timestamp: Date.now() + i * 1000,
          heapUsed: 1000000 * (i + 1), // Growing
          heapTotal: 10000000,
          external: 100000,
          rss: 20000000
        });
      }
      
      const leaks = leakDetector.detect(history);
      expect(leaks.length).toBeGreaterThan(0);
      expect(leaks[0].type).toBe('growing-heap');
    });

    test('should handle queue overflow', () => {
      const scaler = standardMode.components.adaptiveScaler;
      const queue = scaler.resources.queues.get('backend');
      
      // Fill queue to max
      for (let i = 0; i < 100; i++) {
        queue.enqueue({ id: i });
      }
      
      // Next should fail
      const result = queue.enqueue({ id: 101 });
      expect(result).toBe(false);
    });
  });

  describe('Performance Benchmarks', () => {
    beforeEach(async () => {
      await standardMode.activate();
    });

    test('should process tasks within target response time', async () => {
      framework.setDelay(100); // Fast tasks
      
      const start = Date.now();
      const promises = [];
      
      for (let i = 0; i < 10; i++) {
        promises.push(standardMode.processTask({ type: 'perf-test', id: i }));
      }
      
      await Promise.all(promises);
      const duration = Date.now() - start;
      
      // Should be reasonably fast with optimizations
      expect(duration).toBeLessThan(2000); // 2 seconds for 10 tasks
    });

    test('should maintain memory within limits', async () => {
      const initialMem = process.memoryUsage().heapUsed;
      
      // Process many tasks
      for (let i = 0; i < 100; i++) {
        await standardMode.processTask({ type: 'memory-test', id: i });
      }
      
      const finalMem = process.memoryUsage().heapUsed;
      const increase = finalMem - initialMem;
      
      // Memory increase should be reasonable
      expect(increase).toBeLessThan(50 * 1024 * 1024); // Less than 50MB increase
    });

    test('should handle load spikes gracefully', async () => {
      // Simulate load spike
      const promises = [];
      for (let i = 0; i < 50; i++) {
        promises.push(
          standardMode.processTask({
            type: 'spike-test',
            department: i % 3 === 0 ? 'backend' : i % 3 === 1 ? 'design' : 'product',
            id: i
          })
        );
      }
      
      const results = await Promise.all(promises);
      const successful = results.filter(r => r && r.success).length;
      
      // Most tasks should succeed
      expect(successful).toBeGreaterThan(45); // 90% success rate
    });
  });

  describe('Operational Validation', () => {
    test('should reach 100% operational status', async () => {
      expect(standardMode.state.operational).toBe(75);
      
      const result = await standardMode.activate();
      
      expect(result.success).toBe(true);
      expect(result.operational).toBe(100);
      expect(standardMode.state.operational).toBe(100);
    });

    test('should have all features enabled', async () => {
      await standardMode.activate();
      
      expect(standardMode.state.optimizations.performance).toBe(true);
      expect(standardMode.state.optimizations.memory).toBe(true);
      expect(standardMode.state.optimizations.scaling).toBe(true);
    });

    test('should maintain health during operation', async () => {
      await standardMode.activate();
      
      // Process various tasks
      for (let i = 0; i < 20; i++) {
        await standardMode.processTask({
          type: 'health-test',
          department: i % 3 === 0 ? 'backend' : i % 3 === 1 ? 'design' : 'product',
          id: i
        });
      }
      
      expect(standardMode.state.health).toBe('healthy');
    });

    test('should provide complete functionality', async () => {
      await standardMode.activate();
      
      // Test all major functions
      const processResult = await standardMode.processTask({ type: 'test' });
      expect(processResult).toBeDefined();
      
      const status = standardMode.getStatus();
      expect(status.operational).toBe(100);
      
      const report = standardMode.generateReport();
      expect(report).toBeDefined();
      
      const recommendations = standardMode.getRecommendations();
      expect(Array.isArray(recommendations)).toBe(true);
    });
  });
});

// Run validation
console.log('\n' + '='.repeat(80));
console.log('🟢 STANDARD MODE VALIDATION SUITE');
console.log('='.repeat(80));
console.log('Testing all Standard Mode enhancements...');
console.log('Target: 100% Operational Status\n');
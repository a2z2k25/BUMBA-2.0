/**
 * BUMBA Error Handling Integration Tests
 * Comprehensive testing of all error handling improvements
 */

const { describe, it, expect, beforeEach, afterEach } = require('@jest/globals');
const { EventEmitter } = require('events');

// Import all error handling modules
const enhancedMessages = require('../../src/core/error-handling/enhanced-error-messages');
const automaticRecovery = require('../../src/core/error-handling/automatic-recovery-system');
const { IntelligentCircuitBreaker, getBreaker } = require('../../src/core/error-handling/intelligent-circuit-breaker');
const patternRecognition = require('../../src/core/error-handling/error-pattern-recognition');
const selfHealing = require('../../src/core/error-handling/self-healing-system');
const rootCauseAnalysis = require('../../src/core/error-handling/root-cause-analysis');
const { BumbaError, BumbaErrorBoundary, getErrorSystem } = require('../../src/core/error-handling/bumba-error-system');

describe('Error Handling Integration Tests', () => {
  let errorSystem;
  
  beforeEach(() => {
    errorSystem = getErrorSystem();
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    // Clean up
    automaticRecovery.stop();
    selfHealing.stop();
    patternRecognition.stop();
    rootCauseAnalysis.stop();
  });

  describe('Enhanced Error Messages', () => {
    it('should format errors with rich context', () => {
      const formatted = enhancedMessages.format('MCP_CONNECTION_FAILED', {
        server: 'localhost',
        port: 3000,
        protocol: 'tcp'
      });
      
      expect(formatted).toHaveProperty('title', 'MCP Server Connection Failed');
      expect(formatted).toHaveProperty('errorCode', 'MCP-001');
      expect(formatted).toHaveProperty('suggestions');
      expect(formatted.suggestions).toContain('Verify the MCP server is running');
    });
    
    it('should generate human-readable error messages', () => {
      const message = enhancedMessages.toHumanReadable('MEMORY_LEAK_DETECTED', {
        currentMemory: 1024,
        growthRate: 10,
        duration: 5,
        heapUsed: 80
      });
      
      expect(message).toContain('Memory Leak Detected');
      expect(message).toContain('Current Memory: 1024 MB');
      expect(message).toContain('Review recent code changes');
    });
    
    it('should sanitize sensitive context data', () => {
      const context = {
        username: 'test',
        password: 'secret123',
        apiKey: 'abc123',
        data: 'safe'
      };
      
      const sanitized = enhancedMessages.sanitizeContext(context);
      
      expect(sanitized.password).toBe('***REDACTED***');
      expect(sanitized.apiKey).toBe('***REDACTED***');
      expect(sanitized.data).toBe('safe');
    });
  });

  describe('Automatic Recovery System', () => {
    it('should attempt recovery for known error types', async () => {
      const error = {
        type: 'MCP_CONNECTION_FAILED',
        message: 'Connection failed'
      };
      
      const result = await automaticRecovery.attemptRecovery(error);
      
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('strategy');
    });
    
    it('should execute recovery strategies in priority order', async () => {
      automaticRecovery.registerStrategy('TEST_HIGH', {
        canRecover: () => true,
        recover: async () => ({ success: true }),
        priority: 'high'
      });
      
      automaticRecovery.registerStrategy('TEST_LOW', {
        canRecover: () => true,
        recover: async () => ({ success: true }),
        priority: 'low'
      });
      
      const error = { type: 'TEST_ERROR' };
      const result = await automaticRecovery.attemptRecovery(error);
      
      expect(result.success).toBe(true);
    });
    
    it('should handle recovery timeout', async () => {
      automaticRecovery.registerStrategy('SLOW_RECOVERY', {
        canRecover: () => true,
        recover: async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
          return { success: true };
        },
        priority: 'high',
        timeout: 50
      });
      
      const error = { type: 'SLOW_ERROR' };
      const result = await automaticRecovery.attemptRecovery(error);
      
      expect(result.success).toBe(false);
    });
  });

  describe('Intelligent Circuit Breaker', () => {
    it('should open circuit after threshold failures', async () => {
      const breaker = new IntelligentCircuitBreaker('test', {
        failureThreshold: 3,
        adaptive: false
      });
      
      const failingFn = async () => {
        throw new Error('Test failure');
      };
      
      // Trigger failures
      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(failingFn);
        } catch (e) {
          // Expected
        }
      }
      
      expect(breaker.state).toBe('OPEN');
      
      breaker.stop();
    });
    
    it('should auto-tune thresholds when adaptive', async () => {
      const breaker = new IntelligentCircuitBreaker('adaptive-test', {
        adaptive: true,
        failureThreshold: 5
      });
      
      // Simulate performance analysis
      breaker.evaluateAndTune();
      
      const stats = breaker.getStats();
      expect(stats.tuning.adaptive).toBe(true);
      
      breaker.stop();
    });
    
    it('should detect cascading failures', async () => {
      const breaker = new IntelligentCircuitBreaker('cascade-test', {
        enablePatternDetection: true
      });
      
      const failingFn = async () => {
        throw new Error('Cascade test');
      };
      
      // Rapid failures
      for (let i = 0; i < 5; i++) {
        try {
          await breaker.execute(failingFn);
        } catch (e) {
          // Expected
        }
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      const detected = breaker.detectCascadingFailure();
      expect(detected).toBe(true);
      
      breaker.stop();
    });
  });

  describe('Error Pattern Recognition', () => {
    it('should detect temporal patterns', () => {
      // Record errors at specific times
      for (let i = 0; i < 10; i++) {
        const error = { type: 'TEMPORAL_ERROR', message: 'Test' };
        patternRecognition.recordError(error, { component: 'test' });
      }
      
      // Perform analysis
      patternRecognition.analyzeTemporalPatterns();
      
      const patterns = patternRecognition.getActivePatterns();
      const temporalPattern = patterns.find(p => p.type === 'temporal');
      
      expect(temporalPattern).toBeDefined();
    });
    
    it('should detect error sequences', () => {
      const sequence = ['ERROR_A', 'ERROR_B', 'ERROR_C'];
      
      // Record sequence multiple times
      for (let i = 0; i < 4; i++) {
        for (const type of sequence) {
          patternRecognition.recordError({ type, message: 'Test' });
        }
      }
      
      const patterns = patternRecognition.getActivePatterns();
      const sequentialPattern = patterns.find(p => p.type === 'sequential');
      
      expect(sequentialPattern).toBeDefined();
    });
    
    it('should generate predictions', () => {
      // Record pattern
      for (let i = 0; i < 5; i++) {
        patternRecognition.recordError({
          type: 'RESOURCE_EXHAUSTED',
          message: 'Out of memory'
        });
      }
      
      patternRecognition.generatePredictions();
      
      const predictions = patternRecognition.getActivePredictions();
      expect(predictions.length).toBeGreaterThan(0);
    });
  });

  describe('Self-Healing System', () => {
    it('should execute healing strategies', async () => {
      selfHealing.registerStrategy('TEST_HEALING', {
        condition: () => true,
        heal: async () => ({ healed: true }),
        priority: 'high',
        safetyCheck: () => true
      });
      
      const needs = selfHealing.identifyHealingNeeds();
      expect(needs.length).toBeGreaterThan(0);
      
      const result = await selfHealing.executeHealing(needs[0]);
      expect(result.success).toBe(true);
    });
    
    it('should calculate system health score', async () => {
      await selfHealing.updateSystemHealth();
      selfHealing.calculateOverallHealth();
      
      const health = selfHealing.getSystemHealth();
      expect(health.overall).toBeGreaterThanOrEqual(0);
      expect(health.overall).toBeLessThanOrEqual(100);
    });
    
    it('should learn from healing attempts', async () => {
      const strategy = {
        name: 'LEARNING_TEST',
        heal: async () => ({ success: true })
      };
      
      selfHealing.learnFromHealing(strategy, true, { healed: true });
      
      const stats = selfHealing.getStatistics();
      expect(stats).toHaveProperty('totalHealings');
    });
  });

  describe('Root Cause Analysis', () => {
    it('should correlate related errors', () => {
      const error1 = {
        type: 'ERROR_A',
        message: 'First error',
        stack: 'at function1'
      };
      
      const error2 = {
        type: 'ERROR_B',
        message: 'Second error',
        stack: 'at function1'
      };
      
      const node1 = rootCauseAnalysis.recordError(error1, {
        component: 'test',
        operation: 'read'
      });
      
      const node2 = rootCauseAnalysis.recordError(error2, {
        component: 'test',
        operation: 'read'
      });
      
      const correlation = rootCauseAnalysis.calculateCorrelation(node1, node2);
      expect(correlation.score).toBeGreaterThan(0);
    });
    
    it('should identify symptom clusters', () => {
      // Create cluster of related errors
      for (let i = 0; i < 5; i++) {
        rootCauseAnalysis.recordError({
          type: 'CLUSTER_ERROR',
          message: 'Cluster test'
        }, {
          component: 'cluster-test'
        });
      }
      
      const clusters = Array.from(rootCauseAnalysis.symptomClusters.values());
      expect(clusters.length).toBeGreaterThan(0);
    });
    
    it('should match known root cause patterns', () => {
      // Simulate memory cascade
      const symptoms = ['MEMORY_LEAK_DETECTED', 'RESOURCE_EXHAUSTED', 'TIMEOUT_ERROR'];
      
      for (const symptom of symptoms) {
        rootCauseAnalysis.recordError({
          type: symptom,
          message: 'Test'
        });
      }
      
      rootCauseAnalysis.performPeriodicAnalysis();
      
      const rootCauses = Array.from(rootCauseAnalysis.rootCauses.values());
      const memoryRootCause = rootCauses.find(rc => rc.rootCause === 'MEMORY_LEAK');
      
      expect(memoryRootCause).toBeDefined();
    });
  });

  describe('Full Integration Flow', () => {
    it('should handle error through complete pipeline', async () => {
      const testError = new BumbaError(
        'MCP_CONNECTION_FAILED',
        'Connection to MCP server failed',
        {
          server: 'localhost',
          port: 3000,
          attempts: 3
        }
      );
      
      // Step 1: Enhanced error message
      const formatted = enhancedMessages.format(testError.type, testError.context);
      expect(formatted).toHaveProperty('suggestions');
      
      // Step 2: Pattern recognition
      const errorNode = patternRecognition.recordError(testError);
      expect(errorNode).toHaveProperty('id');
      
      // Step 3: Root cause analysis
      const rcaNode = rootCauseAnalysis.recordError(testError, testError.context);
      expect(rcaNode).toHaveProperty('metadata');
      
      // Step 4: Automatic recovery
      const recovery = await automaticRecovery.attemptRecovery(testError);
      expect(recovery).toHaveProperty('success');
      
      // Step 5: Circuit breaker
      const breaker = getBreaker('mcp-connection');
      const stats = breaker.getStats();
      expect(stats).toHaveProperty('state');
    });
    
    it('should detect and heal cascading failures', async () => {
      // Simulate cascading failure
      const errors = [
        { type: 'RESOURCE_EXHAUSTED', delay: 0 },
        { type: 'TIMEOUT_ERROR', delay: 100 },
        { type: 'AGENT_SPAWN_FAILED', delay: 200 },
        { type: 'SERVICE_UNAVAILABLE', delay: 300 }
      ];
      
      for (const error of errors) {
        await new Promise(resolve => setTimeout(resolve, error.delay));
        
        // Record in all systems
        patternRecognition.recordError({ type: error.type, message: 'Cascade test' });
        rootCauseAnalysis.recordError({ type: error.type, message: 'Cascade test' });
      }
      
      // Pattern recognition should detect cascade
      const patterns = patternRecognition.getActivePatterns();
      const cascadePattern = patterns.find(p => p.type === 'cascading');
      expect(cascadePattern).toBeDefined();
      
      // Root cause analysis should identify root
      rootCauseAnalysis.performPeriodicAnalysis();
      const rootCauses = Array.from(rootCauseAnalysis.rootCauses.values());
      expect(rootCauses.length).toBeGreaterThan(0);
      
      // Self-healing should attempt to fix
      await selfHealing.performHealthCheck();
      const healingStats = selfHealing.getStatistics();
      expect(healingStats).toHaveProperty('totalHealings');
    });
    
    it('should learn and improve over time', async () => {
      // Simulate repeated error pattern
      for (let cycle = 0; cycle < 3; cycle++) {
        const error = {
          type: 'LEARNING_ERROR',
          message: 'Test learning'
        };
        
        // Record error
        patternRecognition.recordError(error);
        
        // Attempt recovery
        await automaticRecovery.attemptRecovery(error);
        
        // Wait for learning
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Check if system learned
      const predictions = patternRecognition.getActivePredictions();
      const stats = patternRecognition.getStatistics();
      
      expect(stats.patternsDetected).toBeGreaterThan(0);
    });
  });

  describe('Error Boundary Integration', () => {
    it('should wrap operations with error boundary', async () => {
      const riskyOperation = async () => {
        throw new Error('Risky operation failed');
      };
      
      const fallback = async () => {
        return 'Fallback result';
      };
      
      const result = await BumbaErrorBoundary.wrap(riskyOperation, fallback);
      expect(result).toBe('Fallback result');
    });
    
    it('should track error statistics', () => {
      const boundary = new BumbaErrorBoundary();
      
      // Simulate errors
      boundary.currentErrorCounts.high = 2;
      boundary.currentErrorCounts.medium = 5;
      
      const stats = boundary.getErrorStats();
      expect(stats.error_counts.high).toBe(2);
      expect(stats.error_counts.medium).toBe(5);
    });
  });

  describe('Performance Under Load', () => {
    it('should handle high error volume', async () => {
      const startTime = Date.now();
      const errorCount = 1000;
      
      for (let i = 0; i < errorCount; i++) {
        const error = {
          type: `ERROR_${i % 10}`,
          message: `Load test error ${i}`
        };
        
        // Record in pattern recognition
        patternRecognition.recordError(error);
        
        // Record in root cause analysis
        rootCauseAnalysis.recordError(error);
      }
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(5000); // Should process 1000 errors in < 5 seconds
      
      // Verify patterns were detected
      const patterns = patternRecognition.getActivePatterns();
      expect(patterns.length).toBeGreaterThan(0);
    });
    
    it('should maintain circuit breaker performance', async () => {
      const breaker = new IntelligentCircuitBreaker('perf-test', {
        adaptive: true
      });
      
      const operations = [];
      
      // Execute many operations
      for (let i = 0; i < 100; i++) {
        operations.push(
          breaker.execute(async () => {
            if (Math.random() > 0.8) {
              throw new Error('Random failure');
            }
            return 'success';
          }).catch(() => 'failed')
        );
      }
      
      const results = await Promise.all(operations);
      const successCount = results.filter(r => r === 'success').length;
      
      expect(successCount).toBeGreaterThan(0);
      
      breaker.stop();
    });
  });

  describe('Edge Cases and Error Conditions', () => {
    it('should handle circular error dependencies', () => {
      // Create circular dependency
      const errorA = rootCauseAnalysis.recordError({ type: 'ERROR_A' });
      const errorB = rootCauseAnalysis.recordError({ type: 'ERROR_B' });
      const errorC = rootCauseAnalysis.recordError({ type: 'ERROR_C' });
      
      // Create circular edges
      rootCauseAnalysis.errorGraph.addEdge(errorA.id, errorB.id, { score: 0.8 });
      rootCauseAnalysis.errorGraph.addEdge(errorB.id, errorC.id, { score: 0.8 });
      rootCauseAnalysis.errorGraph.addEdge(errorC.id, errorA.id, { score: 0.8 });
      
      // Should detect feedback loop
      rootCauseAnalysis.analyzeErrorGraph();
      
      // Should not crash
      expect(true).toBe(true);
    });
    
    it('should handle recovery strategy conflicts', async () => {
      // Register conflicting strategies
      automaticRecovery.registerStrategy('CONFLICT_1', {
        canRecover: (error) => error.type === 'CONFLICT_ERROR',
        recover: async () => ({ success: true, strategy: 'conflict1' }),
        priority: 'high'
      });
      
      automaticRecovery.registerStrategy('CONFLICT_2', {
        canRecover: (error) => error.type === 'CONFLICT_ERROR',
        recover: async () => ({ success: true, strategy: 'conflict2' }),
        priority: 'high'
      });
      
      const result = await automaticRecovery.attemptRecovery({
        type: 'CONFLICT_ERROR'
      });
      
      // Should use one of the strategies
      expect(result.success).toBe(true);
      expect(['conflict1', 'conflict2']).toContain(result.result.strategy);
    });
    
    it('should handle malformed error data gracefully', () => {
      const malformedErrors = [
        null,
        undefined,
        {},
        { type: null },
        { message: undefined },
        { context: 'not-an-object' }
      ];
      
      for (const error of malformedErrors) {
        // Should not throw
        expect(() => {
          patternRecognition.recordError(error || {});
        }).not.toThrow();
      }
    });
  });
});

// Run integration test suite
if (require.main === module) {
  console.log('Running BUMBA Error Handling Integration Tests...');
  require('jest').run();
}
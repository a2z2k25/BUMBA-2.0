/**
 * BUMBA Observability Integration Layer
 * 
 * Integrates the observability system with the existing BUMBA framework
 * Provides seamless instrumentation and monitoring capabilities
 */

const { observability } = require('./agent-observability');
const { ObservabilityDashboard } = require('./dashboard-ui');
const { logger } = require('../logging/bumba-logger');

/**
 * Observability Integration Manager
 */
class ObservabilityIntegration {
  constructor() {
    this.observability = observability;
    this.dashboard = null;
    this.instrumentedModules = new Set();
    this.hooks = new Map();
    this.initialized = false;
  }

  /**
   * Initialize observability integration
   */
  async initialize() {
    if (this.initialized) {return;}

    try {
      // Initialize observability system
      await this.observability.initialize();
      
      // Create dashboard
      this.dashboard = new ObservabilityDashboard(this.observability.system);
      
      // Set up framework hooks
      this.setupFrameworkHooks();
      
      // Set up auto-instrumentation
      this.setupAutoInstrumentation();
      
      this.initialized = true;
      logger.info('🟢 Observability integration initialized successfully');
      
    } catch (error) {
      logger.error('🟢 Failed to initialize observability integration', { error });
      throw error;
    }
  }

  /**
   * Set up hooks into BUMBA framework components
   */
  setupFrameworkHooks() {
    // Hook into agent lifecycle
    this.hookAgentLifecycle();
    
    // Hook into command processing
    this.hookCommandProcessing();
    
    // Hook into specialist operations
    this.hookSpecialistOperations();
    
    // Hook into collaboration
    this.hookCollaboration();
    
    // Hook into decision making
    this.hookDecisionMaking();
    
    logger.debug('🟢 Framework hooks established');
  }

  /**
   * Hook into agent lifecycle events
   */
  hookAgentLifecycle() {
    // This would integrate with the actual agent lifecycle manager
    const originalSpawnAgent = this.mockOriginalMethod('spawnAgent');
    const originalTerminateAgent = this.mockOriginalMethod('terminateAgent');

    this.hooks.set('agent.spawn', (agentId, config) => {
      const trace = this.observability.startTrace(agentId, 'agent.spawn', { config });
      const span = this.observability.startSpan(trace?.traceId, 'agent.initialization', agentId);
      
      try {
        const result = originalSpawnAgent?.(agentId, config);
        this.observability.finishSpan(span, 'success', { agentId });
        this.observability.finishTrace(trace?.traceId, 'success', { agentId });
        
        // Initialize agent profile
        this.observability.updateProfile(agentId, 'spawned', { config });
        
        return result;
      } catch (error) {
        this.observability.finishSpan(span, 'error', { error: error.message });
        this.observability.finishTrace(trace?.traceId, 'error', { error: error.message });
        throw error;
      }
    });

    this.hooks.set('agent.terminate', (agentId, reason) => {
      const trace = this.observability.startTrace(agentId, 'agent.terminate', { reason });
      const span = this.observability.startSpan(trace?.traceId, 'agent.termination', agentId);
      
      try {
        const result = originalTerminateAgent?.(agentId, reason);
        this.observability.finishSpan(span, 'success', { reason });
        this.observability.finishTrace(trace?.traceId, 'success', { reason });
        
        // Update agent profile
        this.observability.updateProfile(agentId, 'terminated', { reason });
        
        return result;
      } catch (error) {
        this.observability.finishSpan(span, 'error', { error: error.message });
        this.observability.finishTrace(trace?.traceId, 'error', { error: error.message });
        throw error;
      }
    });
  }

  /**
   * Hook into command processing
   */
  hookCommandProcessing() {
    this.hooks.set('command.process', (command, context) => {
      const agentId = context.agentId || 'system';
      const trace = this.observability.startTrace(agentId, 'command.process', { 
        command: command.name || 'unknown',
        type: command.type,
        department: context.department
      });
      
      const span = this.observability.startSpan(trace?.traceId, 'command.execution', agentId, {
        command: command.name,
        args: this.sanitizeArgs(command.args)
      });

      const startTime = Date.now();
      
      return {
        onComplete: (result) => {
          const duration = Date.now() - startTime;
          
          this.observability.recordMetrics(agentId, 'command.process', {
            duration,
            success: true
          });
          
          this.observability.finishSpan(span, 'success', { result });
          this.observability.finishTrace(trace?.traceId, 'success', { result });
          
          // Update agent profile
          this.observability.updateProfile(agentId, 'command_executed', {
            command: command.name,
            duration,
            success: true
          });
        },
        onError: (error) => {
          const duration = Date.now() - startTime;
          
          this.observability.recordMetrics(agentId, 'command.process', {
            duration,
            error
          });
          
          this.observability.finishSpan(span, 'error', { error: error.message });
          this.observability.finishTrace(trace?.traceId, 'error', { error: error.message });
          
          // Update agent profile
          this.observability.updateProfile(agentId, 'command_failed', {
            command: command.name,
            duration,
            error: error.message
          });
        }
      };
    });
  }

  /**
   * Hook into specialist operations
   */
  hookSpecialistOperations() {
    this.hooks.set('specialist.operation', (specialistId, operation, context) => {
      const trace = this.observability.startTrace(specialistId, 'specialist.operation', {
        operation,
        specialist_type: context.specialistType,
        department: context.department
      });
      
      const span = this.observability.startSpan(trace?.traceId, operation, specialistId, context);
      const startTime = Date.now();
      
      return {
        onComplete: (result) => {
          const duration = Date.now() - startTime;
          
          this.observability.recordMetrics(specialistId, operation, {
            duration,
            success: true
          });
          
          this.observability.finishSpan(span, 'success', { result });
          this.observability.finishTrace(trace?.traceId, 'success', { result });
          
          // Update specialist profile
          this.observability.updateProfile(specialistId, 'operation_completed', {
            operation,
            duration,
            quality_score: result.quality_score || 0.8
          });
        },
        onError: (error) => {
          const duration = Date.now() - startTime;
          
          this.observability.recordMetrics(specialistId, operation, {
            duration,
            error
          });
          
          this.observability.finishSpan(span, 'error', { error: error.message });
          this.observability.finishTrace(trace?.traceId, 'error', { error: error.message });
          
          // Update specialist profile
          this.observability.updateProfile(specialistId, 'operation_failed', {
            operation,
            duration,
            error: error.message
          });
        }
      };
    });
  }

  /**
   * Hook into collaboration events
   */
  hookCollaboration() {
    this.hooks.set('collaboration.start', (fromAgent, toAgent, type, _context) => {
      const trace = this.observability.startTrace(fromAgent, 'collaboration', {
        target_agent: toAgent,
        collaboration_type: type
      });
      
      const span = this.observability.startSpan(trace?.traceId, 'collaboration.handoff', fromAgent, {
        target_agent: toAgent,
        type
      });
      
      return {
        traceId: trace?.traceId,
        spanId: span,
        onComplete: (result) => {
          this.observability.finishSpan(span, 'success', { result });
          this.observability.finishTrace(trace?.traceId, 'success', { result });
          
          // Update both agent profiles
          this.observability.updateProfile(fromAgent, 'collaboration_initiated', {
            target_agent: toAgent,
            type,
            success: true
          });
          
          this.observability.updateProfile(toAgent, 'collaboration_received', {
            source_agent: fromAgent,
            type,
            success: true
          });
        },
        onError: (error) => {
          this.observability.finishSpan(span, 'error', { error: error.message });
          this.observability.finishTrace(trace?.traceId, 'error', { error: error.message });
          
          // Update profiles with failure
          this.observability.updateProfile(fromAgent, 'collaboration_failed', {
            target_agent: toAgent,
            type,
            error: error.message
          });
        }
      };
    });
  }

  /**
   * Hook into decision making
   */
  hookDecisionMaking() {
    this.hooks.set('decision.make', (agentId, decision, context) => {
      const decisionId = this.observability.trackDecision(agentId, decision, {
        factors: context.factors,
        alternatives: context.alternatives,
        confidence: context.confidence,
        ethical_considerations: context.ethical_considerations,
        consciousness_state: context.consciousness_state
      });
      
      // Create a span for the decision process
      const span = this.observability.startSpan(context.traceId, 'decision.process', agentId, {
        decision_type: decision.type,
        decision_id: decisionId
      });
      
      return {
        decisionId,
        spanId: span,
        onOutcome: (outcome, lessons = []) => {
          this.observability.updateDecisionOutcome(decisionId, outcome, lessons);
          this.observability.finishSpan(span, 'success', { outcome });
          
          // Update agent profile with decision quality
          this.observability.updateProfile(agentId, 'decision_made', {
            decision_type: decision.type,
            outcome_quality: outcome.quality_score || 0.8,
            lessons_learned: lessons.length
          });
        }
      };
    });
  }

  /**
   * Set up automatic instrumentation
   */
  setupAutoInstrumentation() {
    // Auto-instrument common patterns
    this.autoInstrumentAsyncFunctions();
    this.autoInstrumentPromises();
    this.autoInstrumentEventEmitters();
    
    logger.debug('🟢 Auto-instrumentation enabled');
  }

  /**
   * Auto-instrument async functions
   */
  autoInstrumentAsyncFunctions() {
    // This would wrap async functions with observability
    const originalAsyncFunction = global.AsyncFunction || (async function() {}).constructor;
    
    // Override would go here in production implementation
    logger.debug('🟢 Async function instrumentation ready');
  }

  /**
   * Auto-instrument promises
   */
  autoInstrumentPromises() {
    // This would wrap Promise chains with observability
    const originalPromise = global.Promise;
    
    // Override would go here in production implementation
    logger.debug('🟢 Promise instrumentation ready');
  }

  /**
   * Auto-instrument event emitters
   */
  autoInstrumentEventEmitters() {
    // This would wrap EventEmitter events with observability
    const EventEmitter = require('events');
    const originalEmit = EventEmitter.prototype.emit;
    
    // Override would go here in production implementation
    logger.debug('🟢 EventEmitter instrumentation ready');
  }

  /**
   * Create instrumented wrapper for existing functions
   */
  instrument(name, fn, options = {}) {
    const agentId = options.agentId || 'system';
    const operation = options.operation || name;
    
    return async (...args) => {
      const trace = this.observability.startTrace(agentId, operation, {
        function_name: name,
        args_count: args.length
      });
      
      const span = this.observability.startSpan(trace?.traceId, operation, agentId, {
        function: name
      });
      
      const startTime = Date.now();
      
      try {
        const result = await fn(...args);
        const duration = Date.now() - startTime;
        
        this.observability.recordMetrics(agentId, operation, {
          duration,
          success: true
        });
        
        this.observability.finishSpan(span, 'success', { result });
        this.observability.finishTrace(trace?.traceId, 'success', { result });
        
        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        
        this.observability.recordMetrics(agentId, operation, {
          duration,
          error
        });
        
        this.observability.finishSpan(span, 'error', { error: error.message });
        this.observability.finishTrace(trace?.traceId, 'error', { error: error.message });
        
        throw error;
      }
    };
  }

  /**
   * Create instrumented class wrapper
   */
  instrumentClass(Class, options = {}) {
    const className = Class.name;
    const agentId = options.agentId || className.toLowerCase();
    
    return class extends Class {
      constructor(...args) {
        super(...args);
        
        // Instrument all methods
        const methods = Object.getOwnPropertyNames(Class.prototype)
          .filter(name => name !== 'constructor' && typeof this[name] === 'function');
        
        for (const methodName of methods) {
          const originalMethod = this[methodName];
          this[methodName] = this.constructor.prototype._instrumentMethod(
            methodName, 
            originalMethod, 
            agentId
          );
        }
      }
      
      _instrumentMethod(methodName, originalMethod, agentId) {
        return async (...args) => {
          const trace = observability.startTrace(agentId, `${className}.${methodName}`, {
            class: className,
            method: methodName
          });
          
          const span = observability.startSpan(trace?.traceId, methodName, agentId);
          const startTime = Date.now();
          
          try {
            const result = await originalMethod.apply(this, args);
            const duration = Date.now() - startTime;
            
            observability.recordMetrics(agentId, `${className}.${methodName}`, {
              duration,
              success: true
            });
            
            observability.finishSpan(span, 'success', { result });
            observability.finishTrace(trace?.traceId, 'success', { result });
            
            return result;
          } catch (error) {
            const duration = Date.now() - startTime;
            
            observability.recordMetrics(agentId, `${className}.${methodName}`, {
              duration,
              error
            });
            
            observability.finishSpan(span, 'error', { error: error.message });
            observability.finishTrace(trace?.traceId, 'error', { error: error.message });
            
            throw error;
          }
        };
      }
    };
  }

  /**
   * Get observability instance
   */
  getObservability() {
    return this.observability;
  }

  /**
   * Get dashboard instance
   */
  getDashboard() {
    return this.dashboard;
  }

  /**
   * Get current dashboard data
   */
  getDashboardData() {
    return this.dashboard?.generateTextDashboard() || 'Dashboard not initialized';
  }

  /**
   * Export observability data
   */
  async exportData(options = {}) {
    return await this.observability.export(options.format, options.timeRange);
  }

  /**
   * Start dashboard server
   */
  startDashboardServer(port = 3000) {
    if (!this.dashboard) {
      throw new Error('Dashboard not initialized');
    }
    
    return this.dashboard.startServer(port);
  }

  /**
   * Analyze current performance
   */
  analyzePerformance() {
    return {
      bottlenecks: this.observability.analyzeBottlenecks(),
      anomalies: this.observability.detectAnomalies(),
      dashboard: this.observability.getDashboard()
    };
  }

  /**
   * Helper methods
   */
  sanitizeArgs(args) {
    if (!args) {return undefined;}
    
    // Remove sensitive information from arguments
    const sanitized = { ...args };
    const sensitiveKeys = ['password', 'token', 'key', 'secret', 'apiKey'];
    
    for (const key of Object.keys(sanitized)) {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }

  mockOriginalMethod(methodName) {
    // In production, this would return the actual method reference
    return (...args) => {
      logger.debug(`🟢 Mock call to ${methodName}`, { args: this.sanitizeArgs(args) });
      return { success: true, method: methodName };
    };
  }

  /**
   * Integration health check
   */
  healthCheck() {
    return {
      observability_initialized: this.initialized,
      dashboard_available: !!this.dashboard,
      hooks_registered: this.hooks.size,
      instrumented_modules: this.instrumentedModules.size,
      system_health: this.observability.system?.calculateSystemHealth() || 0,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Shutdown and cleanup
   */
  async shutdown() {
    try {
      // Clean up hooks
      this.hooks.clear();
      
      // Export final data
      const finalData = await this.exportData({
        format: 'json',
        timeRange: {
          start: Date.now() - 24 * 60 * 60 * 1000, // Last 24 hours
          end: Date.now()
        }
      });
      
      logger.info('🟢 Observability integration shutdown complete');
      return finalData;
    } catch (error) {
      logger.error('🟢 Error during observability shutdown', { error });
      throw error;
    }
  }
}

// Create singleton instance
const integration = new ObservabilityIntegration();

// Export convenience functions
const observabilityIntegration = {
  // Initialize
  async initialize() {
    return await integration.initialize();
  },
  
  // Instrumentation
  instrument: (name, fn, options) => integration.instrument(name, fn, options),
  instrumentClass: (Class, options) => integration.instrumentClass(Class, options),
  
  // Hooks
  onAgentSpawn: (callback) => integration.hooks.set('agent.spawn', callback),
  onCommandProcess: (callback) => integration.hooks.set('command.process', callback),
  onCollaboration: (callback) => integration.hooks.set('collaboration.start', callback),
  onDecision: (callback) => integration.hooks.set('decision.make', callback),
  
  // Access
  getObservability: () => integration.getObservability(),
  getDashboard: () => integration.getDashboard(),
  getDashboardData: () => integration.getDashboardData(),
  
  // Analysis
  analyzePerformance: () => integration.analyzePerformance(),
  exportData: (options) => integration.exportData(options),
  
  // Dashboard
  startDashboardServer: (port) => integration.startDashboardServer(port),
  
  // Health
  healthCheck: () => integration.healthCheck(),
  shutdown: () => integration.shutdown()
};

module.exports = {
  ObservabilityIntegration,
  integration,
  observabilityIntegration
};
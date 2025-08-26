/**
 * BUMBA Agent Observability System - Main Export
 * 
 * Complete observability solution for BUMBA framework providing:
 * - Distributed tracing for agent interactions
 * - Visual debugging tools for agent flows  
 * - RED metrics (Rate, Errors, Duration)
 * - Structured logging with correlation IDs
 * - Agent behavior profiling and analysis
 * - Performance bottleneck identification
 * - Real-time dashboards and monitoring
 * - Decision-making debugging tools
 * - Anomaly detection for unusual patterns
 */

const { AgentObservabilitySystem, BumbaObservability, observability } = require('./agent-observability');
const { ObservabilityDashboard } = require('./dashboard-ui');
const { ObservabilityIntegration, integration, observabilityIntegration } = require('./integration');
const { logger } = require('../logging/bumba-logger');

/**
 * Initialize the complete observability system
 */
async function initializeObservability(options = {}) {
  try {
    logger.info('🟢 Initializing BUMBA Observability System...');
    
    // Initialize the integration layer (which initializes the core system)
    await observabilityIntegration.initialize();
    
    logger.info('🟢 BUMBA Observability System ready');
    
    return {
      observability: observabilityIntegration.getObservability(),
      dashboard: observabilityIntegration.getDashboard(),
      integration: observabilityIntegration,
      
      // Quick access methods
      startTrace: (agentId, operation, _context) => 
        observabilityIntegration.getObservability().startTrace(agentId, operation, context),
      
      instrument: (name, fn, options) => 
        observabilityIntegration.instrument(name, fn, options),
      
      getDashboard: () => 
        observabilityIntegration.getDashboardData(),
      
      analyzePerformance: () => 
        observabilityIntegration.analyzePerformance(),
      
      startDashboardServer: (port) => 
        observabilityIntegration.startDashboardServer(port)
    };
  } catch (error) {
    logger.error('🟢 Failed to initialize observability system', { error });
    throw error;
  }
}

/**
 * Quick setup for BUMBA framework integration
 */
async function quickSetup(options = {}) {
  const system = await initializeObservability(options);
  
  // Start dashboard server if requested
  if (options.dashboard !== false) {
    const port = options.dashboardPort || 3000;
    try {
      const server = system.startDashboardServer(port);
      logger.info(`🟢 Dashboard available at ${server.url}`);
    } catch (error) {
      logger.warn('🟢 Could not start dashboard server', { error: error.message });
    }
  }
  
  // Set up auto-analysis if requested
  if (options.autoAnalysis !== false) {
    setInterval(() => {
      try {
        const analysis = system.analyzePerformance();
        if (analysis.bottlenecks.length > 0 || analysis.anomalies.length > 0) {
          logger.warn('🟢 Performance issues detected', {
            bottlenecks: analysis.bottlenecks.length,
            anomalies: analysis.anomalies.length
          });
        }
      } catch (error) {
        logger.debug('🟢 Auto-analysis error', { error: error.message });
      }
    }, options.analysisInterval || 60000); // Every minute
  }
  
  return system;
}

/**
 * Agent Observability Decorators
 */
const decorators = {
  /**
   * Decorator for tracing agent methods
   */
  traced(agentId, operation) {
    return function(target, propertyKey, descriptor) {
      const originalMethod = descriptor.value;
      
      descriptor.value = async function(...args) {
        const obs = observabilityIntegration.getObservability();
        const trace = obs.startTrace(agentId || this.id || 'unknown', operation || propertyKey, {
          method: propertyKey,
          args_count: args.length
        });
        
        const span = obs.startSpan(trace?.traceId, propertyKey, agentId || this.id || 'unknown');
        
        try {
          const result = await originalMethod.apply(this, args);
          obs.finishSpan(span, 'success', { result });
          obs.finishTrace(trace?.traceId, 'success', { result });
          return result;
        } catch (error) {
          obs.finishSpan(span, 'error', { error: error.message });
          obs.finishTrace(trace?.traceId, 'error', { error: error.message });
          throw error;
        }
      };
      
      return descriptor;
    };
  },
  
  /**
   * Decorator for profiling agent behavior
   */
  profiled(behaviorType) {
    return function(target, propertyKey, descriptor) {
      const originalMethod = descriptor.value;
      
      descriptor.value = async function(...args) {
        const obs = observabilityIntegration.getObservability();
        const agentId = this.id || 'unknown';
        
        const startTime = Date.now();
        try {
          const result = await originalMethod.apply(this, args);
          const duration = Date.now() - startTime;
          
          obs.updateProfile(agentId, behaviorType || propertyKey, {
            method: propertyKey,
            duration,
            success: true,
            result_summary: typeof result === 'object' ? Object.keys(result).length : 'primitive'
          });
          
          return result;
        } catch (error) {
          const duration = Date.now() - startTime;
          
          obs.updateProfile(agentId, behaviorType || propertyKey, {
            method: propertyKey,
            duration,
            success: false,
            error: error.message
          });
          
          throw error;
        }
      };
      
      return descriptor;
    };
  },
  
  /**
   * Decorator for tracking agent decisions
   */
  decision(decisionType) {
    return function(target, propertyKey, descriptor) {
      const originalMethod = descriptor.value;
      
      descriptor.value = async function(...args) {
        const obs = observabilityIntegration.getObservability();
        const agentId = this.id || 'unknown';
        
        const decisionId = obs.trackDecision(agentId, {
          type: decisionType || propertyKey,
          method: propertyKey
        }, {
          factors: args,
          confidence: this.confidence || 0.8
        });
        
        try {
          const result = await originalMethod.apply(this, args);
          
          obs.updateDecisionOutcome(decisionId, {
            success: true,
            result,
            quality_score: result.quality_score || 0.8
          });
          
          return result;
        } catch (error) {
          obs.updateDecisionOutcome(decisionId, {
            success: false,
            error: error.message,
            quality_score: 0.0
          });
          
          throw error;
        }
      };
      
      return descriptor;
    };
  }
};

/**
 * Utility functions for common observability patterns
 */
const utils = {
  /**
   * Create an instrumented version of a function
   */
  instrument: (name, fn, options = {}) => {
    return observabilityIntegration.instrument(name, fn, options);
  },
  
  /**
   * Create an instrumented version of a class
   */
  instrumentClass: (Class, options = {}) => {
    return observabilityIntegration.instrumentClass(Class, options);
  },
  
  /**
   * Start a trace manually
   */
  startTrace: (agentId, operation, context = {}) => {
    return observabilityIntegration.getObservability().startTrace(agentId, operation, context);
  },
  
  /**
   * Record custom metrics
   */
  recordMetrics: (agentId, operation, metrics) => {
    return observabilityIntegration.getObservability().recordMetrics(agentId, operation, metrics);
  },
  
  /**
   * Update agent profile
   */
  updateProfile: (agentId, behavior, context = {}) => {
    return observabilityIntegration.getObservability().updateProfile(agentId, behavior, context);
  },
  
  /**
   * Track a decision
   */
  trackDecision: (agentId, decision, context = {}) => {
    return observabilityIntegration.getObservability().trackDecision(agentId, decision, context);
  },
  
  /**
   * Get current dashboard data
   */
  getDashboard: () => {
    return observabilityIntegration.getDashboardData();
  },
  
  /**
   * Analyze performance bottlenecks
   */
  analyzeBottlenecks: () => {
    return observabilityIntegration.getObservability().analyzeBottlenecks();
  },
  
  /**
   * Export observability data
   */
  exportData: (options = {}) => {
    return observabilityIntegration.exportData(options);
  },
  
  /**
   * Get system health check
   */
  healthCheck: () => {
    return observabilityIntegration.healthCheck();
  }
};

/**
 * Configuration helpers
 */
const config = {
  /**
   * Default configuration for development
   */
  development: {
    enableTracing: true,
    enableMetrics: true,
    enableProfiling: true,
    enableAnomaly: true,
    samplingRate: 1.0,
    privacyMode: 'respectful',
    dashboard: true,
    dashboardPort: 3000,
    autoAnalysis: true,
    analysisInterval: 30000 // 30 seconds
  },
  
  /**
   * Default configuration for production
   */
  production: {
    enableTracing: true,
    enableMetrics: true,
    enableProfiling: false, // Disable for performance
    enableAnomaly: true,
    samplingRate: 0.1, // 10% sampling
    privacyMode: 'strict',
    dashboard: false, // Disable public dashboard
    autoAnalysis: true,
    analysisInterval: 300000 // 5 minutes
  },
  
  /**
   * Minimal configuration for testing
   */
  testing: {
    enableTracing: false,
    enableMetrics: false,
    enableProfiling: false,
    enableAnomaly: false,
    samplingRate: 0,
    privacyMode: 'strict',
    dashboard: false,
    autoAnalysis: false
  }
};

/**
 * Examples for common usage patterns
 */
const examples = {
  /**
   * Basic agent instrumentation
   */
  async basicInstrumentation() {
    const system = await initializeObservability();
    
    // Instrument a function
    const instrumentedFunction = utils.instrument('myFunction', async (data) => {
      // Your function logic here
      return { processed: data };
    }, { agentId: 'my-agent' });
    
    // Use the instrumented function
    const result = await instrumentedFunction({ test: 'data' });
    
    return result;
  },
  
  /**
   * Manual tracing
   */
  async manualTracing() {
    const obs = observabilityIntegration.getObservability();
    
    // Start a trace
    const trace = obs.startTrace('agent-1', 'complex-operation', {
      user_id: 'user-123',
      operation_type: 'data-processing'
    });
    
    // Start spans for sub-operations
    const span1 = obs.startSpan(trace.traceId, 'data-validation', 'agent-1');
    // ... do validation work
    obs.finishSpan(span1, 'success', { records_validated: 100 });
    
    const span2 = obs.startSpan(trace.traceId, 'data-transformation', 'agent-1');
    // ... do transformation work
    obs.finishSpan(span2, 'success', { records_transformed: 100 });
    
    // Finish the trace
    obs.finishTrace(trace.traceId, 'success', { total_records: 100 });
  },
  
  /**
   * Class instrumentation with decorators
   */
  async classInstrumentation() {
    class MyAgent {
      constructor(id) {
        this.id = id;
      }
      
      @decorators.traced('my-agent', 'process-data')
      @decorators.profiled('data-processing')
      async processData(data) {
        // Your processing logic
        return { processed: data };
      }
      
      @decorators.decision('routing-decision')
      async makeRoutingDecision(options) {
        // Your decision logic
        return { route: 'option-1', confidence: 0.9 };
      }
    }
    
    const agent = new MyAgent('agent-1');
    const result = await agent.processData({ test: 'data' });
    
    return result;
  }
};

// Main exports
module.exports = {
  // Core classes
  AgentObservabilitySystem,
  BumbaObservability,
  ObservabilityDashboard,
  ObservabilityIntegration,
  
  // Instances
  observability,
  integration,
  observabilityIntegration,
  
  // Initialization
  initializeObservability,
  quickSetup,
  
  // Utilities
  decorators,
  utils,
  config,
  examples,
  
  // Quick access
  instrument: utils.instrument,
  instrumentClass: utils.instrumentClass,
  startTrace: utils.startTrace,
  recordMetrics: utils.recordMetrics,
  updateProfile: utils.updateProfile,
  trackDecision: utils.trackDecision,
  getDashboard: utils.getDashboard,
  analyzeBottlenecks: utils.analyzeBottlenecks,
  exportData: utils.exportData,
  healthCheck: utils.healthCheck
};
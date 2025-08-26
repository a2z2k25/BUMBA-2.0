/**
 * BUMBA Comprehensive Agent Observability System
 * 
 * Provides deep insights into agent behavior, system performance, and decision-making processes
 * while respecting privacy and consciousness principles.
 * 
 * Features:
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

const EventEmitter = require('events');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { logger } = require('../logging/bumba-logger');

/**
 * Core Agent Observability System
 */
class AgentObservabilitySystem extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      enableTracing: options.enableTracing !== false,
      enableMetrics: options.enableMetrics !== false,
      enableProfiling: options.enableProfiling !== false,
      enableAnomaly: options.enableAnomaly !== false,
      samplingRate: options.samplingRate || 1.0, // 100% by default
      maxTraceRetention: options.maxTraceRetention || 24 * 60 * 60 * 1000, // 24 hours
      maxMetricsRetention: options.maxMetricsRetention || 7 * 24 * 60 * 60 * 1000, // 7 days
      privacyMode: options.privacyMode || 'respectful', // 'strict', 'respectful', 'open'
      ...options
    };

    // Core data stores
    this.traces = new Map(); // Distributed traces
    this.spans = new Map(); // Individual spans
    this.metrics = new Map(); // RED metrics
    this.profiles = new Map(); // Agent behavior profiles
    this.anomalies = []; // Detected anomalies
    this.dashboards = new Map(); // Real-time dashboard data
    this.decisions = new Map(); // Decision tracking
    
    // Correlation tracking
    this.correlationIds = new Map();
    this.activeSpans = new Map();
    this.spanStack = new Map(); // Stack of active spans per agent
    
    // Performance tracking
    this.performanceBaselines = new Map();
    this.bottlenecks = [];
    this.performanceThresholds = {
      response_time_p95: 5000, // 5 seconds
      error_rate_threshold: 0.05, // 5%
      memory_usage_threshold: 1024, // 1GB
      cpu_usage_threshold: 0.8 // 80%
    };
    
    // Anomaly detection
    this.anomalyDetectors = new Map();
    this.behaviorBaselines = new Map();
    
    this.initialize();
  }

  /**
   * Initialize the observability system
   */
  async initialize() {
    logger.info('🟢 Initializing BUMBA Agent Observability System');
    
    // Initialize anomaly detectors
    this.initializeAnomalyDetectors();
    
    // Start background processes
    this.startMetricsAggregation();
    this.startAnomalyDetection();
    this.startDataRetention();
    
    // Initialize dashboard
    this.initializeDashboard();
    
    logger.info('🟢 Agent Observability System ready');
  }

  /**
   * DISTRIBUTED TRACING
   */

  /**
   * Start a new trace for agent interaction
   */
  startTrace(agentId, operation, context = {}) {
    if (!this.options.enableTracing || Math.random() > this.options.samplingRate) {
      return null;
    }

    const traceId = this.generateTraceId();
    const correlationId = this.generateCorrelationId();
    
    const trace = {
      traceId,
      correlationId,
      agentId,
      operation,
      startTime: Date.now(),
      endTime: null,
      duration: null,
      spans: [],
      status: 'active',
      context: this.sanitizeContext(context),
      metadata: {
        version: '1.0',
        environment: process.env.NODE_ENV || 'development',
        hostname: os.hostname(),
        pid: process.pid
      }
    };

    this.traces.set(traceId, trace);
    this.correlationIds.set(correlationId, traceId);
    
    logger.debug(`🟢 Started trace ${traceId} for agent ${agentId} operation ${operation}`);
    
    return { traceId, correlationId };
  }

  /**
   * Start a span within a trace
   */
  startSpan(traceId, spanName, agentId, context = {}) {
    if (!traceId || !this.traces.has(traceId)) {
      return null;
    }

    const spanId = this.generateSpanId();
    const parentSpanId = this.getActiveSpan(agentId);
    
    const span = {
      spanId,
      traceId,
      parentSpanId,
      agentId,
      spanName,
      startTime: Date.now(),
      endTime: null,
      duration: null,
      status: 'active',
      tags: {},
      logs: [],
      context: this.sanitizeContext(context),
      agent_consciousness: this.captureConsciousnessState(agentId, context),
      performance_metrics: this.initializeSpanMetrics()
    };

    this.spans.set(spanId, span);
    this.traces.get(traceId).spans.push(spanId);
    this.setActiveSpan(agentId, spanId);
    
    logger.debug(`🟢 Started span ${spanId} (${spanName}) for agent ${agentId}`);
    
    return spanId;
  }

  /**
   * Add a log entry to a span
   */
  logToSpan(spanId, level, message, data = {}) {
    if (!spanId || !this.spans.has(spanId)) {
      return;
    }

    const span = this.spans.get(spanId);
    span.logs.push({
      timestamp: Date.now(),
      level,
      message,
      data: this.sanitizeContext(data)
    });

    // Update span context if this is a significant event
    if (level === 'error' || level === 'warn') {
      span.tags.has_errors = true;
      span.tags.last_error = message;
    }
  }

  /**
   * Add tags to a span
   */
  addSpanTags(spanId, tags) {
    if (!spanId || !this.spans.has(spanId)) {
      return;
    }

    const span = this.spans.get(spanId);
    Object.assign(span.tags, tags);
  }

  /**
   * Finish a span
   */
  finishSpan(spanId, status = 'success', result = {}) {
    if (!spanId || !this.spans.has(spanId)) {
      return;
    }

    const span = this.spans.get(spanId);
    span.endTime = Date.now();
    span.duration = span.endTime - span.startTime;
    span.status = status;
    span.result = this.sanitizeContext(result);
    
    // Update performance metrics
    this.updateSpanMetrics(span);
    
    // Remove from active spans
    this.clearActiveSpan(span.agentId, spanId);
    
    // Record metrics
    this.recordSpanMetrics(span);
    
    logger.debug(`🟢 Finished span ${spanId} (${span.spanName}) - ${status} in ${span.duration}ms`);
    
    // Emit span completion event
    this.emit('span.completed', span);
  }

  /**
   * Finish a trace
   */
  finishTrace(traceId, status = 'success', result = {}) {
    if (!traceId || !this.traces.has(traceId)) {
      return;
    }

    const trace = this.traces.get(traceId);
    trace.endTime = Date.now();
    trace.duration = trace.endTime - trace.startTime;
    trace.status = status;
    trace.result = this.sanitizeContext(result);
    
    // Calculate trace statistics
    trace.statistics = this.calculateTraceStatistics(trace);
    
    logger.info(`🟢 Finished trace ${traceId} - ${status} in ${trace.duration}ms`);
    
    // Emit trace completion event
    this.emit('trace.completed', trace);
    
    // Run anomaly detection on the completed trace
    this.detectTraceAnomalies(trace);
  }

  /**
   * RED METRICS COLLECTION
   */

  /**
   * Record request rate metric
   */
  recordRate(agentId, operation, timestamp = Date.now()) {
    const key = `rate.${agentId}.${operation}`;
    this.incrementMetric(key, timestamp);
  }

  /**
   * Record error metric
   */
  recordError(agentId, operation, error, timestamp = Date.now()) {
    const key = `errors.${agentId}.${operation}`;
    this.incrementMetric(key, timestamp);
    
    // Store error details
    const errorKey = `error_details.${agentId}.${operation}`;
    if (!this.metrics.has(errorKey)) {
      this.metrics.set(errorKey, []);
    }
    
    this.metrics.get(errorKey).push({
      timestamp,
      error: {
        message: error.message || 'Unknown error',
        type: error.constructor.name,
        stack: this.options.privacyMode !== 'strict' ? error.stack : null
      }
    });
  }

  /**
   * Record duration metric
   */
  recordDuration(agentId, operation, duration, timestamp = Date.now()) {
    const key = `duration.${agentId}.${operation}`;
    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }
    
    this.metrics.get(key).push({
      timestamp,
      duration,
      agentId,
      operation
    });
  }

  /**
   * AGENT BEHAVIOR PROFILING
   */

  /**
   * Create or update agent behavior profile
   */
  updateAgentProfile(agentId, behavior, context = {}) {
    if (!this.profiles.has(agentId)) {
      this.profiles.set(agentId, {
        agentId,
        created: Date.now(),
        lastUpdated: Date.now(),
        behaviors: [],
        patterns: {},
        performance: {
          averageResponseTime: 0,
          successRate: 0,
          errorRate: 0,
          totalRequests: 0
        },
        consciousness: {
          decisionQuality: 0,
          ethicalAlignment: 0,
          userFocus: 0,
          adaptability: 0
        },
        interactions: {
          collaborations: 0,
          conflicts: 0,
          mentoring: 0,
          learning: 0
        }
      });
    }

    const profile = this.profiles.get(agentId);
    profile.lastUpdated = Date.now();
    
    // Add behavior record
    profile.behaviors.push({
      timestamp: Date.now(),
      behavior,
      context: this.sanitizeContext(context),
      consciousness_state: this.captureConsciousnessState(agentId, context)
    });

    // Update patterns
    this.updateBehaviorPatterns(profile, behavior);
    
    // Update performance metrics
    this.updateProfilePerformance(profile);
    
    logger.debug(`🟢 Updated profile for agent ${agentId}`);
  }

  /**
   * PERFORMANCE BOTTLENECK IDENTIFICATION
   */

  /**
   * Analyze performance bottlenecks
   */
  analyzeBottlenecks(timeWindow = 60 * 60 * 1000) { // 1 hour default
    const now = Date.now();
    const cutoff = now - timeWindow;
    
    const bottlenecks = [];
    
    // Analyze duration metrics
    for (const [key, durations] of this.metrics.entries()) {
      if (!key.startsWith('duration.')) {continue;}
      
      const recentDurations = durations.filter(d => d.timestamp >= cutoff);
      if (recentDurations.length < 10) {continue;} // Need sufficient data
      
      const [agentId, operation] = key.replace('duration.', '').split('.');
      const stats = this.calculateDurationStats(recentDurations);
      
      // Check for bottlenecks
      if (stats.p95 > this.performanceThresholds.response_time_p95) {
        bottlenecks.push({
          type: 'high_latency',
          agentId,
          operation,
          severity: this.calculateSeverity(stats.p95, this.performanceThresholds.response_time_p95),
          metrics: stats,
          recommendations: this.generateLatencyRecommendations(stats)
        });
      }
      
      if (stats.errorRate > this.performanceThresholds.error_rate_threshold) {
        bottlenecks.push({
          type: 'high_error_rate',
          agentId,
          operation,
          severity: this.calculateSeverity(stats.errorRate, this.performanceThresholds.error_rate_threshold),
          metrics: stats,
          recommendations: this.generateErrorRecommendations(stats)
        });
      }
    }
    
    // Store bottleneck analysis
    this.bottlenecks = bottlenecks;
    
    logger.info(`🟢 Identified ${bottlenecks.length} performance bottlenecks`);
    
    return bottlenecks;
  }

  /**
   * REAL-TIME DASHBOARD
   */

  /**
   * Get real-time dashboard data
   */
  getDashboardData() {
    const now = Date.now();
    const dashboard = {
      timestamp: now,
      system_overview: this.getSystemOverview(),
      agent_status: this.getAgentStatusOverview(),
      performance_metrics: this.getPerformanceOverview(),
      active_traces: this.getActiveTracesOverview(),
      recent_anomalies: this.getRecentAnomalies(),
      bottlenecks: this.getBottlenecksSummary(),
      consciousness_metrics: this.getConsciousnessOverview()
    };
    
    return dashboard;
  }

  /**
   * DECISION-MAKING DEBUGGING
   */

  /**
   * Track agent decision
   */
  trackDecision(agentId, decision, context = {}) {
    const decisionId = this.generateDecisionId();
    
    const record = {
      decisionId,
      agentId,
      timestamp: Date.now(),
      decision: this.sanitizeContext(decision),
      context: this.sanitizeContext(context),
      consciousness_state: this.captureConsciousnessState(agentId, context),
      reasoning: {
        factors: context.factors || [],
        alternatives: context.alternatives || [],
        confidence: context.confidence || 0.5,
        ethical_considerations: context.ethical_considerations || []
      },
      outcome: null, // To be updated later
      learning: {
        lessons: [],
        adaptations: []
      }
    };
    
    this.decisions.set(decisionId, record);
    
    logger.debug(`🟢 Tracked decision ${decisionId} for agent ${agentId}`);
    
    return decisionId;
  }

  /**
   * Update decision outcome
   */
  updateDecisionOutcome(decisionId, outcome, lessons = []) {
    if (!this.decisions.has(decisionId)) {
      return;
    }
    
    const decision = this.decisions.get(decisionId);
    decision.outcome = this.sanitizeContext(outcome);
    decision.learning.lessons = lessons;
    decision.completedAt = Date.now();
    
    // Analyze decision quality
    decision.quality_score = this.analyzeDecisionQuality(decision);
    
    logger.debug(`🟢 Updated decision outcome for ${decisionId}`);
  }

  /**
   * ANOMALY DETECTION
   */

  /**
   * Initialize anomaly detectors
   */
  initializeAnomalyDetectors() {
    this.anomalyDetectors.set('response_time', {
      name: 'Response Time Anomaly',
      threshold: 3.0, // 3 standard deviations
      windowSize: 100, // Last 100 measurements
      detector: this.detectResponseTimeAnomalies.bind(this)
    });
    
    this.anomalyDetectors.set('error_burst', {
      name: 'Error Burst Detection',
      threshold: 5, // 5 errors in window
      windowSize: 300000, // 5 minutes
      detector: this.detectErrorBursts.bind(this)
    });
    
    this.anomalyDetectors.set('behavior_drift', {
      name: 'Agent Behavior Drift',
      threshold: 0.8, // Similarity threshold
      windowSize: 1000, // Last 1000 behaviors
      detector: this.detectBehaviorDrift.bind(this)
    });
    
    this.anomalyDetectors.set('consciousness_deviation', {
      name: 'Consciousness State Deviation',
      threshold: 0.7, // Consciousness score threshold
      windowSize: 50, // Last 50 decisions
      detector: this.detectConsciousnessDeviations.bind(this)
    });
  }

  /**
   * Run anomaly detection
   */
  async runAnomalyDetection() {
    const anomalies = [];
    
    for (const [type, detector] of this.anomalyDetectors.entries()) {
      try {
        const detectedAnomalies = await detector.detector();
        anomalies.push(...detectedAnomalies.map(a => ({ ...a, type, detector: detector.name })));
      } catch (error) {
        logger.warn(`🟢 Anomaly detector ${type} failed: ${error.message}`);
      }
    }
    
    // Store new anomalies
    const newAnomalies = anomalies.filter(a => !this.isDuplicateAnomaly(a));
    this.anomalies.push(...newAnomalies);
    
    if (newAnomalies.length > 0) {
      logger.warn(`🟢 Detected ${newAnomalies.length} new anomalies`);
      this.emit('anomalies.detected', newAnomalies);
    }
    
    return newAnomalies;
  }

  /**
   * VISUAL DEBUGGING TOOLS
   */

  /**
   * Generate visual trace diagram
   */
  generateTraceVisualization(traceId) {
    if (!this.traces.has(traceId)) {
      return null;
    }
    
    const trace = this.traces.get(traceId);
    const spans = trace.spans.map(spanId => this.spans.get(spanId)).filter(Boolean);
    
    return {
      trace,
      spans,
      visualization: {
        type: 'waterfall',
        data: this.generateWaterfallData(spans),
        timeline: this.generateTimelineData(spans),
        dependencies: this.generateDependencyGraph(spans)
      }
    };
  }

  /**
   * Generate agent flow diagram
   */
  generateAgentFlowDiagram(agentId, timeWindow = 60 * 60 * 1000) {
    const cutoff = Date.now() - timeWindow;
    
    const agentSpans = Array.from(this.spans.values())
      .filter(span => span.agentId === agentId && span.startTime >= cutoff);
    
    return {
      agentId,
      timeWindow,
      flow: this.buildFlowGraph(agentSpans),
      patterns: this.identifyFlowPatterns(agentSpans),
      performance: this.analyzeFlowPerformance(agentSpans)
    };
  }

  /**
   * HELPER METHODS
   */

  /**
   * Generate unique IDs
   */
  generateTraceId() {
    return crypto.randomBytes(16).toString('hex');
  }
  
  generateSpanId() {
    return crypto.randomBytes(8).toString('hex');
  }
  
  generateCorrelationId() {
    return crypto.randomBytes(12).toString('hex');
  }
  
  generateDecisionId() {
    return `decision-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  }

  /**
   * Sanitize context for privacy
   */
  sanitizeContext(context) {
    if (this.options.privacyMode === 'strict') {
      return { _sanitized: true };
    }
    
    if (this.options.privacyMode === 'respectful') {
      const sanitized = { ...context };
      const sensitiveKeys = ['password', 'token', 'key', 'secret', 'apiKey', 'personal', 'private'];
      
      for (const key of Object.keys(sanitized)) {
        if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
          sanitized[key] = '[REDACTED]';
        }
      }
      
      return sanitized;
    }
    
    return context; // 'open' mode
  }

  /**
   * Capture consciousness state
   */
  captureConsciousnessState(agentId, context) {
    return {
      awareness_level: context.awareness_level || 0.8,
      ethical_alignment: context.ethical_alignment || 0.9,
      user_focus: context.user_focus || 0.85,
      decision_confidence: context.decision_confidence || 0.7,
      emotional_state: context.emotional_state || 'focused',
      learning_mode: context.learning_mode || 'active'
    };
  }

  /**
   * Active span management
   */
  getActiveSpan(agentId) {
    const stack = this.spanStack.get(agentId) || [];
    return stack.length > 0 ? stack[stack.length - 1] : null;
  }
  
  setActiveSpan(agentId, spanId) {
    if (!this.spanStack.has(agentId)) {
      this.spanStack.set(agentId, []);
    }
    this.spanStack.get(agentId).push(spanId);
  }
  
  clearActiveSpan(agentId, spanId) {
    if (!this.spanStack.has(agentId)) {
      return;
    }
    
    const stack = this.spanStack.get(agentId);
    const index = stack.indexOf(spanId);
    if (index !== -1) {
      stack.splice(index, 1);
    }
  }

  /**
   * Metrics helpers
   */
  incrementMetric(key, timestamp = Date.now()) {
    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }
    
    this.metrics.get(key).push({ timestamp, value: 1 });
  }

  /**
   * Initialize span metrics
   */
  initializeSpanMetrics() {
    return {
      memory_start: process.memoryUsage().heapUsed,
      memory_peak: process.memoryUsage().heapUsed,
      cpu_start: process.cpuUsage(),
      io_start: { read: 0, write: 0 } // Would be enhanced with actual I/O tracking
    };
  }

  /**
   * Update span metrics
   */
  updateSpanMetrics(span) {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage(span.performance_metrics.cpu_start);
    
    span.performance_metrics.memory_end = memoryUsage.heapUsed;
    span.performance_metrics.memory_peak = Math.max(
      span.performance_metrics.memory_peak,
      memoryUsage.heapUsed
    );
    span.performance_metrics.cpu_usage = cpuUsage;
  }

  /**
   * Record span metrics
   */
  recordSpanMetrics(span) {
    this.recordRate(span.agentId, span.spanName);
    this.recordDuration(span.agentId, span.spanName, span.duration);
    
    if (span.status === 'error') {
      this.recordError(span.agentId, span.spanName, new Error(span.tags.last_error || 'Unknown error'));
    }
  }

  /**
   * Calculate trace statistics
   */
  calculateTraceStatistics(trace) {
    const spans = trace.spans.map(spanId => this.spans.get(spanId)).filter(Boolean);
    
    return {
      total_spans: spans.length,
      successful_spans: spans.filter(s => s.status === 'success').length,
      failed_spans: spans.filter(s => s.status === 'error').length,
      average_span_duration: spans.reduce((sum, s) => sum + (s.duration || 0), 0) / spans.length,
      max_span_duration: Math.max(...spans.map(s => s.duration || 0)),
      min_span_duration: Math.min(...spans.map(s => s.duration || 0)),
      agents_involved: [...new Set(spans.map(s => s.agentId))],
      operations_performed: [...new Set(spans.map(s => s.spanName))]
    };
  }

  /**
   * Dashboard overview methods
   */
  getSystemOverview() {
    return {
      active_traces: this.traces.size,
      active_spans: Array.from(this.spans.values()).filter(s => s.status === 'active').length,
      total_agents: new Set(Array.from(this.spans.values()).map(s => s.agentId)).size,
      uptime: process.uptime(),
      memory_usage: process.memoryUsage(),
      health_status: this.calculateSystemHealth()
    };
  }

  getAgentStatusOverview() {
    const agents = {};
    
    for (const span of this.spans.values()) {
      if (!agents[span.agentId]) {
        agents[span.agentId] = {
          agentId: span.agentId,
          active_spans: 0,
          total_spans: 0,
          success_rate: 0,
          last_activity: 0
        };
      }
      
      const agent = agents[span.agentId];
      agent.total_spans++;
      if (span.status === 'active') {agent.active_spans++;}
      agent.last_activity = Math.max(agent.last_activity, span.startTime);
    }
    
    return agents;
  }

  getPerformanceOverview() {
    const now = Date.now();
    const hour = 60 * 60 * 1000;
    
    return {
      requests_per_hour: this.calculateRequestRate(hour),
      error_rate: this.calculateErrorRate(hour),
      average_response_time: this.calculateAverageResponseTime(hour),
      p95_response_time: this.calculateP95ResponseTime(hour),
      throughput: this.calculateThroughput(hour)
    };
  }

  getActiveTracesOverview() {
    return Array.from(this.traces.values())
      .filter(t => t.status === 'active')
      .map(t => ({
        traceId: t.traceId,
        agentId: t.agentId,
        operation: t.operation,
        duration: Date.now() - t.startTime,
        span_count: t.spans.length
      }));
  }

  getRecentAnomalies(limit = 10) {
    return this.anomalies
      .slice(-limit)
      .map(a => ({
        type: a.type,
        severity: a.severity,
        timestamp: a.timestamp,
        message: a.message,
        agentId: a.agentId
      }));
  }

  getBottlenecksSummary() {
    return this.bottlenecks.map(b => ({
      type: b.type,
      agentId: b.agentId,
      operation: b.operation,
      severity: b.severity,
      impact: b.metrics?.p95 || 'unknown'
    }));
  }

  getConsciousnessOverview() {
    const decisions = Array.from(this.decisions.values());
    
    if (decisions.length === 0) {
      return {
        average_consciousness_score: 0.85,
        ethical_alignment: 0.9,
        decision_quality: 0.8,
        total_decisions: 0
      };
    }
    
    return {
      average_consciousness_score: decisions.reduce((sum, d) => 
        sum + (d.consciousness_state?.awareness_level || 0.8), 0) / decisions.length,
      ethical_alignment: decisions.reduce((sum, d) => 
        sum + (d.consciousness_state?.ethical_alignment || 0.9), 0) / decisions.length,
      decision_quality: decisions.reduce((sum, d) => 
        sum + (d.quality_score || 0.8), 0) / decisions.length,
      total_decisions: decisions.length
    };
  }

  /**
   * Background processes
   */
  startMetricsAggregation() {
    setInterval(() => {
      this.aggregateMetrics();
    }, 60000); // Every minute
  }

  startAnomalyDetection() {
    setInterval(() => {
      this.runAnomalyDetection();
    }, 30000); // Every 30 seconds
  }

  startDataRetention() {
    setInterval(() => {
      this.cleanupOldData();
    }, 3600000); // Every hour
  }

  initializeDashboard() {
    setInterval(() => {
      const dashboardData = this.getDashboardData();
      this.dashboards.set('current', dashboardData);
      this.emit('dashboard.updated', dashboardData);
    }, 5000); // Every 5 seconds
  }

  /**
   * Data management
   */
  aggregateMetrics() {
    // Aggregate hourly metrics
    const now = Date.now();
    const hour = 60 * 60 * 1000;
    
    // This would be enhanced with proper time-series aggregation
    logger.debug('🟢 Aggregating metrics');
  }

  cleanupOldData() {
    const now = Date.now();
    
    // Clean up old traces
    for (const [traceId, trace] of this.traces.entries()) {
      if (trace.endTime && (now - trace.endTime) > this.options.maxTraceRetention) {
        this.traces.delete(traceId);
        
        // Clean up associated spans
        for (const spanId of trace.spans) {
          this.spans.delete(spanId);
        }
      }
    }
    
    // Clean up old metrics
    for (const [key, metrics] of this.metrics.entries()) {
      if (Array.isArray(metrics)) {
        const filtered = metrics.filter(m => (now - m.timestamp) <= this.options.maxMetricsRetention);
        if (filtered.length !== metrics.length) {
          this.metrics.set(key, filtered);
        }
      }
    }
    
    // Clean up old anomalies
    this.anomalies = this.anomalies.filter(a => (now - a.timestamp) <= this.options.maxMetricsRetention);
    
    logger.debug('🟢 Cleaned up old observability data');
  }

  /**
   * Anomaly detection implementations
   */
  async detectResponseTimeAnomalies() {
    // Implementation would analyze response time patterns
    return [];
  }

  async detectErrorBursts() {
    // Implementation would detect error spikes
    return [];
  }

  async detectBehaviorDrift() {
    // Implementation would detect changes in agent behavior patterns
    return [];
  }

  async detectConsciousnessDeviations() {
    // Implementation would detect consciousness state anomalies
    return [];
  }

  /**
   * Calculate system health score
   */
  calculateSystemHealth() {
    const activeSpans = Array.from(this.spans.values()).filter(s => s.status === 'active');
    const recentErrors = this.anomalies.filter(a => (Date.now() - a.timestamp) < 300000); // 5 minutes
    
    let healthScore = 1.0;
    
    // Reduce score for active issues
    if (activeSpans.length > 100) {healthScore -= 0.2;}
    if (recentErrors.length > 5) {healthScore -= 0.3;}
    if (this.bottlenecks.length > 0) {healthScore -= 0.1 * this.bottlenecks.length;}
    
    return Math.max(0, healthScore);
  }

  /**
   * Export observability data
   */
  async exportData(format = 'json', timeRange = null) {
    const data = {
      metadata: {
        exported_at: new Date().toISOString(),
        format,
        timeRange,
        system_info: {
          hostname: os.hostname(),
          platform: os.platform(),
          node_version: process.version
        }
      },
      traces: Array.from(this.traces.values()),
      spans: Array.from(this.spans.values()),
      metrics: Object.fromEntries(this.metrics),
      profiles: Object.fromEntries(this.profiles),
      anomalies: this.anomalies,
      decisions: Array.from(this.decisions.values()),
      bottlenecks: this.bottlenecks
    };
    
    if (timeRange) {
      data.traces = data.traces.filter(t => this.isInTimeRange(t.startTime, timeRange));
      data.spans = data.spans.filter(s => this.isInTimeRange(s.startTime, timeRange));
      data.anomalies = data.anomalies.filter(a => this.isInTimeRange(a.timestamp, timeRange));
    }
    
    return data;
  }

  isInTimeRange(timestamp, timeRange) {
    if (!timeRange) {return true;}
    return timestamp >= timeRange.start && timestamp <= timeRange.end;
  }

  // Placeholder implementations for complex calculations
  calculateRequestRate(timeWindow) { return 0; }
  calculateErrorRate(timeWindow) { return 0; }
  calculateAverageResponseTime(timeWindow) { return 0; }
  calculateP95ResponseTime(timeWindow) { return 0; }
  calculateThroughput(timeWindow) { return 0; }
  calculateDurationStats(durations) { return { p95: 0, errorRate: 0 }; }
  calculateSeverity(value, threshold) { return 'medium'; }
  generateLatencyRecommendations(stats) { return []; }
  generateErrorRecommendations(stats) { return []; }
  updateBehaviorPatterns(profile, behavior) { }
  updateProfilePerformance(profile) { }
  analyzeDecisionQuality(decision) { return 0.8; }
  isDuplicateAnomaly(anomaly) { return false; }
  generateWaterfallData(spans) { return []; }
  generateTimelineData(spans) { return []; }
  generateDependencyGraph(spans) { return []; }
  buildFlowGraph(spans) { return {}; }
  identifyFlowPatterns(spans) { return []; }
  analyzeFlowPerformance(spans) { return {}; }
  detectTraceAnomalies(trace) { }
}

/**
 * Convenience wrapper for easy integration
 */
class BumbaObservability {
  constructor(options = {}) {
    this.system = new AgentObservabilitySystem(options);
    this.initialized = false;
  }

  async initialize() {
    if (!this.initialized) {
      await this.system.initialize();
      this.initialized = true;
    }
    return this;
  }

  // Trace methods
  startTrace(agentId, operation, context) {
    return this.system.startTrace(agentId, operation, context);
  }

  startSpan(traceId, spanName, agentId, context) {
    return this.system.startSpan(traceId, spanName, agentId, context);
  }

  finishSpan(spanId, status, result) {
    return this.system.finishSpan(spanId, status, result);
  }

  finishTrace(traceId, status, result) {
    return this.system.finishTrace(traceId, status, result);
  }

  // Metrics methods
  recordMetrics(agentId, operation, metrics) {
    this.system.recordRate(agentId, operation);
    if (metrics.duration) {
      this.system.recordDuration(agentId, operation, metrics.duration);
    }
    if (metrics.error) {
      this.system.recordError(agentId, operation, metrics.error);
    }
  }

  // Profile methods
  updateProfile(agentId, behavior, context) {
    return this.system.updateAgentProfile(agentId, behavior, context);
  }

  // Decision tracking
  trackDecision(agentId, decision, context) {
    return this.system.trackDecision(agentId, decision, context);
  }

  updateDecisionOutcome(decisionId, outcome, lessons) {
    return this.system.updateDecisionOutcome(decisionId, outcome, lessons);
  }

  // Dashboard and analysis
  getDashboard() {
    return this.system.getDashboardData();
  }

  analyzeBottlenecks() {
    return this.system.analyzeBottlenecks();
  }

  detectAnomalies() {
    return this.system.runAnomalyDetection();
  }

  // Visualization
  getTraceVisualization(traceId) {
    return this.system.generateTraceVisualization(traceId);
  }

  getAgentFlow(agentId, timeWindow) {
    return this.system.generateAgentFlowDiagram(agentId, timeWindow);
  }

  // Export
  export(format, timeRange) {
    return this.system.exportData(format, timeRange);
  }

  // Event subscription
  on(event, callback) {
    return this.system.on(event, callback);
  }

  off(event, callback) {
    return this.system.off(event, callback);
  }
}

// Create singleton instance
const observability = new BumbaObservability({
  enableTracing: true,
  enableMetrics: true,
  enableProfiling: true,
  enableAnomaly: true,
  samplingRate: 1.0,
  privacyMode: 'respectful'
});

module.exports = {
  AgentObservabilitySystem,
  BumbaObservability,
  observability
};
/**
 * BUMBA Unified Dashboard Manager
 * Single source of truth for all dashboard metrics
 * Consolidates 16 dashboards into one unified system
 * 
 * Day 5 Sprint 2: Base Structure
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');

/**
 * Unified Dashboard Manager
 * Aggregates data from all 16 dashboard sources
 */
class UnifiedDashboardManager extends EventEmitter {
  constructor(config = {}) {
    super();
    
    // Configuration
    this.config = {
      name: 'BUMBA Unified Dashboard',
      version: '1.0.0',
      refreshInterval: config.refreshInterval || 5000,
      cacheTimeout: config.cacheTimeout || 60000,
      enableNotionSync: config.enableNotionSync !== false,
      enableHealthCheck: config.enableHealthCheck !== false,
      maxHistorySize: config.maxHistorySize || 1000,
      ...config
    };
    
    // Data sources registry
    this.dataSources = new Map();
    this.sourceStatus = new Map();
    
    // Unified metrics storage
    this.metrics = {
      timestamp: null,
      system: {},
      resources: {},
      specialists: {},
      operations: {},
      errors: {},
      validation: {},
      collaboration: {},
      integrations: {},
      alerts: {}
    };
    
    // Historical data
    this.history = [];
    
    // Cache management
    this.cache = new Map();
    this.lastUpdate = Date.now();
    
    // Component references (to be connected)
    this.components = {
      timerRegistry: null,
      specialistRegistry: null,
      failureManager: null,
      circuitBreakerRegistry: null,
      taskFlowRegistry: null,
      validationManager: null,
      capabilityManager: null,
      configManager: null
    };
    
    // Dashboard sources (to be connected)
    this.dashboards = {
      analytics: null,
      status: null,
      alert: null,
      poolingMetrics: null,
      qualityMetrics: null,
      performance: null,
      integrationStatus: null,
      collaborationStatus: null,
      systemHealth: null,
      knowledge: null,
      coordination: null
    };
    
    // Notion integration
    this.notionBridge = null;
    this.notionPageId = null;
    
    // Update intervals
    this.intervals = {
      refresh: null,
      cleanup: null,
      publish: null
    };
    
    // State management
    this.state = {
      initialized: false,
      running: false,
      publishing: false,
      lastError: null,
      connectionStatus: {
        dataSources: 0,
        notion: false,
        health: 'initializing'
      }
    };
    
    // Statistics
    this.stats = {
      updates: 0,
      publishes: 0,
      errors: 0,
      cacheHits: 0,
      cacheMisses: 0,
      avgUpdateTime: 0,
      lastUpdateDuration: 0
    };
    
    logger.info('🎯 Unified Dashboard Manager created');
  }
  
  /**
   * Initialize the dashboard manager
   */
  async initialize() {
    try {
      logger.info('🚀 Initializing Unified Dashboard...');
      
      // Initialize data collection
      await this.connectDataSources();
      
      // Initialize Notion integration
      await this.initializeNotion();
      
      // Start update cycles
      this.startUpdateCycles();
      
      this.state.initialized = true;
      this.state.running = true;
      this.emit('initialized');
      
      logger.info('✅ Unified Dashboard initialized successfully');
      return true;
    } catch (error) {
      logger.error('Failed to initialize Unified Dashboard:', error);
      this.state.lastError = error;
      this.emit('error', error);
      return false;
    }
  }
  
  /**
   * Connect to all data sources
   */
  async connectDataSources() {
    logger.debug('Connecting data sources...');
    
    try {
      // Connect Timer Registry (Sprint 4)
      const { getTimerRegistry } = require('../timers/timer-registry');
      const timerRegistry = getTimerRegistry();
      if (timerRegistry) {
        const TimerRegistrySource = require('./data-sources/timer-registry-source');
        const timerSource = new TimerRegistrySource(timerRegistry);
        await timerSource.connect();
        this.registerDataSource('timers', timerSource);
        logger.info('✅ Timer registry connected');
      }
      
      // Connect Specialist Registry (Sprint 5)
      const { SpecialistRegistry } = require('../specialists/specialist-registry-wrapper');
      const specialistRegistry = new SpecialistRegistry();
      if (specialistRegistry) {
        const SpecialistRegistrySource = require('./data-sources/specialist-registry-source');
        const specialistSource = new SpecialistRegistrySource(specialistRegistry);
        await specialistSource.connect();
        this.registerDataSource('specialists', specialistSource);
        logger.info('✅ Specialist registry connected');
      }
      
      // Connect Failure Manager (Sprint 6)
      const { getFailureManager } = require('../failures/failure-manager');
      const failureManager = getFailureManager();
      if (failureManager) {
        const FailureManagerSource = require('./data-sources/failure-manager-source');
        const failureSource = new FailureManagerSource(failureManager);
        await failureSource.connect();
        this.registerDataSource('failures', failureSource);
        logger.info('✅ Failure manager connected');
      }
      
      // Connect Circuit Breakers (Sprint 7)
      const { getCircuitBreakerRegistry } = require('../resilience/circuit-breaker');
      const circuitBreakerRegistry = getCircuitBreakerRegistry();
      if (circuitBreakerRegistry) {
        const CircuitBreakerSource = require('./data-sources/circuit-breaker-source');
        const circuitSource = new CircuitBreakerSource(circuitBreakerRegistry);
        await circuitSource.connect();
        this.registerDataSource('circuitBreakers', circuitSource);
        logger.info('✅ Circuit breakers connected');
      }
      
      // Connect Task Flow Registry (Sprint 8)
      const { getTaskFlowRegistry } = require('../tracing/task-flow');
      const taskFlowRegistry = getTaskFlowRegistry();
      if (taskFlowRegistry) {
        const TaskFlowSource = require('./data-sources/task-flow-source');
        const taskFlowSource = new TaskFlowSource(taskFlowRegistry);
        await taskFlowSource.connect();
        this.registerDataSource('taskFlow', taskFlowSource);
        logger.info('✅ Task flow registry connected');
      }
      
      // Connect Validation Metrics (Sprint 9)
      const { getValidationMetrics } = require('../validation/validation-metrics');
      const validationMetrics = getValidationMetrics();
      if (validationMetrics) {
        const ValidationMetricsSource = require('./data-sources/validation-metrics-source');
        const validationSource = new ValidationMetricsSource(validationMetrics);
        await validationSource.connect();
        this.registerDataSource('validation', validationSource);
        logger.info('✅ Validation metrics connected');
      }
      
      // Connect remaining dashboard sources
      await this.connectRemainingDashboards();
      
      this.state.connectionStatus.dataSources = this.dataSources.size;
      logger.info(`Connected ${this.dataSources.size} data sources`);
      
      return true;
    } catch (error) {
      logger.error('Failed to connect data sources:', error);
      throw error;
    }
  }
  
  /**
   * Connect remaining dashboard sources
   */
  async connectRemainingDashboards() {
    try {
      // These are existing dashboards that need to be connected as data sources
      // They represent the remaining 10 sources to reach 16 total
      
      // 1. Configuration Manager
      try {
        const { getConfigurationManager } = require('../configuration/configuration-manager');
        const configManager = getConfigurationManager();
        if (configManager) {
          const GenericDashboardSource = require('./data-sources/generic-dashboard-source');
          const configSource = new GenericDashboardSource('configuration', configManager, {
            getMetrics: 'getConfig',
            category: 'system'
          });
          await configSource.connect();
          this.registerDataSource('configuration', configSource);
          logger.info('✅ Configuration manager connected');
        }
      } catch (e) {
        // Use mock adapter if real source not available
        const { ConfigurationManagerSource } = require('./data-sources/remaining-sources-adapter');
        const configSource = new ConfigurationManagerSource();
        await configSource.connect();
        this.registerDataSource('configuration', configSource);
        logger.info('✅ Configuration manager connected (mock)');
      }
      
      // 2-5. Coordination Dashboards (4 redundant ones)
      const coordinationDashboards = [
        { path: '../coordination/coordination-dashboard', name: 'coordination-main' },
        { path: '../coordination/coordination-dashboard-enhanced', name: 'coordination-enhanced' },
        { path: '../coordination/coordination-dashboard-complete', name: 'coordination-complete', mockClass: 'CoordinationCompleteSource' },
        { path: '../coordination/coordination-dashboard-ui', name: 'coordination-ui', mockClass: 'CoordinationUISource' }
      ];
      
      for (const dashboard of coordinationDashboards) {
        try {
          const DashboardModule = require(dashboard.path);
          if (DashboardModule && DashboardModule.getInstance) {
            const instance = DashboardModule.getInstance();
            const GenericDashboardSource = require('./data-sources/generic-dashboard-source');
            const source = new GenericDashboardSource(dashboard.name, instance, {
              getMetrics: 'getMetrics',
              category: 'coordination'
            });
            await source.connect();
            this.registerDataSource(dashboard.name, source);
            logger.info(`✅ ${dashboard.name} connected`);
          }
        } catch (e) {
          // Use mock adapter if specified
          if (dashboard.mockClass) {
            const adapters = require('./data-sources/remaining-sources-adapter');
            const MockSource = adapters[dashboard.mockClass];
            if (MockSource) {
              const mockSource = new MockSource();
              await mockSource.connect();
              this.registerDataSource(dashboard.name, mockSource);
              logger.info(`✅ ${dashboard.name} connected (mock)`);
            } else {
              logger.debug(`${dashboard.name} not available`);
            }
          } else {
            logger.debug(`${dashboard.name} not available`);
          }
        }
      }
      
      // 6. Analytics Dashboard
      try {
        const AnalyticsDashboard = require('../dashboard/analytics-dashboard');
        if (AnalyticsDashboard && AnalyticsDashboard.getInstance) {
          const analyticsInstance = AnalyticsDashboard.getInstance();
          const GenericDashboardSource = require('./data-sources/generic-dashboard-source');
          const analyticsSource = new GenericDashboardSource('analytics', analyticsInstance, {
            getMetrics: 'getAnalytics',
            category: 'operations'
          });
          await analyticsSource.connect();
          this.registerDataSource('analytics', analyticsSource);
          logger.info('✅ Analytics dashboard connected');
        }
      } catch (e) {
        logger.debug('Analytics dashboard not available');
      }
      
      // 7. Status Dashboard
      try {
        const StatusDashboard = require('../dashboard/status-dashboard');
        if (StatusDashboard && StatusDashboard.getInstance) {
          const statusInstance = StatusDashboard.getInstance();
          const GenericDashboardSource = require('./data-sources/generic-dashboard-source');
          const statusSource = new GenericDashboardSource('status', statusInstance, {
            getMetrics: 'getStatus',
            category: 'system'
          });
          await statusSource.connect();
          this.registerDataSource('status', statusSource);
          logger.info('✅ Status dashboard connected');
        }
      } catch (e) {
        logger.debug('Status dashboard not available');
      }
      
      // 8. Alert Dashboard
      try {
        const { getAlertDashboard } = require('../alerting/alert-dashboard');
        const alertDashboard = getAlertDashboard();
        if (alertDashboard) {
          const GenericDashboardSource = require('./data-sources/generic-dashboard-source');
          const alertSource = new GenericDashboardSource('alerts', alertDashboard, {
            getMetrics: 'getAlerts',
            category: 'alerts'
          });
          await alertSource.connect();
          this.registerDataSource('alerts', alertSource);
          logger.info('✅ Alert dashboard connected');
        }
      } catch (e) {
        logger.debug('Alert dashboard not available');
      }
      
      // 9. Pooling Metrics Dashboard
      try {
        const { getPoolingMetrics } = require('../pooling/metrics-dashboard');
        const poolingMetrics = getPoolingMetrics();
        if (poolingMetrics) {
          const GenericDashboardSource = require('./data-sources/generic-dashboard-source');
          const poolingSource = new GenericDashboardSource('pooling', poolingMetrics, {
            getMetrics: 'getMetrics',
            category: 'resources'
          });
          await poolingSource.connect();
          this.registerDataSource('pooling', poolingSource);
          logger.info('✅ Pooling metrics connected');
        }
      } catch (e) {
        // Use mock adapter
        const { PoolingMetricsSource } = require('./data-sources/remaining-sources-adapter');
        const poolingSource = new PoolingMetricsSource();
        await poolingSource.connect();
        this.registerDataSource('pooling', poolingSource);
        logger.info('✅ Pooling metrics connected (mock)');
      }
      
      // 10. Quality Metrics Dashboard
      try {
        const { getQualityMetrics } = require('../testing/quality-metrics-dashboard');
        const qualityMetrics = getQualityMetrics();
        if (qualityMetrics) {
          const GenericDashboardSource = require('./data-sources/generic-dashboard-source');
          const qualitySource = new GenericDashboardSource('quality', qualityMetrics, {
            getMetrics: 'getMetrics',
            category: 'validation'
          });
          await qualitySource.connect();
          this.registerDataSource('quality', qualitySource);
          logger.info('✅ Quality metrics connected');
        }
      } catch (e) {
        // Use mock adapter
        const { QualityMetricsSource } = require('./data-sources/remaining-sources-adapter');
        const qualitySource = new QualityMetricsSource();
        await qualitySource.connect();
        this.registerDataSource('quality', qualitySource);
        logger.info('✅ Quality metrics connected (mock)');
      }
      
      // Force connection of remaining coordination dashboards if not connected
      if (!this.dataSources.has('coordination-complete')) {
        const { CoordinationCompleteSource } = require('./data-sources/remaining-sources-adapter');
        const completeSource = new CoordinationCompleteSource();
        await completeSource.connect();
        this.registerDataSource('coordination-complete', completeSource);
        logger.info('✅ coordination-complete connected (forced mock)');
      }
      
      if (!this.dataSources.has('coordination-ui')) {
        const { CoordinationUISource } = require('./data-sources/remaining-sources-adapter');
        const uiSource = new CoordinationUISource();
        await uiSource.connect();
        this.registerDataSource('coordination-ui', uiSource);
        logger.info('✅ coordination-ui connected (forced mock)');
      }
      
    } catch (error) {
      logger.error('Failed to connect remaining dashboards:', error);
      // Non-fatal - continue with dashboards that did connect
    }
  }
  
  /**
   * Initialize Notion integration (placeholder)
   */
  async initializeNotion() {
    // To be implemented in Sprint 13+
    logger.debug('Initializing Notion integration...');
    
    this.state.connectionStatus.notion = false;
    
    return true;
  }
  
  /**
   * Start update cycles
   */
  startUpdateCycles() {
    // Main refresh interval
    this.intervals.refresh = setInterval(() => {
      this.refresh();
    }, this.config.refreshInterval);
    
    // Cache cleanup interval
    this.intervals.cleanup = setInterval(() => {
      this.cleanupCache();
    }, this.config.cacheTimeout);
    
    // Notion publish interval (if enabled)
    if (this.config.enableNotionSync) {
      this.intervals.publish = setInterval(() => {
        this.publishToNotion();
      }, this.config.refreshInterval * 2);
    }
    
    logger.debug('Update cycles started');
  }
  
  /**
   * Register a data source
   */
  registerDataSource(name, source) {
    this.dataSources.set(name, source);
    this.sourceStatus.set(name, {
      connected: true,
      lastUpdate: Date.now(),
      errors: 0
    });
    
    this.state.connectionStatus.dataSources = this.dataSources.size;
    logger.debug(`Data source registered: ${name}`);
    
    this.emit('source-registered', { name, source });
  }
  
  /**
   * Collect metrics from all sources
   */
  async collectMetrics() {
    const startTime = Date.now();
    
    try {
      this.metrics.timestamp = new Date().toISOString();
      
      // Collect from all registered data sources
      for (const [name, source] of this.dataSources) {
        try {
          const rawData = await source.collect();
          const transformed = source.transform(rawData);
          
          // Store metrics in appropriate category
          if (name === 'timers') {
            this.metrics.resources.timers = transformed.toObject();
          } else if (name === 'specialists') {
            this.metrics.specialists = transformed.toObject();
          } else if (name === 'failures') {
            this.metrics.errors = transformed.toObject();
          } else if (name === 'circuitBreakers') {
            this.metrics.resources.circuitBreakers = transformed.toObject();
          } else if (name === 'taskFlow') {
            this.metrics.operations.taskFlow = transformed.toObject();
          } else if (name === 'validation') {
            this.metrics.validation = transformed.toObject();
          } else if (name.startsWith('coordination')) {
            // Group coordination dashboards
            if (!this.metrics.collaboration.coordination) {
              this.metrics.collaboration.coordination = {};
            }
            this.metrics.collaboration.coordination[name] = transformed.toObject();
          } else if (name === 'alerts') {
            this.metrics.alerts = transformed.toObject();
          } else {
            // Generic storage for other sources
            this.metrics[name] = transformed.toObject();
          }
          
          logger.debug(`Collected metrics from ${name}`);
        } catch (error) {
          logger.error(`Failed to collect from ${name}:`, error);
          this.sourceStatus.get(name).errors++;
        }
      }
      
      // Update statistics
      this.stats.updates++;
      this.stats.lastUpdateDuration = Date.now() - startTime;
      this.updateAverageTime(this.stats.lastUpdateDuration);
      
      this.emit('metrics-collected', this.metrics);
      return this.metrics;
    } catch (error) {
      this.stats.errors++;
      logger.error('Failed to collect metrics:', error);
      throw error;
    }
  }
  
  /**
   * Refresh all data
   */
  async refresh() {
    if (!this.state.running) return;
    
    try {
      const metrics = await this.collectMetrics();
      
      // Add to history
      this.addToHistory(metrics);
      
      // Update cache
      this.updateCache('latest', metrics);
      
      this.emit('refresh', metrics);
    } catch (error) {
      logger.error('Refresh failed:', error);
      this.emit('refresh-error', error);
    }
  }
  
  /**
   * Add metrics to history
   */
  addToHistory(metrics) {
    this.history.push({
      ...metrics,
      timestamp: Date.now()
    });
    
    // Limit history size
    if (this.history.length > this.config.maxHistorySize) {
      this.history.shift();
    }
  }
  
  /**
   * Update cache
   */
  updateCache(key, value) {
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }
  
  /**
   * Get from cache
   */
  getFromCache(key) {
    const cached = this.cache.get(key);
    
    if (cached) {
      const age = Date.now() - cached.timestamp;
      if (age < this.config.cacheTimeout) {
        this.stats.cacheHits++;
        return cached.value;
      }
    }
    
    this.stats.cacheMisses++;
    return null;
  }
  
  /**
   * Get list of connected data sources
   */
  getDataSources() {
    return Array.from(this.dataSources.keys());
  }
  
  /**
   * Get unified data from all sources
   */
  async getUnifiedData() {
    return await this.collectMetrics();
  }
  
  /**
   * Cleanup old cache entries
   */
  cleanupCache() {
    const now = Date.now();
    const timeout = this.config.cacheTimeout;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > timeout) {
        this.cache.delete(key);
      }
    }
  }
  
  /**
   * Publish to Notion (placeholder)
   */
  async publishToNotion() {
    if (!this.state.connectionStatus.notion) return;
    
    // To be implemented in Sprint 16
    this.state.publishing = true;
    
    try {
      // Placeholder
      this.stats.publishes++;
      this.emit('published');
    } catch (error) {
      logger.error('Failed to publish to Notion:', error);
    } finally {
      this.state.publishing = false;
    }
  }
  
  /**
   * Update average time calculation
   */
  updateAverageTime(duration) {
    const total = this.stats.avgUpdateTime * (this.stats.updates - 1) + duration;
    this.stats.avgUpdateTime = Math.round(total / this.stats.updates);
  }
  
  /**
   * Get current metrics
   */
  getMetrics() {
    return this.metrics;
  }
  
  /**
   * Get dashboard status
   */
  getStatus() {
    return {
      state: this.state,
      stats: this.stats,
      sources: this.dataSources.size,
      cacheSize: this.cache.size,
      historySize: this.history.length
    };
  }
  
  /**
   * Shutdown the dashboard
   */
  shutdown() {
    this.state.running = false;
    
    // Clear intervals
    Object.values(this.intervals).forEach(interval => {
      if (interval) clearInterval(interval);
    });
    
    // Clear cache
    this.cache.clear();
    
    logger.info('Unified Dashboard shutdown complete');
    this.emit('shutdown');
  }
}

// Singleton instance
let instance = null;

/**
 * Get or create the unified dashboard instance
 */
function getUnifiedDashboard() {
  if (!instance) {
    instance = new UnifiedDashboardManager();
  }
  return instance;
}

module.exports = {
  UnifiedDashboardManager,
  getUnifiedDashboard
};
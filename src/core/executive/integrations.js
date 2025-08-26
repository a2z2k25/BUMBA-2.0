/**
 * Executive Systems Integrations
 * Connectors for integrating Executive Systems with other Bumba components
 */

const EventEmitter = require('events');
const { logger } = require('../logging/bumba-logger');

/**
 * Integration types
 */
const IntegrationType = {
  SPECIALIST: 'specialist',
  MEMORY: 'memory',
  ANALYTICS: 'analytics',
  WORKFLOW: 'workflow',
  DEPARTMENT: 'department',
  MONITORING: 'monitoring'
};

/**
 * Integration status
 */
const IntegrationStatus = {
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  ERROR: 'error'
};

class ExecutiveIntegrationHub extends EventEmitter {
  constructor(config = {}) {
    super();
    this.setMaxListeners(10000);
    
    this.config = {
      enableAutoConnect: true,
      retryAttempts: 3,
      retryDelay: 1000,
      healthCheckInterval: 30000,
      ...config
    };
    
    // Integration registry
    this.integrations = new Map();
    this.connectors = new Map();
    this.status = new Map();
    
    // Performance tracking
    this.metrics = {
      connectionsEstablished: 0,
      connectionsFailed: 0,
      messagesExchanged: 0,
      averageLatency: 0
    };
    
    this.initializeIntegrations();
    
    logger.info('🔌 Executive Integration Hub initialized');
  }

  /**
   * Initialize default integrations
   */
  initializeIntegrations() {
    // Register default integrations
    this.registerIntegration(IntegrationType.SPECIALIST, {
      name: 'Specialist Systems',
      required: true,
      autoConnect: true
    });
    
    this.registerIntegration(IntegrationType.MEMORY, {
      name: 'Memory Systems',
      required: true,
      autoConnect: true
    });
    
    this.registerIntegration(IntegrationType.ANALYTICS, {
      name: 'Analytics Platform',
      required: false,
      autoConnect: true
    });
    
    this.registerIntegration(IntegrationType.WORKFLOW, {
      name: 'Workflow Engine',
      required: false,
      autoConnect: true
    });
    
    this.registerIntegration(IntegrationType.DEPARTMENT, {
      name: 'Department Systems',
      required: true,
      autoConnect: true
    });
    
    this.registerIntegration(IntegrationType.MONITORING, {
      name: 'Monitoring Systems',
      required: false,
      autoConnect: true
    });
    
    // Auto-connect if enabled
    if (this.config.enableAutoConnect) {
      this.connectAll();
    }
  }

  /**
   * Register an integration
   */
  registerIntegration(type, config) {
    this.integrations.set(type, {
      type,
      ...config,
      registered: Date.now()
    });
    
    this.status.set(type, IntegrationStatus.DISCONNECTED);
    
    logger.debug(`Integration registered: ${type}`);
  }

  /**
   * Connect to a specific integration
   */
  async connect(type, connector) {
    if (!this.integrations.has(type)) {
      throw new Error(`Unknown integration type: ${type}`);
    }
    
    const integration = this.integrations.get(type);
    this.status.set(type, IntegrationStatus.CONNECTING);
    
    try {
      // Validate connector
      if (!connector || typeof connector.connect !== 'function') {
        throw new Error('Invalid connector: missing connect method');
      }
      
      // Attempt connection with retries
      let connected = false;
      let lastError = null;
      
      for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
        try {
          await connector.connect();
          connected = true;
          break;
        } catch (error) {
          lastError = error;
          logger.warn(`Connection attempt ${attempt} failed for ${type}: ${error.message}`);
          
          if (attempt < this.config.retryAttempts) {
            await this.delay(this.config.retryDelay * attempt);
          }
        }
      }
      
      if (!connected) {
        throw lastError || new Error('Connection failed');
      }
      
      // Store connector
      this.connectors.set(type, connector);
      this.status.set(type, IntegrationStatus.CONNECTED);
      
      // Setup event handlers
      this.setupConnectorHandlers(type, connector);
      
      // Update metrics
      this.metrics.connectionsEstablished++;
      
      // Emit event
      this.emit('integration:connected', { type, integration });
      
      logger.info(`🏁 Integration connected: ${type}`);
      
      return {
        success: true,
        type,
        status: IntegrationStatus.CONNECTED
      };
      
    } catch (error) {
      this.status.set(type, IntegrationStatus.ERROR);
      this.metrics.connectionsFailed++;
      
      logger.error(`Failed to connect integration ${type}: ${error.message}`);
      
      this.emit('integration:error', { type, error: error.message });
      
      // Throw if required integration
      if (integration.required) {
        throw error;
      }
      
      return {
        success: false,
        type,
        status: IntegrationStatus.ERROR,
        error: error.message
      };
    }
  }

  /**
   * Connect all registered integrations
   */
  async connectAll() {
    const results = [];
    
    for (const [type, integration] of this.integrations) {
      if (integration.autoConnect) {
        // Create default connector
        const connector = this.createDefaultConnector(type);
        const result = await this.connect(type, connector);
        results.push(result);
      }
    }
    
    return results;
  }

  /**
   * Create default connector for integration type
   */
  createDefaultConnector(type) {
    switch (type) {
      case IntegrationType.SPECIALIST:
        return new SpecialistSystemConnector();
        
      case IntegrationType.MEMORY:
        return new MemorySystemConnector();
        
      case IntegrationType.ANALYTICS:
        return new AnalyticsConnector();
        
      case IntegrationType.WORKFLOW:
        return new WorkflowConnector();
        
      case IntegrationType.DEPARTMENT:
        return new DepartmentConnector();
        
      case IntegrationType.MONITORING:
        return new MonitoringConnector();
        
      default:
        return new BaseConnector(type);
    }
  }

  /**
   * Setup connector event handlers
   */
  setupConnectorHandlers(type, connector) {
    if (connector.on) {
      // Handle incoming messages
      connector.on('message', (message) => {
        this.handleIncomingMessage(type, message);
      });
      
      // Handle disconnection
      connector.on('disconnect', () => {
        this.handleDisconnection(type);
      });
      
      // Handle errors
      connector.on('error', (error) => {
        this.handleConnectorError(type, error);
      });
    }
  }

  /**
   * Handle incoming message from connector
   */
  handleIncomingMessage(type, message) {
    const timestamp = Date.now();
    
    // Update metrics
    this.metrics.messagesExchanged++;
    
    // Process message based on type
    const processed = this.processMessage(type, message);
    
    // Emit event
    this.emit('message:received', {
      type,
      message,
      processed,
      timestamp
    });
    
    // Update latency
    const latency = Date.now() - timestamp;
    this.updateAverageLatency(latency);
  }

  /**
   * Process message based on integration type
   */
  processMessage(type, message) {
    switch (type) {
      case IntegrationType.SPECIALIST:
        return this.processSpecialistMessage(message);
        
      case IntegrationType.MEMORY:
        return this.processMemoryMessage(message);
        
      case IntegrationType.ANALYTICS:
        return this.processAnalyticsMessage(message);
        
      case IntegrationType.WORKFLOW:
        return this.processWorkflowMessage(message);
        
      case IntegrationType.DEPARTMENT:
        return this.processDepartmentMessage(message);
        
      case IntegrationType.MONITORING:
        return this.processMonitoringMessage(message);
        
      default:
        return message;
    }
  }

  /**
   * Send message through integration
   */
  async sendMessage(type, message) {
    const connector = this.connectors.get(type);
    
    if (!connector) {
      throw new Error(`No connector for integration: ${type}`);
    }
    
    if (this.status.get(type) !== IntegrationStatus.CONNECTED) {
      throw new Error(`Integration not connected: ${type}`);
    }
    
    const timestamp = Date.now();
    
    try {
      // Send message
      const result = await connector.send(message);
      
      // Update metrics
      this.metrics.messagesExchanged++;
      
      // Calculate latency
      const latency = Date.now() - timestamp;
      this.updateAverageLatency(latency);
      
      // Emit event
      this.emit('message:sent', {
        type,
        message,
        result,
        latency
      });
      
      return result;
      
    } catch (error) {
      logger.error(`Failed to send message to ${type}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Broadcast message to multiple integrations
   */
  async broadcast(message, types = null) {
    const targets = types || Array.from(this.connectors.keys());
    const results = [];
    
    for (const type of targets) {
      try {
        const result = await this.sendMessage(type, message);
        results.push({ type, success: true, result });
      } catch (error) {
        results.push({ type, success: false, error: error.message });
      }
    }
    
    return results;
  }

  /**
   * Handle disconnection
   */
  handleDisconnection(type) {
    this.status.set(type, IntegrationStatus.DISCONNECTED);
    this.connectors.delete(type);
    
    this.emit('integration:disconnected', { type });
    
    logger.warn(`Integration disconnected: ${type}`);
    
    // Attempt reconnection if auto-connect enabled
    const integration = this.integrations.get(type);
    if (integration && integration.autoConnect && this.config.enableAutoConnect) {
      setTimeout(() => {
        const connector = this.createDefaultConnector(type);
        this.connect(type, connector);
      }, this.config.retryDelay);
    }
  }

  /**
   * Handle connector error
   */
  handleConnectorError(type, error) {
    logger.error(`Connector error for ${type}: ${error.message}`);
    
    this.emit('connector:error', { type, error: error.message });
    
    // Check if should disconnect
    if (error.fatal) {
      this.handleDisconnection(type);
    }
  }

  /**
   * Process specialist message
   */
  processSpecialistMessage(message) {
    return {
      ...message,
      processed: true,
      processedBy: 'executive',
      timestamp: Date.now()
    };
  }

  /**
   * Process memory message
   */
  processMemoryMessage(message) {
    return {
      ...message,
      stored: true,
      retrievable: true,
      timestamp: Date.now()
    };
  }

  /**
   * Process analytics message
   */
  processAnalyticsMessage(message) {
    return {
      ...message,
      analyzed: true,
      insights: [],
      timestamp: Date.now()
    };
  }

  /**
   * Process workflow message
   */
  processWorkflowMessage(message) {
    return {
      ...message,
      workflowId: `wf_${Date.now()}`,
      status: 'processing',
      timestamp: Date.now()
    };
  }

  /**
   * Process department message
   */
  processDepartmentMessage(message) {
    return {
      ...message,
      routed: true,
      department: message.department || 'executive',
      timestamp: Date.now()
    };
  }

  /**
   * Process monitoring message
   */
  processMonitoringMessage(message) {
    return {
      ...message,
      monitored: true,
      metrics: {},
      timestamp: Date.now()
    };
  }

  /**
   * Update average latency
   */
  updateAverageLatency(latency) {
    const count = this.metrics.messagesExchanged;
    const prevAvg = this.metrics.averageLatency;
    this.metrics.averageLatency = (prevAvg * (count - 1) + latency) / count;
  }

  /**
   * Get integration status
   */
  getStatus(type = null) {
    if (type) {
      return {
        type,
        status: this.status.get(type),
        connected: this.connectors.has(type)
      };
    }
    
    // Return all statuses
    const statuses = {};
    for (const [t, s] of this.status) {
      statuses[t] = {
        status: s,
        connected: this.connectors.has(t)
      };
    }
    
    return statuses;
  }

  /**
   * Get metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      totalIntegrations: this.integrations.size,
      connectedIntegrations: this.connectors.size,
      connectionRate: this.connectors.size / this.integrations.size
    };
  }

  /**
   * Health check
   */
  async healthCheck() {
    const results = {};
    
    for (const [type, connector] of this.connectors) {
      try {
        if (connector.healthCheck) {
          results[type] = await connector.healthCheck();
        } else {
          results[type] = { healthy: true };
        }
      } catch (error) {
        results[type] = { healthy: false, error: error.message };
      }
    }
    
    return results;
  }

  /**
   * Disconnect integration
   */
  async disconnect(type) {
    const connector = this.connectors.get(type);
    
    if (connector) {
      try {
        if (connector.disconnect) {
          await connector.disconnect();
        }
        
        this.connectors.delete(type);
        this.status.set(type, IntegrationStatus.DISCONNECTED);
        
        this.emit('integration:disconnected', { type, manual: true });
        
        logger.info(`Integration disconnected: ${type}`);
        
      } catch (error) {
        logger.error(`Error disconnecting ${type}: ${error.message}`);
        throw error;
      }
    }
  }

  /**
   * Disconnect all integrations
   */
  async disconnectAll() {
    const types = Array.from(this.connectors.keys());
    
    for (const type of types) {
      await this.disconnect(type);
    }
  }

  /**
   * Delay helper
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Base Connector Class
 */
class BaseConnector extends EventEmitter {
  constructor(type) {
    super();
    this.type = type;
    this.connected = false;
  }
  
  async connect() {
    this.connected = true;
    this.emit('connected');
    return true;
  }
  
  async disconnect() {
    this.connected = false;
    this.emit('disconnected');
    return true;
  }
  
  async send(message) {
    if (!this.connected) {
      throw new Error('Not connected');
    }
    return { sent: true, message };
  }
  
  async healthCheck() {
    return { healthy: this.connected };
  }
}

/**
 * Specialist System Connector
 */
class SpecialistSystemConnector extends BaseConnector {
  constructor() {
    super('specialist');
    this.specialists = new Map();
  }
  
  async connect() {
    await super.connect();
    
    // Simulate connecting to specialists
    this.specialists.set('technical', { status: 'ready' });
    this.specialists.set('strategic', { status: 'ready' });
    this.specialists.set('experience', { status: 'ready' });
    
    return true;
  }
  
  async requestSpecialist(type, request) {
    if (!this.connected) {
      throw new Error('Not connected to specialist systems');
    }
    
    const specialist = this.specialists.get(type);
    if (!specialist) {
      throw new Error(`Unknown specialist type: ${type}`);
    }
    
    // Simulate specialist response
    return {
      specialist: type,
      response: 'Specialist analysis complete',
      recommendations: [],
      confidence: 0.85
    };
  }
}

/**
 * Memory System Connector
 */
class MemorySystemConnector extends BaseConnector {
  constructor() {
    super('memory');
    this.memory = new Map();
  }
  
  async connect() {
    await super.connect();
    
    // Initialize memory stores
    this.memory.set('decisions', []);
    this.memory.set('strategies', []);
    this.memory.set('context', {});
    
    return true;
  }
  
  async store(key, value) {
    if (!this.connected) {
      throw new Error('Not connected to memory systems');
    }
    
    this.memory.set(key, value);
    return { stored: true, key };
  }
  
  async retrieve(key) {
    if (!this.connected) {
      throw new Error('Not connected to memory systems');
    }
    
    return this.memory.get(key);
  }
}

/**
 * Analytics Connector
 */
class AnalyticsConnector extends BaseConnector {
  constructor() {
    super('analytics');
    this.metrics = new Map();
  }
  
  async connect() {
    await super.connect();
    return true;
  }
  
  async track(event, data) {
    if (!this.connected) {
      throw new Error('Not connected to analytics');
    }
    
    const metric = {
      event,
      data,
      timestamp: Date.now()
    };
    
    if (!this.metrics.has(event)) {
      this.metrics.set(event, []);
    }
    
    this.metrics.get(event).push(metric);
    
    return { tracked: true, event };
  }
}

/**
 * Workflow Connector
 */
class WorkflowConnector extends BaseConnector {
  constructor() {
    super('workflow');
    this.workflows = new Map();
  }
  
  async connect() {
    await super.connect();
    return true;
  }
  
  async startWorkflow(type, params) {
    if (!this.connected) {
      throw new Error('Not connected to workflow engine');
    }
    
    const workflowId = `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.workflows.set(workflowId, {
      type,
      params,
      status: 'running',
      startTime: Date.now()
    });
    
    return { workflowId, status: 'started' };
  }
}

/**
 * Department Connector
 */
class DepartmentConnector extends BaseConnector {
  constructor() {
    super('department');
    this.departments = new Map();
  }
  
  async connect() {
    await super.connect();
    
    // Initialize departments
    this.departments.set('engineering', { status: 'active' });
    this.departments.set('product', { status: 'active' });
    this.departments.set('design', { status: 'active' });
    
    return true;
  }
  
  async routeToDepartment(department, message) {
    if (!this.connected) {
      throw new Error('Not connected to departments');
    }
    
    const dept = this.departments.get(department);
    if (!dept) {
      throw new Error(`Unknown department: ${department}`);
    }
    
    return {
      routed: true,
      department,
      messageId: `msg_${Date.now()}`
    };
  }
}

/**
 * Monitoring Connector
 */
class MonitoringConnector extends BaseConnector {
  constructor() {
    super('monitoring');
    this.monitors = new Map();
  }
  
  async connect() {
    await super.connect();
    return true;
  }
  
  async reportMetric(name, value) {
    if (!this.connected) {
      throw new Error('Not connected to monitoring');
    }
    
    if (!this.monitors.has(name)) {
      this.monitors.set(name, []);
    }
    
    this.monitors.get(name).push({
      value,
      timestamp: Date.now()
    });
    
    return { reported: true, metric: name };
  }
}

module.exports = {
  ExecutiveIntegrationHub,
  IntegrationType,
  IntegrationStatus,
  BaseConnector,
  SpecialistSystemConnector,
  MemorySystemConnector,
  AnalyticsConnector,
  WorkflowConnector,
  DepartmentConnector,
  MonitoringConnector
};
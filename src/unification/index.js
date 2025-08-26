/**
 * Unification Layer Index
 * Central entry point for all adapters
 * Part of Sprint 2: Safe Unification
 * 
 * IMPORTANT: This layer operates ALONGSIDE existing code
 * It does NOT modify or replace any existing functionality
 */

const DepartmentAdapter = require('./adapters/department-adapter');
const MemoryAdapter = require('./adapters/memory-adapter');
const OrchestrationAdapter = require('./adapters/orchestration-adapter');
const CommunicationAdapter = require('./adapters/communication-adapter');
const UnifiedBus = require('./integration/unified-bus');
const ContextBroker = require('./integration/context-broker');
const { logger } = require('../core/logging/bumba-logger');
const { EventEmitter } = require('events');

class UnificationLayer extends EventEmitter {
  constructor() {
    super();
    
    // Feature flags - ALL START DISABLED
    this.config = {
      enabled: false,
      components: {
        departments: false,
        memory: false,
        orchestration: false,
        communication: false,
        unifiedBus: false,
        contextBroker: false
      }
    };
    
    // Adapter instances (created but not enabled)
    this.adapters = {
      departments: new Map(),
      memory: null,
      orchestration: null,
      communication: null
    };
    
    // Unified Bus (created but not enabled)
    this.unifiedBus = null;
    
    // Context Broker (created but not enabled)
    this.contextBroker = null;
    
    // Metrics
    this.metrics = {
      adapterCount: 0,
      enabledCount: 0,
      messagesUnified: 0,
      contextsPreserved: 0
    };
    
    logger.info('🔮 UnificationLayer created (disabled by default)');
  }
  
  /**
   * Initialize with existing framework (READ-ONLY)
   */
  async initialize(framework) {
    if (!framework) {
      logger.warn('Cannot initialize UnificationLayer without framework');
      return false;
    }
    
    this.framework = framework;
    
    // Create adapters but DON'T enable them
    await this.createAdapters();
    
    logger.info('🟡 UnificationLayer initialized (adapters created but disabled)');
    return true;
  }
  
  /**
   * Create all adapters (but keep them disabled)
   */
  async createAdapters() {
    // Wrap departments if they exist
    if (this.framework.departments) {
      for (const [name, dept] of Object.entries(this.framework.departments)) {
        const adapter = new DepartmentAdapter(dept, name);
        this.adapters.departments.set(name, adapter);
        this.metrics.adapterCount++;
      }
    }
    
    // Wrap memory if it exists
    if (this.framework.memorySystem) {
      this.adapters.memory = new MemoryAdapter(this.framework.memorySystem);
      this.metrics.adapterCount++;
    }
    
    // Create orchestration adapter
    this.adapters.orchestration = new OrchestrationAdapter();
    if (this.framework.orchestrationHooks) {
      this.adapters.orchestration.registerOrchestrator(
        'hooks',
        this.framework.orchestrationHooks,
        1
      );
    }
    this.metrics.adapterCount++;
    
    // Create communication adapter
    this.adapters.communication = new CommunicationAdapter();
    if (this.framework.communicationSystem) {
      this.adapters.communication.registerSystem(
        'main',
        this.framework.communicationSystem
      );
    }
    this.metrics.adapterCount++;
    
    // Create unified bus
    this.unifiedBus = new UnifiedBus();
    this.connectBusToFramework();
    
    // Create context broker
    this.contextBroker = new ContextBroker();
    this.connectBrokerToMemory();
    
    logger.info(`🔧 Created ${this.metrics.adapterCount} adapters, unified bus, and context broker (all disabled)`);
  }
  
  /**
   * Connect unified bus to framework systems (listen only)
   */
  connectBusToFramework() {
    if (!this.unifiedBus || !this.framework) return;
    
    // Connect to framework core (if EventEmitter)
    if (this.framework.on && typeof this.framework.on === 'function') {
      this.unifiedBus.connectToExisting('framework', this.framework, [
        'initialized', 'command:before', 'command:after', 'shutdown'
      ]);
    }
    
    // Connect to departments
    if (this.framework.departments) {
      for (const [name, dept] of Object.entries(this.framework.departments)) {
        if (dept && dept.on && typeof dept.on === 'function') {
          this.unifiedBus.connectToExisting(`dept:${name}`, dept, [
            'specialist:selected', 'task:assigned', 'task:complete'
          ]);
        }
      }
    }
    
    // Connect to orchestration
    if (this.framework.orchestrationHooks && this.framework.orchestrationHooks.on) {
      this.unifiedBus.connectToExisting('orchestration', this.framework.orchestrationHooks, [
        'task:created', 'task:complete', 'milestone:reached'
      ]);
    }
    
    // Connect to memory
    if (this.framework.memorySystem && this.framework.memorySystem.on) {
      this.unifiedBus.connectToExisting('memory', this.framework.memorySystem, [
        'memory:stored', 'memory:retrieved', 'context:transferred'
      ]);
    }
  }
  
  /**
   * Connect context broker to memory systems (read-only)
   */
  connectBrokerToMemory() {
    if (!this.contextBroker || !this.framework) return;
    
    // Register memory systems for read-only access
    if (this.framework.memorySystem) {
      this.contextBroker.registerMemorySystem('main', this.framework.memorySystem, {
        primary: true
      });
    }
    
    // Register any additional memory tiers
    if (this.framework.memory) {
      if (this.framework.memory.shortTerm) {
        this.contextBroker.registerMemorySystem('stm', this.framework.memory.shortTerm);
      }
      if (this.framework.memory.workingMemory) {
        this.contextBroker.registerMemorySystem('wm', this.framework.memory.workingMemory);
      }
      if (this.framework.memory.longTerm) {
        this.contextBroker.registerMemorySystem('ltm', this.framework.memory.longTerm);
      }
    }
  }
  
  /**
   * Enable specific component (opt-in)
   */
  enableComponent(componentName) {
    if (!this.config.components.hasOwnProperty(componentName)) {
      logger.warn(`Unknown component: ${componentName}`);
      return false;
    }
    
    // Mark component as enabled in config
    this.config.components[componentName] = true;
    
    // Enable corresponding adapters
    switch(componentName) {
      case 'departments':
        for (const adapter of this.adapters.departments.values()) {
          adapter.enable();
          this.metrics.enabledCount++;
        }
        break;
        
      case 'memory':
        if (this.adapters.memory) {
          this.adapters.memory.enable();
          this.metrics.enabledCount++;
        }
        break;
        
      case 'orchestration':
        if (this.adapters.orchestration) {
          this.adapters.orchestration.enable();
          this.metrics.enabledCount++;
        }
        break;
        
      case 'communication':
        if (this.adapters.communication) {
          this.adapters.communication.enable();
          this.metrics.enabledCount++;
        }
        break;
        
      case 'unifiedBus':
        if (this.unifiedBus) {
          this.unifiedBus.enable();
          this.metrics.enabledCount++;
        }
        break;
        
      case 'contextBroker':
        if (this.contextBroker) {
          this.contextBroker.enable();
          this.metrics.enabledCount++;
        }
        break;
    }
    
    logger.info(`🏁 Enabled component: ${componentName}`);
    this.emit('component:enabled', { component: componentName });
    
    return true;
  }
  
  /**
   * Disable specific component (instant rollback)
   */
  disableComponent(componentName) {
    if (!this.config.components.hasOwnProperty(componentName)) {
      logger.warn(`Unknown component: ${componentName}`);
      return false;
    }
    
    // Mark component as disabled
    this.config.components[componentName] = false;
    
    // Disable corresponding adapters
    switch(componentName) {
      case 'departments':
        for (const adapter of this.adapters.departments.values()) {
          adapter.disable();
          this.metrics.enabledCount--;
        }
        break;
        
      case 'memory':
        if (this.adapters.memory) {
          this.adapters.memory.disable();
          this.metrics.enabledCount--;
        }
        break;
        
      case 'orchestration':
        if (this.adapters.orchestration) {
          this.adapters.orchestration.disable();
          this.metrics.enabledCount--;
        }
        break;
        
      case 'communication':
        if (this.adapters.communication) {
          this.adapters.communication.disable();
          this.metrics.enabledCount--;
        }
        break;
        
      case 'unifiedBus':
        if (this.unifiedBus) {
          this.unifiedBus.disable();
          this.metrics.enabledCount--;
        }
        break;
        
      case 'contextBroker':
        if (this.contextBroker) {
          this.contextBroker.disable();
          this.metrics.enabledCount--;
        }
        break;
    }
    
    logger.info(`🔌 Disabled component: ${componentName}`);
    this.emit('component:disabled', { component: componentName });
    
    return true;
  }
  
  /**
   * Enable entire unification layer (opt-in)
   */
  enable() {
    if (this.config.enabled) return;
    
    this.config.enabled = true;
    
    // Enable all components
    for (const component of Object.keys(this.config.components)) {
      this.enableComponent(component);
    }
    
    logger.info('🟢 UnificationLayer enabled');
    this.emit('unification:enabled');
  }
  
  /**
   * Disable entire unification layer (instant rollback)
   */
  disable() {
    if (!this.config.enabled) return;
    
    this.config.enabled = false;
    
    // Disable all components
    for (const component of Object.keys(this.config.components)) {
      this.disableComponent(component);
    }
    
    logger.info('⏹️ UnificationLayer disabled');
    this.emit('unification:disabled');
  }
  
  /**
   * Get unified context (combines all adapters)
   */
  async getUnifiedContext(taskId) {
    const context = {
      task: taskId,
      timestamp: Date.now(),
      departments: {},
      memory: null,
      orchestration: null,
      communication: null
    };
    
    // Gather from department adapters
    if (this.config.components.departments) {
      for (const [name, adapter] of this.adapters.departments) {
        if (adapter.enabled) {
          context.departments[name] = adapter.retrieveContext(taskId);
        }
      }
    }
    
    // Gather from memory adapter
    if (this.config.components.memory && this.adapters.memory?.enabled) {
      context.memory = await this.adapters.memory.retrieve(`context:${taskId}`);
    }
    
    // Gather orchestration status
    if (this.config.components.orchestration && this.adapters.orchestration?.enabled) {
      context.orchestration = this.adapters.orchestration.getMetrics();
    }
    
    // Gather communication history
    if (this.config.components.communication && this.adapters.communication?.enabled) {
      context.communication = this.adapters.communication.getHistory({
        since: Date.now() - 300000 // Last 5 minutes
      });
    }
    
    this.metrics.contextsPreserved++;
    return context;
  }
  
  /**
   * Transfer context between agents (unified handoff)
   */
  async transferContext(fromAgent, toAgent, taskId) {
    const transfers = [];
    
    // Transfer through memory adapter
    if (this.config.components.memory && this.adapters.memory?.enabled) {
      const result = await this.adapters.memory.transferContext(
        fromAgent,
        toAgent,
        taskId
      );
      transfers.push({ type: 'memory', result });
    }
    
    // Transfer through department contexts
    if (this.config.components.departments) {
      for (const [name, adapter] of this.adapters.departments) {
        if (adapter.enabled) {
          const context = adapter.retrieveContext(taskId);
          if (context) {
            adapter.storeContext(`${toAgent}:${taskId}`, context);
            transfers.push({ type: 'department', name, success: true });
          }
        }
      }
    }
    
    this.emit('context:transferred', {
      from: fromAgent,
      to: toAgent,
      taskId,
      transfers
    });
    
    return transfers;
  }
  
  /**
   * Send unified message (through all channels)
   */
  async sendUnifiedMessage(message, options = {}) {
    const results = [];
    
    // Send through communication adapter
    if (this.config.components.communication && this.adapters.communication?.enabled) {
      const sent = await this.adapters.communication.broadcast(message, options);
      results.push({ type: 'broadcast', sent });
    }
    
    // Notify departments
    if (this.config.components.departments) {
      for (const [name, adapter] of this.adapters.departments) {
        if (adapter.enabled) {
          adapter.emit('unified:message', message);
          results.push({ type: 'department', name, notified: true });
        }
      }
    }
    
    this.metrics.messagesUnified++;
    return results;
  }
  
  /**
   * Get unified metrics from all adapters
   */
  getMetrics() {
    const metrics = {
      layer: {
        enabled: this.config.enabled,
        components: { ...this.config.components },
        ...this.metrics
      },
      adapters: {}
    };
    
    // Collect from departments
    if (this.adapters.departments.size > 0) {
      metrics.adapters.departments = {};
      for (const [name, adapter] of this.adapters.departments) {
        metrics.adapters.departments[name] = adapter.getUnifiedMetrics();
      }
    }
    
    // Collect from other adapters
    if (this.adapters.memory) {
      metrics.adapters.memory = this.adapters.memory.getMetrics();
    }
    
    if (this.adapters.orchestration) {
      metrics.adapters.orchestration = this.adapters.orchestration.getMetrics();
    }
    
    if (this.adapters.communication) {
      metrics.adapters.communication = this.adapters.communication.getMetrics();
    }
    
    return metrics;
  }
  
  /**
   * Health check for all adapters
   */
  isHealthy() {
    const health = {
      layer: true,
      adapters: {}
    };
    
    // Check departments
    for (const [name, adapter] of this.adapters.departments) {
      health.adapters[`department:${name}`] = adapter.isHealthy();
    }
    
    // Check other adapters
    if (this.adapters.memory) {
      health.adapters.memory = this.adapters.memory.isHealthy();
    }
    
    if (this.adapters.orchestration) {
      health.adapters.orchestration = this.adapters.orchestration.isHealthy();
    }
    
    if (this.adapters.communication) {
      health.adapters.communication = this.adapters.communication.isHealthy();
    }
    
    if (this.unifiedBus) {
      health.adapters.unifiedBus = this.unifiedBus.isHealthy();
    }
    
    if (this.contextBroker) {
      health.adapters.contextBroker = this.contextBroker.isHealthy();
    }
    
    // Overall health
    health.overall = Object.values(health.adapters).every(
      h => h && h.adapterHealthy
    );
    
    return health;
  }
  
  /**
   * Complete rollback of unification layer
   */
  rollback() {
    logger.warn('🔄 Rolling back UnificationLayer...');
    
    // Rollback all adapters
    for (const adapter of this.adapters.departments.values()) {
      adapter.rollback();
    }
    
    if (this.adapters.memory) {
      this.adapters.memory.rollback();
    }
    
    if (this.adapters.orchestration) {
      this.adapters.orchestration.rollback();
    }
    
    if (this.adapters.communication) {
      this.adapters.communication.rollback();
    }
    
    // Reset config
    this.config.enabled = false;
    for (const key of Object.keys(this.config.components)) {
      this.config.components[key] = false;
    }
    
    // Reset metrics
    this.metrics = {
      adapterCount: 0,
      enabledCount: 0,
      messagesUnified: 0,
      contextsPreserved: 0
    };
    
    logger.info('↩️ UnificationLayer rolled back completely');
    this.emit('unification:rolledback');
  }
}

// Export singleton instance
const unificationLayer = new UnificationLayer();

module.exports = {
  UnificationLayer,
  unificationLayer,
  DepartmentAdapter,
  MemoryAdapter,
  OrchestrationAdapter,
  CommunicationAdapter
};
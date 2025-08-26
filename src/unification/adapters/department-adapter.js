/**
 * Department Adapter
 * Wraps existing department managers without modifying them
 * Part of Sprint 2: Safe Unification
 */

const { EventEmitter } = require('events');
const { logger } = require('../../core/logging/bumba-logger');

class DepartmentAdapter extends EventEmitter {
  constructor(existingDepartment, departmentName) {
    super();
    
    // Wrap existing department WITHOUT modifying it
    this.wrapped = existingDepartment;
    this.departmentName = departmentName;
    this.adapterVersion = '1.0.0';
    this.enabled = false; // Start disabled for safety
    
    // Store original methods for rollback
    this.originalMethods = {};
    this.preserveOriginalMethods();
    
    // Adapter-specific enhancements (don't affect original)
    this.unifiedInterface = {
      metrics: {
        tasksProcessed: 0,
        contextHandoffs: 0,
        errors: 0
      },
      connections: new Map(),
      contextBuffer: new Map()
    };
    
    logger.info(`🔌 DepartmentAdapter created for ${departmentName} (disabled by default)`);
  }
  
  /**
   * Preserve original methods for rollback capability
   */
  preserveOriginalMethods() {
    // Create snapshot of original methods
    const prototype = Object.getPrototypeOf(this.wrapped);
    const methods = Object.getOwnPropertyNames(prototype);
    
    methods.forEach(method => {
      if (typeof this.wrapped[method] === 'function') {
        this.originalMethods[method] = this.wrapped[method].bind(this.wrapped);
      }
    });
  }
  
  /**
   * Enable adapter (opt-in)
   */
  enable() {
    if (this.enabled) return;
    
    this.enabled = true;
    this.attachListeners();
    logger.info(`🏁 DepartmentAdapter enabled for ${this.departmentName}`);
    this.emit('adapter:enabled', { department: this.departmentName });
  }
  
  /**
   * Disable adapter (instant rollback)
   */
  disable() {
    if (!this.enabled) return;
    
    this.enabled = false;
    this.removeAllListeners();
    logger.info(`🔌 DepartmentAdapter disabled for ${this.departmentName}`);
    this.emit('adapter:disabled', { department: this.departmentName });
  }
  
  /**
   * Attach listeners to wrapped department WITHOUT modifying it
   */
  attachListeners() {
    // Listen to existing events if department is an EventEmitter
    if (this.wrapped.on && typeof this.wrapped.on === 'function') {
      // Listen without modifying
      this.wrapped.on('task:assigned', (data) => {
        if (this.enabled) {
          this.handleTaskAssigned(data);
        }
      });
      
      this.wrapped.on('task:complete', (data) => {
        if (this.enabled) {
          this.handleTaskComplete(data);
        }
      });
    }
  }
  
  /**
   * Execute task through wrapped department
   * Calls original method, adds unified tracking
   */
  async execute(task, context = {}) {
    // Always use original method
    const result = await this.wrapped.execute(task, context);
    
    // Add unified tracking if enabled
    if (this.enabled) {
      this.unifiedInterface.metrics.tasksProcessed++;
      this.emit('unified:task:executed', {
        department: this.departmentName,
        task,
        result,
        timestamp: Date.now()
      });
    }
    
    return result;
  }
  
  /**
   * Get specialist through wrapped department
   */
  async selectSpecialist(task) {
    // Use original selection logic
    if (this.wrapped.selectSpecialist) {
      return await this.wrapped.selectSpecialist(task);
    }
    
    // Fallback if method doesn't exist
    return null;
  }
  
  /**
   * Handle task assigned (adapter enhancement)
   */
  handleTaskAssigned(data) {
    // Track in unified interface
    this.emit('unified:task:assigned', {
      department: this.departmentName,
      ...data
    });
  }
  
  /**
   * Handle task complete (adapter enhancement)
   */
  handleTaskComplete(data) {
    // Track in unified interface
    this.emit('unified:task:complete', {
      department: this.departmentName,
      ...data
    });
  }
  
  /**
   * Get unified metrics (adapter-specific)
   */
  getUnifiedMetrics() {
    if (!this.enabled) {
      return { enabled: false, message: 'Adapter disabled' };
    }
    
    return {
      department: this.departmentName,
      adapterVersion: this.adapterVersion,
      metrics: this.unifiedInterface.metrics,
      connectionCount: this.unifiedInterface.connections.size,
      contextBufferSize: this.unifiedInterface.contextBuffer.size
    };
  }
  
  /**
   * Connect to another adapter (for future inter-department communication)
   */
  connectTo(otherAdapter) {
    if (!this.enabled) {
      logger.warn(`Cannot connect - ${this.departmentName} adapter disabled`);
      return false;
    }
    
    const connectionId = `${this.departmentName}->${otherAdapter.departmentName}`;
    this.unifiedInterface.connections.set(connectionId, {
      target: otherAdapter,
      established: Date.now(),
      messageCount: 0
    });
    
    logger.info(`🔗 Connected ${connectionId}`);
    return true;
  }
  
  /**
   * Store context for handoff (adapter enhancement)
   */
  storeContext(taskId, context) {
    if (!this.enabled) return;
    
    this.unifiedInterface.contextBuffer.set(taskId, {
      context,
      timestamp: Date.now(),
      department: this.departmentName
    });
  }
  
  /**
   * Retrieve context for handoff
   */
  retrieveContext(taskId) {
    if (!this.enabled) return null;
    
    return this.unifiedInterface.contextBuffer.get(taskId);
  }
  
  /**
   * Rollback to original (safety mechanism)
   */
  rollback() {
    this.disable();
    
    // Clear all adapter-specific data
    this.unifiedInterface.metrics = {
      tasksProcessed: 0,
      contextHandoffs: 0,
      errors: 0
    };
    this.unifiedInterface.connections.clear();
    this.unifiedInterface.contextBuffer.clear();
    
    logger.info(`↩️ DepartmentAdapter rolled back for ${this.departmentName}`);
  }
  
  /**
   * Health check
   */
  isHealthy() {
    return {
      adapterHealthy: true,
      enabled: this.enabled,
      wrappedHealthy: this.wrapped !== null,
      department: this.departmentName
    };
  }
  
  /**
   * Get wrapped department (for direct access if needed)
   */
  getWrapped() {
    return this.wrapped;
  }
  
  /**
   * Proxy any method calls to wrapped department
   * This ensures compatibility even for methods we don't explicitly handle
   */
  callWrappedMethod(methodName, ...args) {
    if (typeof this.wrapped[methodName] === 'function') {
      return this.wrapped[methodName](...args);
    }
    
    throw new Error(`Method ${methodName} not found on wrapped department`);
  }
}

module.exports = DepartmentAdapter;
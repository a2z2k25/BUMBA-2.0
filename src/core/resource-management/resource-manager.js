/**
 * BUMBA Resource Management System
 * Memory, CPU, and concurrency management with garbage collection
 */

const fs = require('fs');
const { logger } = require('../logging/bumba-logger');

const path = require('path');
const { BumbaError, BumbaErrorBoundary } = require('../error-handling/bumba-error-system');

/**
 * Resource Manager with intelligent allocation and cleanup
 */
class ResourceManager {
  constructor() {
    this.limits = {
      maxAgents: 10,
      maxMemoryMB: 512,
      maxConcurrentTasks: 20,
      maxCacheSize: 100, // MB
      maxLogFiles: 10,
      maxFileHandles: 50
    };
    
    this.usage = {
      agents: 0,
      memoryMB: 0,
      tasks: 0,
      cacheSize: 0,
      fileHandles: 0
    };
    
    this.resources = {
      agents: new Map(),
      tasks: new Map(),
      cache: new Map(),
      fileHandles: new Set(),
      timers: new Set()
    };
    
    this.gcConfig = {
      interval: 60000, // 1 minute
      aggressiveThreshold: 0.8, // 80% of memory limit
      forceGcThreshold: 0.9 // 90% of memory limit
    };
    
    this.metrics = {
      allocations: 0,
      deallocations: 0,
      gcRuns: 0,
      rejections: 0,
      lastGc: Date.now()
    };
    
    this.startResourceMonitoring();
  }

  /**
   * Request resources with validation
   */
  async requestResources(type, amount, identifier = null) {
    const requestId = this.generateRequestId();
    
    try {
      // Check if allocation is possible
      if (!this.canAllocate(type, amount)) {
        // Try garbage collection first
        await this.garbageCollect();
        
        // Check again after GC
        if (!this.canAllocate(type, amount)) {
          this.metrics.rejections++;
          throw new BumbaError('RESOURCE_EXHAUSTED', 
            `Cannot allocate ${amount} ${type} - limit exceeded`);
        }
      }
      
      // Allocate resources
      const allocation = await this.allocateResource(type, amount, identifier, requestId);
      
      this.metrics.allocations++;
      logger.info(`🟢 Allocated ${amount} ${type} (${allocation.id})`);
      
      return allocation;
      
    } catch (error) {
      logger.error(`🔴 Resource allocation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check if resource allocation is possible
   */
  canAllocate(type, amount) {
    const currentUsage = this.usage[type] || 0;
    const limit = this.limits[`max${this.capitalize(type)}`] || this.limits.maxMemoryMB;
    
    return (currentUsage + amount) <= limit;
  }

  /**
   * Allocate specific resource type
   */
  async allocateResource(type, amount, identifier, requestId) {
    const allocation = {
      id: requestId,
      type: type,
      amount: amount,
      identifier: identifier,
      allocated_at: Date.now(),
      last_used: Date.now()
    };

    switch (type) {
      case 'agents':
        return this.allocateAgent(allocation);
      case 'memoryMB':
        return this.allocateMemory(allocation);
      case 'tasks':
        return this.allocateTask(allocation);
      case 'cacheSize':
        return this.allocateCache(allocation);
      default:
        throw new BumbaError('INVALID_RESOURCE_TYPE', `Unknown resource type: ${type}`);
    }
  }

  allocateAgent(allocation) {
    this.resources.agents.set(allocation.id, allocation);
    this.usage.agents += allocation.amount;
    
    return {
      ...allocation,
      release: () => this.releaseAgent(allocation.id)
    };
  }

  allocateMemory(allocation) {
    this.usage.memoryMB += allocation.amount;
    
    return {
      ...allocation,
      release: () => this.releaseMemory(allocation.id, allocation.amount)
    };
  }

  allocateTask(allocation) {
    this.resources.tasks.set(allocation.id, allocation);
    this.usage.tasks += allocation.amount;
    
    return {
      ...allocation,
      release: () => this.releaseTask(allocation.id)
    };
  }

  allocateCache(allocation) {
    this.resources.cache.set(allocation.id, allocation);
    this.usage.cacheSize += allocation.amount;
    
    return {
      ...allocation,
      release: () => this.releaseCache(allocation.id)
    };
  }

  /**
   * Release resources
   */
  async releaseResource(allocationId) {
    try {
      // Find and release the resource
      let released = false;
      
      if (this.resources.agents.has(allocationId)) {
        await this.releaseAgent(allocationId);
        released = true;
      }
      
      if (this.resources.tasks.has(allocationId)) {
        await this.releaseTask(allocationId);
        released = true;
      }
      
      if (this.resources.cache.has(allocationId)) {
        await this.releaseCache(allocationId);
        released = true;
      }
      
      if (released) {
        this.metrics.deallocations++;
        logger.info(`🟢 Released resource: ${allocationId}`);
      }
      
      return released;
      
    } catch (error) {
      logger.error(`🔴 Resource release failed: ${error.message}`);
      throw error;
    }
  }

  async releaseAgent(allocationId) {
    const allocation = this.resources.agents.get(allocationId);
    if (allocation) {
      this.usage.agents -= allocation.amount;
      this.resources.agents.delete(allocationId);
    }
  }

  async releaseMemory(allocationId, amount) {
    this.usage.memoryMB -= amount;
  }

  async releaseTask(allocationId) {
    const allocation = this.resources.tasks.get(allocationId);
    if (allocation) {
      this.usage.tasks -= allocation.amount;
      this.resources.tasks.delete(allocationId);
    }
  }

  async releaseCache(allocationId) {
    const allocation = this.resources.cache.get(allocationId);
    if (allocation) {
      this.usage.cacheSize -= allocation.amount;
      this.resources.cache.delete(allocationId);
    }
  }

  /**
   * Comprehensive garbage collection
   */
  async garbageCollect(aggressive = false) {
    const startTime = Date.now();
    logger.info(`🟢 Starting ${aggressive ? 'aggressive' : 'standard'} garbage collection...`);
    
    try {
      let freed = 0;
      
      // Clean up inactive agents
      freed += await this.cleanupInactiveAgents();
      
      // Clean up expired cache entries
      freed += await this.cleanupExpiredCache();
      
      // Clean up completed tasks
      freed += await this.cleanupCompletedTasks();
      
      // Clean up file handles
      freed += await this.cleanupFileHandles();
      
      // Clean up timers
      freed += await this.cleanupTimers();
      
      if (aggressive) {
        // Force garbage collection if available
        if (global.gc) {
          global.gc();
          logger.info('🟢 Forced V8 garbage collection');
        }
        
        // Clear additional caches
        freed += await this.aggressiveCleanup();
      }
      
      const duration = Date.now() - startTime;
      this.metrics.gcRuns++;
      this.metrics.lastGc = Date.now();
      
      logger.info(`🏁 Garbage collection completed: freed ${freed} MB in ${duration}ms`);
      
      return { freed, duration };
      
    } catch (error) {
      logger.error(`🔴 Garbage collection failed: ${error.message}`);
      throw error;
    }
  }

  async cleanupInactiveAgents() {
    const inactiveThreshold = 5 * 60 * 1000; // 5 minutes
    const now = Date.now();
    let freed = 0;
    
    for (const [id, allocation] of this.resources.agents) {
      if (now - allocation.last_used > inactiveThreshold) {
        await this.releaseAgent(id);
        freed += allocation.amount;
      }
    }
    
    return freed;
  }

  async cleanupExpiredCache() {
    const expireThreshold = 10 * 60 * 1000; // 10 minutes
    const now = Date.now();
    let freed = 0;
    
    for (const [id, allocation] of this.resources.cache) {
      if (now - allocation.allocated_at > expireThreshold) {
        await this.releaseCache(id);
        freed += allocation.amount;
      }
    }
    
    return freed;
  }

  async cleanupCompletedTasks() {
    let freed = 0;
    
    for (const [id, allocation] of this.resources.tasks) {
      // Simple heuristic: tasks older than 30 seconds are likely completed
      if (Date.now() - allocation.allocated_at > 30000) {
        await this.releaseTask(id);
        freed += allocation.amount;
      }
    }
    
    return freed;
  }

  async cleanupFileHandles() {
    let freed = 0;
    
    // Clean up any tracked file handles
    for (const handle of this.resources.fileHandles) {
      try {
        if (handle.close && typeof handle.close === 'function') {
          handle.close();
          this.resources.fileHandles.delete(handle);
          freed++;
        }
      } catch (error) {
        // Handle may already be closed
      }
    }
    
    return freed;
  }

  async cleanupTimers() {
    let freed = 0;
    
    // Clean up any tracked timers
    for (const timer of this.resources.timers) {
      try {
        clearTimeout(timer);
        clearInterval(timer);
        this.resources.timers.delete(timer);
        freed++;
      } catch (error) {
        // Timer may already be cleared
      }
    }
    
    return freed;
  }

  async aggressiveCleanup() {
    let freed = 0;
    
    // Clear all non-essential caches
    this.resources.cache.clear();
    freed += this.usage.cacheSize;
    this.usage.cacheSize = 0;
    
    // Force cleanup of require cache for non-core modules
    const coreModules = new Set(['fs', 'path', 'util', 'crypto']);
    Object.keys(require.cache).forEach(key => {
      const moduleName = path.basename(key, '.js');
      if (!coreModules.has(moduleName) && !key.includes('node_modules')) {
        delete require.cache[key];
      }
    });
    
    return freed;
  }

  /**
   * Start background resource monitoring
   */
  startResourceMonitoring() {
    // Monitor memory usage and trigger GC when needed
    const monitorInterval = setInterval(async () => {
      await this.monitorResources();
    }, this.gcConfig.interval);
    
    this.resources.timers.add(monitorInterval);
    logger.info('🟢 Resource monitoring started');
  }

  async monitorResources() {
    const memoryUsage = process.memoryUsage();
    const currentMemoryMB = memoryUsage.heapUsed / 1024 / 1024;
    
    // Update current memory usage
    this.usage.memoryMB = Math.round(currentMemoryMB);
    
    const memoryRatio = currentMemoryMB / this.limits.maxMemoryMB;
    
    if (memoryRatio > this.gcConfig.forceGcThreshold) {
      // Force aggressive garbage collection
      await this.garbageCollect(true);
    } else if (memoryRatio > this.gcConfig.aggressiveThreshold) {
      // Standard garbage collection
      await this.garbageCollect(false);
    }
    
    // Log resource usage periodically
    if (this.metrics.gcRuns % 10 === 0) {
      logger.info(`🟢 Resource usage: ${Math.round(memoryRatio * 100)}% memory, ${this.usage.agents} agents, ${this.usage.tasks} tasks`);
    }
  }

  /**
   * Get current resource usage
   */
  getResourceUsage() {
    const memoryUsage = process.memoryUsage();
    
    return {
      usage: {
        ...this.usage,
        actualMemoryMB: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        totalMemoryMB: Math.round(memoryUsage.rss / 1024 / 1024)
      },
      limits: this.limits,
      utilization: {
        agents: (this.usage.agents / this.limits.maxAgents) * 100,
        memory: (this.usage.memoryMB / this.limits.maxMemoryMB) * 100,
        tasks: (this.usage.tasks / this.limits.maxConcurrentTasks) * 100,
        cache: (this.usage.cacheSize / this.limits.maxCacheSize) * 100
      },
      metrics: this.metrics,
      last_check: new Date().toISOString()
    };
  }

  /**
   * Update resource limits
   */
  updateLimits(newLimits) {
    const validLimits = ['maxAgents', 'maxMemoryMB', 'maxConcurrentTasks', 'maxCacheSize'];
    
    for (const [key, value] of Object.entries(newLimits)) {
      if (validLimits.includes(key) && typeof value === 'number' && value > 0) {
        this.limits[key] = value;
        logger.info(`🟢 Updated ${key} limit to ${value}`);
      }
    }
  }

  /**
   * Generate unique request ID
   */
  generateRequestId() {
    return `res_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Cleanup all resources on shutdown
   */
  async shutdown() {
    logger.info('🟢 Shutting down resource manager...');
    
    // Clear all timers
    for (const timer of this.resources.timers) {
      clearTimeout(timer);
      clearInterval(timer);
    }
    
    // Close all file handles
    for (const handle of this.resources.fileHandles) {
      try {
        if (handle.close) {handle.close();}
      } catch (error) {
        // Ignore errors during shutdown
      }
    }
    
    // Final garbage collection
    await this.garbageCollect(true);
    
    logger.info('🏁 Resource manager shutdown completed');
  }

  /**
   * Allocate resources (public interface)
   */
  async allocate(type, amount, options = {}) {
    return this.requestResources(type, amount, options.identifier);
  }

  /**
   * Release resources (public interface)
   */
  async release(allocationId) {
    return this.releaseResource(allocationId);
  }

  /**
   * Track resource usage
   */
  track(type, identifier, metadata = {}) {
    const trackingId = this.generateRequestId();
    
    if (!this.resources[type]) {
      this.resources[type] = new Map();
    }
    
    const tracking = {
      id: trackingId,
      type,
      identifier,
      metadata,
      startTime: Date.now(),
      lastAccess: Date.now()
    };
    
    this.resources[type].set(trackingId, tracking);
    
    return trackingId;
  }

  /**
   * Set resource limit
   */
  setLimit(type, limit) {
    const oldLimit = this.limits[type];
    
    if (typeof limit !== 'number' || limit <= 0) {
      throw new Error(`Invalid limit for ${type}: ${limit}`);
    }
    
    this.limits[type] = limit;
    
    logger.info(`Resource limit changed: ${type} from ${oldLimit} to ${limit}`);
    
    // Check if current usage exceeds new limit
    if (this.usage[type] > limit) {
      logger.warn(`Current usage of ${type} (${this.usage[type]}) exceeds new limit (${limit})`);
      // Trigger cleanup
      this.garbageCollect(true);
    }
    
    return true;
  }

  /**
   * Cleanup resources
   */
  async cleanup(aggressive = false) {
    logger.info(`Starting resource cleanup (aggressive: ${aggressive})`);
    
    const cleanupResults = {
      agents: 0,
      tasks: 0,
      cache: 0,
      memory: 0,
      fileHandles: 0
    };
    
    // Cleanup agents
    cleanupResults.agents = await this.cleanupInactiveAgents();
    
    // Cleanup tasks
    cleanupResults.tasks = await this.cleanupCompletedTasks();
    
    // Cleanup cache
    cleanupResults.cache = await this.cleanupExpiredCache();
    
    // Cleanup file handles
    cleanupResults.fileHandles = await this.cleanupFileHandles();
    
    // Force garbage collection if aggressive
    if (aggressive && global.gc) {
      global.gc();
      cleanupResults.memory = 'forced';
    }
    
    logger.info('Resource cleanup completed:', cleanupResults);
    
    return cleanupResults;
  }

  /**
   * Start monitoring resources
   */
  monitor(interval = 5000) {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    
    this.monitoringInterval = setInterval(() => {
      const status = this.getResourceUsage();
      
      // Check for high usage
      for (const [resource, usage] of Object.entries(status.usage)) {
        if (status.limits[resource]) {
          const percentage = (usage / status.limits[resource]) * 100;
          if (percentage > 80) {
            logger.warn(`High ${resource} usage: ${percentage.toFixed(1)}%`);
          }
        }
      }
      
      // Emit monitoring event
      if (this.emit) {
        this.emit('monitor', status);
      }
    }, interval);
    
    logger.info(`Resource monitoring started (interval: ${interval}ms)`);
    
    return true;
  }
}

/**
 * Resource Pool for object reuse
 */
class ResourcePool {
  constructor(factory, maxSize = 10) {
    this.factory = factory;
    this.maxSize = maxSize;
    this.available = [];
    this.inUse = new Set();
  }

  async acquire() {
    if (this.available.length > 0) {
      const resource = this.available.pop();
      this.inUse.add(resource);
      return resource;
    }
    
    if (this.inUse.size < this.maxSize) {
      const resource = await this.factory();
      this.inUse.add(resource);
      return resource;
    }
    
    throw new BumbaError('POOL_EXHAUSTED', 'Resource pool exhausted');
  }

  release(resource) {
    if (this.inUse.has(resource)) {
      this.inUse.delete(resource);
      
      if (this.available.length < this.maxSize / 2) {
        this.available.push(resource);
      }
    }
  }

  getStats() {
    return {
      available: this.available.length,
      inUse: this.inUse.size,
      maxSize: this.maxSize
    };
  }
}

// Export singleton instance
const resourceManager = new ResourceManager();

module.exports = {
  ResourceManager,
  ResourcePool,
  resourceManager
};
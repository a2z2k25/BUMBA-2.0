/**
 * BUMBA Unified Memory Layer
 * Abstraction over all memory systems with intelligent routing and synchronization
 */

const crypto = require('crypto');
const zlib = require('zlib');
const { promisify } = require('util');
const { EventEmitter } = require('events');

const { BumbaTeamMemory } = require('../../utils/teamMemory');
const MemoryManager = require('../resource-management/memory-manager');
const { mcpServerManager } = require('../mcp/mcp-resilience-system');
const { logger } = require('../logging/bumba-logger');

const gzipAsync = promisify(zlib.gzip);
const gunzipAsync = promisify(zlib.gunzip);

class UnifiedMemoryLayer extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      encryption: {
        enabled: config.encryption?.enabled ?? true,
        algorithm: config.encryption?.algorithm ?? 'aes-256-gcm',
        keyDerivation: config.encryption?.keyDerivation ?? 'scrypt'
      },
      compression: {
        enabled: config.compression?.enabled ?? true,
        threshold: config.compression?.threshold ?? 1024, // 1KB
        level: config.compression?.level ?? 6
      },
      caching: {
        maxSize: config.caching?.maxSize ?? 1000,
        ttl: config.caching?.ttl ?? 3600000, // 1 hour
        distributed: config.caching?.distributed ?? false
      },
      synchronization: {
        enabled: config.synchronization?.enabled ?? true,
        interval: config.synchronization?.interval ?? 5000, // 5 seconds
        conflictResolution: config.synchronization?.conflictResolution ?? 'last-write-wins'
      },
      pooling: {
        enabled: config.pooling?.enabled ?? true,
        maxPoolSize: config.pooling?.maxPoolSize ?? 100,
        objectTypes: config.pooling?.objectTypes ?? ['context', 'handoff', 'knowledge']
      }
    };

    // Initialize subsystems
    this.teamMemory = new BumbaTeamMemory();
    this.resourceManager = MemoryManager.getInstance();
    this.mcpManager = mcpServerManager;
    
    // Memory stores
    this.stores = new Map([
      ['persistent', new PersistentMemoryStore(this)],
      ['runtime', new RuntimeMemoryStore(this)],
      ['distributed', new DistributedMemoryStore(this)],
      ['mcp', new MCPMemoryStore(this)]
    ]);
    
    // Caching layers
    this.l1Cache = new Map(); // In-memory cache
    this.l2Cache = null; // Distributed cache (Redis/etc)
    
    // Object pools
    this.objectPools = new Map();
    
    // Synchronization
    this.syncQueue = [];
    this.syncInProgress = false;
    
    // Security
    this.encryptionKey = this.deriveEncryptionKey();
    
    // Track intervals for cleanup
    this.intervals = new Set();
    
    // Initialize
    this.initialize();
  }

  async initialize() {
    logger.info('🏁 Initializing Unified Memory Layer');
    
    // Initialize object pools
    if (this.config.pooling.enabled) {
      this.initializeObjectPools();
    }
    
    // Initialize distributed cache if enabled
    if (this.config.caching.distributed) {
      await this.initializeDistributedCache();
    }
    
    // Start synchronization if enabled
    if (this.config.synchronization.enabled) {
      this.startSynchronization();
    }
    
    // Set up memory pressure handling
    this.resourceManager.on('memory-warning', () => this.handleMemoryPressure('warning'));
    this.resourceManager.on('memory-critical', () => this.handleMemoryPressure('critical'));
    
    logger.info('🏁 Unified Memory Layer initialized');
  }

  /**
   * Store data with automatic routing to appropriate memory store
   */
  async store(key, data, options = {}) {
    const storeOptions = {
      type: options.type || 'auto',
      ttl: options.ttl || null,
      persistent: options.persistent ?? true,
      encrypted: options.encrypted ?? this.shouldEncrypt(data),
      compressed: options.compressed ?? this.shouldCompress(data),
      tags: options.tags || [],
      priority: options.priority || 'normal'
    };

    try {
      // Prepare data
      let processedData = data;
      
      // Compress if needed
      if (storeOptions.compressed) {
        processedData = await this.compress(processedData);
      }
      
      // Encrypt if needed
      if (storeOptions.encrypted) {
        processedData = await this.encrypt(processedData);
      }
      
      // Create memory entry
      const entry = {
        key,
        data: processedData,
        metadata: {
          created: Date.now(),
          accessed: Date.now(),
          size: this.estimateSize(processedData),
          compressed: storeOptions.compressed,
          encrypted: storeOptions.encrypted,
          tags: storeOptions.tags,
          priority: storeOptions.priority,
          checksum: this.calculateChecksum(processedData)
        },
        options: storeOptions
      };
      
      // Store in L1 cache
      this.l1Cache.set(key, entry);
      
      // Route to appropriate stores
      const storeTypes = this.determineStores(storeOptions);
      const storePromises = [];
      
      for (const storeType of storeTypes) {
        const store = this.stores.get(storeType);
        if (store) {
          storePromises.push(store.set(key, entry));
        }
      }
      
      await Promise.all(storePromises);
      
      // Queue for synchronization
      if (this.config.synchronization.enabled) {
        this.queueSync({ operation: 'store', key, entry });
      }
      
      // Emit event
      this.emit('data-stored', { key, size: entry.metadata.size, stores: storeTypes });
      
      return { success: true, key, stores: storeTypes };
      
    } catch (error) {
      logger.error(`Failed to store data for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Retrieve data with automatic fallback through memory hierarchy
   */
  async retrieve(key, options = {}) {
    try {
      // Check L1 cache first
      if (this.l1Cache.has(key)) {
        const entry = this.l1Cache.get(key);
        entry.metadata.accessed = Date.now();
        return await this.processRetrievedData(entry);
      }
      
      // Check L2 cache if available
      if (this.l2Cache) {
        const l2Entry = await this.l2Cache.get(key);
        if (l2Entry) {
          this.l1Cache.set(key, l2Entry);
          return await this.processRetrievedData(l2Entry);
        }
      }
      
      // Search through stores in priority order
      const searchOrder = options.searchOrder || ['mcp', 'persistent', 'runtime', 'distributed'];
      
      for (const storeType of searchOrder) {
        const store = this.stores.get(storeType);
        if (store) {
          try {
            const entry = await store.get(key);
            if (entry) {
              // Update caches
              this.l1Cache.set(key, entry);
              if (this.l2Cache) {
                await this.l2Cache.set(key, entry);
              }
              
              return await this.processRetrievedData(entry);
            }
          } catch (error) {
            logger.warn(`Failed to retrieve from ${storeType} store:`, error);
          }
        }
      }
      
      return null;
      
    } catch (error) {
      logger.error(`Failed to retrieve data for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Process retrieved data (decrypt, decompress)
   */
  async processRetrievedData(entry) {
    let data = entry.data;
    
    // Decrypt if needed
    if (entry.metadata.encrypted) {
      data = await this.decrypt(data);
    }
    
    // Decompress if needed
    if (entry.metadata.compressed) {
      data = await this.decompress(data);
    }
    
    // Verify checksum
    const currentChecksum = this.calculateChecksum(entry.data);
    if (currentChecksum !== entry.metadata.checksum) {
      logger.warn(`Checksum mismatch for key ${entry.key}`);
    }
    
    return {
      key: entry.key,
      data,
      metadata: entry.metadata
    };
  }

  /**
   * Delete data from all stores
   */
  async delete(key) {
    // Remove from caches
    this.l1Cache.delete(key);
    if (this.l2Cache) {
      await this.l2Cache.delete(key);
    }
    
    // Remove from all stores
    const deletePromises = [];
    for (const [, store] of this.stores) {
      deletePromises.push(store.delete(key));
    }
    
    await Promise.all(deletePromises);
    
    // Queue for synchronization
    if (this.config.synchronization.enabled) {
      this.queueSync({ operation: 'delete', key });
    }
    
    this.emit('data-deleted', { key });
  }

  /**
   * Determine which stores to use based on options
   */
  determineStores(options) {
    const stores = [];
    
    if (options.type === 'auto') {
      // Intelligent routing based on data characteristics
      if (options.persistent) {
        stores.push('persistent');
        if (this.mcpManager.getSystemHealth().essential_health > 0.8) {
          stores.push('mcp');
        }
      }
      
      stores.push('runtime');
      
      if (this.config.caching.distributed) {
        stores.push('distributed');
      }
    } else {
      // Explicit store type
      stores.push(options.type);
    }
    
    return stores;
  }

  /**
   * Initialize object pools for memory efficiency
   */
  initializeObjectPools() {
    for (const objectType of this.config.pooling.objectTypes) {
      this.objectPools.set(objectType, new ObjectPool(objectType, {
        maxSize: this.config.pooling.maxPoolSize, factory: () => this.createPooledObject(objectType),
        reset: (obj) => this.resetPooledObject(objectType, obj)
      }));
    }
  }

  /**
   * Get object from pool
   */
  getFromPool(type) {
    const pool = this.objectPools.get(type);
    return pool ? pool.acquire() : null;
  }

  /**
   * Return object to pool
   */
  returnToPool(type, object) {
    const pool = this.objectPools.get(type);
    if (pool) {
      pool.release(object);
    }
  }

  /**
   * Create pooled object
   */
  createPooledObject(type) {
    switch (type) {
      case 'context':
        return {
          id: null,
          timestamp: null,
          data: {},
          metadata: {}
        };
      case 'handoff':
        return {
          from: null,
          to: null,
          context: {},
          priority: 'normal',
          artifacts: []
        };
      case 'knowledge':
        return {
          type: null,
          content: {},
          relations: [],
          confidence: 0
        };
      default:
        return {};
    }
  }

  /**
   * Reset pooled object for reuse
   */
  resetPooledObject(type, obj) {
    switch (type) {
      case 'context':
        obj.id = null;
        obj.timestamp = null;
        obj.data = {};
        obj.metadata = {};
        break;
      case 'handoff':
        obj.from = null;
        obj.to = null;
        obj.context = {};
        obj.priority = 'normal';
        obj.artifacts = [];
        break;
      case 'knowledge':
        obj.type = null;
        obj.content = {};
        obj.relations = [];
        obj.confidence = 0;
        break;
    }
  }

  /**
   * Compression utilities
   */
  async compress(data) {
    const jsonString = JSON.stringify(data);
    if (jsonString.length < this.config.compression.threshold) {
      return data;
    }
    
    const compressed = await gzipAsync(jsonString, {
      level: this.config.compression.level
    });
    
    return {
      compressed: true,
      data: compressed.toString('base64')
    };
  }

  async decompress(data) {
    if (!data.compressed) {
      return data;
    }
    
    const buffer = Buffer.from(data.data, 'base64');
    const decompressed = await gunzipAsync(buffer);
    return JSON.parse(decompressed.toString());
  }

  /**
   * Encryption utilities
   */
  deriveEncryptionKey() {
    // In production, this should use proper key management
    const salt = crypto.randomBytes(32);
    return crypto.scryptSync(process.env.BUMBA_MEMORY_KEY || 'default-key', salt, 32);
  }

  async encrypt(data) {
    if (!this.config.encryption.enabled) {
      return data;
    }
    
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.config.encryption.algorithm, this.encryptionKey, iv);
    
    const jsonString = JSON.stringify(data);
    let encrypted = cipher.update(jsonString, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted: true,
      data: encrypted,
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64')
    };
  }

  async decrypt(data) {
    if (!data.encrypted) {
      return data;
    }
    
    const decipher = crypto.createDecipheriv(
      this.config.encryption.algorithm,
      this.encryptionKey,
      Buffer.from(data.iv, 'base64')
    );
    
    decipher.setAuthTag(Buffer.from(data.authTag, 'base64'));
    
    let decrypted = decipher.update(data.data, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  }

  /**
   * Synchronization system
   */
  startSynchronization() {
    const syncInterval = setInterval(() => {
      if (!this.syncInProgress && this.syncQueue.length > 0) {
        this.processSyncQueue();
      }
    }, this.config.synchronization.interval);
    this.intervals.add(syncInterval);
  }

  queueSync(operation) {
    this.syncQueue.push({
      ...operation,
      timestamp: Date.now()
    });
  }

  async processSyncQueue() {
    this.syncInProgress = true;
    const batch = this.syncQueue.splice(0, 100); // Process in batches
    
    try {
      // Group by operation type
      const grouped = batch.reduce((acc, op) => {
        if (!acc[op.operation]) {acc[op.operation] = [];}
        acc[op.operation].push(op);
        return acc;
      }, {});
      
      // Process each operation type
      for (const [operation, ops] of Object.entries(grouped)) {
        await this.syncOperation(operation, ops);
      }
      
    } catch (error) {
      logger.error('Synchronization error:', error);
      // Re-queue failed operations
      this.syncQueue.unshift(...batch);
    } finally {
      this.syncInProgress = false;
    }
  }

  async syncOperation(operation, ops) {
    switch (operation) {
      case 'store':
        await this.syncStoreOperations(ops);
        break;
      case 'delete':
        await this.syncDeleteOperations(ops);
        break;
    }
  }

  /**
   * Memory pressure handling
   */
  async handleMemoryPressure(level) {
    logger.warn(`Memory pressure detected: ${level}`);
    
    if (level === 'warning') {
      // Evict low-priority items from L1 cache
      this.evictLowPriorityItems(0.2); // Remove 20%
    } else if (level === 'critical') {
      // Aggressive cleanup
      this.l1Cache.clear();
      
      // Return all pooled objects
      for (const [, pool] of this.objectPools) {
        pool.clear();
      }
      
      // Notify stores to cleanup
      for (const [, store] of this.stores) {
        if (store.cleanup) {
          await store.cleanup();
        }
      }
    }
  }

  evictLowPriorityItems(percentage) {
    const targetSize = Math.floor(this.l1Cache.size * (1 - percentage));
    const entries = Array.from(this.l1Cache.entries());
    
    // Sort by priority and access time
    entries.sort((a, b) => {
      const priorityDiff = this.getPriorityValue(a[1].options.priority) - 
                          this.getPriorityValue(b[1].options.priority);
      if (priorityDiff !== 0) {return priorityDiff;}
      
      return a[1].metadata.accessed - b[1].metadata.accessed;
    });
    
    // Remove lowest priority items
    while (this.l1Cache.size > targetSize && entries.length > 0) {
      const [key] = entries.shift();
      this.l1Cache.delete(key);
    }
  }

  getPriorityValue(priority) {
    const values = { low: 1, normal: 2, high: 3, critical: 4 };
    return values[priority] || 2;
  }

  /**
   * Utility methods
   */
  shouldEncrypt(data) {
    // Detect sensitive data patterns
    const sensitive = ['password', 'token', 'secret', 'key', 'credential'];
    const dataString = JSON.stringify(data).toLowerCase();
    
    return sensitive.some(term => dataString.includes(term));
  }

  shouldCompress(data) {
    const size = this.estimateSize(data);
    return size > this.config.compression.threshold;
  }

  estimateSize(data) {
    try {
      return JSON.stringify(data).length * 2; // Rough estimate for Unicode
    } catch (error) {
      return 1024; // Default 1KB
    }
  }

  calculateChecksum(data) {
    const hash = crypto.createHash('sha256');
    hash.update(JSON.stringify(data));
    return hash.digest('hex');
  }

  /**
   * Get memory statistics
   */
  getStats() {
    return {
      l1_cache_size: this.l1Cache.size,
      l2_cache_available: !!this.l2Cache,
      stores_active: Array.from(this.stores.keys()),
      sync_queue_length: this.syncQueue.length,
      pools_active: this.objectPools.size,
      resource_manager_stats: this.resourceManager.getStats(),
      mcp_health: this.mcpManager.getSystemHealth()
    };
  }
  
  /**
   * Clean up resources and stop all intervals
   */
  async cleanup() {
    // Clear all intervals
    for (const interval of this.intervals) {
      clearInterval(interval);
    }
    this.intervals.clear();
    
    // Clear caches
    this.l1Cache.clear();
    
    // Remove all event listeners
    this.removeAllListeners();
    
    logger.info('🟢 Unified memory layer cleaned up');
  }
}

/**
 * Memory store implementations
 */
class PersistentMemoryStore {
  constructor(memoryLayer) {
    this.memoryLayer = memoryLayer;
    this.teamMemory = memoryLayer.teamMemory;
  }

  async set(key, entry) {
    const context = this.teamMemory.getTeamContext();
    if (!context) {return false;}
    
    context.sharedContext[key] = {
      type: 'unified_memory',
      entry: entry,
      stored_at: Date.now()
    };
    
    return this.teamMemory.saveContext(context);
  }

  async get(key) {
    const context = this.teamMemory.getTeamContext();
    if (!context || !context.sharedContext[key]) {return null;}
    
    return context.sharedContext[key].entry;
  }

  async delete(key) {
    const context = this.teamMemory.getTeamContext();
    if (!context) {return false;}
    
    delete context.sharedContext[key];
    return this.teamMemory.saveContext(context);
  }
}

class RuntimeMemoryStore {
  constructor(memoryLayer) {
    this.memoryLayer = memoryLayer;
    this.store = new Map();
  }

  async set(key, entry) {
    this.store.set(key, entry);
    
    // Register with resource manager
    this.memoryLayer.resourceManager.registerResource(`runtime_${key}`, entry, {
        type: 'memory_entry', ttl: entry.options.ttl, cleanup: () => this.store.delete(key)
      }
    );
    
    return true;
  }

  async get(key) {
    return this.store.get(key);
  }

  async delete(key) {
    this.store.delete(key);
    this.memoryLayer.resourceManager.freeResource(`runtime_${key}`);
    return true;
  }

  async cleanup() {
    this.store.clear();
  }
}

class DistributedMemoryStore {
  constructor(memoryLayer) {
    this.memoryLayer = memoryLayer;
    // In production, this would connect to Redis/Memcached
    this.store = new Map();
  }

  async set(key, entry) {
    // Simulate distributed storage
    this.store.set(key, {
      ...entry,
      node: process.env.NODE_ID || 'default',
      replicated: false
    });
    return true;
  }

  async get(key) {
    return this.store.get(key);
  }

  async delete(key) {
    return this.store.delete(key);
  }
}

class MCPMemoryStore {
  constructor(memoryLayer) {
    this.memoryLayer = memoryLayer;
    this.mcpManager = memoryLayer.mcpManager;
  }

  async set(key, entry) {
    try {
      const memoryServer = await this.mcpManager.getServer('memory');
      const result = await memoryServer.execute('store', {
        key: key,
        value: entry,
        options: entry.options
      });
      
      return result.success;
    } catch (error) {
      logger.warn('MCP memory store failed, using fallback:', error);
      return false;
    }
  }

  async get(key) {
    try {
      const memoryServer = await this.mcpManager.getServer('memory');
      const result = await memoryServer.execute('retrieve', { key });
      
      return result.success ? result.data : null;
    } catch (error) {
      logger.warn('MCP memory retrieve failed:', error);
      return null;
    }
  }

  async delete(key) {
    try {
      const memoryServer = await this.mcpManager.getServer('memory');
      const result = await memoryServer.execute('delete', { key });
      
      return result.success;
    } catch (error) {
      logger.warn('MCP memory delete failed:', error);
      return false;
    }
  }
}

/**
 * Object pool implementation
 */
class ObjectPool {
  constructor(type, options) {
    this.type = type;
    this.options = options;
    this.available = [];
    this.inUse = new Set();
  }

  acquire() {
    let obj;
    
    if (this.available.length > 0) {
      obj = this.available.pop();
    } else if (this.inUse.size < this.options.maxSize) {
      obj = this.options.factory();
    } else {
      throw new Error(`Object pool ${this.type} exhausted`);
    }
    
    this.inUse.add(obj);
    return obj;
  }

  release(obj) {
    if (!this.inUse.has(obj)) {return;}
    
    this.inUse.delete(obj);
    this.options.reset(obj);
    this.available.push(obj);
  }

  clear() {
    this.available = [];
    this.inUse.clear();
  }
}

// Export singleton instance
let instance = null;

module.exports = {
  UnifiedMemoryLayer,
  
  getInstance(config) {
    if (!instance) {
      instance = new UnifiedMemoryLayer(config);
    }
    return instance;
  },
  
  // Convenience methods
  store: async (key, data, options) => {
    if (!instance) {
      instance = new UnifiedMemoryLayer();
    }
    return instance.store(key, data, options);
  },
  
  retrieve: async (key, options) => {
    if (!instance) {
      instance = new UnifiedMemoryLayer();
    }
    return instance.retrieve(key, options);
  },
  
  delete: async (key) => {
    if (!instance) {
      instance = new UnifiedMemoryLayer();
    }
    return instance.delete(key);
  }
};
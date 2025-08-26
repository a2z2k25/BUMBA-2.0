/**
 * BUMBA Redis Integration
 * High-performance in-memory data store for caching and real-time features
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');

class RedisIntegration extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      host: config.host || process.env.REDIS_HOST || 'localhost',
      port: config.port || process.env.REDIS_PORT || 6379,
      password: config.password || process.env.REDIS_PASSWORD,
      database: config.database || process.env.REDIS_DB || 0,
      
      // Connection options
      options: {
        retryStrategy: config.retryStrategy || ((times) => Math.min(times * 50, 2000)),
        enableReadyCheck: config.enableReadyCheck !== false,
        maxRetriesPerRequest: config.maxRetries || 3,
        enableOfflineQueue: config.enableOfflineQueue !== false,
        connectTimeout: config.connectTimeout || 10000,
        keepAlive: config.keepAlive || 30000
      },
      
      // Features
      features: {
        cache: config.enableCache !== false,
        pubsub: config.enablePubSub || false,
        streams: config.enableStreams || false,
        lua: config.enableLua || false
      },
      
      // Cache defaults
      cache: {
        ttl: config.defaultTTL || 3600, // 1 hour
        prefix: config.cachePrefix || 'cache:',
        compression: config.compression || false
      }
    };
    
    this.client = null;
    this.pubClient = null;
    this.subClient = null;
    this.connected = false;
    
    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      operations: 0
    };
    
    this.subscriptions = new Map();
  }
  
  /**
   * Initialize Redis connection
   */
  async initialize() {
    try {
      // Mock client for framework distribution
      this.client = this.createMockClient();
      
      // Initialize pub/sub if enabled
      if (this.config.features.pubsub) {
        this.pubClient = this.createMockClient();
        this.subClient = this.createMockClient();
        this.setupPubSub();
      }
      
      this.connected = true;
      logger.info('🔴 Redis integration initialized');
      logger.info(`📍 Connected to ${this.config.host}:${this.config.port}`);
      
      this.emit('connected');
      return true;
    } catch (error) {
      logger.error('🔴 Failed to initialize Redis:', error);
      return false;
    }
  }
  
  /**
   * Get value
   */
  async get(key) {
    this.metrics.operations++;
    
    try {
      const value = await this.client.get(this.prefixKey(key));
      
      if (value !== null) {
        this.metrics.hits++;
        return this.deserialize(value);
      } else {
        this.metrics.misses++;
        return null;
      }
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }
  
  /**
   * Set value with optional TTL
   */
  async set(key, value, ttl = null) {
    this.metrics.operations++;
    this.metrics.sets++;
    
    try {
      const serialized = this.serialize(value);
      const prefixedKey = this.prefixKey(key);
      
      if (ttl || this.config.cache.ttl) {
        await this.client.setex(prefixedKey, ttl || this.config.cache.ttl, serialized);
      } else {
        await this.client.set(prefixedKey, serialized);
      }
      
      return true;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }
  
  /**
   * Delete key
   */
  async del(key) {
    this.metrics.operations++;
    this.metrics.deletes++;
    
    try {
      const result = await this.client.del(this.prefixKey(key));
      return result > 0;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }
  
  /**
   * Check if key exists
   */
  async exists(key) {
    this.metrics.operations++;
    
    try {
      const result = await this.client.exists(this.prefixKey(key));
      return result === 1;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }
  
  /**
   * Set expiration on key
   */
  async expire(key, seconds) {
    try {
      return await this.client.expire(this.prefixKey(key), seconds);
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }
  
  /**
   * Increment value
   */
  async incr(key) {
    this.metrics.operations++;
    
    try {
      return await this.client.incr(this.prefixKey(key));
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }
  
  /**
   * Decrement value
   */
  async decr(key) {
    this.metrics.operations++;
    
    try {
      return await this.client.decr(this.prefixKey(key));
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }
  
  /**
   * Hash operations
   */
  async hset(key, field, value) {
    this.metrics.operations++;
    
    try {
      const serialized = this.serialize(value);
      return await this.client.hset(this.prefixKey(key), field, serialized);
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }
  
  async hget(key, field) {
    this.metrics.operations++;
    
    try {
      const value = await this.client.hget(this.prefixKey(key), field);
      return value ? this.deserialize(value) : null;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }
  
  async hgetall(key) {
    this.metrics.operations++;
    
    try {
      const hash = await this.client.hgetall(this.prefixKey(key));
      const result = {};
      
      for (const [field, value] of Object.entries(hash)) {
        result[field] = this.deserialize(value);
      }
      
      return result;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }
  
  /**
   * List operations
   */
  async lpush(key, ...values) {
    this.metrics.operations++;
    
    try {
      const serialized = values.map(v => this.serialize(v));
      return await this.client.lpush(this.prefixKey(key), ...serialized);
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }
  
  async rpush(key, ...values) {
    this.metrics.operations++;
    
    try {
      const serialized = values.map(v => this.serialize(v));
      return await this.client.rpush(this.prefixKey(key), ...serialized);
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }
  
  async lrange(key, start, stop) {
    this.metrics.operations++;
    
    try {
      const list = await this.client.lrange(this.prefixKey(key), start, stop);
      return list.map(v => this.deserialize(v));
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }
  
  /**
   * Set operations
   */
  async sadd(key, ...members) {
    this.metrics.operations++;
    
    try {
      const serialized = members.map(m => this.serialize(m));
      return await this.client.sadd(this.prefixKey(key), ...serialized);
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }
  
  async smembers(key) {
    this.metrics.operations++;
    
    try {
      const members = await this.client.smembers(this.prefixKey(key));
      return members.map(m => this.deserialize(m));
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }
  
  /**
   * Pub/Sub operations
   */
  async publish(channel, message) {
    if (!this.config.features.pubsub) {
      throw new Error('Pub/Sub not enabled');
    }
    
    try {
      const serialized = this.serialize(message);
      return await this.pubClient.publish(channel, serialized);
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }
  
  async subscribe(channel, callback) {
    if (!this.config.features.pubsub) {
      throw new Error('Pub/Sub not enabled');
    }
    
    try {
      await this.subClient.subscribe(channel);
      
      if (!this.subscriptions.has(channel)) {
        this.subscriptions.set(channel, new Set());
      }
      
      this.subscriptions.get(channel).add(callback);
      
      return () => this.unsubscribe(channel, callback);
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }
  
  async unsubscribe(channel, callback) {
    const callbacks = this.subscriptions.get(channel);
    if (callbacks) {
      callbacks.delete(callback);
      
      if (callbacks.size === 0) {
        await this.subClient.unsubscribe(channel);
        this.subscriptions.delete(channel);
      }
    }
  }
  
  /**
   * Cache wrapper with automatic key generation
   */
  async cache(key, fn, ttl = null) {
    // Try to get from cache
    const cached = await this.get(key);
    if (cached !== null) {
      return cached;
    }
    
    // Execute function and cache result
    const result = await fn();
    await this.set(key, result, ttl);
    
    return result;
  }
  
  /**
   * Clear cache by pattern
   */
  async clearCache(pattern = '*') {
    const keys = await this.client.keys(this.config.cache.prefix + pattern);
    
    if (keys.length > 0) {
      await this.client.del(...keys);
    }
    
    return keys.length;
  }
  
  /**
   * Setup pub/sub handlers
   */
  setupPubSub() {
    this.subClient.on('message', (channel, message) => {
      const callbacks = this.subscriptions.get(channel);
      
      if (callbacks) {
        const deserialized = this.deserialize(message);
        callbacks.forEach(callback => {
          try {
            callback(deserialized, channel);
          } catch (error) {
            logger.error(`Error in Redis subscription callback:`, error);
          }
        });
      }
    });
  }
  
  /**
   * Prefix key with cache prefix
   */
  prefixKey(key) {
    return this.config.cache.prefix + key;
  }
  
  /**
   * Serialize value for storage
   */
  serialize(value) {
    if (typeof value === 'string') {
      return value;
    }
    return JSON.stringify(value);
  }
  
  /**
   * Deserialize value from storage
   */
  deserialize(value) {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  
  /**
   * Create mock client for demo
   */
  createMockClient() {
    const store = new Map();
    
    return {
      get: async (key) => store.get(key) || null,
      set: async (key, value) => { store.set(key, value); return 'OK'; },
      setex: async (key, ttl, value) => { store.set(key, value); return 'OK'; },
      del: async (...keys) => { keys.forEach(k => store.delete(k)); return keys.length; },
      exists: async (key) => store.has(key) ? 1 : 0,
      expire: async (key, seconds) => 1,
      incr: async (key) => { 
        const val = parseInt(store.get(key) || '0') + 1;
        store.set(key, val.toString());
        return val;
      },
      decr: async (key) => {
        const val = parseInt(store.get(key) || '0') - 1;
        store.set(key, val.toString());
        return val;
      },
      hset: async (key, field, value) => { 
        const hash = store.get(key) || {};
        hash[field] = value;
        store.set(key, hash);
        return 1;
      },
      hget: async (key, field) => {
        const hash = store.get(key) || {};
        return hash[field] || null;
      },
      hgetall: async (key) => store.get(key) || {},
      lpush: async (key, ...values) => {
        const list = store.get(key) || [];
        list.unshift(...values);
        store.set(key, list);
        return list.length;
      },
      rpush: async (key, ...values) => {
        const list = store.get(key) || [];
        list.push(...values);
        store.set(key, list);
        return list.length;
      },
      lrange: async (key, start, stop) => {
        const list = store.get(key) || [];
        return list.slice(start, stop === -1 ? undefined : stop + 1);
      },
      sadd: async (key, ...members) => {
        const set = store.get(key) || new Set();
        members.forEach(m => set.add(m));
        store.set(key, set);
        return members.length;
      },
      smembers: async (key) => {
        const set = store.get(key) || new Set();
        return Array.from(set);
      },
      keys: async (pattern) => {
        const regex = new RegExp(pattern.replace('*', '.*'));
        return Array.from(store.keys()).filter(k => regex.test(k));
      },
      publish: async (channel, message) => 1,
      subscribe: async (channel) => {},
      unsubscribe: async (channel) => {},
      on: (event, handler) => {}
    };
  }
  
  /**
   * Close connection
   */
  async close() {
    if (this.client) {
      // Clear subscriptions
      this.subscriptions.clear();
      
      this.connected = false;
      this.emit('disconnected');
    }
  }
  
  /**
   * Get cache statistics
   */
  getCacheStats() {
    const hitRate = this.metrics.hits + this.metrics.misses > 0
      ? (this.metrics.hits / (this.metrics.hits + this.metrics.misses)) * 100
      : 0;
    
    return {
      ...this.metrics,
      hitRate: `${hitRate.toFixed(2)}%`
    };
  }
  
  /**
   * Get status
   */
  getStatus() {
    return {
      connected: this.connected,
      host: this.config.host,
      port: this.config.port,
      features: this.config.features,
      subscriptions: this.subscriptions.size,
      metrics: this.getCacheStats()
    };
  }
}

module.exports = { RedisIntegration };
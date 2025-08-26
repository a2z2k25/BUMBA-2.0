/**
 * BUMBA Redis Persistence Layer
 * Provides persistent storage for memory, locks, and coordination state
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');

class RedisPersistence extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      host: config.host || process.env.REDIS_HOST || 'localhost',
      port: config.port || process.env.REDIS_PORT || 6379,
      password: config.password || process.env.REDIS_PASSWORD,
      db: config.db || 0,
      keyPrefix: config.keyPrefix || 'bumba:',
      ttl: config.ttl || 86400, // 24 hours default
      retryStrategy: config.retryStrategy || this.defaultRetryStrategy,
      ...config
    };
    
    this.client = null;
    this.connected = false;
    this.fallbackMode = false;
    
    // Initialize connection
    this.connect();
  }
  
  /**
   * Connect to Redis
   */
  async connect() {
    try {
      // Try to load Redis client
      const Redis = this.loadRedisClient();
      
      if (!Redis) {
        logger.warn('🟡 Redis client not available, using fallback mode');
        this.initializeFallback();
        return;
      }
      
      this.client = new Redis({
        host: this.config.host,
        port: this.config.port,
        password: this.config.password,
        db: this.config.db,
        retryStrategy: this.config.retryStrategy,
        lazyConnect: true
      });
      
      // Set up event handlers
      this.client.on('connect', () => {
        this.connected = true;
        logger.info('🏁 Redis connected');
        this.emit('connected');
      });
      
      this.client.on('error', (error) => {
        logger.error('Redis error:', error);
        this.emit('error', error);
      });
      
      this.client.on('close', () => {
        this.connected = false;
        logger.warn('Redis connection closed');
        this.emit('disconnected');
      });
      
      // Attempt connection
      await this.client.connect();
      
    } catch (error) {
      logger.warn('Could not connect to Redis, using fallback:', error.message);
      this.initializeFallback();
    }
  }
  
  /**
   * Load Redis client if available
   */
  loadRedisClient() {
    try {
      // Try ioredis first (preferred)
      return require('ioredis');
    } catch (error) {
      try {
        // Try redis package
        return require('redis');
      } catch (error) {
        return null;
      }
    }
  }
  
  /**
   * Initialize fallback storage
   */
  initializeFallback() {
    this.fallbackMode = true;
    this.fallbackStore = new Map();
    this.connected = true;
    
    // Load from disk if exists
    this.loadFallbackData();
    
    // Set up periodic save
    this.saveInterval = setInterval(() => {
      this.saveFallbackData();
    }, 30000); // Save every 30 seconds
    
    logger.info('🟢 Using in-memory fallback with disk persistence');
    this.emit('connected', { mode: 'fallback' });
  }
  
  /**
   * Default retry strategy
   */
  defaultRetryStrategy(times) {
    if (times > 10) {
      return null; // Stop retrying
    }
    return Math.min(times * 50, 2000);
  }
  
  // === Core Persistence Methods ===
  
  /**
   * Save team memory context
   */
  async saveTeamMemory(context) {
    const key = this.makeKey('team:memory');
    const data = JSON.stringify(context);
    
    if (this.fallbackMode) {
      this.fallbackStore.set(key, data);
      return true;
    }
    
    try {
      await this.client.set(key, data, 'EX', this.config.ttl);
      return true;
    } catch (error) {
      logger.error('Failed to save team memory:', error);
      return false;
    }
  }
  
  /**
   * Load team memory context
   */
  async loadTeamMemory() {
    const key = this.makeKey('team:memory');
    
    if (this.fallbackMode) {
      const data = this.fallbackStore.get(key);
      return data ? JSON.parse(data) : null;
    }
    
    try {
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Failed to load team memory:', error);
      return null;
    }
  }
  
  /**
   * Save file lock
   */
  async saveLock(filepath, lockData) {
    const key = this.makeKey(`lock:${filepath}`);
    const data = JSON.stringify(lockData);
    
    if (this.fallbackMode) {
      this.fallbackStore.set(key, data);
      return true;
    }
    
    try {
      // Use SET NX for atomic lock acquisition
      const result = await this.client.set(key, data, 'NX', 'EX', 300); // 5 min expiry
      return result === 'OK';
    } catch (error) {
      logger.error('Failed to save lock:', error);
      return false;
    }
  }
  
  /**
   * Get file lock
   */
  async getLock(filepath) {
    const key = this.makeKey(`lock:${filepath}`);
    
    if (this.fallbackMode) {
      const data = this.fallbackStore.get(key);
      return data ? JSON.parse(data) : null;
    }
    
    try {
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Failed to get lock:', error);
      return null;
    }
  }
  
  /**
   * Release file lock
   */
  async releaseLock(filepath, token) {
    const key = this.makeKey(`lock:${filepath}`);
    
    if (this.fallbackMode) {
      const lock = this.fallbackStore.get(key);
      if (lock) {
        const data = JSON.parse(lock);
        if (data.token === token) {
          this.fallbackStore.delete(key);
          return true;
        }
      }
      return false;
    }
    
    try {
      // Use Lua script for atomic check-and-delete
      const script = `
        if redis.call("get", KEYS[1]) == ARGV[1] then
          return redis.call("del", KEYS[1])
        else
          return 0
        end
      `;
      
      const result = await this.client.eval(script, 1, key, token);
      return result === 1;
    } catch (error) {
      logger.error('Failed to release lock:', error);
      return false;
    }
  }
  
  /**
   * Save territory allocation
   */
  async saveTerritory(agentId, territory) {
    const key = this.makeKey(`territory:${agentId}`);
    const data = JSON.stringify(territory);
    
    if (this.fallbackMode) {
      this.fallbackStore.set(key, data);
      return true;
    }
    
    try {
      await this.client.set(key, data, 'EX', this.config.ttl);
      return true;
    } catch (error) {
      logger.error('Failed to save territory:', error);
      return false;
    }
  }
  
  /**
   * Get all territories
   */
  async getAllTerritories() {
    const pattern = this.makeKey('territory:*');
    
    if (this.fallbackMode) {
      const territories = [];
      for (const [key, value] of this.fallbackStore) {
        if (key.startsWith(pattern.replace('*', ''))) {
          territories.push(JSON.parse(value));
        }
      }
      return territories;
    }
    
    try {
      const keys = await this.client.keys(pattern);
      const territories = [];
      
      for (const key of keys) {
        const data = await this.client.get(key);
        if (data) {
          territories.push(JSON.parse(data));
        }
      }
      
      return territories;
    } catch (error) {
      logger.error('Failed to get territories:', error);
      return [];
    }
  }
  
  /**
   * Save agent context
   */
  async saveAgentContext(agentId, context) {
    const key = this.makeKey(`agent:${agentId}:context`);
    const data = JSON.stringify(context);
    
    if (this.fallbackMode) {
      this.fallbackStore.set(key, data);
      return true;
    }
    
    try {
      await this.client.set(key, data, 'EX', this.config.ttl);
      return true;
    } catch (error) {
      logger.error('Failed to save agent context:', error);
      return false;
    }
  }
  
  /**
   * Publish message to channel
   */
  async publish(channel, message) {
    if (this.fallbackMode) {
      // Emit locally for fallback
      this.emit(`channel:${channel}`, message);
      return true;
    }
    
    try {
      await this.client.publish(channel, JSON.stringify(message));
      return true;
    } catch (error) {
      logger.error('Failed to publish message:', error);
      return false;
    }
  }
  
  /**
   * Subscribe to channel
   */
  async subscribe(channel, callback) {
    if (this.fallbackMode) {
      // Local event subscription for fallback
      this.on(`channel:${channel}`, callback);
      return true;
    }
    
    try {
      await this.client.subscribe(channel);
      this.client.on('message', (ch, message) => {
        if (ch === channel) {
          callback(JSON.parse(message));
        }
      });
      return true;
    } catch (error) {
      logger.error('Failed to subscribe:', error);
      return false;
    }
  }
  
  // === Utility Methods ===
  
  /**
   * Make prefixed key
   */
  makeKey(key) {
    return `${this.config.keyPrefix}${key}`;
  }
  
  /**
   * Load fallback data from disk
   */
  loadFallbackData() {
    try {
      const fs = require('fs');
      const path = require('path');
      const file = path.join(process.cwd(), '.bumba-persistence.json');
      
      if (fs.existsSync(file)) {
        const data = JSON.parse(fs.readFileSync(file, 'utf8'));
        Object.entries(data).forEach(([key, value]) => {
          this.fallbackStore.set(key, value);
        });
        logger.info(`🟢 Loaded ${this.fallbackStore.size} persisted items`);
      }
    } catch (error) {
      logger.warn('Could not load fallback data:', error.message);
    }
  }
  
  /**
   * Save fallback data to disk
   */
  saveFallbackData() {
    try {
      const fs = require('fs');
      const path = require('path');
      const file = path.join(process.cwd(), '.bumba-persistence.json');
      
      const data = {};
      for (const [key, value] of this.fallbackStore) {
        data[key] = value;
      }
      
      fs.writeFileSync(file, JSON.stringify(data, null, 2));
      
    } catch (error) {
      logger.warn('Could not save fallback data:', error.message);
    }
  }
  
  /**
   * Cleanup
   */
  async cleanup() {
    if (this.saveInterval) {
      clearInterval(this.saveInterval);
    }
    
    if (this.fallbackMode) {
      this.saveFallbackData();
    }
    
    if (this.client && !this.fallbackMode) {
      await this.client.quit();
    }
  }
}

// Singleton instance
let instance = null;

module.exports = {
  RedisPersistence,
  getInstance: (config) => {
    if (!instance) {
      instance = new RedisPersistence(config);
    }
    return instance;
  }
};
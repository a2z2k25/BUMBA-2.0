/**
 * BUMBA API Connection Manager
 * Manages API connections efficiently to minimize costs
 * Implements connection pooling, caching, and request batching
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');
const { UnifiedHookSystem } = require('../unified-hook-system');

/**
 * Connection States
 */
const ConnectionState = {
  IDLE: 'idle',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  BUSY: 'busy',
  DISCONNECTING: 'disconnecting',
  DISCONNECTED: 'disconnected',
  ERROR: 'error'
};

/**
 * API Provider Types
 */
const APIProvider = {
  CLAUDE_MAX: 'claude_max',
  DEEPSEEK: 'deepseek',
  QWEN: 'qwen',
  GEMINI: 'gemini',
  OPENAI: 'openai',
  CUSTOM: 'custom'
};

/**
 * Request Priority
 */
const RequestPriority = {
  CRITICAL: 1,
  HIGH: 2,
  NORMAL: 3,
  LOW: 4,
  BATCH: 5
};

/**
 * API Connection Manager
 */
class APIConnectionManager extends EventEmitter {
  constructor(config = {}) {
    super();
    
    // Initialize hook system
    this.hooks = new UnifiedHookSystem();
    
    // Add compatibility layer for different hook APIs
    if (!this.hooks.executeHooks && this.hooks.trigger) {
      this.hooks.executeHooks = this.hooks.trigger.bind(this.hooks);
    }
    if (!this.hooks.getRegisteredHooks && this.hooks.hookRegistry) {
      this.hooks.getRegisteredHooks = () => {
        const hooks = {};
        this.hooks.hookRegistry.forEach((config, name) => {
          hooks[name] = config;
        });
        return hooks;
      };
    }
    
    this.config = {
      maxConnections: config.maxConnections || 10,
      maxConnectionsPerProvider: config.maxConnectionsPerProvider || 3,
      connectionTimeout: config.connectionTimeout || 30000,
      requestTimeout: config.requestTimeout || 60000,
      retryAttempts: config.retryAttempts || 3,
      retryDelay: config.retryDelay || 1000,
      batchingEnabled: config.batchingEnabled !== false,
      batchSize: config.batchSize || 10,
      batchDelay: config.batchDelay || 100,
      cachingEnabled: config.cachingEnabled !== false,
      cacheExpiry: config.cacheExpiry || 300000, // 5 minutes
      rateLimitingEnabled: config.rateLimitingEnabled !== false,
      ...config
    };
    
    // Connection pools
    this.connectionPools = new Map();
    this.activeConnections = new Map();
    
    // Request management
    this.requestQueue = [];
    this.batchQueue = new Map();
    this.pendingRequests = new Map();
    
    // Response cache
    this.responseCache = new Map();
    this.cacheStats = {
      hits: 0,
      misses: 0,
      evictions: 0
    };
    
    // Rate limiting
    this.rateLimits = new Map();
    this.rateLimitWindows = new Map();
    
    // Statistics
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      cachedResponses: 0,
      batchedRequests: 0,
      averageLatency: 0,
      totalCost: 0,
      costByProvider: {}
    };
    
    // Initialize provider configurations
    this.initializeProviders();
    
    // Register API hooks
    this.registerAPIHooks();
    
    // Start processors
    this.startProcessors();
  }
  
  /**
   * Register API request hooks
   */
  registerAPIHooks() {
    // Register beforeAPIRequest hook
    this.hooks.register('api:beforeRequest', async (ctx) => ({ success: true }), {
      category: 'resource',
      priority: 50,
      description: 'Execute before API request',
      schema: {
        provider: 'string',
        payload: 'object',
        options: 'object'
      }
    });
    
    // Register afterAPIRequest hook
    this.hooks.register('api:afterRequest', async (ctx) => ({ success: true }), {
      category: 'resource',
      priority: 50,
      description: 'Execute after API request',
      schema: {
        provider: 'string',
        request: 'object',
        response: 'object',
        duration: 'number',
        cost: 'number'
      }
    });
    
    // Register onAPIError hook
    this.hooks.register('api:onError', async (ctx) => ({ success: true }), {
      category: 'error',
      priority: 100,
      description: 'Handle API request error',
      schema: {
        provider: 'string',
        error: 'object',
        request: 'object',
        retryCount: 'number'
      }
    });
    
    // Register onAPIThrottle hook
    this.hooks.register('api:onThrottle', async (ctx) => ({ success: true }), {
      category: 'resource',
      priority: 75,
      description: 'Handle API rate limiting',
      schema: {
        provider: 'string',
        waitTime: 'number',
        queueLength: 'number'
      }
    });
    
    // Register performance tracking hook
    this.hooks.register('api:trackPerformance', async (ctx) => ({ success: true }), {
      category: 'performance',
      priority: 25,
      description: 'Track API performance metrics',
      schema: {
        provider: 'string',
        latency: 'number',
        throughput: 'number',
        errorRate: 'number'
      }
    });
    
    logger.info('🏁 API request hooks registered');
  }
  
  /**
   * Initialize provider configurations
   */
  initializeProviders() {
    // Default provider configurations
    this.providerConfigs = {
      [APIProvider.CLAUDE_MAX]: {
        endpoint: process.env.CLAUDE_MAX_ENDPOINT || 'https://api.anthropic.com/v1/messages',
        apiKey: process.env.CLAUDE_MAX_API_KEY,
        maxConnections: 1, // Only one Claude Max connection
        rateLimit: { requests: 100, window: 60000 }, // 100 req/min
        costPerRequest: 0.015, // $0.015 per 1K tokens
        timeout: 120000
      },
      [APIProvider.DEEPSEEK]: {
        endpoint: process.env.DEEPSEEK_ENDPOINT || 'https://api.deepseek.com/v1/chat',
        apiKey: process.env.DEEPSEEK_API_KEY,
        maxConnections: 3,
        rateLimit: { requests: 200, window: 60000 },
        costPerRequest: 0.001,
        timeout: 60000
      },
      [APIProvider.QWEN]: {
        endpoint: process.env.QWEN_ENDPOINT || 'https://api.qwen.com/v1/chat',
        apiKey: process.env.QWEN_API_KEY,
        maxConnections: 3,
        rateLimit: { requests: 200, window: 60000 },
        costPerRequest: 0.001,
        timeout: 60000
      },
      [APIProvider.GEMINI]: {
        endpoint: process.env.GEMINI_ENDPOINT || 'https://api.gemini.com/v1/chat',
        apiKey: process.env.GEMINI_API_KEY,
        maxConnections: 3,
        rateLimit: { requests: 150, window: 60000 },
        costPerRequest: 0.002,
        timeout: 60000
      }
    };
    
    // Initialize connection pools
    for (const [provider, config] of Object.entries(this.providerConfigs)) {
      this.connectionPools.set(provider, {
        config,
        connections: [],
        available: config.maxConnections,
        queue: []
      });
      
      this.stats.costByProvider[provider] = 0;
    }
  }
  
  /**
   * Request API call
   */
  async request(provider, payload, options = {}) {
    // Execute beforeRequest hook
    const beforeContext = await this.hooks.execute('api:beforeRequest', {
      provider,
      payload,
      options
    });
    
    // Allow hook to modify parameters
    if (beforeContext.provider) {provider = beforeContext.provider;}
    if (beforeContext.payload) {payload = beforeContext.payload;}
    if (beforeContext.options) {options = { ...options, ...beforeContext.options };}
    
    const request = {
      id: this.generateRequestId(),
      provider,
      payload,
      priority: options.priority || RequestPriority.NORMAL,
      timestamp: Date.now(),
      options
    };
    
    logger.info(`🟢 API request ${request.id} to ${provider}`);
    
    // Check cache first
    if (this.config.cachingEnabled && !options.noCache) {
      const cached = this.checkCache(provider, payload);
      if (cached) {
        logger.info(`🟢 Cache hit for request ${request.id}`);
        this.cacheStats.hits++;
        this.stats.cachedResponses++;
        return cached;
      }
      this.cacheStats.misses++;
    }
    
    // Check if can batch
    if (this.config.batchingEnabled && options.batchable) {
      return this.addToBatch(request);
    }
    
    // Check rate limits
    if (this.config.rateLimitingEnabled) {
      await this.checkRateLimit(provider);
    }
    
    // Get connection
    const connection = await this.getConnection(provider, request.priority);
    
    try {
      // Execute request
      const response = await this.executeRequest(connection, request);
      
      // Cache response
      if (this.config.cachingEnabled && !options.noCache) {
        this.cacheResponse(provider, payload, response);
      }
      
      // Update statistics
      this.updateStatistics(request, response, true);
      
      return response;
      
    } catch (error) {
      logger.error(`🔴 Request ${request.id} failed: ${error.message}`);
      
      // Retry logic
      if (options.retry !== false && request.attempts < this.config.retryAttempts) {
        request.attempts = (request.attempts || 0) + 1;
        logger.info(`🟢 Retrying request ${request.id} (attempt ${request.attempts})`);
        
        await this.delay(this.config.retryDelay * request.attempts);
        return this.request(provider, payload, options);
      }
      
      this.updateStatistics(request, null, false);
      throw error;
      
    } finally {
      // Release connection
      this.releaseConnection(provider, connection);
    }
  }
  
  /**
   * Get connection from pool
   */
  async getConnection(provider, priority) {
    const pool = this.connectionPools.get(provider);
    
    if (!pool) {
      throw new Error(`Unknown provider: ${provider}`);
    }
    
    // Wait for available connection
    const startTime = Date.now();
    
    while (pool.available <= 0) {
      if (Date.now() - startTime > this.config.connectionTimeout) {
        throw new Error(`Connection timeout for ${provider}`);
      }
      
      // Add to queue if high priority
      if (priority <= RequestPriority.HIGH) {
        await new Promise(resolve => {
          pool.queue.unshift({ resolve, priority });
        });
        break;
      }
      
      await this.delay(100);
    }
    
    // Create or reuse connection
    let connection = pool.connections.find(c => c.state === ConnectionState.IDLE);
    
    if (!connection) {
      connection = await this.createConnection(provider);
      pool.connections.push(connection);
    }
    
    connection.state = ConnectionState.BUSY;
    pool.available--;
    
    this.activeConnections.set(connection.id, connection);
    
    return connection;
  }
  
  /**
   * Create new connection
   */
  async createConnection(provider) {
    const config = this.providerConfigs[provider];
    const connectionId = this.generateConnectionId();
    
    logger.info(`🟢 Creating connection ${connectionId} to ${provider}`);
    
    const connection = {
      id: connectionId,
      provider,
      config,
      state: ConnectionState.CONNECTING,
      createdAt: Date.now(),
      requestCount: 0,
      lastUsed: Date.now()
    };
    
    // Simulate connection establishment
    await this.delay(100);
    
    connection.state = ConnectionState.CONNECTED;
    
    this.emit('connection:created', {
      connectionId,
      provider
    });
    
    return connection;
  }
  
  /**
   * Execute request on connection
   */
  async executeRequest(connection, request) {
    const startTime = Date.now();
    
    connection.requestCount++;
    connection.lastUsed = Date.now();
    
    try {
      // Simulate API call (would be actual HTTP request)
      const response = await this.simulateAPICall(
        connection.provider,
        request.payload,
        connection.config
      );
      
      const latency = Date.now() - startTime;
      
      // Calculate cost
      const cost = this.calculateCost(connection.provider, request, response);
      this.stats.totalCost += cost;
      this.stats.costByProvider[connection.provider] += cost;
      
      logger.info(`🏁 Request ${request.id} completed in ${latency}ms (cost: $${cost.toFixed(4)})`);
      
      return {
        ...response,
        metadata: {
          requestId: request.id,
          provider: connection.provider,
          latency,
          cost
        }
      };
      
    } catch (error) {
      connection.state = ConnectionState.ERROR;
      throw error;
    }
  }
  
  /**
   * Simulate API call (placeholder for actual implementation)
   */
  async simulateAPICall(provider, payload, config) {
    // Simulate network delay
    await this.delay(Math.random() * 1000 + 500);
    
    // Return mock response
    return {
      success: true,
      data: {
        response: `Response from ${provider}`,
        tokens: Math.floor(Math.random() * 1000) + 100
      },
      timestamp: Date.now()
    };
  }
  
  /**
   * Release connection back to pool
   */
  releaseConnection(provider, connection) {
    const pool = this.connectionPools.get(provider);
    
    if (!pool) {return;}
    
    connection.state = ConnectionState.IDLE;
    pool.available++;
    
    this.activeConnections.delete(connection.id);
    
    // Process queue if any
    if (pool.queue.length > 0) {
      const { resolve } = pool.queue.shift();
      resolve();
    }
    
    // Close connection if idle too long
    if (connection.requestCount > 100 || 
        Date.now() - connection.createdAt > 300000) { // 5 minutes
      this.closeConnection(connection);
    }
  }
  
  /**
   * Close connection
   */
  async closeConnection(connection) {
    logger.info(`🟢 Closing connection ${connection.id}`);
    
    connection.state = ConnectionState.DISCONNECTING;
    
    // Remove from pool
    const pool = this.connectionPools.get(connection.provider);
    if (pool) {
      const index = pool.connections.indexOf(connection);
      if (index > -1) {
        pool.connections.splice(index, 1);
      }
    }
    
    connection.state = ConnectionState.DISCONNECTED;
    
    this.emit('connection:closed', {
      connectionId: connection.id,
      provider: connection.provider
    });
  }
  
  /**
   * Add request to batch
   */
  async addToBatch(request) {
    const batchKey = `${request.provider}-${request.priority}`;
    
    if (!this.batchQueue.has(batchKey)) {
      this.batchQueue.set(batchKey, {
        provider: request.provider,
        priority: request.priority,
        requests: [],
        timer: null
      });
    }
    
    const batch = this.batchQueue.get(batchKey);
    
    return new Promise((resolve, reject) => {
      request.resolve = resolve;
      request.reject = reject;
      batch.requests.push(request);
      
      // Process batch if full
      if (batch.requests.length >= this.config.batchSize) {
        this.processBatch(batchKey);
      } else if (!batch.timer) {
        // Set timer for batch processing
        batch.timer = setTimeout(() => {
          this.processBatch(batchKey);
        }, this.config.batchDelay);
      }
    });
  }
  
  /**
   * Process batch requests
   */
  async processBatch(batchKey) {
    const batch = this.batchQueue.get(batchKey);
    
    if (!batch || batch.requests.length === 0) {return;}
    
    logger.info(`🟢 Processing batch of ${batch.requests.length} requests`);
    
    // Clear timer
    if (batch.timer) {
      clearTimeout(batch.timer);
      batch.timer = null;
    }
    
    // Remove batch from queue
    this.batchQueue.delete(batchKey);
    
    try {
      // Combine payloads
      const combinedPayload = {
        batch: true,
        requests: batch.requests.map(r => r.payload)
      };
      
      // Make single API call
      const response = await this.request(
        batch.provider,
        combinedPayload,
        { priority: batch.priority, batchable: false }
      );
      
      // Distribute responses
      batch.requests.forEach((request, index) => {
        const individualResponse = response.data?.responses?.[index] || response;
        request.resolve(individualResponse);
      });
      
      this.stats.batchedRequests += batch.requests.length;
      
    } catch (error) {
      // Reject all requests in batch
      batch.requests.forEach(request => {
        request.reject(error);
      });
    }
  }
  
  /**
   * Check cache
   */
  checkCache(provider, payload) {
    const cacheKey = this.getCacheKey(provider, payload);
    const cached = this.responseCache.get(cacheKey);
    
    if (cached) {
      // Check if expired
      if (Date.now() - cached.timestamp < this.config.cacheExpiry) {
        return cached.response;
      } else {
        // Remove expired entry
        this.responseCache.delete(cacheKey);
        this.cacheStats.evictions++;
      }
    }
    
    return null;
  }
  
  /**
   * Cache response
   */
  cacheResponse(provider, payload, response) {
    const cacheKey = this.getCacheKey(provider, payload);
    
    this.responseCache.set(cacheKey, {
      response,
      timestamp: Date.now()
    });
    
    // Limit cache size
    if (this.responseCache.size > 1000) {
      // Remove oldest entries
      const entries = Array.from(this.responseCache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      for (let i = 0; i < 100; i++) {
        this.responseCache.delete(entries[i][0]);
        this.cacheStats.evictions++;
      }
    }
  }
  
  /**
   * Get cache key
   */
  getCacheKey(provider, payload) {
    return `${provider}:${JSON.stringify(payload)}`;
  }
  
  /**
   * Check rate limit
   */
  async checkRateLimit(provider) {
    const config = this.providerConfigs[provider];
    
    if (!config.rateLimit) {return;}
    
    const windowKey = `${provider}:${Math.floor(Date.now() / config.rateLimit.window)}`;
    
    if (!this.rateLimitWindows.has(windowKey)) {
      this.rateLimitWindows.set(windowKey, 0);
      
      // Clean old windows
      setTimeout(() => {
        this.rateLimitWindows.delete(windowKey);
      }, config.rateLimit.window * 2);
    }
    
    const currentCount = this.rateLimitWindows.get(windowKey);
    
    if (currentCount >= config.rateLimit.requests) {
      const waitTime = config.rateLimit.window - (Date.now() % config.rateLimit.window);
      logger.warn(`⏱️ Rate limit reached for ${provider}, waiting ${waitTime}ms`);
      
      await this.delay(waitTime);
      return this.checkRateLimit(provider);
    }
    
    this.rateLimitWindows.set(windowKey, currentCount + 1);
  }
  
  /**
   * Calculate cost
   */
  calculateCost(provider, request, response) {
    const config = this.providerConfigs[provider];
    const tokens = response.data?.tokens || 1000;
    
    return (tokens / 1000) * config.costPerRequest;
  }
  
  /**
   * Update statistics
   */
  updateStatistics(request, response, success) {
    this.stats.totalRequests++;
    
    if (success) {
      this.stats.successfulRequests++;
      
      const latency = response?.metadata?.latency || 0;
      const totalLatency = this.stats.averageLatency * (this.stats.successfulRequests - 1);
      this.stats.averageLatency = (totalLatency + latency) / this.stats.successfulRequests;
    } else {
      this.stats.failedRequests++;
    }
  }
  
  /**
   * Start processors
   */
  startProcessors() {
    // Batch processor
    setInterval(() => {
      for (const [batchKey, batch] of this.batchQueue) {
        if (batch.requests.length > 0 && !batch.timer) {
          this.processBatch(batchKey);
        }
      }
    }, this.config.batchDelay);
    
    // Cache cleaner
    setInterval(() => {
      const now = Date.now();
      let cleaned = 0;
      
      for (const [key, cached] of this.responseCache) {
        if (now - cached.timestamp > this.config.cacheExpiry) {
          this.responseCache.delete(key);
          cleaned++;
        }
      }
      
      if (cleaned > 0) {
        logger.info(`🟢 Cleaned ${cleaned} expired cache entries`);
        this.cacheStats.evictions += cleaned;
      }
    }, 60000); // Every minute
    
    // Connection health check
    setInterval(() => {
      for (const [id, connection] of this.activeConnections) {
        if (Date.now() - connection.lastUsed > this.config.connectionTimeout) {
          logger.warn(`🟡 Connection ${id} timed out`);
          this.releaseConnection(connection.provider, connection);
        }
      }
    }, 10000); // Every 10 seconds
  }
  
  /**
   * Delay helper
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Generate IDs
   */
  generateRequestId() {
    return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  generateConnectionId() {
    return `conn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Get statistics
   */
  getStatistics() {
    return {
      ...this.stats,
      successRate: this.stats.totalRequests > 0 ?
        (this.stats.successfulRequests / this.stats.totalRequests * 100).toFixed(1) + '%' :
        '0%',
      cacheHitRate: (this.cacheStats.hits + this.cacheStats.misses) > 0 ?
        (this.cacheStats.hits / (this.cacheStats.hits + this.cacheStats.misses) * 100).toFixed(1) + '%' :
        '0%',
      activeConnections: this.activeConnections.size,
      totalConnections: Array.from(this.connectionPools.values())
        .reduce((sum, pool) => sum + pool.connections.length, 0),
      cacheSize: this.responseCache.size,
      ...this.cacheStats
    };
  }
  
  /**
   * Get connection status
   */
  getConnectionStatus() {
    const status = {};
    
    for (const [provider, pool] of this.connectionPools) {
      status[provider] = {
        total: pool.connections.length,
        available: pool.available,
        busy: pool.connections.filter(c => c.state === ConnectionState.BUSY).length,
        queued: pool.queue.length
      };
    }
    
    return status;
  }
  
  /**
   * Shutdown manager
   */
  async shutdown() {
    logger.info('🔴 Shutting down API Connection Manager');
    
    // Clear queues
    this.requestQueue = [];
    this.batchQueue.clear();
    
    // Close all connections
    for (const pool of this.connectionPools.values()) {
      for (const connection of pool.connections) {
        await this.closeConnection(connection);
      }
    }
    
    // Clear cache
    this.responseCache.clear();
    
    logger.info('🏁 API Connection Manager shutdown complete');
  }
}

// Export
module.exports = {
  APIConnectionManager,
  ConnectionState,
  APIProvider,
  RequestPriority
};
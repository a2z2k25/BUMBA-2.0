/**
 * Database Manager
 * Connection pooling and transaction management
 * Sprint 25-28 - Database Layer Fix
 */

const { logger } = require('../logging/bumba-logger');
const { stateManager } = require('../state/global-state-manager');
const { validator } = require('../security/input-validator');
const crypto = require('crypto');
const EventEmitter = require('events');

class DatabaseManager extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      maxConnections: options.maxConnections || 10,
      minConnections: options.minConnections || 2,
      acquireTimeout: options.acquireTimeout || 30000,
      idleTimeout: options.idleTimeout || 10000,
      connectionRetries: options.connectionRetries || 3,
      enableQueryCache: options.enableQueryCache !== false,
      enableTransactionLog: options.enableTransactionLog !== false
    };
    
    // Connection pools by database type
    this.pools = new Map();
    this.activeConnections = new Map();
    this.transactions = new Map();
    
    // Query cache
    this.queryCache = new Map();
    this.cacheStats = {
      hits: 0,
      misses: 0,
      evictions: 0
    };
    
    // Statistics
    this.stats = {
      connectionsCreated: 0,
      connectionsDestroyed: 0,
      queriesExecuted: 0,
      transactionsStarted: 0,
      transactionsCommitted: 0,
      transactionsRolledBack: 0,
      errors: 0
    };
    
    // Register with state manager
    stateManager.register('database', {
      stats: this.stats,
      pools: {},
      activeConnections: 0
    });
  }
  
  /**
   * Register database adapter
   */
  registerAdapter(type, adapter) {
    if (!this.pools.has(type)) {
      const pool = new ConnectionPool(adapter, this.options);
      this.pools.set(type, pool);
      
      // Set up event handlers
      pool.on('connectionCreated', () => this.stats.connectionsCreated++);
      pool.on('connectionDestroyed', () => this.stats.connectionsDestroyed++);
      pool.on('error', (err) => {
        this.stats.errors++;
        logger.error(`Database pool error (${type}):`, err);
      });
      
      logger.info(`Database adapter registered: ${type}`);
    }
  }
  
  /**
   * Get connection from pool
   */
  async getConnection(type = 'default') {
    const pool = this.pools.get(type);
    if (!pool) {
      throw new Error(`Database type not registered: ${type}`);
    }
    
    const connection = await pool.acquire();
    const connectionId = this.generateConnectionId();
    
    this.activeConnections.set(connectionId, {
      type,
      connection,
      acquiredAt: Date.now(),
      queries: 0
    });
    
    // Wrap connection with tracking
    return this.wrapConnection(connectionId, connection);
  }
  
  /**
   * Wrap connection for tracking
   */
  wrapConnection(connectionId, connection) {
    const self = this;
    
    return {
      ...connection,
      
      async query(sql, params) {
        return self.executeQuery(connectionId, sql, params);
      },
      
      async beginTransaction() {
        return self.beginTransaction(connectionId);
      },
      
      async commit() {
        return self.commitTransaction(connectionId);
      },
      
      async rollback() {
        return self.rollbackTransaction(connectionId);
      },
      
      async release() {
        return self.releaseConnection(connectionId);
      }
    };
  }
  
  /**
   * Execute query with safety checks
   */
  async executeQuery(connectionId, sql, params = []) {
    const connInfo = this.activeConnections.get(connectionId);
    if (!connInfo) {
      throw new Error('Invalid connection ID');
    }
    
    // Sanitize SQL
    const sanitized = this.sanitizeQuery(sql, params);
    
    // Check cache
    if (this.options.enableQueryCache && sanitized.cacheable) {
      const cacheKey = this.generateCacheKey(sanitized.sql, params);
      const cached = this.queryCache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < 60000) {
        this.cacheStats.hits++;
        return cached.result;
      }
      this.cacheStats.misses++;
    }
    
    try {
      // Execute query
      const startTime = Date.now();
      const result = await connInfo.connection.query(sanitized.sql, params);
      const duration = Date.now() - startTime;
      
      // Update statistics
      connInfo.queries++;
      this.stats.queriesExecuted++;
      
      // Log slow queries
      if (duration > 1000) {
        logger.warn(`Slow query detected (${duration}ms):`, sanitized.sql);
      }
      
      // Cache if applicable
      if (this.options.enableQueryCache && sanitized.cacheable) {
        const cacheKey = this.generateCacheKey(sanitized.sql, params);
        this.queryCache.set(cacheKey, {
          result,
          timestamp: Date.now()
        });
        
        // Limit cache size
        if (this.queryCache.size > 1000) {
          this.evictOldestCache();
        }
      }
      
      // Emit event
      this.emit('queryExecuted', {
        connectionId,
        sql: sanitized.sql,
        duration,
        rowCount: result.rows ? result.rows.length : 0
      });
      
      return result;
      
    } catch (error) {
      this.stats.errors++;
      logger.error('Query execution error:', error);
      throw error;
    }
  }
  
  /**
   * Sanitize query to prevent injection
   */
  sanitizeQuery(sql, params) {
    // Check for SQL injection patterns
    const attacks = validator.detectAttacks(sql);
    if (attacks.includes('sql_injection')) {
      throw new Error('Potential SQL injection detected');
    }
    
    // Normalize query
    const normalized = sql.trim().toLowerCase();
    
    // Determine if cacheable (SELECT queries only)
    const cacheable = normalized.startsWith('select') && 
                     !normalized.includes('for update');
    
    // Use parameterized queries
    if (params.length > 0 && !sql.includes('?') && !sql.includes('$')) {
      logger.warn('Query parameters provided but no placeholders found');
    }
    
    return {
      sql,
      cacheable,
      normalized
    };
  }
  
  /**
   * Begin transaction
   */
  async beginTransaction(connectionId) {
    const connInfo = this.activeConnections.get(connectionId);
    if (!connInfo) {
      throw new Error('Invalid connection ID');
    }
    
    const transactionId = this.generateTransactionId();
    
    // Start transaction
    await connInfo.connection.query('BEGIN');
    
    // Create transaction object
    const transaction = {
      id: transactionId,
      connectionId,
      startedAt: Date.now(),
      queries: [],
      state: 'active'
    };
    
    this.transactions.set(transactionId, transaction);
    this.stats.transactionsStarted++;
    
    // Log transaction
    if (this.options.enableTransactionLog) {
      logger.info(`Transaction started: ${transactionId}`);
    }
    
    return transactionId;
  }
  
  /**
   * Commit transaction
   */
  async commitTransaction(transactionId) {
    const transaction = this.transactions.get(transactionId);
    if (!transaction) {
      throw new Error('Invalid transaction ID');
    }
    
    const connInfo = this.activeConnections.get(transaction.connectionId);
    if (!connInfo) {
      throw new Error('Connection not found for transaction');
    }
    
    try {
      await connInfo.connection.query('COMMIT');
      
      transaction.state = 'committed';
      transaction.committedAt = Date.now();
      
      this.stats.transactionsCommitted++;
      
      if (this.options.enableTransactionLog) {
        logger.info(`Transaction committed: ${transactionId} (${transaction.queries.length} queries)`);
      }
      
      this.emit('transactionCommitted', transaction);
      
    } catch (error) {
      this.stats.errors++;
      logger.error(`Failed to commit transaction ${transactionId}:`, error);
      
      // Attempt rollback
      await this.rollbackTransaction(transactionId);
      throw error;
      
    } finally {
      this.transactions.delete(transactionId);
    }
  }
  
  /**
   * Rollback transaction
   */
  async rollbackTransaction(transactionId) {
    const transaction = this.transactions.get(transactionId);
    if (!transaction) {
      throw new Error('Invalid transaction ID');
    }
    
    const connInfo = this.activeConnections.get(transaction.connectionId);
    if (!connInfo) {
      throw new Error('Connection not found for transaction');
    }
    
    try {
      await connInfo.connection.query('ROLLBACK');
      
      transaction.state = 'rolledback';
      transaction.rolledbackAt = Date.now();
      
      this.stats.transactionsRolledBack++;
      
      if (this.options.enableTransactionLog) {
        logger.info(`Transaction rolled back: ${transactionId}`);
      }
      
      this.emit('transactionRolledBack', transaction);
      
    } catch (error) {
      this.stats.errors++;
      logger.error(`Failed to rollback transaction ${transactionId}:`, error);
      throw error;
      
    } finally {
      this.transactions.delete(transactionId);
    }
  }
  
  /**
   * Release connection back to pool
   */
  async releaseConnection(connectionId) {
    const connInfo = this.activeConnections.get(connectionId);
    if (!connInfo) {
      return;
    }
    
    const pool = this.pools.get(connInfo.type);
    if (pool) {
      await pool.release(connInfo.connection);
    }
    
    this.activeConnections.delete(connectionId);
    
    this.emit('connectionReleased', {
      connectionId,
      queries: connInfo.queries,
      duration: Date.now() - connInfo.acquiredAt
    });
  }
  
  /**
   * Execute with automatic connection management
   */
  async execute(type, callback) {
    const connection = await this.getConnection(type);
    
    try {
      return await callback(connection);
    } finally {
      await connection.release();
    }
  }
  
  /**
   * Execute in transaction
   */
  async executeTransaction(type, callback) {
    const connection = await this.getConnection(type);
    const transactionId = await connection.beginTransaction();
    
    try {
      const result = await callback(connection);
      await connection.commit();
      return result;
      
    } catch (error) {
      await connection.rollback();
      throw error;
      
    } finally {
      await connection.release();
    }
  }
  
  /**
   * Evict oldest cache entry
   */
  evictOldestCache() {
    let oldest = null;
    let oldestTime = Infinity;
    
    for (const [key, value] of this.queryCache) {
      if (value.timestamp < oldestTime) {
        oldest = key;
        oldestTime = value.timestamp;
      }
    }
    
    if (oldest) {
      this.queryCache.delete(oldest);
      this.cacheStats.evictions++;
    }
  }
  
  /**
   * Clear query cache
   */
  clearCache() {
    const size = this.queryCache.size;
    this.queryCache.clear();
    this.cacheStats.evictions += size;
    
    logger.info(`Query cache cleared (${size} entries)`);
  }
  
  /**
   * Generate IDs
   */
  generateConnectionId() {
    return `conn_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  }
  
  generateTransactionId() {
    return `txn_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  }
  
  generateCacheKey(sql, params) {
    const hash = crypto.createHash('md5');
    hash.update(sql);
    hash.update(JSON.stringify(params));
    return hash.digest('hex');
  }
  
  /**
   * Get statistics
   */
  getStats() {
    const poolStats = {};
    
    for (const [type, pool] of this.pools) {
      poolStats[type] = pool.getStats();
    }
    
    return {
      ...this.stats,
      activeConnections: this.activeConnections.size,
      activeTransactions: this.transactions.size,
      pools: poolStats,
      cache: this.cacheStats
    };
  }
  
  /**
   * Shutdown all connections
   */
  async shutdown() {
    // Release all active connections
    for (const [connectionId] of this.activeConnections) {
      await this.releaseConnection(connectionId);
    }
    
    // Destroy all pools
    for (const [type, pool] of this.pools) {
      await pool.destroy();
    }
    
    this.pools.clear();
    this.activeConnections.clear();
    this.transactions.clear();
    this.queryCache.clear();
    
    logger.info('Database manager shutdown complete');
  }
}

/**
 * Connection Pool Implementation
 */
class ConnectionPool extends EventEmitter {
  constructor(adapter, options) {
    super();
    
    this.adapter = adapter;
    this.options = options;
    
    this.connections = [];
    this.available = [];
    this.pending = [];
    
    // Initialize minimum connections
    this.initialize();
  }
  
  async initialize() {
    for (let i = 0; i < this.options.minConnections; i++) {
      await this.createConnection();
    }
  }
  
  async createConnection() {
    if (this.connections.length >= this.options.maxConnections) {
      return null;
    }
    
    try {
      const connection = await this.adapter.createConnection();
      
      const wrapped = {
        connection,
        createdAt: Date.now(),
        lastUsed: Date.now(),
        inUse: false
      };
      
      this.connections.push(wrapped);
      this.available.push(wrapped);
      
      this.emit('connectionCreated');
      
      return wrapped;
      
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }
  
  async acquire() {
    // Return available connection
    if (this.available.length > 0) {
      const conn = this.available.shift();
      conn.inUse = true;
      conn.lastUsed = Date.now();
      return conn.connection;
    }
    
    // Create new connection if possible
    if (this.connections.length < this.options.maxConnections) {
      const conn = await this.createConnection();
      if (conn) {
        this.available.splice(this.available.indexOf(conn), 1);
        conn.inUse = true;
        return conn.connection;
      }
    }
    
    // Wait for connection
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        const index = this.pending.indexOf(resolver);
        if (index !== -1) {
          this.pending.splice(index, 1);
        }
        reject(new Error('Connection acquire timeout'));
      }, this.options.acquireTimeout);
      
      const resolver = {
        resolve: (conn) => {
          clearTimeout(timeout);
          resolve(conn);
        },
        reject
      };
      
      this.pending.push(resolver);
    });
  }
  
  async release(connection) {
    const wrapped = this.connections.find(c => c.connection === connection);
    if (!wrapped) return;
    
    wrapped.inUse = false;
    wrapped.lastUsed = Date.now();
    
    // Give to pending request
    if (this.pending.length > 0) {
      const resolver = this.pending.shift();
      wrapped.inUse = true;
      resolver.resolve(connection);
      return;
    }
    
    // Check idle timeout
    const idleTime = Date.now() - wrapped.lastUsed;
    if (idleTime > this.options.idleTimeout && 
        this.connections.length > this.options.minConnections) {
      await this.destroyConnection(wrapped);
    } else {
      this.available.push(wrapped);
    }
  }
  
  async destroyConnection(wrapped) {
    const index = this.connections.indexOf(wrapped);
    if (index !== -1) {
      this.connections.splice(index, 1);
    }
    
    const availIndex = this.available.indexOf(wrapped);
    if (availIndex !== -1) {
      this.available.splice(availIndex, 1);
    }
    
    try {
      await this.adapter.destroyConnection(wrapped.connection);
    } catch (error) {
      logger.error('Error destroying connection:', error);
    }
    
    this.emit('connectionDestroyed');
  }
  
  async destroy() {
    // Reject all pending
    for (const resolver of this.pending) {
      resolver.reject(new Error('Pool destroyed'));
    }
    this.pending = [];
    
    // Destroy all connections
    for (const wrapped of this.connections) {
      await this.destroyConnection(wrapped);
    }
    
    this.connections = [];
    this.available = [];
  }
  
  getStats() {
    return {
      total: this.connections.length,
      available: this.available.length,
      inUse: this.connections.filter(c => c.inUse).length,
      pending: this.pending.length
    };
  }
}

// Singleton instance
let instance = null;

function getDatabaseManager(options) {
  if (!instance) {
    instance = new DatabaseManager(options);
  }
  return instance;
}

module.exports = {
  DatabaseManager,
  ConnectionPool,
  getDatabaseManager,
  databaseManager: getDatabaseManager()
};
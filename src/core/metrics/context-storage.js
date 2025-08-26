/**
 * Context Metrics Storage
 * Phase 1 - Sprint 5
 * Stores context metrics persistently using SQLite
 */

const path = require('path');
const fs = require('fs').promises;
const { logger } = require('../logging/bumba-logger');

// Try to load sqlite3, fallback to in-memory if not available
let sqlite3;
try {
  sqlite3 = require('sqlite3').verbose();
} catch (err) {
  // SQLite not available, will use in-memory storage
  sqlite3 = null;
}

class ContextMetricsStorage {
  constructor(dbPath = null) {
    this.dbPath = dbPath || path.join(process.cwd(), '.bumba', 'metrics.db');
    this.db = null;
    this.initialized = false;
    this.useMemory = !sqlite3; // Use memory if sqlite3 not available
    this.memoryStore = {
      executions: [],
      specialists: new Map()
    };
  }
  
  /**
   * Initialize database and create tables
   */
  async initialize() {
    if (this.initialized) return;
    
    if (this.useMemory) {
      // Use in-memory storage
      logger.info('📝 Using in-memory storage for context metrics');
      this.initialized = true;
      return;
    }
    
    try {
      // Ensure directory exists
      const dir = path.dirname(this.dbPath);
      await fs.mkdir(dir, { recursive: true });
      
      // Open database
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          logger.error('Failed to open metrics database:', err);
        } else {
          logger.info(`📊 Context metrics database opened at ${this.dbPath}`);
        }
      });
      
      // Create tables
      await this.createTables();
      this.initialized = true;
      
    } catch (error) {
      logger.error('Failed to initialize metrics storage:', error);
      // Fallback to in-memory
      this.useMemory = true;
      this.initialized = true;
    }
  }
  
  /**
   * Create database tables
   */
  async createTables() {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        // Specialist metrics table
        this.db.run(`
          CREATE TABLE IF NOT EXISTS specialist_metrics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            specialist_id TEXT NOT NULL,
            specialist_name TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            input_tokens INTEGER,
            output_tokens INTEGER,
            reduction_ratio REAL,
            execution_time INTEGER
          )
        `, (err) => {
          if (err) logger.error('Failed to create specialist_metrics table:', err);
        });
        
        // Session summary table
        this.db.run(`
          CREATE TABLE IF NOT EXISTS session_metrics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_start DATETIME,
            session_end DATETIME,
            total_tokens_processed INTEGER,
            total_tokens_returned INTEGER,
            average_reduction REAL,
            specialists_used INTEGER,
            total_executions INTEGER
          )
        `, (err) => {
          if (err) logger.error('Failed to create session_metrics table:', err);
        });
        
        // Daily aggregates table
        this.db.run(`
          CREATE TABLE IF NOT EXISTS daily_metrics (
            date DATE PRIMARY KEY,
            total_tokens_saved INTEGER,
            average_reduction REAL,
            total_executions INTEGER,
            top_performer TEXT,
            top_reduction REAL
          )
        `, (err) => {
          if (err) logger.error('Failed to create daily_metrics table:', err);
          else resolve();
        });
        
        // Create indexes for performance
        this.db.run(`
          CREATE INDEX IF NOT EXISTS idx_specialist_timestamp 
          ON specialist_metrics(specialist_id, timestamp)
        `);
        
        this.db.run(`
          CREATE INDEX IF NOT EXISTS idx_daily_date 
          ON daily_metrics(date)
        `);
      });
    });
  }
  
  /**
   * Store specialist execution metrics
   */
  async storeExecution(metrics) {
    if (!this.initialized) await this.initialize();
    
    const { specialistId, specialistName, inputTokens, outputTokens, reduction, executionTime } = metrics;
    
    if (this.useMemory) {
      // Store in memory
      this.memoryStore.executions.push({
        specialist_id: specialistId,
        specialist_name: specialistName,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        reduction_ratio: reduction,
        execution_time: executionTime,
        timestamp: new Date().toISOString()
      });
      
      // Update specialist stats
      if (!this.memoryStore.specialists.has(specialistId)) {
        this.memoryStore.specialists.set(specialistId, {
          name: specialistName,
          executions: 0,
          total_saved: 0,
          avg_reduction: 0
        });
      }
      
      const stats = this.memoryStore.specialists.get(specialistId);
      stats.executions++;
      stats.total_saved += (inputTokens - outputTokens);
      stats.avg_reduction = ((stats.avg_reduction * (stats.executions - 1)) + reduction) / stats.executions;
      
      return Promise.resolve();
    }
    
    return new Promise((resolve, reject) => {
      this.db.run(`
        INSERT INTO specialist_metrics 
        (specialist_id, specialist_name, input_tokens, output_tokens, reduction_ratio, execution_time)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [specialistId, specialistName, inputTokens, outputTokens, reduction, executionTime],
      (err) => {
        if (err) {
          logger.error('Failed to store execution metrics:', err);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
  
  /**
   * Get specialist metrics
   */
  async getSpecialistMetrics(specialistId, limit = 100) {
    if (!this.initialized) await this.initialize();
    
    if (this.useMemory) {
      const executions = this.memoryStore.executions
        .filter(e => e.specialist_id === specialistId)
        .slice(-limit);
      return Promise.resolve(executions);
    }
    
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT * FROM specialist_metrics 
        WHERE specialist_id = ? 
        ORDER BY timestamp DESC 
        LIMIT ?
      `, [specialistId, limit],
      (err, rows) => {
        if (err) {
          logger.error('Failed to get specialist metrics:', err);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }
  
  /**
   * Get aggregated metrics for all specialists
   */
  async getAggregatedMetrics() {
    if (!this.initialized) await this.initialize();
    
    if (this.useMemory) {
      const aggregated = [];
      for (const [id, stats] of this.memoryStore.specialists) {
        aggregated.push({
          specialist_id: id,
          specialist_name: stats.name,
          executions: stats.executions,
          tokens_saved: stats.total_saved,
          avg_reduction: stats.avg_reduction
        });
      }
      return Promise.resolve(aggregated);
    }
    
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT 
          specialist_id,
          specialist_name,
          COUNT(*) as executions,
          SUM(input_tokens) as total_input,
          SUM(output_tokens) as total_output,
          AVG(reduction_ratio) as avg_reduction,
          SUM(input_tokens - output_tokens) as tokens_saved
        FROM specialist_metrics
        GROUP BY specialist_id
        ORDER BY tokens_saved DESC
      `, (err, rows) => {
        if (err) {
          logger.error('Failed to get aggregated metrics:', err);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }
  
  /**
   * Store daily metrics
   */
  async storeDailyMetrics() {
    if (!this.initialized) await this.initialize();
    
    const today = new Date().toISOString().split('T')[0];
    
    return new Promise((resolve, reject) => {
      this.db.get(`
        SELECT 
          SUM(input_tokens - output_tokens) as tokens_saved,
          AVG(reduction_ratio) as avg_reduction,
          COUNT(*) as executions,
          specialist_id as top_performer,
          MAX(reduction_ratio) as top_reduction
        FROM specialist_metrics
        WHERE DATE(timestamp) = ?
        GROUP BY DATE(timestamp)
      `, [today],
      (err, row) => {
        if (err) {
          logger.error('Failed to calculate daily metrics:', err);
          reject(err);
        } else if (row) {
          // Store or update daily metrics
          this.db.run(`
            INSERT OR REPLACE INTO daily_metrics
            (date, total_tokens_saved, average_reduction, total_executions, top_performer, top_reduction)
            VALUES (?, ?, ?, ?, ?, ?)
          `, [today, row.tokens_saved, row.avg_reduction, row.executions, row.top_performer, row.top_reduction],
          (err) => {
            if (err) reject(err);
            else resolve();
          });
        } else {
          resolve();
        }
      });
    });
  }
  
  /**
   * Get recent daily metrics
   */
  async getDailyMetrics(days = 7) {
    if (!this.initialized) await this.initialize();
    
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT * FROM daily_metrics
        ORDER BY date DESC
        LIMIT ?
      `, [days],
      (err, rows) => {
        if (err) {
          logger.error('Failed to get daily metrics:', err);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }
  
  /**
   * Close database connection
   */
  async close() {
    if (this.db) {
      return new Promise((resolve) => {
        this.db.close((err) => {
          if (err) logger.error('Error closing database:', err);
          else logger.info('📊 Metrics database closed');
          resolve();
        });
      });
    }
  }
}

// Singleton instance
let instance = null;

function getInstance() {
  if (!instance) {
    instance = new ContextMetricsStorage();
  }
  return instance;
}

module.exports = {
  getInstance,
  ContextMetricsStorage
};
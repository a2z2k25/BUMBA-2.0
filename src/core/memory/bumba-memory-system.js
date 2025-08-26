/**
 * BUMBA Memory System
 * Inspired by Claude-Flow's SQLite persistence
 * Provides learning and context retention across sessions
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { logger } = require('../logging/bumba-logger');
const { getValidationMetrics } = require('../validation/validation-metrics');

class BumbaMemorySystem {
  constructor(config = {}) {
    this.config = {
      dbPath: path.join(process.cwd(), '.bumba', 'memory.db'),
      maxEntries: 10000,
      ttlDays: 30,
      enableCompression: true,
      enableLearning: true,
      ...config
    };
    
    // Ensure .bumba directory exists
    const bumbaDir = path.dirname(this.config.dbPath);
    if (!fs.existsSync(bumbaDir)) {
      fs.mkdirSync(bumbaDir, { recursive: true });
    }
    
    // Initialize database
    this.db = new Database(this.config.dbPath);
    this.initializeTables();
    
    // Memory categories
    this.categories = {
      VALIDATION: 'validation',
      SPECIALIST: 'specialist',
      DECISION: 'decision',
      PATTERN: 'pattern',
      CONTEXT: 'context',
      ERROR: 'error',
      SUCCESS: 'success'
    };
    
    // Pattern recognition
    this.patterns = new Map();
    this.learningThreshold = 3; // Minimum occurrences to learn pattern
    
    logger.info(`🧠 BUMBA Memory System initialized at ${this.config.dbPath}`);
  }

  /**
   * Initialize database tables
   */
  initializeTables() {
    // Validation history table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS validation_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        validation_id TEXT UNIQUE,
        manager_id TEXT,
        specialist_id TEXT,
        command TEXT,
        approved BOOLEAN,
        quality_score INTEGER,
        meta_validation_score INTEGER,
        issues TEXT,
        feedback TEXT,
        timestamp INTEGER,
        session_id TEXT
      )
    `);
    
    // Specialist performance table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS specialist_performance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        specialist_id TEXT,
        task_type TEXT,
        success_rate REAL,
        avg_revision_count REAL,
        trust_score REAL,
        common_issues TEXT,
        last_updated INTEGER
      )
    `);
    
    // Decision log table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS decision_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        decision_id TEXT UNIQUE,
        decision_type TEXT,
        context TEXT,
        choice TEXT,
        outcome TEXT,
        success BOOLEAN,
        confidence REAL,
        timestamp INTEGER
      )
    `);
    
    // Learned patterns table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS learned_patterns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pattern_type TEXT,
        pattern_signature TEXT UNIQUE,
        occurrences INTEGER,
        success_rate REAL,
        recommended_action TEXT,
        metadata TEXT,
        last_seen INTEGER
      )
    `);
    
    // Conversation context table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS conversation_context (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT,
        context_type TEXT,
        key TEXT,
        value TEXT,
        importance INTEGER,
        timestamp INTEGER
      )
    `);
    
    // Error patterns table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS error_patterns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        error_type TEXT,
        error_message TEXT,
        stack_trace TEXT,
        resolution TEXT,
        occurrence_count INTEGER,
        last_occurred INTEGER
      )
    `);
    
    // Create indexes for performance
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_validation_timestamp ON validation_history(timestamp);
      CREATE INDEX IF NOT EXISTS idx_specialist_performance ON specialist_performance(specialist_id);
      CREATE INDEX IF NOT EXISTS idx_patterns_signature ON learned_patterns(pattern_signature);
      CREATE INDEX IF NOT EXISTS idx_context_session ON conversation_context(session_id);
    `);
  }

  /**
   * Record a validation event with learning
   */
  async recordValidation(validation, metaValidation) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO validation_history 
      (validation_id, manager_id, specialist_id, command, approved, 
       quality_score, meta_validation_score, issues, feedback, timestamp, session_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      validation.id || `val-${Date.now()}`,
      validation.manager,
      validation.specialist,
      validation.command,
      validation.approved ? 1 : 0,
      validation.confidence ? Math.round(validation.confidence * 100) : 0,
      metaValidation?.qualityScore || 0,
      JSON.stringify(validation.issues || []),
      JSON.stringify(validation.feedback || []),
      Date.now(),
      this.getCurrentSessionId()
    );
    
    // Learn from this validation
    if (this.config.enableLearning) {
      await this.learnFromValidation(validation, metaValidation);
    }
    
    logger.debug('📝 Validation recorded to memory');
  }

  /**
   * Learn patterns from validation
   */
  async learnFromValidation(validation, metaValidation) {
    // Track specialist performance patterns
    if (validation.specialist) {
      await this.updateSpecialistPerformance(validation.specialist, validation);
    }
    
    // Learn error patterns
    if (!validation.approved && validation.issues) {
      for (const issue of validation.issues) {
        await this.learnErrorPattern(issue, validation);
      }
    }
    
    // Learn success patterns
    if (validation.approved && metaValidation?.qualityScore > 80) {
      await this.learnSuccessPattern(validation);
    }
  }

  /**
   * Update specialist performance metrics
   */
  async updateSpecialistPerformance(specialistId, validation) {
    // Get existing performance data
    const existing = this.db.prepare(
      'SELECT * FROM specialist_performance WHERE specialist_id = ?'
    ).get(specialistId);
    
    let successRate = validation.approved ? 1 : 0;
    let avgRevisionCount = validation.revisionAttempts || 0;
    let trustScore = validation.confidence || 0.5;
    
    if (existing) {
      // Update with weighted average
      const weight = 0.9; // Weight for existing data
      successRate = weight * existing.success_rate + (1 - weight) * successRate;
      avgRevisionCount = weight * existing.avg_revision_count + (1 - weight) * avgRevisionCount;
      trustScore = weight * existing.trust_score + (1 - weight) * trustScore;
    }
    
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO specialist_performance
      (specialist_id, task_type, success_rate, avg_revision_count, trust_score, common_issues, last_updated)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      specialistId,
      validation.command || 'general',
      successRate,
      avgRevisionCount,
      trustScore,
      JSON.stringify(validation.issues || []),
      Date.now()
    );
  }

  /**
   * Learn from error patterns
   */
  async learnErrorPattern(issue, validation) {
    const signature = `${issue.type}:${issue.severity}`;
    
    const existing = this.db.prepare(
      'SELECT * FROM learned_patterns WHERE pattern_signature = ?'
    ).get(signature);
    
    if (existing) {
      // Update existing pattern
      this.db.prepare(`
        UPDATE learned_patterns 
        SET occurrences = occurrences + 1, last_seen = ?
        WHERE pattern_signature = ?
      `).run(Date.now(), signature);
      
      // If pattern occurs frequently, generate recommendation
      if (existing.occurrences >= this.learningThreshold) {
        await this.generateRecommendation(signature, issue);
      }
    } else {
      // Create new pattern
      this.db.prepare(`
        INSERT INTO learned_patterns
        (pattern_type, pattern_signature, occurrences, success_rate, recommended_action, metadata, last_seen)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        'error',
        signature,
        1,
        0,
        '',
        JSON.stringify(issue),
        Date.now()
      );
    }
  }

  /**
   * Learn from success patterns
   */
  async learnSuccessPattern(validation) {
    const signature = `success:${validation.command}:${validation.specialist}`;
    
    const existing = this.db.prepare(
      'SELECT * FROM learned_patterns WHERE pattern_signature = ?'
    ).get(signature);
    
    if (existing) {
      // Update success rate
      const newSuccessRate = (existing.success_rate * existing.occurrences + 1) / (existing.occurrences + 1);
      
      this.db.prepare(`
        UPDATE learned_patterns 
        SET occurrences = occurrences + 1, 
            success_rate = ?,
            last_seen = ?
        WHERE pattern_signature = ?
      `).run(newSuccessRate, Date.now(), signature);
    } else {
      // Create new success pattern
      this.db.prepare(`
        INSERT INTO learned_patterns
        (pattern_type, pattern_signature, occurrences, success_rate, recommended_action, metadata, last_seen)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        'success',
        signature,
        1,
        1.0,
        `Use ${validation.specialist} for ${validation.command}`,
        JSON.stringify({ command: validation.command, specialist: validation.specialist }),
        Date.now()
      );
    }
  }

  /**
   * Generate recommendation based on patterns
   */
  async generateRecommendation(signature, issue) {
    // Analyze similar past resolutions
    const resolutions = this.db.prepare(`
      SELECT feedback FROM validation_history 
      WHERE issues LIKE ? AND approved = 1
      LIMIT 5
    `).all(`%${issue.type}%`);
    
    if (resolutions.length > 0) {
      // Extract common feedback patterns
      const commonFeedback = this.extractCommonPatterns(resolutions);
      
      this.db.prepare(`
        UPDATE learned_patterns 
        SET recommended_action = ?
        WHERE pattern_signature = ?
      `).run(commonFeedback, signature);
      
      logger.info(`🟡 Learned recommendation for ${signature}: ${commonFeedback}`);
    }
  }

  /**
   * Query memory for similar validations
   */
  async querySimilarValidations(command, specialist = null) {
    let query = `
      SELECT * FROM validation_history 
      WHERE command = ?
    `;
    const params = [command];
    
    if (specialist) {
      query += ' AND specialist_id = ?';
      params.push(specialist);
    }
    
    query += ' ORDER BY timestamp DESC LIMIT 10';
    
    return this.db.prepare(query).all(...params);
  }

  /**
   * Get specialist recommendations based on history
   */
  async getSpecialistRecommendation(taskType) {
    const specialists = this.db.prepare(`
      SELECT specialist_id, success_rate, trust_score
      FROM specialist_performance
      WHERE task_type = ?
      ORDER BY success_rate DESC, trust_score DESC
      LIMIT 3
    `).all(taskType);
    
    if (specialists.length > 0) {
      logger.info(`💡 Recommended specialists for ${taskType}:`, 
        specialists.map(s => `${s.specialist_id} (${(s.success_rate * 100).toFixed(1)}%)`).join(', ')
      );
    }
    
    return specialists;
  }

  /**
   * Store conversation context
   */
  async storeContext(key, value, importance = 5) {
    this.db.prepare(`
      INSERT INTO conversation_context
      (session_id, context_type, key, value, importance, timestamp)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      this.getCurrentSessionId(),
      'conversation',
      key,
      JSON.stringify(value),
      importance,
      Date.now()
    );
  }

  /**
   * Retrieve conversation context
   */
  async getContext(sessionId = null) {
    const sid = sessionId || this.getCurrentSessionId();
    
    return this.db.prepare(`
      SELECT * FROM conversation_context
      WHERE session_id = ?
      ORDER BY importance DESC, timestamp DESC
    `).all(sid);
  }

  /**
   * Get memory statistics
   */
  getStatistics() {
    const stats = {
      totalValidations: this.db.prepare('SELECT COUNT(*) as count FROM validation_history').get().count,
      totalPatterns: this.db.prepare('SELECT COUNT(*) as count FROM learned_patterns').get().count,
      specialists: this.db.prepare('SELECT COUNT(DISTINCT specialist_id) as count FROM specialist_performance').get().count,
      avgQualityScore: this.db.prepare('SELECT AVG(quality_score) as avg FROM validation_history').get().avg || 0,
      topPatterns: this.db.prepare(`
        SELECT pattern_signature, occurrences, success_rate 
        FROM learned_patterns 
        ORDER BY occurrences DESC 
        LIMIT 5
      `).all()
    };
    
    return stats;
  }

  /**
   * Clean old entries based on TTL
   */
  async cleanup() {
    const cutoffTime = Date.now() - (this.config.ttlDays * 24 * 60 * 60 * 1000);
    
    this.db.prepare('DELETE FROM validation_history WHERE timestamp < ?').run(cutoffTime);
    this.db.prepare('DELETE FROM conversation_context WHERE timestamp < ?').run(cutoffTime);
    this.db.prepare('DELETE FROM learned_patterns WHERE last_seen < ?').run(cutoffTime);
    
    logger.info('🧹 Memory cleanup completed');
  }

  /**
   * Extract common patterns from feedback
   */
  extractCommonPatterns(items) {
    const patterns = {};
    
    items.forEach(item => {
      const feedback = JSON.parse(item.feedback || '[]');
      feedback.forEach(f => {
        patterns[f.message] = (patterns[f.message] || 0) + 1;
      });
    });
    
    // Return most common pattern
    const sorted = Object.entries(patterns).sort((a, b) => b[1] - a[1]);
    return sorted[0] ? sorted[0][0] : 'Review and fix identified issues';
  }

  /**
   * Get current session ID
   */
  getCurrentSessionId() {
    if (!this.sessionId) {
      this.sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    return this.sessionId;
  }

  /**
   * Close database connection
   */
  close() {
    this.db.close();
    logger.info('🧠 Memory system closed');
  }
}

// Singleton instance
let memoryInstance = null;

/**
 * Get memory system singleton
 */
function getBumbaMemory() {
  if (!memoryInstance) {
    memoryInstance = new BumbaMemorySystem();
  }
  return memoryInstance;
}

module.exports = {
  BumbaMemorySystem,
  getBumbaMemory
};
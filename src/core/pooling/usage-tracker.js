/**
 * Usage Tracker for Intelligent Pooling
 * Tracks specialist usage patterns and maintains core pool of most-used specialists
 */

const { logger } = require('../logging/bumba-logger');

class UsageTracker {
  constructor() {
    this.usageStats = new Map();
    this.sessionStats = new Map();
    this.decayInterval = 300000; // 5 minutes
    
    // Start decay timer
    this.startDecayTimer();
    
    logger.debug('Usage tracker initialized');
  }
  
  /**
   * Track specialist usage
   */
  trackUsage(specialistType, department = 'GENERAL', context = {}) {
    const now = Date.now();
    
    // Get or create stats
    const stats = this.usageStats.get(specialistType) || {
      count: 0,
      lastUsed: 0,
      avgDuration: 0,
      contexts: new Map(),
      score: 0,
      sessions: 0,
      department: department
    };
    
    // Update basic stats
    stats.count++;
    stats.lastUsed = now;
    
    // Track context
    if (context.phase) {
      const phaseCount = stats.contexts.get(context.phase) || 0;
      stats.contexts.set(context.phase, phaseCount + 1);
    }
    
    // Update score with recency weight
    stats.score = this.calculateScore(stats);
    
    // Track session
    const sessionKey = this.getSessionKey();
    if (!this.sessionStats.has(sessionKey)) {
      this.sessionStats.set(sessionKey, new Set());
    }
    this.sessionStats.get(sessionKey).add(specialistType);
    stats.sessions++;
    
    this.usageStats.set(specialistType, stats);
    
    logger.debug(`Tracked usage: ${specialistType} (count: ${stats.count}, score: ${stats.score.toFixed(2)})`);
  }
  
  /**
   * Track specialist activation from pool
   */
  trackActivation(specialistType) {
    const stats = this.usageStats.get(specialistType);
    if (stats) {
      stats.lastUsed = Date.now();
      stats.score = this.calculateScore(stats);
    }
  }
  
  /**
   * Calculate usage score with recency weight
   */
  calculateScore(stats) {
    const now = Date.now();
    const recencyHours = (now - stats.lastUsed) / (1000 * 60 * 60);
    
    // Exponential decay based on time since last use
    const recencyMultiplier = Math.exp(-recencyHours / 24); // Half-life of 24 hours
    
    // Base score on usage count
    const baseScore = Math.log10(stats.count + 1) * 10;
    
    // Session bonus (used across multiple sessions)
    const sessionBonus = Math.min(stats.sessions * 2, 10);
    
    // Final score
    return (baseScore + sessionBonus) * recencyMultiplier;
  }
  
  /**
   * Get top N specialists by usage
   */
  getTopSpecialists(n = 5) {
    // Recalculate scores before sorting
    for (const [type, stats] of this.usageStats) {
      stats.score = this.calculateScore(stats);
    }
    
    // Sort by score
    const sorted = Array.from(this.usageStats.entries())
      .sort((a, b) => b[1].score - a[1].score)
      .slice(0, n)
      .map(([type]) => type);
    
    logger.debug(`Top ${n} specialists: ${sorted.join(', ')}`);
    return sorted;
  }
  
  /**
   * Get specialists used in current session
   */
  getSessionSpecialists() {
    const sessionKey = this.getSessionKey();
    const specialists = this.sessionStats.get(sessionKey);
    return specialists ? Array.from(specialists) : [];
  }
  
  /**
   * Get usage statistics for a specialist
   */
  getStats(specialistType) {
    return this.usageStats.get(specialistType) || null;
  }
  
  /**
   * Get all usage statistics
   */
  getAllStats() {
    const stats = {};
    for (const [type, data] of this.usageStats) {
      stats[type] = {
        ...data,
        contexts: Array.from(data.contexts.entries())
      };
    }
    return stats;
  }
  
  /**
   * Get scores for all specialists
   */
  getScores() {
    return Array.from(this.usageStats.entries())
      .map(([specialist, stats]) => ({
        specialist,
        score: stats.score,
        count: stats.count,
        lastUsed: stats.lastUsed,
        department: stats.department || 'GENERAL'
      }))
      .sort((a, b) => b.score - a.score);
  }
  
  /**
   * Get score for specific specialist
   */
  getScore(specialist) {
    const stats = this.usageStats.get(specialist);
    return stats ? stats.score : 0;
  }
  
  /**
   * Get department usage
   */
  getDepartmentUsage(department) {
    let totalUsage = 0;
    for (const [specialist, stats] of this.usageStats) {
      if (stats.department === department) {
        totalUsage += stats.count;
      }
    }
    return totalUsage;
  }
  
  /**
   * Reset tracker
   */
  reset() {
    this.usageStats.clear();
    this.sessionStats.clear();
    logger.debug('Usage tracker reset');
  }
  
  /**
   * Start decay timer to reduce scores over time
   */
  startDecayTimer() {
    setInterval(() => {
      this.decayScores();
    }, this.decayInterval);
  }
  
  /**
   * Decay scores for unused specialists
   */
  decayScores() {
    const now = Date.now();
    const decayThreshold = 300000; // 5 minutes
    
    for (const [type, stats] of this.usageStats) {
      const idleTime = now - stats.lastUsed;
      
      if (idleTime > decayThreshold) {
        // Reduce score for idle specialists
        stats.score = this.calculateScore(stats);
        
        // Remove if score too low and not recently used
        if (stats.score < 1 && idleTime > 3600000) { // 1 hour
          this.usageStats.delete(type);
          logger.debug(`Removed stale specialist from usage: ${type}`);
        }
      }
    }
  }
  
  /**
   * Get session key (for tracking per-session usage)
   */
  getSessionKey() {
    const hour = new Date().getHours();
    const date = new Date().toDateString();
    return `${date}-${Math.floor(hour / 4)}`; // 4-hour sessions
  }
  
  /**
   * Get usage patterns
   */
  getUsagePatterns() {
    const patterns = {
      mostUsed: this.getTopSpecialists(10),
      currentSession: this.getSessionSpecialists(),
      byContext: this.getContextualUsage(),
      totalSpecialists: this.usageStats.size,
      totalUsage: Array.from(this.usageStats.values())
        .reduce((sum, stats) => sum + stats.count, 0)
    };
    
    return patterns;
  }
  
  /**
   * Get contextual usage breakdown
   */
  getContextualUsage() {
    const contextMap = new Map();
    
    for (const [type, stats] of this.usageStats) {
      for (const [context, count] of stats.contexts) {
        if (!contextMap.has(context)) {
          contextMap.set(context, new Map());
        }
        contextMap.get(context).set(type, count);
      }
    }
    
    // Convert to object format
    const result = {};
    for (const [context, specialists] of contextMap) {
      result[context] = Array.from(specialists.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([type, count]) => ({ type, count }));
    }
    
    return result;
  }
  
  /**
   * Clear all usage data
   */
  clear() {
    this.usageStats.clear();
    this.sessionStats.clear();
    logger.debug('Usage tracker cleared');
  }
  
  /**
   * Export usage data for persistence
   */
  export() {
    return {
      usageStats: Array.from(this.usageStats.entries()).map(([type, stats]) => ({
        type,
        ...stats,
        contexts: Array.from(stats.contexts.entries())
      })),
      sessionStats: Array.from(this.sessionStats.entries()).map(([key, types]) => ({
        key,
        types: Array.from(types)
      }))
    };
  }
  
  /**
   * Import usage data
   */
  import(data) {
    if (data.usageStats) {
      for (const item of data.usageStats) {
        const { type, contexts, ...stats } = item;
        stats.contexts = new Map(contexts);
        this.usageStats.set(type, stats);
      }
    }
    
    if (data.sessionStats) {
      for (const item of data.sessionStats) {
        this.sessionStats.set(item.key, new Set(item.types));
      }
    }
    
    logger.debug(`Imported usage data: ${this.usageStats.size} specialists`);
  }
}

module.exports = { UsageTracker };
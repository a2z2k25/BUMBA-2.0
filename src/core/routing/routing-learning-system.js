/**
 * Routing Learning System
 * Learns from past routing decisions to improve future performance
 */

const { logger } = require('../logging/bumba-logger');
const fs = require('fs').promises;
const path = require('path');

class RoutingLearningSystem {
  constructor(config = {}) {
    this.config = {
      persistenceEnabled: config.persistenceEnabled !== false,
      persistencePath: config.persistencePath || path.join(process.cwd(), '.bumba', 'routing-memory.json'),
      maxMemoryEntries: config.maxMemoryEntries || 1000,
      minConfidenceToLearn: config.minConfidenceToLearn || 0.7,
      similarityThreshold: config.similarityThreshold || 0.8,
      ...config
    };
    
    // Memory stores
    this.routingMemory = new Map(); // command pattern -> routing decisions
    this.feedbackMemory = new Map(); // execution id -> feedback
    this.performanceMetrics = new Map(); // agent -> performance stats
    
    // Learning statistics
    this.stats = {
      totalLearnings: 0,
      successfulRoutings: 0,
      failedRoutings: 0,
      averageConfidence: 0,
      modelPerformance: {
        'claude-max': { success: 0, total: 0 },
        'deepseek': { success: 0, total: 0 },
        'qwen': { success: 0, total: 0 },
        'gemini': { success: 0, total: 0 }
      }
    };
    
    // Load persisted memory if available
    this.loadMemory();
  }
  
  /**
   * Learn from a routing decision
   */
  async learnFromRouting(command, args, routingPlan, result) {
    const pattern = this.generatePattern(command, args);
    
    // Create learning entry
    const learning = {
      pattern,
      command,
      args,
      routing: {
        agents: routingPlan.execution.agents,
        confidence: routingPlan.routing.confidence,
        source: routingPlan.routing.source
      },
      result: {
        success: result.success !== false,
        executionTime: result.metrics?.executionTime,
        error: result.error
      },
      timestamp: Date.now()
    };
    
    // Store in memory
    if (!this.routingMemory.has(pattern)) {
      this.routingMemory.set(pattern, []);
    }
    
    const memories = this.routingMemory.get(pattern);
    memories.push(learning);
    
    // Limit memory size per pattern
    if (memories.length > 10) {
      memories.shift(); // Remove oldest
    }
    
    // Update statistics
    this.updateStatistics(learning);
    
    // Update model performance
    this.updateModelPerformance(learning);
    
    // Persist if enabled
    if (this.config.persistenceEnabled) {
      await this.saveMemory();
    }
    
    logger.info(`🟢 Learned from routing: ${pattern}`, {
      success: learning.result.success,
      agents: learning.routing.agents.length,
      confidence: learning.routing.confidence
    });
    
    return learning;
  }
  
  /**
   * Get learned routing for a command
   */
  getLearnedRouting(command, args) {
    const pattern = this.generatePattern(command, args);
    
    // Check exact match first
    if (this.routingMemory.has(pattern)) {
      const memories = this.routingMemory.get(pattern);
      const successful = memories.filter(m => m.result.success);
      
      if (successful.length > 0) {
        // Return most recent successful routing
        const best = successful[successful.length - 1];
        return {
          found: true,
          routing: best.routing,
          confidence: this.calculateConfidenceFromHistory(successful),
          source: 'learned-exact'
        };
      }
    }
    
    // Check similar patterns
    const similar = this.findSimilarPatterns(pattern);
    if (similar.length > 0) {
      const bestSimilar = this.selectBestSimilar(similar);
      return {
        found: true,
        routing: bestSimilar.routing,
        confidence: bestSimilar.confidence * 0.9, // Slightly lower confidence for similar
        source: 'learned-similar'
      };
    }
    
    return {
      found: false,
      routing: null,
      confidence: 0,
      source: 'no-learning'
    };
  }
  
  /**
   * Record feedback for an execution
   */
  async recordFeedback(executionId, feedback) {
    this.feedbackMemory.set(executionId, {
      ...feedback,
      timestamp: Date.now()
    });
    
    // Limit feedback memory size
    if (this.feedbackMemory.size > 100) {
      const oldest = Array.from(this.feedbackMemory.keys())[0];
      this.feedbackMemory.delete(oldest);
    }
    
    logger.info(`🟢 Recorded feedback for execution ${executionId}`);
  }
  
  /**
   * Get routing recommendations based on learning
   */
  getRecommendations(command, args, currentRouting) {
    const recommendations = [];
    const pattern = this.generatePattern(command, args);
    
    // Check if we have successful history
    if (this.routingMemory.has(pattern)) {
      const memories = this.routingMemory.get(pattern);
      const successful = memories.filter(m => m.result.success);
      
      if (successful.length > 0) {
        // Analyze what worked
        const commonAgents = this.findCommonAgents(successful);
        if (commonAgents.length > 0) {
          recommendations.push({
            type: 'agents',
            message: `Consider using these agents (worked ${successful.length} times): ${commonAgents.join(', ')}`,
            confidence: 0.8
          });
        }
        
        // Analyze optimal models
        const optimalModels = this.findOptimalModels(successful);
        if (optimalModels.length > 0) {
          recommendations.push({
            type: 'models',
            message: `Optimal models for this task: ${optimalModels.join(', ')}`,
            confidence: 0.7
          });
        }
      }
      
      // Warn about failures
      const failed = memories.filter(m => !m.result.success);
      if (failed.length > 0) {
        const failureReasons = this.analyzeFailures(failed);
        recommendations.push({
          type: 'warning',
          message: `This command failed ${failed.length} times. Common issues: ${failureReasons.join(', ')}`,
          confidence: 0.9
        });
      }
    }
    
    // General recommendations based on stats
    if (currentRouting.confidence < 0.5) {
      recommendations.push({
        type: 'suggestion',
        message: 'Low confidence routing. Consider specifying more details or breaking into smaller tasks.',
        confidence: 0.6
      });
    }
    
    return recommendations;
  }
  
  /**
   * Generate pattern from command and args
   */
  generatePattern(command, args) {
    const normalizedArgs = args.map(arg => {
      // Replace specific values with types
      if (typeof arg === 'string') {
        if (arg.includes('api')) {return '[api]';}
        if (arg.includes('ui')) {return '[ui]';}
        if (arg.includes('database')) {return '[database]';}
        if (arg.includes('auth')) {return '[auth]';}
        return '[string]';
      }
      return `[${typeof arg}]`;
    });
    
    return `${command}:${normalizedArgs.join(',')}`;
  }
  
  /**
   * Find similar patterns in memory
   */
  findSimilarPatterns(pattern) {
    const similar = [];
    const patternParts = pattern.split(':');
    
    for (const [storedPattern, memories] of this.routingMemory) {
      const storedParts = storedPattern.split(':');
      
      // Check command similarity
      if (patternParts[0] === storedParts[0] || 
          this.areSimilarCommands(patternParts[0], storedParts[0])) {
        
        const similarity = this.calculateSimilarity(pattern, storedPattern);
        if (similarity > this.config.similarityThreshold) {
          similar.push({
            pattern: storedPattern,
            memories,
            similarity
          });
        }
      }
    }
    
    return similar.sort((a, b) => b.similarity - a.similarity);
  }
  
  /**
   * Check if commands are similar
   */
  areSimilarCommands(cmd1, cmd2) {
    const similarGroups = [
      ['implement', 'build', 'create', 'develop'],
      ['analyze', 'review', 'audit', 'examine'],
      ['design', 'ui', 'ux', 'interface'],
      ['test', 'validate', 'verify', 'check']
    ];
    
    for (const group of similarGroups) {
      if (group.includes(cmd1) && group.includes(cmd2)) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Calculate similarity between patterns
   */
  calculateSimilarity(pattern1, pattern2) {
    const parts1 = pattern1.split(/[,:]/);
    const parts2 = pattern2.split(/[,:]/);
    
    let matches = 0;
    const maxLength = Math.max(parts1.length, parts2.length);
    
    for (let i = 0; i < Math.min(parts1.length, parts2.length); i++) {
      if (parts1[i] === parts2[i]) {
        matches++;
      }
    }
    
    return matches / maxLength;
  }
  
  /**
   * Select best similar pattern
   */
  selectBestSimilar(similar) {
    // Find the most successful similar pattern
    let best = null;
    let bestScore = 0;
    
    for (const item of similar) {
      const successful = item.memories.filter(m => m.result.success);
      const score = (successful.length / item.memories.length) * item.similarity;
      
      if (score > bestScore) {
        bestScore = score;
        best = successful[successful.length - 1]; // Most recent successful
      }
    }
    
    return best || similar[0].memories[0];
  }
  
  /**
   * Calculate confidence from history
   */
  calculateConfidenceFromHistory(memories) {
    if (memories.length === 0) {return 0;}
    
    const successRate = memories.filter(m => m.result.success).length / memories.length;
    const recency = Math.min(1, memories.length / 5); // More memories = higher confidence
    const avgConfidence = memories.reduce((sum, m) => sum + m.routing.confidence, 0) / memories.length;
    
    return (successRate * 0.4 + recency * 0.3 + avgConfidence * 0.3);
  }
  
  /**
   * Find common agents in successful routings
   */
  findCommonAgents(memories) {
    const agentCounts = {};
    
    for (const memory of memories) {
      for (const agent of memory.routing.agents) {
        agentCounts[agent.name] = (agentCounts[agent.name] || 0) + 1;
      }
    }
    
    // Return agents that appear in >50% of successful routings
    const threshold = memories.length * 0.5;
    return Object.entries(agentCounts)
      .filter(([_, count]) => count >= threshold)
      .map(([agent, _]) => agent);
  }
  
  /**
   * Find optimal models from successful routings
   */
  findOptimalModels(memories) {
    const modelStats = {};
    
    for (const memory of memories) {
      for (const agent of memory.routing.agents) {
        const model = agent.model;
        if (!modelStats[model]) {
          modelStats[model] = { success: 0, total: 0, avgTime: 0 };
        }
        modelStats[model].total++;
        if (memory.result.success) {
          modelStats[model].success++;
          modelStats[model].avgTime += memory.result.executionTime || 0;
        }
      }
    }
    
    // Return models with >70% success rate
    return Object.entries(modelStats)
      .filter(([_, stats]) => (stats.success / stats.total) > 0.7)
      .map(([model, _]) => model);
  }
  
  /**
   * Analyze failure patterns
   */
  analyzeFailures(failures) {
    const reasons = [];
    
    // Check for common error patterns
    const errors = failures.map(f => f.result.error).filter(Boolean);
    if (errors.length > 0) {
      // Group similar errors
      const errorTypes = new Set(errors.map(e => {
        if (e.includes('timeout')) {return 'timeout';}
        if (e.includes('not found')) {return 'resource not found';}
        if (e.includes('permission')) {return 'permission denied';}
        return 'execution error';
      }));
      reasons.push(...errorTypes);
    }
    
    return reasons.length > 0 ? reasons : ['unknown errors'];
  }
  
  /**
   * Update statistics
   */
  updateStatistics(learning) {
    this.stats.totalLearnings++;
    
    if (learning.result.success) {
      this.stats.successfulRoutings++;
    } else {
      this.stats.failedRoutings++;
    }
    
    // Update average confidence
    const total = this.stats.averageConfidence * (this.stats.totalLearnings - 1);
    this.stats.averageConfidence = (total + learning.routing.confidence) / this.stats.totalLearnings;
  }
  
  /**
   * Update model performance metrics
   */
  updateModelPerformance(learning) {
    for (const agent of learning.routing.agents) {
      const model = agent.model;
      if (this.stats.modelPerformance[model]) {
        this.stats.modelPerformance[model].total++;
        if (learning.result.success) {
          this.stats.modelPerformance[model].success++;
        }
      }
    }
  }
  
  /**
   * Get learning statistics
   */
  getStatistics() {
    // Calculate model success rates
    const modelRates = {};
    for (const [model, stats] of Object.entries(this.stats.modelPerformance)) {
      if (stats.total > 0) {
        modelRates[model] = (stats.success / stats.total * 100).toFixed(1) + '%';
      }
    }
    
    return {
      ...this.stats,
      successRate: this.stats.totalLearnings > 0 
        ? (this.stats.successfulRoutings / this.stats.totalLearnings * 100).toFixed(1) + '%'
        : '0%',
      memorySize: this.routingMemory.size,
      feedbackCount: this.feedbackMemory.size,
      modelSuccessRates: modelRates
    };
  }
  
  /**
   * Load memory from persistence
   */
  async loadMemory() {
    if (!this.config.persistenceEnabled) {return;}
    
    try {
      const data = await fs.readFile(this.config.persistencePath, 'utf8');
      const parsed = JSON.parse(data);
      
      // Restore routing memory
      if (parsed.routingMemory) {
        this.routingMemory = new Map(parsed.routingMemory);
      }
      
      // Restore statistics
      if (parsed.stats) {
        this.stats = parsed.stats;
      }
      
      logger.info(`🟢 Loaded routing memory: ${this.routingMemory.size} patterns`);
      
    } catch (error) {
      // File doesn't exist or is invalid, start fresh
      logger.info('🟢 Starting with fresh routing memory');
    }
  }
  
  /**
   * Save memory to persistence
   */
  async saveMemory() {
    if (!this.config.persistenceEnabled) {return;}
    
    try {
      const data = {
        routingMemory: Array.from(this.routingMemory.entries()),
        stats: this.stats,
        savedAt: new Date().toISOString()
      };
      
      // Ensure directory exists
      const dir = path.dirname(this.config.persistencePath);
      await fs.mkdir(dir, { recursive: true });
      
      // Save to file
      await fs.writeFile(
        this.config.persistencePath,
        JSON.stringify(data, null, 2),
        'utf8'
      );
      
    } catch (error) {
      logger.error(`Failed to save routing memory: ${error.message}`);
    }
  }
  
  /**
   * Clear all memory
   */
  clearMemory() {
    this.routingMemory.clear();
    this.feedbackMemory.clear();
    this.performanceMetrics.clear();
    
    // Reset stats
    this.stats = {
      totalLearnings: 0,
      successfulRoutings: 0,
      failedRoutings: 0,
      averageConfidence: 0,
      modelPerformance: {
        'claude-max': { success: 0, total: 0 },
        'deepseek': { success: 0, total: 0 },
        'qwen': { success: 0, total: 0 },
        'gemini': { success: 0, total: 0 }
      }
    };
    
    logger.info('🟢 Cleared all routing memory');
  }
}

// Singleton instance
let instance = null;

module.exports = {
  RoutingLearningSystem,
  getInstance: (config) => {
    if (!instance) {
      instance = new RoutingLearningSystem(config);
    }
    return instance;
  }
};
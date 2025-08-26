/**
 * Routing Performance Optimizer
 * Optimizes routing decisions for speed and efficiency
 */

const { logger } = require('../logging/bumba-logger');

class RoutingPerformanceOptimizer {
  constructor(config = {}) {
    this.config = {
      enableCaching: config.enableCaching !== false,
      cacheSize: config.cacheSize || 100,
      cacheTTL: config.cacheTTL || 60000, // 1 minute
      enableBatching: config.enableBatching !== false,
      batchSize: config.batchSize || 5,
      batchTimeout: config.batchTimeout || 100,
      ...config
    };
    
    // Performance caches
    this.routingCache = new Map();
    this.analysisCache = new Map();
    this.modelAssignmentCache = new Map();
    
    // Batching
    this.pendingBatch = [];
    this.batchTimer = null;
    
    // Metrics
    this.metrics = {
      cacheHits: 0,
      cacheMisses: 0,
      totalRoutings: 0,
      averageRoutingTime: 0,
      batchesProcessed: 0,
      optimizationsApplied: 0
    };
  }
  
  /**
   * Optimize routing request
   */
  async optimizeRouting(command, args, routingFn) {
    const startTime = Date.now();
    this.metrics.totalRoutings++;
    
    // Check cache first
    if (this.config.enableCaching) {
      const cached = this.getCachedRouting(command, args);
      if (cached) {
        this.metrics.cacheHits++;
        logger.info(`🟢 Cache hit for routing: ${command}`);
        return cached;
      }
      this.metrics.cacheMisses++;
    }
    
    // Perform routing
    const result = await routingFn(command, args);
    
    // Cache result
    if (this.config.enableCaching) {
      this.cacheRouting(command, args, result);
    }
    
    // Update metrics
    const routingTime = Date.now() - startTime;
    this.updateMetrics(routingTime);
    
    // Apply optimizations
    const optimized = this.applyOptimizations(result);
    
    return optimized;
  }
  
  /**
   * Get cached routing
   */
  getCachedRouting(command, args) {
    const key = this.generateCacheKey(command, args);
    const cached = this.routingCache.get(key);
    
    if (!cached) {return null;}
    
    // Check TTL
    if (Date.now() - cached.timestamp > this.config.cacheTTL) {
      this.routingCache.delete(key);
      return null;
    }
    
    return cached.data;
  }
  
  /**
   * Cache routing result
   */
  cacheRouting(command, args, result) {
    const key = this.generateCacheKey(command, args);
    
    this.routingCache.set(key, {
      data: result,
      timestamp: Date.now()
    });
    
    // Limit cache size
    if (this.routingCache.size > this.config.cacheSize) {
      const firstKey = this.routingCache.keys().next().value;
      this.routingCache.delete(firstKey);
    }
  }
  
  /**
   * Generate cache key
   */
  generateCacheKey(command, args) {
    return `${command}:${JSON.stringify(args)}`;
  }
  
  /**
   * Apply routing optimizations
   */
  applyOptimizations(routing) {
    const optimized = { ...routing };
    let optimizationCount = 0;
    
    // Optimization 1: Remove duplicate agents
    if (optimized.execution?.agents) {
      const uniqueAgents = [];
      const seen = new Set();
      
      for (const agent of optimized.execution.agents) {
        const key = `${agent.name}-${agent.role}`;
        if (!seen.has(key)) {
          seen.add(key);
          uniqueAgents.push(agent);
        }
      }
      
      if (uniqueAgents.length < optimized.execution.agents.length) {
        optimized.execution.agents = uniqueAgents;
        optimizationCount++;
      }
    }
    
    // Optimization 2: Prioritize faster models for time-sensitive tasks
    if (optimized.execution?.agents && optimized.priority === 'high') {
      for (const agent of optimized.execution.agents) {
        if (agent.model === 'deepseek' && agent.role === 'specialist') {
          // Switch to Gemini for faster response on high priority
          agent.model = 'gemini';
          optimizationCount++;
        }
      }
    }
    
    // Optimization 3: Batch similar specialists
    if (optimized.execution?.agents) {
      const specialists = optimized.execution.agents.filter(a => a.role === 'specialist');
      if (specialists.length > 3) {
        // Mark for batched execution
        optimized.execution.batchedExecution = true;
        optimized.execution.batchSize = Math.min(this.config.batchSize, specialists.length);
        optimizationCount++;
      }
    }
    
    if (optimizationCount > 0) {
      this.metrics.optimizationsApplied += optimizationCount;
      logger.info(`🟢 Applied ${optimizationCount} optimizations`);
    }
    
    return optimized;
  }
  
  /**
   * Batch routing requests
   */
  async batchRouting(command, args, routingFn) {
    return new Promise((resolve) => {
      // Add to batch
      this.pendingBatch.push({
        command,
        args,
        routingFn,
        resolve
      });
      
      // Process batch if full
      if (this.pendingBatch.length >= this.config.batchSize) {
        this.processBatch();
      } else {
        // Set timer for batch timeout
        if (!this.batchTimer) {
          this.batchTimer = setTimeout(() => {
            this.processBatch();
          }, this.config.batchTimeout);
        }
      }
    });
  }
  
  /**
   * Process pending batch
   */
  async processBatch() {
    if (this.pendingBatch.length === 0) {return;}
    
    const batch = this.pendingBatch.splice(0, this.config.batchSize);
    clearTimeout(this.batchTimer);
    this.batchTimer = null;
    
    logger.info(`🟢 Processing batch of ${batch.length} routing requests`);
    
    // Process in parallel
    const promises = batch.map(async (item) => {
      try {
        const result = await this.optimizeRouting(
          item.command,
          item.args,
          item.routingFn
        );
        item.resolve(result);
      } catch (error) {
        item.resolve({ error: error.message });
      }
    });
    
    await Promise.all(promises);
    this.metrics.batchesProcessed++;
    
    // Process remaining if any
    if (this.pendingBatch.length > 0) {
      this.batchTimer = setTimeout(() => {
        this.processBatch();
      }, 0);
    }
  }
  
  /**
   * Optimize model assignment
   */
  optimizeModelAssignment(agents) {
    const optimized = [...agents];
    
    // Group agents by task type for efficient model usage
    const taskGroups = {};
    for (const agent of optimized) {
      const taskType = this.getTaskType(agent);
      if (!taskGroups[taskType]) {
        taskGroups[taskType] = [];
      }
      taskGroups[taskType].push(agent);
    }
    
    // Assign models to minimize switching overhead
    for (const [taskType, group] of Object.entries(taskGroups)) {
      const optimalModel = this.getOptimalModel(taskType, group.length);
      for (const agent of group) {
        if (agent.role !== 'manager' && !agent.usingClaudeMax) {
          agent.model = optimalModel;
        }
      }
    }
    
    return optimized;
  }
  
  /**
   * Get task type from agent
   */
  getTaskType(agent) {
    if (agent.name.includes('database') || agent.name.includes('backend')) {
      return 'coding';
    }
    if (agent.name.includes('security') || agent.name.includes('research')) {
      return 'reasoning';
    }
    return 'general';
  }
  
  /**
   * Get optimal model for task type and group size
   */
  getOptimalModel(taskType, groupSize) {
    // For large groups, prefer faster models
    if (groupSize > 3) {
      return 'gemini'; // Fastest
    }
    
    // Otherwise use task-appropriate model
    switch (taskType) {
      case 'coding':
        return 'qwen';
      case 'reasoning':
        return 'deepseek';
      default:
        return 'gemini';
    }
  }
  
  /**
   * Preload common routes
   */
  async preloadCommonRoutes(routes, routingFn) {
    logger.info(`🟢 Preloading ${routes.length} common routes`);
    
    const promises = routes.map(async ({ command, args }) => {
      if (!this.getCachedRouting(command, args)) {
        const result = await routingFn(command, args);
        this.cacheRouting(command, args, result);
      }
    });
    
    await Promise.all(promises);
    logger.info('🟢 Preloading complete');
  }
  
  /**
   * Clear caches
   */
  clearCaches() {
    this.routingCache.clear();
    this.analysisCache.clear();
    this.modelAssignmentCache.clear();
    
    logger.info('🟢 Performance caches cleared');
  }
  
  /**
   * Update metrics
   */
  updateMetrics(routingTime) {
    const total = this.metrics.averageRoutingTime * (this.metrics.totalRoutings - 1);
    this.metrics.averageRoutingTime = (total + routingTime) / this.metrics.totalRoutings;
  }
  
  /**
   * Get performance metrics
   */
  getMetrics() {
    const cacheHitRate = this.metrics.totalRoutings > 0
      ? (this.metrics.cacheHits / this.metrics.totalRoutings * 100).toFixed(1)
      : 0;
    
    return {
      ...this.metrics,
      cacheHitRate: `${cacheHitRate}%`,
      averageRoutingTime: `${this.metrics.averageRoutingTime.toFixed(0)}ms`,
      cacheSize: this.routingCache.size,
      pendingBatch: this.pendingBatch.length
    };
  }
  
  /**
   * Analyze routing patterns for optimization
   */
  analyzeRoutingPatterns(history) {
    const patterns = {
      commonCommands: {},
      commonAgents: {},
      commonModels: {},
      peakTimes: []
    };
    
    for (const entry of history) {
      // Track command frequency
      patterns.commonCommands[entry.command] = 
        (patterns.commonCommands[entry.command] || 0) + 1;
      
      // Track agent usage
      if (entry.agents) {
        for (const agent of entry.agents) {
          patterns.commonAgents[agent] = 
            (patterns.commonAgents[agent] || 0) + 1;
        }
      }
      
      // Track model usage
      if (entry.models) {
        for (const model of entry.models) {
          patterns.commonModels[model] = 
            (patterns.commonModels[model] || 0) + 1;
        }
      }
    }
    
    // Sort by frequency
    patterns.topCommands = Object.entries(patterns.commonCommands)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cmd, count]) => ({ command: cmd, count }));
    
    patterns.topAgents = Object.entries(patterns.commonAgents)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([agent, count]) => ({ agent, count }));
    
    return patterns;
  }
  
  /**
   * Generate optimization recommendations
   */
  generateRecommendations(patterns) {
    const recommendations = [];
    
    // Recommend preloading for common commands
    if (patterns.topCommands && patterns.topCommands.length > 0) {
      recommendations.push({
        type: 'preload',
        message: `Preload these common commands: ${patterns.topCommands.map(c => c.command).join(', ')}`,
        impact: 'high'
      });
    }
    
    // Recommend caching adjustments
    if (this.metrics.cacheHitRate < 30) {
      recommendations.push({
        type: 'cache',
        message: 'Consider increasing cache size or TTL for better hit rate',
        impact: 'medium'
      });
    }
    
    // Recommend batching for high volume
    if (this.metrics.totalRoutings > 100 && !this.config.enableBatching) {
      recommendations.push({
        type: 'batching',
        message: 'Enable batching for high-volume routing',
        impact: 'high'
      });
    }
    
    return recommendations;
  }
}

// Singleton instance
let instance = null;

module.exports = {
  RoutingPerformanceOptimizer,
  getInstance: (config) => {
    if (!instance) {
      instance = new RoutingPerformanceOptimizer(config);
    }
    return instance;
  }
};
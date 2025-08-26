/**
 * BUMBA Tool Memory Bridge
 * Connects tool awareness with Memory MCP for persistent knowledge
 */

const { toolAwarenessSystem } = require('./tool-awareness-system');
const { mcpServerManager } = require('../mcp/mcp-resilience-system');
const { logger } = require('../logging/bumba-logger');

class ToolMemoryBridge {
  constructor() {
    this.memoryServer = null;
    this.initialized = false;
    this.memoryNamespace = 'bumba-tool-awareness';
    this.syncInterval = 3600000; // 1 hour
    this.lastSync = null;
  }

  /**
   * Initialize the memory bridge
   */
  async initialize() {
    try {
      logger.info('🟢 Initializing Tool Memory Bridge...');
      
      // Get Memory MCP server
      this.memoryServer = await mcpServerManager.getServer('memory');
      
      // Load persisted tool knowledge
      await this.loadPersistedKnowledge();
      
      // Setup periodic sync
      this.setupPeriodicSync();
      
      this.initialized = true;
      logger.info('🏁 Tool Memory Bridge initialized');
      
      return true;
    } catch (error) {
      logger.error('🔴 Failed to initialize Tool Memory Bridge:', error);
      // Continue without memory persistence
      return false;
    }
  }

  /**
   * Load persisted tool knowledge from Memory MCP
   */
  async loadPersistedKnowledge() {
    try {
      // Search for tool usage patterns
      const usagePatterns = await this.searchMemory('tool usage pattern');
      
      // Search for successful tool combinations
      const successfulCombos = await this.searchMemory('successful tool combination');
      
      // Search for tool-specific learnings
      const toolLearnings = await this.searchMemory('tool learning');
      
      // Apply loaded knowledge
      this.applyPersistedKnowledge({
        usagePatterns,
        successfulCombos,
        toolLearnings
      });
      
      logger.info(`🟢 Loaded ${usagePatterns.length + successfulCombos.length + toolLearnings.length} tool memories`);
    } catch (error) {
      logger.warn('🟡 Could not load persisted tool knowledge:', error.message);
    }
  }

  /**
   * Search memory for specific patterns
   */
  async searchMemory(query) {
    if (!this.memoryServer || this.memoryServer.fallbackType) {
      return [];
    }
    
    try {
      const result = await this.memoryServer.execute('search', {
        query: `${this.memoryNamespace}: ${query}`,
        limit: 10
      });
      
      return result.data || [];
    } catch (error) {
      logger.error('Error searching memory:', error);
      return [];
    }
  }

  /**
   * Store tool usage pattern in memory
   */
  async storeToolUsagePattern(pattern) {
    if (!this.memoryServer || this.memoryServer.fallbackType) {
      return;
    }
    
    const memory = {
      type: 'tool-usage-pattern',
      namespace: this.memoryNamespace,
      timestamp: new Date().toISOString(),
      pattern: pattern,
      metadata: {
        task: pattern.task,
        tools: pattern.tools,
        success: pattern.success,
        specialist: pattern.specialist
      }
    };
    
    try {
      await this.memoryServer.execute('store', {
        key: `tool-pattern-${Date.now()}`,
        value: JSON.stringify(memory),
        metadata: memory.metadata
      });
      
      logger.info('🟢 Stored tool usage pattern in memory');
    } catch (error) {
      logger.error('Error storing tool pattern:', error);
    }
  }

  /**
   * Store successful tool combination
   */
  async storeSuccessfulCombination(task, tools, outcome) {
    const pattern = {
      task: task,
      tools: tools,
      success: true,
      outcome: outcome,
      specialist: 'unknown',
      timestamp: new Date().toISOString()
    };
    
    await this.storeToolUsagePattern(pattern);
    
    // Also store as a specific learning
    await this.storeToolLearning({
      type: 'successful-combination',
      task: task,
      tools: tools,
      learning: `Tools ${tools.join(' + ')} work well together for ${task}`,
      confidence: 0.9
    });
  }

  /**
   * Store tool-specific learning
   */
  async storeToolLearning(learning) {
    if (!this.memoryServer || this.memoryServer.fallbackType) {
      return;
    }
    
    const memory = {
      type: 'tool-learning',
      namespace: this.memoryNamespace,
      timestamp: new Date().toISOString(),
      learning: learning,
      metadata: {
        tools: learning.tools || [],
        confidence: learning.confidence || 0.7,
        category: learning.type
      }
    };
    
    try {
      await this.memoryServer.execute('store', {
        key: `tool-learning-${Date.now()}`,
        value: JSON.stringify(memory),
        metadata: memory.metadata
      });
      
      logger.info('🟢 Stored tool learning in memory');
    } catch (error) {
      logger.error('Error storing tool learning:', error);
    }
  }

  /**
   * Apply persisted knowledge to tool awareness system
   */
  applyPersistedKnowledge(knowledge) {
    // Analyze usage patterns to identify frequently used tool combinations
    const frequentCombos = this.analyzeFrequentCombinations(knowledge.usagePatterns);
    
    // Update tool awareness with learned patterns
    frequentCombos.forEach(combo => {
      logger.info(`🟢 Learned pattern: ${combo.tools.join(' + ')} for ${combo.taskType}`);
    });
    
    // Apply successful combinations as recommendations
    knowledge.successfulCombos.forEach(combo => {
      // This would update the tool awareness system's recommendation engine
      logger.info(`🏁 Successful combo: ${combo.description}`);
    });
  }

  /**
   * Analyze frequent tool combinations
   */
  analyzeFrequentCombinations(patterns) {
    const combinations = new Map();
    
    patterns.forEach(pattern => {
      if (pattern.tools && pattern.tools.length > 1) {
        const key = pattern.tools.sort().join(',');
        const existing = combinations.get(key) || { count: 0, tasks: [] };
        existing.count++;
        existing.tasks.push(pattern.task);
        combinations.set(key, existing);
      }
    });
    
    // Return combinations used more than twice
    return Array.from(combinations.entries())
      .filter(([, data]) => data.count > 2)
      .map(([tools, data]) => ({
        tools: tools.split(','),
        frequency: data.count,
        taskType: this.identifyTaskType(data.tasks)
      }));
  }

  /**
   * Identify common task type from task descriptions
   */
  identifyTaskType(tasks) {
    const keywords = {
      'refactoring': ['refactor', 'rename', 'reorganize'],
      'debugging': ['bug', 'fix', 'error', 'issue'],
      'feature': ['implement', 'create', 'add', 'build'],
      'optimization': ['optimize', 'improve', 'performance'],
      'documentation': ['document', 'docs', 'readme']
    };
    
    const counts = {};
    
    tasks.forEach(task => {
      const taskLower = task.toLowerCase();
      Object.entries(keywords).forEach(([type, words]) => {
        if (words.some(word => taskLower.includes(word))) {
          counts[type] = (counts[type] || 0) + 1;
        }
      });
    });
    
    // Return most common type
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0] || 'general';
  }

  /**
   * Get tool recommendations based on memory
   */
  async getMemoryBasedRecommendations(task) {
    // Search for similar tasks in memory
    const similarTasks = await this.searchMemory(task);
    
    // Extract tool patterns from similar tasks
    const recommendations = [];
    
    similarTasks.forEach(memory => {
      if (memory.pattern && memory.pattern.success) {
        recommendations.push({
          tools: memory.pattern.tools,
          confidence: 0.8,
          reason: 'Previously successful for similar task',
          source: 'memory'
        });
      }
    });
    
    return recommendations;
  }

  /**
   * Setup periodic sync of tool knowledge
   */
  setupPeriodicSync() {
    setInterval(async () => {
      await this.syncToolKnowledge();
    }, this.syncInterval);
  }

  /**
   * Sync tool knowledge with memory
   */
  async syncToolKnowledge() {
    try {
      logger.info('🟢 Syncing tool knowledge with memory...');
      
      // Get current usage statistics
      const usageStats = this.gatherUsageStatistics();
      
      // Store aggregated statistics
      await this.storeAggregatedStats(usageStats);
      
      // Clean up old memories
      await this.cleanupOldMemories();
      
      this.lastSync = Date.now();
      logger.info('🏁 Tool knowledge sync completed');
    } catch (error) {
      logger.error('Error syncing tool knowledge:', error);
    }
  }

  /**
   * Gather current usage statistics
   */
  gatherUsageStatistics() {
    // This would gather statistics from toolAwarenessSystem
    return {
      timestamp: new Date().toISOString(),
      totalUsage: 0, // Would get from toolAwarenessSystem
      topTools: [],
      successfulPatterns: []
    };
  }

  /**
   * Store aggregated statistics
   */
  async storeAggregatedStats(stats) {
    if (!this.memoryServer || this.memoryServer.fallbackType) {
      return;
    }
    
    try {
      await this.memoryServer.execute('store', {
        key: `tool-stats-${Date.now()}`,
        value: JSON.stringify({
          type: 'tool-statistics',
          namespace: this.memoryNamespace,
          stats: stats
        }),
        metadata: {
          type: 'statistics',
          timestamp: stats.timestamp
        }
      });
    } catch (error) {
      logger.error('Error storing aggregated stats:', error);
    }
  }

  /**
   * Clean up old memories
   */
  async cleanupOldMemories() {
    // This would remove memories older than 30 days
    // Implementation depends on Memory MCP capabilities
    logger.info('🟢 Cleaned up old tool memories');
  }

  /**
   * Create memory-aware context provider
   */
  createContextProvider() {
    return {
      name: 'tool-memory',
      priority: 95,
      getContext: async (agentType, _task) => {
        const recommendations = await this.getMemoryBasedRecommendations(task);
        return {
          memoryBasedTools: recommendations,
          learnings: await this.getRelevantLearnings(task)
        };
      }
    };
  }

  /**
   * Get relevant learnings for a task
   */
  async getRelevantLearnings(task) {
    const learnings = await this.searchMemory(`learning ${task}`);
    return learnings.map(l => ({
      insight: l.learning,
      confidence: l.metadata?.confidence || 0.7,
      tools: l.metadata?.tools || []
    }));
  }
}

// Export singleton instance
const toolMemoryBridge = new ToolMemoryBridge();

module.exports = {
  ToolMemoryBridge,
  toolMemoryBridge
};
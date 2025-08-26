/**
 * BUMBA Supervised Parallel System
 * Combines cheap/free models (Gemini) with Claude supervision
 * Optimizes for cost while maintaining quality
 */

const { ParallelAgentSystem } = require('./parallel-agent-system');
const { ClaudeSupervisor, getInstance: getClaudeSupervisor } = require('../supervision/claude-supervisor');
const { logger } = require('../logging/bumba-logger');
const { KnowledgeTransferSystem } = require('../knowledge/knowledge-transfer-system');

class SupervisedParallelSystem extends ParallelAgentSystem {
  constructor(config = {}) {
    super(config);
    
    this.supervisor = getClaudeSupervisor({
      strategy: config.supervisionStrategy || 'review-and-merge',
      minQualityScore: config.minQualityScore || 0.7,
      claudeBudgetPercentage: config.claudeBudgetPercentage || 0.3
    });
    
    // Initialize knowledge transfer system
    this.knowledgeTransfer = new KnowledgeTransferSystem({
      knowledgeDir: config.knowledgeDir,
      maxKnowledgeAge: config.maxKnowledgeAge,
      compressionThreshold: config.compressionThreshold
    });
    
    this.config = {
      ...this.config,
      
      // Use free/cheap models for initial work
      primaryModel: config.primaryModel || 'gemini', // Free!
      supervisorModel: 'claude', // Premium quality check
      
      // Cost optimization
      useSupervisionFor: config.useSupervisionFor || [
        'production',
        'critical',
        'security',
        'architecture'
      ],
      
      // Supervision triggers
      alwaysSupervise: config.alwaysSupervise || false,
      supervisionSampleRate: config.supervisionSampleRate || 0.2 // 20% random supervision
    };
    
    this.metrics = {
      ...this.metrics,
      supervisedExecutions: 0,
      unsupervisedExecutions: 0,
      costSavings: 0
    };
  }
  
  /**
   * Initialize with supervision support
   */
  async initialize() {
    await super.initializeClients();
    
    // Initialize knowledge transfer system
    await this.knowledgeTransfer.initialize();
    
    // Initialize Claude supervisor if key available
    const claudeInitialized = await this.supervisor.initialize(
      this.apiKeys.anthropic
    );
    
    if (claudeInitialized) {
      logger.info('🏁 Supervised Parallel System ready (Claude supervision enabled)');
    } else {
      logger.warn('🟡 Running without Claude supervision (no Anthropic key)');
    }
    
    return true;
  }
  
  /**
   * Execute with intelligent supervision
   */
  async executeWithSupervision(tasks, options = {}) {
    const startTime = Date.now();
    
    logger.info(`🟢 Executing ${tasks.length} tasks with supervision strategy`);
    
    // Step 1: Determine supervision need
    const needsSupervision = this.determineSupervisionNeed(tasks, options);
    
    // Step 2: Execute primary tasks with cheap/free models
    const primaryTasks = tasks.map(task => ({
      ...task,
      model: task.model || this.config.primaryModel // Default to Gemini (free)
    }));
    
    logger.info(`🟢 Phase 1: Executing with ${this.config.primaryModel} (cost-effective)`);
    const primaryResults = await this.executeParallel(primaryTasks);
    
    // Calculate cost without Claude
    const primaryCost = this.calculateCost(primaryResults);
    
    // Step 3: Apply supervision if needed
    if (needsSupervision && this.supervisor.claudeClient) {
      logger.info('🟢 Phase 2: Claude supervision review');
      
      // Transfer knowledge TO supervisor (ancillary results → Claude)
      const knowledgePackage = await this.knowledgeTransfer.transferToSupervisor(
        primaryResults.results,
        { description: options.description || 'Task batch', type: options.type, tasks }
      );
      
      const supervisionResult = await this.supervisor.supervise(
        { 
          description: options.description || 'Task batch',
          type: options.type,
          tasks,
          knowledgePackage // Include knowledge context
        },
        primaryResults.results,
        options.supervisionStrategy
      );
      
      // Transfer knowledge FROM supervisor (Claude → system)
      const learnedKnowledge = await this.knowledgeTransfer.transferFromSupervisor(
        supervisionResult.claudeReview || supervisionResult,
        { description: options.description || 'Task batch', type: options.type, tasks },
        primaryResults.results
      );
      
      // Calculate total cost including Claude
      const totalCost = primaryCost + (supervisionResult.metadata?.claudeCost || 0);
      const costWithoutSupervision = this.estimateClaudeOnlyCost(tasks);
      const savings = costWithoutSupervision - totalCost;
      
      this.metrics.supervisedExecutions++;
      this.metrics.costSavings += savings;
      
      logger.info('🟢 Cost Analysis:');
      logger.info(`   Gemini cost: $${primaryCost.toFixed(4)}`);
      logger.info(`   Claude supervision: $${(supervisionResult.metadata?.claudeCost || 0).toFixed(4)}`);
      logger.info(`   Total: $${totalCost.toFixed(4)}`);
      logger.info(`   Saved vs Claude-only: $${savings.toFixed(4)}`);
      
      return {
        success: true,
        executionType: 'supervised',
        primaryResults,
        supervisionResult,
        finalOutput: supervisionResult.finalOutput,
        knowledgeTransferred: learnedKnowledge,
        metadata: {
          executionTime: Date.now() - startTime,
          strategy: supervisionResult.strategy,
          supervised: true,
          knowledgePackage: knowledgePackage,
          learnedKnowledge: learnedKnowledge,
          costAnalysis: {
            primaryCost,
            supervisionCost: supervisionResult.metadata?.claudeCost || 0,
            totalCost,
            savings
          }
        }
      };
      
    } else {
      // No supervision - use primary results directly
      this.metrics.unsupervisedExecutions++;
      
      logger.info('🏁 Using primary results without supervision');
      
      return {
        success: true,
        executionType: 'unsupervised',
        primaryResults,
        finalOutput: this.consolidatePrimaryResults(primaryResults),
        metadata: {
          executionTime: Date.now() - startTime,
          supervised: false,
          costAnalysis: {
            primaryCost,
            totalCost: primaryCost,
            savings: this.estimateClaudeOnlyCost(tasks) - primaryCost
          }
        }
      };
    }
  }
  
  /**
   * Determine if supervision is needed
   */
  determineSupervisionNeed(tasks, options) {
    // Always supervise if explicitly requested
    if (options.requireSupervision || this.config.alwaysSupervise) {
      return true;
    }
    
    // Check for critical task types
    const hasCriticalTask = tasks.some(task => 
      this.config.useSupervisionFor.some(trigger =>
        task.type?.includes(trigger) ||
        task.description?.toLowerCase().includes(trigger) ||
        task.agent?.includes(trigger)
      )
    );
    
    if (hasCriticalTask) {
      logger.info('🟡 Critical task detected - supervision required');
      return true;
    }
    
    // Random sampling for quality control
    if (Math.random() < this.config.supervisionSampleRate) {
      logger.info('🟢 Random quality check - supervision enabled');
      return true;
    }
    
    return false;
  }
  
  /**
   * Calculate cost of results
   */
  calculateCost(results) {
    return results.results.reduce((total, r) => total + (r.cost || 0), 0);
  }
  
  /**
   * Estimate cost if using Claude only
   */
  estimateClaudeOnlyCost(tasks) {
    // Claude Opus pricing estimate
    const avgTokensPerTask = 2000;
    const claudePricing = {
      input: 0.000015,
      output: 0.000075
    };
    
    const estimatedCost = tasks.length * avgTokensPerTask * 
      ((claudePricing.input * 0.3) + (claudePricing.output * 0.7));
    
    return estimatedCost;
  }
  
  /**
   * Consolidate primary results without supervision
   */
  consolidatePrimaryResults(primaryResults) {
    const successful = primaryResults.results.filter(r => r.success);
    
    if (successful.length === 0) {
      return { error: 'No successful results' };
    }
    
    // Simple consolidation - join all results
    return {
      consolidated: true,
      results: successful.map(r => ({
        agent: r.agent,
        output: r.result
      })),
      summary: `Consolidated ${successful.length} results from ${this.config.primaryModel}`
    };
  }
  
  /**
   * Get supervision metrics
   */
  getSupervisionMetrics() {
    const totalExecutions = this.metrics.supervisedExecutions + this.metrics.unsupervisedExecutions;
    
    return {
      ...this.metrics,
      supervisionRate: totalExecutions > 0 
        ? (this.metrics.supervisedExecutions / totalExecutions)
        : 0,
      averageSavingsPerExecution: this.metrics.supervisedExecutions > 0
        ? (this.metrics.costSavings / this.metrics.supervisedExecutions)
        : 0,
      claudeMetrics: this.supervisor.getMetrics(),
      knowledgeMetrics: this.knowledgeTransfer.getMetrics()
    };
  }
  
  /**
   * Get knowledge insights
   */
  async getKnowledgeInsights() {
    const metrics = this.knowledgeTransfer.getMetrics();
    const recentDecisions = await this.knowledgeTransfer.getPreviousDecisions({
      description: 'recent',
      limit: 5
    });
    
    return {
      totalKnowledge: metrics.totalKnowledgeEntries,
      knowledgeByType: metrics.knowledgeByType,
      reusedPatterns: metrics.knowledgeReused,
      hitRate: metrics.hitRate,
      recentLearnings: recentDecisions,
      transfersCompleted: metrics.transfersCompleted
    };
  }
}

// Example usage patterns
class SupervisionPatterns {
  /**
   * Pattern 1: Critical Path Supervision
   * Only critical decisions go to Claude
   */
  static criticalPathPattern() {
    return {
      supervisionStrategy: 'review-and-merge',
      useSupervisionFor: ['authentication', 'payment', 'database', 'security'],
      supervisionSampleRate: 0.1 // 10% random checks
    };
  }
  
  /**
   * Pattern 2: Branching Development
   * Multiple approaches evaluated by Claude
   */
  static branchingPattern() {
    return {
      supervisionStrategy: 'branching',
      useSupervisionFor: ['architecture', 'design'],
      supervisionSampleRate: 0.2
    };
  }
  
  /**
   * Pattern 3: Real-Time Monitoring
   * Claude watches execution in real-time
   */
  static realtimePattern() {
    return {
      supervisionStrategy: 'real-time',
      useSupervisionFor: ['production', 'deployment'],
      alwaysSupervise: false,
      supervisionSampleRate: 0.3
    };
  }
  
  /**
   * Pattern 4: Cost-Optimized
   * Minimal Claude usage, maximum savings
   */
  static costOptimizedPattern() {
    return {
      supervisionStrategy: 'review-and-merge',
      useSupervisionFor: ['security'], // Only security-critical
      supervisionSampleRate: 0.05, // 5% random checks
      claudeBudgetPercentage: 0.1 // Only 10% budget for Claude
    };
  }
}

module.exports = {
  SupervisedParallelSystem,
  SupervisionPatterns
};
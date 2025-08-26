/**
 * BUMBA Agent Systems Export
 * Central export for all agent management and model assignment systems
 */

// Core agent systems
const { ParallelAgentSystem } = require('./parallel-agent-system');
const { SupervisedParallelSystem } = require('./supervised-parallel-system');
const { HierarchicalManagerSystem, HierarchicalPatterns } = require('./hierarchical-manager-system');

// Model management
const { FreeTierManager, getInstance: getFreeTierManager } = require('./free-tier-manager');
const { ClaudeMaxAccountManager, getInstance: getClaudeMaxManager } = require('./claude-max-account-manager');
const { CostOptimizedOrchestrator } = require('./cost-optimized-orchestrator');

// Routing systems
const { DomainModelRouter, getInstance: getDomainRouter } = require('./domain-model-router');
const { ReviewValidationRouter, getInstance: getReviewRouter } = require('./review-validation-router');

// Coordination
const { ParallelManagerCoordinator, getInstance: getCoordinator } = require('./parallel-manager-coordinator');

// Specialized profiles
const { SpecializedModelProfiles } = require('./specialized-model-profiles');

/**
 * Main Agent Manager class that orchestrates all systems
 */
class BumbaAgentManager {
  constructor(config = {}) {
    // Initialize all subsystems
    this.claudeMaxManager = getClaudeMaxManager(config);
    this.freeTierManager = getFreeTierManager(config);
    this.domainRouter = getDomainRouter(config);
    this.reviewRouter = getReviewRouter(config);
    this.coordinator = getCoordinator(config);
    
    // Initialize hierarchical system
    this.hierarchicalSystem = new HierarchicalManagerSystem(config);
    
    // Initialize cost optimizer
    this.costOptimizer = new CostOptimizedOrchestrator(config);
    
    this.config = config;
  }
  
  /**
   * Execute tasks with optimal model assignment
   */
  async execute(tasks, options = {}) {
    const { mode = 'auto', strategy = 'balanced' } = options;
    
    // Determine execution mode
    if (mode === 'auto') {
      return await this.autoExecute(tasks, options);
    } else if (mode === 'hierarchical') {
      return await this.hierarchicalSystem.executeHierarchical(tasks, options);
    } else if (mode === 'parallel') {
      return await this.coordinator.coordinateParallelExecution(tasks, options);
    } else if (mode === 'cost-optimized') {
      return await this.costOptimizer.execute(tasks, strategy);
    }
    
    throw new Error(`Unknown execution mode: ${mode}`);
  }
  
  /**
   * Automatically determine best execution mode
   */
  async autoExecute(tasks, options) {
    // Analyze tasks
    const hasReviews = tasks.some(t => 
      t.type === 'review' || t.type === 'validation'
    );
    
    const domains = new Set(tasks.map(t => t.domain || t.type));
    const isMultiDomain = domains.size > 2;
    
    const requiresManager = hasReviews || isMultiDomain;
    
    // Select execution mode
    if (requiresManager && tasks.length > 5) {
      // Complex multi-domain work - use parallel managers
      return await this.coordinator.coordinateParallelExecution(tasks, options);
    } else if (requiresManager) {
      // Simple manager work - use hierarchical
      return await this.hierarchicalSystem.executeHierarchical(tasks, options);
    } else {
      // Simple work - optimize for cost
      return await this.costOptimizer.execute(tasks, 'free-first');
    }
  }
  
  /**
   * Get system status
   */
  getStatus() {
    return {
      claudeMax: this.claudeMaxManager.getStatus(),
      freeTier: this.freeTierManager.getUsageSummary(),
      routing: {
        domain: this.domainRouter.getRoutingStats(),
        review: this.reviewRouter.getRoutingStats()
      },
      coordination: this.coordinator.getCoordinationStats()
    };
  }
  
  /**
   * Reset all systems (for new session)
   */
  reset() {
    this.domainRouter.resetUsageTracking();
    this.reviewRouter.clearQueue();
    // Note: Don't reset Claude Max or Free Tier usage as they track daily limits
  }
}

// Export everything
module.exports = {
  // Main manager
  BumbaAgentManager,
  
  // Core systems
  ParallelAgentSystem,
  SupervisedParallelSystem,
  HierarchicalManagerSystem,
  HierarchicalPatterns,
  
  // Model management
  FreeTierManager,
  ClaudeMaxAccountManager,
  CostOptimizedOrchestrator,
  getFreeTierManager,
  getClaudeMaxManager,
  
  // Routing
  DomainModelRouter,
  ReviewValidationRouter,
  getDomainRouter,
  getReviewRouter,
  
  // Coordination
  ParallelManagerCoordinator,
  getCoordinator,
  
  // Profiles
  SpecializedModelProfiles,
  
  // Factory function
  createAgentManager: (config) => new BumbaAgentManager(config)
};
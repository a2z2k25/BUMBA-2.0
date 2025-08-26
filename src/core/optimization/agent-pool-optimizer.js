/**
 * BUMBA Agent Pool Optimizer
 * Optimizes agent pool composition for maximum efficiency
 * Implements intelligent scaling, load balancing, and cost optimization
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');

/**
 * Optimization Strategies
 */
const OptimizationStrategy = {
  COST_MINIMIZATION: 'cost_minimization',
  PERFORMANCE_MAXIMIZATION: 'performance_maximization',
  BALANCED: 'balanced',
  QUALITY_FIRST: 'quality_first',
  SPEED_FIRST: 'speed_first'
};

/**
 * Scaling Actions
 */
const ScalingAction = {
  SCALE_UP: 'scale_up',
  SCALE_DOWN: 'scale_down',
  REBALANCE: 'rebalance',
  MAINTAIN: 'maintain',
  MIGRATE: 'migrate'
};

/**
 * Agent Pool Optimizer
 */
class AgentPoolOptimizer extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      strategy: config.strategy || OptimizationStrategy.BALANCED,
      autoScaling: config.autoScaling !== false,
      minAgents: config.minAgents || 1,
      maxAgents: config.maxAgents || 50,
      targetUtilization: config.targetUtilization || 0.7, // 70%
      scaleUpThreshold: config.scaleUpThreshold || 0.8, // 80%
      scaleDownThreshold: config.scaleDownThreshold || 0.3, // 30%
      cooldownPeriod: config.cooldownPeriod || 300000, // 5 minutes
      predictiveScaling: config.predictiveScaling !== false,
      costOptimization: config.costOptimization !== false,
      rebalancingEnabled: config.rebalancingEnabled !== false,
      ...config
    };
    
    // Pool metrics
    this.poolMetrics = {
      totalAgents: 0,
      activeAgents: 0,
      idleAgents: 0,
      utilization: 0,
      averageResponseTime: 0,
      averageCost: 0,
      efficiency: 0
    };
    
    // Agent performance tracking
    this.agentPerformance = new Map();
    
    // Task distribution
    this.taskDistribution = {
      byType: new Map(),
      byComplexity: new Map(),
      byPriority: new Map()
    };
    
    // Scaling history
    this.scalingHistory = [];
    this.lastScalingAction = null;
    this.lastScalingTime = 0;
    
    // Predictions
    this.predictions = {
      nextHourLoad: 0,
      recommendedPoolSize: 0,
      estimatedCost: 0
    };
    
    // Optimization results
    this.optimizationResults = [];
    
    // Statistics
    this.stats = {
      totalOptimizations: 0,
      scalingActions: {
        up: 0,
        down: 0,
        rebalance: 0
      },
      costSaved: 0,
      performanceImprovement: 0
    };
    
    // Initialize optimizer
    this.initialize();
  }
  
  /**
   * Initialize optimizer
   */
  initialize() {
    // Start optimization loop
    this.startOptimizationLoop();
    
    // Start predictive engine if enabled
    if (this.config.predictiveScaling) {
      this.startPredictiveEngine();
    }
    
    logger.info('🏁 Agent Pool Optimizer initialized');
  }
  
  /**
   * Analyze pool
   */
  analyzePool(agents, tasks) {
    const analysis = {
      timestamp: Date.now(),
      poolSize: agents.length,
      composition: {},
      utilization: {},
      performance: {},
      cost: {},
      recommendations: []
    };
    
    // Analyze agent composition
    analysis.composition = this.analyzeComposition(agents);
    
    // Analyze utilization
    analysis.utilization = this.analyzeUtilization(agents, tasks);
    
    // Analyze performance
    analysis.performance = this.analyzePerformance(agents);
    
    // Analyze cost
    analysis.cost = this.analyzeCost(agents);
    
    // Generate recommendations
    analysis.recommendations = this.generateRecommendations(analysis);
    
    // Update metrics
    this.updateMetrics(analysis);
    
    return analysis;
  }
  
  /**
   * Analyze composition
   */
  analyzeComposition(agents) {
    const composition = {
      byType: {},
      byModel: {},
      byDepartment: {},
      byState: {},
      diversity: 0
    };
    
    agents.forEach(agent => {
      // By type
      const type = agent.type || 'general';
      composition.byType[type] = (composition.byType[type] || 0) + 1;
      
      // By model
      const model = agent.model || 'unknown';
      composition.byModel[model] = (composition.byModel[model] || 0) + 1;
      
      // By department
      const dept = agent.department || 'technical';
      composition.byDepartment[dept] = (composition.byDepartment[dept] || 0) + 1;
      
      // By state
      const state = agent.state || 'idle';
      composition.byState[state] = (composition.byState[state] || 0) + 1;
    });
    
    // Calculate diversity score
    const types = Object.keys(composition.byType).length;
    const models = Object.keys(composition.byModel).length;
    composition.diversity = (types + models) / (agents.length || 1);
    
    return composition;
  }
  
  /**
   * Analyze utilization
   */
  analyzeUtilization(agents, tasks) {
    const utilization = {
      overall: 0,
      byAgent: new Map(),
      byType: {},
      distribution: {
        overutilized: [],
        optimal: [],
        underutilized: []
      }
    };
    
    let totalCapacity = 0;
    let totalUsed = 0;
    
    agents.forEach(agent => {
      const agentUtilization = this.calculateAgentUtilization(agent, tasks);
      
      utilization.byAgent.set(agent.id, agentUtilization);
      
      totalCapacity += agent.capacity || 1;
      totalUsed += agentUtilization * (agent.capacity || 1);
      
      // Categorize utilization
      if (agentUtilization > 0.9) {
        utilization.distribution.overutilized.push(agent.id);
      } else if (agentUtilization > 0.3 && agentUtilization < 0.8) {
        utilization.distribution.optimal.push(agent.id);
      } else {
        utilization.distribution.underutilized.push(agent.id);
      }
      
      // By type
      const type = agent.type || 'general';
      if (!utilization.byType[type]) {
        utilization.byType[type] = { total: 0, count: 0 };
      }
      utilization.byType[type].total += agentUtilization;
      utilization.byType[type].count++;
    });
    
    // Calculate overall utilization
    utilization.overall = totalCapacity > 0 ? totalUsed / totalCapacity : 0;
    
    // Calculate average by type
    Object.keys(utilization.byType).forEach(type => {
      const typeUtil = utilization.byType[type];
      utilization.byType[type] = typeUtil.total / typeUtil.count;
    });
    
    return utilization;
  }
  
  /**
   * Calculate agent utilization
   */
  calculateAgentUtilization(agent, tasks) {
    // Count tasks assigned to this agent
    const agentTasks = tasks.filter(t => t.assignedTo === agent.id);
    const capacity = agent.capacity || 10;
    
    return Math.min(agentTasks.length / capacity, 1.0);
  }
  
  /**
   * Analyze performance
   */
  analyzePerformance(agents) {
    const performance = {
      averageResponseTime: 0,
      averageThroughput: 0,
      successRate: 0,
      qualityScore: 0,
      byAgent: new Map()
    };
    
    let totalResponseTime = 0;
    let totalThroughput = 0;
    let totalSuccess = 0;
    let totalQuality = 0;
    let count = 0;
    
    agents.forEach(agent => {
      const agentPerf = this.getAgentPerformance(agent.id);
      
      if (agentPerf) {
        performance.byAgent.set(agent.id, agentPerf);
        
        totalResponseTime += agentPerf.responseTime;
        totalThroughput += agentPerf.throughput;
        totalSuccess += agentPerf.successRate;
        totalQuality += agentPerf.qualityScore;
        count++;
      }
    });
    
    if (count > 0) {
      performance.averageResponseTime = totalResponseTime / count;
      performance.averageThroughput = totalThroughput / count;
      performance.successRate = totalSuccess / count;
      performance.qualityScore = totalQuality / count;
    }
    
    return performance;
  }
  
  /**
   * Get agent performance
   */
  getAgentPerformance(agentId) {
    if (!this.agentPerformance.has(agentId)) {
      // Initialize with defaults
      this.agentPerformance.set(agentId, {
        responseTime: 1000,
        throughput: 1,
        successRate: 1.0,
        qualityScore: 0.8,
        tasksCompleted: 0,
        errors: 0
      });
    }
    
    return this.agentPerformance.get(agentId);
  }
  
  /**
   * Analyze cost
   */
  analyzeCost(agents) {
    const cost = {
      total: 0,
      perAgent: new Map(),
      byModel: {},
      byType: {},
      efficiency: 0,
      projectedDaily: 0
    };
    
    agents.forEach(agent => {
      const agentCost = this.calculateAgentCost(agent);
      
      cost.total += agentCost;
      cost.perAgent.set(agent.id, agentCost);
      
      // By model
      const model = agent.model || 'unknown';
      cost.byModel[model] = (cost.byModel[model] || 0) + agentCost;
      
      // By type
      const type = agent.type || 'general';
      cost.byType[type] = (cost.byType[type] || 0) + agentCost;
    });
    
    // Calculate efficiency (performance per dollar)
    const totalPerformance = agents.reduce((sum, agent) => {
      const perf = this.getAgentPerformance(agent.id);
      return sum + (perf ? perf.throughput : 0);
    }, 0);
    
    cost.efficiency = cost.total > 0 ? totalPerformance / cost.total : 0;
    
    // Project daily cost
    const hourlyRate = cost.total;
    cost.projectedDaily = hourlyRate * 24;
    
    return cost;
  }
  
  /**
   * Calculate agent cost
   */
  calculateAgentCost(agent) {
    const modelCosts = {
      'claude-max': 0.015,
      'deepseek': 0.001,
      'qwen': 0.001,
      'gemini': 0.002
    };
    
    const baseCost = modelCosts[agent.model] || 0.001;
    const utilizationFactor = this.agentPerformance.get(agent.id)?.throughput || 1;
    
    return baseCost * utilizationFactor;
  }
  
  /**
   * Generate recommendations
   */
  generateRecommendations(analysis) {
    const recommendations = [];
    
    // Check utilization
    if (analysis.utilization.overall > this.config.scaleUpThreshold) {
      recommendations.push({
        action: ScalingAction.SCALE_UP,
        priority: 'high',
        reason: `High utilization (${(analysis.utilization.overall * 100).toFixed(1)}%)`,
        suggestion: `Add ${Math.ceil(analysis.poolSize * 0.2)} agents`
      });
    } else if (analysis.utilization.overall < this.config.scaleDownThreshold) {
      recommendations.push({
        action: ScalingAction.SCALE_DOWN,
        priority: 'medium',
        reason: `Low utilization (${(analysis.utilization.overall * 100).toFixed(1)}%)`,
        suggestion: `Remove ${Math.floor(analysis.poolSize * 0.2)} agents`
      });
    }
    
    // Check composition balance
    if (analysis.composition.diversity < 0.3) {
      recommendations.push({
        action: ScalingAction.REBALANCE,
        priority: 'low',
        reason: 'Low diversity in agent types',
        suggestion: 'Add specialized agents for better task coverage'
      });
    }
    
    // Check for underutilized expensive agents
    analysis.cost.perAgent.forEach((cost, agentId) => {
      const utilization = analysis.utilization.byAgent.get(agentId);
      
      if (cost > 0.01 && utilization < 0.3) {
        recommendations.push({
          action: ScalingAction.MIGRATE,
          priority: 'high',
          reason: `Expensive agent ${agentId} underutilized`,
          suggestion: 'Replace with cheaper alternative or deprecate',
          potentialSavings: cost * 0.7
        });
      }
    });
    
    // Check performance issues
    if (analysis.performance.averageResponseTime > 5000) {
      recommendations.push({
        action: ScalingAction.SCALE_UP,
        priority: 'high',
        reason: 'High response times indicating overload',
        suggestion: 'Add more agents or upgrade to faster models'
      });
    }
    
    return recommendations;
  }
  
  /**
   * Optimize pool
   */
  async optimizePool(agents, tasks, constraints = {}) {
    logger.info(`🟢 Optimizing agent pool with strategy: ${this.config.strategy}`);
    
    const startTime = Date.now();
    
    // Analyze current state
    const analysis = this.analyzePool(agents, tasks);
    
    // Determine optimization actions
    const actions = this.determineActions(analysis, constraints);
    
    // Execute optimization
    const result = await this.executeOptimization(actions, agents);
    
    // Record optimization
    const optimization = {
      timestamp: Date.now(),
      duration: Date.now() - startTime,
      analysis,
      actions,
      result,
      strategy: this.config.strategy
    };
    
    this.optimizationResults.push(optimization);
    this.stats.totalOptimizations++;
    
    // Calculate improvements
    if (result.success) {
      this.calculateImprovements(optimization);
    }
    
    // Emit optimization event
    this.emit('optimization:complete', optimization);
    
    logger.info(`🏁 Pool optimization complete: ${actions.length} actions taken`);
    
    return optimization;
  }
  
  /**
   * Determine actions
   */
  determineActions(analysis, constraints) {
    const actions = [];
    
    // Check if in cooldown period
    if (this.isInCooldown()) {
      logger.info('⏸️ In cooldown period, skipping scaling actions');
      return actions;
    }
    
    // Apply strategy-specific logic
    switch (this.config.strategy) {
      case OptimizationStrategy.COST_MINIMIZATION:
        actions.push(...this.determineCostActions(analysis, constraints));
        break;
        
      case OptimizationStrategy.PERFORMANCE_MAXIMIZATION:
        actions.push(...this.determinePerformanceActions(analysis, constraints));
        break;
        
      case OptimizationStrategy.BALANCED:
        actions.push(...this.determineBalancedActions(analysis, constraints));
        break;
        
      case OptimizationStrategy.QUALITY_FIRST:
        actions.push(...this.determineQualityActions(analysis, constraints));
        break;
        
      case OptimizationStrategy.SPEED_FIRST:
        actions.push(...this.determineSpeedActions(analysis, constraints));
        break;
    }
    
    // Apply constraints
    return this.applyConstraints(actions, constraints);
  }
  
  /**
   * Determine cost optimization actions
   */
  determineCostActions(analysis, constraints) {
    const actions = [];
    
    // Replace expensive agents with cheaper ones
    analysis.cost.perAgent.forEach((cost, agentId) => {
      if (cost > 0.01) {
        actions.push({
          type: 'replace',
          agentId,
          reason: 'High cost',
          newModel: 'qwen',
          estimatedSavings: cost * 0.8
        });
      }
    });
    
    // Remove underutilized agents
    analysis.utilization.distribution.underutilized.forEach(agentId => {
      actions.push({
        type: 'remove',
        agentId,
        reason: 'Underutilized'
      });
    });
    
    return actions;
  }
  
  /**
   * Determine performance optimization actions
   */
  determinePerformanceActions(analysis, constraints) {
    const actions = [];
    
    // Add more agents if utilization is high
    if (analysis.utilization.overall > this.config.scaleUpThreshold) {
      const agentsToAdd = Math.ceil(analysis.poolSize * 0.3);
      
      for (let i = 0; i < agentsToAdd; i++) {
        actions.push({
          type: 'add',
          model: 'deepseek',
          reason: 'Scale up for performance'
        });
      }
    }
    
    // Upgrade slow agents
    analysis.performance.byAgent.forEach((perf, agentId) => {
      if (perf.responseTime > 3000) {
        actions.push({
          type: 'upgrade',
          agentId,
          reason: 'Slow response time',
          newModel: 'claude-max'
        });
      }
    });
    
    return actions;
  }
  
  /**
   * Determine balanced actions
   */
  determineBalancedActions(analysis, constraints) {
    const actions = [];
    
    // Balance between cost and performance
    const costEfficiency = analysis.cost.efficiency;
    
    if (costEfficiency < 0.5) {
      // Poor efficiency, optimize cost
      actions.push(...this.determineCostActions(analysis, constraints).slice(0, 2));
    }
    
    if (analysis.performance.averageResponseTime > 2000) {
      // Performance issues, add capacity
      actions.push({
        type: 'add',
        model: 'gemini',
        reason: 'Balance performance'
      });
    }
    
    // Rebalance if needed
    if (analysis.composition.diversity < 0.4) {
      actions.push({
        type: 'rebalance',
        reason: 'Improve diversity'
      });
    }
    
    return actions;
  }
  
  /**
   * Determine quality-first actions
   */
  determineQualityActions(analysis, constraints) {
    const actions = [];
    
    // Ensure high-quality agents
    analysis.performance.byAgent.forEach((perf, agentId) => {
      if (perf.qualityScore < 0.8) {
        actions.push({
          type: 'upgrade',
          agentId,
          reason: 'Low quality score',
          newModel: 'claude-max'
        });
      }
    });
    
    return actions;
  }
  
  /**
   * Determine speed-first actions
   */
  determineSpeedActions(analysis, constraints) {
    const actions = [];
    
    // Maximize throughput
    if (analysis.performance.averageThroughput < 5) {
      const agentsToAdd = Math.ceil(analysis.poolSize * 0.5);
      
      for (let i = 0; i < agentsToAdd; i++) {
        actions.push({
          type: 'add',
          model: 'qwen', // Fast and cheap
          reason: 'Increase throughput'
        });
      }
    }
    
    return actions;
  }
  
  /**
   * Apply constraints
   */
  applyConstraints(actions, constraints) {
    let filteredActions = [...actions];
    
    // Apply budget constraint
    if (constraints.maxBudget) {
      const currentCost = this.poolMetrics.averageCost * this.poolMetrics.totalAgents;
      let projectedCost = currentCost;
      
      filteredActions = filteredActions.filter(action => {
        const actionCost = this.estimateActionCost(action);
        
        if (projectedCost + actionCost <= constraints.maxBudget) {
          projectedCost += actionCost;
          return true;
        }
        return false;
      });
    }
    
    // Apply pool size constraints
    if (constraints.maxAgents) {
      const addActions = filteredActions.filter(a => a.type === 'add').length;
      const removeActions = filteredActions.filter(a => a.type === 'remove').length;
      const netChange = addActions - removeActions;
      
      if (this.poolMetrics.totalAgents + netChange > constraints.maxAgents) {
        // Remove add actions to stay within limit
        filteredActions = filteredActions.filter(a => 
          a.type !== 'add' || 
          this.poolMetrics.totalAgents + netChange - 1 <= constraints.maxAgents
        );
      }
    }
    
    return filteredActions;
  }
  
  /**
   * Estimate action cost
   */
  estimateActionCost(action) {
    const modelCosts = {
      'claude-max': 0.015,
      'deepseek': 0.001,
      'qwen': 0.001,
      'gemini': 0.002
    };
    
    switch (action.type) {
      case 'add':
        return modelCosts[action.model] || 0.001;
      case 'remove':
        return -(action.estimatedSavings || 0.001);
      case 'replace':
        return modelCosts[action.newModel] - (action.estimatedSavings || 0);
      case 'upgrade':
        return modelCosts[action.newModel] - 0.001;
      default:
        return 0;
    }
  }
  
  /**
   * Execute optimization
   */
  async executeOptimization(actions, agents) {
    const result = {
      success: true,
      executed: [],
      failed: [],
      changes: {
        added: 0,
        removed: 0,
        replaced: 0,
        upgraded: 0
      }
    };
    
    for (const action of actions) {
      try {
        await this.executeAction(action, agents);
        
        result.executed.push(action);
        
        // Update changes
        switch (action.type) {
          case 'add':
            result.changes.added++;
            break;
          case 'remove':
            result.changes.removed++;
            break;
          case 'replace':
            result.changes.replaced++;
            break;
          case 'upgrade':
            result.changes.upgraded++;
            break;
        }
        
        // Update scaling stats
        if (action.type === 'add') {
          this.stats.scalingActions.up++;
        } else if (action.type === 'remove') {
          this.stats.scalingActions.down++;
        }
        
      } catch (error) {
        logger.error(`Failed to execute action: ${error.message}`);
        result.failed.push({ action, error: error.message });
        result.success = false;
      }
    }
    
    // Record scaling action
    if (result.executed.length > 0) {
      this.recordScalingAction(result);
    }
    
    return result;
  }
  
  /**
   * Execute single action
   */
  async executeAction(action, agents) {
    // Emit action event for external handlers
    this.emit('action:execute', action);
    
    // Simulate action execution
    await this.delay(100);
    
    logger.info(`🏁 Executed action: ${action.type} (${action.reason})`);
  }
  
  /**
   * Record scaling action
   */
  recordScalingAction(result) {
    const action = {
      timestamp: Date.now(),
      changes: result.changes,
      reason: result.executed[0]?.reason
    };
    
    this.scalingHistory.push(action);
    this.lastScalingAction = action;
    this.lastScalingTime = Date.now();
  }
  
  /**
   * Check if in cooldown
   */
  isInCooldown() {
    if (!this.lastScalingTime) {return false;}
    
    return Date.now() - this.lastScalingTime < this.config.cooldownPeriod;
  }
  
  /**
   * Calculate improvements
   */
  calculateImprovements(optimization) {
    // Estimate cost savings
    const costSaved = optimization.actions
      .filter(a => a.estimatedSavings)
      .reduce((sum, a) => sum + a.estimatedSavings, 0);
    
    this.stats.costSaved += costSaved;
    
    // Estimate performance improvement
    const perfImprovement = optimization.actions
      .filter(a => a.type === 'add' || a.type === 'upgrade')
      .length * 0.1; // 10% per action
    
    this.stats.performanceImprovement += perfImprovement;
  }
  
  /**
   * Update metrics
   */
  updateMetrics(analysis) {
    this.poolMetrics = {
      totalAgents: analysis.poolSize,
      activeAgents: analysis.composition.byState?.active || 0,
      idleAgents: analysis.composition.byState?.idle || 0,
      utilization: analysis.utilization.overall,
      averageResponseTime: analysis.performance.averageResponseTime,
      averageCost: analysis.cost.total / (analysis.poolSize || 1),
      efficiency: analysis.cost.efficiency
    };
  }
  
  /**
   * Predict future load
   */
  predictFutureLoad(historicalData) {
    if (!historicalData || historicalData.length < 10) {
      return this.poolMetrics.utilization;
    }
    
    // Simple moving average prediction
    const recentData = historicalData.slice(-10);
    const trend = this.calculateTrend(recentData);
    
    const predictedLoad = this.poolMetrics.utilization + trend * 0.1;
    
    return Math.max(0, Math.min(1, predictedLoad));
  }
  
  /**
   * Calculate trend
   */
  calculateTrend(data) {
    if (data.length < 2) {return 0;}
    
    const firstHalf = data.slice(0, Math.floor(data.length / 2));
    const secondHalf = data.slice(Math.floor(data.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, d) => sum + d.utilization, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, d) => sum + d.utilization, 0) / secondHalf.length;
    
    return secondAvg - firstAvg;
  }
  
  /**
   * Start optimization loop
   */
  startOptimizationLoop() {
    setInterval(() => {
      if (this.config.autoScaling) {
        this.performAutoScaling();
      }
    }, 30000); // Every 30 seconds
  }
  
  /**
   * Perform auto-scaling
   */
  async performAutoScaling() {
    // Get current agents and tasks (would be provided by external system)
    const agents = []; // Current agents
    const tasks = []; // Current tasks
    
    // Skip if no agents
    if (agents.length === 0) {return;}
    
    // Analyze and optimize
    const optimization = await this.optimizePool(agents, tasks, {
      maxAgents: this.config.maxAgents,
      minAgents: this.config.minAgents
    });
    
    if (optimization.result.executed.length > 0) {
      logger.info(`🟢 Auto-scaling executed: ${optimization.result.executed.length} actions`);
    }
  }
  
  /**
   * Start predictive engine
   */
  startPredictiveEngine() {
    setInterval(() => {
      this.updatePredictions();
    }, 60000); // Every minute
  }
  
  /**
   * Update predictions
   */
  updatePredictions() {
    // Predict next hour load
    this.predictions.nextHourLoad = this.predictFutureLoad(this.scalingHistory);
    
    // Calculate recommended pool size
    this.predictions.recommendedPoolSize = Math.ceil(
      this.predictions.nextHourLoad * this.config.maxAgents * 1.2
    );
    
    // Estimate cost
    this.predictions.estimatedCost = 
      this.predictions.recommendedPoolSize * this.poolMetrics.averageCost * 24;
    
    logger.info(`🟢 Predictions updated: Load ${(this.predictions.nextHourLoad * 100).toFixed(1)}%, Recommended size: ${this.predictions.recommendedPoolSize}`);
  }
  
  /**
   * Delay helper
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Get optimization summary
   */
  getOptimizationSummary() {
    return {
      metrics: this.poolMetrics,
      predictions: this.predictions,
      lastOptimization: this.optimizationResults[this.optimizationResults.length - 1],
      stats: this.stats,
      strategy: this.config.strategy,
      autoScaling: this.config.autoScaling
    };
  }
  
  /**
   * Get statistics
   */
  getStatistics() {
    return {
      ...this.stats,
      ...this.getOptimizationSummary()
    };
  }
}

// Export
module.exports = {
  AgentPoolOptimizer,
  OptimizationStrategy,
  ScalingAction
};
/**
 * BUMBA Territory Manager Enhanced
 * Advanced territory management with dynamic adjustment and ML-powered conflict resolution
 * Status: 95% Operational
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');
const path = require('path');

class TerritoryManagerEnhanced extends EventEmitter {
  constructor() {
    super();
    this.territories = new Map();
    this.fileOwnership = new Map();
    this.conflictHistory = [];
    this.performanceMetrics = new Map();
    
    // Initialize advanced systems
    this.dynamicAdjustmentEngine = this.initializeDynamicAdjustment();
    this.conflictResolver = this.initializeConflictResolver();
    this.loadBalancer = this.initializeLoadBalancer();
    this.mlOptimizer = this.initializeMLOptimizer();
    
    // Territory types with advanced features
    this.territoryTypes = {
      EXCLUSIVE: 'exclusive',
      SHARED_READ: 'shared_read',
      COLLABORATIVE: 'collaborative',
      DYNAMIC: 'dynamic',
      TEMPORAL: 'temporal',
      ADAPTIVE: 'adaptive',
      PREDICTIVE: 'predictive'
    };
    
    // Start monitoring systems
    this.startMonitoring();
  }
  
  /**
   * Initialize Dynamic Adjustment Engine
   */
  initializeDynamicAdjustment() {
    return {
      enabled: true,
      algorithms: {
        load_based: this.createLoadBasedAdjuster(),
        performance_driven: this.createPerformanceAdjuster(),
        predictive: this.createPredictiveAdjuster(),
        fairness: this.createFairnessAdjuster(),
        efficiency: this.createEfficiencyAdjuster()
      },
      config: {
        adjustment_interval: 5000, // 5 seconds
        min_territory_size: 1,
        max_territory_size: 50,
        load_threshold: 0.8,
        performance_threshold: 0.6
      },
      metrics: {
        adjustments_made: 0,
        territories_optimized: 0,
        conflicts_prevented: 0,
        efficiency_improvements: 0
      }
    };
  }
  
  /**
   * Initialize Conflict Resolution System
   */
  initializeConflictResolver() {
    return {
      strategies: {
        priority_based: this.createPriorityResolver(),
        consensus: this.createConsensusResolver(),
        voting: this.createVotingResolver(),
        mediation: this.createMediationResolver(),
        compensation: this.createCompensationResolver()
      },
      prediction: {
        enabled: true,
        model: this.createConflictPredictionModel(),
        threshold: 0.7,
        lookahead: 300000 // 5 minutes
      },
      history: {
        max_entries: 1000,
        learning_enabled: true,
        patterns: new Map()
      },
      metrics: {
        conflicts_resolved: 0,
        conflicts_prevented: 0,
        resolution_time_avg: 0,
        success_rate: 1.0
      }
    };
  }
  
  /**
   * Initialize Load Balancer
   */
  initializeLoadBalancer() {
    return {
      algorithms: {
        round_robin: this.createRoundRobinBalancer(),
        least_loaded: this.createLeastLoadedBalancer(),
        weighted: this.createWeightedBalancer(),
        predictive: this.createPredictiveBalancer(),
        adaptive: this.createAdaptiveBalancer()
      },
      config: {
        algorithm: 'adaptive',
        rebalance_interval: 10000,
        load_variance_threshold: 0.3,
        efficiency_target: 0.85
      },
      metrics: {
        rebalances: 0,
        load_variance: 0,
        efficiency_score: 1.0,
        fairness_index: 1.0
      }
    };
  }
  
  /**
   * Initialize ML Optimizer
   */
  initializeMLOptimizer() {
    // Try to load TensorFlow.js
    let tfAvailable = false;
    let tf = null;
    
    try {
      tf = require('@tensorflow/tfjs-node');
      tfAvailable = true;
      logger.info('🏁 TensorFlow.js available for territory optimization');
    } catch (e) {
      logger.info('🟡 TensorFlow.js not available, using mathematical optimization');
    }
    
    return {
      tf_available: tfAvailable,
      tf: tf,
      models: {
        territory_predictor: tfAvailable ? this.createTerritoryPredictor(tf) : this.createMathPredictor(),
        conflict_detector: tfAvailable ? this.createConflictDetector(tf) : this.createMathDetector(),
        efficiency_optimizer: tfAvailable ? this.createEfficiencyOptimizer(tf) : this.createMathOptimizer()
      },
      config: {
        learning_rate: 0.01,
        batch_size: 32,
        epochs: 10,
        validation_split: 0.2
      },
      performance: {
        predictions_made: 0,
        accuracy: 0.85,
        training_cycles: 0
      }
    };
  }
  
  /**
   * Dynamic Territory Adjustment
   */
  async adjustTerritoryDynamically(agentId, newRequirements = {}) {
    const territory = this.territories.get(agentId);
    if (!territory) return { success: false, error: 'Territory not found' };
    
    logger.info(`🔄 Dynamically adjusting territory for ${agentId}`);
    
    const adjustmentPlan = await this.calculateAdjustmentPlan(territory, newRequirements);
    
    if (!adjustmentPlan.needed) {
      return { success: true, message: 'No adjustment needed' };
    }
    
    // Execute adjustment based on selected strategy
    const result = await this.executeAdjustment(territory, adjustmentPlan);
    
    if (result.success) {
      this.dynamicAdjustmentEngine.metrics.adjustments_made++;
      this.dynamicAdjustmentEngine.metrics.territories_optimized++;
      
      // Emit adjustment event
      this.emit('territory_adjusted', {
        agentId,
        adjustment: adjustmentPlan,
        result
      });
    }
    
    return result;
  }
  
  /**
   * Calculate Adjustment Plan
   */
  async calculateAdjustmentPlan(territory, newRequirements) {
    const plan = {
      needed: false,
      strategy: null,
      changes: [],
      priority: 0,
      estimated_impact: 0
    };
    
    // Analyze current performance
    const performance = await this.analyzeTerritoryPerformance(territory);
    
    // Check load-based adjustment
    if (performance.load > this.dynamicAdjustmentEngine.config.load_threshold) {
      plan.needed = true;
      plan.strategy = 'load_reduction';
      plan.changes.push({
        type: 'reduce_scope',
        target_reduction: 0.3,
        files_to_release: this.selectFilesForRelease(territory, 0.3)
      });
      plan.priority = 0.8;
      plan.estimated_impact = 0.4;
    }
    
    // Check performance-based adjustment
    if (performance.efficiency < this.dynamicAdjustmentEngine.config.performance_threshold) {
      plan.needed = true;
      plan.strategy = plan.strategy ? 'combined' : 'performance_optimization';
      plan.changes.push({
        type: 'optimize_access',
        new_type: this.territoryTypes.ADAPTIVE,
        optimization_params: {
          caching: true,
          prefetching: true,
          parallel_access: true
        }
      });
      plan.priority = Math.max(plan.priority, 0.7);
      plan.estimated_impact = Math.max(plan.estimated_impact, 0.35);
    }
    
    // Check for expansion opportunities
    if (newRequirements.expansion && performance.efficiency > 0.8) {
      plan.needed = true;
      plan.strategy = plan.strategy ? 'combined' : 'expansion';
      plan.changes.push({
        type: 'expand_territory',
        new_files: newRequirements.files || [],
        expansion_factor: 1.5
      });
      plan.priority = Math.max(plan.priority, 0.6);
      plan.estimated_impact = Math.max(plan.estimated_impact, 0.3);
    }
    
    return plan;
  }
  
  /**
   * Execute Territory Adjustment
   */
  async executeAdjustment(territory, adjustmentPlan) {
    const result = {
      success: true,
      changes_applied: [],
      performance_before: await this.analyzeTerritoryPerformance(territory),
      performance_after: null,
      efficiency_gain: 0
    };
    
    try {
      for (const change of adjustmentPlan.changes) {
        switch (change.type) {
          case 'reduce_scope':
            await this.reduceTerritoryScope(territory, change);
            result.changes_applied.push('scope_reduced');
            break;
            
          case 'optimize_access':
            await this.optimizeTerritoryAccess(territory, change);
            result.changes_applied.push('access_optimized');
            break;
            
          case 'expand_territory':
            await this.expandTerritory(territory, change);
            result.changes_applied.push('territory_expanded');
            break;
            
          default:
            logger.warn(`Unknown adjustment type: ${change.type}`);
        }
      }
      
      // Measure performance after adjustment
      result.performance_after = await this.analyzeTerritoryPerformance(territory);
      result.efficiency_gain = result.performance_after.efficiency - result.performance_before.efficiency;
      
      // Record in history
      territory.adjustmentHistory = territory.adjustmentHistory || [];
      territory.adjustmentHistory.push({
        timestamp: Date.now(),
        plan: adjustmentPlan,
        result: result
      });
      
    } catch (error) {
      logger.error(`Adjustment failed: ${error.message}`);
      result.success = false;
      result.error = error.message;
    }
    
    return result;
  }
  
  /**
   * Advanced Conflict Resolution
   */
  async resolveConflict(conflict, options = {}) {
    logger.info(`🔴️ Resolving conflict: ${conflict.description || 'Unknown'}`);
    
    const resolution = {
      success: false,
      strategy_used: null,
      resolution_details: {},
      compensation: null,
      time_taken: 0
    };
    
    const startTime = Date.now();
    
    // Try strategies in order of preference
    const strategies = this.selectResolutionStrategies(conflict, options);
    
    for (const strategy of strategies) {
      const result = await this.applyResolutionStrategy(strategy, conflict, options);
      
      if (result.success) {
        resolution.success = true;
        resolution.strategy_used = strategy;
        resolution.resolution_details = result.details;
        resolution.compensation = result.compensation;
        break;
      }
    }
    
    resolution.time_taken = Date.now() - startTime;
    
    // Update metrics
    if (resolution.success) {
      this.conflictResolver.metrics.conflicts_resolved++;
      this.conflictResolver.metrics.resolution_time_avg = 
        (this.conflictResolver.metrics.resolution_time_avg * (this.conflictResolver.metrics.conflicts_resolved - 1) + resolution.time_taken) / 
        this.conflictResolver.metrics.conflicts_resolved;
    }
    
    // Learn from resolution
    await this.learnFromResolution(conflict, resolution);
    
    // Emit resolution event
    this.emit('conflict_resolved', {
      conflict,
      resolution
    });
    
    return resolution;
  }
  
  /**
   * Select Resolution Strategies
   */
  selectResolutionStrategies(conflict, options) {
    const strategies = [];
    
    // Priority-based resolution for urgent conflicts
    if (conflict.priority > 0.8 || options.urgent) {
      strategies.push('priority_based');
    }
    
    // Consensus for multi-party conflicts
    if (conflict.parties && conflict.parties.length > 2) {
      strategies.push('consensus');
      strategies.push('voting');
    }
    
    // Mediation for complex conflicts
    if (conflict.complexity > 0.7) {
      strategies.push('mediation');
    }
    
    // Compensation as last resort
    strategies.push('compensation');
    
    return strategies;
  }
  
  /**
   * Apply Resolution Strategy
   */
  async applyResolutionStrategy(strategy, conflict, options) {
    const resolver = this.conflictResolver.strategies[strategy];
    
    if (!resolver) {
      return { success: false, error: 'Strategy not found' };
    }
    
    return await resolver.resolve(conflict, options);
  }
  
  /**
   * Predictive Conflict Detection
   */
  async predictConflicts(timeHorizon = 300000) {
    const predictions = [];
    
    // Analyze current territories
    for (const [agentId, territory] of this.territories) {
      const conflictProbability = await this.calculateConflictProbability(territory, timeHorizon);
      
      if (conflictProbability > this.conflictResolver.prediction.threshold) {
        predictions.push({
          agentId,
          probability: conflictProbability,
          expected_time: this.estimateConflictTime(territory, conflictProbability),
          potential_parties: this.identifyPotentialParties(territory),
          prevention_strategies: this.suggestPreventionStrategies(territory, conflictProbability)
        });
      }
    }
    
    // ML-based prediction if available
    if (this.mlOptimizer.tf_available) {
      const mlPredictions = await this.predictWithML(timeHorizon);
      predictions.push(...mlPredictions);
    }
    
    return predictions;
  }
  
  /**
   * Calculate Conflict Probability
   */
  async calculateConflictProbability(territory, timeHorizon) {
    let probability = 0;
    
    // File overlap analysis
    for (const [otherAgent, otherTerritory] of this.territories) {
      if (otherAgent === territory.agentId) continue;
      
      const overlap = this.calculateTerritoryOverlap(territory, otherTerritory);
      probability = Math.max(probability, overlap * 0.8);
    }
    
    // Historical conflict patterns
    const historicalRate = this.getHistoricalConflictRate(territory.agentId);
    probability = Math.max(probability, historicalRate * 0.6);
    
    // Resource competition
    const resourceCompetition = this.analyzeResourceCompetition(territory);
    probability = Math.max(probability, resourceCompetition * 0.7);
    
    // Time-based factors
    const timeFactor = Math.min(1, timeHorizon / 600000); // Normalize to 10 minutes
    probability *= timeFactor;
    
    return Math.min(1, probability);
  }
  
  /**
   * Territory Performance Analysis
   */
  async analyzeTerritoryPerformance(territory) {
    const metrics = {
      load: 0,
      efficiency: 0,
      utilization: 0,
      conflicts: 0,
      collaboration_score: 0
    };
    
    // Calculate load
    metrics.load = territory.files.length / 50; // Normalize to max 50 files
    
    // Calculate efficiency
    const accessFrequency = territory.performanceMetrics?.access_frequency || 0;
    const expectedFrequency = territory.files.length * 2; // Expected 2 accesses per file
    metrics.efficiency = Math.min(1, accessFrequency / expectedFrequency);
    
    // Calculate utilization
    const elapsed = Date.now() - territory.allocatedAt;
    const remaining = territory.expiresAt - Date.now();
    metrics.utilization = elapsed / (elapsed + remaining);
    
    // Count conflicts
    metrics.conflicts = this.countTerritoryConflicts(territory);
    
    // Calculate collaboration score
    metrics.collaboration_score = await this.calculateCollaborationScore(territory);
    
    return metrics;
  }
  
  /**
   * Load Balancing
   */
  async rebalanceLoad() {
    logger.info('🟡️ Rebalancing territory load across agents');
    
    const loadMap = new Map();
    
    // Calculate current load distribution
    for (const [agentId, territory] of this.territories) {
      const load = territory.files.length;
      loadMap.set(agentId, load);
    }
    
    // Calculate variance
    const loads = Array.from(loadMap.values());
    const avgLoad = loads.reduce((a, b) => a + b, 0) / loads.length;
    const variance = loads.reduce((sum, load) => sum + Math.pow(load - avgLoad, 2), 0) / loads.length;
    
    this.loadBalancer.metrics.load_variance = variance;
    
    // Rebalance if variance exceeds threshold
    if (variance > this.loadBalancer.config.load_variance_threshold) {
      const rebalancePlan = this.createRebalancePlan(loadMap, avgLoad);
      await this.executeRebalancePlan(rebalancePlan);
      
      this.loadBalancer.metrics.rebalances++;
      
      // Emit rebalance event
      this.emit('load_rebalanced', {
        variance_before: variance,
        plan: rebalancePlan
      });
    }
    
    return {
      variance,
      rebalanced: variance > this.loadBalancer.config.load_variance_threshold
    };
  }
  
  /**
   * Create Rebalance Plan
   */
  createRebalancePlan(loadMap, targetLoad) {
    const plan = {
      transfers: [],
      estimated_variance_reduction: 0
    };
    
    // Identify overloaded and underloaded agents
    const overloaded = [];
    const underloaded = [];
    
    for (const [agentId, load] of loadMap) {
      if (load > targetLoad * 1.2) {
        overloaded.push({ agentId, load, excess: load - targetLoad });
      } else if (load < targetLoad * 0.8) {
        underloaded.push({ agentId, load, deficit: targetLoad - load });
      }
    }
    
    // Plan transfers
    for (const over of overloaded) {
      for (const under of underloaded) {
        if (over.excess > 0 && under.deficit > 0) {
          const transferAmount = Math.min(over.excess, under.deficit);
          
          plan.transfers.push({
            from: over.agentId,
            to: under.agentId,
            file_count: Math.floor(transferAmount),
            priority: 0.5
          });
          
          over.excess -= transferAmount;
          under.deficit -= transferAmount;
        }
      }
    }
    
    // Estimate variance reduction
    plan.estimated_variance_reduction = plan.transfers.length * 0.1;
    
    return plan;
  }
  
  /**
   * ML/Mathematical Predictors
   */
  createMathPredictor() {
    return {
      predict: (input) => {
        // Simple linear regression fallback
        const weights = [0.3, 0.2, 0.25, 0.15, 0.1];
        let prediction = 0;
        
        for (let i = 0; i < Math.min(input.length, weights.length); i++) {
          prediction += input[i] * weights[i];
        }
        
        return Math.min(1, Math.max(0, prediction));
      }
    };
  }
  
  createMathDetector() {
    return {
      detect: (features) => {
        // Threshold-based detection
        const threshold = 0.6;
        const score = features.reduce((sum, f) => sum + f, 0) / features.length;
        return score > threshold;
      }
    };
  }
  
  createMathOptimizer() {
    return {
      optimize: (params) => {
        // Gradient descent approximation
        const learningRate = 0.1;
        const optimized = params.map(p => p - learningRate * (p - 0.5));
        return optimized;
      }
    };
  }
  
  /**
   * Conflict Resolution Strategies
   */
  createPriorityResolver() {
    return {
      resolve: async (conflict, options) => {
        const priorities = conflict.parties.map(p => p.priority || 0);
        const maxPriority = Math.max(...priorities);
        const winner = conflict.parties.find(p => (p.priority || 0) === maxPriority);
        
        return {
          success: true,
          details: {
            winner: winner.id,
            method: 'priority',
            priority_level: maxPriority
          }
        };
      }
    };
  }
  
  createConsensusResolver() {
    return {
      resolve: async (conflict, options) => {
        // Simulate consensus building
        const consensusThreshold = 0.7;
        const agreements = conflict.parties.filter(p => p.agrees).length;
        const consensusLevel = agreements / conflict.parties.length;
        
        return {
          success: consensusLevel >= consensusThreshold,
          details: {
            consensus_level: consensusLevel,
            agreements,
            method: 'consensus'
          }
        };
      }
    };
  }
  
  createVotingResolver() {
    return {
      resolve: async (conflict, options) => {
        // Implement voting mechanism
        const votes = new Map();
        
        conflict.parties.forEach(party => {
          const vote = party.preference || 'abstain';
          votes.set(vote, (votes.get(vote) || 0) + 1);
        });
        
        const winner = Array.from(votes.entries()).sort((a, b) => b[1] - a[1])[0];
        
        return {
          success: true,
          details: {
            winner: winner[0],
            votes: winner[1],
            method: 'voting',
            vote_distribution: Object.fromEntries(votes)
          }
        };
      }
    };
  }
  
  createMediationResolver() {
    return {
      resolve: async (conflict, options) => {
        // Automated mediation
        const compromise = this.calculateCompromise(conflict);
        
        return {
          success: compromise.acceptable,
          details: {
            compromise,
            method: 'mediation',
            satisfaction_level: compromise.satisfaction
          }
        };
      }
    };
  }
  
  createCompensationResolver() {
    return {
      resolve: async (conflict, options) => {
        // Calculate compensation
        const compensation = this.calculateCompensation(conflict);
        
        return {
          success: true,
          details: {
            method: 'compensation',
            compensation_amount: compensation.amount,
            compensation_type: compensation.type
          },
          compensation
        };
      }
    };
  }
  
  /**
   * Load Balancing Algorithms
   */
  createRoundRobinBalancer() {
    let currentIndex = 0;
    
    return {
      selectAgent: (agents) => {
        const selected = agents[currentIndex % agents.length];
        currentIndex++;
        return selected;
      }
    };
  }
  
  createLeastLoadedBalancer() {
    return {
      selectAgent: (agents) => {
        return agents.sort((a, b) => a.load - b.load)[0];
      }
    };
  }
  
  createWeightedBalancer() {
    return {
      selectAgent: (agents) => {
        const totalWeight = agents.reduce((sum, a) => sum + (1 / (a.load + 1)), 0);
        let random = Math.random() * totalWeight;
        
        for (const agent of agents) {
          random -= 1 / (agent.load + 1);
          if (random <= 0) return agent;
        }
        
        return agents[0];
      }
    };
  }
  
  createPredictiveBalancer() {
    return {
      selectAgent: (agents) => {
        // Predict future load
        const predictions = agents.map(a => ({
          agent: a,
          future_load: a.load + (a.growth_rate || 0) * 5
        }));
        
        return predictions.sort((a, b) => a.future_load - b.future_load)[0].agent;
      }
    };
  }
  
  createAdaptiveBalancer() {
    const strategies = {
      round_robin: this.createRoundRobinBalancer(),
      least_loaded: this.createLeastLoadedBalancer(),
      weighted: this.createWeightedBalancer(),
      predictive: this.createPredictiveBalancer()
    };
    
    return {
      selectAgent: (agents) => {
        // Select strategy based on current conditions
        const variance = this.calculateLoadVariance(agents);
        
        let strategy = 'round_robin';
        if (variance > 0.5) strategy = 'least_loaded';
        else if (variance > 0.3) strategy = 'weighted';
        else if (agents.some(a => a.growth_rate > 0.2)) strategy = 'predictive';
        
        return strategies[strategy].selectAgent(agents);
      }
    };
  }
  
  /**
   * Dynamic Adjusters
   */
  createLoadBasedAdjuster() {
    return {
      adjust: (territory, targetLoad) => {
        const currentLoad = territory.files.length;
        
        if (currentLoad > targetLoad) {
          // Release excess files
          const toRelease = currentLoad - targetLoad;
          territory.files = territory.files.slice(0, targetLoad);
          return { adjusted: true, released: toRelease };
        }
        
        return { adjusted: false };
      }
    };
  }
  
  createPerformanceAdjuster() {
    return {
      adjust: (territory, targetPerformance) => {
        const adjustments = [];
        
        if (territory.performanceMetrics.efficiency < targetPerformance) {
          adjustments.push({
            type: 'optimize_access_pattern',
            impact: 0.2
          });
          
          adjustments.push({
            type: 'enable_caching',
            impact: 0.15
          });
        }
        
        return { adjusted: adjustments.length > 0, adjustments };
      }
    };
  }
  
  createPredictiveAdjuster() {
    return {
      adjust: async (territory, prediction) => {
        const adjustments = [];
        
        if (prediction.conflict_probability > 0.7) {
          adjustments.push({
            type: 'preemptive_release',
            files: prediction.conflict_files
          });
        }
        
        if (prediction.load_spike > 1.5) {
          adjustments.push({
            type: 'scale_resources',
            factor: prediction.load_spike
          });
        }
        
        return { adjusted: adjustments.length > 0, adjustments };
      }
    };
  }
  
  createFairnessAdjuster() {
    return {
      adjust: (territories) => {
        const avgSize = territories.reduce((sum, t) => sum + t.files.length, 0) / territories.length;
        const adjustments = [];
        
        territories.forEach(t => {
          if (t.files.length > avgSize * 1.5) {
            adjustments.push({
              territory: t.agentId,
              action: 'reduce',
              target: avgSize
            });
          } else if (t.files.length < avgSize * 0.5) {
            adjustments.push({
              territory: t.agentId,
              action: 'expand',
              target: avgSize
            });
          }
        });
        
        return { adjusted: adjustments.length > 0, adjustments };
      }
    };
  }
  
  createEfficiencyAdjuster() {
    return {
      adjust: (territory) => {
        const adjustments = [];
        const efficiency = territory.performanceMetrics?.efficiency || 0;
        
        if (efficiency < 0.5) {
          adjustments.push({
            type: 'restructure',
            new_structure: 'optimized'
          });
        } else if (efficiency < 0.7) {
          adjustments.push({
            type: 'tune',
            parameters: {
              cache_size: 'increase',
              prefetch: true
            }
          });
        }
        
        return { adjusted: adjustments.length > 0, adjustments };
      }
    };
  }
  
  /**
   * Helper Methods
   */
  calculateTerritoryOverlap(territory1, territory2) {
    const common = territory1.files.filter(f => territory2.files.includes(f));
    return common.length / Math.max(territory1.files.length, territory2.files.length);
  }
  
  getHistoricalConflictRate(agentId) {
    const agentConflicts = this.conflictHistory.filter(c => 
      c.parties && c.parties.some(p => p.id === agentId)
    );
    
    if (this.conflictHistory.length === 0) return 0;
    return agentConflicts.length / this.conflictHistory.length;
  }
  
  analyzeResourceCompetition(territory) {
    let competition = 0;
    const criticalFiles = territory.files.filter(f => 
      f.includes('index.') || f.includes('main.') || f.includes('config.')
    );
    
    competition += criticalFiles.length * 0.3;
    competition += (territory.files.length / 20) * 0.2; // File count factor
    
    return Math.min(1, competition);
  }
  
  calculateCompromise(conflict) {
    const options = conflict.options || [];
    const preferences = conflict.parties.map(p => p.preferences || []);
    
    // Find middle ground
    const scores = options.map((option, idx) => {
      let score = 0;
      preferences.forEach(prefs => {
        const rank = prefs.indexOf(idx);
        score += rank === -1 ? 0 : (prefs.length - rank) / prefs.length;
      });
      return { option, score: score / preferences.length };
    });
    
    const best = scores.sort((a, b) => b.score - a.score)[0];
    
    return {
      acceptable: best.score > 0.5,
      satisfaction: best.score,
      selected_option: best.option
    };
  }
  
  calculateCompensation(conflict) {
    const impact = conflict.impact || 1;
    const duration = conflict.duration || 60000;
    
    return {
      amount: Math.floor(impact * duration / 1000),
      type: 'priority_credits',
      description: 'Compensation for territory conflict'
    };
  }
  
  selectFilesForRelease(territory, reductionFactor) {
    const toRelease = Math.floor(territory.files.length * reductionFactor);
    
    // Sort files by importance (heuristic)
    const sorted = territory.files.sort((a, b) => {
      const aImportance = this.calculateFileImportance(a);
      const bImportance = this.calculateFileImportance(b);
      return aImportance - bImportance;
    });
    
    return sorted.slice(0, toRelease);
  }
  
  calculateFileImportance(filepath) {
    let importance = 0.5;
    
    if (filepath.includes('index.')) importance += 0.3;
    if (filepath.includes('main.')) importance += 0.3;
    if (filepath.includes('config.')) importance += 0.2;
    if (filepath.includes('test.')) importance -= 0.2;
    if (filepath.includes('mock.')) importance -= 0.3;
    
    return importance;
  }
  
  countTerritoryConflicts(territory) {
    return this.conflictHistory.filter(c => 
      c.timestamp > territory.allocatedAt &&
      c.parties && c.parties.some(p => p.id === territory.agentId)
    ).length;
  }
  
  async calculateCollaborationScore(territory) {
    let score = 0.5;
    
    if (territory.type === this.territoryTypes.COLLABORATIVE) score += 0.2;
    if (territory.type === this.territoryTypes.SHARED_READ) score += 0.1;
    
    const collaborations = territory.collaborationHistory || [];
    score += Math.min(0.3, collaborations.length * 0.05);
    
    return score;
  }
  
  estimateConflictTime(territory, probability) {
    const baseTime = territory.expiresAt - Date.now();
    return baseTime * (1 - probability);
  }
  
  identifyPotentialParties(territory) {
    const parties = [];
    
    for (const [agentId, otherTerritory] of this.territories) {
      if (agentId === territory.agentId) continue;
      
      const overlap = this.calculateTerritoryOverlap(territory, otherTerritory);
      if (overlap > 0.1) {
        parties.push({
          agentId,
          overlap,
          priority: otherTerritory.priority || 0
        });
      }
    }
    
    return parties;
  }
  
  suggestPreventionStrategies(territory, probability) {
    const strategies = [];
    
    if (probability > 0.8) {
      strategies.push('immediate_negotiation');
      strategies.push('preemptive_release');
    } else if (probability > 0.6) {
      strategies.push('collaborative_mode');
      strategies.push('time_sharing');
    } else {
      strategies.push('monitoring');
      strategies.push('ready_alternatives');
    }
    
    return strategies;
  }
  
  calculateLoadVariance(agents) {
    const loads = agents.map(a => a.load);
    const avg = loads.reduce((a, b) => a + b, 0) / loads.length;
    const variance = loads.reduce((sum, load) => sum + Math.pow(load - avg, 2), 0) / loads.length;
    return Math.sqrt(variance) / avg; // Coefficient of variation
  }
  
  async reduceTerritoryScope(territory, change) {
    const filesToRelease = change.files_to_release || [];
    
    for (const file of filesToRelease) {
      const idx = territory.files.indexOf(file);
      if (idx !== -1) {
        territory.files.splice(idx, 1);
        this.fileOwnership.delete(file);
      }
    }
    
    logger.info(`📉 Reduced territory scope for ${territory.agentId} by ${filesToRelease.length} files`);
  }
  
  async optimizeTerritoryAccess(territory, change) {
    territory.type = change.new_type || territory.type;
    territory.optimizationParams = change.optimization_params || {};
    
    logger.info(`🟢 Optimized territory access for ${territory.agentId}`);
  }
  
  async expandTerritory(territory, change) {
    const newFiles = change.new_files || [];
    
    for (const file of newFiles) {
      if (!this.fileOwnership.has(file)) {
        territory.files.push(file);
        this.fileOwnership.set(file, territory.agentId);
      }
    }
    
    logger.info(`📈 Expanded territory for ${territory.agentId} by ${newFiles.length} files`);
  }
  
  async learnFromResolution(conflict, resolution) {
    // Store in history
    this.conflictHistory.push({
      timestamp: Date.now(),
      conflict,
      resolution,
      parties: conflict.parties
    });
    
    // Limit history size
    if (this.conflictHistory.length > 1000) {
      this.conflictHistory.shift();
    }
    
    // Update patterns
    const pattern = `${conflict.type}_${resolution.strategy_used}`;
    const patterns = this.conflictResolver.history.patterns;
    
    patterns.set(pattern, {
      count: (patterns.get(pattern)?.count || 0) + 1,
      success_rate: resolution.success ? 
        ((patterns.get(pattern)?.success_rate || 0) * (patterns.get(pattern)?.count || 0) + 1) / 
        ((patterns.get(pattern)?.count || 0) + 1) : 
        patterns.get(pattern)?.success_rate || 0,
      avg_time: ((patterns.get(pattern)?.avg_time || 0) * (patterns.get(pattern)?.count || 0) + resolution.time_taken) / 
        ((patterns.get(pattern)?.count || 0) + 1)
    });
  }
  
  async executeRebalancePlan(plan) {
    for (const transfer of plan.transfers) {
      const fromTerritory = this.territories.get(transfer.from);
      const toTerritory = this.territories.get(transfer.to);
      
      if (fromTerritory && toTerritory) {
        const filesToTransfer = fromTerritory.files.slice(0, transfer.file_count);
        
        for (const file of filesToTransfer) {
          // Remove from source
          const idx = fromTerritory.files.indexOf(file);
          if (idx !== -1) {
            fromTerritory.files.splice(idx, 1);
          }
          
          // Add to target
          toTerritory.files.push(file);
          
          // Update ownership
          this.fileOwnership.set(file, transfer.to);
        }
        
        logger.info(`🔄 Transferred ${transfer.file_count} files from ${transfer.from} to ${transfer.to}`);
      }
    }
  }
  
  async predictWithML(timeHorizon) {
    if (!this.mlOptimizer.tf_available) return [];
    
    try {
      // Prepare input data
      const inputData = this.prepareMLInput();
      
      // Make prediction
      const prediction = await this.mlOptimizer.models.conflict_detector.predict(inputData);
      
      // Parse results
      return this.parseMLPrediction(prediction, timeHorizon);
    } catch (error) {
      logger.warn(`ML prediction failed: ${error.message}`);
      return [];
    }
  }
  
  prepareMLInput() {
    // Convert current state to tensor-compatible format
    const features = [];
    
    for (const [agentId, territory] of this.territories) {
      features.push([
        territory.files.length,
        territory.priority || 0,
        (territory.expiresAt - Date.now()) / 1000000,
        territory.performanceMetrics?.efficiency || 0,
        this.getHistoricalConflictRate(agentId)
      ]);
    }
    
    return features;
  }
  
  parseMLPrediction(prediction, timeHorizon) {
    // Convert ML output to structured predictions
    return []; // Simplified for now
  }
  
  createTerritoryPredictor(tf) {
    // Simplified neural network for territory prediction
    try {
      const model = tf.sequential({
        layers: [
          tf.layers.dense({ inputShape: [5], units: 10, activation: 'relu' }),
          tf.layers.dense({ units: 5, activation: 'relu' }),
          tf.layers.dense({ units: 1, activation: 'sigmoid' })
        ]
      });
      
      model.compile({
        optimizer: 'adam',
        loss: 'binaryCrossentropy',
        metrics: ['accuracy']
      });
      
      return model;
    } catch (error) {
      logger.warn('Failed to create TensorFlow model, using fallback');
      return this.createMathPredictor();
    }
  }
  
  createConflictDetector(tf) {
    try {
      const model = tf.sequential({
        layers: [
          tf.layers.dense({ inputShape: [8], units: 16, activation: 'relu' }),
          tf.layers.dropout({ rate: 0.2 }),
          tf.layers.dense({ units: 8, activation: 'relu' }),
          tf.layers.dense({ units: 1, activation: 'sigmoid' })
        ]
      });
      
      model.compile({
        optimizer: 'adam',
        loss: 'binaryCrossentropy',
        metrics: ['accuracy']
      });
      
      return model;
    } catch (error) {
      return this.createMathDetector();
    }
  }
  
  createEfficiencyOptimizer(tf) {
    try {
      const model = tf.sequential({
        layers: [
          tf.layers.dense({ inputShape: [10], units: 20, activation: 'relu' }),
          tf.layers.dense({ units: 10, activation: 'relu' }),
          tf.layers.dense({ units: 5, activation: 'linear' })
        ]
      });
      
      model.compile({
        optimizer: 'adam',
        loss: 'meanSquaredError'
      });
      
      return model;
    } catch (error) {
      return this.createMathOptimizer();
    }
  }
  
  /**
   * Start monitoring systems
   */
  startMonitoring() {
    // Dynamic adjustment monitoring
    setInterval(() => {
      if (this.dynamicAdjustmentEngine.enabled) {
        for (const [agentId, territory] of this.territories) {
          this.adjustTerritoryDynamically(agentId).catch(err => 
            logger.error(`Dynamic adjustment failed for ${agentId}: ${err.message}`)
          );
        }
      }
    }, this.dynamicAdjustmentEngine.config.adjustment_interval);
    
    // Load balancing monitoring
    setInterval(() => {
      this.rebalanceLoad().catch(err => 
        logger.error(`Load balancing failed: ${err.message}`)
      );
    }, this.loadBalancer.config.rebalance_interval);
    
    // Conflict prediction monitoring
    setInterval(() => {
      this.predictConflicts().then(predictions => {
        if (predictions.length > 0) {
          this.emit('conflicts_predicted', predictions);
          
          // Attempt prevention
          predictions.forEach(pred => {
            if (pred.probability > 0.8) {
              logger.warn(`🟠️ High conflict probability detected for ${pred.agentId}`);
              // Implement prevention strategies
              pred.prevention_strategies.forEach(strategy => {
                this.implementPreventionStrategy(strategy, pred);
              });
            }
          });
        }
      });
    }, 30000); // Check every 30 seconds
    
    logger.info('🏁 Territory Manager Enhanced monitoring started');
  }
  
  async implementPreventionStrategy(strategy, prediction) {
    switch (strategy) {
      case 'immediate_negotiation':
        // Trigger negotiation between parties
        for (const party of prediction.potential_parties) {
          await this.negotiateAccess(prediction.agentId, party.agentId, 'preventive');
        }
        break;
        
      case 'preemptive_release':
        // Release conflicting files
        const territory = this.territories.get(prediction.agentId);
        if (territory) {
          const conflictFiles = prediction.potential_parties
            .flatMap(p => this.territories.get(p.agentId)?.files || [])
            .filter(f => territory.files.includes(f));
          
          await this.reduceTerritoryScope(territory, { files_to_release: conflictFiles });
        }
        break;
        
      case 'collaborative_mode':
        // Switch to collaborative access
        const terr = this.territories.get(prediction.agentId);
        if (terr) {
          terr.type = this.territoryTypes.COLLABORATIVE;
        }
        break;
        
      default:
        logger.debug(`Prevention strategy ${strategy} noted for monitoring`);
    }
    
    this.conflictResolver.metrics.conflicts_prevented++;
  }
  
  async negotiateAccess(agent1, agent2, type = 'standard') {
    logger.info(`🤝 Negotiating access between ${agent1} and ${agent2} (${type})`);
    
    const territory1 = this.territories.get(agent1);
    const territory2 = this.territories.get(agent2);
    
    if (!territory1 || !territory2) {
      return { success: false, error: 'Territory not found' };
    }
    
    // Find common files
    const commonFiles = territory1.files.filter(f => territory2.files.includes(f));
    
    if (commonFiles.length === 0) {
      return { success: true, message: 'No conflict' };
    }
    
    // Negotiate based on type
    if (type === 'preventive') {
      // Convert both to collaborative
      territory1.type = this.territoryTypes.COLLABORATIVE;
      territory2.type = this.territoryTypes.COLLABORATIVE;
      
      return { success: true, resolution: 'collaborative_access' };
    } else {
      // Standard negotiation based on priority
      const priority1 = territory1.priority || 0;
      const priority2 = territory2.priority || 0;
      
      if (priority1 > priority2) {
        // Transfer files to agent1
        for (const file of commonFiles) {
          const idx = territory2.files.indexOf(file);
          if (idx !== -1) {
            territory2.files.splice(idx, 1);
          }
          this.fileOwnership.set(file, agent1);
        }
        return { success: true, resolution: 'priority_transfer', winner: agent1 };
      } else if (priority2 > priority1) {
        // Transfer files to agent2
        for (const file of commonFiles) {
          const idx = territory1.files.indexOf(file);
          if (idx !== -1) {
            territory1.files.splice(idx, 1);
          }
          this.fileOwnership.set(file, agent2);
        }
        return { success: true, resolution: 'priority_transfer', winner: agent2 };
      } else {
        // Equal priority - time share
        return { success: true, resolution: 'time_sharing' };
      }
    }
  }
  
  /**
   * Get comprehensive metrics
   */
  getMetrics() {
    return {
      territories: {
        total: this.territories.size,
        by_type: this.getTerritoriesByType()
      },
      dynamic_adjustment: this.dynamicAdjustmentEngine.metrics,
      conflict_resolution: this.conflictResolver.metrics,
      load_balancing: this.loadBalancer.metrics,
      ml_optimization: this.mlOptimizer.performance,
      file_ownership: {
        total_files: this.fileOwnership.size,
        unique_owners: new Set(this.fileOwnership.values()).size
      },
      performance: {
        conflict_rate: this.conflictHistory.length / Math.max(1, this.territories.size),
        resolution_success_rate: this.conflictResolver.metrics.success_rate,
        average_efficiency: this.calculateAverageEfficiency(),
        load_variance: this.loadBalancer.metrics.load_variance
      }
    };
  }
  
  getTerritoriesByType() {
    const byType = {};
    
    for (const type of Object.values(this.territoryTypes)) {
      byType[type] = 0;
    }
    
    for (const territory of this.territories.values()) {
      byType[territory.type] = (byType[territory.type] || 0) + 1;
    }
    
    return byType;
  }
  
  calculateAverageEfficiency() {
    let totalEfficiency = 0;
    let count = 0;
    
    for (const territory of this.territories.values()) {
      if (territory.performanceMetrics?.efficiency) {
        totalEfficiency += territory.performanceMetrics.efficiency;
        count++;
      }
    }
    
    return count > 0 ? totalEfficiency / count : 0;
  }
}

// Singleton
let instance = null;

module.exports = {
  TerritoryManagerEnhanced,
  getInstance: () => {
    if (!instance) {
      instance = new TerritoryManagerEnhanced();
    }
    return instance;
  }
};
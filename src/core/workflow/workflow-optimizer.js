/**
 * BUMBA Workflow Optimizer
 * Machine learning-based workflow optimization
 * Part of Workflow Engine enhancement to 90%
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');

/**
 * Optimizer for workflow execution paths and resource allocation
 */
class WorkflowOptimizer extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      learningRate: config.learningRate || 0.1,
      explorationRate: config.explorationRate || 0.2,
      historySize: config.historySize || 1000,
      optimizationInterval: config.optimizationInterval || 60000,
      adaptiveThreshold: config.adaptiveThreshold || 0.8,
      ...config
    };
    
    // Optimization models
    this.pathOptimizer = new Map();
    this.resourceOptimizer = new Map();
    this.parallelismOptimizer = new Map();
    this.cacheOptimizer = new Map();
    
    // Historical data
    this.executionHistory = [];
    this.performanceHistory = new Map();
    this.resourceUsageHistory = new Map();
    this.bottleneckHistory = new Map();
    
    // Machine learning components
    this.models = {
      execution: this.initializeExecutionModel(),
      resource: this.initializeResourceModel(),
      parallelism: this.initializeParallelismModel(),
      prediction: this.initializePredictionModel()
    };
    
    // Optimization strategies
    this.strategies = new Map();
    this.activeStrategy = 'balanced';
    
    // Caching
    this.optimizationCache = new Map();
    this.cacheHits = 0;
    this.cacheMisses = 0;
    
    // Metrics
    this.metrics = {
      optimizations: 0,
      improvements: 0,
      avgImprovement: 0,
      resourceSavings: 0,
      timeReduction: 0,
      cacheEfficiency: 0
    };
    
    this.initialize();
  }
  
  /**
   * Initialize optimizer
   */
  initialize() {
    this.registerOptimizationStrategies();
    this.startOptimizationLoop();
    
    logger.info('🟢 Workflow Optimizer initialized');
  }
  
  /**
   * Initialize execution model
   */
  initializeExecutionModel() {
    return {
      weights: {
        stepDuration: new Map(),
        transitionCost: new Map(),
        parallelismGain: new Map()
      },
      biases: {
        overhead: 100, // ms
        coordination: 50 // ms
      },
      learning: {
        rate: this.config.learningRate,
        momentum: 0.9
      }
    };
  }
  
  /**
   * Initialize resource model
   */
  initializeResourceModel() {
    return {
      weights: {
        cpu: 0.4,
        memory: 0.3,
        io: 0.2,
        network: 0.1
      },
      predictions: new Map(),
      utilization: new Map()
    };
  }
  
  /**
   * Initialize parallelism model
   */
  initializeParallelismModel() {
    return {
      optimalDegree: new Map(),
      speedup: new Map(),
      efficiency: new Map(),
      amdahlFactor: 0.75 // Portion that can be parallelized
    };
  }
  
  /**
   * Initialize prediction model
   */
  initializePredictionModel() {
    return {
      timeSeriesData: [],
      trends: new Map(),
      seasonality: new Map(),
      forecasts: new Map()
    };
  }
  
  /**
   * Register optimization strategies
   */
  registerOptimizationStrategies() {
    // Balanced strategy
    this.registerStrategy('balanced', {
      name: 'Balanced Optimization',
      weights: { time: 0.5, resource: 0.3, cost: 0.2 },
      handler: this.balancedOptimization.bind(this)
    });
    
    // Performance-first strategy
    this.registerStrategy('performance', {
      name: 'Performance Optimization',
      weights: { time: 0.8, resource: 0.1, cost: 0.1 },
      handler: this.performanceOptimization.bind(this)
    });
    
    // Resource-efficient strategy
    this.registerStrategy('resource', {
      name: 'Resource Optimization',
      weights: { time: 0.2, resource: 0.7, cost: 0.1 },
      handler: this.resourceOptimization.bind(this)
    });
    
    // Cost-optimized strategy
    this.registerStrategy('cost', {
      name: 'Cost Optimization',
      weights: { time: 0.2, resource: 0.2, cost: 0.6 },
      handler: this.costOptimization.bind(this)
    });
  }
  
  /**
   * Optimize workflow execution
   */
  async optimizeWorkflow(workflow, context = {}) {
    const optimization = {
      id: this.generateOptimizationId(),
      workflowId: workflow.id,
      timestamp: Date.now(),
      original: workflow,
      optimized: null,
      improvements: {},
      recommendations: []
    };
    
    try {
      // Check cache first
      const cached = this.getCachedOptimization(workflow);
      if (cached) {
        this.cacheHits++;
        return cached;
      }
      this.cacheMisses++;
      
      // Analyze workflow
      const analysis = await this.analyzeWorkflow(workflow, context);
      
      // Apply optimization strategy
      const strategy = this.strategies.get(this.activeStrategy);
      const optimized = await strategy.handler(workflow, analysis, context);
      
      // Calculate improvements
      optimization.improvements = this.calculateImprovements(workflow, optimized);
      
      // Generate recommendations
      optimization.recommendations = this.generateRecommendations(analysis, optimization.improvements);
      
      // Update model
      this.updateModels(workflow, optimized, optimization.improvements);
      
      // Cache result
      this.cacheOptimization(workflow, optimized);
      
      // Update metrics
      this.updateMetrics(optimization);
      
      optimization.optimized = optimized;
      
      this.emit('optimization:complete', optimization);
      
      return optimized;
      
    } catch (error) {
      logger.error('Optimization failed:', error);
      optimization.error = error;
      
      this.emit('optimization:failed', optimization);
      
      // Return original workflow on error
      return workflow;
    }
  }
  
  /**
   * Analyze workflow for optimization opportunities
   */
  async analyzeWorkflow(workflow, context) {
    const analysis = {
      structure: this.analyzeStructure(workflow),
      dependencies: this.analyzeDependencies(workflow),
      resources: this.analyzeResourceRequirements(workflow),
      parallelism: this.analyzeParallelismPotential(workflow),
      bottlenecks: this.identifyBottlenecks(workflow),
      patterns: this.detectPatterns(workflow),
      predictions: await this.predictPerformance(workflow, context)
    };
    
    return analysis;
  }
  
  /**
   * Analyze workflow structure
   */
  analyzeStructure(workflow) {
    const structure = {
      totalSteps: workflow.steps.length,
      depth: this.calculateDepth(workflow),
      branches: this.countBranches(workflow),
      loops: this.detectLoops(workflow),
      complexity: 0
    };
    
    // Calculate cyclomatic complexity
    structure.complexity = 1 + structure.branches + structure.loops.length;
    
    return structure;
  }
  
  /**
   * Analyze dependencies between steps
   */
  analyzeDependencies(workflow) {
    const dependencies = {
      graph: new Map(),
      criticalPath: [],
      parallelizable: [],
      sequential: []
    };
    
    // Build dependency graph
    for (const step of workflow.steps) {
      const deps = step.dependencies || [];
      dependencies.graph.set(step.id, deps);
      
      if (deps.length === 0) {
        dependencies.parallelizable.push(step.id);
      } else {
        dependencies.sequential.push(step.id);
      }
    }
    
    // Find critical path
    dependencies.criticalPath = this.findCriticalPath(dependencies.graph, workflow);
    
    return dependencies;
  }
  
  /**
   * Analyze resource requirements
   */
  analyzeResourceRequirements(workflow) {
    const requirements = {
      total: { cpu: 0, memory: 0, io: 0, network: 0 },
      peak: { cpu: 0, memory: 0, io: 0, network: 0 },
      average: { cpu: 0, memory: 0, io: 0, network: 0 },
      byStep: new Map()
    };
    
    for (const step of workflow.steps) {
      const stepReqs = this.estimateStepResources(step);
      requirements.byStep.set(step.id, stepReqs);
      
      // Update totals
      for (const [resource, amount] of Object.entries(stepReqs)) {
        requirements.total[resource] += amount;
        requirements.peak[resource] = Math.max(requirements.peak[resource], amount);
      }
    }
    
    // Calculate averages
    const stepCount = workflow.steps.length;
    for (const resource in requirements.total) {
      requirements.average[resource] = requirements.total[resource] / stepCount;
    }
    
    return requirements;
  }
  
  /**
   * Analyze parallelism potential
   */
  analyzeParallelismPotential(workflow) {
    const potential = {
      maxParallelism: 0,
      speedup: 0,
      efficiency: 0,
      parallelSteps: [],
      synchronizationPoints: []
    };
    
    // Find independent step groups
    const independentGroups = this.findIndependentGroups(workflow);
    
    potential.maxParallelism = Math.max(...independentGroups.map(g => g.length));
    
    // Calculate theoretical speedup (Amdahl's Law)
    const parallelFraction = this.calculateParallelFraction(workflow);
    potential.speedup = 1 / ((1 - parallelFraction) + parallelFraction / potential.maxParallelism);
    
    potential.efficiency = potential.speedup / potential.maxParallelism;
    
    // Identify synchronization points
    potential.synchronizationPoints = this.findSynchronizationPoints(workflow);
    
    return potential;
  }
  
  /**
   * Identify bottlenecks
   */
  identifyBottlenecks(workflow) {
    const bottlenecks = [];
    
    // Check historical data
    const history = this.performanceHistory.get(workflow.id);
    
    if (history) {
      // Find slow steps
      const avgDuration = history.avgStepDuration || 0;
      
      for (const [stepId, duration] of Object.entries(history.stepDurations || {})) {
        if (duration > avgDuration * 1.5) {
          bottlenecks.push({
            type: 'performance',
            stepId,
            severity: duration / avgDuration,
            suggestion: 'Consider optimizing or parallelizing this step'
          });
        }
      }
    }
    
    // Check resource bottlenecks
    const resourceAnalysis = this.analyzeResourceRequirements(workflow);
    
    for (const [stepId, reqs] of resourceAnalysis.byStep) {
      for (const [resource, amount] of Object.entries(reqs)) {
        if (amount > 80) { // > 80% utilization
          bottlenecks.push({
            type: 'resource',
            stepId,
            resource,
            severity: amount / 100,
            suggestion: `High ${resource} usage - consider resource optimization`
          });
        }
      }
    }
    
    return bottlenecks;
  }
  
  /**
   * Detect workflow patterns
   */
  detectPatterns(workflow) {
    const patterns = [];
    
    // Detect sequential pattern
    if (this.isSequential(workflow)) {
      patterns.push({
        type: 'sequential',
        optimization: 'Consider adding parallelism where possible'
      });
    }
    
    // Detect fork-join pattern
    if (this.hasForkJoin(workflow)) {
      patterns.push({
        type: 'fork-join',
        optimization: 'Optimize join synchronization'
      });
    }
    
    // Detect pipeline pattern
    if (this.isPipeline(workflow)) {
      patterns.push({
        type: 'pipeline',
        optimization: 'Consider stream processing'
      });
    }
    
    // Detect repeated subworkflows
    const repeated = this.findRepeatedPatterns(workflow);
    if (repeated.length > 0) {
      patterns.push({
        type: 'repeated',
        instances: repeated,
        optimization: 'Extract common patterns into reusable components'
      });
    }
    
    return patterns;
  }
  
  /**
   * Predict performance
   */
  async predictPerformance(workflow, context) {
    const prediction = {
      estimatedDuration: 0,
      resourceUsage: {},
      successProbability: 0,
      confidence: 0
    };
    
    // Use historical data if available
    const history = this.performanceHistory.get(workflow.id);
    
    if (history && history.executions > 10) {
      // Use historical average with trend adjustment
      prediction.estimatedDuration = history.avgDuration * this.getTrendFactor(workflow.id);
      prediction.confidence = Math.min(0.9, history.executions / 100);
    } else {
      // Estimate based on step count and complexity
      const complexity = this.analyzeStructure(workflow).complexity;
      prediction.estimatedDuration = workflow.steps.length * 1000 * (1 + complexity / 10);
      prediction.confidence = 0.3;
    }
    
    // Predict resource usage
    const resources = this.analyzeResourceRequirements(workflow);
    prediction.resourceUsage = resources.peak;
    
    // Predict success probability
    prediction.successProbability = history ? 
      (history.successes / history.executions) : 0.8;
    
    return prediction;
  }
  
  /**
   * Optimization Strategies
   */
  
  async balancedOptimization(workflow, analysis, context) {
    let optimized = { ...workflow };
    
    // Apply multiple optimization techniques
    optimized = this.optimizeParallelism(optimized, analysis);
    optimized = this.optimizeResourceAllocation(optimized, analysis);
    optimized = this.optimizeStepOrder(optimized, analysis);
    optimized = this.addCaching(optimized, analysis);
    
    return optimized;
  }
  
  async performanceOptimization(workflow, analysis, context) {
    let optimized = { ...workflow };
    
    // Maximize parallelism
    optimized = this.maximizeParallelism(optimized, analysis);
    
    // Optimize critical path
    optimized = this.optimizeCriticalPath(optimized, analysis);
    
    // Add aggressive caching
    optimized = this.aggressiveCaching(optimized, analysis);
    
    // Prefetch resources
    optimized = this.addPrefetching(optimized, analysis);
    
    return optimized;
  }
  
  async resourceOptimization(workflow, analysis, context) {
    let optimized = { ...workflow };
    
    // Minimize resource usage
    optimized = this.minimizeResourceUsage(optimized, analysis);
    
    // Batch operations
    optimized = this.batchOperations(optimized, analysis);
    
    // Share resources between steps
    optimized = this.shareResources(optimized, analysis);
    
    return optimized;
  }
  
  async costOptimization(workflow, analysis, context) {
    let optimized = { ...workflow };
    
    // Use cheaper resources
    optimized = this.selectCheaperResources(optimized, analysis);
    
    // Defer non-critical steps
    optimized = this.deferNonCritical(optimized, analysis);
    
    // Batch to reduce overhead
    optimized = this.batchForCost(optimized, analysis);
    
    return optimized;
  }
  
  /**
   * Optimization Techniques
   */
  
  optimizeParallelism(workflow, analysis) {
    const optimized = { ...workflow };
    
    if (analysis.parallelism.maxParallelism > 1) {
      // Convert to parallel execution where possible
      optimized.config = {
        ...optimized.config,
        parallel: true,
        maxParallelism: analysis.parallelism.maxParallelism
      };
      
      // Reorder steps for better parallelism
      optimized.steps = this.reorderForParallelism(
        optimized.steps,
        analysis.dependencies
      );
    }
    
    return optimized;
  }
  
  maximizeParallelism(workflow, analysis) {
    const optimized = { ...workflow };
    
    // Force parallel execution
    optimized.config = {
      ...optimized.config,
      parallel: true,
      maxParallelism: analysis.parallelism.maxParallelism * 2 // Aggressive
    };
    
    // Split large steps
    optimized.steps = this.splitLargeSteps(optimized.steps);
    
    return optimized;
  }
  
  optimizeResourceAllocation(workflow, analysis) {
    const optimized = { ...workflow };
    
    // Allocate resources based on requirements
    for (const step of optimized.steps) {
      const requirements = analysis.resources.byStep.get(step.id);
      
      if (requirements) {
        step.resources = {
          cpu: Math.ceil(requirements.cpu * 1.1), // 10% buffer
          memory: Math.ceil(requirements.memory * 1.2), // 20% buffer
          io: requirements.io,
          network: requirements.network
        };
      }
    }
    
    return optimized;
  }
  
  optimizeStepOrder(workflow, analysis) {
    const optimized = { ...workflow };
    
    // Reorder based on critical path
    if (analysis.dependencies.criticalPath.length > 0) {
      const criticalSteps = new Set(analysis.dependencies.criticalPath);
      
      // Move critical path steps earlier
      optimized.steps.sort((a, b) => {
        const aCritical = criticalSteps.has(a.id);
        const bCritical = criticalSteps.has(b.id);
        
        if (aCritical && !bCritical) return -1;
        if (!aCritical && bCritical) return 1;
        return 0;
      });
    }
    
    return optimized;
  }
  
  optimizeCriticalPath(workflow, analysis) {
    const optimized = { ...workflow };
    
    // Prioritize critical path steps
    for (const step of optimized.steps) {
      if (analysis.dependencies.criticalPath.includes(step.id)) {
        step.priority = 'high';
        step.resources = {
          ...step.resources,
          cpu: (step.resources?.cpu || 20) * 1.5
        };
      }
    }
    
    return optimized;
  }
  
  addCaching(workflow, analysis) {
    const optimized = { ...workflow };
    
    // Add caching to expensive steps
    for (const bottleneck of analysis.bottlenecks) {
      if (bottleneck.type === 'performance') {
        const step = optimized.steps.find(s => s.id === bottleneck.stepId);
        
        if (step) {
          step.cache = {
            enabled: true,
            ttl: 3600000, // 1 hour
            key: `${step.id}_${JSON.stringify(step.input || {})}`
          };
        }
      }
    }
    
    return optimized;
  }
  
  aggressiveCaching(workflow, analysis) {
    const optimized = { ...workflow };
    
    // Cache all steps
    for (const step of optimized.steps) {
      step.cache = {
        enabled: true,
        ttl: 7200000, // 2 hours
        key: `${step.id}_${Date.now()}`
      };
    }
    
    return optimized;
  }
  
  addPrefetching(workflow, analysis) {
    const optimized = { ...workflow };
    
    // Add prefetch hints
    for (let i = 0; i < optimized.steps.length - 1; i++) {
      const currentStep = optimized.steps[i];
      const nextStep = optimized.steps[i + 1];
      
      currentStep.prefetch = {
        next: nextStep.id,
        resources: analysis.resources.byStep.get(nextStep.id)
      };
    }
    
    return optimized;
  }
  
  /**
   * Helper Methods
   */
  
  calculateDepth(workflow) {
    // Calculate workflow depth (longest path)
    let maxDepth = 0;
    
    const visit = (stepId, depth = 0) => {
      maxDepth = Math.max(maxDepth, depth);
      
      const step = workflow.steps.find(s => s.id === stepId);
      if (step && step.next) {
        visit(step.next, depth + 1);
      }
    };
    
    if (workflow.steps.length > 0) {
      visit(workflow.steps[0].id);
    }
    
    return maxDepth;
  }
  
  countBranches(workflow) {
    return workflow.steps.filter(s => 
      s.type === 'condition' || s.type === 'switch'
    ).length;
  }
  
  detectLoops(workflow) {
    return workflow.steps.filter(s => 
      s.type === 'loop' || s.type === 'while'
    );
  }
  
  findCriticalPath(dependencyGraph, workflow) {
    // Simplified critical path finding
    const path = [];
    const visited = new Set();
    
    const visit = (stepId) => {
      if (visited.has(stepId)) return;
      
      visited.add(stepId);
      path.push(stepId);
      
      const deps = dependencyGraph.get(stepId) || [];
      for (const dep of deps) {
        visit(dep);
      }
    };
    
    // Start from steps with no dependencies
    for (const [stepId, deps] of dependencyGraph) {
      if (deps.length === 0) {
        visit(stepId);
      }
    }
    
    return path;
  }
  
  estimateStepResources(step) {
    // Estimate based on step type and configuration
    const base = {
      cpu: 10,
      memory: 20,
      io: 5,
      network: 5
    };
    
    // Adjust based on step type
    switch (step.type) {
      case 'compute':
        base.cpu *= 3;
        break;
      case 'io':
        base.io *= 3;
        break;
      case 'api':
        base.network *= 3;
        break;
      case 'parallel':
        base.cpu *= 2;
        base.memory *= 2;
        break;
    }
    
    return base;
  }
  
  findIndependentGroups(workflow) {
    const groups = [];
    const visited = new Set();
    
    for (const step of workflow.steps) {
      if (!visited.has(step.id)) {
        const group = [];
        
        // Find all steps that can run in parallel with this one
        for (const other of workflow.steps) {
          if (!visited.has(other.id) && this.canRunInParallel(step, other, workflow)) {
            group.push(other);
            visited.add(other.id);
          }
        }
        
        if (group.length > 0) {
          groups.push(group);
        }
      }
    }
    
    return groups;
  }
  
  canRunInParallel(step1, step2, workflow) {
    // Check if steps have conflicting dependencies
    const deps1 = new Set(step1.dependencies || []);
    const deps2 = new Set(step2.dependencies || []);
    
    // Steps can run in parallel if they don't depend on each other
    return !deps1.has(step2.id) && !deps2.has(step1.id);
  }
  
  calculateParallelFraction(workflow) {
    const independentSteps = workflow.steps.filter(s => 
      !s.dependencies || s.dependencies.length === 0
    );
    
    return independentSteps.length / workflow.steps.length;
  }
  
  findSynchronizationPoints(workflow) {
    return workflow.steps.filter(s => 
      s.type === 'join' || s.type === 'barrier' || s.type === 'aggregate'
    );
  }
  
  isSequential(workflow) {
    return workflow.steps.every((s, i) => 
      i === 0 || s.dependencies?.includes(workflow.steps[i - 1].id)
    );
  }
  
  hasForkJoin(workflow) {
    const hasFork = workflow.steps.some(s => s.type === 'fork' || s.type === 'parallel');
    const hasJoin = workflow.steps.some(s => s.type === 'join' || s.type === 'aggregate');
    
    return hasFork && hasJoin;
  }
  
  isPipeline(workflow) {
    return workflow.steps.every((s, i) => 
      i === 0 || (s.input === workflow.steps[i - 1].output)
    );
  }
  
  findRepeatedPatterns(workflow) {
    const patterns = [];
    const stepSequences = new Map();
    
    // Look for repeated sequences of 2-5 steps
    for (let len = 2; len <= Math.min(5, workflow.steps.length / 2); len++) {
      for (let i = 0; i <= workflow.steps.length - len; i++) {
        const sequence = workflow.steps.slice(i, i + len)
          .map(s => s.type)
          .join('-');
        
        if (!stepSequences.has(sequence)) {
          stepSequences.set(sequence, []);
        }
        
        stepSequences.get(sequence).push(i);
      }
    }
    
    // Find sequences that appear more than once
    for (const [sequence, positions] of stepSequences) {
      if (positions.length > 1) {
        patterns.push({
          pattern: sequence,
          occurrences: positions.length,
          positions
        });
      }
    }
    
    return patterns;
  }
  
  getTrendFactor(workflowId) {
    const history = this.performanceHistory.get(workflowId);
    
    if (!history || history.trend === undefined) {
      return 1.0;
    }
    
    // Apply trend adjustment
    return 1.0 + history.trend * 0.1;
  }
  
  reorderForParallelism(steps, dependencies) {
    // Topological sort with parallelism consideration
    const sorted = [];
    const visited = new Set();
    const inProgress = new Set();
    
    const visit = (step) => {
      if (visited.has(step.id)) return;
      if (inProgress.has(step.id)) {
        throw new Error('Circular dependency detected');
      }
      
      inProgress.add(step.id);
      
      // Visit dependencies first
      const deps = dependencies.graph.get(step.id) || [];
      for (const depId of deps) {
        const depStep = steps.find(s => s.id === depId);
        if (depStep) {
          visit(depStep);
        }
      }
      
      inProgress.delete(step.id);
      visited.add(step.id);
      sorted.push(step);
    };
    
    for (const step of steps) {
      visit(step);
    }
    
    return sorted;
  }
  
  splitLargeSteps(steps) {
    const split = [];
    
    for (const step of steps) {
      if (step.type === 'batch' && step.items && step.items.length > 10) {
        // Split batch into smaller batches
        const batchSize = Math.ceil(step.items.length / 3);
        
        for (let i = 0; i < step.items.length; i += batchSize) {
          split.push({
            ...step,
            id: `${step.id}_${i}`,
            items: step.items.slice(i, i + batchSize)
          });
        }
      } else {
        split.push(step);
      }
    }
    
    return split;
  }
  
  /**
   * Model Updates
   */
  
  updateModels(original, optimized, improvements) {
    // Update execution model
    this.updateExecutionModel(original, optimized, improvements);
    
    // Update resource model
    this.updateResourceModel(original, optimized);
    
    // Update parallelism model
    this.updateParallelismModel(original, optimized);
    
    // Add to history
    this.addToHistory(original, optimized, improvements);
  }
  
  updateExecutionModel(original, optimized, improvements) {
    const model = this.models.execution;
    
    // Update step duration weights
    if (improvements.timeReduction) {
      const factor = 1 - improvements.timeReduction;
      
      for (const step of original.steps) {
        const currentWeight = model.weights.stepDuration.get(step.type) || 1.0;
        const newWeight = currentWeight * factor;
        
        model.weights.stepDuration.set(step.type, newWeight);
      }
    }
  }
  
  updateResourceModel(original, optimized) {
    const model = this.models.resource;
    
    // Update resource predictions
    for (const step of optimized.steps) {
      if (step.resources) {
        model.predictions.set(step.id, step.resources);
      }
    }
  }
  
  updateParallelismModel(original, optimized) {
    const model = this.models.parallelism;
    
    if (optimized.config?.maxParallelism) {
      model.optimalDegree.set(original.id, optimized.config.maxParallelism);
    }
  }
  
  addToHistory(original, optimized, improvements) {
    this.executionHistory.push({
      timestamp: Date.now(),
      originalId: original.id,
      optimizedId: optimized.id,
      improvements
    });
    
    // Maintain history size
    if (this.executionHistory.length > this.config.historySize) {
      this.executionHistory.shift();
    }
  }
  
  /**
   * Caching
   */
  
  getCachedOptimization(workflow) {
    const key = this.generateCacheKey(workflow);
    return this.optimizationCache.get(key);
  }
  
  cacheOptimization(workflow, optimized) {
    const key = this.generateCacheKey(workflow);
    this.optimizationCache.set(key, optimized);
    
    // Maintain cache size
    if (this.optimizationCache.size > 100) {
      const firstKey = this.optimizationCache.keys().next().value;
      this.optimizationCache.delete(firstKey);
    }
  }
  
  generateCacheKey(workflow) {
    return `${workflow.id}_${workflow.version || '1.0'}_${workflow.steps.length}`;
  }
  
  /**
   * Metrics and Analysis
   */
  
  calculateImprovements(original, optimized) {
    const improvements = {
      timeReduction: 0,
      resourceSavings: 0,
      parallelismGain: 0,
      stepsOptimized: 0
    };
    
    // Estimate time reduction
    if (optimized.config?.parallel && !original.config?.parallel) {
      improvements.timeReduction = 0.3; // 30% reduction estimate
    }
    
    // Count optimized steps
    improvements.stepsOptimized = optimized.steps.filter(s => 
      s.cache || s.resources || s.priority
    ).length;
    
    // Calculate parallelism gain
    if (optimized.config?.maxParallelism) {
      improvements.parallelismGain = optimized.config.maxParallelism / original.steps.length;
    }
    
    return improvements;
  }
  
  generateRecommendations(analysis, improvements) {
    const recommendations = [];
    
    // Based on bottlenecks
    for (const bottleneck of analysis.bottlenecks) {
      recommendations.push({
        type: 'bottleneck',
        target: bottleneck.stepId,
        suggestion: bottleneck.suggestion,
        priority: bottleneck.severity > 2 ? 'high' : 'medium'
      });
    }
    
    // Based on patterns
    for (const pattern of analysis.patterns) {
      if (pattern.optimization) {
        recommendations.push({
          type: 'pattern',
          pattern: pattern.type,
          suggestion: pattern.optimization,
          priority: 'low'
        });
      }
    }
    
    // Based on parallelism potential
    if (analysis.parallelism.efficiency < 0.5) {
      recommendations.push({
        type: 'parallelism',
        suggestion: 'Consider restructuring for better parallelism',
        priority: 'medium'
      });
    }
    
    return recommendations;
  }
  
  updateMetrics(optimization) {
    this.metrics.optimizations++;
    
    if (optimization.improvements) {
      const improvement = optimization.improvements.timeReduction || 0;
      
      this.metrics.avgImprovement = 
        (this.metrics.avgImprovement * (this.metrics.optimizations - 1) + improvement) /
        this.metrics.optimizations;
      
      if (improvement > 0) {
        this.metrics.improvements++;
      }
      
      this.metrics.timeReduction += improvement;
      this.metrics.resourceSavings += optimization.improvements.resourceSavings || 0;
    }
    
    // Update cache efficiency
    const total = this.cacheHits + this.cacheMisses;
    this.metrics.cacheEfficiency = total > 0 ? this.cacheHits / total : 0;
  }
  
  /**
   * Control Methods
   */
  
  startOptimizationLoop() {
    this.optimizationInterval = setInterval(() => {
      this.performPeriodicOptimization();
    }, this.config.optimizationInterval);
  }
  
  async performPeriodicOptimization() {
    // Re-optimize frequently used workflows
    for (const [workflowId, history] of this.performanceHistory) {
      if (history.executions > 10 && history.lastOptimized < Date.now() - 3600000) {
        // Re-optimize if used frequently and not optimized recently
        const workflow = { id: workflowId, steps: [] }; // Get actual workflow
        await this.optimizeWorkflow(workflow);
        
        history.lastOptimized = Date.now();
      }
    }
  }
  
  setStrategy(strategyName) {
    if (this.strategies.has(strategyName)) {
      this.activeStrategy = strategyName;
      logger.info(`Optimization strategy set to: ${strategyName}`);
    }
  }
  
  registerStrategy(name, strategy) {
    this.strategies.set(name, strategy);
  }
  
  getMetrics() {
    return {
      ...this.metrics,
      historySize: this.executionHistory.length,
      cacheSize: this.optimizationCache.size,
      activeStrategy: this.activeStrategy
    };
  }
  
  generateOptimizationId() {
    return `opt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}

module.exports = WorkflowOptimizer;
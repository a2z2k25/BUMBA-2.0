/**
 * BUMBA Model Selection Hooks
 * Intelligent model selection, routing, and optimization system
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');

class ModelSelectionHooks extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.modelProviders = new Map();
    this.routingRules = new Map();
    this.performanceMetrics = new Map();
    this.costTracking = new Map();
    this.usageStats = new Map();
    this.fallbackChains = new Map();
    
    this.config = {
      enableCostOptimization: options.enableCostOptimization !== false,
      enablePerformanceTracking: options.enablePerformanceTracking !== false,
      enableFailover: options.enableFailover !== false,
      enableABTesting: options.enableABTesting || false,
      defaultTimeout: options.defaultTimeout || 30000,
      maxRetries: options.maxRetries || 3,
      costThreshold: options.costThreshold || 1.0,
      performanceThreshold: options.performanceThreshold || 2000,
      fallbackDelay: options.fallbackDelay || 1000
    };
    
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      fallbackUsed: 0,
      totalCost: 0,
      averageLatency: 0
    };
    
    // Initialize default providers and routing
    this.initializeDefaultProviders();
    this.initializeDefaultRouting();
  }

  /**
   * Initialize default model providers
   */
  initializeDefaultProviders() {
    const defaultProviders = [
      {
        name: 'openai',
        models: ['gpt-4', 'gpt-3.5-turbo', 'gpt-4-turbo'],
        capabilities: ['text-generation', 'code-generation', 'analysis'],
        costPerToken: 0.00003,
        avgLatency: 1500,
        reliability: 0.99
      },
      {
        name: 'anthropic',
        models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
        capabilities: ['text-generation', 'analysis', 'reasoning'],
        costPerToken: 0.000015,
        avgLatency: 2000,
        reliability: 0.98
      },
      {
        name: 'local',
        models: ['llama-2', 'codellama', 'mistral'],
        capabilities: ['text-generation', 'code-generation'],
        costPerToken: 0,
        avgLatency: 800,
        reliability: 0.95
      }
    ];
    
    defaultProviders.forEach(provider => {
      this.registerModelProvider(provider.name, provider);
    });
  }

  /**
   * Initialize default routing rules
   */
  initializeDefaultRouting() {
    // Default routing based on task type
    this.configureRouting('code-generation', {
      primary: 'openai:gpt-4',
      fallback: ['anthropic:claude-3-sonnet', 'local:codellama'],
      criteria: { capability: 'code-generation', maxCost: 0.5 }
    });
    
    this.configureRouting('analysis', {
      primary: 'anthropic:claude-3-opus',
      fallback: ['openai:gpt-4', 'anthropic:claude-3-sonnet'],
      criteria: { capability: 'analysis', maxLatency: 3000 }
    });
    
    this.configureRouting('simple-tasks', {
      primary: 'local:llama-2',
      fallback: ['anthropic:claude-3-haiku', 'openai:gpt-3.5-turbo'],
      criteria: { costOptimized: true }
    });
  }

  /**
   * Select optimal model for a request
   */
  async selectModel(request, options = {}) {
    this.stats.totalRequests++;
    
    try {
      const startTime = Date.now();
      
      // Determine task type
      const taskType = this.determineTaskType(request);
      
      // Get routing configuration
      const routing = this.routingRules.get(taskType) || this.getDefaultRouting();
      
      // Apply selection criteria
      const selectedModel = await this.applySelectionCriteria(request, routing, options);
      
      // Track selection
      this.trackSelection(selectedModel, request, taskType);
      
      // Emit selection event
      this.emit('model-selected', {
        model: selectedModel,
        taskType,
        request: request.id || 'unknown',
        timestamp: Date.now(),
        selectionTime: Date.now() - startTime
      });
      
      this.stats.successfulRequests++;
      
      return selectedModel;
    } catch (error) {
      this.stats.failedRequests++;
      
      logger.error('Model selection failed:', { error: error.message, request });
      
      this.emit('selection-error', {
        error: error.message,
        request: request.id || 'unknown',
        timestamp: Date.now()
      });
      
      // Return fallback model
      return this.getFallbackModel(request);
    }
  }

  /**
   * Register a model provider
   */
  registerModelProvider(name, config) {
    const provider = {
      name,
      models: config.models || [],
      capabilities: config.capabilities || [],
      costPerToken: config.costPerToken || 0,
      avgLatency: config.avgLatency || 1000,
      reliability: config.reliability || 0.95,
      maxConcurrency: config.maxConcurrency || 10,
      currentLoad: 0,
      totalRequests: 0,
      successfulRequests: 0,
      totalCost: 0,
      registered: Date.now()
    };
    
    this.modelProviders.set(name, provider);
    
    // Initialize performance metrics
    this.performanceMetrics.set(name, {
      latencyHistory: [],
      errorRate: 0,
      availability: 1.0,
      lastHealthCheck: Date.now()
    });
    
    // Initialize cost tracking
    this.costTracking.set(name, {
      dailyCost: 0,
      monthlyCost: 0,
      tokenUsage: 0,
      requestCount: 0
    });
    
    logger.info(`Registered model provider: ${name}`, { models: config.models });
    
    this.emit('provider-registered', { name, config, timestamp: Date.now() });
    
    return this;
  }

  /**
   * Evaluate model performance
   */
  async evaluatePerformance(modelName, metrics) {
    const provider = this.getProviderFromModel(modelName);
    if (!provider) {
      throw new Error(`Provider not found for model: ${modelName}`);
    }
    
    const performance = this.performanceMetrics.get(provider);
    
    // Update latency history
    if (metrics.latency) {
      performance.latencyHistory.push({
        latency: metrics.latency,
        timestamp: Date.now()
      });
      
      // Keep only recent history
      if (performance.latencyHistory.length > 100) {
        performance.latencyHistory = performance.latencyHistory.slice(-100);
      }
    }
    
    // Update error rate
    if (metrics.success !== undefined) {
      const providerData = this.modelProviders.get(provider);
      if (metrics.success) {
        providerData.successfulRequests++;
      }
      providerData.totalRequests++;
      
      performance.errorRate = 1 - (providerData.successfulRequests / providerData.totalRequests);
    }
    
    // Update availability
    if (metrics.available !== undefined) {
      performance.availability = metrics.available ? 1.0 : 0.0;
      performance.lastHealthCheck = Date.now();
    }
    
    // Calculate performance score
    const avgLatency = performance.latencyHistory.length > 0
      ? performance.latencyHistory.reduce((sum, m) => sum + m.latency, 0) / performance.latencyHistory.length
      : 1000;
    
    const performanceScore = this.calculatePerformanceScore(
      avgLatency,
      performance.errorRate,
      performance.availability
    );
    
    // Update provider performance
    const providerData = this.modelProviders.get(provider);
    providerData.avgLatency = avgLatency;
    providerData.reliability = 1 - performance.errorRate;
    
    this.emit('performance-updated', {
      provider,
      model: modelName,
      metrics,
      performanceScore,
      timestamp: Date.now()
    });
    
    return {
      provider,
      model: modelName,
      performanceScore,
      avgLatency,
      errorRate: performance.errorRate,
      availability: performance.availability
    };
  }

  /**
   * Handle model fallback
   */
  async handleFallback(originalModel, request, error) {
    this.stats.fallbackUsed++;
    
    const taskType = this.determineTaskType(request);
    const routing = this.routingRules.get(taskType);
    
    if (!routing || !routing.fallback || routing.fallback.length === 0) {
      throw new Error(`No fallback available for model: ${originalModel}`);
    }
    
    logger.warn(`Falling back from ${originalModel}`, { error: error.message, request: request.id });
    
    // Try fallback models in order
    for (const fallbackModel of routing.fallback) {
      try {
        // Check if fallback model is available
        const provider = this.getProviderFromModel(fallbackModel);
        const providerData = this.modelProviders.get(provider);
        
        if (providerData && providerData.currentLoad < providerData.maxConcurrency) {
          this.emit('fallback-used', {
            original: originalModel,
            fallback: fallbackModel,
            request: request.id || 'unknown',
            reason: error.message,
            timestamp: Date.now()
          });
          
          return fallbackModel;
        }
      } catch (fallbackError) {
        logger.warn(`Fallback model ${fallbackModel} also failed:`, fallbackError.message);
      }
    }
    
    throw new Error(`All fallback models failed for original model: ${originalModel}`);
  }

  /**
   * Optimize cost by selecting cheaper models when appropriate
   */
  async optimizeCost(request, options = {}) {
    const maxCost = options.maxCost || this.config.costThreshold;
    const availableModels = this.getAvailableModels();
    
    // Filter models by cost
    const affordableModels = availableModels.filter(model => {
      const provider = this.getProviderFromModel(model);
      const providerData = this.modelProviders.get(provider);
      return providerData && providerData.costPerToken <= maxCost;
    });
    
    if (affordableModels.length === 0) {
      logger.warn(`No models available within cost threshold: ${maxCost}`);
      return null;
    }
    
    // Sort by cost (ascending) and performance (descending)
    const optimizedModels = affordableModels.sort((a, b) => {
      const providerA = this.modelProviders.get(this.getProviderFromModel(a));
      const providerB = this.modelProviders.get(this.getProviderFromModel(b));
      
      // Primary sort: cost
      const costDiff = providerA.costPerToken - providerB.costPerToken;
      if (Math.abs(costDiff) > 0.000001) return costDiff;
      
      // Secondary sort: reliability
      return providerB.reliability - providerA.reliability;
    });
    
    const selectedModel = optimizedModels[0];
    
    this.emit('cost-optimized', {
      selectedModel,
      availableOptions: optimizedModels.length,
      maxCost,
      request: request.id || 'unknown',
      timestamp: Date.now()
    });
    
    return selectedModel;
  }

  /**
   * Track model usage and costs
   */
  trackUsage(modelName, usage) {
    const provider = this.getProviderFromModel(modelName);
    if (!provider) return;
    
    const costData = this.costTracking.get(provider);
    const providerData = this.modelProviders.get(provider);
    
    // Calculate cost
    const cost = usage.tokens * providerData.costPerToken;
    
    // Update tracking data
    costData.tokenUsage += usage.tokens;
    costData.requestCount++;
    costData.dailyCost += cost;
    costData.monthlyCost += cost;
    
    // Update provider stats
    providerData.totalCost += cost;
    providerData.currentLoad = Math.max(0, providerData.currentLoad + (usage.concurrent || 0));
    
    // Update global stats
    this.stats.totalCost += cost;
    
    // Store usage in stats
    const modelStats = this.usageStats.get(modelName) || {
      totalRequests: 0,
      totalTokens: 0,
      totalCost: 0,
      avgLatency: 0
    };
    
    modelStats.totalRequests++;
    modelStats.totalTokens += usage.tokens;
    modelStats.totalCost += cost;
    
    if (usage.latency) {
      modelStats.avgLatency = (modelStats.avgLatency * (modelStats.totalRequests - 1) + usage.latency) / modelStats.totalRequests;
    }
    
    this.usageStats.set(modelName, modelStats);
    
    this.emit('usage-tracked', {
      model: modelName,
      provider,
      usage,
      cost,
      timestamp: Date.now()
    });
  }

  /**
   * Configure routing rules for task types
   */
  configureRouting(taskType, routing) {
    this.routingRules.set(taskType, {
      primary: routing.primary,
      fallback: routing.fallback || [],
      criteria: routing.criteria || {},
      weights: routing.weights || {},
      abTest: routing.abTest || null,
      created: Date.now()
    });
    
    logger.info(`Configured routing for task type: ${taskType}`, routing);
    
    this.emit('routing-configured', {
      taskType,
      routing,
      timestamp: Date.now()
    });
    
    return this;
  }

  // Helper methods
  
  determineTaskType(request) {
    // Simple task type detection based on request content
    if (request.type) return request.type;
    
    const content = request.content || request.prompt || '';
    
    if (content.includes('code') || content.includes('function') || content.includes('class')) {
      return 'code-generation';
    }
    
    if (content.includes('analyze') || content.includes('review') || content.includes('explain')) {
      return 'analysis';
    }
    
    return 'simple-tasks';
  }
  
  async applySelectionCriteria(request, routing, options) {
    let candidates = [routing.primary, ...(routing.fallback || [])];
    
    // Filter by availability
    candidates = candidates.filter(model => {
      const provider = this.getProviderFromModel(model);
      const providerData = this.modelProviders.get(provider);
      return providerData && providerData.currentLoad < providerData.maxConcurrency;
    });
    
    if (candidates.length === 0) {
      throw new Error('No available models match criteria');
    }
    
    // Apply cost optimization if enabled
    if (this.config.enableCostOptimization && routing.criteria.costOptimized) {
      const costOptimized = await this.optimizeCost(request, options);
      if (costOptimized && candidates.includes(costOptimized)) {
        return costOptimized;
      }
    }
    
    // Apply performance criteria
    if (routing.criteria.maxLatency) {
      candidates = candidates.filter(model => {
        const provider = this.getProviderFromModel(model);
        const providerData = this.modelProviders.get(provider);
        return providerData.avgLatency <= routing.criteria.maxLatency;
      });
    }
    
    // A/B testing
    if (this.config.enableABTesting && routing.abTest) {
      const variant = Math.random() < 0.5 ? 'A' : 'B';
      const testModel = routing.abTest[variant];
      if (testModel && candidates.includes(testModel)) {
        return testModel;
      }
    }
    
    return candidates[0]; // Return primary or first available
  }
  
  getProviderFromModel(modelName) {
    const [provider] = modelName.split(':');
    return provider;
  }
  
  getFallbackModel(request) {
    // Return cheapest available model as ultimate fallback
    const availableModels = this.getAvailableModels();
    if (availableModels.length === 0) {
      throw new Error('No models available for fallback');
    }
    
    return availableModels.sort((a, b) => {
      const providerA = this.modelProviders.get(this.getProviderFromModel(a));
      const providerB = this.modelProviders.get(this.getProviderFromModel(b));
      return providerA.costPerToken - providerB.costPerToken;
    })[0];
  }
  
  getAvailableModels() {
    const models = [];
    
    for (const [providerName, provider] of this.modelProviders) {
      for (const model of provider.models) {
        if (provider.currentLoad < provider.maxConcurrency) {
          models.push(`${providerName}:${model}`);
        }
      }
    }
    
    return models;
  }
  
  getDefaultRouting() {
    return {
      primary: 'openai:gpt-3.5-turbo',
      fallback: ['anthropic:claude-3-haiku', 'local:llama-2'],
      criteria: {}
    };
  }
  
  calculatePerformanceScore(latency, errorRate, availability) {
    // Normalize metrics (lower is better for latency and error rate)
    const latencyScore = Math.max(0, 1 - (latency / 5000)); // 5s max
    const reliabilityScore = 1 - errorRate;
    const availabilityScore = availability;
    
    // Weighted average
    return (latencyScore * 0.3 + reliabilityScore * 0.4 + availabilityScore * 0.3) * 100;
  }
  
  trackSelection(model, request, taskType) {
    const provider = this.getProviderFromModel(model);
    const providerData = this.modelProviders.get(provider);
    
    if (providerData) {
      providerData.currentLoad++;
    }
  }
}

module.exports = { ModelSelectionHooks };
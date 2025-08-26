/**
 * BUMBA OpenRouter MCP Integration
 * Provides access to 200+ AI models through a unified interface
 * Enables intelligent model selection and cost optimization
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');

class OpenRouterIntegration extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      apiKey: config.apiKey || process.env.OPENROUTER_API_KEY,
      baseUrl: config.baseUrl || 'https://openrouter.ai/api/v1',
      defaultModel: config.defaultModel || 'auto', // Auto-routing by default
      maxRetries: config.maxRetries || 3,
      timeout: config.timeout || 60000,
      
      // Model preferences and constraints
      preferences: {
        maxCost: config.maxCost || 0.01, // Max $ per 1k tokens
        minSpeed: config.minSpeed || 'medium', // slow, medium, fast
        quality: config.quality || 'balanced', // economy, balanced, premium
        capabilities: config.capabilities || [] // ['vision', 'function_calling', 'json_mode']
      },
      
      // Caching configuration
      cache: {
        enabled: config.cacheEnabled !== false,
        ttl: config.cacheTTL || 3600000, // 1 hour
        maxSize: config.cacheMaxSize || 100
      }
    };
    
    this.models = new Map();
    this.modelCache = new Map();
    this.metrics = {
      totalRequests: 0,
      totalTokens: 0,
      totalCost: 0,
      modelUsage: new Map(),
      averageLatency: 0
    };
    
    this.initialize();
  }
  
  /**
   * Initialize OpenRouter connection and fetch available models
   */
  async initialize() {
    try {
      if (!this.config.apiKey) {
        logger.warn('🟡 OpenRouter API key not configured');
        return false;
      }
      
      // Fetch available models and their capabilities
      await this.fetchAvailableModels();
      
      logger.info('🏁 OpenRouter MCP integration initialized');
      logger.info(`🟢 ${this.models.size} models available`);
      
      this.emit('initialized', {
        modelCount: this.models.size,
        capabilities: this.getCapabilities()
      });
      
      return true;
    } catch (error) {
      logger.error('🔴 Failed to initialize OpenRouter:', error);
      return false;
    }
  }
  
  /**
   * Fetch available models from OpenRouter
   */
  async fetchAvailableModels() {
    try {
      const response = await fetch(`${this.config.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Process and categorize models
      data.data.forEach(model => {
        this.models.set(model.id, {
          id: model.id,
          name: model.name || model.id,
          provider: this.extractProvider(model.id),
          contextLength: model.context_length || 4096,
          pricing: {
            prompt: model.pricing?.prompt || 0,
            completion: model.pricing?.completion || 0
          },
          capabilities: {
            vision: model.architecture?.modality?.includes('image'),
            functionCalling: model.supported_features?.includes('function_calling'),
            jsonMode: model.supported_features?.includes('json_mode'),
            streaming: model.supported_features?.includes('streaming')
          },
          speed: this.categorizeSpeed(model),
          quality: this.categorizeQuality(model)
        });
      });
      
      return this.models;
    } catch (error) {
      logger.error('Failed to fetch OpenRouter models:', error);
      // Use fallback model list if API fails
      this.loadFallbackModels();
    }
  }
  
  /**
   * Execute a request through OpenRouter with intelligent model selection
   */
  async execute(prompt, options = {}) {
    const startTime = Date.now();
    this.metrics.totalRequests++;
    
    try {
      // Select optimal model based on requirements
      const model = await this.selectOptimalModel(options);
      
      logger.info(`🟢 OpenRouter executing with ${model.id}`);
      
      // Check cache if enabled
      if (this.config.cache.enabled) {
        const cached = this.getCachedResponse(prompt, model.id);
        if (cached) {
          logger.info('🟢 Using cached OpenRouter response');
          return cached;
        }
      }
      
      // Prepare request
      const requestBody = {
        model: model.id,
        messages: this.formatMessages(prompt, options),
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 4000,
        top_p: options.topP || 1,
        frequency_penalty: options.frequencyPenalty || 0,
        presence_penalty: options.presencePenalty || 0,
        stream: options.stream || false,
        
        // OpenRouter specific options
        transforms: options.transforms || [],
        route: options.route || 'auto', // auto, fallback, specific model
        
        // Model routing preferences
        models: options.models || undefined, // Specific models to consider
        provider: options.provider || undefined // Preferred provider
      };
      
      // Add function calling if supported and requested
      if (options.functions && model.capabilities.functionCalling) {
        requestBody.functions = options.functions;
        requestBody.function_call = options.functionCall || 'auto';
      }
      
      // Execute request
      const response = await this.makeRequest(requestBody);
      
      // Update metrics
      const latency = Date.now() - startTime;
      this.updateMetrics(model, response, latency);
      
      // Cache response if enabled
      if (this.config.cache.enabled) {
        this.cacheResponse(prompt, model.id, response);
      }
      
      return {
        success: true,
        model: model.id,
        provider: model.provider,
        content: response.choices[0].message.content,
        usage: response.usage,
        cost: this.calculateCost(model, response.usage),
        latency,
        metadata: {
          modelDetails: model,
          cached: false
        }
      };
      
    } catch (error) {
      logger.error('🔴 OpenRouter execution failed:', error);
      
      // Attempt fallback if configured
      if (options.fallback) {
        return this.executeFallback(prompt, options);
      }
      
      throw error;
    }
  }
  
  /**
   * Select optimal model based on requirements
   */
  async selectOptimalModel(options = {}) {
    const requirements = {
      maxCost: options.maxCost || this.config.preferences.maxCost,
      minSpeed: options.minSpeed || this.config.preferences.minSpeed,
      quality: options.quality || this.config.preferences.quality,
      capabilities: options.capabilities || this.config.preferences.capabilities,
      contextNeeded: options.contextLength || 4096,
      specialization: options.specialization || null // 'reasoning', 'coding', 'general'
    };
    
    // Filter models based on requirements
    const eligibleModels = Array.from(this.models.values()).filter(model => {
      // Check cost constraint
      if (model.pricing.prompt > requirements.maxCost) {return false;}
      
      // Check context length
      if (model.contextLength < requirements.contextNeeded) {return false;}
      
      // Check required capabilities
      for (const cap of requirements.capabilities) {
        if (!model.capabilities[cap]) {return false;}
      }
      
      // Check speed requirement
      if (requirements.minSpeed === 'fast' && model.speed === 'slow') {return false;}
      
      // Prioritize specialized models if specialization requested
      if (requirements.specialization) {
        // Boost specialized models for specific tasks
        if (requirements.specialization === 'reasoning' && 
            (model.id.includes('deepseek-r1') || model.id.includes('qwq'))) {
          return true;
        }
        if (requirements.specialization === 'coding' && 
            (model.id.includes('qwen') && model.id.includes('coder'))) {
          return true;
        }
      }
      
      return true;
    });
    
    if (eligibleModels.length === 0) {
      throw new Error('No models match the specified requirements');
    }
    
    // Sort by quality/cost ratio
    eligibleModels.sort((a, b) => {
      const scoreA = this.calculateModelScore(a, requirements);
      const scoreB = this.calculateModelScore(b, requirements);
      return scoreB - scoreA;
    });
    
    const selected = eligibleModels[0];
    
    logger.info(`🟢 Selected model: ${selected.id} (${selected.provider})`);
    logger.info(`  Cost: $${selected.pricing.prompt}/1k tokens`);
    logger.info(`  Quality: ${selected.quality}, Speed: ${selected.speed}`);
    
    return selected;
  }
  
  /**
   * Calculate model score for selection
   */
  calculateModelScore(model, requirements) {
    let score = 0;
    
    // Quality score (0-40 points)
    const qualityScores = { economy: 10, balanced: 25, premium: 40 };
    score += qualityScores[model.quality] || 20;
    
    // Cost efficiency (0-30 points)
    const costScore = Math.max(0, 30 - (model.pricing.prompt * 1000));
    score += costScore;
    
    // Speed score (0-20 points)
    const speedScores = { slow: 5, medium: 12, fast: 20 };
    score += speedScores[model.speed] || 10;
    
    // Capability bonus (0-10 points)
    score += model.capabilities.functionCalling ? 3 : 0;
    score += model.capabilities.vision ? 3 : 0;
    score += model.capabilities.jsonMode ? 2 : 0;
    score += model.capabilities.streaming ? 2 : 0;
    
    return score;
  }
  
  /**
   * Make HTTP request to OpenRouter API
   */
  async makeRequest(body) {
    const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://github.com/bumba-ai/bumba-framework',
        'X-Title': 'BUMBA Framework'
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(this.config.timeout)
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
    }
    
    return response.json();
  }
  
  /**
   * Format messages for OpenRouter API
   */
  formatMessages(prompt, options) {
    if (typeof prompt === 'string') {
      const messages = [];
      
      if (options.systemPrompt) {
        messages.push({ role: 'system', content: options.systemPrompt });
      }
      
      messages.push({ role: 'user', content: prompt });
      return messages;
    }
    
    // Already formatted as messages array
    return prompt;
  }
  
  /**
   * Extract provider from model ID
   */
  extractProvider(modelId) {
    const providers = [
      'openai', 'anthropic', 'google', 'meta', 'mistral', 
      'perplexity', 'cohere', 'databricks', 'together'
    ];
    
    for (const provider of providers) {
      if (modelId.toLowerCase().includes(provider)) {
        return provider;
      }
    }
    
    return 'unknown';
  }
  
  /**
   * Categorize model speed
   */
  categorizeSpeed(model) {
    // Based on model size and known performance characteristics
    if (model.id.includes('gpt-4') || model.id.includes('claude-3-opus')) {
      return 'slow';
    } else if (model.id.includes('gpt-3.5') || model.id.includes('claude-instant')) {
      return 'fast';
    }
    return 'medium';
  }
  
  /**
   * Categorize model quality
   */
  categorizeQuality(model) {
    // Based on model capabilities and cost
    if (model.pricing?.prompt > 0.01) {
      return 'premium';
    } else if (model.pricing?.prompt > 0.001) {
      return 'balanced';
    }
    return 'economy';
  }
  
  /**
   * Calculate cost for a request
   */
  calculateCost(model, usage) {
    const promptCost = (usage.prompt_tokens / 1000) * model.pricing.prompt;
    const completionCost = (usage.completion_tokens / 1000) * model.pricing.completion;
    return promptCost + completionCost;
  }
  
  /**
   * Update metrics after request
   */
  updateMetrics(model, response, latency) {
    this.metrics.totalTokens += response.usage.total_tokens;
    this.metrics.totalCost += this.calculateCost(model, response.usage);
    
    // Update model usage stats
    const modelStats = this.metrics.modelUsage.get(model.id) || {
      count: 0,
      tokens: 0,
      cost: 0
    };
    
    modelStats.count++;
    modelStats.tokens += response.usage.total_tokens;
    modelStats.cost += this.calculateCost(model, response.usage);
    
    this.metrics.modelUsage.set(model.id, modelStats);
    
    // Update average latency
    this.metrics.averageLatency = 
      (this.metrics.averageLatency * (this.metrics.totalRequests - 1) + latency) / 
      this.metrics.totalRequests;
  }
  
  /**
   * Get cached response if available
   */
  getCachedResponse(prompt, modelId) {
    const cacheKey = this.generateCacheKey(prompt, modelId);
    const cached = this.modelCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.config.cache.ttl) {
      return { ...cached.response, metadata: { ...cached.response.metadata, cached: true } };
    }
    
    return null;
  }
  
  /**
   * Cache a response
   */
  cacheResponse(prompt, modelId, response) {
    if (this.modelCache.size >= this.config.cache.maxSize) {
      // Remove oldest entry
      const firstKey = this.modelCache.keys().next().value;
      this.modelCache.delete(firstKey);
    }
    
    const cacheKey = this.generateCacheKey(prompt, modelId);
    this.modelCache.set(cacheKey, {
      response,
      timestamp: Date.now()
    });
  }
  
  /**
   * Generate cache key
   */
  generateCacheKey(prompt, modelId) {
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256');
    hash.update(`${modelId}:${JSON.stringify(prompt)}`);
    return hash.digest('hex');
  }
  
  /**
   * Load fallback model definitions
   */
  loadFallbackModels() {
    // Fallback model list if API is unavailable
    const fallbackModels = [
      { id: 'openai/gpt-4-turbo', provider: 'openai', quality: 'premium' },
      { id: 'anthropic/claude-3-opus', provider: 'anthropic', quality: 'premium' },
      { id: 'google/gemini-pro', provider: 'google', quality: 'balanced' },
      { id: 'meta-llama/llama-3-70b', provider: 'meta', quality: 'balanced' },
      { id: 'mistral/mistral-large', provider: 'mistral', quality: 'balanced' },
      { id: 'deepseek/deepseek-r1', provider: 'deepseek', quality: 'premium', specialization: 'reasoning' },
      { id: 'deepseek/deepseek-r1-distill-qwen-32b', provider: 'deepseek', quality: 'balanced', specialization: 'reasoning' },
      { id: 'qwen/qwen-2.5-coder-32b-instruct', provider: 'qwen', quality: 'premium', specialization: 'coding' },
      { id: 'qwen/qwq-32b-preview', provider: 'qwen', quality: 'balanced', specialization: 'reasoning' }
    ];
    
    fallbackModels.forEach(model => {
      this.models.set(model.id, {
        ...model,
        contextLength: 8192,
        pricing: { prompt: 0.001, completion: 0.002 },
        capabilities: {
          vision: false,
          functionCalling: true,
          jsonMode: true,
          streaming: true
        },
        speed: 'medium'
      });
    });
  }
  
  /**
   * Get available capabilities across all models
   */
  getCapabilities() {
    const capabilities = new Set();
    
    this.models.forEach(model => {
      Object.entries(model.capabilities).forEach(([cap, supported]) => {
        if (supported) {capabilities.add(cap);}
      });
    });
    
    return Array.from(capabilities);
  }
  
  /**
   * Get metrics summary
   */
  getMetrics() {
    return {
      ...this.metrics,
      topModels: Array.from(this.metrics.modelUsage.entries())
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 5)
        .map(([model, stats]) => ({ model, ...stats })),
      averageCostPerRequest: this.metrics.totalRequests > 0 
        ? this.metrics.totalCost / this.metrics.totalRequests 
        : 0
    };
  }
  
  /**
   * List available models with filtering
   */
  listModels(filter = {}) {
    let models = Array.from(this.models.values());
    
    if (filter.provider) {
      models = models.filter(m => m.provider === filter.provider);
    }
    
    if (filter.quality) {
      models = models.filter(m => m.quality === filter.quality);
    }
    
    if (filter.maxCost) {
      models = models.filter(m => m.pricing.prompt <= filter.maxCost);
    }
    
    if (filter.capabilities) {
      models = models.filter(m => {
        return filter.capabilities.every(cap => m.capabilities[cap]);
      });
    }
    
    return models;
  }
  
  /**
   * Test connection to OpenRouter
   */
  async testConnection() {
    try {
      const models = await this.fetchAvailableModels();
      return {
        connected: true,
        modelCount: models.size,
        status: 'healthy'
      };
    } catch (error) {
      return {
        connected: false,
        error: error.message,
        status: 'unhealthy'
      };
    }
  }
}

// Singleton instance
let instance = null;

module.exports = {
  OpenRouterIntegration,
  getInstance: (config) => {
    if (!instance) {
      instance = new OpenRouterIntegration(config);
    }
    return instance;
  }
};
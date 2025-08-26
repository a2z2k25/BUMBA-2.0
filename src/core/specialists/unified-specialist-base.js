/**
 * BUMBA Unified Specialist Base
 * Single source of truth for all specialist implementations
 * API-agnostic design ready for future integration
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');
const { UnifiedErrorManager } = require('../error-handling/unified-error-manager');

class UnifiedSpecialistBase extends EventEmitter {
  constructor(config = {}) {
    super();
    
    // Core identity
    this.id = config.id || `specialist_${Date.now()}`;
    this.name = config.name || 'Specialist';
    this.type = config.type || 'general';
    this.category = config.category || 'technical';
    this.department = config.department || null;
    
    // Capabilities definition (API-agnostic)
    this.expertise = config.expertise || {};
    this.capabilities = config.capabilities || [];
    this.keywords = config.keywords || [];
    this.tools = config.tools || [];
    this.frameworks = config.frameworks || [];
    
    // Knowledge templates (work without API)
    this.templates = {
      analysis: config.analysisTemplate || this.getDefaultAnalysisTemplate(),
      implementation: config.implementationTemplate || this.getDefaultImplementationTemplate(),
      review: config.reviewTemplate || this.getDefaultReviewTemplate()
    };
    
    // API placeholder configuration
    this.apiConfig = {
      provider: config.apiProvider || 'pending', // anthropic, openai, etc.
      model: config.apiModel || 'pending',
      apiKey: config.apiKey || process.env[`${this.type.toUpperCase()}_API_KEY`] || null,
      endpoint: config.apiEndpoint || null,
      ready: false // Will be set to true when API is configured
    };
    
    // Execution configuration
    this.config = {
      temperature: config.temperature || 0.7,
      maxTokens: config.maxTokens || 4000,
      timeout: config.timeout || 30000,
      retryAttempts: config.retryAttempts || 3,
      cacheEnabled: config.cacheEnabled !== false,
      offlineMode: config.offlineMode || !this.apiConfig.apiKey,
      ...config
    };
    
    // State and metrics
    this.status = 'initializing';
    this.cache = new Map();
    this.metrics = {
      tasksProcessed: 0,
      successRate: 0,
      averageResponseTime: 0,
      cacheHits: 0,
      apiCalls: 0,
      offlineExecutions: 0
    };
    
    // CONTEXT PRESERVATION METRICS (Phase 1 Addition)
    // Non-invasive metrics tracking - doesn't change behavior
    this.contextMetrics = {
      enabled: config.contextMetricsEnabled !== false, // Opt-out, not opt-in
      tokensProcessed: 0,
      tokensReturned: 0,
      reductionRatio: 0,
      lastReduction: 0,
      averageReduction: 0,
      executionHistory: [], // Keep last 100 executions
      maxHistorySize: 100
    };
    
    // Error handler
    this.errorManager = new UnifiedErrorManager();
    
    // Initialize
    this.initialize();
  }
  
  /**
   * Initialize specialist
   */
  async initialize() {
    try {
      // Check API availability
      this.apiConfig.ready = await this.checkAPIAvailability();
      
      // Set operational mode
      this.config.offlineMode = !this.apiConfig.ready;
      
      if (this.config.offlineMode) {
        logger.info(`🔌 ${this.name} initialized in OFFLINE mode (API will be configured by user)`);
      } else {
        logger.info(`🏁 ${this.name} initialized with API support`);
      }
      
      this.status = 'ready';
      this.emit('initialized', { specialist: this.id, mode: this.config.offlineMode ? 'offline' : 'online' });
      
    } catch (error) {
      await this.errorManager.handleError(error, { component: this.name });
      this.status = 'error';
    }
  }
  
  /**
   * Check if API is available (without making actual calls)
   */
  async checkAPIAvailability() {
    // Simply check if API key exists
    // Future adopters will add their actual API validation here
    return !!this.apiConfig.apiKey && this.apiConfig.apiKey !== 'pending';
  }
  
  /**
   * Process task - works in both online and offline modes
   */
  async processTask(task, context = {}) {
    const startTime = Date.now();
    
    try {
      this.metrics.tasksProcessed++;
      
      // Check cache first
      if (this.config.cacheEnabled) {
        const cached = this.getCached(task);
        if (cached) {
          this.metrics.cacheHits++;
          return cached;
        }
      }
      
      let result;
      
      if (this.config.offlineMode) {
        // Offline processing using templates and patterns
        result = await this.processOffline(task, context);
        this.metrics.offlineExecutions++;
      } else {
        // Online processing with API
        result = await this.processWithAPI(task, context);
        this.metrics.apiCalls++;
      }
      
      // Cache result
      if (this.config.cacheEnabled && result.success) {
        this.setCached(task, result);
      }
      
      // Update metrics
      const responseTime = Date.now() - startTime;
      this.updateMetrics(result.success, responseTime);
      
      // CONTEXT PRESERVATION: Track token usage (non-invasive)
      if (this.contextMetrics.enabled) {
        this.trackContextMetrics(task, result);
      }
      
      return result;
      
    } catch (error) {
      const handled = await this.errorManager.handleError(error, {
        component: this.name,
        task,
        context
      });
      
      if (handled.recovered) {
        return handled.recovery.result;
      }
      
      return {
        success: false,
        error: handled.error.enhancedMessage,
        suggestions: handled.error.suggestions
      };
    }
  }
  
  /**
   * Process task offline using templates and patterns
   */
  async processOffline(task, context) {
    // Determine task type
    const taskType = this.classifyTask(task);
    const template = this.templates[taskType] || this.templates.analysis;
    
    // Apply template
    const result = await this.applyTemplate(template, task, context);
    
    return {
      success: true,
      type: taskType,
      result,
      mode: 'offline',
      message: 'Processed using local templates (API integration pending)'
    };
  }
  
  /**
   * Process task with API (placeholder for future implementation)
   */
  async processWithAPI(task, context) {
    // This is where future adopters will add their API calls
    // For now, return a placeholder that indicates API readiness
    
    return {
      success: true,
      type: 'api_ready',
      result: {
        message: 'API endpoint ready for integration',
        config: this.apiConfig,
        task
      },
      mode: 'online'
    };
  }
  
  /**
   * Apply template to task
   */
  async applyTemplate(template, task, context) {
    // Template-based processing that works without API
    const processed = {
      task: task.description || task,
      analysis: template.analyze ? template.analyze(task, context) : null,
      recommendations: template.recommend ? template.recommend(task, context) : [],
      implementation: template.implement ? template.implement(task, context) : null,
      context
    };
    
    return processed;
  }
  
  /**
   * Classify task type
   */
  classifyTask(task) {
    const taskStr = JSON.stringify(task).toLowerCase();
    
    if (taskStr.includes('implement') || taskStr.includes('create') || taskStr.includes('build')) {
      return 'implementation';
    }
    
    if (taskStr.includes('review') || taskStr.includes('check') || taskStr.includes('validate')) {
      return 'review';
    }
    
    return 'analysis';
  }
  
  /**
   * Cache management
   */
  getCached(task) {
    const key = this.getCacheKey(task);
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < 300000) { // 5 min cache
      return cached.data;
    }
    
    return null;
  }
  
  setCached(task, result) {
    const key = this.getCacheKey(task);
    this.cache.set(key, {
      data: result,
      timestamp: Date.now()
    });
    
    // Limit cache size
    if (this.cache.size > 100) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }
  
  getCacheKey(task) {
    return JSON.stringify(task).substring(0, 100);
  }
  
  /**
   * Update metrics
   */
  updateMetrics(success, responseTime) {
    const total = this.metrics.tasksProcessed;
    const successCount = Math.round(this.metrics.successRate * (total - 1)) + (success ? 1 : 0);
    
    this.metrics.successRate = successCount / total;
    this.metrics.averageResponseTime = 
      (this.metrics.averageResponseTime * (total - 1) + responseTime) / total;
  }
  
  /**
   * Get default templates
   */
  getDefaultAnalysisTemplate() {
    return {
      analyze: (task, context) => ({
        summary: `Analysis of: ${task.description || task}`,
        components: this.identifyComponents(task),
        complexity: this.assessComplexity(task),
        risks: this.identifyRisks(task)
      }),
      recommend: (task, context) => [
        'Consider breaking down into smaller tasks',
        'Review existing implementations',
        'Validate requirements with stakeholders'
      ]
    };
  }
  
  getDefaultImplementationTemplate() {
    return {
      analyze: (task, context) => ({
        requirements: this.extractRequirements(task),
        dependencies: this.identifyDependencies(task),
        approach: this.determineApproach(task)
      }),
      implement: (task, context) => ({
        steps: this.generateImplementationSteps(task),
        code: this.generateCodeTemplate(task),
        tests: this.generateTestTemplate(task)
      })
    };
  }
  
  getDefaultReviewTemplate() {
    return {
      analyze: (task, context) => ({
        scope: this.determineReviewScope(task),
        criteria: this.getReviewCriteria(task),
        priority: this.assessPriority(task)
      }),
      recommend: (task, context) => this.generateReviewRecommendations(task)
    };
  }
  
  // Helper methods for templates
  identifyComponents(task) {
    return ['core', 'ui', 'api', 'database'].filter(c => 
      JSON.stringify(task).toLowerCase().includes(c)
    );
  }
  
  assessComplexity(task) {
    const factors = JSON.stringify(task).length;
    return factors > 500 ? 'high' : factors > 200 ? 'medium' : 'low';
  }
  
  /**
   * CONTEXT PRESERVATION: Wrap execution with metrics tracking
   * Phase 1 Addition - Non-invasive wrapper
   */
  wrapWithMetrics(originalMethod) {
    const self = this;
    return async function(...args) {
      const input = args[0]; // Usually the task
      const inputTokens = self.estimateTokens(input);
      
      // Call original method
      const result = await originalMethod.apply(self, args);
      
      // Track output
      const outputTokens = self.estimateTokens(result);
      
      // Update context metrics
      if (self.contextMetrics.enabled) {
        self.trackContextMetrics(input, result);
      }
      
      return result;
    };
  }
  
  /**
   * CONTEXT PRESERVATION: Track context metrics
   * Phase 1 Addition - Updates metrics without changing behavior
   */
  trackContextMetrics(input, output) {
    const inputTokens = this.estimateTokens(input);
    const outputTokens = this.estimateTokens(output);
    
    // Update totals
    this.contextMetrics.tokensProcessed += inputTokens;
    this.contextMetrics.tokensReturned += outputTokens;
    
    // Calculate reduction
    const reduction = inputTokens > 0 ? 1 - (outputTokens / inputTokens) : 0;
    this.contextMetrics.lastReduction = reduction;
    
    // Add to history
    const entry = {
      timestamp: new Date().toISOString(),
      inputTokens,
      outputTokens,
      reduction
    };
    
    this.contextMetrics.executionHistory.push(entry);
    
    // Maintain history size
    if (this.contextMetrics.executionHistory.length > this.contextMetrics.maxHistorySize) {
      this.contextMetrics.executionHistory.shift();
    }
    
    // Update averages
    if (this.contextMetrics.executionHistory.length > 0) {
      const totalReduction = this.contextMetrics.executionHistory.reduce(
        (sum, e) => sum + e.reduction, 0
      );
      this.contextMetrics.averageReduction = totalReduction / this.contextMetrics.executionHistory.length;
    }
    
    this.contextMetrics.reductionRatio = reduction;
    
    // Log significant reductions
    if (reduction > 0.8) {
      logger.debug(`📉 ${this.name} achieved ${Math.round(reduction * 100)}% context reduction`);
    }
  }
  
  /**
   * CONTEXT PRESERVATION: Estimate token count for any data
   * Phase 1 Addition - Non-invasive token estimation
   * @param {*} data - Data to estimate tokens for
   * @returns {number} Estimated token count
   */
  estimateTokens(data) {
    if (!data) return 0;
    
    let text;
    if (typeof data === 'string') {
      text = data;
    } else if (Array.isArray(data)) {
      // Handle arrays by stringifying
      try {
        text = JSON.stringify(data, null, 2);
      } catch (e) {
        text = `[Array with ${data.length} items]`;
      }
    } else if (typeof data === 'object') {
      // Handle objects
      try {
        text = JSON.stringify(data, null, 2);
      } catch (e) {
        // Handle circular references
        text = '[Complex Object]';
      }
    } else {
      // Handle primitives
      text = String(data);
    }
    
    // Standard approximation: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }
  
  identifyRisks(task) {
    const risks = [];
    const taskStr = JSON.stringify(task).toLowerCase();
    
    if (taskStr.includes('security')) risks.push('Security considerations required');
    if (taskStr.includes('performance')) risks.push('Performance optimization needed');
    if (taskStr.includes('scale')) risks.push('Scalability concerns');
    
    return risks;
  }
  
  extractRequirements(task) {
    return {
      functional: [],
      nonFunctional: [],
      constraints: []
    };
  }
  
  identifyDependencies(task) {
    return [];
  }
  
  determineApproach(task) {
    return 'iterative';
  }
  
  generateImplementationSteps(task) {
    return [
      'Analyze requirements',
      'Design solution',
      'Implement core functionality',
      'Add error handling',
      'Write tests',
      'Document'
    ];
  }
  
  generateCodeTemplate(task) {
    return `// Implementation for: ${task.description || task}
// TODO: Add implementation
class Implementation {
  constructor() {
    // Initialize
  }
  
  async execute() {
    // Main logic
  }
}

module.exports = Implementation;`;
  }
  
  generateTestTemplate(task) {
    return `// Tests for: ${task.description || task}
describe('Implementation', () => {
  test('should work', () => {
    expect(true).toBe(true);
  });
});`;
  }
  
  determineReviewScope(task) {
    return 'comprehensive';
  }
  
  getReviewCriteria(task) {
    return ['correctness', 'performance', 'security', 'maintainability'];
  }
  
  assessPriority(task) {
    return 'medium';
  }
  
  generateReviewRecommendations(task) {
    return ['Review implementation', 'Check edge cases', 'Validate performance'];
  }
  
  /**
   * Configure API (for future adopters)
   */
  configureAPI(config) {
    this.apiConfig = {
      ...this.apiConfig,
      ...config
    };
    
    this.apiConfig.ready = !!this.apiConfig.apiKey && this.apiConfig.apiKey !== 'pending';
    this.config.offlineMode = !this.apiConfig.ready;
    
    logger.info(`API configured for ${this.name}: ${this.apiConfig.ready ? 'ready' : 'pending'}`);
    
    return this.apiConfig.ready;
  }
  
  /**
   * Get specialist info
   */
  getInfo() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      category: this.category,
      department: this.department,
      status: this.status,
      mode: this.config.offlineMode ? 'offline' : 'online',
      apiReady: this.apiConfig.ready,
      metrics: this.metrics,
      capabilities: this.capabilities,
      expertise: this.expertise
    };
  }
}

module.exports = UnifiedSpecialistBase;

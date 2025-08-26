/**
 * BUMBA Domain-Based Model Router
 * Routes tasks to optimal free tier models based on domain expertise
 * Implements the model assignment strategy for sub-agents
 */

const { getInstance: getFreeTierManager } = require('./free-tier-manager');
const { logger } = require('../logging/bumba-logger');

class DomainModelRouter {
  constructor(config = {}) {
    this.config = config;
    this.freeTierManager = getFreeTierManager(config);
    
    // Domain to task type mapping for optimal model selection
    this.domainMapping = {
      // Reasoning/Analysis domains → DeepSeek R1
      'reasoning': { taskType: 'reasoning', preferredModel: 'deepseek', skills: ['logic', 'analysis', 'debugging'] },
      'analysis': { taskType: 'reasoning', preferredModel: 'deepseek', skills: ['data', 'patterns', 'insights'] },
      'security': { taskType: 'reasoning', preferredModel: 'deepseek', skills: ['vulnerabilities', 'threats', 'audit'] },
      'architecture': { taskType: 'reasoning', preferredModel: 'deepseek', skills: ['design', 'patterns', 'systems'] },
      'debugging': { taskType: 'reasoning', preferredModel: 'deepseek', skills: ['troubleshooting', 'root-cause'] },
      'optimization': { taskType: 'reasoning', preferredModel: 'deepseek', skills: ['performance', 'efficiency'] },
      
      // Coding/Implementation domains → Qwen Coder 32B
      'coding': { taskType: 'coding', preferredModel: 'qwen', skills: ['implementation', 'algorithms'] },
      'frontend': { taskType: 'coding', preferredModel: 'qwen', skills: ['react', 'vue', 'ui-components'] },
      'backend': { taskType: 'coding', preferredModel: 'qwen', skills: ['api', 'database', 'services'] },
      'infrastructure': { taskType: 'coding', preferredModel: 'qwen', skills: ['devops', 'deployment', 'ci-cd'] },
      'testing': { taskType: 'coding', preferredModel: 'qwen', skills: ['unit-tests', 'integration', 'e2e'] },
      'automation': { taskType: 'coding', preferredModel: 'qwen', skills: ['scripts', 'workflows', 'tools'] },
      
      // General tasks → Gemini Pro
      'general': { taskType: 'general', preferredModel: 'gemini', skills: ['documentation', 'planning'] },
      'ui': { taskType: 'general', preferredModel: 'gemini', skills: ['design', 'layout', 'styling'] },
      'ux': { taskType: 'general', preferredModel: 'gemini', skills: ['user-experience', 'workflows'] },
      'research': { taskType: 'general', preferredModel: 'gemini', skills: ['investigation', 'discovery'] },
      'design': { taskType: 'general', preferredModel: 'gemini', skills: ['mockups', 'prototypes'] },
      'documentation': { taskType: 'general', preferredModel: 'gemini', skills: ['writing', 'guides', 'specs'] },
      'communication': { taskType: 'general', preferredModel: 'gemini', skills: ['messaging', 'reports'] },
      
      // Review/Validation - Special handling (should go to manager)
      'review': { taskType: 'review', requiresManager: true },
      'validation': { taskType: 'validation', requiresManager: true },
      'approval': { taskType: 'approval', requiresManager: true },
      'quality': { taskType: 'quality', requiresManager: true }
    };
    
    // Model capabilities for fallback selection
    this.modelCapabilities = {
      'deepseek': {
        strengths: ['reasoning', 'analysis', 'complex-logic', 'debugging'],
        weaknesses: ['ui-design', 'creative-writing'],
        models: ['deepseek/deepseek-r1', 'deepseek/deepseek-r1-distill-qwen-32b']
      },
      'qwen': {
        strengths: ['coding', 'implementation', 'refactoring', 'testing'],
        weaknesses: ['abstract-reasoning', 'business-strategy'],
        models: ['qwen/qwen-2.5-coder-32b-instruct', 'qwen/qwq-32b-preview']
      },
      'gemini': {
        strengths: ['general', 'communication', 'documentation', 'ui-ux'],
        weaknesses: ['complex-coding', 'deep-analysis'],
        models: ['gemini-pro']
      }
    };
    
    // Track model usage for load balancing
    this.modelUsage = {
      deepseek: { count: 0, lastUsed: null },
      qwen: { count: 0, lastUsed: null },
      gemini: { count: 0, lastUsed: null }
    };
  }
  
  /**
   * Route task to optimal model based on domain
   */
  async routeTask(task) {
    const { domain, description, type, priority } = task;
    
    // Step 1: Check if task requires manager (review/validation)
    if (this.requiresManager(domain, type)) {
      return {
        requiresManager: true,
        reason: 'Review/validation tasks must be handled by manager with Claude Max',
        domain,
        type
      };
    }
    
    // Step 2: Identify task type from domain
    const domainConfig = this.domainMapping[domain] || this.domainMapping.general;
    const taskType = domainConfig.taskType;
    const preferredModel = domainConfig.preferredModel;
    
    // Step 3: Analyze task description for better routing
    const analyzedType = this.analyzeTaskDescription(description);
    const finalTaskType = analyzedType || taskType;
    
    // Step 4: Get best available model
    try {
      const modelSelection = await this.selectOptimalModel(
        finalTaskType,
        preferredModel,
        priority
      );
      
      // Step 5: Update usage tracking
      this.updateModelUsage(modelSelection.tierKey);
      
      logger.info(`🟢 Routed ${domain} task to ${modelSelection.model} (${modelSelection.tierKey})`);
      
      return {
        ...modelSelection,
        domain,
        taskType: finalTaskType,
        routingReason: `Domain: ${domain}, Type: ${finalTaskType}, Model: ${modelSelection.model}`
      };
      
    } catch (error) {
      logger.error(`Failed to route task: ${error.message}`);
      
      // Fallback to any available model
      return await this.getFallbackModel();
    }
  }
  
  /**
   * Route multiple tasks with load balancing
   */
  async routeMultipleTasks(tasks) {
    const routedTasks = [];
    const modelDistribution = { deepseek: [], qwen: [], gemini: [] };
    
    // First pass: categorize tasks by preferred model
    for (const task of tasks) {
      const domain = task.domain || this.extractDomain(task);
      const domainConfig = this.domainMapping[domain] || this.domainMapping.general;
      
      if (this.requiresManager(domain, task.type)) {
        routedTasks.push({
          ...task,
          requiresManager: true,
          reason: 'Review/validation requires manager'
        });
      } else {
        const preferredModel = domainConfig.preferredModel;
        modelDistribution[preferredModel].push(task);
      }
    }
    
    // Second pass: assign models with load balancing
    for (const [modelKey, modelTasks] of Object.entries(modelDistribution)) {
      for (const task of modelTasks) {
        const routing = await this.routeTask(task);
        routedTasks.push({
          ...task,
          ...routing
        });
      }
    }
    
    // Log distribution
    this.logModelDistribution(routedTasks);
    
    return routedTasks;
  }
  
  /**
   * Select optimal model with fallback logic
   */
  async selectOptimalModel(taskType, preferredModel, priority = 'normal') {
    // Try preferred model first
    try {
      const model = await this.freeTierManager.getBestAvailableModel({
        taskType,
        tokens: this.estimateTokens(taskType),
        allowPaid: false
      });
      
      // Check if we got the preferred model
      if (model.tierKey === preferredModel) {
        return model;
      }
      
      // If high priority, try harder to get preferred model
      if (priority === 'high' && this.canSwapModels(model.tierKey, preferredModel)) {
        return await this.attemptModelSwap(preferredModel, taskType);
      }
      
      // Accept what we got
      return model;
      
    } catch (error) {
      // All free tiers exhausted
      logger.warn(`🟡 Free tiers exhausted for ${taskType}, using fallback`);
      return await this.getFallbackModel();
    }
  }
  
  /**
   * Check if task requires manager
   */
  requiresManager(domain, type) {
    const domainConfig = this.domainMapping[domain];
    
    if (domainConfig?.requiresManager) {
      return true;
    }
    
    // Check task type
    const managerRequiredTypes = ['review', 'validation', 'approval', 'quality', 'cross-domain'];
    return managerRequiredTypes.includes(type);
  }
  
  /**
   * Analyze task description to determine type
   */
  analyzeTaskDescription(description) {
    if (!description) {return null;}
    
    const desc = description.toLowerCase();
    
    // Check for coding indicators
    if (desc.match(/\b(implement|code|function|class|api|endpoint|component)\b/)) {
      return 'coding';
    }
    
    // Check for reasoning indicators
    if (desc.match(/\b(analyze|debug|investigate|reason|explain|diagnose)\b/)) {
      return 'reasoning';
    }
    
    // Check for review indicators
    if (desc.match(/\b(review|validate|approve|check|verify|audit)\b/)) {
      return 'review';
    }
    
    return null;
  }
  
  /**
   * Extract domain from task
   */
  extractDomain(task) {
    // Try explicit domain
    if (task.domain) {return task.domain;}
    
    // Try to infer from type
    if (task.type) {
      for (const [domain, config] of Object.entries(this.domainMapping)) {
        if (config.taskType === task.type) {
          return domain;
        }
      }
    }
    
    // Analyze description
    const description = (task.description || task.prompt || '').toLowerCase();
    for (const domain of Object.keys(this.domainMapping)) {
      if (description.includes(domain)) {
        return domain;
      }
    }
    
    return 'general';
  }
  
  /**
   * Get fallback model when preferred not available
   */
  async getFallbackModel() {
    // Try any available free model
    try {
      return await this.freeTierManager.getBestAvailableModel({
        taskType: 'general',
        allowPaid: false
      });
    } catch (error) {
      // Return error state
      return {
        error: true,
        message: 'No models available',
        requiresWait: true
      };
    }
  }
  
  /**
   * Check if models can be swapped for priority tasks
   */
  canSwapModels(currentModel, preferredModel) {
    // Don't swap if we already have a good match
    if (currentModel === preferredModel) {return false;}
    
    // Check if preferred model has capacity
    const usage = this.modelUsage[preferredModel];
    const timeSinceLastUse = usage.lastUsed ? Date.now() - usage.lastUsed : Infinity;
    
    // Allow swap if model hasn't been used recently
    return timeSinceLastUse > 1000; // 1 second cooldown
  }
  
  /**
   * Attempt to swap to preferred model
   */
  async attemptModelSwap(preferredModel, taskType) {
    // Wait briefly for model availability
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return await this.freeTierManager.getBestAvailableModel({
      taskType,
      preferredProvider: preferredModel,
      allowPaid: false
    });
  }
  
  /**
   * Update model usage tracking
   */
  updateModelUsage(modelKey) {
    if (this.modelUsage[modelKey]) {
      this.modelUsage[modelKey].count++;
      this.modelUsage[modelKey].lastUsed = Date.now();
    }
  }
  
  /**
   * Estimate tokens based on task type
   */
  estimateTokens(taskType) {
    const tokenEstimates = {
      'coding': 2000,
      'reasoning': 1500,
      'general': 1000,
      'review': 1200,
      'documentation': 800
    };
    
    return tokenEstimates[taskType] || 1000;
  }
  
  /**
   * Log model distribution for debugging
   */
  logModelDistribution(routedTasks) {
    const distribution = {};
    
    routedTasks.forEach(task => {
      if (task.requiresManager) {
        distribution.manager = (distribution.manager || 0) + 1;
      } else if (task.tierKey) {
        distribution[task.tierKey] = (distribution[task.tierKey] || 0) + 1;
      }
    });
    
    logger.info('🟢 Task Distribution:', distribution);
  }
  
  /**
   * Get routing statistics
   */
  getRoutingStats() {
    return {
      modelUsage: this.modelUsage,
      freeTierStatus: this.freeTierManager.getUsageSummary(),
      routingRules: Object.keys(this.domainMapping).length,
      capabilities: this.modelCapabilities
    };
  }
  
  /**
   * Reset usage tracking (for new session)
   */
  resetUsageTracking() {
    for (const key in this.modelUsage) {
      this.modelUsage[key] = { count: 0, lastUsed: null };
    }
    
    logger.info('🟢 Model usage tracking reset');
  }
}

// Singleton instance
let instance = null;

module.exports = {
  DomainModelRouter,
  getInstance: (config) => {
    if (!instance) {
      instance = new DomainModelRouter(config);
    }
    return instance;
  }
};
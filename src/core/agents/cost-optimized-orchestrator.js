/**
 * BUMBA Cost-Optimized Orchestrator
 * Intelligently distributes tasks across free and paid models
 * Maximizes free tier usage before falling back to paid models
 */

const { ParallelAgentSystem } = require('./parallel-agent-system');
const { getInstance: getFreeTierManager } = require('./free-tier-manager');
const { logger } = require('../logging/bumba-logger');

class CostOptimizedOrchestrator {
  constructor(config = {}) {
    this.config = {
      maxParallel: config.maxParallel || 4,
      prioritizeFree: config.prioritizeFree !== false,
      allowPaidFallback: config.allowPaidFallback !== false,
      costThreshold: config.costThreshold || 0.10, // Max $ per execution
      ...config
    };
    
    // Initialize systems
    this.parallelSystem = new ParallelAgentSystem({
      ...config,
      prioritizeFreeModels: true,
      allowPaidFallback: this.config.allowPaidFallback
    });
    
    this.freeTierManager = getFreeTierManager(config);
    
    // Execution strategies
    this.strategies = {
      'free-only': this.executeFreeOnly.bind(this),
      'free-first': this.executeFreeFirst.bind(this),
      'balanced': this.executeBalanced.bind(this),
      'quality-first': this.executeQualityFirst.bind(this)
    };
    
    // Model priorities (lower = higher priority)
    this.modelPriorities = {
      gemini: 1,
      deepseek: 2,
      qwen: 3,
      openai: 9,
      claude: 10
    };
    
    // Budget tracking
    this.budgetRemaining = config.budget || 10.00; // $10 default budget
    
    // Metrics
    this.metrics = {
      totalExecutions: 0,
      freeExecutions: 0,
      paidExecutions: 0,
      totalCost: 0,
      totalSaved: 0
    };
  }
  
  /**
   * Select optimal model based on requirements
   */
  selectOptimalModel(requirements = {}) {
    const { complexity, urgency, requiresVision } = requirements;
    
    // Simple logic for model selection
    if (requiresVision) {
      return 'gemini-pro-vision';
    }
    
    if (complexity === 'simple' && urgency === 'low') {
      return 'gemini-pro';
    }
    
    if (complexity === 'medium') {
      return urgency === 'high' ? 'qwen/qwen-2.5-coder-32b-instruct' : 'deepseek/deepseek-r1-distill-qwen-32b';
    }
    
    if (complexity === 'complex') {
      return urgency === 'high' ? 'claude-3-opus-20240229' : 'deepseek/deepseek-r1';
    }
    
    return 'gemini-pro'; // Default
  }
  
  /**
   * Execute tasks with cost optimization
   */
  async execute(tasks, strategy = 'free-first') {
    logger.info(`🟢 Executing ${tasks.length} tasks with ${strategy} strategy`);
    
    // Get current usage status
    const usageStatus = this.freeTierManager.getUsageSummary();
    this.logUsageStatus(usageStatus);
    
    // Select execution strategy
    const executeStrategy = this.strategies[strategy] || this.strategies['free-first'];
    
    // Execute with selected strategy
    const result = await executeStrategy(tasks);
    
    // Update metrics
    this.updateMetrics(result);
    
    // Log cost savings
    this.logCostSavings(result);
    
    return result;
  }
  
  /**
   * FREE-ONLY Strategy: Only use free models, fail if exhausted
   */
  async executeFreeOnly(tasks) {
    logger.info('🆓 FREE-ONLY strategy: Using only free tier models');
    
    const optimizedTasks = [];
    
    for (const task of tasks) {
      try {
        const estimatedTokens = this.estimateTokens(task.prompt);
        const taskType = this.identifyTaskType(task);
        
        // Get best FREE model (no paid fallback)
        const model = await this.freeTierManager.getBestAvailableModel({
          tokens: estimatedTokens,
          taskType,
          allowPaid: false
        });
        
        if (!model.isFree) {
          throw new Error('No free models available');
        }
        
        optimizedTasks.push({
          ...task,
          model: model.model,
          provider: model.provider,
          tierKey: model.tierKey
        });
        
      } catch (error) {
        logger.error(`🔴 Cannot execute task with free models: ${error.message}`);
        return {
          success: false,
          error: 'Free tier exhausted',
          partialResults: optimizedTasks
        };
      }
    }
    
    // Execute all tasks in parallel
    return await this.parallelSystem.executeParallel(optimizedTasks);
  }
  
  /**
   * FREE-FIRST Strategy: Prioritize free models, fallback to paid
   */
  async executeFreeFirst(tasks) {
    logger.info('🟢 FREE-FIRST strategy: Prioritizing free models with paid fallback');
    
    // Sort tasks by priority - critical tasks might get paid models
    const { freeTasks, paidTasks } = await this.categorizeTasks(tasks);
    
    logger.info(`🟢 Distribution: ${freeTasks.length} free, ${paidTasks.length} paid`);
    
    // Execute free tasks first
    const freeResults = freeTasks.length > 0 
      ? await this.parallelSystem.executeParallel(freeTasks)
      : { results: [] };
    
    // Execute paid tasks if any
    const paidResults = paidTasks.length > 0
      ? await this.parallelSystem.executeParallel(paidTasks)
      : { results: [] };
    
    return {
      success: true,
      results: [...freeResults.results, ...paidResults.results],
      metadata: {
        freeTaskCount: freeTasks.length,
        paidTaskCount: paidTasks.length,
        totalCost: this.calculateTotalCost(freeResults, paidResults),
        savedCost: this.calculateSavedCost(freeTasks.length)
      }
    };
  }
  
  /**
   * BALANCED Strategy: Mix free and paid for optimal performance
   */
  async executeBalanced(tasks) {
    logger.info('🟢️ BALANCED strategy: Optimizing cost vs performance');
    
    const optimizedTasks = [];
    let projectedCost = 0;
    
    for (const task of tasks) {
      const taskType = this.identifyTaskType(task);
      const priority = this.assessTaskPriority(task);
      
      let selectedModel;
      
      // High priority or complex tasks get better models
      if (priority === 'high' || taskType === 'reasoning') {
        // Try DeepSeek R1 first (free reasoning specialist)
        selectedModel = await this.trySelectModel('deepseek', task);
        
        // Fallback to paid Claude if needed
        if (!selectedModel) {
          selectedModel = {
            model: 'claude-3-opus-20240229',
            provider: 'anthropic',
            isFree: false,
            cost: 0.015
          };
        }
      } else if (taskType === 'coding') {
        // Try Qwen Coder first (free coding specialist)
        selectedModel = await this.trySelectModel('qwen', task);
        
        // Fallback to Gemini
        if (!selectedModel) {
          selectedModel = await this.trySelectModel('gemini', task);
        }
      } else {
        // General tasks use Gemini (free)
        selectedModel = await this.trySelectModel('gemini', task);
      }
      
      // Final fallback
      if (!selectedModel) {
        selectedModel = {
          model: 'gpt-3.5-turbo',
          provider: 'openai',
          isFree: false,
          cost: 0.001
        };
      }
      
      optimizedTasks.push({
        ...task,
        ...selectedModel
      });
      
      if (!selectedModel.isFree) {
        projectedCost += selectedModel.cost * (this.estimateTokens(task.prompt) / 1000);
      }
    }
    
    logger.info(`🟢 Projected cost: $${projectedCost.toFixed(4)}`);
    
    return await this.parallelSystem.executeParallel(optimizedTasks);
  }
  
  /**
   * QUALITY-FIRST Strategy: Use best models regardless of cost
   */
  async executeQualityFirst(tasks) {
    logger.info('🏁 QUALITY-FIRST strategy: Using best models for each task');
    
    const optimizedTasks = tasks.map(task => {
      const taskType = this.identifyTaskType(task);
      
      // Select best model for task type
      let model, provider;
      
      if (taskType === 'reasoning') {
        // Claude for best reasoning
        model = 'claude-3-opus-20240229';
        provider = 'anthropic';
      } else if (taskType === 'coding') {
        // GPT-4 for best coding
        model = 'gpt-4-turbo-preview';
        provider = 'openai';
      } else {
        // Gemini Pro for general tasks
        model = 'gemini-pro';
        provider = 'google';
      }
      
      return {
        ...task,
        model,
        provider
      };
    });
    
    return await this.parallelSystem.executeParallel(optimizedTasks);
  }
  
  /**
   * Categorize tasks into free and paid based on availability
   */
  async categorizeTasks(tasks) {
    const freeTasks = [];
    const paidTasks = [];
    
    // Create usage projection
    const projection = { ...this.freeTierManager.dailyUsage };
    
    for (const task of tasks) {
      const estimatedTokens = this.estimateTokens(task.prompt);
      const taskType = this.identifyTaskType(task);
      
      // Try to find a free model
      let assigned = false;
      
      // Priority order: Gemini → DeepSeek/Qwen (based on task) → Paid
      const tryModels = ['gemini'];
      
      if (taskType === 'reasoning') {
        tryModels.push('deepseek');
      } else if (taskType === 'coding') {
        tryModels.push('qwen');
      }
      
      for (const modelKey of tryModels) {
        const tier = this.freeTierManager.freeTierLimits[modelKey];
        const usage = projection[modelKey];
        
        if (!usage.exhausted && 
            usage.tokens + estimatedTokens <= tier.dailyTokenLimit &&
            usage.requests + 1 <= tier.dailyRequestLimit) {
          
          // Assign to free model
          freeTasks.push({
            ...task,
            model: this.getModelForTier(modelKey, taskType),
            tierKey: modelKey
          });
          
          // Update projection
          projection[modelKey].tokens += estimatedTokens;
          projection[modelKey].requests += 1;
          
          assigned = true;
          break;
        }
      }
      
      // If no free model available, use paid
      if (!assigned) {
        paidTasks.push({
          ...task,
          model: 'claude-3-opus-20240229' // Or choose based on task
        });
      }
    }
    
    return { freeTasks, paidTasks };
  }
  
  /**
   * Get appropriate model for a tier and task type
   */
  getModelForTier(tierKey, taskType) {
    if (tierKey === 'gemini') {
      return 'gemini-pro';
    } else if (tierKey === 'deepseek') {
      return taskType === 'reasoning' 
        ? 'deepseek/deepseek-r1'
        : 'deepseek/deepseek-r1-distill-qwen-32b';
    } else if (tierKey === 'qwen') {
      return taskType === 'coding'
        ? 'qwen/qwen-2.5-coder-32b-instruct'
        : 'qwen/qwq-32b-preview';
    }
    return 'claude-3-opus-20240229'; // Fallback
  }
  
  /**
   * Try to select a specific free model
   */
  async trySelectModel(tierKey, task) {
    try {
      const estimatedTokens = this.estimateTokens(task.prompt);
      const tier = this.freeTierManager.freeTierLimits[tierKey];
      const usage = this.freeTierManager.dailyUsage[tierKey];
      
      if (!usage.exhausted &&
          usage.tokens + estimatedTokens <= tier.dailyTokenLimit &&
          usage.requests + 1 <= tier.dailyRequestLimit) {
        
        const taskType = this.identifyTaskType(task);
        return {
          model: this.getModelForTier(tierKey, taskType),
          provider: tier.provider,
          tierKey,
          isFree: true,
          cost: 0
        };
      }
    } catch (error) {
      logger.debug(`Cannot use ${tierKey}: ${error.message}`);
    }
    
    return null;
  }
  
  /**
   * Identify task type
   */
  identifyTaskType(task) {
    const prompt = (task.prompt || '').toLowerCase();
    const agent = (task.agent || '').toLowerCase();
    
    if (prompt.includes('reason') || prompt.includes('analyze') ||
        prompt.includes('architect') || agent.includes('architect')) {
      return 'reasoning';
    } else if (prompt.includes('code') || prompt.includes('implement') ||
               prompt.includes('function') || agent.includes('develop')) {
      return 'coding';
    }
    
    return 'general';
  }
  
  /**
   * Assess task priority
   */
  assessTaskPriority(task) {
    if (task.priority) {return task.priority;}
    
    const keywords = ['critical', 'urgent', 'important', 'production', 'bug', 'security'];
    const prompt = (task.prompt || '').toLowerCase();
    
    for (const keyword of keywords) {
      if (prompt.includes(keyword)) {
        return 'high';
      }
    }
    
    return 'normal';
  }
  
  /**
   * Estimate tokens for a prompt
   */
  estimateTokens(prompt) {
    return Math.ceil(prompt.length / 4) + 2000; // Include response buffer
  }
  
  /**
   * Calculate total cost
   */
  calculateTotalCost(freeResults, paidResults) {
    let cost = 0;
    
    if (paidResults && paidResults.results) {
      cost += paidResults.results.reduce((sum, r) => sum + (r.cost || 0), 0);
    }
    
    return cost;
  }
  
  /**
   * Calculate saved cost by using free models
   */
  calculateSavedCost(freeTaskCount) {
    // Estimate what it would cost with Claude
    const claudeCostPerTask = 0.015 * 5; // ~5k tokens per task
    return freeTaskCount * claudeCostPerTask;
  }
  
  /**
   * Update metrics
   */
  updateMetrics(result) {
    this.metrics.totalExecutions++;
    
    if (result.results) {
      result.results.forEach(r => {
        if (r.cost === 0) {
          this.metrics.freeExecutions++;
        } else {
          this.metrics.paidExecutions++;
          this.metrics.totalCost += r.cost || 0;
        }
      });
    }
    
    if (result.metadata?.savedCost) {
      this.metrics.totalSaved += result.metadata.savedCost;
    }
  }
  
  /**
   * Log usage status
   */
  logUsageStatus(status) {
    console.log('\n🟢 Current Free Tier Status:');
    
    for (const [key, data] of Object.entries(status)) {
      if (data.isFree) {
        const icon = data.usage.exhausted ? '🔴' : '🏁';
        console.log(`${icon} ${key}: ${data.usage.percentUsed.tokens}% tokens used`);
      }
    }
  }
  
  /**
   * Log cost savings
   */
  logCostSavings(result) {
    if (result.metadata) {
      const { freeTaskCount = 0, paidTaskCount = 0, totalCost = 0, savedCost = 0 } = result.metadata;
      
      console.log('\n🟢 Execution Cost Summary:');
      console.log(`  Free tasks: ${freeTaskCount}`);
      console.log(`  Paid tasks: ${paidTaskCount}`);
      console.log(`  Total cost: $${totalCost.toFixed(4)}`);
      console.log(`  Money saved: $${savedCost.toFixed(4)}`);
    }
    
    console.log(`\n🟢 Lifetime Savings: $${this.metrics.totalSaved.toFixed(2)}`);
  }
  
  /**
   * Get optimization recommendations
   */
  getOptimizationRecommendations() {
    const recommendations = [];
    const usage = this.freeTierManager.getUsageSummary();
    
    // Check Gemini usage
    if (usage.gemini && !usage.gemini.usage.exhausted) {
      const remaining = usage.gemini.usage.tokensRemaining;
      recommendations.push(`🟢 Gemini has ${remaining.toLocaleString()} free tokens available`);
    }
    
    // Check specialized models
    if (usage.deepseek && !usage.deepseek.usage.exhausted) {
      recommendations.push('🟢 Use DeepSeek R1 for complex reasoning tasks');
    }
    
    if (usage.qwen && !usage.qwen.usage.exhausted) {
      recommendations.push('🟢 Use Qwen Coder for implementation tasks');
    }
    
    // Cost optimization tips
    const freeRatio = this.metrics.freeExecutions / (this.metrics.totalExecutions || 1);
    if (freeRatio < 0.5) {
      recommendations.push('🟡 Consider using more free models to reduce costs');
    }
    
    return recommendations;
  }
}

// Singleton instance
let instance = null;

module.exports = {
  CostOptimizedOrchestrator,
  getInstance: (config) => {
    if (!instance) {
      instance = new CostOptimizedOrchestrator(config);
    }
    return instance;
  }
};
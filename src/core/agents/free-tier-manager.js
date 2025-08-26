/**
 * BUMBA Free Tier Usage Manager
 * Intelligently tracks and manages free tier usage across multiple models
 * Prioritizes free models (Gemini, DeepSeek, Qwen) before falling back to paid
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');
const fs = require('fs').promises;
const path = require('path');

class FreeTierManager extends EventEmitter {
  constructor(config = {}) {
    super();
    
    // Usage tracking file location
    this.usageFile = config.usageFile || path.join(process.cwd(), '.bumba-usage.json');
    
    // Free tier limits (daily)
    this.freeTierLimits = {
      gemini: {
        provider: 'google',
        model: 'gemini-pro',
        dailyTokenLimit: 1000000, // 1M tokens/day free
        dailyRequestLimit: 1500, // 1500 requests/day
        resetHour: 0, // UTC midnight
        cost: 0.00, // FREE!
        priority: 1 // Highest priority (use first)
      },
      
      deepseek: {
        provider: 'deepseek',
        models: ['deepseek/deepseek-r1', 'deepseek/deepseek-r1-distill-qwen-32b'],
        dailyTokenLimit: 500000, // 500K tokens/day free tier (estimated)
        dailyRequestLimit: 100, // 100 requests/day free
        resetHour: 0,
        cost: 0.00, // FREE during trial!
        priority: 2 // Second priority
      },
      
      qwen: {
        provider: 'qwen',
        models: ['qwen/qwen-2.5-coder-32b-instruct', 'qwen/qwq-32b-preview'],
        dailyTokenLimit: 500000, // 500K tokens/day free tier (estimated)
        dailyRequestLimit: 100, // 100 requests/day free
        resetHour: 0,
        cost: 0.00, // FREE during trial!
        priority: 3 // Third priority
      },
      
      // Fallback paid models when free tier exhausted
      claude: {
        provider: 'anthropic',
        model: 'claude-3-opus-20240229',
        dailyTokenLimit: Infinity,
        dailyRequestLimit: Infinity,
        cost: 0.015, // $15/million input tokens
        priority: 10 // Last resort (most expensive)
      },
      
      openai: {
        provider: 'openai',
        model: 'gpt-4-turbo-preview',
        dailyTokenLimit: Infinity,
        dailyRequestLimit: Infinity,
        cost: 0.01, // $10/million input tokens
        priority: 9 // Second to last resort
      }
    };
    
    // Current usage tracking
    this.dailyUsage = {};
    
    // Interface properties for compatibility
    this.limits = {
      daily: 100,        // Daily request limit
      concurrent: 4      // Max concurrent requests
    };
    
    // List of free models
    this.freeModels = ['gemini', 'deepseek', 'qwen'];
    
    // Initialize usage tracking
    this.initializeUsageTracking();
    
    // Set up daily reset timer
    this.setupDailyReset();
  }
  
  /**
   * Initialize usage tracking from persistent storage
   */
  async initializeUsageTracking() {
    try {
      const usageData = await fs.readFile(this.usageFile, 'utf-8');
      const parsed = JSON.parse(usageData);
      
      // Check if data is from today
      const today = new Date().toDateString();
      if (parsed.date === today) {
        this.dailyUsage = parsed.usage;
        logger.info('🟢 Loaded existing usage data for today');
      } else {
        // Reset for new day
        await this.resetDailyUsage();
        logger.info('🟢 Reset usage tracking for new day');
      }
    } catch (error) {
      // First run or corrupted file
      await this.resetDailyUsage();
      logger.info('🟢 Initialized new usage tracking');
    }
    
    this.logCurrentUsage();
  }
  
  /**
   * Reset daily usage counters
   */
  async resetDailyUsage() {
    this.dailyUsage = {};
    
    for (const [key, tier] of Object.entries(this.freeTierLimits)) {
      this.dailyUsage[key] = {
        tokens: 0,
        requests: 0,
        lastReset: new Date().toISOString(),
        exhausted: false
      };
    }
    
    await this.persistUsage();
    this.emit('usage:reset', { timestamp: new Date() });
  }
  
  /**
   * Persist usage data to file
   */
  async persistUsage() {
    const data = {
      date: new Date().toDateString(),
      usage: this.dailyUsage,
      lastUpdated: new Date().toISOString()
    };
    
    try {
      await fs.writeFile(this.usageFile, JSON.stringify(data, null, 2));
    } catch (error) {
      logger.error('Failed to persist usage data:', error);
    }
  }
  
  /**
   * Set up daily reset timer
   */
  setupDailyReset() {
    const checkReset = () => {
      const now = new Date();
      const storedDate = this.dailyUsage.gemini?.lastReset;
      
      if (storedDate) {
        const lastReset = new Date(storedDate);
        if (now.toDateString() !== lastReset.toDateString()) {
          logger.info('🟢 Daily reset triggered');
          this.resetDailyUsage();
        }
      }
    };
    
    // Check every hour
    setInterval(checkReset, 60 * 60 * 1000);
    
    // Also check on next midnight
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const msUntilMidnight = tomorrow - now;
    setTimeout(() => {
      this.resetDailyUsage();
      // Set up recurring daily reset
      setInterval(() => this.resetDailyUsage(), 24 * 60 * 60 * 1000);
    }, msUntilMidnight);
  }
  
  /**
   * Get the best available model based on free tier availability
   */
  async getBestAvailableModel(requirements = {}) {
    const { 
      tokens = 1000, 
      taskType = 'general',
      preferredProvider = null,
      allowPaid = true 
    } = requirements;
    
    // Sort models by priority (free first, then by cost)
    const sortedModels = Object.entries(this.freeTierLimits)
      .sort((a, b) => a[1].priority - b[1].priority);
    
    for (const [key, tier] of sortedModels) {
      const usage = this.dailyUsage[key];
      
      // Skip if exhausted
      if (usage.exhausted) {continue;}
      
      // Skip paid models if not allowed
      if (!allowPaid && tier.cost > 0) {continue;}
      
      // Check if we have enough tokens/requests remaining
      const hasTokens = usage.tokens + tokens <= tier.dailyTokenLimit;
      const hasRequests = usage.requests + 1 <= tier.dailyRequestLimit;
      
      if (hasTokens && hasRequests) {
        // Special handling for task-specific models
        if (taskType === 'reasoning' && key === 'deepseek') {
          return this.selectDeepSeekModel(taskType);
        } else if (taskType === 'coding' && key === 'qwen') {
          return this.selectQwenModel(taskType);
        } else if (key === 'gemini') {
          return this.getGeminiConfig();
        }
        
        // Return the selected model
        return {
          provider: tier.provider,
          model: tier.model || tier.models[0],
          isFree: tier.cost === 0,
          remainingTokens: tier.dailyTokenLimit - usage.tokens,
          remainingRequests: tier.dailyRequestLimit - usage.requests,
          tierKey: key
        };
      }
    }
    
    // All free tiers exhausted
    if (allowPaid) {
      logger.warn('🟡 All free tiers exhausted, falling back to paid models');
      return {
        provider: 'anthropic',
        model: 'claude-3-opus-20240229',
        isFree: false,
        warning: 'Using paid model - free tiers exhausted',
        tierKey: 'claude'
      };
    }
    
    throw new Error('All free tier limits exhausted and paid models not allowed');
  }
  
  /**
   * Select optimal DeepSeek model based on task
   */
  selectDeepSeekModel(taskType) {
    const tier = this.freeTierLimits.deepseek;
    
    if (taskType === 'reasoning' || taskType === 'complex') {
      return {
        provider: 'openrouter',
        model: 'deepseek/deepseek-r1',
        isFree: true,
        specialization: 'reasoning',
        tierKey: 'deepseek'
      };
    } else {
      return {
        provider: 'openrouter',
        model: 'deepseek/deepseek-r1-distill-qwen-32b',
        isFree: true,
        specialization: 'fast-analysis',
        tierKey: 'deepseek'
      };
    }
  }
  
  /**
   * Select optimal Qwen model based on task
   */
  selectQwenModel(taskType) {
    const tier = this.freeTierLimits.qwen;
    
    if (taskType === 'coding' || taskType === 'implementation') {
      return {
        provider: 'openrouter',
        model: 'qwen/qwen-2.5-coder-32b-instruct',
        isFree: true,
        specialization: 'coding',
        tierKey: 'qwen'
      };
    } else {
      return {
        provider: 'openrouter',
        model: 'qwen/qwq-32b-preview',
        isFree: true,
        specialization: 'analysis',
        tierKey: 'qwen'
      };
    }
  }
  
  /**
   * Get Gemini configuration
   */
  getGeminiConfig() {
    return {
      provider: 'google',
      model: 'gemini-pro',
      isFree: true,
      specialization: 'general',
      tierKey: 'gemini'
    };
  }
  
  /**
   * Track usage for a model
   */
  async trackUsage(tierKey, tokens, requests = 1) {
    if (!this.dailyUsage[tierKey]) {
      logger.warn(`Unknown tier key: ${tierKey}`);
      return;
    }
    
    const usage = this.dailyUsage[tierKey];
    const tier = this.freeTierLimits[tierKey];
    
    usage.tokens += tokens;
    usage.requests += requests;
    
    // Check if exhausted
    if (usage.tokens >= tier.dailyTokenLimit || 
        usage.requests >= tier.dailyRequestLimit) {
      usage.exhausted = true;
      logger.warn(`🟡 Free tier exhausted for ${tierKey}`);
      this.emit('tier:exhausted', { tier: tierKey, usage });
    }
    
    await this.persistUsage();
    
    // Log usage percentage
    const tokenPercent = ((usage.tokens / tier.dailyTokenLimit) * 100).toFixed(1);
    const requestPercent = ((usage.requests / tier.dailyRequestLimit) * 100).toFixed(1);
    
    logger.info(`🟢 ${tierKey} usage: ${tokenPercent}% tokens, ${requestPercent}% requests`);
  }
  
  /**
   * Get usage summary
   */
  getUsageSummary() {
    const summary = {};
    
    for (const [key, tier] of Object.entries(this.freeTierLimits)) {
      const usage = this.dailyUsage[key];
      
      // Skip if usage data not initialized
      if (!usage) {continue;}
      
      summary[key] = {
        provider: tier.provider,
        isFree: tier.cost === 0,
        usage: {
          tokens: usage.tokens || 0,
          requests: usage.requests || 0,
          tokensRemaining: Math.max(0, tier.dailyTokenLimit - (usage.tokens || 0)),
          requestsRemaining: Math.max(0, tier.dailyRequestLimit - (usage.requests || 0)),
          percentUsed: {
          },
          exhausted: usage.exhausted || false
        }
      };
    }
    
    return summary;
  }
  
  /**
   * Log current usage status
   */
  logCurrentUsage() {
    console.log('\n🟢 Free Tier Usage Status:');
    console.log('═'.repeat(50));
    
    const summary = this.getUsageSummary();
    
    // Free tiers
    console.log('\n🆓 FREE TIERS:');
    for (const [key, data] of Object.entries(summary)) {
      if (data.isFree) {
        const status = data.usage.exhausted ? '🔴' : '🏁';
        console.log(`${status} ${key.toUpperCase()}:`);
        console.log(`   Tokens: ${data.usage.percentUsed.tokens}% used (${data.usage.tokensRemaining} remaining)`);
        console.log(`   Requests: ${data.usage.percentUsed.requests}% used (${data.usage.requestsRemaining} remaining)`);
      }
    }
    
    // Paid fallbacks
    console.log('\n🟢 PAID FALLBACKS (when free exhausted):');
    for (const [key, data] of Object.entries(summary)) {
      if (!data.isFree) {
        console.log(`   ${key.toUpperCase()}: Ready as fallback`);
      }
    }
    
    console.log('═'.repeat(50));
  }
  
  /**
   * Smart model selection for parallel tasks
   */
  async selectModelsForParallelTasks(tasks) {
    const selectedModels = [];
    const usageProjection = { ...this.dailyUsage };
    
    for (const task of tasks) {
      // Estimate tokens for this task
      const estimatedTokens = this.estimateTokens(task.prompt);
      
      // Determine task type
      const taskType = this.identifyTaskType(task);
      
      // Find best available model considering projected usage
      const model = await this.getBestAvailableModelWithProjection(
        taskType, 
        estimatedTokens, 
        usageProjection
      );
      
      // Update projection
      if (model.tierKey && usageProjection[model.tierKey]) {
        usageProjection[model.tierKey].tokens += estimatedTokens;
        usageProjection[model.tierKey].requests += 1;
      }
      
      selectedModels.push({
        ...task,
        model: model.model,
        provider: model.provider,
        isFree: model.isFree,
        tierKey: model.tierKey
      });
    }
    
    return selectedModels;
  }
  
  /**
   * Get best model considering projected usage
   */
  async getBestAvailableModelWithProjection(taskType, tokens, projection) {
    // Similar to getBestAvailableModel but uses projection
    const sortedModels = Object.entries(this.freeTierLimits)
      .sort((a, b) => a[1].priority - b[1].priority);
    
    for (const [key, tier] of sortedModels) {
      const usage = projection[key];
      
      if (usage.exhausted) {continue;}
      
      const hasTokens = usage.tokens + tokens <= tier.dailyTokenLimit;
      const hasRequests = usage.requests + 1 <= tier.dailyRequestLimit;
      
      if (hasTokens && hasRequests && tier.cost === 0) {
        // Return appropriate model based on task type
        if (taskType === 'reasoning' && key === 'deepseek') {
          return this.selectDeepSeekModel(taskType);
        } else if (taskType === 'coding' && key === 'qwen') {
          return this.selectQwenModel(taskType);
        } else if (key === 'gemini') {
          return this.getGeminiConfig();
        }
      }
    }
    
    // Fallback to paid
    return {
      provider: 'anthropic',
      model: 'claude-3-opus-20240229',
      isFree: false,
      tierKey: 'claude'
    };
  }
  
  /**
   * Estimate tokens for a prompt
   */
  estimateTokens(prompt) {
    // Rough estimation: 1 token ≈ 4 characters
    return Math.ceil(prompt.length / 4) + 500; // Add buffer for response
  }
  
  /**
   * Identify task type from prompt
   */
  identifyTaskType(task) {
    const prompt = (task.prompt || '').toLowerCase();
    
    if (prompt.includes('reason') || prompt.includes('analyze') || 
        prompt.includes('debug') || prompt.includes('architect')) {
      return 'reasoning';
    } else if (prompt.includes('code') || prompt.includes('implement') || 
               prompt.includes('function') || prompt.includes('class')) {
      return 'coding';
    } else if (prompt.includes('review') || prompt.includes('validate')) {
      return 'review';
    }
    
    return 'general';
  }
  
  /**
   * Get recommendation for optimal usage
   */
  getUsageRecommendation() {
    const summary = this.getUsageSummary();
    const recommendations = [];
    
    // Check Gemini (highest priority free)
    if (!summary.gemini.usage.exhausted) {
      recommendations.push('🏁 Gemini has free tokens available - use for general tasks');
    }
    
    // Check DeepSeek
    if (!summary.deepseek.usage.exhausted) {
      recommendations.push('🏁 DeepSeek R1 available - use for complex reasoning');
    }
    
    // Check Qwen
    if (!summary.qwen.usage.exhausted) {
      recommendations.push('🏁 Qwen Coder available - use for code generation');
    }
    
    // Warning if close to limits
    for (const [key, data] of Object.entries(summary)) {
      if (data.isFree && parseFloat(data.usage.percentUsed.tokens) > 80) {
        recommendations.push(`🟡 ${key} is ${data.usage.percentUsed.tokens}% used - conserve tokens`);
      }
    }
    
    return recommendations;
  }
  
  /**
   * Get remaining daily quota
   */
  getRemainingQuota() {
    let totalRemaining = 0;
    
    for (const [key, tier] of Object.entries(this.freeTierLimits)) {
      if (tier.cost === 0 && this.dailyUsage[key]) {
        const usage = this.dailyUsage[key];
        if (!usage.exhausted) {
          totalRemaining += Math.max(0, tier.dailyRequestLimit - usage.requests);
        }
      }
    }
    
    return totalRemaining;
  }
  
  /**
   * Check if a request can be made
   */
  canMakeRequest(agentId) {
    // Check if we have any free tier capacity left
    const remainingQuota = this.getRemainingQuota();
    
    if (remainingQuota <= 0) {
      logger.warn(`🟡 No free tier quota remaining for ${agentId}`);
      return false;
    }
    
    // Check concurrent limit (simplified - would need actual tracking)
    return true;
  }
  
  /**
   * Track usage for an agent (simplified interface)
   */
  trackAgentUsage(agentId, model) {
    // Map model to tier key
    let tierKey = null;
    
    if (model && typeof model === 'string') {
      if (model.includes('gemini')) {
        tierKey = 'gemini';
      } else if (model.includes('deepseek')) {
        tierKey = 'deepseek';
      } else if (model.includes('qwen')) {
        tierKey = 'qwen';
      } else if (model.includes('claude')) {
        tierKey = 'claude';
      } else if (model.includes('gpt')) {
        tierKey = 'openai';
      }
    }
    
    if (tierKey) {
      // Track with estimated tokens
      const estimatedTokens = 1000; // Default estimate
      this.trackUsage(tierKey, estimatedTokens, 1);
      logger.info(`🟢 Tracked usage for ${agentId} using ${model}`);
      return true;
    }
    
    return false;
  }
}

// Singleton instance
let instance = null;

module.exports = {
  FreeTierManager,
  getInstance: (config) => {
    if (!instance) {
      instance = new FreeTierManager(config);
    }
    return instance;
  }
};
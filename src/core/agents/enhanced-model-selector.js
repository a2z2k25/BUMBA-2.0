/**
 * BUMBA Enhanced Model Selector
 * Intelligent model selection with OpenRouter and Kimi K2 support
 * Optimizes for cost, quality, speed, and context requirements
 */

const OpenRouterMCPIntegration = require('../integrations/openrouter-mcp-integration');
const KimiK2Integration = require('../integrations/kimi-k2-integration');

class EnhancedModelSelector {
  constructor() {
    this.openRouter = new OpenRouterMCPIntegration();
    this.kimiK2 = new KimiK2Integration();
    
    // Model categories with enhanced options
    this.modelCategories = {
      'premium': [
        'anthropic/claude-3-opus',
        'openai/gpt-4-turbo-preview',
        'kimi/k2-reasoning'
      ],
      'balanced': [
        'anthropic/claude-3-sonnet',
        'google/gemini-pro',
        'kimi/k2-chat',
        'mistralai/mixtral-8x7b-instruct'
      ],
      'efficient': [
        'anthropic/claude-3-haiku',
        'deepseek/deepseek-chat',
        'qwen/qwen-14b-chat',
        'meta-llama/llama-3-8b-instruct'
      ],
      'specialized': {
        'coding': ['deepseek/deepseek-coder', 'kimi/k2-reasoning'],
        'reasoning': ['kimi/k2-reasoning', 'anthropic/claude-3-opus'],
        'long-context': ['kimi/k2-chat', 'kimi/k2-reasoning'],
        'vision': ['google/gemini-pro-vision', 'openai/gpt-4-turbo-preview']
      }
    };
    
    // Task-specific model recommendations
    this.taskRecommendations = {
      'architecture': {
        primary: 'kimi/k2-reasoning',
        fallback: 'anthropic/claude-3-opus',
        budget: 'deepseek/deepseek-chat'
      },
      'code-review': {
        primary: 'deepseek/deepseek-coder',
        fallback: 'kimi/k2-chat',
        budget: 'qwen/qwen-14b-chat'
      },
      'documentation': {
        primary: 'kimi/k2-chat',
        fallback: 'anthropic/claude-3-sonnet',
        budget: 'meta-llama/llama-3-8b-instruct'
      },
      'ui-design': {
        primary: 'anthropic/claude-3-opus',
        fallback: 'google/gemini-pro',
        budget: 'mistralai/mixtral-8x7b-instruct'
      },
      'api-design': {
        primary: 'anthropic/claude-3-sonnet',
        fallback: 'kimi/k2-chat',
        budget: 'deepseek/deepseek-chat'
      },
      'testing': {
        primary: 'kimi/k2-reasoning',
        fallback: 'anthropic/claude-3-haiku',
        budget: 'qwen/qwen-14b-chat'
      }
    };
    
    this.initialized = false;
  }

  /**
   * Initialize model selector with available APIs
   */
  async initialize(config = {}) {
    console.log('🟢 Initializing Enhanced Model Selector...');
    
    // Initialize OpenRouter
    const openRouterStatus = await this.openRouter.initialize(config.openRouter || {});
    if (openRouterStatus) {
      console.log('🏁 OpenRouter integration ready');
    }
    
    // Initialize Kimi K2
    const kimiStatus = await this.kimiK2.initialize(config.kimi || {});
    if (kimiStatus) {
      console.log('🏁 Kimi K2 integration ready');
    }
    
    this.initialized = openRouterStatus || kimiStatus;
    
    if (!this.initialized) {
      console.log('\n🟡 No model providers configured. Please set up at least one:');
      console.log('- OpenRouter: Set OPENROUTER_API_KEY');
      console.log('- Kimi K2: Set KIMI_API_KEY or use OpenRouter');
    }
    
    return this.initialized;
  }

  /**
   * Select optimal model for agent and task
   */
  selectModelForAgent(agentType, taskType, requirements = {}) {
    const {
      contextLength = 0,
      budget = 'normal',
      speed = 'balanced',
      quality = 'good'
    } = requirements;
    
    // Check if long context is needed
    if (contextLength > 100000) {
      console.log(`🟢 Long context (${contextLength} tokens) - recommending Kimi K2`);
      return this.selectK2Model(taskType, requirements);
    }
    
    // Get task-specific recommendations
    const taskRec = this.taskRecommendations[taskType];
    if (taskRec) {
      if (budget === 'low') {return this.getModelDetails(taskRec.budget);}
      if (quality === 'excellent') {return this.getModelDetails(taskRec.primary);}
      return this.getModelDetails(taskRec.fallback);
    }
    
    // Agent-specific selection
    return this.selectByAgentType(agentType, requirements);
  }

  /**
   * Select K2 model based on requirements
   */
  selectK2Model(taskType, requirements) {
    const needsReasoning = [
      'architecture',
      'testing',
      'problem-solving'
    ].includes(taskType);
    
    const model = needsReasoning ? 'kimi/k2-reasoning' : 'kimi/k2-chat';
    
    return this.getModelDetails(model);
  }

  /**
   * Select model by agent type
   */
  selectByAgentType(agentType, requirements) {
    const agentModels = {
      'api-architect': 'anthropic/claude-3-sonnet',
      'database-specialist': 'deepseek/deepseek-chat',
      'security-specialist': 'anthropic/claude-3-opus',
      'react-specialist': 'kimi/k2-chat',
      'ui-architect': 'google/gemini-pro',
      'accessibility-specialist': 'anthropic/claude-3-haiku',
      'product-analyst': 'kimi/k2-reasoning',
      'technical-writer': 'kimi/k2-chat'
    };
    
    const model = agentModels[agentType] || 'qwen/qwen-14b-chat';
    return this.getModelDetails(model);
  }

  /**
   * Get detailed model information
   */
  getModelDetails(modelId) {
    // Check OpenRouter models
    const openRouterModel = this.openRouter.availableModels[modelId];
    if (openRouterModel) {
      return {
        id: modelId,
        provider: 'openrouter',
        ...openRouterModel,
        available: !!this.openRouter.apiKey
      };
    }
    
    // Check Kimi K2 models
    const k2Model = Object.values(this.kimiK2.models).find(m => m.model === modelId);
    if (k2Model) {
      return {
        id: modelId,
        provider: 'kimi',
        ...k2Model,
        available: !!this.kimiK2.apiKey
      };
    }
    
    // Default fallback
    return {
      id: 'qwen/qwen-14b-chat',
      provider: 'openrouter',
      cost: 0.00027,
      speed: 'very-fast',
      quality: 'good',
      available: !!this.openRouter.apiKey
    };
  }

  /**
   * Get cost comparison for task
   */
  getCostComparison(taskType, estimatedTokens = 10000) {
    const models = [];
    
    // Get recommendations for task
    const taskRec = this.taskRecommendations[taskType] || {
      primary: 'anthropic/claude-3-sonnet',
      fallback: 'kimi/k2-chat',
      budget: 'qwen/qwen-14b-chat'
    };
    
    // Calculate costs for each option
    ['primary', 'fallback', 'budget'].forEach(tier => {
      const modelId = taskRec[tier];
      const model = this.getModelDetails(modelId);
      const cost = (estimatedTokens / 1000) * model.cost;
      
      models.push({
        tier,
        model: modelId,
        quality: model.quality,
        speed: model.speed,
        cost: cost.toFixed(4),
        savings: tier === 'budget' ? '70-80%' : tier === 'fallback' ? '30-50%' : 'baseline'
      });
    });
    
    return {
      task: taskType,
      estimatedTokens,
      recommendations: models,
      optimalChoice: models[1] // Usually fallback is best value
    };
  }

  /**
   * Dynamic model selection hook
   */
  async createModelSelectionHook() {
    return async (context) => {
      const { agentId, taskType, requirements = {} } = context;
      
      // Check if model selection is needed
      if (context.modelOverride) {
        return context;
      }
      
      // Select optimal model
      const selectedModel = this.selectModelForAgent(
        agentId,
        taskType,
        requirements
      );
      
      // Check availability and fallback if needed
      if (!selectedModel.available) {
        console.log(`🟡 ${selectedModel.id} not available, selecting fallback`);
        context.selectedModel = this.selectFallbackModel(requirements);
      } else {
        context.selectedModel = selectedModel.id;
      }
      
      // Add cost estimate
      context.estimatedCost = this.estimateCost(
        context.selectedModel,
        requirements.estimatedTokens || 1000
      );
      
      console.log(`🟢 Selected ${context.selectedModel} for ${taskType} (Est: $${context.estimatedCost})`);
      
      return context;
    };
  }

  /**
   * Select fallback model when primary is unavailable
   */
  selectFallbackModel(requirements) {
    const { budget = 'normal', contextLength = 0 } = requirements;
    
    // Prioritize available models
    const fallbacks = [
      'qwen/qwen-14b-chat',
      'meta-llama/llama-3-8b-instruct',
      'deepseek/deepseek-chat'
    ];
    
    for (const model of fallbacks) {
      const details = this.getModelDetails(model);
      if (details.available) {
        return model;
      }
    }
    
    // Last resort
    return 'qwen/qwen-14b-chat';
  }

  /**
   * Estimate cost for model usage
   */
  estimateCost(modelId, tokens) {
    const model = this.getModelDetails(modelId);
    const cost = (tokens / 1000) * model.cost;
    return cost.toFixed(4);
  }

  /**
   * Get setup guide for all models
   */
  getSetupGuide() {
    return {
      title: 'BUMBA Model Setup Guide',
      providers: [
        {
          name: 'OpenRouter (200+ models)',
          setup: this.openRouter.setupInstructions,
          status: this.openRouter.getStatus()
        },
        {
          name: 'Kimi K2 (200K context)',
          setup: this.kimiK2.setupInstructions,
          status: this.kimiK2.getStatus()
        }
      ],
      quickStart: [
        '1. Choose your provider(s):',
        '   - OpenRouter: Access to 200+ models',
        '   - Kimi K2: Best for long documents',
        '',
        '2. Get API keys:',
        '   - OpenRouter: https://openrouter.ai/keys',
        '   - Kimi: Contact Kimi AI for access',
        '',
        '3. Add to .env:',
        '   OPENROUTER_API_KEY=your-key',
        '   KIMI_API_KEY=your-key',
        '',
        '4. Initialize:',
        '   const selector = new EnhancedModelSelector();',
        '   await selector.initialize();'
      ]
    };
  }

  /**
   * Get current configuration status
   */
  getStatus() {
    return {
      initialized: this.initialized,
      providers: {
        openRouter: this.openRouter.getStatus(),
        kimiK2: this.kimiK2.getStatus()
      },
      availableModels: this.getAvailableModels(),
      recommendations: this.getTopRecommendations()
    };
  }

  /**
   * Get list of available models
   */
  getAvailableModels() {
    const models = [];
    
    // Add OpenRouter models if available
    if (this.openRouter.apiKey) {
      Object.keys(this.openRouter.availableModels).forEach(model => {
        models.push({
          id: model,
          provider: 'openrouter',
          available: true
        });
      });
    }
    
    // Add Kimi K2 models if available
    if (this.kimiK2.apiKey) {
      Object.values(this.kimiK2.models).forEach(model => {
        models.push({
          id: model.model,
          provider: 'kimi',
          available: true,
          contextWindow: model.contextWindow
        });
      });
    }
    
    return models;
  }

  /**
   * Get top model recommendations
   */
  getTopRecommendations() {
    return {
      'best-overall': 'anthropic/claude-3-sonnet',
      'best-value': 'kimi/k2-chat',
      'best-budget': 'qwen/qwen-14b-chat',
      'best-reasoning': 'kimi/k2-reasoning',
      'best-coding': 'deepseek/deepseek-coder',
      'best-speed': 'anthropic/claude-3-haiku',
      'best-context': 'kimi/k2-chat'
    };
  }
}

module.exports = EnhancedModelSelector;
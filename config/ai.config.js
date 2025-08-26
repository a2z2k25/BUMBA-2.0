/**
 * BUMBA AI Configuration Module
 */

module.exports = {
  load(customAI = {}) {
    return {
      // Model configurations
      models: {
        default: customAI.models?.default || 'offline',
        
        // OpenAI models
        openai: {
          'gpt-4': {
            provider: 'openai',
            maxTokens: 8192,
            temperature: 0.7,
            cost: { input: 0.03, output: 0.06 },
            capabilities: ['reasoning', 'coding', 'analysis']
          },
          'gpt-3.5-turbo': {
            provider: 'openai',
            maxTokens: 4096,
            temperature: 0.7,
            cost: { input: 0.001, output: 0.002 },
            capabilities: ['general', 'coding', 'chat']
          },
          ...customAI.models?.openai
        },
        
        // Anthropic models
        anthropic: {
          'claude-3-opus': {
            provider: 'anthropic',
            maxTokens: 200000,
            temperature: 0.7,
            cost: { input: 0.015, output: 0.075 },
            capabilities: ['reasoning', 'coding', 'analysis', 'vision']
          },
          'claude-3-sonnet': {
            provider: 'anthropic',
            maxTokens: 200000,
            temperature: 0.7,
            cost: { input: 0.003, output: 0.015 },
            capabilities: ['general', 'coding', 'analysis']
          },
          'claude-3-haiku': {
            provider: 'anthropic',
            maxTokens: 200000,
            temperature: 0.7,
            cost: { input: 0.00025, output: 0.00125 },
            capabilities: ['general', 'fast', 'chat']
          },
          ...customAI.models?.anthropic
        },
        
        // Open source models
        opensource: {
          'llama-3': {
            provider: 'local',
            maxTokens: 8192,
            temperature: 0.7,
            cost: { input: 0, output: 0 },
            capabilities: ['general', 'coding']
          },
          'mistral-7b': {
            provider: 'local',
            maxTokens: 4096,
            temperature: 0.7,
            cost: { input: 0, output: 0 },
            capabilities: ['general', 'fast']
          },
          'qwen-coder': {
            provider: 'local',
            maxTokens: 8192,
            temperature: 0.3,
            cost: { input: 0, output: 0 },
            capabilities: ['coding', 'technical']
          },
          'deepseek-r1': {
            provider: 'local',
            maxTokens: 16384,
            temperature: 0.5,
            cost: { input: 0, output: 0 },
            capabilities: ['reasoning', 'analysis']
          },
          ...customAI.models?.opensource
        },
        
        // Offline mode (no API)
        offline: {
          provider: 'none',
          maxTokens: 0,
          temperature: 0,
          cost: { input: 0, output: 0 },
          capabilities: ['templates', 'patterns', 'offline']
        }
      },
      
      // Model selection strategy
      selection: {
        strategy: customAI.selection?.strategy || 'capability', // capability, cost, speed, quality
        preferences: {
          reasoning: ['claude-3-opus', 'gpt-4', 'deepseek-r1'],
          coding: ['qwen-coder', 'gpt-4', 'claude-3-opus'],
          general: ['gpt-3.5-turbo', 'claude-3-haiku', 'mistral-7b'],
          vision: ['claude-3-opus', 'gpt-4'],
          ...customAI.selection?.preferences
        },
        fallback: customAI.selection?.fallback || 'offline',
        maxCostPerRequest: customAI.selection?.maxCostPerRequest || 1.0
      },
      
      // Prompt engineering
      prompts: {
        systemPromptTemplate: customAI.prompts?.systemPromptTemplate || 
          'You are a helpful AI assistant specialized in {specialty}. {context}',
        maxSystemPromptLength: customAI.prompts?.maxSystemPromptLength || 2000,
        includeContext: customAI.prompts?.includeContext !== false,
        includeExamples: customAI.prompts?.includeExamples || false,
        templates: {
          analysis: 'Analyze the following {type}: {content}',
          implementation: 'Implement {task} with the following requirements: {requirements}',
          review: 'Review the following {type} for {criteria}: {content}',
          ...customAI.prompts?.templates
        }
      },
      
      // Response processing
      response: {
        format: customAI.response?.format || 'structured', // structured, markdown, json, plain
        maxRetries: customAI.response?.maxRetries || 3,
        validateJson: customAI.response?.validateJson || false,
        extractCode: customAI.response?.extractCode || true,
        cleanupMarkdown: customAI.response?.cleanupMarkdown !== false
      },
      
      // Context management
      context: {
        maxContextLength: customAI.context?.maxContextLength || 100000,
        compressionEnabled: customAI.context?.compressionEnabled !== false,
        compressionRatio: customAI.context?.compressionRatio || 0.7,
        includeHistory: customAI.context?.includeHistory || false,
        historyLimit: customAI.context?.historyLimit || 10
      },
      
      // Embeddings
      embeddings: {
        enabled: customAI.embeddings?.enabled || false,
        model: customAI.embeddings?.model || 'text-embedding-3-small',
        dimension: customAI.embeddings?.dimension || 1536,
        storage: customAI.embeddings?.storage || 'memory', // memory, pinecone, postgres
        similarity: customAI.embeddings?.similarity || 'cosine'
      },
      
      // Fine-tuning
      fineTuning: {
        enabled: customAI.fineTuning?.enabled || false,
        baseModel: customAI.fineTuning?.baseModel,
        dataPath: customAI.fineTuning?.dataPath,
        epochs: customAI.fineTuning?.epochs || 3,
        batchSize: customAI.fineTuning?.batchSize || 4
      },
      
      // Safety & moderation
      safety: {
        enabled: customAI.safety?.enabled !== false,
        filterHarmful: customAI.safety?.filterHarmful !== false,
        maxOutputLength: customAI.safety?.maxOutputLength || 10000,
        blockPatterns: customAI.safety?.blockPatterns || [],
        moderationThreshold: customAI.safety?.moderationThreshold || 0.8
      },
      
      // Cost management
      cost: {
        trackUsage: customAI.cost?.trackUsage !== false,
        dailyLimit: customAI.cost?.dailyLimit || 100,
        monthlyLimit: customAI.cost?.monthlyLimit || 1000,
        alertThreshold: customAI.cost?.alertThreshold || 0.8,
        optimizeCost: customAI.cost?.optimizeCost !== false
      }
    };
  }
};
/**
 * BUMBA Specialized Model Profiles
 * Optimized configurations for DeepSeek R1 and Qwen 3 Coder models
 */

const { logger } = require('../logging/bumba-logger');

/**
 * Model specialization profiles for optimal task routing
 */
class SpecializedModelProfiles {
  constructor() {
    // DeepSeek R1 - Advanced Reasoning Model
    this.deepseekProfiles = {
      'deepseek-r1': {
        id: 'deepseek/deepseek-r1',
        name: 'DeepSeek R1',
        specialization: 'reasoning',
        strengths: [
          'complex-reasoning',
          'mathematical-proofs',
          'logical-deduction',
          'step-by-step-analysis',
          'problem-decomposition',
          'chain-of-thought',
          'critical-thinking'
        ],
        optimalTasks: [
          'algorithm-design',
          'architecture-planning',
          'system-analysis',
          'debugging-complex-issues',
          'optimization-problems',
          'strategic-planning',
          'root-cause-analysis'
        ],
        configuration: {
          temperature: 0.3, // Lower for logical reasoning
          maxTokens: 8192,
          topP: 0.95,
          contextWindow: 128000,
          quality: 'premium',
          speed: 'medium'
        },
        systemPrompt: `You are DeepSeek R1, an advanced reasoning model. 
Focus on step-by-step logical analysis, breaking down complex problems systematically. 
Use chain-of-thought reasoning and provide clear justifications for each conclusion.`
      },
      
      'deepseek-r1-distill': {
        id: 'deepseek/deepseek-r1-distill-qwen-32b',
        name: 'DeepSeek R1 Distilled',
        specialization: 'reasoning',
        strengths: [
          'fast-reasoning',
          'efficient-analysis',
          'quick-problem-solving',
          'balanced-performance'
        ],
        optimalTasks: [
          'code-review',
          'quick-analysis',
          'validation-checks',
          'test-generation',
          'documentation-review'
        ],
        configuration: {
          temperature: 0.4,
          maxTokens: 4096,
          topP: 0.9,
          contextWindow: 32000,
          quality: 'balanced',
          speed: 'fast'
        },
        systemPrompt: `You are DeepSeek R1 Distilled, optimized for efficient reasoning. 
Provide quick but thorough analysis, focusing on key insights and actionable conclusions.`
      }
    };
    
    // Qwen 3 Coder - Specialized Coding Model
    this.qwenProfiles = {
      'qwen-coder-32b': {
        id: 'qwen/qwen-2.5-coder-32b-instruct',
        name: 'Qwen 2.5 Coder 32B',
        specialization: 'coding',
        strengths: [
          'code-generation',
          'code-completion',
          'refactoring',
          'bug-fixing',
          'code-optimization',
          'multi-language-support',
          'test-writing',
          'api-design'
        ],
        optimalTasks: [
          'feature-implementation',
          'code-refactoring',
          'bug-fixes',
          'test-generation',
          'api-development',
          'code-review',
          'performance-optimization',
          'migration-scripts'
        ],
        supportedLanguages: [
          'javascript', 'typescript', 'python', 'java', 'c++',
          'go', 'rust', 'ruby', 'php', 'swift', 'kotlin',
          'sql', 'bash', 'powershell', 'html', 'css'
        ],
        configuration: {
          temperature: 0.2, // Lower for code accuracy
          maxTokens: 8192,
          topP: 0.95,
          contextWindow: 32768,
          quality: 'premium',
          speed: 'medium',
          stopSequences: ['```', '</code>']
        },
        systemPrompt: `You are Qwen Coder, a specialized coding assistant. 
Generate clean, efficient, and well-documented code following best practices. 
Include error handling, type safety, and consider edge cases. 
Always provide working, production-ready code.`
      },
      
      'qwq-32b': {
        id: 'qwen/qwq-32b-preview',
        name: 'QwQ 32B Preview',
        specialization: 'reasoning',
        strengths: [
          'analytical-reasoning',
          'problem-solving',
          'code-analysis',
          'architectural-thinking',
          'technical-writing'
        ],
        optimalTasks: [
          'code-analysis',
          'architecture-review',
          'technical-documentation',
          'problem-diagnosis',
          'solution-design'
        ],
        configuration: {
          temperature: 0.5,
          maxTokens: 6000,
          topP: 0.9,
          contextWindow: 32768,
          quality: 'balanced',
          speed: 'medium'
        },
        systemPrompt: `You are QwQ, focused on analytical reasoning and problem-solving. 
Combine logical analysis with practical solutions. 
Provide clear explanations and actionable recommendations.`
      }
    };
    
    // Combined profile mapping
    this.allProfiles = {
      ...this.deepseekProfiles,
      ...this.qwenProfiles
    };
    
    // Task to model mapping
    this.taskModelMapping = {
      // Reasoning-heavy tasks → DeepSeek R1
      'algorithm-design': 'deepseek-r1',
      'architecture-planning': 'deepseek-r1',
      'complex-debugging': 'deepseek-r1',
      'optimization': 'deepseek-r1',
      'proof-verification': 'deepseek-r1',
      
      // Coding tasks → Qwen Coder
      'code-generation': 'qwen-coder-32b',
      'feature-implementation': 'qwen-coder-32b',
      'refactoring': 'qwen-coder-32b',
      'test-writing': 'qwen-coder-32b',
      'api-development': 'qwen-coder-32b',
      
      // Balanced tasks → Distilled/Preview models
      'code-review': 'deepseek-r1-distill',
      'quick-analysis': 'deepseek-r1-distill',
      'documentation': 'qwq-32b',
      'technical-writing': 'qwq-32b'
    };
  }
  
  /**
   * Get optimal model for a specific task
   */
  getOptimalModel(task, requirements = {}) {
    // Check if task has direct mapping
    const taskType = this.identifyTaskType(task);
    
    if (this.taskModelMapping[taskType]) {
      const profileKey = this.taskModelMapping[taskType];
      return this.allProfiles[profileKey];
    }
    
    // Analyze task content for best match
    return this.analyzeAndSelectModel(task, requirements);
  }
  
  /**
   * Identify task type from description
   */
  identifyTaskType(task) {
    const taskLower = task.toLowerCase();
    
    // Reasoning indicators
    if (taskLower.includes('algorithm') || taskLower.includes('optimize') ||
        taskLower.includes('analyze') || taskLower.includes('debug') ||
        taskLower.includes('architect') || taskLower.includes('design system')) {
      return 'reasoning';
    }
    
    // Coding indicators
    if (taskLower.includes('implement') || taskLower.includes('code') ||
        taskLower.includes('function') || taskLower.includes('class') ||
        taskLower.includes('api') || taskLower.includes('refactor')) {
      return 'coding';
    }
    
    // Review/Analysis
    if (taskLower.includes('review') || taskLower.includes('check') ||
        taskLower.includes('validate') || taskLower.includes('test')) {
      return 'review';
    }
    
    return 'general';
  }
  
  /**
   * Analyze task and select best model
   */
  analyzeAndSelectModel(task, requirements) {
    const taskType = this.identifyTaskType(task);
    
    // For reasoning tasks
    if (taskType === 'reasoning') {
      // Use premium DeepSeek R1 for complex reasoning
      if (requirements.quality === 'premium' || task.includes('complex')) {
        return this.deepseekProfiles['deepseek-r1'];
      }
      // Use distilled version for faster reasoning
      return this.deepseekProfiles['deepseek-r1-distill'];
    }
    
    // For coding tasks
    if (taskType === 'coding') {
      return this.qwenProfiles['qwen-coder-32b'];
    }
    
    // For review/analysis tasks
    if (taskType === 'review') {
      // Quick reviews with distilled model
      if (requirements.speed === 'fast') {
        return this.deepseekProfiles['deepseek-r1-distill'];
      }
      // Thorough reviews with QwQ
      return this.qwenProfiles['qwq-32b'];
    }
    
    // Default to balanced model
    return this.qwenProfiles['qwq-32b'];
  }
  
  /**
   * Create parallel task configuration for specialized models
   */
  createParallelTasks(objective, options = {}) {
    const tasks = [];
    
    // Reasoning task with DeepSeek R1
    tasks.push({
      agent: 'reasoning-specialist',
      model: 'openrouter/deepseek/deepseek-r1',
      prompt: `Analyze and break down this problem: ${objective}`,
      systemPrompt: this.deepseekProfiles['deepseek-r1'].systemPrompt,
      config: this.deepseekProfiles['deepseek-r1'].configuration
    });
    
    // Coding task with Qwen Coder
    tasks.push({
      agent: 'coding-specialist',
      model: 'openrouter/qwen/qwen-2.5-coder-32b-instruct',
      prompt: `Implement a solution for: ${objective}`,
      systemPrompt: this.qwenProfiles['qwen-coder-32b'].systemPrompt,
      config: this.qwenProfiles['qwen-coder-32b'].configuration
    });
    
    // Review task with QwQ
    tasks.push({
      agent: 'review-specialist',
      model: 'openrouter/qwen/qwq-32b-preview',
      prompt: `Review and validate the approach for: ${objective}`,
      systemPrompt: this.qwenProfiles['qwq-32b'].systemPrompt,
      config: this.qwenProfiles['qwq-32b'].configuration
    });
    
    // Quick validation with distilled model
    if (options.includeValidation) {
      tasks.push({
        agent: 'validation-specialist',
        model: 'openrouter/deepseek/deepseek-r1-distill-qwen-32b',
        prompt: `Quickly validate the solution for: ${objective}`,
        systemPrompt: this.deepseekProfiles['deepseek-r1-distill'].systemPrompt,
        config: this.deepseekProfiles['deepseek-r1-distill'].configuration
      });
    }
    
    return tasks;
  }
  
  /**
   * Get configuration for agent type
   */
  getAgentConfiguration(agentType) {
    const configurations = {
      // Reasoning agents use DeepSeek
      'architect': this.deepseekProfiles['deepseek-r1'],
      'strategist': this.deepseekProfiles['deepseek-r1'],
      'analyzer': this.deepseekProfiles['deepseek-r1'],
      'debugger': this.deepseekProfiles['deepseek-r1'],
      
      // Coding agents use Qwen Coder
      'developer': this.qwenProfiles['qwen-coder-32b'],
      'coder': this.qwenProfiles['qwen-coder-32b'],
      'implementer': this.qwenProfiles['qwen-coder-32b'],
      'refactorer': this.qwenProfiles['qwen-coder-32b'],
      
      // Review agents use balanced models
      'reviewer': this.qwenProfiles['qwq-32b'],
      'validator': this.deepseekProfiles['deepseek-r1-distill'],
      'tester': this.deepseekProfiles['deepseek-r1-distill'],
      
      // Default
      'default': this.qwenProfiles['qwq-32b']
    };
    
    return configurations[agentType] || configurations.default;
  }
  
  /**
   * Optimize task distribution across specialized models
   */
  optimizeTaskDistribution(tasks) {
    return tasks.map(task => {
      const optimalModel = this.getOptimalModel(task.prompt || task.description);
      
      return {
        ...task,
        model: optimalModel.id,
        config: optimalModel.configuration,
        systemPrompt: task.systemPrompt || optimalModel.systemPrompt
      };
    });
  }
  
  /**
   * Get specialized swarm configuration
   */
  getSpecializedSwarm() {
    return {
      // DeepSeek for analytical reasoning
      analytical: {
        model: 'openrouter/deepseek/deepseek-r1',
        prompt: 'Provide deep analytical reasoning',
        config: this.deepseekProfiles['deepseek-r1'].configuration
      },
      
      // Qwen Coder for implementation
      implementation: {
        model: 'openrouter/qwen/qwen-2.5-coder-32b-instruct',
        prompt: 'Provide practical implementation',
        config: this.qwenProfiles['qwen-coder-32b'].configuration
      },
      
      // QwQ for balanced analysis
      balanced: {
        model: 'openrouter/qwen/qwq-32b-preview',
        prompt: 'Provide balanced technical analysis',
        config: this.qwenProfiles['qwq-32b'].configuration
      },
      
      // Distilled for quick validation
      validation: {
        model: 'openrouter/deepseek/deepseek-r1-distill-qwen-32b',
        prompt: 'Quickly validate the approach',
        config: this.deepseekProfiles['deepseek-r1-distill'].configuration
      }
    };
  }
  
  /**
   * Get metrics for model usage
   */
  getModelMetrics() {
    return {
      deepseekR1: {
        optimalFor: 'Complex reasoning, architecture, optimization',
        costPerMillion: 0.14, // $0.14 per million tokens (estimated)
        speed: 'medium',
        quality: 'premium'
      },
      deepseekDistilled: {
        optimalFor: 'Quick analysis, validation, review',
        costPerMillion: 0.07, // $0.07 per million tokens (estimated)
        speed: 'fast',
        quality: 'balanced'
      },
      qwenCoder: {
        optimalFor: 'Code generation, refactoring, implementation',
        costPerMillion: 0.10, // $0.10 per million tokens (estimated)
        speed: 'medium',
        quality: 'premium'
      },
      qwq: {
        optimalFor: 'Technical analysis, documentation, review',
        costPerMillion: 0.08, // $0.08 per million tokens (estimated)
        speed: 'medium',
        quality: 'balanced'
      }
    };
  }
}

// Singleton instance
let instance = null;

module.exports = {
  SpecializedModelProfiles,
  getInstance: () => {
    if (!instance) {
      instance = new SpecializedModelProfiles();
    }
    return instance;
  }
};
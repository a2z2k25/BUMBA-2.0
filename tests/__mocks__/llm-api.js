/**
 * Mock LLM APIs for testing
 * Simulates OpenAI, Anthropic, and Google AI responses
 */

// Mock OpenAI Client
class MockOpenAI {
  constructor(config = {}) {
    this.apiKey = config.apiKey || 'mock-openai-key';
    this.chat = {
      completions: new MockChatCompletions('openai')
    };
    this.embeddings = new MockEmbeddings();
  }
}

// Mock Anthropic Client
class MockAnthropic {
  constructor(config = {}) {
    this.apiKey = config.apiKey || 'mock-anthropic-key';
    this.messages = new MockMessages('anthropic');
  }
}

// Mock Google Generative AI
class MockGoogleGenerativeAI {
  constructor(apiKey) {
    this.apiKey = apiKey || 'mock-google-key';
  }

  getGenerativeModel(config) {
    return new MockGeminiModel(config.model);
  }
}

// Mock Chat Completions for OpenAI
class MockChatCompletions {
  constructor(provider = 'openai') {
    this.provider = provider;
  }

  async create(params) {
    await this.simulateLatency();
    
    return {
      id: 'mock-completion-' + Date.now(),
      object: 'chat.completion',
      created: Date.now(),
      model: params.model || 'gpt-4',
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: this.generateMockResponse(params.messages)
          },
          finish_reason: 'stop'
        }
      ],
      usage: {
        prompt_tokens: 100,
        completion_tokens: 50,
        total_tokens: 150
      }
    };
  }

  generateMockResponse(messages) {
    const lastMessage = messages[messages.length - 1];
    const content = lastMessage.content.toLowerCase();

    // Generate contextual mock responses
    if (content.includes('implement')) {
      return 'I\'ll implement that feature using best practices. Here\'s the code:\n```javascript\nfunction mockImplementation() {\n  return "Implementation complete";\n}\n```';
    } else if (content.includes('analyze')) {
      return 'Analysis complete. Found 3 areas for improvement:\n1. Performance optimization needed\n2. Security enhancements recommended\n3. Code documentation should be added';
    } else if (content.includes('test')) {
      return 'Test suite created with 10 test cases covering all scenarios.';
    } else {
      return 'Mock response for: ' + lastMessage.content.substring(0, 50);
    }
  }

  async simulateLatency() {
    // Simulate API latency (10-100ms)
    const delay = Math.random() * 90 + 10;
    return new Promise(resolve => setTimeout(resolve, delay));
  }
}

// Mock Messages for Anthropic
class MockMessages {
  constructor(provider = 'anthropic') {
    this.provider = provider;
  }

  async create(params) {
    await this.simulateLatency();

    return {
      id: 'msg-' + Date.now(),
      type: 'message',
      role: 'assistant',
      content: [
        {
          type: 'text',
          text: this.generateMockResponse(params.messages)
        }
      ],
      model: params.model || 'claude-3-opus-20240229',
      stop_reason: 'end_turn',
      usage: {
        input_tokens: 100,
        output_tokens: 50
      }
    };
  }

  generateMockResponse(messages) {
    const lastMessage = messages[messages.length - 1];
    const content = lastMessage.content.toLowerCase();

    if (content.includes('complex')) {
      return 'I\'ll break this down into manageable steps:\n\n1. First, we\'ll establish the foundation\n2. Then implement core functionality\n3. Finally, add optimizations\n\nLet me start with step 1...';
    } else if (content.includes('explain')) {
      return 'Here\'s a detailed explanation:\n\nThe concept works by leveraging multiple patterns that interact to create an emergent behavior. This approach ensures scalability while maintaining simplicity.';
    } else {
      return 'Claude mock response for: ' + lastMessage.content.substring(0, 50);
    }
  }

  async simulateLatency() {
    const delay = Math.random() * 90 + 10;
    return new Promise(resolve => setTimeout(resolve, delay));
  }
}

// Mock Gemini Model
class MockGeminiModel {
  constructor(modelName) {
    this.model = modelName || 'gemini-pro';
  }

  async generateContent(prompt) {
    await this.simulateLatency();

    return {
      response: {
        text: () => this.generateMockResponse(prompt),
        candidates: [
          {
            content: {
              parts: [
                { text: this.generateMockResponse(prompt) }
              ],
              role: 'model'
            },
            finishReason: 'STOP',
            safetyRatings: []
          }
        ]
      }
    };
  }

  generateMockResponse(prompt) {
    const content = prompt.toLowerCase();

    if (content.includes('creative')) {
      return 'Here\'s a creative solution that combines innovation with practicality...';
    } else if (content.includes('optimize')) {
      return 'Optimization strategy:\n- Reduce complexity\n- Improve caching\n- Parallelize operations';
    } else {
      return 'Gemini mock response for: ' + prompt.substring(0, 50);
    }
  }

  async simulateLatency() {
    const delay = Math.random() * 90 + 10;
    return new Promise(resolve => setTimeout(resolve, delay));
  }
}

// Mock Embeddings for vector operations
class MockEmbeddings {
  async create(params) {
    return {
      object: 'list',
      data: params.input.map((text, i) => ({
        object: 'embedding',
        index: i,
        embedding: this.generateMockEmbedding()
      })),
      model: params.model || 'text-embedding-ada-002',
      usage: {
        prompt_tokens: params.input.join(' ').split(' ').length * 2,
        total_tokens: params.input.join(' ').split(' ').length * 2
      }
    };
  }

  generateMockEmbedding() {
    // Generate a mock 1536-dimensional embedding vector
    return Array(1536).fill(0).map(() => Math.random() * 2 - 1);
  }
}

// Mock error classes
class MockAPIError extends Error {
  constructor(message, code, status) {
    super(message);
    this.code = code;
    this.status = status;
    this.name = 'APIError';
  }
}

// Unified mock factory
function createMockLLM(provider, config = {}) {
  switch (provider) {
    case 'openai':
      return new MockOpenAI(config);
    case 'anthropic':
      return new MockAnthropic(config);
    case 'google':
      return new MockGoogleGenerativeAI(config.apiKey);
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

// Cost tracker mock
class MockCostTracker {
  constructor() {
    this.costs = {
      daily: 0,
      monthly: 0,
      total: 0
    };
  }

  trackUsage(provider, tokens) {
    const costPerToken = {
      openai: 0.00003,
      anthropic: 0.00002,
      google: 0.00001
    };

    const cost = tokens * (costPerToken[provider] || 0.00002);
    this.costs.daily += cost;
    this.costs.monthly += cost;
    this.costs.total += cost;

    return {
      cost,
      dailyTotal: this.costs.daily,
      monthlyTotal: this.costs.monthly
    };
  }

  getCostBreakdown() {
    return {
      daily: this.costs.daily.toFixed(4),
      monthly: this.costs.monthly.toFixed(4),
      total: this.costs.total.toFixed(4),
      currency: 'USD'
    };
  }

  reset() {
    this.costs = { daily: 0, monthly: 0, total: 0 };
  }
}

module.exports = {
  MockOpenAI,
  MockAnthropic,
  MockGoogleGenerativeAI,
  MockAPIError,
  MockCostTracker,
  createMockLLM,
  // Individual exports for specific imports
  OpenAI: MockOpenAI,
  Anthropic: MockAnthropic,
  GoogleGenerativeAI: MockGoogleGenerativeAI
};
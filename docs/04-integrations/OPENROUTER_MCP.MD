# OpenRouter MCP Integration Guide

## Overview
OpenRouter MCP integration provides BUMBA with access to 200+ AI models through a unified interface, enabling intelligent model selection, cost optimization, and automatic fallback routing.

## Features

### 🟢 Intelligent Model Selection
- Automatic selection based on task requirements
- Cost, speed, and quality optimization
- Capability-based filtering (vision, function calling, JSON mode)

### 🟢 Cost Optimization
- Real-time cost tracking per model
- Budget constraints enforcement
- Automatic routing to cheaper alternatives

### 🟢 Fallback Routing
- Automatic failover when models are unavailable
- Multi-provider redundancy
- Graceful degradation

### 🟢 Multi-Provider Access
Single API for models from:
- OpenAI (GPT-4, GPT-3.5)
- Anthropic (Claude 3 Opus, Sonnet, Haiku)
- Google (Gemini Pro, Gemini Ultra)
- Meta (Llama 3 70B, 405B)
- Mistral (Large, Medium, Small)
- Cohere (Command R+)
- Perplexity (Online models)
- 190+ additional models

## Installation

### 1. Get OpenRouter API Key
```bash
# Sign up at https://openrouter.ai
# Get your API key from dashboard
export OPENROUTER_API_KEY=your_openrouter_api_key_here
```

### 2. Install MCP Server (Optional)
```bash
# If using MCP server interface
npm install -g @openrouter/mcp-server
```

### 3. Configure BUMBA
```javascript
// bumba.config.js
module.exports = {
  mcp: {
    servers: {
      openrouter: {
        enabled: true,
        apiKey: process.env.OPENROUTER_API_KEY,
        defaultModel: 'auto', // or specific model
        preferences: {
          maxCost: 0.01, // Max $ per 1k tokens
          quality: 'balanced', // economy, balanced, premium
          speed: 'medium' // slow, medium, fast
        }
      }
    }
  }
};
```

## Usage Examples

### Basic Usage
```javascript
const { OpenRouterIntegration } = require('bumba/integrations');
const openrouter = OpenRouterIntegration.getInstance();

// Auto-select best model
const response = await openrouter.execute('Explain quantum computing', {
  maxCost: 0.005, // Max $0.005 per 1k tokens
  quality: 'balanced'
});
```

### With Specific Requirements
```javascript
// Request model with specific capabilities
const response = await openrouter.execute('Analyze this image', {
  capabilities: ['vision'],
  quality: 'premium',
  provider: 'openai' // Prefer OpenAI models
});
```

### Cost-Optimized Execution
```javascript
// Use cheapest available model
const response = await openrouter.execute('Simple task', {
  maxCost: 0.001,
  quality: 'economy',
  speed: 'fast'
});
```

### With BUMBA Commands
```bash
# Use OpenRouter for task execution
bumba implement --model openrouter/auto "Create user auth"

# Specify particular model
bumba analyze --model openrouter/gpt-4-turbo "Review code"

# Cost-optimized mode
bumba research --model openrouter/economy "Market trends"
```

## Integration with BUMBA Modes

### Parallel Execution
```javascript
// Use different models for different agents
const tasks = [
  { 
    agent: 'architect',
    prompt: 'Design system',
    model: 'openrouter/gpt-4' // Premium for architecture
  },
  { 
    agent: 'coder',
    prompt: 'Implement feature',
    model: 'openrouter/claude-instant' // Fast for coding
  },
  { 
    agent: 'reviewer',
    prompt: 'Review code',
    model: 'openrouter/llama-3-70b' // Cost-effective
  }
];

await parallelSystem.executeParallel(tasks);
```

### Supervision Mode
```javascript
// Use cheap models with Claude supervision
const config = {
  primaryModel: 'openrouter/llama-3-70b', // Cheap primary
  supervisorModel: 'claude', // Quality control
  openrouterConfig: {
    maxCost: 0.002,
    quality: 'economy'
  }
};
```

### Swarm Intelligence
```javascript
// Different models for different perspectives
const swarmConfig = {
  optimistic: 'openrouter/gpt-3.5-turbo',
  pessimistic: 'openrouter/mistral-large',
  analytical: 'openrouter/claude-3-sonnet',
  creative: 'openrouter/gemini-pro',
  pragmatic: 'openrouter/llama-3-70b'
};
```

## Model Selection Strategy

### Quality Tiers

#### Premium (Best quality, higher cost)
- GPT-4 Turbo
- Claude 3 Opus
- Gemini Ultra
- Best for: Critical decisions, complex reasoning

#### Balanced (Good quality, moderate cost)
- GPT-3.5 Turbo
- Claude 3 Sonnet
- Gemini Pro
- Llama 3 70B
- Best for: General tasks, standard features

#### Economy (Basic quality, lowest cost)
- Claude 3 Haiku
- Mistral Small
- Llama 3 8B
- Best for: Simple tasks, high volume

### Selection Algorithm
```javascript
// BUMBA's intelligent selection
1. Filter by requirements (capabilities, context length)
2. Filter by cost constraint
3. Score by quality/cost ratio
4. Select optimal model
5. Fall back if primary fails
```

## Cost Management

### Budget Controls
```javascript
// Set daily budget
openrouter.setDailyBudget(10.00); // $10/day

// Set per-task limits
const response = await openrouter.execute(prompt, {
  maxCost: 0.01, // Max $0.01 for this task
  maxTokens: 1000 // Token limit
});
```

### Cost Tracking
```javascript
// Get cost metrics
const metrics = openrouter.getMetrics();
console.log(`Total cost: $${metrics.totalCost}`);
console.log(`Average per request: $${metrics.averageCostPerRequest}`);
console.log('Top models by usage:', metrics.topModels);
```

## Advanced Features

### Model Routing
```javascript
// Specific routing strategies
const response = await openrouter.execute(prompt, {
  route: 'fallback', // auto, fallback, or model ID
  models: ['gpt-4', 'claude-3-opus'], // Considered models
  transforms: ['cache', 'moderate'] // Applied transforms
});
```

### Streaming Responses
```javascript
// Enable streaming for real-time output
const stream = await openrouter.execute(prompt, {
  stream: true,
  onToken: (token) => console.log(token)
});
```

### Function Calling
```javascript
// Use function calling with capable models
const response = await openrouter.execute(prompt, {
  functions: [{
    name: 'get_weather',
    parameters: { 
      type: 'object',
      properties: { location: { type: 'string' } }
    }
  }],
  functionCall: 'auto'
});
```

## Performance Optimization

### Caching
```javascript
// Enable response caching
const config = {
  cache: {
    enabled: true,
    ttl: 3600000, // 1 hour
    maxSize: 100
  }
};
```

### Parallel Model Execution
```javascript
// Execute same prompt on multiple models
const results = await Promise.all([
  openrouter.execute(prompt, { model: 'gpt-4' }),
  openrouter.execute(prompt, { model: 'claude-3' }),
  openrouter.execute(prompt, { model: 'gemini-pro' })
]);

// Compare and select best response
const best = selectBestResponse(results);
```

## Monitoring & Debugging

### Health Checks
```javascript
// Test connection
const status = await openrouter.testConnection();
console.log('OpenRouter status:', status);

// List available models
const models = openrouter.listModels({
  provider: 'openai',
  maxCost: 0.01
});
```

### Debug Logging
```bash
# Enable debug logging
export BUMBA_OPENROUTER_DEBUG=true
```

## Error Handling

### Automatic Fallbacks
```javascript
// Configure fallback chain
const config = {
  fallback: true,
  fallbackChain: [
    'gpt-4-turbo',
    'claude-3-opus',
    'gemini-pro',
    'llama-3-70b'
  ]
};
```

### Rate Limit Handling
```javascript
// Automatic retry with exponential backoff
const config = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000
};
```

## Best Practices

### 1. Model Selection
- Use `auto` routing for most tasks
- Specify models only when necessary
- Consider cost/quality tradeoffs

### 2. Cost Optimization
- Set budget limits
- Use economy models for simple tasks
- Reserve premium models for critical work

### 3. Performance
- Enable caching for repeated queries
- Use streaming for long responses
- Batch similar requests

### 4. Reliability
- Configure fallback models
- Set reasonable timeouts
- Monitor usage and costs

## Troubleshooting

### Common Issues

#### No models available
```bash
# Check API key
echo $OPENROUTER_API_KEY

# Test connection
node -e "require('bumba').testOpenRouter()"
```

#### High costs
```javascript
// Review model usage
const metrics = openrouter.getMetrics();
console.log('Model usage:', metrics.modelUsage);

// Switch to cheaper models
openrouter.config.preferences.quality = 'economy';
```

#### Slow responses
```javascript
// Use faster models
config.preferences.speed = 'fast';

// Reduce max tokens
config.maxTokens = 1000;
```

## API Reference

### Configuration Options
```javascript
{
  apiKey: string,           // OpenRouter API key
  baseUrl: string,          // API endpoint (default: https://openrouter.ai/api/v1)
  defaultModel: string,     // Default model or 'auto'
  maxRetries: number,       // Max retry attempts
  timeout: number,          // Request timeout (ms)
  preferences: {
    maxCost: number,        // Max $ per 1k tokens
    minSpeed: string,       // 'slow', 'medium', 'fast'
    quality: string,        // 'economy', 'balanced', 'premium'
    capabilities: string[]  // Required capabilities
  },
  cache: {
    enabled: boolean,       // Enable caching
    ttl: number,           // Cache TTL (ms)
    maxSize: number        // Max cache entries
  }
}
```

### Methods
```javascript
// Initialize connection
await openrouter.initialize()

// Execute prompt
await openrouter.execute(prompt, options)

// List models
openrouter.listModels(filter)

// Get metrics
openrouter.getMetrics()

// Test connection
await openrouter.testConnection()
```

## Resources

- [OpenRouter Documentation](https://openrouter.ai/docs)
- [Model Pricing](https://openrouter.ai/models)
- [API Reference](https://openrouter.ai/api)
- [BUMBA Integration Examples](https://github.com/bumba-ai/examples)

---
*OpenRouter MCP integration enables BUMBA to intelligently route requests across 200+ models for optimal cost, speed, and quality.*
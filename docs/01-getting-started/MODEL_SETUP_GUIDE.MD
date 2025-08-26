# BUMBA Model Setup Guide

## Quick Start - Complete Setup in 5 Minutes

This guide will help you set up OpenRouter and Kimi K2 models for the BUMBA framework, giving your AI agents access to 200+ models including the powerful Kimi K2 with 200K context window.

## Table of Contents
1. [Overview](#overview)
2. [OpenRouter Setup](#openrouter-setup)
3. [Kimi K2 Setup](#kimi-k2-setup)
4. [Environment Configuration](#environment-configuration)
5. [Testing Your Setup](#testing-your-setup)
6. [Model Selection Guide](#model-selection-guide)
7. [Cost Optimization](#cost-optimization)

## Overview

### Available Models Through This Setup
- **200+ Models via OpenRouter**: GPT-4, Claude 3, Gemini, Llama, Mistral, and more
- **Kimi K2 Models**: 
  - K2 Chat (200K context, $0.30/million tokens)
  - K2 Reasoning (200K context, $0.50/million tokens)

### Why This Setup?
- **Cost Savings**: 30-70% cheaper than using premium models directly
- **Flexibility**: Switch between models based on task requirements
- **Long Context**: K2 handles entire codebases (200K tokens)
- **No Vendor Lock-in**: Use multiple providers through one interface

## OpenRouter Setup

### Step 1: Create OpenRouter Account
1. Go to [https://openrouter.ai/](https://openrouter.ai/)
2. Sign up for a free account
3. Add credits ($5 minimum, pays for ~16,000 GPT-3.5 requests)

### Step 2: Get Your API Key
1. Navigate to [https://openrouter.ai/keys](https://openrouter.ai/keys)
2. Click "Create Key"
3. Name it "BUMBA Framework"
4. Copy the key (starts with `sk-or-...`)

### Step 3: Configure OpenRouter
Add to your `.env` file:
```bash
# OpenRouter Configuration
OPENROUTER_API_KEY=sk-or-your-key-here
OPENROUTER_SITE_URL=http://localhost:3000
OPENROUTER_SITE_NAME=BUMBA Framework
```

### Step 4: Install MCP Server (Optional)
If you want to use OpenRouter through MCP:
```bash
npm install @heltonteixeira/mcp-openrouter
```

Add to your MCP `settings.json`:
```json
{
  "mcpServers": {
    "openrouter": {
      "command": "npx",
      "args": ["@heltonteixeira/mcp-openrouter"],
      "env": {
        "OPENROUTER_API_KEY": "sk-or-your-key-here"
      }
    }
  }
}
```

## Kimi K2 Setup

### Option 1: Through OpenRouter (Easiest)
If you've already set up OpenRouter, Kimi K2 models are automatically available:
- `kimi/k2-chat` - For general tasks and long documents
- `kimi/k2-reasoning` - For complex reasoning and architecture

No additional setup needed!

### Option 2: Direct Kimi API (If Available)
If you have direct Kimi API access:
```bash
# Kimi Direct API Configuration
KIMI_API_KEY=your-kimi-api-key
KIMI_API_URL=https://api.kimi.ai/v1
KIMI_DEFAULT_MODEL=kimi-k2-chat
```

## Environment Configuration

### Complete `.env` Setup
Create or update your `.env` file in the BUMBA root directory:

```bash
# ============================================
# BUMBA Model Configuration
# ============================================

# OpenRouter - Access to 200+ Models
OPENROUTER_API_KEY=sk-or-your-key-here
OPENROUTER_SITE_URL=http://localhost:3000
OPENROUTER_SITE_NAME=BUMBA Framework

# Kimi K2 - 200K Context Window (Optional if using OpenRouter)
# KIMI_API_KEY=your-kimi-key-here
# KIMI_API_URL=https://api.kimi.ai/v1

# Model Selection Preferences
DEFAULT_MODEL_PROVIDER=openrouter
DEFAULT_MODEL=kimi/k2-chat
FALLBACK_MODEL=qwen/qwen-14b-chat

# Cost Limits (Optional)
DAILY_TOKEN_LIMIT=1000000
DAILY_COST_LIMIT=10.00
MODEL_SELECTION_MODE=balanced  # premium, balanced, or budget

# Performance Settings
MAX_CONCURRENT_REQUESTS=5
REQUEST_TIMEOUT=30000
ENABLE_RESPONSE_CACHE=true
```

### BUMBA Configuration
Update `bumba.config.js`:

```javascript
module.exports = {
  models: {
    providers: {
      openrouter: {
        enabled: true,
        apiKey: process.env.OPENROUTER_API_KEY,
        defaultModel: 'kimi/k2-chat',
        fallbackModel: 'qwen/qwen-14b-chat'
      },
      kimi: {
        enabled: !!process.env.KIMI_API_KEY,
        apiKey: process.env.KIMI_API_KEY,
        contextWindow: 200000
      }
    },
    selection: {
      mode: process.env.MODEL_SELECTION_MODE || 'balanced',
      maxCostPerRequest: 0.01,
      preferLongContext: true
    }
  }
};
```

## Testing Your Setup

### Step 1: Test Connection
Create `test-models.js`:

```javascript
const EnhancedModelSelector = require('./src/core/agents/enhanced-model-selector');

async function testSetup() {
  console.log('Testing BUMBA Model Setup...\n');
  
  const selector = new EnhancedModelSelector();
  const initialized = await selector.initialize();
  
  if (!initialized) {
    console.log('🔴 Setup incomplete. Please check your API keys.');
    return;
  }
  
  console.log('🏁 Model selector initialized\n');
  
  // Test model selection
  const model = selector.selectModelForAgent(
    'api-architect',
    'architecture',
    { contextLength: 50000 }
  );
  
  console.log('Selected model:', model);
  
  // Show available models
  const status = selector.getStatus();
  console.log('\nAvailable models:', status.availableModels.length);
  
  // Show cost comparison
  const costs = selector.getCostComparison('code-review', 10000);
  console.log('\nCost comparison for 10K tokens:');
  costs.recommendations.forEach(rec => {
    console.log(`  ${rec.tier}: ${rec.model} - $${rec.cost}`);
  });
}

testSetup();
```

Run the test:
```bash
node test-models.js
```

### Expected Output
```
Testing BUMBA Model Setup...

🏁 OpenRouter integration ready
🏁 Kimi K2 integration ready
🏁 Model selector initialized

Selected model: {
  id: 'kimi/k2-reasoning',
  provider: 'kimi',
  quality: 'excellent',
  available: true
}

Available models: 20

Cost comparison for 10K tokens:
  primary: deepseek/deepseek-coder - $0.0014
  fallback: kimi/k2-chat - $0.0030
  budget: qwen/qwen-14b-chat - $0.0027
```

## Model Selection Guide

### Best Models by Task

| Task | Recommended Model | Context | Cost/1M tokens |
|------|------------------|---------|----------------|
| **Architecture Design** | kimi/k2-reasoning | 200K | $0.50 |
| **Code Review** | deepseek/deepseek-coder | 32K | $0.14 |
| **Documentation** | kimi/k2-chat | 200K | $0.30 |
| **UI/UX Design** | anthropic/claude-3-opus | 200K | $15.00 |
| **API Design** | anthropic/claude-3-sonnet | 200K | $3.00 |
| **Testing** | kimi/k2-reasoning | 200K | $0.50 |
| **General Tasks** | qwen/qwen-14b-chat | 32K | $0.27 |

### When to Use Kimi K2

**Use K2 Chat for:**
- Processing large codebases
- Multi-file analysis
- Long document summarization
- Cross-reference tasks
- Fast responses needed

**Use K2 Reasoning for:**
- Architecture planning
- Complex problem solving
- Technical analysis
- Strategic decisions
- Code optimization

### Model Selection Logic

The framework automatically selects models based on:

1. **Context Length**: K2 for >100K tokens
2. **Task Type**: Specialized models for specific tasks
3. **Budget**: Cheaper alternatives when specified
4. **Speed Requirements**: Faster models for time-sensitive tasks
5. **Quality Needs**: Premium models for critical tasks

## Cost Optimization

### Automatic Cost Savings

The framework implements several cost-saving strategies:

1. **Smart Model Selection**: Uses cheaper models when appropriate
2. **Context-Aware**: Only uses expensive long-context models when needed
3. **Fallback Chain**: Automatically falls back to cheaper models if premium unavailable
4. **Caching**: Caches responses to avoid duplicate API calls

### Cost Examples

For a typical day of development (100 requests):

| Strategy | Models Used | Daily Cost | Savings |
|----------|------------|------------|---------|
| **Premium Only** | GPT-4, Claude Opus | $15.00 | - |
| **Balanced** | Mix of models | $5.00 | 67% |
| **Budget** | Qwen, DeepSeek | $1.50 | 90% |
| **With K2** | K2 + Qwen | $2.00 | 87% |

### Setting Cost Limits

In your `.env`:
```bash
# Daily limits
DAILY_COST_LIMIT=10.00
DAILY_TOKEN_LIMIT=1000000

# Per-request limits
MAX_COST_PER_REQUEST=0.10
MAX_TOKENS_PER_REQUEST=4000

# Model selection mode
MODEL_SELECTION_MODE=budget  # Forces cheaper models
```

## Troubleshooting

### Common Issues

**Issue**: "API key not configured"
```bash
# Check your .env file
cat .env | grep OPENROUTER_API_KEY
# Should show: OPENROUTER_API_KEY=sk-or-...
```

**Issue**: "Model not available"
```bash
# Verify OpenRouter credit balance
# Go to https://openrouter.ai/credits
```

**Issue**: "Context too long"
```javascript
// Use K2 for long contexts
const model = selector.selectModelForAgent(
  agentType,
  taskType,
  { contextLength: 150000 } // Will select K2
);
```

### Getting Help

1. **OpenRouter Support**: https://openrouter.ai/docs
2. **BUMBA Issues**: Create issue in repository
3. **Model Info**: Check model details at https://openrouter.ai/models

## Next Steps

1. 🏁 API keys configured in `.env`
2. 🏁 Test script runs successfully
3. 🏁 Models are being selected appropriately
4. 🟢 Start using enhanced model selection in BUMBA!

### Using in Your Code

```javascript
// In any BUMBA component
const selector = new EnhancedModelSelector();
await selector.initialize();

// Register the model selection hook
orchestrator.hooks.registerHandler('model:beforeSelection', 
  await selector.createModelSelectionHook()
);

// Models will now be automatically selected based on task and context!
```

## Summary

You now have access to:
- 🏁 200+ AI models through OpenRouter
- 🏁 Kimi K2 with 200K context window
- 🏁 Automatic model selection
- 🏁 30-70% cost savings
- 🏁 Intelligent fallback system

The BUMBA framework will automatically select the best model for each task, optimizing for cost, quality, and performance!

---

*Last Updated: January 2025*
*BUMBA Version: 2.0 with Enhanced Model Selection*
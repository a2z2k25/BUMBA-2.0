#!/usr/bin/env node

/**
 * BUMBA Model Integration Test
 * Tests OpenRouter and Kimi K2 integration
 */

const EnhancedModelSelector = require('./src/core/agents/enhanced-model-selector');

async function testModelIntegrations() {
  console.log('\n════════════════════════════════════════════════════════════');
  console.log('       BUMBA MODEL INTEGRATION TEST');
  console.log('════════════════════════════════════════════════════════════\n');

  const selector = new EnhancedModelSelector();
  
  // Test initialization
  console.log('🟢 Testing Model Provider Initialization...\n');
  const initialized = await selector.initialize();
  
  if (!initialized) {
    console.log('🟡  No model providers configured.');
    console.log('\n🟢 Setup Instructions:');
    const guide = selector.getSetupGuide();
    guide.quickStart.forEach(line => console.log(line));
    console.log('\nPlease configure at least one provider and try again.');
    return;
  }
  
  console.log('🏁 Model selector initialized successfully!\n');
  
  // Get status
  const status = selector.getStatus();
  
  console.log('🟢 Provider Status:\n');
  console.log('OpenRouter:');
  console.log(`  - Configured: ${status.providers.openRouter.configured ? '🏁' : '🔴'}`);
  console.log(`  - Models Available: ${status.providers.openRouter.availableModels || 0}`);
  
  console.log('\nKimi K2:');
  console.log(`  - Configured: ${status.providers.kimiK2.configured ? '🏁' : '🔴'}`);
  console.log(`  - Context Window: ${status.providers.kimiK2.contextWindow || 'N/A'} tokens`);
  
  // Test model selection for different scenarios
  console.log('\n🟢 Testing Model Selection...\n');
  
  const testCases = [
    {
      name: 'Architecture Design',
      agent: 'api-architect',
      task: 'architecture',
      requirements: { contextLength: 50000, quality: 'excellent' }
    },
    {
      name: 'Code Review',
      agent: 'security-specialist',
      task: 'code-review',
      requirements: { budget: 'normal', speed: 'fast' }
    },
    {
      name: 'Long Document Processing',
      agent: 'technical-writer',
      task: 'documentation',
      requirements: { contextLength: 150000 }
    },
    {
      name: 'Budget Task',
      agent: 'react-specialist',
      task: 'ui-design',
      requirements: { budget: 'low', speed: 'fast' }
    }
  ];
  
  testCases.forEach(test => {
    const model = selector.selectModelForAgent(
      test.agent,
      test.task,
      test.requirements
    );
    
    console.log(`${test.name}:`);
    console.log(`  Agent: ${test.agent}`);
    console.log(`  Task: ${test.task}`);
    console.log(`  Selected: ${model.id}`);
    console.log(`  Quality: ${model.quality}`);
    console.log(`  Speed: ${model.speed}`);
    console.log(`  Cost: $${model.cost}/1K tokens`);
    console.log(`  Available: ${model.available ? '🏁' : '🔴'}`);
    console.log('');
  });
  
  // Test cost comparison
  console.log('🟢 Cost Comparison Analysis:\n');
  
  const costAnalysis = selector.getCostComparison('code-review', 50000);
  console.log(`Task: ${costAnalysis.task}`);
  console.log(`Tokens: ${costAnalysis.estimatedTokens.toLocaleString()}`);
  console.log('\nOptions:');
  
  costAnalysis.recommendations.forEach(rec => {
    console.log(`  ${rec.tier.padEnd(10)} ${rec.model.padEnd(30)} $${rec.cost.padEnd(8)} ${rec.quality.padEnd(12)} (${rec.savings})`);
  });
  
  console.log(`\n🏁 Optimal Choice: ${costAnalysis.optimalChoice.model}`);
  
  // Show available models
  console.log('\n🟢 Available Models:\n');
  
  const available = selector.getAvailableModels();
  if (available.length === 0) {
    console.log('No models available. Please configure API keys.');
  } else {
    console.log(`Total: ${available.length} models\n`);
    
    // Group by provider
    const byProvider = {};
    available.forEach(model => {
      if (!byProvider[model.provider]) {
        byProvider[model.provider] = [];
      }
      byProvider[model.provider].push(model.id);
    });
    
    Object.entries(byProvider).forEach(([provider, models]) => {
      console.log(`${provider}: ${models.length} models`);
      if (provider === 'kimi') {
        models.forEach(m => console.log(`  - ${m} (200K context)`));
      } else {
        console.log(`  - ${models.slice(0, 5).join(', ')}${models.length > 5 ? '...' : ''}`);
      }
    });
  }
  
  // Show recommendations
  console.log('\n🟢 Model Recommendations:\n');
  
  const recommendations = status.recommendations || selector.getTopRecommendations();
  Object.entries(recommendations).forEach(([category, model]) => {
    console.log(`${category.padEnd(15)} ${model}`);
  });
  
  // Test the model selection hook
  console.log('\n🪝 Testing Model Selection Hook...\n');
  
  const hook = await selector.createModelSelectionHook();
  const context = {
    agentId: 'api-architect',
    taskType: 'architecture',
    requirements: {
      contextLength: 100000,
      estimatedTokens: 5000
    }
  };
  
  const result = await hook(context);
  console.log('Hook Result:');
  console.log(`  Selected Model: ${result.selectedModel}`);
  console.log(`  Estimated Cost: $${result.estimatedCost}`);
  
  // Summary
  console.log('\n════════════════════════════════════════════════════════════');
  console.log('                    TEST SUMMARY');
  console.log('════════════════════════════════════════════════════════════\n');
  
  const openRouterReady = status.providers.openRouter.configured;
  const kimiReady = status.providers.kimiK2.configured;
  const modelsAvailable = available.length > 0;
  
  console.log(`OpenRouter Integration: ${openRouterReady ? '🏁 Ready' : '🔴 Not Configured'}`);
  console.log(`Kimi K2 Integration: ${kimiReady ? '🏁 Ready' : '🔴 Not Configured'}`);
  console.log(`Models Available: ${modelsAvailable ? `🏁 ${available.length} models` : '🔴 None'}`);
  console.log(`Model Selection: ${modelsAvailable ? '🏁 Working' : '🟡 Using Defaults'}`);
  console.log(`Cost Optimization: ${modelsAvailable ? '🏁 Active' : '🟡 Limited'}`);
  
  if (!openRouterReady && !kimiReady) {
    console.log('\n🟢 Next Steps:');
    console.log('1. Set up OpenRouter API key (see docs/MODEL_SETUP_GUIDE.md)');
    console.log('2. Or configure Kimi K2 API access');
    console.log('3. Add keys to .env file');
    console.log('4. Run this test again');
  } else {
    console.log('\n🏁 Model integration is operational!');
    console.log('The BUMBA framework can now use enhanced model selection.');
  }
  
  console.log('\n════════════════════════════════════════════════════════════\n');
}

// Run the test
testModelIntegrations().catch(console.error);
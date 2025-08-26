# BUMBA Migration Guide - v2.0 to v2.1

## Upgrading to v2.1 - Universal Hook System

This guide helps you upgrade from BUMBA v2.0 to v2.1, which introduces the Universal Hook System and Dynamic Agent Lifecycle Management.

## Table of Contents

1. [Overview](#overview)
2. [Breaking Changes](#breaking-changes)
3. [New Features](#new-features)
4. [Migration Steps](#migration-steps)
5. [Hook System Integration](#hook-system-integration)
6. [Testing Your Migration](#testing-your-migration)
7. [Rollback Procedure](#rollback-procedure)

## Overview

BUMBA v2.1 is a major release that adds:
- **Universal Hook System**: 45+ extensibility points
- **Dynamic Lifecycle Management**: Complete agent lifecycle orchestration
- **Cost Optimization**: 30-40% automatic cost savings
- **Enhanced Resource Management**: Improved pooling and batching

The upgrade is designed to be backward compatible, but some configuration changes may be needed.

## Breaking Changes

### 1. Configuration File Location
- **Old**: Configuration scattered across multiple files
- **New**: Centralized in `/config/` directory
- **Action**: Move custom configs to `/config/custom/`

### 2. Hook System API
- **Old**: Limited event system with EventEmitter
- **New**: Universal hook system with priority-based execution
- **Action**: Update custom event handlers to use new hook API

### 3. Agent Lifecycle States
- **Old**: 3 states (idle, active, terminated)
- **New**: 6 states (idle, spawning, active, validating, deprecating, deprecated)
- **Action**: Update any code that checks agent states

## New Features

### Universal Hook System

Register custom hooks to extend functionality:

```javascript
// Old way (v2.0)
framework.on('agentSpawned', (agent) => {
  // Custom logic
});

// New way (v2.1)
orchestrator.hooks.registerHandler('lifecycle:afterTransition', async (context) => {
  if (context.currentState === 'active') {
    // Custom logic
  }
  return context;
});
```

### Cost Optimization

Automatic model selection based on task complexity:

```javascript
// Register cost optimization hook
orchestrator.hooks.registerHandler('model:evaluateCost', async (context) => {
  if (context.cost > 0.01) {
    context.suggestAlternative = true;
    context.reason = 'Cost optimization';
  }
  return context;
});
```

### Lifecycle Management

Full control over agent lifecycle:

```javascript
// Monitor state transitions
orchestrator.hooks.registerHandler('lifecycle:beforeTransition', async (context) => {
  console.log(`Agent ${context.agentId}: ${context.currentState} -> ${context.targetState}`);
  return context;
});
```

## Migration Steps

### Step 1: Backup Current Installation

```bash
# Backup your current BUMBA installation
cp -r /path/to/bumba /path/to/bumba-backup

# Export current configuration
/bumba:settings export > bumba-config-backup.json
```

### Step 2: Update Dependencies

```bash
# Update to v2.1
npm update bumba-framework@2.1.0

# Install new dependencies
npm install
```

### Step 3: Update Configuration

```bash
# Create new config directory structure
mkdir -p config/hooks
mkdir -p config/lifecycle
mkdir -p config/custom

# Move existing configs
mv *.config.js config/
```

### Step 4: Initialize Hook System

Create `config/hooks/index.js`:

```javascript
module.exports = {
  // Cost optimization hooks
  'model:evaluateCost': [
    {
      priority: 100,
      handler: require('./cost-optimizer')
    }
  ],
  
  // Team composition hooks
  'team:validateComposition': [
    {
      priority: 50,
      handler: require('./team-validator')
    }
  ],
  
  // Add your custom hooks here
};
```

### Step 5: Update Custom Code

If you have custom code that interacts with agents:

```javascript
// Old code (v2.0)
const agent = await framework.spawnAgent('specialist');
if (agent.state === 'active') {
  // Use agent
}

// New code (v2.1)
const agent = await orchestrator.spawnAgent('specialist');
if (agent.getState() === 'active') {
  // Use agent
}

// Or use hooks for state monitoring
orchestrator.hooks.registerHandler('lifecycle:afterTransition', async (context) => {
  if (context.agentId === agent.id && context.currentState === 'active') {
    // Agent is ready
  }
  return context;
});
```

### Step 6: Configure Cost Optimization

Set cost limits in `.env`:

```bash
# Daily and monthly limits
BUMBA_COST_LIMIT_DAILY=100
BUMBA_COST_LIMIT_MONTHLY=2000

# Enable aggressive optimization
BUMBA_COST_OPTIMIZATION_MODE=aggressive
```

### Step 7: Verify Installation

```bash
# Run verification script
node verify-hooks.js

# Check system health
/bumba:health --comprehensive

# View hook registration
/bumba:hooks list

# Test cost optimization
/bumba:cost test
```

## Hook System Integration

### Registering Hooks Programmatically

```javascript
const { DynamicAgentLifecycleOrchestrator } = require('./src/core/dynamic-agent-lifecycle-orchestrator');

const orchestrator = new DynamicAgentLifecycleOrchestrator();

// Register multiple hooks
orchestrator.registerHooks({
  'model:evaluateCost': async (context) => {
    // Your cost evaluation logic
    return context;
  },
  
  'team:modifyComposition': async (context) => {
    // Your team modification logic
    return context;
  },
  
  'lifecycle:beforeTransition': async (context) => {
    // Your transition validation logic
    return context;
  }
});
```

### Hook Priority System

Hooks execute in priority order (higher numbers first):

```javascript
// High priority - executes first
orchestrator.hooks.registerHandler('model:evaluateCost', costHandler, { priority: 100 });

// Medium priority
orchestrator.hooks.registerHandler('model:evaluateCost', loggingHandler, { priority: 50 });

// Low priority - executes last
orchestrator.hooks.registerHandler('model:evaluateCost', metricsHandler, { priority: 10 });
```

### Common Hook Patterns

#### Pattern 1: Cost Control

```javascript
// Enforce strict budget limits
orchestrator.hooks.registerHandler('orchestrator:budgetCheck', async (context) => {
  const dailyLimit = process.env.BUMBA_COST_LIMIT_DAILY || 100;
  const spent = await getCostToday();
  
  if (spent + context.estimatedCost > dailyLimit) {
    context.preventDefault = true;
    context.reason = 'Daily budget exceeded';
  }
  
  return context;
});
```

#### Pattern 2: Team Optimization

```javascript
// Right-size teams based on complexity
orchestrator.hooks.registerHandler('team:modifyComposition', async (context) => {
  const complexity = analyzeTaskComplexity(context.task);
  
  if (complexity === 'simple' && context.composition.members.length > 3) {
    context.modifications = {
      members: context.composition.members.slice(0, 3)
    };
  }
  
  return context;
});
```

#### Pattern 3: Knowledge Preservation

```javascript
// Save critical knowledge before deprecation
orchestrator.hooks.registerHandler('deprecation:before', async (context) => {
  const agent = getAgent(context.agentId);
  const knowledge = await agent.extractKnowledge();
  
  await saveToKnowledgeBase(knowledge);
  
  return context;
});
```

## Testing Your Migration

### 1. Unit Tests

```bash
# Run hook system tests
npm run test:hooks

# Run lifecycle tests
npm run test:lifecycle

# Run all tests
npm test
```

### 2. Integration Tests

```javascript
// test-migration.js
const { testHookSystem } = require('./tests/migration/hook-test');
const { testLifecycle } = require('./tests/migration/lifecycle-test');
const { testCostOptimization } = require('./tests/migration/cost-test');

async function runMigrationTests() {
  console.log('Testing hook system...');
  await testHookSystem();
  
  console.log('Testing lifecycle management...');
  await testLifecycle();
  
  console.log('Testing cost optimization...');
  await testCostOptimization();
  
  console.log('🏁 All migration tests passed!');
}

runMigrationTests().catch(console.error);
```

### 3. Performance Verification

```bash
# Benchmark hook overhead
/bumba:benchmark hooks

# Verify cost savings
/bumba:cost simulate --days=7

# Check resource usage
/bumba:metrics --detailed
```

## Rollback Procedure

If you need to rollback to v2.0:

### Step 1: Restore Backup

```bash
# Stop BUMBA
/bumba:shutdown

# Restore backup
rm -rf /path/to/bumba
cp -r /path/to/bumba-backup /path/to/bumba

# Restore configuration
/bumba:settings import < bumba-config-backup.json
```

### Step 2: Downgrade Package

```bash
# Downgrade to v2.0
npm install bumba-framework@2.0.0

# Reinstall dependencies
npm install
```

### Step 3: Restart

```bash
# Start BUMBA v2.0
npm start

# Verify version
/bumba:version
```

## Troubleshooting

### Issue: Hooks Not Firing

**Solution**: Verify hook registration:
```bash
/bumba:hooks list
/bumba:hooks test <hook-name>
```

### Issue: Performance Degradation

**Solution**: Check hook execution time:
```bash
/bumba:hooks profile
/bumba:settings set BUMBA_DEBUG_HOOKS=true
```

### Issue: Cost Optimization Not Working

**Solution**: Verify configuration:
```bash
/bumba:cost config
/bumba:cost test
```

### Issue: Agent State Errors

**Solution**: Check lifecycle configuration:
```bash
/bumba:lifecycle status
/bumba:lifecycle validate
```

## Getting Help

- **Documentation**: [docs/HOOKS.md](HOOKS.md)
- **Examples**: [examples/hooks/](../examples/hooks/)
- **Issues**: [GitHub Issues](https://github.com/bumba-ai/bumba/issues)
- **Discord**: [Community Support](https://discord.gg/bumba)

## Summary

The upgrade to BUMBA v2.1 brings powerful new capabilities while maintaining backward compatibility. The Universal Hook System enables unprecedented customization, while the Dynamic Lifecycle Management ensures efficient resource utilization. With automatic cost optimization, you can expect 30-40% savings on API costs.

Key benefits of upgrading:
- 🏁 30-40% cost savings through intelligent model selection
- 🏁 Complete control over agent lifecycle
- 🏁 45+ hook points for customization
- 🏁 Enhanced performance monitoring
- 🏁 Better resource management

Follow this guide step-by-step, test thoroughly, and enjoy the enhanced capabilities of BUMBA v2.1!
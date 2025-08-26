# BUMBA Hook System Documentation

## Overview

The BUMBA Hook System provides a unified, extensible mechanism for intercepting and enhancing framework operations. With **55+ hook points** across 7 categories, it enables deep customization and monitoring of all framework activities.

## Table of Contents

1. [Architecture](#architecture)
2. [Hook Categories](#hook-categories)
3. [Core Hooks](#core-hooks)
4. [Usage Guide](#usage-guide)
5. [Creating Custom Hooks](#creating-custom-hooks)
6. [Best Practices](#best-practices)
7. [API Reference](#api-reference)

## Architecture

```
┌─────────────────────────────────────┐
│       UnifiedHookSystem             │
├─────────────────────────────────────┤
│  ┌─────────────────────────────┐   │
│  │     Hook Categories         │   │
│  ├─────────────────────────────┤   │
│  │ • System Hooks              │   │
│  │ • Agent Hooks               │   │
│  │ • Learning Hooks            │   │
│  │ • Integration Hooks         │   │
│  │ • Lifecycle Hooks           │   │
│  │ • Quality Gate Hooks        │   │
│  │ • Execution Hooks           │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

## Hook Categories

### 1. System Hooks
Core framework operations and command execution.

- `before:command` - Pre-command validation
- `after:command` - Post-command logging
- `on:error` - Error handling

### 2. Agent Hooks
Agent lifecycle and coordination.

- `lifecycle:spawn` - Agent creation
- `lifecycle:activate` - Agent activation
- `lifecycle:deactivate` - Agent deactivation
- `lifecycle:destroy` - Agent destruction
- `lifecycle:transfer` - Knowledge transfer

### 3. Learning Hooks
Learning and optimization capabilities.

- `learning:capture` - Capture learning opportunities
- `learning:optimize` - Apply optimizations
- `learning:feedback` - Process feedback
- `learning:improve` - Continuous improvement

### 4. Integration Hooks
External service connections.

- `integration:connect` - Service connection
- `integration:sync` - Data synchronization
- `integration:bridge` - System bridging
- `integration:validate` - Integration validation
- `integration:disconnect` - Service disconnection

### 5. Lifecycle Hooks
Component lifecycle management.

- `spawn:beforeAgent` - Pre-spawn validation
- `spawn:afterAgent` - Post-spawn setup
- `destroy:beforeAgent` - Pre-destruction cleanup
- `destroy:afterAgent` - Post-destruction logging

### 6. Quality Gate Hooks
Quality assurance and validation.

- `validate:input` - Input validation
- `validate:output` - Output validation
- `check:quality` - Quality checks
- `verify:compliance` - Compliance verification

### 7. Execution Hooks
Pre/post execution control.

- `before:execute` - Pre-execution setup
- `after:execute` - Post-execution cleanup
- `before:task` - Task preparation
- `after:task` - Task completion

## Core Hooks

### UnifiedHookSystem

The main hook manager that coordinates all hook operations.

```javascript
const { UnifiedHookSystem } = require('./core/unified-hook-system');

const hooks = new UnifiedHookSystem({
  maxLogSize: 1000,
  hooksPath: './custom-hooks'
});
```

### IntegrationHooks

Manages external service integrations.

```javascript
const { IntegrationHooks } = require('./core/hooks/integration-hooks');

const integrationHooks = IntegrationHooks.getInstance();
await integrationHooks.initialize();
```

### LearningHooks

Provides learning and optimization capabilities.

```javascript
const { LearningHooks } = require('./core/integration/learning-hooks');

const learningHooks = new LearningHooks(consciousness);
await learningHooks.initialize();
```

## Usage Guide

### Basic Hook Registration

```javascript
// Register a simple hook
hooks.register('my:hook', async (context) => {
  console.log('Hook executed!', context);
  return { ...context, processed: true };
});

// Register with options
hooks.register('priority:hook', async (context) => {
  return context;
}, {
  category: 'custom',
  priority: 100,
  async: true
});
```

### Hook Execution

```javascript
// Execute a hook
const result = await hooks.execute('my:hook', {
  data: 'test'
});

// Execute with options
const result = await hooks.execute('my:hook', context, {
  timeout: 5000,
  parallel: false
});
```

### Hook Chains

```javascript
// Register multiple handlers for the same hook
hooks.register('chain:hook', async (context) => {
  context.step1 = true;
  return context;
});

hooks.register('chain:hook', async (context) => {
  context.step2 = true;
  return context;
});

// Both handlers will execute in priority order
const result = await hooks.execute('chain:hook', {});
// result will have both step1 and step2 set to true
```

### Error Handling

```javascript
hooks.register('safe:hook', async (context) => {
  if (!context.required) {
    throw new Error('Missing required field');
  }
  return context;
});

const result = await hooks.execute('safe:hook', {});
// result.errors will contain the error
// Execution continues for other hooks
```

## Creating Custom Hooks

### Step 1: Define Hook Points

```javascript
class CustomFeatureHooks {
  constructor() {
    this.hooks = new Map();
  }

  registerHooks() {
    this.hooks.set('feature:start', {
      before: async (context) => {
        // Pre-processing
        return context;
      },
      after: async (context, result) => {
        // Post-processing
        return result;
      },
      onError: async (context, error) => {
        // Error handling
        throw error;
      }
    });
  }
}
```

### Step 2: Integrate with UnifiedHookSystem

```javascript
const customHooks = new CustomFeatureHooks();
customHooks.registerHooks();

// Bridge to unified system
customHooks.hooks.forEach((config, name) => {
  unifiedHooks.register(name, config.before, {
    category: 'custom'
  });
});
```

### Step 3: Use in Your Code

```javascript
async function myFeature(data) {
  // Execute pre-hook
  const context = await hooks.execute('feature:start', { data });
  
  // Perform operation
  const result = await performOperation(context);
  
  // Execute post-hook
  return await hooks.execute('feature:complete', result);
}
```

## Best Practices

### 1. Hook Naming Convention
- Use colon separator: `category:action`
- Be descriptive: `integration:connect` not `int:conn`
- Use consistent tense: `before:save`, `after:save`

### 2. Context Management
- Always preserve original context
- Add new properties instead of replacing
- Document context structure

```javascript
hooks.register('good:hook', async (context) => {
  // Good: Preserve and extend
  return {
    ...context,
    newProperty: 'value'
  };
});
```

### 3. Error Handling
- Don't swallow errors silently
- Provide meaningful error messages
- Use error hooks for recovery

```javascript
hooks.register('error:handler', async (context) => {
  try {
    return await riskyOperation(context);
  } catch (error) {
    // Log and re-throw with context
    logger.error('Hook failed:', { context, error });
    throw new Error(`Hook failed: ${error.message}`);
  }
});
```

### 4. Performance
- Keep hooks lightweight
- Use async/await properly
- Consider parallel execution

```javascript
// Execute independent hooks in parallel
await hooks.execute('heavy:hook', context, {
  parallel: true,
  timeout: 10000
});
```

### 5. Testing
- Test hooks in isolation
- Mock dependencies
- Verify execution order

```javascript
describe('MyHook', () => {
  test('should process context', async () => {
    const hook = createHook();
    const result = await hook({ input: 'test' });
    expect(result.processed).toBe(true);
  });
});
```

## API Reference

### UnifiedHookSystem

#### Constructor
```javascript
new UnifiedHookSystem(config)
```

**Parameters:**
- `config.maxLogSize` (number): Maximum execution log size
- `config.hooksPath` (string): Path to custom hooks directory

#### Methods

##### register(name, handler, options)
Register a new hook handler.

**Parameters:**
- `name` (string): Hook name
- `handler` (function): Async function to handle the hook
- `options` (object):
  - `category` (string): Hook category
  - `priority` (number): Execution priority (higher = earlier)
  - `async` (boolean): Whether handler is async

##### execute(name, context, options)
Execute all handlers for a hook.

**Parameters:**
- `name` (string): Hook name
- `context` (object): Context to pass to handlers
- `options` (object):
  - `timeout` (number): Execution timeout in ms
  - `parallel` (boolean): Execute handlers in parallel

**Returns:** Promise<{ results: [], errors: [] }>

##### getHooksByCategory(category)
Get all hooks in a category.

**Parameters:**
- `category` (string): Category name

**Returns:** string[]

##### getExecutionLog()
Get recent hook execution history.

**Returns:** Array of execution records

### IntegrationHooks

#### Methods

##### executeHook(name, context)
Execute an integration hook.

**Parameters:**
- `name` (string): Hook name
- `context` (object): Hook context

**Returns:** Promise<result>

##### getStatus()
Get integration status.

**Returns:** Status object with hooks and integrations

##### getMetrics()
Get integration metrics.

**Returns:** Metrics object with counts and statistics

### LearningHooks

#### Methods

##### createHook(name, options)
Create a learning hook.

**Parameters:**
- `name` (string): Hook name
- `options` (object): Hook configuration

##### wrapWithLearning(fn, type, extractor)
Wrap a function with learning capabilities.

**Parameters:**
- `fn` (function): Function to wrap
- `type` (string): Experience type
- `extractor` (function): Context extractor

**Returns:** Wrapped function

## Examples

### Complete Integration Example

```javascript
const { UnifiedHookSystem } = require('./core/unified-hook-system');
const { IntegrationHooks } = require('./core/hooks/integration-hooks');

async function setupHooks() {
  // Initialize systems
  const hooks = new UnifiedHookSystem();
  const integrations = IntegrationHooks.getInstance();
  await integrations.initialize();
  
  // Register custom hook
  hooks.register('app:start', async (context) => {
    console.log('Application starting...');
    
    // Connect to services
    await integrations.executeHook('integration:connect', {
      service: 'database',
      credentials: process.env.DB_CREDENTIALS
    });
    
    return { ...context, initialized: true };
  });
  
  // Execute on app start
  await hooks.execute('app:start', {});
}
```

### Learning Integration Example

```javascript
const { LearningHooks } = require('./core/integration/learning-hooks');

async function setupLearning() {
  const learning = new LearningHooks(consciousness);
  await learning.initialize();
  
  // Wrap critical functions
  const enhancedFunction = learning.wrapWithLearning(
    originalFunction,
    'critical_operation',
    (args) => ({ input: args[0], timestamp: Date.now() })
  );
  
  // Use enhanced function
  const result = await enhancedFunction(data);
  // Learning data is automatically captured
}
```

## Troubleshooting

### Hook Not Executing
1. Check hook is registered: `hooks.hooks.has('hook:name')`
2. Verify category exists: `hooks.categories[category].has('hook:name')`
3. Check for errors: Look at `result.errors` after execution

### Performance Issues
1. Check hook execution time in logs
2. Use parallel execution for independent hooks
3. Optimize heavy operations in hooks

### Memory Leaks
1. Limit execution log size
2. Clean up event listeners
3. Avoid storing large objects in context

---

## Summary

The BUMBA Hook System provides:
- **55+ predefined hooks** across 7 categories
- **Extensible architecture** for custom hooks
- **Unified execution** with priority and error handling
- **Learning capabilities** for continuous improvement
- **Integration support** for external services
- **Comprehensive testing** and monitoring

For questions or contributions, please refer to the main BUMBA documentation.

---

*Last Updated: 2025-08-16*  
*Version: 1.0.0*
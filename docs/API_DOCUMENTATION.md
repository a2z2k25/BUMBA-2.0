# BUMBA CLI API Documentation

## Command Intelligence System API

### Core Components

#### 1. Command Router
**Location:** `/src/core/command-intelligence/command-router.js`

The central routing system that directs commands to appropriate departments and specialists.

```javascript
const router = require('./command-router').getInstance();

// Route a command
const result = await router.route(command, args, context);
```

**Methods:**
- `route(command, args, context)` - Routes command to appropriate handler
- `getDepartmentForCommand(command)` - Determines responsible department
- `executeWithDepartment(department, command, args, context)` - Executes with specific department
- `buildContext(command, args, context)` - Builds execution context

**Context Options:**
```javascript
{
  mode: 'full|lite|turbo|eco|DICE|executive',
  urgent: boolean,
  skipCache: boolean,
  limitSpecialists: number,
  department: 'product|design|backend',
  collaboration: boolean
}
```

#### 2. Specialist Selector
**Location:** `/src/core/command-intelligence/specialist-selector.js`

Intelligently selects and activates specialists based on command requirements.

```javascript
const selector = require('./specialist-selector').getInstance();

// Select specialists for command
const specialists = await selector.selectSpecialists(command, args, context);
```

**Methods:**
- `selectSpecialists(command, args, context)` - Selects optimal specialists
- `activateSpecialist(specialistId)` - Activates a specialist
- `deactivateSpecialist(specialistId)` - Deactivates a specialist
- `getSpecialistLoad(specialistId)` - Gets current specialist workload

#### 3. Intelligent Output Generator
**Location:** `/src/core/command-intelligence/intelligent-output-generator.js`

Generates intelligent, context-aware output based on specialist analysis.

```javascript
const generator = require('./intelligent-output-generator').getInstance();

// Generate output
const output = await generator.generateOutput(command, args, analysis, context);
```

**Methods:**
- `generateOutput(command, args, analysis, context)` - Generates intelligent output
- `createIntelligentContent(command, args, analysis, outputType)` - Creates content
- `determineOutputType(command)` - Determines output format
- `saveOutput(content, outputType, fileName)` - Saves to appropriate location

### Performance Optimization API

#### 1. Cache Manager
**Location:** `/src/core/command-intelligence/cache-manager.js`

Manages intelligent caching for improved performance.

```javascript
const cache = require('./cache-manager').getInstance();

// Cache command result
cache.cacheCommandResult(command, args, context, result);

// Get cached result
const cached = cache.getCachedCommandResult(command, args, context);
```

**Methods:**
- `get(key)` - Get cached value
- `set(key, data, ttl)` - Set cache entry with TTL
- `clear()` - Clear all cache
- `getStats()` - Get cache statistics

#### 2. Performance Monitor
**Location:** `/src/core/command-intelligence/performance-monitor.js`

Monitors and tracks performance metrics.

```javascript
const monitor = require('./performance-monitor').getInstance();

// Start timing
const commandId = monitor.startCommand(commandId, command, args, context);

// End timing
const metrics = monitor.endCommand(commandId, result);
```

**Methods:**
- `startCommand(commandId, command, args, context)` - Start timing
- `endCommand(commandId, result)` - End timing and record metrics
- `getBottlenecks()` - Identify performance bottlenecks
- `generateReport()` - Generate performance report

#### 3. Resource Optimizer
**Location:** `/src/core/command-intelligence/resource-optimizer.js`

Optimizes resource usage across the system.

```javascript
const optimizer = require('./resource-optimizer').getInstance();

// Optimize for command
const optimization = await optimizer.optimizeForCommand(command, args, context);
```

**Methods:**
- `optimizeForCommand(command, args, context)` - Pre-optimize resources
- `checkResourceStatus()` - Check current resource usage
- `getRecommendations()` - Get optimization recommendations
- `getStats()` - Get resource statistics

#### 4. Load Balancer
**Location:** `/src/core/command-intelligence/load-balancer.js`

Distributes work across specialists and departments.

```javascript
const balancer = require('./load-balancer').getInstance();

// Balance request
const result = await balancer.balance(request, context);
```

**Methods:**
- `balance(request, context)` - Balance request to optimal handler
- `queueRequest(request, requestInfo, context)` - Queue if no handler available
- `getStats()` - Get load balancing statistics

### Error Handling API

#### Unified Error Manager
**Location:** `/src/core/error-handling/unified-error-manager.js`

Centralized error handling and recovery.

```javascript
const errorManager = require('./unified-error-manager').getInstance();

// Handle error
const recovery = await errorManager.handleError(error, context);
```

**Methods:**
- `handleError(error, context)` - Handle and classify error
- `classifyError(error)` - Determine error type and severity
- `executeRecovery(classification, error, context)` - Execute recovery strategy
- `getErrorStats()` - Get error statistics

### Command Execution Modes

#### 1. Full Mode (Default)
Complete execution with all specialists and features.

```bash
bumba implement feature --mode full
```

#### 2. Lite Mode
Lightweight execution with minimal resources.

```bash
bumba analyze code --mode lite
```

#### 3. Turbo Mode
Parallel execution for maximum speed.

```bash
bumba build api --mode turbo
```

#### 4. Eco Mode
Resource-conscious execution.

```bash
bumba test suite --mode eco
```

#### 5. DICE Mode
Development, Innovation, Creativity, Excellence mode.

```bash
bumba design system --mode DICE
```

#### 6. Executive Mode
High-level strategic execution.

```bash
bumba roadmap product --mode executive
```

### Command Chaining API

Chain multiple commands with operators:

```bash
# Sequential execution
bumba analyze && bumba implement

# Conditional execution
bumba test || bumba debug

# Piped execution
bumba analyze | bumba report

# Transform execution
bumba data -> bumba visualize
```

### Multi-Agent Collaboration

Enable collaboration between departments:

```javascript
const result = await router.route('design-api', args, {
  collaboration: true,
  departments: ['design', 'backend']
});
```

### WebSocket API (Future)

Real-time command execution and monitoring:

```javascript
const ws = new WebSocket('ws://localhost:3000/bumba');

// Send command
ws.send(JSON.stringify({
  command: 'implement',
  args: ['feature'],
  context: { mode: 'turbo' }
}));

// Receive updates
ws.on('message', (data) => {
  const update = JSON.parse(data);
  console.log(update.status, update.progress);
});
```

### REST API (Future)

HTTP endpoints for command execution:

```http
POST /api/command
Content-Type: application/json

{
  "command": "prd",
  "args": ["new-feature"],
  "context": {
    "mode": "full",
    "department": "product"
  }
}
```

Response:
```json
{
  "success": true,
  "commandId": "cmd_123",
  "result": {
    "file": "/output/prd/new-feature-prd.md",
    "specialists": ["product-manager", "business-analyst"],
    "executionTime": 3500
  }
}
```

### Event System

Subscribe to system events:

```javascript
const events = require('./events');

// Subscribe to command events
events.on('command:start', (data) => {
  console.log('Command started:', data);
});

events.on('command:complete', (data) => {
  console.log('Command completed:', data);
});

events.on('specialist:activated', (specialist) => {
  console.log('Specialist activated:', specialist);
});
```

### Plugin API (Future)

Create custom plugins:

```javascript
module.exports = {
  name: 'custom-analyzer',
  version: '1.0.0',
  
  init(bumba) {
    bumba.registerCommand('custom-analyze', this.analyze);
    bumba.registerSpecialist('custom-specialist', this.specialist);
  },
  
  async analyze(args, context) {
    // Custom analysis logic
  },
  
  specialist: {
    skills: ['custom-analysis'],
    department: 'custom',
    execute: async (task) => {
      // Specialist logic
    }
  }
};
```

## Rate Limits and Quotas

- Maximum concurrent commands: 5
- Maximum specialists per command: 5 (configurable)
- Maximum memory usage: 512MB
- Maximum cache size: 100MB
- Maximum execution time: 60 seconds
- Emergency dump limit: 10 files

## Best Practices

1. **Use appropriate execution modes** - Choose the right mode for your use case
2. **Enable caching** - For repeated commands, caching improves performance
3. **Monitor performance** - Use the performance monitor to identify bottlenecks
4. **Handle errors gracefully** - Implement proper error handling
5. **Optimize resource usage** - Use eco mode for resource-constrained environments
6. **Chain related commands** - Use command chaining for workflows
7. **Enable collaboration** - For cross-functional tasks, enable department collaboration

## Debugging

Enable debug mode for detailed logging:

```bash
DEBUG=bumba:* bumba implement feature
```

View performance metrics:

```bash
bumba metrics
```

Check system health:

```bash
bumba health
```

## Version Compatibility

- Node.js: >= 14.0.0
- npm: >= 6.0.0
- OS: macOS, Linux, Windows

## Support

For issues and feature requests, visit:
https://github.com/your-org/bumba-cli/issues
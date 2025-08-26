# BUMBA API Reference

## Core API

### Framework Initialization

```javascript
const bumba = require('bumba-framework');

// Auto-initializes with optimizations
// No configuration needed
```

### Command Routing

#### `bumba.route(command)`
Routes commands to appropriate specialists.

```javascript
const route = bumba.route('create-api');
// Returns: { specialist: 'api-architect', dept: 'backend', cached: true }

// Keyword matching
const route2 = bumba.route('help with python code');
// Returns: { specialist: 'python-specialist', dept: 'backend', keyword: true }
```

#### `bumba.getCacheStats()`
Get command cache statistics.

```javascript
const stats = bumba.getCacheStats();
// Returns: {
//   routes: 18,
//   keywords: 18,
//   hits: 3015,
//   misses: 2,
//   hitRate: '99.93%'
// }
```

## Department Managers

### BackendEngineerManager

```javascript
const { BackendEngineerManager } = require('bumba-framework/departments');

const manager = new BackendEngineerManager();

// Get specialist (lazy loaded)
const specialist = await manager.getSpecialist('javascript');

// Check status
const status = manager.getStatus();
// Returns: {
//   loadedSpecialists: 1,
//   memoryEfficient: true,
//   poolSize: 1
// }

// Execute task
const result = await manager.executeTask('javascript', {
  task: 'refactor',
  code: '...'
});
```

### DesignEngineerManager

```javascript
const { DesignEngineerManager } = require('bumba-framework/departments');

const manager = new DesignEngineerManager();

// Get UI specialist
const uiSpecialist = await manager.getSpecialist('ui-design');

// Get React specialist
const reactSpecialist = await manager.getSpecialist('react');
```

### ProductStrategistManager

```javascript
const { ProductStrategistManager } = require('bumba-framework/departments');

const manager = new ProductStrategistManager();

// Get product manager
const pm = await manager.getSpecialist('product-manager');

// Get business analyst
const analyst = await manager.getSpecialist('business-analyst');
```

## Specialist Pool

### Pool Management

```javascript
const { acquireSpecialist, releaseSpecialist, getPoolStats } = require('bumba-framework/pooling');

// Acquire specialist
const specialist = await acquireSpecialist('type', async () => {
  return createSpecialist();
});

// Release back to pool
releaseSpecialist('type');

// Get statistics
const stats = getPoolStats();
// Returns: {
//   size: 5,
//   maxSize: 10,
//   created: 10,
//   reused: 50,
//   reuseRate: '83.33%',
//   ttl: '300s'
// }
```

## Memory Management

### Memory Optimizer

```javascript
const { getMemoryStats, forceCleanup } = require('bumba-framework/memory');

// Get current memory stats
const stats = getMemoryStats();
// Returns: {
//   heapUsed: '12MB',
//   heapTotal: '50MB',
//   threshold: '100MB',
//   shouldCleanup: false
// }

// Force garbage collection
forceCleanup();
```

## Configuration

### Offline Mode

```javascript
const { isOffline, setOfflineMode } = require('bumba-framework/config');

// Check if offline
if (isOffline()) {
  console.log('Running in offline mode');
}

// Force offline mode
setOfflineMode(true);
```

### Fast Start

```javascript
const { getFastStart } = require('bumba-framework/fast-start');

const fast = getFastStart();
const stats = fast.getStats();
// Returns: {
//   mode: 'fast',
//   initTime: 19,
//   memoryUsage: '9MB'
// }
```

### Logging

```javascript
const { setLogLevel, getLogConfig } = require('bumba-framework/logging');

// Set log level
setLogLevel('ERROR'); // 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'SILENT'

// Get configuration
const config = getLogConfig();
// Returns: {
//   level: 'ERROR',
//   suppressing: true,
//   patterns: 15
// }
```

## Context Preservation

### Token Management

```javascript
const { TokenCounter } = require('bumba-framework/metrics');

const counter = new TokenCounter();

// Estimate tokens
const tokens = counter.estimate('Your text here');
// Returns: 3 (estimated tokens)

// Track usage
const metrics = counter.getMetrics();
// Returns: {
//   totalInputTokens: 150,
//   totalOutputTokens: 300,
//   reductionRate: '88.1%'
// }
```

### Summarization

```javascript
const { createSummarizer } = require('bumba-framework/summarization');

const summarizer = createSummarizer('text');

// Summarize content
const summary = await summarizer.summarize(longText, {
  maxTokens: 100,
  preservePriority: true
});
```

## Specialist Registry

### Available Specialists

```javascript
const { getSpecialistList } = require('bumba-framework/specialists');

const specialists = getSpecialistList();
// Returns array of 100+ specialists

// By department
const backend = specialists.filter(s => s.department === 'backend');
const frontend = specialists.filter(s => s.department === 'design');
const product = specialists.filter(s => s.department === 'product');
```

### Creating Custom Specialists

```javascript
const { UnifiedSpecialistBase } = require('bumba-framework/specialists');

class CustomSpecialist extends UnifiedSpecialistBase {
  constructor() {
    super({
      id: 'custom-specialist',
      name: 'Custom Specialist',
      type: 'technical',
      department: 'backend',
      interfaces: ['codeAnalysis', 'documentation']
    });
  }
  
  async execute(task) {
    // Your implementation
    return { result: 'success' };
  }
}
```

## Error Handling

### Unified Error Manager

```javascript
const { UnifiedErrorManager } = require('bumba-framework/error-handling');

const errorManager = UnifiedErrorManager.getInstance();

// Handle errors
try {
  // Your code
} catch (error) {
  await errorManager.handleError(error, {
    context: 'specialist-execution',
    severity: 'high'
  });
}

// Get error stats
const stats = errorManager.getStats();
```

## Testing Utilities

### Test Helpers

```javascript
const { createMockSpecialist, testPerformance } = require('bumba-framework/testing');

// Create mock specialist
const mock = createMockSpecialist('test-type');

// Test performance
const results = await testPerformance(async () => {
  // Your code
}, {
  iterations: 100,
  maxTime: 1000
});
```

## Advanced Features

### Parallel Execution

```javascript
const tasks = [
  { type: 'javascript', task: 'refactor' },
  { type: 'python', task: 'optimize' },
  { type: 'database', task: 'query' }
];

const results = await Promise.all(
  tasks.map(t => manager.executeTask(t.type, t))
);
```

### Health Checks

```javascript
const { runHealthCheck } = require('bumba-framework/health');

const health = await runHealthCheck();
// Returns: {
//   framework: true,
//   offline: true,
//   fastStart: true,
//   memory: true,
//   pool: true,
//   cache: true
// }
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BUMBA_OFFLINE` | auto | Force offline mode |
| `BUMBA_FAST_START` | true | Enable fast startup |
| `LOG_LEVEL` | INFO | Logging verbosity |
| `MAX_POOL_SIZE` | 10 | Maximum specialists in pool |
| `MEMORY_THRESHOLD` | 100 | MB before cleanup |
| `CACHE_TTL` | 300000 | Cache time-to-live (ms) |

---

For more examples, see the [examples](../examples) directory.
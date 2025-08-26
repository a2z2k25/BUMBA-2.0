# BUMBA Quick Start Guide

## 5-Minute Setup

### 1. Installation

```bash
npm install -g bumba-framework
# or
git clone https://github.com/bumba-ai/bumba.git && cd bumba && npm install
```

### 2. First Run

```bash
bumba
# Framework starts in <20ms
```

### 3. Basic Usage

```javascript
// Load BUMBA
const bumba = require('bumba-framework');

// Route a command
const route = bumba.route('create-api');
console.log(route); // { specialist: 'api-architect', dept: 'backend' }

// Get a specialist
const manager = new bumba.BackendEngineerManager();
const specialist = await manager.getSpecialist('javascript');
```

## Interactive Tutorial

### Step 1: Test the Framework

```bash
node test-performance.js
```

Expected output:
- Framework loads in <20ms ✅
- Memory usage <10MB ✅
- Offline mode enabled ✅

### Step 2: Try Command Routing

```bash
node examples/basic-usage.js
```

Learn how commands route to specialists instantly.

### Step 3: Explore Specialists

```bash
node examples/advanced-specialist.js
```

See specialist pooling and memory management.

### Step 4: Check Performance

```bash
node examples/performance-demo.js
```

Witness the framework's speed.

## Common Patterns

### Pattern 1: Task Execution

```javascript
// Simple task
const result = await bumba.execute('refactor this code', {
  specialist: 'javascript-specialist'
});
```

### Pattern 2: Parallel Processing

```javascript
// Multiple specialists working together
const tasks = ['api', 'database', 'frontend'].map(type =>
  bumba.execute(`optimize ${type}`, { department: type })
);

const results = await Promise.all(tasks);
```

### Pattern 3: Department Coordination

```javascript
// Coordinate across departments
const backend = new bumba.BackendEngineerManager();
const frontend = new bumba.DesignEngineerManager();
const product = new bumba.ProductStrategistManager();

// Work in parallel
await Promise.all([
  backend.executeTask('api', { task: 'create endpoints' }),
  frontend.executeTask('react', { task: 'build UI' }),
  product.executeTask('analyst', { task: 'define metrics' })
]);
```

## Configuration Tips

### For Maximum Speed

```bash
export BUMBA_FAST_START=true
export BUMBA_OFFLINE=true
export LOG_LEVEL=ERROR
```

### For Development

```bash
export LOG_LEVEL=INFO
export BUMBA_FAST_START=false  # See more details
```

### For Production

```bash
export NODE_ENV=production
export BUMBA_OFFLINE=true
export LOG_LEVEL=ERROR
export MAX_POOL_SIZE=20
```

## Troubleshooting

### Issue: Slow startup
```bash
# Enable fast start
export BUMBA_FAST_START=true
```

### Issue: High memory usage
```bash
# Reduce pool size
export MAX_POOL_SIZE=5
```

### Issue: Too many logs
```bash
# Suppress logs
export LOG_LEVEL=ERROR
```

## Next Steps

1. Read the [API Reference](./API_REFERENCE.md)
2. Explore [examples](../examples)
3. Check [deployment guide](./DEPLOYMENT.md)
4. Join our [Discord](https://discord.gg/bumba)

---

**Need help?** Open an issue on [GitHub](https://github.com/bumba-ai/bumba/issues)
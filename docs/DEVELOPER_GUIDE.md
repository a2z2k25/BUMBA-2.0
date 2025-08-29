# BUMBA CLI Developer Guide

## Architecture Overview

BUMBA CLI is built on a multi-agent architecture with intelligent command routing, specialist activation, and collaborative execution.

```
┌─────────────────────────────────────────────────┐
│                   User Input                     │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│             Command Router                       │
│  • Analyzes command                             │
│  • Determines department                        │
│  • Builds context                               │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│          Department Manager                      │
│  • Product / Design / Backend                   │
│  • Activates specialists                        │
│  • Coordinates execution                        │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│           Specialist Teams                       │
│  • Domain experts                               │
│  • Collaborative analysis                       │
│  • Intelligent processing                       │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│        Intelligent Output Generator              │
│  • Context-aware content                        │
│  • Professional formatting                      │
│  • File generation                              │
└─────────────────────────────────────────────────┘
```

## Project Structure

```
bumba-cli/
├── bin/                          # Executable scripts
│   ├── bumba                     # Main CLI entry
│   ├── bumba-mode               # Mode switcher
│   └── bumba-slash              # Slash command runner
├── src/
│   ├── core/
│   │   ├── command-intelligence/  # Intelligent routing
│   │   │   ├── command-router.js
│   │   │   ├── specialist-selector.js
│   │   │   ├── intelligent-output-generator.js
│   │   │   ├── multi-agent-collaborator.js
│   │   │   ├── command-chain-executor.js
│   │   │   ├── cache-manager.js
│   │   │   ├── performance-monitor.js
│   │   │   ├── resource-optimizer.js
│   │   │   ├── query-optimizer.js
│   │   │   ├── memory-manager.js
│   │   │   └── load-balancer.js
│   │   ├── department-managers/
│   │   │   ├── product-manager.js
│   │   │   ├── design-manager.js
│   │   │   └── backend-manager.js
│   │   ├── specialists/
│   │   │   └── specialist-registry.js
│   │   ├── error-handling/
│   │   │   └── unified-error-manager.js
│   │   ├── modes/
│   │   │   └── execution-modes.js
│   │   └── logging/
│   │       └── bumba-logger.js
│   ├── commands/               # Command implementations
│   ├── utils/                  # Utility functions
│   └── config/                 # Configuration
├── docs/                        # Documentation
├── output/                      # Generated files (git-ignored)
├── tests/                       # Test suites
└── package.json

```

## Core Components

### 1. Command Router

The heart of the intelligent routing system.

```javascript
// src/core/command-intelligence/command-router.js

class CommandRouter {
  async route(command, args, context = {}) {
    // 1. Build complete context
    const fullContext = this.buildContext(command, args, context);
    
    // 2. Determine department(s)
    const department = this.getDepartmentForCommand(command);
    
    // 3. Check for collaboration needs
    if (this.requiresCollaboration(command)) {
      return this.collaborator.coordinate(command, args, fullContext);
    }
    
    // 4. Execute with department
    return this.executeWithDepartment(department, command, args, fullContext);
  }
}
```

### 2. Specialist Selector

Intelligently selects and activates specialists.

```javascript
// src/core/command-intelligence/specialist-selector.js

class SpecialistSelector {
  async selectSpecialists(command, args, context) {
    // 1. Analyze requirements
    const required = this.analyzeRequirements(command, args, context);
    
    // 2. Get available specialists
    const available = this.registry.getAvailableSpecialists();
    
    // 3. Score and rank
    const scored = this.scoreSpecialists(available, required);
    
    // 4. Select optimal team
    return this.selectOptimalTeam(scored, context);
  }
}
```

### 3. Department Managers

Coordinate specialist teams within departments.

```javascript
// src/core/department-managers/product-manager.js

class ProductDepartmentManager {
  async execute(command, args, context) {
    // 1. Select specialists
    const specialists = await this.selector.selectSpecialists(command, args, context);
    
    // 2. Activate specialists
    const team = await this.activateTeam(specialists);
    
    // 3. Coordinate execution
    const analysis = await this.coordinateAnalysis(team, command, args);
    
    // 4. Generate output
    return this.outputGenerator.generateOutput(command, args, analysis, context);
  }
}
```

## Adding New Commands

### Step 1: Define Command Mapping

Add to `/src/core/config/command-department-map.json`:

```json
{
  "your-command": {
    "department": "backend",
    "specialists": ["backend-engineer", "api-specialist"],
    "outputType": "code",
    "complexity": 3
  }
}
```

### Step 2: Create Command Handler

```javascript
// src/commands/your-command.js

module.exports = {
  name: 'your-command',
  description: 'Description of your command',
  
  async execute(args, context) {
    // Route through intelligent system
    const router = require('../core/command-intelligence/command-router').getInstance();
    return router.route(this.name, args, context);
  }
};
```

### Step 3: Register Command

Add to command registry:

```javascript
// src/commands/index.js

const commands = {
  // ... existing commands
  'your-command': require('./your-command')
};
```

## Adding New Specialists

### Step 1: Define Specialist

```javascript
// src/core/specialists/your-specialist.js

module.exports = {
  id: 'your-specialist',
  name: 'Your Specialist',
  department: 'backend',
  skills: ['skill1', 'skill2'],
  priority: 5,
  
  async analyze(command, args, context) {
    // Specialist analysis logic
    return {
      recommendations: [],
      implementation: {},
      considerations: []
    };
  }
};
```

### Step 2: Register Specialist

```javascript
// src/core/specialists/specialist-registry.js

this.registerSpecialist(require('./your-specialist'));
```

## Creating Execution Modes

### Step 1: Define Mode

```javascript
// src/core/modes/your-mode.js

module.exports = {
  name: 'your-mode',
  description: 'Your mode description',
  
  config: {
    maxSpecialists: 3,
    parallel: true,
    caching: true,
    timeout: 30000
  },
  
  async preProcess(context) {
    // Pre-processing logic
    return context;
  },
  
  async postProcess(result) {
    // Post-processing logic
    return result;
  }
};
```

### Step 2: Register Mode

```javascript
// src/core/modes/execution-modes.js

this.registerMode(require('./your-mode'));
```

## Performance Optimization

### 1. Caching Strategy

```javascript
const cache = require('./cache-manager').getInstance();

// Cache expensive operations
const cacheKey = cache.generateKey(command, args, context);
const cached = cache.get(cacheKey);

if (cached) {
  return cached;
}

const result = await expensiveOperation();
cache.set(cacheKey, result, 300000); // 5 minute TTL
```

### 2. Memory Management

```javascript
const memory = require('./memory-manager').getInstance();

// Create object pool
memory.createObjectPool('MyClass', 
  () => new MyClass(),
  (obj) => obj.reset()
);

// Use pooled objects
const obj = memory.allocate('MyClass');
// ... use object
memory.deallocate('MyClass', obj);
```

### 3. Load Balancing

```javascript
const balancer = require('./load-balancer').getInstance();

// Balance work across specialists
const result = await balancer.balance({
  command: 'heavy-task',
  priority: 8
}, context);
```

## Error Handling

### Custom Error Classes

```javascript
class BumbaError extends Error {
  constructor(message, code, context) {
    super(message);
    this.code = code;
    this.context = context;
  }
}

class CommandNotFoundError extends BumbaError {
  constructor(command) {
    super(`Command not found: ${command}`, 'COMMAND_NOT_FOUND', { command });
  }
}
```

### Error Recovery

```javascript
const errorManager = require('./unified-error-manager').getInstance();

try {
  // Risky operation
} catch (error) {
  const recovery = await errorManager.handleError(error, context);
  
  if (recovery.retry) {
    // Retry with recovery suggestions
    return await retryWithRecovery(recovery);
  }
  
  throw recovery.error;
}
```

## Testing

### Unit Tests

```javascript
// tests/unit/command-router.test.js

describe('CommandRouter', () => {
  it('should route command to correct department', async () => {
    const router = new CommandRouter();
    const result = await router.route('prd', ['feature'], {});
    
    expect(result.department).toBe('product');
    expect(result.success).toBe(true);
  });
});
```

### Integration Tests

```javascript
// tests/integration/full-flow.test.js

describe('Full Command Flow', () => {
  it('should execute complete command flow', async () => {
    const result = await executeCommand('implement', ['feature'], {
      mode: 'lite'
    });
    
    expect(result.file).toExist();
    expect(result.specialists).toContain('backend-engineer');
  });
});
```

### Performance Tests

```javascript
// tests/performance/load.test.js

describe('Load Testing', () => {
  it('should handle concurrent commands', async () => {
    const commands = Array(10).fill().map((_, i) => 
      executeCommand('analyze', [`file${i}.js`])
    );
    
    const results = await Promise.all(commands);
    expect(results).toHaveLength(10);
  });
});
```

## Debugging

### Enable Debug Logging

```javascript
// Set environment variable
process.env.DEBUG = 'bumba:*';

// Or programmatically
const logger = require('./bumba-logger');
logger.setLevel('debug');
```

### Performance Profiling

```javascript
const monitor = require('./performance-monitor').getInstance();

// Start profiling
const id = monitor.startCommand('cmd1', 'implement', args);

// ... execution ...

// End profiling
const metrics = monitor.endCommand(id);
console.log('Execution time:', metrics.duration);
```

### Memory Profiling

```javascript
const memory = require('./memory-manager').getInstance();

// Take heap snapshot
const snapshot = memory.getHeapSnapshot();

// Get memory stats
const stats = memory.getStats();
console.log('Memory usage:', stats);
```

## Deployment

### NPM Publishing

```bash
# Update version
npm version patch|minor|major

# Publish to npm
npm publish

# Tag release
git tag v1.3.0
git push --tags
```

### Docker Container

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm link
ENTRYPOINT ["bumba"]
```

### CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm ci
      - run: npm test
      - run: npm run lint
```

## Contributing

### Code Style

We use ESLint and Prettier:

```bash
npm run lint
npm run format
```

### Commit Convention

Follow conventional commits:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `perf:` Performance improvement
- `refactor:` Code refactoring
- `test:` Testing
- `chore:` Maintenance

### Pull Request Process

1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Run full test suite
5. Submit PR with description

## API Integration

### External Services

```javascript
// src/integrations/openai.js

class OpenAIIntegration {
  async generateContent(prompt, context) {
    const response = await this.client.completions.create({
      model: context.model || 'gpt-4',
      prompt: this.buildPrompt(prompt, context),
      max_tokens: context.maxTokens || 2000
    });
    
    return response.choices[0].text;
  }
}
```

### Webhook Support

```javascript
// src/integrations/webhooks.js

class WebhookManager {
  async notify(event, data) {
    const webhooks = this.getWebhooksForEvent(event);
    
    await Promise.all(webhooks.map(webhook =>
      this.sendWebhook(webhook, { event, data })
    ));
  }
}
```

## Security

### API Key Management

```javascript
// Use environment variables
const apiKey = process.env.OPENAI_API_KEY;

// Or secure config
const config = require('./secure-config');
const apiKey = config.getSecureValue('openai.apiKey');
```

### Input Validation

```javascript
const validator = require('./validator');

function validateCommand(command, args) {
  validator.assertString(command, 'Command must be a string');
  validator.assertArray(args, 'Args must be an array');
  validator.assertNoInjection(command, 'Invalid command');
}
```

## Performance Benchmarks

Target metrics:
- Command routing: < 10ms
- Specialist selection: < 50ms
- Output generation: < 500ms
- Memory usage: < 512MB
- Cache hit rate: > 70%

## Resources

- GitHub: https://github.com/bumba/cli
- Documentation: https://docs.bumba-cli.com
- API Reference: https://api.bumba-cli.com
- Discord: https://discord.gg/bumba
- NPM: https://npmjs.com/package/bumba-cli
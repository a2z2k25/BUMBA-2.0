# BUMBA CLI Migration Guide: v1.0 to v2.0

## Overview

This guide helps you migrate from BUMBA CLI 1.0 to v2.0. The major changes include:

- **TypeScript Removal**: Framework is now pure JavaScript
- **Unified Routing**: Consolidated routing system with intelligent router as alias
- **Health Monitoring**: New comprehensive health check system
- **Build System**: Webpack-based production builds
- **Simplified APIs**: Cleaner, more consistent API surface

## Breaking Changes

### 1. TypeScript Support Removed

**v1.0:**
```typescript
import { BumbaFramework } from 'bumba-claude';
const bumba: BumbaFramework = new BumbaFramework();
```

**v2.0:**
```javascript
const { BumbaFramework2 } = require('bumba-claude');
const bumba = new BumbaFramework2();
```

**Migration Steps:**
1. Remove TypeScript dependencies from package.json
2. Delete tsconfig.json
3. Convert all .ts files to .js
4. Remove type annotations

### 2. Intelligent Router Changes

**v1.0:**
```javascript
const { BumbaIntelligentRouter } = require('./intelligent-router');
const router = new BumbaIntelligentRouter();
```

**v2.0:**
```javascript
// Option 1: Use UnifiedRoutingSystem directly
const { UnifiedRoutingSystem } = require('./unified-routing-system');
const router = UnifiedRoutingSystem.getInstance();

// Option 2: Use backward-compatible alias
const { BumbaIntelligentRouter } = require('./unified-routing-system');
const router = new BumbaIntelligentRouter();
```

**Migration Steps:**
1. Update import paths
2. Use getInstance() for singleton pattern
3. No API changes required

### 3. Configuration Structure

**v1.0:**
```javascript
{
  "version": "2.0",
  "agents": {
    "enabled": true
  }
}
```

**v2.0:**
```javascript
{
  "framework": {
    "version": "2.0.0",
    "mode": "production"
  },
  "departments": {
    "strategic": { "enabled": true },
    "technical": { "enabled": true },
    "experience": { "enabled": true }
  }
}
```

**Migration Steps:**
1. Update configuration structure
2. Add framework section
3. Replace agents with departments

## New Features

### 1. Health Monitoring System

**New in v2.0:**
```javascript
const { healthCheckSystem } = require('./core/monitoring/health-check');

// Register custom health check
healthCheckSystem.registerCheck('custom', async () => ({
  healthy: true,
  details: { status: 'operational' }
}));

// Use in Express app
app.get('/health', healthCheckSystem.getHealthEndpoint());
app.get('/liveness', healthCheckSystem.getLivenessEndpoint());
app.get('/readiness', healthCheckSystem.getReadinessEndpoint());
```

### 2. Build System

**New in v2.0:**
```bash
# Build for production
npm run build

# Creates optimized bundle in dist/
```

**webpack.config.js available for customization**

### 3. Simplified Agent System

**v1.0:**
```javascript
const agent = agentManager.createAgent('complex-agent', complexConfig);
```

**v2.0:**
```javascript
const { SimplifiedAgentSystem } = require('./core/agents/simplified-agent-system');
const agents = new SimplifiedAgentSystem();

const agent = await agents.createAgent('backend', {
  priority: 'high'
});
```

### 4. Enhanced Security

**New in v2.0:**
```javascript
const { CommandValidator } = require('./core/security/command-validator');
const { SecureExecutor } = require('./core/security/secure-executor');

// Validation now async with permissions
const validation = await validator.validateCommand(cmd, args, context);
```

## API Changes

### Framework Initialization

**v1.0:**
```javascript
const bumba = new BumbaFramework({
  enableAgents: true,
  maxMemory: 512
});
```

**v2.0:**
```javascript
const bumba = new BumbaFramework2({
  mode: 'full', // or 'lite'
  config: {
    performance: {
      maxMemoryMB: 512
    }
  }
});
```

### Command Processing

**v1.0:**
```javascript
const result = bumba.process(command, args);
```

**v2.0:**
```javascript
const result = await bumba.processCommand(command, args, context);
```

### Error Handling

**v1.0:**
```javascript
try {
  // operation
} catch (error) {
  console.error(error);
}
```

**v2.0:**
```javascript
const { BumbaErrorBoundary } = require('./core/error-handling/bumba-error-system');

const result = await BumbaErrorBoundary.wrap(
  async () => await operation(),
  async () => await fallback(),
  { context: 'operation-name' }
);
```

## Deprecations

### Deprecated in v2.0

1. **TypeScript interfaces**: No longer available
2. **Old agent system**: Use SimplifiedAgentSystem
3. **Sync validation**: Use async validateCommand
4. **Direct router instantiation**: Use getInstance()

### Removed in v2.0

1. **intelligent-router.ts**: Use unified-routing-system.js
2. **types/core.d.ts**: TypeScript types removed
3. **Complex agent inheritance**: Use composition

## Migration Checklist

- [ ] Remove TypeScript configuration and dependencies
- [ ] Update all imports to new paths
- [ ] Convert configuration to new structure
- [ ] Add health check endpoints
- [ ] Update command processing to async
- [ ] Add context parameter to commands
- [ ] Set up build process with webpack
- [ ] Update error handling to use boundaries
- [ ] Test all functionality thoroughly

## Code Examples

### Complete Migration Example

**v1.0 Code:**
```typescript
import { BumbaFramework, BumbaAgent } from 'bumba-claude';

class CustomAgent extends BumbaAgent {
  async execute(task: Task): Promise<Result> {
    // implementation
  }
}

const bumba = new BumbaFramework({
  enableAgents: true
});

const result = bumba.process('implement', ['feature']);
```

**v2.0 Code:**
```javascript
const { BumbaFramework2 } = require('bumba-claude');
const { SimplifiedAgentSystem } = require('bumba-claude/agents');

const bumba = new BumbaFramework2({
  mode: 'full'
});

const agents = new SimplifiedAgentSystem();
const agent = await agents.createAgent('custom', {
  execute: async (task) => {
    // implementation
  }
});

const result = await bumba.processCommand('implement', ['feature'], {
  user: 'developer',
  project: 'my-app'
});
```

## Troubleshooting

### Common Migration Issues

**Issue: Cannot find module errors**
```bash
Error: Cannot find module './intelligent-router'
```
**Solution:** Update imports to use unified-routing-system

**Issue: TypeScript errors**
```bash
TSError: ⨯ Unable to compile TypeScript
```
**Solution:** Remove all TypeScript files and configuration

**Issue: Configuration not recognized**
```bash
Warning: Invalid configuration structure
```
**Solution:** Update to new configuration format

## Support

For migration assistance:
- GitHub Issues: https://github.com/bumba/framework/issues
- Migration tag: Use [migration] in issue title
- Include v1.0 code samples when reporting issues

---

*This guide covers the major changes in BUMBA CLI 1.0. For detailed API documentation, see the API Reference.*
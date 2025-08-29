# BUMBA CLI Comprehensive Guide

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Core Components](#core-components)
4. [Getting Started](#getting-started)
5. [API Reference](#api-reference)
6. [Testing](#testing)
7. [Production Deployment](#production-deployment)
8. [Troubleshooting](#troubleshooting)

## Overview

BUMBA is a professional AI development framework that combines intelligent orchestration with enterprise-grade security and monitoring. Version 2.0 includes:

- **Unified Routing System**: Single, consistent routing architecture
- **Department-Based Organization**: Strategic, Technical, and Experience departments
- **Health Monitoring**: Comprehensive health checks and metrics
- **Security First**: Command validation, path sanitization, RBAC integration
- **Build System**: Webpack-based production builds with optimization

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    BUMBA CLI 2.0                       │
├─────────────────────────────────────────────────────────────┤
│                    Command Interface                         │
├─────────────────────────────────────────────────────────────┤
│                 Unified Routing System                       │
│              (with Intelligent Router alias)                 │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  Strategic  │  │  Technical  │  │ Experience  │        │
│  │ Department  │  │ Department  │  │ Department  │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
├─────────────────────────────────────────────────────────────┤
│                    Core Services                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │ Security │ │  Health  │ │ Resource │ │  Error   │      │
│  │ Validator│ │  Check   │ │ Manager  │ │ Handler  │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Key Design Principles

1. **Modularity**: Each component is self-contained and replaceable
2. **Security**: All inputs validated, all outputs sanitized
3. **Resilience**: Comprehensive error handling with recovery strategies
4. **Performance**: Resource pooling, caching, and lazy loading
5. **Observability**: Built-in monitoring and health checks

## Core Components

### 1. Unified Routing System

The heart of BUMBA, handling all command routing with intelligent analysis.

```javascript
const { UnifiedRoutingSystem } = require('./core/unified-routing-system');

// The system analyzes intent and routes to appropriate departments
const router = UnifiedRoutingSystem.getInstance();
const routing = await router.route('implement', ['api'], context);
```

Features:
- Intent analysis with pattern matching
- Department and specialist selection
- Learning from past routing decisions
- Performance tracking

### 2. Department Managers

Three main departments handle different aspects of development:

- **Strategic Department**: Product strategy, roadmaps, business logic
- **Technical Department**: Implementation, APIs, databases, security
- **Experience Department**: UI/UX, design systems, user interaction

### 3. Security System

Multi-layered security with:

```javascript
const { CommandValidator } = require('./core/security/command-validator');
const { SecureExecutor } = require('./core/security/secure-executor');

// Validate before execution
const validation = await validator.validateCommand(cmd, args, context);
if (validation.valid) {
  await executor.execute(validation.sanitized);
}
```

### 4. Health Monitoring

Comprehensive health checks for production readiness:

```javascript
const { healthCheckSystem } = require('./core/monitoring/health-check');

// Get current health status
const health = healthCheckSystem.getHealth();

// Use in Express/HTTP server
app.get('/health', healthCheckSystem.getHealthEndpoint());
app.get('/liveness', healthCheckSystem.getLivenessEndpoint());
app.get('/readiness', healthCheckSystem.getReadinessEndpoint());
```

### 5. Error Handling

Intelligent error handling with recovery strategies:

```javascript
const { BumbaErrorBoundary } = require('./core/error-handling/bumba-error-system');

// Wrap operations with error boundary
const result = await BumbaErrorBoundary.wrap(
  async () => await riskyOperation(),
  async () => await fallbackOperation(),
  { context: 'operation-name' }
);
```

## Getting Started

### Installation

```bash
# Install BUMBA globally
npm install -g bumba-claude

# Or install locally in a project
npm install bumba-claude
```

### Basic Usage

```javascript
const { BumbaFramework2 } = require('bumba-claude');

// Initialize the framework
const bumba = new BumbaFramework2();

// Process a command
const result = await bumba.processCommand('implement', ['user authentication'], {
  user: 'developer',
  project: 'my-app'
});

// Check health
const health = bumba.getHealth();
console.log('Framework health:', health.status);
```

### Configuration

Create a configuration file at `~/.claude/config/bumba.config.json`:

```json
{
  "framework": {
    "version": "1.0.0",
    "mode": "production"
  },
  "performance": {
    "maxMemoryMB": 512,
    "maxAgents": 10
  },
  "security": {
    "validateCommands": true,
    "sanitizeInputs": true
  }
}
```

## API Reference

### BumbaFramework2

Main framework class that orchestrates all components.

#### Methods

- `processCommand(command, args, context)`: Process a command through the routing system
- `getHealth()`: Get comprehensive health status
- `getPerformanceMetrics()`: Get performance statistics
- `shutdown()`: Gracefully shutdown the framework

### UnifiedRoutingSystem

Intelligent routing with department management.

#### Methods

- `route(command, args, context)`: Analyze and route command
- `registerDepartment(name, department)`: Register a department
- `executeRouting(task, routing)`: Execute routing decision
- `getStatistics()`: Get routing statistics

### Security Components

#### CommandValidator

- `validateCommand(command, args, context)`: Async validation with permissions
- `validateCommandSync(command, args)`: Sync validation without permissions
- `validateFilePath(path)`: Validate file paths

#### SecureExecutor

- `execute(command, args, options)`: Execute validated commands
- `executeFile(filePath, args, options)`: Execute scripts
- `sanitizeEnvironment(env)`: Clean environment variables

### Health Monitoring

#### HealthCheckSystem

- `registerCheck(name, checkFunction)`: Add custom health check
- `runHealthChecks()`: Run all health checks
- `getHealth()`: Get current health status
- `createHealthReport()`: Generate detailed report

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch

# Run specific test file
npx jest tests/unit/core/intelligent-router.test.js
```

### Writing Tests

Example test structure:

```javascript
describe('Component', () => {
  let component;
  
  beforeEach(() => {
    component = new Component();
  });
  
  test('should perform expected behavior', async () => {
    const result = await component.method();
    expect(result).toBeDefined();
  });
});
```

## Production Deployment

### Building for Production

```bash
# Create optimized production build
npm run build

# Output will be in dist/bumba.js
```

### Environment Variables

- `NODE_ENV`: Set to 'production' for optimizations
- `BUMBA_LOG_LEVEL`: Control logging (debug, info, warn, error)
- `BUMBA_CONFIG_PATH`: Override default config location

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3000
CMD ["node", "dist/bumba.js"]
```

### Health Checks

Configure health checks in Kubernetes:

```yaml
livenessProbe:
  httpGet:
    path: /liveness
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /readiness
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 5
```

## Troubleshooting

### Common Issues

#### 1. Module Not Found

**Error**: `Cannot find module './intelligent-router'`

**Solution**: The intelligent router is now part of the unified routing system. Update imports:
```javascript
// Old
const { BumbaIntelligentRouter } = require('./intelligent-router');

// New
const { BumbaIntelligentRouter } = require('./unified-routing-system');
```

#### 2. Memory Issues

**Error**: `RESOURCE_EXHAUSTED`

**Solution**: Increase memory limits in configuration:
```javascript
configManager.set('performance.maxMemoryMB', 1024);
```

#### 3. Permission Denied

**Error**: `Insufficient permissions`

**Solution**: Ensure user has proper RBAC permissions:
```javascript
const context = {
  user: 'developer',
  role: 'admin',
  skipPermissionCheck: false // Only in development
};
```

### Debug Mode

Enable debug logging:

```javascript
process.env.BUMBA_LOG_LEVEL = 'debug';
```

Or use the logger directly:

```javascript
const { logger } = require('./core/logging/bumba-logger');
logger.setLevel('debug');
```

### Performance Optimization

1. **Enable caching**: Already enabled by default
2. **Adjust pool sizes**: Configure in `performance` section
3. **Monitor metrics**: Use `getPerformanceMetrics()` regularly
4. **Resource cleanup**: Framework handles automatically

## Migration Guide

### From v1.0 to v2.0

1. **TypeScript removed**: All `.ts` files converted to `.js`
2. **Unified routing**: `BumbaIntelligentRouter` now aliases `UnifiedRoutingSystem`
3. **Health monitoring**: New comprehensive health check system
4. **Build system**: Webpack configuration added

### Breaking Changes

- TypeScript types no longer available
- `intelligent-router.js` now redirects to unified system
- Configuration structure updated

## Contributing

1. Fork the repository
2. Create a feature branch
3. Write tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

- GitHub Issues: https://github.com/bumba/framework/issues
- Documentation: https://bumba.dev/docs
- Community: https://discord.gg/bumba

---

*BUMBA CLI 1.0 - Built with intelligence, security, and scale in mind*
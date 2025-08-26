# BUMBA Framework Selection Guide

BUMBA provides three framework implementations optimized for different use cases and resource constraints.

## Framework Hierarchy

### 🟢 Production Framework: `bumba-framework-2.js` 🏁
**Best For**: Production deployments, enterprise applications, multi-user environments

**Features**:
- 🏁 **Full Multi-Agent System**: 3 departments (Product, Design, Backend) with 44+ specialists
- 🏁 **Parallel Safety Systems**: File locking, territory management, safe operations
- 🏁 **Advanced Consciousness Layer**: Four Pillars validation with ethical guidelines
- 🏁 **Intelligent Routing**: Smart command routing with department coordination
- 🏁 **Enterprise Monitoring**: Performance analytics, health monitoring, cost tracking
- 🏁 **MCP Integration**: 24+ server integrations with graceful fallbacks
- 🏁 **66+ Commands**: Complete command suite with advanced features

**Performance**:
- **Memory**: ~50MB
- **Startup**: ~2 seconds
- **Commands**: 66+
- **Concurrency**: Unlimited parallel execution

**Usage**:
```javascript
const BumbaFramework = require('./bumba-framework-2');
const framework = new BumbaFramework();
await framework.initialize();
```

---

### 🟢 Lightweight Framework: `simple-framework.js` 
**Best For**: Resource-constrained environments, single-user development, simple automation

**Features**:
- 🏁 **Core Commands**: Essential functionality without overhead
- 🏁 **Basic Specialists**: Simplified specialist system
- 🏁 **Simple Validation**: Basic consciousness validation
- 🏁 **Performance Monitoring**: Resource usage tracking
- 🔴 **No Parallel Coordination**: Single-threaded execution
- 🔴 **No Department Hierarchy**: Direct command processing
- 🔴 **Limited MCP Integration**: Essential servers only

**Performance**:
- **Memory**: ~10MB
- **Startup**: ~500ms
- **Commands**: Core essentials
- **Concurrency**: Limited

**Usage**:
```javascript
const SimpleFramework = require('./simple-framework');
const framework = new SimpleFramework();
await framework.initialize();
```

---

### 🪶 Ultra-Minimal Framework: `bumba-lite.js`
**Best For**: Prototyping, education, micro-services, IoT, CLI tools

**Features**:
- 🏁 **Ultra-Minimal Footprint**: <1MB memory usage
- 🏁 **Single File**: No complex dependencies
- 🏁 **Core Consciousness Principles**: Essential Four Pillars integration
- 🏁 **Event-Driven**: Simple event-based architecture  
- 🔴 **No Advanced Features**: Minimal functionality only
- 🔴 **No MCP Integration**: Self-contained operation
- 🔴 **No Complex Routing**: Direct function calls

**Performance**:
- **Memory**: <1MB
- **Startup**: <100ms
- **Commands**: Basic utilities
- **Concurrency**: Single-threaded

**Usage**:
```javascript
const BumbaLite = require('./bumba-lite');
const lite = new BumbaLite({ conscious: true });
lite.implement('simple task');
```

## Selection Decision Tree

### 🟢 Resource Assessment

```
Memory Available?
├── > 2GB → Production Framework (bumba-framework-2.js)
├── 500MB - 2GB → Lightweight Framework (simple-framework.js) 
└── < 500MB → Ultra-Minimal Framework (bumba-lite.js)
```

### 🟢 Use Case Assessment

```
Project Complexity?
├── Enterprise/Multi-user → Production Framework
├── Single Developer → Lightweight Framework
└── Prototype/Learning → Ultra-Minimal Framework

Features Needed?
├── Parallel Execution → Production Framework
├── Department Coordination → Production Framework  
├── MCP Integration → Production Framework
├── Basic Validation → Lightweight Framework
└── Minimal Footprint → Ultra-Minimal Framework
```

### 🟢 Deployment Environment

```
Deployment Target?
├── Production Server → Production Framework
├── Development Machine → Lightweight Framework
├── CI/CD Pipeline → Lightweight Framework
├── Serverless Function → Ultra-Minimal Framework
├── IoT Device → Ultra-Minimal Framework
└── CLI Tool → Ultra-Minimal Framework
```

## Framework Comparison Matrix

| Feature | Production | Lightweight | Ultra-Minimal |
|---------|------------|-------------|---------------|
| **Memory Usage** | ~50MB | ~10MB | <1MB |
| **Startup Time** | ~2s | ~500ms | <100ms |
| **Commands** | 66+ | Essential | Basic |
| **Departments** | 3 Full | None | None |
| **Specialists** | 44+ | Basic | None |
| **Parallel Safety** | Full | None | None |
| **MCP Integration** | 24+ servers | Limited | None |
| **Consciousness Layer** | Full | Basic | Core |
| **Monitoring** | Advanced | Basic | Minimal |
| **Error Handling** | Enterprise | Standard | Basic |

## Performance Benchmarks

### Command Execution Time
- **Production**: 100-500ms (with coordination)
- **Lightweight**: 50-100ms (direct processing)
- **Ultra-Minimal**: 10-50ms (immediate)

### Memory Growth Under Load
- **Production**: Linear scaling with agents
- **Lightweight**: Stable with minimal growth
- **Ultra-Minimal**: Constant minimal footprint

### Concurrent Operations
- **Production**: Unlimited (with safety systems)
- **Lightweight**: 1-10 operations
- **Ultra-Minimal**: Single operation

## Migration Paths

### From Ultra-Minimal → Lightweight
```javascript
// When you need more commands and basic validation
const SimpleFramework = require('./simple-framework');
// Migrate event handlers to command handlers
```

### From Lightweight → Production
```javascript
// When you need parallel execution and full features
const BumbaFramework = require('./bumba-framework-2');
// Enable department coordination and MCP integration
```

### Downgrade for Resource Constraints
```javascript
// Production → Lightweight (lose parallel features)
// Lightweight → Ultra-Minimal (lose command structure)
```

## Implementation Examples

### Production Deployment
```javascript
const BumbaFramework = require('./bumba-framework-2');

const framework = new BumbaFramework({
  departments: ['product', 'design', 'backend'],
  parallelSafety: true,
  mcpServers: ['memory', 'filesystem', 'github'],
  monitoring: true
});

await framework.initialize();
const result = await framework.handleCommand('implement', ['user-auth-system']);
```

### Lightweight Development
```javascript
const SimpleFramework = require('./simple-framework');

const framework = new SimpleFramework({
  enableValidation: true,
  enableMonitoring: false
});

await framework.initialize();
const result = await framework.execute('implement', args);
```

### Ultra-Minimal Usage
```javascript
const BumbaLite = require('./bumba-lite');

const lite = new BumbaLite({ conscious: true });
lite.on('complete', (result) => console.log('Done:', result));
await lite.implement('create simple API endpoint');
```

## Best Practices

### Framework Selection
1. **Start Minimal**: Begin with the smallest framework that meets your needs
2. **Measure Resource Usage**: Monitor memory and performance in your environment
3. **Plan for Growth**: Consider if you'll need to scale up features
4. **Environment-Specific**: Use different frameworks for different deployment targets

### Development Workflow
1. **Prototype**: Ultra-Minimal for rapid experimentation
2. **Development**: Lightweight for local development
3. **Staging**: Production for full testing
4. **Production**: Production for deployment

### Resource Optimization
- Use **Production** when you need full features and have resources
- Use **Lightweight** when resources are limited but you need structure
- Use **Ultra-Minimal** when minimal footprint is critical

---

*Framework consolidation completed in Sprint 2C*  
*Production: bumba-framework-2.js • Lightweight: simple-framework.js • Ultra-Minimal: bumba-lite.js*
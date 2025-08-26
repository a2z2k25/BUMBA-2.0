# BUMBA Command Handlers

BUMBA provides different command handler implementations for various use cases and deployment scenarios.

## Command Handler Hierarchy

### Primary Handler: `command-handler.js` 🏁
**Purpose**: Full-featured command processing with parallel coordination  
**Commands**: 66 registered commands  
**Features**:
- 🏁 Parallel agent coordination
- 🏁 File locking and territory management
- 🏁 Department routing (Product, Design, Backend)
- 🏁 Advanced error handling and logging
- 🏁 Hook system integration
- 🏁 Performance monitoring

**Usage**:
```javascript
const BumbaCommandHandler = require('./command-handler');
const handler = new BumbaCommandHandler();
```

**Recommended For**: Production deployments, full framework usage

---

### Lightweight Handler: `simple-command-handler.js` 🟢
**Purpose**: Streamlined command processing without coordination overhead  
**Commands**: Core essential commands  
**Features**:
- 🏁 Basic command routing
- 🏁 Security validation
- 🏁 Error tracking
- 🔴 No parallel coordination
- 🔴 No territory management
- 🔴 Simplified department routing

**Usage**:
```javascript
const { handleCommand } = require('./simple-command-handler');
```

**Recommended For**: Resource-constrained environments, simple deployments, embedded usage

---

### Deprecated Handler: `deprecated/parallel-command-handler.js` 🟡
**Status**: DEPRECATED as of Sprint 2A  
**Reason**: Functionality merged into main command-handler.js  
**Removal**: Planned for v2.0.0

## Command Handler Selection Guide

### Use `command-handler.js` when:
- 🏁 Running in production environment
- 🏁 Need parallel agent execution
- 🏁 Multiple users/departments
- 🏁 Complex project requirements
- 🏁 Full framework features needed

### Use `simple-command-handler.js` when:
- 🏁 Resource constraints (memory < 1GB)
- 🏁 Single-user environment
- 🏁 Embedded/IoT deployment
- 🏁 Simple automation tasks
- 🏁 Minimal dependencies preferred

## Implementation Details

### Command Registration
Both handlers support command registration but with different capabilities:

```javascript
// Full handler - with department routing
handler.registerCommand('implement', {
  description: 'Implement feature with full coordination',
  department: 'auto', // Smart routing
  requiresCoordination: true
});

// Simple handler - direct processing
handler.registerCommand('implement', {
  description: 'Implement feature (lightweight)',
  handler: (args, context) => processTask('implement', args, context)
});
```

### Performance Characteristics

| Feature | command-handler.js | simple-command-handler.js |
|---------|-------------------|---------------------------|
| Memory Usage | ~50MB | ~10MB |
| Startup Time | ~2s | ~500ms |
| Command Latency | 100-500ms | 50-100ms |
| Concurrent Commands | Unlimited | Limited |
| Coordination Overhead | Yes | No |

## Migration Guide

### From deprecated parallel-command-handler.js:
```javascript
// Old (deprecated)
const ParallelCommandHandler = require('./parallel-command-handler');

// New (recommended)
const BumbaCommandHandler = require('./command-handler');
```

### Choosing between full and simple:
1. Assess your resource constraints
2. Determine if you need parallel features
3. Consider user/deployment scenario
4. Start with simple, upgrade to full as needed

## API Compatibility

Both active handlers provide compatible APIs for basic operations:
- `registerCommand(name, config)`
- `handleCommand(command, args, context)`
- `getCommands()` - List available commands
- `validateCommand(command)` - Security validation

Advanced features (coordination, territories, parallel execution) are only available in the full command-handler.js.

---

*Unified during Sprint 2A: Command Handler Unification*  
*Primary: command-handler.js (66 commands) • Lightweight: simple-command-handler.js • Deprecated: parallel-command-handler.js*
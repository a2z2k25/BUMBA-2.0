# Sprint 7: Global State Elimination Mapping

## Status: IN PROGRESS
## Problem: 193 global state pollutions across 48 files

---

## Global State Categories

### 1. Garbage Collection (global.gc) - 15 files
**Risk**: Direct GC manipulation can destabilize Node.js
**Files**:
- `/src/core/unified-monitoring-system.js` - Wraps global.gc
- `/src/core/pooling/memory-manager.js` - Forces GC calls
- `/src/core/memory/memory-optimizer.js` - Multiple GC triggers
- `/src/core/modes/eco-mode-enhanced.js` - Eco mode GC
- `/src/core/modes/eco-mode.js` - Basic eco GC
- `/src/core/performance/performance-monitor.js` - Performance GC
- `/src/core/resource-management/*` - Resource cleanup GC

### 2. Global Pools (global.specialistPool, etc.) - 12 files
**Risk**: Shared mutable state, race conditions
**Instances**:
- `global.specialistPool` - Specialist instances
- `global.activeSpecialists` - Active specialist tracking
- `global.poolManager` - Pool management
- `global.connectionPool` - Connection management

### 3. Global Caches (global.cache) - 8 files
**Risk**: Memory leaks, stale data
**Types**:
- `global.apiCache` - API response caching
- `global.configCache` - Configuration caching
- `global.templateCache` - Template storage

### 4. Global Buffers (global.logBuffer) - 6 files
**Risk**: Unbounded growth, memory leaks
**Usage**:
- Log accumulation
- Event buffering
- Message queuing

### 5. Global Configuration (global.config) - 10 files
**Risk**: Configuration mutations affecting entire app
**Issues**:
- Runtime config changes
- No validation
- Side effects

### 6. Global Timers (global.timers) - 5 files
**Risk**: Timer leaks, cleanup issues
**Note**: Should use timer-registry.js instead

### 7. Global Event Emitters - 4 files
**Risk**: Event handler leaks
**Usage**:
- Cross-module communication
- Event broadcasting

---

## Solution Architecture

### Phase 1: Create State Management Infrastructure

```javascript
// src/core/state/global-state-manager.js
class GlobalStateManager {
  constructor() {
    this._state = new Map();
    this._subscribers = new Map();
    this._validators = new Map();
  }
  
  register(namespace, initialState, validator) {
    // Register managed state namespace
  }
  
  get(namespace, key) {
    // Safe state access with validation
  }
  
  set(namespace, key, value) {
    // Validated state updates
  }
  
  subscribe(namespace, callback) {
    // State change notifications
  }
}
```

### Phase 2: Dependency Injection Pattern

```javascript
// src/core/state/dependency-container.js
class DependencyContainer {
  constructor() {
    this._services = new Map();
    this._singletons = new Map();
  }
  
  register(name, factory, options = {}) {
    // Register service factory
  }
  
  resolve(name) {
    // Resolve dependencies
  }
}
```

### Phase 3: Migration Patterns

#### Before (UNSAFE):
```javascript
// Direct global mutation
global.specialistPool = new Map();
global.gc && global.gc();
global.config.apiKey = 'secret';
```

#### After (SAFE):
```javascript
// Using state manager
const { stateManager } = require('./state/global-state-manager');

// Register namespace
stateManager.register('specialists', {
  pool: new Map(),
  activeCount: 0
});

// Safe access
const pool = stateManager.get('specialists', 'pool');

// Safe updates with validation
stateManager.set('specialists', 'activeCount', 5);
```

---

## Priority Migration Order

### Critical (Security Risk):
1. Configuration globals - Can expose secrets
2. API cache globals - May leak sensitive data
3. Connection pools - Security boundaries

### High (Stability Risk):
1. GC manipulation - System stability
2. Specialist pools - Core functionality
3. Timer globals - Memory leaks

### Medium (Performance):
1. Log buffers - Memory management
2. Template caches - Resource usage
3. Event emitters - Handler management

---

## Files to Create

1. `/src/core/state/global-state-manager.js` - Central state management
2. `/src/core/state/dependency-container.js` - DI container
3. `/src/core/state/gc-manager.js` - Safe GC wrapper
4. `/src/core/state/pool-manager.js` - Centralized pooling
5. `/src/core/state/cache-manager.js` - Managed caching

---

## Migration Script

```javascript
// scripts/migrate-global-state.js
const files = [
  'src/core/unified-monitoring-system.js',
  'src/core/pooling/memory-manager.js',
  // ... all 48 files
];

const patterns = [
  { from: /global\.gc/g, to: "gcManager.requestGC" },
  { from: /global\.specialistPool/g, to: "stateManager.get('specialists', 'pool')" },
  { from: /global\.(\w+)Cache/g, to: "cacheManager.get('$1')" }
];

// Auto-migration with validation
```

---

## Testing Strategy

1. **Unit Tests**: Each state manager component
2. **Integration Tests**: State isolation between modules
3. **Migration Tests**: Verify no global pollution
4. **Performance Tests**: No regression from changes

---

## Success Metrics

- ✅ Zero direct global mutations
- ✅ All state changes validated
- ✅ No shared mutable state
- ✅ Proper cleanup on exit
- ✅ No memory leaks from state

---

**Sprint 7 Status**: Mapping complete, ready for implementation
# BUMBA Import Pattern Guidelines

This document establishes consistent import patterns and dependency management practices for the BUMBA framework.

## Import Patterns

### 🏁 Recommended Patterns

#### 1. Coordination Systems (Preferred)
```javascript
// Use centralized coordination hub
const { getCoordinationHub } = require('./coordination');

class MyComponent {
  constructor() {
    this.coordination = getCoordinationHub();
  }
  
  async initialize() {
    await this.coordination.initialize();
    this.systems = this.coordination.getAllSystems();
  }
}
```

#### 2. Individual Coordination Systems (Backward Compatible)
```javascript
// Individual system imports
const { getInstance: getFileLocking } = require('./coordination/file-locking-system');
const { getInstance: getTerritoryManager } = require('./coordination/territory-manager');
```

#### 3. Dependency Injection Container (Advanced)
```javascript
// Use DI container for complex dependencies
const { container } = require('./di-container');

class MyComponent {
  constructor() {
    this.fileLocking = container.get('fileLocking');
    this.logger = container.get('logger');
  }
}
```

#### 4. Framework Selection
```javascript
// Clear framework imports
const BumbaFramework = require('./bumba-framework-2');      // Production
const SimpleFramework = require('./simple-framework');      // Lightweight  
const BumbaLite = require('./bumba-lite');                 // Ultra-minimal
```

### 🔴 Deprecated Patterns

#### Avoid Redirect Imports
```javascript
// 🔴 Deprecated - redirect wrapper
const { BumbaIntelligentRouter } = require('./intelligent-router');

// 🏁 Correct - direct import
const { BumbaIntelligentRouter } = require('./unified-routing-system');
```

#### Avoid Multiple Command Handlers
```javascript
// 🔴 Deprecated - parallel handler
const ParallelCommandHandler = require('./parallel-command-handler');

// 🏁 Correct - unified handler
const BumbaCommandHandler = require('./command-handler');
```

## Singleton Management

### Standard Singleton Pattern
```javascript
// In module file
let instance = null;

function getInstance() {
  if (!instance) {
    instance = new MyClass();
  }
  return instance;
}

module.exports = {
  getInstance,
  MyClass
};
```

### Using Coordination Hub
```javascript
// Recommended for coordination systems
const { getCoordinationHub } = require('./coordination');

class MyService {
  constructor() {
    this.hub = getCoordinationHub();
  }
  
  async initialize() {
    await this.hub.initialize();
    // All coordination systems now available
  }
}
```

## Circular Dependency Prevention

### 🏁 Good Practices

#### 1. Use Dependency Injection
```javascript
// Instead of direct imports in constructor
class ServiceA {
  constructor(serviceB) {  // Injected dependency
    this.serviceB = serviceB;
  }
}
```

#### 2. Late Binding
```javascript
// Load dependencies when needed
class ServiceA {
  getServiceB() {
    if (!this._serviceB) {
      this._serviceB = require('./service-b').getInstance();
    }
    return this._serviceB;
  }
}
```

#### 3. Event-Based Communication
```javascript
// Use events to avoid direct coupling
class ServiceA extends EventEmitter {
  doSomething() {
    this.emit('task:complete', data);
  }
}
```

### 🔴 Circular Dependency Anti-Patterns

```javascript
// 🔴 Don't do this - creates circular dependency
// service-a.js
const ServiceB = require('./service-b');

// service-b.js  
const ServiceA = require('./service-a');
```

## Import Organization

### File Structure
```javascript
// 1. Node.js built-in modules
const fs = require('fs');
const path = require('path');

// 2. Third-party modules
const express = require('express');
const lodash = require('lodash');

// 3. Framework core modules
const { logger } = require('./logging/bumba-logger');
const { getCoordinationHub } = require('./coordination');

// 4. Local modules (same directory)
const LocalHelper = require('./local-helper');

// 5. Component/service definitions
class MyComponent {
  // ...
}
```

### Import Grouping
```javascript
// Group related imports
const {
  getInstance: getFileLocking,
  getInstance: getTerritoryManager,
  getInstance: getSafeFileOps
} = require('./coordination');

// Or use hub approach
const { getCoordinationHub } = require('./coordination');
```

## Testing Import Patterns

### Mock Coordination Systems
```javascript
// In test files
const mockCoordination = {
  fileLocking: { acquireLock: jest.fn() },
  territoryManager: { allocateTerritory: jest.fn() },
  safeFileOps: { safeWrite: jest.fn() }
};

jest.mock('./coordination', () => ({
  getCoordinationHub: () => ({
    getAllSystems: () => mockCoordination
  })
}));
```

### Dependency Injection Testing
```javascript
// Use DI container for testing
const { DIContainer } = require('./di-container');

describe('MyComponent', () => {
  let container;
  
  beforeEach(() => {
    container = new DIContainer();
    container.registerInstance('fileLocking', mockFileLocking);
  });
});
```

## Performance Considerations

### Lazy Loading
```javascript
// Load heavy modules only when needed
class FrameworkManager {
  getProductionFramework() {
    if (!this._prodFramework) {
      this._prodFramework = require('./bumba-framework-2');
    }
    return this._prodFramework;
  }
}
```

### Module Caching
```javascript
// Take advantage of Node.js module caching
const frameworks = {
  get production() { return require('./bumba-framework-2'); },
  get simple() { return require('./simple-framework'); },
  get lite() { return require('./bumba-lite'); }
};
```

## Migration Guide

### From Direct Imports to Coordination Hub
```javascript
// Old pattern
const { getInstance: getFileLocking } = require('./coordination/file-locking-system');
const { getInstance: getTerritoryManager } = require('./coordination/territory-manager');

// New pattern  
const { getCoordinationHub } = require('./coordination');
const hub = getCoordinationHub();
await hub.initialize();
const { fileLocking, territoryManager } = hub.getAllSystems();
```

### From Deprecated Handlers
```javascript
// Old deprecated import
const ParallelCommandHandler = require('./parallel-command-handler');

// New unified import
const BumbaCommandHandler = require('./command-handler');
```

## Best Practices Summary

1. **Use Coordination Hub**: Prefer centralized coordination system access
2. **Avoid Circular Dependencies**: Use dependency injection or late binding
3. **Clear Import Structure**: Group and organize imports logically
4. **Lazy Load Heavy Modules**: Import expensive modules only when needed
5. **Use Singleton Patterns**: Consistent getInstance() patterns for services
6. **Leverage DI Container**: For complex dependency management
7. **Test-Friendly Patterns**: Design imports to be easily mockable

---

*Import patterns standardized in Sprint 2D*  
*Coordination Hub: ./coordination/index.js • DI Container: ./di-container.js*
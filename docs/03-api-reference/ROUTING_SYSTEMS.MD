# BUMBA Routing Systems

BUMBA provides different routing implementations for various deployment scenarios and performance requirements.

## Routing System Hierarchy

### Primary Router: `unified-routing-system.js` 🏁
**Purpose**: Intelligent command routing with department coordination  
**Features**:
- 🏁 Intelligent task analysis and intent detection
- 🏁 Department-aware routing (Product, Design, Backend)
- 🏁 Specialist requirement detection
- 🏁 Complexity analysis and confidence scoring
- 🏁 Executive-level task detection
- 🏁 Pattern matching and language detection
- 🏁 Performance monitoring and metrics

**Usage**:
```javascript
const { BumbaIntelligentRouter } = require('./unified-routing-system');
const router = new BumbaIntelligentRouter();

const route = await router.determineRoute({
  command: 'implement',
  args: ['user authentication system'],
  context: { user: 'developer', priority: 'high' }
});
```

**Routing Decision Process**:
1. **Intent Analysis** - Determines primary task intent
2. **Department Selection** - Routes to appropriate department(s)
3. **Specialist Detection** - Identifies required specialist skills
4. **Complexity Assessment** - Calculates task complexity
5. **Confidence Scoring** - Measures routing confidence
6. **Executive Detection** - Identifies leadership-level tasks

---

### Lightweight Router: `simple-router.js` 🟢
**Purpose**: Basic command-to-handler mapping without analysis overhead  
**Features**:
- 🏁 Direct command-to-handler mapping
- 🏁 Middleware support for request processing
- 🏁 Fallback handler for unknown commands
- 🔴 No department routing
- 🔴 No intelligent analysis
- 🔴 No complexity assessment

**Usage**:
```javascript
const SimpleRouter = require('./simple-router');
const router = new SimpleRouter();

// Register route
router.registerRoute('implement', async (args, context) => {
  return await simpleImplementation(args, context);
});

// Route command
const result = await router.route('implement', args, context);
```

**Used By**: 
- `simple-command-handler.js`
- `simple-framework.js`

---

### Deprecated Router: `deprecated/intelligent-router.js` 🟡
**Status**: DEPRECATED as of Sprint 2B  
**Reason**: Was just a redirect wrapper to unified-routing-system.js  
**Removal**: Planned for v2.0.0

## Router Selection Guide

### Use `unified-routing-system.js` when:
- 🏁 Need intelligent command analysis
- 🏁 Multiple departments working together
- 🏁 Complex task coordination required
- 🏁 Full framework features needed
- 🏁 Production deployment

### Use `simple-router.js` when:
- 🏁 Simple command-to-function mapping
- 🏁 Single-user environment
- 🏁 Resource constraints (memory < 1GB)
- 🏁 Embedded/IoT deployment
- 🏁 Minimal overhead preferred

## Routing Decision Matrix

| Task Type | Unified Router Output | Simple Router Output |
|-----------|----------------------|---------------------|
| "implement auth" | → Backend Department, Security Specialist, High Complexity | → implement_handler(args) |
| "design login UI" | → Design Department, UI Specialist, Medium Complexity | → design_handler(args) |
| "create PRD" | → Product Department, Strategy Specialist, Executive Level | → prd_handler(args) |
| "fix bug" | → Auto-detect department, Debug Specialist, Low Complexity | → fix_handler(args) |

## Advanced Routing Features (Unified Only)

### Intent Detection
```javascript
const analysis = router.analyzeIntent('implement', ['secure', 'user', 'authentication']);
// Returns: {
//   primaryIntent: 'security_implementation',
//   departments: ['backend'],
//   specialists: ['security', 'backend'],
//   complexity: 0.8,
//   confidence: 0.95
// }
```

### Department Coordination
```javascript
const route = await router.determineRoute(task);
if (route.requiresCoordination) {
  // Multiple departments need to collaborate
  const coordination = router.createCoordinationPlan(route);
}
```

### Executive Detection
```javascript
const analysis = router.analyzeIntent('create', ['company', 'strategy', 'roadmap']);
// Returns: { isExecutiveLevel: true }
// Routes to Product Strategist in Executive Mode
```

## Performance Characteristics

| Metric | Unified Router | Simple Router |
|--------|---------------|---------------|
| Routing Latency | 10-50ms | 1-5ms |
| Memory Usage | ~5MB | ~500KB |
| Features | Full Analysis | Direct Mapping |
| CPU Overhead | Medium | Minimal |

## Integration Patterns

### Framework Integration
```javascript
// In BumbaFramework2
constructor() {
  this.router = new BumbaIntelligentRouter();
  this.router.registerDepartments(this.departments);
}

async handleCommand(command, args, context) {
  const route = await this.router.determineRoute({command, args, context});
  return await this.executeDepartmentRoute(route);
}
```

### Simple Framework Integration
```javascript
// In SimpleFramework  
constructor() {
  this.router = new SimpleRouter();
  this.registerSimpleRoutes();
}

registerSimpleRoutes() {
  this.router.registerRoute('implement', this.handleImplement.bind(this));
  this.router.registerRoute('analyze', this.handleAnalyze.bind(this));
}
```

## Migration Guide

### From deprecated intelligent-router.js:
```javascript
// Old (deprecated)
const { BumbaIntelligentRouter } = require('./intelligent-router');

// New (recommended) 
const { BumbaIntelligentRouter } = require('./unified-routing-system');
```

### Adding Custom Routes
```javascript
// Unified Router - Register department handler
router.registerDepartment('custom', {
  name: 'Custom Department',
  handler: customDepartmentHandler,
  specialists: ['custom-specialist'],
  priority: 5
});

// Simple Router - Direct handler registration
router.registerRoute('custom', customHandler);
```

---

*Unified during Sprint 2B: Router System Completion*  
*Primary: unified-routing-system.js • Lightweight: simple-router.js • Deprecated: intelligent-router.js*
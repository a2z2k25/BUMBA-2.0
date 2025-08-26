# AGENTS.md
## Bumba Framework Agent Orchestration & Technical Documentation

*Technical reference for AI agents working with the Bumba Framework*

---

## 🟢️ Framework Architecture

### Entry Points
```
src/index.js                    # Main entry, creates BumbaFramework2
src/core/bumba-framework-2.js   # Primary framework class
src/core/simple-framework.js    # Lightweight alternative
```

### Core Systems
```
src/core/
├── departments/                 # Department managers (orchestrators)
├── specialists/                 # Agent implementations  
├── orchestration/              # Task coordination systems
├── memory/                     # Memory and context management
├── consciousness/              # Validation and ethics layer
├── communication/              # Inter-agent messaging
└── integration/                # External system adapters
```

---

## 👥 Agent Hierarchy

### 1. Executive Layer (Orchestrators)

#### ProductStrategistManager
- **Location**: `src/core/departments/product-strategist-manager.js`
- **Class**: `ProductStrategistManager` (ENHANCED - never rename!)
- **Enhancement**: `enhanceProductStrategist()` wrapper pattern
- **Role**: Supreme orchestrator, can become CEO in executive mode
- **Connects via**: `connectProductStrategist()` to orchestration hooks
- **Priority**: Highest (1) for Claude Max model access

#### DesignEngineerManager  
- **Location**: `src/core/departments/design-engineer-manager.js`
- **Class**: `DesignEngineerManager`
- **Role**: UX/UI orchestration, frontend coordination
- **Manages**: React, Vue, Angular, CSS specialists

#### BackendEngineerManager
- **Location**: `src/core/departments/backend-engineer-manager.js`
- **Class**: `BackendEngineerManager`
- **Role**: Backend orchestration, API coordination
- **Manages**: Database, DevOps, Security specialists

### 2. Specialist Layer (Workers)

All specialists extend `UnifiedSpecialistBase` - this inheritance is SACRED!

#### Technical Specialists

**Languages** (`src/core/specialists/technical/languages/`)
- `JavascriptSpecialist` - JS, Node.js, ES6+
- `TypescriptSpecialist` - TS, type systems
- `PythonSpecialist` - Python, data science
- `GolangSpecialist` - Go, concurrency
- `RustSpecialist` - Rust, systems programming
- `JavaSpecialist` - Java, enterprise
- `CsharpSpecialist` - C#, .NET
- `RubySpecialist` - Ruby, Rails
- `PhpSpecialist` - PHP, web development
- `SwiftSpecialist` - Swift, iOS
- `KotlinSpecialist` - Kotlin, Android
- `CppSpecialist` - C++, performance
- `SqlSpecialist` - SQL, database queries

**Databases** (`src/core/specialists/technical/databases/`)
- `PostgresqlSpecialist` - PostgreSQL
- `MongodbSpecialist` - MongoDB
- `RedisSpecialist` - Redis caching
- `ElasticsearchSpecialist` - Search engines
- `DynamodbSpecialist` - AWS DynamoDB
- `Neo4jSpecialist` - Graph databases
- `CassandraSpecialist` - Distributed databases
- `MysqlSpecialist` - MySQL

**DevOps** (`src/core/specialists/technical/devops/`)
- `DockerSpecialist` - Containerization
- `KubernetesSpecialist` - Orchestration
- `TerraformSpecialist` - Infrastructure as code
- `CicdSpecialist` - CI/CD pipelines
- `AwsSpecialist` - AWS services
- `MonitoringSpecialist` - Observability

#### Experience Specialists

**Frontend** (`src/core/specialists/experience/`)
- `ReactSpecialist` - React framework
- `VueSpecialist` - Vue.js
- `AngularSpecialist` - Angular
- `CssSpecialist` - Styling, animations
- `ShadcnSpecialist` - Component libraries

#### Strategic Specialists

**Business** (`src/core/specialists/strategic/`)
- `BusinessAnalyst` - Requirements analysis
- `ProductManager` - Product strategy
- `MarketResearchSpecialist` - Market analysis

---

## 🔄 Orchestration Systems

### Primary Orchestrators

1. **BumbaOrchestrationSystem**
   - Location: `src/core/orchestration/index.js`
   - Central orchestration coordinator
   - Manages wave execution

2. **WaveOrchestrator**
   - Location: `src/core/orchestration/wave-orchestrator.js`
   - Coordinates parallel agent execution
   - Manages dependencies between tasks

3. **TaskOrchestrator**
   - Location: `src/core/orchestration/task-orchestrator.js`
   - Individual task assignment
   - Task lifecycle management

4. **OrchestrationHookSystem**
   - Location: `src/core/orchestration/orchestration-hooks.js`
   - Event-driven orchestration
   - Connects departments to orchestration
   - CRITICAL: Uses `connectProductStrategist()` method

---

## 💾 Memory & Context Systems

### Memory Hierarchy

1. **UnifiedMemorySystem**
   - Short-term memory (STM)
   - Working memory (WM)  
   - Long-term memory (LTM)
   - Semantic memory

2. **ContextManager**
   - Location: `src/core/knowledge/context-manager.js`
   - Context preservation during handoffs
   - Context streaming between agents

3. **KnowledgeBase**
   - Location: `src/core/knowledge/knowledge-base.js`
   - Persistent knowledge storage
   - Knowledge transfer protocol

4. **TeamMemory**
   - Location: `src/core/memory/team-memory.js`
   - Shared team knowledge
   - JSON-based (simple by design)

---

## 📡 Communication Systems

### Message Flow

1. **UnifiedCommunicationSystem**
   - Central message router
   - Pub/sub patterns
   - Event emitters

2. **MessageQueue**
   - Location: `src/core/communication/message-queue.js`
   - Priority-based queuing
   - Dead letter handling

3. **CrossTeamSyncSystem**
   - Location: `src/core/collaboration/cross-team-sync.js`
   - Inter-department communication
   - Conflict resolution

---

## 🟢️ Development Guidelines

### Working with Specialists

```javascript
// CORRECT - Using the unified base
class NewSpecialist extends UnifiedSpecialistBase {
  constructor(department, context) {
    super({
      id: 'new-specialist',
      name: 'New Specialist',
      type: 'new-specialist',
      category: 'technical',
      department: department,
      ...context
    });
  }
}

// WRONG - Don't create standalone specialists
class BadSpecialist {  // NO! Must extend UnifiedSpecialistBase
  constructor() { }
}
```

### Connecting to Orchestration

```javascript
// CORRECT - Connect through the hook system
orchestrationHooks.connectProductStrategist(manager);

// WRONG - Don't bypass the connection pattern
manager.orchestrator = orchestrator; // NO!
```

### Memory Operations

```javascript
// CORRECT - Use scoped memory
const scope = await memoryBroker.scopeMemory(agentId, taskId);

// WRONG - Don't access memory directly
memorySystem.store(data); // NO! Use proper scoping
```

---

## 🟢 Task Execution Flow

### Standard Execution Path

1. **Task Received** → Router (`BumbaIntelligentRouter`)
2. **Department Assignment** → Department Manager
3. **Specialist Selection** → Registry lookup
4. **Context Creation** → Memory scope
5. **Task Execution** → Specialist.processTask()
6. **Result Storage** → Unified memory
7. **Context Handoff** → Next agent if needed
8. **Completion** → Result returned

### Parallel Execution

```
Wave Start
    ├── Agent A ──┐
    ├── Agent B ──┼── Synchronization Point
    └── Agent C ──┘
Wave Complete
```

---

## 🟢️ Configuration

### Environment Variables
```bash
NODE_ENV=development|production|test
BUMBA_DISABLE_MONITORING=true|false
BUMBA_STATUS_LINE=true|false
BUMBA_WHISPERS=true|false
BUMBA_CHAINING=true|false
BUMBA_MAX_CONCURRENT=5
```

### Feature Flags
```javascript
// .bumba-config.json
{
  "features": {
    "orchestration": true,
    "unifiedMemory": true,
    "crossTeamSync": true,
    "consciousnessLayer": true
  }
}
```

---

## 🧪 Testing

### Test Structure
```
tests/
├── unit/          # Isolated component tests
├── integration/   # Component interaction tests
├── e2e/          # End-to-end workflows
└── manual/       # Manual test scenarios
```

### Running Tests
```bash
# All tests (will hang - known issue)
npm test

# Single test file (recommended)
npx jest tests/unit/core/framework.test.js --no-coverage

# With timeout to prevent hanging
npx jest --testTimeout=5000 --maxWorkers=1
```

### Known Test Characteristics
- Tests EXPECT offline mode (feature, not bug)
- Tests EXPECT mock providers (privacy feature)
- Some tests hang due to intervals not clearing
- ~30% pass rate is due to implementation issues, not API absence

---

## 🔧 Common Operations

### Adding a New Specialist

1. Create file in appropriate directory
2. Extend `UnifiedSpecialistBase`
3. Register in specialist registry
4. Add to lazy loading configuration
5. Create tests

### Connecting New Systems

1. Create adapter (don't modify existing)
2. Use event emitters for loose coupling
3. Add to orchestration hooks if needed
4. Test with and without connection

### Debugging

```javascript
// Enable debug logging
process.env.DEBUG = 'bumba:*';

// Check orchestration state
orchestrationSystem.getState();

// Verify connections
orchestrationHooks.productStrategist !== null;

// Memory inspection
memorySystem.inspect();
```

---

## 🟠️ Critical Warnings

### NEVER DO THESE
1. **NEVER rename**: `BumbaFramework2`, `ProductStrategistManager`, `UnifiedSpecialistBase`
2. **NEVER break**: Enhancement patterns (`enhanceProductStrategist`)
3. **NEVER remove**: Offline modes, mock providers
4. **NEVER bypass**: Orchestration hooks, memory scoping
5. **NEVER assume**: APIs should connect (they shouldn't by design)

### ALWAYS DO THESE
1. **ALWAYS preserve**: Class names, method signatures
2. **ALWAYS test**: With offline mode, without external deps
3. **ALWAYS use**: Adapters for integration, enhancement for extension
4. **ALWAYS check**: MYHEART.md before major changes
5. **ALWAYS maintain**: Privacy-first, offline-capable design

---

## 📊 System Metrics

### Current State
- **Specialists**: 60+ registered
- **Departments**: 3 primary (Product, Design, Backend)
- **Orchestrators**: 4 active systems
- **Memory Tiers**: 4-level hierarchy
- **Test Coverage**: ~30% passing (by design, not failure)

### Performance Targets
- Task assignment: <100ms
- Context handoff: <50ms
- Memory access: <10ms
- Message routing: <5ms
- Orchestration overhead: <10%

---

## 🔄 Version History

### Current Version: 2.0
- Unified specialist base
- Enhanced orchestration
- Privacy-first design
- Offline-capable operation

### Migration Notes
- From 1.x: Use enhancement patterns
- From SimpleFramework: Gradual migration supported
- From API-connected: Use mock providers

---

## 📚 Additional Resources

### Internal Documentation
- `/docs/ARCHITECTURE_AUDIT.md` - System analysis
- `/docs/PRD_UNIFIED_INTEGRATION_LAYER.md` - Integration plans
- `/MYHEART.md` - Framework soul and philosophy

### Key Files to Study
1. `src/core/bumba-framework-2.js` - Main framework
2. `src/core/departments/product-strategist-manager.js` - Orchestration lead
3. `src/core/specialists/unified-specialist-base.js` - Specialist foundation
4. `src/core/orchestration/orchestration-hooks.js` - Connection system

---

## 🆘 Troubleshooting

### Framework Won't Start
- Check: Are all specialists registered?
- Check: Is ProductStrategist connected to hooks?
- Solution: Clear intervals, restart

### Tests Hanging
- Cause: Intervals not cleared
- Solution: Add proper cleanup in afterAll()

### Specialists Not Found
- Check: Registry initialization
- Check: File exists in correct location
- Solution: Create missing specialist files

### Context Lost in Handoff
- Check: Memory broker scoping
- Check: Context inheritance
- Solution: Verify handoff protocol

---

## 📝 Quick Reference

### Command Execution
```javascript
framework.executeCommand('analyze', ['market'], { context });
```

### Specialist Creation
```javascript
const specialist = new UnifiedSpecialistBase(config);
await specialist.processTask(task);
```

### Memory Access
```javascript
const memory = framework.memorySystem;
const scope = await memory.createScope(agentId, taskId);
```

### Orchestration Hook
```javascript
orchestrationHooks.trigger('task:complete', { task, result });
```

---

*This document is the technical truth. MYHEART.md is the philosophical truth. Together, they are the complete truth of the Bumba Framework.*

**Last Updated**: December 24, 2024
**Framework Version: 2.0
**Status**: Living Document
# BUMBA Framework Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     BUMBA Framework v2.0                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Product   │  │   Design    │  │   Backend   │         │
│  │  Strategist │  │  Engineer   │  │  Engineer   │         │
│  │  Department │  │  Department │  │  Department │         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         │
│         │                 │                 │                │
│         └─────────────────┼─────────────────┘                │
│                           │                                  │
│                    ┌──────▼──────┐                          │
│                    │   Command    │                          │
│                    │   Handler    │                          │
│                    └──────┬──────┘                          │
│                           │                                  │
│         ┌─────────────────┼─────────────────┐               │
│         │                 │                 │               │
│  ┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐        │
│  │ Specialists │  │  Monitoring │  │ Integration │        │
│  │   (33)      │  │   Systems   │  │   (MCP)     │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                             │
│  ┌─────────────────────────────────────────────────┐       │
│  │      Dynamic Agent Lifecycle Management          │       │
│  │  Spawning • Active • Validating • Deprecating    │       │
│  │  Team Composition • Knowledge Transfer           │       │
│  └─────────────────────────────────────────────────┘       │
│                                                             │
│  ┌─────────────────────────────────────────────────┐       │
│  │           Parallel Safety Layer                  │       │
│  │  File Locking • Territory Mgmt • Agent Identity  │       │
│  │  Safe Operations • Coordination Dashboard        │       │
│  └─────────────────────────────────────────────────┘       │
│                                                             │
│  ┌─────────────────────────────────────────────────┐       │
│  │           Consciousness Layer                    │       │
│  │  (Validation, Principles, Ethical Guidelines)    │       │
│  └─────────────────────────────────────────────────┘       │
│                                                             │
│  ┌─────────────────────────────────────────────────┐       │
│  │       Universal Hook System (45+ hooks)          │       │
│  │  Cost Optimization • Extensibility • Monitoring  │       │
│  └─────────────────────────────────────────────────┘       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Department System
Three main departments manage different aspects:
- **Product Strategist**: Business logic, requirements, roadmapping
- **Design Engineer**: UI/UX, visual design, frontend architecture
- **Backend Engineer**: APIs, databases, infrastructure, security

### 2. Specialist System
33 specialists provide deep expertise:
- Spawned on-demand for specific tasks
- Each has unique personality and approach
- Collaborate across departments
- Dynamic lifecycle management

### 3. Command System
58 commands routed intelligently:
- Global commands auto-route to appropriate department
- Department-specific commands go directly
- Multi-agent commands coordinate specialists
- Hook-enhanced command processing

### 4. Dynamic Agent Lifecycle Management (NEW v2.1)
Complete agent lifecycle orchestration:
- **6-State Lifecycle**: idle → spawning → active → validating → deprecating → deprecated
- **Dynamic Spawning Controller**: Adaptive agent creation based on demand
- **Agent Deprecation Manager**: Graceful retirement with knowledge preservation
- **Work Validation Framework**: Comprehensive quality assurance
- **Knowledge Transfer Protocol**: Learning preservation across agent generations
- **Adaptive Team Composition**: Dynamic team formation and optimization

### 5. Universal Hook System (NEW v2.1)
45+ extensibility points throughout the framework:
- **Team Composition Hooks**: Control team formation and validation
- **Model Selection Hooks**: Optimize costs with intelligent model choice
- **Lifecycle Hooks**: Monitor and control agent state transitions
- **Deprecation Hooks**: Customize retirement strategies
- **Knowledge Transfer Hooks**: Filter and transform learning data
- **API Hooks**: Request/response interception and monitoring
- **Department Hooks**: Cross-department coordination
- **Budget Hooks**: Cost enforcement and optimization

### 6. Resource Management
Intelligent resource allocation and optimization:
- **Claude Max Lock System**: Singleton access control with fallback
- **API Connection Manager**: Connection pooling and batching
- **Cost Optimization Engine**: 30-40% cost savings through model selection
- **Resource Usage Monitor**: Real-time tracking and limits
- **Agent Pool Optimizer**: Automatic scaling based on demand

### 7. Monitoring System
Real-time health and performance:
- Health Monitor with auto-repair
- Performance Metrics with SLA tracking
- Resource management and optimization
- Hook execution metrics
- Cost tracking and budgets

### 8. Integration Layer
External service connections:
- 25+ MCP servers for extended capabilities
- API integrations (OpenRouter, GitHub, Notion)
- Hook system for extensibility
- Multi-model support (Claude Max, DeepSeek, Qwen, Gemini)

### 9. Parallel Safety Layer
Production-ready parallel execution safety:
- **File Locking System**: Prevents simultaneous file access and race conditions
- **Territory Management**: Allocates exclusive work zones to prevent agent conflicts  
- **Safe File Operations**: Mandatory wrappers ensuring atomic operations and data integrity
- **Agent Identity System**: Unique tracking and lifecycle management for all components
- **Coordination Dashboard**: Real-time monitoring, safety reporting, and conflict detection

### 10. Consciousness Layer
Ethical and quality validation:
- Validates all commands against principles
- Ensures ethical development practices
- Maintains code quality standards

## Parallel Safety Architecture

### Safety Layer Components

```
┌─────────────────────────────────────────────────────────────┐
│                BUMBA Parallel Safety Layer                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   File Locking  │  │    Territory    │  │   Agent     │ │
│  │     System      │  │   Management    │  │  Identity   │ │
│  │                 │  │                 │  │   System    │ │
│  └─────────┬───────┘  └─────────┬───────┘  └──────┬──────┘ │
│            │                    │                 │        │
│            └────────────────────┼─────────────────┘        │
│                                 │                          │
│                    ┌────────────▼────────────┐             │
│                    │   Safe File Operations  │             │
│                    │        (Central)        │             │
│                    └────────────┬────────────┘             │
│                                 │                          │
│                    ┌────────────▼────────────┐             │
│                    │  Coordination Dashboard │             │
│                    │   (Monitoring & Safety) │             │
│                    └─────────────────────────┘             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Safety Integration Points

**Department Level Integration**:
```javascript
class DepartmentManager {
  constructor() {
    // CRITICAL: Coordination systems injected by framework
    this.safeFileOps = null;      // Safe file operations
    this.territoryManager = null; // Territory allocation
    this.fileLocking = null;      // File locking
    this.agentId = null;          // Unique agent identity
  }
  
  async executeSprintWithTracking(sprint) {
    // 1. Allocate exclusive territory
    const territory = await this.territoryManager.allocateTerritory(
      this.agentId, sprint
    );
    
    // 2. Execute only if territory is available
    if (territory.success) {
      try {
        return await this.executeSprint(sprint);
      } finally {
        // 3. Always release territory
        await this.territoryManager.releaseTerritory(this.agentId);
      }
    }
    
    return { status: 'blocked', reason: 'territory_conflict' };
  }
}
```

**Command Level Integration**:
```javascript
async handleCommand(command, args, context) {
  // 1. Generate unique agent context
  const commandAgentId = this.agentIdentity.generateAgentId('Command', command);
  context.agentId = commandAgentId;
  
  // 2. Register for tracking
  this.agentIdentity.registerAgent({ command }, {
    type: 'CommandExecution',
    name: command,
    temporary: true
  });
  
  // 3. Execute with safety guarantees
  return await this.executeWithCoordination(command, args, context);
}
```

### Safety Guarantees

**File Safety**:
- 🏁 Zero race conditions through exclusive locking
- 🏁 Atomic operations preventing partial writes
- 🏁 Automatic backup and rollback capabilities
- 🏁 Integrity verification after all operations

**Territory Safety**:
- 🏁 Exclusive work zones prevent agent overlap
- 🏁 Automatic conflict detection and resolution
- 🏁 Dynamic territory allocation and reallocation
- 🏁 Hierarchical territory management

**Agent Safety**:
- 🏁 Unique identity for every component
- 🏁 Complete lifecycle tracking and management
- 🏁 Activity monitoring and timeout handling
- 🏁 Automatic cleanup on termination

**System Safety**:
- 🏁 Real-time monitoring and alerting
- 🏁 Performance metrics and bottleneck detection
- 🏁 Safety violation reporting and recovery
- 🏁 Comprehensive logging and audit trails

## Data Flow

1. **Command Input** → Command Handler
2. **Hook: beforeCommand** → Pre-process command
3. **Routing** → Department/Specialist selection
4. **Hook: team:composition** → Optimize team formation
5. **Hook: model:selection** → Choose optimal AI model
6. **Validation** → Consciousness check
7. **Hook: lifecycle:transition** → Agent state management
8. **Execution** → Specialist processes task
9. **Hook: api:request** → Monitor API calls
10. **Monitoring** → Track performance/health
11. **Hook: knowledge:transfer** → Preserve learnings
12. **Hook: deprecation** → Manage agent retirement
13. **Response** → Return results to user

## Agent Lifecycle Management

### Lifecycle States

The framework implements a comprehensive 6-state lifecycle for all agents:

```
┌──────────┐     spawn()      ┌──────────┐     activate()    ┌──────────┐
│   IDLE   │ ───────────────► │ SPAWNING │ ───────────────► │  ACTIVE  │
└──────────┘                   └──────────┘                   └─────┬────┘
                                                                     │
                                                                validate()
                                                                     │
┌──────────┐     deprecate()   ┌──────────┐     complete()   ┌─────▼────┐
│DEPRECATED│ ◄─────────────── │DEPRECATING│ ◄─────────────── │VALIDATING│
└──────────┘                   └──────────┘                   └──────────┘
```

### Lifecycle Components

- **DynamicAgentLifecycleOrchestrator**: Central orchestration system
- **AgentLifecycleStateMachine**: State transition management
- **DynamicSpawningController**: Intelligent agent spawning
- **AgentDeprecationManager**: Retirement and cleanup strategies
- **KnowledgeTransferProtocol**: Knowledge preservation system
- **AdaptiveTeamComposition**: Dynamic team formation

## Hook System Integration

### Hook Execution Flow

```javascript
// Example: Model Selection with Cost Optimization
async selectModel(requirements) {
  // 1. Pre-selection hook
  let context = await hooks.executeHooks('model:beforeSelection', {
    requirements,
    availableModels: this.models
  });
  
  // 2. Cost evaluation hook
  context = await hooks.executeHooks('model:evaluateCost', {
    ...context,
    cost: calculateCost(context.model)
  });
  
  // 3. Alternative suggestion hook (if needed)
  if (context.suggestAlternative) {
    context = await hooks.executeHooks('model:suggestAlternative', {
      ...context,
      originalModel: context.model
    });
  }
  
  // 4. Post-selection hook
  context = await hooks.executeHooks('model:afterSelection', {
    ...context,
    selectedModel: context.alternativeModel || context.model
  });
  
  return context.selectedModel;
}
```

### Cost Optimization Strategy

The hook system enables 30-40% cost savings through:

1. **Dynamic Model Selection**: Automatically choose cheaper models for simple tasks
2. **Claude Max Management**: Fallback to alternatives when premium model locked
3. **Batch Processing**: Group requests to reduce API calls
4. **Response Caching**: Reuse results when appropriate
5. **Team Right-Sizing**: Use minimum agents needed

## Key Design Patterns

- **Singleton**: Core managers (Registry, Monitor, Handler, Claude Max Lock)
- **Factory**: Specialist creation and spawning
- **Observer**: Universal hook system with 45+ points
- **Strategy**: Department-specific implementations
- **State Machine**: Agent lifecycle management (6 states)
- **Circuit Breaker**: Fault tolerance in integrations
- **Object Pool**: Agent and connection pooling
- **Chain of Responsibility**: Hook handler chains
- **Template Method**: Lifecycle state transitions
- **Mediator**: Orchestrator coordination

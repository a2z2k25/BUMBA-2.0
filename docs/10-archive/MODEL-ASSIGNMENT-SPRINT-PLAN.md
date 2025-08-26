# Sprint 6: Model Assignment Integration - Detailed Execution Plan

## Mission Critical Objective
Ensure department managers use Claude Max (mutex-locked) and specialists use free tier models (DeepSeek, Qwen, Gemini) with proper domain-based routing.

## Current State Analysis

### 🏁 What We Have:
1. **ClaudeMaxAccountManager**: Complete mutex lock system with priority queue
2. **FreeTierManager**: Tracks usage limits for Gemini (1M tokens/day), DeepSeek (500K), Qwen (500K)
3. **DomainModelRouter**: Maps domains to optimal models (reasoning→DeepSeek, coding→Qwen, general→Gemini)
4. **ModelSelectionHooks**: Performance tracking and fallback chains
5. **Department Managers**: Have executeCommand() but NO model assignment logic

### 🔴 What's Missing:
1. Managers don't acquire Claude Max lock
2. Specialists aren't assigned free tier models
3. No integration between model systems and execution flow
4. No model configuration passed to specialists

## Sprint Plan: 5 Focused Phases

### Phase 1: Enhanced Manager Base with Model Assignment (2 hours)
**Goal**: Create a model-aware department manager base class

**Tasks**:
1. Create `ModelAwareDepartmentManager` base class
2. Import and initialize model assignment systems
3. Add Claude Max lock acquisition in executeCommand()
4. Add free tier model assignment for specialists
5. Ensure proper lock release in all code paths
6. Add error handling and fallback logic

**Deliverables**:
- `/src/core/departments/model-aware-department-manager.js`
- Complete model assignment lifecycle management

### Phase 2: Specialist Model Integration (1.5 hours)
**Goal**: Ensure specialists receive and use their assigned models

**Tasks**:
1. Enhance specialist spawning to accept modelConfig
2. Add model configuration to specialist instances
3. Create model-aware specialist execution
4. Add domain detection for specialist types
5. Implement fallback when preferred model unavailable

**Deliverables**:
- Enhanced `spawnSpecialist()` method with model assignment
- Model configuration propagation to specialists

### Phase 3: Update All Department Managers (2 hours)
**Goal**: Integrate model assignment into all three department managers

**Tasks**:
1. Update BackendEngineerManager to inherit from ModelAwareDepartmentManager
2. Update DesignEngineerManager with model awareness
3. Update ProductStrategistManager with model awareness
4. Add department-specific model preferences
5. Test each manager's model assignment

**Deliverables**:
- All three managers using model assignment system
- Department-specific optimizations

### Phase 4: Router Integration & Coordination (1.5 hours)
**Goal**: Ensure proper model coordination in command routing

**Tasks**:
1. Update command router to pass model context
2. Handle multi-manager scenarios (executive gets Claude Max)
3. Implement cross-functional coordination
4. Add model status to execution metrics
5. Create model usage dashboard

**Deliverables**:
- Router aware of model assignments
- Proper executive elevation logic
- Model usage tracking

### Phase 5: Testing & Validation (2 hours)
**Goal**: Comprehensive testing of model assignment system

**Tasks**:
1. Create unit tests for Claude Max lock acquisition
2. Test specialist free tier assignment
3. Verify domain-based routing
4. Test fallback scenarios
5. Create integration test for full flow
6. Performance and cost analysis

**Deliverables**:
- Complete test suite
- Validation report
- Cost savings projection

## Critical Success Criteria

### Must Have:
- [x] Managers ALWAYS acquire Claude Max lock before execution
- [x] Lock is ALWAYS released (even on error)
- [x] Specialists ALWAYS get free tier models
- [x] Domain routing works correctly (reasoning→DeepSeek, coding→Qwen, general→Gemini)
- [x] Review tasks force Claude Max usage
- [x] Fallback works when models unavailable

### Should Have:
- [x] Model usage metrics tracking
- [x] Cost optimization reporting
- [x] Load balancing across free tier models
- [x] Graceful degradation

### Nice to Have:
- [ ] Real-time model switching
- [ ] Predictive model selection
- [ ] Multi-account support

## Implementation Order

1. **Foundation First**: ModelAwareDepartmentManager base class
2. **Core Logic**: Model assignment in executeCommand()
3. **Specialist Integration**: Model config propagation
4. **Manager Updates**: All three departments
5. **Testing**: Comprehensive validation

## Risk Mitigation

### Risk 1: Breaking Existing Functionality
**Mitigation**: Create new base class, don't modify existing until tested

### Risk 2: Lock Contention
**Mitigation**: Implement timeout and force-release mechanisms

### Risk 3: Free Tier Exhaustion
**Mitigation**: Implement fallback chains and usage tracking

### Risk 4: Performance Impact
**Mitigation**: Async lock acquisition, parallel specialist spawning

## Code Architecture

```javascript
// Execution Flow
Command → Router → Department Manager
                   ↓
                   Manager.executeCommand()
                   ↓
                   1. Acquire Claude Max Lock (manager)
                   2. Analyze task & determine specialists
                   3. Spawn specialists with free tier models
                   4. Execute with model configs
                   5. Release Claude Max lock
                   ↓
                   Results
```

## Validation Checklist

Phase 1:
- [ ] Base class created
- [ ] Claude Max lock acquired
- [ ] Lock released on completion
- [ ] Error handling works

Phase 2:
- [ ] Specialists receive models
- [ ] Domain routing works
- [ ] Fallback tested

Phase 3:
- [ ] All managers updated
- [ ] Each manager tested
- [ ] No regression bugs

Phase 4:
- [ ] Router integration complete
- [ ] Multi-manager scenarios work
- [ ] Metrics tracking active

Phase 5:
- [ ] All tests passing
- [ ] Cost analysis complete
- [ ] Documentation updated

## Let's Begin Execution

Starting with Phase 1: Creating the ModelAwareDepartmentManager base class...
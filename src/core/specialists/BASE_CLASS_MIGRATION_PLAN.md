# Base Class Migration Plan - Resolving Specialist Conflicts

## Current Situation
- **82 specialists** extend `SpecialistAgent`
- **27 specialists** extend `SpecialistBase` (which is `EnhancedSpecialist`)
- **Managers** extend `DepartmentManager` (EventEmitter) - THESE STAY AS IS

## Architecture Clarification
1. **Managers** (DepartmentManager) - Coordinate teams, DO NOT CHANGE
2. **Specialists** (need unification) - Do actual work, NEED CONSOLIDATION

## Identified Base Classes for Specialists
1. `SpecialistAgent` - Minimal base, used by 82 files
2. `SpecialistBase/EnhancedSpecialist` - Feature-rich base, used by 27 files  
3. `OperationalSpecialist` - Our new unified base with AI delegation

## Migration Strategy

### Phase 1: Create Compatibility Layer
Create a new base that:
- Extends OperationalSpecialist (for AI functionality)
- Maintains SpecialistAgent API (for backward compatibility)
- Includes EnhancedSpecialist features (for advanced capabilities)

### Phase 2: Update Import Paths
Instead of changing 109 files, we'll:
1. Make `specialist-agent.js` export OperationalSpecialist
2. Make `specialist-base.js` export OperationalSpecialist
3. All existing code continues to work

### Phase 3: Gradual Migration
Over time, update specialists to use new features:
- AI delegation for task processing
- Knowledge injection for expertise
- Unified metrics and validation

## Key Principle
**Managers and Orchestrators remain untouched** - they coordinate specialists but are NOT specialists themselves

## Implementation Files
1. `specialist-agent.js` - Will re-export OperationalSpecialist
2. `specialist-base.js` - Will re-export OperationalSpecialist  
3. `specialist-operational-base.js` - The unified implementation
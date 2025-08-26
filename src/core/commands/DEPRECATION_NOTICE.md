# Command System Deprecation Notice

## Active (Production) Files
- `specialist-factory-sprint3.js` - **ACTIVE** - Most complete implementation
- `command-execution-bridge-v2.js` - **ACTIVE** - Latest version

## Deprecated Files (DO NOT USE)
- `specialist-factory.js` - Original, incomplete
- `specialist-factory-sprint2.js` - Intermediate version
- `command-execution-bridge.js` - Old version

## Migration Path
All imports should use:
```javascript
// Use these:
const SpecialistFactory = require('./specialist-factory-sprint3');
const CommandBridge = require('./command-execution-bridge-v2');

// NOT these:
// const SpecialistFactory = require('./specialist-factory');
// const CommandBridge = require('./command-execution-bridge');
```

## Timeline
- Keep deprecated files until Phase 5 (Sprint 41)
- They provide fallback if issues arise
- Will be removed in production cleanup
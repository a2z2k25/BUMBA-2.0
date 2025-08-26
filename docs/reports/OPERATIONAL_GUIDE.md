# BUMBA Framework Operational Guide

## Quick Start

```bash
# Install dependencies
npm install

# Start BUMBA
npm start

# Run tests
npm test
```

## Core Systems Status

### 🏁 Operational Components (90% Working)

1. **Configuration Manager** - Loads and manages framework config
2. **Unified Error Manager** - Centralized error handling with recovery
3. **API Validator** - Validates external APIs, provides fallback mode
4. **Notion Hub** - Consolidated integration with automatic fallback
5. **Resource Enforcer** - Memory and CPU limits enforcement
6. **Command Handler** - Routes 71+ commands to departments
7. **Specialist Registry** - Manages 83 specialist modules
8. **Framework Core** - Main orchestration system

### 🟠️ Known Limitations

1. **Memory Usage**: ~100-150MB (higher than 50MB claim)
2. **Startup Time**: 1-3 seconds (within acceptable range)
3. **Silent Failures**: Most eliminated, some async functions need review
4. **Test Coverage**: Core paths covered, full coverage pending

## Command Reference

### Product Strategy Commands
- `/bumba:implement-strategy` - Strategic implementation
- `/bumba:prd` - Product requirement documents
- `/bumba:roadmap` - Product roadmap planning
- `/bumba:analyze-business` - Business analysis

### Design Engineering Commands
- `/bumba:implement-design` - Design implementation
- `/bumba:figma` - Figma integration
- `/bumba:ui` - UI component creation
- `/bumba:visual` - Visual design tools

### Backend Engineering Commands
- `/bumba:implement-technical` - Technical implementation
- `/bumba:api` - API development
- `/bumba:secure` - Security scanning
- `/bumba:devops` - DevOps operations

### System Commands
- `/bumba:help` - Show help
- `/bumba:status` - System status
- `/bumba:health` - Health check
- `/bumba:operability` - Integration status

## Troubleshooting

### Issue: Framework won't start
```bash
# Check for syntax errors
node -c src/index.js

# Run with debug logging
LOG_LEVEL=debug npm start
```

### Issue: High memory usage
```bash
# Run performance profiler
node scripts/performance-profiler.js

# Check for memory leaks
node --expose-gc scripts/simple-performance-test.js
```

### Issue: Command not working
```bash
# Verify command registration
node -e "const {commandHandler} = require('./src/core/command-handler'); console.log(commandHandler.getRegisteredCommands())"

# Test specific command
node -e "const {commandHandler} = require('./src/core/command-handler'); commandHandler.execute('help').then(console.log)"
```

### Issue: Integration not connecting
```bash
# Check API validation
node scripts/verify-critical-paths.js

# Run connection wizard
/bumba:connect
```

## Configuration

### Environment Variables
```bash
# API Keys (optional - framework works without them)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
NOTION_API_KEY=secret_...
GITHUB_TOKEN=ghp_...

# Framework Settings
LOG_LEVEL=info|debug|error
BUMBA_DISABLE_MONITORING=true|false
NODE_ENV=development|production|test
```

### Configuration Files
- `bumba.config.js` - Main framework configuration
- `.env` - Environment variables
- `package.json` - Dependencies and scripts

## Monitoring & Diagnostics

### Health Check
```bash
# Run health check
node -e "const f = require('./src/core/bumba-framework-2'); f.createBumbaFramework().then(fw => console.log(fw.getFrameworkStatus()))"
```

### Performance Metrics
```bash
# Run performance profiler
node scripts/performance-profiler.js

# Simple performance test
node scripts/simple-performance-test.js
```

### Critical Path Verification
```bash
# Verify all critical systems
node scripts/verify-critical-paths.js
```

### Silent Failure Detection
```bash
# Detect potential silent failures
node scripts/detect-silent-failures.js
```

## Architecture Overview

```
BUMBA Framework
├── Core Systems
│   ├── Configuration Manager (EventEmitter-based)
│   ├── Unified Error Manager (Singleton with recovery)
│   ├── API Validator (Fallback support)
│   └── Resource Enforcer (Memory/CPU limits)
│
├── Departments (Command Handlers)
│   ├── Product Strategist Manager
│   ├── Design Engineer Manager
│   └── Backend Engineer Manager
│
├── Integration Layer
│   ├── Notion Hub (15 files → 1 consolidated)
│   ├── MCP Servers (Optional)
│   └── External APIs (All optional)
│
└── Specialist System
    ├── Registry (83 specialists)
    ├── Technical Specialists
    ├── Strategic Specialists
    └── Experience Specialists
```

## Maintenance

### Daily Operations
1. Check system health: `node scripts/verify-critical-paths.js`
2. Monitor memory usage: `node scripts/performance-profiler.js`
3. Review error logs: `tail -f logs/error.log`

### Weekly Tasks
1. Run full test suite: `npm test`
2. Check for silent failures: `node scripts/detect-silent-failures.js`
3. Update dependencies: `npm update`

### Before Production Deployment
1. Run all verification scripts
2. Ensure all APIs are validated
3. Test critical user paths
4. Review memory and performance metrics

## Recovery Procedures

### Framework Won't Initialize
1. Check configuration: `node -c src/core/configuration/configuration-manager.js`
2. Validate APIs: `node scripts/verify-critical-paths.js`
3. Reset to safe mode: `BUMBA_DISABLE_MONITORING=true npm start`

### Memory Issues
1. Clear caches: `rm -rf node_modules/.cache`
2. Restart with limits: `node --max-old-space-size=512 src/index.js`
3. Profile memory: `node --inspect scripts/performance-profiler.js`

### Command Failures
1. Check command exists: See Command Reference above
2. Verify department manager: Check logs for department initialization
3. Test in isolation: Use direct command handler testing

## Support

### Logs Location
- Application logs: `logs/bumba.log`
- Error logs: `logs/error.log`
- Performance logs: `logs/performance.log`

### Debug Mode
```bash
# Enable debug logging
LOG_LEVEL=debug npm start

# Enable verbose output
DEBUG=* npm start
```

### Getting Help
1. Check this guide first
2. Run `/bumba:help` for command help
3. Check `scripts/` directory for diagnostic tools
4. Review test files for usage examples

---

## Current Status Summary

**Production Readiness: 80%**

🏁 **Working Well:**
- Core framework initialization
- Command routing and execution
- Error handling with recovery
- API validation with fallbacks
- Resource management
- Specialist system

🟠️ **Needs Attention:**
- Memory optimization (currently ~100-150MB)
- Some async error handling
- Full test coverage
- Performance optimization

🔴 **Not Recommended for Production:**
- Without thorough testing
- Without memory optimization
- Without proper monitoring setup

---

*Last Updated: Day 3 of Production Sprint*
*Framework Version: 2.0*
*Operational Status: 90% Critical Paths Working*
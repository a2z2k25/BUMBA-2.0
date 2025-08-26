# BUMBA Troubleshooting Guide

## Common Issues & Solutions

### 🐌 Slow Startup

**Symptom**: Framework takes >100ms to start

**Solutions**:
```bash
# 1. Enable fast start
export BUMBA_FAST_START=true

# 2. Use offline mode
export BUMBA_OFFLINE=true

# 3. Suppress logging
export LOG_LEVEL=ERROR

# 4. Test performance
node test-performance.js
```

### 💾 High Memory Usage

**Symptom**: Memory usage >50MB

**Solutions**:
```bash
# 1. Reduce pool size
export MAX_POOL_SIZE=5

# 2. Lower memory threshold
export MEMORY_THRESHOLD=50

# 3. Force cleanup
node -e "require('./src/core/memory/memory-optimizer').forceCleanup()"

# 4. Check for leaks
node --expose-gc test-performance.js
```

### 📢 Too Many Logs

**Symptom**: Console filled with log messages

**Solutions**:
```bash
# 1. Set log level
export LOG_LEVEL=ERROR  # or SILENT

# 2. Disable specific loggers
export DISABLE_WINSTON=true

# 3. Use silent mode in tests
npm test -- --silent
```

### ❌ Module Not Found

**Symptom**: `Cannot find module` errors

**Solutions**:
```bash
# 1. Clean install
rm -rf node_modules package-lock.json
npm install

# 2. Check Node version
node --version  # Should be 18+

# 3. Verify installation
npm ls

# 4. For winston specifically
npm install winston --save
```

### 🔌 API Connection Issues

**Symptom**: External API failures

**Solutions**:
```bash
# 1. Enable offline mode
export BUMBA_OFFLINE=true

# 2. Skip API initialization
export SKIP_API_INIT=true

# 3. Test offline
node test-core-functionality.js
```

### 🧪 Test Failures

**Symptom**: Tests failing

**Solutions**:
```bash
# 1. Fix Jest paths
npm run test:fix

# 2. Run specific test
npm test -- --testNamePattern="Core"

# 3. Skip flaky tests
npm test -- --testPathIgnorePatterns=lifecycle

# 4. Use test runner
node test-core-functionality.js
```

### 🏊 Pool Errors

**Symptom**: Specialist pool issues

**Solutions**:
```javascript
// 1. Clear pool
const { clearPool } = require('bumba-framework/pooling');
clearPool();

// 2. Check pool stats
const { getPoolStats } = require('bumba-framework/pooling');
console.log(getPoolStats());

// 3. Reset pool
const { resetPool } = require('bumba-framework/pooling');
resetPool({ maxSize: 5 });
```

### 🎯 Command Routing Issues

**Symptom**: Commands not routing correctly

**Solutions**:
```javascript
// 1. Check cache
const { getCacheStats } = require('bumba-framework/commands');
console.log(getCacheStats());

// 2. Clear cache
const { clearCache } = require('bumba-framework/commands');
clearCache();

// 3. Test routing
const { lookupCommand } = require('bumba-framework/commands');
console.log(lookupCommand('create-api'));
```

## Debug Techniques

### Enable Debug Mode

```bash
# Full debug output
export LOG_LEVEL=DEBUG
export NODE_DEBUG=bumba

# Performance profiling
node --inspect test-performance.js
```

### Memory Profiling

```javascript
// Check memory usage
const used = process.memoryUsage();
for (let key in used) {
  console.log(`${key}: ${Math.round(used[key] / 1024 / 1024)} MB`);
}

// Force garbage collection
if (global.gc) {
  global.gc();
  console.log('Garbage collected');
}
```

### Performance Profiling

```bash
# CPU profile
node --prof test-performance.js
node --prof-process isolate-*.log

# Heap snapshot
node --heapsnapshot test-performance.js
```

## FAQ

### Q: Why is the framework slow on first run?

**A**: First run initializes caches. Subsequent runs are fast (<20ms).

### Q: Can I use BUMBA without API keys?

**A**: Yes! BUMBA works 100% offline. API keys are optional.

### Q: How do I reduce memory usage?

**A**: Set `MAX_POOL_SIZE=5` and `MEMORY_THRESHOLD=50`.

### Q: Why are specialists not loading?

**A**: Check if offline mode is enabled and the specialist exists in the registry.

### Q: How do I disable all external connections?

**A**: Set `BUMBA_OFFLINE=true` and `SKIP_API_INIT=true`.

## Error Messages

### "Integration Hooks initialized"
Not an error - informational message. Suppress with `LOG_LEVEL=ERROR`.

### "Cannot find module 'winston'"
Install winston: `npm install winston --save`

### "Pool is full"
Normal behavior - old specialists are evicted automatically.

### "Specialist not found"
Check specialist name spelling and availability in offline mode.

## Getting Help

### Before Asking for Help

1. Check this guide
2. Run diagnostic:
```bash
node test-performance.js
node test-core-functionality.js
```
3. Check versions:
```bash
node --version  # Should be 18+
npm --version   # Should be 8+
```

### Contact Support

- GitHub Issues: https://github.com/bumba-ai/bumba/issues
- Discord: https://discord.gg/bumba
- Email: support@bumba.ai

Include:
- Error messages
- Environment (OS, Node version)
- Configuration (env vars)
- Steps to reproduce

---

**Most issues are configuration-related and easily fixed!** 💪
# Sprint 4: Environment Variable Migration Guide

## Status: IN PROGRESS
## Files to Update: 137 files with 551 process.env references

---

## Migration Pattern

### Before (INSECURE):
```javascript
// Direct environment access - can leak secrets
const apiKey = process.env.OPENAI_API_KEY;
const isDebug = process.env.DEBUG === 'true';
console.log(process.env); // DANGEROUS - logs all secrets!

if (process.env.NODE_ENV === 'production') {
  // production code
}
```

### After (SECURE):
```javascript
// Use secure config manager
const { config } = require('./core/config/secure-config');

const apiKey = config.getApiKey('openai');
const isDebug = config.isDebug();
// config.toJSON() returns safely redacted values

if (config.isProduction()) {
  // production code
}
```

---

## Common Replacements

### API Keys:
```javascript
// OLD
process.env.OPENAI_API_KEY
process.env.ANTHROPIC_API_KEY
process.env.NOTION_API_KEY

// NEW
config.getApiKey('openai')
config.getApiKey('anthropic')
config.getApiKey('notion')
```

### Environment Checks:
```javascript
// OLD
process.env.NODE_ENV === 'production'
process.env.NODE_ENV === 'development'
process.env.NODE_ENV === 'test'

// NEW
config.isProduction()
config.isDevelopment()
config.isTesting()
```

### BUMBA Settings:
```javascript
// OLD
process.env.BUMBA_OFFLINE === 'true'
process.env.BUMBA_FAST_START === 'true'
process.env.LOG_LEVEL === 'DEBUG'

// NEW
config.isOffline()
config.get('BUMBA_FAST_START', 'false') === 'true'
config.isDebug()
```

### Database/Redis:
```javascript
// OLD
{
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  password: process.env.DB_PASSWORD
}

// NEW
config.getServiceConfig('database')
// Returns complete, safe database config
```

---

## Priority Files to Update

### Critical (API Keys exposed):
1. `/src/core/integrations/openai-integration.js`
2. `/src/core/integrations/notion-hub.js`
3. `/src/core/integrations/discord-integration.js`
4. `/src/core/mcp/mcp-connection-manager.js`

### High (Logging secrets):
1. `/src/core/logging/api-call-logger.js`
2. `/src/core/monitoring/comprehensive-metrics-collector.js`
3. `/src/core/validation/validation-metrics.js`

### Medium (General usage):
1. All department managers
2. All specialist files
3. Framework initialization files

---

## Automated Update Script

```javascript
// update-env-usage.js
const fs = require('fs');
const path = require('path');

const replacements = [
  // API Keys
  [/process\.env\.OPENAI_API_KEY/g, "config.getApiKey('openai')"],
  [/process\.env\.ANTHROPIC_API_KEY/g, "config.getApiKey('anthropic')"],
  
  // Environment checks
  [/process\.env\.NODE_ENV\s*===?\s*['"]production['"]/g, "config.isProduction()"],
  [/process\.env\.NODE_ENV\s*===?\s*['"]development['"]/g, "config.isDevelopment()"],
  [/process\.env\.NODE_ENV\s*!==?\s*['"]production['"]/g, "!config.isProduction()"],
  
  // BUMBA settings
  [/process\.env\.BUMBA_OFFLINE\s*===?\s*['"]true['"]/g, "config.isOffline()"],
  [/process\.env\.LOG_LEVEL\s*===?\s*['"]DEBUG['"]/g, "config.isDebug()"],
  
  // Generic getter
  [/process\.env\.(\w+)/g, "config.get('$1')"]
];

function updateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let updated = false;
  
  // Check if file uses process.env
  if (!content.includes('process.env')) {
    return false;
  }
  
  // Apply replacements
  for (const [pattern, replacement] of replacements) {
    if (pattern.test(content)) {
      content = content.replace(pattern, replacement);
      updated = true;
    }
  }
  
  // Add import if updated
  if (updated && !content.includes("require('./core/config/secure-config')")) {
    const importStatement = "const { config } = require('./core/config/secure-config');\n";
    content = importStatement + content;
  }
  
  if (updated) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated: ${filePath}`);
  }
  
  return updated;
}
```

---

## Benefits of Centralization

1. **Security**: 
   - Sensitive values never logged
   - Centralized redaction
   - Access tracking

2. **Maintainability**:
   - Single source of truth
   - Easy to add new config
   - Type checking possible

3. **Testing**:
   - Easy to mock configuration
   - No environment pollution
   - Predictable behavior

4. **Performance**:
   - Config loaded once
   - Frozen to prevent changes
   - Optimized access

---

## Next Steps

1. Update critical files manually (high-risk API keys)
2. Run automated script on remaining files
3. Test each subsystem after updates
4. Remove any console.log(process.env) statements

---

**Sprint 4 Progress**: Secure config manager created, migration guide ready ⏳
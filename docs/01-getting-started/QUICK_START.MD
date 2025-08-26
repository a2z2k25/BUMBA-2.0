# BUMBA Framework - Quick Start Guide

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/bumba.git
cd bumba

# Install dependencies
npm install

# Run setup
npm run setup
```

## Basic Usage

### 1. Start with the menu
```bash
/bumba:menu
```

### 2. Check system health
```bash
/bumba:health
/bumba:status
```

### 3. Implement a feature
```bash
/bumba:implement "user authentication system"
```

### 4. Get help
```bash
/bumba:help implement
```

## Common Workflows

### Feature Development
```bash
# 1. Define requirements
/bumba:requirements "e-commerce checkout"

# 2. Create design
/bumba:design "checkout flow UI"

# 3. Implement backend
/bumba:api "checkout endpoints"

# 4. Add security
/bumba:secure "payment processing"

# 5. Test
/bumba:test "checkout flow"
```

### Multi-Agent Collaboration
```bash
# Coordinate all departments
/bumba:implement-agents "complete feature"
```

### Performance Optimization
```bash
# Analyze performance
/bumba:profile "api endpoints"

# Optimize
/bumba:optimize "database queries"

# Monitor
/bumba:metrics
```

## Configuration

Create `bumba.config.js`:
```javascript
module.exports = {
  mode: 'development',
  departments: {
    autoSpawn: true,
    timeout: 30000
  },
  monitoring: {
    enabled: true,
    interval: 300000
  }
};
```

## Next Steps

1. Explore all commands: `/bumba:menu`
2. Read the [API Reference](./API_REFERENCE.md)
3. Understand the [Architecture](./ARCHITECTURE.md)
4. Check [examples](../examples/)

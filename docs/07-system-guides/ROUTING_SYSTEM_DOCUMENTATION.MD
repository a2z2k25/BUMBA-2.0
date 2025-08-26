# BUMBA Intelligent Routing System Documentation

## Overview

The BUMBA Intelligent Routing System ensures that commands are automatically routed to the most appropriate agents with optimal model assignments. The system enforces the critical requirement that **only ONE agent can use Claude Max at a time** (the user's personal account), while sub-agents use free tier models (DeepSeek, Qwen, Gemini) based on their task type.

## Architecture

### Core Components

1. **Command Router Integration** (`src/core/command-router-integration.js`)
   - Analyzes command intent and complexity
   - Determines routing strategy
   - Selects appropriate agents
   - Assigns models based on rules

2. **Unified Routing System** (`src/core/unified-routing-system.js`)
   - Intent analysis with pattern matching
   - Department and specialist detection
   - Complexity scoring
   - Confidence calculation

3. **Routing Execution Bridge** (`src/core/execution/routing-execution-bridge.js`)
   - Connects routing decisions to actual execution
   - Manages different execution strategies
   - Tracks execution metrics
   - Handles specialist spawning

4. **Claude Max Account Manager** (`src/core/agents/claude-max-account-manager.js`)
   - Enforces single Claude Max usage with mutex lock
   - Priority queue system (Executive > Manager > Review > Normal)
   - Timeout handling
   - Fair scheduling

5. **Domain Model Router** (`src/core/agents/domain-model-router.js`)
   - Assigns free tier models based on task type:
     - **DeepSeek**: Reasoning tasks (analysis, research, security)
     - **Qwen**: Coding tasks (implementation, database, API)
     - **Gemini**: General tasks (documentation, UI, communication)

## Model Assignment Rules

### Managers and Executives
- **Always get Claude Max** when working alone
- **Only ONE gets Claude Max** when multiple managers work in parallel
- **Executive gets priority** over regular managers

### Specialists and Workers
- **Never get Claude Max**
- **Always use free tier models** based on task type:
  - Security Specialist → DeepSeek (reasoning)
  - Database Specialist → Qwen (coding)
  - UI Designer → Gemini (general)
  - Python Specialist → Qwen (coding)

## Routing Strategies

### 1. Executive Strategy
- **When**: Complexity > 0.8 or enterprise-level tasks
- **Who**: Product Strategist Executive gets Claude Max
- **Example**: "Plan enterprise platform transformation"

### 2. Cross-Domain Strategy
- **When**: Multiple departments involved
- **Who**: Multiple managers, executive gets Claude Max
- **Example**: "Implement full-stack application with frontend and backend"

### 3. Domain-Specific Strategy
- **When**: Single department with specialists
- **Who**: Department manager gets Claude Max, specialists get free tier
- **Example**: "Optimize database performance"

### 4. Specialist-Only Strategy
- **When**: Simple tasks, complexity < 0.3
- **Who**: Single specialist with free tier model
- **Example**: "Fix typo in README"

## Learning and Feedback Systems

### Learning System (`src/core/routing/routing-learning-system.js`)
- Learns from successful routing patterns
- Stores routing history with outcomes
- Provides recommendations based on past success
- Tracks model performance metrics

### Feedback System (`src/core/routing/routing-feedback-system.js`)
- Records execution results
- Tracks agent performance
- Monitors model quality by task type
- Generates improvement suggestions

## Performance Optimization

### Caching
- Routes frequently used commands
- TTL-based cache invalidation
- Configurable cache size

### Batching
- Groups similar requests
- Processes in parallel when possible
- Reduces overhead

### Model Optimization
- Prioritizes faster models for time-sensitive tasks
- Groups agents by task type
- Minimizes model switching overhead

## Error Handling

### Recovery Strategies
- **Timeout**: Falls back to fast Gemini model
- **Claude Max Unavailable**: Switches all agents to free tier
- **Specialist Error**: Uses manager only
- **Model Error**: Switches to alternative models

### Fallback Routing
- Always returns a valid routing plan
- Uses backend-engineer-manager as default
- Low confidence score to indicate fallback

## Command Examples

### Technical Commands
```javascript
// Database optimization - routes to database specialist with Qwen
router.routeCommand('optimize', ['postgres query performance'])

// Security audit - routes to security specialist with DeepSeek
router.routeCommand('audit', ['security vulnerabilities'])

// API implementation - backend manager (Claude Max) + specialists
router.routeCommand('implement', ['REST API endpoints'])
```

### Experience Commands
```javascript
// UI design - design manager (Claude Max) + UI specialists
router.routeCommand('design', ['responsive dashboard'])

// Frontend components - frontend specialist with Qwen
router.routeCommand('build', ['react components'])
```

### Strategic Commands
```javascript
// Product roadmap - product strategist with Claude Max
router.routeCommand('roadmap', ['Q1 2024 features'])

// Market analysis - market research specialist with DeepSeek
router.routeCommand('analyze', ['market competitors'])
```

### Language-Specific Commands
```javascript
// Python API - Python specialist with Qwen
router.routeCommand('implement', ['Python API with Flask'])

// Node.js service - JavaScript specialist with Qwen
router.routeCommand('build', ['Node.js microservice'])
```

## Testing

### Unit Tests
- `tests/unit/routing/command-router-integration.test.js`
- `tests/unit/routing/routing-learning-system.test.js`
- `tests/unit/spawning/specialist-spawner.test.js`

### Integration Tests
- `tests/integration/domain-specific-routing.test.js`
- `tests/integration/cross-domain-routing.test.js`
- `tests/integration/model-assignment.test.js`

## Configuration

### Environment Variables
```bash
# Model API Keys (only Claude Max required)
ANTHROPIC_API_KEY=your-claude-max-key

# Free tier models (optional, uses defaults)
DEEPSEEK_API_KEY=optional
QWEN_API_KEY=optional
GEMINI_API_KEY=optional
```

### Configuration Options
```javascript
const config = {
  // Claude Max settings
  claudeMaxTimeout: 30000,        // 30 seconds
  claudeMaxPriority: true,         // Enable priority queue
  
  // Learning system
  persistenceEnabled: true,        // Save learning data
  minConfidenceToLearn: 0.7,      // Min confidence to learn from
  
  // Performance
  enableCaching: true,             // Cache routing decisions
  cacheSize: 100,                  // Max cached routes
  cacheTTL: 60000,                // 1 minute TTL
  
  // Error handling
  maxRetries: 3,                   // Retry failed routings
  enableFallback: true,            // Use fallback routing
  enableRecovery: true             // Attempt error recovery
};
```

## Metrics and Monitoring

### Available Metrics
- **Routing Statistics**: Total routings, success rate, average confidence
- **Model Performance**: Success rates per model, execution times
- **Agent Performance**: Success rates, average execution time, trends
- **Error Metrics**: Error types, recovery rates, patterns

### Getting Metrics
```javascript
// Get routing statistics
const stats = router.getRoutingStats();

// Get feedback summary
const feedback = executionBridge.getFeedbackSummary();

// Get error summary
const errors = errorHandler.getErrorSummary();
```

## Best Practices

1. **Always specify task details** for better routing confidence
2. **Break complex tasks** into smaller, focused commands
3. **Use language keywords** when working with specific technologies
4. **Monitor feedback** to identify underperforming agents
5. **Clear caches** periodically to prevent stale routing
6. **Review error patterns** to improve recovery strategies

## Troubleshooting

### Common Issues

#### "Claude Max timeout"
- **Cause**: Another agent is using Claude Max
- **Solution**: System will queue and retry automatically

#### "No specialist available"
- **Cause**: Requested specialist not implemented
- **Solution**: Falls back to manager or general specialist

#### "Low routing confidence"
- **Cause**: Vague or ambiguous command
- **Solution**: Provide more specific details

#### "Model assignment failed"
- **Cause**: Free tier model unavailable
- **Solution**: Falls back to Gemini (most reliable)

## Future Enhancements

- [ ] Dynamic model selection based on load
- [ ] Cost optimization for free tier usage
- [ ] Advanced learning with neural patterns
- [ ] Real-time performance monitoring dashboard
- [ ] Automatic specialist scaling
- [ ] Cross-session learning persistence

---

**Version**: 1.0.0  
**Last Updated**: 2024  
**Status**: Production Ready
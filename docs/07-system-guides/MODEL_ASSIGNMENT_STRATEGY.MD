# BUMBA Model Assignment Strategy

## Overview

BUMBA implements an intelligent model assignment strategy that ensures managers always use Claude Max while optimizing sub-agent assignments across free tier models (Gemini, DeepSeek, Qwen).

## Core Principles

1. **Claude Max Exclusivity**: Only ONE agent can use Claude Max at any time (mutex-locked)
2. **Manager Priority**: Managers always get Claude Max over workers
3. **Executive Elevation**: When multiple managers work in parallel, executive gets Claude Max
4. **Domain Optimization**: Sub-agents assigned models based on task domain
5. **Review Guarantee**: All review/validation tasks routed to Claude Max manager

## Model Assignment Rules

### Manager Assignment

```javascript
if (single_manager) {
  manager → Claude Max (exclusive lock)
  sub_agents → Free tier models
} else if (multiple_managers) {
  executive → Claude Max (priority 1)
  other_managers → Free tier models
  sub_agents → Free tier models
}
```

### Sub-Agent Assignment by Domain

| Domain | Task Type | Assigned Model | Reason |
|--------|-----------|----------------|---------|
| **Reasoning/Analysis** | Analysis, debugging, security | DeepSeek R1 | Specialized reasoning model |
| **Coding/Implementation** | Code generation, refactoring | Qwen Coder 32B | Optimized for code |
| **General/Documentation** | UI/UX, docs, communication | Gemini Pro | Best free general model |
| **Review/Validation** | Code review, approval | Claude Max (Manager) | Quality control requirement |

## Configuration

### Environment Variables

```bash
# Claude Max Account (for managers)
CLAUDE_MAX_API_KEY=your_claude_max_key
CLAUDE_MAX_MODEL=claude-3-opus-20240229
CLAUDE_MAX_TOKENS=4000

# Free Tier Models (for sub-agents)
GOOGLE_API_KEY=your_gemini_key        # Gemini Pro (1M tokens/day free)
# DeepSeek and Qwen accessed via OpenRouter
```

### Priority Levels

1. **Executive** (Priority 1): Product-Strategist-Executive
2. **Manager** (Priority 2): Department Managers
3. **Review/Validation** (Priority 3): Review tasks
4. **Cross-Domain** (Priority 4): Multi-domain coordination
5. **Normal** (Priority 10): Regular tasks

## Implementation Components

### 1. ClaudeMaxAccountManager

Manages exclusive access to Claude Max account:

- **Mutex Lock**: Ensures single access
- **Priority Queue**: Orders requests by importance
- **Timeout Protection**: Auto-releases stuck locks
- **Usage Tracking**: Monitors Claude Max utilization

### 2. DomainModelRouter

Routes tasks to optimal free tier models:

- **Domain Analysis**: Identifies task domain
- **Model Selection**: Chooses best free model
- **Load Balancing**: Distributes across available models
- **Fallback Logic**: Handles model exhaustion

### 3. ReviewValidationRouter

Ensures reviews go to Claude Max:

- **Review Detection**: Identifies review/validation tasks
- **Manager Selection**: Chooses appropriate manager
- **Batch Processing**: Groups non-critical reviews
- **Priority Handling**: Fast-tracks critical reviews

### 4. ParallelManagerCoordinator

Orchestrates multiple managers:

- **Manager Analysis**: Determines manager needs
- **Model Assignment**: Executive gets Claude Max
- **Task Distribution**: Routes tasks to managers
- **Sub-Agent Planning**: Spawns workers with free models

## Usage Examples

### Single Manager Scenario

```javascript
// Backend Manager gets Claude Max
const manager = {
  agent: 'backend-engineer-manager',
  model: 'claude-max',
  usingClaudeMax: true
};

// Sub-agents use free tier
const subAgents = [
  { agent: 'backend-dev', model: 'qwen', task: 'coding' },
  { agent: 'security-engineer', model: 'deepseek', task: 'analysis' },
  { agent: 'devops', model: 'qwen', task: 'infrastructure' }
];
```

### Multiple Manager Scenario

```javascript
// Executive gets Claude Max
const executive = {
  agent: 'product-strategist-executive',
  model: 'claude-max',
  usingClaudeMax: true,
  elevated: true
};

// Other managers use free tier
const managers = [
  { agent: 'backend-engineer-manager', model: 'deepseek' },
  { agent: 'design-engineer-manager', model: 'gemini' }
];
```

### Review Task Routing

```javascript
// All reviews go to Claude Max manager
const reviewTask = {
  type: 'code-review',
  assignedTo: 'backend-engineer-manager',
  model: 'claude-max',
  priority: 'high'
};
```

## API Usage

### Execute with Model Assignment

```javascript
const { BumbaAgentManager } = require('./src/core/agents');

const manager = new BumbaAgentManager({
  claudeMaxTimeout: 60000,
  enableBatchReviews: true
});

// Auto-assigns models based on context
const result = await manager.execute(tasks, {
  mode: 'auto',
  strategy: 'balanced'
});
```

### Check Model Status

```javascript
const status = manager.getStatus();

console.log(status.claudeMax);  // Claude Max availability
console.log(status.freeTier);   // Free tier usage
console.log(status.routing);    // Routing statistics
```

## Monitoring & Metrics

### Claude Max Metrics

- **Lock Duration**: Average time held
- **Queue Length**: Waiting requests
- **Usage Rate**: Requests per hour
- **Timeout Events**: Force releases

### Free Tier Metrics

- **Token Usage**: Per model per day
- **Request Count**: API calls remaining
- **Exhaustion Rate**: Models hitting limits
- **Cost Savings**: vs all-Claude pricing

## Best Practices

1. **Batch Reviews**: Group non-critical reviews for efficiency
2. **Domain Accuracy**: Ensure tasks have correct domain labels
3. **Priority Management**: Set appropriate priorities for time-sensitive tasks
4. **Monitor Limits**: Track free tier usage to avoid exhaustion
5. **Timeout Configuration**: Set reasonable timeouts for Claude Max lock

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Manager stuck waiting | Claude Max lock held | Check timeout, force release if needed |
| Free tier exhausted | Daily limits reached | Wait for reset or allow paid fallback |
| Wrong model assigned | Incorrect domain | Verify task domain classification |
| Review not using Claude | Router misconfiguration | Check ReviewValidationRouter settings |

### Debug Commands

```javascript
// Check Claude Max status
manager.claudeMaxManager.getStatus();

// View queue
manager.claudeMaxManager.getQueuePosition(agentId);

// Force release (emergency)
manager.claudeMaxManager.emergencyReset();

// Check free tier usage
manager.freeTierManager.getUsageSummary();
```

## Performance Optimization

### Recommendations

1. **Minimize Manager Parallelism**: Reduces Claude Max contention
2. **Accurate Domain Tagging**: Ensures optimal model selection
3. **Batch Similar Tasks**: Improves sub-agent efficiency
4. **Monitor Free Tier**: Prevent unexpected exhaustion
5. **Use Caching**: Reduce redundant API calls

### Cost Analysis

```
Daily Cost Comparison:
- All Claude Max: ~$150/day (10K requests)
- Optimized Strategy: ~$15/day (1K Claude, 9K free)
- Savings: 90% reduction
```

## Future Enhancements

- [ ] Dynamic timeout adjustment based on task complexity
- [ ] Predictive model selection using ML
- [ ] Multi-account Claude Max pool
- [ ] Advanced queue prioritization algorithms
- [ ] Real-time cost optimization dashboard

---

*Last Updated: 2024*
*Version: 1.0.0*
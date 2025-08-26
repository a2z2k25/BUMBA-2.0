# BUMBA Command Reference v2.1

Complete reference for all 58 BUMBA commands with Universal Hook System and Dynamic Lifecycle Management.

## Command Syntax

```bash
/bumba:command [arguments] [--options]
```

## Commands by Category

### 🟢 Core Commands (8)

| Command | Description | Example |
|---------|-------------|---------|
| `implement` | Auto-route feature development | `/bumba:implement user auth` |
| `analyze` | Multi-dimensional analysis | `/bumba:analyze codebase` |
| `test` | Run automated tests | `/bumba:test unit` |
| `docs` | Search documentation | `/bumba:docs api` |
| `research` | AI-powered research | `/bumba:research best practices` |
| `validate` | Validate code/config | `/bumba:validate schema.json` |
| `improve` | Optimize existing code | `/bumba:improve performance` |
| `orchestrate` | Parallel task execution | `/bumba:orchestrate migration` |

### 🟢 Product Strategist Commands (8)

| Command | Description |
|---------|-------------|
| `implement-strategy` | Business-focused implementation |
| `prd` | Create product requirements document |
| `requirements` | Discover and analyze requirements |
| `roadmap` | Strategic planning and roadmapping |
| `research-market` | Market research & competitive analysis |
| `analyze-business` | Business impact analysis |
| `docs-business` | Business documentation lookup |
| `improve-strategy` | Business strategy optimization |

### 🟢 Design Engineer Commands (9)

| Command | Description |
|---------|-------------|
| `implement-design` | Design-focused implementation |
| `design` | Design workflow automation |
| `figma` | Figma Dev Mode integration |
| `ui` | Intelligent UI component generation |
| `visual` | Visual asset optimization |
| `research-design` | Design patterns & UX research |
| `analyze-ux` | UX/accessibility analysis |
| `docs-design` | Design system documentation |
| `improve-design` | UX/UI optimization |

### 🟢 Backend Engineer Commands (9)

| Command | Description |
|---------|-------------|
| `implement-technical` | Backend-focused implementation |
| `api` | API development automation |
| `secure` | Security validation & hardening |
| `scan` | Advanced security scanning |
| `analyze-technical` | Technical architecture analysis |
| `research-technical` | Technical architecture research |
| `docs-technical` | Technical documentation lookup |
| `improve-performance` | Performance optimization |
| `publish` | Package publishing |

### 🟢 Collaboration Commands (6)

| Command | Description |
|---------|-------------|
| `implement-agents` | Full team collaboration |
| `team` | Team coordination & management |
| `collaborate` | Multi-agent coordination |
| `chain` | Command chaining & automation |
| `workflow` | Advanced workflow automation |
| `checkpoint` | Project milestone tracking |

### 🟢 Consciousness Commands (4)

| Command | Description |
|---------|-------------|
| `conscious-analyze` | Four Pillars analysis |
| `conscious-reason` | Wisdom-guided reasoning |
| `conscious-wisdom` | Contextual guidance |
| `conscious-purpose` | Purpose alignment check |

### 🟢 Performance Commands (3)

| Command | Description |
|---------|-------------|
| `lite` | Execute in resource-efficient mode |
| `lite-analyze` | Fast analysis with minimal resources |
| `lite-implement` | Rapid prototyping mode |

### 🟢 Monitoring Commands (6)

| Command | Description |
|---------|-------------|
| `health` | System health diagnostics |
| `metrics` | Performance metrics dashboard |
| `profile` | Performance profiling |
| `optimize` | System optimization |
| `monitor` | Real-time monitoring |
| `status` | Framework status check |

### 🟢 Notion Integration Commands (8)

| Command | Description |
|---------|-------------|
| `notion-status` | Check Notion connection |
| `notion-score` | View documentation score |
| `notion-leaderboard` | Team documentation rankings |
| `notion-sync` | Force sync to Notion |
| `notion-checkpoint` | Trigger checkpoint sync |
| `notion-queue` | View queued operations |
| `notion-reminder-level` | Set reminder frequency |
| `notion-auto-sync` | Toggle auto-sync |

### 🟢 System Commands (5)

| Command | Description |
|---------|-------------|
| `menu` | Interactive command browser |
| `help` | Contextual help system |
| `settings` | Framework configuration |
| `memory` | Context management |
| `snippets` | Code snippet management |

## Command Options

### Global Options
```bash
--verbose     # Detailed output
--quiet       # Minimal output
--json        # JSON format output
--no-color    # Disable colored output
--timeout=30  # Set timeout (seconds)
```

### Mode Options
```bash
--mode=executive      # Strategic planning mode
--mode=collaborative  # Team coordination mode
--mode=specialized    # Deep technical mode
```

### Department Options
```bash
--dept=product  # Route to Product Strategist
--dept=design   # Route to Design Engineer
--dept=backend  # Route to Backend Engineer
--dept=auto     # Automatic routing (default)
```

## Advanced Usage

### Command Chaining
```bash
/bumba:chain "analyze security" "implement fixes" "test changes"
```

### Parallel Execution
```bash
/bumba:orchestrate "migrate database, update API, refactor frontend"
```

### Context Preservation
```bash
/bumba:memory save "project-context"
/bumba:implement "continue from saved context"
/bumba:memory load "project-context"
```

### Custom Workflows
```bash
# Create workflow
/bumba:workflow create "deployment" 
  --steps "test, build, secure, deploy"
  --parallel "test,build"

# Execute workflow
/bumba:workflow run "deployment"
```

## Hook System Integration

### Available Hook Points

The framework provides 45+ hook points for extensibility:

| Hook Category | Hook Points | Purpose |
|--------------|-------------|----------|
| **Team** | `beforeComposition`, `validateComposition`, `modifyComposition`, `afterComposition` | Control team formation |
| **Model** | `beforeSelection`, `evaluateCost`, `suggestAlternative`, `afterSelection` | Optimize model selection |
| **Lifecycle** | `beforeTransition`, `validateTransition`, `modifyTransition`, `afterTransition`, `onError` | Manage agent states |
| **Deprecation** | `before`, `overrideStrategy`, `prevent`, `customCleanup`, `after` | Control retirement |
| **Knowledge** | `beforeTransfer`, `filter`, `transform`, `validateTransfer`, `afterTransfer` | Manage learning |
| **API** | `beforeRequest`, `afterRequest`, `onError`, `onThrottle`, `trackPerformance` | Monitor API calls |
| **Department** | `beforeCoordination`, `afterCoordination` | Cross-department sync |
| **Manager** | `beforeDecision`, `validateDecision`, `afterDecision` | Decision validation |
| **Orchestrator** | `beforeTaskProcessing`, `afterTaskProcessing`, `budgetCheck`, `healthCheck` | System monitoring |
| **Claude Max** | `beforeLockAcquisition`, `suggestAlternative`, `lockGranted`, `lockReleased` | Lock management |

### Registering Custom Hooks

```bash
# Register via configuration
/bumba:settings hook register "model:evaluateCost" ./hooks/cost-optimizer.js

# Register with priority
/bumba:settings hook register "team:validateComposition" ./hooks/team-validator.js --priority=100
```

## Lifecycle Management Commands

### Agent Lifecycle Control

```bash
# View agent states
/bumba:lifecycle status

# Force state transition
/bumba:lifecycle transition <agentId> <state>

# View deprecation queue
/bumba:lifecycle deprecation-queue

# Trigger knowledge transfer
/bumba:lifecycle transfer-knowledge <fromAgent> <toAgent>
```

### Cost Optimization

```bash
# View cost savings
/bumba:cost report

# Set budget limits
/bumba:cost set-budget --daily=100 --monthly=2000

# View model usage
/bumba:cost models

# Force cheaper model
/bumba:cost optimize --aggressive
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | OpenAI API access | Yes |
| `ANTHROPIC_API_KEY` | Anthropic Claude access | Yes |
| `NOTION_API_KEY` | Notion integration | No |
| `GITHUB_TOKEN` | GitHub integration | No |
| `REDIS_URL` | Redis for persistence | No |
| `LOG_LEVEL` | Logging verbosity | No |
| `BUMBA_HOOKS_DIR` | Custom hooks directory | No |
| `BUMBA_COST_LIMIT_DAILY` | Daily cost limit ($) | No |
| `BUMBA_COST_LIMIT_MONTHLY` | Monthly cost limit ($) | No |
| `BUMBA_DEBUG_HOOKS` | Enable hook debugging | No |

## Error Codes

| Code | Meaning | Solution |
|------|---------|----------|
| `E001` | Invalid command | Check syntax with `/bumba:help` |
| `E002` | Missing API key | Configure in `.env` |
| `E003` | Agent timeout | Retry or use `/bumba:lite` mode |
| `E004` | Resource limit | Check `/bumba:metrics` |
| `E005` | Network error | Check connection |

## Examples

### Complete Feature Implementation
```bash
/bumba:implement-agents "e-commerce checkout system"
# Spawns all departments working in parallel
```

### Security Audit
```bash
/bumba:scan --deep --report=detailed
/bumba:secure --auto-fix
```

### Performance Optimization
```bash
/bumba:profile "api endpoints"
/bumba:improve-performance --target=response-time
```

### Documentation Generation
```bash
/bumba:docs generate --format=markdown --output=./docs
```

### Hook System Examples

#### Cost Optimization Hook
```bash
# Create cost optimizer hook
cat > hooks/cost-optimizer.js << 'EOF'
module.exports = async (context) => {
  if (context.cost > 0.01) {
    context.suggestAlternative = true;
    context.alternativeModel = 'deepseek';
    context.reason = 'Cost threshold exceeded';
  }
  return context;
};
EOF

# Register the hook
/bumba:settings hook register "model:evaluateCost" ./hooks/cost-optimizer.js
```

#### Team Size Limiter
```bash
# Create team limiter hook
cat > hooks/team-limiter.js << 'EOF'
module.exports = async (context) => {
  if (context.composition.members.length > 5) {
    context.modifications = {
      members: context.composition.members.slice(0, 5)
    };
  }
  return context;
};
EOF

# Register the hook
/bumba:settings hook register "team:modifyComposition" ./hooks/team-limiter.js
```

### Lifecycle Management Examples

#### Monitor Agent Lifecycle
```bash
# View all agent states
/bumba:lifecycle status --verbose

# Watch specific agent
/bumba:lifecycle watch agent-123

# View state transition history
/bumba:lifecycle history agent-123
```

#### Manage Cost Optimization
```bash
# Enable aggressive cost optimization
/bumba:cost optimize --mode=aggressive

# View real-time cost tracking
/bumba:cost monitor --real-time

# Generate cost report
/bumba:cost report --period=weekly --format=csv
```

---

For more examples and tutorials, visit [docs.bumba-ai.com](https://docs.bumba-ai.com)
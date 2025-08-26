# Notion Mirror Agent Protocols

## Overview
This document defines how Bumba Framework agents interact with the Notion Project Dashboard Mirror feature. The system provides one-way reflection of project state to Notion without requiring agents to directly manage the dashboard.

## Core Principles

### 1. One-Way Data Flow
- **Agents** → **Bumba Framework** → **Notion Mirror** → **Dashboard**
- Agents never write directly to Notion
- All updates flow through the Status Reflection Pipeline
- No feedback loops from Notion back to agents

### 2. Automatic Reflection
- Agent actions automatically trigger dashboard updates
- No explicit "update Notion" commands required
- Pipeline handles batching and rate limiting

### 3. Department Mapping
```javascript
{
  'Product-Strategist': 'Strategy',
  'Design-Engineer': 'Design',
  'Backend-Engineer': 'Engineering',
  'Frontend-Engineer': 'Engineering',
  'QA-Engineer': 'QA',
  'DevOps-Engineer': 'DevOps'
}
```

## Agent Responsibilities

### Product-Strategist Manager

**Primary Role**: Project initialization and orchestration

**Automatic Triggers**:
- `project:created` → Creates Notion dashboard
- `epic:defined` → Updates project scope section
- `sprint:planned` → Updates timeline visualization
- `milestone:reached` → Updates executive summary

**Required Data**:
```javascript
{
  projectName: String,
  projectGoals: Array<String>,
  timeline: { start: Date, end: Date },
  priority: 'P0' | 'P1' | 'P2' | 'P3',
  stakeholders: Array<String>
}
```

### Backend/Frontend Engineers

**Primary Role**: Task execution and technical updates

**Automatic Triggers**:
- `task:started` → Updates task status to "In Progress"
- `task:blocked` → Updates status and logs blocker
- `task:completed` → Updates progress and moves to "Complete"
- `code:committed` → Links commits to tasks

**Required Data**:
```javascript
{
  taskId: String,
  status: 'backlog' | 'in_progress' | 'blocked' | 'complete',
  progress: Number, // 0-100
  blockers: Array<String>,
  commits: Array<{ hash: String, message: String }>
}
```

### Design-Engineer

**Primary Role**: Design artifacts and UI updates

**Automatic Triggers**:
- `design:created` → Adds to project documents
- `mockup:approved` → Updates related tasks
- `asset:exported` → Links to implementation tasks

**Required Data**:
```javascript
{
  artifactType: 'mockup' | 'prototype' | 'asset',
  url: String,
  relatedTasks: Array<String>,
  version: String
}
```

### QA-Engineer

**Primary Role**: Quality assurance and testing

**Automatic Triggers**:
- `test:executed` → Updates test coverage metrics
- `bug:found` → Creates blocked task
- `test:passed` → Updates task verification status
- `release:approved` → Updates sprint completion

**Required Data**:
```javascript
{
  testType: 'unit' | 'integration' | 'e2e',
  coverage: Number,
  passed: Number,
  failed: Number,
  bugs: Array<{ severity: String, taskId: String }>
}
```

## Task Management Protocol

### Task Creation
```javascript
// Agent creates task internally
const task = {
  title: "Implement user authentication",
  department: "Backend-Engineer",
  priority: "P1",
  storyPoints: 5,
  description: "Add JWT-based auth system"
};

// Framework automatically reflects to Notion
await pipeline.reflectTask(task);
```

### Status Updates
```javascript
// Agent updates task status
agent.updateTaskStatus(taskId, 'in_progress');

// Automatically triggers:
// 1. Task status change in Notion
// 2. Activity log entry
// 3. Progress bar update
// 4. Sprint burndown recalculation
```

### Dependency Management
```javascript
// Agent declares dependency
agent.addDependency({
  task: 'frontend-auth-ui',
  dependsOn: 'backend-auth-api'
});

// Automatically:
// - Updates dependency graph
// - Blocks dependent task
// - Reflects in timeline view
```

## Visualization Updates

### Automatic Visualization Triggers

| Agent Action | Visualization Update |
|-------------|---------------------|
| Task completed | Burndown chart |
| Sprint started | Timeline view |
| Story points updated | Velocity graph |
| Task blocked | Dependency graph |
| Progress updated | Progress bars |
| Agent assigned | Resource allocation |

### Custom Metrics
```javascript
// Agent reports custom metric
agent.reportMetric({
  type: 'performance',
  name: 'API Response Time',
  value: 150,
  unit: 'ms',
  timestamp: Date.now()
});

// Creates custom visualization in metrics section
```

## Activity Logging

### Automatic Activity Entries
- Task status changes
- Agent assignments
- Blocker identification
- Milestone completion
- Sprint transitions

### Activity Format
```javascript
{
  timestamp: ISO8601,
  actor: 'Backend-Engineer-1',
  action: 'task:completed',
  target: 'task-123',
  details: 'Implemented user authentication',
  automated: true
}
```

## Sprint Management

### Sprint Lifecycle
1. **Planning** → Product-Strategist creates sprint
2. **Active** → Engineers execute tasks
3. **Review** → QA validates completion
4. **Complete** → Metrics calculated

### Sprint Updates
```javascript
// Start sprint (Product-Strategist)
agent.startSprint({
  name: 'Sprint 5',
  goal: 'Complete authentication system',
  duration: 14, // days
  plannedPoints: 45
});

// Daily updates (automatic)
// - Task completions
// - Burndown progress
// - Velocity tracking
// - Blocker alerts
```

## Document Management

### Automatic Document Linking
```javascript
// Agent creates document
const doc = agent.createDocument({
  type: 'technical_spec',
  title: 'Authentication Architecture',
  content: '...',
  relatedTasks: ['task-123', 'task-124']
});

// Automatically:
// - Adds to Knowledge Base section
// - Links to related tasks
// - Updates document count
```

## Error Handling

### Failed Updates
```javascript
// If Notion update fails:
// 1. Retry with exponential backoff (3 attempts)
// 2. Queue for later processing
// 3. Log error but don't block agent
// 4. Continue agent workflow

agent.on('notion:update:failed', (error) => {
  // Agent continues working
  // Pipeline handles retry
});
```

## Best Practices

### DO:
- 🏁 Update task status immediately when changed
- 🏁 Include descriptions for context
- 🏁 Set realistic story point estimates
- 🏁 Mark dependencies early
- 🏁 Complete tasks when truly done

### DON'T:
- 🔴 Try to update Notion directly
- 🔴 Wait to batch status updates
- 🔴 Create tasks without departments
- 🔴 Skip progress updates
- 🔴 Ignore blockers

## Testing Mode

### Mock Mode Verification
```javascript
// In development/testing
const pipeline = new StatusReflectionPipeline({ mode: 'mock' });

// All updates logged to console
// No actual Notion API calls
// Perfect for testing workflows
```

## Integration Points

### Framework Hooks
```javascript
// Automatic integration with existing Bumba systems
frameworkHooks = {
  'task:created': pipeline.reflectTask,
  'task:updated': pipeline.reflectTask,
  'sprint:started': pipeline.reflectSprint,
  'visualization:ready': pipeline.reflectVisualization,
  'activity:logged': pipeline.logActivity
};
```

## Performance Considerations

### Update Batching
- Real-time: Critical updates (5 seconds)
- Frequent: Progress updates (30 seconds)
- Standard: Metrics refresh (5 minutes)
- Daily: Historical data (24 hours)

### Rate Limiting
- Maximum 3 requests/second to Notion
- Automatic queuing when limit reached
- Priority-based processing

## Troubleshooting

### Common Issues

1. **Dashboard not updating**
   - Check pipeline.getStatistics()
   - Verify adapter connection
   - Review update queue

2. **Tasks not appearing**
   - Ensure department is set
   - Verify task has required fields
   - Check task validation

3. **Visualizations missing**
   - Confirm data exists
   - Check visualization type support
   - Review embed format

## Summary

The Notion Mirror feature provides automatic, real-time reflection of project state without requiring agents to manage dashboard complexity. Simply execute tasks, update statuses, and create artifacts - the pipeline handles the rest.

For technical implementation details, see `status-reflection-pipeline.js`.
For configuration options, see `notion-mirror.config.js`.
# Notion Project Dashboard Mirror

## Overview

The Notion Mirror feature provides automatic, one-way reflection of Bumba Framework project state to Notion dashboards. This creates a visual project management interface for stakeholders without requiring direct system access.

## Features

- 🟢 **Automatic Dashboard Creation** - Project dashboards created within 60 seconds
- 📊 **Real-time Status Updates** - Task and sprint progress reflected automatically
- 📈 **Rich Visualizations** - Burndown charts, velocity graphs, progress bars
- 🔄 **One-way Data Flow** - Bumba → Notion (no feedback loops)
- 🟡 **Department Mapping** - Automatic agent-to-department assignment
- 📅 **Timeline Views** - Sprint and task timeline visualizations
- 🔗 **Dependency Tracking** - Visual dependency graphs and critical path
- 🤖 **Agent Integration** - Seamless updates from agent actions

## Installation

The Notion Mirror is included in the Bumba Framework. No additional installation required.

## Configuration

### Environment Variables

```bash
# Optional - defaults to mock mode
NOTION_MODE=mock  # 'mock' | 'mcp' | 'api'

# Required for MCP mode (future users)
NOTION_MCP_SERVER=https://your-mcp-server.com
NOTION_API_KEY=your-api-key
NOTION_WORKSPACE_ID=your-workspace-id
NOTION_TEMPLATE_ID=your-template-id
```

### Configuration File

Edit `src/core/notion/mirror/config/notion-mirror.config.js`:

```javascript
module.exports = {
  mirror: {
    enabled: true,
    mode: 'mock',  // Safe for development
    updateInterval: 30000  // 30 seconds
  },
  // ... other settings
};
```

## Usage

### Quick Start

```javascript
const NotionMirror = require('./src/core/notion/mirror');

// Initialize mirror for a project
const mirror = new NotionMirror({ mode: 'mock' });

const result = await mirror.initialize({
  name: 'My Awesome Project',
  description: 'Building something amazing',
  priority: 'P1',
  team: ['backend-engineer', 'frontend-engineer', 'qa-engineer']
});

console.log('Dashboard URL:', result.dashboardUrl);
```

### With Bumba Commands

The mirror automatically integrates with Bumba commands:

```bash
# Initialize project with Notion dashboard
/bumba:implement "Authentication System"

# Create tasks (automatically reflected)
/bumba:task create "Implement JWT tokens" --priority P1

# Update task status
/bumba:complete task-123

# View dashboard status
/bumba:dashboard
```

### Agent Integration

Agents automatically update the dashboard through their actions:

```javascript
// Agent creates task
agent.createTask({
  title: 'Implement user authentication',
  department: 'Backend-Engineer',
  priority: 'P1'
});
// → Automatically reflected in Notion

// Agent updates status
agent.updateTaskStatus('task-123', 'in_progress');
// → Dashboard updates in real-time
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Bumba Framework                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Agents → Tasks → Status Pipeline → Adapter → Notion        │
│                       ↓                                      │
│                  Visualizations                              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Core Components

1. **Status Reflection Pipeline** (`pipelines/status-reflection-pipeline.js`)
   - Collects project state
   - Manages update queue
   - Handles rate limiting
   - Generates visualizations

2. **MCP Adapter** (`adapters/notion-mcp-adapter.js`)
   - Mock mode for development
   - MCP mode for production
   - Handles all Notion operations
   - Rate limiting and retries

3. **Task Schema** (`schemas/task-schema.js`)
   - Task/Sprint/Epic models
   - Dependency management
   - Validation and metrics

4. **Visualizations** (`visualizations/`)
   - Timeline component
   - Widget adapter
   - Chart generation

## Visualizations

### Available Charts

- **Progress Bar** - Overall and department progress
- **Burndown Chart** - Sprint progress tracking
- **Velocity Chart** - Team productivity metrics
- **Timeline View** - Task and sprint scheduling
- **Dependency Graph** - Task relationships
- **Risk Matrix** - Risk assessment grid
- **Status Grid** - Department activity overview

### Custom Visualizations

```javascript
// Create custom visualization
const customViz = mirror.widgetAdapter.createProgressBar({
  title: 'Custom Metric',
  value: 75,
  subtitle: 'Q4 Target: 100%'
});

// Embed in dashboard
await mirror.pipeline.reflectVisualization('custom', customViz);
```

## Testing

### Run Tests

```bash
cd src/core/notion/mirror/test
node notion-mirror.test.js
```

### Mock Mode Testing

Mock mode is perfect for development and testing:

```javascript
const mirror = new NotionMirror({ mode: 'mock' });

// All operations work without Notion connection
// Data stored in memory
// Console logs show what would happen

const mockData = mirror.pipeline.adapter.getMockData();
console.log('Mock dashboard:', mockData.dashboard);
```

## API Reference

### NotionMirror Class

```javascript
class NotionMirror {
  // Initialize dashboard for project
  async initialize(projectData)
  
  // Task management
  async createTask(taskData)
  async updateTaskStatus(taskId, newStatus)
  
  // Sprint management
  async createSprint(sprintData)
  
  // Visualizations
  async updateProgressVisualization()
  async updateBurndownChart()
  async updateTimelineVisualization()
  
  // Agent integration
  async agentTaskUpdate(agentId, taskData)
  
  // Statistics
  getStatistics()
  
  // Cleanup
  async shutdown()
}
```

### Task Schema

```javascript
{
  id: String,
  title: String,
  description: String,
  status: 'backlog' | 'todo' | 'in_progress' | 'blocked' | 'complete',
  department: String,
  assignee: String,
  priority: 'P0' | 'P1' | 'P2' | 'P3',
  storyPoints: Number,
  progress: Number (0-100),
  dependencies: {
    blockedBy: Array<TaskId>,
    blocks: Array<TaskId>
  }
}
```

## Troubleshooting

### Dashboard Not Updating

```javascript
// Check pipeline status
const stats = mirror.getStatistics();
console.log('Pipeline stats:', stats.pipelineStats);

// Check update queue
console.log('Queued updates:', stats.pipelineStats.queueLength);

// Force update
await mirror.pipeline.processQueue();
```

### Tasks Not Appearing

```javascript
// Verify task creation
const task = await mirror.createTask({
  title: 'Test Task',
  department: 'Backend-Engineer'  // Required
});

console.log('Task created:', task.id);

// Check task in state
const allTasks = mirror.pipeline.state.tasks;
console.log('Total tasks:', allTasks.size);
```

### Mock Mode Verification

```javascript
// Ensure mock mode is active
console.log('Mode:', mirror.pipeline.adapter.mode);  // Should be 'mock'

// Get mock data
const mockData = mirror.pipeline.adapter.getMockData();
console.log('Mock dashboard:', mockData);
```

## Performance

- **Update Batching**: Updates batched in groups of 10
- **Rate Limiting**: Maximum 3 requests/second to Notion
- **Caching**: Visualizations cached for 30 seconds
- **Async Processing**: Non-blocking update queue

## Security

- **No Credentials in Code**: All credentials via environment variables
- **Mock Mode Default**: Safe development without API access
- **One-way Flow**: No data flows back from Notion
- **Validation**: All inputs validated before processing

## Future Enhancements

- [ ] Real MCP server connection
- [ ] Bidirectional sync (optional)
- [ ] Custom dashboard templates
- [ ] Advanced analytics
- [ ] Multi-project support
- [ ] Historical data tracking

## Support

For issues or questions:
- Check the test suite for examples
- Review agent-protocols.md for agent integration
- See notion-mirror.config.js for configuration options

## License

Part of the Bumba Framework - Internal Use Only
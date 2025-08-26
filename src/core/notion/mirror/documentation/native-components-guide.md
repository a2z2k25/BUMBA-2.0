# Native Notion Components Guide

## Overview

The Notion Mirror feature prioritizes native Notion components over embedded visualizations whenever possible. This provides better performance, interactivity, and maintainability.

## Component Priority System

### Decision Flow

```
Data to Display
      ↓
Can use native Notion component?
      ├─ YES → Use native (Timeline, Kanban, Table, etc.)
      └─ NO → Is visualization critical?
              ├─ YES → Generate embed (Burndown, Velocity charts)
              └─ NO → Use structured data representation
```

## Native Components Available

### 1. Timeline View (Native)
**Used for**: Sprint planning, task scheduling, project timeline

```javascript
// Automatically uses native Notion timeline
await pipeline.reflectVisualization('timeline', {
  tasks: taskArray,
  sprints: sprintArray
});
```

**Native Features**:
- Drag-and-drop task scheduling
- Department swim lanes
- Dependency visualization
- Progress indicators
- Multiple view options (Timeline, Table, Board)

### 2. Kanban Board (Native)
**Used for**: Task management, status tracking

```javascript
// Creates native Notion board view
await pipeline.reflectVisualization('kanban', {
  tasks: taskArray
});
```

**Native Features**:
- Drag-and-drop between columns
- Custom status columns
- Priority indicators
- Assignee avatars
- Filter and sort options

### 3. Progress Indicators (Native)
**Used for**: Overall progress, department progress

```javascript
// Uses native callouts and progress bars
await pipeline.reflectVisualization('progress', {
  value: 75,
  total: 100,
  completed: 75
});
```

**Native Representation**:
- Callout blocks with emoji indicators
- Text-based progress bars
- Color-coded status (🔴 🟠 🟡 🔵 🏁)
- Nested bullet lists for details

### 4. Status Grid (Native Table)
**Used for**: Department status overview

```javascript
// Creates native Notion table
await pipeline.reflectVisualization('statusGrid', {
  departments: departmentStatusArray
});
```

**Native Features**:
- Sortable columns
- Status emoji indicators
- Inline editing
- Export capabilities

### 5. Metrics Dashboard (Native Columns)
**Used for**: KPI display, metrics overview

```javascript
// Uses native column layout with callouts
await pipeline.reflectVisualization('metrics', {
  progress: 65,
  velocity: 45,
  blocked: 3,
  health: 'healthy'
});
```

**Native Layout**:
- Column list for grid layout
- Callout blocks for metric cards
- Emoji indicators for visual appeal
- Color coding for status

### 6. Calendar View (Native)
**Used for**: Sprint schedules, deadlines

```javascript
// Creates native Notion calendar
await pipeline.reflectVisualization('calendar', {
  events: eventArray
});
```

**Native Features**:
- Month/week/day views
- Event creation
- Drag-and-drop rescheduling
- Color coding by type

## Components Requiring Embeds

These visualizations are too complex for native representation and require embedded charts:

### 1. Burndown Chart
- Requires time-series data plotting
- Ideal vs actual line comparison
- Point-in-time snapshots

### 2. Velocity Chart
- Multi-bar comparison
- Historical trend analysis
- Average line overlay

### 3. Dependency Graph
- Force-directed graph layout
- Interactive node relationships
- Critical path highlighting

### 4. Risk Matrix
- 2D scatter plot
- Quadrant analysis
- Bubble sizing

## Native Component Structure

### Database Views
```javascript
{
  type: 'database',
  database: {
    properties: {
      // Notion property definitions
    },
    default_view: 'timeline', // or 'board', 'table', 'calendar'
    views: [
      // Multiple view configurations
    ]
  }
}
```

### Compound Components
```javascript
{
  type: 'compound',
  children: [
    { type: 'heading_2', ... },
    { type: 'callout', ... },
    { type: 'table', ... },
    { type: 'bulleted_list', ... }
  ]
}
```

## Configuration

### Enable/Disable Native Components

In `notion-mirror.config.js`:

```javascript
visualizations: {
  preferNative: true,  // Default: true
  nativeComponents: {
    timeline: true,
    kanban: true,
    progress: true,
    statusGrid: true,
    metrics: true,
    calendar: true
  },
  // Force embed for specific types
  forceEmbed: ['burndown', 'velocity']
}
```

## Best Practices

### 1. Data Preparation
Ensure data is formatted for native components:

```javascript
// For timeline
tasks.map(task => ({
  title: task.title,
  startDate: task.startDate,
  endDate: task.endDate,
  status: task.status
}));
```

### 2. Fallback Strategy
Always provide embed fallback for complex data:

```javascript
const content = await nativeComponents.convertToNotion(
  'timeline',
  data,
  fallbackEmbed  // Generated visualization
);
```

### 3. Performance Considerations
- Native components update instantly
- No rendering overhead
- Better mobile experience
- Reduced bandwidth usage

## Complexity Thresholds

The system automatically falls back to embeds when:

| Component | Threshold | Reason |
|-----------|-----------|---------|
| Timeline | >20 dependencies | Too complex for native relations |
| Progress | Multi-dimensional | Native supports single progress only |
| Chart | Time-series data | Requires plotting capabilities |
| Graph | Network visualization | Needs specialized layout |

## Native Component Benefits

### User Experience
- **Interactive**: Direct manipulation of data
- **Familiar**: Standard Notion interface
- **Responsive**: Works on all devices
- **Accessible**: Screen reader compatible

### Performance
- **Fast**: No rendering overhead
- **Efficient**: Native Notion operations
- **Cached**: Built-in Notion caching
- **Lightweight**: No embedded images

### Maintenance
- **Simple**: No chart library dependencies
- **Stable**: Uses Notion's API
- **Flexible**: Easy to modify
- **Portable**: Works across workspaces

## Testing Native Components

### Mock Mode Testing
```javascript
const mirror = new NotionMirror({ mode: 'mock' });

// Test native timeline
await mirror.pipeline.reflectVisualization('timeline', {
  tasks: testTasks
});

// Verify native component was used
const viz = mirror.pipeline.state.visualizations.get('timeline');
assert(viz.type === 'native');
```

### Verification Checklist
- [ ] Native component renders correctly
- [ ] Data displays accurately
- [ ] Interactions work (in real Notion)
- [ ] Fallback triggers appropriately
- [ ] Performance is acceptable

## Troubleshooting

### Native Component Not Used
```javascript
// Check if native is enabled
console.log(nativeComponents.canUseNative('timeline', data));

// Check complexity threshold
console.log(nativeComponents.isDataTooComplex('timeline', data));
```

### Data Not Displaying
```javascript
// Verify data format
const formatted = nativeComponents.createNativeTimeline(data);
console.log(formatted.database.properties);
```

### Forcing Embed Mode
```javascript
// Override native preference
await pipeline.reflectVisualization('timeline', {
  ...data,
  forceEmbed: true
});
```

## Summary

The native-first approach ensures:
1. Better user experience with interactive components
2. Improved performance without rendering overhead
3. Seamless integration with Notion's interface
4. Fallback to embeds only when necessary

This system intelligently chooses the best representation for each visualization, maximizing native Notion capabilities while preserving the ability to display complex charts when needed.
# BUMBA Widget System

Terminal-style dashboard widgets inspired by sampler, built into the BUMBA CLI.

## Architecture

```
src/core/widgets/
├── index.js           # Main widget system interface
├── sampler-core.js    # Core widget implementations (optimized)
├── dynamic-widgets.js # Dynamic data binding system
└── README.md         # This file

src/core/notion/
├── auto-dashboard-generator.js  # Automatic widget selection
├── sampler-exact.js             # Full sampler replicas
└── notion-simulator.js          # Notion testing without API
```

## Widget Types

All 7 widget types can display ANY data:

| Widget | Purpose | Data Examples | Size |
|--------|---------|---------------|------|
| **RunChart** | Time-series data | API metrics, stock prices, temperatures | ~1.2KB |
| **Sparkline** | Current metric + history | CPU, memory, queue depth, visitors | ~1.0KB |
| **BarChart** | Comparisons | File sizes, budgets, rankings, tests | ~1.4KB |
| **Gauge** | Progress/percentage | Completion, disk usage, battery, score | ~0.7KB |
| **TextBox** | Tabular data | Logs, databases, leaderboards, config | ~1.1KB |
| **AsciiBox** | Prominent display | Time, price, alert, version, KPI | ~0.9KB |
| **StatusGrid** | Key-value pairs | Health, flags, environment, metadata | ~0.8KB |

## Usage Examples

### 1. Basic Widget Generation

```javascript
const { BumbaWidgets } = require('bumba/widgets');
const widgets = new BumbaWidgets();

// Generate with default data
const chart = widgets.generateWidget('runchart');

// Generate with custom data
const sparkline = widgets.generateWidget('sparkline', {
  title: 'API Requests',
  currentValue: 1247,
  unit: '/sec',
  data: [/* array of values */],
  color: '#FFD700'
});
```

### 2. Automatic Widget Generation

```javascript
// BUMBA automatically chooses appropriate widgets
const projectData = {
  metrics: [/* ... */],      // → Sparklines
  timeSeries: {/* ... */},   // → RunChart
  comparisons: [/* ... */],  // → BarChart
  progress: {/* ... */},     // → Gauge
  table: {/* ... */},        // → TextBox
  kpis: [/* ... */],         // → AsciiBox
  status: {/* ... */}        // → StatusGrid
};

const dashboard = widgets.generateFromData(projectData);
```

### 3. Notion Export

```javascript
// Export widgets for Notion embedding
await widgets.exportForNotion('./notion-widgets', {
  data: projectData
});

// Each widget will be:
// - Under 1500 chars (Notion limit)
// - Self-contained HTML
// - Responsive to column width
```

### 4. Direct Widget Functions

```javascript
const { widgets } = require('bumba/widgets');

// Use individual widget generators
const cpu = widgets.sparkline({
  title: 'CPU Usage',
  currentValue: 78,
  color: '#FF00FF'
});

const progress = widgets.gauge({
  title: 'Build Progress',
  value: 85,
  label: '17 of 20 tests'
});
```

## Dynamic Data Binding

Widgets automatically adapt to your data:

```javascript
// Time-series data → RunChart
if (data.hasTimeSeries) {
  widget = widgets.runChart({
    title: data.title,
    series: data.series,
    xAxisLabels: data.timestamps
  });
}

// Current value with history → Sparkline
if (data.hasCurrentMetric) {
  widget = widgets.sparkline({
    title: data.metricName,
    currentValue: data.current,
    data: data.history,
    color: data.critical ? '#FF0000' : '#7FFF00'
  });
}

// Comparative data → BarChart
if (data.hasComparisons) {
  widget = widgets.barChart({
    title: 'Comparison',
    items: data.items.map(item => ({
      label: item.name,
      value: item.value,
      percent: (item.value / item.max) * 100,
      color: item.color
    }))
  });
}
```

## CLI Usage

```bash
# Export widgets from command line
bumba export-widgets ./output

# With custom data
bumba export-widgets ./output --data metrics.json
```

## Integration with BUMBA

The widget system is fully integrated:

```javascript
// In your BUMBA project
const bumba = require('bumba');

// Widgets are available globally
const widgets = bumba.BumbaWidgets.getInstance();

// Generate dashboard for current project
const dashboard = widgets.createDashboard({
  metrics: await bumba.gatherMetrics(),
  status: await bumba.getSystemStatus(),
  progress: await bumba.getProgress()
});
```

## Notion Embedding

1. **Export widgets**: Generate HTML files
2. **Host on HTTPS**: GitHub Pages, Vercel, Netlify
3. **Embed in Notion**: Use `/embed` command
4. **Auto-resize**: Widgets adapt to column width

### Hosting Options

- **GitHub Pages**: Free for public repos
- **Vercel**: Instant deploys with preview URLs
- **Netlify**: Drag-and-drop deployment
- **Widget Services**: notion-widgets.com, indify.co

## Color Scheme

Sampler colors for data visualization:

- `#FFD700` - Gold (normal/warning)
- `#00FFFF` - Cyan (info/secondary)
- `#FF1493` - Deep Pink (critical/high)
- `#7FFF00` - Chartreuse (success/good)
- `#FF00FF` - Magenta (special/highlight)

## Performance

- All widgets < 1500 chars (Notion limit)
- No external dependencies
- Pure HTML/CSS with minimal JS
- Instant rendering
- Responsive design

## License

Part of the BUMBA CLI - MIT License
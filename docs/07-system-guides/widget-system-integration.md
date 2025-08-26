# BUMBA Widget System Integration

## Overview
The BUMBA framework now includes a complete Notion-embeddable widget system based on the sampler terminal dashboard aesthetic. All widgets are under 1500 characters to meet Notion's HTML embed limits.

## Integration Points

### 1. npm Package Exports
```javascript
// Main package with widgets
const bumba = require('bumba');
const widgets = new bumba.BumbaWidgets();

// Direct widget import
const { BumbaWidgets } = require('bumba/widgets');
```

### 2. File Structure
```
src/core/widgets/
├── index.js           # Main widget interface
├── sampler-core.js    # Optimized core widgets
├── dynamic-widgets.js # Dynamic data binding
└── README.md         # Documentation

src/core/notion/
├── auto-dashboard-generator.js  # Automatic widget selection
├── sampler-exact.js             # Full sampler replicas
└── notion-simulator.js          # Testing utilities
```

### 3. Widget Types Available

| Widget | Use Case | Size |
|--------|----------|------|
| RunChart | Time series data | ~1.2KB |
| Sparkline | Current metrics | ~1.3KB |
| BarChart | Comparisons | ~1.4KB |
| Gauge | Progress/percentage | ~0.4KB |
| TextBox | Tabular data | ~1.1KB |
| AsciiBox | Large displays | ~0.9KB |
| StatusGrid | Key-value pairs | ~0.6KB |

## Usage Examples

### Basic Widget Generation
```javascript
const { BumbaWidgets } = require('bumba/widgets');
const widgets = new BumbaWidgets();

// Generate sparkline
const cpu = widgets.generateWidget('sparkline', {
  title: 'CPU Usage',
  value: '78%',
  color: '#FF00FF'
});
```

### Automatic Dashboard Creation
```javascript
// BUMBA automatically selects appropriate widgets
const projectData = {
  metrics: [...],      // → Sparklines
  timeSeries: {...},   // → RunChart
  progress: {...},     // → Gauge
  status: {...}        // → StatusGrid
};

const dashboard = widgets.generateFromData(projectData);
```

### Notion Export
```javascript
// Export widgets for Notion embedding
await widgets.exportForNotion('./widgets', {
  data: projectData
});
```

## Testing

### Unit Tests
```bash
npm test -- tests/unit/widgets/widget-system.test.js
```

### Verification Script
```bash
node verify-widget-system.js
```

## Features

### 🏁 Completed
- All 7 sampler widget types implemented
- Dynamic data binding for any data type
- Automatic widget selection based on data
- Full Notion embedding support (< 1500 chars)
- Responsive design with CSS grid/flexbox
- Legible ASCII art using block characters
- Integration with BUMBA framework
- npm package exports configured
- Comprehensive test suite

### 🟢 Key Capabilities
- **Universal Data Containers**: Each widget can display ANY type of data
- **Automatic Selection**: AI analyzes data and chooses appropriate widgets
- **Size Optimized**: All widgets under Notion's 1500 character limit
- **Responsive**: Adapts to container width
- **Terminal Aesthetic**: Exact sampler styling with box-drawing characters

## Color Palette
Following sampler's color scheme:
- `#FFD700` - Gold (normal/warning)
- `#00FFFF` - Cyan (info/secondary)
- `#FF1493` - Deep Pink (critical/high)
- `#7FFF00` - Chartreuse (success/good)
- `#FF00FF` - Magenta (special/highlight)

## Publishing
When BUMBA is published to npm, the widget system will be available:

```json
{
  "exports": {
    ".": "./src/index.js",
    "./widgets": "./src/core/widgets/index.js"
  }
}
```

Users can then:
```javascript
const { BumbaWidgets } = require('bumba/widgets');
// or
const bumba = require('bumba');
const widgets = new bumba.BumbaWidgets();
```

## Notion Embedding Process
1. Export widgets to HTML files
2. Host on HTTPS (GitHub Pages, Vercel, Netlify)
3. Use Notion's `/embed` command
4. Paste the HTTPS URL
5. Widget auto-resizes to column width

## Performance
- All widgets < 1500 characters
- No external dependencies
- Pure HTML/CSS with minimal JavaScript
- Instant rendering
- Responsive without media queries

## Integration Status
🏁 **FULLY INTEGRATED AND OPERATIONAL**

The widget system is now a core part of BUMBA and will be available when the framework is published to npm.
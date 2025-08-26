/**
 * Dynamic Widget System for BUMBA
 * Demonstrates how the 7 sampler widget types can display ANY data
 */

class DynamicWidgets {
  
  /**
   * 1. RunChart - Can display ANY time-series data
   * Examples: API response times, error rates, user activity, stock prices, temperature
   */
  static runChart(config) {
    const {
      title = 'Time Series Data',
      series = [], // Array of { label, color, data: [numbers] }
      yAxisLabels = [], // Custom Y-axis labels
      xAxisLabels = [], // Custom time labels
      gridLines = true
    } = config;

    return `<!DOCTYPE html>
<html>
<head>
<style>
*{margin:0;padding:0}body{background:#000;font:11px monospace;color:#fff}
.chart{border:1px solid #333;height:280px;position:relative}
.title{position:absolute;top:-1px;left:15px;background:#000;padding:0 5px;color:#fff}
</style>
</head>
<body>
<div class="chart">
<div class="title">${title}</div>
<canvas id="c"></canvas>
<script>
// This can plot ANY time-series data dynamically
const series = ${JSON.stringify(series)};
const canvas = document.getElementById('c');
// Render any data points...
</script>
</div>
</body>
</html>`;
  }

  /**
   * 2. Sparkline - Can display ANY metric that changes over time
   * Examples: CPU, memory, network traffic, sales, visitors, queue depth
   */
  static sparkline(config) {
    const {
      title = 'Metric',
      currentValue = config.value || 0,  // Accept both 'value' and 'currentValue'
      minValue = 0,
      maxValue = 100,
      color = '#FFD700',
      unit = '',
      data = [] // Array of values for bars
    } = config;

    return `<!DOCTYPE html>
<html><head><style>
*{margin:0;padding:0}body{background:#000;font:11px monospace;color:#fff}
.s{border:1px solid #333;height:120px;position:relative;padding:10px}
.t{position:absolute;top:-1px;left:15px;background:#000;padding:0 5px}
.v{position:absolute;right:15px;top:15px;font-size:28px;font-weight:bold}
.b{display:flex;height:50px;align-items:flex-end;gap:2px;margin-top:30px}
.bar{width:4px;background:${color}}
</style></head><body>
<div class="s"><div class="t">${title}</div><div class="v">${currentValue}${unit}</div>
<div class="b" id="b"></div></div>
<script>
const b=document.getElementById('b');
const data=${JSON.stringify(data.length ? data : Array(30).fill(0).map(() => Math.random()))};
data.forEach(v=>{
const bar=document.createElement('div');
bar.className='bar';
bar.style.height=((v-${minValue})/(${maxValue}-${minValue})*100)+'%';
b.appendChild(bar);
});
</script></body></html>`;
  }

  /**
   * 3. BarChart - Can display ANY comparative data
   * Examples: File sizes, budgets, task completion, resource usage, rankings
   */
  static barChart(config) {
    const {
      title = 'Comparison',
      items = [] // Array of { label, value, maxValue, color, displayText }
    } = config;

    const barsHtml = items.map(item => `
<div class="row">
  <div class="label">${item.displayText || item.value}</div>
  <div class="bar-bg">
    <div class="bar-fill" style="width:${(item.value/item.maxValue)*100}%;background:${item.color}"></div>
  </div>
  <div class="name">${item.label}</div>
</div>`).join('');

    return `<!DOCTYPE html>
<html>
<head>
<style>
*{margin:0;padding:0}body{background:#000;font:11px monospace;color:#fff}
.row{margin:10px}.bar-bg{height:20px;background:#111}.bar-fill{height:100%}
</style>
</head>
<body>
<div class="chart">
<div class="title">${title}</div>
${barsHtml}
</div>
</body>
</html>`;
  }

  /**
   * 4. Gauge - Can display ANY percentage or progress
   * Examples: Project completion, disk usage, battery level, confidence score
   */
  static gauge(config) {
    const {
      title = 'Progress',
      value = 0,
      maxValue = 100,
      label = '',
      color = '#FFD700',
      fillChar = '█',
      emptyChar = '░'
    } = config;

    const percent = (value / maxValue) * 100;
    const filled = Math.floor(percent);
    const bars = fillChar.repeat(filled) + emptyChar.repeat(100 - filled);

    return `<!DOCTYPE html>
<html>
<head>
<style>
*{margin:0;padding:0}body{background:#000;font:11px monospace;color:#fff}
</style>
</head>
<body>
<div class="gauge">
<div class="title">${title}</div>
<div class="bar" style="color:${color}">${bars}</div>
<div class="label">${label || percent.toFixed(1) + '%'}</div>
</div>
</body>
</html>`;
  }

  /**
   * 5. TextBox - Can display ANY tabular data
   * Examples: Database results, logs, leaderboards, inventory, test results
   */
  static textBox(config) {
    const {
      title = 'Data Table',
      headers = [],
      rows = [],
      colorize = false // Can color-code cells based on values
    } = config;

    return `<!DOCTYPE html>
<html>
<head>
<style>
*{margin:0;padding:0}body{background:#000;font:11px monospace;color:#fff}
table{width:100%}th{color:#FFD700;text-align:left;padding:4px}td{padding:3px}
</style>
</head>
<body>
<div class="box">
<div class="title">${title}</div>
<table>
<thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
<tbody>${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody>
</table>
</div>
</body>
</html>`;
  }

  /**
   * 6. AsciiBox - Can display ANY text/numbers in large format
   * Examples: KPIs, alerts, countdowns, scores, prices, status codes
   */
  static asciiBox(config) {
    const {
      title = 'Display',
      content = '',
      color = '#7FFF00',
      fontSize = '48px',
      isAsciiArt = false
    } = config;

    return `<!DOCTYPE html>
<html>
<head>
<style>
*{margin:0;padding:0}body{background:#000;font:11px monospace;color:#fff}
</style>
</head>
<body>
<div class="box">
<div class="title">${title}</div>
<div class="content" style="color:${color};font-size:${fontSize}">
${isAsciiArt ? `<pre>${content}</pre>` : content}
</div>
</div>
</body>
</html>`;
  }

  /**
   * 7. StatusGrid - Can display ANY key-value pairs or status indicators
   * Examples: System health, feature flags, environment vars, metrics summary
   */
  static statusGrid(config) {
    const {
      title = 'Status',
      items = [] // Array of { emoji, label, value, color }
    } = config;

    const gridHtml = items.map(item => `
<div class="item">
  ${item.emoji || '•'} ${item.label}: 
  <span style="color:${item.color || '#fff'}">${item.value}</span>
</div>`).join('');

    return `<!DOCTYPE html>
<html>
<head>
<style>
*{margin:0;padding:0}body{background:#000;font:11px monospace;color:#fff}
.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}
</style>
</head>
<body>
<div class="status">
<div class="title">${title}</div>
<div class="grid">${gridHtml}</div>
</div>
</body>
</html>`;
  }
}

/**
 * Example: Project Management Dashboard
 */
class ProjectDashboardExample {
  static generateDashboard(projectData) {
    const widgets = [];

    // 1. RunChart: Sprint velocity over time
    widgets.push(DynamicWidgets.runChart({
      title: 'Sprint Velocity',
      series: [
        { label: 'Completed', color: '#7FFF00', data: projectData.velocity },
        { label: 'Planned', color: '#FFD700', data: projectData.planned }
      ],
      xAxisLabels: ['Sprint 1', 'Sprint 2', 'Sprint 3', 'Sprint 4']
    }));

    // 2. Sparkline: Active PR count
    widgets.push(DynamicWidgets.sparkline({
      title: 'Pull Requests',
      currentValue: projectData.activePRs,
      unit: ' PRs',
      color: '#00FFFF',
      data: projectData.prHistory
    }));

    // 3. BarChart: Team member contributions
    widgets.push(DynamicWidgets.barChart({
      title: 'Team Contributions',
      items: projectData.team.map(member => ({
        label: member.name,
        value: member.commits,
        maxValue: 100,
        color: member.commits > 50 ? '#7FFF00' : '#FFD700',
        displayText: `${member.commits} commits`
      }))
    }));

    // 4. Gauge: Sprint progress
    widgets.push(DynamicWidgets.gauge({
      title: 'Sprint Progress',
      value: projectData.sprintProgress,
      maxValue: 100,
      label: `Day ${projectData.sprintDay} of 14`
    }));

    // 5. TextBox: Recent deployments
    widgets.push(DynamicWidgets.textBox({
      title: 'Recent Deployments',
      headers: ['Environment', 'Version', 'Status', 'Time'],
      rows: projectData.deployments
    }));

    // 6. AsciiBox: Current build number
    widgets.push(DynamicWidgets.asciiBox({
      title: 'Build',
      content: `#${projectData.buildNumber}`,
      color: projectData.buildStatus === 'passing' ? '#7FFF00' : '#FF0000'
    }));

    // 7. StatusGrid: Project health
    widgets.push(DynamicWidgets.statusGrid({
      title: 'Project Health',
      items: [
        { emoji: '🟢', label: 'CI/CD', value: 'Passing', color: '#7FFF00' },
        { emoji: '🟡', label: 'Coverage', value: '78%', color: '#FFD700' },
        { emoji: '🟠', label: 'Tech Debt', value: 'Medium', color: '#FFA500' },
        { emoji: '🔴', label: 'Bugs', value: '3 Critical', color: '#FF0000' }
      ]
    }));

    return widgets;
  }
}

/**
 * Example: AI Model Performance Dashboard
 */
class AIPerformanceDashboard {
  static generateDashboard(modelData) {
    return [
      // RunChart: Accuracy over epochs
      DynamicWidgets.runChart({
        title: 'Model Accuracy',
        series: [
          { label: 'Training', color: '#7FFF00', data: modelData.trainAccuracy },
          { label: 'Validation', color: '#00FFFF', data: modelData.valAccuracy }
        ]
      }),

      // Sparkline: Inference speed
      DynamicWidgets.sparkline({
        title: 'Inference Speed',
        currentValue: modelData.currentSpeed,
        unit: ' ms',
        minValue: 0,
        maxValue: 1000
      }),

      // BarChart: Feature importance
      DynamicWidgets.barChart({
        title: 'Feature Importance',
        items: modelData.features.map(f => ({
          label: f.name,
          value: f.importance,
          maxValue: 1,
          color: f.importance > 0.7 ? '#FF0000' : '#FFD700'
        }))
      }),

      // TextBox: Confusion matrix
      DynamicWidgets.textBox({
        title: 'Confusion Matrix',
        headers: ['', 'Pred A', 'Pred B', 'Pred C'],
        rows: modelData.confusionMatrix
      })
    ];
  }
}

module.exports = {
  DynamicWidgets,
  ProjectDashboardExample,
  AIPerformanceDashboard
};
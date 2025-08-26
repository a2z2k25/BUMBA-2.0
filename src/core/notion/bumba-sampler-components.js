/**
 * BUMBA Sampler Components - Exact Replica
 * Strict BUMBA color gradient: Green → Yellow → Orange → Red
 * ONLY emojis allowed: 🟢🟡🟠🔴🏁
 */

class BumbaSamplerComponents {
  constructor() {
    // BUMBA gradient colors ONLY
    this.colors = {
      green: '#00FF00',   // 🟢
      yellow: '#FFD700',  // 🟡
      orange: '#FFA500',  // 🟠
      red: '#FF0000',     // 🔴
      white: '#FFFFFF',
      dim: '#666666',
      bg: '#000000'
    };
  }

  /**
   * Component 1: RunChart - Exactly like sampler
   */
  runChart(config = {}) {
    const {
      title = 'Search engine response time',
      width = 140,
      height = 10,
      series = []
    } = config;

    return `
<div class="sampler-component" style="width: 100%; margin-bottom: 2px;">
  <div class="component-border">
    <div class="component-header">┌─ ${title} ${'─'.repeat(width - title.length - 5)}┐</div>
    <div class="component-body" style="position: relative; height: ${height * 20}px;">
      <div class="chart-y-labels">
        <div>0.44│</div>
        <div>0.37│</div>
        <div>0.3 │</div>
        <div>0.23│</div>
        <div>0.16│</div>
      </div>
      <div class="chart-area">
        <canvas id="chart-${Date.now()}" width="${width * 6}" height="${height * 20}"></canvas>
      </div>
      <div class="chart-legend">
        ${series.map(s => `
          <span class="legend-item">
            <span class="dot" style="background: ${s.color};">●</span>
            <span style="color: ${s.color};">${s.label}</span>
          </span>
        `).join('')}
      </div>
    </div>
    <div class="component-footer">
      <div class="x-labels">
        <span>└${'─'.repeat(30)}</span>
        <span>22:06:58</span>
        <span>22:07:15</span>
        <span>22:07:30</span>
        <span>22:07:45</span>
        <span>22:08:00${'─'.repeat(30)}┘</span>
      </div>
    </div>
  </div>
</div>`;
  }

  /**
   * Component 2: Sparkline - Vertical bars exactly like sampler
   */
  sparkline(config = {}) {
    const {
      title = 'CPU usage',
      value = '98',
      min = '14',
      max = '100',
      color = null
    } = config;

    // Use BUMBA gradient color based on value
    const val = parseInt(value);
    const barColor = val > 75 ? this.colors.red : 
                     val > 50 ? this.colors.orange :
                     val > 25 ? this.colors.yellow : 
                     this.colors.green;

    return `
<div class="sampler-component sparkline">
  <div class="component-border">
    <div class="component-header">┌─ ${title} ${'─'.repeat(60 - title.length)}┐</div>
    <div class="component-body" style="height: 100px; position: relative;">
      <div class="sparkline-value" style="color: ${barColor};">${value}</div>
      <div class="sparkline-bars" data-color="${barColor}"></div>
      <div class="sparkline-labels">
        <span>${min}</span>
        <span style="float: right;">${max}</span>
      </div>
    </div>
    <div class="component-footer">└${'─'.repeat(60)}┘</div>
  </div>
</div>`;
  }

  /**
   * Component 3: BarChart - Horizontal bars exactly like sampler
   */
  barChart(config = {}) {
    const {
      title = 'Local network activity',
      bars = []
    } = config;

    return `
<div class="sampler-component" style="width: 100%;">
  <div class="component-border">
    <div class="component-header">┌─ ${title} ${'─'.repeat(140 - title.length - 5)}┐</div>
    <div class="component-body" style="padding: 10px;">
      ${bars.map(bar => {
        // Map colors to BUMBA gradient
        const barColor = bar.label.includes('UDP') ? this.colors.yellow : 
                        bar.label.includes('TCP') && bar.label.includes('in') ? this.colors.red :
                        this.colors.green;
        return `
        <div class="bar-row">
          <div class="bar-values" style="color: ${barColor};">${bar.displayValue}</div>
          <div class="bar-container">
            <div class="bar-fill" style="width: ${bar.value}%; background: ${barColor};"></div>
          </div>
          <div class="bar-label" style="color: #fff;">${bar.label}</div>
        </div>`;
      }).join('')}
    </div>
    <div class="component-footer">└${'─'.repeat(140)}┘</div>
  </div>
</div>`;
  }

  /**
   * Component 4: Gauge - Progress bars exactly like sampler
   */
  gauge(config = {}) {
    const {
      title = 'Year progress',
      value = 43.8,
      displayValue = '43.8% (160)',
      emoji = '🟡'
    } = config;

    const pipes = '│'.repeat(Math.floor(value));
    const spaces = ' '.repeat(100 - Math.floor(value));

    return `
<div class="sampler-component gauge">
  <div class="component-border">
    <div class="component-header">┌─ ${title} ${'─'.repeat(120 - title.length - 5)}┐</div>
    <div class="component-body">
      <div class="gauge-bar">
        <span style="color: ${this.colors.yellow};">${pipes}</span>${spaces}
        <span class="gauge-value">${displayValue}</span>
      </div>
    </div>
    <div class="component-footer">└${'─'.repeat(120)}┘</div>
  </div>
</div>`;
  }

  /**
   * Component 5: TextBox - Docker stats table exactly like sampler
   */
  textBox(config = {}) {
    const {
      title = 'Docker containers stats',
      headers = ['NAME', 'CPU %', 'MEM USAGE / LIMIT', 'PIDS'],
      rows = []
    } = config;

    return `
<div class="sampler-component">
  <div class="component-border">
    <div class="component-header">┌─ ${title} ${'─'.repeat(80 - title.length - 5)}┐</div>
    <div class="component-body">
      <table class="data-table">
        <thead>
          <tr>
            ${headers.map(h => `<th style="color: ${this.colors.yellow};">${h}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${rows.map(row => `
          <tr>
            ${row.map(cell => `<td>${cell}</td>`).join('')}
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
    <div class="component-footer">└${'─'.repeat(80)}┘</div>
  </div>
</div>`;
  }

  /**
   * Component 6: AsciiBox - Weather widget exactly like sampler
   */
  asciiBox(config = {}) {
    const {
      title = 'Local weather',
      content = '',
      isTime = false
    } = config;

    if (isTime) {
      return `
<div class="sampler-component">
  <div class="component-border">
    <div class="component-header">┌─ ${title} ${'─'.repeat(40 - title.length - 5)}┐</div>
    <div class="component-body" style="text-align: center; padding: 20px;">
      <div style="font-size: 48px; color: ${this.colors.green}; font-family: monospace;">
        ${content}
      </div>
    </div>
    <div class="component-footer">└${'─'.repeat(40)}┘</div>
  </div>
</div>`;
    }

    // Weather ASCII art
    return `
<div class="sampler-component">
  <div class="component-border">
    <div class="component-header">┌─ ${title} ${'─'.repeat(60 - title.length - 5)}┐</div>
    <div class="component-body" style="padding: 10px;">
      <pre style="color: ${this.colors.yellow}; margin: 0; font-size: 12px;">
    \\   /     Sunny
     .-.      77.78 °F  
  ― (   ) ―   ↘ 11 mph 
     \`-'      9 mi     
    /   \\     0.0 in
      </pre>
    </div>
    <div class="component-footer">└${'─'.repeat(60)}┘</div>
  </div>
</div>`;
  }

  /**
   * Generate styles matching sampler exactly
   */
  getStyles() {
    return `
<style>
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    background: #000;
    color: #fff;
    font-family: 'SF Mono', Monaco, 'Cascadia Code', Menlo, monospace;
    font-size: 11px;
    line-height: 1.2;
    padding: 10px;
  }

  .dashboard-container {
    max-width: 1400px;
    margin: 0 auto;
  }

  .sampler-component {
    margin-bottom: 2px;
  }

  .component-border {
    border: none;
    background: transparent;
  }

  .component-header,
  .component-footer {
    color: #666;
    font-size: 11px;
    white-space: pre;
    overflow: hidden;
  }

  .component-body {
    padding: 5px 10px;
    position: relative;
    background: rgba(0,0,0,0.5);
  }

  /* RunChart specific */
  .chart-y-labels {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 40px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    color: #666;
    font-size: 10px;
  }

  .chart-area {
    margin-left: 45px;
    margin-right: 150px;
    height: 100%;
    position: relative;
    border-left: 1px solid #333;
    border-bottom: 1px solid #333;
  }

  .chart-legend {
    position: absolute;
    right: 10px;
    top: 10px;
    display: flex;
    gap: 20px;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 10px;
  }

  .x-labels {
    display: flex;
    justify-content: space-between;
    margin-left: 45px;
    margin-right: 10px;
    color: #666;
    font-size: 10px;
  }

  /* Sparkline specific */
  .sparkline .component-body {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .sparkline-value {
    position: absolute;
    right: 10px;
    top: 10px;
    font-size: 24px;
    font-weight: bold;
  }

  .sparkline-bars {
    height: 60px;
    display: flex;
    align-items: flex-end;
    gap: 1px;
    margin: 10px 0;
  }

  .sparkline-bar {
    flex: 1;
    min-width: 2px;
    background: currentColor;
  }

  .sparkline-labels {
    display: flex;
    justify-content: space-between;
    color: #666;
    font-size: 10px;
  }

  /* BarChart specific */
  .bar-row {
    display: grid;
    grid-template-columns: 150px 1fr 150px;
    gap: 20px;
    margin: 5px 0;
    align-items: center;
  }

  .bar-values {
    text-align: right;
    font-size: 11px;
    font-weight: bold;
  }

  .bar-container {
    height: 20px;
    background: rgba(255,255,255,0.05);
    position: relative;
  }

  .bar-fill {
    height: 100%;
    transition: width 0.3s ease;
  }

  .bar-label {
    font-size: 11px;
  }

  /* Gauge specific */
  .gauge-bar {
    font-family: monospace;
    position: relative;
    white-space: pre;
    overflow: hidden;
  }

  .gauge-value {
    position: absolute;
    right: 10px;
    color: #fff;
    font-weight: bold;
  }

  /* Table specific */
  .data-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 11px;
  }

  .data-table th {
    text-align: left;
    padding: 5px 15px;
    border-bottom: 1px solid #333;
  }

  .data-table td {
    padding: 3px 15px;
    color: #fff;
  }

  /* Grid layout */
  .grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .full-width {
    grid-column: span 2;
  }

  /* BUMBA Header */
  .bumba-header {
    text-align: center;
    margin: 20px 0;
    padding: 10px;
    border: 1px solid ${this.colors.green};
  }

  .bumba-logo {
    color: ${this.colors.green};
    font-size: 10px;
    line-height: 1;
    white-space: pre;
  }

  .bumba-title {
    margin-top: 10px;
    font-size: 14px;
    letter-spacing: 4px;
    color: ${this.colors.yellow};
  }
</style>`;
  }

  /**
   * Generate complete dashboard
   */
  createDashboard() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BUMBA Sampler Components</title>
  ${this.getStyles()}
</head>
<body>
  <div class="dashboard-container">
    
    <!-- BUMBA Header with emojis -->
    <div class="bumba-header">
      <pre class="bumba-logo">
     /\\___/\\     /\\___/\\     /\\___/\\     /\\___/\\     /\\___/\\     
    /  o o  \\   /  o o  \\   / \\   / \\   /  o o  \\   /  o o  \\   
   (    ^    ) (    ^    ) (   x   ) (    ^    ) (    ^    )
    \\   -   /   \\   -   /   \\  -  /   \\   -   /   \\   -   /   
     \\_____/     \\_____/     \\___/     \\_____/     \\_____/</pre>
      <div class="bumba-title">🏁 BUMBA COMPONENT LIBRARY - PURE ASCII 🏁</div>
    </div>

    <!-- Search engine response time -->
    ${this.runChart({
      title: 'Search engine response time',
      series: [
        { label: 'GOOGLE', color: this.colors.yellow },
        { label: 'YAHOO', color: this.colors.orange },
        { label: 'BING', color: this.colors.red }
      ]
    })}

    <!-- Sparklines Grid -->
    <div class="grid-2">
      ${this.sparkline({
        title: 'CPU usage',
        value: '98',
        min: '14',
        max: '100'
      })}
      
      ${this.sparkline({
        title: 'Free memory pages',
        value: '92,232',
        min: '22,127',
        max: '50,311'
      })}
    </div>

    <!-- Network activity -->
    ${this.barChart({
      title: 'Local network activity',
      bars: [
        { label: 'UDP bytes in', value: 30, displayValue: '20,590 / -214' },
        { label: 'UDP bytes out', value: 20, displayValue: '13,835 / -106' },
        { label: 'TCP bytes in', value: 75, displayValue: '105,620 / +1,143' },
        { label: 'TCP bytes out', value: 45, displayValue: '41,881 / -3,446' }
      ]
    })}

    <!-- Progress Gauges -->
    <div class="grid-2">
      ${this.gauge({
        title: 'Year progress',
        value: 43.8,
        displayValue: '43.8% (160)'
      })}
      
      ${this.gauge({
        title: 'Minute progress', 
        value: 95,
        displayValue: '95% (57)'
      })}
    </div>

    <!-- Docker and Weather -->
    <div class="grid-2">
      ${this.textBox({
        title: 'Docker containers stats',
        rows: [
          ['neo4j', '59.22%', '110.6MiB / 1.952GiB', '13'],
          ['config', '0.29%', '38.09MiB / 1.952GiB', '24'],
          ['nginx', '0.00%', '0B / 0B', '0'],
          ['turbine', '55.99%', '160.7MiB / 1.952GiB', '12'],
          ['redis', '0.45%', '84.5MiB / 1.952GiB', '88'],
          ['gateway', '53.72%', '124.9MiB / 1.952GiB', '13']
        ]
      })}
      
      ${this.asciiBox({
        title: 'Local weather'
      })}
    </div>

    <!-- UTC Time -->
    ${this.asciiBox({
      title: 'UTC time',
      content: '09:52:53',
      isTime: true
    })}

    <!-- Status indicators with BUMBA emojis -->
    <div class="sampler-component">
      <div class="component-border">
        <div class="component-header">┌─ System Status ${'─'.repeat(100)}┐</div>
        <div class="component-body">
          <div class="grid-2">
            <div>🟢 API: ONLINE</div>
            <div>🟡 Queue: 127 items</div>
            <div>🟠 Memory: 78%</div>
            <div>🔴 Errors: 3</div>
            <div>🏁 Uptime: 99.9%</div>
            <div>🟢 Health: GOOD</div>
          </div>
        </div>
        <div class="component-footer">└${'─'.repeat(115)}┘</div>
      </div>
    </div>

  </div>

  <script>
    // Generate sparkline bars
    document.querySelectorAll('.sparkline-bars').forEach(container => {
      const color = container.dataset.color;
      for (let i = 0; i < 30; i++) {
        const bar = document.createElement('div');
        bar.className = 'sparkline-bar';
        bar.style.height = (20 + Math.random() * 80) + '%';
        bar.style.background = color;
        container.appendChild(bar);
      }
    });

    // Draw line charts
    document.querySelectorAll('canvas').forEach(canvas => {
      const ctx = canvas.getContext('2d');
      const w = canvas.width;
      const h = canvas.height;
      
      // Grid lines
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;
      
      for (let x = 0; x < w; x += w/10) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      
      // Draw dotted lines for each series
      const colors = ['${this.colors.yellow}', '${this.colors.orange}', '${this.colors.red}'];
      colors.forEach((color, i) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        
        for (let x = 0; x < w; x += 10) {
          const y = h/2 + Math.sin(x/50 + i) * h/3 + (Math.random() - 0.5) * 20;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      });
    });
  </script>
</body>
</html>`;
  }
}

// Export
module.exports = {
  BumbaSamplerComponents,
  getInstance: () => new BumbaSamplerComponents()
};
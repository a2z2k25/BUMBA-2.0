/**
 * BUMBA Component Library
 * Complete set of sampler-master components for reuse
 * ONLY emojis allowed: 🟢🟡🟠🔴🏁
 */

class BumbaComponentLibrary {
  constructor() {
    // BUMBA color scheme (from gradient)
    this.colors = {
      green: '#00FF00',   // 🟢
      yellow: '#FFD700',  // 🟡  
      orange: '#FFA500',  // 🟠
      red: '#FF0000',     // 🔴
      
      // Terminal theme
      bg: '#000000',
      text: '#FFFFFF',
      dimText: '#808080',
      border: '#333333'
    };
  }

  /**
   * Component 1: RunChart (Line Graph with dotted lines)
   * Used for time-series data like response times
   */
  runChart(config = {}) {
    const {
      title = 'Line Chart',
      width = '100%',
      height = '200px',
      series = []
    } = config;

    return `
    <div class="bumba-runchart" style="width: ${width}; height: ${height};">
      <div class="component-box">
        <div class="component-title">${title}</div>
        <div class="component-body">
          <div class="runchart-container">
            <canvas class="runchart-canvas" id="runchart-${Date.now()}"></canvas>
            <div class="runchart-legend">
              ${series.map(s => `
                <span class="legend-item">
                  <span class="legend-dot" style="background: ${s.color}"></span>
                  <span>${s.label}</span>
                </span>
              `).join('')}
            </div>
            <div class="y-axis-labels">
              <span>1.0</span>
              <span>0.8</span>
              <span>0.6</span>
              <span>0.4</span>
              <span>0.2</span>
              <span>0</span>
            </div>
            <div class="x-axis-labels">
              <span>00:00</span>
              <span>00:15</span>
              <span>00:30</span>
              <span>00:45</span>
              <span>01:00</span>
            </div>
          </div>
        </div>
      </div>
    </div>`;
  }

  /**
   * Component 2: Sparkline (Mini bar chart)
   * Used for CPU, memory, activity trends
   */
  sparkline(config = {}) {
    const {
      title = 'Sparkline',
      width = '100%',
      height = '100px',
      color = this.colors.yellow,
      value = '0',
      min = '0',
      max = '100'
    } = config;

    return `
    <div class="bumba-sparkline" style="width: ${width};">
      <div class="component-box">
        <div class="component-title">${title}</div>
        <div class="component-body" style="height: ${height};">
          <div class="sparkline-container">
            <div class="sparkline-value">${value}</div>
            <div class="sparkline-bars" id="sparkline-${Date.now()}"></div>
            <div class="sparkline-range">
              <span class="range-min">${min}</span>
              <span class="range-max">${max}</span>
            </div>
          </div>
        </div>
      </div>
    </div>`;
  }

  /**
   * Component 3: BarChart (Horizontal bars)
   * Used for network activity, task distribution
   */
  barChart(config = {}) {
    const {
      title = 'Bar Chart',
      width = '100%',
      height = '150px',
      bars = []
    } = config;

    return `
    <div class="bumba-barchart" style="width: ${width};">
      <div class="component-box">
        <div class="component-title">${title}</div>
        <div class="component-body" style="height: ${height};">
          <div class="barchart-container">
            ${bars.map(bar => `
              <div class="bar-row">
                <div class="bar-label">${bar.label}</div>
                <div class="bar-track">
                  <div class="bar-fill" style="width: ${bar.value}%; background: ${bar.color};">
                    <span class="bar-value">${bar.displayValue || bar.value}</span>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>`;
  }

  /**
   * Component 4: Gauge (Progress bar)
   * Used for year/day/hour/minute progress
   */
  gauge(config = {}) {
    const {
      title = 'Progress',
      width = '100%',
      value = 50,
      displayValue = null,
      color = this.colors.yellow
    } = config;

    return `
    <div class="bumba-gauge" style="width: ${width};">
      <div class="component-box">
        <div class="component-title">${title}</div>
        <div class="component-body">
          <div class="gauge-container">
            <div class="gauge-track">
              <div class="gauge-fill" style="width: ${value}%; background: ${color};">
                <div class="gauge-text">${displayValue || value + '%'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>`;
  }

  /**
   * Component 5: TextBox (Scrollable text/table)
   * Used for logs, docker stats, data tables
   */
  textBox(config = {}) {
    const {
      title = 'Text Box',
      width = '100%',
      height = '200px',
      content = '',
      monospace = true
    } = config;

    return `
    <div class="bumba-textbox" style="width: ${width};">
      <div class="component-box">
        <div class="component-title">${title}</div>
        <div class="component-body">
          <div class="textbox-content" style="height: ${height}; font-family: ${monospace ? 'monospace' : 'inherit'};">
            ${content}
          </div>
        </div>
      </div>
    </div>`;
  }

  /**
   * Component 6: AsciiBox (Large ASCII text / ASCII Art)
   * Used for time display, large numbers, or ASCII art
   */
  asciiBox(config = {}) {
    const {
      title = 'ASCII Box',
      width = '100%',
      content = '00:00:00',
      color = this.colors.yellow,
      fontSize = '48px',
      isArt = false
    } = config;

    const displayContent = isArt ? `<pre>${content}</pre>` : content;

    return `
    <div class="bumba-asciibox" style="width: ${width};">
      <div class="component-box">
        <div class="component-title">${title}</div>
        <div class="component-body">
          <div class="ascii-content" style="
            text-align: ${isArt ? 'left' : 'center'};
            font-size: ${isArt ? '11px' : fontSize};
            color: ${color};
            font-family: monospace;
            letter-spacing: ${isArt ? 'normal' : '0.1em'};
            padding: ${isArt ? '10px' : '20px'};
            line-height: ${isArt ? '1.2' : '1.5'};
          ">
            ${displayContent}
          </div>
        </div>
      </div>
    </div>`;
  }

  /**
   * Generate ASCII hexagonal pattern (like sampler logo)
   */
  generateHexPattern() {
    return `     /\\___/\\      /\\___/\\      /\\___/\\      /\\___/\\      /\\___/\\     /\\__    /\\____   /\\____
    /  \\ /  \\    /  \\ /  \\    /  \\ /  \\    /  \\ /  \\    /  \\ /  \\   /  \\    /  \\      /  \\    
   |    X    |  |    X    |  |    X    |  |    X    |  |    X    | |    |  |    |    |    |   
    \\  / \\  /    \\  / \\  /    \\  / \\  /    \\  / \\  /    \\  / \\  /   \\  /    \\  /      \\  /    
     \\/___\\/      \\/___\\/      \\/___\\/      \\/___\\/      \\/___\\/     \\/      \\/____    \\/____`;
  }

  /**
   * Component 7: StatusGrid (Key-value pairs)
   * Used for metrics, status indicators
   */
  statusGrid(config = {}) {
    const {
      title = 'Status',
      width = '100%',
      items = []
    } = config;

    return `
    <div class="bumba-status-grid" style="width: ${width};">
      <div class="component-box">
        <div class="component-title">${title}</div>
        <div class="component-body">
          <div class="status-grid">
            ${items.map(item => `
              <div class="status-item">
                <span class="status-indicator">${item.indicator || '🟢'}</span>
                <span class="status-label">${item.label}</span>
                <span class="status-value">${item.value}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>`;
  }

  /**
   * Generate complete dashboard CSS
   */
  getStyles() {
    return `
    <style>
      /* Component Box Base - Terminal Style */
      .component-box {
        border: 1px solid #333;
        border-radius: 0;
        background: #000;
        margin-bottom: 10px;
        box-shadow: inset 0 0 0 1px rgba(255,255,255,0.1);
      }
      
      .component-title {
        padding: 6px 10px;
        border-bottom: 1px solid #333;
        font-size: 11px;
        font-weight: normal;
        color: #0f0;
        text-transform: uppercase;
        letter-spacing: 1px;
        background: rgba(0,255,0,0.05);
      }
      
      .component-body {
        padding: 12px;
        position: relative;
      }
      
      /* RunChart Styles */
      .runchart-container {
        position: relative;
        height: 100%;
        padding: 10px 60px 30px 40px;
      }
      
      .runchart-canvas {
        width: 100%;
        height: 100%;
        border-left: 1px solid ${this.colors.border};
        border-bottom: 1px solid ${this.colors.border};
      }
      
      .runchart-legend {
        position: absolute;
        top: 5px;
        right: 10px;
        display: flex;
        gap: 15px;
        font-size: 10px;
      }
      
      .legend-item {
        display: flex;
        align-items: center;
        gap: 5px;
      }
      
      .legend-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
      }
      
      .y-axis-labels, .x-axis-labels {
        position: absolute;
        font-size: 10px;
        color: ${this.colors.dimText};
      }
      
      .y-axis-labels {
        left: 5px;
        top: 10px;
        bottom: 30px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }
      
      .x-axis-labels {
        bottom: 5px;
        left: 40px;
        right: 60px;
        display: flex;
        justify-content: space-between;
      }
      
      /* Sparkline Styles */
      .sparkline-container {
        position: relative;
        height: 100%;
      }
      
      .sparkline-value {
        position: absolute;
        top: -5px;
        right: 0;
        font-size: 16px;
        font-weight: bold;
        color: ${this.colors.text};
      }
      
      .sparkline-bars {
        display: flex;
        align-items: flex-end;
        height: calc(100% - 20px);
        gap: 1px;
      }
      
      .spark-bar {
        flex: 1;
        min-width: 2px;
        background: ${this.colors.yellow};
      }
      
      .sparkline-range {
        display: flex;
        justify-content: space-between;
        font-size: 10px;
        color: ${this.colors.dimText};
        margin-top: 5px;
      }
      
      /* BarChart Styles */
      .barchart-container {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      
      .bar-row {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      
      .bar-label {
        width: 120px;
        font-size: 11px;
        color: ${this.colors.dimText};
        text-align: right;
      }
      
      .bar-track {
        flex: 1;
        height: 20px;
        background: rgba(255,255,255,0.05);
        position: relative;
      }
      
      .bar-fill {
        height: 100%;
        position: relative;
        display: flex;
        align-items: center;
        padding: 0 8px;
      }
      
      .bar-value {
        font-size: 10px;
        font-weight: bold;
        color: ${this.colors.text};
      }
      
      /* Gauge Styles */
      .gauge-container {
        position: relative;
      }
      
      .gauge-track {
        height: 24px;
        background: rgba(255,255,255,0.1);
        position: relative;
        overflow: hidden;
      }
      
      .gauge-fill {
        height: 100%;
        position: relative;
        transition: width 0.5s ease;
      }
      
      .gauge-text {
        position: absolute;
        right: 8px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 11px;
        font-weight: bold;
        color: ${this.colors.bg};
        mix-blend-mode: difference;
      }
      
      /* TextBox Styles */
      .textbox-content {
        overflow-y: auto;
        font-size: 11px;
        line-height: 1.4;
        color: ${this.colors.text};
      }
      
      .textbox-content table {
        width: 100%;
        border-collapse: collapse;
      }
      
      .textbox-content th {
        text-align: left;
        padding: 4px 8px;
        border-bottom: 1px solid ${this.colors.border};
        color: ${this.colors.yellow};
      }
      
      .textbox-content td {
        padding: 2px 8px;
      }
      
      /* Status Grid Styles */
      .status-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 8px;
      }
      
      .status-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 10px;
        background: rgba(255,255,255,0.05);
        border-radius: 3px;
      }
      
      .status-indicator {
        font-size: 12px;
      }
      
      .status-label {
        flex: 1;
        font-size: 11px;
        color: ${this.colors.dimText};
      }
      
      .status-value {
        font-size: 11px;
        font-weight: bold;
        color: ${this.colors.yellow};
      }
      
      /* Scrollbar */
      ::-webkit-scrollbar {
        width: 6px;
      }
      
      ::-webkit-scrollbar-track {
        background: ${this.colors.bg};
      }
      
      ::-webkit-scrollbar-thumb {
        background: ${this.colors.border};
        border-radius: 3px;
      }
    </style>`;
  }

  /**
   * Generate JavaScript for interactive components
   */
  getScripts() {
    return `
    <script>
      // RunChart drawing function
      function drawRunChart(canvasId, series) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        
        const w = canvas.width;
        const h = canvas.height;
        
        // Draw grid
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.lineWidth = 1;
        
        for (let i = 1; i < 5; i++) {
          ctx.beginPath();
          ctx.moveTo(0, h * i / 5);
          ctx.lineTo(w, h * i / 5);
          ctx.stroke();
          
          ctx.beginPath();
          ctx.moveTo(w * i / 5, 0);
          ctx.lineTo(w * i / 5, h);
          ctx.stroke();
        }
        
        // Draw series
        series.forEach(s => {
          ctx.strokeStyle = s.color;
          ctx.lineWidth = 2;
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          
          s.data.forEach((point, i) => {
            const x = (i / (s.data.length - 1)) * w;
            const y = (1 - point) * h;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          });
          
          ctx.stroke();
        });
      }
      
      // Sparkline generator
      function generateSparkline(containerId, color) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = '';
        for (let i = 0; i < 30; i++) {
          const bar = document.createElement('div');
          bar.className = 'spark-bar';
          bar.style.height = (20 + Math.random() * 80) + '%';
          bar.style.background = color || '${this.colors.yellow}';
          container.appendChild(bar);
        }
      }
      
      // Initialize all components
      document.addEventListener('DOMContentLoaded', function() {
        // Initialize all runcharts
        document.querySelectorAll('.runchart-canvas').forEach(canvas => {
          const id = canvas.id;
          drawRunChart(id, [
            { color: '${this.colors.yellow}', data: Array(20).fill(0).map(() => Math.random()) },
            { color: '${this.colors.orange}', data: Array(20).fill(0).map(() => Math.random()) },
            { color: '${this.colors.red}', data: Array(20).fill(0).map(() => Math.random()) }
          ]);
        });
        
        // Initialize all sparklines
        document.querySelectorAll('.sparkline-bars').forEach(container => {
          generateSparkline(container.id, '${this.colors.green}');
        });
        
        // Auto-refresh sparklines
        setInterval(() => {
          document.querySelectorAll('.sparkline-bars').forEach(container => {
            generateSparkline(container.id, '${this.colors.green}');
          });
        }, 5000);
      });
    </script>`;
  }

  /**
   * Create a complete dashboard with all components
   */
  createDashboard(config = {}) {
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>BUMBA Component Library Demo</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          background: #000;
          color: #0f0;
          padding: 20px;
          line-height: 1.4;
        }
        
        .dashboard-header {
          text-align: center;
          color: #0f0;
          font-size: 14px;
          letter-spacing: 8px;
          margin-bottom: 30px;
          padding: 10px;
          border: 1px solid #0f0;
          background: rgba(0,255,0,0.05);
        }
        
        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
          max-width: 1400px;
          margin: 0 auto;
        }
        
        .full-width {
          grid-column: span 2;
        }
      </style>
      ${this.getStyles()}
    </head>
    <body>
      <div class="dashboard-header">🏁 BUMBA COMPONENT LIBRARY 🏁</div>
      
      <!-- Sampler-style ASCII Logo -->
      <div style="text-align: center; margin: 20px 0;">
        <pre style="color: #0f0; font-size: 10px; line-height: 1;">
     /\\___/\\      /\\___/\\      /\\___/\\      /\\___/\\      /\\___/\\     /\\__    /\\____   /\\____
    /  \\ /  \\    /  \\ /  \\    /  \\ /  \\    /  \\ /  \\    /  \\ /  \\   /  \\    /  \\      /  \\    
   |    X    |  |    X    |  |    X    |  |    X    |  |    X    | |    |  |    |    |    |   
    \\  / \\  /    \\  / \\  /    \\  / \\  /    \\  / \\  /    \\  / \\  /   \\  /    \\  /      \\  /    
     \\/___\\/      \\/___\\/      \\/___\\/      \\/___\\/      \\/___\\/     \\/      \\/____    \\/____
        </pre>
      </div>
      
      <div class="dashboard-grid">
        <!-- RunChart -->
        <div class="full-width">
          ${this.runChart({
            title: 'Search engine response time',
            series: [
              { label: 'GOOGLE', color: this.colors.yellow },
              { label: 'YAHOO', color: this.colors.orange },
              { label: 'BING', color: this.colors.red }
            ]
          })}
        </div>
        
        <!-- Sparklines -->
        <div>
          ${this.sparkline({
            title: 'CPU usage',
            value: '98',
            min: '14',
            max: '100',
            color: this.colors.green
          })}
        </div>
        
        <div>
          ${this.sparkline({
            title: 'Free memory pages',
            value: '92,232',
            min: '22,127',
            max: '50,311',
            color: this.colors.yellow
          })}
        </div>
        
        <!-- Bar Chart -->
        <div class="full-width">
          ${this.barChart({
            title: 'Local network activity',
            bars: [
              { label: 'UDP bytes in', value: 40, color: this.colors.yellow, displayValue: '20,590 / -214' },
              { label: 'UDP bytes out', value: 30, color: this.colors.orange, displayValue: '13,835 / -106' },
              { label: 'TCP bytes in', value: 80, color: this.colors.red, displayValue: '105,620 / +1,143' },
              { label: 'TCP bytes out', value: 50, color: this.colors.green, displayValue: '41,881 / -3,446' }
            ]
          })}
        </div>
        
        <!-- Gauges -->
        <div>
          ${this.gauge({
            title: 'Year progress',
            value: 43.8,
            displayValue: '43.8% (160)',
            color: this.colors.yellow
          })}
        </div>
        
        <div>
          ${this.gauge({
            title: 'Minute progress',
            value: 95,
            displayValue: '95% (57)',
            color: this.colors.green
          })}
        </div>
        
        <!-- TextBox with table -->
        <div>
          ${this.textBox({
            title: 'Docker containers stats',
            content: '<table><thead><tr><th>NAME</th><th>CPU %</th><th>MEM USAGE / LIMIT</th><th>PIDS</th></tr></thead><tbody><tr><td>neo4j</td><td>59.22%</td><td>110.6MiB / 1.952GiB</td><td>13</td></tr><tr><td>config</td><td>0.29%</td><td>38.09MiB / 1.952GiB</td><td>24</td></tr><tr><td>nginx</td><td>0.00%</td><td>0B / 0B</td><td>0</td></tr><tr><td>turbine</td><td>55.99%</td><td>160.7MiB / 1.952GiB</td><td>12</td></tr><tr><td>redis</td><td>0.45%</td><td>84.5MiB / 1.952GiB</td><td>88</td></tr><tr><td>gateway</td><td>53.72%</td><td>124.9MiB / 1.952GiB</td><td>13</td></tr></tbody></table>'
          })}
        </div>
        
        <!-- ASCII Box with Time -->
        <div>
          ${this.asciiBox({
            title: 'UTC time',
            content: '09:52:53',
            fontSize: '36px',
            color: this.colors.yellow
          })}
        </div>
        
        <!-- ASCII Art Example -->
        <div>
          ${this.asciiBox({
            title: 'Local weather',
            content: '    \\\\   /     Sunny\\n     .-.      77.78 °F\\n  ― (   ) ―   ↘ 11 mph\\n     \`-\'      9 mi\\n    /   \\\\     0.0 in',
            color: this.colors.yellow,
            isArt: true
          })}
        </div>
        
        <!-- Status Grid -->
        <div class="full-width">
          ${this.statusGrid({
            title: 'System Status',
            items: [
              { indicator: '🟢', label: 'API', value: 'ONLINE' },
              { indicator: '🟡', label: 'Queue', value: '127 items' },
              { indicator: '🟠', label: 'Memory', value: '78%' },
              { indicator: '🔴', label: 'Errors', value: '3' },
              { indicator: '🏁', label: 'Uptime', value: '99.9%' },
              { indicator: '🟢', label: 'Health', value: 'GOOD' }
            ]
          })}
        </div>
      </div>
      
      ${this.getScripts()}
    </body>
    </html>`;
    
    return html;
  }
}

// Export
module.exports = {
  BumbaComponentLibrary,
  getInstance: () => new BumbaComponentLibrary()
};
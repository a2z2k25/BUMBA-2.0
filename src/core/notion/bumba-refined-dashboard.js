/**
 * BUMBA Refined Dashboard
 * Exact sampler layout with ONLY allowed emojis: 🟢🟡🟠🔴🏁
 */

class BumbaRefinedDashboard {
  constructor() {
    // BUMBA STRICT Color Palette
    this.colors = {
      // From BUMBA gradient
      green: '#00FF00',    // 🟢
      yellow: '#FFD700',   // 🟡 
      orange: '#FFA500',   // 🟠
      red: '#FF0000',      // 🔴
      
      // Terminal colors (sampler style)
      bg: '#000000',
      text: '#FFFFFF', 
      dimText: '#808080',
      border: '#444444',
      borderLight: '#666666'
    };
  }

  generateDashboard(projectName) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BUMBA - ${projectName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'JetBrains Mono', 'Courier New', monospace;
      background: ${this.colors.bg};
      color: ${this.colors.text};
      font-size: 13px;
      line-height: 1.2;
      padding: 20px;
    }
    
    .container {
      max-width: 1400px;
      margin: 0 auto;
    }
    
    /* Header */
    .header {
      text-align: center;
      color: ${this.colors.yellow};
      font-size: 14px;
      letter-spacing: 4px;
      margin-bottom: 20px;
      font-weight: bold;
    }
    
    /* Component Box (Sampler Style) */
    .component {
      border: 1px solid ${this.colors.border};
      border-radius: 4px;
      margin-bottom: 12px;
      position: relative;
      background: rgba(10,10,10,0.8);
    }
    
    .component-title {
      padding: 8px 15px;
      border-bottom: 1px solid ${this.colors.border};
      font-size: 12px;
      font-weight: bold;
      color: ${this.colors.text};
    }
    
    .component-body {
      padding: 15px;
      position: relative;
    }
    
    /* Grid Layout */
    .row {
      display: flex;
      gap: 12px;
      margin-bottom: 12px;
    }
    
    .col-25 { flex: 0 0 25%; }
    .col-33 { flex: 0 0 33.333%; }
    .col-50 { flex: 0 0 50%; }
    .col-66 { flex: 0 0 66.666%; }
    .col-75 { flex: 0 0 75%; }
    .col-100 { flex: 0 0 100%; }
    
    /* RunChart (Line Graph) - Sampler Style */
    .runchart {
      height: 200px;
      position: relative;
    }
    
    .runchart-canvas {
      width: 100%;
      height: 100%;
    }
    
    .runchart-legend {
      position: absolute;
      top: 10px;
      right: 15px;
      display: flex;
      gap: 20px;
      font-size: 11px;
    }
    
    .legend-item {
      display: flex;
      align-items: center;
      gap: 5px;
    }
    
    .legend-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }
    
    .axis-labels {
      position: absolute;
      font-size: 10px;
      color: ${this.colors.dimText};
    }
    
    .y-labels {
      left: -30px;
      top: 0;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    
    .x-labels {
      bottom: -20px;
      left: 0;
      right: 0;
      display: flex;
      justify-content: space-between;
    }
    
    /* Sparkline (Sampler Style) */
    .sparkline {
      height: 80px;
      display: flex;
      align-items: flex-end;
      gap: 1px;
    }
    
    .spark-bar {
      flex: 1;
      min-width: 2px;
    }
    
    .sparkline-labels {
      display: flex;
      justify-content: space-between;
      margin-top: 5px;
      font-size: 10px;
      color: ${this.colors.dimText};
    }
    
    .sparkline-value {
      position: absolute;
      top: -5px;
      right: 0;
      font-size: 14px;
      font-weight: bold;
    }
    
    /* Bar Chart (Sampler Style) */
    .barchart {
      position: relative;
      height: 120px;
    }
    
    .bar-container {
      display: flex;
      align-items: flex-end;
      height: 100%;
      padding-bottom: 25px;
    }
    
    .bar-item {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
    }
    
    .bar-value {
      position: absolute;
      top: -20px;
      font-size: 12px;
      font-weight: bold;
    }
    
    .bar {
      width: 80%;
      position: relative;
    }
    
    .bar-label {
      position: absolute;
      bottom: -20px;
      font-size: 10px;
      color: ${this.colors.dimText};
      white-space: nowrap;
    }
    
    /* Gauge (Sampler Style) */
    .gauge {
      margin: 10px 0;
    }
    
    .gauge-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 5px;
      font-size: 11px;
    }
    
    .gauge-bar-bg {
      height: 20px;
      background: rgba(255,255,255,0.1);
      position: relative;
      overflow: hidden;
    }
    
    .gauge-bar-fill {
      height: 100%;
      position: relative;
    }
    
    .gauge-bar-text {
      position: absolute;
      right: 5px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 10px;
      font-weight: bold;
      color: ${this.colors.bg};
      mix-blend-mode: difference;
    }
    
    /* TextBox (Activity Log) */
    .textbox {
      font-family: monospace;
      font-size: 11px;
      max-height: 200px;
      overflow-y: auto;
    }
    
    .log-line {
      padding: 2px 0;
      white-space: nowrap;
      display: flex;
      gap: 10px;
    }
    
    .log-time {
      color: ${this.colors.dimText};
      width: 80px;
    }
    
    .log-status {
      width: 20px;
      text-align: center;
    }
    
    .log-source {
      color: ${this.colors.yellow};
      width: 100px;
    }
    
    .log-message {
      flex: 1;
    }
    
    /* AsciiBox */
    .asciibox {
      text-align: center;
      padding: 20px;
      font-size: 32px;
      font-weight: bold;
      letter-spacing: 3px;
      color: ${this.colors.yellow};
    }
    
    /* Scrollbar */
    ::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    
    ::-webkit-scrollbar-track {
      background: ${this.colors.bg};
    }
    
    ::-webkit-scrollbar-thumb {
      background: ${this.colors.border};
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      🏁 BUMBA PROJECT DASHBOARD 🏁
    </div>
    
    <!-- Row 1: Charts -->
    <div class="row">
      <!-- RunChart -->
      <div class="col-50">
        <div class="component">
          <div class="component-title">Search engine response time</div>
          <div class="component-body">
            <div class="runchart">
              <canvas id="runchart" class="runchart-canvas"></canvas>
              <div class="runchart-legend">
                <div class="legend-item">
                  <div class="legend-dot" style="background: ${this.colors.yellow}"></div>
                  <span>GOOGLE</span>
                </div>
                <div class="legend-item">
                  <div class="legend-dot" style="background: ${this.colors.orange}"></div>
                  <span>YAHOO</span>
                </div>
                <div class="legend-item">
                  <div class="legend-dot" style="background: ${this.colors.red}"></div>
                  <span>BING</span>
                </div>
              </div>
              <div class="axis-labels y-labels">
                <span>0.44</span>
                <span>0.37</span>
                <span>0.3</span>
                <span>0.23</span>
                <span>0.16</span>
              </div>
              <div class="axis-labels x-labels">
                <span>22:06:58</span>
                <span>22:07:07</span>
                <span>22:07:16</span>
                <span>22:07:25</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Sparklines -->
      <div class="col-50">
        <div class="row">
          <div class="col-50">
            <div class="component">
              <div class="component-title">CPU usage</div>
              <div class="component-body">
                <div style="position: relative;">
                  <div class="sparkline" id="cpu-sparkline"></div>
                  <div class="sparkline-value">98</div>
                  <div class="sparkline-labels">
                    <span>14</span>
                    <span style="text-align: right">100</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="col-50">
            <div class="component">
              <div class="component-title">Free memory pages</div>
              <div class="component-body">
                <div style="position: relative;">
                  <div class="sparkline" id="mem-sparkline"></div>
                  <div class="sparkline-value">92,232</div>
                  <div class="sparkline-labels">
                    <span>22,127</span>
                    <span style="text-align: right">50,311</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Row 2: Bar Chart -->
    <div class="row">
      <div class="col-100">
        <div class="component">
          <div class="component-title">Local network activity</div>
          <div class="component-body">
            <div class="barchart">
              <div class="bar-container">
                <div class="bar-item">
                  <div class="bar-value">20,590 / -214</div>
                  <div class="bar" style="height: 40%; background: ${this.colors.yellow}"></div>
                  <div class="bar-label">UDP bytes in</div>
                </div>
                <div class="bar-item">
                  <div class="bar-value">13,835 / -106</div>
                  <div class="bar" style="height: 30%; background: ${this.colors.orange}"></div>
                  <div class="bar-label">UDP bytes out</div>
                </div>
                <div class="bar-item">
                  <div class="bar-value">105,620 / +1,143</div>
                  <div class="bar" style="height: 80%; background: ${this.colors.red}"></div>
                  <div class="bar-label">TCP bytes in</div>
                </div>
                <div class="bar-item">
                  <div class="bar-value">41,881 / -3,446</div>
                  <div class="bar" style="height: 50%; background: ${this.colors.green}"></div>
                  <div class="bar-label">TCP bytes out</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Row 3: Gauges -->
    <div class="row">
      <div class="col-50">
        <div class="component">
          <div class="component-title">Year progress</div>
          <div class="component-body">
            <div class="gauge">
              <div class="gauge-bar-bg">
                <div class="gauge-bar-fill" style="width: 43.8%; background: ${this.colors.yellow}">
                  <div class="gauge-bar-text">43.8% (160)</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-50">
        <div class="component">
          <div class="component-title">Minute progress</div>
          <div class="component-body">
            <div class="gauge">
              <div class="gauge-bar-bg">
                <div class="gauge-bar-fill" style="width: 95%; background: ${this.colors.green}">
                  <div class="gauge-bar-text">95% (57)</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Row 4: TextBox -->
    <div class="row">
      <div class="col-66">
        <div class="component">
          <div class="component-title">Docker containers stats</div>
          <div class="component-body">
            <div class="textbox" id="activity-log"></div>
          </div>
        </div>
      </div>
      <div class="col-33">
        <div class="component">
          <div class="component-title">Local weather</div>
          <div class="component-body">
            <div class="asciibox">
              <div style="font-size: 16px; color: ${this.colors.yellow}">🟡️ 72°F</div>
              <div style="font-size: 12px; color: ${this.colors.dimText}; margin-top: 10px">Clear skies</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <script>
    // Draw RunChart
    const canvas = document.getElementById('runchart');
    const ctx = canvas.getContext('2d');
    
    function drawRunChart() {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      const w = canvas.width;
      const h = canvas.height;
      
      // Grid
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
      
      // Draw dotted lines (like sampler)
      function drawDottedLine(points, color) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        points.forEach((p, i) => {
          if (i === 0) ctx.moveTo(p[0] * w, p[1] * h);
          else ctx.lineTo(p[0] * w, p[1] * h);
        });
        ctx.stroke();
      }
      
      // Yellow line
      drawDottedLine([
        [0, 0.3], [0.1, 0.35], [0.2, 0.32], [0.3, 0.38], [0.4, 0.35],
        [0.5, 0.33], [0.6, 0.36], [0.7, 0.34], [0.8, 0.37], [0.9, 0.35], [1, 0.33]
      ], '${this.colors.yellow}');
      
      // Orange line
      drawDottedLine([
        [0, 0.5], [0.1, 0.48], [0.2, 0.52], [0.3, 0.49], [0.4, 0.51],
        [0.5, 0.53], [0.6, 0.5], [0.7, 0.52], [0.8, 0.49], [0.9, 0.51], [1, 0.5]
      ], '${this.colors.orange}');
      
      // Red line
      drawDottedLine([
        [0, 0.7], [0.1, 0.68], [0.2, 0.72], [0.3, 0.7], [0.4, 0.73],
        [0.5, 0.71], [0.6, 0.74], [0.7, 0.72], [0.8, 0.7], [0.9, 0.73], [1, 0.71]
      ], '${this.colors.red}');
    }
    
    setTimeout(drawRunChart, 100);
    window.addEventListener('resize', drawRunChart);
    
    // Generate sparklines
    function generateSparkline(id, color) {
      const container = document.getElementById(id);
      container.innerHTML = '';
      for (let i = 0; i < 40; i++) {
        const bar = document.createElement('div');
        bar.className = 'spark-bar';
        bar.style.height = (20 + Math.random() * 80) + '%';
        bar.style.background = color;
        container.appendChild(bar);
      }
    }
    
    generateSparkline('cpu-sparkline', '${this.colors.green}');
    generateSparkline('mem-sparkline', '${this.colors.yellow}');
    
    // Activity log
    function addLogEntry() {
      const log = document.getElementById('activity-log');
      const statuses = ['🟢', '🟡', '🟠', '🔴', '🏁'];
      const sources = ['nginx', 'redis', 'postgres', 'node', 'python'];
      const messages = [
        'Container started',
        'Health check passed',
        'Memory usage: 512MB',
        'CPU: 45%',
        'Request handled'
      ];
      
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const source = sources[Math.floor(Math.random() * sources.length)];
      const message = messages[Math.floor(Math.random() * messages.length)];
      const time = new Date().toTimeString().substr(0, 8);
      
      const entry = document.createElement('div');
      entry.className = 'log-line';
      entry.innerHTML = \`
        <span class="log-time">[\${time}]</span>
        <span class="log-status">\${status}</span>
        <span class="log-source">\${source}</span>
        <span class="log-message">\${message}</span>
      \`;
      
      log.insertBefore(entry, log.firstChild);
      while (log.children.length > 10) {
        log.removeChild(log.lastChild);
      }
    }
    
    // Initial logs
    for (let i = 0; i < 5; i++) addLogEntry();
    setInterval(addLogEntry, 5000);
    
    // Update gauges
    setInterval(() => {
      const fills = document.querySelectorAll('.gauge-bar-fill');
      fills.forEach((fill, i) => {
        const val = 30 + Math.random() * 70;
        fill.style.width = val + '%';
        fill.querySelector('.gauge-bar-text').textContent = 
          Math.floor(val) + '% (' + Math.floor(val * 3.65) + ')';
      });
    }, 10000);
  </script>
</body>
</html>`;
  }
}

module.exports = {
  BumbaRefinedDashboard,
  getInstance: () => new BumbaRefinedDashboard()
};
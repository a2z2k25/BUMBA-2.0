/**
 * BUMBA Final Dashboard
 * Exact sampler layout with proper BUMBA branding
 */

class BumbaFinalDashboard {
  constructor() {
    // BUMBA Brand Colors (from gradient: 🟢🟡🟠🔴🏁)
    this.colors = {
      // Core BUMBA gradient
      green: '#00FF00',    // 🟢 Start
      yellow: '#FFD700',   // 🟡 Progress (BUMBA Gold)
      orange: '#FFA500',   // 🟠 Active
      red: '#FF0000',      // 🔴 Alert
      
      // Terminal theme
      bg: '#000000',       // Pure black background
      border: '#333333',   // Dark grey borders
      text: '#FFFFFF',     // White text
      dimText: '#808080',  // Grey text
      
      // Component specific
      chartLine: '#FFD700', // Gold for primary data
      chartGrid: 'rgba(255,255,255,0.1)' // Subtle grid
    };
    
    // BUMBA Emoji Set (from README gradient)
    this.emojis = {
      flag: '🏁',     // BUMBA completion
      green: '🟢',    // Start/Go
      yellow: '🟡',   // Progress
      orange: '🟠',   // Active
      red: '🔴',      // Alert
      // Agent emojis
      product: '📋',  // Product-Strategist
      design: '🔴',   // Design-Engineer
      backend: '🟢️',  // Backend-Engineer
      check: '🏁'     // Success
    };
  }

  generateDashboard(projectName) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.emojis.flag} BUMBA - ${projectName}</title>
  <style>
    @font-face {
      font-family: 'Monaco';
      src: local('Monaco'), local('Consolas'), local('Courier New');
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Monaco', 'Consolas', monospace;
      background: ${this.colors.bg};
      color: ${this.colors.text};
      font-size: 12px;
      line-height: 1.4;
      padding: 15px;
      min-width: 1200px;
    }
    
    /* Header */
    .header {
      text-align: center;
      padding: 10px 0 20px 0;
      color: ${this.colors.yellow};
      font-size: 14px;
      letter-spacing: 3px;
      font-weight: bold;
    }
    
    /* Layout Grid */
    .dashboard {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      grid-gap: 10px;
      max-width: 1400px;
      margin: 0 auto;
    }
    
    /* Component Box */
    .box {
      border: 1px solid ${this.colors.border};
      background: rgba(0,0,0,0.5);
      position: relative;
      border-radius: 0;
    }
    
    .box-title {
      position: absolute;
      top: -10px;
      left: 15px;
      background: ${this.colors.bg};
      padding: 0 8px;
      color: ${this.colors.text};
      font-size: 11px;
      z-index: 1;
    }
    
    .box-content {
      padding: 20px 15px 15px 15px;
      height: 100%;
      display: flex;
      flex-direction: column;
    }
    
    /* Grid Sizing */
    .col-1 { grid-column: span 1; }
    .col-2 { grid-column: span 2; }
    .col-3 { grid-column: span 3; }
    .col-4 { grid-column: span 4; }
    
    /* RunChart */
    .runchart {
      height: 200px;
      position: relative;
    }
    
    .chart-area {
      position: relative;
      height: 100%;
      padding: 10px 10px 30px 40px;
    }
    
    .chart-canvas {
      width: 100%;
      height: 100%;
      border-left: 1px solid ${this.colors.border};
      border-bottom: 1px solid ${this.colors.border};
    }
    
    .chart-legend {
      position: absolute;
      top: 5px;
      right: 20px;
      display: flex;
      gap: 20px;
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
    
    .y-axis {
      position: absolute;
      left: 5px;
      top: 10px;
      bottom: 30px;
      width: 30px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      font-size: 10px;
      color: ${this.colors.dimText};
      text-align: right;
    }
    
    .x-axis {
      position: absolute;
      bottom: 10px;
      left: 40px;
      right: 10px;
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: ${this.colors.dimText};
    }
    
    /* BarChart */
    .barchart {
      height: 150px;
      display: flex;
      align-items: flex-end;
      justify-content: space-evenly;
      padding: 20px 10px 35px 10px;
    }
    
    .bar-group {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      max-width: 80px;
    }
    
    .bar-val {
      font-size: 12px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    
    .bar {
      width: 100%;
      min-height: 5px;
      position: relative;
    }
    
    .bar-label {
      margin-top: 8px;
      font-size: 10px;
      color: ${this.colors.dimText};
    }
    
    /* Gauge */
    .gauge {
      padding: 8px 0;
    }
    
    .gauge-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 5px;
      font-size: 11px;
    }
    
    .gauge-label {
      display: flex;
      align-items: center;
      gap: 5px;
    }
    
    .gauge-value {
      color: ${this.colors.yellow};
      font-weight: bold;
    }
    
    .gauge-bar {
      height: 18px;
      background: rgba(255,255,255,0.05);
      position: relative;
      overflow: hidden;
    }
    
    .gauge-fill {
      height: 100%;
      position: relative;
    }
    
    /* Sparkline */
    .sparkline {
      height: 100px;
      display: flex;
      align-items: flex-end;
      padding: 10px 10px 20px 10px;
      gap: 2px;
      position: relative;
    }
    
    .spark {
      flex: 1;
      min-width: 3px;
      background: ${this.colors.yellow};
    }
    
    .spark-value {
      position: absolute;
      top: 5px;
      right: 15px;
      font-size: 18px;
      font-weight: bold;
      color: ${this.colors.text};
    }
    
    /* TextBox / Activity Log */
    .textbox {
      font-size: 11px;
      height: 180px;
      overflow-y: auto;
      padding: 5px;
    }
    
    .log-entry {
      display: flex;
      padding: 2px 0;
      gap: 10px;
    }
    
    .log-time {
      color: ${this.colors.dimText};
      width: 70px;
    }
    
    .log-icon {
      width: 20px;
    }
    
    .log-agent {
      color: ${this.colors.yellow};
      width: 80px;
    }
    
    .log-msg {
      flex: 1;
      color: ${this.colors.text};
    }
    
    /* AsciiBox */
    .asciibox {
      padding: 20px;
      text-align: center;
      font-size: 24px;
      font-weight: bold;
      color: ${this.colors.yellow};
      letter-spacing: 2px;
    }
    
    /* Status Pills */
    .status-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      padding: 10px;
    }
    
    .status-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 5px 10px;
      background: rgba(255,255,255,0.05);
      border-radius: 3px;
    }
    
    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: ${this.colors.green};
    }
    
    .status-label {
      font-size: 11px;
      flex: 1;
    }
    
    .status-value {
      font-size: 11px;
      font-weight: bold;
      color: ${this.colors.yellow};
    }
    
    /* Scrollbar */
    ::-webkit-scrollbar {
      width: 8px;
    }
    
    ::-webkit-scrollbar-track {
      background: rgba(255,255,255,0.05);
    }
    
    ::-webkit-scrollbar-thumb {
      background: ${this.colors.border};
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="header">
    ${this.emojis.flag} BUMBA PROJECT DASHBOARD ${this.emojis.flag}
  </div>
  
  <!-- Dashboard Grid -->
  <div class="dashboard">
    
    <!-- Sprint Burndown (2 cols) -->
    <div class="box col-2">
      <div class="box-title">Sprint Burndown</div>
      <div class="box-content">
        <div class="runchart">
          <div class="chart-area">
            <canvas id="burndown" class="chart-canvas"></canvas>
            <div class="chart-legend">
              <div class="legend-item">
                <div class="legend-dot" style="background: ${this.colors.yellow}"></div>
                <span>ACTUAL</span>
              </div>
              <div class="legend-item">
                <div class="legend-dot" style="background: ${this.colors.dimText}"></div>
                <span>IDEAL</span>
              </div>
            </div>
            <div class="y-axis">
              <span>100</span>
              <span>75</span>
              <span>50</span>
              <span>25</span>
              <span>0</span>
            </div>
            <div class="x-axis">
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Agent Performance (1 col) -->
    <div class="box col-1">
      <div class="box-title">Agent Performance</div>
      <div class="box-content">
        <div class="gauge">
          <div class="gauge-header">
            <span class="gauge-label">${this.emojis.product} Product</span>
            <span class="gauge-value">75%</span>
          </div>
          <div class="gauge-bar">
            <div class="gauge-fill" style="width: 75%; background: ${this.colors.yellow}"></div>
          </div>
        </div>
        <div class="gauge">
          <div class="gauge-header">
            <span class="gauge-label">${this.emojis.design} Design</span>
            <span class="gauge-value">60%</span>
          </div>
          <div class="gauge-bar">
            <div class="gauge-fill" style="width: 60%; background: ${this.colors.orange}"></div>
          </div>
        </div>
        <div class="gauge">
          <div class="gauge-header">
            <span class="gauge-label">${this.emojis.backend} Backend</span>
            <span class="gauge-value">85%</span>
          </div>
          <div class="gauge-bar">
            <div class="gauge-fill" style="width: 85%; background: ${this.colors.green}"></div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Project Status (1 col) -->
    <div class="box col-1">
      <div class="box-title">Project Status</div>
      <div class="box-content">
        <div class="status-grid">
          <div class="status-item">
            <div class="status-dot" style="background: ${this.colors.green}"></div>
            <span class="status-label">Status</span>
            <span class="status-value">ACTIVE</span>
          </div>
          <div class="status-item">
            <div class="status-dot" style="background: ${this.colors.yellow}"></div>
            <span class="status-label">Progress</span>
            <span class="status-value">42%</span>
          </div>
          <div class="status-item">
            <div class="status-dot" style="background: ${this.colors.orange}"></div>
            <span class="status-label">Agents</span>
            <span class="status-value">3</span>
          </div>
          <div class="status-item">
            <div class="status-dot" style="background: ${this.colors.green}"></div>
            <span class="status-label">Quality</span>
            <span class="status-value">94</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Task Distribution (2 cols) -->
    <div class="box col-2">
      <div class="box-title">Task Distribution</div>
      <div class="box-content">
        <div class="barchart">
          <div class="bar-group">
            <div class="bar-val">24</div>
            <div class="bar" style="height: 60px; background: ${this.colors.yellow}"></div>
            <div class="bar-label">Planning</div>
          </div>
          <div class="bar-group">
            <div class="bar-val">18</div>
            <div class="bar" style="height: 45px; background: ${this.colors.orange}"></div>
            <div class="bar-label">Design</div>
          </div>
          <div class="bar-group">
            <div class="bar-val">32</div>
            <div class="bar" style="height: 80px; background: ${this.colors.green}"></div>
            <div class="bar-label">Development</div>
          </div>
          <div class="bar-group">
            <div class="bar-val">12</div>
            <div class="bar" style="height: 30px; background: ${this.colors.red}"></div>
            <div class="bar-label">Testing</div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Commit Activity (2 cols) -->
    <div class="box col-2">
      <div class="box-title">Commit Activity</div>
      <div class="box-content">
        <div class="sparkline" id="sparkline">
          <div class="spark-value">127</div>
        </div>
      </div>
    </div>
    
    <!-- Activity Log (4 cols) -->
    <div class="box col-4">
      <div class="box-title">Activity Log</div>
      <div class="box-content">
        <div class="textbox" id="activity-log"></div>
      </div>
    </div>
    
    <!-- Clock AsciiBox (2 cols) -->
    <div class="box col-2">
      <div class="box-title">System Time</div>
      <div class="box-content">
        <div class="asciibox" id="clock">00:00:00</div>
      </div>
    </div>
    
    <!-- Metrics (2 cols) -->
    <div class="box col-2">
      <div class="box-title">Key Metrics</div>
      <div class="box-content">
        <div class="status-grid">
          <div class="status-item">
            <span class="status-label">Velocity</span>
            <span class="status-value">128 pts</span>
          </div>
          <div class="status-item">
            <span class="status-label">Blockers</span>
            <span class="status-value">0</span>
          </div>
          <div class="status-item">
            <span class="status-label">PR Queue</span>
            <span class="status-value">3</span>
          </div>
          <div class="status-item">
            <span class="status-label">Test Pass</span>
            <span class="status-value">98%</span>
          </div>
        </div>
      </div>
    </div>
    
  </div>
  
  <script>
    // Initialize
    console.log('${this.emojis.flag} BUMBA Dashboard Active');
    
    // Burndown Chart
    const canvas = document.getElementById('burndown');
    const ctx = canvas.getContext('2d');
    
    function drawBurndown() {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      
      const w = canvas.width;
      const h = canvas.height;
      
      // Grid lines
      ctx.strokeStyle = '${this.colors.chartGrid}';
      ctx.lineWidth = 0.5;
      
      for (let i = 1; i < 5; i++) {
        // Horizontal
        ctx.beginPath();
        ctx.moveTo(0, h * i / 5);
        ctx.lineTo(w, h * i / 5);
        ctx.stroke();
        
        // Vertical
        ctx.beginPath();
        ctx.moveTo(w * i / 5, 0);
        ctx.lineTo(w * i / 5, h);
        ctx.stroke();
      }
      
      // Ideal line
      ctx.strokeStyle = '${this.colors.dimText}';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(w, h);
      ctx.stroke();
      
      // Actual line
      ctx.strokeStyle = '${this.colors.yellow}';
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(0, h * 0.05);
      
      const points = [
        [0.2, 0.2], [0.4, 0.35], [0.6, 0.5], [0.8, 0.6], [1, 0.65]
      ];
      
      points.forEach(([x, y]) => {
        ctx.lineTo(w * x, h * y);
      });
      ctx.stroke();
    }
    
    window.addEventListener('resize', drawBurndown);
    setTimeout(drawBurndown, 100);
    
    // Sparkline
    function generateSparkline() {
      const container = document.getElementById('sparkline');
      const existing = container.querySelectorAll('.spark');
      
      if (existing.length === 0) {
        for (let i = 0; i < 30; i++) {
          const bar = document.createElement('div');
          bar.className = 'spark';
          container.appendChild(bar);
        }
      }
      
      container.querySelectorAll('.spark').forEach((bar, i) => {
        const height = Math.random() * 100;
        bar.style.height = height + '%';
        
        // Use BUMBA gradient colors
        if (height > 75) bar.style.background = '${this.colors.red}';
        else if (height > 50) bar.style.background = '${this.colors.orange}';
        else if (height > 25) bar.style.background = '${this.colors.yellow}';
        else bar.style.background = '${this.colors.green}';
      });
    }
    
    generateSparkline();
    setInterval(generateSparkline, 5000);
    
    // Activity Log
    function addLog() {
      const log = document.getElementById('activity-log');
      const activities = [
        { icon: '${this.emojis.product}', agent: 'Product', msg: 'Requirements validated' },
        { icon: '${this.emojis.design}', agent: 'Design', msg: 'Mockups completed' },
        { icon: '${this.emojis.backend}', agent: 'Backend', msg: 'API endpoint created' },
        { icon: '${this.emojis.check}', agent: 'System', msg: 'Tests passed' },
        { icon: '${this.emojis.flag}', agent: 'PM', msg: 'Sprint goal reached' }
      ];
      
      const activity = activities[Math.floor(Math.random() * activities.length)];
      const time = new Date().toTimeString().substr(0, 8);
      
      const entry = document.createElement('div');
      entry.className = 'log-entry';
      entry.innerHTML = \`
        <span class="log-time">[\${time}]</span>
        <span class="log-icon">\${activity.icon}</span>
        <span class="log-agent">\${activity.agent}</span>
        <span class="log-msg">\${activity.msg}</span>
      \`;
      
      log.insertBefore(entry, log.firstChild);
      
      while (log.children.length > 8) {
        log.removeChild(log.lastChild);
      }
    }
    
    // Initialize logs
    for (let i = 0; i < 5; i++) addLog();
    setInterval(addLog, 8000);
    
    // Clock
    function updateClock() {
      const time = new Date().toTimeString().substr(0, 8);
      document.getElementById('clock').textContent = time;
    }
    
    updateClock();
    setInterval(updateClock, 1000);
    
    // Animate gauges
    setInterval(() => {
      document.querySelectorAll('.gauge-fill').forEach((gauge, i) => {
        const val = 50 + Math.random() * 50;
        gauge.style.width = val + '%';
        gauge.parentElement.previousElementSibling.querySelector('.gauge-value').textContent = 
          Math.floor(val) + '%';
      });
    }, 10000);
  </script>
</body>
</html>`;
  }
}

module.exports = {
  BumbaFinalDashboard,
  getInstance: () => new BumbaFinalDashboard()
};
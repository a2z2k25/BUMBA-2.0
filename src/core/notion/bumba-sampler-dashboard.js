/**
 * BUMBA Sampler Dashboard
 * Exact recreation of sampler-master terminal UI with BUMBA branding
 * Clean, structured layout matching the original
 */

const { logger } = require('../logging/bumba-logger');

class BumbaSamplerDashboard {
  constructor() {
    // BUMBA LIMITED color palette (from framework docs)
    this.colors = {
      // Primary colors only
      gold: '#FFD700',     // Primary BUMBA brand
      white: '#FFFFFF',    // Text
      grey: '#666666',     // Secondary text
      black: '#000000',    // Background
      
      // Accent colors for data
      blue: '#00B4D8',     // Info
      green: '#00FF00',    // Success
      red: '#FF4444',      // Error
      purple: '#9D4EDD',   // Special
      
      // Terminal specific
      termBg: '#0a0a0a',
      termBorder: '#333333',
      termText: '#E0E0E0'
    };
    
    // LIMITED emoji set (from BUMBA framework)
    this.emojis = {
      flag: '🏁',          // BUMBA primary
      product: '📋',       // Product-Strategist
      design: '🔴',        // Design-Engineer
      backend: '🟢️',       // Backend-Engineer
      check: '🏁',         // Success
      alert: '🟠️'          // Warning
    };
  }

  /**
   * Generate clean sampler-style dashboard
   */
  generateDashboard(projectName) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BUMBA - ${projectName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=SF+Mono&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace;
      background: ${this.colors.termBg};
      color: ${this.colors.termText};
      font-size: 13px;
      line-height: 1.4;
      padding: 20px;
      overflow-x: hidden;
    }
    
    .container {
      max-width: 1400px;
      margin: 0 auto;
    }
    
    /* Header */
    .header {
      text-align: center;
      margin-bottom: 20px;
      font-size: 14px;
      color: ${this.colors.grey};
      letter-spacing: 2px;
    }
    
    .header .logo {
      color: ${this.colors.gold};
      font-weight: bold;
      font-size: 16px;
    }
    
    /* Component Box */
    .component {
      border: 1px solid ${this.colors.termBorder};
      border-radius: 4px;
      margin-bottom: 15px;
      background: rgba(0,0,0,0.3);
      position: relative;
    }
    
    .component-title {
      position: absolute;
      top: -8px;
      left: 20px;
      background: ${this.colors.termBg};
      padding: 0 8px;
      color: ${this.colors.termText};
      font-size: 12px;
      font-weight: bold;
    }
    
    .component-content {
      padding: 20px;
      min-height: 60px;
    }
    
    /* Grid Layout */
    .grid {
      display: grid;
      grid-template-columns: repeat(12, 1fr);
      gap: 15px;
    }
    
    .col-3 { grid-column: span 3; }
    .col-4 { grid-column: span 4; }
    .col-6 { grid-column: span 6; }
    .col-8 { grid-column: span 8; }
    .col-12 { grid-column: span 12; }
    
    /* RunChart (Line Graph) */
    .runchart {
      height: 200px;
      position: relative;
      display: flex;
      flex-direction: column;
    }
    
    .runchart-graph {
      flex: 1;
      position: relative;
      border-left: 1px solid ${this.colors.termBorder};
      border-bottom: 1px solid ${this.colors.termBorder};
      margin: 10px 10px 20px 40px;
    }
    
    .runchart-canvas {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    }
    
    .runchart-legend {
      position: absolute;
      top: 10px;
      right: 20px;
      font-size: 11px;
    }
    
    .legend-item {
      display: inline-block;
      margin-left: 20px;
    }
    
    .legend-dot {
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      margin-right: 5px;
    }
    
    .y-axis {
      position: absolute;
      left: 5px;
      top: 10px;
      font-size: 10px;
      color: ${this.colors.grey};
    }
    
    .y-label {
      position: absolute;
      right: 0;
      width: 30px;
      text-align: right;
    }
    
    .x-axis {
      position: absolute;
      bottom: 5px;
      left: 40px;
      right: 10px;
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: ${this.colors.grey};
    }
    
    /* Sparkline */
    .sparkline {
      height: 100px;
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      padding: 10px;
    }
    
    .spark-bar {
      flex: 1;
      background: ${this.colors.gold};
      margin: 0 1px;
      min-height: 2px;
      opacity: 0.8;
      transition: opacity 0.2s;
    }
    
    .spark-bar:hover {
      opacity: 1;
    }
    
    .spark-value {
      position: absolute;
      top: 5px;
      right: 20px;
      font-size: 20px;
      font-weight: bold;
      color: ${this.colors.white};
    }
    
    /* Bar Chart */
    .barchart {
      height: 120px;
      padding: 20px 20px 40px 20px;
      display: flex;
      align-items: flex-end;
      justify-content: space-around;
    }
    
    .bar-group {
      display: flex;
      flex-direction: column;
      align-items: center;
      flex: 1;
      max-width: 150px;
    }
    
    .bar-value {
      font-size: 14px;
      font-weight: bold;
      margin-bottom: 5px;
      color: ${this.colors.white};
    }
    
    .bar-fill {
      width: 100%;
      background: ${this.colors.gold};
      margin-bottom: 5px;
      border-radius: 2px 2px 0 0;
      min-height: 4px;
    }
    
    .bar-label {
      font-size: 11px;
      color: ${this.colors.grey};
      text-align: center;
      margin-top: 5px;
    }
    
    /* Gauge (Progress Bar) */
    .gauge {
      padding: 15px 20px;
    }
    
    .gauge-track {
      height: 20px;
      background: rgba(255,255,255,0.1);
      border-radius: 2px;
      position: relative;
      overflow: hidden;
    }
    
    .gauge-fill {
      height: 100%;
      background: ${this.colors.gold};
      border-radius: 2px;
      position: relative;
      transition: width 0.5s ease;
    }
    
    .gauge-fill::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(90deg, 
        transparent 0%, 
        rgba(255,255,255,0.1) 50%, 
        transparent 100%);
      animation: shimmer 2s infinite;
    }
    
    @keyframes shimmer {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
    
    .gauge-label {
      display: flex;
      justify-content: space-between;
      margin-bottom: 5px;
      font-size: 11px;
    }
    
    .gauge-value {
      color: ${this.colors.gold};
      font-weight: bold;
    }
    
    /* Text Box (Activity Log) */
    .textbox {
      max-height: 200px;
      overflow-y: auto;
      padding: 10px;
      font-size: 11px;
      font-family: monospace;
    }
    
    .log-entry {
      padding: 4px 0;
      border-bottom: 1px solid rgba(255,255,255,0.05);
      display: flex;
      align-items: center;
    }
    
    .log-time {
      color: ${this.colors.grey};
      width: 80px;
    }
    
    .log-agent {
      width: 150px;
      color: ${this.colors.gold};
    }
    
    .log-message {
      flex: 1;
      color: ${this.colors.termText};
    }
    
    /* Grid lines for charts */
    .grid-lines {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
    }
    
    .grid-h {
      position: absolute;
      left: 0;
      right: 0;
      height: 1px;
      background: rgba(255,255,255,0.05);
    }
    
    .grid-v {
      position: absolute;
      top: 0;
      bottom: 0;
      width: 1px;
      background: rgba(255,255,255,0.05);
    }
    
    /* Responsive */
    @media (max-width: 1200px) {
      .grid { 
        grid-template-columns: repeat(6, 1fr); 
      }
      .col-3, .col-4, .col-6, .col-8 { 
        grid-column: span 6; 
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <span class="logo">${this.emojis.flag} BUMBA</span> PROJECT DASHBOARD
    </div>
    
    <!-- Grid Layout -->
    <div class="grid">
      
      <!-- Sprint Burndown (8 cols) -->
      <div class="col-8">
        <div class="component">
          <div class="component-title">Sprint Burndown</div>
          <div class="component-content">
            <div class="runchart">
              <div class="runchart-graph">
                <canvas id="burndown" class="runchart-canvas"></canvas>
                <div class="y-axis">
                  <div class="y-label" style="top: 0">100</div>
                  <div class="y-label" style="top: 25%">75</div>
                  <div class="y-label" style="top: 50%">50</div>
                  <div class="y-label" style="top: 75%">25</div>
                  <div class="y-label" style="bottom: 0">0</div>
                </div>
                <div class="x-axis">
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                </div>
              </div>
              <div class="runchart-legend">
                <span class="legend-item">
                  <span class="legend-dot" style="background: ${this.colors.gold}"></span>
                  ACTUAL
                </span>
                <span class="legend-item">
                  <span class="legend-dot" style="background: ${this.colors.grey}"></span>
                  IDEAL
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Agent Status (4 cols) -->
      <div class="col-4">
        <div class="component">
          <div class="component-title">Agent Performance</div>
          <div class="component-content">
            <!-- Product Strategist -->
            <div class="gauge">
              <div class="gauge-label">
                <span>${this.emojis.product} Product</span>
                <span class="gauge-value">75%</span>
              </div>
              <div class="gauge-track">
                <div class="gauge-fill" style="width: 75%"></div>
              </div>
            </div>
            <!-- Design Engineer -->
            <div class="gauge">
              <div class="gauge-label">
                <span>${this.emojis.design} Design</span>
                <span class="gauge-value">60%</span>
              </div>
              <div class="gauge-track">
                <div class="gauge-fill" style="width: 60%; background: ${this.colors.blue}"></div>
              </div>
            </div>
            <!-- Backend Engineer -->
            <div class="gauge">
              <div class="gauge-label">
                <span>${this.emojis.backend} Backend</span>
                <span class="gauge-value">85%</span>
              </div>
              <div class="gauge-track">
                <div class="gauge-fill" style="width: 85%; background: ${this.colors.green}"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Task Distribution (6 cols) -->
      <div class="col-6">
        <div class="component">
          <div class="component-title">Task Distribution</div>
          <div class="component-content">
            <div class="barchart">
              <div class="bar-group">
                <div class="bar-value">24</div>
                <div class="bar-fill" style="height: 60px; background: ${this.colors.gold}"></div>
                <div class="bar-label">Planning</div>
              </div>
              <div class="bar-group">
                <div class="bar-value">18</div>
                <div class="bar-fill" style="height: 45px; background: ${this.colors.blue}"></div>
                <div class="bar-label">Design</div>
              </div>
              <div class="bar-group">
                <div class="bar-value">32</div>
                <div class="bar-fill" style="height: 80px; background: ${this.colors.green}"></div>
                <div class="bar-label">Development</div>
              </div>
              <div class="bar-group">
                <div class="bar-value">12</div>
                <div class="bar-fill" style="height: 30px; background: ${this.colors.purple}"></div>
                <div class="bar-label">Testing</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Commit Activity Sparkline (6 cols) -->
      <div class="col-6">
        <div class="component">
          <div class="component-title">Commit Activity</div>
          <div class="component-content">
            <div class="sparkline" id="sparkline">
              <div class="spark-value">127</div>
              <!-- Bars will be generated by JS -->
            </div>
          </div>
        </div>
      </div>
      
      <!-- Activity Log (12 cols) -->
      <div class="col-12">
        <div class="component">
          <div class="component-title">Activity Log</div>
          <div class="component-content">
            <div class="textbox" id="activity-log">
              <!-- Log entries will be added by JS -->
            </div>
          </div>
        </div>
      </div>
      
    </div>
  </div>
  
  <script>
    // Initialize dashboard
    console.log('${this.emojis.flag} BUMBA Dashboard Initialized');
    
    // Draw burndown chart
    const canvas = document.getElementById('burndown');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    function resizeCanvas() {
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      drawBurndown();
    }
    
    function drawBurndown() {
      const w = canvas.width;
      const h = canvas.height;
      
      ctx.clearRect(0, 0, w, h);
      
      // Draw grid lines
      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.lineWidth = 1;
      
      for (let i = 0; i <= 4; i++) {
        ctx.beginPath();
        ctx.moveTo(0, h * i / 4);
        ctx.lineTo(w, h * i / 4);
        ctx.stroke();
      }
      
      // Draw ideal line (dashed)
      ctx.strokeStyle = '${this.colors.grey}';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(w, h);
      ctx.stroke();
      
      // Draw actual line
      ctx.strokeStyle = '${this.colors.gold}';
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(0, h * 0.1);
      
      const points = [
        [0.2, 0.25], [0.4, 0.4], [0.6, 0.55], [0.8, 0.65], [1, 0.7]
      ];
      
      points.forEach(([x, y]) => {
        ctx.lineTo(w * x, h * y);
      });
      ctx.stroke();
    }
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    
    // Generate sparkline
    function generateSparkline() {
      const container = document.getElementById('sparkline');
      const bars = container.querySelectorAll('.spark-bar');
      
      if (bars.length === 0) {
        // Create bars
        for (let i = 0; i < 40; i++) {
          const bar = document.createElement('div');
          bar.className = 'spark-bar';
          container.appendChild(bar);
        }
      }
      
      // Update heights
      container.querySelectorAll('.spark-bar').forEach(bar => {
        const height = Math.random() * 100;
        bar.style.height = height + '%';
        bar.style.background = height > 70 ? '${this.colors.gold}' : 
                               height > 40 ? '${this.colors.blue}' : 
                                            '${this.colors.green}';
      });
    }
    
    generateSparkline();
    setInterval(generateSparkline, 5000);
    
    // Activity log
    const activities = [
      { agent: 'Product', message: 'Requirements validated', icon: '${this.emojis.product}' },
      { agent: 'Design', message: 'Mockups completed', icon: '${this.emojis.design}' },
      { agent: 'Backend', message: 'API endpoint created', icon: '${this.emojis.backend}' },
      { agent: 'System', message: 'Tests passed', icon: '${this.emojis.check}' }
    ];
    
    function addLogEntry() {
      const log = document.getElementById('activity-log');
      const activity = activities[Math.floor(Math.random() * activities.length)];
      const time = new Date().toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
      });
      
      const entry = document.createElement('div');
      entry.className = 'log-entry';
      entry.innerHTML = \`
        <span class="log-time">[\${time}]</span>
        <span class="log-agent">\${activity.icon} \${activity.agent}</span>
        <span class="log-message">\${activity.message}</span>
      \`;
      
      log.insertBefore(entry, log.firstChild);
      
      // Keep only 10 entries
      while (log.children.length > 10) {
        log.removeChild(log.lastChild);
      }
    }
    
    // Initial log entries
    for (let i = 0; i < 5; i++) {
      addLogEntry();
    }
    
    setInterval(addLogEntry, 8000);
    
    // Update gauges
    setInterval(() => {
      document.querySelectorAll('.gauge-fill').forEach((gauge, i) => {
        const value = 50 + Math.random() * 50;
        gauge.style.width = value + '%';
        gauge.parentElement.previousElementSibling.querySelector('.gauge-value').textContent = 
          Math.floor(value) + '%';
      });
    }, 10000);
  </script>
</body>
</html>`;
  }
}

// Export
module.exports = {
  BumbaSamplerDashboard,
  getInstance: () => new BumbaSamplerDashboard()
};
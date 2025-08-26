/**
 * BUMBA Terminal Dashboard Generator
 * Creates sampler-master style terminal dashboards with BUMBA branding
 * Mimics the exact terminal UI aesthetic with box-drawing characters
 */

const { logger } = require('../logging/bumba-logger');

class BumbaTerminalDashboard {
  constructor() {
    // BUMBA color palette inspired by sampler's terminal colors
    this.bumbaColors = {
      // Terminal background
      background: '#0a0e1a',
      
      // BUMBA brand colors mapped to terminal palette
      gold: '#FFD700',        // ColorOlive equivalent
      teal: '#00CED1',        // ColorDeepSkyBlue equivalent  
      coral: '#FF6B6B',       // ColorDeepPink equivalent
      white: '#FFFFFF',       // ColorWhite
      grey: '#808080',        // ColorGrey
      green: '#00FF00',       // ColorGreen
      orange: '#FFA500',      // ColorOrange
      purple: '#9370DB',      // ColorPurple
      
      // Box drawing colors
      border: '#4A5568',
      borderActive: '#FFD700',
      
      // Gradient for charts (BUMBA themed)
      gradient: ['#FFD700', '#F7B731', '#FFA500', '#FF6B6B', '#FF4757', '#FC5C65']
    };
    
    // Box drawing characters (Unicode)
    this.boxChars = {
      horizontal: '─',
      vertical: '│',
      topLeft: '┌',
      topRight: '┐',
      bottomLeft: '└',
      bottomRight: '┘',
      cross: '┼',
      teeDown: '┬',
      teeUp: '┴',
      teeRight: '├',
      teeLeft: '┤',
      
      // Double line variants for headers
      doubleHorizontal: '═',
      doubleVertical: '║',
      doubleTopLeft: '╔',
      doubleTopRight: '╗',
      doubleBottomLeft: '╚',
      doubleBottomRight: '╝'
    };
    
    // Braille characters for graph plotting
    this.braillePatterns = {
      empty: '⠀',
      dots: ['⠁', '⠂', '⠄', '⡀', '⠈', '⠐', '⠠', '⢀'],
      full: '⣿'
    };
  }

  /**
   * Generate terminal-style dashboard HTML
   */
  generateTerminalDashboard(projectName, config = {}) {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🏁 BUMBA Terminal - ${projectName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'JetBrains Mono', 'Courier New', monospace;
      background: ${this.bumbaColors.background};
      color: ${this.bumbaColors.white};
      font-size: 14px;
      line-height: 1.2;
      padding: 10px;
      overflow-x: auto;
      min-width: 1200px;
    }
    
    .terminal-container {
      width: 100%;
      max-width: 1400px;
      margin: 0 auto;
    }
    
    /* Terminal box component */
    .terminal-box {
      margin-bottom: 2px;
      position: relative;
    }
    
    .box-border {
      color: ${this.bumbaColors.border};
      white-space: pre;
      font-size: 14px;
      line-height: 1;
    }
    
    .box-border.active {
      color: ${this.bumbaColors.borderActive};
    }
    
    .box-title {
      position: absolute;
      top: 0;
      left: 3px;
      background: ${this.bumbaColors.background};
      padding: 0 2px;
      color: ${this.bumbaColors.gold};
      font-weight: bold;
    }
    
    .box-content {
      padding: 1px 2px;
      white-space: pre;
      overflow: hidden;
    }
    
    /* Run chart (line graph) */
    .runchart {
      position: relative;
      height: 120px;
    }
    
    .runchart-canvas {
      position: absolute;
      top: 1px;
      left: 1px;
      right: 1px;
      bottom: 1px;
      font-size: 12px;
      line-height: 1;
    }
    
    .runchart-line {
      color: ${this.bumbaColors.gold};
    }
    
    /* Bar chart */
    .barchart {
      display: flex;
      align-items: flex-end;
      height: 80px;
      padding: 0 2px;
    }
    
    .bar {
      flex: 1;
      margin: 0 1px;
      background: ${this.bumbaColors.teal};
      position: relative;
      min-height: 2px;
    }
    
    .bar-label {
      position: absolute;
      bottom: -20px;
      left: 0;
      right: 0;
      text-align: center;
      font-size: 10px;
      color: ${this.bumbaColors.grey};
    }
    
    .bar-value {
      position: absolute;
      top: -18px;
      left: 0;
      right: 0;
      text-align: center;
      font-size: 10px;
      color: ${this.bumbaColors.white};
    }
    
    /* Gauge */
    .gauge {
      text-align: center;
      padding: 5px;
    }
    
    .gauge-bar {
      background: ${this.bumbaColors.background};
      border: 1px solid ${this.bumbaColors.border};
      height: 20px;
      position: relative;
      overflow: hidden;
    }
    
    .gauge-fill {
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      background: linear-gradient(90deg, ${this.bumbaColors.gradient.join(', ')});
      transition: width 0.5s ease;
    }
    
    .gauge-text {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-weight: bold;
      color: ${this.bumbaColors.white};
      text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
    }
    
    /* Sparkline */
    .sparkline {
      height: 40px;
      padding: 2px;
      display: flex;
      align-items: flex-end;
      gap: 1px;
    }
    
    .spark {
      flex: 1;
      background: ${this.bumbaColors.green};
      min-height: 2px;
    }
    
    /* Text box */
    .textbox {
      padding: 2px;
      font-size: 12px;
      color: ${this.bumbaColors.white};
      max-height: 200px;
      overflow-y: auto;
    }
    
    .textbox-row {
      display: flex;
      justify-content: space-between;
      padding: 1px 0;
      border-bottom: 1px solid ${this.bumbaColors.border}20;
    }
    
    .textbox-row:hover {
      background: ${this.bumbaColors.border}20;
    }
    
    /* Status indicators */
    .status-active {
      color: ${this.bumbaColors.green};
    }
    
    .status-idle {
      color: ${this.bumbaColors.orange};
    }
    
    .status-error {
      color: ${this.bumbaColors.coral};
    }
    
    /* Grid layout */
    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(12, 1fr);
      grid-gap: 2px;
    }
    
    .grid-col-4 { grid-column: span 4; }
    .grid-col-6 { grid-column: span 6; }
    .grid-col-8 { grid-column: span 8; }
    .grid-col-12 { grid-column: span 12; }
    
    /* Blinking cursor */
    .cursor {
      animation: blink 1s infinite;
    }
    
    @keyframes blink {
      0%, 50% { opacity: 1; }
      51%, 100% { opacity: 0; }
    }
    
    /* BUMBA emoji header */
    .bumba-header {
      text-align: center;
      margin-bottom: 10px;
      font-size: 24px;
      color: ${this.bumbaColors.gold};
      text-shadow: 0 0 10px ${this.bumbaColors.gold}40;
    }
    
    /* Terminal effects */
    .terminal-glow {
      text-shadow: 0 0 5px currentColor;
    }
    
    .scanline {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: ${this.bumbaColors.gold}20;
      animation: scanline 8s linear infinite;
      pointer-events: none;
    }
    
    @keyframes scanline {
      0% { transform: translateY(0); }
      100% { transform: translateY(100vh); }
    }
  </style>
</head>
<body>
  <div class="scanline"></div>
  <div class="terminal-container">
    
    <div class="bumba-header">
      🏁 BUMBA PROJECT DASHBOARD 🏁
    </div>
    
    <div class="dashboard-grid">
      
      <!-- Project Status Box -->
      <div class="grid-col-12">
        <div class="terminal-box">
          <pre class="box-border">╔${'═'.repeat(140)}╗
║${' '.repeat(140)}║
║${' '.repeat(140)}║
║${' '.repeat(140)}║
╚${'═'.repeat(140)}╝</pre>
          <div class="box-title">[ PROJECT: ${projectName.toUpperCase()} ]</div>
          <div class="box-content" style="position: absolute; top: 20px; left: 10px; right: 10px;">
            <div style="display: flex; justify-content: space-around;">
              <div>STATUS: <span class="status-active">● ACTIVE</span></div>
              <div>AGENTS: <span class="terminal-glow">3 RUNNING</span></div>
              <div>PROGRESS: <span style="color: ${this.bumbaColors.gold}">42%</span></div>
              <div>QUALITY: <span style="color: ${this.bumbaColors.green}">94/100</span></div>
              <div>TIME: <span id="elapsed">00:12:34</span></div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Sprint Burndown Chart -->
      <div class="grid-col-8">
        <div class="terminal-box">
          <pre class="box-border">┌${'─'.repeat(94)}┐
│${' '.repeat(94)}│
│${' '.repeat(94)}│
│${' '.repeat(94)}│
│${' '.repeat(94)}│
│${' '.repeat(94)}│
│${' '.repeat(94)}│
│${' '.repeat(94)}│
│${' '.repeat(94)}│
│${' '.repeat(94)}│
└${'─'.repeat(94)}┘</pre>
          <div class="box-title">[ SPRINT BURNDOWN ]</div>
          <div class="box-content runchart" style="position: absolute; top: 15px; left: 5px; right: 5px;">
            <canvas id="burndownChart" width="600" height="150"></canvas>
          </div>
        </div>
      </div>
      
      <!-- Agent Performance Gauges -->
      <div class="grid-col-4">
        <div class="terminal-box">
          <pre class="box-border">┌${'─'.repeat(44)}┐
│${' '.repeat(44)}│
│${' '.repeat(44)}│
│${' '.repeat(44)}│
│${' '.repeat(44)}│
│${' '.repeat(44)}│
│${' '.repeat(44)}│
│${' '.repeat(44)}│
│${' '.repeat(44)}│
│${' '.repeat(44)}│
└${'─'.repeat(44)}┘</pre>
          <div class="box-title">[ AGENT PERFORMANCE ]</div>
          <div class="box-content" style="position: absolute; top: 20px; left: 5px; right: 5px;">
            <!-- Product Strategist -->
            <div style="margin: 5px 0;">
              <div>📋 PRODUCT-STRATEGIST</div>
              <div class="gauge-bar">
                <div class="gauge-fill" style="width: 75%;"></div>
                <div class="gauge-text">75%</div>
              </div>
            </div>
            <!-- Design Engineer -->
            <div style="margin: 5px 0;">
              <div>🔴 DESIGN-ENGINEER</div>
              <div class="gauge-bar">
                <div class="gauge-fill" style="width: 60%;"></div>
                <div class="gauge-text">60%</div>
              </div>
            </div>
            <!-- Backend Engineer -->
            <div style="margin: 5px 0;">
              <div>🟢️ BACKEND-ENGINEER</div>
              <div class="gauge-bar">
                <div class="gauge-fill" style="width: 85%;"></div>
                <div class="gauge-text">85%</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Task Distribution Bar Chart -->
      <div class="grid-col-6">
        <div class="terminal-box">
          <pre class="box-border">┌${'─'.repeat(70)}┐
│${' '.repeat(70)}│
│${' '.repeat(70)}│
│${' '.repeat(70)}│
│${' '.repeat(70)}│
│${' '.repeat(70)}│
│${' '.repeat(70)}│
└${'─'.repeat(70)}┘</pre>
          <div class="box-title">[ TASK DISTRIBUTION ]</div>
          <div class="box-content" style="position: absolute; top: 20px; left: 5px; right: 5px;">
            <div class="barchart">
              <div class="bar" style="height: 60%; background: ${this.bumbaColors.gold};">
                <div class="bar-value">12</div>
                <div class="bar-label">PLANNING</div>
              </div>
              <div class="bar" style="height: 80%; background: ${this.bumbaColors.teal};">
                <div class="bar-value">16</div>
                <div class="bar-label">DESIGN</div>
              </div>
              <div class="bar" style="height: 70%; background: ${this.bumbaColors.coral};">
                <div class="bar-value">14</div>
                <div class="bar-label">DEVELOP</div>
              </div>
              <div class="bar" style="height: 40%; background: ${this.bumbaColors.green};">
                <div class="bar-value">8</div>
                <div class="bar-label">TESTING</div>
              </div>
              <div class="bar" style="height: 30%; background: ${this.bumbaColors.purple};">
                <div class="bar-value">6</div>
                <div class="bar-label">REVIEW</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Activity Sparkline -->
      <div class="grid-col-6">
        <div class="terminal-box">
          <pre class="box-border">┌${'─'.repeat(70)}┐
│${' '.repeat(70)}│
│${' '.repeat(70)}│
│${' '.repeat(70)}│
│${' '.repeat(70)}│
│${' '.repeat(70)}│
│${' '.repeat(70)}│
└${'─'.repeat(70)}┘</pre>
          <div class="box-title">[ COMMIT ACTIVITY ]</div>
          <div class="box-content" style="position: absolute; top: 25px; left: 5px; right: 5px;">
            <div class="sparkline" id="sparkline">
              <!-- Dynamically generated sparkline bars -->
            </div>
            <div style="text-align: center; margin-top: 10px; color: ${this.bumbaColors.grey};">
              LAST 24 HOURS - 127 COMMITS
            </div>
          </div>
        </div>
      </div>
      
      <!-- Activity Log -->
      <div class="grid-col-12">
        <div class="terminal-box">
          <pre class="box-border">┌${'─'.repeat(140)}┐
│${' '.repeat(140)}│
│${' '.repeat(140)}│
│${' '.repeat(140)}│
│${' '.repeat(140)}│
│${' '.repeat(140)}│
│${' '.repeat(140)}│
│${' '.repeat(140)}│
│${' '.repeat(140)}│
└${'─'.repeat(140)}┘</pre>
          <div class="box-title">[ ACTIVITY LOG ]</div>
          <div class="box-content textbox" style="position: absolute; top: 15px; left: 5px; right: 5px; bottom: 5px;">
            <div id="activityLog">
              <!-- Activity entries will be added here -->
            </div>
          </div>
        </div>
      </div>
      
    </div>
  </div>
  
  <script>
    // Initialize terminal dashboard
    console.log('🏁 BUMBA Terminal Dashboard Initialized');
    
    // Elapsed time counter
    let startTime = Date.now();
    setInterval(() => {
      const elapsed = Date.now() - startTime;
      const hours = Math.floor(elapsed / 3600000);
      const minutes = Math.floor((elapsed % 3600000) / 60000);
      const seconds = Math.floor((elapsed % 60000) / 1000);
      document.getElementById('elapsed').textContent = 
        String(hours).padStart(2, '0') + ':' +
        String(minutes).padStart(2, '0') + ':' +
        String(seconds).padStart(2, '0');
    }, 1000);
    
    // Generate sparkline
    function generateSparkline() {
      const sparkline = document.getElementById('sparkline');
      sparkline.innerHTML = '';
      for (let i = 0; i < 48; i++) {
        const height = Math.random() * 100;
        const spark = document.createElement('div');
        spark.className = 'spark';
        spark.style.height = height + '%';
        spark.style.background = height > 70 ? '${this.bumbaColors.gold}' : 
                                 height > 40 ? '${this.bumbaColors.teal}' : 
                                              '${this.bumbaColors.green}';
        sparkline.appendChild(spark);
      }
    }
    generateSparkline();
    setInterval(generateSparkline, 5000);
    
    // Add activity log entries
    function addActivity() {
      const activities = [
        { agent: 'PRODUCT-STRATEGIST', action: 'Requirements validated', icon: '📋' },
        { agent: 'DESIGN-ENGINEER', action: 'Component designed', icon: '🔴' },
        { agent: 'BACKEND-ENGINEER', action: 'API endpoint created', icon: '🟢️' },
        { agent: 'SYSTEM', action: 'Quality check passed', icon: '🏁' },
        { agent: 'PM-BOT', action: 'Sprint milestone reached', icon: '🟡' }
      ];
      
      const activity = activities[Math.floor(Math.random() * activities.length)];
      const time = new Date().toLocaleTimeString('en-US', { hour12: false });
      
      const log = document.getElementById('activityLog');
      const entry = document.createElement('div');
      entry.className = 'textbox-row';
      entry.innerHTML = \`
        <span>[\${time}]</span>
        <span>\${activity.icon} \${activity.agent}</span>
        <span>\${activity.action}</span>
        <span class="cursor">_</span>
      \`;
      
      log.insertBefore(entry, log.firstChild);
      
      // Keep only last 8 entries
      while (log.children.length > 8) {
        log.removeChild(log.lastChild);
      }
    }
    
    // Initial activities
    for (let i = 0; i < 5; i++) {
      addActivity();
    }
    setInterval(addActivity, 8000);
    
    // Draw burndown chart with canvas (ASCII style)
    const canvas = document.getElementById('burndownChart');
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '${this.bumbaColors.gold}';
    ctx.lineWidth = 2;
    
    // Draw grid
    ctx.strokeStyle = '${this.bumbaColors.border}40';
    for (let i = 0; i < 10; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * 15);
      ctx.lineTo(600, i * 15);
      ctx.stroke();
    }
    
    // Draw burndown line
    ctx.strokeStyle = '${this.bumbaColors.gold}';
    ctx.beginPath();
    ctx.moveTo(0, 10);
    const points = [
      [100, 20], [200, 35], [300, 50], [400, 65], [500, 80], [600, 95]
    ];
    points.forEach(([x, y]) => ctx.lineTo(x, y));
    ctx.stroke();
    
    // Draw ideal line
    ctx.strokeStyle = '${this.bumbaColors.grey}';
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(0, 10);
    ctx.lineTo(600, 140);
    ctx.stroke();
    
    // Update agent performance randomly
    setInterval(() => {
      document.querySelectorAll('.gauge-fill').forEach((gauge, i) => {
        const newValue = 50 + Math.random() * 50;
        gauge.style.width = newValue + '%';
        gauge.nextElementSibling.textContent = Math.floor(newValue) + '%';
      });
    }, 10000);
    
    // Terminal typing effect for title
    const title = '${projectName.toUpperCase()}';
    let titleIndex = 0;
    const titleElement = document.querySelector('.box-title');
    
    function typeTitle() {
      if (titleIndex <= title.length) {
        titleElement.textContent = '[ PROJECT: ' + title.substring(0, titleIndex) + '_'.repeat(Math.max(0, title.length - titleIndex)) + ' ]';
        titleIndex++;
        setTimeout(typeTitle, 100);
      }
    }
    // typeTitle(); // Uncomment for typing effect
  </script>
</body>
</html>
    `;
    
    return html;
  }
}

// Singleton instance
let instance = null;

function getInstance() {
  if (!instance) {
    instance = new BumbaTerminalDashboard();
  }
  return instance;
}

module.exports = {
  BumbaTerminalDashboard,
  getInstance
};
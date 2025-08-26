/**
 * BUMBA Sampler Final - Exact Terminal Replica
 * Strict compliance: 🟢🟡🟠🔴🏁 only
 * BUMBA gradient: Green → Yellow → Orange → Red
 */

class BumbaSamplerFinal {
  constructor() {
    this.colors = {
      green: '#00FF00',
      yellow: '#FFD700', 
      orange: '#FFA500',
      red: '#FF0000'
    };
  }

  createDashboard() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BUMBA Sampler Terminal</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      background: #000;
      color: #fff;
      font-family: 'SF Mono', 'Monaco', 'Cascadia Code', 'Menlo', monospace;
      font-size: 11px;
      line-height: 1.4;
      padding: 15px;
    }

    pre {
      margin: 0;
      padding: 0;
      font-family: inherit;
      line-height: 1.2;
    }

    .terminal-box {
      border: 1px solid #333;
      margin-bottom: 15px;
      background: rgba(0, 0, 0, 0.5);
    }

    .terminal-header {
      padding: 4px 8px;
      color: #888;
      font-size: 10px;
      border-bottom: 1px solid #333;
      display: flex;
      align-items: center;
    }

    .terminal-body {
      padding: 8px;
      position: relative;
    }

    /* Header */
    .header-box {
      text-align: center;
      padding: 20px;
      border: 1px solid ${this.colors.green};
      margin-bottom: 20px;
    }

    .ascii-logo {
      color: ${this.colors.green};
      font-size: 10px;
      line-height: 1;
    }

    .header-title {
      margin-top: 15px;
      color: ${this.colors.yellow};
      font-size: 12px;
      letter-spacing: 6px;
    }

    /* Grid */
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin-bottom: 15px;
    }

    .full-width {
      grid-column: span 2;
    }

    /* Line Chart */
    .chart-container {
      position: relative;
      height: 200px;
    }

    .chart-grid {
      position: absolute;
      left: 50px;
      right: 150px;
      top: 10px;
      bottom: 30px;
      border-left: 1px solid #333;
      border-bottom: 1px solid #333;
    }

    .chart-y-labels {
      position: absolute;
      left: 10px;
      top: 10px;
      bottom: 30px;
      width: 40px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      color: #888;
      font-size: 10px;
      text-align: right;
    }

    .chart-x-labels {
      position: absolute;
      left: 50px;
      right: 150px;
      bottom: 5px;
      display: flex;
      justify-content: space-between;
      color: #888;
      font-size: 10px;
    }

    .chart-legend {
      position: absolute;
      right: 10px;
      top: 10px;
      font-size: 10px;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 5px;
    }

    .legend-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }

    /* Sparkline */
    .sparkline-container {
      height: 80px;
      position: relative;
    }

    .sparkline-value {
      position: absolute;
      right: 10px;
      top: 5px;
      font-size: 28px;
      font-weight: bold;
    }

    .sparkline-bars {
      position: absolute;
      bottom: 20px;
      left: 10px;
      right: 10px;
      height: 40px;
      display: flex;
      align-items: flex-end;
      gap: 1px;
    }

    .sparkline-bar {
      flex: 1;
      min-width: 3px;
      max-width: 8px;
    }

    .sparkline-range {
      position: absolute;
      bottom: 5px;
      left: 10px;
      right: 10px;
      display: flex;
      justify-content: space-between;
      color: #888;
      font-size: 10px;
    }

    /* Bar Chart */
    .bar-row {
      margin: 8px 0;
    }

    .bar-label-value {
      display: flex;
      justify-content: space-between;
      margin-bottom: 2px;
      font-size: 11px;
    }

    .bar-track {
      height: 18px;
      background: rgba(255,255,255,0.05);
      position: relative;
      overflow: hidden;
    }

    .bar-fill {
      height: 100%;
      position: absolute;
      left: 0;
      top: 0;
    }

    .bar-label-below {
      margin-top: 2px;
      font-size: 10px;
      color: #888;
      text-align: center;
    }

    /* Gauge */
    .gauge-container {
      position: relative;
      padding: 5px 0;
    }

    .gauge-bar {
      font-family: monospace;
      white-space: pre;
      overflow: hidden;
      color: ${this.colors.yellow};
    }

    .gauge-label {
      position: absolute;
      right: 10px;
      top: 5px;
      color: #fff;
      font-weight: bold;
    }

    /* Table */
    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
    }

    .data-table th {
      text-align: left;
      padding: 4px 12px;
      color: ${this.colors.yellow};
      border-bottom: 1px solid #333;
      font-weight: normal;
    }

    .data-table td {
      padding: 3px 12px;
      color: #fff;
    }

    /* Weather */
    .weather-ascii {
      color: ${this.colors.yellow};
      font-size: 11px;
      line-height: 1.3;
      padding: 5px;
    }

    /* Time */
    .time-display {
      text-align: center;
      padding: 15px;
      font-size: 42px;
      color: ${this.colors.green};
      font-weight: bold;
      letter-spacing: 0.1em;
    }

    /* Status */
    .status-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      padding: 10px;
    }

    .status-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 11px;
    }
  </style>
</head>
<body>

  <!-- BUMBA Header -->
  <div class="header-box">
    <pre class="ascii-logo">
     /\\___/\\     /\\___/\\     /\\___/\\     /\\___/\\     /\\___/\\
    /  o o  \\   /  o o  \\   / \\   / \\   /  o o  \\   /  o o  \\
   (    ^    ) (    ^    ) (   x   ) (    ^    ) (    ^    )
    \\   -   /   \\   -   /   \\  -  /   \\   -   /   \\   -   /
     \\_____/     \\_____/     \\___/     \\_____/     \\_____/</pre>
    <div class="header-title">🏁 BUMBA COMPONENT LIBRARY - PURE ASCII 🏁</div>
  </div>

  <!-- Search Engine Response Time -->
  <div class="terminal-box full-width">
    <div class="terminal-header">
      ┌─ Search engine response time ${'─'.repeat(100)}┐
    </div>
    <div class="terminal-body">
      <div class="chart-container">
        <div class="chart-y-labels">
          <div>0.44</div>
          <div>0.37</div>
          <div>0.3</div>
          <div>0.23</div>
          <div>0.16</div>
        </div>
        <div class="chart-grid">
          <canvas id="lineChart" width="800" height="170"></canvas>
        </div>
        <div class="chart-x-labels">
          <span>22:06:58</span>
          <span>22:07:15</span>
          <span>22:07:30</span>
          <span>22:07:45</span>
          <span>22:08:00</span>
        </div>
        <div class="chart-legend">
          <div class="legend-item">
            <span class="legend-dot" style="background: ${this.colors.yellow};"></span>
            <span style="color: ${this.colors.yellow};">● GOOGLE</span>
          </div>
          <div class="legend-item">
            <span class="legend-dot" style="background: ${this.colors.orange};"></span>
            <span style="color: ${this.colors.orange};">● YAHOO</span>
          </div>
          <div class="legend-item">
            <span class="legend-dot" style="background: ${this.colors.red};"></span>
            <span style="color: ${this.colors.red};">● BING</span>
          </div>
        </div>
      </div>
    </div>
    <div class="terminal-header" style="border-top: 1px solid #333; border-bottom: none;">
      └${'─'.repeat(115)}┘
    </div>
  </div>

  <!-- Sparklines -->
  <div class="grid-2">
    <div class="terminal-box">
      <div class="terminal-header">┌─ CPU usage ${'─'.repeat(48)}┐</div>
      <div class="terminal-body">
        <div class="sparkline-container">
          <div class="sparkline-value" style="color: ${this.colors.red};">98</div>
          <div class="sparkline-bars" id="cpu-bars"></div>
          <div class="sparkline-range">
            <span>14</span>
            <span>100</span>
          </div>
        </div>
      </div>
      <div class="terminal-header" style="border-top: 1px solid #333; border-bottom: none;">
        └${'─'.repeat(60)}┘
      </div>
    </div>

    <div class="terminal-box">
      <div class="terminal-header">┌─ Free memory pages ${'─'.repeat(40)}┐</div>
      <div class="terminal-body">
        <div class="sparkline-container">
          <div class="sparkline-value" style="color: ${this.colors.orange};">92,232</div>
          <div class="sparkline-bars" id="mem-bars"></div>
          <div class="sparkline-range">
            <span>22,127</span>
            <span>50,311</span>
          </div>
        </div>
      </div>
      <div class="terminal-header" style="border-top: 1px solid #333; border-bottom: none;">
        └${'─'.repeat(60)}┘
      </div>
    </div>
  </div>

  <!-- Network Activity -->
  <div class="terminal-box full-width">
    <div class="terminal-header">┌─ Local network activity ${'─'.repeat(89)}┐</div>
    <div class="terminal-body">
      <div class="bar-row">
        <div class="bar-label-value">
          <span style="color: ${this.colors.yellow};">20,590 / -214</span>
          <span style="color: #888;">UDP bytes in</span>
        </div>
        <div class="bar-track">
          <div class="bar-fill" style="width: 30%; background: ${this.colors.yellow};"></div>
        </div>
      </div>
      <div class="bar-row">
        <div class="bar-label-value">
          <span style="color: ${this.colors.yellow};">13,835 / -106</span>
          <span style="color: #888;">UDP bytes out</span>
        </div>
        <div class="bar-track">
          <div class="bar-fill" style="width: 20%; background: ${this.colors.yellow};"></div>
        </div>
      </div>
      <div class="bar-row">
        <div class="bar-label-value">
          <span style="color: ${this.colors.red};">105,620 / +1,143</span>
          <span style="color: #888;">TCP bytes in</span>
        </div>
        <div class="bar-track">
          <div class="bar-fill" style="width: 75%; background: ${this.colors.red};"></div>
        </div>
      </div>
      <div class="bar-row">
        <div class="bar-label-value">
          <span style="color: ${this.colors.green};">41,881 / -3,446</span>
          <span style="color: #888;">TCP bytes out</span>
        </div>
        <div class="bar-track">
          <div class="bar-fill" style="width: 45%; background: ${this.colors.green};"></div>
        </div>
      </div>
    </div>
    <div class="terminal-header" style="border-top: 1px solid #333; border-bottom: none;">
      └${'─'.repeat(115)}┘
    </div>
  </div>

  <!-- Progress Gauges -->
  <div class="grid-2">
    <div class="terminal-box">
      <div class="terminal-header">┌─ Year progress ${'─'.repeat(44)}┐</div>
      <div class="terminal-body">
        <div class="gauge-container">
          <div class="gauge-bar">${'│'.repeat(44)}${'&nbsp;'.repeat(56)}</div>
          <div class="gauge-label">43.8% (160)</div>
        </div>
      </div>
      <div class="terminal-header" style="border-top: 1px solid #333; border-bottom: none;">
        └${'─'.repeat(60)}┘
      </div>
    </div>

    <div class="terminal-box">
      <div class="terminal-header">┌─ Minute progress ${'─'.repeat(42)}┐</div>
      <div class="terminal-body">
        <div class="gauge-container">
          <div class="gauge-bar" style="color: ${this.colors.green};">${'│'.repeat(95)}${'&nbsp;'.repeat(5)}</div>
          <div class="gauge-label">95% (57)</div>
        </div>
      </div>
      <div class="terminal-header" style="border-top: 1px solid #333; border-bottom: none;">
        └${'─'.repeat(60)}┘
      </div>
    </div>
  </div>

  <!-- Docker & Weather -->
  <div class="grid-2">
    <div class="terminal-box">
      <div class="terminal-header">┌─ Docker containers stats ${'─'.repeat(34)}┐</div>
      <div class="terminal-body">
        <table class="data-table">
          <thead>
            <tr>
              <th>NAME</th>
              <th>CPU %</th>
              <th>MEM USAGE / LIMIT</th>
              <th>PIDS</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>neo4j</td><td>59.22%</td><td>110.6MiB / 1.952GiB</td><td>13</td></tr>
            <tr><td>config</td><td>0.29%</td><td>38.09MiB / 1.952GiB</td><td>24</td></tr>
            <tr><td>nginx</td><td>0.00%</td><td>0B / 0B</td><td>0</td></tr>
            <tr><td>turbine</td><td>55.99%</td><td>160.7MiB / 1.952GiB</td><td>12</td></tr>
            <tr><td>redis</td><td>0.45%</td><td>84.5MiB / 1.952GiB</td><td>88</td></tr>
            <tr><td>gateway</td><td>53.72%</td><td>124.9MiB / 1.952GiB</td><td>13</td></tr>
          </tbody>
        </table>
      </div>
      <div class="terminal-header" style="border-top: 1px solid #333; border-bottom: none;">
        └${'─'.repeat(60)}┘
      </div>
    </div>

    <div class="terminal-box">
      <div class="terminal-header">┌─ Local weather ${'─'.repeat(44)}┐</div>
      <div class="terminal-body">
        <pre class="weather-ascii">
    \\   /     Sunny
     .-.      77.78 °F  
  ― (   ) ―   ↘ 11 mph 
     \`-'      9 mi     
    /   \\     0.0 in</pre>
      </div>
      <div class="terminal-header" style="border-top: 1px solid #333; border-bottom: none;">
        └${'─'.repeat(60)}┘
      </div>
    </div>
  </div>

  <!-- UTC Time -->
  <div class="terminal-box full-width">
    <div class="terminal-header">┌─ UTC time ${'─'.repeat(104)}┐</div>
    <div class="terminal-body">
      <div class="time-display">09:52:53</div>
    </div>
    <div class="terminal-header" style="border-top: 1px solid #333; border-bottom: none;">
      └${'─'.repeat(115)}┘
    </div>
  </div>

  <!-- System Status -->
  <div class="terminal-box full-width">
    <div class="terminal-header">┌─ System Status ${'─'.repeat(99)}┐</div>
    <div class="terminal-body">
      <div class="status-grid">
        <div class="status-item">🟢 API: ONLINE</div>
        <div class="status-item">🟡 Queue: 127 items</div>
        <div class="status-item">🟠 Memory: 78%</div>
        <div class="status-item">🔴 Errors: 3</div>
        <div class="status-item">🏁 Uptime: 99.9%</div>
        <div class="status-item">🟢 Health: GOOD</div>
      </div>
    </div>
    <div class="terminal-header" style="border-top: 1px solid #333; border-bottom: none;">
      └${'─'.repeat(115)}┘
    </div>
  </div>

  <script>
    // Draw line chart with dots
    const canvas = document.getElementById('lineChart');
    const ctx = canvas.getContext('2d');
    
    // Grid lines
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += canvas.width / 10) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += canvas.height / 5) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    
    // Draw dotted lines
    const series = [
      { color: '${this.colors.yellow}', offset: 0 },
      { color: '${this.colors.orange}', offset: 0.3 },
      { color: '${this.colors.red}', offset: 0.6 }
    ];
    
    series.forEach(s => {
      ctx.strokeStyle = s.color;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      
      for (let x = 0; x < canvas.width; x += 5) {
        const y = canvas.height/2 + Math.sin((x + s.offset * 100) / 30) * 60 + 
                  (Math.random() - 0.5) * 20;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    });
    
    // Generate sparkline bars
    function generateBars(containerId, color) {
      const container = document.getElementById(containerId);
      for (let i = 0; i < 30; i++) {
        const bar = document.createElement('div');
        bar.className = 'sparkline-bar';
        bar.style.height = (20 + Math.random() * 80) + '%';
        bar.style.background = color;
        container.appendChild(bar);
      }
    }
    
    generateBars('cpu-bars', '${this.colors.red}');
    generateBars('mem-bars', '${this.colors.orange}');
  </script>

</body>
</html>`;
  }
}

module.exports = {
  BumbaSamplerFinal,
  getInstance: () => new BumbaSamplerFinal()
};
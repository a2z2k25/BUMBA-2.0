/**
 * BUMBA Notion-Embeddable Components
 * Optimized for Notion's embed constraints:
 * - 1500 character HTML limit per widget
 * - Must be responsive
 * - No raw iframes, only HTTPS URLs
 * - ASCII art must be legible
 * Strict compliance: 🟢🟡🟠🔴🏁 only
 */

class BumbaNotionComponents {
  constructor() {
    this.colors = {
      green: '#00FF00',
      yellow: '#FFD700',
      orange: '#FFA500', 
      red: '#FF0000'
    };
  }

  /**
   * Generate ASCII numbers using block characters (like sampler's time display)
   */
  generateASCIINumber(num) {
    const digits = {
      '0': [
        ' ███ ',
        '█   █',
        '█   █',
        '█   █',
        ' ███ '
      ],
      '1': [
        '  █  ',
        ' ██  ',
        '  █  ',
        '  █  ',
        '█████'
      ],
      '2': [
        ' ███ ',
        '█   █',
        '   █ ',
        '  █  ',
        '█████'
      ],
      '3': [
        ' ███ ',
        '█   █',
        '  ██ ',
        '█   █',
        ' ███ '
      ],
      '4': [
        '█   █',
        '█   █',
        '█████',
        '    █',
        '    █'
      ],
      '5': [
        '█████',
        '█    ',
        '████ ',
        '    █',
        '████ '
      ],
      '6': [
        ' ███ ',
        '█    ',
        '████ ',
        '█   █',
        ' ███ '
      ],
      '7': [
        '█████',
        '    █',
        '   █ ',
        '  █  ',
        ' █   '
      ],
      '8': [
        ' ███ ',
        '█   █',
        ' ███ ',
        '█   █',
        ' ███ '
      ],
      '9': [
        ' ███ ',
        '█   █',
        ' ████',
        '    █',
        ' ███ '
      ],
      ':': [
        '     ',
        '  █  ',
        '     ',
        '  █  ',
        '     '
      ],
      '.': [
        '     ',
        '     ',
        '     ',
        '     ',
        '  █  '
      ],
      ' ': [
        '     ',
        '     ',
        '     ',
        '     ',
        '     '
      ],
      'A': [
        ' ███ ',
        '█   █',
        '█████',
        '█   █',
        '█   █'
      ],
      'M': [
        '█   █',
        '██ ██',
        '█ █ █',
        '█   █',
        '█   █'
      ],
      'P': [
        '████ ',
        '█   █',
        '████ ',
        '█    ',
        '█    '
      ]
    };

    const str = String(num);
    const lines = ['', '', '', '', ''];
    
    for (let char of str) {
      const digit = digits[char] || digits[' '];
      for (let i = 0; i < 5; i++) {
        lines[i] += digit[i] + ' ';
      }
    }
    
    return lines.join('\n');
  }

  /**
   * Create a minimal, responsive time display widget for Notion
   * Must be under 1500 characters
   */
  createTimeWidget(time = '12:48:52 AM') {
    const asciiTime = this.generateASCIINumber(time.replace(' AM', '').replace(' PM', ''));
    const ampm = time.includes('PM') ? 'PM' : 'AM';
    
    return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#000;color:#0f0;font-family:monospace;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:10px}
.time{text-align:center;width:100%;max-width:600px}
pre{font-size:clamp(8px,2vw,16px);line-height:1.2;color:#0f0;white-space:pre}
.ampm{font-size:clamp(16px,4vw,32px);margin-top:10px;color:#FFD700}
</style>
</head>
<body>
<div class="time">
<pre>${asciiTime}</pre>
<div class="ampm">${ampm}</div>
</div>
</body>
</html>`;
  }

  /**
   * Create a minimal sparkline widget for Notion
   * Must be under 1500 characters
   */
  createSparklineWidget(title, value, color = '#00FF00') {
    return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{margin:0;padding:0}
body{background:#000;color:#fff;font:11px monospace;padding:10px}
.title{color:#666;font-size:10px;margin-bottom:5px}
.value{color:${color};font-size:24px;font-weight:bold;text-align:right}
.bars{display:flex;height:40px;align-items:flex-end;gap:1px;margin:10px 0}
.bar{flex:1;background:${color};min-width:2px}
</style>
</head>
<body>
<div class="title">┌─ ${title} ─</div>
<div class="value">${value}</div>
<div class="bars" id="bars"></div>
<script>
const b=document.getElementById('bars');
for(let i=0;i<30;i++){
const d=document.createElement('div');
d.className='bar';
d.style.height=(20+Math.random()*80)+'%';
b.appendChild(d);
}
</script>
</body>
</html>`;
  }

  /**
   * Create a minimal progress gauge for Notion
   * Must be under 1500 characters
   */
  createGaugeWidget(title, value, emoji = '🟡') {
    const pipes = '│'.repeat(Math.floor(value));
    const spaces = '·'.repeat(100 - Math.floor(value));
    
    return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{margin:0;padding:0}
body{background:#000;color:#fff;font:11px monospace;padding:10px}
.gauge{border:1px solid #333;padding:8px}
.title{color:#666;font-size:10px;margin-bottom:8px}
.bar{font-size:10px;color:#FFD700;overflow:hidden;white-space:nowrap}
.label{text-align:right;color:#fff;font-weight:bold;margin-top:5px}
</style>
</head>
<body>
<div class="gauge">
<div class="title">┌─ ${title} ─</div>
<div class="bar">${pipes}${spaces}</div>
<div class="label">${emoji} ${value}%</div>
</div>
</body>
</html>`;
  }

  /**
   * Create a status indicator widget for Notion
   * Must be under 1500 characters
   */
  createStatusWidget(items) {
    const itemsHtml = items.map(item => 
      `<div class="item">${item.emoji} ${item.label}: <span style="color:${item.color}">${item.value}</span></div>`
    ).join('');
    
    return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{margin:0;padding:0}
body{background:#000;color:#fff;font:11px monospace;padding:10px}
.status{border:1px solid #333;padding:10px}
.title{color:#666;font-size:10px;margin-bottom:10px}
.item{padding:3px 0;display:flex;align-items:center;gap:5px}
</style>
</head>
<body>
<div class="status">
<div class="title">┌─ System Status ─</div>
${itemsHtml}
<div class="title">└────────────────┘</div>
</div>
</body>
</html>`;
  }

  /**
   * Create a table widget for Notion (Docker stats style)
   * Must be under 1500 characters
   */
  createTableWidget(title, headers, rows) {
    const headerHtml = headers.map(h => `<th>${h}</th>`).join('');
    const rowsHtml = rows.map(row => 
      `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`
    ).join('');
    
    return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{margin:0;padding:0}
body{background:#000;color:#fff;font:11px monospace;padding:10px}
.box{border:1px solid #333;padding:8px}
.title{color:#666;font-size:10px;margin-bottom:8px}
table{width:100%;border-collapse:collapse}
th{text-align:left;padding:4px;color:#FFD700;border-bottom:1px solid #333}
td{padding:3px 4px}
</style>
</head>
<body>
<div class="box">
<div class="title">┌─ ${title} ─</div>
<table>
<thead><tr>${headerHtml}</tr></thead>
<tbody>${rowsHtml}</tbody>
</table>
</div>
</body>
</html>`;
  }

  /**
   * Create master dashboard that demonstrates all components
   * This shows how to use the widgets, but each would be embedded separately in Notion
   */
  createDemoDashboard() {
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>BUMBA Notion Components Demo</title>
<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  background: #000;
  color: #fff;
  font-family: 'SF Mono', Monaco, monospace;
  font-size: 11px;
  padding: 20px;
  line-height: 1.4;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  text-align: center;
  padding: 20px;
  border: 1px solid #00FF00;
  margin-bottom: 30px;
}

.title {
  color: #FFD700;
  font-size: 14px;
  letter-spacing: 4px;
  margin-top: 10px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.widget {
  border: 1px solid #333;
  padding: 15px;
  background: rgba(0,0,0,0.5);
  min-height: 150px;
}

.widget-title {
  color: #666;
  font-size: 10px;
  margin-bottom: 10px;
}

.ascii-time {
  text-align: center;
  padding: 20px;
}

.ascii-time pre {
  color: #00FF00;
  font-size: 14px;
  line-height: 1.2;
}

.notice {
  background: #111;
  border: 1px solid #FFD700;
  padding: 15px;
  margin-top: 30px;
  text-align: center;
}

.notice h3 {
  color: #FFD700;
  margin-bottom: 10px;
}

.notice p {
  color: #999;
  line-height: 1.6;
}

.status-items {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .grid {
    grid-template-columns: 1fr;
  }
  
  .status-items {
    grid-template-columns: 1fr;
  }
}
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <div class="title">🏁 BUMBA NOTION COMPONENTS - DEMO 🏁</div>
  </div>

  <div class="grid">
    <!-- Time Widget -->
    <div class="widget">
      <div class="widget-title">┌─ UTC TIME ─</div>
      <div class="ascii-time">
        <pre>${this.generateASCIINumber('12:48:52')}</pre>
        <div style="color: #FFD700; font-size: 20px; margin-top: 10px;">AM</div>
      </div>
      <div class="widget-title">└─────────────┘</div>
    </div>

    <!-- System Status -->
    <div class="widget">
      <div class="widget-title">┌─ SYSTEM STATUS ─</div>
      <div class="status-items">
        <div class="status-item">🟢 API: ONLINE</div>
        <div class="status-item">🟡 Queue: 127</div>
        <div class="status-item">🟠 Memory: 78%</div>
        <div class="status-item">🔴 Errors: 3</div>
        <div class="status-item">🏁 Uptime: 99.9%</div>
        <div class="status-item">🟢 Health: GOOD</div>
      </div>
      <div class="widget-title">└─────────────────┘</div>
    </div>

    <!-- Progress Gauges -->
    <div class="widget">
      <div class="widget-title">┌─ YEAR PROGRESS ─</div>
      <div style="color: #FFD700; font-family: monospace; margin: 10px 0;">
        ${'│'.repeat(44)}${'·'.repeat(56)}
      </div>
      <div style="text-align: right; font-weight: bold;">43.8% (160)</div>
      <div class="widget-title">└──────────────────┘</div>
    </div>

    <!-- Mini Table -->
    <div class="widget">
      <div class="widget-title">┌─ TOP PROCESSES ─</div>
      <table style="width: 100%; font-size: 10px;">
        <tr style="color: #FFD700;">
          <th>NAME</th>
          <th>CPU%</th>
          <th>MEM</th>
        </tr>
        <tr><td>gateway</td><td>53.7%</td><td>124MB</td></tr>
        <tr><td>mongodb</td><td>32.1%</td><td>87MB</td></tr>
        <tr><td>turbine</td><td>11.2%</td><td>196MB</td></tr>
      </table>
      <div class="widget-title">└─────────────────┘</div>
    </div>
  </div>

  <div class="notice">
    <h3>📌 NOTION EMBEDDING NOTES</h3>
    <p>
      Each widget is designed to be under 1500 characters for Notion's HTML embed limit.<br>
      Components are fully responsive and will adapt to Notion's column widths.<br>
      Use individual widget methods to generate embeddable HTML for each component.<br>
      ASCII numbers are now properly legible using block characters.<br>
      Color scheme strictly follows BUMBA gradient: 🟢 → 🟡 → 🟠 → 🔴
    </p>
  </div>
</div>

<script>
// Demo: Animate some values
setInterval(() => {
  // This is just for demo - in Notion, each widget would be static or self-contained
  const gauges = document.querySelectorAll('.widget');
  // Animation code would go here if needed
}, 5000);
</script>
</body>
</html>`;
  }

  /**
   * Export individual widgets for Notion embedding
   */
  exportForNotion() {
    return {
      time: this.createTimeWidget('09:52:53 AM'),
      cpuSparkline: this.createSparklineWidget('CPU Usage', '98', this.colors.red),
      memSparkline: this.createSparklineWidget('Memory', '92,232', this.colors.orange),
      yearProgress: this.createGaugeWidget('Year Progress', 43.8, '🟡'),
      minuteProgress: this.createGaugeWidget('Minute Progress', 95, '🟢'),
      status: this.createStatusWidget([
        { emoji: '🟢', label: 'API', value: 'ONLINE', color: this.colors.green },
        { emoji: '🟡', label: 'Queue', value: '127', color: this.colors.yellow },
        { emoji: '🟠', label: 'Memory', value: '78%', color: this.colors.orange },
        { emoji: '🔴', label: 'Errors', value: '3', color: this.colors.red }
      ]),
      dockerStats: this.createTableWidget(
        'Docker Stats',
        ['NAME', 'CPU%', 'MEM', 'PIDS'],
        [
          ['gateway', '53.72%', '124.9MB', '13'],
          ['mongodb', '32.14%', '87.2MB', '24'],
          ['turbine', '11.23%', '196.3MB', '33']
        ]
      )
    };
  }
}

// Export
module.exports = {
  BumbaNotionComponents,
  getInstance: () => new BumbaNotionComponents()
};
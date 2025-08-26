/**
 * Sampler Widget Components for Notion
 * Exact replicas of sampler terminal dashboard components
 * Each widget is standalone and embeddable in Notion
 */

class SamplerWidgets {
  
  /**
   * 1. RunChart - Line graph with dotted lines
   * Like: Search engine response time chart
   */
  static runChart() {
    return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#000;color:#fff;font:10px monospace;padding:10px}
.chart{position:relative;height:200px;border:1px solid #333;padding:10px}
.title{position:absolute;top:-8px;left:10px;background:#000;padding:0 5px;color:#888}
canvas{width:100%;height:100%}
.legend{position:absolute;top:10px;right:10px;font-size:10px}
.legend div{margin:2px 0}
.y-axis{position:absolute;left:5px;top:20px;bottom:20px;display:flex;flex-direction:column;justify-content:space-between;color:#888;font-size:9px}
.x-axis{position:absolute;bottom:5px;left:40px;right:10px;display:flex;justify-content:space-between;color:#888;font-size:9px}
</style>
</head>
<body>
<div class="chart">
<div class="title">Search engine response time</div>
<div class="y-axis">
<div>0.643</div>
<div>0.573</div>
<div>0.504</div>
<div>0.436</div>
<div>0.366</div>
<div>0.295</div>
<div>0.225</div>
<div>0.156</div>
</div>
<canvas id="c"></canvas>
<div class="legend">
<div style="color:#FFD700">● GOOGLE</div>
<div style="color:#00FFFF">● YAHOO</div>
<div style="color:#FF1493">● BING</div>
</div>
<div class="x-axis">
<span>20:48:26</span>
<span>20:48:32</span>
<span>20:48:38</span>
<span>20:48:44</span>
<span>20:48:50</span>
</div>
</div>
<script>
const c=document.getElementById('c');
const ctx=c.getContext('2d');
c.width=c.offsetWidth;
c.height=c.offsetHeight;

// Grid
ctx.strokeStyle='#222';
for(let i=0;i<=10;i++){
ctx.beginPath();
ctx.moveTo(i*c.width/10,0);
ctx.lineTo(i*c.width/10,c.height);
ctx.stroke();
ctx.beginPath();
ctx.moveTo(0,i*c.height/10);
ctx.lineTo(c.width,i*c.height/10);
ctx.stroke();
}

// Dotted lines
const colors=['#FFD700','#00FFFF','#FF1493'];
for(let s=0;s<3;s++){
ctx.strokeStyle=colors[s];
ctx.setLineDash([2,2]);
ctx.beginPath();
for(let x=0;x<c.width;x+=2){
const y=c.height/2+Math.sin(x/20+s*2)*50+Math.random()*10;
x===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
}
ctx.stroke();
}
</script>
</body>
</html>`;
  }

  /**
   * 2. Sparkline - Vertical bar chart
   * Like: CPU usage, RAM usage charts
   */
  static sparkline(title = 'CPU usage', color = '#FF00FF') {
    return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#000;color:#fff;font:10px monospace;padding:10px}
.spark{border:1px solid #333;padding:10px;position:relative;height:120px}
.title{position:absolute;top:-8px;left:10px;background:#000;padding:0 5px;color:#888}
.value{position:absolute;top:10px;right:10px;font-size:24px;font-weight:bold;color:${color}}
.bars{position:absolute;bottom:25px;left:10px;right:60px;height:60px;display:flex;align-items:flex-end;gap:1px}
.bar{flex:1;background:${color};min-width:3px}
.range{position:absolute;bottom:10px;left:10px;right:10px;display:flex;justify-content:space-between;color:#888;font-size:9px}
</style>
</head>
<body>
<div class="spark">
<div class="title">${title}</div>
<div class="value">164</div>
<div class="bars" id="bars"></div>
<div class="range"><span>96</span><span>100</span></div>
</div>
<script>
const b=document.getElementById('bars');
for(let i=0;i<40;i++){
const bar=document.createElement('div');
bar.className='bar';
bar.style.height=Math.random()*100+'%';
b.appendChild(bar);
}
</script>
</body>
</html>`;
  }

  /**
   * 3. BarChart - Horizontal bars
   * Like: Local network activity
   */
  static barChart() {
    return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#000;color:#fff;font:10px monospace;padding:10px}
.chart{border:1px solid #333;padding:15px;position:relative}
.title{position:absolute;top:-8px;left:10px;background:#000;padding:0 5px;color:#888}
.bar-row{margin:10px 0}
.bar-label{display:flex;justify-content:space-between;margin-bottom:3px;font-size:10px}
.bar-track{height:15px;background:#111;position:relative;overflow:hidden}
.bar-fill{height:100%;position:absolute;left:0}
.bar-name{text-align:center;margin-top:2px;color:#888;font-size:9px}
</style>
</head>
<body>
<div class="chart">
<div class="title">Local network activity</div>
<div class="bar-row">
<div class="bar-label">
<span style="color:#FFD700">20,590 / -214</span>
<span></span>
</div>
<div class="bar-track">
<div class="bar-fill" style="width:30%;background:#FFD700"></div>
</div>
<div class="bar-name">UDP bytes in</div>
</div>
<div class="bar-row">
<div class="bar-label">
<span style="color:#00FFFF">13,835 / -106</span>
<span></span>
</div>
<div class="bar-track">
<div class="bar-fill" style="width:20%;background:#00FFFF"></div>
</div>
<div class="bar-name">UDP bytes out</div>
</div>
<div class="bar-row">
<div class="bar-label">
<span style="color:#FF1493">105,620 / +1,143</span>
<span></span>
</div>
<div class="bar-track">
<div class="bar-fill" style="width:75%;background:#FF1493"></div>
</div>
<div class="bar-name">TCP bytes in</div>
</div>
<div class="bar-row">
<div class="bar-label">
<span style="color:#7FFF00">41,881 / -3,446</span>
<span></span>
</div>
<div class="bar-track">
<div class="bar-fill" style="width:45%;background:#7FFF00"></div>
</div>
<div class="bar-name">TCP bytes out</div>
</div>
</div>
</body>
</html>`;
  }

  /**
   * 4. Gauge - Progress bar with pipes
   * Like: Year progress, Day progress
   */
  static gauge(title = 'Year progress', value = 43.8, color = '#FFD700') {
    const pipes = '│'.repeat(Math.floor(value));
    const empty = ' '.repeat(100 - Math.floor(value));
    
    return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#000;color:#fff;font:10px monospace;padding:10px}
.gauge{border:1px solid #333;padding:10px;position:relative}
.title{position:absolute;top:-8px;left:10px;background:#000;padding:0 5px;color:#888}
.bar{font:11px monospace;color:${color};white-space:pre;overflow:hidden}
.value{position:absolute;right:10px;top:50%;transform:translateY(-50%);color:#fff;font-weight:bold}
</style>
</head>
<body>
<div class="gauge">
<div class="title">${title}</div>
<div class="bar">${pipes}${empty}</div>
<div class="value">${value}% (${Math.floor(value * 3.65)})</div>
</div>
</body>
</html>`;
  }

  /**
   * 5. TextBox - Data table
   * Like: Docker containers stats
   */
  static textBox() {
    return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#000;color:#fff;font:10px monospace;padding:10px}
.box{border:1px solid #333;padding:10px;position:relative}
.title{position:absolute;top:-8px;left:10px;background:#000;padding:0 5px;color:#888}
table{width:100%;margin-top:5px;border-collapse:collapse}
th{text-align:left;padding:3px 8px;color:#FFD700;border-bottom:1px solid #333;font-weight:normal}
td{padding:2px 8px;color:#fff}
</style>
</head>
<body>
<div class="box">
<div class="title">Docker containers stats</div>
<table>
<thead>
<tr><th>NAME</th><th>CPU %</th><th>MEM USAGE / LIMIT</th><th>PIDS</th></tr>
</thead>
<tbody>
<tr><td>gateway</td><td>0.12%</td><td>275.8MiB / 3.855GiB</td><td>50</td></tr>
<tr><td>mongodb</td><td>0.34%</td><td>36.59MiB / 3.855GiB</td><td>26</td></tr>
<tr><td>rabbitmq</td><td>0.20%</td><td>96.7MiB / 3.855GiB</td><td>93</td></tr>
<tr><td>turbine</td><td>0.11%</td><td>196.3MiB / 3.855GiB</td><td>33</td></tr>
<tr><td>clickhouse</td><td>0.13%</td><td>238.6MiB / 3.855GiB</td><td>32</td></tr>
<tr><td>dispatcher</td><td>0.61%</td><td>215.1MiB / 3.855GiB</td><td>64</td></tr>
<tr><td>monitoring</td><td>0.04%</td><td>29.4MiB / 3.855GiB</td><td>30</td></tr>
</tbody>
</table>
</div>
</body>
</html>`;
  }

  /**
   * 6. AsciiBox - Large ASCII display
   * Like: UTC time, Local weather
   */
  static asciiBox(type = 'time') {
    if (type === 'time') {
      return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#000;color:#fff;font:10px monospace;padding:10px}
.box{border:1px solid #333;padding:20px;position:relative;text-align:center}
.title{position:absolute;top:-8px;left:10px;background:#000;padding:0 5px;color:#888}
.time{font-size:48px;color:#7FFF00;font-family:monospace;letter-spacing:0.1em}
</style>
</head>
<body>
<div class="box">
<div class="title">UTC time</div>
<div class="time">12:48:52 AM</div>
</div>
</body>
</html>`;
    } else {
      return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#000;color:#fff;font:10px monospace;padding:10px}
.box{border:1px solid #333;padding:15px;position:relative}
.title{position:absolute;top:-8px;left:10px;background:#000;padding:0 5px;color:#888}
pre{color:#FFD700;font-size:11px;line-height:1.3;margin:0}
</style>
</head>
<body>
<div class="box">
<div class="title">Local weather</div>
<pre>
    \\   /     Partly cloud
     .-.      62 °F
  ― (   ) ―   ↘ 8 mph
     \`-'      9 mi
    /   \\     0.0 in
</pre>
</div>
</body>
</html>`;
    }
  }

  /**
   * Generate a complete demo page showing all widgets
   */
  static demo() {
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Sampler Widgets for Notion</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#000;color:#fff;font-family:'SF Mono',Monaco,monospace;font-size:11px;padding:20px}
.container{max-width:1400px;margin:0 auto}
.header{text-align:center;padding:20px;margin-bottom:30px}
.logo{color:#7FFF00;font-size:10px;line-height:1;white-space:pre}
.title{color:#FFD700;font-size:14px;letter-spacing:4px;margin-top:15px}
.grid{display:grid;gap:20px;margin-bottom:20px}
.grid-2{grid-template-columns:repeat(auto-fit,minmax(400px,1fr))}
.widget{background:#000;border:1px solid #333;overflow:hidden}
iframe{width:100%;height:200px;border:none}
.info{background:#111;border:1px solid #FFD700;padding:15px;margin-top:30px;text-align:center}
.info h3{color:#FFD700;margin-bottom:10px}
.info p{color:#999;line-height:1.6}
.info code{color:#7FFF00;background:#222;padding:2px 5px;border-radius:3px}
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <pre class="logo">
     ╔═╗┌─┐┌┬┐┌─┐┬  ┌─┐┬─┐
     ╚═╗├─┤│││├─┘│  ├┤ ├┬┘
     ╚═╝┴ ┴┴ ┴┴  ┴─┘└─┘┴└─</pre>
    <div class="title">SAMPLER WIDGETS FOR NOTION</div>
  </div>

  <!-- RunChart -->
  <div class="widget" style="height:250px">
    ${this.runChart()}
  </div>

  <!-- Sparklines -->
  <div class="grid grid-2">
    <div class="widget" style="height:150px">
      ${this.sparkline('CPU usage', '#FF00FF')}
    </div>
    <div class="widget" style="height:150px">
      ${this.sparkline('RAM usage', '#FFD700')}
    </div>
  </div>

  <!-- BarChart -->
  <div class="widget" style="height:220px">
    ${this.barChart()}
  </div>

  <!-- Gauges -->
  <div class="grid grid-2">
    <div class="widget" style="height:80px">
      ${this.gauge('Year progress', 43.8, '#FFD700')}
    </div>
    <div class="widget" style="height:80px">
      ${this.gauge('Day progress', 83.3, '#00FFFF')}
    </div>
  </div>

  <!-- TextBox and Weather -->
  <div class="grid grid-2">
    <div class="widget" style="height:220px">
      ${this.textBox()}
    </div>
    <div class="widget" style="height:150px">
      ${this.asciiBox('weather')}
    </div>
  </div>

  <!-- Time -->
  <div class="widget" style="height:120px">
    ${this.asciiBox('time')}
  </div>

  <div class="info">
    <h3>📌 NOTION EMBEDDING GUIDE</h3>
    <p>
      1. Host each widget HTML on HTTPS (GitHub Pages, Vercel, etc.)<br>
      2. In Notion, type <code>/embed</code><br>
      3. Paste the HTTPS URL of the widget<br>
      4. Widgets are responsive and adapt to column widths<br>
      5. Each widget is standalone and under 1500 chars
    </p>
  </div>
</div>
</body>
</html>`;
  }

  /**
   * Export all widgets as separate files
   */
  static exportAll() {
    return {
      'runchart.html': this.runChart(),
      'sparkline-cpu.html': this.sparkline('CPU usage', '#FF00FF'),
      'sparkline-ram.html': this.sparkline('RAM usage', '#FFD700'),
      'barchart.html': this.barChart(),
      'gauge-year.html': this.gauge('Year progress', 43.8, '#FFD700'),
      'gauge-day.html': this.gauge('Day progress', 83.3, '#00FFFF'),
      'gauge-hour.html': this.gauge('Hour progress', 80.0, '#7FFF00'),
      'gauge-minute.html': this.gauge('Minute progress', 86.7, '#FF1493'),
      'textbox.html': this.textBox(),
      'asciibox-time.html': this.asciiBox('time'),
      'asciibox-weather.html': this.asciiBox('weather'),
      'demo.html': this.demo()
    };
  }
}

module.exports = SamplerWidgets;
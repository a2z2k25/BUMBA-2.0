/**
 * EXACT Sampler Widget Replicas
 * Pixel-perfect recreations of sampler terminal components
 */

class SamplerExact {

  /**
   * Generate ASCII block numbers (for time display)
   */
  static generateBlockNumber(num) {
    const digits = {
      '0': [' ███ ', '█   █', '█   █', '█   █', ' ███ '],
      '1': ['  █  ', ' ██  ', '  █  ', '  █  ', '█████'],
      '2': [' ███ ', '█   █', '   █ ', '  █  ', '█████'],
      '3': [' ███ ', '█   █', '  ██ ', '█   █', ' ███ '],
      '4': ['█   █', '█   █', '█████', '    █', '    █'],
      '5': ['█████', '█    ', '████ ', '    █', '████ '],
      '6': [' ███ ', '█    ', '████ ', '█   █', ' ███ '],
      '7': ['█████', '    █', '   █ ', '  █  ', ' █   '],
      '8': [' ███ ', '█   █', ' ███ ', '█   █', ' ███ '],
      '9': [' ███ ', '█   █', ' ████', '    █', ' ███ '],
      ':': ['     ', '  ██ ', '     ', '  ██ ', '     '],
      ' ': ['     ', '     ', '     ', '     ', '     '],
      'A': [' ███ ', '█   █', '█████', '█   █', '█   █'],
      'M': ['█   █', '██ ██', '█ █ █', '█   █', '█   █'],
      'P': ['████ ', '█   █', '████ ', '█    ', '█    ']
    };

    const lines = ['', '', '', '', ''];
    for (let char of String(num)) {
      const d = digits[char] || digits[' '];
      for (let i = 0; i < 5; i++) {
        lines[i] += d[i] + '  ';
      }
    }
    return lines.join('\n');
  }

  /**
   * 1. RunChart - Exactly like sampler
   */
  static runChart() {
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#000;font:11px monospace;color:#fff;overflow:hidden}
.chart{border:1px solid #333;height:280px;position:relative}
.title{position:absolute;top:-1px;left:15px;background:#000;padding:0 5px;font-size:11px;color:#fff}
.y-labels{position:absolute;left:5px;top:20px;bottom:30px;width:35px;display:flex;flex-direction:column;justify-content:space-between;text-align:right;color:#888;font-size:10px}
.graph{position:absolute;left:45px;right:10px;top:20px;bottom:30px;border-left:1px solid #333;border-bottom:1px solid #333}
.legend{position:absolute;right:20px;top:20px;font-size:10px}
.legend>div{margin:3px 0}
.x-labels{position:absolute;bottom:10px;left:45px;right:10px;display:flex;justify-content:space-between;color:#888;font-size:10px}
canvas{width:100%;height:100%}
</style>
</head>
<body>
<div class="chart">
<div class="title">SEARCH ENGINE RESPONSE TIME (sec)</div>
<div class="y-labels">
<div>0.643</div>
<div>0.573</div>
<div>0.504</div>
<div>0.436</div>
<div>0.366</div>
<div>0.295</div>
<div>0.225</div>
<div>0.156</div>
</div>
<div class="graph"><canvas id="c"></canvas></div>
<div class="legend">
<div style="color:#FFD700">● GOOGLE</div>
<div style="color:#00FFFF">● YAHOO</div>
<div style="color:#FF1493">● BING</div>
</div>
<div class="x-labels">
<span>20:48:26</span>
<span>20:48:29</span>
<span>20:48:32</span>
<span>20:48:36</span>
<span>20:48:38</span>
<span>20:48:41</span>
<span>20:48:44</span>
<span>20:48:47</span>
<span>20:48:50</span>
</div>
</div>
<script>
const c=document.getElementById('c'),ctx=c.getContext('2d');
c.width=c.offsetWidth;c.height=c.offsetHeight;
// Grid lines
ctx.strokeStyle='#222';
for(let x=0;x<c.width;x+=c.width/10){
ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,c.height);ctx.stroke();
}
for(let y=0;y<c.height;y+=c.height/8){
ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(c.width,y);ctx.stroke();
}
// Data lines with dots
const colors=['#FFD700','#00FFFF','#FF1493'];
for(let i=0;i<3;i++){
ctx.strokeStyle=colors[i];
ctx.fillStyle=colors[i];
ctx.lineWidth=1;
ctx.setLineDash([2,3]);
ctx.beginPath();
for(let x=0;x<c.width;x+=3){
const y=c.height/2+Math.sin(x/30+i*2)*c.height/3+Math.random()*10;
if(x===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
if(x%15===0){ctx.fillRect(x-1,y-1,2,2);}
}
ctx.stroke();
}
</script>
</body>
</html>`;
  }

  /**
   * 2. Sparkline with actual bars
   */
  static sparkline(title, color = '#FFD700') {
    return `<!DOCTYPE html>
<html>
<head>
<style>
*{margin:0;padding:0}
body{background:#000;font:11px monospace;color:#fff}
.spark{border:1px solid #333;height:120px;position:relative}
.title{position:absolute;top:-1px;left:15px;background:#000;padding:0 5px;font-size:11px;color:#fff}
.value{position:absolute;right:15px;top:15px;font-size:28px;font-weight:bold;color:#fff}
.bars{position:absolute;bottom:25px;left:15px;right:80px;height:50px;display:flex;align-items:flex-end;gap:2px}
.bar{width:4px;background:${color}}
.range{position:absolute;bottom:8px;left:15px;right:15px;display:flex;justify-content:space-between;color:#888;font-size:10px}
</style>
</head>
<body>
<div class="spark">
<div class="title">${title}</div>
<div class="value">164</div>
<div class="bars" id="b"></div>
<div class="range"><span>96</span><span>100</span></div>
</div>
<script>
const b=document.getElementById('b');
for(let i=0;i<30;i++){
const bar=document.createElement('div');
bar.className='bar';
bar.style.height=(20+Math.random()*80)+'%';
b.appendChild(bar);
}
</script>
</body>
</html>`;
  }

  /**
   * 3. BarChart - Network activity
   */
  static barChart() {
    return `<!DOCTYPE html>
<html>
<head>
<style>
*{margin:0;padding:0}
body{background:#000;font:11px monospace;color:#fff}
.chart{border:1px solid #333;padding:20px;position:relative}
.title{position:absolute;top:-1px;left:15px;background:#000;padding:0 5px;font-size:11px;color:#fff}
.row{margin:15px 0}
.label{font-size:11px;margin-bottom:4px}
.value{color:#FFD700;font-weight:bold}
.bar-bg{height:20px;background:#111;position:relative}
.bar-fill{height:100%;position:absolute;left:0}
.name{text-align:right;margin-top:4px;color:#888;font-size:10px}
</style>
</head>
<body>
<div class="chart">
<div class="title">Local network activity</div>
<div class="row">
<div class="label"><span class="value" style="color:#FFD700">20,590 / -214</span></div>
<div class="bar-bg"><div class="bar-fill" style="width:30%;background:#FFD700"></div></div>
<div class="name">UDP bytes in</div>
</div>
<div class="row">
<div class="label"><span class="value" style="color:#00FFFF">13,835 / -106</span></div>
<div class="bar-bg"><div class="bar-fill" style="width:20%;background:#00FFFF"></div></div>
<div class="name">UDP bytes out</div>
</div>
<div class="row">
<div class="label"><span class="value" style="color:#FF1493">105,620 / +1,143</span></div>
<div class="bar-bg"><div class="bar-fill" style="width:75%;background:#FF1493"></div></div>
<div class="name">TCP bytes in</div>
</div>
<div class="row">
<div class="label"><span class="value" style="color:#7FFF00">41,881 / -3,446</span></div>
<div class="bar-bg"><div class="bar-fill" style="width:45%;background:#7FFF00"></div></div>
<div class="name">TCP bytes out</div>
</div>
</div>
</body>
</html>`;
  }

  /**
   * 4. Gauge - Progress bar
   */
  static gauge(title, percent, label) {
    const filled = Math.floor(percent);
    const bars = '█'.repeat(filled) + '░'.repeat(100 - filled);
    
    return `<!DOCTYPE html>
<html>
<head>
<style>
*{margin:0;padding:0}
body{background:#000;font:11px monospace;color:#fff}
.gauge{border:1px solid #333;padding:15px;position:relative}
.title{position:absolute;top:-1px;left:15px;background:#000;padding:0 5px;font-size:11px;color:#fff}
.bar{font-family:monospace;font-size:10px;letter-spacing:-2px;color:#FFD700}
.label{position:absolute;right:15px;top:50%;transform:translateY(-50%);color:#fff;font-weight:bold}
</style>
</head>
<body>
<div class="gauge">
<div class="title">${title}</div>
<div class="bar">${bars}</div>
<div class="label">${label}</div>
</div>
</body>
</html>`;
  }

  /**
   * 5. TextBox - Docker stats
   */
  static dockerStats() {
    return `<!DOCTYPE html>
<html>
<head>
<style>
*{margin:0;padding:0}
body{background:#000;font:11px monospace;color:#fff}
.box{border:1px solid #333;padding:15px;position:relative}
.title{position:absolute;top:-1px;left:15px;background:#000;padding:0 5px;font-size:11px;color:#fff}
table{width:100%;margin-top:5px}
th{text-align:left;padding:4px 10px;color:#FFD700;font-weight:normal;border-bottom:1px solid #333}
td{padding:3px 10px}
</style>
</head>
<body>
<div class="box">
<div class="title">Docker containers stats</div>
<table>
<tr><th>NAME</th><th>CPU %</th><th>MEM USAGE / LIMIT</th><th>PIDS</th></tr>
<tr><td>gateway</td><td>0.12%</td><td>275.8MiB / 3.855GiB</td><td>50</td></tr>
<tr><td>mongodb</td><td>0.34%</td><td>36.59MiB / 3.855GiB</td><td>26</td></tr>
<tr><td>rabbitmq</td><td>0.20%</td><td>96.7MiB / 3.855GiB</td><td>93</td></tr>
<tr><td>turbine</td><td>0.11%</td><td>196.3MiB / 3.855GiB</td><td>33</td></tr>
<tr><td>clickhouse</td><td>0.13%</td><td>238.6MiB / 3.855GiB</td><td>32</td></tr>
<tr><td>dispatcher</td><td>0.61%</td><td>215.1MiB / 3.855GiB</td><td>64</td></tr>
<tr><td>monitoring</td><td>0.04%</td><td>29.4MiB / 3.855GiB</td><td>30</td></tr>
</table>
</div>
</body>
</html>`;
  }

  /**
   * 6. ASCII Time with block characters
   */
  static asciiTime() {
    const time = '12:48:52 AM';
    const blockTime = this.generateBlockNumber(time.split(' ')[0]);
    
    return `<!DOCTYPE html>
<html>
<head>
<style>
*{margin:0;padding:0}
body{background:#000;font:11px monospace;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh}
.box{border:1px solid #333;padding:30px;position:relative;text-align:center}
.title{position:absolute;top:-1px;left:15px;background:#000;padding:0 5px;font-size:11px;color:#fff}
.time{color:#7FFF00;font-size:14px;line-height:1.2;white-space:pre;font-family:monospace}
.ampm{color:#7FFF00;font-size:24px;margin-top:10px;letter-spacing:0.2em}
</style>
</head>
<body>
<div class="box">
<div class="title">UTC time</div>
<div class="time">${blockTime}</div>
<div class="ampm">AM</div>
</div>
</body>
</html>`;
  }

  /**
   * 7. Weather widget
   */
  static weather() {
    return `<!DOCTYPE html>
<html>
<head>
<style>
*{margin:0;padding:0}
body{background:#000;font:11px monospace;color:#fff}
.box{border:1px solid #333;padding:20px;position:relative}
.title{position:absolute;top:-1px;left:15px;background:#000;padding:0 5px;font-size:11px;color:#fff}
.weather{color:#FFD700;font-size:12px;line-height:1.4;white-space:pre}
</style>
</head>
<body>
<div class="box">
<div class="title">Local weather</div>
<div class="weather">    \\   /     Partly cloud
     .-.      62 °F
  ― (   ) ―   ↘ 8 mph
     \`-'      9 mi
    /   \\     0.0 in</div>
</div>
</body>
</html>`;
  }

  /**
   * Export all widgets
   */
  static exportAll() {
    return {
      'runchart.html': this.runChart(),
      'sparkline-cpu.html': this.sparkline('CPU usage', '#FF00FF'),
      'sparkline-ram.html': this.sparkline('RAM usage', '#FFD700'),
      'barchart.html': this.barChart(),
      'gauge-year.html': this.gauge('Year progress', 43.8, '43.8% (160)'),
      'gauge-day.html': this.gauge('Day progress', 83.3, '83.3% (20)'),
      'gauge-hour.html': this.gauge('Hour progress', 80.0, '80.0% (48)'),
      'gauge-minute.html': this.gauge('Minute progress', 86.7, '86.7% (52)'),
      'docker-stats.html': this.dockerStats(),
      'ascii-time.html': this.asciiTime(),
      'weather.html': this.weather()
    };
  }
}

module.exports = SamplerExact;
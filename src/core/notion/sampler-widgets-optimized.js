/**
 * Optimized Sampler Widgets for Notion
 * Each widget under 1500 chars for Notion embed limit
 */

class SamplerWidgetsOptimized {
  
  /**
   * RunChart - Simplified for size
   */
  static runChart() {
    return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{margin:0;padding:0}body{background:#000;color:#fff;font:10px monospace;padding:10px}.c{height:200px;border:1px solid #333;position:relative}.t{position:absolute;top:-8px;left:10px;background:#000;padding:0 5px;color:#888}canvas{width:100%;height:100%}.l{position:absolute;top:10px;right:10px;font-size:10px}.l div{margin:2px 0}
</style>
</head>
<body>
<div class="c">
<div class="t">Search engine response time</div>
<canvas id="c"></canvas>
<div class="l">
<div style="color:#FFD700">● GOOGLE</div>
<div style="color:#00FFFF">● YAHOO</div>
<div style="color:#FF1493">● BING</div>
</div>
</div>
<script>
const c=document.getElementById('c'),x=c.getContext('2d');c.width=800;c.height=180;
x.strokeStyle='#222';for(let i=0;i<=10;i++){x.beginPath();x.moveTo(i*80,0);x.lineTo(i*80,180);x.stroke();}
const cl=['#FFD700','#00FFFF','#FF1493'];for(let s=0;s<3;s++){x.strokeStyle=cl[s];x.setLineDash([2,2]);x.beginPath();for(let i=0;i<800;i+=3){const y=90+Math.sin(i/30+s*2)*60;i===0?x.moveTo(i,y):x.lineTo(i,y);}x.stroke();}
</script>
</body>
</html>`;
  }

  /**
   * BarChart - Optimized
   */
  static barChart() {
    return `<!DOCTYPE html>
<html>
<head>
<style>
*{margin:0;padding:0}body{background:#000;color:#fff;font:10px monospace;padding:10px}.c{border:1px solid #333;padding:15px;position:relative}.t{position:absolute;top:-8px;left:10px;background:#000;padding:0 5px;color:#888}.r{margin:10px 0}.l{display:flex;justify-content:space-between;margin-bottom:3px;font-size:10px}.b{height:15px;background:#111;position:relative}.f{height:100%;position:absolute}.n{text-align:center;margin-top:2px;color:#888;font-size:9px}
</style>
</head>
<body>
<div class="c">
<div class="t">Local network activity</div>
<div class="r"><div class="l"><span style="color:#FFD700">20,590/-214</span></div><div class="b"><div class="f" style="width:30%;background:#FFD700"></div></div><div class="n">UDP in</div></div>
<div class="r"><div class="l"><span style="color:#00FFFF">13,835/-106</span></div><div class="b"><div class="f" style="width:20%;background:#00FFFF"></div></div><div class="n">UDP out</div></div>
<div class="r"><div class="l"><span style="color:#FF1493">105,620/+1,143</span></div><div class="b"><div class="f" style="width:75%;background:#FF1493"></div></div><div class="n">TCP in</div></div>
<div class="r"><div class="l"><span style="color:#7FFF00">41,881/-3,446</span></div><div class="b"><div class="f" style="width:45%;background:#7FFF00"></div></div><div class="n">TCP out</div></div>
</div>
</body>
</html>`;
  }

  /**
   * Export optimized widgets
   */
  static exportAll() {
    const SamplerWidgets = require('./sampler-widgets');
    
    return {
      'runchart.html': this.runChart(),
      'sparkline-cpu.html': SamplerWidgets.sparkline('CPU usage', '#FF00FF'),
      'sparkline-ram.html': SamplerWidgets.sparkline('RAM usage', '#FFD700'),
      'barchart.html': this.barChart(),
      'gauge-year.html': SamplerWidgets.gauge('Year progress', 43.8, '#FFD700'),
      'gauge-day.html': SamplerWidgets.gauge('Day progress', 83.3, '#00FFFF'),
      'gauge-hour.html': SamplerWidgets.gauge('Hour progress', 80.0, '#7FFF00'),
      'gauge-minute.html': SamplerWidgets.gauge('Minute progress', 86.7, '#FF1493'),
      'textbox.html': SamplerWidgets.textBox(),
      'asciibox-time.html': SamplerWidgets.asciiBox('time'),
      'asciibox-weather.html': SamplerWidgets.asciiBox('weather')
    };
  }
}

module.exports = SamplerWidgetsOptimized;
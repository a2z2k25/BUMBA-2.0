/**
 * Sampler Core Widgets
 * The 7 fundamental widget types with exact sampler styling
 * Optimized for Notion embedding (< 1500 chars each)
 */

class SamplerCore {
  
  /**
   * ASCII number generator for time displays
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
      ' ': ['     ', '     ', '     ', '     ', '     ']
    };

    const lines = ['', '', '', '', ''];
    for (let char of String(num)) {
      const d = digits[char] || digits[' '];
      for (let i = 0; i < 5; i++) {
        lines[i] += d[i] + '  ';
      }
    }
    return lines.join('\\n');
  }

  /**
   * 1. RunChart - Time series line graph
   */
  static runChart(title = 'Chart', series = [], yLabels = [], xLabels = []) {
    return `<!DOCTYPE html>
<html><head><style>
*{margin:0;padding:0}body{background:#000;font:11px monospace;color:#fff}
.c{border:1px solid #333;height:250px;position:relative}
.t{position:absolute;top:-1px;left:15px;background:#000;padding:0 5px}
canvas{width:100%;height:100%}
</style></head><body>
<div class="c"><div class="t">${title}</div><canvas id="c"></canvas></div>
<script>
const c=document.getElementById('c'),x=c.getContext('2d');
c.width=800;c.height=200;
x.strokeStyle='#222';
for(let i=0;i<=10;i++){x.beginPath();x.moveTo(i*80,0);x.lineTo(i*80,200);x.stroke();}
const colors=['#FFD700','#00FFFF','#FF1493'];
for(let s=0;s<3;s++){
x.strokeStyle=colors[s];x.setLineDash([3,3]);x.beginPath();
for(let i=0;i<800;i+=5){
const y=100+Math.sin(i/30+s*2)*80;
i===0?x.moveTo(i,y):x.lineTo(i,y);
}x.stroke();}
</script></body></html>`;
  }

  /**
   * 2. Sparkline - Vertical bars
   */
  static sparkline(title = 'Metric', value = '0', color = '#FFD700') {
    return `<!DOCTYPE html>
<html><head><style>
*{margin:0;padding:0}body{background:#000;font:11px monospace;color:#fff}
.s{border:1px solid #333;height:120px;position:relative;padding:10px}
.t{position:absolute;top:-1px;left:15px;background:#000;padding:0 5px}
.v{position:absolute;right:15px;top:15px;font-size:28px;font-weight:bold}
.b{display:flex;height:50px;align-items:flex-end;gap:2px;margin-top:30px}
.bar{width:4px;background:${color}}
</style></head><body>
<div class="s"><div class="t">${title}</div><div class="v">${value}</div>
<div class="b" id="b"></div></div>
<script>
const b=document.getElementById('b');
for(let i=0;i<30;i++){
const bar=document.createElement('div');
bar.className='bar';
bar.style.height=(20+Math.random()*80)+'%';
b.appendChild(bar);}
</script></body></html>`;
  }

  /**
   * 3. BarChart - Horizontal bars
   */
  static barChart(title = 'Activity', items = []) {
    const bars = items.map(item => 
      `<div style="margin:10px 0">
        <div style="color:${item.color};font-size:11px">${item.value}</div>
        <div style="height:20px;background:#111;position:relative">
          <div style="width:${item.percent}%;height:100%;background:${item.color}"></div>
        </div>
        <div style="color:#888;font-size:10px;text-align:right">${item.label}</div>
      </div>`
    ).join('');
    
    return `<!DOCTYPE html>
<html><head><style>
*{margin:0;padding:0}body{background:#000;font:11px monospace;color:#fff}
.c{border:1px solid #333;padding:15px;position:relative}
.t{position:absolute;top:-1px;left:15px;background:#000;padding:0 5px}
</style></head><body>
<div class="c"><div class="t">${title}</div>${bars}</div>
</body></html>`;
  }

  /**
   * 4. Gauge - Progress bar
   */
  static gauge(title = 'Progress', percent = 50, label = '') {
    const filled = Math.floor(percent);
    const bars = '█'.repeat(filled) + '░'.repeat(100 - filled);
    
    return `<!DOCTYPE html>
<html><head><style>
*{margin:0;padding:0}body{background:#000;font:11px monospace;color:#fff}
.g{border:1px solid #333;padding:15px;position:relative}
.t{position:absolute;top:-1px;left:15px;background:#000;padding:0 5px}
.b{color:#FFD700;font-size:10px;letter-spacing:-2px}
.l{position:absolute;right:15px;top:15px;font-weight:bold}
</style></head><body>
<div class="g"><div class="t">${title}</div>
<div class="b">${bars}</div>
<div class="l">${label || percent + '%'}</div>
</div></body></html>`;
  }

  /**
   * 5. TextBox - Data table
   */
  static textBox(title = 'Data', headers = [], rows = []) {
    const th = headers.map(h => `<th style="color:#FFD700;text-align:left;padding:4px">${h}</th>`).join('');
    const tr = rows.map(row => 
      `<tr>${row.map(cell => `<td style="padding:3px">${cell}</td>`).join('')}</tr>`
    ).join('');
    
    return `<!DOCTYPE html>
<html><head><style>
*{margin:0;padding:0}body{background:#000;font:11px monospace;color:#fff}
.b{border:1px solid #333;padding:10px;position:relative}
.t{position:absolute;top:-1px;left:15px;background:#000;padding:0 5px}
table{width:100%;margin-top:5px}
</style></head><body>
<div class="b"><div class="t">${title}</div>
<table><thead><tr>${th}</tr></thead><tbody>${tr}</tbody></table>
</div></body></html>`;
  }

  /**
   * 6. AsciiBox - Large display
   */
  static asciiBox(title = 'Display', content = '', isTime = false) {
    if (isTime) {
      const blockTime = this.generateBlockNumber(content);
      content = `<pre style="color:#7FFF00;font-size:14px;line-height:1.2">${blockTime}</pre>`;
    } else {
      content = `<div style="color:#FFD700;font-size:${isTime?'48px':'12px'};text-align:center">${content}</div>`;
    }
    
    return `<!DOCTYPE html>
<html><head><style>
*{margin:0;padding:0}body{background:#000;font:11px monospace;color:#fff}
.a{border:1px solid #333;padding:20px;position:relative}
.t{position:absolute;top:-1px;left:15px;background:#000;padding:0 5px}
</style></head><body>
<div class="a"><div class="t">${title}</div>${content}</div>
</body></html>`;
  }

  /**
   * 7. StatusGrid - Key-value grid
   */
  static statusGrid(title = 'Status', items = []) {
    const grid = items.map(item => 
      `<div style="padding:5px">${item.emoji || '•'} ${item.label}: 
       <span style="color:${item.color||'#fff'}">${item.value}</span></div>`
    ).join('');
    
    return `<!DOCTYPE html>
<html><head><style>
*{margin:0;padding:0}body{background:#000;font:11px monospace;color:#fff}
.s{border:1px solid #333;padding:10px;position:relative}
.t{position:absolute;top:-1px;left:15px;background:#000;padding:0 5px}
.g{display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-top:5px}
</style></head><body>
<div class="s"><div class="t">${title}</div><div class="g">${grid}</div></div>
</body></html>`;
  }
}

module.exports = SamplerCore;
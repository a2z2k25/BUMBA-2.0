/**
 * BUMBA Component Library - Pure ASCII Version
 * Matches sampler-master's exact terminal ASCII rendering
 * ONLY emojis allowed: 🟢🟡🟠🔴🏁
 */

class BumbaComponentLibraryASCII {
  constructor() {
    // BUMBA color scheme
    this.colors = {
      green: '#00FF00',
      yellow: '#FFD700',  
      orange: '#FFA500',
      red: '#FF0000',
      cyan: '#00FFFF',
      magenta: '#FF00FF',
      white: '#FFFFFF',
      dim: '#808080'
    };
  }

  /**
   * Generate box-drawing border
   */
  drawBox(width, height, title = '') {
    const topLeft = '┌';
    const topRight = '┐';
    const bottomLeft = '└';
    const bottomRight = '┘';
    const horizontal = '─';
    const vertical = '│';
    
    let box = '';
    
    // Top border with title
    if (title) {
      const titlePadded = ` ${title} `;
      const titleLength = titlePadded.length;
      const remainingWidth = width - titleLength - 2;
      const leftPad = Math.floor(remainingWidth / 2);
      const rightPad = remainingWidth - leftPad;
      
      box += topLeft + horizontal.repeat(leftPad) + titlePadded + horizontal.repeat(rightPad) + topRight + '\n';
    } else {
      box += topLeft + horizontal.repeat(width - 2) + topRight + '\n';
    }
    
    // Content area
    for (let i = 0; i < height - 2; i++) {
      box += vertical + ' '.repeat(width - 2) + vertical + '\n';
    }
    
    // Bottom border
    box += bottomLeft + horizontal.repeat(width - 2) + bottomRight;
    
    return box;
  }

  /**
   * Component 1: RunChart - ASCII dot plot
   */
  runChart(config = {}) {
    const {
      title = 'Chart',
      width = 120,
      height = 12,
      series = [],
      yLabels = ['0.44', '0.37', '0.3', '0.23', '0.16'],
      xLabels = ['00:00:00', '00:00:15', '00:00:30', '00:00:45', '00:01:00']
    } = config;

    // Create chart grid
    const chartWidth = width - 10; // Leave space for labels
    const chartHeight = height - 3; // Leave space for borders and labels
    
    let chart = [];
    for (let y = 0; y < chartHeight; y++) {
      chart[y] = new Array(chartWidth).fill(' ');
    }

    // Plot series data using dots
    series.forEach((s, seriesIndex) => {
      const char = seriesIndex === 0 ? '·' : (seriesIndex === 1 ? ':' : '.');
      s.data.forEach((value, x) => {
        const xPos = Math.floor((x / (s.data.length - 1)) * (chartWidth - 1));
        const yPos = Math.floor((1 - value) * (chartHeight - 1));
        if (xPos >= 0 && xPos < chartWidth && yPos >= 0 && yPos < chartHeight) {
          chart[yPos][xPos] = char;
        }
      });
    });

    // Build the ASCII output
    let output = `<div class="ascii-component">`;
    output += `<pre style="color: #fff; font-family: monospace; line-height: 1;">`;
    output += `┌─ ${title} ${('─').repeat(width - title.length - 5)}┐\n`;
    
    // Add y-axis labels and chart content
    yLabels.forEach((label, i) => {
      const row = Math.floor(i * (chartHeight / yLabels.length));
      const yLabel = label.padStart(6);
      const chartRow = chart[row] ? chart[row].join('') : ' '.repeat(chartWidth);
      
      // Add vertical grid lines
      let gridRow = '';
      for (let x = 0; x < chartRow.length; x++) {
        if (x % 20 === 0 && chartRow[x] === ' ') {
          gridRow += '│';
        } else {
          gridRow += chartRow[x];
        }
      }
      
      output += `${yLabel}│${gridRow}│`;
      
      // Add legend on first row
      if (i === 0 && series.length > 0) {
        output += '  ';
        series.forEach(s => {
          output += `<span style="color: ${s.color}">● ${s.label}</span>  `;
        });
      }
      output += '\n';
    });
    
    // Add remaining chart rows
    for (let y = yLabels.length; y < chartHeight; y++) {
      const chartRow = chart[y] ? chart[y].join('') : ' '.repeat(chartWidth);
      output += `      │${chartRow}│\n`;
    }
    
    // Add x-axis
    output += `      └${('─').repeat(chartWidth)}┘\n`;
    output += '       ';
    xLabels.forEach((label, i) => {
      const spacing = Math.floor(chartWidth / xLabels.length);
      output += label.padEnd(spacing);
    });
    
    output += `</pre></div>`;
    return output;
  }

  /**
   * Component 2: Sparkline - ASCII bar chart
   */
  sparkline(config = {}) {
    const {
      title = 'Sparkline',
      value = '0',
      min = '0',
      max = '100',
      color = this.colors.green,
      bars = 60
    } = config;

    const barChars = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];
    
    let output = `<div class="ascii-component">`;
    output += `<pre style="font-family: monospace; line-height: 1;">`;
    output += `┌─ ${title} ${('─').repeat(bars + 20 - title.length)}┐\n`;
    output += `│`;
    
    // Generate random bars for demo
    for (let i = 0; i < bars; i++) {
      const height = Math.floor(Math.random() * 8);
      output += `<span style="color: ${color}">${barChars[height]}</span>`;
    }
    
    output += ` <span style="color: ${color}; font-weight: bold;">${value}</span>`.padEnd(20);
    output += `│\n`;
    output += `│ ${min.padEnd(bars / 2 - 2)} ${max.padStart(bars / 2)}`.padEnd(bars + 20) + `│\n`;
    output += `└${('─').repeat(bars + 20)}┘`;
    output += `</pre></div>`;
    
    return output;
  }

  /**
   * Component 3: BarChart - Horizontal ASCII bars
   */
  barChart(config = {}) {
    const {
      title = 'Bar Chart',
      bars = []
    } = config;

    let output = `<div class="ascii-component">`;
    output += `<pre style="font-family: monospace; line-height: 1;">`;
    output += `┌─ ${title} ${('─').repeat(120 - title.length - 5)}┐\n`;
    
    // Calculate max value for scaling
    const maxBarLength = 80;
    
    bars.forEach(bar => {
      const barLength = Math.floor((bar.value / 100) * maxBarLength);
      const barFill = ('─').repeat(barLength);
      const label = bar.label.padEnd(20);
      const value = bar.displayValue.padStart(20);
      
      output += `│ ${value} ${barFill.padEnd(maxBarLength)}│\n`;
      output += `│ ${label} <span style="color: ${bar.color}">${barFill}</span>${(' ').repeat(maxBarLength - barLength)}│\n`;
    });
    
    output += `└${('─').repeat(120)}┘`;
    output += `</pre></div>`;
    
    return output;
  }

  /**
   * Component 4: Gauge - ASCII progress bar
   */
  gauge(config = {}) {
    const {
      title = 'Progress',
      value = 50,
      displayValue = null,
      color = this.colors.yellow
    } = config;

    const width = 100;
    const fillLength = Math.floor((value / 100) * width);
    const fill = '│'.repeat(fillLength);
    const empty = ' '.repeat(width - fillLength);
    
    let output = `<div class="ascii-component">`;
    output += `<pre style="font-family: monospace; line-height: 1;">`;
    output += `┌─ ${title} ${('─').repeat(width + 20 - title.length)}┐\n`;
    output += `│<span style="color: ${color}">${fill}</span>${empty} ${(displayValue || value + '%').padStart(15)}│\n`;
    output += `└${('─').repeat(width + 20)}┘`;
    output += `</pre></div>`;
    
    return output;
  }

  /**
   * Component 5: TextBox - ASCII table
   */
  textBox(config = {}) {
    const {
      title = 'Text Box',
      headers = [],
      rows = []
    } = config;

    let output = `<div class="ascii-component">`;
    output += `<pre style="font-family: monospace; line-height: 1; color: #fff;">`;
    output += `┌─ ${title} ${('─').repeat(100 - title.length - 5)}┐\n`;
    
    if (headers.length > 0) {
      // Table header
      output += `│ `;
      headers.forEach(header => {
        output += `<span style="color: ${this.colors.yellow}">${header.text.padEnd(header.width)}</span> `;
      });
      output += `│\n`;
      
      // Table rows
      rows.forEach(row => {
        output += `│ `;
        row.forEach((cell, i) => {
          output += `${cell.padEnd(headers[i].width)} `;
        });
        output += `│\n`;
      });
    }
    
    output += `└${('─').repeat(100)}┘`;
    output += `</pre></div>`;
    
    return output;
  }

  /**
   * Component 6: AsciiBox - Large ASCII display
   */
  asciiBox(config = {}) {
    const {
      title = 'ASCII',
      content = '00:00:00',
      color = this.colors.yellow,
      isArt = false
    } = config;

    let output = `<div class="ascii-component">`;
    output += `<pre style="font-family: monospace; line-height: 1;">`;
    output += `┌─ ${title} ${('─').repeat(60 - title.length - 5)}┐\n`;
    
    if (isArt) {
      // ASCII art content
      const lines = content.split('\\n');
      lines.forEach(line => {
        output += `│ <span style="color: ${color}">${line.padEnd(58)}</span> │\n`;
      });
    } else {
      // Large text
      output += `│${(' ').repeat(60)}│\n`;
      output += `│   <span style="color: ${color}; font-size: 32px;">${content}</span>${(' ').repeat(60 - content.length - 6)}│\n`;
      output += `│${(' ').repeat(60)}│\n`;
    }
    
    output += `└${('─').repeat(60)}┘`;
    output += `</pre></div>`;
    
    return output;
  }

  /**
   * Generate complete dashboard
   */
  createDashboard(config = {}) {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BUMBA Component Library - ASCII</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Menlo, monospace;
      background: #000;
      color: #fff;
      padding: 20px;
      font-size: 12px;
      line-height: 1.2;
    }
    .dashboard-header {
      text-align: center;
      margin-bottom: 20px;
      color: #0f0;
    }
    pre {
      margin: 0;
      padding: 0;
      white-space: pre;
      overflow-x: auto;
    }
    .ascii-component {
      margin-bottom: 15px;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 20px;
    }
    .full-width {
      grid-column: span 2;
    }
  </style>
</head>
<body>
  <div class="dashboard-header">
    <pre style="color: #0f0; font-size: 10px;">
     /\\___/\\     /\\___/\\     /\\___/\\     /\\___/\\     /\\___/\\     /\\   /\\     /\\___/\\
    /  o o  \\   /  o o  \\   / \\   / \\   /  o o  \\   /  o o  \\   / \\ / /\\   /  o o  \\
   (    ^    ) (    ^    ) (   x   ) (    ^    ) (    ^    ) (   v   ) (    ^    )
    \\   -   /   \\   -   /   \\  -  /   \\   -   /   \\   -   /   \\     /   \\   -   /
     \\_____/     \\_____/     \\___/     \\_____/     \\_____/     \\___/     \\_____/
    
    🏁 BUMBA COMPONENT LIBRARY - PURE ASCII 🏁
    </pre>
  </div>

  <div class="full-width">
    ${this.runChart({
      title: 'Search engine response time',
      series: [
        { label: 'GOOGLE', color: this.colors.yellow, data: Array(50).fill(0).map(() => Math.random()) },
        { label: 'YAHOO', color: this.colors.cyan, data: Array(50).fill(0).map(() => Math.random()) },
        { label: 'BING', color: this.colors.red, data: Array(50).fill(0).map(() => Math.random()) }
      ]
    })}
  </div>

  <div class="grid">
    <div>
      ${this.sparkline({
        title: 'CPU usage',
        value: '98',
        min: '14',
        max: '100',
        color: this.colors.magenta
      })}
    </div>
    
    <div>
      ${this.sparkline({
        title: 'Free memory pages',
        value: '92,232',
        min: '22,127',
        max: '50,311',
        color: this.colors.yellow
      })}
    </div>
  </div>

  <div class="full-width">
    ${this.barChart({
      title: 'Local network activity',
      bars: [
        { label: 'UDP bytes in', value: 25, color: this.colors.yellow, displayValue: '20,590 / -214' },
        { label: 'UDP bytes out', value: 45, color: this.colors.cyan, displayValue: '13,835 / -106' },
        { label: 'TCP bytes in', value: 85, color: this.colors.red, displayValue: '105,620 / +1,143' },
        { label: 'TCP bytes out', value: 60, color: this.colors.green, displayValue: '41,881 / -3,446' }
      ]
    })}
  </div>

  <div class="grid">
    <div>
      ${this.gauge({
        title: 'Year progress',
        value: 43.8,
        displayValue: '43.8% (160)',
        color: this.colors.yellow
      })}
    </div>
    
    <div>
      ${this.gauge({
        title: 'Minute progress',
        value: 95,
        displayValue: '95% (57)',
        color: this.colors.cyan
      })}
    </div>
  </div>

  <div class="grid">
    <div>
      ${this.textBox({
        title: 'Docker containers stats',
        headers: [
          { text: 'NAME', width: 15 },
          { text: 'CPU %', width: 10 },
          { text: 'MEM USAGE / LIMIT', width: 25 },
          { text: 'PIDS', width: 10 }
        ],
        rows: [
          ['neo4j', '59.22%', '110.6MiB / 1.952GiB', '13'],
          ['config', '0.29%', '38.09MiB / 1.952GiB', '24'],
          ['nginx', '0.00%', '0B / 0B', '0'],
          ['turbine', '55.99%', '160.7MiB / 1.952GiB', '12'],
          ['redis', '0.45%', '84.5MiB / 1.952GiB', '88'],
          ['gateway', '53.72%', '124.9MiB / 1.952GiB', '13']
        ]
      })}
    </div>
    
    <div>
      ${this.asciiBox({
        title: 'Local weather',
        content: '    \\\\   /     Sunny\\n     .-.      77.78 °F\\n  ― (   ) ―   ↘ 11 mph\\n     \`-\'      9 mi\\n    /   \\\\     0.0 in',
        color: this.colors.yellow,
        isArt: true
      })}
    </div>
  </div>

  <div class="full-width">
    ${this.asciiBox({
      title: 'UTC time',
      content: '09:52:53',
      color: this.colors.green
    })}
  </div>

</body>
</html>`;
    
    return html;
  }
}

// Export
module.exports = {
  BumbaComponentLibraryASCII,
  getInstance: () => new BumbaComponentLibraryASCII()
};
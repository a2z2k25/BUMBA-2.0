/**
 * BUMBA Theme System
 * Comprehensive theming for the BUMBA framework
 * Applied by default to all outputs and interactions
 */

const chalk = require('chalk');

// BUMBA Gradient Colors - Core Identity
const BUMBA_COLORS = {
  // Primary gradient: Green → Yellow → Orange → Red
  green: '#52C41A',   // Technical/Backend/Systems
  yellow: '#FAAD14',  // Strategic/Planning/Analysis  
  orange: '#FA8C16',  // Testing/Integration/QA
  red: '#F5222D',     // Experience/Frontend/Design
  
  // Supporting colors
  blue: '#1890FF',    // Information/System/Help
  purple: '#722ED1',  // Executive/Orchestration
  cyan: '#13C2C2',    // Data/AI/ML operations
  gray: '#8C8C8C',    // Inactive/Dimmed/Secondary
  darkGray: '#595959', // Background/Borders
  white: '#FFFFFF',   // Primary text
  black: '#000000',   // High contrast
  
  // Semantic colors
  success: '#52C41A', // Reuse green
  warning: '#FA8C16', // Reuse orange
  error: '#F5222D',   // Reuse red
  info: '#1890FF',    // Reuse blue
};

// Department-to-color mapping
const DEPARTMENT_COLORS = {
  'backend-engineer': 'green',
  'technical': 'green',
  'backend': 'green',
  'api': 'green',
  'database': 'green',
  
  'product-strategist': 'yellow',
  'strategic': 'yellow',
  'product': 'yellow',
  'planning': 'yellow',
  'analysis': 'yellow',
  
  'test-engineer': 'orange',
  'testing': 'orange',
  'qa': 'orange',
  'integration': 'orange',
  'validation': 'orange',
  
  'design-engineer': 'red',
  'frontend': 'red',
  'design': 'red',
  'ui': 'red',
  'ux': 'red',
  
  'executive': 'purple',
  'orchestrator': 'purple',
  'ceo': 'purple',
  
  'data': 'cyan',
  'ai': 'cyan',
  'ml': 'cyan',
  'analytics': 'cyan'
};

// Create chalk instances
const colors = {};
Object.entries(BUMBA_COLORS).forEach(([name, hex]) => {
  colors[name] = chalk.hex(hex);
});

// Create semantic color functions
const theme = {
  // Direct color access
  colors,
  
  // Department coloring
  department(deptName, text) {
    const colorKey = DEPARTMENT_COLORS[deptName.toLowerCase()] || 'gray';
    const colorHex = BUMBA_COLORS[colorKey];
    return chalk.hex(colorHex)(text);
  },
  
  // Gradient text (spreads gradient across text)
  gradient(text) {
    const gradientColors = [BUMBA_COLORS.green, BUMBA_COLORS.yellow, BUMBA_COLORS.orange, BUMBA_COLORS.red];
    const chars = text.split('');
    const segmentSize = Math.ceil(chars.length / gradientColors.length);
    
    return chars.map((char, i) => {
      const colorIndex = Math.floor(i / segmentSize);
      const color = gradientColors[Math.min(colorIndex, gradientColors.length - 1)];
      return chalk.hex(color)(char);
    }).join('');
  },
  
  // Status formatting
  success(text) { return colors.success(`🏁 ${text}`); },
  error(text) { return colors.error(`🔴 ${text}`); },
  warning(text) { return colors.warning(`🟠 ${text}`); },
  info(text) { return colors.info(`ℹ ${text}`); },
  
  // Agent formatting
  agentPrefix(agentId, icon = '●') {
    const dept = this.detectDepartment(agentId);
    const colorKey = DEPARTMENT_COLORS[dept] || 'gray';
    return colors[colorKey](`[${icon} ${agentId.toUpperCase()}]`);
  },
  
  // Command formatting
  command(cmd) {
    if (cmd.startsWith('/bumba:')) {
      const action = cmd.split(':')[1];
      // Color commands based on their nature
      if (['help', 'status', 'menu'].includes(action)) {
        return colors.blue(cmd);
      } else if (['implement', 'analyze', 'design'].includes(action)) {
        return this.gradient(cmd);
      } else {
        return colors.purple(cmd);
      }
    }
    return colors.cyan(cmd);
  },
  
  // Box drawing
  box: {
    tl: '╔', tr: '╗', bl: '╚', br: '╝',
    h: '═', v: '║',
    cross: '╬', tCross: '╦', bCross: '╩',
    lCross: '╠', rCross: '╣'
  },
  
  // Create a colored box
  createBox(content, color = 'gray') {
    const lines = content.split('\n');
    const maxLength = Math.max(...lines.map(l => l.length));
    const c = colors[color] || colors.gray;
    
    const result = [];
    result.push(c(this.box.tl + this.box.h.repeat(maxLength + 2) + this.box.tr));
    lines.forEach(line => {
      const padding = ' '.repeat(maxLength - line.length);
      result.push(c(this.box.v) + ' ' + line + padding + ' ' + c(this.box.v));
    });
    result.push(c(this.box.bl + this.box.h.repeat(maxLength + 2) + this.box.br));
    
    return result.join('\n');
  },
  
  // Progress bar
  progressBar(percent, width = 20, showPercent = true) {
    const filled = Math.floor((percent / 100) * width);
    const empty = width - filled;
    
    // Choose color based on progress
    let barColor;
    if (percent < 25) barColor = colors.red;
    else if (percent < 50) barColor = colors.orange;
    else if (percent < 75) barColor = colors.yellow;
    else barColor = colors.green;
    
    const bar = barColor('█'.repeat(filled)) + colors.gray('░'.repeat(empty));
    const percentText = showPercent ? ` ${percent}%` : '';
    
    return `[${bar}]${percentText}`;
  },
  
  // Multi-agent status line
  statusLine(agents = []) {
    const statuses = agents.map(agent => {
      const dept = this.detectDepartment(agent.id);
      const colorKey = DEPARTMENT_COLORS[dept] || 'gray';
      const statusColor = agent.active ? colors[colorKey] : colors.gray;
      const icon = agent.active ? '●' : '○';
      return statusColor(`[${icon} ${agent.name || agent.id}]`);
    });
    
    return statuses.join(' ');
  },
  
  // Detect department from agent ID or name
  detectDepartment(agentId) {
    const id = agentId.toLowerCase();
    for (const [keyword, dept] of Object.entries(DEPARTMENT_COLORS)) {
      if (id.includes(keyword.replace('-', ''))) {
        return keyword;
      }
    }
    return 'gray';
  },
  
  // Header with gradient
  header(text, style = 'double') {
    const lines = {
      single: { top: '─', side: '│', tl: '┌', tr: '┐', bl: '└', br: '┘' },
      double: { top: '═', side: '║', tl: '╔', tr: '╗', bl: '╚', br: '╝' },
      heavy: { top: '━', side: '┃', tl: '┏', tr: '┓', bl: '┗', br: '┛' }
    };
    
    const l = lines[style] || lines.double;
    const width = text.length + 4;
    
    return [
      this.gradient(l.tl + l.top.repeat(width - 2) + l.tr),
      this.gradient(l.side + '  ' + text + '  ' + l.side),
      this.gradient(l.bl + l.top.repeat(width - 2) + l.br)
    ].join('\n');
  },
  
  // Spinner frames with gradient colors
  spinnerFrames: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
  spinnerColors: [BUMBA_COLORS.green, BUMBA_COLORS.yellow, BUMBA_COLORS.orange, BUMBA_COLORS.red],
  
  // Get spinner frame with color
  getSpinnerFrame(index) {
    const frame = this.spinnerFrames[index % this.spinnerFrames.length];
    const color = this.spinnerColors[index % this.spinnerColors.length];
    return chalk.hex(color)(frame);
  },
  
  // Format file paths
  path(filepath) {
    const parts = filepath.split('/');
    const file = parts.pop();
    const dir = parts.join('/');
    return colors.gray(dir + '/') + colors.white(file);
  },
  
  // Format code with basic syntax highlighting
  code(text, language = 'js') {
    // Simple keyword highlighting
    const keywords = ['const', 'let', 'var', 'function', 'class', 'if', 'else', 'return', 'async', 'await'];
    let formatted = text;
    
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      formatted = formatted.replace(regex, colors.purple(keyword));
    });
    
    // Highlight strings
    formatted = formatted.replace(/(["'])(?:(?=(\\?))\2.)*?\1/g, match => colors.green(match));
    
    // Highlight numbers
    formatted = formatted.replace(/\b\d+\b/g, match => colors.orange(match));
    
    return formatted;
  },
  
  // ASCII logo with gradient
  logo() {
    const lines = [
      '    ██████╗ ██╗   ██╗███╗   ███╗██████╗  █████╗',
      '    ██╔══██╗██║   ██║████╗ ████║██╔══██╗██╔══██╗',
      '    ██████╔╝██║   ██║██╔████╔██║██████╔╝███████║',
      '    ██╔══██╗██║   ██║██║╚██╔╝██║██╔══██╗██╔══██║',
      '    ██████╔╝╚██████╔╝██║ ╚═╝ ██║██████╔╝██║  ██║',
      '    ╚═════╝  ╚═════╝ ╚═╝     ╚═╝╚═════╝ ╚═╝  ╚═╝'
    ];
    
    // Apply gradient across each line
    return lines.map((line, i) => {
      const progress = i / (lines.length - 1);
      let color;
      if (progress < 0.25) color = colors.green;
      else if (progress < 0.5) color = colors.yellow;
      else if (progress < 0.75) color = colors.orange;
      else color = colors.red;
      return color(line);
    }).join('\n');
  },
  
  // Dim secondary information
  dim(text) { return colors.gray(text); },
  
  // Highlight important information
  highlight(text) { return chalk.bold(colors.white(text)); },
  
  // Department icons
  icons: {
    backend: '🟢️',
    strategic: '📊',
    testing: '🧪',
    frontend: '🔴',
    executive: '🟢',
    data: '📈',
    success: '🏁',
    error: '🔴',
    warning: '🟠',
    info: 'ℹ',
    running: '▶',
    stopped: '■',
    paused: '⏸'
  }
};

// Export theme
module.exports = theme;
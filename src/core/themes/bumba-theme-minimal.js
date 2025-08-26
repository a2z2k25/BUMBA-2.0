/**
 * BUMBA Minimal Theme System
 * Tasteful, refined theming using only the gradient colors
 * Green → Yellow → Orange → Red gradient with white/gray for text
 */

const chalk = require('chalk');

// BUMBA Core Gradient - Matching the logo
const GRADIENT = {
  green: '#52C41A',   // Technical/Backend
  yellow: '#FAAD14',  // Strategic/Planning  
  orange: '#FA8C16',  // Testing/Integration
  red: '#F5222D',     // Experience/Frontend
};

// Text colors - minimal palette
const TEXT = {
  primary: '#FFFFFF',   // Main text
  secondary: '#B8B8B8', // Secondary text  
  dim: '#808080',       // Dimmed text
  muted: '#595959',     // Very dim
};

// Allowed emojis only
const EMOJIS = {
  green: '🟢',
  yellow: '🟡', 
  orange: '🟠',
  red: '🔴',
  finish: '🏁'
};

// Create chalk instances
const gradient = {
  green: chalk.hex(GRADIENT.green),
  yellow: chalk.hex(GRADIENT.yellow),
  orange: chalk.hex(GRADIENT.orange),
  red: chalk.hex(GRADIENT.red)
};

const text = {
  primary: chalk.hex(TEXT.primary),
  secondary: chalk.hex(TEXT.secondary),
  dim: chalk.hex(TEXT.dim),
  muted: chalk.hex(TEXT.muted)
};

// Department to gradient mapping
const DEPT_COLORS = {
  'backend': 'green',
  'technical': 'green',
  'api': 'green',
  
  'strategic': 'yellow',
  'product': 'yellow',
  'planning': 'yellow',
  
  'testing': 'orange',
  'qa': 'orange',
  'integration': 'orange',
  
  'frontend': 'red',
  'design': 'red',
  'ui': 'red'
};

/**
 * Minimal theme API
 */
const theme = {
  // Direct color access
  gradient,
  text,
  
  /**
   * Apply gradient color to agent prefix
   */
  agent(agentId, message) {
    const dept = this.detectDept(agentId);
    const color = gradient[DEPT_COLORS[dept]] || text.secondary;
    const prefix = color(`[${agentId.toUpperCase()}]`);
    return `${prefix} ${text.primary(message)}`;
  },
  
  /**
   * Subtle status indicators
   */
  status: {
    success: (msg) => gradient.green(`${EMOJIS.green} ${msg}`),
    warning: (msg) => gradient.orange(`${EMOJIS.orange} ${msg}`),
    error: (msg) => gradient.red(`${EMOJIS.red} ${msg}`),
    progress: (msg) => gradient.yellow(`${EMOJIS.yellow} ${msg}`),
    complete: (msg) => text.primary(`${EMOJIS.finish} ${msg}`)
  },
  
  /**
   * Minimal progress bar
   */
  progress(percent, width = 20) {
    const filled = Math.floor((percent / 100) * width);
    const empty = width - filled;
    
    // Color based on completion
    let color;
    if (percent < 33) color = gradient.red;
    else if (percent < 66) color = gradient.orange;
    else if (percent < 90) color = gradient.yellow;
    else color = gradient.green;
    
    const bar = color('█'.repeat(filled)) + text.muted('░'.repeat(empty));
    return `${text.dim('[')}${bar}${text.dim(']')}`;
  },
  
  /**
   * Spinner that cycles through gradient
   */
  spinner: {
    frames: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
    colors: ['green', 'yellow', 'orange', 'red'],
    
    frame(index) {
      const frame = this.frames[index % this.frames.length];
      const colorName = this.colors[Math.floor(index / 3) % this.colors.length];
      return gradient[colorName](frame);
    }
  },
  
  /**
   * Format file paths subtly
   */
  path(filepath) {
    const parts = filepath.split('/');
    const file = parts.pop();
    const dir = parts.join('/');
    return text.dim(dir + '/') + text.secondary(file);
  },
  
  /**
   * Command formatting - subtle gradient hint
   */
  command(cmd) {
    if (cmd.startsWith('/bumba:')) {
      const [prefix, action] = cmd.split(':');
      return text.dim(prefix + ':') + gradient.yellow(action);
    }
    return text.secondary(cmd);
  },
  
  /**
   * Minimal box for important content
   */
  box(content, width = null) {
    const lines = content.split('\n');
    const maxLen = width || Math.max(...lines.map(l => l.length));
    
    const top = text.dim('─'.repeat(maxLen + 2));
    const formatted = lines.map(line => {
      const padding = ' '.repeat(maxLen - line.length);
      return text.primary(line) + padding;
    });
    
    return [top, ...formatted, top].join('\n');
  },
  
  /**
   * Multi-agent status line
   */
  statusLine(agents = []) {
    return agents.map(agent => {
      const dept = this.detectDept(agent.id);
      const colorName = DEPT_COLORS[dept] || 'green';
      const color = gradient[colorName];
      const emoji = agent.active ? EMOJIS[colorName] : text.muted('○');
      return color(`[${emoji} ${agent.name || agent.id}]`);
    }).join(' ');
  },
  
  /**
   * Header with subtle gradient accent
   */
  header(text) {
    const line = '═'.repeat(text.length + 4);
    return [
      gradient.green(line.substring(0, Math.floor(line.length * 0.25))) +
      gradient.yellow(line.substring(Math.floor(line.length * 0.25), Math.floor(line.length * 0.5))) +
      gradient.orange(line.substring(Math.floor(line.length * 0.5), Math.floor(line.length * 0.75))) +
      gradient.red(line.substring(Math.floor(line.length * 0.75))),
      `  ${text}  `,
      gradient.green(line.substring(0, Math.floor(line.length * 0.25))) +
      gradient.yellow(line.substring(Math.floor(line.length * 0.25), Math.floor(line.length * 0.5))) +
      gradient.orange(line.substring(Math.floor(line.length * 0.5), Math.floor(line.length * 0.75))) +
      gradient.red(line.substring(Math.floor(line.length * 0.75)))
    ].join('\n');
  },
  
  /**
   * Detect department from agent ID
   */
  detectDept(agentId) {
    const id = agentId.toLowerCase();
    for (const keyword of Object.keys(DEPT_COLORS)) {
      if (id.includes(keyword)) return keyword;
    }
    return 'technical'; // default
  },
  
  /**
   * Apply theme to console output
   */
  apply() {
    // Store original console methods
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    
    // Override with themed versions
    console.log = (...args) => {
      const formatted = args.map(arg => {
        if (typeof arg === 'string') {
          // Apply subtle theming to specific patterns
          return arg
            .replace(/\[BACKEND.*?\]/g, match => gradient.green(match))
            .replace(/\[STRATEGIC.*?\]/g, match => gradient.yellow(match))
            .replace(/\[TESTING.*?\]/g, match => gradient.orange(match))
            .replace(/\[FRONTEND.*?\]/g, match => gradient.red(match))
            .replace(/\/bumba:[a-z]+/g, match => this.command(match));
        }
        return arg;
      });
      originalLog.apply(console, formatted);
    };
    
    console.error = (...args) => {
      originalError.apply(console, [gradient.red('🔴'), ...args]);
    };
    
    console.warn = (...args) => {
      originalWarn.apply(console, [gradient.orange('🟠'), ...args]);
    };
    
    return {
      restore: () => {
        console.log = originalLog;
        console.error = originalError;
        console.warn = originalWarn;
      }
    };
  }
};

module.exports = theme;
/**
 * BUMBA Interactive Mode - Sprint 1: Rich Terminal UI
 * 
 * Beautiful, responsive terminal interfaces with colors, progress bars,
 * spinners, tables, and adaptive layouts
 */

const chalk = require('chalk');
const cliProgress = require('cli-progress');
const ora = require('ora');
const Table = require('cli-table3');
const boxen = require('boxen');
const figlet = require('figlet');

/**
 * Rich Terminal UI System for Interactive Mode
 * Provides beautiful visual components for the CLI
 */
class InteractiveUI {
  constructor(config = {}) {
    this.config = {
      // Theme settings
      theme: config.theme || 'default',
      colors: config.colors || this.getDefaultColors(),
      useEmoji: config.useEmoji !== false,
      
      // Layout settings
      responsive: config.responsive !== false,
      maxWidth: config.maxWidth || 120,
      padding: config.padding || 1,
      
      // Animation settings
      animationSpeed: config.animationSpeed || 100,
      progressBarStyle: config.progressBarStyle || 'shades_classic'
    };
    
    // Terminal dimensions
    this.updateDimensions();
    
    // Active components
    this.activeSpinners = new Map();
    this.activeProgressBars = new Map();
    
    // Theme
    this.applyTheme(this.config.theme);
  }

  /**
   * Get default color scheme
   */
  getDefaultColors() {
    return {
      primary: chalk.cyan,
      secondary: chalk.blue,
      success: chalk.green,
      warning: chalk.yellow,
      error: chalk.red,
      info: chalk.gray,
      highlight: chalk.white.bold,
      dim: chalk.dim
    };
  }

  /**
   * Apply theme
   */
  applyTheme(themeName) {
    const themes = {
      default: this.getDefaultColors(),
      dark: {
        primary: chalk.magenta,
        secondary: chalk.cyan,
        success: chalk.green,
        warning: chalk.yellow,
        error: chalk.red,
        info: chalk.gray,
        highlight: chalk.white.bold,
        dim: chalk.dim
      },
      light: {
        primary: chalk.blue,
        secondary: chalk.cyan,
        success: chalk.green.bold,
        warning: chalk.yellow.bold,
        error: chalk.red.bold,
        info: chalk.black,
        highlight: chalk.black.bold,
        dim: chalk.gray
      },
      neon: {
        primary: chalk.magentaBright,
        secondary: chalk.cyanBright,
        success: chalk.greenBright,
        warning: chalk.yellowBright,
        error: chalk.redBright,
        info: chalk.whiteBright,
        highlight: chalk.whiteBright.bold,
        dim: chalk.gray
      }
    };
    
    this.colors = themes[themeName] || themes.default;
  }

  /**
   * Update terminal dimensions
   */
  updateDimensions() {
    // Use process.stdout dimensions
    this.width = Math.min(process.stdout.columns || 80, this.config.maxWidth);
    this.height = process.stdout.rows || 24;
  }

  /**
   * Display banner
   */
  displayBanner(text, options = {}) {
    const bannerOptions = {
      font: options.font || 'Standard',
      horizontalLayout: 'default',
      verticalLayout: 'default'
    };
    
    try {
      const banner = figlet.textSync(text, bannerOptions);
      const colored = this.colors.primary(banner);
      
      if (options.boxed) {
        console.log(boxen(colored, {
          padding: 1,
          margin: 1,
          borderStyle: options.borderStyle || 'round',
          borderColor: 'cyan'
        }));
      } else {
        console.log(colored);
      }
    } catch (error) {
      // Fallback to simple text
      this.displayHeader(text);
    }
  }

  /**
   * Display header
   */
  displayHeader(text, level = 1) {
    const width = this.width - 4;
    const separator = level === 1 ? '=' : '-';
    const line = separator.repeat(width);
    
    console.log();
    if (level === 1) {
      console.log(this.colors.primary(line));
      console.log(this.colors.highlight(text.toUpperCase()));
      console.log(this.colors.primary(line));
    } else {
      console.log(this.colors.secondary(line));
      console.log(this.colors.secondary(text));
      console.log(this.colors.secondary(line));
    }
    console.log();
  }

  /**
   * Create progress bar
   */
  createProgressBar(id, options = {}) {
    const bar = new cliProgress.SingleBar({
      format: options.format || this.getProgressFormat(options),
      barCompleteChar: '█',
      barIncompleteChar: '░',
      hideCursor: true,
      clearOnComplete: options.clearOnComplete || false,
      ...options
    }, cliProgress.Presets[this.config.progressBarStyle]);
    
    this.activeProgressBars.set(id, bar);
    return bar;
  }

  /**
   * Get progress bar format
   */
  getProgressFormat(options = {}) {
    const emoji = this.config.useEmoji ? '📊 ' : '';
    const label = options.label || 'Progress';
    
    return `${emoji}${this.colors.primary(label)} ${this.colors.secondary('│')} ${this.colors.highlight('{bar}')} ${this.colors.secondary('│')} {percentage}% ${this.colors.dim('│')} {value}/{total} ${options.suffix || ''}`;
  }

  /**
   * Create multi-progress bar
   */
  createMultiProgressBar(options = {}) {
    return new cliProgress.MultiBar({
      clearOnComplete: false,
      hideCursor: true,
      format: this.getProgressFormat(options),
      ...options
    }, cliProgress.Presets[this.config.progressBarStyle]);
  }

  /**
   * Create spinner
   */
  createSpinner(text, options = {}) {
    const spinner = ora({
      text: text,
      spinner: options.spinner || 'dots',
      color: options.color || 'cyan',
      prefixText: options.prefix || '',
      ...options
    });
    
    const id = options.id || Date.now().toString();
    this.activeSpinners.set(id, spinner);
    
    return spinner;
  }

  /**
   * Create table
   */
  createTable(options = {}) {
    const tableOptions = {
      head: options.head || [],
      colWidths: options.colWidths || null,
      style: {
        head: ['cyan'],
        border: ['gray'],
        ...options.style
      },
      chars: this.getTableChars(options.style || 'single'),
      ...options
    };
    
    return new Table(tableOptions);
  }

  /**
   * Get table border characters
   */
  getTableChars(style) {
    const styles = {
      single: {
        'top': '─', 'top-mid': '┬', 'top-left': '┌', 'top-right': '┐',
        'bottom': '─', 'bottom-mid': '┴', 'bottom-left': '└', 'bottom-right': '┘',
        'left': '│', 'left-mid': '├', 'mid': '─', 'mid-mid': '┼',
        'right': '│', 'right-mid': '┤', 'middle': '│'
      },
      double: {
        'top': '═', 'top-mid': '╦', 'top-left': '╔', 'top-right': '╗',
        'bottom': '═', 'bottom-mid': '╩', 'bottom-left': '╚', 'bottom-right': '╝',
        'left': '║', 'left-mid': '╠', 'mid': '═', 'mid-mid': '╬',
        'right': '║', 'right-mid': '╣', 'middle': '║'
      },
      round: {
        'top': '─', 'top-mid': '┬', 'top-left': '╭', 'top-right': '╮',
        'bottom': '─', 'bottom-mid': '┴', 'bottom-left': '╰', 'bottom-right': '╯',
        'left': '│', 'left-mid': '├', 'mid': '─', 'mid-mid': '┼',
        'right': '│', 'right-mid': '┤', 'middle': '│'
      }
    };
    
    return styles[style] || styles.single;
  }

  /**
   * Display department status
   */
  displayDepartmentStatus(departments) {
    const table = this.createTable({
      head: ['Department', 'Status', 'Active', 'Queue', 'Performance'],
      colWidths: [15, 10, 10, 10, 15]
    });
    
    departments.forEach(dept => {
      const statusIcon = this.getStatusIcon(dept.status);
      const performanceBar = this.createMiniBar(dept.performance);
      
      table.push([
        this.colors.primary(dept.name),
        statusIcon,
        dept.activeSpecialists.toString(),
        dept.queueLength.toString(),
        performanceBar
      ]);
    });
    
    console.log(table.toString());
  }

  /**
   * Get status icon
   */
  getStatusIcon(status) {
    if (!this.config.useEmoji) {
      const icons = {
        active: '[ACTIVE]',
        busy: '[BUSY]',
        idle: '[IDLE]',
        error: '[ERROR]'
      };
      return icons[status] || '[UNKNOWN]';
    }
    
    const icons = {
      active: '🟢',
      busy: '🟡',
      idle: '🔵',
      error: '🔴'
    };
    
    const labels = {
      active: 'Active',
      busy: 'Busy',
      idle: 'Idle',
      error: 'Error'
    };
    
    return `${icons[status] || '🟠'} ${labels[status] || 'Unknown'}`;
  }

  /**
   * Create mini progress bar
   */
  createMiniBar(percentage, width = 10) {
    const filled = Math.round(percentage * width / 100);
    const empty = width - filled;
    
    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    
    let color;
    if (percentage >= 80) color = this.colors.success;
    else if (percentage >= 50) color = this.colors.warning;
    else color = this.colors.error;
    
    return color(bar) + ` ${percentage}%`;
  }

  /**
   * Display tree structure
   */
  displayTree(tree, indent = '') {
    const isLast = (index, array) => index === array.length - 1;
    
    tree.forEach((node, index) => {
      const connector = isLast(index, tree) ? '└─' : '├─';
      const extension = isLast(index, tree) ? '  ' : '│ ';
      
      const icon = node.type === 'directory' ? '📁' : '📄';
      const nodeIcon = this.config.useEmoji ? icon : node.type === 'directory' ? '[D]' : '[F]';
      
      console.log(this.colors.dim(indent + connector) + ' ' + nodeIcon + ' ' + this.colors.primary(node.name));
      
      if (node.children && node.children.length > 0) {
        this.displayTree(node.children, indent + extension);
      }
    });
  }

  /**
   * Display notification
   */
  displayNotification(message, type = 'info') {
    const icons = {
      success: this.config.useEmoji ? '🏁' : '[SUCCESS]',
      error: this.config.useEmoji ? '🔴' : '[ERROR]',
      warning: this.config.useEmoji ? '🟠️' : '[WARNING]',
      info: this.config.useEmoji ? 'ℹ️' : '[INFO]'
    };
    
    const colors = {
      success: this.colors.success,
      error: this.colors.error,
      warning: this.colors.warning,
      info: this.colors.info
    };
    
    const icon = icons[type] || icons.info;
    const color = colors[type] || colors.info;
    
    console.log(`\n${icon} ${color(message)}\n`);
  }

  /**
   * Display box
   */
  displayBox(content, options = {}) {
    const boxOptions = {
      padding: options.padding || 1,
      margin: options.margin || 0,
      borderStyle: options.borderStyle || 'single',
      borderColor: options.borderColor || 'cyan',
      backgroundColor: options.backgroundColor || null,
      align: options.align || 'left',
      ...options
    };
    
    console.log(boxen(content, boxOptions));
  }

  /**
   * Display list
   */
  displayList(items, options = {}) {
    const bullet = options.bullet || (this.config.useEmoji ? '•' : '-');
    const indent = options.indent || 2;
    const numbered = options.numbered || false;
    
    items.forEach((item, index) => {
      const prefix = numbered ? `${index + 1}.` : bullet;
      const spacing = ' '.repeat(indent);
      
      if (typeof item === 'object' && item.label) {
        console.log(`${spacing}${this.colors.dim(prefix)} ${this.colors.primary(item.label)}`);
        if (item.description) {
          console.log(`${spacing}   ${this.colors.dim(item.description)}`);
        }
      } else {
        console.log(`${spacing}${this.colors.dim(prefix)} ${item}`);
      }
    });
  }

  /**
   * Display key-value pairs
   */
  displayKeyValue(data, options = {}) {
    const maxKeyLength = Math.max(...Object.keys(data).map(k => k.length));
    const separator = options.separator || ':';
    
    Object.entries(data).forEach(([key, value]) => {
      const paddedKey = key.padEnd(maxKeyLength);
      console.log(`  ${this.colors.dim(paddedKey)} ${this.colors.dim(separator)} ${this.colors.primary(value)}`);
    });
  }

  /**
   * Clear screen
   */
  clear() {
    console.clear();
  }

  /**
   * Move cursor
   */
  moveCursor(x, y) {
    process.stdout.write(`\x1b[${y};${x}H`);
  }

  /**
   * Save cursor position
   */
  saveCursor() {
    process.stdout.write('\x1b[s');
  }

  /**
   * Restore cursor position
   */
  restoreCursor() {
    process.stdout.write('\x1b[u');
  }

  /**
   * Hide cursor
   */
  hideCursor() {
    process.stdout.write('\x1b[?25l');
  }

  /**
   * Show cursor
   */
  showCursor() {
    process.stdout.write('\x1b[?25h');
  }

  /**
   * Clean up active components
   */
  cleanup() {
    // Stop all spinners
    this.activeSpinners.forEach(spinner => {
      if (spinner.isSpinning) {
        spinner.stop();
      }
    });
    this.activeSpinners.clear();
    
    // Stop all progress bars
    this.activeProgressBars.forEach(bar => {
      bar.stop();
    });
    this.activeProgressBars.clear();
    
    // Show cursor
    this.showCursor();
  }

  /**
   * Create animated text
   */
  async animateText(text, options = {}) {
    const delay = options.delay || 50;
    const color = options.color || this.colors.primary;
    
    for (const char of text) {
      process.stdout.write(color(char));
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    if (options.newline !== false) {
      console.log();
    }
  }

  /**
   * Display ASCII art
   */
  displayAsciiArt(art) {
    console.log(this.colors.primary(art));
  }

  /**
   * Get formatted timestamp
   */
  getTimestamp() {
    const now = new Date();
    const time = now.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    return this.colors.dim(`[${time}]`);
  }

  /**
   * Log with timestamp
   */
  log(message, type = 'info') {
    const timestamp = this.getTimestamp();
    const colors = {
      info: this.colors.info,
      success: this.colors.success,
      warning: this.colors.warning,
      error: this.colors.error
    };
    
    const color = colors[type] || colors.info;
    console.log(`${timestamp} ${color(message)}`);
  }
}

module.exports = InteractiveUI;
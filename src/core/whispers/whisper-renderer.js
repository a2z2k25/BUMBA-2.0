/**
 * BUMBA Whisper Renderer
 * Renders agent statuses to terminal with gradient colors
 * Minimal, tasteful, non-intrusive
 */

const chalk = require('chalk');
const TerminalDetector = require('./terminal-detector');
const { getDetector } = TerminalDetector;

// BUMBA gradient colors
const GRADIENT = {
  green: chalk.hex('#52C41A'),
  yellow: chalk.hex('#FAAD14'),
  orange: chalk.hex('#FA8C16'),
  red: chalk.hex('#F5222D'),
  white: chalk.hex('#FFFFFF'),
  gray: chalk.hex('#808080'),
  dim: chalk.hex('#595959')
};

class WhisperRenderer {
  constructor(options = {}) {
    this.options = {
      location: options.location || 'title', // 'title', 'statusline', 'inline'
      format: options.format || 'compact',
      colorMode: options.colorMode || 'gradient',
      prefix: options.prefix || 'BUMBA:',
      ...options
    };
    
    // Terminal capabilities
    this.detector = getDetector();
    this.capabilities = this.detector.capabilities;
    
    // Last rendered content (for clearing)
    this.lastRendered = '';
    this.originalTitle = '';
    
    // Save original title if we're using title bar
    if (this.options.location === 'title' && this.capabilities.supportsTitleBar) {
      this.saveOriginalTitle();
    }
  }
  
  /**
   * Save original terminal title
   */
  saveOriginalTitle() {
    // Most terminals support saving/restoring title
    process.stdout.write('\x1b]0;\x07'); // Clear to get baseline
    this.originalTitle = process.title || 'Terminal';
  }
  
  /**
   * Restore original terminal title
   */
  restoreTitle() {
    if (this.capabilities.supportsTitleBar) {
      process.stdout.write(`\x1b]0;${this.originalTitle}\x07`);
    }
  }
  
  /**
   * Render status to terminal
   */
  render(statusData) {
    if (!statusData || !statusData.agents || statusData.agents.length === 0) {
      this.clear();
      return;
    }
    
    switch (this.options.location) {
      case 'title':
        this.renderToTitle(statusData);
        break;
      case 'statusline':
        this.renderToStatusLine(statusData);
        break;
      case 'inline':
        this.renderInline(statusData);
        break;
      default:
        // No rendering if disabled or unknown
        break;
    }
  }
  
  /**
   * Render to terminal title bar
   */
  renderToTitle(statusData) {
    if (!this.capabilities.supportsTitleBar) {
      return;
    }
    
    const content = this.formatContent(statusData);
    const title = `${this.options.prefix} ${content}`;
    
    // Update terminal title using ANSI escape sequence
    process.stdout.write(`\x1b]0;${title}\x07`);
    
    this.lastRendered = title;
  }
  
  /**
   * Render to status line (iTerm2, Kitty, etc.)
   */
  renderToStatusLine(statusData) {
    if (!this.capabilities.supportsStatusLine) {
      // Fallback to title if status line not supported
      this.renderToTitle(statusData);
      return;
    }
    
    const content = this.formatContent(statusData);
    
    // Terminal-specific status line codes
    if (this.capabilities.type === 'iTerm2') {
      // iTerm2 status line
      process.stdout.write(`\x1b]1337;SetUserVar=bumbaStatus=${Buffer.from(content).toString('base64')}\x07`);
    } else if (this.capabilities.type === 'Kitty') {
      // Kitty status line
      process.stdout.write(`\x1b]2;${content}\x1b\\`);
    }
    
    this.lastRendered = content;
  }
  
  /**
   * Render inline (at cursor position)
   */
  renderInline(statusData) {
    const content = this.formatContent(statusData);
    
    // Save cursor position
    process.stdout.write('\x1b[s');
    
    // Move to bottom of screen
    const rows = this.capabilities.rows;
    process.stdout.write(`\x1b[${rows};0H`);
    
    // Clear line and write status
    process.stdout.write('\x1b[K');
    process.stdout.write(content);
    
    // Restore cursor position
    process.stdout.write('\x1b[u');
    
    this.lastRendered = content;
  }
  
  /**
   * Format content based on options
   */
  formatContent(statusData) {
    const agents = statusData.agents || [];
    
    if (agents.length === 0) {
      return '';
    }
    
    // Apply gradient colors if enabled
    if (this.options.colorMode === 'gradient') {
      return this.formatWithGradient(agents);
    } else {
      return this.formatBasic(agents);
    }
  }
  
  /**
   * Format with gradient colors
   */
  formatWithGradient(agents) {
    const parts = agents.map(agent => {
      const color = this.getAgentColor(agent);
      const status = this.getAgentStatus(agent);
      
      if (this.capabilities.supportsTrueColor && this.options.location !== 'title') {
        // Use gradient colors for terminals that support it (not in title)
        return color(status);
      } else {
        // Use plain text for title bar or limited terminals
        return status;
      }
    });
    
    return parts.join(' ');
  }
  
  /**
   * Format basic (no colors)
   */
  formatBasic(agents) {
    const parts = agents.map(agent => this.getAgentStatus(agent));
    return parts.join(' ');
  }
  
  /**
   * Get agent color based on department
   */
  getAgentColor(agent) {
    const dept = agent.department || 'backend';
    
    switch (dept) {
      case 'backend':
      case 'technical':
        return GRADIENT.green;
      case 'strategic':
      case 'product':
        return GRADIENT.yellow;
      case 'testing':
      case 'qa':
        return GRADIENT.orange;
      case 'frontend':
      case 'design':
        return GRADIENT.red;
      default:
        return GRADIENT.gray;
    }
  }
  
  /**
   * Get agent status text
   */
  getAgentStatus(agent) {
    const emoji = agent.emoji || '';
    const id = this.getAgentId(agent);
    const progress = this.getProgress(agent);
    
    switch (this.options.format) {
      case 'compact':
        return `[${id}:${progress}]`;
      case 'verbose':
        return `[${agent.id}: ${agent.status || 'idle'}]`;
      case 'emoji':
        return `[${emoji} ${progress}]`;
      default:
        return `[${id}:${progress}]`;
    }
  }
  
  /**
   * Get short agent ID
   */
  getAgentId(agent) {
    const id = agent.id || 'Agent';
    const parts = id.split('-');
    
    if (parts.length >= 2) {
      // Use first letter of each part
      return parts.map(p => p[0]).join('').toUpperCase();
    }
    
    return id.substring(0, 3).toUpperCase();
  }
  
  /**
   * Get progress indicator
   */
  getProgress(agent) {
    if (agent.status === 'completed') {
      return '🏁';
    }
    
    if (agent.status === 'error') {
      return '🔴';
    }
    
    if (agent.progress !== undefined && agent.progress !== null) {
      return `${agent.progress}%`;
    }
    
    // Animated dots for working status
    const dots = ['·', '··', '···', '··', '·'];
    const index = Math.floor(Date.now() / 500) % dots.length;
    return dots[index];
  }
  
  /**
   * Clear rendered content
   */
  clear() {
    switch (this.options.location) {
      case 'title':
        this.restoreTitle();
        break;
      case 'statusline':
        this.clearStatusLine();
        break;
      case 'inline':
        this.clearInline();
        break;
    }
    
    this.lastRendered = '';
  }
  
  /**
   * Clear status line
   */
  clearStatusLine() {
    if (this.capabilities.type === 'iTerm2') {
      process.stdout.write(`\x1b]1337;SetUserVar=bumbaStatus=\x07`);
    } else if (this.capabilities.type === 'Kitty') {
      process.stdout.write(`\x1b]2;\x1b\\`);
    }
  }
  
  /**
   * Clear inline status
   */
  clearInline() {
    // Save cursor, move to bottom, clear line, restore cursor
    process.stdout.write('\x1b[s');
    process.stdout.write(`\x1b[${this.capabilities.rows};0H`);
    process.stdout.write('\x1b[K');
    process.stdout.write('\x1b[u');
  }
  
  /**
   * Clean up on exit
   */
  cleanup() {
    this.clear();
  }
}

module.exports = WhisperRenderer;
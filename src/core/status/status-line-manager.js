/**
 * BUMBA Status Line Manager
 * Generic, user-friendly status line that works for any Claude Code user
 * Automatically integrates with Claude's token tracking
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { EventEmitter } = require('events');

class StatusLineManager extends EventEmitter {
  constructor(options = {}) {
    super();
    
    // User-configurable options with sensible defaults
    this.config = {
      enabled: options.enabled !== false, // Enabled by default
      position: options.position || 'bottom', // bottom or top
      format: options.format || 'default', // default, minimal, detailed, custom
      updateInterval: options.updateInterval || 1000, // Update every second
      showTokens: options.showTokens !== false, // Show token count by default
      showCost: options.showCost || false, // Don't show cost by default
      showModel: options.showModel !== false, // Show model name by default
      customFormat: options.customFormat || null, // Allow custom format function
      dataDir: options.dataDir || path.join(os.homedir(), '.bumba'), // User's home directory
      colors: options.colors !== false, // Use colors by default
      persistUsage: options.persistUsage !== false // Save usage data by default
    };
    
    // Token tracking (generic for any model)
    this.usage = {
      tokens: 0,
      messages: 0,
      session: {
        tokens: 0,
        messages: 0,
        startTime: Date.now()
      }
    };
    
    // Model detection (will auto-detect from environment)
    this.modelInfo = this.detectModel();
    
    // Status line state
    this.isActive = false;
    this.lastUpdate = Date.now();
    
    // Initialize if enabled
    if (this.config.enabled) {
      this.initialize();
    }
  }

  /**
   * Detect the current model being used
   * Generic approach that works for any Claude model
   */
  detectModel() {
    // Check environment variables first (generic approach)
    const modelFromEnv = process.env.CLAUDE_MODEL || 
                        process.env.ANTHROPIC_MODEL ||
                        process.env.AI_MODEL;
    
    if (modelFromEnv) {
      return {
        name: modelFromEnv,
        type: this.getModelType(modelFromEnv)
      };
    }
    
    // Default to generic Claude identifier
    return {
      name: 'Claude',
      type: 'claude'
    };
  }

  /**
   * Get model type from name (for cost calculation)
   */
  getModelType(modelName) {
    const name = modelName.toLowerCase();
    if (name.includes('opus')) return 'opus';
    if (name.includes('sonnet')) return 'sonnet';
    if (name.includes('haiku')) return 'haiku';
    if (name.includes('claude-3')) return 'claude-3';
    if (name.includes('claude-2')) return 'claude-2';
    return 'claude';
  }

  /**
   * Initialize the status line
   */
  async initialize() {
    // Create data directory if it doesn't exist
    if (this.config.persistUsage) {
      await this.ensureDataDir();
      await this.loadUsageData();
    }
    
    // Set up hook interceptors for token tracking
    this.setupTokenTracking();
    
    // Start display if configured
    if (this.config.enabled) {
      this.start();
    }
  }

  /**
   * Ensure data directory exists
   */
  async ensureDataDir() {
    try {
      await fs.promises.mkdir(this.config.dataDir, { recursive: true });
    } catch (error) {
      // Directory might already exist, that's fine
    }
  }

  /**
   * Load previous usage data
   */
  async loadUsageData() {
    const dataFile = path.join(this.config.dataDir, 'token-usage.json');
    try {
      const data = await fs.promises.readFile(dataFile, 'utf8');
      const parsed = JSON.parse(data);
      this.usage = { ...this.usage, ...parsed };
      // Reset session data
      this.usage.session = {
        tokens: 0,
        messages: 0,
        startTime: Date.now()
      };
    } catch (error) {
      // File doesn't exist yet, use defaults
    }
  }

  /**
   * Save usage data
   */
  async saveUsageData() {
    if (!this.config.persistUsage) return;
    
    const dataFile = path.join(this.config.dataDir, 'token-usage.json');
    try {
      await fs.promises.writeFile(dataFile, JSON.stringify(this.usage, null, 2));
    } catch (error) {
      // Fail silently - don't interrupt user's work
    }
  }

  /**
   * Setup token tracking hooks
   * This is generic and will work with any Claude Code session
   */
  setupTokenTracking() {
    // Method 1: Intercept console.log for token information
    const originalLog = console.log;
    console.log = (...args) => {
      // Look for token usage patterns in console output
      const message = args.join(' ');
      this.extractTokenInfo(message);
      originalLog.apply(console, args);
    };
    
    // Method 2: Listen for process events (if Claude Code emits them)
    process.on('claude:tokens', (data) => {
      this.updateTokens(data.tokens || 0);
    });
    
    // Method 3: Check for global token tracking object
    if (global.__claudeTokens) {
      this.updateTokens(global.__claudeTokens);
    }
    
    // Method 4: Monitor file system for Claude logs
    this.monitorClaudeLogs();
  }

  /**
   * Extract token information from console messages
   */
  extractTokenInfo(message) {
    // Look for common token patterns
    const patterns = [
      /(\d+)\s*tokens?/i,
      /tokens?:\s*(\d+)/i,
      /usage:\s*(\d+)/i,
      /total.*?(\d+)\s*tokens?/i
    ];
    
    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        const tokens = parseInt(match[1]);
        if (!isNaN(tokens) && tokens > 0 && tokens < 1000000) {
          this.updateTokens(tokens);
          break;
        }
      }
    }
  }

  /**
   * Monitor Claude log files for token usage
   */
  async monitorClaudeLogs() {
    // Common log locations
    const logPaths = [
      path.join(os.homedir(), '.claude', 'logs'),
      path.join(os.homedir(), '.config', 'claude', 'logs'),
      path.join(os.tmpdir(), 'claude-logs')
    ];
    
    for (const logPath of logPaths) {
      try {
        const files = await fs.promises.readdir(logPath);
        // Monitor the most recent log file
        const logFile = files.filter(f => f.endsWith('.log')).sort().pop();
        if (logFile) {
          this.watchLogFile(path.join(logPath, logFile));
        }
      } catch (error) {
        // Directory doesn't exist, skip
      }
    }
  }

  /**
   * Watch a log file for token updates
   */
  watchLogFile(filepath) {
    try {
      fs.watchFile(filepath, { interval: 5000 }, () => {
        // Read last few lines of the file for token info
        fs.readFile(filepath, 'utf8', (err, data) => {
          if (!err) {
            const lines = data.split('\n').slice(-10);
            lines.forEach(line => this.extractTokenInfo(line));
          }
        });
      });
    } catch (error) {
      // Fail silently
    }
  }

  /**
   * Update token count
   */
  updateTokens(count) {
    const tokens = parseInt(count) || 0;
    if (tokens > 0) {
      this.usage.tokens += tokens;
      this.usage.session.tokens += tokens;
      this.usage.messages++;
      this.usage.session.messages++;
      
      this.emit('tokens:updated', { tokens, total: this.usage.tokens });
      
      // Save periodically
      if (this.usage.tokens % 100 === 0) {
        this.saveUsageData();
      }
      
      // Update display
      this.refresh();
    }
  }

  /**
   * Format the status line based on configuration
   */
  formatStatusLine() {
    // Allow custom format function
    if (this.config.customFormat && typeof this.config.customFormat === 'function') {
      return this.config.customFormat(this.usage, this.modelInfo);
    }
    
    const tokens = this.formatNumber(this.usage.session.tokens);
    const totalTokens = this.formatNumber(this.usage.tokens);
    const model = this.modelInfo.name;
    
    switch (this.config.format) {
      case 'minimal':
        return `BUMBA | ${tokens} tokens`;
        
      case 'detailed':
        const sessionTime = this.formatDuration(Date.now() - this.usage.session.startTime);
        const cost = this.config.showCost ? ` | ~$${this.estimateCost()}` : '';
        return `BUMBA ${model} | Session: ${tokens} (${sessionTime}) | Total: ${totalTokens}${cost}`;
        
      case 'custom':
        return this.config.customFormat ? this.config.customFormat(this.usage) : this.formatDefault();
        
      default:
        return this.formatDefault();
    }
  }

  /**
   * Default format
   */
  formatDefault() {
    const parts = ['BUMBA'];
    
    if (this.config.showModel) {
      parts.push(this.modelInfo.name);
    }
    
    if (this.config.showTokens) {
      const tokens = this.formatNumber(this.usage.session.tokens);
      parts.push(`| ${tokens} tokens`);
    }
    
    if (this.config.showCost) {
      parts.push(`| ~$${this.estimateCost()}`);
    }
    
    return parts.join(' ');
  }

  /**
   * Format number for display
   */
  formatNumber(num) {
    if (num < 1000) return num.toString();
    if (num < 1000000) return `${(num / 1000).toFixed(1)}K`;
    return `${(num / 1000000).toFixed(2)}M`;
  }

  /**
   * Format duration
   */
  formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m`;
    return `${seconds}s`;
  }

  /**
   * Estimate cost based on model type
   * Prices are approximate and for display only
   */
  estimateCost() {
    const costPerMillion = {
      'opus': 15.0,
      'sonnet': 3.0,
      'haiku': 0.25,
      'claude-3': 8.0,
      'claude-2': 8.0,
      'claude': 5.0 // Default estimate
    };
    
    const rate = costPerMillion[this.modelInfo.type] || 5.0;
    const cost = (this.usage.session.tokens / 1000000) * rate;
    return cost.toFixed(2);
  }

  /**
   * Start displaying the status line
   */
  start() {
    if (this.isActive) return;
    
    this.isActive = true;
    
    // Initial display
    this.display();
    
    // Set up periodic refresh
    this.refreshInterval = setInterval(() => {
      this.refresh();
    }, this.config.updateInterval);
  }

  /**
   * Stop displaying the status line
   */
  stop() {
    if (!this.isActive) return;
    
    this.isActive = false;
    
    // Clear any pending refresh
    if (this._refreshDebounce) {
      clearTimeout(this._refreshDebounce);
      this._refreshDebounce = null;
    }
    
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
    
    // Clear the line
    this.clearLine();
    
    // Save final usage data
    this.saveUsageData();
  }

  /**
   * Display the status line
   */
  display() {
    if (!this.isActive || !this.config.enabled) return;
    
    const statusLine = this.formatStatusLine();
    
    if (this.config.colors) {
      process.stdout.write(`\r\x1b[K\x1b[90m${statusLine}\x1b[0m`);
    } else {
      process.stdout.write(`\r\x1b[K${statusLine}`);
    }
  }

  /**
   * Refresh the display with debouncing to prevent spam
   */
  refresh() {
    // Debounce refresh calls to prevent terminal spam
    if (this._refreshDebounce) {
      clearTimeout(this._refreshDebounce);
    }
    
    this._refreshDebounce = setTimeout(() => {
      this.display();
    }, 100); // 100ms debounce
  }

  /**
   * Clear the status line
   */
  clearLine() {
    process.stdout.write('\r\x1b[K');
  }

  /**
   * Get current usage statistics
   */
  getStats() {
    return {
      session: {
        tokens: this.usage.session.tokens,
        messages: this.usage.session.messages,
        duration: Date.now() - this.usage.session.startTime,
        cost: this.estimateCost()
      },
      total: {
        tokens: this.usage.tokens,
        messages: this.usage.messages
      },
      model: this.modelInfo
    };
  }

  /**
   * Reset session counters
   */
  resetSession() {
    this.usage.session = {
      tokens: 0,
      messages: 0,
      startTime: Date.now()
    };
    this.refresh();
  }

  /**
   * Configure the status line
   */
  configure(options) {
    this.config = { ...this.config, ...options };
    
    if (options.enabled === false) {
      this.stop();
    } else if (options.enabled === true && !this.isActive) {
      this.start();
    }
    
    this.refresh();
  }
}

// Create singleton instance
let instance = null;

/**
 * Get or create the status line instance
 */
function getStatusLine(options = {}) {
  if (!instance) {
    instance = new StatusLineManager(options);
  }
  return instance;
}

// Export for use
module.exports = {
  StatusLineManager,
  getStatusLine,
  
  // Convenience methods
  enable: () => getStatusLine().start(),
  disable: () => getStatusLine().stop(),
  configure: (options) => getStatusLine().configure(options),
  trackTokens: (count) => getStatusLine().updateTokens(count),
  getStats: () => getStatusLine().getStats(),
  resetSession: () => getStatusLine().resetSession()
};
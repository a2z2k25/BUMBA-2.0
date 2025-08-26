/**
 * BUMBA Dynamic Status Line
 * Persistent status display with real-time token usage tracking
 * Displays: BUMBA-CLAUDE Multi-Agent Framework [token count]
 */

const fs = require('fs').promises;
const path = require('path');
const EventEmitter = require('events');

class DynamicStatusLine extends EventEmitter {
  constructor() {
    super();
    
    // Status line configuration
    this.frameworkName = 'BUMBA-CLAUDE';
    this.modelName = 'Opus4.1'; // Default model name
    this.displayMode = 'default'; // default, compact, detailed
    this.updateInterval = 1000; // Update every second
    this.isActive = false;
    
    // Token tracking
    this.tokenUsage = {
      current: 0,
      session: 0,
      daily: 0,
      monthly: 0,
      lifetime: 0
    };
    
    // Persistence
    this.dataPath = path.join(process.env.HOME || process.cwd(), '.claude', 'bumba', 'token-usage.json');
    this.lastSave = Date.now();
    this.autoSaveInterval = 30000; // Save every 30 seconds
    
    // Display settings
    this.displaySettings = {
      showFrameworkName: true,
      showTokenCount: true,
      showTrend: false,
      showCost: false,
      useColors: true
    };
    
    // Initialize
    this.initialize();
  }

  /**
   * Initialize status line
   */
  async initialize() {
    // Load persisted token data
    await this.loadTokenData();
    
    // Set up auto-save
    this.startAutoSave();
    
    // Set up token tracking hooks
    this.setupTokenTracking();
    
    console.log('🏁 Dynamic Status Line initialized');
  }

  /**
   * Load persisted token usage data
   */
  async loadTokenData() {
    try {
      // Ensure directory exists
      const dir = path.dirname(this.dataPath);
      await fs.mkdir(dir, { recursive: true });
      
      // Load existing data
      try {
        const data = await fs.readFile(this.dataPath, 'utf8');
        const parsed = JSON.parse(data);
        
        // Update token usage
        this.tokenUsage = {
          ...this.tokenUsage,
          ...parsed
        };
        
        // Reset session counter
        this.tokenUsage.session = 0;
        
      } catch (e) {
        // File doesn't exist yet, use defaults
        await this.saveTokenData();
      }
      
    } catch (error) {
      console.error('Error loading token data:', error);
    }
  }

  /**
   * Save token usage data
   */
  async saveTokenData() {
    try {
      const dir = path.dirname(this.dataPath);
      await fs.mkdir(dir, { recursive: true });
      
      const data = {
        ...this.tokenUsage,
        lastUpdated: new Date().toISOString(),
        lastSave: Date.now()
      };
      
      await fs.writeFile(this.dataPath, JSON.stringify(data, null, 2));
      this.lastSave = Date.now();
      
    } catch (error) {
      console.error('Error saving token data:', error);
    }
  }

  /**
   * Start auto-save timer
   */
  startAutoSave() {
    setInterval(() => {
      this.saveTokenData();
    }, this.autoSaveInterval);
  }

  /**
   * Setup token tracking hooks
   */
  setupTokenTracking() {
    // This will be called by the framework when tokens are used
    this.on('tokens:used', (count) => {
      this.addTokens(count);
    });
    
    // Track different types of token usage
    this.on('tokens:prompt', (count) => {
      this.addTokens(count, 'prompt');
    });
    
    this.on('tokens:completion', (count) => {
      this.addTokens(count, 'completion');
    });
  }

  /**
   * Add tokens to the counter
   */
  addTokens(count, type = 'total') {
    const tokens = parseInt(count) || 0;
    
    // Update all counters
    this.tokenUsage.current += tokens;
    this.tokenUsage.session += tokens;
    this.tokenUsage.daily += tokens;
    this.tokenUsage.monthly += tokens;
    this.tokenUsage.lifetime += tokens;
    
    // Emit update event
    this.emit('usage:updated', {
      added: tokens,
      type,
      current: this.tokenUsage.current
    });
    
    // Update display if active
    if (this.isActive) {
      this.updateDisplay();
    }
    
    // Save if significant change
    if (this.tokenUsage.current % 1000 === 0) {
      this.saveTokenData();
    }
  }

  /**
   * Format token count for display
   */
  formatTokenCount(count) {
    if (count < 1000) {
      return count.toString();
    } else if (count < 1000000) {
      return `${(count / 1000).toFixed(1)}K`;
    } else {
      return `${(count / 1000000).toFixed(2)}M`;
    }
  }

  /**
   * Get status emoji based on token usage
   */
  getStatusEmoji() {
    if (this.tokenUsage.current >= 1000000) {
      return '🔴';
    } else if (this.tokenUsage.current >= 500000) {
      return '🟡';
    }
    return '🟢';
  }

  /**
   * Generate the status line
   */
  generateStatusLine() {
    const tokens = this.formatTokenCount(this.tokenUsage.current);
    const emoji = this.getStatusEmoji();
    
    switch (this.displayMode) {
      case 'compact':
        return `${emoji} BUMBA ${this.modelName} | ${tokens}`;
        
      case 'detailed': {
        const session = this.formatTokenCount(this.tokenUsage.session);
        const daily = this.formatTokenCount(this.tokenUsage.daily);
        return `${emoji} ${this.frameworkName} ${this.modelName} | Session: ${session} | Daily: ${daily} | Total: ${tokens}`;
      }
        
      default:
        return `${emoji} ${this.frameworkName} ${this.modelName} | ${tokens}`;
    }
  }

  /**
   * Get colored status line (for terminal display)
   */
  getColoredStatusLine() {
    if (!this.displaySettings.useColors) {
      return this.generateStatusLine();
    }
    
    const tokens = this.formatTokenCount(this.tokenUsage.current);
    const emoji = this.getStatusEmoji();
    
    // Color codes - using minimal colors now
    const colors = {
      reset: '\x1b[0m',
      bright: '\x1b[1m',
      gray: '\x1b[90m'
    };
    
    // Get the appropriate name based on display mode
    let displayName = this.frameworkName;
    if (this.displayMode === 'compact') {
      displayName = 'BUMBA';
    }
    
    // Return with emoji for color indication, text in standard colors
    return `${emoji} ${colors.bright}${displayName} ${this.modelName}${colors.reset} ${colors.gray}|${colors.reset} ${tokens}`;
  }

  /**
   * Start displaying the status line
   */
  start() {
    if (this.isActive) {return;}
    
    this.isActive = true;
    this.displayTimer = setInterval(() => {
      this.updateDisplay();
    }, this.updateInterval);
    
    // Initial display
    this.updateDisplay();
    
    console.log('🟢 Status line activated');
  }

  /**
   * Stop displaying the status line
   */
  stop() {
    if (!this.isActive) {return;}
    
    this.isActive = false;
    
    // Clear any pending display update
    if (this._displayDebounce) {
      clearTimeout(this._displayDebounce);
      this._displayDebounce = null;
    }
    
    if (this.displayTimer) {
      clearInterval(this.displayTimer);
      this.displayTimer = null;
    }
    
    // Clear the line
    process.stdout.write('\r' + ' '.repeat(80) + '\r');
    
    console.log('🟢 Status line deactivated');
  }

  /**
   * Update the display with debouncing
   */
  updateDisplay() {
    if (!this.isActive) {return;}
    
    // Debounce display updates to prevent spam
    if (this._displayDebounce) {
      clearTimeout(this._displayDebounce);
    }
    
    this._displayDebounce = setTimeout(() => {
      const statusLine = this.getColoredStatusLine();
      
      // Clear line and write status
      process.stdout.write('\r' + ' '.repeat(80) + '\r');
      process.stdout.write(statusLine);
    }, 50); // 50ms debounce for display
  }

  /**
   * Set display mode
   */
  setDisplayMode(mode) {
    if (['default', 'compact', 'detailed'].includes(mode)) {
      this.displayMode = mode;
      if (this.isActive) {
        this.updateDisplay();
      }
    }
  }

  /**
   * Set model name
   */
  setModelName(modelName) {
    this.modelName = modelName;
    if (this.isActive) {
      this.updateDisplay();
    }
  }

  /**
   * Reset counters
   */
  resetCounters(type = 'session') {
    switch (type) {
      case 'session':
        this.tokenUsage.session = 0;
        break;
      case 'daily':
        this.tokenUsage.daily = 0;
        break;
      case 'monthly':
        this.tokenUsage.monthly = 0;
        break;
      case 'all':
        this.tokenUsage.current = 0;
        this.tokenUsage.session = 0;
        this.tokenUsage.daily = 0;
        this.tokenUsage.monthly = 0;
        break;
    }
    
    this.saveTokenData();
    this.emit('counters:reset', type);
  }

  /**
   * Get current usage statistics
   */
  getUsageStats() {
    return {
      current: this.tokenUsage.current,
      session: this.tokenUsage.session,
      daily: this.tokenUsage.daily,
      monthly: this.tokenUsage.monthly,
      lifetime: this.tokenUsage.lifetime,
      formatted: {
      },
      costs: this.calculateCosts()
    };
  }

  /**
   * Calculate estimated costs
   */
  calculateCosts() {
    // Claude pricing estimates (per 1M tokens)
    const pricing = {
      claude3Opus: { input: 15, output: 75 },
      claude3Sonnet: { input: 3, output: 15 },
      claude3Haiku: { input: 0.25, output: 1.25 }
    };
    
    // Assume mixed usage with Sonnet
    const avgCostPer1M = 9; // Average of input/output for Sonnet
    
    return {
      session: `$${((this.tokenUsage.session / 1000000) * avgCostPer1M).toFixed(2)}`,
      daily: `$${((this.tokenUsage.daily / 1000000) * avgCostPer1M).toFixed(2)}`,
      monthly: `$${((this.tokenUsage.monthly / 1000000) * avgCostPer1M).toFixed(2)}`,
      lifetime: `$${((this.tokenUsage.lifetime / 1000000) * avgCostPer1M).toFixed(2)}`
    };
  }

  /**
   * Export usage data
   */
  async exportUsageData(filepath = './token-usage-export.json') {
    const exportData = {
      timestamp: new Date().toISOString(),
      framework: this.frameworkName,
      usage: this.tokenUsage,
      stats: this.getUsageStats(),
      costs: this.calculateCosts()
    };
    
    await fs.writeFile(filepath, JSON.stringify(exportData, null, 2));
    console.log(`🟢 Usage data exported to ${filepath}`);
    return filepath;
  }

  /**
   * Create a hook for framework integration
   */
  createTokenTrackingHook() {
    return async (context) => {
      // Track tokens from API responses
      if (context.response && context.response.usage) {
        const usage = context.response.usage;
        
        if (usage.prompt_tokens) {
          this.emit('tokens:prompt', usage.prompt_tokens);
        }
        
        if (usage.completion_tokens) {
          this.emit('tokens:completion', usage.completion_tokens);
        }
        
        if (usage.total_tokens) {
          this.emit('tokens:used', usage.total_tokens);
        }
      }
      
      // Track estimated tokens
      if (context.estimatedTokens) {
        this.emit('tokens:used', context.estimatedTokens);
      }
      
      return context;
    };
  }

  /**
   * Display status in different formats
   */
  display(format = 'line') {
    switch (format) {
      case 'line':
        console.log(this.getColoredStatusLine());
        break;
        
      case 'box':
        this.displayBox();
        break;
        
      case 'json':
        console.log(JSON.stringify(this.getUsageStats(), null, 2));
        break;
        
      default:
        console.log(this.generateStatusLine());
    }
  }

  /**
   * Display status in a box format
   */
  displayBox() {
    const stats = this.getUsageStats();
    const costs = stats.costs;
    
    const emoji = this.getStatusEmoji();
    const title = `${emoji} BUMBA-CLAUDE ${this.modelName}`;
    const padding = Math.floor((60 - title.length) / 2);
    const paddedTitle = ' '.repeat(padding) + title + ' '.repeat(60 - title.length - padding);
    
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log(`║${paddedTitle}║`);
    console.log('╠══════════════════════════════════════════════════════════╣');
    console.log(`║ Current:  ${stats.formatted.current.padEnd(10)} │ Cost: ${costs.session.padEnd(10)} ║`);
    console.log(`║ Session:  ${stats.formatted.session.padEnd(10)} │ Cost: ${costs.session.padEnd(10)} ║`);
    console.log(`║ Daily:    ${stats.formatted.daily.padEnd(10)} │ Cost: ${costs.daily.padEnd(10)} ║`);
    console.log(`║ Monthly:  ${stats.formatted.monthly.padEnd(10)} │ Cost: ${costs.monthly.padEnd(10)} ║`);
    console.log(`║ Lifetime: ${stats.formatted.lifetime.padEnd(10)} │ Cost: ${costs.lifetime.padEnd(10)} ║`);
    console.log('╚══════════════════════════════════════════════════════════╝');
  }
}

// Singleton instance
let instance = null;

module.exports = {
  DynamicStatusLine,
  
  // Get singleton instance
  getInstance: () => {
    if (!instance) {
      instance = new DynamicStatusLine();
    }
    return instance;
  },
  
  // Quick access methods
  trackTokens: (count) => {
    const statusLine = module.exports.getInstance();
    statusLine.addTokens(count);
  },
  
  showStatus: () => {
    const statusLine = module.exports.getInstance();
    statusLine.start();
  },
  
  hideStatus: () => {
    const statusLine = module.exports.getInstance();
    statusLine.stop();
  },
  
  getStatus: () => {
    const statusLine = module.exports.getInstance();
    return statusLine.generateStatusLine();
  }
};
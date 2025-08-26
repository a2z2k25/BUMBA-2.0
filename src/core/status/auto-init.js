/**
 * BUMBA Status Line Auto-Initialization
 * Automatically sets up the status line for any Claude Code user
 * No configuration required - works out of the box
 */

const { getStatusLine } = require('./status-line-manager');
const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Auto-detect user preferences
 */
function detectUserPreferences() {
  const prefs = {
    enabled: true,
    format: 'default',
    colors: true,
    showTokens: true,
    showModel: true,
    showCost: false
  };
  
  // Check for user config file
  const configPaths = [
    path.join(os.homedir(), '.bumba', 'config.json'),
    path.join(os.homedir(), '.config', 'bumba', 'config.json'),
    path.join(process.cwd(), '.bumba.config.json'),
    path.join(process.cwd(), 'bumba.config.json')
  ];
  
  for (const configPath of configPaths) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (config.statusLine) {
        Object.assign(prefs, config.statusLine);
      }
      break;
    } catch (error) {
      // Config file doesn't exist or is invalid, use defaults
    }
  }
  
  // Check environment variables
  if (process.env.BUMBA_STATUS_LINE === 'false') {
    prefs.enabled = false;
  }
  
  if (process.env.BUMBA_STATUS_FORMAT) {
    prefs.format = process.env.BUMBA_STATUS_FORMAT;
  }
  
  if (process.env.NO_COLOR || process.env.BUMBA_NO_COLOR) {
    prefs.colors = false;
  }
  
  return prefs;
}

/**
 * Initialize the status line with auto-detected settings
 */
function initializeStatusLine() {
  const preferences = detectUserPreferences();
  
  // Get or create status line instance
  const statusLine = getStatusLine(preferences);
  
  // Set up global token tracking hook
  if (global.process && !global.__bumbaStatusLineInitialized) {
    global.__bumbaStatusLineInitialized = true;
    
    // Hook into Claude's token tracking if available
    hookIntoClaudeTokens(statusLine);
    
    // Set up cleanup on exit
    setupCleanup(statusLine);
  }
  
  return statusLine;
}

/**
 * Hook into Claude's token tracking mechanisms
 */
function hookIntoClaudeTokens(statusLine) {
  // Method 1: Check for Claude's global token counter
  if (global.anthropic || global.claude) {
    const api = global.anthropic || global.claude;
    if (api.on) {
      api.on('tokens', (count) => statusLine.updateTokens(count));
    }
  }
  
  // Method 2: Intercept fetch/axios for API calls
  interceptApiCalls(statusLine);
  
  // Method 3: Monitor process stdout for token info
  monitorProcessOutput(statusLine);
}

/**
 * Intercept API calls to track tokens
 */
function interceptApiCalls(statusLine) {
  // Intercept fetch if available
  if (global.fetch) {
    const originalFetch = global.fetch;
    global.fetch = async (...args) => {
      const response = await originalFetch(...args);
      
      // Check if this is a Claude API call
      if (args[0] && args[0].includes('anthropic') || args[0].includes('claude')) {
        // Try to extract token usage from response
        try {
          const clonedResponse = response.clone();
          const data = await clonedResponse.json();
          if (data.usage && data.usage.total_tokens) {
            statusLine.updateTokens(data.usage.total_tokens);
          }
        } catch (error) {
          // Couldn't parse response, ignore
        }
      }
      
      return response;
    };
  }
  
  // Intercept axios if available
  try {
    const axios = require('axios');
    if (axios.interceptors) {
      axios.interceptors.response.use((response) => {
        if (response.data && response.data.usage) {
          statusLine.updateTokens(response.data.usage.total_tokens || 0);
        }
        return response;
      });
    }
  } catch (error) {
    // Axios not available, ignore
  }
}

/**
 * Monitor process output for token information
 */
function monitorProcessOutput(statusLine) {
  // Intercept process.stdout.write
  const originalWrite = process.stdout.write;
  process.stdout.write = function(...args) {
    // Check for token patterns in output
    const output = args[0] ? args[0].toString() : '';
    
    // Skip our own status line output to prevent infinite loop
    if (output.includes('BUMBA') && output.includes('tokens')) {
      return originalWrite.apply(process.stdout, args);
    }
    
    // Skip ANSI escape codes and control characters
    if (output.includes('\x1b[') || output.includes('\r')) {
      return originalWrite.apply(process.stdout, args);
    }
    
    // Common patterns for token counts (but not from our own output)
    const patterns = [
      /^tokens:\s*(\d+)/i,
      /total_tokens['":]?\s*(\d+)/i,
      /usage.*?(\d+)\s*tokens/i
    ];
    
    for (const pattern of patterns) {
      const match = output.match(pattern);
      if (match && match[1]) {
        const tokens = parseInt(match[1]);
        // Only track reasonable token counts
        if (!isNaN(tokens) && tokens > 0 && tokens < 100000) {
          // Debounce to avoid duplicate counts
          if (!statusLine._lastTokenUpdate || Date.now() - statusLine._lastTokenUpdate > 5000) {
            statusLine.updateTokens(tokens);
            statusLine._lastTokenUpdate = Date.now();
          }
        }
      }
    }
    
    return originalWrite.apply(process.stdout, args);
  };
}

/**
 * Set up cleanup on process exit
 */
function setupCleanup(statusLine) {
  const cleanup = () => {
    statusLine.stop();
    statusLine.saveUsageData();
  };
  
  // Handle various exit scenarios
  process.on('exit', cleanup);
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
    cleanup();
    process.exit(1);
  });
}

/**
 * Create user-friendly configuration file if it doesn't exist
 */
async function createDefaultConfig() {
  const configPath = path.join(os.homedir(), '.bumba', 'config.json');
  
  try {
    // Check if config already exists
    await fs.promises.access(configPath);
  } catch (error) {
    // Config doesn't exist, create it
    const defaultConfig = {
      statusLine: {
        enabled: true,
        format: 'default', // Options: minimal, default, detailed
        colors: true,
        showTokens: true,
        showModel: true,
        showCost: false,
        updateInterval: 1000,
        persistUsage: true
      },
      framework: {
        name: 'BUMBA',
        version: '2.0'
      }
    };
    
    try {
      await fs.promises.mkdir(path.dirname(configPath), { recursive: true });
      await fs.promises.writeFile(configPath, JSON.stringify(defaultConfig, null, 2));
      console.log(`📝 Created default config at ${configPath}`);
    } catch (writeError) {
      // Couldn't create config, will use defaults
    }
  }
}

// Auto-initialize when this module is loaded
let statusLine = null;

// Only initialize if we're in a Claude Code environment
if (process.env.USER || process.env.USERNAME) {
  // Create default config if needed
  createDefaultConfig().then(() => {
    // Initialize the status line
    statusLine = initializeStatusLine();
    
    // Export for programmatic access
    module.exports.statusLine = statusLine;
  });
}

// Export initialization functions
module.exports = {
  initializeStatusLine,
  detectUserPreferences,
  getStatusLine: () => statusLine,
  
  // Manual control methods
  enable: () => {
    if (statusLine) statusLine.start();
  },
  disable: () => {
    if (statusLine) statusLine.stop();
  },
  configure: (options) => {
    if (statusLine) statusLine.configure(options);
  },
  getStats: () => {
    if (statusLine) return statusLine.getStats();
    return null;
  }
};
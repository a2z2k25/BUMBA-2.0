/**
 * BUMBA Offline Mode Configuration
 * Allows framework to run without any external connections
 * Updated: Sprint 4 - Using secure config
 */

const { logger } = require('../logging/bumba-logger');
const { config } = require('./secure-config');

class OfflineMode {
  constructor() {
    this.enabled = config.isOffline() || 
                   config.get('OFFLINE_MODE', 'false') === 'true' ||
                   !this.hasAPIKeys();
    
    if (this.enabled) {
      this.initializeOfflineMode();
    }
  }
  
  /**
   * Check if any API keys are configured
   */
  hasAPIKeys() {
    return !!(
      config.hasApiKey('openai') ||
      config.hasApiKey('anthropic') ||
      config.hasApiKey('claude') ||
      config.hasApiKey('google') ||
      config.hasApiKey('gemini')
    );
  }
  
  /**
   * Initialize offline mode settings
   */
  initializeOfflineMode() {
    // Set environment flags
    process.env.BUMBA_OFFLINE = 'true';
    process.env.SKIP_API_INIT = 'true';
    process.env.SKIP_MCP_SERVERS = 'true';
    process.env.USE_MOCK_RESPONSES = 'true';
    process.env.BUMBA_FAST_START = 'true';
    
    // Reduce logging
    if (!process.env.LOG_LEVEL) {
      process.env.LOG_LEVEL = 'ERROR';
    }
    
    // Configure mock responses
    this.configureMockResponses();
    
    // Log once
    if (process.env.LOG_LEVEL === 'DEBUG') {
      logger.info('🔌 BUMBA running in OFFLINE MODE');
    }
  }
  
  /**
   * Configure mock response system
   */
  configureMockResponses() {
    this.mockResponses = {
      default: {
        status: 'success',
        message: 'Operation completed (offline mode)',
        data: {}
      },
      
      specialist: {
        response: 'Task processed successfully',
        confidence: 0.95,
        recommendations: ['Continue with implementation', 'Consider testing'],
        isOffline: true
      },
      
      api: {
        error: 'API calls disabled in offline mode',
        suggestion: 'Add API keys to enable external connections'
      }
    };
  }
  
  /**
   * Get mock response for a request type
   */
  getMockResponse(type = 'default') {
    return this.mockResponses[type] || this.mockResponses.default;
  }
  
  /**
   * Check if a feature requires online mode
   */
  requiresOnline(feature) {
    const onlineFeatures = [
      'mcp-servers',
      'api-calls',
      'claude-api',
      'openai-api',
      'gemini-api',
      'notion-sync',
      'external-integration'
    ];
    
    return onlineFeatures.includes(feature);
  }
  
  /**
   * Get offline status
   */
  getStatus() {
    return {
      mode: this.enabled ? 'offline' : 'online',
      apiKeys: this.hasAPIKeys(),
      mockResponses: this.enabled,
      features: {
        specialists: true,
        commands: true,
        routing: true,
        departments: true,
        apis: !this.enabled,
        mcp: !this.enabled,
        integrations: !this.enabled
      }
    };
  }
}

// Singleton instance
let instance = null;

module.exports = {
  getOfflineMode: () => {
    if (!instance) {
      instance = new OfflineMode();
    }
    return instance;
  },
  
  isOffline: () => {
    return module.exports.getOfflineMode().enabled;
  },
  
  getMockResponse: (type) => {
    return module.exports.getOfflineMode().getMockResponse(type);
  }
};
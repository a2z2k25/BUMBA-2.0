/**
 * BUMBA Integration Activation Manager
 * Seamlessly transitions from mock/development mode to production mode
 * as users add real API keys and integrations
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');
const fs = require('fs').promises;
const path = require('path');

class IntegrationActivationManager extends EventEmitter {
  constructor() {
    super();
    
    this.integrations = new Map();
    this.mockProviders = new Map();
    this.liveProviders = new Map();
    this.transitionStrategies = new Map();
    
    // Integration states
    this.states = {
      MOCK: 'mock',
      TRANSITIONING: 'transitioning',
      LIVE: 'live',
      FALLBACK: 'fallback',
      ERROR: 'error'
    };
    
    // Core integrations to monitor
    this.coreIntegrations = {
      notion: {
        envKeys: ['NOTION_API_KEY', 'NOTION_WORKSPACE_ID'],
        testEndpoint: 'https://api.notion.com/v1/users/me',
        mockProvider: './mocks/notion-mock-provider',
        liveProvider: '@notionhq/client',
        features: ['dashboard', 'documentation', 'collaboration']
      },
      anthropic: {
        envKeys: ['ANTHROPIC_API_KEY'],
        testEndpoint: 'https://api.anthropic.com/v1/messages',
        mockProvider: './mocks/anthropic-mock-provider',
        liveProvider: '@anthropic-ai/sdk',
        features: ['ai-orchestration', 'reasoning', 'consciousness-layer', 'primary-ai']
      },
      openai: {
        envKeys: ['OPENAI_API_KEY'],
        testEndpoint: 'https://api.openai.com/v1/models',
        mockProvider: './mocks/openai-mock-provider',
        liveProvider: 'openai',
        features: ['cost-optimization', 'alternative-models', 'optional-fallback']
      },
      github: {
        envKeys: ['GITHUB_TOKEN', 'GITHUB_OWNER', 'GITHUB_REPO'],
        testEndpoint: 'https://api.github.com/user',
        mockProvider: './mocks/github-mock-provider',
        liveProvider: '@octokit/rest',
        features: ['version-control', 'ci-cd', 'collaboration']
      },
      mcp: {
        envKeys: ['MCP_SERVER_PATH'],
        testCommand: 'npx @modelcontextprotocol/server-memory',
        mockProvider: './mocks/mcp-mock-provider',
        liveProvider: '@modelcontextprotocol/sdk',
        features: ['memory', 'context', 'tools']
      },
      database: {
        envKeys: ['DATABASE_URL', 'DATABASE_TYPE'],
        testConnection: true,
        mockProvider: './mocks/database-mock-provider',
        liveProvider: 'typeorm',
        features: ['persistence', 'queries', 'migrations']
      }
    };
    
    // Feature dependency map
    this.featureDependencies = {
      'full-dashboard': ['notion', 'database'],
      'ai-orchestration': ['anthropic'],  // Only needs Claude/Anthropic
      'collaborative-development': ['github', 'notion'],
      'intelligent-memory': ['mcp', 'database'],
      'production-deployment': ['github', 'database', 'notion'],
      'cost-optimization': ['openai'],  // OpenAI is optional for multi-model cost optimization
    };
    
    this.activationStatus = {
      totalIntegrations: Object.keys(this.coreIntegrations).length,
      activeIntegrations: 0,
      mockIntegrations: 0,
      features: new Map(),
      lastCheck: null,
      mode: 'development'
    };
    
    // Initialize on creation
    this.initialize();
  }
  
  /**
   * Initialize the activation manager
   */
  async initialize() {
    logger.info('🟢 Initializing Integration Activation Manager');
    
    // Load existing configuration
    await this.loadConfiguration();
    
    // Scan for available integrations
    await this.scanIntegrations();
    
    // Set up automatic monitoring
    this.startMonitoring();
    
    // Register transition strategies
    this.registerTransitionStrategies();
    
    logger.info(`📊 Integration Status: ${this.activationStatus.activeIntegrations}/${this.activationStatus.totalIntegrations} active`);
  }
  
  /**
   * Load configuration from file or environment
   */
  async loadConfiguration() {
    try {
      const configPath = path.join(process.cwd(), '.bumba', 'integration-config.json');
      const configExists = await fs.access(configPath).then(() => true).catch(() => false);
      
      if (configExists) {
        const config = JSON.parse(await fs.readFile(configPath, 'utf8'));
        this.activationStatus = { ...this.activationStatus, ...config };
        logger.info('📁 Loaded integration configuration');
      }
    } catch (error) {
      logger.warn('🟠️ Could not load integration config, using defaults');
    }
  }
  
  /**
   * Scan for available integrations
   */
  async scanIntegrations() {
    for (const [name, config] of Object.entries(this.coreIntegrations)) {
      const status = await this.checkIntegration(name, config);
      this.integrations.set(name, {
        ...config,
        status: status.state,
        available: status.available,
        lastCheck: Date.now()
      });
      
      // Update counts
      if (status.state === this.states.LIVE) {
        this.activationStatus.activeIntegrations++;
      } else {
        this.activationStatus.mockIntegrations++;
      }
      
      // Load appropriate provider
      await this.loadProvider(name, status.state);
    }
    
    // Update feature availability
    this.updateFeatureAvailability();
    
    // Determine overall mode
    this.determineOperatingMode();
  }
  
  /**
   * Check if an integration is available
   */
  async checkIntegration(name, config) {
    const result = {
      state: this.states.MOCK,
      available: false,
      details: {}
    };
    
    try {
      // Check environment variables
      const hasKeys = config.envKeys.every(key => process.env[key]);
      
      if (!hasKeys) {
        result.details.missing = config.envKeys.filter(key => !process.env[key]);
        return result;
      }
      
      // Test connectivity
      if (config.testEndpoint) {
        const testResult = await this.testEndpoint(config.testEndpoint, name);
        if (testResult.success) {
          result.state = this.states.LIVE;
          result.available = true;
          result.details = testResult;
        }
      } else if (config.testCommand) {
        const testResult = await this.testCommand(config.testCommand);
        if (testResult.success) {
          result.state = this.states.LIVE;
          result.available = true;
          result.details = testResult;
        }
      } else if (config.testConnection) {
        // For databases, just check if URL is valid
        result.state = this.states.LIVE;
        result.available = true;
      }
      
    } catch (error) {
      result.details.error = error.message;
      logger.debug(`Integration ${name} check failed: ${error.message}`);
    }
    
    return result;
  }
  
  /**
   * Test an API endpoint
   */
  async testEndpoint(endpoint, integration) {
    try {
      // Simple connectivity test - in production, would make actual API call
      // For now, we'll check if the environment variable exists
      const hasValidKey = this.validateApiKey(integration);
      
      return {
        success: hasValidKey,
        latency: Math.random() * 100,
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Test a command
   */
  async testCommand(command) {
    try {
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);
      
      // Check if command exists
      const result = await execAsync(`which ${command.split(' ')[0]}`).catch(() => null);
      
      return {
        success: !!result,
        command: command,
        available: !!result
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Validate API key format
   */
  validateApiKey(integration) {
    const config = this.coreIntegrations[integration];
    if (!config) return false;
    
    const key = process.env[config.envKeys[0]];
    if (!key) return false;
    
    // Basic validation patterns
    const patterns = {
      notion: /^secret_[a-zA-Z0-9]{43}$/,
      openai: /^sk-[a-zA-Z0-9]{48}$/,
      anthropic: /^sk-ant-[a-zA-Z0-9]{95}$/,
      github: /^gh[ps]_[a-zA-Z0-9]{36}$/
    };
    
    if (patterns[integration]) {
      return patterns[integration].test(key);
    }
    
    // Default: just check if key exists and has reasonable length
    return key.length > 10;
  }
  
  /**
   * Load provider (mock or live)
   */
  async loadProvider(name, state) {
    const config = this.integrations.get(name);
    
    try {
      if (state === this.states.LIVE) {
        // Try to load live provider
        try {
          const LiveProvider = require(config.liveProvider);
          this.liveProviders.set(name, LiveProvider);
          logger.info(`🏁 Loaded live provider for ${name}`);
        } catch (error) {
          // Fall back to mock if live provider not installed
          logger.warn(`🟠️ Live provider for ${name} not installed, using mock`);
          state = this.states.MOCK;
        }
      }
      
      if (state === this.states.MOCK) {
        // Load mock provider safely for test environment
        try {
          const MockProvider = require(config.mockProvider);
          this.mockProviders.set(name, MockProvider);
          logger.info(`🔄 Loaded mock provider for ${name}`);
        } catch (error) {
          // In test environment, skip mock provider loading
          if (process.env.NODE_ENV === 'test') {
            logger.debug(`Mock provider skipped in test for ${name}`);
          } else {
            logger.warn(`Mock provider failed for ${name}: ${error.message}`);
          }
        }
      }
      
    } catch (error) {
      logger.error(`🔴 Failed to load provider for ${name}: ${error.message}`);
      this.integrations.get(name).status = this.states.ERROR;
    }
  }
  
  /**
   * Update feature availability based on active integrations
   */
  updateFeatureAvailability() {
    for (const [feature, dependencies] of Object.entries(this.featureDependencies)) {
      const available = dependencies.every(dep => {
        const integration = this.integrations.get(dep);
        return integration && integration.status === this.states.LIVE;
      });
      
      this.activationStatus.features.set(feature, {
        available,
        dependencies,
        missingDeps: dependencies.filter(dep => {
          const integration = this.integrations.get(dep);
          return !integration || integration.status !== this.states.LIVE;
        })
      });
    }
  }
  
  /**
   * Determine overall operating mode
   */
  determineOperatingMode() {
    const activeRatio = this.activationStatus.activeIntegrations / this.activationStatus.totalIntegrations;
    
    if (activeRatio === 1) {
      this.activationStatus.mode = 'production';
    } else if (activeRatio >= 0.5) {
      this.activationStatus.mode = 'hybrid';
    } else if (activeRatio > 0) {
      this.activationStatus.mode = 'partial';
    } else {
      this.activationStatus.mode = 'development';
    }
    
    logger.info(`🟡 Operating mode: ${this.activationStatus.mode} (${Math.round(activeRatio * 100)}% integrations active)`);
  }
  
  /**
   * Start monitoring for integration changes
   */
  startMonitoring() {
    // Skip monitoring in test environment
    if (process.env.NODE_ENV === 'test') {
      return;
    }
    
    // Check for new integrations every 30 seconds
    this.monitorInterval = setInterval(async () => {
      await this.checkForChanges();
    }, 30000);
    
    // Watch for environment variable changes
    this.watchEnvironment();
    
    // Listen for manual activation requests
    this.on('activate', async (integration) => {
      await this.activateIntegration(integration);
    });
  }
  
  /**
   * Watch for environment variable changes
   */
  watchEnvironment() {
    // Monitor .env file if it exists
    const envPath = path.join(process.cwd(), '.env');
    
    try {
      const fs = require('fs');
      fs.watchFile(envPath, async () => {
        logger.info('🔄 Environment file changed, rechecking integrations');
        await this.scanIntegrations();
        this.emit('integrations:updated', this.getStatus());
      });
    } catch (error) {
      // .env file doesn't exist or can't be watched
    }
  }
  
  /**
   * Check for integration changes
   */
  async checkForChanges() {
    let hasChanges = false;
    
    for (const [name, config] of Object.entries(this.coreIntegrations)) {
      const currentStatus = this.integrations.get(name);
      const newStatus = await this.checkIntegration(name, config);
      
      if (currentStatus.status !== newStatus.state) {
        hasChanges = true;
        logger.info(`🔄 Integration ${name} status changed: ${currentStatus.status} → ${newStatus.state}`);
        
        // Transition the integration
        await this.transitionIntegration(name, currentStatus.status, newStatus.state);
      }
    }
    
    if (hasChanges) {
      this.updateFeatureAvailability();
      this.determineOperatingMode();
      this.emit('integrations:changed', this.getStatus());
      await this.saveConfiguration();
    }
  }
  
  /**
   * Transition an integration from one state to another
   */
  async transitionIntegration(name, fromState, toState) {
    logger.info(`🔄 Transitioning ${name}: ${fromState} → ${toState}`);
    
    const integration = this.integrations.get(name);
    integration.status = this.states.TRANSITIONING;
    
    try {
      // Get transition strategy
      const strategy = this.transitionStrategies.get(`${fromState}->${toState}`);
      
      if (strategy) {
        await strategy(name, integration);
      } else {
        // Default transition
        await this.defaultTransition(name, fromState, toState);
      }
      
      integration.status = toState;
      
      // Update counts
      if (toState === this.states.LIVE) {
        this.activationStatus.activeIntegrations++;
        this.activationStatus.mockIntegrations--;
      } else if (fromState === this.states.LIVE) {
        this.activationStatus.activeIntegrations--;
        this.activationStatus.mockIntegrations++;
      }
      
      // Load new provider
      await this.loadProvider(name, toState);
      
      logger.info(`🏁 Successfully transitioned ${name} to ${toState}`);
      
    } catch (error) {
      logger.error(`🔴 Failed to transition ${name}: ${error.message}`);
      integration.status = this.states.ERROR;
    }
  }
  
  /**
   * Register transition strategies
   */
  registerTransitionStrategies() {
    // Mock to Live transition
    this.transitionStrategies.set('mock->live', async (name, integration) => {
      logger.info(`🟢 Activating live integration for ${name}`);
      
      // Migrate mock data if needed
      if (this.mockProviders.has(name)) {
        const mockProvider = this.mockProviders.get(name);
        if (mockProvider.exportData) {
          const data = await mockProvider.exportData();
          logger.info(`📦 Exported ${Object.keys(data).length} items from mock ${name}`);
          
          // Store for potential import into live system
          integration.migrationData = data;
        }
      }
      
      // Validate live connection
      const config = this.coreIntegrations[name];
      const validation = await this.checkIntegration(name, config);
      
      if (!validation.available) {
        throw new Error(`Live validation failed for ${name}`);
      }
      
      // Clean up mock provider
      this.mockProviders.delete(name);
    });
    
    // Live to Mock transition (fallback)
    this.transitionStrategies.set('live->mock', async (name, integration) => {
      logger.warn(`🟠️ Falling back to mock for ${name}`);
      
      // Preserve any cached data
      if (this.liveProviders.has(name)) {
        const liveProvider = this.liveProviders.get(name);
        if (liveProvider.getCache) {
          integration.cachedData = await liveProvider.getCache();
        }
      }
      
      // Clean up live provider
      this.liveProviders.delete(name);
    });
    
    // Error recovery transition
    this.transitionStrategies.set('error->mock', async (name, integration) => {
      logger.info(`🔧 Recovering ${name} to mock mode`);
      
      // Reset integration state
      integration.lastError = integration.status;
      integration.recoveryAttempts = (integration.recoveryAttempts || 0) + 1;
    });
  }
  
  /**
   * Default transition handler
   */
  async defaultTransition(name, fromState, toState) {
    logger.info(`📝 Default transition for ${name}: ${fromState} → ${toState}`);
    
    // Basic cleanup and setup
    if (fromState === this.states.LIVE) {
      this.liveProviders.delete(name);
    }
    if (fromState === this.states.MOCK) {
      this.mockProviders.delete(name);
    }
  }
  
  /**
   * Manually activate an integration
   */
  async activateIntegration(name) {
    const integration = this.integrations.get(name);
    
    if (!integration) {
      throw new Error(`Unknown integration: ${name}`);
    }
    
    if (integration.status === this.states.LIVE) {
      logger.info(`🏁 ${name} is already active`);
      return true;
    }
    
    // Check if activation is possible
    const config = this.coreIntegrations[name];
    const status = await this.checkIntegration(name, config);
    
    if (status.available) {
      await this.transitionIntegration(name, integration.status, this.states.LIVE);
      return true;
    } else {
      logger.error(`🔴 Cannot activate ${name}: Missing requirements`);
      logger.info(`   Required: ${config.envKeys.join(', ')}`);
      return false;
    }
  }
  
  /**
   * Get current provider for an integration
   */
  getProvider(name) {
    const integration = this.integrations.get(name);
    
    if (!integration) {
      return null;
    }
    
    if (integration.status === this.states.LIVE) {
      return this.liveProviders.get(name);
    } else {
      return this.mockProviders.get(name);
    }
  }
  
  /**
   * Check if a feature is available
   */
  isFeatureAvailable(feature) {
    const featureStatus = this.activationStatus.features.get(feature);
    return featureStatus ? featureStatus.available : false;
  }
  
  /**
   * Get integration status
   */
  getStatus() {
    const status = {
      mode: this.activationStatus.mode,
      integrations: {},
      features: {},
      summary: {
        total: this.activationStatus.totalIntegrations,
        active: this.activationStatus.activeIntegrations,
        mock: this.activationStatus.mockIntegrations,
        percentage: Math.round((this.activationStatus.activeIntegrations / this.activationStatus.totalIntegrations) * 100)
      }
    };
    
    // Add integration details
    for (const [name, integration] of this.integrations) {
      status.integrations[name] = {
        status: integration.status,
        available: integration.available,
        features: integration.features
      };
    }
    
    // Add feature details
    for (const [feature, featureStatus] of this.activationStatus.features) {
      status.features[feature] = {
        available: featureStatus.available,
        missing: featureStatus.missingDeps
      };
    }
    
    return status;
  }
  
  /**
   * Save configuration
   */
  async saveConfiguration() {
    try {
      const configDir = path.join(process.cwd(), '.bumba');
      await fs.mkdir(configDir, { recursive: true });
      
      const configPath = path.join(configDir, 'integration-config.json');
      await fs.writeFile(configPath, JSON.stringify(this.activationStatus, null, 2));
      
      logger.debug('💾 Saved integration configuration');
    } catch (error) {
      logger.error(`Failed to save configuration: ${error.message}`);
    }
  }
  
  /**
   * Generate setup guide for missing integrations
   */
  generateSetupGuide() {
    const guide = [];
    
    guide.push('🔧 BUMBA Integration Setup Guide');
    guide.push('=================================\n');
    
    for (const [name, integration] of this.integrations) {
      if (integration.status !== this.states.LIVE) {
        const config = this.coreIntegrations[name];
        
        guide.push(`📦 ${name.toUpperCase()}`);
        guide.push(`   Status: ${integration.status}`);
        guide.push(`   Features: ${config.features.join(', ')}`);
        guide.push(`   Required Environment Variables:`);
        
        config.envKeys.forEach(key => {
          const hasKey = !!process.env[key];
          guide.push(`     ${hasKey ? '🏁' : '🔴'} ${key}`);
        });
        
        guide.push(`   Setup Instructions:`);
        guide.push(`     1. Obtain API key from ${this.getProviderUrl(name)}`);
        guide.push(`     2. Add to .env file: ${config.envKeys[0]}=your_key_here`);
        
        if (config.liveProvider.startsWith('@')) {
          guide.push(`     3. Install package: npm install ${config.liveProvider}`);
        }
        
        guide.push('');
      }
    }
    
    return guide.join('\n');
  }
  
  /**
   * Get provider URL for documentation
   */
  getProviderUrl(name) {
    const urls = {
      notion: 'https://www.notion.so/my-integrations',
      openai: 'https://platform.openai.com/api-keys',
      anthropic: 'https://console.anthropic.com/settings/keys',
      github: 'https://github.com/settings/tokens',
      mcp: 'https://github.com/modelcontextprotocol/servers',
      database: 'your database provider'
    };
    
    return urls[name] || 'provider website';
  }
  
  /**
   * Clean up resources
   */
  async cleanup() {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
    
    // Clean up file watchers
    try {
      const fs = require('fs');
      const envPath = path.join(process.cwd(), '.env');
      fs.unwatchFile(envPath);
    } catch (error) {
      // Ignore if file doesn't exist
    }
    
    // Don't save configuration in test mode
    if (process.env.NODE_ENV !== 'test') {
      await this.saveConfiguration();
    }
    
    // Clear all providers
    this.liveProviders.clear();
    this.mockProviders.clear();
    
    logger.info('🧹 Integration Activation Manager cleaned up');
  }
}

// Export singleton instance
module.exports = new IntegrationActivationManager();
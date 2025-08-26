/**
 * BUMBA Framework Quick Start Module
 * Zero-configuration initialization for new users
 */

const fs = require('fs');
const path = require('path');
const { logger } = require('./logging/bumba-logger');

class BumbaQuickStart {
  constructor() {
    this.defaultConfig = {
      mode: 'development',
      features: {
        monitoring: false,
        audio: false,
        mcp: false,
        parallelExecution: false
      },
      integrations: 'mock',
      performance: {
        caching: true,
        pooling: false
      }
    };
  }

  /**
   * Initialize with zero configuration
   */
  async initialize() {
    logger.info('🟢 BUMBA Quick Start - Zero Configuration Mode');
    
    // Check if already configured
    if (this.isConfigured()) {
      logger.info('🏁 BUMBA already configured');
      return this.loadExistingConfig();
    }
    
    // Create minimal configuration
    await this.createMinimalConfig();
    
    // Set environment variables for quick start
    this.setQuickStartEnvironment();
    
    // Create necessary directories
    await this.createDirectories();
    
    logger.info('🏁 BUMBA Quick Start initialization complete');
    
    return {
      mode: 'quick-start',
      config: this.defaultConfig,
      ready: true
    };
  }

  /**
   * Check if framework is already configured
   */
  isConfigured() {
    const configPaths = [
      path.join(process.cwd(), '.bumba-config.json'),
      path.join(process.cwd(), '.env'),
      path.join(process.cwd(), 'bumba.config.js')
    ];
    
    return configPaths.some(p => fs.existsSync(p));
  }

  /**
   * Load existing configuration
   */
  loadExistingConfig() {
    const configPath = path.join(process.cwd(), '.bumba-config.json');
    
    if (fs.existsSync(configPath)) {
      try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        return {
          mode: 'configured',
          config,
          ready: true
        };
      } catch (error) {
        logger.warn('Failed to load existing config, using defaults');
      }
    }
    
    return {
      mode: 'quick-start',
      config: this.defaultConfig,
      ready: true
    };
  }

  /**
   * Create minimal configuration file
   */
  async createMinimalConfig() {
    const configPath = path.join(process.cwd(), '.bumba-config.json');
    
    const minimalConfig = {
      version: '2.0.0',
      mode: 'quick-start',
      created: new Date().toISOString(),
      ...this.defaultConfig
    };
    
    try {
      fs.writeFileSync(configPath, JSON.stringify(minimalConfig, null, 2));
      logger.info('🏁 Created minimal configuration');
    } catch (error) {
      logger.warn('Could not create config file, using in-memory config');
    }
  }

  /**
   * Set environment variables for quick start
   */
  setQuickStartEnvironment() {
    // Disable features that require configuration
    process.env.BUMBA_MODE = 'quick-start';
    process.env.BUMBA_DISABLE_MONITORING = 'true';
    process.env.BUMBA_DISABLE_AUDIO = 'true';
    process.env.BUMBA_DISABLE_MCP = 'true';
    process.env.BUMBA_USE_MOCKS = 'true';
    process.env.BUMBA_PARALLEL = 'false';
    
    // Set sensible defaults
    process.env.BUMBA_LOG_LEVEL = 'info';
    process.env.BUMBA_MAX_MEMORY = '256';
    process.env.BUMBA_MAX_AGENTS = '5';
    
    logger.info('🏁 Set quick start environment variables');
  }

  /**
   * Create necessary directories
   */
  async createDirectories() {
    const dirs = [
      path.join(process.cwd(), '.bumba'),
      path.join(process.cwd(), '.bumba', 'cache'),
      path.join(process.cwd(), '.bumba', 'logs'),
      path.join(process.cwd(), '.bumba', 'tmp')
    ];
    
    for (const dir of dirs) {
      try {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
      } catch (error) {
        logger.warn(`Could not create directory: ${dir}`);
      }
    }
    
    logger.info('🏁 Created necessary directories');
  }

  /**
   * Show quick start guide
   */
  showQuickStartGuide() {
    const guide = `
╔══════════════════════════════════════════════════════════════╗
║                 🟢 BUMBA Quick Start Guide                   ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  You're running BUMBA in Quick Start mode!                  ║
║                                                              ║
║  Available Commands:                                        ║
║  • /bumba:help     - Show available commands                ║
║  • /bumba:menu     - Interactive command menu               ║
║  • /bumba:status   - Check system status                    ║
║  • /bumba:settings - Configure framework                    ║
║                                                              ║
║  To enable full features:                                   ║
║  1. Run: /bumba:settings                                    ║
║  2. Add your API keys to .env file                         ║
║  3. Install MCP servers as needed                          ║
║                                                              ║
║  Quick Start Limitations:                                   ║
║  • No parallel agent execution                             ║
║  • Mock integrations only                                  ║
║  • Limited monitoring                                      ║
║  • No audio feedback                                       ║
║                                                              ║
║  For full documentation:                                    ║
║  https://github.com/your-repo/bumba                        ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
    `;
    
    console.log(guide);
  }

  /**
   * Progressive feature enablement
   */
  async enableFeature(feature) {
    const configPath = path.join(process.cwd(), '.bumba-config.json');
    
    try {
      let config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      
      if (!config.features) {
        config.features = {};
      }
      
      config.features[feature] = true;
      
      // Update environment variables
      switch (feature) {
        case 'monitoring':
          delete process.env.BUMBA_DISABLE_MONITORING;
          break;
        case 'audio':
          delete process.env.BUMBA_DISABLE_AUDIO;
          break;
        case 'mcp':
          delete process.env.BUMBA_DISABLE_MCP;
          break;
        case 'parallelExecution':
          process.env.BUMBA_PARALLEL = 'true';
          break;
      }
      
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
      
      logger.info(`🏁 Enabled feature: ${feature}`);
      return true;
      
    } catch (error) {
      logger.error(`Failed to enable feature ${feature}: ${error.message}`);
      return false;
    }
  }

  /**
   * Check system readiness
   */
  checkReadiness() {
    const checks = {
      directories: this.checkDirectories(),
      configuration: this.checkConfiguration(),
      memory: this.checkMemory(),
      permissions: this.checkPermissions()
    };
    
    const ready = Object.values(checks).every(check => check);
    
    return {
      ready,
      checks,
      mode: process.env.BUMBA_MODE || 'quick-start'
    };
  }

  checkDirectories() {
    return fs.existsSync(path.join(process.cwd(), '.bumba'));
  }

  checkConfiguration() {
    return fs.existsSync(path.join(process.cwd(), '.bumba-config.json'));
  }

  checkMemory() {
    const used = process.memoryUsage();
    const limit = parseInt(process.env.BUMBA_MAX_MEMORY || '256') * 1024 * 1024;
    return used.heapUsed < limit;
  }

  checkPermissions() {
    try {
      const testPath = path.join(process.cwd(), '.bumba', 'test-write');
      fs.writeFileSync(testPath, 'test');
      fs.unlinkSync(testPath);
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
module.exports = new BumbaQuickStart();
/**
 * BUMBA Configuration Bridge
 * Manages configuration across terminal and Claude environments
 */

const fs = require('fs').promises;
const path = require('path');
const os = require('os');

class ConfigBridge {
  constructor() {
    this.configPaths = {
      global: path.join(os.homedir(), '.bumba', 'config.json'),
      local: path.join(process.cwd(), '.bumba', 'config.json'),
      project: path.join(process.cwd(), 'bumba.config.js')
    };
    
    this.defaultConfig = {
      version: '3.0.0',
      modes: {
        bridge: {
          taskDir: '.bumba/tasks',
          contextDir: '.bumba/context',
          autoAnalyze: true
        },
        enhancement: {
          autoActivate: true,
          visionEnabled: true,
          multiAgent: true
        },
        hybrid: {
          defaultMode: 'auto',
          switchable: true
        }
      },
      agents: {
        parallel: true,
        maxConcurrent: 4,
        timeout: 300000
      },
      quality: {
        autoTest: true,
        securityScan: true,
        linting: true
      },
      ui: {
        theme: 'default',
        emojis: ['🟢', '🟡', '🟠', '🔴', '🏁'],
        colors: true
      }
    };
    
    this.config = null;
  }

  /**
   * Load configuration from all sources
   * @returns {Promise<Object>} Merged configuration
   */
  async load() {
    const configs = [];
    
    // Load global config
    try {
      const globalConfig = await this.loadFile(this.configPaths.global);
      if (globalConfig) configs.push(globalConfig);
    } catch (error) {
      // Global config might not exist
    }
    
    // Load local config
    try {
      const localConfig = await this.loadFile(this.configPaths.local);
      if (localConfig) configs.push(localConfig);
    } catch (error) {
      // Local config might not exist
    }
    
    // Load project config
    try {
      const projectConfig = this.loadProjectConfig();
      if (projectConfig) configs.push(projectConfig);
    } catch (error) {
      // Project config might not exist
    }
    
    // Merge configurations (later configs override earlier ones)
    this.config = this.mergeConfigs(this.defaultConfig, ...configs);
    
    return this.config;
  }

  /**
   * Load configuration file
   * @param {string} filePath Path to config file
   * @returns {Promise<Object>} Configuration object
   */
  async loadFile(filePath) {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  }

  /**
   * Load project configuration (JS file)
   * @returns {Object} Project configuration
   */
  loadProjectConfig() {
    try {
      delete require.cache[require.resolve(this.configPaths.project)];
      return require(this.configPaths.project);
    } catch (error) {
      return null;
    }
  }

  /**
   * Save configuration
   * @param {Object} config Configuration to save
   * @param {string} target Target location ('global', 'local', 'project')
   * @returns {Promise<void>}
   */
  async save(config, target = 'local') {
    const filePath = this.configPaths[target];
    
    // Ensure directory exists
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    
    if (target === 'project') {
      // Save as JS module
      const content = this.generateJSConfig(config);
      await fs.writeFile(filePath, content);
    } else {
      // Save as JSON
      await fs.writeFile(filePath, JSON.stringify(config, null, 2));
    }
  }

  /**
   * Merge multiple configuration objects
   * @param {...Object} configs Configuration objects
   * @returns {Object} Merged configuration
   */
  mergeConfigs(...configs) {
    return configs.reduce((merged, config) => {
      return this.deepMerge(merged, config);
    }, {});
  }

  /**
   * Deep merge two objects
   * @param {Object} target Target object
   * @param {Object} source Source object
   * @returns {Object} Merged object
   */
  deepMerge(target, source) {
    const output = { ...target };
    
    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach(key => {
        if (this.isObject(source[key])) {
          if (!(key in target)) {
            output[key] = source[key];
          } else {
            output[key] = this.deepMerge(target[key], source[key]);
          }
        } else {
          output[key] = source[key];
        }
      });
    }
    
    return output;
  }

  /**
   * Check if value is an object
   * @param {*} item Value to check
   * @returns {boolean}
   */
  isObject(item) {
    return item && typeof item === 'object' && !Array.isArray(item);
  }

  /**
   * Get configuration value
   * @param {string} path Dot-notation path
   * @param {*} defaultValue Default value
   * @returns {*} Configuration value
   */
  get(path, defaultValue = undefined) {
    if (!this.config) {
      throw new Error('Configuration not loaded. Call load() first.');
    }
    
    const keys = path.split('.');
    let value = this.config;
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return defaultValue;
      }
    }
    
    return value;
  }

  /**
   * Set configuration value
   * @param {string} path Dot-notation path
   * @param {*} value Value to set
   */
  set(path, value) {
    if (!this.config) {
      this.config = { ...this.defaultConfig };
    }
    
    const keys = path.split('.');
    const lastKey = keys.pop();
    let target = this.config;
    
    for (const key of keys) {
      if (!(key in target) || typeof target[key] !== 'object') {
        target[key] = {};
      }
      target = target[key];
    }
    
    target[lastKey] = value;
  }

  /**
   * Initialize configuration for new project
   * @param {Object} projectInfo Project information
   * @returns {Promise<void>}
   */
  async initialize(projectInfo = {}) {
    const config = {
      ...this.defaultConfig,
      project: {
        name: projectInfo.name || path.basename(process.cwd()),
        created: new Date().toISOString(),
        ...projectInfo
      }
    };
    
    await this.save(config, 'local');
    this.config = config;
  }

  /**
   * Generate JS configuration content
   * @param {Object} config Configuration object
   * @returns {string} JS module content
   */
  generateJSConfig(config) {
    return `/**
 * BUMBA Framework Configuration
 * Generated: ${new Date().toISOString()}
 * Version: ${config.version || '3.0.0'}
 */

module.exports = ${JSON.stringify(config, null, 2)};
`;
  }

  /**
   * Validate configuration
   * @param {Object} config Configuration to validate
   * @returns {Object} Validation result
   */
  validate(config) {
    const errors = [];
    const warnings = [];
    
    // Check version
    if (!config.version) {
      errors.push('Missing version field');
    }
    
    // Check modes
    if (!config.modes) {
      errors.push('Missing modes configuration');
    } else {
      if (!config.modes.bridge) warnings.push('Missing bridge mode config');
      if (!config.modes.enhancement) warnings.push('Missing enhancement mode config');
    }
    
    // Check UI emojis
    if (config.ui?.emojis) {
      const validEmojis = ['🟢', '🟡', '🟠', '🔴', '🏁'];
      const invalidEmojis = config.ui.emojis.filter(e => !validEmojis.includes(e));
      if (invalidEmojis.length > 0) {
        errors.push(`Invalid emojis: ${invalidEmojis.join(', ')}`);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Export configuration for Claude
   * @returns {Object} Claude-compatible configuration
   */
  exportForClaude() {
    if (!this.config) {
      throw new Error('Configuration not loaded');
    }
    
    return {
      version: this.config.version,
      modes: this.config.modes.enhancement,
      agents: this.config.agents,
      quality: this.config.quality,
      project: this.config.project
    };
  }

  /**
   * Import configuration from Claude
   * @param {Object} claudeConfig Claude configuration
   * @returns {Object} Merged configuration
   */
  importFromClaude(claudeConfig) {
    const bridgeConfig = {
      modes: {
        enhancement: claudeConfig.modes
      },
      agents: claudeConfig.agents,
      quality: claudeConfig.quality
    };
    
    this.config = this.mergeConfigs(this.config || this.defaultConfig, bridgeConfig);
    return this.config;
  }

  /**
   * Get configuration summary
   * @returns {Object} Configuration summary
   */
  getSummary() {
    if (!this.config) {
      return { error: 'Configuration not loaded' };
    }
    
    return {
      version: this.config.version,
      project: this.config.project?.name,
      mode: this.detectMode(),
      features: {
        multiAgent: this.config.modes?.enhancement?.multiAgent,
        vision: this.config.modes?.enhancement?.visionEnabled,
        autoTest: this.config.quality?.autoTest,
        parallel: this.config.agents?.parallel
      }
    };
  }

  /**
   * Detect current mode from configuration
   * @returns {string} Current mode
   */
  detectMode() {
    const EnvironmentDetector = require('./environment-detector');
    return EnvironmentDetector.getMode();
  }
}

module.exports = ConfigBridge;
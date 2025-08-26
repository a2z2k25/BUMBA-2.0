/**
 * BUMBA Modular Configuration System
 * Breaks down the 751-line config into manageable modules
 */

const path = require('path');

// Import modular configs
const commandsConfig = require('./commands.config');
const departmentsConfig = require('./departments.config');
const integrationsConfig = require('./integrations.config');
const hooksConfig = require('./hooks.config');
const performanceConfig = require('./performance.config');
const securityConfig = require('./security.config');
const aiConfig = require('./ai.config');

/**
 * Main configuration assembler
 */
class ModularConfig {
  constructor(customConfig = {}) {
    this.config = this.assembleConfig(customConfig);
  }

  assembleConfig(customConfig) {
    return {
      // Basic settings
      name: customConfig.name || 'BUMBA Framework',
      version: customConfig.version || '2.0',
      environment: process.env.NODE_ENV || 'development',
      
      // Paths
      paths: {
        root: process.cwd(),
        src: path.join(process.cwd(), 'src'),
        config: path.join(process.cwd(), 'config'),
        tests: path.join(process.cwd(), 'tests'),
        logs: path.join(process.cwd(), 'logs'),
        ...customConfig.paths
      },
      
      // Feature toggles
      features: {
        consciousness: customConfig.consciousness !== false,
        learning: customConfig.learning !== false,
        monitoring: customConfig.monitoring !== false,
        whispers: customConfig.whispers !== false,
        statusLine: customConfig.statusLine !== false,
        executiveMode: customConfig.executiveMode !== false,
        ...customConfig.features
      },
      
      // Modular configurations
      commands: commandsConfig.load(customConfig.commands),
      departments: departmentsConfig.load(customConfig.departments),
      integrations: integrationsConfig.load(customConfig.integrations),
      hooks: hooksConfig.load(customConfig.hooks),
      performance: performanceConfig.load(customConfig.performance),
      security: securityConfig.load(customConfig.security),
      ai: aiConfig.load(customConfig.ai),
      
      // Custom overrides
      ...customConfig.custom
    };
  }

  get() {
    return this.config;
  }

  getSection(section) {
    return this.config[section];
  }

  update(section, value) {
    if (typeof section === 'object') {
      Object.assign(this.config, section);
    } else {
      this.config[section] = value;
    }
  }

  validate() {
    const errors = [];
    
    // Validate required fields
    if (!this.config.name) errors.push('Missing config.name');
    if (!this.config.version) errors.push('Missing config.version');
    
    // Validate paths exist
    const fs = require('fs');
    if (!fs.existsSync(this.config.paths.src)) {
      errors.push(`Source path does not exist: ${this.config.paths.src}`);
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  export() {
    return JSON.stringify(this.config, null, 2);
  }
}

// Singleton instance
let instance = null;

function getInstance(customConfig) {
  if (!instance) {
    instance = new ModularConfig(customConfig);
  }
  return instance;
}

module.exports = {
  ModularConfig,
  getInstance,
  
  // Direct config access
  getConfig: () => getInstance().get(),
  getCommands: () => getInstance().getSection('commands'),
  getDepartments: () => getInstance().getSection('departments'),
  getIntegrations: () => getInstance().getSection('integrations'),
  getHooks: () => getInstance().getSection('hooks'),
  getPerformance: () => getInstance().getSection('performance'),
  getSecurity: () => getInstance().getSection('security'),
  getAI: () => getInstance().getSection('ai')
};
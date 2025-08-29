/**
 * BUMBA Environment Configuration Helper
 * Simplifies environment setup and provides intelligent defaults
 */

const fs = require('fs');
const path = require('path');
const { logger } = require('../logging/bumba-logger');

class EnvironmentHelper {
  constructor() {
    this.envPath = path.join(process.cwd(), '.env');
    this.simpleEnvPath = path.join(process.cwd(), '.env.simple');
    this.configured = false;
    this.mode = 'unconfigured';
  }

  /**
   * Auto-configure environment with intelligent defaults
   */
  async autoConfig() {
    logger.info('🔧 Auto-configuring BUMBA environment...');
    
    // Check current state
    const state = this.checkEnvironmentState();
    
    switch (state) {
      case 'configured':
        logger.info('🏁 Environment already configured');
        return { success: true, mode: 'configured' };
        
      case 'simple':
        return await this.upgradeFromSimple();
        
      case 'empty':
        return await this.createMinimalEnv();
        
      default:
        return await this.createMinimalEnv();
    }
  }

  /**
   * Check current environment state
   */
  checkEnvironmentState() {
    if (fs.existsSync(this.envPath)) {
      const content = fs.readFileSync(this.envPath, 'utf8');
      
      // Check if it has actual configuration
      if (content.includes('BUMBA_ENABLED=true')) {
        return 'configured';
      }
      
      // Check if it's using simple template
      if (content.includes('# BUMBA Simple Configuration')) {
        return 'simple';
      }
      
      return 'partial';
    }
    
    return 'empty';
  }

  /**
   * Create minimal .env file
   */
  async createMinimalEnv() {
    const minimal = `# BUMBA CLI Configuration
# Generated automatically - customize as needed

# Core Settings
BUMBA_ENABLED=true
BUMBA_ENV=development
BUMBA_MODE=quick-start

# Features (disabled by default for quick start)
BUMBA_PARALLEL=false
BUMBA_ENABLE_MONITORING=false
BUMBA_ENABLE_AUDIO=false

# Logging
BUMBA_LOG_LEVEL=info

# Resource Limits
BUMBA_MAX_MEMORY=256
BUMBA_MAX_AGENTS=5

# To enable more features, add API keys below:
# ANTHROPIC_API_KEY=your_key_here
# OPENAI_API_KEY=your_key_here
# GOOGLE_API_KEY=your_key_here
`;

    try {
      fs.writeFileSync(this.envPath, minimal);
      logger.info('🏁 Created minimal .env configuration');
      return { success: true, mode: 'minimal' };
    } catch (error) {
      logger.error(`Failed to create .env: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Upgrade from simple template
   */
  async upgradeFromSimple() {
    try {
      const content = fs.readFileSync(this.envPath, 'utf8');
      
      // Parse existing values
      const values = this.parseEnvContent(content);
      
      // Generate upgraded configuration
      const upgraded = this.generateUpgradedConfig(values);
      
      // Backup existing
      fs.writeFileSync(`${this.envPath}.backup`, content);
      
      // Write upgraded
      fs.writeFileSync(this.envPath, upgraded);
      
      logger.info('🏁 Upgraded environment configuration');
      return { success: true, mode: 'upgraded' };
      
    } catch (error) {
      logger.error(`Failed to upgrade .env: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Parse environment file content
   */
  parseEnvContent(content) {
    const values = {};
    const lines = content.split('\n');
    
    for (const line of lines) {
      // Skip comments and empty lines
      if (line.trim().startsWith('#') || !line.trim()) {
        continue;
      }
      
      const [key, value] = line.split('=').map(s => s.trim());
      if (key && value) {
        values[key] = value;
      }
    }
    
    return values;
  }

  /**
   * Generate upgraded configuration
   */
  generateUpgradedConfig(existingValues) {
    const defaults = {
      BUMBA_ENABLED: 'true',
      BUMBA_ENV: 'development',
      BUMBA_MODE: 'standard',
      BUMBA_PARALLEL: 'false',
      BUMBA_ENABLE_MONITORING: 'false',
      BUMBA_ENABLE_AUDIO: 'false',
      BUMBA_LOG_LEVEL: 'info',
      BUMBA_MAX_MEMORY: '512',
      BUMBA_MAX_AGENTS: '10'
    };
    
    // Merge with existing values
    const config = { ...defaults, ...existingValues };
    
    // Detect API keys and enable features
    if (config.ANTHROPIC_API_KEY || config.OPENAI_API_KEY || config.GOOGLE_API_KEY) {
      config.BUMBA_PARALLEL = 'true';
      config.BUMBA_MODE = 'full';
    }
    
    return this.formatEnvConfig(config);
  }

  /**
   * Format environment configuration
   */
  formatEnvConfig(config) {
    const sections = {
      'Core Configuration': [
        'BUMBA_ENABLED',
        'BUMBA_ENV',
        'BUMBA_MODE'
      ],
      'Features': [
        'BUMBA_PARALLEL',
        'BUMBA_ENABLE_MONITORING',
        'BUMBA_ENABLE_AUDIO'
      ],
      'API Keys': [
        'ANTHROPIC_API_KEY',
        'OPENAI_API_KEY',
        'GOOGLE_API_KEY'
      ],
      'Performance': [
        'BUMBA_LOG_LEVEL',
        'BUMBA_MAX_MEMORY',
        'BUMBA_MAX_AGENTS'
      ]
    };
    
    let output = '# BUMBA CLI Configuration\n';
    output += `# Generated: ${new Date().toISOString()}\n\n`;
    
    for (const [section, keys] of Object.entries(sections)) {
      output += `# ${section}\n`;
      output += '# ' + '='.repeat(50) + '\n';
      
      for (const key of keys) {
        if (config[key] !== undefined) {
          output += `${key}=${config[key]}\n`;
        } else {
          output += `# ${key}=\n`;
        }
      }
      
      output += '\n';
    }
    
    return output;
  }

  /**
   * Validate current environment
   */
  validateEnvironment() {
    const issues = [];
    const warnings = [];
    
    // Check for .env file
    if (!fs.existsSync(this.envPath)) {
      issues.push('No .env file found');
    }
    
    // Check BUMBA_ENABLED
    if (process.env.BUMBA_ENABLED !== 'true') {
      warnings.push('BUMBA is not enabled (set BUMBA_ENABLED=true)');
    }
    
    // Check for API keys if parallel is enabled
    if (process.env.BUMBA_PARALLEL === 'true') {
      const hasApiKey = 
        process.env.ANTHROPIC_API_KEY ||
        process.env.OPENAI_API_KEY ||
        process.env.GOOGLE_API_KEY;
        
      if (!hasApiKey) {
        issues.push('Parallel execution enabled but no API keys found');
      }
    }
    
    // Check memory limits
    const maxMemory = parseInt(process.env.BUMBA_MAX_MEMORY || '256');
    if (maxMemory < 128) {
      warnings.push('Memory limit very low (< 128MB)');
    }
    
    return {
      valid: issues.length === 0,
      issues,
      warnings
    };
  }

  /**
   * Get configuration summary
   */
  getConfigSummary() {
    return {
      enabled: process.env.BUMBA_ENABLED === 'true',
      environment: process.env.BUMBA_ENV || 'development',
      mode: process.env.BUMBA_MODE || 'quick-start',
      features: {
        parallel: process.env.BUMBA_PARALLEL === 'true',
        monitoring: process.env.BUMBA_ENABLE_MONITORING === 'true',
        audio: process.env.BUMBA_ENABLE_AUDIO === 'true'
      },
      apis: {
        anthropic: !!process.env.ANTHROPIC_API_KEY,
        openai: !!process.env.OPENAI_API_KEY,
        google: !!process.env.GOOGLE_API_KEY
      },
      limits: {
        memory: parseInt(process.env.BUMBA_MAX_MEMORY || '256'),
        agents: parseInt(process.env.BUMBA_MAX_AGENTS || '5')
      }
    };
  }

  /**
   * Interactive configuration wizard
   */
  async runConfigWizard() {
    const inquirer = require('inquirer');
    
    console.log('\n🧙 BUMBA Configuration Wizard\n');
    
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'mode',
        message: 'Select configuration mode:',
        choices: [
          { name: 'Quick Start (No API keys needed)', value: 'quick-start' },
          { name: 'Development (Local testing)', value: 'development' },
          { name: 'Production (Full features)', value: 'production' }
        ]
      },
      {
        type: 'confirm',
        name: 'parallel',
        message: 'Enable parallel agent execution?',
        default: false,
        when: (answers) => answers.mode !== 'quick-start'
      },
      {
        type: 'confirm',
        name: 'monitoring',
        message: 'Enable performance monitoring?',
        default: false
      },
      {
        type: 'confirm',
        name: 'audio',
        message: 'Enable audio feedback?',
        default: false
      }
    ]);
    
    // Generate configuration
    const config = {
      BUMBA_ENABLED: 'true',
      BUMBA_ENV: answers.mode === 'production' ? 'production' : 'development',
      BUMBA_MODE: answers.mode,
      BUMBA_PARALLEL: answers.parallel ? 'true' : 'false',
      BUMBA_ENABLE_MONITORING: answers.monitoring ? 'true' : 'false',
      BUMBA_ENABLE_AUDIO: answers.audio ? 'true' : 'false',
      BUMBA_LOG_LEVEL: answers.mode === 'production' ? 'warn' : 'info',
      BUMBA_MAX_MEMORY: answers.mode === 'production' ? '1024' : '512',
      BUMBA_MAX_AGENTS: answers.mode === 'production' ? '20' : '10'
    };
    
    // Write configuration
    const envContent = this.formatEnvConfig(config);
    fs.writeFileSync(this.envPath, envContent);
    
    console.log('\n🏁 Configuration saved to .env\n');
    
    if (answers.parallel) {
      console.log('🟠️  Remember to add API keys to enable parallel execution:');
      console.log('   - ANTHROPIC_API_KEY');
      console.log('   - OPENAI_API_KEY');
      console.log('   - GOOGLE_API_KEY\n');
    }
    
    return config;
  }
}

// Export singleton instance
module.exports = new EnvironmentHelper();
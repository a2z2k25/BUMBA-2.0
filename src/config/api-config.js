/**
 * BUMBA API Configuration
 * Manages API keys and parallel execution settings
 */

const { logger } = require('../core/logging/bumba-logger');
const fs = require('fs');
const path = require('path');

class APIConfig {
  constructor() {
    this.config = {
      // API Keys
      anthropic: {
        key: process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY,
        model: process.env.ANTHROPIC_MODEL || 'claude-3-opus-20240229',
        maxTokens: parseInt(process.env.ANTHROPIC_MAX_TOKENS || '4000'),
        temperature: parseFloat(process.env.ANTHROPIC_TEMPERATURE || '0.7')
      },
      openai: {
        key: process.env.OPENAI_API_KEY,
        model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
        maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '4000'),
        temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7')
      },
      google: {
        key: process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY,
        model: process.env.GOOGLE_MODEL || 'gemini-pro',
        maxTokens: parseInt(process.env.GOOGLE_MAX_TOKENS || '4000'),
        temperature: parseFloat(process.env.GOOGLE_TEMPERATURE || '0.7')
      },

      // Parallel Execution Settings
      parallel: {
        enabled: process.env.BUMBA_PARALLEL === 'true' || false,
        maxConcurrency: parseInt(process.env.BUMBA_MAX_CONCURRENCY || '3'),
        timeout: parseInt(process.env.BUMBA_TIMEOUT || '60000'),
        retryAttempts: parseInt(process.env.BUMBA_RETRY_ATTEMPTS || '2'),
        costLimit: parseFloat(process.env.BUMBA_COST_LIMIT || '10.00'), // Daily limit
        tokenLimit: parseInt(process.env.BUMBA_TOKEN_LIMIT || '1000000') // Daily limit
      },

      // Cost Management
      pricing: {
        anthropic: {
          input: 0.000015, // $15 per million tokens
          output: 0.000075 // $75 per million tokens
        },
        openai: {
          input: 0.00001, // $10 per million tokens
          output: 0.00003 // $30 per million tokens
        },
        google: {
          input: 0, // Free tier
          output: 0 // Free tier
        }
      },

      // Feature Flags
      features: {
        useMultipleModels: process.env.BUMBA_USE_MULTIPLE_MODELS === 'true' || false,
        enableCostTracking: process.env.BUMBA_ENABLE_COST_TRACKING !== 'false',
        enableMetrics: process.env.BUMBA_ENABLE_METRICS !== 'false',
        enableLearning: process.env.BUMBA_ENABLE_LEARNING !== 'false',
        verboseLogging: process.env.BUMBA_VERBOSE === 'true' || false
      },

      // Model Selection Strategy
      modelStrategy: process.env.BUMBA_MODEL_STRATEGY || 'claude-first', // claude-first, balanced, cost-optimized

      // Rate Limiting
      rateLimits: {
        anthropic: {
          requestsPerMinute: parseInt(process.env.ANTHROPIC_RPM || '50'),
          tokensPerMinute: parseInt(process.env.ANTHROPIC_TPM || '100000')
        },
        openai: {
          requestsPerMinute: parseInt(process.env.OPENAI_RPM || '60'),
          tokensPerMinute: parseInt(process.env.OPENAI_TPM || '150000')
        },
        google: {
          requestsPerMinute: parseInt(process.env.GOOGLE_RPM || '60'),
          tokensPerMinute: parseInt(process.env.GOOGLE_TPM || '100000')
        }
      }
    };

    // Load from config file if exists
    this.loadConfigFile();

    // Validate configuration
    this.validate();
  }

  /**
   * Load configuration from file
   */
  loadConfigFile() {
    const configPaths = [
      path.join(process.cwd(), '.bumba-api.json'),
      path.join(process.cwd(), 'bumba-api.config.json'),
      path.join(process.env.HOME || '', '.bumba', 'api-config.json')
    ];

    for (const configPath of configPaths) {
      if (fs.existsSync(configPath)) {
        try {
          const fileConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          this.mergeConfig(fileConfig);
          logger.info(`🏁 Loaded API config from ${configPath}`);
          break;
        } catch (error) {
          logger.warn(`🟡 Failed to load config from ${configPath}: ${error.message}`);
        }
      }
    }
  }

  /**
   * Merge configuration objects
   */
  mergeConfig(newConfig) {
    // Deep merge configuration
    const merge = (target, source) => {
      for (const key in source) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
          target[key] = target[key] || {};
          merge(target[key], source[key]);
        } else if (source[key] !== undefined && source[key] !== null) {
          target[key] = source[key];
        }
      }
    };

    merge(this.config, newConfig);
  }

  /**
   * Validate configuration
   */
  validate() {
    const warnings = [];
    const errors = [];

    // Check for API keys
    if (!this.hasAnyAPIKey()) {
      errors.push('No API keys configured. At least one API key is required for parallel execution.');
    }

    // Check parallel settings
    if (this.config.parallel.enabled) {
      if (!this.hasAnyAPIKey()) {
        errors.push('Parallel execution enabled but no API keys configured.');
      }

      if (this.config.parallel.maxConcurrency > 10) {
        warnings.push('Max concurrency > 10 may hit rate limits.');
      }

      if (this.config.parallel.costLimit < 1) {
        warnings.push('Cost limit < $1 may be too restrictive.');
      }
    }

    // Check model strategy
    if (this.config.modelStrategy === 'claude-first' && !this.config.anthropic.key) {
      warnings.push('Model strategy is claude-first but no Anthropic API key configured.');
    }

    // Log warnings
    warnings.forEach(w => logger.warn(`🟡 Config Warning: ${w}`));

    // Throw on errors
    if (errors.length > 0) {
      if (!this.config.parallel.enabled) {
        // If parallel is not enabled, just log warnings
        errors.forEach(e => logger.warn(`🟡 Config Issue: ${e}`));
      } else {
        // If parallel is enabled, these are critical errors
        throw new Error(`Configuration errors:\n${errors.join('\n')}`);
      }
    }
  }

  /**
   * Check if any API key is configured
   */
  hasAnyAPIKey() {
    return !!(
      this.config.anthropic.key ||
      this.config.openai.key ||
      this.config.google.key
    );
  }

  /**
   * Get available models
   */
  getAvailableModels() {
    const models = [];

    if (this.config.anthropic.key) {
      models.push({
        provider: 'anthropic',
        model: this.config.anthropic.model,
        name: 'Claude'
      });
    }

    if (this.config.openai.key) {
      models.push({
        provider: 'openai',
        model: this.config.openai.model,
        name: 'GPT-4'
      });
    }

    if (this.config.google.key) {
      models.push({
        provider: 'google',
        model: this.config.google.model,
        name: 'Gemini'
      });
    }

    return models;
  }

  /**
   * Select best model for task based on strategy
   */
  selectModelForTask(taskType) {
    const available = this.getAvailableModels();

    if (available.length === 0) {
      return null;
    }

    // Model selection based on strategy
    switch (this.config.modelStrategy) {
      case 'claude-first':
        // Prefer Claude for everything
        return available.find(m => m.provider === 'anthropic') || available[0];

      case 'balanced':
        // Distribute across available models
        return available[Math.floor(Math.random() * available.length)];

      case 'cost-optimized':
        // Prefer free/cheaper models
        return available.find(m => m.provider === 'google') ||
               available.find(m => m.provider === 'anthropic') ||
               available[0];

      case 'task-optimized':
        // Select based on task type
        switch (taskType) {
          case 'code':
          case 'backend':
            return available.find(m => m.provider === 'anthropic') || available[0];
          case 'reasoning':
          case 'product':
            return available.find(m => m.provider === 'openai') || available[0];
          case 'creative':
          case 'design':
            return available.find(m => m.provider === 'google') || available[0];
          default:
            return available[0];
        }

      default:
        return available[0];
    }
  }

  /**
   * Check if parallel execution is available
   */
  isParallelAvailable() {
    // Claude Code is always available for parallel execution
    if (this.config.claudeCode && this.config.claudeCode.enabled) {
      return true;
    }
    // Otherwise check for API keys
    return this.config.parallel.enabled && this.hasAnyAPIKey();
  }

  /**
   * Get configuration for export
   */
  getConfig() {
    // Return config with sensitive keys masked
    const masked = JSON.parse(JSON.stringify(this.config));

    if (masked.anthropic.key) {
      masked.anthropic.key = this.maskKey(masked.anthropic.key);
    }
    if (masked.openai.key) {
      masked.openai.key = this.maskKey(masked.openai.key);
    }
    if (masked.google.key) {
      masked.google.key = this.maskKey(masked.google.key);
    }

    return masked;
  }

  /**
   * Mask API key for display
   */
  maskKey(key) {
    if (!key) {return null;}
    if (key.length <= 8) {return '***';}
    return key.substring(0, 4) + '...' + key.substring(key.length - 4);
  }

  /**
   * Get status summary
   */
  getStatus() {
    return {
      parallelEnabled: this.config.parallel.enabled,
      availableModels: this.getAvailableModels().map(m => m.name),
      modelStrategy: this.config.modelStrategy,
      costLimit: `$${this.config.parallel.costLimit}`,
      maxConcurrency: this.config.parallel.maxConcurrency,
      features: this.config.features
    };
  }

  /**
   * Save current configuration to file
   */
  saveConfig(filepath) {
    const configToSave = {
      parallel: this.config.parallel,
      features: this.config.features,
      modelStrategy: this.config.modelStrategy,
      rateLimits: this.config.rateLimits
    };

    fs.writeFileSync(filepath, JSON.stringify(configToSave, null, 2));
    logger.info(`🏁 Configuration saved to ${filepath}`);
  }
}

// Singleton instance
let instance = null;

module.exports = {
  APIConfig,
  getInstance: () => {
    if (!instance) {
      instance = new APIConfig();
    }
    return instance;
  },
  // Export config directly for convenience
  config: () => {
    if (!instance) {
      instance = new APIConfig();
    }
    return instance.config;
  }
};

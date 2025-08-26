/**
 * BUMBA Command Chaining System
 * Main integration point for command chains and templates
 * Powerful, minimal, gradient-themed
 */

const ChainParser = require('./chain-parser');
const ChainExecutor = require('./chain-executor');
const TemplateExecutor = require('./template-executor');
const { getTemplates } = require('./templates/chain-templates');
const { logger } = require('../logging/bumba-logger');

class CommandChaining {
  constructor(commandHandler, options = {}) {
    this.commandHandler = commandHandler;
    this.options = {
      enabled: options.enabled !== undefined ? options.enabled : true,
      maxDepth: options.maxDepth || 10,
      timeout: options.timeout || 600000, // 10 minutes
      ...options
    };
    
    // Components
    this.parser = new ChainParser();
    this.executor = new ChainExecutor(commandHandler, this.options);
    this.templateExecutor = new TemplateExecutor(commandHandler, this.options);
    this.templates = getTemplates();
    
    // Connect template executor to chain executor
    this.templateExecutor.setChainExecutor(this.executor);
    
    // State
    this.history = [];
    this.activeChains = new Map();
  }
  
  /**
   * Execute a command chain or template
   */
  async execute(input, context = {}) {
    if (!this.options.enabled) {
      throw new Error('Command chaining is disabled');
    }
    
    const chainId = `chain-${Date.now()}`;
    const startTime = Date.now();
    
    try {
      // Check if input is a template
      if (input.startsWith('@')) {
        const templateKey = input.slice(1);
        return await this.executeTemplate(templateKey, context);
      }
      
      // Parse and execute as chain
      logger.info('🏁 Parsing command chain...');
      const ast = this.parser.parse(input);
      
      // Store active chain
      this.activeChains.set(chainId, {
        input,
        ast,
        startTime,
        status: 'running'
      });
      
      // Execute chain
      const result = await this.executor.execute(ast.root, context);
      
      // Update chain status
      this.activeChains.set(chainId, {
        ...this.activeChains.get(chainId),
        status: 'completed',
        endTime: Date.now(),
        result
      });
      
      // Add to history
      this.addToHistory({
        id: chainId,
        input,
        result,
        duration: Date.now() - startTime,
        timestamp: startTime
      });
      
      return result;
      
    } catch (error) {
      // Update chain status
      if (this.activeChains.has(chainId)) {
        this.activeChains.set(chainId, {
          ...this.activeChains.get(chainId),
          status: 'failed',
          endTime: Date.now(),
          error: error.message
        });
      }
      
      logger.error('Chain execution failed:', error);
      throw error;
      
    } finally {
      // Clean up old active chains
      this.cleanupActiveChains();
    }
  }
  
  /**
   * Execute a template
   */
  async executeTemplate(key, context = {}) {
    const template = this.templates.get(key);
    
    if (!template) {
      // Try to find by emoji
      const byEmoji = this.templates.getByEmoji(key);
      if (byEmoji) {
        return this.templateExecutor.executeTemplate(byEmoji.key, {}, context);
      }
      
      throw new Error(`Template '${key}' not found`);
    }
    
    return this.templateExecutor.executeTemplate(key, {}, context);
  }
  
  /**
   * Preview a chain or template
   */
  preview(input, variables = {}) {
    // Check if template
    if (input.startsWith('@')) {
      const templateKey = input.slice(1);
      return this.templateExecutor.previewTemplate(templateKey, variables);
    }
    
    // Preview as chain
    const ast = this.parser.parse(input);
    
    return {
      input,
      ast,
      readable: this.parser.toString(ast)
    };
  }
  
  /**
   * Add chain execution to history
   */
  addToHistory(entry) {
    this.history.unshift(entry);
    
    // Keep only last 100 entries
    if (this.history.length > 100) {
      this.history = this.history.slice(0, 100);
    }
  }
  
  /**
   * Get execution history
   */
  getHistory(limit = 10) {
    return this.history.slice(0, limit);
  }
  
  /**
   * Get active chains
   */
  getActiveChains() {
    return Array.from(this.activeChains.values());
  }
  
  /**
   * Clean up old active chains
   */
  cleanupActiveChains() {
    const now = Date.now();
    const timeout = this.options.timeout;
    
    for (const [id, chain] of this.activeChains.entries()) {
      if (chain.status === 'running' && now - chain.startTime > timeout) {
        this.activeChains.delete(id);
      } else if (chain.status !== 'running' && now - chain.endTime > 60000) {
        // Remove completed chains after 1 minute
        this.activeChains.delete(id);
      }
    }
  }
  
  /**
   * Stop all active chains
   */
  stopAll() {
    for (const [id, chain] of this.activeChains.entries()) {
      if (chain.status === 'running') {
        chain.status = 'stopped';
        logger.warn(`Stopped chain ${id}`);
      }
    }
    
    this.activeChains.clear();
  }
  
  /**
   * Get chain statistics
   */
  getStats() {
    const stats = {
      totalExecuted: this.history.length,
      activeChains: this.activeChains.size,
      successRate: 0,
      averageDuration: 0,
      templateUsage: new Map()
    };
    
    if (this.history.length > 0) {
      const successful = this.history.filter(h => !h.error).length;
      stats.successRate = (successful / this.history.length) * 100;
      
      const totalDuration = this.history.reduce((sum, h) => sum + (h.duration || 0), 0);
      stats.averageDuration = totalDuration / this.history.length;
      
      // Count template usage
      for (const entry of this.history) {
        if (entry.template) {
          const count = stats.templateUsage.get(entry.template) || 0;
          stats.templateUsage.set(entry.template, count + 1);
        }
      }
    }
    
    return stats;
  }
  
  /**
   * Create a chain from recent command history
   */
  createChainFromHistory(count = 3, operator = '>>') {
    const recent = this.history.slice(0, count);
    
    if (recent.length === 0) {
      return null;
    }
    
    const commands = recent.reverse().map(h => h.input || h.command);
    return commands.join(` ${operator} `);
  }
  
  /**
   * Get recommendations based on context
   */
  getRecommendations(context = {}) {
    return this.templateExecutor.getRecommendations(context);
  }
}

// Singleton instance
let chaining = null;

/**
 * Get or create chaining instance
 */
function getChaining(commandHandler, options) {
  if (!chaining && commandHandler) {
    chaining = new CommandChaining(commandHandler, options);
  }
  return chaining;
}

/**
 * Integration helper for framework
 */
function integrateChaining(framework, options = {}) {
  if (!framework.commandHandler) {
    logger.warn('Command handler not available, chaining disabled');
    return null;
  }
  
  const chainingInstance = getChaining(framework.commandHandler, options);
  
  // Add to framework
  framework.chaining = chainingInstance;
  
  // Register commands
  framework.commandHandler.register('/bumba:chain', async (args, context) => {
    const action = args[0];
    
    switch (action) {
      case 'execute':
      case 'run':
        const chain = args.slice(1).join(' ');
        if (!chain) {
          return 'Usage: /bumba:chain run <chain>';
        }
        const result = await chainingInstance.execute(chain, context);
        return `Chain executed: ${result.summary ? 
          `${result.summary.successful}/${result.summary.total} successful` : 
          'completed'}`;
        
      case 'preview':
        const previewChain = args.slice(1).join(' ');
        if (!previewChain) {
          return 'Usage: /bumba:chain preview <chain>';
        }
        const preview = chainingInstance.preview(previewChain);
        return `Chain preview:\n${preview.readable}`;
        
      case 'templates':
      case 'list':
        const templates = chainingInstance.templates.list();
        return `Available templates:\n${templates}`;
        
      case 'template':
        const templateKey = args[1];
        if (!templateKey) {
          return 'Usage: /bumba:chain template <key>';
        }
        const templateResult = await chainingInstance.executeTemplate(templateKey, context);
        return `Template ${templateKey} executed`;
        
      case 'history':
        const limit = parseInt(args[1]) || 5;
        const history = chainingInstance.getHistory(limit);
        return history.map((h, i) => 
          `${i + 1}. ${h.input || h.template} (${h.duration}ms)`
        ).join('\n');
        
      case 'stats':
        const stats = chainingInstance.getStats();
        return [
          `Total executed: ${stats.totalExecuted}`,
          `Active chains: ${stats.activeChains}`,
          `Success rate: ${stats.successRate.toFixed(1)}%`,
          `Avg duration: ${stats.averageDuration.toFixed(0)}ms`
        ].join('\n');
        
      case 'stop':
        chainingInstance.stopAll();
        return '🔴 All chains stopped';
        
      case 'recommend':
        const recommendations = chainingInstance.getRecommendations(context);
        if (recommendations.length === 0) {
          return 'No recommendations available';
        }
        return 'Recommended templates:\n' + 
          recommendations.map(r => `${r.emoji} ${r.key}: ${r.description}`).join('\n');
        
      default:
        return [
          'Usage: /bumba:chain [action] [options]',
          'Actions:',
          '  run <chain> - Execute a command chain',
          '  preview <chain> - Preview chain execution',
          '  templates - List available templates',
          '  template <key> - Execute a template',
          '  history [limit] - Show execution history',
          '  stats - Show chain statistics',
          '  stop - Stop all active chains',
          '  recommend - Get template recommendations'
        ].join('\n');
    }
  });
  
  // Register shorthand for templates
  framework.commandHandler.register('/bumba:@', async (args, context) => {
    const templateKey = args[0];
    if (!templateKey) {
      const templates = chainingInstance.templates.list({ format: 'compact' });
      return `Quick templates:\n${templates}`;
    }
    
    const result = await chainingInstance.executeTemplate(templateKey, context);
    return `🏁 Template ${templateKey} executed`;
  });
  
  logger.info('🏁 Command Chaining integrated with framework');
  
  return chainingInstance;
}

module.exports = {
  CommandChaining,
  getChaining,
  integrateChaining,
  ChainParser,
  ChainExecutor,
  TemplateExecutor
};
/**
 * BUMBA Template Executor
 * Executes chain templates with context and variable substitution
 * Bridges templates with the chain execution system
 */

const ChainParser = require('./chain-parser');
const ChainExecutor = require('./chain-executor');
const { getTemplates } = require('./templates/chain-templates');
const { logger } = require('../logging/bumba-logger');

class TemplateExecutor {
  constructor(commandHandler, options = {}) {
    this.commandHandler = commandHandler;
    this.options = options;
    
    // Components
    this.templates = getTemplates();
    this.parser = new ChainParser();
    this.executor = null; // Will be set when chain executor is ready
  }
  
  /**
   * Set chain executor
   */
  setChainExecutor(executor) {
    this.executor = executor;
  }
  
  /**
   * Execute a template by key
   */
  async executeTemplate(key, variables = {}, context = {}) {
    // Get template
    const template = this.templates.get(key);
    
    if (!template) {
      throw new Error(`Template '${key}' not found`);
    }
    
    logger.info(`🏁 Executing template: ${template.emoji} ${template.name}`);
    
    // Substitute variables in chain
    const chain = this.substituteVariables(template.chain, variables);
    
    // Add template metadata to context
    const templateContext = {
      ...context,
      template: {
        key: template.key,
        name: template.name,
        emoji: template.emoji,
        gradient: template.gradient
      },
      variables
    };
    
    // Execute chain
    if (!this.executor) {
      throw new Error('Chain executor not available');
    }
    
    try {
      const result = await this.executor.execute(chain, templateContext);
      
      // Add template info to result
      result.template = template.key;
      result.templateName = template.name;
      
      logger.info(`🏁 Template ${template.name} completed`);
      
      return result;
      
    } catch (error) {
      logger.error(`Template ${template.name} failed:`, error);
      throw error;
    }
  }
  
  /**
   * Substitute variables in chain string
   */
  substituteVariables(chain, variables) {
    let substituted = chain;
    
    // Replace ${var} patterns
    for (const [key, value] of Object.entries(variables)) {
      const pattern = new RegExp(`\\$\\{${key}\\}`, 'g');
      substituted = substituted.replace(pattern, value);
    }
    
    // Replace $var patterns (simpler syntax)
    for (const [key, value] of Object.entries(variables)) {
      const pattern = new RegExp(`\\$${key}\\b`, 'g');
      substituted = substituted.replace(pattern, value);
    }
    
    return substituted;
  }
  
  /**
   * Preview what a template will execute
   */
  previewTemplate(key, variables = {}) {
    const template = this.templates.get(key);
    
    if (!template) {
      throw new Error(`Template '${key}' not found`);
    }
    
    const chain = this.substituteVariables(template.chain, variables);
    
    // Parse to get structure
    const ast = this.parser.parse(chain);
    
    return {
      template: {
        key: template.key,
        name: template.name,
        description: template.description,
        emoji: template.emoji
      },
      original: template.chain,
      substituted: chain,
      ast: ast,
      readable: this.parser.toString(ast)
    };
  }
  
  /**
   * Execute template with interactive prompts for variables
   */
  async executeInteractive(key, promptCallback) {
    const template = this.templates.get(key);
    
    if (!template) {
      throw new Error(`Template '${key}' not found`);
    }
    
    // Extract variables from template chain
    const variables = this.extractVariables(template.chain);
    const values = {};
    
    // Prompt for each variable
    if (variables.length > 0 && promptCallback) {
      logger.info(`Template ${template.name} needs ${variables.length} variable(s)`);
      
      for (const variable of variables) {
        const value = await promptCallback({
          name: variable,
          message: `Enter value for ${variable}:`,
          template: template.name
        });
        
        values[variable] = value;
      }
    }
    
    // Execute with collected values
    return this.executeTemplate(key, values);
  }
  
  /**
   * Extract variable names from chain
   */
  extractVariables(chain) {
    const variables = new Set();
    
    // Match ${var} patterns
    const matches1 = chain.match(/\$\{(\w+)\}/g) || [];
    matches1.forEach(match => {
      const name = match.slice(2, -1);
      variables.add(name);
    });
    
    // Match $var patterns
    const matches2 = chain.match(/\$(\w+)\b/g) || [];
    matches2.forEach(match => {
      const name = match.slice(1);
      variables.add(name);
    });
    
    return Array.from(variables);
  }
  
  /**
   * Create custom template from current chain
   */
  createFromChain(chain, metadata = {}) {
    const key = metadata.key || `custom-${Date.now()}`;
    
    const template = {
      name: metadata.name || 'Custom Chain',
      description: metadata.description || 'User-defined chain',
      chain: chain,
      gradient: metadata.gradient || ['green', 'yellow', 'orange', 'red'],
      emoji: metadata.emoji || '🏁',
      tags: metadata.tags || ['custom']
    };
    
    return this.templates.register(key, template);
  }
  
  /**
   * Get recommended templates for current context
   */
  getRecommendations(context = {}) {
    const recommendations = [];
    
    // Based on time of day
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 10) {
      recommendations.push(this.templates.get('morning'));
    }
    
    // Based on recent errors
    if (context.hasErrors) {
      recommendations.push(this.templates.get('hotfix'));
      recommendations.push(this.templates.get('emergency'));
    }
    
    // Based on current task
    if (context.task) {
      const taskRecommendations = this.templates.recommend(context.task);
      recommendations.push(...taskRecommendations);
    }
    
    // Remove duplicates and nulls
    return recommendations.filter((v, i, a) => 
      v && a.findIndex(t => t && t.key === v.key) === i
    );
  }
  
  /**
   * Execute multiple templates in sequence
   */
  async executeSequence(templateKeys, sharedContext = {}) {
    const results = [];
    let context = { ...sharedContext };
    
    for (const key of templateKeys) {
      try {
        const result = await this.executeTemplate(key, {}, context);
        results.push({
          template: key,
          success: true,
          result
        });
        
        // Pass context forward
        if (result.context) {
          context = { ...context, ...result.context };
        }
        
      } catch (error) {
        results.push({
          template: key,
          success: false,
          error: error.message
        });
        
        // Stop on error unless configured otherwise
        if (!this.options.continueOnError) {
          break;
        }
      }
    }
    
    return {
      templates: templateKeys,
      results,
      context,
      summary: {
        total: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      }
    };
  }
  
  /**
   * Validate a template chain
   */
  validateTemplate(key) {
    const template = this.templates.get(key);
    
    if (!template) {
      return {
        valid: false,
        error: `Template '${key}' not found`
      };
    }
    
    try {
      // Try to parse the chain
      const ast = this.parser.parse(template.chain);
      
      // Check for variables
      const variables = this.extractVariables(template.chain);
      
      return {
        valid: true,
        template: template.key,
        variables,
        ast
      };
      
    } catch (error) {
      return {
        valid: false,
        template: template.key,
        error: error.message
      };
    }
  }
}

module.exports = TemplateExecutor;
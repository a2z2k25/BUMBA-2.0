/**
 * BUMBA Chain Templates
 * Reusable command chain templates for common workflows
 * Minimal, powerful, gradient-themed
 */

const { logger } = require('../../logging/bumba-logger');

class ChainTemplates {
  constructor() {
    // Built-in templates
    this.templates = new Map();
    
    // Register default templates
    this.registerDefaults();
  }
  
  /**
   * Register default templates
   */
  registerDefaults() {
    // Full-stack development workflow
    this.register('full-stack', {
      name: 'Full Stack Development',
      description: 'Backend, Frontend, and Testing in parallel',
      chain: '/bumba:backend || /bumba:frontend || /bumba:test',
      gradient: ['green', 'red', 'orange'],
      emoji: '🏁'
    });
    
    // Hotfix workflow
    this.register('hotfix', {
      name: 'Hotfix Deploy',
      description: 'Quick fix with tests and deploy',
      chain: '/bumba:fix >> /bumba:test >> /bumba:deploy',
      gradient: ['red', 'orange', 'green'],
      emoji: '🔴'
    });
    
    // Feature development
    this.register('feature', {
      name: 'Feature Development',
      description: 'Strategic planning, implementation, and testing',
      chain: '/bumba:strategist >> (/bumba:backend || /bumba:frontend) >> /bumba:test',
      gradient: ['yellow', 'green', 'orange'],
      emoji: '🟡'
    });
    
    // Code review workflow
    this.register('review', {
      name: 'Code Review',
      description: 'Analyze, secure, and optimize code',
      chain: '/bumba:analyze || /bumba:secure || /bumba:optimize',
      gradient: ['green', 'yellow', 'orange'],
      emoji: '🟢'
    });
    
    // Testing suite
    this.register('test-all', {
      name: 'Complete Testing',
      description: 'Unit, integration, and e2e tests in parallel',
      chain: '/bumba:test unit || /bumba:test integration || /bumba:test e2e',
      gradient: ['orange', 'orange', 'orange'],
      emoji: '🟠'
    });
    
    // Deploy pipeline
    this.register('deploy', {
      name: 'Deploy Pipeline',
      description: 'Build, test, and deploy sequence',
      chain: '/bumba:build >> /bumba:test >> /bumba:deploy production',
      gradient: ['green', 'orange', 'red'],
      emoji: '🏁'
    });
    
    // Morning routine
    this.register('morning', {
      name: 'Morning Routine',
      description: 'Status check, pull updates, and review tasks',
      chain: '/bumba:status >> /bumba:sync >> /bumba:team status',
      gradient: ['yellow', 'green', 'yellow'],
      emoji: '🟡'
    });
    
    // Emergency response
    this.register('emergency', {
      name: 'Emergency Response',
      description: 'Diagnose, fix, and monitor critical issues',
      chain: '/bumba:diagnose critical >> /bumba:fix >> /bumba:monitor',
      gradient: ['red', 'red', 'orange'],
      emoji: '🔴'
    });
    
    // Research workflow
    this.register('research', {
      name: 'Research & Analysis',
      description: 'Market research, competitor analysis, and strategy',
      chain: '/bumba:research market || /bumba:research competitors || /bumba:strategist',
      gradient: ['yellow', 'yellow', 'yellow'],
      emoji: '🟡'
    });
    
    // Optimization workflow
    this.register('optimize', {
      name: 'Optimization Suite',
      description: 'Performance, security, and code quality',
      chain: '/bumba:performance >> /bumba:secure >> /bumba:quality',
      gradient: ['green', 'yellow', 'orange'],
      emoji: '🟢'
    });
  }
  
  /**
   * Register a new template
   */
  register(key, template) {
    if (!key || !template) {
      throw new Error('Template key and definition required');
    }
    
    if (!template.chain) {
      throw new Error('Template must have a chain property');
    }
    
    // Validate template
    const validated = {
      key,
      name: template.name || key,
      description: template.description || '',
      chain: template.chain,
      gradient: template.gradient || ['green', 'yellow', 'orange', 'red'],
      emoji: template.emoji || '🏁',
      tags: template.tags || [],
      created: Date.now()
    };
    
    this.templates.set(key, validated);
    logger.debug(`Registered chain template: ${key}`);
    
    return validated;
  }
  
  /**
   * Get a template by key
   */
  get(key) {
    return this.templates.get(key);
  }
  
  /**
   * Get all templates
   */
  getAll() {
    return Array.from(this.templates.values());
  }
  
  /**
   * List templates (formatted)
   */
  list(options = {}) {
    const templates = this.getAll();
    
    if (options.format === 'compact') {
      return templates.map(t => `${t.emoji} ${t.key}: ${t.chain}`).join('\n');
    }
    
    if (options.format === 'verbose') {
      return templates.map(t => {
        return [
          `${t.emoji} ${t.name} (${t.key})`,
          `  ${t.description}`,
          `  Chain: ${t.chain}`,
          `  Gradient: ${t.gradient.join(' → ')}`
        ].join('\n');
      }).join('\n\n');
    }
    
    // Default format
    return templates.map(t => {
      return `${t.emoji} ${t.key}: ${t.description}`;
    }).join('\n');
  }
  
  /**
   * Search templates by tags or description
   */
  search(query) {
    const lowerQuery = query.toLowerCase();
    
    return this.getAll().filter(template => {
      // Search in key
      if (template.key.toLowerCase().includes(lowerQuery)) {
        return true;
      }
      
      // Search in name
      if (template.name.toLowerCase().includes(lowerQuery)) {
        return true;
      }
      
      // Search in description
      if (template.description.toLowerCase().includes(lowerQuery)) {
        return true;
      }
      
      // Search in tags
      if (template.tags.some(tag => tag.toLowerCase().includes(lowerQuery))) {
        return true;
      }
      
      // Search in chain
      if (template.chain.toLowerCase().includes(lowerQuery)) {
        return true;
      }
      
      return false;
    });
  }
  
  /**
   * Remove a template
   */
  remove(key) {
    return this.templates.delete(key);
  }
  
  /**
   * Clear all templates
   */
  clear() {
    this.templates.clear();
  }
  
  /**
   * Export templates to JSON
   */
  export() {
    return {
      version: '1.0.0',
      templates: Array.from(this.templates.entries()).map(([key, template]) => ({
        key,
        ...template
      }))
    };
  }
  
  /**
   * Import templates from JSON
   */
  import(data) {
    if (!data || !data.templates) {
      throw new Error('Invalid import data');
    }
    
    let imported = 0;
    
    for (const template of data.templates) {
      try {
        this.register(template.key, template);
        imported++;
      } catch (error) {
        logger.warn(`Failed to import template ${template.key}:`, error.message);
      }
    }
    
    return imported;
  }
  
  /**
   * Clone a template with modifications
   */
  clone(sourceKey, newKey, modifications = {}) {
    const source = this.get(sourceKey);
    
    if (!source) {
      throw new Error(`Template ${sourceKey} not found`);
    }
    
    const cloned = {
      ...source,
      ...modifications,
      key: newKey
    };
    
    return this.register(newKey, cloned);
  }
  
  /**
   * Get template by emoji (for fun)
   */
  getByEmoji(emoji) {
    return this.getAll().find(t => t.emoji === emoji);
  }
  
  /**
   * Get recommended templates for a task
   */
  recommend(task) {
    const keywords = task.toLowerCase().split(/\s+/);
    const scores = new Map();
    
    for (const template of this.getAll()) {
      let score = 0;
      
      for (const keyword of keywords) {
        if (template.key.includes(keyword)) score += 3;
        if (template.name.toLowerCase().includes(keyword)) score += 2;
        if (template.description.toLowerCase().includes(keyword)) score += 1;
        if (template.tags.some(tag => tag.includes(keyword))) score += 1;
      }
      
      if (score > 0) {
        scores.set(template, score);
      }
    }
    
    // Sort by score and return top 3
    return Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([template]) => template);
  }
}

// Singleton instance
let templates = null;

/**
 * Get or create templates instance
 */
function getTemplates() {
  if (!templates) {
    templates = new ChainTemplates();
  }
  return templates;
}

module.exports = {
  ChainTemplates,
  getTemplates
};
/**
 * BUMBA Tool Context Injector
 * Automatically injects tool awareness into agent contexts
 */

const { toolAwarenessSystem } = require('./tool-awareness-system');
const { logger } = require('../logging/bumba-logger');

class ToolContextInjector {
  constructor() {
    this.injectionStrategies = new Map();
    this.contextCache = new Map();
    this.cacheTimeout = 300000; // 5 minutes
    this.setupDefaultStrategies();
  }

  /**
   * Setup default injection strategies
   */
  setupDefaultStrategies() {
    // Strategy for task prompts
    this.addStrategy('task-prompt', {
      trigger: /^(implement|create|build|fix|refactor|analyze)/i,
      inject: (prompt, _context) => {
        const tools = toolAwarenessSystem.getContextualSuggestions(prompt);
        if (tools.length === 0) {return prompt;}
        
        return `${prompt}

## 🟢 Recommended Tools for This Task:
${this.formatToolSuggestions(tools)}

🟢 Remember: Use these tools to work more efficiently!`;
      }
    });

    // Strategy for search operations
    this.addStrategy('search-operation', {
      trigger: /\b(search|find|look for|where|locate)\b/i,
      inject: (prompt, _context) => {
        return `${prompt}

## 🟢 Search Tools Available:
- **Grep/Search**: Fast text search across files
- **Serena MCP**: Semantic code search (finds by meaning, not just text)
- **Context7 MCP**: Official documentation search
- **Pinecone MCP**: Vector-based similarity search

🟢 Try semantic search first for better results!`;
      }
    });

    // Strategy for file operations
    this.addStrategy('file-operation', {
      trigger: /\b(create|edit|update|modify|write) .*(file|component|module)\b/i,
      inject: (prompt, _context) => {
        return `${prompt}

## 🟢 File Operation Reminders:
- Always READ files before editing
- Use MultiEdit for multiple changes to same file
- Check existing patterns in similar files
- Use Memory MCP to track important changes`;
      }
    });

    // Strategy for memory-critical operations
    this.addStrategy('memory-critical', {
      trigger: /\b(decision|architecture|important|critical|remember)\b/i,
      inject: (prompt, _context) => {
        return `${prompt}

## 🟢 Memory MCP Reminder:
Store this decision/information in Memory MCP for future reference:
- Architectural decisions
- Important context
- Design rationale
- Implementation choices`;
      }
    });
  }

  /**
   * Add a custom injection strategy
   */
  addStrategy(name, strategy) {
    this.injectionStrategies.set(name, strategy);
  }

  /**
   * Inject tool context into a prompt
   */
  injectContext(prompt, agentType = 'default', task = null) {
    try {
      // Check cache first
      const cacheKey = `${agentType}:${task || 'general'}`;
      const cached = this.getCachedContext(cacheKey);
      
      let enhancedPrompt = prompt;
      
      // Apply matching strategies
      for (const [name, strategy] of this.injectionStrategies) {
        if (strategy.trigger.test(prompt)) {
          const context = cached || this.generateContext(agentType, task);
          enhancedPrompt = strategy.inject(enhancedPrompt, context);
        }
      }
      
      // Add general tool awareness if no specific strategy matched
      if (enhancedPrompt === prompt) {
        enhancedPrompt = this.addGeneralToolAwareness(prompt, agentType, task);
      }
      
      return enhancedPrompt;
    } catch (error) {
      logger.error('Error injecting tool context:', error);
      return prompt; // Return original on error
    }
  }

  /**
   * Add general tool awareness to prompt
   */
  addGeneralToolAwareness(prompt, agentType, task) {
    const context = toolAwarenessSystem.generateToolContext(agentType, task);
    
    // Don't add if prompt is very short or seems like a simple response
    if (prompt.length < 50 || /^(yes|no|okay|sure|done)/i.test(prompt)) {
      return prompt;
    }
    
    const toolCount = context.available_tools.length;
    const relevantTools = context.relevant_tools.slice(0, 3);
    
    let awareness = '\n\n---\n';
    awareness += `🟢 You have access to ${toolCount} tools and MCP servers. `;
    
    if (relevantTools.length > 0) {
      awareness += 'Most relevant:\n';
      relevantTools.forEach(tool => {
        const name = tool.tool || tool.mcp;
        awareness += `• ${name}: ${tool.reason}\n`;
      });
    } else {
      awareness += 'Use /bumba:menu to explore available commands.';
    }
    
    return prompt + awareness;
  }

  /**
   * Format tool suggestions for display
   */
  formatToolSuggestions(tools) {
    return tools.map(tool => {
      const name = tool.tool || tool.mcp;
      const confidence = Math.round((tool.confidence || 0.8) * 100);
      return `• **${name}** - ${tool.reason} (${confidence}% match)`;
    }).join('\n');
  }

  /**
   * Generate context for injection
   */
  generateContext(agentType, task) {
    const context = toolAwarenessSystem.generateToolContext(agentType, task);
    
    // Cache the context
    const cacheKey = `${agentType}:${task || 'general'}`;
    this.contextCache.set(cacheKey, {
      context,
      timestamp: Date.now()
    });
    
    return context;
  }

  /**
   * Get cached context if still valid
   */
  getCachedContext(key) {
    const cached = this.contextCache.get(key);
    if (!cached) {return null;}
    
    const age = Date.now() - cached.timestamp;
    if (age > this.cacheTimeout) {
      this.contextCache.delete(key);
      return null;
    }
    
    return cached.context;
  }

  /**
   * Create prompt enhancer for agents
   */
  createPromptEnhancer() {
    return {
      name: 'tool-awareness-enhancer',
      priority: 90,
      enhance: async (prompt, metadata = {}) => {
        const { agentType, task, skipToolInjection } = metadata;
        
        // Skip if explicitly disabled
        if (skipToolInjection) {return prompt;}
        
        return this.injectContext(prompt, agentType, task);
      }
    };
  }

  /**
   * Create awareness snippets for different scenarios
   */
  getAwarenessSnippet(scenario) {
    const snippets = {
      'start-task': `
🟢 Starting a new task? Remember:
1. Use /bumba:menu to see all available commands
2. Search for existing patterns before implementing
3. Store important decisions in Memory MCP
4. Use semantic search (Serena) for better code discovery`,

      'debugging': `
🟢 Debugging? These tools can help:
- Serena: Find all references and implementations
- Search: Locate error patterns
- Memory: Recall previous fixes
- GitHub: Check related issues`,

      'refactoring': `
🟢️ Refactoring? Use these tools:
- Serena: Rename symbols across entire codebase
- Search: Find all usages before changing
- Memory: Document refactoring decisions
- Tests: Ensure nothing breaks`,

      'documentation': `
🟢 Working with docs? Remember:
- Context7: Official framework documentation
- Memory: Store important findings
- Search: Find existing examples
- GitHub: Update README and docs`,

      'integration': `
🟢 Integrating systems? Tools to use:
- Context7: API documentation
- Pinecone: Semantic search for patterns
- Memory: Track integration decisions
- Tests: Verify integration works`
    };
    
    return snippets[scenario] || snippets['start-task'];
  }

  /**
   * Inject awareness based on detected patterns
   */
  detectAndInject(prompt) {
    const patterns = [
      { regex: /\b(bug|error|fix|issue)\b/i, scenario: 'debugging' },
      { regex: /\b(refactor|rename|reorganize|clean)\b/i, scenario: 'refactoring' },
      { regex: /\b(document|docs|readme|comment)\b/i, scenario: 'documentation' },
      { regex: /\b(integrate|connect|api|service)\b/i, scenario: 'integration' }
    ];
    
    for (const pattern of patterns) {
      if (pattern.regex.test(prompt)) {
        const snippet = this.getAwarenessSnippet(pattern.scenario);
        return `${prompt}\n\n${snippet}`;
      }
    }
    
    return prompt;
  }
}

// Export singleton instance
const toolContextInjector = new ToolContextInjector();

module.exports = {
  ToolContextInjector,
  toolContextInjector
};
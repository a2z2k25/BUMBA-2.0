/**
 * BUMBA Tool Awareness System
 * Ensures persistent contextual awareness of available tools and MCP servers
 */

const { logger } = require('../logging/bumba-logger');
const { mcpServerManager } = require('../mcp/mcp-resilience-system');
const { BumbaError } = require('../error-handling/bumba-error-system');

class ToolAwarenessSystem {
  constructor() {
    this.toolRegistry = new Map();
    this.mcpRegistry = new Map();
    this.contextProviders = [];
    this.usageHistory = new Map();
    this.lastReminder = null;
    this.initialized = false;
  }

  /**
   * Initialize the tool awareness system
   */
  async initialize() {
    try {
      logger.info('🟢 Initializing Tool Awareness System...');
      
      // Register built-in tools
      this.registerBuiltInTools();
      
      // Discover MCP servers
      await this.discoverMCPServers();
      
      // Set up periodic reminders
      this.setupPeriodicReminders();
      
      this.initialized = true;
      logger.info('🏁 Tool Awareness System initialized');
      
      return true;
    } catch (error) {
      logger.error('🔴 Failed to initialize Tool Awareness System:', error);
      throw new BumbaError('TOOL_AWARENESS_INIT_FAILED', error.message);
    }
  }

  /**
   * Register built-in BUMBA tools
   */
  registerBuiltInTools() {
    // Core BUMBA tools
    this.registerTool('bumba-command', {
      name: 'BUMBA Commands',
      description: 'Core BUMBA framework commands',
      category: 'core',
      examples: [
        '/bumba:menu - Show interactive command menu',
        '/bumba:implement - Intelligent feature development',
        '/bumba:analyze - Code analysis and insights'
      ],
      useCases: [
        'Starting any development task',
        'Analyzing code quality',
        'Managing project workflow'
      ]
    });

    // File system tools
    this.registerTool('file-operations', {
      name: 'File System Operations',
      description: 'Read, write, and manipulate files',
      category: 'filesystem',
      examples: [
        'Reading configuration files',
        'Creating new components',
        'Updating existing code'
      ],
      useCases: [
        'Any file manipulation task',
        'Code generation',
        'Configuration updates'
      ]
    });

    // Search tools
    this.registerTool('search-tools', {
      name: 'Search and Discovery',
      description: 'Search code, documentation, and web',
      category: 'search',
      examples: [
        'Finding function definitions',
        'Searching for usage patterns',
        'Looking up documentation'
      ],
      useCases: [
        'Understanding codebase structure',
        'Finding implementation examples',
        'Researching best practices'
      ]
    });
  }

  /**
   * Discover available MCP servers
   */
  async discoverMCPServers() {
    const mcpServers = [
      {
        name: 'memory',
        capabilities: ['store', 'retrieve', 'search'],
        description: 'Persistent context and memory management',
        useCases: [
          'Storing important decisions',
          'Recalling previous context',
          'Managing project knowledge'
        ]
      },
      {
        name: 'context7',
        capabilities: ['search-docs', 'get-examples'],
        description: 'Official library documentation lookup',
        useCases: [
          'Finding React/Vue/Angular docs',
          'Looking up API references',
          'Getting code examples'
        ]
      },
      {
        name: 'pinecone',
        capabilities: ['vector-search', 'semantic-retrieval'],
        description: 'AI-powered semantic search',
        useCases: [
          'Finding similar code patterns',
          'Semantic code search',
          'Building RAG systems'
        ]
      },
      {
        name: 'serena',
        capabilities: ['semantic-search', 'code-navigation', 'refactoring'],
        description: 'Semantic code analysis and editing',
        useCases: [
          'Renaming symbols across codebase',
          'Finding all references',
          'Understanding code relationships'
        ]
      },
      {
        name: 'github',
        capabilities: ['repo-management', 'pr-creation', 'issue-tracking'],
        description: 'GitHub repository operations',
        useCases: [
          'Creating pull requests',
          'Managing issues',
          'Reviewing code changes'
        ]
      },
      {
        name: 'reflektion',
        capabilities: ['code-reflection', 'agent-introspection', 'pattern-recognition'],
        description: 'Advanced reflection and introspection capabilities',
        useCases: [
          'Deep code analysis and understanding',
          'Agent decision tracking and improvement',
          'Pattern recognition and optimization',
          'Complex refactoring guidance'
        ]
      },
      {
        name: 'figma-devmode',
        capabilities: ['design-inspection', 'asset-export'],
        description: 'Figma design-to-code workflows',
        useCases: [
          'Extracting design tokens',
          'Getting component specs',
          'Exporting assets'
        ]
      }
    ];

    for (const server of mcpServers) {
      this.registerMCPServer(server.name, server);
    }
  }

  /**
   * Register a tool in the system
   */
  registerTool(id, metadata) {
    this.toolRegistry.set(id, {
      ...metadata,
      id,
      lastUsed: null,
      usageCount: 0
    });
  }

  /**
   * Register an MCP server
   */
  registerMCPServer(name, metadata) {
    this.mcpRegistry.set(name, {
      ...metadata,
      available: false, // Will be checked dynamically
      lastChecked: null
    });
  }

  /**
   * Get contextual tool suggestions based on current task
   */
  getContextualSuggestions(taskContext) {
    const suggestions = [];
    
    // Analyze task context for keywords
    const contextLower = taskContext.toLowerCase();
    
    // File-related keywords
    if (contextLower.match(/\b(create|write|edit|update|modify|file|component)\b/)) {
      suggestions.push({
        tool: 'file-operations',
        reason: 'Task involves file manipulation',
        confidence: 0.9
      });
    }
    
    // Search-related keywords
    if (contextLower.match(/\b(find|search|look|where|locate|discover)\b/)) {
      suggestions.push({
        tool: 'search-tools',
        reason: 'Task involves searching or discovery',
        confidence: 0.9
      });
      
      if (contextLower.match(/\b(semantic|meaning|similar|related)\b/)) {
        suggestions.push({
          mcp: 'serena',
          reason: 'Semantic code search capabilities',
          confidence: 0.95
        });
      }
    }
    
    // Documentation keywords
    if (contextLower.match(/\b(docs|documentation|api|reference|example)\b/)) {
      suggestions.push({
        mcp: 'context7',
        reason: 'Official documentation lookup',
        confidence: 0.85
      });
    }
    
    // Design-related keywords
    if (contextLower.match(/\b(design|figma|ui|component|style|css)\b/)) {
      suggestions.push({
        mcp: 'figma-devmode',
        reason: 'Design-to-code workflows',
        confidence: 0.9
      });
    }
    
    // Git/GitHub keywords
    if (contextLower.match(/\b(git|github|pr|pull request|commit|branch|issue)\b/)) {
      suggestions.push({
        mcp: 'github',
        reason: 'GitHub repository operations',
        confidence: 0.95
      });
    }
    
    // Memory/context keywords
    if (contextLower.match(/\b(remember|recall|previous|context|history|decision)\b/)) {
      suggestions.push({
        mcp: 'memory',
        reason: 'Context persistence and recall',
        confidence: 0.9
      });
    }
    
    // Reflektion keywords for deep analysis and improvement
    if (contextLower.match(/\b(reflect|analyze|improve|pattern|refactor|optimize|introspect|learn)\b/)) {
      suggestions.push({
        mcp: 'reflektion',
        reason: 'Deep code analysis and self-improvement',
        confidence: 0.9
      });
      
      if (contextLower.match(/\b(complex|architecture|decision|strategy)\b/)) {
        suggestions.push({
          mcp: 'reflektion',
          reason: 'Complex analysis with introspection',
          confidence: 0.95
        });
      }
    }
    
    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Generate tool awareness context for agents
   */
  generateToolContext(agentType, currentTask) {
    const context = {
      available_tools: [],
      relevant_tools: [],
      usage_tips: [],
      reminders: []
    };
    
    // Add all available tools
    for (const [id, tool] of this.toolRegistry) {
      context.available_tools.push({
        id: tool.id,
        name: tool.name,
        description: tool.description,
        examples: tool.examples
      });
    }
    
    // Add MCP servers
    for (const [name, server] of this.mcpRegistry) {
      context.available_tools.push({
        type: 'mcp',
        name: name,
        description: server.description,
        capabilities: server.capabilities,
        useCases: server.useCases
      });
    }
    
    // Get contextual suggestions
    if (currentTask) {
      const suggestions = this.getContextualSuggestions(currentTask);
      context.relevant_tools = suggestions;
    }
    
    // Add usage tips based on agent type
    context.usage_tips = this.getAgentSpecificTips(agentType);
    
    // Add reminders for underused tools
    context.reminders = this.getToolReminders();
    
    return context;
  }

  /**
   * Get agent-specific tool usage tips
   */
  getAgentSpecificTips(agentType) {
    const tips = {
      'technical': [
        'Use Serena MCP for semantic code navigation and refactoring',
        'Context7 provides official documentation for all major frameworks',
        'Use search tools before implementing to find existing patterns',
        'Reflektion MCP for deep code analysis and architecture decisions'
      ],
      'design': [
        'Figma DevMode MCP provides direct design-to-code workflows',
        'Use visual documentation tools for component specs',
        'Magic UI can generate modern UI components',
        'Reflektion helps identify UI/UX patterns across projects'
      ],
      'strategic': [
        'Memory MCP helps track decisions and rationale',
        'Use Notion MCP for collaborative planning',
        'GitHub MCP for issue tracking and roadmap management',
        'Reflektion enables strategic pattern recognition and learning'
      ],
      'default': [
        'Remember to use /bumba:menu for all available commands',
        'MCP servers enhance capabilities when installed',
        'Use memory MCP to persist important context'
      ]
    };
    
    return tips[agentType] || tips.default;
  }

  /**
   * Get reminders for underused tools
   */
  getToolReminders() {
    const reminders = [];
    const now = Date.now();
    
    for (const [id, tool] of this.toolRegistry) {
      const usage = this.usageHistory.get(id) || { count: 0, lastUsed: 0 };
      
      // Remind about tools not used in the last hour
      if (now - usage.lastUsed > 3600000) {
        reminders.push({
          tool: tool.name,
          message: `Haven't used ${tool.name} recently. Consider for: ${tool.useCases[0]}`
        });
      }
    }
    
    return reminders.slice(0, 3); // Limit to 3 reminders
  }

  /**
   * Track tool usage
   */
  trackUsage(toolId) {
    const usage = this.usageHistory.get(toolId) || { count: 0, lastUsed: 0 };
    usage.count++;
    usage.lastUsed = Date.now();
    this.usageHistory.set(toolId, usage);
  }

  /**
   * Setup periodic tool awareness reminders
   */
  setupPeriodicReminders() {
    // Send reminders every 30 minutes during active sessions
    setInterval(() => {
      if (this.shouldSendReminder()) {
        this.broadcastToolAwareness();
      }
    }, 1800000); // 30 minutes
  }

  /**
   * Check if we should send a reminder
   */
  shouldSendReminder() {
    const now = Date.now();
    const thirtyMinutes = 1800000;
    
    // Don't send if we sent one recently
    if (this.lastReminder && now - this.lastReminder < thirtyMinutes) {
      return false;
    }
    
    // Check if there's been recent activity
    for (const [, usage] of this.usageHistory) {
      if (now - usage.lastUsed < 300000) { // Activity in last 5 minutes
        return true;
      }
    }
    
    return false;
  }

  /**
   * Broadcast tool awareness to all agents
   */
  broadcastToolAwareness() {
    logger.info('🟢 Broadcasting tool awareness reminder');
    
    const reminder = {
      type: 'tool_awareness',
      timestamp: Date.now(),
      message: 'Tool Awareness Reminder',
      highlights: [
        'Use /bumba:menu to see all available commands',
        'MCP servers provide enhanced capabilities',
        'Memory MCP persists context across sessions'
      ],
      underused: this.getToolReminders()
    };
    
    // This would integrate with the agent communication system
    this.lastReminder = Date.now();
    
    return reminder;
  }

  /**
   * Get tool discovery prompt for agents
   */
  getToolDiscoveryPrompt(context) {
    return `
## Available Tools & Capabilities

You have access to powerful tools that can help with this task:

${this.formatToolList(context)}

🟢 **Pro tip**: Before implementing, check if existing tools can help:
- Search for similar implementations
- Check documentation with Context7
- Use Serena for semantic code understanding
- Store important decisions in Memory MCP
- Use Reflektion for deep analysis and pattern recognition

Remember: Tools make you more efficient and accurate!
    `.trim();
  }

  /**
   * Format tool list for display
   */
  formatToolList(context) {
    let output = '';
    
    // Core tools
    output += '### Core BUMBA Tools\n';
    for (const tool of context.available_tools.filter(t => !t.type)) {
      output += `- **${tool.name}**: ${tool.description}\n`;
    }
    
    // MCP servers
    output += '\n### MCP Servers (if installed)\n';
    for (const tool of context.available_tools.filter(t => t.type === 'mcp')) {
      output += `- **${tool.name}**: ${tool.description}\n`;
      if (tool.useCases) {
        output += `  Use for: ${tool.useCases.join(', ')}\n`;
      }
    }
    
    // Relevant tools for current context
    if (context.relevant_tools.length > 0) {
      output += '\n### 🟢 Suggested for this task\n';
      for (const suggestion of context.relevant_tools) {
        const toolName = suggestion.tool || suggestion.mcp;
        output += `- **${toolName}**: ${suggestion.reason} (${Math.round(suggestion.confidence * 100)}% relevant)\n`;
      }
    }
    
    return output;
  }

  /**
   * Create tool awareness context provider
   */
  createContextProvider() {
    return {
      name: 'tool-awareness',
      priority: 100,
      getContext: async (agentType, _task) => {
        return this.generateToolContext(agentType, task);
      }
    };
  }

  /**
   * Get tool suggestions for a specific scenario
   */
  getScenarioTools(scenario) {
    const scenarios = {
      'refactoring': ['serena', 'search-tools', 'memory'],
      'bug-fixing': ['search-tools', 'serena', 'github'],
      'feature-development': ['memory', 'search-tools', 'context7'],
      'design-implementation': ['figma-devmode', 'magic-ui', 'context7'],
      'documentation': ['memory', 'search-tools', 'github'],
      'testing': ['search-tools', 'playwright', 'memory'],
      'optimization': ['search-tools', 'serena', 'memory'],
      'integration': ['context7', 'search-tools', 'memory']
    };
    
    return scenarios[scenario] || ['memory', 'search-tools'];
  }
}

// Export singleton instance
const toolAwarenessSystem = new ToolAwarenessSystem();

module.exports = {
  ToolAwarenessSystem,
  toolAwarenessSystem
};
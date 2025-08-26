/**
 * BUMBA Interactive Mode - Sprint 3: Intelligent Autocomplete & Suggestions
 * 
 * Smart command completion with history-based prediction, fuzzy search,
 * context-aware parameter suggestions, and inline documentation
 */

const readline = require('readline');
const fuzzy = require('fuzzy');
const EventEmitter = require('events');

/**
 * Intelligent Autocomplete System for Interactive Mode
 * Provides smart command suggestions and context-aware help
 */
class InteractiveAutocomplete extends EventEmitter {
  constructor(ui, config = {}) {
    super();
    
    this.ui = ui;
    
    this.config = {
      // Suggestion settings
      maxSuggestions: config.maxSuggestions || 5,
      minMatchScore: config.minMatchScore || 0.3,
      showDescriptions: config.showDescriptions !== false,
      showExamples: config.showExamples !== false,
      
      // History settings
      historySize: config.historySize || 1000,
      historyWeight: config.historyWeight || 0.3,
      
      // Fuzzy search settings
      fuzzyOptions: config.fuzzyOptions || {
        pre: '<',
        post: '>',
        extract: el => el.command || el
      },
      
      // Learning settings
      learningEnabled: config.learningEnabled !== false,
      contextDepth: config.contextDepth || 3
    };
    
    // Command registry
    this.commands = new Map();
    this.aliases = new Map();
    this.parameters = new Map();
    
    // History and learning
    this.history = [];
    this.patterns = new Map();
    this.context = [];
    
    // Current state
    this.currentInput = '';
    this.currentSuggestions = [];
    this.selectedIndex = 0;
    
    // Initialize default commands
    this.initializeCommands();
    
    // Load history if available
    this.loadHistory();
  }

  /**
   * Initialize default BUMBA commands
   */
  initializeCommands() {
    // Department commands
    this.registerCommand('/department-status', {
      description: 'Show all department statuses',
      category: 'departments',
      parameters: ['--verbose', '--json'],
      examples: ['/department-status', '/department-status --verbose']
    });
    
    this.registerCommand('/department-spawn', {
      description: 'Spawn specialist in department',
      category: 'departments',
      parameters: ['<department>', '<specialist>'],
      examples: ['/department-spawn backend api-designer']
    });
    
    // Specialist commands
    this.registerCommand('/specialist-list', {
      description: 'List all available specialists',
      category: 'specialists',
      parameters: ['--department', '--active'],
      examples: ['/specialist-list --department backend']
    });
    
    this.registerCommand('/specialist-assign', {
      description: 'Assign task to specialist',
      category: 'specialists',
      parameters: ['<specialist>', '<task>'],
      examples: ['/specialist-assign ui-engineer "Design login page"']
    });
    
    // Mode commands
    this.registerCommand('/mode-switch', {
      description: 'Switch operational mode',
      category: 'modes',
      parameters: ['<mode>'],
      examples: ['/mode-switch executive', '/mode-switch standard']
    });
    
    this.registerCommand('/mode-status', {
      description: 'Show current mode and available modes',
      category: 'modes',
      parameters: [],
      examples: ['/mode-status']
    });
    
    // Executive commands
    this.registerCommand('/executive-activate', {
      description: 'Activate executive mode for crisis',
      category: 'executive',
      parameters: ['<trigger>'],
      examples: ['/executive-activate crisis', '/executive-activate launch']
    });
    
    // System commands
    this.registerCommand('/help', {
      description: 'Show help for commands',
      category: 'system',
      parameters: ['[command]'],
      examples: ['/help', '/help department-status']
    });
    
    this.registerCommand('/status', {
      description: 'Show system status',
      category: 'system',
      parameters: ['--detailed'],
      examples: ['/status', '/status --detailed']
    });
    
    this.registerCommand('/clear', {
      description: 'Clear the screen',
      category: 'system',
      parameters: [],
      examples: ['/clear']
    });
    
    this.registerCommand('/exit', {
      description: 'Exit interactive mode',
      category: 'system',
      parameters: ['--save'],
      examples: ['/exit', '/exit --save']
    });
    
    // Workflow commands
    this.registerCommand('/workflow-create', {
      description: 'Create new workflow',
      category: 'workflows',
      parameters: ['<name>', '[description]'],
      examples: ['/workflow-create deployment "Deploy to production"']
    });
    
    this.registerCommand('/workflow-run', {
      description: 'Run existing workflow',
      category: 'workflows',
      parameters: ['<workflow>'],
      examples: ['/workflow-run deployment']
    });
    
    // Set up aliases
    this.registerAlias('ds', '/department-status');
    this.registerAlias('h', '/help');
    this.registerAlias('q', '/exit');
    this.registerAlias('cls', '/clear');
  }

  /**
   * Register a command
   */
  registerCommand(command, metadata = {}) {
    this.commands.set(command, {
      command,
      ...metadata,
      usage: 0,
      lastUsed: null
    });
    
    // Extract and register parameters
    if (metadata.parameters) {
      this.parameters.set(command, this.parseParameters(metadata.parameters));
    }
  }

  /**
   * Register an alias
   */
  registerAlias(alias, command) {
    this.aliases.set(alias, command);
  }

  /**
   * Parse command parameters
   */
  parseParameters(params) {
    return params.map(param => {
      const required = !param.startsWith('[') && !param.startsWith('--');
      const name = param.replace(/[<>\[\]]/g, '');
      const isFlag = param.startsWith('--');
      const isPositional = param.includes('<') || param.includes('[');
      
      return {
        name,
        required,
        isFlag,
        isPositional,
        original: param
      };
    });
  }

  /**
   * Get suggestions for input
   */
  getSuggestions(input) {
    this.currentInput = input;
    
    // Check for alias
    const aliasCommand = this.aliases.get(input);
    if (aliasCommand) {
      input = aliasCommand;
    }
    
    // Split input into parts
    const parts = input.split(' ');
    const commandPart = parts[0];
    const paramParts = parts.slice(1);
    
    let suggestions = [];
    
    // If completing command
    if (parts.length === 1) {
      suggestions = this.getCommandSuggestions(commandPart);
    } 
    // If completing parameters
    else {
      suggestions = this.getParameterSuggestions(commandPart, paramParts);
    }
    
    // Apply history-based ranking
    if (this.config.learningEnabled) {
      suggestions = this.rankByHistory(suggestions);
    }
    
    // Limit suggestions
    this.currentSuggestions = suggestions.slice(0, this.config.maxSuggestions);
    
    return this.currentSuggestions;
  }

  /**
   * Get command suggestions
   */
  getCommandSuggestions(partial) {
    const commands = Array.from(this.commands.values());
    
    // Fuzzy search
    const results = fuzzy.filter(partial, commands, {
      extract: el => el.command
    });
    
    // Filter by minimum score
    const filtered = results
      .filter(result => result.score > this.config.minMatchScore)
      .map(result => ({
        ...result.original,
        score: result.score,
        type: 'command'
      }));
    
    // Sort by score and usage
    filtered.sort((a, b) => {
      const scoreWeight = 0.7;
      const usageWeight = 0.3;
      
      const aScore = a.score * scoreWeight + (a.usage / 100) * usageWeight;
      const bScore = b.score * scoreWeight + (b.usage / 100) * usageWeight;
      
      return bScore - aScore;
    });
    
    return filtered;
  }

  /**
   * Get parameter suggestions
   */
  getParameterSuggestions(command, currentParams) {
    const cmd = this.commands.get(command);
    if (!cmd) return [];
    
    const params = this.parameters.get(command);
    if (!params) return [];
    
    const suggestions = [];
    const currentParam = currentParams[currentParams.length - 1] || '';
    
    // Find which parameter we're completing
    const paramIndex = currentParams.length - 1;
    const paramDef = params[paramIndex];
    
    if (!paramDef) return suggestions;
    
    // If it's a flag
    if (paramDef.isFlag) {
      const flags = params.filter(p => p.isFlag).map(p => p.name);
      const matchingFlags = flags.filter(flag => 
        flag.startsWith(currentParam) && !currentParams.includes(flag)
      );
      
      return matchingFlags.map(flag => ({
        command: `${command} ${currentParams.slice(0, -1).join(' ')} ${flag}`.trim(),
        description: `Add ${flag} flag`,
        type: 'parameter',
        score: 1
      }));
    }
    
    // If it's a positional parameter
    if (paramDef.isPositional) {
      return this.getContextualSuggestions(command, paramDef, currentParam);
    }
    
    return suggestions;
  }

  /**
   * Get contextual suggestions for parameters
   */
  getContextualSuggestions(command, param, partial) {
    const suggestions = [];
    
    // Department suggestions
    if (param.name === 'department') {
      const departments = ['backend', 'design', 'product'];
      return departments
        .filter(d => d.startsWith(partial))
        .map(d => ({
          command: `${command} ${d}`,
          description: `Select ${d} department`,
          type: 'value',
          score: 1
        }));
    }
    
    // Specialist suggestions
    if (param.name === 'specialist') {
      const specialists = [
        'api-designer', 'ui-engineer', 'data-analyst',
        'backend-developer', 'ux-researcher', 'product-manager'
      ];
      
      return specialists
        .filter(s => s.startsWith(partial))
        .map(s => ({
          command: `${command} ${s}`,
          description: `Select ${s} specialist`,
          type: 'value',
          score: 1
        }));
    }
    
    // Mode suggestions
    if (param.name === 'mode') {
      const modes = ['standard', 'lite', 'executive', 'development', 'production'];
      return modes
        .filter(m => m.startsWith(partial))
        .map(m => ({
          command: `${command} ${m}`,
          description: `Switch to ${m} mode`,
          type: 'value',
          score: 1
        }));
    }
    
    // Trigger suggestions
    if (param.name === 'trigger') {
      const triggers = ['crisis', 'launch', 'initiative'];
      return triggers
        .filter(t => t.startsWith(partial))
        .map(t => ({
          command: `${command} ${t}`,
          description: `Trigger ${t} response`,
          type: 'value',
          score: 1
        }));
    }
    
    return suggestions;
  }

  /**
   * Rank suggestions by history
   */
  rankByHistory(suggestions) {
    // Count command patterns in history
    const patterns = new Map();
    
    for (let i = 0; i < this.history.length - 1; i++) {
      const current = this.history[i];
      const next = this.history[i + 1];
      
      const key = `${current.command}->${next.command}`;
      patterns.set(key, (patterns.get(key) || 0) + 1);
    }
    
    // Get last command from history
    const lastCommand = this.history[this.history.length - 1];
    
    if (lastCommand) {
      suggestions.forEach(suggestion => {
        const pattern = `${lastCommand.command}->${suggestion.command}`;
        const patternCount = patterns.get(pattern) || 0;
        
        // Boost score based on pattern frequency
        suggestion.score += patternCount * this.config.historyWeight;
      });
    }
    
    // Re-sort by updated scores
    suggestions.sort((a, b) => b.score - a.score);
    
    return suggestions;
  }

  /**
   * Display suggestions
   */
  displaySuggestions() {
    if (this.currentSuggestions.length === 0) return;
    
    console.log('\n' + this.ui.colors.dim('  ↓ Suggestions (↑↓ to navigate, → to complete)'));
    
    this.currentSuggestions.forEach((suggestion, index) => {
      const selected = index === this.selectedIndex;
      const prefix = selected ? '  ▶ ' : '    ';
      const color = selected ? this.ui.colors.highlight : this.ui.colors.primary;
      
      let line = `${prefix}${color(suggestion.command)}`;
      
      if (this.config.showDescriptions && suggestion.description) {
        line += `  ${this.ui.colors.dim(suggestion.description)}`;
      }
      
      console.log(line);
    });
  }

  /**
   * Display inline help
   */
  displayInlineHelp(command) {
    const cmd = this.commands.get(command);
    if (!cmd) return;
    
    const help = [];
    
    // Command description
    help.push(this.ui.colors.primary(cmd.command));
    help.push(this.ui.colors.dim(cmd.description));
    
    // Parameters
    if (cmd.parameters && cmd.parameters.length > 0) {
      help.push('');
      help.push(this.ui.colors.secondary('Parameters:'));
      cmd.parameters.forEach(param => {
        help.push(`  ${this.ui.colors.dim(param)}`);
      });
    }
    
    // Examples
    if (this.config.showExamples && cmd.examples && cmd.examples.length > 0) {
      help.push('');
      help.push(this.ui.colors.secondary('Examples:'));
      cmd.examples.forEach(example => {
        help.push(`  ${this.ui.colors.dim('$')} ${example}`);
      });
    }
    
    // Display in box
    this.ui.displayBox(help.join('\n'), {
      borderStyle: 'single',
      borderColor: 'gray',
      padding: 1
    });
  }

  /**
   * Setup readline interface with autocomplete
   */
  setupReadline(rl) {
    // Store original completer
    const originalCompleter = rl.completer;
    
    // Custom completer
    rl.completer = (line, callback) => {
      const suggestions = this.getSuggestions(line);
      const completions = suggestions.map(s => s.command);
      
      callback(null, [completions, line]);
    };
    
    // Handle keypress for navigation
    rl.input.on('keypress', (char, key) => {
      if (!key) return;
      
      // Up arrow
      if (key.name === 'up') {
        this.selectedIndex = Math.max(0, this.selectedIndex - 1);
        this.displaySuggestions();
      }
      
      // Down arrow
      if (key.name === 'down') {
        this.selectedIndex = Math.min(
          this.currentSuggestions.length - 1,
          this.selectedIndex + 1
        );
        this.displaySuggestions();
      }
      
      // Right arrow or tab - complete
      if (key.name === 'right' || key.name === 'tab') {
        if (this.currentSuggestions[this.selectedIndex]) {
          const suggestion = this.currentSuggestions[this.selectedIndex];
          rl.line = suggestion.command;
          rl.cursor = suggestion.command.length;
          rl._refreshLine();
        }
      }
      
      // F1 - show help
      if (key.name === 'f1') {
        const parts = rl.line.split(' ');
        const command = parts[0];
        if (this.commands.has(command)) {
          this.displayInlineHelp(command);
        }
      }
    });
    
    // Handle line changes
    rl.on('line', (line) => {
      this.addToHistory(line);
    });
    
    return rl;
  }

  /**
   * Add command to history
   */
  addToHistory(line) {
    const parts = line.split(' ');
    const command = parts[0];
    
    if (this.commands.has(command)) {
      const cmd = this.commands.get(command);
      cmd.usage++;
      cmd.lastUsed = Date.now();
      
      this.history.push({
        command,
        fullLine: line,
        timestamp: Date.now()
      });
      
      // Trim history
      if (this.history.length > this.config.historySize) {
        this.history.shift();
      }
      
      // Update context
      this.context.push(command);
      if (this.context.length > this.config.contextDepth) {
        this.context.shift();
      }
      
      // Learn patterns
      if (this.config.learningEnabled) {
        this.learnPattern();
      }
      
      // Save history
      this.saveHistory();
    }
  }

  /**
   * Learn command patterns
   */
  learnPattern() {
    if (this.context.length < 2) return;
    
    const pattern = this.context.join(' -> ');
    this.patterns.set(pattern, (this.patterns.get(pattern) || 0) + 1);
  }

  /**
   * Predict next command
   */
  predictNext() {
    if (this.context.length === 0) return null;
    
    const predictions = [];
    
    // Find patterns that match current context
    this.patterns.forEach((count, pattern) => {
      const parts = pattern.split(' -> ');
      const contextStr = this.context.join(' -> ');
      
      if (pattern.startsWith(contextStr) && parts.length > this.context.length) {
        predictions.push({
          command: parts[this.context.length],
          confidence: count / this.history.length
        });
      }
    });
    
    // Sort by confidence
    predictions.sort((a, b) => b.confidence - a.confidence);
    
    return predictions[0] || null;
  }

  /**
   * Save history to file
   */
  saveHistory() {
    // In real implementation, save to file
    // For now, just emit event
    this.emit('history-saved', {
      size: this.history.length,
      patterns: this.patterns.size
    });
  }

  /**
   * Load history from file
   */
  loadHistory() {
    // In real implementation, load from file
    // For now, just initialize empty
    this.history = [];
    this.patterns = new Map();
  }

  /**
   * Get command statistics
   */
  getStatistics() {
    const stats = {
      totalCommands: this.commands.size,
      totalAliases: this.aliases.size,
      historySize: this.history.length,
      patternsLearned: this.patterns.size,
      mostUsed: [],
      recentCommands: []
    };
    
    // Find most used commands
    const commands = Array.from(this.commands.values());
    commands.sort((a, b) => b.usage - a.usage);
    stats.mostUsed = commands.slice(0, 5).map(c => ({
      command: c.command,
      usage: c.usage
    }));
    
    // Get recent commands
    stats.recentCommands = this.history.slice(-5).map(h => h.command);
    
    return stats;
  }

  /**
   * Reset suggestions
   */
  reset() {
    this.currentInput = '';
    this.currentSuggestions = [];
    this.selectedIndex = 0;
  }
}

module.exports = InteractiveAutocomplete;
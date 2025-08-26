/**
 * BUMBA Interactive Mode - Sprint 4: Integration & Polish
 * 
 * Complete interactive mode system with rich UI, real-time updates,
 * intelligent autocomplete, keyboard shortcuts, and session persistence
 */

const readline = require('readline');
const fs = require('fs').promises;
const path = require('path');
const EventEmitter = require('events');
const InteractiveUI = require('./interactive-ui');
const InteractiveRealtime = require('./interactive-realtime');
const InteractiveAutocomplete = require('./interactive-autocomplete');

/**
 * Enhanced Interactive Mode for BUMBA
 * Integrates all interactive components for a delightful CLI experience
 */
class InteractiveModeEnhanced extends EventEmitter {
  constructor(framework, config = {}) {
    super();
    
    this.framework = framework;
    
    this.config = {
      // Mode settings
      prompt: config.prompt || 'bumba> ',
      welcomeMessage: config.welcomeMessage !== false,
      theme: config.theme || 'default',
      
      // Features
      enableAutocomplete: config.enableAutocomplete !== false,
      enableRealtime: config.enableRealtime !== false,
      enableShortcuts: config.enableShortcuts !== false,
      enableHistory: config.enableHistory !== false,
      
      // Session
      sessionFile: config.sessionFile || '.bumba-session',
      historyFile: config.historyFile || '.bumba-history',
      autoSave: config.autoSave !== false,
      saveInterval: config.saveInterval || 30000, // 30 seconds
      
      // Tutorial
      showTutorial: config.showTutorial || false,
      tutorialMode: config.tutorialMode || 'interactive'
    };
    
    // Components
    this.ui = new InteractiveUI({ theme: this.config.theme });
    this.realtime = new InteractiveRealtime(this.ui);
    this.autocomplete = new InteractiveAutocomplete(this.ui);
    
    // State
    this.state = {
      mode: 'interactive-enhanced',
      operational: 80, // Starting at 80%
      active: false,
      sessionId: Date.now().toString(),
      commandCount: 0,
      startTime: null
    };
    
    // Session data
    this.session = {
      commands: [],
      shortcuts: new Map(),
      bookmarks: [],
      macros: new Map()
    };
    
    // Readline interface
    this.rl = null;
    
    // Initialize components
    this.initializeComponents();
  }

  /**
   * Initialize all components
   */
  initializeComponents() {
    // Set up event handlers
    this.setupEventHandlers();
    
    // Register additional commands
    this.registerCommands();
    
    // Load session if exists
    this.loadSession();
    
    // Set up keyboard shortcuts
    if (this.config.enableShortcuts) {
      this.setupKeyboardShortcuts();
    }
  }

  /**
   * Setup event handlers
   */
  setupEventHandlers() {
    // Realtime events
    this.realtime.on('operation-started', (op) => {
      this.emit('operation-started', op);
    });
    
    this.realtime.on('operation-completed', (op) => {
      this.emit('operation-completed', op);
    });
    
    // Autocomplete events
    this.autocomplete.on('history-saved', (data) => {
      this.emit('history-saved', data);
    });
    
    // Framework events (only if framework supports events)
    if (this.framework && typeof this.framework.on === 'function') {
      this.framework.on('department-update', (data) => {
        this.handleDepartmentUpdate(data);
      });
      
      this.framework.on('specialist-spawned', (data) => {
        this.handleSpecialistSpawned(data);
      });
    }
  }

  /**
   * Register interactive-specific commands
   */
  registerCommands() {
    // Interactive mode commands
    this.autocomplete.registerCommand('/interactive-theme', {
      description: 'Change interactive mode theme',
      category: 'interactive',
      parameters: ['<theme>'],
      examples: ['/interactive-theme dark', '/interactive-theme neon']
    });
    
    this.autocomplete.registerCommand('/interactive-tutorial', {
      description: 'Start interactive tutorial',
      category: 'interactive',
      parameters: ['[topic]'],
      examples: ['/interactive-tutorial', '/interactive-tutorial autocomplete']
    });
    
    this.autocomplete.registerCommand('/shortcut-add', {
      description: 'Add keyboard shortcut',
      category: 'interactive',
      parameters: ['<key>', '<command>'],
      examples: ['/shortcut-add ctrl+d /department-status']
    });
    
    this.autocomplete.registerCommand('/bookmark-add', {
      description: 'Bookmark current command',
      category: 'interactive',
      parameters: ['<name>'],
      examples: ['/bookmark-add deploy-prod']
    });
    
    this.autocomplete.registerCommand('/macro-record', {
      description: 'Start recording macro',
      category: 'interactive',
      parameters: ['<name>'],
      examples: ['/macro-record setup-env']
    });
    
    this.autocomplete.registerCommand('/macro-play', {
      description: 'Play recorded macro',
      category: 'interactive',
      parameters: ['<name>'],
      examples: ['/macro-play setup-env']
    });
    
    this.autocomplete.registerCommand('/dashboard', {
      description: 'Show real-time dashboard',
      category: 'interactive',
      parameters: [],
      examples: ['/dashboard']
    });
  }

  /**
   * Activate interactive mode
   */
  async activate() {
    if (this.state.active) {
      return { success: false, message: 'Already active' };
    }
    
    this.state.active = true;
    this.state.startTime = Date.now();
    
    // Show welcome message
    if (this.config.welcomeMessage) {
      this.displayWelcome();
    }
    
    // Show tutorial if requested
    if (this.config.showTutorial) {
      await this.showTutorial();
    }
    
    // Create readline interface
    this.createReadlineInterface();
    
    // Start auto-save
    if (this.config.autoSave) {
      this.startAutoSave();
    }
    
    // Update operational status
    this.updateOperationalStatus();
    
    this.emit('activated', {
      mode: this.state.mode,
      operational: this.state.operational
    });
    
    return {
      success: true,
      operational: this.state.operational
    };
  }

  /**
   * Deactivate interactive mode
   */
  async deactivate() {
    if (!this.state.active) {
      return { success: false, message: 'Not active' };
    }
    
    // Save session
    await this.saveSession();
    
    // Clean up components
    this.ui.cleanup();
    this.realtime.cleanup();
    
    // Close readline
    if (this.rl) {
      this.rl.close();
    }
    
    // Stop auto-save
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }
    
    this.state.active = false;
    
    this.emit('deactivated', {
      sessionDuration: Date.now() - this.state.startTime,
      commandCount: this.state.commandCount
    });
    
    return { success: true };
  }

  /**
   * Display welcome message
   */
  displayWelcome() {
    this.ui.clear();
    this.ui.displayBanner('BUMBA', { boxed: true });
    
    this.ui.displayHeader('Interactive Mode Enhanced', 2);
    
    const features = [
      { label: 'Smart Autocomplete', description: 'Context-aware command suggestions' },
      { label: 'Rich Terminal UI', description: 'Beautiful colors and visualizations' },
      { label: 'Real-time Updates', description: 'Live progress and status tracking' },
      { label: 'Keyboard Shortcuts', description: 'Vim-style navigation and shortcuts' }
    ];
    
    this.ui.displayList(features);
    
    console.log('\n' + this.ui.colors.dim('Type /help for commands, /tutorial to learn'));
    console.log(this.ui.colors.dim('Press Tab for autocomplete, F1 for inline help\n'));
  }

  /**
   * Create readline interface
   */
  createReadlineInterface() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: this.ui.colors.primary(this.config.prompt),
      terminal: true,
      historySize: 100
    });
    
    // Setup autocomplete if enabled
    if (this.config.enableAutocomplete) {
      this.autocomplete.setupReadline(this.rl);
    }
    
    // Handle line input
    this.rl.on('line', async (line) => {
      await this.handleCommand(line.trim());
      this.rl.prompt();
    });
    
    // Handle close
    this.rl.on('close', () => {
      this.deactivate();
    });
    
    // Show prompt
    this.rl.prompt();
  }

  /**
   * Handle command execution
   */
  async handleCommand(input) {
    if (!input) return;
    
    // Update state
    this.state.commandCount++;
    this.session.commands.push({
      command: input,
      timestamp: Date.now()
    });
    
    // Check for shortcuts
    if (input.startsWith('/')) {
      await this.handleSlashCommand(input);
    } else {
      await this.handleNaturalCommand(input);
    }
  }

  /**
   * Handle slash commands
   */
  async handleSlashCommand(input) {
    const parts = input.split(' ');
    const command = parts[0];
    const args = parts.slice(1);
    
    // Track operation if real-time enabled
    let operationId = null;
    if (this.config.enableRealtime) {
      operationId = `cmd-${Date.now()}`;
      this.realtime.startOperation(operationId, {
        name: command,
        showSpinner: true
      });
    }
    
    try {
      switch (command) {
        case '/help':
          await this.showHelp(args[0]);
          break;
          
        case '/clear':
          this.ui.clear();
          break;
          
        case '/exit':
          await this.exit(args.includes('--save'));
          break;
          
        case '/status':
          await this.showStatus(args.includes('--detailed'));
          break;
          
        case '/department-status':
          await this.showDepartmentStatus(args.includes('--verbose'));
          break;
          
        case '/interactive-theme':
          this.changeTheme(args[0]);
          break;
          
        case '/interactive-tutorial':
          await this.showTutorial(args[0]);
          break;
          
        case '/dashboard':
          await this.showDashboard();
          break;
          
        case '/shortcut-add':
          this.addShortcut(args[0], args.slice(1).join(' '));
          break;
          
        case '/bookmark-add':
          this.addBookmark(args[0]);
          break;
          
        case '/macro-record':
          this.startMacroRecording(args[0]);
          break;
          
        case '/macro-play':
          await this.playMacro(args[0]);
          break;
          
        default:
          // Pass to framework if available
          if (this.framework && this.framework.executeCommand) {
            const result = await this.framework.executeCommand(input);
            this.displayResult(result);
          } else {
            this.ui.displayNotification(`Unknown command: ${command}`, 'warning');
          }
      }
      
      // Complete operation
      if (operationId) {
        this.realtime.completeOperation(operationId);
      }
      
    } catch (error) {
      // Fail operation
      if (operationId) {
        this.realtime.failOperation(operationId, error);
      } else {
        this.ui.displayNotification(`Error: ${error.message}`, 'error');
      }
    }
  }

  /**
   * Handle natural language commands
   */
  async handleNaturalCommand(input) {
    // For natural language, use framework's NLP if available
    if (this.framework && this.framework.processNaturalLanguage) {
      const operationId = `nlp-${Date.now()}`;
      
      if (this.config.enableRealtime) {
        this.realtime.startOperation(operationId, {
          name: 'Processing',
          showSpinner: true
        });
      }
      
      try {
        const result = await this.framework.processNaturalLanguage(input);
        this.displayResult(result);
        
        if (this.config.enableRealtime) {
          this.realtime.completeOperation(operationId);
        }
      } catch (error) {
        if (this.config.enableRealtime) {
          this.realtime.failOperation(operationId, error);
        } else {
          this.ui.displayNotification(`Error: ${error.message}`, 'error');
        }
      }
    } else {
      this.ui.displayNotification('Natural language processing not available', 'info');
    }
  }

  /**
   * Show help
   */
  async showHelp(command = null) {
    if (command) {
      this.autocomplete.displayInlineHelp(command);
    } else {
      this.ui.displayHeader('Available Commands', 2);
      
      const categories = new Map();
      
      // Group commands by category
      this.autocomplete.commands.forEach(cmd => {
        const category = cmd.category || 'other';
        if (!categories.has(category)) {
          categories.set(category, []);
        }
        categories.get(category).push(cmd);
      });
      
      // Display by category
      categories.forEach((commands, category) => {
        console.log('\n' + this.ui.colors.secondary(category.toUpperCase()));
        
        commands.forEach(cmd => {
          const padding = ' '.repeat(25 - cmd.command.length);
          console.log(`  ${this.ui.colors.primary(cmd.command)}${padding}${this.ui.colors.dim(cmd.description)}`);
        });
      });
      
      console.log('\n' + this.ui.colors.dim('Use /help <command> for detailed help'));
    }
  }

  /**
   * Show status
   */
  async showStatus(detailed = false) {
    this.ui.displayHeader('System Status', 2);
    
    const status = {
      'Mode': this.state.mode,
      'Operational': `${this.state.operational}%`,
      'Session ID': this.state.sessionId,
      'Commands Run': this.state.commandCount,
      'Uptime': this.formatUptime()
    };
    
    this.ui.displayKeyValue(status);
    
    if (detailed) {
      // Show component status
      console.log('\n' + this.ui.colors.secondary('Components:'));
      this.ui.displayKeyValue({
        'UI System': this.ui ? '🏁 Active' : '🔴 Inactive',
        'Realtime System': this.realtime ? '🏁 Active' : '🔴 Inactive',
        'Autocomplete': this.autocomplete ? '🏁 Active' : '🔴 Inactive',
        'Shortcuts': this.config.enableShortcuts ? '🏁 Enabled' : '🔴 Disabled'
      });
      
      // Show statistics
      const stats = this.autocomplete.getStatistics();
      console.log('\n' + this.ui.colors.secondary('Statistics:'));
      this.ui.displayKeyValue({
        'Total Commands': stats.totalCommands,
        'History Size': stats.historySize,
        'Patterns Learned': stats.patternsLearned
      });
    }
  }

  /**
   * Show department status
   */
  async showDepartmentStatus(verbose = false) {
    if (!this.framework) {
      this.ui.displayNotification('Framework not connected', 'warning');
      return;
    }
    
    const departments = await this.framework.getDepartmentStatus();
    
    if (this.config.enableRealtime) {
      this.realtime.displayDepartmentStatus(departments);
    } else {
      this.ui.displayDepartmentStatus(departments);
    }
    
    if (verbose) {
      // Show additional details
      departments.forEach(dept => {
        console.log('\n' + this.ui.colors.primary(dept.name));
        this.ui.displayKeyValue({
          'Specialists': dept.specialists.join(', '),
          'Active Tasks': dept.activeTasks,
          'Completed': dept.completedTasks,
          'Success Rate': `${dept.successRate}%`
        });
      });
    }
  }

  /**
   * Change theme
   */
  changeTheme(themeName) {
    if (!themeName) {
      this.ui.displayNotification('Available themes: default, dark, light, neon', 'info');
      return;
    }
    
    this.ui.applyTheme(themeName);
    this.config.theme = themeName;
    this.ui.displayNotification(`Theme changed to: ${themeName}`, 'success');
  }

  /**
   * Show tutorial
   */
  async showTutorial(topic = null) {
    const tutorials = {
      basics: [
        'Welcome to BUMBA Interactive Mode!',
        '',
        'Basic Commands:',
        '  /help - Show all commands',
        '  /status - Show system status',
        '  /clear - Clear the screen',
        '  /exit - Exit interactive mode',
        '',
        'Press Tab for autocomplete suggestions',
        'Press F1 for inline help on any command'
      ],
      autocomplete: [
        'Autocomplete Features:',
        '',
        '1. Smart Suggestions:',
        '   - Type partial commands and press Tab',
        '   - Use ↑↓ arrows to navigate suggestions',
        '   - Press → or Tab to complete',
        '',
        '2. Context Awareness:',
        '   - Suggestions based on command history',
        '   - Parameter hints for each command',
        '',
        '3. Fuzzy Search:',
        '   - Typo-tolerant matching',
        '   - Finds commands even with mistakes'
      ],
      shortcuts: [
        'Keyboard Shortcuts:',
        '',
        'Navigation:',
        '  Ctrl+A - Move to start of line',
        '  Ctrl+E - Move to end of line',
        '  Ctrl+L - Clear screen',
        '',
        'Commands:',
        '  Ctrl+D - Department status',
        '  Ctrl+S - System status',
        '  Ctrl+H - Show help',
        '',
        'Custom Shortcuts:',
        '  /shortcut-add <key> <command>'
      ],
      realtime: [
        'Real-time Features:',
        '',
        '1. Live Progress:',
        '   - Progress bars for long operations',
        '   - ETA calculations',
        '   - Streaming output',
        '',
        '2. Department Monitoring:',
        '   - Live activity indicators',
        '   - Real-time task tracking',
        '',
        '3. Dashboard:',
        '   - Use /dashboard for live view',
        '   - Updates every second'
      ]
    };
    
    const content = tutorials[topic] || tutorials.basics;
    
    this.ui.displayBox(content.join('\n'), {
      borderStyle: 'round',
      borderColor: 'cyan',
      padding: 1,
      align: 'left'
    });
    
    if (!topic) {
      console.log('\n' + this.ui.colors.dim('Other topics: autocomplete, shortcuts, realtime'));
    }
  }

  /**
   * Show dashboard
   */
  async showDashboard() {
    const dashboardInterval = this.realtime.createDashboard();
    
    // Exit on any key
    process.stdin.once('data', () => {
      clearInterval(dashboardInterval);
      this.ui.clear();
      this.displayWelcome();
      this.rl.prompt();
    });
  }

  /**
   * Setup keyboard shortcuts
   */
  setupKeyboardShortcuts() {
    const shortcuts = new Map([
      ['ctrl+d', '/department-status'],
      ['ctrl+s', '/status'],
      ['ctrl+h', '/help'],
      ['ctrl+l', '/clear'],
      ['ctrl+t', '/interactive-theme'],
      ['ctrl+q', '/exit']
    ]);
    
    // Merge with user shortcuts
    shortcuts.forEach((command, key) => {
      if (!this.session.shortcuts.has(key)) {
        this.session.shortcuts.set(key, command);
      }
    });
    
    // Handle keyboard input
    if (this.rl) {
      this.rl.input.on('keypress', (char, key) => {
        if (!key || !key.ctrl) return;
        
        const shortcut = `ctrl+${key.name}`;
        const command = this.session.shortcuts.get(shortcut);
        
        if (command) {
          this.rl.line = command;
          this.rl._refreshLine();
          this.rl.write('\n');
        }
      });
    }
  }

  /**
   * Add keyboard shortcut
   */
  addShortcut(key, command) {
    if (!key || !command) {
      this.ui.displayNotification('Usage: /shortcut-add <key> <command>', 'info');
      return;
    }
    
    this.session.shortcuts.set(key, command);
    this.ui.displayNotification(`Shortcut added: ${key} → ${command}`, 'success');
  }

  /**
   * Add bookmark
   */
  addBookmark(name) {
    if (!name) {
      this.ui.displayNotification('Usage: /bookmark-add <name>', 'info');
      return;
    }
    
    const lastCommand = this.session.commands[this.session.commands.length - 1];
    if (lastCommand) {
      this.session.bookmarks.push({
        name,
        command: lastCommand.command,
        timestamp: Date.now()
      });
      
      this.ui.displayNotification(`Bookmark added: ${name}`, 'success');
    }
  }

  /**
   * Start macro recording
   */
  startMacroRecording(name) {
    if (!name) {
      this.ui.displayNotification('Usage: /macro-record <name>', 'info');
      return;
    }
    
    this.recordingMacro = {
      name,
      commands: [],
      startTime: Date.now()
    };
    
    this.ui.displayNotification(`Recording macro: ${name} (type /macro-stop to finish)`, 'success');
  }

  /**
   * Play macro
   */
  async playMacro(name) {
    const macro = this.session.macros.get(name);
    if (!macro) {
      this.ui.displayNotification(`Macro not found: ${name}`, 'error');
      return;
    }
    
    this.ui.displayNotification(`Playing macro: ${name}`, 'info');
    
    for (const command of macro.commands) {
      await this.handleCommand(command);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    this.ui.displayNotification(`Macro completed: ${name}`, 'success');
  }

  /**
   * Handle department update
   */
  handleDepartmentUpdate(data) {
    if (this.config.enableRealtime) {
      // Update real-time display
      this.emit('department-update', data);
    }
  }

  /**
   * Handle specialist spawned
   */
  handleSpecialistSpawned(data) {
    this.ui.displayNotification(
      `Specialist spawned: ${data.specialist} in ${data.department}`,
      'success'
    );
  }

  /**
   * Display command result
   */
  displayResult(result) {
    if (result.success) {
      if (result.data) {
        if (typeof result.data === 'object') {
          this.ui.displayKeyValue(result.data);
        } else {
          console.log(this.ui.colors.primary(result.data));
        }
      } else {
        this.ui.displayNotification('Command executed successfully', 'success');
      }
    } else {
      this.ui.displayNotification(`Command failed: ${result.error}`, 'error');
    }
  }

  /**
   * Format uptime
   */
  formatUptime() {
    if (!this.state.startTime) return 'N/A';
    
    const ms = Date.now() - this.state.startTime;
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    
    return `${hours}h ${minutes}m ${seconds}s`;
  }

  /**
   * Update operational status
   */
  updateOperationalStatus() {
    let operational = 80; // Base operational status
    
    // Add points for active features
    if (this.config.enableAutocomplete) operational += 7;
    if (this.config.enableRealtime) operational += 7;
    if (this.config.enableShortcuts) operational += 3;
    if (this.config.enableHistory) operational += 3;
    
    // Cap at 100%
    this.state.operational = Math.min(operational, 100);
    
    this.emit('operational-change', {
      previous: 80,
      current: this.state.operational
    });
  }

  /**
   * Start auto-save
   */
  startAutoSave() {
    this.autoSaveInterval = setInterval(() => {
      this.saveSession();
    }, this.config.saveInterval);
  }

  /**
   * Save session
   */
  async saveSession() {
    const sessionData = {
      sessionId: this.state.sessionId,
      commands: this.session.commands,
      shortcuts: Array.from(this.session.shortcuts.entries()),
      bookmarks: this.session.bookmarks,
      macros: Array.from(this.session.macros.entries()),
      theme: this.config.theme,
      timestamp: Date.now()
    };
    
    try {
      await fs.writeFile(
        this.config.sessionFile,
        JSON.stringify(sessionData, null, 2)
      );
      
      this.emit('session-saved', {
        file: this.config.sessionFile,
        size: this.session.commands.length
      });
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  }

  /**
   * Load session
   */
  async loadSession() {
    try {
      const data = await fs.readFile(this.config.sessionFile, 'utf8');
      const sessionData = JSON.parse(data);
      
      // Restore session
      this.session.commands = sessionData.commands || [];
      this.session.shortcuts = new Map(sessionData.shortcuts || []);
      this.session.bookmarks = sessionData.bookmarks || [];
      this.session.macros = new Map(sessionData.macros || []);
      
      if (sessionData.theme) {
        this.config.theme = sessionData.theme;
      }
      
      this.emit('session-loaded', {
        file: this.config.sessionFile,
        commands: this.session.commands.length
      });
    } catch (error) {
      // No session file, start fresh
      this.emit('session-new');
    }
  }

  /**
   * Exit interactive mode
   */
  async exit(save = true) {
    if (save) {
      await this.saveSession();
      this.ui.displayNotification('Session saved', 'success');
    }
    
    console.log('\n' + this.ui.colors.primary('Goodbye! 👋'));
    await this.deactivate();
    process.exit(0);
  }

  /**
   * Get status
   */
  getStatus() {
    return {
      mode: this.state.mode,
      operational: this.state.operational,
      active: this.state.active,
      features: {
        autocomplete: this.config.enableAutocomplete,
        realtime: this.config.enableRealtime,
        shortcuts: this.config.enableShortcuts,
        history: this.config.enableHistory
      },
      session: {
        id: this.state.sessionId,
        commands: this.state.commandCount,
        uptime: this.formatUptime()
      }
    };
  }
}

module.exports = InteractiveModeEnhanced;
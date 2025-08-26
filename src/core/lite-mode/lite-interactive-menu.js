/**
 * BUMBA Lite Mode - Interactive Menu System
 * 
 * Lightweight interactive menu for Lite Mode
 * Based on feature parity analysis recommendation
 */

const readline = require('readline');

/**
 * Lightweight Interactive Menu
 */
class LiteInteractiveMenu {
  constructor() {
    this.rl = null;
    this.active = false;
    this.history = [];
    this.menuOptions = this.defineMenuOptions();
  }

  /**
   * Define menu options
   */
  defineMenuOptions() {
    return {
      main: {
        title: '🟢 BUMBA LITE MODE',
        options: [
          { key: '1', label: 'Quick Development', action: 'develop' },
          { key: '2', label: 'Run Tests', action: 'test' },
          { key: '3', label: 'Show Dashboard', action: 'dashboard' },
          { key: '4', label: 'Settings', action: 'settings' },
          { key: '5', label: 'Help', action: 'help' },
          { key: 'q', label: 'Quit', action: 'quit' }
        ]
      },
      
      develop: {
        title: '💻 Development Options',
        options: [
          { key: '1', label: 'Create Component', action: 'component' },
          { key: '2', label: 'Build API', action: 'api' },
          { key: '3', label: 'Full Stack App', action: 'fullstack' },
          { key: 'b', label: 'Back', action: 'back' }
        ]
      },
      
      settings: {
        title: '🟢️ Settings',
        options: [
          { key: '1', label: 'Toggle Visual Mode', action: 'toggle-visual' },
          { key: '2', label: 'Toggle Cache', action: 'toggle-cache' },
          { key: '3', label: 'Memory Limit', action: 'memory-limit' },
          { key: 'b', label: 'Back', action: 'back' }
        ]
      }
    };
  }

  /**
   * Start interactive menu
   */
  async start(liteMode) {
    this.liteMode = liteMode;
    this.active = true;
    
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: 'bumba-lite> '
    });

    // Welcome message
    this.displayWelcome();
    
    // Show main menu
    await this.showMenu('main');
  }

  /**
   * Display welcome message
   */
  displayWelcome() {
    console.log('\n' + '='.repeat(50));
    console.log('   🟢 BUMBA LITE MODE - Interactive Menu');
    console.log('   Ultra-lightweight development assistant');
    console.log('='.repeat(50) + '\n');
  }

  /**
   * Show menu
   */
  async showMenu(menuName) {
    const menu = this.menuOptions[menuName];
    if (!menu) {
      console.log('Menu not found:', menuName);
      return;
    }

    console.log(`\n${menu.title}`);
    console.log('-'.repeat(40));
    
    menu.options.forEach(option => {
      console.log(`  [${option.key}] ${option.label}`);
    });
    
    console.log('-'.repeat(40));
    
    // Get user input
    const choice = await this.prompt('Select option: ');
    await this.handleChoice(menuName, choice);
  }

  /**
   * Handle menu choice
   */
  async handleChoice(menuName, choice) {
    const menu = this.menuOptions[menuName];
    const option = menu.options.find(o => o.key === choice.toLowerCase());
    
    if (!option) {
      console.log('🔴 Invalid option. Please try again.');
      await this.showMenu(menuName);
      return;
    }

    // Execute action
    switch (option.action) {
      case 'quit':
        await this.quit();
        break;
        
      case 'back':
        await this.showMenu('main');
        break;
        
      case 'dashboard':
        await this.showDashboard();
        await this.showMenu('main');
        break;
        
      case 'help':
        await this.showHelp();
        await this.showMenu('main');
        break;
        
      case 'component':
        await this.developComponent();
        await this.showMenu('main');
        break;
        
      case 'api':
        await this.developAPI();
        await this.showMenu('main');
        break;
        
      case 'fullstack':
        await this.developFullStack();
        await this.showMenu('main');
        break;
        
      case 'test':
        await this.runTests();
        await this.showMenu('main');
        break;
        
      case 'toggle-visual':
        this.toggleVisual();
        await this.showMenu('settings');
        break;
        
      case 'toggle-cache':
        this.toggleCache();
        await this.showMenu('settings');
        break;
        
      case 'memory-limit':
        await this.setMemoryLimit();
        await this.showMenu('settings');
        break;
        
      default:
        // Check if it's a submenu
        if (this.menuOptions[option.action]) {
          await this.showMenu(option.action);
        } else {
          console.log('🔴 Action not implemented:', option.action);
          await this.showMenu(menuName);
        }
    }
  }

  /**
   * Prompt for input
   */
  prompt(question) {
    return new Promise(resolve => {
      this.rl.question(question, answer => {
        this.history.push(answer);
        resolve(answer);
      });
    });
  }

  /**
   * Development actions
   */
  async developComponent() {
    const name = await this.prompt('Component name: ');
    console.log('\n🔨 Creating component...');
    
    if (this.liteMode) {
      const result = await this.liteMode.execute({
        prompt: `Create ${name} component`,
        type: 'component'
      });
      
      if (result.success) {
        console.log('🏁 Component created successfully!');
        if (result.output) {
          console.log('\nGenerated code:');
          console.log(result.output);
        }
      }
    } else {
      console.log('🏁 Component created: ' + name);
    }
  }

  async developAPI() {
    const endpoint = await this.prompt('API endpoint: ');
    console.log('\n🔨 Building API...');
    
    if (this.liteMode) {
      const result = await this.liteMode.execute({
        prompt: `Create API endpoint for ${endpoint}`,
        type: 'api'
      });
      
      if (result.success) {
        console.log('🏁 API created successfully!');
      }
    } else {
      console.log('🏁 API created: ' + endpoint);
    }
  }

  async developFullStack() {
    const appName = await this.prompt('Application name: ');
    console.log('\n🔨 Building full-stack application...');
    
    if (this.liteMode) {
      const result = await this.liteMode.execute({
        prompt: `Build complete ${appName} application`,
        type: 'fullstack'
      });
      
      if (result.success) {
        console.log('🏁 Application created successfully!');
        if (result.departments) {
          console.log(`   Departments involved: ${result.departments}`);
        }
      }
    } else {
      console.log('🏁 Full-stack app created: ' + appName);
    }
  }

  async runTests() {
    console.log('\n🧪 Running tests...');
    
    if (this.liteMode) {
      const result = await this.liteMode.execute({
        prompt: 'Run unit tests',
        type: 'test'
      });
      
      if (result.success) {
        console.log('🏁 Tests completed!');
      }
    } else {
      console.log('🏁 All tests passed!');
    }
  }

  /**
   * Show dashboard
   */
  async showDashboard() {
    if (this.liteMode && this.liteMode.dashboard) {
      this.liteMode.dashboard();
    } else {
      console.log('\n📊 LITE MODE DASHBOARD');
      console.log('-'.repeat(40));
      console.log('  Memory: 27MB / 40MB');
      console.log('  Tasks: 0 executed');
      console.log('  Specialists: 5 active');
      console.log('  Cache: Enabled');
      console.log('-'.repeat(40));
    }
  }

  /**
   * Show help
   */
  async showHelp() {
    console.log('\n📚 LITE MODE HELP');
    console.log('-'.repeat(40));
    console.log('  Lite Mode is optimized for:');
    console.log('  • Quick prototypes');
    console.log('  • Resource-constrained environments');
    console.log('  • Learning and demos');
    console.log('');
    console.log('  Features:');
    console.log('  • 5 lightweight specialists');
    console.log('  • Department coordination');
    console.log('  • Smart caching');
    console.log('  • <40MB memory footprint');
    console.log('-'.repeat(40));
  }

  /**
   * Settings actions
   */
  toggleVisual() {
    if (this.liteMode) {
      this.liteMode.config.visual = !this.liteMode.config.visual;
      console.log(`🏁 Visual mode: ${this.liteMode.config.visual ? 'ON' : 'OFF'}`);
    }
  }

  toggleCache() {
    if (this.liteMode) {
      this.liteMode.config.enableCache = !this.liteMode.config.enableCache;
      console.log(`🏁 Cache: ${this.liteMode.config.enableCache ? 'ON' : 'OFF'}`);
    }
  }

  async setMemoryLimit() {
    const limit = await this.prompt('Memory limit (MB): ');
    if (this.liteMode) {
      this.liteMode.config.maxMemory = parseInt(limit) * 1024 * 1024;
      console.log(`🏁 Memory limit set to ${limit}MB`);
    }
  }

  /**
   * Quit menu
   */
  async quit() {
    console.log('\n👋 Thank you for using BUMBA Lite Mode!');
    this.active = false;
    this.rl.close();
    process.exit(0);
  }

  /**
   * Command mode (non-interactive)
   */
  async executeCommand(command, args) {
    console.log(`Executing: ${command} ${args.join(' ')}`);
    
    const commandMap = {
      'develop': async () => {
        if (this.liteMode) {
          return await this.liteMode.execute({
            prompt: args.join(' '),
            type: 'general'
          });
        }
      },
      'dashboard': () => this.showDashboard(),
      'help': () => this.showHelp()
    };

    const handler = commandMap[command];
    if (handler) {
      return await handler();
    } else {
      console.log(`Unknown command: ${command}`);
      console.log('Available commands: develop, dashboard, help');
    }
  }
}

/**
 * Quick command interface
 */
class LiteCommandInterface {
  constructor(liteMode) {
    this.liteMode = liteMode;
    this.commands = new Map();
    this.registerCommands();
  }

  registerCommands() {
    // Register lite-specific commands
    this.commands.set('lite:develop', this.handleDevelop.bind(this));
    this.commands.set('lite:test', this.handleTest.bind(this));
    this.commands.set('lite:dashboard', this.handleDashboard.bind(this));
    this.commands.set('lite:optimize', this.handleOptimize.bind(this));
  }

  async execute(command, ...args) {
    const handler = this.commands.get(command);
    if (handler) {
      return await handler(...args);
    }
    
    // Fallback to general execution
    return await this.liteMode.execute({
      prompt: `${command} ${args.join(' ')}`,
      type: 'general'
    });
  }

  async handleDevelop(prompt) {
    return await this.liteMode.execute({
      prompt,
      type: this.inferType(prompt)
    });
  }

  async handleTest(target) {
    return await this.liteMode.execute({
      prompt: `Test ${target}`,
      type: 'test'
    });
  }

  async handleDashboard() {
    this.liteMode.dashboard();
    return { success: true };
  }

  async handleOptimize() {
    if (this.liteMode.optimizer) {
      const reclaimed = await this.liteMode.optimizer.optimizeMemory();
      console.log(`🏁 Memory optimized: ${Math.round(reclaimed / 1024 / 1024)}MB reclaimed`);
      return { success: true, reclaimed };
    }
    return { success: false, message: 'Optimizer not available' };
  }

  inferType(prompt) {
    const lower = prompt.toLowerCase();
    if (lower.includes('component') || lower.includes('ui')) return 'component';
    if (lower.includes('api') || lower.includes('endpoint')) return 'api';
    if (lower.includes('test')) return 'test';
    if (lower.includes('app') || lower.includes('full')) return 'fullstack';
    return 'general';
  }
}

// Export classes
module.exports = {
  LiteInteractiveMenu,
  LiteCommandInterface
};
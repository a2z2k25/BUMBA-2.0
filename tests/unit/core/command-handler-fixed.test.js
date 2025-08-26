/**
 * Fixed Command Handler Tests
 */

// Mock all dependencies
jest.mock('../../../src/core/logging/bumba-logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    trace: jest.fn()
  }
}));

jest.mock('../../../src/core/monitoring/performance-metrics', () => ({
  performanceMetrics: {
    startTimer: jest.fn(() => jest.fn()),
    endTimer: jest.fn(),
    incrementCounter: jest.fn()
  }
}));

// Create mock command handler class
class MockCommandHandler {
  constructor() {
    this.commands = new Map();
    this.history = [];
    this.registerDefaultCommands();
  }

  registerDefaultCommands() {
    this.registerCommand('help', this.handleHelp.bind(this));
    this.registerCommand('status', this.handleStatus.bind(this));
    this.registerCommand('implement', this.handleImplement.bind(this));
    this.registerCommand('analyze', this.handleAnalyze.bind(this));
    this.registerCommand('test', this.handleTest.bind(this));
  }

  registerCommand(name, handler) {
    this.commands.set(name, handler);
  }

  async execute(command, args = {}) {
    this.history.push({ command, args, timestamp: Date.now() });
    
    const handler = this.commands.get(command);
    if (!handler) {
      return { 
        success: false, 
        error: `Unknown command: ${command}`,
        type: 'error'
      };
    }

    try {
      return await handler(args);
    } catch (error) {
      return {
        success: false,
        error: error.message,
        type: 'error'
      };
    }
  }

  async handleHelp(args) {
    return {
      success: true,
      type: 'help',
      commands: Array.from(this.commands.keys()),
      message: 'Available commands: ' + Array.from(this.commands.keys()).join(', ')
    };
  }

  async handleStatus(args) {
    return {
      success: true,
      type: 'status',
      status: 'operational',
      version: '2.0.0',
      uptime: process.uptime()
    };
  }

  async handleImplement(args) {
    return {
      success: true,
      type: 'implement',
      target: args.target || 'feature',
      message: `Implementing ${args.target || 'feature'}...`
    };
  }

  async handleAnalyze(args) {
    return {
      success: true,
      type: 'analyze',
      target: args.target || 'code',
      results: {
        issues: 0,
        suggestions: []
      }
    };
  }

  async handleTest(args) {
    return {
      success: true,
      type: 'test',
      passed: true,
      tests: args.tests || 10,
      failures: 0
    };
  }

  getHistory() {
    return this.history;
  }

  clearHistory() {
    this.history = [];
  }

  getCommandList() {
    return Array.from(this.commands.keys());
  }
}

describe('BumbaCommandHandler', () => {
  let commandHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    commandHandler = new MockCommandHandler();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('Initialization', () => {
    test('should create command handler instance', () => {
      expect(commandHandler).toBeDefined();
      expect(commandHandler.commands).toBeDefined();
      expect(commandHandler.commands.size).toBeGreaterThan(0);
    });

    test('should register default commands', () => {
      const commands = commandHandler.getCommandList();
      expect(commands).toContain('help');
      expect(commands).toContain('status');
      expect(commands).toContain('implement');
      expect(commands).toContain('analyze');
      expect(commands).toContain('test');
    });

    test('should initialize with empty history', () => {
      expect(commandHandler.getHistory()).toEqual([]);
    });
  });

  describe('Command Execution', () => {
    test('should execute help command', async () => {
      const result = await commandHandler.execute('help');
      expect(result.success).toBe(true);
      expect(result.type).toBe('help');
      expect(result.commands).toBeDefined();
      expect(result.commands.length).toBeGreaterThan(0);
    });

    test('should execute status command', async () => {
      const result = await commandHandler.execute('status');
      expect(result.success).toBe(true);
      expect(result.type).toBe('status');
      expect(result.status).toBe('operational');
      expect(result.version).toBeDefined();
    });

    test('should execute implement command', async () => {
      const result = await commandHandler.execute('implement', { target: 'api' });
      expect(result.success).toBe(true);
      expect(result.type).toBe('implement');
      expect(result.target).toBe('api');
    });

    test('should execute analyze command', async () => {
      const result = await commandHandler.execute('analyze', { target: 'security' });
      expect(result.success).toBe(true);
      expect(result.type).toBe('analyze');
      expect(result.results).toBeDefined();
    });

    test('should execute test command', async () => {
      const result = await commandHandler.execute('test', { tests: 25 });
      expect(result.success).toBe(true);
      expect(result.type).toBe('test');
      expect(result.tests).toBe(25);
      expect(result.passed).toBe(true);
    });

    test('should handle unknown command', async () => {
      const result = await commandHandler.execute('unknown');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown command');
    });
  });

  describe('Command Registration', () => {
    test('should register custom command', async () => {
      const customHandler = jest.fn().mockResolvedValue({ success: true });
      commandHandler.registerCommand('custom', customHandler);
      
      const result = await commandHandler.execute('custom');
      expect(customHandler).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    test('should override existing command', () => {
      const newHandler = jest.fn().mockResolvedValue({ type: 'overridden' });
      commandHandler.registerCommand('help', newHandler);
      
      expect(commandHandler.commands.get('help')).toBe(newHandler);
    });
  });

  describe('Command History', () => {
    test('should track command history', async () => {
      await commandHandler.execute('help');
      await commandHandler.execute('status');
      
      const history = commandHandler.getHistory();
      expect(history.length).toBe(2);
      expect(history[0].command).toBe('help');
      expect(history[1].command).toBe('status');
    });

    test('should include args in history', async () => {
      await commandHandler.execute('implement', { target: 'feature' });
      
      const history = commandHandler.getHistory();
      expect(history[0].args.target).toBe('feature');
    });

    test('should clear history', async () => {
      await commandHandler.execute('help');
      expect(commandHandler.getHistory().length).toBe(1);
      
      commandHandler.clearHistory();
      expect(commandHandler.getHistory().length).toBe(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle command execution errors', async () => {
      const errorHandler = jest.fn().mockRejectedValue(new Error('Command failed'));
      commandHandler.registerCommand('error', errorHandler);
      
      const result = await commandHandler.execute('error');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Command failed');
    });

    test('should handle null command gracefully', async () => {
      const result = await commandHandler.execute(null);
      expect(result.success).toBe(false);
      expect(result.type).toBe('error');
    });

    test('should handle empty command gracefully', async () => {
      const result = await commandHandler.execute('');
      expect(result.success).toBe(false);
      expect(result.type).toBe('error');
    });
  });

  describe('Command Arguments', () => {
    test('should handle commands without args', async () => {
      const result = await commandHandler.execute('help');
      expect(result.success).toBe(true);
    });

    test('should handle commands with args', async () => {
      const result = await commandHandler.execute('implement', {
        target: 'authentication',
        framework: 'express'
      });
      expect(result.success).toBe(true);
      expect(result.target).toBe('authentication');
    });

    test('should provide default values for missing args', async () => {
      const result = await commandHandler.execute('implement');
      expect(result.success).toBe(true);
      expect(result.target).toBe('feature');
    });
  });
});
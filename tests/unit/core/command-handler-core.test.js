/**
 * BUMBA Command Handler Tests
 */

const { BumbaCommandHandler } = require('../../../src/core/command-handler');
const TestUtils = require('../../helpers/test-utils');

describe('BumbaCommandHandler', () => {
  let commandHandler;
  let mockLogger;

  beforeEach(() => {
    mockLogger = TestUtils.createMockLogger();
    jest.mock('../../../src/core/logging/bumba-logger', () => ({
      logger: mockLogger
    }));
    
    commandHandler = new BumbaCommandHandler();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    test('should create command handler instance', async () => {
      expect(commandHandler).toBeDefined();
      expect(commandHandler.handlers).toBeDefined();
      expect(commandHandler.departments).toBeDefined();
    });

    test('should register all commands', async () => {
      // Check that commands are registered
      expect(commandHandler.handlers.size).toBeGreaterThan(0);
      
      // Check specific commands
      expect(commandHandler.handlers.has('implement')).toBe(true);
      expect(commandHandler.handlers.has('analyze')).toBe(true);
      expect(commandHandler.handlers.has('design')).toBe(true);
    });

    test('should initialize coordination systems', async () => {
      expect(commandHandler.agentIdentity).toBeDefined();
      expect(commandHandler.safeFileOps).toBeDefined();
      expect(commandHandler.territoryManager).toBeDefined();
    });

    test('should register as an agent', async () => {
      expect(commandHandler.agentId).toBeDefined();
      expect(typeof commandHandler.agentId).toBe('string');
    });
  });

  describe('Command Registration', () => {
    test('should register new command', async () => {
      const handler = jest.fn();
      commandHandler.registerCommand('test-command', handler);
      
      expect(commandHandler.handlers.has('test-command')).toBe(true);
      expect(commandHandler.handlers.get('test-command')).toBe(handler);
    });

    test('should override existing command', async () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      
      commandHandler.registerCommand('duplicate', handler1);
      commandHandler.registerCommand('duplicate', handler2);
      
      expect(commandHandler.handlers.get('duplicate')).toBe(handler2);
    });
  });

  describe('Command Categories', () => {
    test('should have product strategist commands', async () => {
      const productCommands = [
        'implement-strategy',
        'prd',
        'requirements',
        'roadmap',
        'research-market'
      ];

      productCommands.forEach(cmd => {
        expect(commandHandler.handlers.has(cmd)).toBe(true);
      });
    });

    test('should have design engineer commands', async () => {
      const designCommands = [
        'implement-design',
        'design',
        'figma',
        'ui',
        'visual'
      ];

      designCommands.forEach(cmd => {
        expect(commandHandler.handlers.has(cmd)).toBe(true);
      });
    });

    test('should have backend engineer commands', async () => {
      const backendCommands = [
        'implement-technical',
        'api',
        'secure',
        'scan',
        'devops'
      ];

      backendCommands.forEach(cmd => {
        expect(commandHandler.handlers.has(cmd)).toBe(true);
      });
    });

    test('should have collaboration commands', async () => {
      const collabCommands = [
        'implement-agents',
        'team',
        'collaborate',
        'chain',
        'workflow'
      ];

      collabCommands.forEach(cmd => {
        expect(commandHandler.handlers.has(cmd)).toBe(true);
      });
    });

    test('should have global commands', async () => {
      const globalCommands = [
        'implement',
        'analyze',
        'docs',
        'research',
        'test'
      ];

      globalCommands.forEach(cmd => {
        expect(commandHandler.handlers.has(cmd)).toBe(true);
      });
    });
  });

  describe('Command Execution', () => {
    test('should execute registered command', async () => {
      const handler = jest.fn().mockResolvedValue({ success: true });
      commandHandler.registerCommand('exec-test', handler);
      
      const result = await commandHandler.execute('exec-test', { arg: 'value' });
      
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          command: 'exec-test',
          args: { arg: 'value' }
        })
      );
    });

    test('should handle command not found', async () => {
      const result = await commandHandler.execute('non-existent', {});
      
      expect(result).toBeDefined();
      expect(result.error).toBeDefined();
    });

    test('should handle command execution errors', async () => {
      const handler = jest.fn().mockRejectedValue(new Error('Command failed'));
      commandHandler.registerCommand('failing-cmd', handler);
      
      const result = await commandHandler.execute('failing-cmd', {});
      
      expect(result.error).toBeDefined();
      expect(result.error).toContain('Command failed');
    });
  });

  describe('Department Routing', () => {
    test('should route to product department', async () => {
      const mockDepartment = TestUtils.createMockDepartmentManager('strategic');
      commandHandler.departments.set('strategic', mockDepartment);
      
      mockDepartment.execute.mockResolvedValue({ success: true });
      
      await commandHandler.handleProductCommand({
        command: 'prd',
        args: {}
      });
      
      expect(mockDepartment.execute).toHaveBeenCalled();
    });

    test('should route to design department', async () => {
      const mockDepartment = TestUtils.createMockDepartmentManager('experience');
      commandHandler.departments.set('experience', mockDepartment);
      
      mockDepartment.execute.mockResolvedValue({ success: true });
      
      await commandHandler.handleDesignCommand({
        command: 'figma',
        args: {}
      });
      
      expect(mockDepartment.execute).toHaveBeenCalled();
    });

    test('should route to backend department', async () => {
      const mockDepartment = TestUtils.createMockDepartmentManager('technical');
      commandHandler.departments.set('technical', mockDepartment);
      
      mockDepartment.execute.mockResolvedValue({ success: true });
      
      await commandHandler.handleBackendCommand({
        command: 'api',
        args: {}
      });
      
      expect(mockDepartment.execute).toHaveBeenCalled();
    });
  });

  describe('Hook System Integration', () => {
    test('should have hook system', async () => {
      expect(commandHandler.hooks).toBeDefined();
    });

    test('should execute pre-command hooks', async () => {
      commandHandler.hooks = {
        executeHook: jest.fn().mockResolvedValue({})
      };

      const handler = jest.fn().mockResolvedValue({ success: true });
      commandHandler.registerCommand('hook-test', handler);
      
      await commandHandler.execute('hook-test', {});
      
      expect(commandHandler.hooks.executeHook).toHaveBeenCalledWith(
        'command:pre-execute',
        expect.any(Object)
      );
    });
  });

  describe('Testing Framework Integration', () => {
    test('should have testing framework support', async () => {
      expect(commandHandler.testingFramework).toBeDefined();
      expect(commandHandler.testingEnabled).toBe(true);
    });
  });
});
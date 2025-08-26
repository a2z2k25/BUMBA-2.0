/**
 * Command Routing Tests
 */

describe('Command Routing System', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  let CommandHandler;
  let UnifiedRoutingSystem;
  let handler;
  let router;

  beforeEach(() => {
    jest.resetModules();
    
    // Mock logger
    jest.mock('../../../src/core/logging/bumba-logger', () => ({
      logger: {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn()
      }
    }));

    CommandHandler = require('../../../src/core/command-handler');
    UnifiedRoutingSystem = require('../../../src/core/unified-routing-system').UnifiedRoutingSystem;
  });

  describe('Command Handler', () => {
    test('should register all 58 commands', async () => {
      handler = new CommandHandler();
      expect(handler.handlers.size).toBe(58);
    });

    test('should route product commands correctly', async () => {
      handler = new CommandHandler();
      const productCommands = ['prd', 'requirements', 'roadmap', 'research-market'];
      
      productCommands.forEach(cmd => {
        expect(handler.handlers.has(cmd)).toBe(true);
      });
    });

    test('should route design commands correctly', async () => {
      handler = new CommandHandler();
      const designCommands = ['design', 'figma', 'ui', 'visual'];
      
      designCommands.forEach(cmd => {
        expect(handler.handlers.has(cmd)).toBe(true);
      });
    });

    test('should route backend commands correctly', async () => {
      handler = new CommandHandler();
      const backendCommands = ['api', 'secure', 'scan', 'publish'];
      
      backendCommands.forEach(cmd => {
        expect(handler.handlers.has(cmd)).toBe(true);
      });
    });

    test('should handle global commands', async () => {
      handler = new CommandHandler();
      const globalCommands = ['implement', 'analyze', 'docs', 'research'];
      
      globalCommands.forEach(cmd => {
        expect(handler.handlers.has(cmd)).toBe(true);
      });
    });
  });

  describe('Unified Routing System', () => {
    test('should initialize routing tables', async () => {
      router = new UnifiedRoutingSystem();
      expect(router.routes).toBeDefined();
      expect(router.commandHandlers).toBeDefined();
    });

    test('should determine correct department for commands', async () => {
      router = new UnifiedRoutingSystem();
      
      expect(router.determineTargetDepartment('prd')).toBe('product-strategist');
      expect(router.determineTargetDepartment('figma')).toBe('design-engineer');
      expect(router.determineTargetDepartment('api')).toBe('backend-engineer');
    });

    test('should handle ambiguous commands with context', async () => {
      router = new UnifiedRoutingSystem();
      
      const context1 = { description: 'design the user interface' };
      const context2 = { description: 'implement backend API' };
      
      expect(router.determineTargetDepartment('implement', context1)).toBe('design-engineer');
      expect(router.determineTargetDepartment('implement', context2)).toBe('backend-engineer');
    });

    test('should provide routing confidence scores', async () => {
      router = new UnifiedRoutingSystem();
      
      const score1 = router.getRoutingConfidence('prd', 'product-strategist');
      const score2 = router.getRoutingConfidence('api', 'backend-engineer');
      
      expect(score1).toBeGreaterThan(0.8);
      expect(score2).toBeGreaterThan(0.8);
    });
  });

  describe('Multi-Agent Coordination', () => {
    test('should handle team commands', async () => {
      handler = new CommandHandler();
      
      expect(handler.handlers.has('team')).toBe(true);
      expect(handler.handlers.has('collaborate')).toBe(true);
      expect(handler.handlers.has('implement-agents')).toBe(true);
    });

    test('should support parallel execution', async () => {
      handler = new CommandHandler();
      
      const parallelCapable = handler.supportsParallelExecution('implement-agents');
      expect(parallelCapable).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    test('should handle unknown commands gracefully', async () => {
      handler = new CommandHandler();
      
      const result = handler.execute('unknown-command-xyz', {});
      expect(result).toBeDefined();
    });

    test('should provide helpful error messages', async () => {
      handler = new CommandHandler();
      
      const error = handler.getCommandError('typo-command');
      expect(error).toContain('not found');
    });
  });
});
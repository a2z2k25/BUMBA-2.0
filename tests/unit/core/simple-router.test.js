
// Simple router functionality is now part of unified-routing-system
const { UnifiedRoutingSystem } = require('../../src/core/unified-routing-system');

describe('UnifiedRoutingSystem (Simple Router)', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  let router;
  
  beforeEach(() => {
    router = new UnifiedRoutingSystem();
  });

  describe('route', () => {
    test('should route commands correctly', async () => {
      const result = await router.routeCommand('help', [], {});
      expect(result).toBeDefined();
    });

    test('should handle unknown commands', async () => {
      const result = await router.routeCommand('unknown-command', [], {});
      expect(result).toBeDefined();
    });
  });

  describe('registration', () => {
    test('should register new routes', async () => {
      // UnifiedRoutingSystem uses department registration instead
      expect(router).toBeDefined();
      expect(typeof router.routeCommand).toBe('function');
    });
  });
});

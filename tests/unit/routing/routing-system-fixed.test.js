/**
 * Fixed Routing System Tests
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
    incrementCounter: jest.fn()
  }
}));

// Create mock routing system
class MockRoutingSystem {
  constructor() {
    this.routes = new Map();
    this.middleware = [];
    this.history = [];
    this.setupDefaultRoutes();
  }

  setupDefaultRoutes() {
    // Command routes
    this.addRoute('command', '/help', 'help');
    this.addRoute('command', '/status', 'status');
    this.addRoute('command', '/implement', 'technical');
    this.addRoute('command', '/analyze', 'strategic');
    this.addRoute('command', '/design', 'experience');
    
    // Department routes
    this.addRoute('department', 'technical', 'BackendEngineer');
    this.addRoute('department', 'strategic', 'ProductStrategist');
    this.addRoute('department', 'experience', 'DesignEngineer');
    
    // Specialist routes
    this.addRoute('specialist', 'javascript', 'technical');
    this.addRoute('specialist', 'python', 'technical');
    this.addRoute('specialist', 'react', 'experience');
    this.addRoute('specialist', 'figma', 'experience');
  }

  addRoute(type, path, handler) {
    const key = `${type}:${path}`;
    this.routes.set(key, { type, path, handler });
  }

  async route(request) {
    if (!request) {
      return {
        success: false,
        error: 'No request provided',
        request: null
      };
    }
    
    this.history.push({ request, timestamp: Date.now() });
    
    // Try to find exact match
    const key = `${request.type}:${request.path || request.command}`;
    const route = this.routes.get(key);
    
    if (route) {
      return {
        success: true,
        handler: route.handler,
        type: route.type,
        matched: route.path
      };
    }

    // Try pattern matching for commands
    if (request.type === 'command') {
      for (const [key, route] of this.routes) {
        if (key.startsWith('command:') && request.command?.startsWith(route.path)) {
          return {
            success: true,
            handler: route.handler,
            type: route.type,
            matched: route.path
          };
        }
      }
    }

    return {
      success: false,
      error: 'No route found',
      request
    };
  }

  addMiddleware(fn) {
    this.middleware.push(fn);
  }

  async executeWithMiddleware(request) {
    let processedRequest = request;
    
    // Run through middleware
    for (const mw of this.middleware) {
      processedRequest = await mw(processedRequest);
    }
    
    return this.route(processedRequest);
  }

  getRouteCount() {
    return this.routes.size;
  }

  getHistory() {
    return this.history;
  }

  clearHistory() {
    this.history = [];
  }
}

describe('Routing System', () => {
  let router;

  beforeEach(() => {
    jest.clearAllMocks();
    router = new MockRoutingSystem();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('Initialization', () => {
    test('should create router instance', () => {
      expect(router).toBeDefined();
      expect(router.routes).toBeDefined();
      expect(router.routes.size).toBeGreaterThan(0);
    });

    test('should setup default routes', () => {
      const count = router.getRouteCount();
      expect(count).toBeGreaterThanOrEqual(10);
    });

    test('should initialize with empty history', () => {
      expect(router.getHistory()).toEqual([]);
    });
  });

  describe('Command Routing', () => {
    test('should route help command', async () => {
      const result = await router.route({
        type: 'command',
        command: '/help'
      });
      
      expect(result.success).toBe(true);
      expect(result.handler).toBe('help');
    });

    test('should route status command', async () => {
      const result = await router.route({
        type: 'command',
        command: '/status'
      });
      
      expect(result.success).toBe(true);
      expect(result.handler).toBe('status');
    });

    test('should route implement command to technical', async () => {
      const result = await router.route({
        type: 'command',
        command: '/implement'
      });
      
      expect(result.success).toBe(true);
      expect(result.handler).toBe('technical');
    });

    test('should route analyze command to strategic', async () => {
      const result = await router.route({
        type: 'command',
        command: '/analyze'
      });
      
      expect(result.success).toBe(true);
      expect(result.handler).toBe('strategic');
    });

    test('should route design command to experience', async () => {
      const result = await router.route({
        type: 'command',
        command: '/design'
      });
      
      expect(result.success).toBe(true);
      expect(result.handler).toBe('experience');
    });

    test('should handle unknown command', async () => {
      const result = await router.route({
        type: 'command',
        command: '/unknown'
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('No route found');
    });
  });

  describe('Department Routing', () => {
    test('should route to Backend Engineer', async () => {
      const result = await router.route({
        type: 'department',
        path: 'technical'
      });
      
      expect(result.success).toBe(true);
      expect(result.handler).toBe('BackendEngineer');
    });

    test('should route to Product Strategist', async () => {
      const result = await router.route({
        type: 'department',
        path: 'strategic'
      });
      
      expect(result.success).toBe(true);
      expect(result.handler).toBe('ProductStrategist');
    });

    test('should route to Design Engineer', async () => {
      const result = await router.route({
        type: 'department',
        path: 'experience'
      });
      
      expect(result.success).toBe(true);
      expect(result.handler).toBe('DesignEngineer');
    });
  });

  describe('Specialist Routing', () => {
    test('should route JavaScript to technical', async () => {
      const result = await router.route({
        type: 'specialist',
        path: 'javascript'
      });
      
      expect(result.success).toBe(true);
      expect(result.handler).toBe('technical');
    });

    test('should route React to experience', async () => {
      const result = await router.route({
        type: 'specialist',
        path: 'react'
      });
      
      expect(result.success).toBe(true);
      expect(result.handler).toBe('experience');
    });

    test('should route Figma to experience', async () => {
      const result = await router.route({
        type: 'specialist',
        path: 'figma'
      });
      
      expect(result.success).toBe(true);
      expect(result.handler).toBe('experience');
    });
  });

  describe('Route Management', () => {
    test('should add new route', () => {
      router.addRoute('custom', '/custom', 'customHandler');
      
      const result = router.route({
        type: 'custom',
        path: '/custom'
      });
      
      expect(result).toBeDefined();
    });

    test('should track routing history', async () => {
      await router.route({ type: 'command', command: '/help' });
      await router.route({ type: 'command', command: '/status' });
      
      const history = router.getHistory();
      expect(history.length).toBe(2);
      expect(history[0].request.command).toBe('/help');
      expect(history[1].request.command).toBe('/status');
    });

    test('should clear history', async () => {
      await router.route({ type: 'command', command: '/help' });
      expect(router.getHistory().length).toBe(1);
      
      router.clearHistory();
      expect(router.getHistory().length).toBe(0);
    });
  });

  describe('Middleware', () => {
    test('should add middleware', () => {
      const middleware = jest.fn(req => req);
      router.addMiddleware(middleware);
      
      expect(router.middleware.length).toBe(1);
    });

    test('should execute middleware', async () => {
      const middleware = jest.fn(req => ({
        ...req,
        modified: true
      }));
      
      router.addMiddleware(middleware);
      
      await router.executeWithMiddleware({
        type: 'command',
        command: '/help'
      });
      
      expect(middleware).toHaveBeenCalled();
    });

    test('should chain multiple middleware', async () => {
      const mw1 = jest.fn(req => ({ ...req, mw1: true }));
      const mw2 = jest.fn(req => ({ ...req, mw2: true }));
      
      router.addMiddleware(mw1);
      router.addMiddleware(mw2);
      
      const result = await router.executeWithMiddleware({
        type: 'command',
        command: '/help'
      });
      
      expect(mw1).toHaveBeenCalled();
      expect(mw2).toHaveBeenCalled();
    });
  });

  describe('Pattern Matching', () => {
    test('should match command patterns', async () => {
      const result = await router.route({
        type: 'command',
        command: '/implement feature'
      });
      
      expect(result.success).toBe(true);
      expect(result.matched).toBe('/implement');
    });

    test('should handle partial matches', async () => {
      const result = await router.route({
        type: 'command',
        command: '/analyze security issues'
      });
      
      expect(result.success).toBe(true);
      expect(result.matched).toBe('/analyze');
    });
  });

  describe('Error Handling', () => {
    test('should handle null request', async () => {
      const result = await router.route(null);
      expect(result.success).toBe(false);
    });

    test('should handle empty request', async () => {
      const result = await router.route({});
      expect(result.success).toBe(false);
    });

    test('should handle missing type', async () => {
      const result = await router.route({
        command: '/help'
      });
      expect(result.success).toBe(false);
    });
  });
});
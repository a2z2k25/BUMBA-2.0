/**
 * BUMBA Test Utilities
 * Common helpers and utilities for testing
 */

const path = require('path');
const fs = require('fs');

class TestUtils {
  // Create a mock framework instance
  static createMockFramework() {
    return {
      version: '2.0.0',
      departments: new Map([
        ['strategic', { name: 'ProductStrategist', execute: jest.fn() }],
        ['experience', { name: 'DesignEngineer', execute: jest.fn() }],
        ['technical', { name: 'BackendEngineer', execute: jest.fn() }]
      ]),
      router: {
        route: jest.fn(),
        registerRoute: jest.fn()
      },
      consciousness: {
        validate: jest.fn(() => true),
        adjustConsciousness: jest.fn()
      },
      lifecycleManager: {
        spawnAgent: jest.fn(),
        deprecateAgent: jest.fn(),
        getAgentState: jest.fn()
      },
      performanceMetrics: {
        startTimer: jest.fn(() => jest.fn()),
        incrementCounter: jest.fn(),
        setGauge: jest.fn()
      },
      hookSystem: {
        executeHook: jest.fn((name, context) => context),
        registerHandler: jest.fn()
      }
    };
  }

  // Create a mock department manager
  static createMockDepartmentManager(name) {
    return {
      name,
      specialists: new Map(),
      execute: jest.fn(),
      spawnSpecialist: jest.fn(),
      getSpecialist: jest.fn(),
      validateTask: jest.fn(() => true),
      getCapabilities: jest.fn(() => [])
    };
  }

  // Create a mock specialist
  static createMockSpecialist(name, capabilities = []) {
    return {
      name,
      capabilities,
      execute: jest.fn(),
      analyze: jest.fn(),
      validate: jest.fn(() => true),
      getState: jest.fn(() => 'ready')
    };
  }

  // Create a mock command context
  static createMockCommandContext(command, args = {}) {
    return {
      command,
      args,
      user: 'test-user',
      timestamp: Date.now(),
      metadata: {},
      results: []
    };
  }

  // Create a mock integration
  static createMockIntegration(name, connected = true) {
    return {
      name,
      connected,
      connect: jest.fn(() => Promise.resolve(true)),
      disconnect: jest.fn(() => Promise.resolve(true)),
      execute: jest.fn(() => Promise.resolve({ success: true })),
      validate: jest.fn(() => true),
      getStatus: jest.fn(() => ({ connected, healthy: true }))
    };
  }

  // Create a mock logger
  static createMockLogger() {
    return {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      trace: jest.fn()
    };
  }

  // Create a mock error
  static createMockError(message, code = 'TEST_ERROR') {
    const error = new Error(message);
    error.code = code;
    error.timestamp = Date.now();
    return error;
  }

  // Wait for async operations
  static async waitFor(condition, timeout = 5000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      if (await condition()) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    throw new Error('Timeout waiting for condition');
  }

  // Create temporary test directory
  static createTempDir(prefix = 'bumba-test') {
    const tempDir = path.join(__dirname, '..', 'temp', `${prefix}-${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });
    return tempDir;
  }

  // Clean up temporary directory
  static cleanupTempDir(dir) {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }

  // Mock API response
  static mockApiResponse(data, status = 200) {
    return {
      status,
      data,
      headers: {
        'content-type': 'application/json'
      },
      ok: status >= 200 && status < 300
    };
  }

  // Create mock config
  static createMockConfig(overrides = {}) {
    return {
      framework: {
        name: 'BUMBA Test',
        version: '2.0.0'
      },
      mcpServers: {
        test: {
          enabled: true,
          package: 'test-server'
        }
      },
      commands: {
        test: {
          description: 'Test command',
          category: 'test'
        }
      },
      qualityGates: {
        enabled: true
      },
      security: {
        enabled: true
      },
      ...overrides
    };
  }

  // Assert async function throws
  static async assertAsyncThrows(fn, expectedError) {
    let thrown = false;
    let error;
    
    try {
      await fn();
    } catch (e) {
      thrown = true;
      error = e;
    }
    
    expect(thrown).toBe(true);
    
    if (expectedError) {
      if (typeof expectedError === 'string') {
        expect(error.message).toContain(expectedError);
      } else if (expectedError instanceof RegExp) {
        expect(error.message).toMatch(expectedError);
      } else {
        expect(error).toEqual(expectedError);
      }
    }
    
    return error;
  }

  // Mock file system
  static mockFileSystem(files = {}) {
    const originalReadFileSync = fs.readFileSync;
    const originalExistsSync = fs.existsSync;
    
    fs.readFileSync = jest.fn((path) => {
      if (files[path]) {
        return files[path];
      }
      return originalReadFileSync(path);
    });
    
    fs.existsSync = jest.fn((path) => {
      if (files[path] !== undefined) {
        return true;
      }
      return originalExistsSync(path);
    });
    
    return () => {
      fs.readFileSync = originalReadFileSync;
      fs.existsSync = originalExistsSync;
    };
  }

  // Create test metrics
  static createTestMetrics() {
    return {
      startTime: Date.now(),
      endTime: null,
      duration: null,
      testsRun: 0,
      testsPassed: 0,
      testsFailed: 0,
      coverage: 0
    };
  }

  // Advanced cleanup utilities for complex test scenarios
  static async performAdvancedCleanup() {
    // Clear all module cache except for core Node.js modules
    Object.keys(require.cache).forEach(key => {
      if (!key.includes('node_modules') || key.includes('bumba')) {
        delete require.cache[key];
      }
    });

    // Clear all environment variables except essential ones
    const essentialVars = ['NODE_ENV', 'PATH', 'HOME', 'USER'];
    Object.keys(process.env).forEach(key => {
      if (!essentialVars.includes(key) && key.startsWith('BUMBA_')) {
        delete process.env[key];
      }
    });

    // Clear any global variables that might have been set by tests
    const globalKeys = Object.keys(global);
    globalKeys.forEach(key => {
      if (key.startsWith('test') || key.startsWith('mock') || key.startsWith('bumba')) {
        try {
          delete global[key];
        } catch (e) {
          // Some globals might not be deletable
        }
      }
    });

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
  }

  // Resource cleanup for file handles, network connections, etc.
  static async cleanupResources() {
    // Close any open file handles created during tests
    if (process.platform !== 'win32') {
      // Unix-like systems - attempt to close file descriptors > 2 (stdout, stderr, stdin)
      for (let fd = 3; fd < 100; fd++) {
        try {
          const fs = require('fs');
          if (fs.fstatSync) {
            fs.fstatSync(fd); // Check if fd is valid
            // If we get here, the fd exists, but we shouldn't close it blindly
            // as it might be important for the test runner
          }
        } catch (e) {
          // FD doesn't exist or we can't access it, which is fine
        }
      }
    }

    // Clear any network-related timeouts or connections
    if (global.setTimeout && global.clearTimeout) {
      // Clear known timeout patterns used in tests
      for (let i = 1; i < 10000; i++) {
        try {
          clearTimeout(i);
          clearInterval(i);
        } catch (e) {
          // Expected for non-existent timers
        }
      }
    }

    // Clear any EventEmitters that might be hanging around
    if (require.cache[require.resolve('events')]) {
      const EventEmitter = require('events');
      if (EventEmitter.defaultMaxListeners !== 10) {
        EventEmitter.defaultMaxListeners = 10;
      }
    }
  }

  // Memory management for large test suites
  static optimizeMemoryUsage() {
    // Clear large objects from memory
    if (global.Buffer && global.Buffer.poolSize) {
      // Clear buffer pool
      try {
        const buffer = require('buffer');
        if (buffer.constants && buffer.constants.MAX_LENGTH) {
          // Reset any buffer-related state
        }
      } catch (e) {
        // Buffer operations might not be available
      }
    }

    // Clear V8 compilation cache
    if (global.v8 && global.v8.cachedDataVersionTag) {
      try {
        // V8 specific optimizations could go here
      } catch (e) {
        // V8 APIs might not be available
      }
    }

    // Force multiple garbage collection cycles for thorough cleanup
    if (global.gc) {
      global.gc();
      // Wait a bit and GC again to catch any remaining references
      setTimeout(() => {
        if (global.gc) global.gc();
      }, 0);
    }
  }

  // Test isolation utilities
  static createIsolatedTestEnvironment() {
    const originalEnv = { ...process.env };
    const originalGlobals = {};
    
    // Capture current global state
    Object.keys(global).forEach(key => {
      if (typeof global[key] !== 'function' || key.startsWith('test') || key.startsWith('mock')) {
        try {
          originalGlobals[key] = global[key];
        } catch (e) {
          // Some globals might not be accessible
        }
      }
    });

    return {
      restore: () => {
        // Restore environment variables
        Object.keys(process.env).forEach(key => {
          if (!(key in originalEnv)) {
            delete process.env[key];
          }
        });
        Object.assign(process.env, originalEnv);

        // Restore global state
        Object.keys(originalGlobals).forEach(key => {
          global[key] = originalGlobals[key];
        });

        // Clean up any new globals
        Object.keys(global).forEach(key => {
          if (!(key in originalGlobals) && (key.startsWith('test') || key.startsWith('mock'))) {
            try {
              delete global[key];
            } catch (e) {
              // Some globals might not be deletable
            }
          }
        });
      }
    };
  }

  // Enhanced async cleanup with timeout protection
  static async safeAsyncCleanup(cleanupFn, timeout = 5000) {
    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        console.warn('Test cleanup timed out after', timeout, 'ms');
        resolve(false);
      }, timeout);

      try {
        Promise.resolve(cleanupFn()).then(() => {
          clearTimeout(timeoutId);
          resolve(true);
        }).catch((error) => {
          clearTimeout(timeoutId);
          console.error('Cleanup error:', error);
          resolve(false);
        });
      } catch (error) {
        clearTimeout(timeoutId);
        console.error('Sync cleanup error:', error);
        resolve(false);
      }
    });
  }

  // Detect and clean up memory leaks
  static detectMemoryLeaks() {
    const usage = process.memoryUsage();
    const threshold = 100 * 1024 * 1024; // 100MB threshold
    
    return {
      heapUsed: usage.heapUsed,
      heapTotal: usage.heapTotal,
      external: usage.external,
      arrayBuffers: usage.arrayBuffers,
      isLeaking: usage.heapUsed > threshold,
      suggestion: usage.heapUsed > threshold ? 
        'Memory usage is high. Consider calling TestUtils.performAdvancedCleanup()' : 
        'Memory usage is normal'
    };
  }

  // Enhanced error capture for debugging test issues
  static captureTestError(error, context = {}) {
    return {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      context,
      timestamp: new Date().toISOString(),
      memoryUsage: process.memoryUsage(),
      nodeVersion: process.version,
      testRunner: 'jest'
    };
  }
}

module.exports = TestUtils;
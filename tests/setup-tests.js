/**
 * BUMBA Test Setup
 * Global test configuration and setup
 */

// Set test environment
process.env.NODE_ENV = 'test';
process.env.BUMBA_DISABLE_MONITORING = 'true';
process.env.LOG_LEVEL = 'error'; // Only show errors in tests

// Mock console methods to reduce noise
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  // Keep error for debugging
  error: console.error
};

// Test timeout is now set in jest.config.js (60000ms)

// Global test utilities
global.TestUtils = require('./helpers/test-utils');

// Advanced cleanup function available globally
global.performAdvancedCleanup = async () => {
  await global.TestUtils.performAdvancedCleanup();
  await global.TestUtils.cleanupResources();
  global.TestUtils.optimizeMemoryUsage();
};

// Mock external dependencies
jest.mock('chalk', () => ({
  green: jest.fn(str => str),
  red: jest.fn(str => str),
  yellow: jest.fn(str => str),
  blue: jest.fn(str => str),
  gray: jest.fn(str => str),
  bold: {
    green: jest.fn(str => str),
    red: jest.fn(str => str),
    yellow: jest.fn(str => str),
    blue: jest.fn(str => str)
  }
}));

// Mock ora spinner
jest.mock('ora', () => {
  return () => ({
    start: jest.fn().mockReturnThis(),
    succeed: jest.fn().mockReturnThis(),
    fail: jest.fn().mockReturnThis(),
    warn: jest.fn().mockReturnThis(),
    info: jest.fn().mockReturnThis(),
    stop: jest.fn().mockReturnThis(),
    text: ''
  });
});

// Mock inquirer
jest.mock('inquirer', () => ({
  prompt: jest.fn(() => Promise.resolve({}))
}));

// Clean up after each test
afterEach(() => {
  // Clear all mocks and restore original implementations
  jest.clearAllMocks();
  jest.restoreAllMocks();
  
  // Legacy compatibility - these are aliases for the same functionality
  jest.clearMocks && jest.clearMocks();
  jest.restoreMocks && jest.restoreMocks();
  
  // Clear module cache to prevent test interference
  jest.resetModules();
  
  // Clear all timers if using fake timers
  jest.clearAllTimers();
  
  // Reset environment variables to initial state
  if (process.env.NODE_ENV !== 'test') {
    process.env.NODE_ENV = 'test';
  }
  
  // Clear any setTimeout/setInterval that might be hanging
  if (typeof global.clearTimeout === 'function') {
    // Clear any hanging timeouts (implementation will handle invalid IDs gracefully)
    for (let i = 1; i < 1000; i++) {
      try {
        clearTimeout(i);
        clearInterval(i);
      } catch (e) {
        // Ignore errors for non-existent timers
      }
    }
  }
  
  // Force garbage collection of test artifacts if available
  if (global.gc) {
    global.gc();
  }
});

// Global error handler for unhandled rejections
process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection in test:', error);
});
// Clean up after all tests
afterAll(() => {
  // Clear all timers
  jest.clearAllTimers();
  jest.useRealTimers();
  
  // Restore console
  global.console = console;
  
  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }
});

// Initialize test environment
beforeAll(() => {
  // Use fake timers by default but allow individual tests to override
  jest.useFakeTimers({
    advanceTimers: false,
    doNotFake: ['nextTick', 'setImmediate'] // Allow these for proper test execution
  });
  
  // Set initial clean state
  process.env.NODE_ENV = 'test';
  process.env.BUMBA_DISABLE_MONITORING = 'true';
  process.env.LOG_LEVEL = 'error';
});

// Setup for each individual test
beforeEach(() => {
  // Clear any previous test state
  jest.clearAllMocks();
  
  // Reset timers to clean state for each test
  jest.clearAllTimers();
  
  // Ensure consistent environment for each test
  process.env.NODE_ENV = 'test';
  
  // Reset any global test utilities
  if (global.TestUtils) {
    // Reset any internal state in test utilities
    // This ensures clean state for utilities between tests
    
    // Perform memory leak detection periodically
    const memoryStatus = global.TestUtils.detectMemoryLeaks();
    if (memoryStatus.isLeaking) {
      console.warn('🟠️ Memory leak detected:', memoryStatus.suggestion);
      // Perform advanced cleanup if memory usage is high
      global.TestUtils.optimizeMemoryUsage();
    }
  }
});

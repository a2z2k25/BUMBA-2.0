
// Test setup for BUMBA Framework
const { TextEncoder, TextDecoder } = require('util');

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Set test environment
process.env.NODE_ENV = 'test';
process.env.BUMBA_MODE = 'test';
process.env.BUMBA_DISABLE_MONITORING = 'true';
process.env.BUMBA_DISABLE_AUDIO = 'true';

// Mock console methods to reduce noise
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock timers
jest.useFakeTimers();

// Increase timeout for async operations
jest.setTimeout(10000);

// Global test cleanup
let cleanupFunctions = [];

global.registerCleanup = (fn) => {
  cleanupFunctions.push(fn);
};

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
  jest.clearAllTimers();
  
  // Run registered cleanup functions
  cleanupFunctions.forEach(fn => {
    try {
      fn();
    } catch (e) {
      // Ignore cleanup errors
    }
  });
  cleanupFunctions = [];
});

// Ensure all handles are closed after tests
afterAll(() => {
  // Force close any open handles
  if (global.gc) {
    global.gc();
  }
});

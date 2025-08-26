/**
 * Unit tests for BUMBA Command Handler
 */

const BumbaCommandHandler = require('../../../src/core/command-handler');

// Mock dependencies
jest.mock('../../../src/core/logging/bumba-logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

describe('BumbaCommandHandler', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  let commandHandler;

  beforeEach(() => {
    commandHandler = new BumbaCommandHandler();
  });

  test('should create command handler instance', async () => {
    expect(commandHandler).toBeDefined();
  });

  test('should handle help command', async () => {
    const result = await commandHandler.handleHelp([], {});
    expect(result.type).toBe('help');
  });
});

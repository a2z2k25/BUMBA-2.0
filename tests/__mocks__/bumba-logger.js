// Complete mock for bumba-logger
module.exports = {
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    trace: jest.fn(),
    log: jest.fn(),
    setLevel: jest.fn(),
    getMetrics: jest.fn(() => ({}))
  },
  // Also export convenience methods
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  trace: jest.fn(),
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    trace: jest.fn(),
    log: jest.fn()
  })),
  setLevel: jest.fn(),
  getMetrics: jest.fn(() => ({})),
  BumbaLogger: jest.fn().mockImplementation(() => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    trace: jest.fn(),
    log: jest.fn()
  }))
};